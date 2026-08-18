use actix_web::{HttpResponse, web};

use crate::dto::{
    AddonQuery, ApiResponse, CreateAddonRequest, ListResponse, MessageData, Pagination,
    UpdateAddonRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::addons as addon_service;
use crate::state::AppState;

pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<AddonQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = addon_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar add-on", data, meta)))
}

pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = addon_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail add-on", data)))
}

pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateAddonRequest>,
) -> Result<HttpResponse, AppError> {
    let data = addon_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Add-on berhasil dibuat", data)))
}

pub async fn update(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateAddonRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        addon_service::update(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Add-on berhasil diperbarui", data)))
}

pub async fn delete(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    addon_service::delete(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Add-on berhasil dihapus",
        MessageData { ok: true },
    )))
}
