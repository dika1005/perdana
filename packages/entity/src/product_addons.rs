use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::RangePriceType;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "product_addons")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub price_type: RangePriceType,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub default_price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub min_price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub max_price: Decimal,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
