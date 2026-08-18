use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::enums::MutationType;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_material_mutations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub raw_material_id: i32,
    #[sea_orm(column_name = "type")]
    pub mutation_type: MutationType,
    pub qty: i32,
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
