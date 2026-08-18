use actix_web::{HttpResponse, web};

use crate::dto::{ApiResponse, CategoryQuery, CategoryRequest, MessageData};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::categories as category_service;
use crate::state::AppState;

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

pub async fn list_product_categories(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<CategoryQuery>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::list_product_categories(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar kategori produk", data)))
}

pub async fn get_product_category(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::get_product_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail kategori produk", data)))
}

pub async fn create_product_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::create_product_category(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Kategori produk berhasil dibuat", data)))
}

pub async fn update_product_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        category_service::update_product_category(&state.db, path.into_inner(), payload.into_inner())
            .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Kategori produk berhasil diperbarui", data)))
}

pub async fn delete_product_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    category_service::delete_product_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Kategori produk berhasil dihapus",
        MessageData { ok: true },
    )))
}

// ==========================================
// RAW MATERIAL CATEGORIES
// ==========================================

pub async fn list_raw_material_categories(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<CategoryQuery>,
) -> Result<HttpResponse, AppError> {
    let data =
        category_service::list_raw_material_categories(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar kategori bahan baku", data)))
}

pub async fn get_raw_material_category(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::get_raw_material_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail kategori bahan baku", data)))
}

pub async fn create_raw_material_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        category_service::create_raw_material_category(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Kategori bahan baku berhasil dibuat", data)))
}

pub async fn update_raw_material_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::update_raw_material_category(
        &state.db,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Kategori bahan baku berhasil diperbarui", data)))
}

pub async fn delete_raw_material_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    category_service::delete_raw_material_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Kategori bahan baku berhasil dihapus",
        MessageData { ok: true },
    )))
}
