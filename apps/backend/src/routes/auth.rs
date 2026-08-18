use actix_web::{HttpResponse, web};
use validator::Validate;

use crate::dto::{ApiResponse, LoginRequest, MessageData, RefreshRequest};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::auth as auth_service;
use crate::state::AppState;

pub async fn login(
    state: web::Data<AppState>,
    payload: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let data = auth_service::login(&state.db, &state.jwt, payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Login berhasil", data)))
}

pub async fn refresh(
    state: web::Data<AppState>,
    payload: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AppError> {
    payload.validate()?;
    let data = auth_service::refresh(&state.db, &state.jwt, &payload.refresh_token).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Token diperbarui", data)))
}

pub async fn logout(_user: AuthUser) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Logout berhasil. Hapus token di sisi klien.",
        MessageData { ok: true },
    )))
}

pub async fn me(state: web::Data<AppState>, user: AuthUser) -> Result<HttpResponse, AppError> {
    let data = auth_service::me(&state.db, user.id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data user aktif", data)))
}
