use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "production_events")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub transaction_id: i32,
    pub event_type: String,
    pub notes: Option<String>,
    pub actor_id: Option<i32>,
    pub created_at: DateTimeUtc,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
