use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateUserRequest, ListResponse, MessageData, Pagination, ResetPasswordRequest,
    UpdateUserRequest, UserQuery,
};
use crate::error::AppError;
use crate::extractors::SuperAdmin;
use crate::services::users as user_service;
use crate::state::AppState;

pub async fn list(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    pagination: Pagination,
    query: web::Query<UserQuery>,
) -> Result<HttpResponse, AppError> {
    let (users, meta) = user_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar user", users, meta)))
}

pub async fn get(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let user = user_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail user", user)))
}

pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, AppError> {
    let user = user_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("User berhasil dibuat", user)))
}

pub async fn update(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateUserRequest>,
) -> Result<HttpResponse, AppError> {
    let user =
        user_service::update(&state.db, path.into_inner(), admin.id, payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("User berhasil diperbarui", user)))
}

pub async fn reset_password(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<ResetPasswordRequest>,
) -> Result<HttpResponse, AppError> {
    user_service::reset_password(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Password user berhasil direset",
        MessageData { ok: true },
    )))
}

pub async fn delete(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    user_service::deactivate(&state.db, path.into_inner(), admin.id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "User berhasil dinonaktifkan",
        MessageData { ok: true },
    )))
}
