use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ParseOrderRequest {
    #[validate(length(min = 3, message = "Teks pesanan minimal 3 karakter"))]
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ParsedOrderItem {
    pub product_id: Option<i64>,
    pub product_name: String,
    pub matched_product_name: Option<String>,
    pub length: Option<f64>,
    pub width: Option<f64>,
    pub qty: i32,
    pub unit_price: Option<f64>,
    pub subtotal: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ParseOrderResponse {
    pub customer_name_hint: Option<String>,
    pub items: Vec<ParsedOrderItem>,
    pub notes: Option<String>,
    pub used_model: String,
}
