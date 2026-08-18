use entity::enums::UserRole;
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 1, max = 100, message = "Nama harus 1 - 100 karakter"))]
    pub name: String,
    #[validate(length(min = 3, max = 50, message = "Username harus 3 - 50 karakter"))]
    pub username: String,
    #[validate(length(min = 8, message = "Password minimal 8 karakter"))]
    pub password: String,
    pub role: UserRole,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100, message = "Nama harus 1 - 100 karakter"))]
    pub name: String,
    pub role: UserRole,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordRequest {
    #[validate(length(min = 8, message = "Password baru minimal 8 karakter"))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub search: Option<String>,
    pub role: Option<UserRole>,
}
