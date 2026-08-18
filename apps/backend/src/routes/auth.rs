use actix_web::cookie::time::Duration;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::{HttpRequest, HttpResponse, web};

use crate::dto::{ApiResponse, LoginData, LoginRequest, MessageData, PublicUser, RefreshData, RefreshRequest};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::auth as auth_service;
use crate::state::AppState;

pub fn make_access_cookie<'a>(token: &'a str, max_age_secs: i64) -> Cookie<'a> {
    Cookie::build("access_token", token)
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .max_age(Duration::seconds(max_age_secs))
        .finish()
}

pub fn make_refresh_cookie<'a>(token: &'a str, max_age_secs: i64) -> Cookie<'a> {
    Cookie::build("refresh_token", token)
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .max_age(Duration::seconds(max_age_secs))
        .finish()
}

pub fn make_removal_cookie<'a>(name: &'a str) -> Cookie<'a> {
    Cookie::build(name, "")
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .max_age(Duration::ZERO)
        .finish()
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login berhasil, mengembalikan token JWT dan memasang HttpOnly Cookie", body = ApiResponse<LoginData>),
        (status = 401, description = "Username atau password salah / akun non-aktif")
    ),
    tag = "Auth"
)]
pub async fn login(
    state: web::Data<AppState>,
    payload: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let data = auth_service::login(&state.db, &state.jwt, payload.into_inner()).await?;

    let access_cookie = make_access_cookie(&data.token, state.jwt.access_ttl_secs);
    let refresh_cookie = make_refresh_cookie(&data.refresh_token, state.jwt.refresh_ttl_secs);

    Ok(HttpResponse::Ok()
        .cookie(access_cookie)
        .cookie(refresh_cookie)
        .json(ApiResponse::ok("Login berhasil", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/refresh",
    request_body(content = Option<RefreshRequest>, description = "Optional jika refresh_token ada di Cookie"),
    responses(
        (status = 200, description = "Token diperbarui dan cookie diperbarui", body = ApiResponse<RefreshData>),
        (status = 401, description = "Refresh token tidak valid / expired")
    ),
    tag = "Auth"
)]
pub async fn refresh(
    state: web::Data<AppState>,
    req: HttpRequest,
    payload: Option<web::Json<RefreshRequest>>,
) -> Result<HttpResponse, AppError> {
    let refresh_token = payload
        .and_then(|p| p.into_inner().refresh_token)
        .filter(|t| !t.trim().is_empty())
        .or_else(|| {
            req.cookie("refresh_token")
                .map(|c| c.value().trim().to_string())
                .filter(|t| !t.is_empty())
        })
        .ok_or_else(|| {
            AppError::field(
                "refresh_token",
                "Refresh token wajib dikirim pada body atau cookie",
            )
        })?;

    let data = auth_service::refresh(&state.db, &state.jwt, &refresh_token).await?;

    let access_cookie = make_access_cookie(&data.token, state.jwt.access_ttl_secs);
    let refresh_cookie = make_refresh_cookie(&data.refresh_token, state.jwt.refresh_ttl_secs);

    Ok(HttpResponse::Ok()
        .cookie(access_cookie)
        .cookie(refresh_cookie)
        .json(ApiResponse::ok("Token diperbarui", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    responses(
        (status = 200, description = "Logout berhasil dan cookie dihapus", body = ApiResponse<MessageData>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Auth"
)]
pub async fn logout(_user: AuthUser) -> Result<HttpResponse, AppError> {
    let access_cookie = make_removal_cookie("access_token");
    let refresh_cookie = make_removal_cookie("refresh_token");

    Ok(HttpResponse::Ok()
        .cookie(access_cookie)
        .cookie(refresh_cookie)
        .json(ApiResponse::ok(
            "Logout berhasil. Cookie autentikasi telah dihapus.",
            MessageData { ok: true },
        )))
}

#[utoipa::path(
    get,
    path = "/api/v1/auth/me",
    responses(
        (status = 200, description = "Data profil user yang sedang login", body = ApiResponse<PublicUser>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Auth"
)]
pub async fn me(state: web::Data<AppState>, user: AuthUser) -> Result<HttpResponse, AppError> {
    let data = auth_service::me(&state.db, user.id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data user aktif", data)))
}
