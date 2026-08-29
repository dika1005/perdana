use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::enums::MutationType;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_material_mutations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub raw_material_id: i32,
    /// ID transaksi penjualan penyebab mutasi (jika berasal dari otomatis
    /// pemotongan stok saat checkout). Dipakai agar pembatalan transaksi
    /// bisa mengembalikan stok secara presisi tanpa mencocokkan teks catatan.
    pub transaction_id: Option<i32>,
    #[sea_orm(column_name = "type")]
    pub mutation_type: MutationType,
    /// Jumlah mutasi. Desimal agar mendukung bahan ukuran pecahan
    /// (meter, gram, lembar setengah, dll).
    pub qty: Decimal,
    pub notes: Option<String>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::raw_materials::Entity",
        from = "Column::RawMaterialId",
        to = "super::raw_materials::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    RawMaterial,
}

impl Related<super::raw_materials::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RawMaterial.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
