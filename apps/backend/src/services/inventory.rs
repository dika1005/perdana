//! Canonical inventory operations. Every physical/reserved balance change goes
//! through this module and emits an immutable `inventory_ledger` row.

use chrono::Utc;
use entity::enums::MutationType;
use entity::prelude::*;
use entity::{
    inventory_ledger, material_lots, raw_material_mutations, raw_materials,
    stock_reservations, transaction_item_materials,
};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseTransaction, EntityTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};

use crate::error::AppError;

#[derive(Debug, Clone, Default)]
pub struct LedgerContext {
    pub transaction_id: Option<i32>,
    pub transaction_item_id: Option<i32>,
    pub transaction_item_material_id: Option<i64>,
    pub material_lot_id: Option<i32>,
    pub actor_id: Option<i32>,
    pub notes: Option<String>,
}

fn is_area_unit(unit: &str) -> bool {
    matches!(unit.trim().to_ascii_lowercase().as_str(), "m2" | "m²" | "sqm" | "meter_persegi")
}

pub fn ensure_available_stock(
    material: &raw_materials::Model,
    required: Decimal,
) -> Result<(), AppError> {
    let available = material.stock - material.reserved_stock;
    if !material.is_active {
        return Err(AppError::conflict(format!(
            "Bahan \"{}\" sudah dinonaktifkan dan tidak dapat dipakai untuk pesanan baru.",
            material.name
        )));
    }
    if required <= Decimal::ZERO {
        return Err(AppError::field("qty", "Kuantitas bahan harus lebih dari 0"));
    }
    if available < required {
        return Err(AppError::conflict(format!(
            "Stok tersedia bahan \"{}\" tidak mencukupi. Fisik {} {}, terpesan {} {}, tersedia {} {}, kebutuhan {} {}.",
            material.name,
            material.stock,
            material.unit,
            material.reserved_stock,
            material.unit,
            available,
            material.unit,
            required,
            material.unit,
        )));
    }
    Ok(())
}

async fn lock_material(
    txn: &DatabaseTransaction,
    raw_material_id: i32,
) -> Result<raw_materials::Model, AppError> {
    RawMaterial::find_by_id(raw_material_id)
        .lock_exclusive()
        .one(txn)
        .await?
        .ok_or_else(|| AppError::not_found("Bahan baku tidak ditemukan"))
}

async fn append_ledger(
    txn: &DatabaseTransaction,
    material: &raw_materials::Model,
    entry_type: &str,
    qty: Decimal,
    physical_delta: Decimal,
    reserved_delta: Decimal,
    reason_code: &str,
    context: &LedgerContext,
    idempotency_key: String,
) -> Result<(), AppError> {
    inventory_ledger::ActiveModel {
        raw_material_id: Set(material.id),
        transaction_id: Set(context.transaction_id),
        transaction_item_id: Set(context.transaction_item_id),
        transaction_item_material_id: Set(context.transaction_item_material_id),
        material_lot_id: Set(context.material_lot_id),
        entry_type: Set(entry_type.to_string()),
        qty: Set(qty),
        physical_delta: Set(physical_delta),
        reserved_delta: Set(reserved_delta),
        unit: Set(material.unit.clone()),
        reason_code: Set(reason_code.to_string()),
        notes: Set(context.notes.clone()),
        actor_id: Set(context.actor_id),
        idempotency_key: Set(Some(idempotency_key)),
        ..Default::default()
    }
    .insert(txn)
    .await?;
    Ok(())
}

async fn append_legacy_mutation(
    txn: &DatabaseTransaction,
    material_id: i32,
    transaction_id: Option<i32>,
    mutation_type: MutationType,
    qty: Decimal,
    notes: Option<String>,
) -> Result<(), AppError> {
    raw_material_mutations::ActiveModel {
        raw_material_id: Set(material_id),
        transaction_id: Set(transaction_id),
        mutation_type: Set(mutation_type),
        qty: Set(qty),
        notes: Set(notes),
        ..Default::default()
    }
    .insert(txn)
    .await?;
    Ok(())
}

async fn choose_and_reserve_lot(
    txn: &DatabaseTransaction,
    material: &raw_materials::Model,
    required_width_m: Option<Decimal>,
    qty: Decimal,
    allow_offcut: bool,
) -> Result<Option<i32>, AppError> {
    let Some(required_width) = required_width_m.filter(|width| *width > Decimal::ZERO) else {
        return Ok(None);
    };

    // Lot/offcut is meaningful only when the material's base unit is area.
    // Legacy materials stored in linear meter remain supported at aggregate
    // level until their master data is normalized to m².
    if !is_area_unit(&material.unit) {
        return Ok(None);
    }

    let lots = MaterialLot::find()
        .filter(material_lots::Column::RawMaterialId.eq(material.id))
        .filter(material_lots::Column::Status.eq("ACTIVE"))
        .order_by_desc(material_lots::Column::IsOffcut)
        .order_by_asc(material_lots::Column::LengthRemaining)
        .lock_exclusive()
        .all(txn)
        .await?;

    // A master material may not be lot-managed yet. In that case the
    // aggregate reservation is still valid and keeps rollout backward-safe.
    if lots.is_empty() {
        return Ok(None);
    }

    for lot in lots {
        if lot.is_offcut && !allow_offcut {
            continue;
        }
        let Some(width) = lot.width_m else { continue };
        if width < required_width || width <= Decimal::ZERO {
            continue;
        }
        // qty is stored in m². A job with a narrower requested width consumes
        // its actual run length, not `qty / full_roll_width`.
        let length_needed = qty / required_width;
        if lot.length_remaining - lot.reserved_length < length_needed {
            continue;
        }

        let mut active: material_lots::ActiveModel = lot.clone().into();
        active.reserved_length = Set(lot.reserved_length + length_needed);
        active.update(txn).await?;
        return Ok(Some(lot.id));
    }

    Err(AppError::conflict(format!(
        "Tidak ada roll/offcut {} dengan lebar minimal {} m dan luas cukup untuk pesanan ini.",
        material.name, required_width
    )))
}

async fn release_lot_reservation(
    txn: &DatabaseTransaction,
    lot_id: i32,
    qty: Decimal,
    required_width_m: Option<Decimal>,
) -> Result<(), AppError> {
    let lot = MaterialLot::find_by_id(lot_id)
        .lock_exclusive()
        .one(txn)
        .await?
        .ok_or_else(|| AppError::conflict("Lot bahan yang direservasi tidak ditemukan"))?;
    let lot_width = lot
        .width_m
        .filter(|width| *width > Decimal::ZERO)
        .ok_or_else(|| AppError::conflict("Lot bahan tidak memiliki lebar yang valid"))?;
    let cut_width = required_width_m
        .filter(|width| *width > Decimal::ZERO)
        .unwrap_or(lot_width);
    if cut_width > lot_width {
        return Err(AppError::conflict("Lebar potong melebihi lebar lot yang direservasi"));
    }
    let length = qty / cut_width;
    if lot.reserved_length < length {
        return Err(AppError::conflict("Saldo reservasi lot tidak konsisten"));
    }
    let mut active: material_lots::ActiveModel = lot.into();
    active.reserved_length = Set(active.reserved_length.clone().unwrap() - length);
    active.update(txn).await?;
    Ok(())
}

async fn consume_lot_reservation(
    txn: &DatabaseTransaction,
    lot_id: i32,
    qty: Decimal,
    required_width_m: Option<Decimal>,
) -> Result<Option<material_lots::Model>, AppError> {
    let lot = MaterialLot::find_by_id(lot_id)
        .lock_exclusive()
        .one(txn)
        .await?
        .ok_or_else(|| AppError::conflict("Lot bahan yang direservasi tidak ditemukan"))?;
    let lot_width = lot
        .width_m
        .filter(|width| *width > Decimal::ZERO)
        .ok_or_else(|| AppError::conflict("Lot bahan tidak memiliki lebar yang valid"))?;
    let cut_width = required_width_m
        .filter(|width| *width > Decimal::ZERO)
        .unwrap_or(lot_width);
    if cut_width > lot_width {
        return Err(AppError::conflict("Lebar potong melebihi lebar lot yang direservasi"));
    }
    let length = qty / cut_width;
    if lot.reserved_length < length || lot.length_remaining < length {
        return Err(AppError::conflict("Saldo lot bahan tidak konsisten untuk dikonsumsi"));
    }
    let remaining = lot.length_remaining - length;
    let mut active: material_lots::ActiveModel = lot.clone().into();
    active.reserved_length = Set(lot.reserved_length - length);
    active.length_remaining = Set(remaining);
    if remaining <= Decimal::ZERO {
        active.status = Set("EXHAUSTED".to_string());
    }
    active.update(txn).await?;

    // A narrow print strip consumes only `cut_width × length`. The unused
    // strip from a wider roll is a real, reusable offcut. Split it into a
    // child lot so that the sum of lot area still matches aggregate physical
    // stock after the consumed area has been deducted.
    let leftover_width = lot_width - cut_width;
    if leftover_width <= Decimal::ZERO {
        return Ok(None);
    }
    let now = Utc::now();
    let offcut = material_lots::ActiveModel {
        raw_material_id: Set(lot.raw_material_id),
        lot_code: Set(format!("OFFCUT-{}-{}", lot.id, now.timestamp_micros())),
        source_lot_id: Set(Some(lot.id)),
        width_m: Set(Some(leftover_width)),
        length_total: Set(length),
        length_remaining: Set(length),
        reserved_length: Set(Decimal::ZERO),
        is_offcut: Set(true),
        status: Set("ACTIVE".to_string()),
        unit_cost: Set(lot.unit_cost),
        received_at: Set(now),
        ..Default::default()
    }
    .insert(txn)
    .await?;
    Ok(Some(offcut))
}

pub async fn reserve(
    txn: &DatabaseTransaction,
    raw_material_id: i32,
    qty: Decimal,
    required_width_m: Option<Decimal>,
    allow_offcut: bool,
    context: LedgerContext,
) -> Result<stock_reservations::Model, AppError> {
    let material = lock_material(txn, raw_material_id).await?;
    ensure_available_stock(&material, qty)?;
    let lot_id = choose_and_reserve_lot(txn, &material, required_width_m, qty, allow_offcut).await?;

    let mut active_material: raw_materials::ActiveModel = material.clone().into();
    active_material.reserved_stock = Set(material.reserved_stock + qty);
    active_material.updated_at = Set(Utc::now());
    active_material.update(txn).await?;

    let mut reservation_context = context.clone();
    reservation_context.material_lot_id = lot_id;
    let item_material_id = context.transaction_item_material_id.ok_or_else(|| {
        AppError::Internal("Reservasi stok membutuhkan snapshot bahan transaksi".into())
    })?;
    let transaction_id = context.transaction_id.ok_or_else(|| {
        AppError::Internal("Reservasi stok membutuhkan transaksi".into())
    })?;

    let reservation = stock_reservations::ActiveModel {
        transaction_id: Set(transaction_id),
        transaction_item_material_id: Set(item_material_id),
        raw_material_id: Set(raw_material_id),
        material_lot_id: Set(lot_id),
        qty: Set(qty),
        required_width_m: Set(required_width_m),
        allow_offcut: Set(allow_offcut),
        state: Set("ACTIVE".to_string()),
        ..Default::default()
    }
    .insert(txn)
    .await?;

    append_ledger(
        txn,
        &material,
        "RESERVE",
        qty,
        Decimal::ZERO,
        qty,
        "ORDER_CONFIRMED",
        &reservation_context,
        format!("reserve:{}", reservation.id),
    )
    .await?;
    Ok(reservation)
}

pub async fn release_reservation(
    txn: &DatabaseTransaction,
    reservation: &stock_reservations::Model,
    context: LedgerContext,
) -> Result<(), AppError> {
    if reservation.state != "ACTIVE" {
        return Ok(());
    }
    let material = lock_material(txn, reservation.raw_material_id).await?;
    if material.reserved_stock < reservation.qty {
        return Err(AppError::conflict("Saldo stok terpesan tidak konsisten"));
    }
    if let Some(lot_id) = reservation.material_lot_id {
        release_lot_reservation(txn, lot_id, reservation.qty, reservation.required_width_m).await?;
    }

    let mut active_material: raw_materials::ActiveModel = material.clone().into();
    active_material.reserved_stock = Set(material.reserved_stock - reservation.qty);
    active_material.updated_at = Set(Utc::now());
    active_material.update(txn).await?;

    let mut active_reservation: stock_reservations::ActiveModel = reservation.clone().into();
    active_reservation.state = Set("RELEASED".to_string());
    active_reservation.released_at = Set(Some(Utc::now()));
    active_reservation.update(txn).await?;

    let mut entry_context = context;
    entry_context.material_lot_id = reservation.material_lot_id;
    append_ledger(
        txn,
        &material,
        "RELEASE_RESERVATION",
        reservation.qty,
        Decimal::ZERO,
        -reservation.qty,
        "ORDER_CANCELLED",
        &entry_context,
        format!("release:{}", reservation.id),
    )
    .await
}

pub async fn consume_reservation(
    txn: &DatabaseTransaction,
    reservation: &stock_reservations::Model,
    context: LedgerContext,
) -> Result<(), AppError> {
    if reservation.state != "ACTIVE" {
        return Err(AppError::conflict("Reservasi bahan tidak lagi aktif"));
    }
    let material = lock_material(txn, reservation.raw_material_id).await?;
    if material.reserved_stock < reservation.qty || material.stock < reservation.qty {
        return Err(AppError::conflict("Saldo stok fisik/terpesan tidak konsisten"));
    }
    let offcut = if let Some(lot_id) = reservation.material_lot_id {
        consume_lot_reservation(txn, lot_id, reservation.qty, reservation.required_width_m).await?
    } else {
        None
    };

    let mut active_material: raw_materials::ActiveModel = material.clone().into();
    active_material.stock = Set(material.stock - reservation.qty);
    active_material.reserved_stock = Set(material.reserved_stock - reservation.qty);
    active_material.updated_at = Set(Utc::now());
    active_material.update(txn).await?;

    let mut active_reservation: stock_reservations::ActiveModel = reservation.clone().into();
    active_reservation.state = Set("CONSUMED".to_string());
    active_reservation.consumed_at = Set(Some(Utc::now()));
    active_reservation.update(txn).await?;

    let mut entry_context = context.clone();
    entry_context.material_lot_id = reservation.material_lot_id;
    append_ledger(
        txn,
        &material,
        "CONSUME",
        reservation.qty,
        -reservation.qty,
        -reservation.qty,
        "PRODUCTION_STARTED",
        &entry_context,
        format!("consume:{}", reservation.id),
    )
    .await?;
    if let Some(offcut) = offcut {
        let mut offcut_context = context.clone();
        offcut_context.material_lot_id = Some(offcut.id);
        append_ledger(
            txn,
            &material,
            "OFFCUT_CREATED",
            offcut.width_m.unwrap_or(Decimal::ZERO) * offcut.length_remaining,
            Decimal::ZERO,
            Decimal::ZERO,
            "ROLL_TRIM",
            &offcut_context,
            format!("offcut:{}", offcut.id),
        )
        .await?;
    }
    append_legacy_mutation(
        txn,
        material.id,
        context.transaction_id,
        MutationType::Out,
        reservation.qty,
        Some("Konsumsi produksi dari reservasi order".to_string()),
    )
    .await
}

pub async fn consume_unreserved(
    txn: &DatabaseTransaction,
    raw_material_id: i32,
    qty: Decimal,
    entry_type: &str,
    reason_code: &str,
    context: LedgerContext,
) -> Result<(), AppError> {
    let material = lock_material(txn, raw_material_id).await?;
    ensure_available_stock(&material, qty)?;
    let mut active_material: raw_materials::ActiveModel = material.clone().into();
    active_material.stock = Set(material.stock - qty);
    active_material.updated_at = Set(Utc::now());
    active_material.update(txn).await?;
    append_ledger(
        txn,
        &material,
        entry_type,
        qty,
        -qty,
        Decimal::ZERO,
        reason_code,
        &context,
        format!("{}:{}:{}", entry_type.to_lowercase(), raw_material_id, Utc::now().timestamp_micros()),
    )
    .await?;
    append_legacy_mutation(
        txn,
        material.id,
        context.transaction_id,
        MutationType::Out,
        qty,
        context.notes,
    )
    .await
}

pub async fn adjust_physical(
    txn: &DatabaseTransaction,
    raw_material_id: i32,
    mutation_type: MutationType,
    qty: Decimal,
    context: LedgerContext,
) -> Result<(raw_materials::Model, raw_material_mutations::Model), AppError> {
    let material = lock_material(txn, raw_material_id).await?;
    if qty <= Decimal::ZERO {
        return Err(AppError::field("qty", "Kuantitas mutasi harus lebih dari 0"));
    }
    let delta = match mutation_type {
        MutationType::In => qty,
        MutationType::Out => {
            ensure_available_stock(&material, qty)?;
            -qty
        }
    };
    let mut active_material: raw_materials::ActiveModel = material.clone().into();
    active_material.stock = Set(material.stock + delta);
    active_material.updated_at = Set(Utc::now());
    let updated = active_material.update(txn).await?;
    let entry_type = match mutation_type {
        MutationType::In => "ADJUSTMENT_IN",
        MutationType::Out => "ADJUSTMENT_OUT",
    };
    append_ledger(
        txn,
        &material,
        entry_type,
        qty,
        delta,
        Decimal::ZERO,
        "MANUAL_STOCK_ADJUSTMENT",
        &context,
        format!("adjustment:{}:{}", raw_material_id, Utc::now().timestamp_micros()),
    )
    .await?;
    let legacy = raw_material_mutations::ActiveModel {
        raw_material_id: Set(raw_material_id),
        transaction_id: Set(context.transaction_id),
        mutation_type: Set(mutation_type),
        qty: Set(qty),
        notes: Set(context.notes),
        ..Default::default()
    }
    .insert(txn)
    .await?;
    Ok((updated, legacy))
}

pub async fn mark_item_material_reserved(
    txn: &DatabaseTransaction,
    id: i64,
    qty: Decimal,
    lot_id: Option<i32>,
) -> Result<(), AppError> {
    let item = TransactionItemMaterial::find_by_id(id)
        .one(txn)
        .await?
        .ok_or_else(|| AppError::Internal("Snapshot bahan transaksi tidak ditemukan".into()))?;
    let mut active: transaction_item_materials::ActiveModel = item.into();
    active.reserved_qty = Set(qty);
    active.material_lot_id = Set(lot_id);
    active.update(txn).await?;
    Ok(())
}

pub async fn mark_item_material_consumed(
    txn: &DatabaseTransaction,
    id: i64,
    qty: Decimal,
) -> Result<(), AppError> {
    let item = TransactionItemMaterial::find_by_id(id)
        .one(txn)
        .await?
        .ok_or_else(|| AppError::Internal("Snapshot bahan transaksi tidak ditemukan".into()))?;
    let mut active: transaction_item_materials::ActiveModel = item.into();
    active.reserved_qty = Set(Decimal::ZERO);
    active.consumed_qty = Set(qty);
    active.update(txn).await?;
    Ok(())
}

pub async fn add_item_material_waste(
    txn: &DatabaseTransaction,
    id: i64,
    qty: Decimal,
) -> Result<(), AppError> {
    let item = TransactionItemMaterial::find_by_id(id)
        .one(txn)
        .await?
        .ok_or_else(|| AppError::not_found("Snapshot bahan transaksi tidak ditemukan"))?;
    let mut active: transaction_item_materials::ActiveModel = item.clone().into();
    active.waste_qty = Set(item.waste_qty + qty);
    active.update(txn).await?;
    Ok(())
}

/// Mencatat bahan yang sudah dikonsumsi namun menjadi reject/print failure.
/// Tidak ada pengurangan fisik kedua: stok sudah berkurang saat PROSES dimulai.
pub async fn record_waste_from_consumed(
    txn: &DatabaseTransaction,
    item_material: &transaction_item_materials::Model,
    qty: Decimal,
    reason_code: &str,
    context: LedgerContext,
) -> Result<(), AppError> {
    if qty <= Decimal::ZERO {
        return Err(AppError::field("qty", "Kuantitas waste harus lebih dari 0"));
    }
    // Reload the locked snapshot so a request containing the same material
    // twice (or a concurrent operator action) cannot overstate waste.
    let current = TransactionItemMaterial::find_by_id(item_material.id)
        .lock_exclusive()
        .one(txn)
        .await?
        .ok_or_else(|| AppError::not_found("Snapshot bahan transaksi tidak ditemukan"))?;
    if current.consumed_qty - current.waste_qty < qty {
        return Err(AppError::conflict(format!(
            "Waste {} {} melebihi bahan yang telah dikonsumsi tetapi belum dicatat sebagai waste.",
            qty, current.unit
        )));
    }
    let material = lock_material(txn, current.raw_material_id).await?;
    let mut waste_context = context;
    waste_context.transaction_item_material_id = Some(current.id);
    waste_context.material_lot_id = current.material_lot_id;
    append_ledger(
        txn,
        &material,
        "WASTE",
        qty,
        Decimal::ZERO,
        Decimal::ZERO,
        reason_code,
        &waste_context,
        format!("waste:{}:{}", current.id, Utc::now().timestamp_micros()),
    )
    .await?;
    add_item_material_waste(txn, current.id, qty).await
}

/// Rework memakai bahan baru setelah print failure. Konsumsi ini tidak dapat
/// dihapus saat order dibatalkan karena sudah terjadi secara fisik.
pub async fn consume_for_rework(
    txn: &DatabaseTransaction,
    item_material: &transaction_item_materials::Model,
    qty: Decimal,
    reason_code: &str,
    context: LedgerContext,
) -> Result<(), AppError> {
    let mut consume_context = context;
    consume_context.transaction_item_material_id = Some(item_material.id);
    consume_context.material_lot_id = item_material.material_lot_id;
    consume_unreserved(
        txn,
        item_material.raw_material_id,
        qty,
        "REWORK_CONSUME",
        reason_code,
        consume_context,
    )
    .await?;
    let fresh = TransactionItemMaterial::find_by_id(item_material.id)
        .one(txn)
        .await?
        .ok_or_else(|| AppError::not_found("Snapshot bahan transaksi tidak ditemukan"))?;
    let mut active: transaction_item_materials::ActiveModel = fresh.clone().into();
    active.consumed_qty = Set(fresh.consumed_qty + qty);
    active.update(txn).await?;
    Ok(())
}
