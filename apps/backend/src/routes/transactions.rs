use actix_web::{HttpResponse, web};

use crate::dto::{
    ApiResponse, CreateTransactionRequest, ListResponse, Pagination, TransactionQuery,
    UpdateOrderStatusRequest, UpdatePaymentRequest,
};
use crate::error::AppError;
use crate::extractors::AuthUser;
use crate::services::transactions as transaction_service;
use crate::state::AppState;

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

pub async fn get(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::get_by_id(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Detail transaksi", data)))
}

pub async fn create(
    state: web::Data<AppState>,
    user: AuthUser,
    payload: web::Json<CreateTransactionRequest>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::create(&state.db, user.id, payload.into_inner()).await?;
    Ok(HttpResponse::Created().json(ApiResponse::ok("Transaksi berhasil dibuat", data)))
}

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

pub async fn get_invoice(
    state: web::Data<AppState>,
    _user: AuthUser,
    path: web::Path<i32>,
) -> Result<HttpResponse, AppError> {
    let data = transaction_service::get_invoice_data(&state.db, path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(ApiResponse::ok("Data invoice siap cetak", data)))
}
