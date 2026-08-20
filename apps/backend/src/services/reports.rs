use std::collections::HashMap;

use entity::enums::{MutationType, OrderStatus, PaymentStatus};
use entity::prelude::*;
use entity::{raw_material_mutations, raw_materials, transaction_items, transactions};
use rust_decimal::Decimal;
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
    QuerySelect,
};

use crate::dto::{
    DailySalesReportItem, DashboardSummaryResponse, InventoryMutationReportItem, LowStockItem,
    ReceivableItem, ReportDateQuery, TopProductReportItem,
};
use crate::error::AppError;

pub async fn get_dashboard_summary(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<DashboardSummaryResponse, AppError> {
    let mut trans_query = Transaction::find();

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let all_trans = trans_query.all(db).await?;

    let mut total_omset = Decimal::ZERO;
    let mut total_piutang = Decimal::ZERO;
    let mut paid_count = 0;
    let mut dp_count = 0;
    let mut unpaid_count = 0;
    let mut active_orders = 0;
    let mut ready_orders = 0;

    for t in &all_trans {
        total_omset += t.pay_amount;

        if t.total_amount > t.pay_amount {
            total_piutang += t.total_amount - t.pay_amount;
        }

        match t.payment_status {
            PaymentStatus::Paid => paid_count += 1,
            PaymentStatus::Dp => dp_count += 1,
            PaymentStatus::Unpaid => unpaid_count += 1,
        }

        match t.order_status {
            OrderStatus::Antrian | OrderStatus::Proses => active_orders += 1,
            OrderStatus::Selesai => ready_orders += 1,
            OrderStatus::Diambil => {}
        }
    }

    // Low stock count
    let low_stock_count = RawMaterial::find()
        .filter(
            sea_orm::sea_query::Expr::col(raw_materials::Column::Stock)
                .lte(sea_orm::sea_query::Expr::col(raw_materials::Column::MinStockWarning)),
        )
        .count(db)
        .await?;

    // Expenses query
    let mut exp_query = Expense::find();
    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        exp_query = exp_query.filter(entity::expenses::Column::ExpenseDate.gte(start_dt));
    }
    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        exp_query = exp_query.filter(entity::expenses::Column::ExpenseDate.lte(end_dt));
    }

    let all_expenses = exp_query.all(db).await?;
    let mut total_expenses = Decimal::ZERO;
    for e in all_expenses {
        total_expenses += e.amount;
    }

    let net_profit = total_omset - total_expenses;

    Ok(DashboardSummaryResponse {
        total_omset,
        total_expenses,
        net_profit,
        total_transactions: all_trans.len() as i64,
        paid_transactions: paid_count,
        dp_transactions: dp_count,
        unpaid_transactions: unpaid_count,
        total_piutang,
        active_orders,
        ready_orders,
        low_stock_raw_materials_count: low_stock_count as i64,
    })
}


pub async fn get_daily_sales(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<DailySalesReportItem>, AppError> {
    let mut trans_query = Transaction::find().order_by_asc(transactions::Column::CreatedAt);

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let all_trans = trans_query.all(db).await?;

    let mut daily_map: HashMap<String, (Decimal, i64)> = HashMap::new();
    let mut ordered_dates = Vec::new();

    for t in all_trans {
        let date_key = t.created_at.format("%Y-%m-%d").to_string();
        let entry = daily_map.entry(date_key.clone()).or_insert_with(|| {
            ordered_dates.push(date_key.clone());
            (Decimal::ZERO, 0)
        });
        entry.0 += t.total_amount;
        entry.1 += 1;
    }

    let result = ordered_dates
        .into_iter()
        .map(|date| {
            let (total_sales, count) = daily_map.get(&date).cloned().unwrap_or((Decimal::ZERO, 0));
            DailySalesReportItem {
                date,
                total_sales,
                total_transactions: count,
            }
        })
        .collect();

    Ok(result)
}

pub async fn get_top_products(
    db: &DatabaseConnection,
    query: ReportDateQuery,
) -> Result<Vec<TopProductReportItem>, AppError> {
    let mut trans_query = Transaction::find().select_only().column(transactions::Column::Id);

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        trans_query = trans_query.filter(transactions::Column::CreatedAt.lte(end_dt));
    }

    let trans_ids: Vec<i32> = trans_query
        .into_tuple::<i32>()
        .all(db)
        .await?;

    if trans_ids.is_empty() {
        return Ok(vec![]);
    }

    let items = TransactionItem::find()
        .filter(transaction_items::Column::TransactionId.is_in(trans_ids))
        .all(db)
        .await?;

    let mut product_map: HashMap<String, (i64, Decimal)> = HashMap::new();

    for item in items {
        let name = if let Some(v_name) = item.variant_name {
            format!("{} ({})", item.product_name, v_name)
        } else {
            item.product_name
        };

        let entry = product_map
            .entry(name)
            .or_insert((0, Decimal::ZERO));
        entry.0 += item.qty as i64;
        entry.1 += item.subtotal;
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

    let mut mut_query = RawMaterialMutation::find();

    if let Some(start) = query.start_date {
        let start_dt = start.and_hms_opt(0, 0, 0).unwrap().and_utc();
        mut_query = mut_query.filter(raw_material_mutations::Column::CreatedAt.gte(start_dt));
    }

    if let Some(end) = query.end_date {
        let end_dt = end.and_hms_opt(23, 59, 59).unwrap().and_utc();
        mut_query = mut_query.filter(raw_material_mutations::Column::CreatedAt.lte(end_dt));
    }

    let mutations = mut_query.all(db).await?;

    let mut in_map: HashMap<i32, i64> = HashMap::new();
    let mut out_map: HashMap<i32, i64> = HashMap::new();

    for m in mutations {
        match m.mutation_type {
            MutationType::In => {
                *in_map.entry(m.raw_material_id).or_insert(0) += m.qty as i64;
            }
            MutationType::Out => {
                *out_map.entry(m.raw_material_id).or_insert(0) += m.qty as i64;
            }
        }
    }

    let result = materials
        .into_iter()
        .map(|mat| {
            let in_qty = in_map.get(&mat.id).copied().unwrap_or(0);
            let out_qty = out_map.get(&mat.id).copied().unwrap_or(0);
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
            let remaining = if t.total_amount > t.pay_amount {
                t.total_amount - t.pay_amount
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
                pay_amount: t.pay_amount,
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
