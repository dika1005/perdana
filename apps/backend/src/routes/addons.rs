use actix_web::{HttpResponse, web};

use crate::dto::{
    AddonQuery, AddonResponse, ApiResponse, CreateAddonRequest, ListResponse, MessageData, Pagination,
    UpdateAddonRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::addons as addon_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/addons",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama add-on")
    ),
    responses(
        (status = 200, description = "Daftar master add-on produk", body = ListResponse<AddonResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Addons"
)]
pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<AddonQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = addon_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar add-on", data, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/addons/{id}",
    params(
        ("id" = i32, Path, description = "ID Add-on")
    ),
    responses(
        (status = 200, description = "Detail add-on", body = ApiResponse<AddonResponse>),
        (status = 404, description = "Add-on tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Addons"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = addon_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail add-on", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/addons",
    request_body = CreateAddonRequest,
    responses(
        (status = 201, description = "Add-on berhasil dibuat", body = ApiResponse<AddonResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Addons"
)]
pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateAddonRequest>,
) -> Result<HttpResponse, AppError> {
    let data = addon_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Add-on berhasil dibuat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/addons/{id}",
    params(
        ("id" = i32, Path, description = "ID Add-on")
    ),
    request_body = UpdateAddonRequest,
    responses(
        (status = 200, description = "Add-on berhasil diperbarui", body = ApiResponse<AddonResponse>),
        (status = 404, description = "Add-on tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Addons"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/addons/{id}",
    params(
        ("id" = i32, Path, description = "ID Add-on")
    ),
    responses(
        (status = 200, description = "Add-on berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Add-on tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Addons"
)]
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
