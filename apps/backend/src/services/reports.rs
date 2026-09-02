//! Report & analytics service.
//!
//! Semua agregasi finansial dikerjakan di SQL (SUM/COUNT/GROUP BY) sehingga
//! jumlah baris yang dipindahkan dari database minimal — laporan tetap cepat
//! meskipun volume transaksi tumbuh.

use std::collections::HashMap;

use entity::enums::{OrderStatus, PaymentStatus};
use entity::prelude::*;
use entity::{raw_material_mutations, raw_materials, transaction_items, transactions};
use rust_decimal::Decimal;
use sea_orm::sea_query::Expr;
use sea_orm::sea_query::ExprTrait;
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, FromQueryResult, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect,
};

use crate::dto::{
    DailySalesReportItem, DashboardSummaryResponse, InventoryMutationReportItem, LowStockItem,
    MonthlyReportQuery, MonthlySalesReportItem, ReceivableItem, ReportDateQuery,
    TopProductReportItem,
};
use crate::error::AppError;

/// Neto uang diterima: pay_amount kumulatif dapat mencakup uang yang
/// dikembalikan ke pelanggan, jadi laporan finansial selalu mengurangi change.
const SQL_NET_PAID: &str = "GREATEST(transactions.pay_amount - transactions.change_amount, 0)";
/// True bila transaksi memiliki pelunasan terpisah.
const SQL_HAS_SETTLEMENT: &str =
    "transactions.settlement_pay_amount IS NOT NULL AND transactions.settlement_pay_amount > 0";
const SQL_NOT_BATAL: &str = "transactions.order_status <> 'BATAL'";

/// Porsi pembayaran awal untuk satu metode bayar (sebelum pelunasan).
/// Replikasi logika Rust: bila ada settlement, initial = (net_paid - settle).max(0),
/// selain itu initial = net_paid.
fn sql_initial_bucket(method: &str) -> String {
    format!(
        "COALESCE(SUM(CASE WHEN transactions.payment_method = '{method}' THEN \
        (CASE WHEN {SQL_HAS_SETTLEMENT} THEN GREATEST({SQL_NET_PAID} - transactions.settlement_pay_amount, 0) \
        ELSE {SQL_NET_PAID} END) ELSE 0 END), 0)"
    )
}

/// Porsi pelunasan untuk satu metode bayar. Settlement tanpa metode dianggap CASH.
fn sql_settle_bucket(method: &str) -> String {
    format!(
        "COALESCE(SUM(CASE WHEN {SQL_HAS_SETTLEMENT} \
        AND COALESCE(transactions.settlement_payment_method, 'CASH') = '{method}' \
        THEN transactions.settlement_pay_amount ELSE 0 END), 0)"
    )
}

fn month_index(month_key: &str) -> Option<usize> {
    month_key
        .get(5..7)
        .and_then(|m| m.parse::<usize>().ok())
        .and_then(|m| (1..=12).contains(&m).then(|| m - 1))
}

#[derive(Default, FromQueryResult)]
struct DashboardAggRow {
    total_omset: Decimal,
    total_cash_in: Decimal,
    initial_cash: Decimal,
    initial_qris: Decimal,
    initial_transfer: Decimal,
    settle_cash: Decimal,
    settle_qris: Decimal,
    settle_transfer: Decimal,
    total_piutang: Decimal,
    total_transactions: i64,
    paid_transactions: i64,
    dp_transactions: i64,
    unpaid_transactions: i64,
    active_orders: i64,
    ready_orders: i64,
}

#[derive(FromQueryResult)]
struct MonthlyAggRow {
    month_key: String,
    total_sales: Decimal,
    total_cash_in: Decimal,
    total_transactions: i64,
    initial_cash: Decimal,
    initial_qris: Decimal,
    initial_transfer: Decimal,
    settle_cash: Decimal,
    settle_qris: Decimal,
    settle_transfer: Decimal,
}

#[derive(FromQueryResult)]
struct MonthlyExpenseRow {
    month_key: String,
    total_expenses: Decimal,
}

#[derive(FromQueryResult)]
struct DailyAggRow {
    day_key: String,
    total_sales: Decimal,
    total_transactions: i64,
}

#[derive(FromQueryResult)]
struct TopProductAggRow {
    product_name: String,
    total_qty: i64,
    total_revenue: Decimal,
}

#[derive(FromQueryResult)]
struct MutationAggRow {
    raw_material_id: i32,
    in_qty: Decimal,
    out_qty: Decimal,
}

/// `pay_amount` is cumulative tender and can include cash returned to the
/// customer. Financial reports and receivables must always use the net value.
fn net_paid(t: &transactions::Model) -> Decimal {
    (t.pay_amount - t.change_amount).max(Decimal::ZERO)
}

pub async fn get_dashboard_summary(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<DashboardSummaryResponse, AppError> {
    // Satu query agregat untuk seluruh metrik transaksi (replikasi logika
    // finansial kasir: transaksi batal dikecualikan dari angka finansial).
    let mut trans_query = Transaction::find()
        .select_only()
        .column_as(
            Expr::cust(&format!(
                "COALESCE(SUM(CASE WHEN {SQL_NOT_BATAL} THEN transactions.total_amount ELSE 0 END), 0)"
            )),
            "total_omset",
        )
        .column_as(
            Expr::cust(&format!(
                "COALESCE(SUM(CASE WHEN {SQL_NOT_BATAL} THEN {SQL_NET_PAID} ELSE 0 END), 0)"
            )),
            "total_cash_in",
        )
        .column_as(Expr::cust(&sql_initial_bucket("CASH")), "initial_cash")
        .column_as(Expr::cust(&sql_initial_bucket("QRIS")), "initial_qris")
        .column_as(Expr::cust(&sql_initial_bucket("TRANSFER")), "initial_transfer")
        .column_as(Expr::cust(&sql_settle_bucket("CASH")), "settle_cash")
        .column_as(Expr::cust(&sql_settle_bucket("QRIS")), "settle_qris")
        .column_as(Expr::cust(&sql_settle_bucket("TRANSFER")), "settle_transfer")
        .column_as(
            Expr::cust(&format!(
                "COALESCE(SUM(CASE WHEN {SQL_NOT_BATAL} AND transactions.total_amount > {SQL_NET_PAID} \
                THEN transactions.total_amount - {SQL_NET_PAID} ELSE 0 END), 0)"
            )),
            "total_piutang",
        )
        .column_as(Expr::cust("COUNT(*)"), "total_transactions")
        .column_as(
            Expr::cust(&format!(
                "COUNT(CASE WHEN {SQL_NOT_BATAL} AND transactions.payment_status = 'PAID' THEN 1 END)"
            )),
            "paid_transactions",
        )
        .column_as(
            Expr::cust(&format!(
                "COUNT(CASE WHEN {SQL_NOT_BATAL} AND transactions.payment_status = 'DP' THEN 1 END)"
            )),
            "dp_transactions",
        )
        .column_as(
            Expr::cust(&format!(
                "COUNT(CASE WHEN {SQL_NOT_BATAL} AND transactions.payment_status = 'UNPAID' THEN 1 END)"
            )),
            "unpaid_transactions",
        )
        .column_as(
            Expr::cust(
                "COUNT(CASE WHEN transactions.order_status IN ('ANTRIAN', 'PROSES') THEN 1 END)",
            ),
            "active_orders",
        )
        .column_as(
            Expr::cust("COUNT(CASE WHEN transactions.order_status = 'SELESAI' THEN 1 END)"),
            "ready_orders",
        );

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let agg = trans_query
        .into_model::<DashboardAggRow>()
        .one(db)
        .await?
        .unwrap_or_default();

    // Low stock count
    let low_stock_count = RawMaterial::find()
        .filter(
            sea_orm::sea_query::Expr::col(raw_materials::Column::Stock)
                .sub(sea_orm::sea_query::Expr::col(raw_materials::Column::ReservedStock))
                .lte(sea_orm::sea_query::Expr::col(raw_materials::Column::MinStockWarning)),
        )
        .count(db)
        .await?;

    // Expenses: agregasi SUM di SQL
    let mut exp_query = Expense::find()
        .select_only()
        .column_as(Expr::cust("COALESCE(SUM(expenses.amount), 0)"), "total_expenses");
    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        exp_query = exp_query.filter(entity::expenses::Column::ExpenseDate.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        exp_query = exp_query.filter(entity::expenses::Column::ExpenseDate.lte(end_dt));
    }
    let total_expenses = exp_query
        .into_tuple::<Decimal>()
        .one(db)
        .await?
        .unwrap_or(Decimal::ZERO);

    let net_profit = agg.total_cash_in - total_expenses;

    Ok(DashboardSummaryResponse {
        total_omset: agg.total_omset,
        total_cash_in: agg.total_cash_in,
        total_cash_omset: agg.initial_cash + agg.settle_cash,
        total_qris_omset: agg.initial_qris + agg.settle_qris,
        total_transfer_omset: agg.initial_transfer + agg.settle_transfer,
        total_expenses,
        net_profit,
        total_transactions: agg.total_transactions,
        paid_transactions: agg.paid_transactions,
        dp_transactions: agg.dp_transactions,
        unpaid_transactions: agg.unpaid_transactions,
        total_piutang: agg.total_piutang,
        active_orders: agg.active_orders,
        ready_orders: agg.ready_orders,
        low_stock_raw_materials_count: low_stock_count as i64,
    })
}

pub async fn get_monthly_sales(
    db: &DatabaseConnection,
    query: MonthlyReportQuery,
) -> Result<Vec<MonthlySalesReportItem>, AppError> {
    use chrono::{Datelike, TimeZone, Utc};

    let target_year = query.year.unwrap_or_else(|| chrono::Local::now().year());

    let start_of_year = Utc.with_ymd_and_hms(target_year, 1, 1, 0, 0, 0).unwrap();
    let end_of_year = Utc.with_ymd_and_hms(target_year, 12, 31, 23, 59, 59).unwrap();

    // Transaksi batal tidak masuk laporan bulanan -> difilter di WHERE agar
    // bulan tanpa transaksi valid tidak menghasilkan baris kosong.
    let trans_rows = Transaction::find()
        .select_only()
        .column_as(
            Expr::cust("DATE_FORMAT(transactions.created_at, '%Y-%m')"),
            "month_key",
        )
        .column_as(
            Expr::cust("COALESCE(SUM(transactions.total_amount), 0)"),
            "total_sales",
        )
        .column_as(Expr::cust(&format!("COALESCE(SUM({SQL_NET_PAID}), 0)")), "total_cash_in")
        .column_as(Expr::cust("COUNT(*)"), "total_transactions")
        .column_as(Expr::cust(&sql_initial_bucket("CASH")), "initial_cash")
        .column_as(Expr::cust(&sql_initial_bucket("QRIS")), "initial_qris")
        .column_as(Expr::cust(&sql_initial_bucket("TRANSFER")), "initial_transfer")
        .column_as(Expr::cust(&sql_settle_bucket("CASH")), "settle_cash")
        .column_as(Expr::cust(&sql_settle_bucket("QRIS")), "settle_qris")
        .column_as(Expr::cust(&sql_settle_bucket("TRANSFER")), "settle_transfer")
        .filter(transactions::Column::OrderStatus.ne(OrderStatus::Batal))
        .filter(
            transactions::Column::CreatedAt
                .gte(start_of_year)
                .and(transactions::Column::CreatedAt.lte(end_of_year)),
        )
        .group_by(Expr::cust("DATE_FORMAT(transactions.created_at, '%Y-%m')"))
        .into_model::<MonthlyAggRow>()
        .all(db)
        .await?;

    let exp_rows = Expense::find()
        .select_only()
        .column_as(
            Expr::cust("DATE_FORMAT(expenses.expense_date, '%Y-%m')"),
            "month_key",
        )
        .column_as(Expr::cust("COALESCE(SUM(expenses.amount), 0)"), "total_expenses")
        .filter(
            entity::expenses::Column::ExpenseDate
                .gte(start_of_year)
                .and(entity::expenses::Column::ExpenseDate.lte(end_of_year)),
        )
        .group_by(Expr::cust("DATE_FORMAT(expenses.expense_date, '%Y-%m')"))
        .into_model::<MonthlyExpenseRow>()
        .all(db)
        .await?;

    struct MonthData {
        total_sales: Decimal,
        total_cash_in: Decimal,
        total_expenses: Decimal,
        total_transactions: i64,
        total_cash_omset: Decimal,
        total_qris_omset: Decimal,
        total_transfer_omset: Decimal,
    }

    let mut monthly_data: Vec<MonthData> = (0..12)
        .map(|_| MonthData {
            total_sales: Decimal::ZERO,
            total_cash_in: Decimal::ZERO,
            total_expenses: Decimal::ZERO,
            total_transactions: 0,
            total_cash_omset: Decimal::ZERO,
            total_qris_omset: Decimal::ZERO,
            total_transfer_omset: Decimal::ZERO,
        })
        .collect();

    for row in trans_rows {
        if let Some(m_idx) = month_index(&row.month_key) {
            let d = &mut monthly_data[m_idx];
            d.total_sales += row.total_sales;
            d.total_cash_in += row.total_cash_in;
            d.total_transactions += row.total_transactions;
            d.total_cash_omset += row.initial_cash + row.settle_cash;
            d.total_qris_omset += row.initial_qris + row.settle_qris;
            d.total_transfer_omset += row.initial_transfer + row.settle_transfer;
        }
    }

    for row in exp_rows {
        if let Some(m_idx) = month_index(&row.month_key) {
            monthly_data[m_idx].total_expenses += row.total_expenses;
        }
    }

    let month_names = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];

    let result = (0..12)
        .map(|i| {
            let m_num = i + 1;
            let month_code = format!("{:04}-{:02}", target_year, m_num);
            let d = &monthly_data[i];
            let net_profit = d.total_cash_in - d.total_expenses;

            MonthlySalesReportItem {
                month: month_code,
                month_name: month_names[i].to_string(),
                total_sales: d.total_sales,
                total_cash_in: d.total_cash_in,
                total_expenses: d.total_expenses,
                net_profit,
                total_transactions: d.total_transactions,
                total_cash_omset: d.total_cash_omset,
                total_qris_omset: d.total_qris_omset,
                total_transfer_omset: d.total_transfer_omset,
            }
        })
        .collect();

    Ok(result)
}

pub async fn get_daily_sales(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<DailySalesReportItem>, AppError> {
    let mut trans_query = Transaction::find()
        .select_only()
        .column_as(
            Expr::cust("DATE_FORMAT(transactions.created_at, '%Y-%m-%d')"),
            "day_key",
        )
        .column_as(
            Expr::cust("COALESCE(SUM(transactions.total_amount), 0)"),
            "total_sales",
        )
        .column_as(Expr::cust("COUNT(*)"), "total_transactions")
        .filter(transactions::Column::OrderStatus.ne(OrderStatus::Batal))
        .group_by(Expr::cust("DATE_FORMAT(transactions.created_at, '%Y-%m-%d')"))
        .order_by_asc(Expr::cust("DATE_FORMAT(transactions.created_at, '%Y-%m-%d')"));

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let rows = trans_query.into_model::<DailyAggRow>().all(db).await?;

    Ok(rows
        .into_iter()
        .map(|row| DailySalesReportItem {
            date: row.day_key,
            total_sales: row.total_sales,
            total_transactions: row.total_transactions,
        })
        .collect())
}

pub async fn get_top_products(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<TopProductReportItem>, AppError> {
    let mut trans_query = Transaction::find().select_only().column(transactions::Column::Id);
    trans_query = trans_query.filter(transactions::Column::OrderStatus.ne(OrderStatus::Batal));

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let trans_ids: Vec<i32> = trans_query.into_tuple::<i32>().all(db).await?;
    if trans_ids.is_empty() {
        return Ok(vec![]);
    }

    // Agregasi per produk/variant di SQL; nama ditampilkan gabungan
    // ("Produk (Variant)") agar konsisten dengan format sebelumnya.
    let rows = TransactionItem::find()
        .select_only()
        .column_as(
            Expr::cust(
                "CONCAT(transaction_items.product_name, \
                CASE WHEN transaction_items.variant_name IS NOT NULL \
                THEN CONCAT(' (', transaction_items.variant_name, ')') ELSE '' END)",
            ),
            "product_name",
        )
        .column_as(Expr::cust("CAST(SUM(transaction_items.qty) AS SIGNED)"), "total_qty")
        .column_as(
            Expr::cust("COALESCE(SUM(transaction_items.subtotal), 0)"),
            "total_revenue",
        )
        .filter(transaction_items::Column::TransactionId.is_in(trans_ids))
        .group_by(Expr::cust("transaction_items.product_name, transaction_items.variant_name"))
        .into_model::<TopProductAggRow>()
        .all(db)
        .await?;

    let mut product_map: HashMap<String, (i64, Decimal)> = HashMap::new();
    for row in rows {
        let entry = product_map
            .entry(row.product_name)
            .or_insert((0, Decimal::ZERO));
        entry.0 += row.total_qty;
        entry.1 += row.total_revenue;
    }

    let mut result: Vec<TopProductReportItem> = product_map
        .into_iter()
        .map(|(product_name, (total_qty, total_revenue))| TopProductReportItem {
            product_name,
            total_qty,
            total_revenue,
        })
        .collect();

    result.sort_by(|a, b| b.total_qty.cmp(&a.total_qty));

    Ok(result)
}

pub async fn get_inventory_mutations(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<InventoryMutationReportItem>, AppError> {
    let materials = RawMaterial::find()
        .order_by_asc(raw_materials::Column::Name)
        .all(db)
        .await?;

    // Agregasi mutasi masuk/keluar per bahan langsung di SQL.
    let mut mut_query = RawMaterialMutation::find()
        .select_only()
        .column(raw_material_mutations::Column::RawMaterialId)
        .column_as(
            Expr::cust(
                "COALESCE(SUM(CASE WHEN raw_material_mutations.type = 'IN' \
                THEN raw_material_mutations.qty ELSE 0 END), 0)",
            ),
            "in_qty",
        )
        .column_as(
            Expr::cust(
                "COALESCE(SUM(CASE WHEN raw_material_mutations.type = 'OUT' \
                THEN raw_material_mutations.qty ELSE 0 END), 0)",
            ),
            "out_qty",
        )
        .group_by(raw_material_mutations::Column::RawMaterialId);

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        mut_query = mut_query.filter(raw_material_mutations::Column::CreatedAt.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        mut_query = mut_query.filter(raw_material_mutations::Column::CreatedAt.lte(end_dt));
    }

    let agg_rows: HashMap<i32, MutationAggRow> = mut_query
        .into_model::<MutationAggRow>()
        .all(db)
        .await?
        .into_iter()
        .map(|row| (row.raw_material_id, row))
        .collect();

    let result = materials
        .into_iter()
        .map(|mat| {
            let (in_qty, out_qty) = match agg_rows.get(&mat.id) {
                Some(row) => (row.in_qty, row.out_qty),
                None => (Decimal::ZERO, Decimal::ZERO),
            };
            let full_name = if let Some(ref v) = mat.variant {
                format!("{} ({})", mat.name, v)
            } else {
                mat.name.clone()
            };

            InventoryMutationReportItem {
                raw_material_id: mat.id,
                raw_material_name: full_name,
                in_qty,
                out_qty,
                current_stock: mat.stock,
            }
        })
        .collect();

    Ok(result)
}

pub async fn get_receivables(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<ReceivableItem>, AppError> {
    let mut trans_query = Transaction::find()
        .filter(
            transactions::Column::PaymentStatus
                .eq(PaymentStatus::Dp)
                .or(transactions::Column::PaymentStatus.eq(PaymentStatus::Unpaid)),
        )
        .filter(transactions::Column::OrderStatus.ne(OrderStatus::Batal))
        .order_by_desc(transactions::Column::CreatedAt);

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let all_trans = trans_query.all(db).await?;

    let result = all_trans
        .into_iter()
        .map(|t| {
            let paid = net_paid(&t);
            let remaining = if t.total_amount > paid {
                t.total_amount - paid
            } else {
                Decimal::ZERO
            };
            ReceivableItem {
                id: t.id,
                invoice_number: t.invoice_number,
                customer_name: t.customer_name.unwrap_or_else(|| "Umum".to_string()),
                payment_status: t.payment_status,
                order_status: t.order_status,
                total_amount: t.total_amount,
                pay_amount: paid,
                remaining_amount: remaining,
                estimated_done_at: t.estimated_done_at,
                created_at: t.created_at,
            }
        })
        .collect();

    Ok(result)
}

pub async fn get_low_stock(
    db: &DatabaseConnection,
) -> Result<Vec<LowStockItem>, AppError> {
    use entity::raw_material_categories;

    let materials = RawMaterial::find()
        .filter(
            sea_orm::sea_query::Expr::col(raw_materials::Column::Stock)
                .sub(sea_orm::sea_query::Expr::col(raw_materials::Column::ReservedStock))
                .lte(sea_orm::sea_query::Expr::col(raw_materials::Column::MinStockWarning)),
        )
        .order_by_asc(raw_materials::Column::Name)
        .all(db)
        .await?;

    // Load category names
    let cat_ids: Vec<i32> = materials.iter().filter_map(|m| m.category_id).collect();
    let categories = if !cat_ids.is_empty() {
        RawMaterialCategory::find()
            .filter(raw_material_categories::Column::Id.is_in(cat_ids))
            .all(db)
            .await?
    } else {
        vec![]
    };

    let result = materials
        .into_iter()
        .map(|m| {
            let category_name = m.category_id.and_then(|cid| {
                categories.iter().find(|c| c.id == cid).map(|c| c.name.clone())
            });
            LowStockItem {
                id: m.id,
                name: m.name,
                variant: m.variant,
                unit: m.unit,
                stock: m.stock,
                min_stock_warning: m.min_stock_warning,
                category_name,
            }
        })
        .collect();

    Ok(result)
}