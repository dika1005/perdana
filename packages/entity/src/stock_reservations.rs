use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "stock_reservations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub transaction_id: i32,
    pub transaction_item_material_id: i64,
    pub raw_material_id: i32,
    pub material_lot_id: Option<i32>,
    pub qty: Decimal,
    pub required_width_m: Option<Decimal>,
    pub allow_offcut: bool,
    pub state: String,
    pub created_at: DateTimeUtc,
    pub released_at: Option<DateTimeUtc>,
    pub consumed_at: Option<DateTimeUtc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
