//! Service responsible for converting quantities from any defined unit
//! (package unit or custom UOM) into the material's base unit. It is used
//! by mutation endpoints so that the backend can safely accept quantities
//! expressed in alternative units.

use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait};
use entity::{material_uom_conversions, raw_materials};
use rust_decimal::Decimal;
use crate::error::AppError;

/// Convert `qty` given in `from_unit` to the base unit of the raw material.
///
/// * `from_unit` – unit supplied by the caller (e.g. "rim", "box", "ml").
/// * If `from_unit` matches the material's own `unit`, the quantity is returned unchanged.
/// * First tries to find an explicit conversion in `material_uom_conversions`
///   where `to_unit` equals the material's base unit. If found, the factor is
///   multiplied.
/// * If no explicit conversion exists, falls back to the material's
///   `package_unit` / `package_size` definition.
/// * Returns an `AppError::field` when no conversion rule can be applied.
pub async fn to_base_unit(
    db: &DatabaseConnection,
    raw_material_id: i32,
    from_unit: &str,
    qty: Decimal,
) -> Result<Decimal, AppError> {
    // Load the material to know its base unit and possible package info.
    let material = raw_materials::Entity::find_by_id(raw_material_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;

    let base_unit = material.unit.trim().to_ascii_lowercase();
    let from = from_unit.trim().to_ascii_lowercase();

    // If caller already uses the base unit, nothing to do.
    if from == base_unit {
        return Ok(qty);
    }

    // 1️⃣ Try explicit UOM conversion (raw_material_id, from, to = base).
    if let Some(conv) = material_uom_conversions::Entity::find()
        .filter(material_uom_conversions::Column::RawMaterialId.eq(raw_material_id))
        .filter(material_uom_conversions::Column::FromUnit.eq(from.clone()))
        .filter(material_uom_conversions::Column::ToUnit.eq(base_unit.clone()))
        .one(db)
        .await?
    {
        return Ok(qty * conv.factor);
    }

    // 2️⃣ Fallback to package definition if the material defines one.
    if let (Some(pkg_unit), Some(pkg_size)) = (material.package_unit.as_ref(), material.package_size) {
        if pkg_unit.trim().eq_ignore_ascii_case(&from) {
            return Ok(qty * pkg_size);
        }
    }

    // No conversion rule is applicable.
    Err(AppError::field(
        "unit",
        "Tidak ada konversi yang tersedia untuk satuan yang diberikan",
    ))
}
