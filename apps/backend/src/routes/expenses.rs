use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateExpenseRequest, ExpenseQuery, ExpenseResponse, ExpenseSummaryResponse,
    ListResponse, MessageData, Pagination, UpdateExpenseRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
use crate::services::expenses as expense_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/expenses",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("category" = Option<String>, Query, description = "Filter kategori pengeluaran"),
        ("payment_method" = Option<String>, Query, description = "Filter metode bayar (CASH / TRANSFER)"),
        ("search" = Option<String>, Query, description = "Cari judul / catatan"),
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Daftar pengeluaran", body = ListResponse<ExpenseResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<ExpenseQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) = expense_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar pengeluaran", data, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/expenses/summary",
    params(
        ("start_date" = Option<String>, Query, description = "Awal periode (YYYY-MM-DD)"),
        ("end_date" = Option<String>, Query, description = "Akhir periode (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Ringkasan pengeluaran toko", body = ApiResponse<ExpenseSummaryResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn summary(
    state: web::Data<AppState>,
    _user: AuthUser,
    query: web::Query<ExpenseQuery>,
) -> Result<HttpResponse, AppError> {
    let data = expense_service::get_summary(&state.db, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Ringkasan pengeluaran", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/expenses/{id}",
    params(
        ("id" = i32, Path, description = "ID Pengeluaran")
    ),
    responses(
        (status = 200, description = "Detail pengeluaran", body = ApiResponse<ExpenseResponse>),
        (status = 404, description = "Pengeluaran tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    let data = expense_service::get_by_id(&state.db, id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail pengeluaran", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/expenses",
    request_body = CreateExpenseRequest,
    responses(
        (status = 201, description = "Pengeluaran berhasil dicatat", body = ApiResponse<ExpenseResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn create(
    state: web::Data<AppState>,
    user: AuthUser,
    body: web::Json<CreateExpenseRequest>,
) -> Result<HttpResponse, AppError> {
    let data = expense_service::create(&state.db, user.id, body.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Pengeluaran berhasil dicatat", data)))
}

#[utoipa::path(
    put,
    path = "/api/v1/expenses/{id}",
    params(
        ("id" = i32, Path, description = "ID Pengeluaran")
    ),
    request_body = UpdateExpenseRequest,
    responses(
        (status = 200, description = "Pengeluaran berhasil diperbarui", body = ApiResponse<ExpenseResponse>),
        (status = 400, description = "Validasi gagal"),
        (status = 404, description = "Pengeluaran tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn update(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    body: web::Json<UpdateExpenseRequest>,
) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    let data = expense_service::update(&state.db, id, body.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pengeluaran berhasil diperbarui", data)))
}

#[utoipa::path(
    delete,
    path = "/api/v1/expenses/{id}",
    params(
        ("id" = i32, Path, description = "ID Pengeluaran")
    ),
    responses(
        (status = 200, description = "Pengeluaran berhasil dihapus (Super Admin only)", body = ApiResponse<MessageData>),
        (status = 403, description = "Forbidden (Super Admin only)"),
        (status = 404, description = "Pengeluaran tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "Expenses"
)]
pub async fn delete(
    state: web::Data<AppState>,
    _admin: SuperAdmin,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    expense_service::delete(&state.db, id).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok(
        "Pengeluaran berhasil dihapus",
        MessageData { ok: true },
    )))
}


pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/expenses")
            .route("", web::get().to(list))
            .route("", web::post().to(create))
            .route("/summary", web::get().to(summary))
            .route("/{id}", web::get().to(get))
            .route("/{id}", web::put().to(update))
            .route("/{id}", web::delete().to(delete)),
    );
}
