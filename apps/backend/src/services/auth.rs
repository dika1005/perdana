use entity::prelude::*;
use entity::users;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use validator::Validate;

use crate::config::SeedConfig;
use crate::dto::{LoginData, LoginRequest, PublicUser, RefreshData};
use crate::error::AppError;
use crate::utils::jwt::JwtConfig;
use crate::utils::password::{dummy_verify, hash_password, validate_new_password, verify_password};

pub async fn seed_super_admin(db: &DatabaseConnection, seed: &SeedConfig) -> Result<(), AppError> {
    validate_new_password(&seed.password)?;

    let existing = User::find()
        .filter(users::Column::Username.eq(&seed.username))
        .one(db)
        .await?;

    if existing.is_some() {
        log::info!("Seed Super Admin dilewati, username `{}` sudah ada", seed.username);
        return Ok(());
    }

    let model = users::ActiveModel {
        name: Set(seed.name.clone()),
        username: Set(seed.username.clone()),
        password_hash: Set(hash_password(&seed.password)?),
        role: Set(entity::enums::UserRole::SuperAdmin),
        is_active: Set(true),
        ..Default::default()
    };
    model.insert(db).await?;
    log::info!("Seed Super Admin `{}` berhasil dibuat", seed.username);
    Ok(())
}

pub async fn login(
    db: &DatabaseConnection,
    jwt: &JwtConfig,
    payload: LoginRequest,
) -> Result<LoginData, AppError> {
    payload.validate()?;

    let user = User::find()
        .filter(users::Column::Username.eq(payload.username.trim()))
        .one(db)
        .await?;

    let Some(user) = user else {
        dummy_verify(&payload.password);
        return Err(AppError::Unauthorized("Username atau password salah".into()));
    };

    if !verify_password(&payload.password, &user.password_hash) {
        return Err(AppError::Unauthorized("Username atau password salah".into()));
    }

    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Akun dinonaktifkan. Hubungi Super Admin.".into(),
        ));
    }

    issue_tokens(jwt, &user)
}

pub async fn refresh(
    db: &DatabaseConnection,
    jwt: &JwtConfig,
    refresh_token: &str,
) -> Result<RefreshData, AppError> {
    let claims = jwt.decode_refresh(refresh_token)?;
    let user_id = claims.user_id()?;
    let user = User::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or_else(AppError::unauthorized)?;

    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Akun dinonaktifkan. Hubungi Super Admin.".into(),
        ));
    }

    let (token, expires_at) = jwt.issue_access(user.id, user.role.as_str())?;
    let refresh_token = jwt.issue_refresh(user.id, user.role.as_str())?;
    Ok(RefreshData {
        token: token.clone(),
        access_token: token,
        refresh_token,
        expires_at,
    })
}

pub fn public_user(user: &users::Model) -> PublicUser {
    PublicUser {
        id: user.id,
        name: user.name.clone(),
        username: user.username.clone(),
        role: user.role.clone(),
        is_active: user.is_active,
        created_at: user.created_at,
    }
}

fn issue_tokens(jwt: &JwtConfig, user: &users::Model) -> Result<LoginData, AppError> {
    let (token, expires_at) = jwt.issue_access(user.id, user.role.as_str())?;
    let refresh_token = jwt.issue_refresh(user.id, user.role.as_str())?;
    Ok(LoginData {
        token: token.clone(),
        access_token: token,
        refresh_token,
        expires_at,
        user: public_user(user),
    })
}

pub async fn me(db: &DatabaseConnection, user_id: i32) -> Result<PublicUser, AppError> {
    let user = User::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("User tidak ditemukan"))?;

    if !user.is_active {
        return Err(AppError::Unauthorized(
            "Akun dinonaktifkan. Hubungi Super Admin.".into(),
        ));
    }

    Ok(public_user(&user))
}
