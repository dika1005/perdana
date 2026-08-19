use entity::products;
use sea_orm::{DatabaseConnection, EntityTrait};
use serde::{Deserialize, Serialize};

use crate::config::GeminiConfig;
use crate::dto::{ParseOrderRequest, ParseOrderResponse, ParsedOrderItem};
use crate::error::AppError;

#[derive(Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
struct GeminiGenerationConfig {
    temperature: f32,
    #[serde(rename = "responseMimeType")]
    response_mime_type: String,
}

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
}

#[derive(Deserialize)]
struct GeminiCandidatePart {
    text: Option<String>,
}

#[derive(Deserialize)]
struct GeminiCandidateContent {
    parts: Option<Vec<GeminiCandidatePart>>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiCandidateContent>,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Deserialize, Debug)]
struct RawExtractedItem {
    product_name: String,
    length: Option<f64>,
    width: Option<f64>,
    qty: Option<i32>,
    notes: Option<String>,
}

#[derive(Deserialize, Debug)]
struct RawExtractedOrder {
    customer_name: Option<String>,
    notes: Option<String>,
    items: Option<Vec<RawExtractedItem>>,
}

pub async fn parse_order(
    db: &DatabaseConnection,
    http_client: &reqwest::Client,
    gemini_config: &GeminiConfig,
    req: ParseOrderRequest,
) -> Result<ParseOrderResponse, AppError> {
    let api_key = gemini_config
        .api_key
        .as_deref()
        .filter(|k| !k.trim().is_empty())
        .ok_or_else(|| {
            AppError::ServiceUnavailable(
                "GEMINI_API_KEY belum dikonfigurasi pada file .env backend".into(),
            )
        })?;

    // 1. Ambil katalog produk untuk referensi matching
    let all_products = products::Entity::find().all(db).await?;
    let catalog_summary: Vec<serde_json::Value> = all_products
        .iter()
        .map(|p| {
            serde_json::json!({
                "id": p.id,
                "name": p.name,
                "price_type": format!("{:?}", p.price_type),
                "default_price": p.default_price.to_string(),
                "unit": p.unit_name.clone().unwrap_or_else(|| "pcs".into())
            })
        })
        .collect();

    let catalog_json = serde_json::to_string(&catalog_summary).unwrap_or_default();

    // 2. Susun prompt ekstraksi
    let system_instruction = format!(
        r#"Kamu adalah AI asisten kasir sistem POS Percetakan "Perdana".
Tugasmu adalah menganalisis pesan chat / catatan pelanggan dan mengekstrak item-item pesanan, dimensi (panjang & lebar dalam meter), jumlah/kuantitas (qty), dan catatan finishing/keterangan.

DAFTAR KATALOG PRODUK YANG TERSEDIA DI TOKO:
{}

ATURAN PENTING:
1. Cocokkan nama produk dengan nama terdekat dari DAFTAR KATALOG PRODUK jika memungkinkan.
2. Jika pesanan menyebutkan ukuran banner/spanduk seperti '3x1', '3 x 1.5', '2x3m', ekstrak length = 3.0 dan width = 1.0 atau sebaliknya (dalam meter).
3. Jika kuantitas tidak disebutkan secara eksplisit, gunakan qty = 1.
4. Format output WAJIB JSON murni tanpa markdown wrapper:
{{
  "customer_name": "Nama pelanggan jika ada di teks (misal 'dari Budi', 'atas nama Ani') atau null",
  "notes": "Catatan umum pesanan jika ada atau null",
  "items": [
    {{
      "product_name": "Nama produk cetak",
      "length": 3.0,
      "width": 1.5,
      "qty": 2,
      "notes": "finishing / keterangan khusus (contoh: mata ayam sudut, laminasi doff)"
    }}
  ]
}}
"#,
        catalog_json
    );

    let user_content = format!("TEKS PESANAN PELANGGAN:\n\"\"\"\n{}\n\"\"\"", req.text);

    let gemini_body = GeminiRequest {
        contents: vec![
            GeminiContent {
                parts: vec![GeminiPart {
                    text: system_instruction,
                }],
            },
            GeminiContent {
                parts: vec![GeminiPart { text: user_content }],
            },
        ],
        generation_config: GeminiGenerationConfig {
            temperature: 0.1,
            response_mime_type: "application/json".to_string(),
        },
    };

    // 3. Panggil Gemini API dengan fallback model jika terkena error
    let candidate_models = [
        gemini_config.model.as_str(),
        gemini_config.fallback_model.as_str(),
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
    ];

    let mut tried = std::collections::HashSet::new();
    let mut last_error_msg = String::new();
    let mut successful_model = String::new();
    let mut raw_response_text = String::new();

    for model in candidate_models {
        if model.is_empty() || !tried.insert(model) {
            continue;
        }

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
        );

        let resp_result = http_client.post(&url).json(&gemini_body).send().await;

        match resp_result {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    if let Ok(body) = resp.json::<GeminiResponse>().await {
                        if let Some(candidates) = body.candidates {
                            if let Some(first) = candidates.into_iter().next() {
                                if let Some(content) = first.content {
                                    if let Some(parts) = content.parts {
                                        if let Some(first_part) = parts.into_iter().next() {
                                            if let Some(text) = first_part.text {
                                                raw_response_text = text;
                                                successful_model = model.to_string();
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {

                    let err_body = resp.text().await.unwrap_or_default();
                    last_error_msg = format!("HTTP {} dari model {}: {}", status, model, err_body);
                    log::warn!("Gemini API model {} failed: {}", model, last_error_msg);
                }
            }
            Err(e) => {
                last_error_msg = format!("Reqwest error ({model}): {e}");
                log::warn!("Network error calling Gemini ({model}): {e}");
            }
        }
    }

    if raw_response_text.is_empty() {
        return Err(AppError::ServiceUnavailable(format!(
            "Gagal memproses pesanan dengan AI: {}",
            last_error_msg
        )));
    }

    // 4. Parse hasil JSON dari Gemini
    let clean_json = raw_response_text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let extracted: RawExtractedOrder =
        serde_json::from_str(clean_json).map_err(|e| {
            AppError::Internal(format!("Gagal membaca format JSON hasil AI: {e}"))
        })?;

    // 5. Cocokkan item dengan produk database
    let mut parsed_items: Vec<ParsedOrderItem> = Vec::new();

    if let Some(items) = extracted.items {
        for item in items {
            let item_name_lower = item.product_name.to_lowercase();
            
            // Cari produk database dengan kemiripan nama
            let matched_prod = all_products.iter().find(|p| {
                let p_name = p.name.to_lowercase();
                p_name == item_name_lower
                    || p_name.contains(&item_name_lower)
                    || item_name_lower.contains(&p_name)
            });

            let qty = item.qty.unwrap_or(1).max(1);
            let length = item.length;
            let width = item.width;

            let (product_id, matched_product_name, unit_price, subtotal) = match matched_prod {
                Some(p) => {
                    let base_price: f64 = p.default_price.to_string().parse().unwrap_or(0.0);
                    let area = match (length, width) {
                        (Some(l), Some(w)) if l > 0.0 && w > 0.0 => l * w,
                        _ => 1.0,
                    };
                    let calc_unit_price = (base_price * area).round();
                    let calc_subtotal = calc_unit_price * (qty as f64);

                    (
                        Some(p.id as i64),
                        Some(p.name.clone()),
                        Some(calc_unit_price),
                        Some(calc_subtotal),
                    )
                }
                None => (None, None, None, None),
            };

            parsed_items.push(ParsedOrderItem {
                product_id,
                product_name: item.product_name,
                matched_product_name,
                length,
                width,
                qty,
                unit_price,
                subtotal,
                notes: item.notes,
            });
        }
    }

    Ok(ParseOrderResponse {
        customer_name_hint: extracted.customer_name,
        items: parsed_items,
        notes: extracted.notes,
        used_model: successful_model,
    })
}
