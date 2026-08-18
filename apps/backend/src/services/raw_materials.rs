use entity::enums::MutationType;
use entity::prelude::*;
use entity::{raw_material_mutations, raw_materials};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
    TransactionTrait,
};
use validator::Validate;

use crate::dto::{
    CreateMutationRequest, CreateRawMaterialRequest, MutationResponse, Pagination,
    PaginationMeta, RawMaterialQuery, RawMaterialResponse, UpdateRawMaterialRequest,
};
use crate::error::AppError;

pub fn map_raw_material(m: &raw_materials::Model) -> RawMaterialResponse {
    RawMaterialResponse {
        id: m.id,
        category_id: m.category_id,
        name: m.name.clone(),
        variant: m.variant.clone(),
        unit: m.unit.clone(),
        stock: m.stock,
        min_stock_warning: m.min_stock_warning,
        is_low_stock: m.stock <= m.min_stock_warning,
        created_at: m.created_at,
        updated_at: m.updated_at,
    }
}

pub fn map_mutation(m: &raw_material_mutations::Model) -> MutationResponse {
    MutationResponse {
        id: m.id,
        raw_material_id: m.raw_material_id,
        mutation_type: m.mutation_type.clone(),
        qty: m.qty,
        notes: m.notes.clone(),
        created_at: m.created_at,
    }
}

// ==========================================
// RAW MATERIALS
// ==========================================

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: RawMaterialQuery,
) -> Result<(Vec<RawMaterialResponse>, PaginationMeta), AppError> {
    let mut select = RawMaterial::find().order_by_asc(raw_materials::Column::Name);

    if let Some(cat_id) = query.category_id {
        select = select.filter(raw_materials::Column::CategoryId.eq(cat_id));
    }

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(
            raw_materials::Column::Name
                .like(&keyword)
                .or(raw_materials::Column::Variant.like(&keyword)),
        );
    }

    if let Some(true) = query.low_stock {
        // stok <= min_stock_warning
        select = select.filter(
            sea_orm::sea_query::Expr::col(raw_materials::Column::Stock)
                .lte(sea_orm::sea_query::Expr::col(raw_materials::Column::MinStockWarning)),
        );
    }

    let (items, meta) = pagination.fetch(select, db).await?;
    let result = items.iter().map(map_raw_material).collect();
    Ok((result, meta))
}

pub async fn get_by_id(
    db: &DatabaseConnection,
    id: i32,
) -> Result<RawMaterialResponse, AppError> {
    let item = RawMaterial::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;

    Ok(map_raw_material(&item))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateRawMaterialRequest,
) -> Result<RawMaterialResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama bahan baku tidak boleh kosong"));
    }

    if let Some(cat_id) = payload.category_id {
        let cat_exists = RawMaterialCategory::find_by_id(cat_id).one(db).await?;
        if cat_exists.is_none() {
            return Err(AppError::field(
                "category_id",
                "Kategori bahan baku tidak ditemukan",
            ));
        }
    }

    let active_model = raw_materials::ActiveModel {
        category_id: Set(payload.category_id),
        name: Set(name),
        variant: Set(payload.variant.map(|v| v.trim().to_string())),
        unit: Set(payload.unit.unwrap_or_else(|| "pcs".to_string())),
        stock: Set(payload.stock.unwrap_or(0)),
        min_stock_warning: Set(payload.min_stock_warning.unwrap_or(10)),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(map_raw_material(&item))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateRawMaterialRequest,
) -> Result<RawMaterialResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama bahan baku tidak boleh kosong"));
    }

    let item = RawMaterial::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;

    if let Some(cat_id) = payload.category_id {
        let cat_exists = RawMaterialCategory::find_by_id(cat_id).one(db).await?;
        if cat_exists.is_none() {
            return Err(AppError::field(
                "category_id",
                "Kategori bahan baku tidak ditemukan",
            ));
        }
    }

    let mut active_model: raw_materials::ActiveModel = item.into();
    active_model.category_id = Set(payload.category_id);
    active_model.name = Set(name);
    active_model.variant = Set(payload.variant.map(|v| v.trim().to_string()));
    if let Some(unit) = payload.unit {
        active_model.unit = Set(unit.trim().to_string());
    }
    if let Some(min_warn) = payload.min_stock_warning {
        active_model.min_stock_warning = Set(min_warn);
    }
    active_model.updated_at = Set(chrono::Utc::now());

    let updated = active_model.update(db).await?;
    Ok(map_raw_material(&updated))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let item = RawMaterial::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;

    let active_model: raw_materials::ActiveModel = item.into();
    active_model.delete(db).await?;
    Ok(())
}

// ==========================================
// MUTATIONS
// ==========================================

pub async fn create_mutation(
    db: &DatabaseConnection,
    payload: CreateMutationRequest,
) -> Result<MutationResponse, AppError> {
    payload.validate()?;

    let txn = db.begin().await?;

    let material = RawMaterial::find_by_id(payload.raw_material_id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;

    let new_stock = match payload.mutation_type {
        MutationType::In => material.stock + payload.qty,
        MutationType::Out => {
            if material.stock < payload.qty {
                return Err(AppError::conflict(format!(
                    "Sisa stok tidak mencukupi untuk mutasi keluar (Stok saat ini: {}, Diminta: {})",
                    material.stock, payload.qty
                )));
            }
            material.stock - payload.qty
        }
    };

    let active_mutation = raw_material_mutations::ActiveModel {
        raw_material_id: Set(payload.raw_material_id),
        mutation_type: Set(payload.mutation_type),
        qty: Set(payload.qty),
        notes: Set(payload.notes.map(|n| n.trim().to_string())),
        ..Default::default()
    };

    let mutation = active_mutation.insert(&txn).await?;

    let mut active_material: raw_materials::ActiveModel = material.into();
    active_material.stock = Set(new_stock);
    active_material.updated_at = Set(chrono::Utc::now());
    active_material.update(&txn).await?;

    txn.commit().await?;

    Ok(map_mutation(&mutation))
}

pub async fn list_mutations(
    db: &DatabaseConnection,
    raw_material_id: i32,
    pagination: &Pagination,
) -> Result<(Vec<MutationResponse>, PaginationMeta), AppError> {
    let material_exists = RawMaterial::find_by_id(raw_material_id)
        .one(db)
        .await?;
    if material_exists.is_none() {
        return Err(AppError::not_found("Bahan baku tidak ditemukan"));
    }

    let select = RawMaterialMutation::find()
        .filter(raw_material_mutations::Column::RawMaterialId.eq(raw_material_id))
        .order_by_desc(raw_material_mutations::Column::Id);

    let (items, meta) = pagination.fetch(select, db).await?;
    let result = items.iter().map(map_mutation).collect();
    Ok((result, meta))
}
