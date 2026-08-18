use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateCustomerRequest, CustomerQuery, ListResponse, MessageData, Pagination,
    UpdateCustomerRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::customers as customer_service;
use crate::state::AppState;

pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<CustomerQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = customer_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar pelanggan", data, meta)))
}

pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = customer_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail pelanggan", data)))
}

pub async fn create(
    state: web::Data<AppState>,
    _user: AuthUser,
    payload: web::Json<CreateCustomerRequest>,
) -> Result<HttpResponse, AppError> {
    let data = customer_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Pelanggan berhasil ditambahkan", data)))
}

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
