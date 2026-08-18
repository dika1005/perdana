use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateTransactionRequest, InvoicePrintData, ListResponse, Pagination,
    TransactionQuery, TransactionResponse, UpdateOrderStatusRequest, UpdatePaymentRequest,
};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::transactions as transaction_service;
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/v1/transactions",
    params(
        ("page" = Option<u64>, Query, description = "Halaman ke-n"),
        ("per_page" = Option<u64>, Query, description = "Jumlah data per halaman"),
        ("search" = Option<String>, Query, description = "Cari nomor invoice atau nama pelanggan"),
        ("date" = Option<String>, Query, description = "Filter tanggal (YYYY-MM-DD)"),
        ("payment_status" = Option<String>, Query, description = "Filter status bayar (PAID, DP, UNPAID)"),
        ("order_status" = Option<String>, Query, description = "Filter status pengerjaan (ANTRIAN, PROSES, SELESAI, DIAMBIL)")
    ),
    responses(
        (status = 200, description = "Daftar riwayat transaksi POS", body = ListResponse<TransactionResponse>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn list(
    state: web::Data<AppState>,
    _user: AuthUser,
    pagination: Pagination,
    query: web::Query<TransactionQuery>,
) -> Result<HttpResponse, AppError> {
    let (data, meta) =
        transaction_service::list(&state.db, &pagination, query.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ListResponse::ok("Daftar transaksi", data, meta)))
}

#[utoipa::path(
    get,
    path = "/api/v1/transactions/{id}",
    params(
        ("id" = i32, Path, description = "ID Transaksi")
    ),
    responses(
        (status = 200, description = "Detail lengkap transaksi dengan item dan add-on", body = ApiResponse<TransactionResponse>),
        (status = 404, description = "Transaksi tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail transaksi", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/transactions",
    request_body = CreateTransactionRequest,
    responses(
        (status = 201, description = "Transaksi kasir berhasil dibuat", body = ApiResponse<TransactionResponse>),
        (status = 400, description = "Validasi gagal / harga range di luar batas / kuantitas kurang dari minimum order")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn create(
    state: web::Data<AppState>,
    user: AuthUser,
    payload: web::Json<CreateTransactionRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::create(&state.db, user.id, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Transaksi berhasil dibuat", data)))
}

#[utoipa::path(
    patch,
    path = "/api/v1/transactions/{id}/status",
    params(
        ("id" = i32, Path, description = "ID Transaksi")
    ),
    request_body = UpdateOrderStatusRequest,
    responses(
        (status = 200, description = "Status tracking pengerjaan berhasil diperbarui", body = ApiResponse<TransactionResponse>),
        (status = 404, description = "Transaksi tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn update_status(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<UpdateOrderStatusRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::update_status(
        &state.db,
        path.into_inner(),
        payload.order_status.clone(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Status order berhasil diperbarui", data)))
}

#[utoipa::path(
    patch,
    path = "/api/v1/transactions/{id}/payment",
    params(
        ("id" = i32, Path, description = "ID Transaksi")
    ),
    request_body = UpdatePaymentRequest,
    responses(
        (status = 200, description = "Pembayaran / pelunasan DP berhasil diperbarui", body = ApiResponse<TransactionResponse>),
        (status = 404, description = "Transaksi tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn update_payment(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<UpdatePaymentRequest>,
) -> Result<HttpResponse, AppError> {
    let data =
        transaction_service::update_payment(&state.db, path.into_inner(), payload.into_inner())
            .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pembayaran berhasil diperbarui", data)))
}

#[utoipa::path(
    get,
    path = "/api/v1/transactions/{id}/invoice",
    params(
        ("id" = i32, Path, description = "ID Transaksi")
    ),
    responses(
        (status = 200, description = "Data format invoice cetak struk thermal", body = ApiResponse<InvoicePrintData>),
        (status = 404, description = "Transaksi tidak ditemukan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn get_invoice(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::get_invoice_data(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data invoice siap cetak", data)))
}
