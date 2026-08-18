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
    #[schema(value_type = f64, example = 15000000)]
    pub total_omset: Decimal,
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
    pub in_qty: i64,
    pub out_qty: i64,
    pub current_stock: i32,
}
