use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateMaterialLotRequest, CreateMutationRequest, CreateRawMaterialRequest,
    ListResponse, MaterialLotResponse, MessageData, MutationResponse, Pagination, RawMaterialQuery,
    RawMaterialResponse, UpdateRawMaterialRequest, UpsertUomConversionRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::raw_materials as raw_material_service;
use crate::services::material_lots as material_lot_service;
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
    admin: SuperAdmin,
    payload: web::Json<CreateRawMaterialRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create_as(&state.db, Some(admin.id), payload.into_inner()).await?;
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
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpdateRawMaterialRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::update_as(
        &state.db,
        Some(admin.id),
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
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
    admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    raw_material_service::delete_as(&state.db, Some(admin.id), path.into_inner()).await?;
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
    admin: SuperAdmin,
    payload: web::Json<CreateMutationRequest>,
) -> Result<HttpResponse, AppError> {
    let data = raw_material_service::create_mutation_as(
        &state.db,
        Some(admin.id),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Mutasi stok berhasil dicatat", data)))
}

/// Terima roll baru pada bahan basis m². Saldo fisik dan lot selalu dibuat
/// dalam satu transaksi agar tidak ada roll "menggantung" tanpa stok.
pub async fn receive_lot(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<CreateMaterialLotRequest>,
) -> Result<HttpResponse, AppError> {
    let data = material_lot_service::receive_lot_as(
        &state.db,
        admin.id,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Created().json(ApiResponse::<MaterialLotResponse>::ok(
        "Lot roll berhasil diterima dan stok fisik ditambahkan",
        data,
    )))
}

pub async fn list_lots(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = material_lot_service::list_lots(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::<Vec<MaterialLotResponse>>::ok(
        "Daftar lot dan offcut bahan",
        data,
    )))
}

pub async fn upsert_uom_conversion(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpsertUomConversionRequest>,
) -> Result<HttpResponse, AppError> {
    material_lot_service::upsert_uom_conversion_as(
        &state.db,
        admin.id,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Konversi satuan bahan berhasil diperbarui",
        MessageData { ok: true },
    )))
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
