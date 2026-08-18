use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ReportDateQuery {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummaryResponse {
    pub total_omset: Decimal,
    pub total_transactions: i64,
    pub paid_transactions: i64,
    pub dp_transactions: i64,
    pub unpaid_transactions: i64,
    pub total_piutang: Decimal,
    pub active_orders: i64,
    pub ready_orders: i64,
    pub low_stock_raw_materials_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySalesReportItem {
    pub date: String,
    pub total_sales: Decimal,
    pub total_transactions: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopProductReportItem {
    pub product_name: String,
    pub total_qty: i64,
    pub total_revenue: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryMutationReportItem {
    pub raw_material_id: i32,
    pub raw_material_name: String,
    pub in_qty: i64,
    pub out_qty: i64,
    pub current_stock: i32,
}
