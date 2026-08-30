use entity::audit_logs;
use sea_orm::{ActiveModelTrait, ConnectionTrait, Set};

use crate::error::AppError;

/// Menulis jejak audit append-only. Kegagalan menulis audit sengaja membuat
/// transaksi bisnis gagal; perubahan master tanpa audit tidak boleh terjadi.
pub async fn log<C: ConnectionTrait>(
    db: &C,
    actor_id: Option<i32>,
    action: impl Into<String>,
    entity_type: impl Into<String>,
    entity_id: impl Into<String>,
    before_data: Option<String>,
    after_data: Option<String>,
    notes: Option<String>,
) -> Result<(), AppError> {
    audit_logs::ActiveModel {
        actor_id: Set(actor_id),
        action: Set(action.into()),
        entity_type: Set(entity_type.into()),
        entity_id: Set(entity_id.into()),
        before_data: Set(before_data),
        after_data: Set(after_data),
        notes: Set(notes),
        ..Default::default()
    }
    .insert(db)
    .await?;
    Ok(())
}

pub fn snapshot<T: serde::Serialize>(value: &T) -> Option<String> {
    serde_json::to_string(value).ok()
}
