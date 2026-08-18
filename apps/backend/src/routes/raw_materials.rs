use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateMutationRequest, CreateRawMaterialRequest, ListResponse, MessageData,
    Pagination, RawMaterialQuery, UpdateRawMaterialRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::raw_materials as raw_material_service;
use crate::state::AppState;

pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<RawMaterialQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) =
        raw_material_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar bahan baku", data, meta)))
}

pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail bahan baku", data)))
}

pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateRawMaterialRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Bahan baku berhasil dibuat", data)))
}

pub async fn update(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateRawMaterialRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        raw_material_service::update(&state.db, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Bahan baku berhasil diperbarui", data)))
}

pub async fn delete(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    raw_material_service::delete(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Bahan baku berhasil dihapus",
        MessageData { ok: true },
    )))
}

pub async fn create_mutation(
    state: web::Data<AppState>,
    _user: AuthUser,
    payload: web::Json<CreateMutationRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create_mutation(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Mutasi stok berhasil dicatat", data)))
}

pub async fn list_mutations(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    pagination: Pagination,
) -> Result<HttpResponse, AppError> {
    let (data, meta) =
        raw_material_service::list_mutations(&state.db, path.into_inner(), &pagination).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Riwayat mutasi stok", data, meta)))
}
