//! Owner-facing master recipe (BOM) endpoints.
//!
//! A POS client never calculates or chooses stock material. These endpoints
//! are the only place an owner defines a product's multi-material recipe.

use actix_web::{web, HttpResponse};

use crate::dto::{
    AddonBomLineResponse, ApiResponse, UpsertAddonBomRequest,
    UpsertProductBomRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::bom;
use crate::state::AppState;

#[derive(serde::Deserialize)]
pub struct ProductBomQuery {
    pub product_variant_id: Option<i32>,
}

pub async fn get_product_bom(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    query: web::Query<ProductBomQuery>,
) -> Result<HttpResponse, AppError> {
    let data = bom::get_product_bom(&state.db, path.into_inner(), query.product_variant_id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("BOM produk", data)))
}

pub async fn upsert_product_bom(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpsertProductBomRequest>,
) -> Result<HttpResponse, AppError> {
    let data = bom::upsert_product_bom(&state.db, admin.id, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Versi BOM produk berhasil diaktifkan", data)))
}

pub async fn get_addon_bom(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = bom::get_addon_bom(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::<Vec<AddonBomLineResponse>>::ok("BOM add-on", data)))
}

pub async fn upsert_addon_bom(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<UpsertAddonBomRequest>,
) -> Result<HttpResponse, AppError> {
    let data = bom::upsert_addon_bom(&state.db, admin.id, path.into_inner(), payload.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::<Vec<AddonBomLineResponse>>::ok(
        "BOM add-on berhasil diperbarui",
        data,
    )))
}
