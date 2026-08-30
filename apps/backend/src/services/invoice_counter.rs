use sea_orm::ConnectionTrait;
use sea_orm::DatabaseTransaction;
use sea_orm::Statement;

use crate::error::AppError;

/// Menghasilkan nomor urut harian yang unik dan monoton untuk invoice.
///
/// Cara kerja: menyimpan counter per tanggal (`YYYYMMDD`) di tabel
/// `invoice_counter` dan menaikkannya lewat `UPDATE ... + 1` di dalam
/// transaksi yang sama dengan transaksi penjualan. Karena update dilakukan
/// dalam satu koneksi/transaksi, dua transaksi yang dibuat bersamaan tidak
/// akan pernah mendapat nomor yang sama.
pub async fn next(txn: &DatabaseTransaction, date_str: &str) -> Result<u32, AppError> {
    if !date_str.chars().all(|value| value.is_ascii_digit()) || date_str.len() != 8 {
        return Err(AppError::Internal("Format tanggal counter invoice tidak valid".into()));
    }
    // Pastikan baris counter untuk tanggal ini ada.
    let ensure = Statement::from_string(
        sea_orm::DbBackend::MySql,
        format!(
            "INSERT IGNORE INTO invoice_counter (date_key, last_seq) VALUES ('{date_str}', 0)"
        ),
    );
    txn.execute(ensure).await?;

    let update = Statement::from_string(
        sea_orm::DbBackend::MySql,
        format!(
            "UPDATE invoice_counter SET last_seq = last_seq + 1 WHERE date_key = '{date_str}'"
        ),
    );
    txn.execute(update).await?;

    let select = Statement::from_string(
        sea_orm::DbBackend::MySql,
        format!("SELECT last_seq FROM invoice_counter WHERE date_key = '{date_str}'"),
    );
    let row = txn.query_one(select).await?;
    let seq = match row {
        Some(r) => {
            if let Ok(v) = r.try_get::<i32>("", "last_seq") {
                v as u32
            } else if let Ok(v) = r.try_get::<i64>("", "last_seq") {
                v as u32
            } else if let Ok(v) = r.try_get::<u32>("", "last_seq") {
                v
            } else if let Ok(v) = r.try_get_by_index::<i32>(0) {
                v as u32
            } else if let Ok(v) = r.try_get_by_index::<i64>(0) {
                v as u32
            } else {
                1
            }
        }
        None => 1,
    };

    Ok(seq.max(1))
}

/// Skema tabel (dibuat otomatis di `connect_db` bila belum ada).
pub const CREATE_SQL: &str = "CREATE TABLE IF NOT EXISTS invoice_counter (date_key VARCHAR(12) PRIMARY KEY, last_seq INT NOT NULL DEFAULT 0);";
