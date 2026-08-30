use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CancelTransactionRequest, CreateTransactionRequest, InvoicePrintData, ListResponse,
    Pagination, RecordReworkRequest, RecordWasteRequest, RefundPaymentRequest,
    SettleTransactionRequest, TransactionQuery, TransactionResponse, UpdateOrderStatusRequest,
    UpdatePaymentRequest,
};
use crate::error::AppError;
use crate::extractors::{AuthUser, SuperAdmin};
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
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<UpdateOrderStatusRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::update_status_as(
        &state.db,
        Some(user.id),
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
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<UpdatePaymentRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::update_payment_as(
        &state.db,
        Some(user.id),
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pembayaran berhasil diperbarui", data)))
}

pub async fn settle(
    state: web::Data<AppState>,
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<SettleTransactionRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::settle_as(
        &state.db,
        Some(user.id),
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pelunasan berhasil", data)))
}

#[utoipa::path(
    post,
    path = "/api/v1/transactions/{id}/cancel",
    params(
        ("id" = i32, Path, description = "ID Transaksi")
    ),
    responses(
        (status = 200, description = "Transaksi dibatalkan & stok bahan dikembalikan", body = ApiResponse<TransactionResponse>),
        (status = 404, description = "Transaksi tidak ditemukan"),
        (status = 409, description = "Tidak dapat membatalkan transaksi yang sudah diambil / sudah dibatalkan")
    ),
    security(
        ("bearer_auth" = []),
        ("cookie_auth" = [])
    ),
    tag = "POS Transactions"
)]
pub async fn cancel(
    state: web::Data<AppState>,
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<CancelTransactionRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::cancel_as(
        &state.db,
        Some(user.id),
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Transaksi berhasil dibatalkan", data)))
}

/// Catat bahan rusak/reject. Stok tidak dipotong dua kali karena konsumsi
/// fisiknya sudah terjadi saat order memasuki PROSES.
pub async fn record_waste(
    state: web::Data<AppState>,
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<RecordWasteRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::record_waste_as(
        &state.db,
        user.id,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Waste produksi berhasil dicatat", data)))
}

/// Catat konsumsi bahan tambahan untuk cetak ulang/rework.
pub async fn record_rework(
    state: web::Data<AppState>,
    user: AuthUser,
    path: web::Path<i32>,
    payload: web::Json<RecordReworkRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::record_rework_as(
        &state.db,
        user.id,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Pemakaian bahan rework berhasil dicatat", data)))
}

/// Refund adalah tindakan finansial sensitif dan hanya dapat dilakukan owner.
pub async fn refund_payment(
    state: web::Data<AppState>,
    admin: SuperAdmin,
    path: web::Path<i32>,
    payload: web::Json<RefundPaymentRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::refund_payment_as(
        &state.db,
        admin.id,
        path.into_inner(),
        payload.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Refund pembayaran berhasil dicatat", data)))
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
    let data =
        transaction_service::get_invoice_data(&state.db, &state.store, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data invoice siap cetak", data)))
}
