use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Snapshot kebutuhan bahan per item. Tidak ikut berubah bila BOM/master bahan berubah.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transaction_item_materials")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub transaction_item_id: i32,
    pub raw_material_id: i32,
    pub material_lot_id: Option<i32>,
    pub required_width_m: Option<Decimal>,
    pub allow_offcut: bool,
    pub material_name: String,
    pub unit: String,
    pub required_qty: Decimal,
    pub reserved_qty: Decimal,
    pub consumed_qty: Decimal,
    pub waste_qty: Decimal,
    pub source_type: String,
    pub consumption_basis: String,
    pub bom_id: Option<i32>,
    pub bom_line_id: Option<i32>,
    pub bom_version: Option<i32>,
    pub addon_id: Option<i32>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
