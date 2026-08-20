use chrono::{Datelike, Local, Utc};
use entity::enums::{ExpenseCategory, ExpensePaymentMethod};
use entity::expenses;
use entity::prelude::*;
use entity::users;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, ModelTrait, QueryFilter,
    QueryOrder, Set,
};
use validator::Validate;


use crate::dto::{
    CreateExpenseRequest, ExpenseCategoryBreakdown, ExpenseQuery, ExpenseResponse,
    ExpenseSummaryResponse, Pagination, PaginationMeta, UpdateExpenseRequest,
};
use crate::error::AppError;

pub fn map_expense(m: &expenses::Model, creator_name: Option<String>) -> ExpenseResponse {
    ExpenseResponse {
        id: m.id,
        title: m.title.clone(),
        category: m.category.clone(),
        amount: m.amount,
        payment_method: m.payment_method.clone(),
        notes: m.notes.clone(),
        expense_date: m.expense_date,
        created_by: m.created_by,
        creator_name,
        created_at: m.created_at,
    }
}

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: ExpenseQuery,
) -> Result<(Vec<ExpenseResponse>, PaginationMeta), AppError> {
    let mut select = Expense::find().order_by_desc(expenses::Column::ExpenseDate);

    if let Some(category) = query.category {
        select = select.filter(expenses::Column::Category.eq(category));
    }

    if let Some(payment_method) = query.payment_method {
        select = select.filter(expenses::Column::PaymentMethod.eq(payment_method));
    }

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(
            expenses::Column::Title
                .like(&keyword)
                .or(expenses::Column::Notes.like(&keyword)),
        );
    }

    if let Some(start_date) = query.start_date {
        let start = start_date.and_hms_opt(0, 0, 0).unwrap().and_utc();
        select = select.filter(expenses::Column::ExpenseDate.gte(start));
    }

    if let Some(end_date) = query.end_date {
        let end = end_date.and_hms_opt(23, 59, 59).unwrap().and_utc();
        select = select.filter(expenses::Column::ExpenseDate.lte(end));
    }

    let (items, meta) = pagination.fetch(select, db).await?;

    let creator_ids: Vec<i32> = items.iter().filter_map(|e| e.created_by).collect();
    let creators = if !creator_ids.is_empty() {
        User::find()
            .filter(users::Column::Id.is_in(creator_ids))
            .all(db)
            .await?
    } else {
        vec![]
    };

    let result = items
        .into_iter()
        .map(|e| {
            let c_name = e.created_by.and_then(|id| {
                creators
                    .iter()
                    .find(|u| u.id == id)
                    .map(|u| u.name.clone())
            });
            map_expense(&e, c_name)
        })
        .collect();

    Ok((result, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<ExpenseResponse, AppError> {
    let item = Expense::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Catatan pengeluaran tidak ditemukan"))?;

    let creator_name = if let Some(uid) = item.created_by {
        User::find_by_id(uid).one(db).await?.map(|u| u.name)
    } else {
        None
    };

    Ok(map_expense(&item, creator_name))
}

pub async fn create(
    db: &DatabaseConnection,
    user_id: i32,
    payload: CreateExpenseRequest,
) -> Result<ExpenseResponse, AppError> {
    payload.validate()?;

    let expense_date = payload.expense_date.unwrap_or_else(Utc::now);

    let active_model = expenses::ActiveModel {
        title: Set(payload.title.trim().to_string()),
        category: Set(payload.category.unwrap_or(ExpenseCategory::Operasional)),
        amount: Set(payload.amount),
        payment_method: Set(payload
            .payment_method
            .unwrap_or(ExpensePaymentMethod::Cash)),
        notes: Set(payload.notes.map(|s| s.trim().to_string())),
        expense_date: Set(expense_date),
        created_by: Set(Some(user_id)),
        ..Default::default()
    };

    let inserted = active_model.insert(db).await?;

    let creator_name = User::find_by_id(user_id)
        .one(db)
        .await?
        .map(|u| u.name);

    Ok(map_expense(&inserted, creator_name))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateExpenseRequest,
) -> Result<ExpenseResponse, AppError> {
    payload.validate()?;

    let item = Expense::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Catatan pengeluaran tidak ditemukan"))?;

    let mut active: expenses::ActiveModel = item.into();
    active.title = Set(payload.title.trim().to_string());
    if let Some(cat) = payload.category {
        active.category = Set(cat);
    }
    active.amount = Set(payload.amount);
    if let Some(pm) = payload.payment_method {
        active.payment_method = Set(pm);
    }
    active.notes = Set(payload.notes.map(|s| s.trim().to_string()));
    if let Some(ed) = payload.expense_date {
        active.expense_date = Set(ed);
    }

    let updated = active.update(db).await?;

    let creator_name = if let Some(uid) = updated.created_by {
        User::find_by_id(uid).one(db).await?.map(|u| u.name)
    } else {
        None
    };

    Ok(map_expense(&updated, creator_name))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let item = Expense::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Catatan pengeluaran tidak ditemukan"))?;

    item.delete(db).await?;
    Ok(())
}

pub async fn get_summary(
    db: &DatabaseConnection,
    _query: ExpenseQuery,
) -> Result<ExpenseSummaryResponse, AppError> {

    let all_expenses = Expense::find().all(db).await?;

    let now = Local::now();
    let today = now.date_naive();
    let current_month = now.month();
    let current_year = now.year();

    let mut total_amount = Decimal::ZERO;
    let mut total_count = 0i64;
    let mut today_amount = Decimal::ZERO;
    let mut month_amount = Decimal::ZERO;

    use std::collections::HashMap;
    let mut cat_map: HashMap<String, (ExpenseCategory, Decimal, i64)> = HashMap::new();

    for exp in all_expenses {
        let exp_date = exp.expense_date.with_timezone(&Local).date_naive();

        // Calculate global summary
        total_amount += exp.amount;
        total_count += 1;

        if exp_date == today {
            today_amount += exp.amount;
        }

        if exp_date.year() == current_year && exp_date.month() == current_month {
            month_amount += exp.amount;
        }

        let cat_key = format!("{:?}", exp.category);
        let entry = cat_map
            .entry(cat_key)
            .or_insert_with(|| (exp.category.clone(), Decimal::ZERO, 0));
        entry.1 += exp.amount;
        entry.2 += 1;
    }

    let by_category = cat_map
        .into_values()
        .map(|(category, total_amount, count)| ExpenseCategoryBreakdown {
            category,
            total_amount,
            count,
        })
        .collect();

    Ok(ExpenseSummaryResponse {
        total_amount,
        total_count,
        today_amount,
        month_amount,
        by_category,
    })
}
