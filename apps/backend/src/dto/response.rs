use serde::Serialize;
use utoipa::ToSchema;

use super::pagination::PaginationMeta;

#[derive(Debug, Serialize, ToSchema)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub message: String,
    pub data: T,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(message: impl Into<String>, data: T) -> Self {
        Self {
            success: true,
            message: message.into(),
            data,
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ListResponse<T: Serialize> {
    pub success: bool,
    pub message: String,
    pub data: Vec<T>,
    pub meta: PaginationMeta,
}

impl<T: Serialize> ListResponse<T> {
    pub fn ok(message: impl Into<String>, data: Vec<T>, meta: PaginationMeta) -> Self {
        Self {
            success: true,
            message: message.into(),
            data,
            meta,
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthData {
    pub status: &'static str,
    pub database: &'static str,
    pub user_count: u64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MessageData {
    pub ok: bool,
}
