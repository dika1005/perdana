use entity::prelude::*;
use entity::{product_categories, raw_material_categories};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use validator::Validate;

use crate::dto::{CategoryQuery, CategoryRequest, CategoryResponse};
use crate::error::AppError;

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

pub async fn list_product_categories(
    db: &DatabaseConnection,
    query: CategoryQuery,
) -> Result<Vec<CategoryResponse>, AppError> {
    let mut select = ProductCategory::find().order_by_asc(product_categories::Column::Name);

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(product_categories::Column::Name.like(&keyword));
    }

    let items = select.all(db).await?;
    let res = items
        .into_iter()
        .map(|item| CategoryResponse {
            id: item.id,
            name: item.name,
            created_at: item.created_at,
        })
        .collect();
    Ok(res)
}

pub async fn get_product_category(
    db: &DatabaseConnection,
    id: i32,
) -> Result<CategoryResponse, AppError> {
    let item = ProductCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori produk tidak ditemukan"))?;

    Ok(CategoryResponse {
        id: item.id,
        name: item.name,
        created_at: item.created_at,
    })
}

pub async fn create_product_category(
    db: &DatabaseConnection,
    payload: CategoryRequest,
) -> Result<CategoryResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama kategori tidak boleh kosong"));
    }

    let existing = ProductCategory::find()
        .filter(product_categories::Column::Name.eq(&name))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Nama kategori produk sudah ada"));
    }

    let active_model = product_categories::ActiveModel {
        name: Set(name),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(CategoryResponse {
        id: item.id,
        name: item.name,
        created_at: item.created_at,
    })
}

pub async fn update_product_category(
    db: &DatabaseConnection,
    id: i32,
    payload: CategoryRequest,
) -> Result<CategoryResponse, AppError> {
    payload.validate()?;

    let item = ProductCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori produk tidak ditemukan"))?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama kategori tidak boleh kosong"));
    }

    let existing = ProductCategory::find()
        .filter(product_categories::Column::Name.eq(&name))
        .filter(product_categories::Column::Id.ne(id))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Nama kategori produk sudah ada"));
    }

    let mut active_model: product_categories::ActiveModel = item.into();
    active_model.name = Set(name);

    let updated = active_model.update(db).await?;
    Ok(CategoryResponse {
        id: updated.id,
        name: updated.name,
        created_at: updated.created_at,
    })
}

pub async fn delete_product_category(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let item = ProductCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori produk tidak ditemukan"))?;

    let active_model: product_categories::ActiveModel = item.into();
    active_model.delete(db).await?;
    Ok(())
}

// ==========================================
// RAW MATERIAL CATEGORIES
// ==========================================

pub async fn list_raw_material_categories(
    db: &DatabaseConnection,
    query: CategoryQuery,
) -> Result<Vec<CategoryResponse>, AppError> {
    let mut select =
        RawMaterialCategory::find().order_by_asc(raw_material_categories::Column::Name);

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(raw_material_categories::Column::Name.like(&keyword));
    }

    let items = select.all(db).await?;
    let res = items
        .into_iter()
        .map(|item| CategoryResponse {
            id: item.id,
            name: item.name,
            created_at: item.created_at,
        })
        .collect();
    Ok(res)
}

pub async fn get_raw_material_category(
    db: &DatabaseConnection,
    id: i32,
) -> Result<CategoryResponse, AppError> {
    let item = RawMaterialCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori bahan baku tidak ditemukan"))?;

    Ok(CategoryResponse {
        id: item.id,
        name: item.name,
        created_at: item.created_at,
    })
}

pub async fn create_raw_material_category(
    db: &DatabaseConnection,
    payload: CategoryRequest,
) -> Result<CategoryResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama kategori tidak boleh kosong"));
    }

    let existing = RawMaterialCategory::find()
        .filter(raw_material_categories::Column::Name.eq(&name))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Nama kategori bahan baku sudah ada"));
    }

    let active_model = raw_material_categories::ActiveModel {
        name: Set(name),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(CategoryResponse {
        id: item.id,
        name: item.name,
        created_at: item.created_at,
    })
}

pub async fn update_raw_material_category(
    db: &DatabaseConnection,
    id: i32,
    payload: CategoryRequest,
) -> Result<CategoryResponse, AppError> {
    payload.validate()?;

    let item = RawMaterialCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori bahan baku tidak ditemukan"))?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama kategori tidak boleh kosong"));
    }

    let existing = RawMaterialCategory::find()
        .filter(raw_material_categories::Column::Name.eq(&name))
        .filter(raw_material_categories::Column::Id.ne(id))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Nama kategori bahan baku sudah ada"));
    }

    let mut active_model: raw_material_categories::ActiveModel = item.into();
    active_model.name = Set(name);

    let updated = active_model.update(db).await?;
    Ok(CategoryResponse {
        id: updated.id,
        name: updated.name,
        created_at: updated.created_at,
    })
}

pub async fn delete_raw_material_category(
    db: &DatabaseConnection,
    id: i32,
) -> Result<(), AppError> {
    let item = RawMaterialCategory::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Kategori bahan baku tidak ditemukan"))?;

    let active_model: raw_material_categories::ActiveModel = item.into();
    active_model.delete(db).await?;
    Ok(())
}
