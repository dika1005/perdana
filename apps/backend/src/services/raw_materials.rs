use entity::enums::MutationType;
use entity::prelude::*;
use entity::{raw_material_mutations, raw_materials};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set, TransactionTrait,
};
use sea_orm::sea_query::ExprTrait;
use validator::Validate;

use crate::dto::{
    CreateMutationRequest, CreateRawMaterialRequest, MutationResponse, Pagination,
    PaginationMeta, RawMaterialQuery, RawMaterialResponse, UpdateRawMaterialRequest,
};
use crate::error::AppError;
use crate::services::{audit, inventory};

pub fn map_raw_material(m: &raw_materials::Model) -> RawMaterialResponse {
    let available_stock = m.stock - m.reserved_stock;
    RawMaterialResponse {
        id: m.id,
        category_id: m.category_id,
        name: m.name.clone(),
        variant: m.variant.clone(),
        unit: m.unit.clone(),
        stock: m.stock,
        reserved_stock: m.reserved_stock,
        available_stock,
        min_stock_warning: m.min_stock_warning,
        standard_cost: m.standard_cost,
        roll_width: m.roll_width,
        is_active: m.is_active,
        is_low_stock: available_stock <= m.min_stock_warning,
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

/// Keamanan kompatibilitas untuk pemanggil lama. Semantik yang benar adalah
/// stok available (physical - reserved), bukan physical stock mentah.
pub fn ensure_sufficient_stock(
    material: &raw_materials::Model,
    required: Decimal,
) -> Result<(), AppError> {
    inventory::ensure_available_stock(material, required)
}

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: RawMaterialQuery,
) -> Result<(Vec<RawMaterialResponse>, PaginationMeta), AppError> {
    let mut select = RawMaterial::find()
        .filter(raw_materials::Column::IsActive.eq(true))
        .order_by_asc(raw_materials::Column::Name);

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
        select = select.filter(
            sea_orm::sea_query::Expr::col(raw_materials::Column::Stock)
                .sub(sea_orm::sea_query::Expr::col(raw_materials::Column::ReservedStock))
                .lte(sea_orm::sea_query::Expr::col(raw_materials::Column::MinStockWarning)),
        );
    }

    let (items, meta) = pagination.fetch(select, db).await?;
    Ok((items.iter().map(map_raw_material).collect(), meta))
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
    create_as(db, None, payload).await
}

pub async fn create_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    payload: CreateRawMaterialRequest,
) -> Result<RawMaterialResponse, AppError> {
    payload.validate()?;
    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama bahan baku tidak boleh kosong"));
    }
    let initial_stock = payload.stock.unwrap_or(Decimal::ZERO);
    let min_warning = payload.min_stock_warning.unwrap_or(Decimal::ZERO);
    let standard_cost = payload.standard_cost.unwrap_or(Decimal::ZERO);
    if initial_stock < Decimal::ZERO || min_warning < Decimal::ZERO || standard_cost < Decimal::ZERO {
        return Err(AppError::field(
            "stock",
            "Stok awal, batas minimum, dan biaya standar tidak boleh negatif",
        ));
    }
    if let Some(width) = payload.roll_width {
        if width <= Decimal::ZERO {
            return Err(AppError::field("roll_width", "Lebar roll harus lebih dari 0"));
        }
    }

    let txn = db.begin().await?;
    if let Some(cat_id) = payload.category_id {
        if RawMaterialCategory::find_by_id(cat_id).one(&txn).await?.is_none() {
            return Err(AppError::field("category_id", "Kategori bahan baku tidak ditemukan"));
        }
    }
    let item = raw_materials::ActiveModel {
        category_id: Set(payload.category_id),
        name: Set(name),
        variant: Set(payload.variant.map(|v| v.trim().to_string())),
        unit: Set(payload.unit.unwrap_or_else(|| "pcs".to_string()).trim().to_string()),
        stock: Set(Decimal::ZERO),
        reserved_stock: Set(Decimal::ZERO),
        min_stock_warning: Set(min_warning),
        standard_cost: Set(standard_cost),
        roll_width: Set(payload.roll_width),
        is_active: Set(true),
        ..Default::default()
    }
    .insert(&txn)
    .await?;

    let created = if initial_stock > Decimal::ZERO {
        inventory::adjust_physical(
            &txn,
            item.id,
            MutationType::In,
            initial_stock,
            inventory::LedgerContext {
                actor_id,
                notes: Some("Saldo awal bahan baku".to_string()),
                ..Default::default()
            },
        )
        .await?
        .0
    } else {
        item
    };
    audit::log(
        &txn,
        actor_id,
        "CREATE",
        "RAW_MATERIAL",
        created.id.to_string(),
        None,
        audit::snapshot(&created),
        Some("Master bahan baku dibuat".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(map_raw_material(&created))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateRawMaterialRequest,
) -> Result<RawMaterialResponse, AppError> {
    update_as(db, None, id, payload).await
}

pub async fn update_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    payload: UpdateRawMaterialRequest,
) -> Result<RawMaterialResponse, AppError> {
    payload.validate()?;
    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama bahan baku tidak boleh kosong"));
    }
    if let Some(value) = payload.min_stock_warning {
        if value < Decimal::ZERO {
            return Err(AppError::field("min_stock_warning", "Batas minimum tidak boleh negatif"));
        }
    }
    if let Some(value) = payload.standard_cost {
        if value < Decimal::ZERO {
            return Err(AppError::field("standard_cost", "Biaya standar tidak boleh negatif"));
        }
    }
    if let Some(value) = payload.roll_width {
        if value <= Decimal::ZERO {
            return Err(AppError::field("roll_width", "Lebar roll harus lebih dari 0"));
        }
    }

    let txn = db.begin().await?;
    let item = RawMaterial::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;
    if let Some(cat_id) = payload.category_id {
        if RawMaterialCategory::find_by_id(cat_id).one(&txn).await?.is_none() {
            return Err(AppError::field("category_id", "Kategori bahan baku tidak ditemukan"));
        }
    }
    let before = audit::snapshot(&item);
    let mut active: raw_materials::ActiveModel = item.into();
    active.category_id = Set(payload.category_id);
    active.name = Set(name);
    active.variant = Set(payload.variant.map(|v| v.trim().to_string()));
    if let Some(unit) = payload.unit {
        active.unit = Set(unit.trim().to_string());
    }
    if let Some(value) = payload.min_stock_warning {
        active.min_stock_warning = Set(value);
    }
    if let Some(value) = payload.standard_cost {
        active.standard_cost = Set(value);
    }
    if let Some(value) = payload.roll_width {
        active.roll_width = Set(Some(value));
    }
    active.updated_at = Set(chrono::Utc::now());
    let updated = active.update(&txn).await?;
    audit::log(
        &txn,
        actor_id,
        "UPDATE",
        "RAW_MATERIAL",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Master bahan baku diperbarui".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(map_raw_material(&updated))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    delete_as(db, None, id).await
}

pub async fn delete_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
) -> Result<(), AppError> {
    let txn = db.begin().await?;
    let item = RawMaterial::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;
    if item.reserved_stock > Decimal::ZERO {
        return Err(AppError::conflict(
            "Bahan memiliki stok terpesan. Lepaskan atau selesaikan pesanan terkait terlebih dahulu.",
        ));
    }
    let before = audit::snapshot(&item);
    let mut active: raw_materials::ActiveModel = item.into();
    active.is_active = Set(false);
    active.updated_at = Set(chrono::Utc::now());
    let updated = active.update(&txn).await?;
    audit::log(
        &txn,
        actor_id,
        "DEACTIVATE",
        "RAW_MATERIAL",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Master bahan dinonaktifkan; histori inventori dipertahankan".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(())
}

pub async fn create_mutation(
    db: &DatabaseConnection,
    payload: CreateMutationRequest,
) -> Result<MutationResponse, AppError> {
    create_mutation_as(db, None, payload).await
}

pub async fn create_mutation_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    payload: CreateMutationRequest,
) -> Result<MutationResponse, AppError> {
    payload.validate()?;
    let txn = db.begin().await?;
    let notes = payload.notes.map(|value| value.trim().to_string());
    let (_material, mutation) = inventory::adjust_physical(
        &txn,
        payload.raw_material_id,
        payload.mutation_type,
        payload.qty,
        inventory::LedgerContext {
            actor_id,
            notes: notes.clone(),
            ..Default::default()
        },
    )
    .await?;
    audit::log(
        &txn,
        actor_id,
        "STOCK_ADJUSTMENT",
        "RAW_MATERIAL",
        payload.raw_material_id.to_string(),
        None,
        audit::snapshot(&mutation),
        notes,
    )
    .await?;
    txn.commit().await?;
    Ok(map_mutation(&mutation))
}

pub async fn list_mutations(
    db: &DatabaseConnection,
    raw_material_id: i32,
    pagination: &Pagination,
) -> Result<(Vec<MutationResponse>, PaginationMeta), AppError> {
    if RawMaterial::find_by_id(raw_material_id).one(db).await?.is_none() {
        return Err(AppError::not_found("Bahan baku tidak ditemukan"));
    }
    let select = RawMaterialMutation::find()
        .filter(raw_material_mutations::Column::RawMaterialId.eq(raw_material_id))
        .order_by_desc(raw_material_mutations::Column::Id);
    let (items, meta) = pagination.fetch(select, db).await?;
    Ok((items.iter().map(map_mutation).collect(), meta))
}
