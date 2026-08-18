use chrono::{DateTime, Utc};
use entity::enums::UserRole;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct LoginRequest {
    #[validate(length(min = 1, message = "Username wajib diisi"))]
    #[schema(example = "superadmin")]
    pub username: String,
    #[validate(length(min = 1, message = "Password wajib diisi"))]
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate, Default, ToSchema)]
pub struct RefreshRequest {
    #[schema(example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")]
    pub refresh_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PublicUser {
    pub id: i32,
    pub name: String,
    pub username: String,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginData {
    pub token: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
    pub user: PublicUser,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct RefreshData {
    pub token: String,
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: DateTime<Utc>,
}
