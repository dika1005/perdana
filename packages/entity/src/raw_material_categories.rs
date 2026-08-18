use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_material_categories")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::raw_materials::Entity")]
    RawMaterials,
}

impl Related<super::raw_materials::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RawMaterials.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
