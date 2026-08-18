use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateCustomerRequest {
    #[validate(length(min = 1, max = 100, message = "Nama pelanggan harus 1 - 100 karakter"))]
    #[schema(example = "Haji Ahmad")]
    pub name: String,
    #[schema(example = "081234567890")]
    pub phone: Option<String>,
    #[schema(example = "Jl. Merdeka No. 45, Jakarta")]
    pub address: Option<String>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateCustomerRequest {
    #[validate(length(min = 1, max = 100, message = "Nama pelanggan harus 1 - 100 karakter"))]
    #[schema(example = "Haji Ahmad S.")]
    pub name: String,
    #[schema(example = "081234567890")]
    pub phone: Option<String>,
    #[schema(example = "Jl. Merdeka No. 45, Jakarta")]
    pub address: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CustomerQuery {
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CustomerResponse {
    pub id: i32,
    pub name: String,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub created_at: DateTime<Utc>,
}
