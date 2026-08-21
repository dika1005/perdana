use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::RangePriceType;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "product_variants")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub product_id: i32,
    pub variant_name: String,
    pub price_type: RangePriceType,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub min_price: Decimal,
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub max_price: Decimal,
    pub raw_material_id: Option<i32>,
    #[sea_orm(column_type = "Decimal(Some((12, 4)))", nullable)]
    pub material_amount: Option<Decimal>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::products::Entity",
        from = "Column::ProductId",
        to = "super::products::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Product,
    #[sea_orm(
        belongs_to = "super::raw_materials::Entity",
        from = "Column::RawMaterialId",
        to = "super::raw_materials::Column::Id",
        on_update = "NoAction",
        on_delete = "SetNull"
    )]
    RawMaterial,
    #[sea_orm(has_many = "super::transaction_items::Entity")]
    TransactionItems,
}

impl Related<super::products::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Product.def()
    }
}

impl Related<super::raw_materials::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RawMaterial.def()
    }
}

impl Related<super::transaction_items::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TransactionItems.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
