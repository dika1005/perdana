use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Ledger inventori immutable. Kolom delta menyimpan perubahan agregat bahan;
/// tidak ada proses bisnis yang boleh mengubah atau menghapus baris ini.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory_ledger")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub raw_material_id: i32,
    pub transaction_id: Option<i32>,
    pub transaction_item_id: Option<i32>,
    pub transaction_item_material_id: Option<i64>,
    pub material_lot_id: Option<i32>,
    pub entry_type: String,
    pub qty: Decimal,
    pub physical_delta: Decimal,
    pub reserved_delta: Decimal,
    pub unit: String,
    pub reason_code: String,
    pub notes: Option<String>,
    pub actor_id: Option<i32>,
    pub idempotency_key: Option<String>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
