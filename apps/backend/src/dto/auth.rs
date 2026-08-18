use chrono::{DateTime, Utc};
use entity::enums::UserRole;
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1, message = "Username wajib diisi"))]
    pub username: String,
    #[validate(length(min = 1, message = "Password wajib diisi"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RefreshRequest {
    #[validate(length(min = 1, message = "Refresh token wajib diisi"))]
    pub refresh_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: i32,
    pub name: String,
    pub username: String,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LoginData {
    pub token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
    pub user: PublicUser,
}

#[derive(Debug, Serialize)]
pub struct RefreshData {
    pub token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
}
