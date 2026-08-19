use actix_web::{web, HttpResponse};
use validator::Validate;

use crate::dto::{ApiResponse, ParseOrderRequest, ParseOrderResponse};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::ai as ai_service;
use crate::state::AppState;

#[utoipa::path(
    post,
    path = "/api/v1/ai/parse-order",
    request_body = ParseOrderRequest,
    responses(
        (status = 200, description = "Hasil ekstraksi pesanan dengan AI", body = ApiResponse<ParseOrderResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 401, description = "Unauthorized"),
        (status = 503, description = "Service Unavailable / AI API Key missing")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "AI Features"
)]
pub async fn parse_order(
    state: web::Data<AppState>,
    _user: AuthUser,
    body: web::Json<ParseOrderRequest>,
) -> Result<HttpResponse, AppError> {
    let req = body.into_inner();
    req.validate()?;

    let data = ai_service::parse_order(
        &state.db,
        &state.http_client,
        &state.gemini,
        req,
    )
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pesanan berhasil dianalisis dengan AI", data)))
}
