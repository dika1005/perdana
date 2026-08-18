use entity::customers;
use entity::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use validator::Validate;

use crate::dto::{
    CreateCustomerRequest, CustomerQuery, CustomerResponse, Pagination, PaginationMeta,
    UpdateCustomerRequest,
};
use crate::error::AppError;

pub fn map_customer(m: &customers::Model) -> CustomerResponse {
    CustomerResponse {
        id: m.id,
        name: m.name.clone(),
        phone: m.phone.clone(),
        address: m.address.clone(),
        created_at: m.created_at,
    }
}

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: CustomerQuery,
) -> Result<(Vec<CustomerResponse>, PaginationMeta), AppError> {
    let mut select = Customer::find().order_by_asc(customers::Column::Name);

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(
            customers::Column::Name
                .like(&keyword)
                .or(customers::Column::Phone.like(&keyword)),
        );
    }

    let (items, meta) = pagination.fetch(select, db).await?;
    let result = items.iter().map(map_customer).collect();
    Ok((result, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<CustomerResponse, AppError> {
    let item = Customer::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Pelanggan tidak ditemukan"))?;

    Ok(map_customer(&item))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateCustomerRequest,
) -> Result<CustomerResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama pelanggan tidak boleh kosong"));
    }

    let active_model = customers::ActiveModel {
        name: Set(name),
        phone: Set(payload.phone.map(|p| p.trim().to_string())),
        address: Set(payload.address.map(|a| a.trim().to_string())),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(map_customer(&item))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateCustomerRequest,
) -> Result<CustomerResponse, AppError> {
    payload.validate()?;

    let item = Customer::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Pelanggan tidak ditemukan"))?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama pelanggan tidak boleh kosong"));
    }

    let mut active_model: customers::ActiveModel = item.into();
    active_model.name = Set(name);
    active_model.phone = Set(payload.phone.map(|p| p.trim().to_string()));
    active_model.address = Set(payload.address.map(|a| a.trim().to_string()));

    let updated = active_model.update(db).await?;
    Ok(map_customer(&updated))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let item = Customer::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Pelanggan tidak ditemukan"))?;

    let active_model: customers::ActiveModel = item.into();
    active_model.delete(db).await?;
    Ok(())
}
