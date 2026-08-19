use actix_web::{HttpResponse, web};
use entity::prelude::*;
use entity::{product_categories, products};
use sea_orm::{EntityTrait, LoaderTrait, QueryOrder};
use serde::Serialize;
use utoipa::ToSchema;

use crate::dto::{ApiResponse, ProductResponse};
use crate::error::AppError;
use crate::services::products::{map_product, map_variant};
use crate::state::AppState;

/// Response ringkas untuk info toko (publik)
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicStoreInfo {
    pub name: String,
    pub address: String,
    pub phone: String,
}

/// Response ringkas untuk kategori produk (publik)
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicCategoryResponse {
    pub id: i32,
    pub name: String,
}

/// Response gabungan katalog publik
#[derive(Debug, Serialize, ToSchema)]
pub struct PublicCatalogResponse {
    pub store: PublicStoreInfo,
    pub categories: Vec<PublicCategoryResponse>,
    pub products: Vec<ProductResponse>,
}

/// GET /api/v1/public/catalog
///
/// Endpoint publik tanpa autentikasi. Mengembalikan:
/// - Info toko (nama, alamat, telepon)
/// - Daftar kategori produk
/// - Daftar semua produk beserta varian
#[utoipa::path(
    get,
    path = "/api/v1/public/catalog",
    responses(
        (status = 200, description = "Katalog produk publik lengkap", body = ApiResponse<PublicCatalogResponse>)
    ),
    tag = "Public"
)]
pub async fn catalog(
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    // 1. Info toko dari config
    let store = PublicStoreInfo {
        name: state.store.name.clone(),
        address: state.store.address.clone(),
        phone: state.store.phone.clone(),
    };

    // 2. Semua kategori produk
    let cat_models = ProductCategory::find()
        .order_by_asc(product_categories::Column::Name)
        .all(&state.db)
        .await?;
    let categories: Vec<PublicCategoryResponse> = cat_models
        .iter()
        .map(|c| PublicCategoryResponse {
            id: c.id,
            name: c.name.clone(),
        })
        .collect();

    // 3. Semua produk + varian
    let product_models = Product::find()
        .order_by_asc(products::Column::Name)
        .all(&state.db)
        .await?;

    let variants = product_models.load_many(ProductVariant::find(), &state.db).await?;

    let products_response: Vec<ProductResponse> = product_models
        .into_iter()
        .zip(variants.into_iter())
        .map(|(prod, vars)| {
            let var_res = if prod.has_variants {
                Some(vars.iter().map(map_variant).collect())
            } else {
                None
            };
            map_product(&prod, var_res)
        })
        .collect();

    let catalog = PublicCatalogResponse {
        store,
        categories,
        products: products_response,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::ok("Katalog produk publik", catalog)))
}
