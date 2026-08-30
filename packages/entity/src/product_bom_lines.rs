use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "product_bom_lines")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub bom_id: i32,
    pub raw_material_id: i32,
    pub component_type: String,
    pub consumption_basis: String,
    pub qty_per_output: Decimal,
    pub waste_pct: Decimal,
    pub width_requirement_m: Option<Decimal>,
    pub allow_offcut: bool,
    pub is_required: bool,
    pub sort_order: i32,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
