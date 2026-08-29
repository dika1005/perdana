use chrono::{DateTime, NaiveDate, Utc};
use entity::enums::{OrderStatus, PaymentMethod, PaymentStatus};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

// ==========================================
// INPUT DTOS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct TransactionAddonInput {
    #[schema(example = 1)]
    pub addon_id: Option<i32>,
    #[schema(example = "Laminasi Doff")]
    pub addon_name: Option<String>,
    #[schema(value_type = Option<f64>, example = 1500)]
    pub price: Option<Decimal>,
    #[schema(example = 100)]
    pub qty: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct TransactionMaterialInput {
    #[schema(example = 1)]
    pub raw_material_id: i32,
    #[schema(example = 150)]
    pub material_qty: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct TransactionItemInput {
    #[schema(example = 1)]
    pub product_id: i32,
    #[serde(alias = "variant_id")]
    #[schema(example = 1)]
    pub product_variant_id: Option<i32>,
    #[serde(alias = "price")]
    #[schema(value_type = Option<f64>, example = 5000)]
    pub custom_price: Option<Decimal>,
    #[serde(alias = "quantity")]
    #[validate(range(min = 1, message = "Kuantitas item minimal 1"))]
    #[schema(example = 100)]
    pub qty: i32,
    pub addons: Option<Vec<TransactionAddonInput>>,
    /// Legacy single material (backward compat)
    #[schema(example = 1)]
    pub raw_material_id: Option<i32>,
    #[schema(example = 150)]
    pub material_qty: Option<i32>,
    /// Multiple materials consumed per item
    pub materials: Option<Vec<TransactionMaterialInput>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
pub struct CreateTransactionRequest {
    #[schema(example = 1)]
    pub customer_id: Option<i32>,
    #[schema(example = "Pak Haji Budi")]
    pub customer_name: Option<String>,
    #[schema(value_type = Option<f64>, example = 0)]
    pub discount_amount: Option<Decimal>,
    #[schema(value_type = f64, example = 250000)]
    pub pay_amount: Decimal,
    pub payment_status: Option<PaymentStatus>,
    pub payment_method: Option<PaymentMethod>,
    #[schema(value_type = Option<String>, example = "2026-08-30")]
    pub estimated_done_at: Option<NaiveDate>,
    #[validate(length(min = 1, message = "Transaksi harus memiliki minimal 1 item"))]
    pub items: Vec<TransactionItemInput>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct TransactionQuery {
    pub search: Option<String>,
    #[schema(value_type = Option<String>, example = "2026-08-18")]
    pub date: Option<NaiveDate>,
    pub payment_status: Option<PaymentStatus>,
    pub payment_method: Option<PaymentMethod>,
    pub order_status: Option<OrderStatus>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateOrderStatusRequest {
    #[serde(alias = "status")]
    pub order_status: OrderStatus,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdatePaymentRequest {
    #[serde(alias = "pay_amount", alias = "amount")]
    #[schema(value_type = f64, example = 250000)]
    pub additional_pay_amount: Decimal,
    pub payment_status: Option<PaymentStatus>,
    pub payment_method: Option<PaymentMethod>,
}

// ==========================================
// RESPONSE DTOS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TransactionItemAddonResponse {
    pub id: i32,
    pub addon_name: String,
    #[schema(value_type = f64, example = 1500)]
    pub price: Decimal,
    pub qty: i32,
    #[schema(value_type = f64, example = 150000)]
    pub subtotal: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TransactionItemResponse {
    pub id: i32,
    pub product_id: Option<i32>,
    pub product_variant_id: Option<i32>,
    pub product_name: String,
    pub variant_name: Option<String>,
    #[schema(value_type = f64, example = 5000)]
    pub price: Decimal,
    pub qty: i32,
    #[schema(value_type = f64, example = 500000)]
    pub subtotal: Decimal,
    pub addons: Vec<TransactionItemAddonResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TransactionResponse {
    pub id: i32,
    pub invoice_number: String,
    pub customer_id: Option<i32>,
    pub customer_name: String,
    #[schema(value_type = f64, example = 500000)]
    pub subtotal_amount: Decimal,
    #[schema(value_type = f64, example = 0)]
    pub discount_amount: Decimal,
    #[schema(value_type = f64, example = 500000)]
    pub total_amount: Decimal,
    #[schema(value_type = f64, example = 250000)]
    pub pay_amount: Decimal,
    #[schema(value_type = f64, example = 0)]
    pub change_amount: Decimal,
    pub payment_status: PaymentStatus,
    pub payment_method: PaymentMethod,
    pub settlement_payment_method: Option<PaymentMethod>,
    pub settlement_pay_amount: Option<Decimal>,
    pub settlement_at: Option<DateTime<Utc>>,
    pub order_status: OrderStatus,
    #[schema(value_type = Option<String>, example = "2026-08-30")]
    pub estimated_done_at: Option<NaiveDate>,
    pub created_by: Option<i32>,
    pub cashier_name: Option<String>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Vec<TransactionItemResponse>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InvoicePrintData {
    pub store_name: String,
    pub store_address: String,
    pub store_phone: String,
    pub invoice_number: String,
    pub date: DateTime<Utc>,
    pub cashier_name: String,
    pub customer_name: String,
    pub payment_status: PaymentStatus,
    pub payment_method: PaymentMethod,
    pub settlement_payment_method: Option<PaymentMethod>,
    pub settlement_pay_amount: Option<Decimal>,
    pub order_status: OrderStatus,
    #[schema(value_type = Option<String>, example = "2026-08-30")]
    pub estimated_done_at: Option<NaiveDate>,
    pub items: Vec<TransactionItemResponse>,
    #[schema(value_type = f64, example = 500000)]
    pub subtotal_amount: Decimal,
    #[schema(value_type = f64, example = 0)]
    pub discount_amount: Decimal,
    #[schema(value_type = f64, example = 500000)]
    pub total_amount: Decimal,
    #[schema(value_type = f64, example = 500000)]
    pub pay_amount: Decimal,
    #[schema(value_type = f64, example = 0)]
    pub change_amount: Decimal,
    #[schema(value_type = f64, example = 0)]
    pub remaining_amount: Decimal,
}
