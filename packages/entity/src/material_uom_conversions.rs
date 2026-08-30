use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "material_uom_conversions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub raw_material_id: i32,
    pub from_unit: String,
    pub to_unit: String,
    pub factor: Decimal,
    pub notes: Option<String>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
