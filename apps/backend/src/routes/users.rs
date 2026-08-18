use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateUserRequest, ListResponse, MessageData, Pagination, PublicUser, ResetPasswordRequest,
    UpdateUserRequest, UserQuery,
};
use crate::error::AppError;
use crate::extractors::SuperAdmin;
use crate::services::users as user_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/users",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n (default 1)"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman (default 20, max 100)"),
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama atau username"),
        ("role" = Option<String>, Query, description = "Filter role (SUPER_ADMIN / ADMIN)")
    ),
    responses(
        (status = 200, description = "Daftar pengguna (Super Admin only)", body = ListResponse<PublicUser>),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
pub async fn list(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    pagination: Pagination,
    query: web::Query<UserQuery>,
) -> Result<HttpResponse, AppError> {
    let (users, meta) = user_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar user", users, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/users/{id}",
    params(
        ("id" = i32, Path, description = "ID User")
    ),
    responses(
        (status = 200, description = "Detail user", body = ApiResponse<PublicUser>),
        (status = 404, description = "User tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
pub async fn get(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let user = user_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail user", user)))
}

#[utoipa::path(
    post,
    path = "/api/v1/users",
    request_body = CreateUserRequest,
    responses(
        (status = 201, description = "User berhasil dibuat", body = ApiResponse<PublicUser>),
        (status = 400, description = "Validasi gagal"),
        (status = 409, description = "Username sudah digunakan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, AppError> {
    let user = user_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("User berhasil dibuat", user)))
}

#[utoipa::path(
    put,
    path = "/api/v1/users/{id}",
    params(
        ("id" = i32, Path, description = "ID User")
    ),
    request_body = UpdateUserRequest,
    responses(
        (status = 200, description = "User berhasil diperbarui", body = ApiResponse<PublicUser>),
        (status = 404, description = "User tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
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

#[utoipa::path(
    patch,
    path = "/api/v1/users/{id}/password",
    params(
        ("id" = i32, Path, description = "ID User")
    ),
    request_body = ResetPasswordRequest,
    responses(
        (status = 200, description = "Password user berhasil direset", body = ApiResponse<MessageData>),
        (status = 400, description = "Password baru kurang dari 8 karakter"),
        (status = 404, description = "User tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/users/{id}",
    params(
        ("id" = i32, Path, description = "ID User")
    ),
    responses(
        (status = 200, description = "User berhasil dinonaktifkan", body = ApiResponse<MessageData>),
        (status = 400, description = "Tidak dapat menonaktifkan akun sendiri"),
        (status = 404, description = "User tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Users"
)]
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
