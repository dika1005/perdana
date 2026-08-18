use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateMutationRequest, CreateRawMaterialRequest, ListResponse, MessageData,
    MutationResponse, Pagination, RawMaterialQuery, RawMaterialResponse, UpdateRawMaterialRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::raw_materials as raw_material_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/raw-materials",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("category_id" = Option<i32>, Query, description = "Filter berdasarkan ID kategori bahan"),
        ("search" = Option<String>, Query, description = "Cari berdasarkan nama/varian bahan"),
        ("low_stock" = Option<bool>, Query, description = "Filter hanya bahan yang stoknya menipis")
    ),
    responses(
        (status = 200, description = "Daftar inventaris bahan baku", body = ListResponse<RawMaterialResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
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

#[utoipa::path(
    get,
    path = "/api/v1/raw-materials/{id}",
    params(
        ("id" = i32, Path, description = "ID Bahan Baku")
    ),
    responses(
        (status = 200, description = "Detail bahan baku", body = ApiResponse<RawMaterialResponse>),
        (status = 404, description = "Bahan baku tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail bahan baku", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/raw-materials",
    request_body = CreateRawMaterialRequest,
    responses(
        (status = 201, description = "Bahan baku berhasil dibuat", body = ApiResponse<RawMaterialResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 403, description = "Forbidden (Super Admin only)")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
pub async fn create(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    payload: web::Json<CreateRawMaterialRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Bahan baku berhasil dibuat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/raw-materials/{id}",
    params(
        ("id" = i32, Path, description = "ID Bahan Baku")
    ),
    request_body = UpdateRawMaterialRequest,
    responses(
        (status = 200, description = "Bahan baku berhasil diperbarui", body = ApiResponse<RawMaterialResponse>),
        (status = 404, description = "Bahan baku tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/raw-materials/{id}",
    params(
        ("id" = i32, Path, description = "ID Bahan Baku")
    ),
    responses(
        (status = 200, description = "Bahan baku berhasil dihapus", body = ApiResponse<MessageData>),
        (status = 404, description = "Bahan baku tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
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

#[utoipa::path(
    post,
    path = "/api/v1/raw-materials/mutations",
    request_body = CreateMutationRequest,
    responses(
        (status = 201, description = "Mutasi stok berhasil dicatat", body = ApiResponse<MutationResponse>),
        (status = 400, description = "Validasi gagal / kuantitas invalid"),
        (status = 409, description = "Stok tidak mencukupi untuk mutasi OUT")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
pub async fn create_mutation(
    state: web::Data<AppState>,
    _user: AuthUser,
    payload: web::Json<CreateMutationRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create_mutation(&state.db, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Mutasi stok berhasil dicatat", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/raw-materials/{id}/mutations",
    params(
        ("id" = i32, Path, description = "ID Bahan Baku"),
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman")
    ),
    responses(
        (status = 200, description = "Riwayat mutasi stok bahan baku", body = ListResponse<MutationResponse>),
        (status = 404, description = "Bahan baku tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Inventory / Raw Materials"
)]
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
