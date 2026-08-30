use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "addon_bom_lines")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub addon_id: i32,
    pub raw_material_id: i32,
    pub consumption_basis: String,
    pub qty_per_addon: Decimal,
    pub waste_pct: Decimal,
    pub is_required: bool,
    pub sort_order: i32,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
