use chrono::{DateTime, NaiveDate, Utc};
use entity::enums::{ExpenseCategory, ExpensePaymentMethod};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateExpenseRequest {
    #[validate(length(min = 1, max = 200, message = "Judul pengeluaran harus 1 - 200 karakter"))]
    #[schema(example = "Beli Tinta Eco-Solvent 1 Liter")]
    pub title: String,

    #[schema(example = "BAHAN_BAKU")]
    pub category: Option<ExpenseCategory>,

    #[validate(custom(function = "validate_positive_amount"))]
    #[schema(example = "150000.00")]
    pub amount: Decimal,

    #[schema(example = "CASH")]
    pub payment_method: Option<ExpensePaymentMethod>,

    #[schema(example = "Pembelian tinta di toko supplier")]
    pub notes: Option<String>,

    #[schema(example = "2026-08-20T10:00:00Z")]
    pub expense_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateExpenseRequest {
    #[validate(length(min = 1, max = 200, message = "Judul pengeluaran harus 1 - 200 karakter"))]
    #[schema(example = "Beli Tinta Eco-Solvent 1 Liter")]
    pub title: String,

    #[schema(example = "BAHAN_BAKU")]
    pub category: Option<ExpenseCategory>,

    #[validate(custom(function = "validate_positive_amount"))]
    #[schema(example = "150000.00")]
    pub amount: Decimal,

    #[schema(example = "CASH")]
    pub payment_method: Option<ExpensePaymentMethod>,

    #[schema(example = "Pembelian tinta di toko supplier")]
    pub notes: Option<String>,

    pub expense_date: Option<DateTime<Utc>>,
}

fn validate_positive_amount(amount: &Decimal) -> Result<(), validator::ValidationError> {
    if *amount <= Decimal::ZERO {
        return Err(validator::ValidationError::new("amount_must_be_positive"));
    }
    Ok(())
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct ExpenseQuery {
    pub category: Option<ExpenseCategory>,
    pub payment_method: Option<ExpensePaymentMethod>,
    pub search: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExpenseResponse {
    pub id: i32,
    pub title: String,
    pub category: ExpenseCategory,
    pub amount: Decimal,
    pub payment_method: ExpensePaymentMethod,
    pub notes: Option<String>,
    pub expense_date: DateTime<Utc>,
    pub created_by: Option<i32>,
    pub creator_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExpenseCategoryBreakdown {
    pub category: ExpenseCategory,
    pub total_amount: Decimal,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExpenseSummaryResponse {
    pub total_amount: Decimal,
    pub total_count: i64,
    pub today_amount: Decimal,
    pub month_amount: Decimal,
    pub by_category: Vec<ExpenseCategoryBreakdown>,
}
