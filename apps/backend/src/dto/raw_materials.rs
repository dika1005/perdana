use chrono::{DateTime, Utc};
use entity::enums::MutationType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

// ==========================================
// RAW MATERIAL REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateRawMaterialRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama bahan baku harus 1 - 150 karakter"))]
    #[schema(example = "Kertas Art Paper 260gr")]
    pub name: String,
    #[schema(example = "A3+")]
    pub variant: Option<String>,
    #[schema(example = "lembar")]
    pub unit: Option<String>,
    /// Nama kemasan beli (rim, dus, botol); opsional.
    #[schema(example = "rim")]
    pub package_unit: Option<String>,
    /// Isi satu kemasan dalam satuan dasar (mis. 500 lembar per rim).
    #[schema(value_type = Option<f64>, example = 500)]
    pub package_size: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 100)]
    pub stock: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 20)]
    pub min_stock_warning: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2500)]
    pub standard_cost: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 1.05)]
    pub roll_width: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateRawMaterialRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama bahan baku harus 1 - 150 karakter"))]
    #[schema(example = "Kertas Art Paper 260gr")]
    pub name: String,
    #[schema(example = "A3+")]
    pub variant: Option<String>,
    #[schema(example = "lembar")]
    pub unit: Option<String>,
    /// Nama kemasan beli (rim, dus, botol); opsional.
    #[schema(example = "rim")]
    pub package_unit: Option<String>,
    /// Isi satu kemasan dalam satuan dasar (mis. 500 lembar per rim).
    #[schema(value_type = Option<f64>, example = 500)]
    pub package_size: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 25)]
    pub min_stock_warning: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2500)]
    pub standard_cost: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 1.05)]
    pub roll_width: Option<Decimal>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RawMaterialQuery {
    pub category_id: Option<i32>,
    pub search: Option<String>,
    pub low_stock: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawMaterialResponse {
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub variant: Option<String>,
    pub unit: String,
    pub package_unit: Option<String>,
    #[schema(value_type = Option<f64>)]
    pub package_size: Option<Decimal>,
    #[schema(value_type = f64)]
    pub stock: Decimal,
    #[schema(value_type = f64)]
    pub reserved_stock: Decimal,
    #[schema(value_type = f64)]
    pub available_stock: Decimal,
    #[schema(value_type = f64)]
    pub min_stock_warning: Decimal,
    #[schema(value_type = f64)]
    pub standard_cost: Decimal,
    #[schema(value_type = Option<f64>)]
    pub roll_width: Option<Decimal>,
    pub is_active: bool,
    pub is_low_stock: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ==========================================
// MUTATION REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateMutationRequest {
    #[schema(example = "lembar")] // optional satuan input, jika berbeda dari unit dasar maka akan dikonversi
    pub unit: Option<String>,
    #[schema(example = 1)]
    pub raw_material_id: i32,
    #[serde(rename = "type", alias = "mutation_type")]
    pub mutation_type: MutationType,
    #[validate(custom(function = "validate_qty_positive"))]
    #[schema(value_type = f64, example = 50)]
    pub qty: Decimal,
    #[schema(example = "Kulakan dari distributor kertas")]
    pub notes: Option<String>,
}

fn validate_qty_positive(qty: &Decimal) -> Result<(), validator::ValidationError> {
    if *qty <= Decimal::ZERO {
        return Err(validator::ValidationError::new("qty").with_message(
            std::borrow::Cow::Borrowed("Kuantitas mutasi harus lebih dari 0"),
        ));
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MutationResponse {
    pub id: i32,
    pub raw_material_id: i32,
    #[serde(rename = "type")]
    pub mutation_type: MutationType,
    #[schema(value_type = f64)]
    pub qty: Decimal,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}
