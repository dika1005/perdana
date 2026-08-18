use chrono::{DateTime, Utc};
use entity::enums::{PriceType, RangePriceType};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use validator::Validate;

// ==========================================
// PRODUCT REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate)]
pub struct CreateProductRequest {
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama produk harus 1 - 150 karakter"))]
    pub name: String,
    pub price_type: PriceType,
    #[serde(alias = "price")]
    pub default_price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
    pub min_order: Option<i32>,
    #[serde(alias = "unit")]
    pub unit_name: Option<String>,
    pub has_variants: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProductRequest {
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama produk harus 1 - 150 karakter"))]
    pub name: String,
    pub price_type: PriceType,
    #[serde(alias = "price")]
    pub default_price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
    pub min_order: Option<i32>,
    #[serde(alias = "unit")]
    pub unit_name: Option<String>,
    pub has_variants: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub category_id: Option<i32>,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductResponse {
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub price_type: PriceType,
    pub default_price: Decimal,
    pub min_price: Decimal,
    pub max_price: Decimal,
    pub min_order: i32,
    pub unit_name: String,
    pub has_variants: bool,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<ProductVariantResponse>>,
}

// ==========================================
// VARIANT REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate)]
pub struct CreateVariantRequest {
    #[serde(alias = "name")]
    #[validate(length(min = 1, max = 150, message = "Nama varian harus 1 - 150 karakter"))]
    pub variant_name: String,
    pub price_type: RangePriceType,
    pub price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateVariantRequest {
    #[serde(alias = "name")]
    #[validate(length(min = 1, max = 150, message = "Nama varian harus 1 - 150 karakter"))]
    pub variant_name: String,
    pub price_type: RangePriceType,
    pub price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductVariantResponse {
    pub id: i32,
    pub product_id: i32,
    pub variant_name: String,
    pub price_type: RangePriceType,
    pub price: Decimal,
    pub min_price: Decimal,
    pub max_price: Decimal,
    pub created_at: DateTime<Utc>,
}

// ==========================================
// ADDON REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate)]
pub struct CreateAddonRequest {
    #[validate(length(min = 1, max = 150, message = "Nama add-on harus 1 - 150 karakter"))]
    pub name: String,
    pub price_type: RangePriceType,
    #[serde(alias = "price")]
    pub default_price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateAddonRequest {
    #[validate(length(min = 1, max = 150, message = "Nama add-on harus 1 - 150 karakter"))]
    pub name: String,
    pub price_type: RangePriceType,
    #[serde(alias = "price")]
    pub default_price: Option<Decimal>,
    pub min_price: Option<Decimal>,
    pub max_price: Option<Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct AddonQuery {
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddonResponse {
    pub id: i32,
    pub name: String,
    pub price_type: RangePriceType,
    pub default_price: Decimal,
    pub min_price: Decimal,
    pub max_price: Decimal,
    pub created_at: DateTime<Utc>,
}
