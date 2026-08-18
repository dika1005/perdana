use std::future::{Future, Ready, ready};
use std::pin::Pin;

use actix_web::dev::Payload;
use actix_web::{FromRequest, HttpRequest};
use entity::enums::UserRole;
use entity::prelude::*;
use entity::users;
use sea_orm::EntityTrait;

use crate::dto::{Pagination, PaginationQuery};
use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: i32,
    pub name: String,
    pub username: String,
    pub role: UserRole,
}

impl AuthUser {
    pub fn is_super_admin(&self) -> bool {
        self.role.is_super_admin()
    }
}

impl From<&users::Model> for AuthUser {
    fn from(user: &users::Model) -> Self {
        Self {
            id: user.id,
            name: user.name.clone(),
            username: user.username.clone(),
            role: user.role.clone(),
        }
    }
}

impl FromRequest for AuthUser {
    type Error = AppError;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let state = req
                .app_data::<actix_web::web::Data<AppState>>()
                .cloned()
                .ok_or_else(|| AppError::Internal("App state tidak tersedia".into()))?;

            let token = extract_token(&req)?;
            let claims = state.jwt.decode_access(&token)?;
            let user_id = claims.user_id()?;

            let user = User::find_by_id(user_id)
                .one(&state.db)
                .await?
                .ok_or_else(AppError::unauthorized)?;

            if !user.is_active {
                return Err(AppError::Unauthorized(
                    "Akun dinonaktifkan. Hubungi Super Admin.".into(),
                ));
            }

            Ok(AuthUser::from(&user))
        })
    }
}

#[derive(Debug, Clone)]
pub struct SuperAdmin(pub AuthUser);

impl std::ops::Deref for SuperAdmin {
    type Target = AuthUser;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl FromRequest for SuperAdmin {
    type Error = AppError;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let user_fut = AuthUser::from_request(req, payload);
        Box::pin(async move {
            let user = user_fut.await?;
            if !user.is_super_admin() {
                return Err(AppError::forbidden());
            }
            Ok(SuperAdmin(user))
        })
    }
}

impl FromRequest for Pagination {
    type Error = AppError;
    type Future = Ready<Result<Self, AppError>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        match actix_web::web::Query::<PaginationQuery>::from_query(req.query_string()) {
            Ok(query) => ready(Ok(query.into_inner().sanitize())),
            Err(_) => ready(Err(AppError::field(
                "page",
                "Query page/per_page tidak valid",
            ))),
        }
    }
}

fn extract_token(req: &HttpRequest) -> Result<String, AppError> {
    // 1. Try Bearer header
    if let Some(header) = req
        .headers()
        .get(actix_web::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
    {
        if let Some(token) = header.strip_prefix("Bearer ").map(str::trim) {
            if !token.is_empty() {
                return Ok(token.to_string());
            }
        }
    }

    // 2. Try Cookie "access_token"
    if let Some(cookie) = req.cookie("access_token") {
        let val = cookie.value().trim();
        if !val.is_empty() {
            return Ok(val.to_string());
        }
    }

    Err(AppError::unauthorized())
}
