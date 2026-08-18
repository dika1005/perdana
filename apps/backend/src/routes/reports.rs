use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, DashboardSummaryResponse, DailySalesReportItem, InventoryMutationReportItem,
    LowStockItem, ReceivableItem, ReportDateQuery, TopProductReportItem,
};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::reports as report_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/reports/summary",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Ringkasan metrik dashboard (omset, piutang, pesanan aktif, bahan menipis)", body = ApiResponse<DashboardSummaryResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn summary(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_dashboard_summary(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Ringkasan dashboard", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/reports/daily-sales",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Grafik / tren penjualan harian", body = ApiResponse<Vec<DailySalesReportItem>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn daily_sales(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_daily_sales(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan penjualan harian", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/reports/top-products",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Daftar produk paling laris / kontributor omset tertinggi", body = ApiResponse<Vec<TopProductReportItem>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn top_products(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_top_products(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan produk terlaris", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/reports/inventory-mutations",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Rekapitulasi mutasi keluar/masuk seluruh bahan baku", body = ApiResponse<Vec<InventoryMutationReportItem>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn inventory_mutations(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_inventory_mutations(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan mutasi bahan baku", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/reports/receivables",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Daftar transaksi berstatus DP/UNPAID beserta sisa tagihan piutang", body = ApiResponse<Vec<ReceivableItem>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn receivables(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_receivables(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan piutang (DP & UNPAID)", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/reports/low-stock",
    responses(
        (status = 200, description = "Daftar bahan baku yang stoknya di bawah ambang minimum", body = ApiResponse<Vec<LowStockItem>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Reports & Analytics"
)]
pub async fn low_stock(
    state: web::Data<AppState>,
    _user: AuthUser,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_low_stock(&state.db).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar bahan baku stok rendah", data)))
}
