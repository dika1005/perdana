use actix_web::{HttpResponse, web};

use crate::dto::{ApiResponse, CategoryQuery, CategoryRequest, CategoryResponse, MessageData};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::categories as category_service;
use crate::state::AppState;

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

#[utoipa::path(
    get,
    path = "/api/v1/product-categories",
    params(
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama kategori")
    ),
    responses(
        (status = 200, description = "Daftar kategori produk cetak", body = ApiResponse<Vec<CategoryResponse>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Categories"
)]
pub async fn list_product_categories(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<CategoryQuery>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::list_product_categories(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar kategori produk", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/product-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Produk")
    ),
    responses(
        (status = 200, description = "Detail kategori produk", body = ApiResponse<CategoryResponse>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Categories"
)]
pub async fn get_product_category(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::get_product_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail kategori produk", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/product-categories",
    request_body = CategoryRequest,
    responses(
        (status = 201, description = "Kategori produk berhasil dibuat", body = ApiResponse<CategoryResponse>),
        (status = 400, description = "Nama kategori kosong"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Categories"
)]
pub async fn create_product_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::create_product_category(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Kategori produk berhasil dibuat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/product-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Produk")
    ),
    request_body = CategoryRequest,
    responses(
        (status = 200, description = "Kategori produk berhasil diperbarui", body = ApiResponse<CategoryResponse>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Categories"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/product-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Produk")
    ),
    responses(
        (status = 200, description = "Kategori produk berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Categories"
)]
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

#[utoipa::path(
    get,
    path = "/api/v1/raw-material-categories",
    params(
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama kategori bahan")
    ),
    responses(
        (status = 200, description = "Daftar kategori bahan baku inventaris", body = ApiResponse<Vec<CategoryResponse>>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Raw Material Categories"
)]
pub async fn list_raw_material_categories(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<CategoryQuery>,
) -> Result<HttpResponse, AppError> {
    let data =
        category_service::list_raw_material_categories(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar kategori bahan baku", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/raw-material-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Bahan Baku")
    ),
    responses(
        (status = 200, description = "Detail kategori bahan baku", body = ApiResponse<CategoryResponse>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Raw Material Categories"
)]
pub async fn get_raw_material_category(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = category_service::get_raw_material_category(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail kategori bahan baku", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/raw-material-categories",
    request_body = CategoryRequest,
    responses(
        (status = 201, description = "Kategori bahan baku berhasil dibuat", body = ApiResponse<CategoryResponse>),
        (status = 400, description = "Nama kategori kosong"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Raw Material Categories"
)]
pub async fn create_raw_material_category(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        category_service::create_raw_material_category(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Kategori bahan baku berhasil dibuat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/raw-material-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Bahan Baku")
    ),
    request_body = CategoryRequest,
    responses(
        (status = 200, description = "Kategori bahan baku berhasil diperbarui", body = ApiResponse<CategoryResponse>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Raw Material Categories"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/raw-material-categories/{id}",
    params(
        ("id" = i32, Path, description = "ID Kategori Bahan Baku")
    ),
    responses(
        (status = 200, description = "Kategori bahan baku berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Kategori tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Raw Material Categories"
)]
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
