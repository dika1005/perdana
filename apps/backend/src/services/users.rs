use entity::enums::UserRole;
use entity::prelude::*;
use entity::users;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};
use validator::Validate;

use super::auth::public_user;
use crate::dto::{
    CreateUserRequest, Pagination, PaginationMeta, PublicUser, ResetPasswordRequest,
    UpdateUserRequest, UserQuery,
};
use crate::error::AppError;
use crate::utils::password::{hash_password, validate_new_password};

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: UserQuery,
) -> Result<(Vec<PublicUser>, PaginationMeta), AppError> {
    let mut select = User::find().order_by_desc(users::Column::Id);

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(
            users::Column::Name
                .like(&keyword)
                .or(users::Column::Username.like(&keyword)),
        );
    }

    if let Some(role) = query.role {
        select = select.filter(users::Column::Role.eq(role));
    }

    let (items, meta) = pagination.fetch(select, db).await?;
    let users = items.iter().map(public_user).collect();
    Ok((users, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<PublicUser, AppError> {
    let user = User::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("User tidak ditemukan"))?;

    Ok(public_user(&user))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateUserRequest,
) -> Result<PublicUser, AppError> {
    payload.validate()?;
    validate_new_password(&payload.password)?;

    let username = payload.username.trim().to_lowercase();
    let existing = User::find()
        .filter(users::Column::Username.eq(&username))
        .one(db)
        .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Username sudah digunakan"));
    }

    let password_hash = hash_password(&payload.password)?;
    let active_model = users::ActiveModel {
        name: Set(payload.name.trim().to_string()),
        username: Set(username),
        password_hash: Set(password_hash),
        role: Set(payload.role),
        is_active: Set(true),
        ..Default::default()
    };

    let user = active_model.insert(db).await?;
    Ok(public_user(&user))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    current_user_id: i32,
    payload: UpdateUserRequest,
) -> Result<PublicUser, AppError> {
    payload.validate()?;

    let user = User::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("User tidak ditemukan"))?;

    if id == current_user_id {
        if payload.is_active == Some(false) {
            return Err(AppError::conflict(
                "Tidak dapat menonaktifkan akun sendiri yang sedang login",
            ));
        }
        if payload.role != UserRole::SuperAdmin {
            return Err(AppError::conflict(
                "Tidak dapat mengubah role akun sendiri yang sedang login",
            ));
        }
    }

    let mut active_model: users::ActiveModel = user.into();
    active_model.name = Set(payload.name.trim().to_string());
    active_model.role = Set(payload.role);
    if let Some(is_active) = payload.is_active {
        active_model.is_active = Set(is_active);
    }

    let updated = active_model.update(db).await?;
    Ok(public_user(&updated))
}

pub async fn reset_password(
    db: &DatabaseConnection,
    id: i32,
    payload: ResetPasswordRequest,
) -> Result<(), AppError> {
    payload.validate()?;
    validate_new_password(&payload.password)?;

    let user = User::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("User tidak ditemukan"))?;

    let password_hash = hash_password(&payload.password)?;
    let mut active_model: users::ActiveModel = user.into();
    active_model.password_hash = Set(password_hash);
    active_model.update(db).await?;

    Ok(())
}

pub async fn deactivate(
    db: &DatabaseConnection,
    id: i32,
    current_user_id: i32,
) -> Result<(), AppError> {
    if id == current_user_id {
        return Err(AppError::conflict(
            "Tidak dapat menonaktifkan akun sendiri yang sedang login",
        ));
    }

    let user = User::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("User tidak ditemukan"))?;

    let mut active_model: users::ActiveModel = user.into();
    active_model.is_active = Set(false);
    active_model.update(db).await?;

    Ok(())
}
