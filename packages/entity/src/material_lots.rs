use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Lot menyimpan sisa roll/offcut terpisah dari saldo agregat bahan.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "material_lots")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub raw_material_id: i32,
    pub lot_code: String,
    pub source_lot_id: Option<i32>,
    pub width_m: Option<Decimal>,
    pub length_total: Decimal,
    pub length_remaining: Decimal,
    pub reserved_length: Decimal,
    pub is_offcut: bool,
    pub status: String,
    pub unit_cost: Decimal,
    pub received_at: DateTimeUtc,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
