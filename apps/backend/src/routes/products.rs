use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateProductRequest, CreateVariantRequest, ListResponse, MessageData, Pagination,
    ProductQuery, ProductResponse, ProductVariantResponse, UpdateProductRequest, UpdateVariantRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::products as product_service;
use crate::state::AppState;

// ==========================================
// PRODUCTS
// ==========================================

#[utoipa::path(
    get,
    path = "/api/v1/products",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("category_id" = Option<i32>, Query, description = "Filter berdasarkan ID kategori"),
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama produk")
    ),
    responses(
        (status = 200, description = "Daftar katalog produk cetak", body = ListResponse<ProductResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Products"
)]
pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<ProductQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = product_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar produk", data, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/products/{id}",
    params(
        ("id" = i32, Path, description = "ID Produk")
    ),
    responses(
        (status = 200, description = "Detail produk lengkap dengan varian", body = ApiResponse<ProductResponse>),
        (status = 404, description = "Produk tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Products"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail produk", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/products",
    request_body = CreateProductRequest,
    responses(
        (status = 201, description = "Produk berhasil dibuat", body = ApiResponse<ProductResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Products"
)]
pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateProductRequest>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Produk berhasil dibuat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/products/{id}",
    params(
        ("id" = i32, Path, description = "ID Produk")
    ),
    request_body = UpdateProductRequest,
    responses(
        (status = 200, description = "Produk berhasil diperbarui", body = ApiResponse<ProductResponse>),
        (status = 404, description = "Produk tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Products"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/products/{id}",
    params(
        ("id" = i32, Path, description = "ID Produk")
    ),
    responses(
        (status = 200, description = "Produk berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Produk tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Products"
)]
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

#[utoipa::path(
    get,
    path = "/api/v1/products/{id}/variants",
    params(
        ("id" = i32, Path, description = "ID Produk")
    ),
    responses(
        (status = 200, description = "Daftar varian produk", body = ApiResponse<Vec<ProductVariantResponse>>),
        (status = 404, description = "Produk tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Variants"
)]
pub async fn list_variants(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = product_service::list_variants(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Daftar varian produk", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/products/{id}/variants",
    params(
        ("id" = i32, Path, description = "ID Produk")
    ),
    request_body = CreateVariantRequest,
    responses(
        (status = 201, description = "Varian produk berhasil dibuat", body = ApiResponse<ProductVariantResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 404, description = "Produk tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Variants"
)]
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

#[utoipa::path(
    put,
    path = "/api/v1/product-variants/{id}",
    params(
        ("id" = i32, Path, description = "ID Varian Produk")
    ),
    request_body = UpdateVariantRequest,
    responses(
        (status = 200, description = "Varian produk berhasil diperbarui", body = ApiResponse<ProductVariantResponse>),
        (status = 404, description = "Varian tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Variants"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/product-variants/{id}",
    params(
        ("id" = i32, Path, description = "ID Varian Produk")
    ),
    responses(
        (status = 200, description = "Varian produk berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Varian tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Product Variants"
)]
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
