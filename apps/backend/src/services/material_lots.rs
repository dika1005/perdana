//! Roll/lot and unit-conversion master data.
//!
//! Roll stock is kept in m² at aggregate level. A lot keeps its physical
//! width and remaining run length so the reservation service can choose a
//! usable offcut before opening a new roll.

use chrono::Utc;
use entity::enums::MutationType;
use entity::prelude::*;
use entity::{material_lots, material_uom_conversions};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set, TransactionTrait,
};
use validator::Validate;

use crate::dto::{
    CreateMaterialLotRequest, MaterialLotResponse, UpsertUomConversionRequest,
};
use crate::error::AppError;
use crate::services::{audit, inventory};

fn is_area_unit(unit: &str) -> bool {
    matches!(
        unit.trim().to_ascii_lowercase().as_str(),
        "m2" | "m²" | "sqm" | "meter_persegi"
    )
}

fn map_lot(lot: &material_lots::Model) -> MaterialLotResponse {
    MaterialLotResponse {
        id: lot.id,
        raw_material_id: lot.raw_material_id,
        lot_code: lot.lot_code.clone(),
        source_lot_id: lot.source_lot_id,
        width_m: lot.width_m,
        length_total: lot.length_total,
        length_remaining: lot.length_remaining,
        reserved_length: lot.reserved_length,
        is_offcut: lot.is_offcut,
        status: lot.status.clone(),
        unit_cost: lot.unit_cost,
        received_at: lot.received_at,
    }
}

pub async fn list_lots(
    db: &DatabaseConnection,
    raw_material_id: i32,
) -> Result<Vec<MaterialLotResponse>, AppError> {
    RawMaterial::find_by_id(raw_material_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;
    let lots = MaterialLot::find()
        .filter(material_lots::Column::RawMaterialId.eq(raw_material_id))
        .order_by_desc(material_lots::Column::IsOffcut)
        .order_by_asc(material_lots::Column::LengthRemaining)
        .all(db)
        .await?;
    Ok(lots.iter().map(map_lot).collect())
}

/// Receive a newly purchased roll. Its area is added through the canonical
/// inventory ledger in the same database transaction as its lot record.
pub async fn receive_lot_as(
    db: &DatabaseConnection,
    actor_id: i32,
    raw_material_id: i32,
    payload: CreateMaterialLotRequest,
) -> Result<MaterialLotResponse, AppError> {
    payload.validate()?;
    let lot_code = payload.lot_code.trim().to_string();
    if lot_code.is_empty() || payload.width_m <= Decimal::ZERO || payload.length <= Decimal::ZERO {
        return Err(AppError::field("lot", "Kode, lebar, dan panjang lot harus valid"));
    }
    if payload.unit_cost.is_some_and(|value| value < Decimal::ZERO) {
        return Err(AppError::field("unit_cost", "Biaya lot tidak boleh negatif"));
    }

    let txn = db.begin().await?;
    let material = RawMaterial::find_by_id(raw_material_id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;
    if !material.is_active {
        return Err(AppError::conflict("Bahan baku sudah dinonaktifkan"));
    }
    if !is_area_unit(&material.unit) {
        return Err(AppError::field(
            "unit",
            "Lot roll hanya dapat dipakai pada bahan dengan satuan m² (m2/m²/sqm)",
        ));
    }
    if MaterialLot::find()
        .filter(material_lots::Column::RawMaterialId.eq(raw_material_id))
        .filter(material_lots::Column::LotCode.eq(lot_code.clone()))
        .one(&txn)
        .await?
        .is_some()
    {
        return Err(AppError::conflict("Kode lot sudah digunakan untuk bahan ini"));
    }

    let area = payload.width_m * payload.length;
    let lot = material_lots::ActiveModel {
        raw_material_id: Set(raw_material_id),
        lot_code: Set(lot_code),
        source_lot_id: Set(None),
        width_m: Set(Some(payload.width_m)),
        length_total: Set(payload.length),
        length_remaining: Set(payload.length),
        reserved_length: Set(Decimal::ZERO),
        is_offcut: Set(false),
        status: Set("ACTIVE".to_string()),
        unit_cost: Set(payload.unit_cost.unwrap_or(material.standard_cost)),
        received_at: Set(Utc::now()),
        ..Default::default()
    }
    .insert(&txn)
    .await?;
    inventory::adjust_physical(
        &txn,
        raw_material_id,
        MutationType::In,
        area,
        inventory::LedgerContext {
            material_lot_id: Some(lot.id),
            actor_id: Some(actor_id),
            notes: payload.notes.or_else(|| Some(format!("Penerimaan roll {}", lot.lot_code))),
            ..Default::default()
        },
    )
    .await?;
    audit::log(
        &txn,
        Some(actor_id),
        "RECEIVE_ROLL_LOT",
        "MATERIAL_LOT",
        lot.id.to_string(),
        None,
        audit::snapshot(&lot),
        Some(format!("Lot roll diterima: +{} {}", area, material.unit)),
    )
    .await?;
    txn.commit().await?;
    Ok(map_lot(&lot))
}

/// Maintain only explicit, material-specific conversion factors. Conversion
/// never silently changes stock; it is metadata used for purchasing/display
/// and must be accompanied by a stock opname when balances are migrated.
pub async fn upsert_uom_conversion_as(
    db: &DatabaseConnection,
    actor_id: i32,
    raw_material_id: i32,
    payload: UpsertUomConversionRequest,
) -> Result<(), AppError> {
    payload.validate()?;
    let from_unit = payload.from_unit.trim().to_ascii_lowercase();
    let to_unit = payload.to_unit.trim().to_ascii_lowercase();
    if from_unit.is_empty() || to_unit.is_empty() || from_unit == to_unit || payload.factor <= Decimal::ZERO {
        return Err(AppError::field(
            "conversion",
            "Satuan asal/tujuan harus berbeda dan faktor harus lebih dari 0",
        ));
    }
    let txn = db.begin().await?;
    RawMaterial::find_by_id(raw_material_id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))?;
    let existing = MaterialUomConversion::find()
        .filter(material_uom_conversions::Column::RawMaterialId.eq(raw_material_id))
        .filter(material_uom_conversions::Column::FromUnit.eq(from_unit.clone()))
        .filter(material_uom_conversions::Column::ToUnit.eq(to_unit.clone()))
        .lock_exclusive()
        .one(&txn)
        .await?;
    let (before, after_id) = if let Some(existing) = existing {
        let before = audit::snapshot(&existing);
        let mut active: material_uom_conversions::ActiveModel = existing.into();
        active.factor = Set(payload.factor);
        active.notes = Set(payload.notes.map(|value| value.trim().to_string()));
        let updated = active.update(&txn).await?;
        (before, updated.id)
    } else {
        let created = material_uom_conversions::ActiveModel {
            raw_material_id: Set(raw_material_id),
            from_unit: Set(from_unit),
            to_unit: Set(to_unit),
            factor: Set(payload.factor),
            notes: Set(payload.notes.map(|value| value.trim().to_string())),
            ..Default::default()
        }
        .insert(&txn)
        .await?;
        (None, created.id)
    };
    audit::log(
        &txn,
        Some(actor_id),
        "UPSERT_UOM_CONVERSION",
        "MATERIAL_UOM_CONVERSION",
        after_id.to_string(),
        before,
        None,
        Some("Konversi satuan material diperbarui; saldo stok tidak diubah".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(())
}
