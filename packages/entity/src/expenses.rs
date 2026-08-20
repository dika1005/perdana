use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::{ExpenseCategory, ExpensePaymentMethod};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "expenses")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub title: String,
    pub category: ExpenseCategory,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub amount: Decimal,
    pub payment_method: ExpensePaymentMethod,
    #[sea_orm(column_type = "Text", nullable)]
    pub notes: Option<String>,
    pub expense_date: DateTimeUtc,
    pub created_by: Option<i32>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::CreatedBy",
        to = "super::users::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    CreatedBy,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CreatedBy.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
