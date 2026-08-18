use chrono::{DateTime, Utc};
use entity::enums::MutationType;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

// ==========================================
// RAW MATERIAL REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateRawMaterialRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama bahan baku harus 1 - 150 karakter"))]
    #[schema(example = "Kertas Art Paper 260gr")]
    pub name: String,
    #[schema(example = "A3+")]
    pub variant: Option<String>,
    #[schema(example = "lembar")]
    pub unit: Option<String>,
    #[schema(example = 100)]
    pub stock: Option<i32>,
    #[schema(example = 20)]
    pub min_stock_warning: Option<i32>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateRawMaterialRequest {
    #[schema(example = 1)]
    pub category_id: Option<i32>,
    #[validate(length(min = 1, max = 150, message = "Nama bahan baku harus 1 - 150 karakter"))]
    #[schema(example = "Kertas Art Paper 260gr")]
    pub name: String,
    #[schema(example = "A3+")]
    pub variant: Option<String>,
    #[schema(example = "lembar")]
    pub unit: Option<String>,
    #[schema(example = 25)]
    pub min_stock_warning: Option<i32>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RawMaterialQuery {
    pub category_id: Option<i32>,
    pub search: Option<String>,
    pub low_stock: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawMaterialResponse {
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub variant: Option<String>,
    pub unit: String,
    pub stock: i32,
    pub min_stock_warning: i32,
    pub is_low_stock: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ==========================================
// MUTATION REQUESTS & RESPONSES
// ==========================================

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateMutationRequest {
    #[schema(example = 1)]
    pub raw_material_id: i32,
    #[serde(rename = "type", alias = "mutation_type")]
    pub mutation_type: MutationType,
    #[validate(range(min = 1, message = "Kuantitas mutasi minimal 1"))]
    #[schema(example = 50)]
    pub qty: i32,
    #[schema(example = "Kulakan dari distributor kertas")]
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MutationResponse {
    pub id: i32,
    pub raw_material_id: i32,
    #[serde(rename = "type")]
    pub mutation_type: MutationType,
    pub qty: i32,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}
