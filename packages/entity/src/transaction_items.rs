use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transaction_items")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub transaction_id: i32,
    pub product_id: Option<i32>,
    pub product_variant_id: Option<i32>,
    pub product_name: String,
    pub variant_name: Option<String>,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub price: Decimal,
    pub qty: i32,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub subtotal: Decimal,
    /// Dimensi cetak (meter) untuk produk berukuran (banner, spanduk, stiker, dll).
    /// Digunakan menghitung kebutuhan bahan secara presisi (luas m²).
    #[sea_orm(column_type = "Decimal(Some((10, 2)))", nullable)]
    pub length: Option<Decimal>,
    #[sea_orm(column_type = "Decimal(Some((10, 2)))", nullable)]
    pub width: Option<Decimal>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::transactions::Entity",
        from = "Column::TransactionId",
        to = "super::transactions::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Transaction,
    #[sea_orm(
        belongs_to = "super::products::Entity",
        from = "Column::ProductId",
        to = "super::products::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    Product,
    #[sea_orm(
        belongs_to = "super::product_variants::Entity",
        from = "Column::ProductVariantId",
        to = "super::product_variants::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    ProductVariant,
    #[sea_orm(has_many = "super::transaction_item_addons::Entity")]
    Addons,
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transaction.def()
    }
}

impl Related<super::products::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Product.def()
    }
}

impl Related<super::product_variants::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ProductVariant.def()
    }
}

impl Related<super::transaction_item_addons::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Addons.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
