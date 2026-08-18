use actix_web::{HttpResponse, web};

use crate::dto::{ApiResponse, HealthData};
use crate::error::AppError;
use crate::services;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Status server dan database", body = ApiResponse<HealthData>)
    ),
    tag = "Health"
)]
pub async fn health_check(state: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let data = services::health::check(&state.db).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Backend Actix Web dan SeaORM terhubung",
        data,
    )))
}
