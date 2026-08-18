use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateProductRequest, CreateVariantRequest, ListResponse, MessageData, Pagination,
    ProductQuery, UpdateProductRequest, UpdateVariantRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::products as product_service;
use crate::state::AppState;

// ==========================================
// PRODUCTS
// ==========================================

pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<ProductQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = product_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar produk", data, meta)))
}

pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail produk", data)))
}

pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateProductRequest>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Produk berhasil dibuat", data)))
}

pub async fn update(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateProductRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        product_service::update(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Produk berhasil diperbarui", data)))
}

pub async fn delete(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    product_service::delete(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Produk berhasil dihapus",
        MessageData { ok: true },
    )))
}

// ==========================================
// VARIANTS
// ==========================================

pub async fn list_variants(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::list_variants(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar varian produk", data)))
}

pub async fn create_variant(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<CreateVariantRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        product_service::create_variant(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Varian produk berhasil dibuat", data)))
}

pub async fn update_variant(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateVariantRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        product_service::update_variant(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Varian produk berhasil diperbarui", data)))
}

pub async fn delete_variant(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    product_service::delete_variant(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Varian produk berhasil dihapus",
        MessageData { ok: true },
    )))
}
