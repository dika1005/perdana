use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transaction_item_addons")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub transaction_item_id: i32,
    pub addon_id: Option<i32>,
    pub addon_name: String,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub price: Decimal,
    pub qty: i32,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub subtotal: Decimal,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::transaction_items::Entity",
        from = "Column::TransactionItemId",
        to = "super::transaction_items::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    TransactionItem,
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TransactionItem.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
