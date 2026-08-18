use crate::dto::HealthData;
use crate::error::AppError;
use entity::prelude::*;
use sea_orm::{DatabaseConnection, EntityTrait, PaginatorTrait};

pub async fn check(db: &DatabaseConnection) -> Result<HealthData, AppError> {
    db.ping()
        .await
        .map_err(|_| AppError::ServiceUnavailable("Database tidak tersedia".into()))?;
    let user_count = User::find().count(db).await?;

    Ok(HealthData {
        status: "ok",
        database: "connected",
        user_count,
    })
}
