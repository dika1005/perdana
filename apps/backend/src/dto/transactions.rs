use chrono::{DateTime, NaiveDate, Utc};
use entity::enums::{OrderStatus, PaymentStatus};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use validator::Validate;

// ==========================================
// INPUT DTOS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct TransactionAddonInput {
    pub addon_id: Option<i32>,
    pub addon_name: Option<String>,
    pub price: Option<Decimal>,
    pub qty: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct TransactionItemInput {
    pub product_id: i32,
    #[serde(alias = "variant_id")]
    pub product_variant_id: Option<i32>,
    #[serde(alias = "price")]
    pub custom_price: Option<Decimal>,
    #[serde(alias = "quantity")]
    #[validate(range(min = 1, message = "Kuantitas item minimal 1"))]
    pub qty: i32,
    pub addons: Option<Vec<TransactionAddonInput>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateTransactionRequest {
    pub customer_id: Option<i32>,
    pub customer_name: Option<String>,
    pub discount_amount: Option<Decimal>,
    pub pay_amount: Decimal,
    pub payment_status: Option<PaymentStatus>,
    pub estimated_done_at: Option<NaiveDate>,
    #[validate(length(min = 1, message = "Transaksi harus memiliki minimal 1 item"))]
    pub items: Vec<TransactionItemInput>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    pub search: Option<String>,
    pub date: Option<NaiveDate>,
    pub payment_status: Option<PaymentStatus>,
    pub order_status: Option<OrderStatus>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    #[serde(alias = "status")]
    pub order_status: OrderStatus,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePaymentRequest {
    #[serde(alias = "pay_amount", alias = "amount")]
    pub additional_pay_amount: Decimal,
    pub payment_status: Option<PaymentStatus>,
}

// ==========================================
// RESPONSE DTOS
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItemAddonResponse {
    pub id: i32,
    pub addon_name: String,
    pub price: Decimal,
    pub qty: i32,
    pub subtotal: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItemResponse {
    pub id: i32,
    pub product_id: Option<i32>,
    pub product_variant_id: Option<i32>,
    pub product_name: String,
    pub variant_name: Option<String>,
    pub price: Decimal,
    pub qty: i32,
    pub subtotal: Decimal,
    pub addons: Vec<TransactionItemAddonResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionResponse {
    pub id: i32,
    pub invoice_number: String,
    pub customer_id: Option<i32>,
    pub customer_name: String,
    pub subtotal_amount: Decimal,
    pub discount_amount: Decimal,
    pub total_amount: Decimal,
    pub pay_amount: Decimal,
    pub change_amount: Decimal,
    pub payment_status: PaymentStatus,
    pub order_status: OrderStatus,
    pub estimated_done_at: Option<NaiveDate>,
    pub created_by: Option<i32>,
    pub cashier_name: Option<String>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<Vec<TransactionItemResponse>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoicePrintData {
    pub store_name: String,
    pub store_address: String,
    pub store_phone: String,
    pub invoice_number: String,
    pub date: DateTime<Utc>,
    pub cashier_name: String,
    pub customer_name: String,
    pub payment_status: PaymentStatus,
    pub order_status: OrderStatus,
    pub estimated_done_at: Option<NaiveDate>,
    pub items: Vec<TransactionItemResponse>,
    pub subtotal_amount: Decimal,
    pub discount_amount: Decimal,
    pub total_amount: Decimal,
    pub pay_amount: Decimal,
    pub change_amount: Decimal,
    pub remaining_amount: Decimal,
}
