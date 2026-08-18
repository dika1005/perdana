use actix_web::{HttpResponse, web};

use crate::dto::ApiResponse;
use crate::error::AppError;
use crate::services;
use crate::state::AppState;

pub async fn health_check(state: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let data = services::health::check(&state.db).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Backend Actix Web dan SeaORM terhubung",
        data,
    )))
}
