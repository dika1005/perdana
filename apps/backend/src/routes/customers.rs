use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateCustomerRequest, CustomerQuery, CustomerResponse, ListResponse, MessageData,
    Pagination, UpdateCustomerRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::customers as customer_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/customers",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama/telepon pelanggan")
    ),
    responses(
        (status = 200, description = "Daftar pelanggan", body = ListResponse<CustomerResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Customers"
)]
pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<CustomerQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = customer_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar pelanggan", data, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/customers/{id}",
    params(
        ("id" = i32, Path, description = "ID Pelanggan")
    ),
    responses(
        (status = 200, description = "Detail pelanggan", body = ApiResponse<CustomerResponse>),
        (status = 404, description = "Pelanggan tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Customers"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = customer_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail pelanggan", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/customers",
    request_body = CreateCustomerRequest,
    responses(
        (status = 201, description = "Pelanggan berhasil ditambahkan", body = ApiResponse<CustomerResponse>),
        (status = 400, description = "Validasi gagal")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Customers"
)]
pub async fn create(
    state: web::Data<AppState>,
    _user: AuthUser,
    payload: web::Json<CreateCustomerRequest>,
) -> Result<HttpResponse, AppError> {
    let data = customer_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Pelanggan berhasil ditambahkan", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/customers/{id}",
    params(
        ("id" = i32, Path, description = "ID Pelanggan")
    ),
    request_body = UpdateCustomerRequest,
    responses(
        (status = 200, description = "Data pelanggan berhasil diperbarui", body = ApiResponse<CustomerResponse>),
        (status = 404, description = "Pelanggan tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Customers"
)]
pub async fn update(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<UpdateCustomerRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        customer_service::update(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data pelanggan berhasil diperbarui", data)))
}

#[utoipa::path(
    delete,
    path = "/api/v1/customers/{id}",
    params(
        ("id" = i32, Path, description = "ID Pelanggan")
    ),
    responses(
        (status = 200, description = "Pelanggan berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Pelanggan tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Customers"
)]
pub async fn delete(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    customer_service::delete(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Pelanggan berhasil dihapus",
        MessageData { ok: true },
    )))
}
