use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::PriceType;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "products")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub category_id: Option<i32>,
    pub name: String,
    pub price_type: PriceType,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub default_price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub min_price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub max_price: Decimal,
    pub min_order: Option<i32>,
    pub unit_name: Option<String>,
    pub has_variants: bool,
    /// Produk yang produksinya memakai bahan stok: checkout wajib mengisi
    /// bahan manual. Produk jasa/barang jadi = false.
    pub uses_material: bool,
    pub raw_material_id: Option<i32>,
    #[sea_orm(column_type = "Decimal(Some((12, 4)))", nullable)]
    pub material_amount: Option<Decimal>,
    /// Soft delete untuk menjaga referensi transaksi dan audit historis.
    pub is_active: bool,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::product_categories::Entity",
        from = "Column::CategoryId",
        to = "super::product_categories::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    Category,
    #[sea_orm(
        belongs_to = "super::raw_materials::Entity",
        from = "Column::RawMaterialId",
        to = "super::raw_materials::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    RawMaterial,
    #[sea_orm(has_many = "super::product_variants::Entity")]
    Variants,
    #[sea_orm(has_many = "super::transaction_items::Entity")]
    TransactionItems,
}

impl Related<super::product_categories::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Category.def()
    }
}

impl Related<super::raw_materials::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RawMaterial.def()
    }
}

impl Related<super::product_variants::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Variants.def()
    }
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TransactionItems.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
