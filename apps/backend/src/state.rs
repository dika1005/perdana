use sea_orm::DatabaseConnection;

use crate::config::{GeminiConfig, StoreConfig};
use crate::utils::jwt::JwtConfig;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt: JwtConfig,
    pub store: StoreConfig,
    pub gemini: GeminiConfig,
    pub http_client: reqwest::Client,
}

