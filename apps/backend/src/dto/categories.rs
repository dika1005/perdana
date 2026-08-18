use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CategoryRequest {
    #[validate(length(min = 1, max = 100, message = "Nama kategori harus 1 - 100 karakter"))]
    #[schema(example = "Buku Yasin & Undangan")]
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryResponse {
    pub id: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CategoryQuery {
    pub search: Option<String>,
}
