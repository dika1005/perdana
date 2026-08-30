use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_materials")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub variant: Option<String>,
    pub unit: String,
    /// Stok tersedia. Desimal agar mendukung bahan ukuran pecahan
    /// (meter, gram, lembar setengah, dll).
    pub stock: Decimal,
    /// Stok yang sudah dijanjikan ke order terkonfirmasi, tetapi belum
    /// dikonsumsi ke produksi. Stok yang masih dapat dijual = stock - reserved_stock.
    pub reserved_stock: Decimal,
    /// Batas peringatan stok menipis.
    pub min_stock_warning: Decimal,
    /// Biaya standar per satuan dasar. Digunakan untuk costing/waste historis.
    pub standard_cost: Decimal,
    /// Lebar roll (meter), bila bahan berbentuk roll. NULL untuk bahan non-roll.
    pub roll_width: Option<Decimal>,
    /// Master bahan tidak pernah dihapus secara fisik; gunakan nonaktifkan.
    pub is_active: bool,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::raw_material_categories::Entity",
        from = "Column::CategoryId",
        to = "super::raw_material_categories::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    Category,
    #[sea_orm(has_many = "super::raw_material_mutations::Entity")]
    Mutations,
}

impl Related<super::raw_material_categories::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Category.def()
    }
}

impl Related<super::raw_material_mutations::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Mutations.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
