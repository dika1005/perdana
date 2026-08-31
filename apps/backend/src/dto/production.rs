use chrono::{DateTime, Utc};
use entity::enums::PaymentMethod;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct WasteMaterialInput {
    /// Gunakan transaction_item_material_id agar waste selalu terkait snapshot bahan.
    pub transaction_item_material_id: i64,
    #[schema(value_type = f64, example = 1.5)]
    pub qty: Decimal,
    #[validate(length(min = 2, max = 100, message = "Alasan waste wajib diisi"))]
    pub reason_code: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct RecordWasteRequest {
    #[validate(length(min = 1, message = "Minimal satu bahan waste harus diisi"))]
    pub materials: Vec<WasteMaterialInput>,
    pub notes: Option<String>,
}

/// Material tambahan untuk cetak ulang/rework setelah kegagalan produksi.
/// Berbeda dari waste: baris ini benar-benar mengurangi stok fisik tambahan.
#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct ReworkMaterialInput {
    pub transaction_item_material_id: i64,
    #[schema(value_type = f64, example = 1.5)]
    pub qty: Decimal,
    #[validate(length(min = 2, max = 100, message = "Alasan rework wajib diisi"))]
    pub reason_code: String,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct RecordReworkRequest {
    #[validate(length(min = 1, message = "Minimal satu bahan rework harus diisi"))]
    pub materials: Vec<ReworkMaterialInput>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct CancelTransactionRequest {
    #[validate(length(min = 2, max = 255, message = "Alasan pembatalan wajib diisi"))]
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct RefundPaymentRequest {
    #[schema(value_type = f64, example = 50000)]
    pub amount: Decimal,
    pub payment_method: PaymentMethod,
    #[validate(length(min = 2, max = 255, message = "Alasan refund wajib diisi"))]
    pub reason: String,
    pub reference_no: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct CreateMaterialLotRequest {
    #[validate(length(min = 1, max = 100, message = "Kode lot wajib diisi"))]
    pub lot_code: String,
    #[schema(value_type = f64, example = 1.05)]
    pub width_m: Decimal,
    #[schema(value_type = f64, example = 50)]
    pub length: Decimal,
    #[schema(value_type = Option<f64>, example = 25000)]
    pub unit_cost: Option<Decimal>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct CreateOffcutRequest {
    #[validate(length(min = 1, max = 100, message = "Kode offcut wajib diisi"))]
    pub lot_code: String,
    pub source_lot_id: i32,
    #[schema(value_type = f64, example = 0.35)]
    pub width_m: Decimal,
    #[schema(value_type = f64, example = 2.5)]
    pub length: Decimal,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct MaterialLotResponse {
    pub id: i32,
    pub raw_material_id: i32,
    pub lot_code: String,
    pub source_lot_id: Option<i32>,
    #[schema(value_type = Option<f64>)]
    pub width_m: Option<Decimal>,
    #[schema(value_type = f64)]
    pub length_total: Decimal,
    #[schema(value_type = f64)]
    pub length_remaining: Decimal,
    #[schema(value_type = f64)]
    pub reserved_length: Decimal,
    pub is_offcut: bool,
    pub status: String,
    #[schema(value_type = f64)]
    pub unit_cost: Decimal,
    pub received_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize, Validate, ToSchema)]
pub struct UpsertUomConversionRequest {
    #[validate(length(min = 1, max = 30))]
    pub from_unit: String,
    #[validate(length(min = 1, max = 30))]
    pub to_unit: String,
    #[schema(value_type = f64, example = 500)]
    pub factor: Decimal,
    pub notes: Option<String>,
}
