use actix_web::{HttpResponse, http::header, web};
use chrono::Local;

use crate::error::AppError;
use crate::extractors::SuperAdmin;
use crate::services::backup as backup_service;
use crate::state::AppState;

/// GET /api/v1/backup/export
///
/// Ekspor cadangan database lengkap dalam format SQL dump.
/// Hanya dapat diakses oleh SUPER_ADMIN.
#[utoipa::path(
    get,
    path = "/api/v1/backup/export",
    responses(
        (status = 200, description = "File SQL dump database"),
        (status = 401, description = "Unauthorized / Bukan Super Admin")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Backup"
)]
pub async fn export_backup(
    state: web::Data<AppState>,
    _super_admin: SuperAdmin,
) -> Result<HttpResponse, AppError> {
    let sql_dump = backup_service::export_sql_dump(&state.db).await?;
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("backup_perdana_pos_{}.sql", timestamp);

    Ok(HttpResponse::Ok()
        .insert_header((
            header::CONTENT_TYPE,
            "application/sql; charset=utf-8",
        ))
        .insert_header((
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename),
        ))
        .body(sql_dump))
}
