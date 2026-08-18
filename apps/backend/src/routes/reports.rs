use actix_web::{HttpResponse, web};

use crate::dto::{ApiResponse, ReportDateQuery};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::reports as report_service;
use crate::state::AppState;

pub async fn summary(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_dashboard_summary(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Ringkasan dashboard", data)))
}

pub async fn daily_sales(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_daily_sales(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan penjualan harian", data)))
}

pub async fn top_products(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_top_products(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan produk terlaris", data)))
}

pub async fn inventory_mutations(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ReportDateQuery>,
) -> Result<HttpResponse, AppError> {
    let data = report_service::get_inventory_mutations(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Laporan mutasi bahan baku", data)))
}
