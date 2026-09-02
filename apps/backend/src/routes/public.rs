use actix_web::{HttpResponse, web};
use chrono::{DateTime, NaiveDate, Utc};
use entity::enums::{OrderStatus, PaymentStatus};
use entity::prelude::*;
use entity::{customers, product_categories, product_variants, products, transaction_items, transactions};
use rust_decimal::Decimal;
use sea_orm::{ColumnTrait, EntityTrait, LoaderTrait, ModelTrait, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::dto::{ApiResponse, ProductResponse};
use crate::error::AppError;
use crate::services::products::{map_product, map_variant};
use crate::state::AppState;

/// Response ringkas untuk info toko (publik)
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicStoreInfo {
    pub name: String,
    pub address: String,
    pub phone: String,
}

/// Response ringkas untuk kategori produk (publik)
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicCategoryResponse {
    pub id: i32,
    pub name: String,
}

/// Response gabungan katalog publik
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicCatalogResponse {
    pub store: PublicStoreInfo,
    pub categories: Vec<PublicCategoryResponse>,
    pub products: Vec<ProductResponse>,
}

#[derive(Debug, Deserialize)]
pub struct PublicTrackingQuery {
    pub q: Option<String>,
    pub invoice: Option<String>,
    pub phone: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PublicTrackingItem {
    pub product_name: String,
    pub variant_name: Option<String>,
    pub qty: i32,
    pub addons: Vec<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PublicTrackingResponse {
    pub invoice_number: String,
    pub customer_name: String,
    pub order_status: OrderStatus,
    pub payment_status: PaymentStatus,
    pub total_amount: Decimal,
    /// Pembayaran neto setelah kembalian/refund. Field `pay_amount` dipertahankan
    /// untuk kompatibilitas dan bernilai sama di endpoint publik ini.
    pub paid_amount: Decimal,
    pub pay_amount: Decimal,
    pub remaining_amount: Decimal,
    pub estimated_done_at: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub items: Vec<PublicTrackingItem>,
    pub store_name: String,
    pub store_phone: String,
}

/// GET /api/v1/public/catalog
#[utoipa::path(
    get,
    path = "/api/v1/public/catalog",
    responses(
        (status = 200, description = "Katalog produk publik lengkap", body = ApiResponse<PublicCatalogResponse>)
    ),
    tag = "Public"
)]
pub async fn catalog(
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    // 1. Info toko dari config
    let store = PublicStoreInfo {
        name: state.store.name.clone(),
        address: state.store.address.clone(),
        phone: state.store.phone.clone(),
    };

    // 2. Semua kategori produk
    let cat_models = ProductCategory::find()
        .order_by_asc(product_categories::Column::Name)
        .all(&state.db)
        .await?;
    let categories: Vec<PublicCategoryResponse> = cat_models
        .iter()
        .map(|c| PublicCategoryResponse {
            id: c.id,
            name: c.name.clone(),
        })
        .collect();

    // 3. Semua produk + varian
    let product_models = Product::find()
        .filter(products::Column::IsActive.eq(true))
        .order_by_asc(products::Column::Name)
        .all(&state.db)
        .await?;

    let variants = product_models
        .load_many(
            ProductVariant::find().filter(product_variants::Column::IsActive.eq(true)),
            &state.db,
        )
        .await?;

    let products_response: Vec<ProductResponse> = product_models
        .into_iter()
        .zip(variants.into_iter())
        .map(|(prod, vars)| {
            let var_res = if prod.has_variants {
                Some(vars.iter().map(map_variant).collect())
            } else {
                None
            };
            map_product(&prod, var_res)
        })
        .collect();

    let catalog = PublicCatalogResponse {
        store,
        categories,
        products: products_response,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::ok("Katalog produk publik", catalog)))
}

/// GET /api/v1/public/tracking
#[utoipa::path(
    get,
    path = "/api/v1/public/tracking",
    params(
        ("q" = Option<String>, Query, description = "Pencarian umum (nomor nota, nama pelanggan, atau no WA)"),
        ("invoice" = Option<String>, Query, description = "Nomor nota / invoice (misal: INV-20260821-1234)"),
        ("phone" = Option<String>, Query, description = "Nomor WhatsApp pelanggan")
    ),
    responses(
        (status = 200, description = "Status pelacakan pesanan publik", body = ApiResponse<PublicTrackingResponse>),
        (status = 404, description = "Pesanan tidak ditemukan")
    ),
    tag = "Public"
)]
pub async fn tracking(
    state: web::Data<AppState>,
    query: web::Query<PublicTrackingQuery>,
) -> Result<HttpResponse, AppError> {
    let q = query.into_inner();
    let term = q
        .q
        .or(q.invoice)
        .or(q.phone)
        .unwrap_or_default()
        .trim()
        .to_string();

    if term.is_empty() {
        return Err(AppError::field("q", "Masukkan nomor nota, nama, atau nomor WhatsApp Anda"));
    }

    let keyword = format!("%{}%", term);

    // Cari ID customer bila input berupa nomor telepon atau nama
    let digits_only: String = term.chars().filter(|c| c.is_ascii_digit()).collect();
    let matched_cust_ids: Vec<i32> = if !digits_only.is_empty() {
        let phone_kw = format!("%{}%", digits_only);
        Customer::find()
            .filter(
                customers::Column::Phone
                    .like(&phone_kw)
                    .or(customers::Column::Name.like(&keyword)),
            )
            .all(&state.db)
            .await?
            .into_iter()
            .map(|c| c.id)
            .collect()
    } else {
        Customer::find()
            .filter(customers::Column::Name.like(&keyword))
            .all(&state.db)
            .await?
            .into_iter()
            .map(|c| c.id)
            .collect()
    };

    let mut condition = transactions::Column::InvoiceNumber
        .like(&keyword)
        .or(transactions::Column::CustomerName.like(&keyword));

    if !matched_cust_ids.is_empty() {
        condition = condition.or(transactions::Column::CustomerId.is_in(matched_cust_ids));
    }

    let trans_model = Transaction::find()
        .filter(condition)
        // Pesanan batal tidak perlu ditampilkan ke pelanggan: mereka hanya
        // melihat pesanan aktif/riwayat pengambilan yang valid.
        .filter(transactions::Column::OrderStatus.ne(OrderStatus::Batal))
        .order_by_desc(transactions::Column::Id)
        .one(&state.db)
        .await?
        .ok_or_else(|| {
            AppError::not_found("Pesanan tidak ditemukan. Periksa kembali nomor nota atau nomor WhatsApp Anda.")
        })?;

    let items = trans_model
        .find_related(TransactionItem)
        .order_by_asc(transaction_items::Column::Id)
        .all(&state.db)
        .await?;

    let addons = items.load_many(TransactionItemAddon::find(), &state.db).await?;

    let item_results: Vec<PublicTrackingItem> = items
        .into_iter()
        .zip(addons.into_iter())
        .map(|(item, item_addons)| PublicTrackingItem {
            product_name: item.product_name,
            variant_name: item.variant_name,
            qty: item.qty,
            addons: item_addons.into_iter().map(|a| a.addon_name).collect(),
        })
        .collect();

    // `pay_amount` adalah total tender kumulatif dan dapat memuat uang
    // kembalian. Pelanggan hanya boleh melihat nilai neto yang benar-benar
    // diterima toko.
    let paid_amount = (trans_model.pay_amount - trans_model.change_amount).max(Decimal::ZERO);
    let remaining_amount = (trans_model.total_amount - paid_amount).max(Decimal::ZERO);

    let res = PublicTrackingResponse {
        invoice_number: trans_model.invoice_number,
        customer_name: trans_model.customer_name.unwrap_or_else(|| "Pelanggan".to_string()),
        order_status: trans_model.order_status,
        payment_status: trans_model.payment_status,
        total_amount: trans_model.total_amount,
        paid_amount,
        pay_amount: paid_amount,
        remaining_amount,
        estimated_done_at: trans_model.estimated_done_at,
        created_at: trans_model.created_at,
        items: item_results,
        store_name: state.store.name.clone(),
        store_phone: state.store.phone.clone(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::ok("Status pesanan ditemukan", res)))
}
