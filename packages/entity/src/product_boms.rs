use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "product_boms")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub product_id: i32,
    pub product_variant_id: Option<i32>,
    pub version: i32,
    pub status: String,
    pub output_qty: Decimal,
    pub notes: Option<String>,
    pub effective_from: Option<Date>,
    pub effective_to: Option<Date>,
    pub created_by: Option<i32>,
    pub created_at: DateTimeUtc,
    pub activated_at: Option<DateTimeUtc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
