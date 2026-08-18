use entity::enums::RangePriceType;
use entity::prelude::*;
use entity::product_addons;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use validator::Validate;

use crate::dto::{AddonQuery, AddonResponse, CreateAddonRequest, Pagination, PaginationMeta, UpdateAddonRequest};
use crate::error::AppError;

pub fn map_addon(m: &product_addons::Model) -> AddonResponse {
    AddonResponse {
        id: m.id,
        name: m.name.clone(),
        price_type: m.price_type.clone(),
        default_price: m.default_price,
        min_price: m.min_price,
        max_price: m.max_price,
        created_at: m.created_at,
    }
}

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: AddonQuery,
) -> Result<(Vec<AddonResponse>, PaginationMeta), AppError> {
    let mut select = ProductAddon::find().order_by_asc(product_addons::Column::Name);

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(product_addons::Column::Name.like(&keyword));
    }

    let (items, meta) = pagination.fetch(select, db).await?;
    let result = items.iter().map(map_addon).collect();
    Ok((result, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<AddonResponse, AppError> {
    let addon = ProductAddon::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Add-on tidak ditemukan"))?;

    Ok(map_addon(&addon))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateAddonRequest,
) -> Result<AddonResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama add-on tidak boleh kosong"));
    }

    let default_price = payload.default_price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == RangePriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum add-on tidak boleh melebihi harga maksimum"));
    }

    let active_model = product_addons::ActiveModel {
        name: Set(name),
        price_type: Set(payload.price_type),
        default_price: Set(default_price),
        min_price: Set(min_price),
        max_price: Set(max_price),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(map_addon(&item))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateAddonRequest,
) -> Result<AddonResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama add-on tidak boleh kosong"));
    }

    let addon = ProductAddon::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Add-on tidak ditemukan"))?;

    let default_price = payload.default_price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == RangePriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum add-on tidak boleh melebihi harga maksimum"));
    }

    let mut active_model: product_addons::ActiveModel = addon.into();
    active_model.name = Set(name);
    active_model.price_type = Set(payload.price_type);
    active_model.default_price = Set(default_price);
    active_model.min_price = Set(min_price);
    active_model.max_price = Set(max_price);

    let updated = active_model.update(db).await?;
    Ok(map_addon(&updated))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let addon = ProductAddon::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Add-on tidak ditemukan"))?;

    let active_model: product_addons::ActiveModel = addon.into();
    active_model.delete(db).await?;
    Ok(())
}
