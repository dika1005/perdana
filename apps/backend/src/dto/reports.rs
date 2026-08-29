use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct ReportDateQuery {
    #[schema(value_type = Option<String>, example = "2026-08-01")]
    pub start_date: Option<NaiveDate>,
    #[schema(value_type = Option<String>, example = "2026-08-31")]
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct DashboardSummaryResponse {
    /// Total nilai seluruh pesanan (total_amount) dalam periode — "Omset Pesanan".
    #[schema(value_type = f64, example = 15000000)]
    pub total_omset: Decimal,
    /// Uang yang benar-benar masuk kas (pay_amount) dalam periode — "Kas Masuk".
    #[schema(value_type = f64, example = 11000000)]
    pub total_cash_in: Decimal,
    #[schema(value_type = f64, example = 10000000)]
    pub total_cash_omset: Decimal,
    #[schema(value_type = f64, example = 4000000)]
    pub total_qris_omset: Decimal,
    #[schema(value_type = f64, example = 1000000)]
    pub total_transfer_omset: Decimal,
    #[schema(value_type = f64, example = 3000000)]
    pub total_expenses: Decimal,
    /// Laba kas = Kas Masuk dikurangi pengeluaran (bukan omset kotor dikurangi biaya).
    #[schema(value_type = f64, example = 8000000)]
    pub net_profit: Decimal,
    pub total_transactions: i64,
    pub paid_transactions: i64,
    pub dp_transactions: i64,
    pub unpaid_transactions: i64,
    #[schema(value_type = f64, example = 2500000)]
    pub total_piutang: Decimal,
    pub active_orders: i64,
    pub ready_orders: i64,
    pub low_stock_raw_materials_count: i64,
}


#[derive(Debug, Deserialize, ToSchema)]
pub struct MonthlyReportQuery {
    #[schema(example = 2026)]
    pub year: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MonthlySalesReportItem {
    #[schema(example = "2026-08")]
    pub month: String,
    #[schema(example = "Agustus")]
    pub month_name: String,
    /// Total nilai pesanan (total_amount) bulan tersebut.
    #[schema(value_type = f64, example = 25000000)]
    pub total_sales: Decimal,
    /// Uang benar-benar masuk kas (pay_amount) bulan tersebut.
    #[schema(value_type = f64, example = 18000000)]
    pub total_cash_in: Decimal,
    #[schema(value_type = f64, example = 8000000)]
    pub total_expenses: Decimal,
    #[schema(value_type = f64, example = 17000000)]
    pub net_profit: Decimal,
    pub total_transactions: i64,
    #[schema(value_type = f64, example = 15000000)]
    pub total_cash_omset: Decimal,
    #[schema(value_type = f64, example = 7000000)]
    pub total_qris_omset: Decimal,
    #[schema(value_type = f64, example = 3000000)]
    pub total_transfer_omset: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct DailySalesReportItem {
    #[schema(example = "2026-08-18")]
    pub date: String,
    #[schema(value_type = f64, example = 3500000)]
    pub total_sales: Decimal,
    pub total_transactions: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TopProductReportItem {
    #[schema(example = "Buku Yasin Bludru")]
    pub product_name: String,
    pub total_qty: i64,
    #[schema(value_type = f64, example = 4500000)]
    pub total_revenue: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InventoryMutationReportItem {
    pub raw_material_id: i32,
    #[schema(example = "Kertas Art Paper 260gr")]
    pub raw_material_name: String,
    #[schema(value_type = f64)]
    pub in_qty: Decimal,
    #[schema(value_type = f64)]
    pub out_qty: Decimal,
    #[schema(value_type = f64)]
    pub current_stock: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ReceivableItem {
    pub id: i32,
    #[schema(example = "INV-20260818-1234")]
    pub invoice_number: String,
    #[schema(example = "Pak Haji Budi")]
    pub customer_name: String,
    pub payment_status: entity::enums::PaymentStatus,
    pub order_status: entity::enums::OrderStatus,
    #[schema(value_type = f64, example = 500000)]
    pub total_amount: Decimal,
    #[schema(value_type = f64, example = 250000)]
    pub pay_amount: Decimal,
    #[schema(value_type = f64, example = 250000)]
    pub remaining_amount: Decimal,
    #[schema(value_type = Option<String>, example = "2026-08-30")]
    pub estimated_done_at: Option<chrono::NaiveDate>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LowStockItem {
    pub id: i32,
    #[schema(example = "Tinta Printer")]
    pub name: String,
    #[schema(example = "Cyan")]
    pub variant: Option<String>,
    #[schema(example = "botol")]
    pub unit: String,
    #[schema(value_type = f64)]
    pub stock: Decimal,
    #[schema(value_type = f64)]
    pub min_stock_warning: Decimal,
    pub category_name: Option<String>,
}
