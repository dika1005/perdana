use chrono::{DateTime, Utc};
use entity::enums::{PriceType, RangePriceType};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

// ==========================================
// PRODUCT REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateProductRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama produk harus 1 - 150 karakter"))]
    #[schema(example = "Undangan Soft Cover")]
    pub name: String,
    pub price_type: PriceType,
    #[serde(alias = "price")]
    #[schema(value_type = Option<f64>, example = 5000)]
    pub default_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 3000)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 8000)]
    pub max_price: Option<Decimal>,
    #[schema(example = 100)]
    pub min_order: Option<i32>,
    #[serde(alias = "unit")]
    #[schema(example = "lembar")]
    pub unit_name: Option<String>,
    #[schema(example = false)]
    pub has_variants: Option<bool>,
    /// Produk memakai bahan stok: checkout wajib mengisi bahan manual.
    #[schema(example = true)]
    pub uses_material: Option<bool>,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateProductRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama produk harus 1 - 150 karakter"))]
    #[schema(example = "Undangan Hard Cover Gold")]
    pub name: String,
    pub price_type: PriceType,
    #[serde(alias = "price")]
    #[schema(value_type = Option<f64>, example = 7000)]
    pub default_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 5000)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 12000)]
    pub max_price: Option<Decimal>,
    #[schema(example = 50)]
    pub min_order: Option<i32>,
    #[serde(alias = "unit")]
    #[schema(example = "lembar")]
    pub unit_name: Option<String>,
    #[schema(example = false)]
    pub has_variants: Option<bool>,
    /// Produk memakai bahan stok: checkout wajib mengisi bahan manual.
    #[schema(example = true)]
    pub uses_material: Option<bool>,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct ProductQuery {
    pub category_id: Option<i32>,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ProductResponse {
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub price_type: PriceType,
    #[schema(value_type = f64, example = 5000)]
    pub default_price: Decimal,
    #[schema(value_type = f64, example = 3000)]
    pub min_price: Decimal,
    #[schema(value_type = f64, example = 8000)]
    pub max_price: Decimal,
    pub min_order: i32,
    pub unit_name: String,
    pub has_variants: bool,
    pub is_active: bool,
    pub uses_material: bool,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<ProductVariantResponse>>,
}

// ==========================================
// VARIANT REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateVariantRequest {
    #[serde(alias = "name")]
    #[validate(length(min = 1, max = 150, message = "Nama varian harus 1 - 150 karakter"))]
    #[schema(example = "A3+ HVS 80gr")]
    pub variant_name: String,
    pub price_type: RangePriceType,
    #[schema(value_type = Option<f64>, example = 2500)]
    pub price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2000)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 3500)]
    pub max_price: Option<Decimal>,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateVariantRequest {
    #[serde(alias = "name")]
    #[validate(length(min = 1, max = 150, message = "Nama varian harus 1 - 150 karakter"))]
    #[schema(example = "A3+ Art Paper 150gr")]
    pub variant_name: String,
    pub price_type: RangePriceType,
    #[schema(value_type = Option<f64>, example = 3000)]
    pub price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2500)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 4000)]
    pub max_price: Option<Decimal>,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ProductVariantResponse {
    pub id: i32,
    pub product_id: i32,
    pub variant_name: String,
    pub price_type: RangePriceType,
    #[schema(value_type = f64, example = 2500)]
    pub price: Decimal,
    #[schema(value_type = f64, example = 2000)]
    pub min_price: Decimal,
    #[schema(value_type = f64, example = 3500)]
    pub max_price: Decimal,
    pub is_active: bool,
    pub raw_material_id: Option<i32>,
    #[schema(value_type = Option<f64>, example = 1.0)]
    pub material_amount: Option<Decimal>,
    pub created_at: DateTime<Utc>,
}

// ==========================================
// ADDON REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateAddonRequest {
    #[validate(length(min = 1, max = 150, message = "Nama add-on harus 1 - 150 karakter"))]
    #[schema(example = "Laminasi Doff")]
    pub name: String,
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    pub price_type: RangePriceType,
    #[serde(alias = "price")]
    #[schema(value_type = Option<f64>, example = 1500)]
    pub default_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 1000)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2500)]
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateAddonRequest {
    #[validate(length(min = 1, max = 150, message = "Nama add-on harus 1 - 150 karakter"))]
    #[schema(example = "Laminasi Glossy")]
    pub name: String,
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    pub price_type: RangePriceType,
    #[serde(alias = "price")]
    #[schema(value_type = Option<f64>, example = 1200)]
    pub default_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 1000)]
    pub min_price: Option<Decimal>,
    #[schema(value_type = Option<f64>, example = 2000)]
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct AddonQuery {
    pub search: Option<String>,
    pub category_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AddonResponse {
    pub id: i32,
    pub category_id: Option<i32>,
    pub category_name: Option<String>,
    pub name: String,
    pub price_type: RangePriceType,
    #[schema(value_type = f64, example = 1500)]
    pub default_price: Decimal,
    #[schema(value_type = f64, example = 1000)]
    pub min_price: Decimal,
    #[schema(value_type = f64, example = 2500)]
    pub max_price: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}
