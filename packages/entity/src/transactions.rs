use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::{OrderStatus, PaymentMethod, PaymentStatus};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub invoice_number: String,
    pub customer_id: Option<i32>,
    pub customer_name: Option<String>,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub subtotal_amount: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub discount_amount: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub total_amount: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub pay_amount: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub change_amount: Decimal,
    pub payment_status: PaymentStatus,
    pub payment_method: PaymentMethod,
    pub settlement_payment_method: Option<PaymentMethod>,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))", nullable)]
    pub settlement_pay_amount: Option<Decimal>,
    pub settlement_at: Option<DateTimeUtc>,
    pub order_status: OrderStatus,
    pub estimated_done_at: Option<Date>,
    pub created_by: Option<i32>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::customers::Entity",
        from = "Column::CustomerId",
        to = "super::customers::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    Customer,
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::CreatedBy",
        to = "super::users::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    CreatedBy,
    #[sea_orm(has_many = "super::transaction_items::Entity")]
    Items,
}

impl Related<super::customers::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Customer.def()
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CreatedBy.def()
    }
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Items.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
