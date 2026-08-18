use sea_orm::DatabaseConnection;

use crate::config::StoreConfig;
use crate::utils::jwt::JwtConfig;

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt: JwtConfig,
    pub store: StoreConfig,
}
