//! Transaction, payment, reservation, and production state machine.
//!
//! Inventory policy:
//! - Material requirement is the operator's manual estimate at checkout
//!   (`items[].materials[]`); there is no server-side BOM formula.
//! - UNPAID / DRAFT-like order: no reservation and no physical deduction.
//! - DP / PAID in ANTRIAN: material is reserved atomically.
//! - PROSES: active reservation becomes physical consumption.
//! - Cancellation only releases reservations; consumed stock is never put back.

use chrono::{DateTime, Utc};
use entity::enums::{OrderStatus, PaymentMethod, PaymentStatus, PriceType, RangePriceType};
use entity::prelude::*;
use entity::{
    payments, production_events, stock_reservations, transaction_item_addons,
    transaction_item_materials, transaction_items, transactions,
};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
    QuerySelect, Set, TransactionTrait,
};
use validator::Validate;

use crate::config::StoreConfig;
use crate::dto::{
    CancelTransactionRequest, CreateTransactionRequest, InvoicePrintData, Pagination,
    PaginationMeta, PaymentResponse, ProductionEventResponse, RecordReworkRequest,
    RecordWasteRequest, RefundPaymentRequest, SettleTransactionRequest,
    TransactionItemAddonResponse, TransactionItemMaterialResponse, TransactionItemResponse,
    TransactionQuery, TransactionResponse, UpdatePaymentRequest,
};
use crate::error::AppError;
use crate::services::{audit, inventory};

#[derive(Debug, Clone)]
struct ProcessedMaterial {
    raw_material_id: i32,
    required_qty: Decimal,
    source_type: String,
    consumption_basis: String,
    required_width_m: Option<Decimal>,
    allow_offcut: bool,
    bom_id: Option<i32>,
    bom_line_id: Option<i32>,
    bom_version: Option<i32>,
    addon_id: Option<i32>,
}

#[derive(Debug, Clone)]
struct ProcessedAddon {
    addon_id: Option<i32>,
    addon_name: String,
    price: Decimal,
    qty: i32,
    subtotal: Decimal,
}

#[derive(Debug, Clone)]
struct ProcessedItem {
    product_id: i32,
    product_variant_id: Option<i32>,
    product_name: String,
    variant_name: Option<String>,
    price: Decimal,
    qty: i32,
    subtotal: Decimal,
    length: Option<Decimal>,
    width: Option<Decimal>,
    materials: Vec<ProcessedMaterial>,
    addons: Vec<ProcessedAddon>,
}

#[derive(Debug, Clone)]
struct SnapshotReservation {
    item_id: i32,
    item_material_id: i64,
    raw_material_id: i32,
    qty: Decimal,
    required_width_m: Option<Decimal>,
    allow_offcut: bool,
}

fn net_paid(transaction: &transactions::Model) -> Decimal {
    (transaction.pay_amount - transaction.change_amount).max(Decimal::ZERO)
}

fn payment_status_for(paid_amount: Decimal, total_amount: Decimal) -> PaymentStatus {
    if paid_amount >= total_amount {
        PaymentStatus::Paid
    } else if paid_amount > Decimal::ZERO {
        PaymentStatus::Dp
    } else {
        PaymentStatus::Unpaid
    }
}

fn validate_positive_dimensions(length: Option<Decimal>, width: Option<Decimal>) -> Result<(), AppError> {
    if length.is_some_and(|value| value <= Decimal::ZERO) {
        return Err(AppError::field("length", "Panjang harus lebih dari 0"));
    }
    if width.is_some_and(|value| value <= Decimal::ZERO) {
        return Err(AppError::field("width", "Lebar harus lebih dari 0"));
    }
    Ok(())
}

fn normalized_idempotency_key(key: Option<String>) -> Result<Option<String>, AppError> {
    let Some(key) = key else { return Ok(None) };
    let key = key.trim().to_string();
    if key.len() < 8 || key.len() > 100 {
        return Err(AppError::field("idempotency_key", "Idempotency key harus 8 - 100 karakter"));
    }
    Ok(Some(key))
}

pub fn map_item_addon(m: &transaction_item_addons::Model) -> TransactionItemAddonResponse {
    TransactionItemAddonResponse {
        id: m.id,
        addon_id: m.addon_id,
        addon_name: m.addon_name.clone(),
        price: m.price,
        qty: m.qty,
        subtotal: m.subtotal,
    }
}

pub fn map_item_material(
    m: &transaction_item_materials::Model,
) -> TransactionItemMaterialResponse {
    TransactionItemMaterialResponse {
        id: m.id,
        raw_material_id: m.raw_material_id,
        material_lot_id: m.material_lot_id,
        required_width_m: m.required_width_m,
        allow_offcut: m.allow_offcut,
        material_name: m.material_name.clone(),
        unit: m.unit.clone(),
        required_qty: m.required_qty,
        reserved_qty: m.reserved_qty,
        consumed_qty: m.consumed_qty,
        waste_qty: m.waste_qty,
        source_type: m.source_type.clone(),
        consumption_basis: m.consumption_basis.clone(),
        bom_id: m.bom_id,
        bom_version: m.bom_version,
        addon_id: m.addon_id,
    }
}

pub fn map_payment(m: &payments::Model) -> PaymentResponse {
    PaymentResponse {
        id: m.id,
        payment_type: m.payment_type.clone(),
        amount: m.amount,
        payment_method: m.payment_method.clone(),
        reference_no: m.reference_no.clone(),
        notes: m.notes.clone(),
        created_by: m.created_by,
        created_at: m.created_at,
    }
}

pub fn map_production_event(m: &production_events::Model) -> ProductionEventResponse {
    ProductionEventResponse {
        id: m.id,
        event_type: m.event_type.clone(),
        notes: m.notes.clone(),
        actor_id: m.actor_id,
        created_at: m.created_at,
    }
}

pub fn map_item(
    m: &transaction_items::Model,
    addons: Vec<TransactionItemAddonResponse>,
    materials: Vec<TransactionItemMaterialResponse>,
) -> TransactionItemResponse {
    TransactionItemResponse {
        id: m.id,
        product_id: m.product_id,
        product_variant_id: m.product_variant_id,
        product_name: m.product_name.clone(),
        variant_name: m.variant_name.clone(),
        price: m.price,
        qty: m.qty,
        subtotal: m.subtotal,
        length: m.length,
        width: m.width,
        addons,
        materials,
    }
}

pub fn map_transaction(
    m: &transactions::Model,
    cashier_name: Option<String>,
    items: Option<Vec<TransactionItemResponse>>,
    payment_rows: Option<Vec<PaymentResponse>>,
    events: Option<Vec<ProductionEventResponse>>,
) -> TransactionResponse {
    TransactionResponse {
        id: m.id,
        invoice_number: m.invoice_number.clone(),
        customer_id: m.customer_id,
        customer_name: m.customer_name.clone().unwrap_or_else(|| "Umum".to_string()),
        subtotal_amount: m.subtotal_amount,
        discount_amount: m.discount_amount,
        total_amount: m.total_amount,
        pay_amount: m.pay_amount,
        paid_amount: net_paid(m),
        change_amount: m.change_amount,
        payment_status: m.payment_status.clone(),
        payment_method: m.payment_method.clone(),
        settlement_payment_method: m.settlement_payment_method.clone(),
        settlement_pay_amount: m.settlement_pay_amount,
        settlement_at: m.settlement_at,
        order_status: m.order_status.clone(),
        estimated_done_at: m.estimated_done_at,
        created_by: m.created_by,
        cashier_name,
        created_at: m.created_at,
        items,
        payments: payment_rows,
        production_events: events,
    }
}

async fn response_for(
    db: &DatabaseConnection,
    transaction: transactions::Model,
    include_history: bool,
) -> Result<TransactionResponse, AppError> {
    let cashier_name = match transaction.created_by {
        Some(user_id) => User::find_by_id(user_id).one(db).await?.map(|user| user.name),
        None => None,
    };
    let items = TransactionItem::find()
        .filter(transaction_items::Column::TransactionId.eq(transaction.id))
        .order_by_asc(transaction_items::Column::Id)
        .all(db)
        .await?;
    let item_ids: Vec<i32> = items.iter().map(|item| item.id).collect();
    let addons = if item_ids.is_empty() {
        vec![]
    } else {
        TransactionItemAddon::find()
            .filter(transaction_item_addons::Column::TransactionItemId.is_in(item_ids.clone()))
            .all(db)
            .await?
    };
    let materials = if item_ids.is_empty() {
        vec![]
    } else {
        TransactionItemMaterial::find()
            .filter(transaction_item_materials::Column::TransactionItemId.is_in(item_ids))
            .order_by_asc(transaction_item_materials::Column::Id)
            .all(db)
            .await?
    };
    let mapped_items = items
        .iter()
        .map(|item| {
            let item_addons = addons
                .iter()
                .filter(|addon| addon.transaction_item_id == item.id)
                .map(map_item_addon)
                .collect();
            let item_materials = materials
                .iter()
                .filter(|material| material.transaction_item_id == item.id)
                .map(map_item_material)
                .collect();
            map_item(item, item_addons, item_materials)
        })
        .collect();
    let payment_rows = if include_history {
        Some(
            Payment::find()
                .filter(payments::Column::TransactionId.eq(transaction.id))
                .order_by_asc(payments::Column::Id)
                .all(db)
                .await?
                .iter()
                .map(map_payment)
                .collect(),
        )
    } else {
        None
    };
    let events = if include_history {
        Some(
            ProductionEvent::find()
                .filter(production_events::Column::TransactionId.eq(transaction.id))
                .order_by_asc(production_events::Column::Id)
                .all(db)
                .await?
                .iter()
                .map(map_production_event)
                .collect(),
        )
    } else {
        None
    };
    Ok(map_transaction(
        &transaction,
        cashier_name,
        Some(mapped_items),
        payment_rows,
        events,
    ))
}

// ==========================================
// READS
// ==========================================

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: TransactionQuery,
) -> Result<(Vec<TransactionResponse>, PaginationMeta), AppError> {
    let mut select = Transaction::find().order_by_desc(transactions::Column::Id);
    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(
            transactions::Column::InvoiceNumber
                .like(&keyword)
                .or(transactions::Column::CustomerName.like(&keyword)),
        );
    }
    if let Some(date) = query.date {
        let start = date.and_hms_opt(0, 0, 0).unwrap().and_utc();
        let end = date.and_hms_opt(23, 59, 59).unwrap().and_utc();
        select = select.filter(
            transactions::Column::CreatedAt
                .gte(start)
                .and(transactions::Column::CreatedAt.lte(end)),
        );
    }
    if let Some(status) = query.payment_status {
        select = select.filter(transactions::Column::PaymentStatus.eq(status));
    }
    if let Some(method) = query.payment_method {
        select = select.filter(
            transactions::Column::PaymentMethod
                .eq(method.clone())
                .or(transactions::Column::SettlementPaymentMethod.eq(Some(method))),
        );
    }
    if let Some(status) = query.order_status {
        select = select.filter(transactions::Column::OrderStatus.eq(status));
    }
    let (rows, meta) = pagination.fetch(select, db).await?;
    let mut output = Vec::with_capacity(rows.len());
    for row in rows {
        // List deliberately excludes payment/event history, but returns full
        // item/material snapshots so tracking badges are always truthful.
        output.push(response_for(db, row, false).await?);
    }
    Ok((output, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<TransactionResponse, AppError> {
    let transaction = Transaction::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    response_for(db, transaction, true).await
}

// ==========================================
// CHECKOUT AND SNAPSHOT CREATION
// ==========================================

async fn resolve_product_materials(
    product: &entity::products::Model,
    item: &crate::dto::TransactionItemInput,
) -> Result<Vec<ProcessedMaterial>, AppError> {
    // Kebutuhan bahan murni estimasi operator (pengganti buku catatan):
    // tidak ada BOM/rumus server. Field legacy single-material tidak lagi
    // didukung agar klien lama tidak mengirim data yang diabaikan diam-diam.
    if item.raw_material_id.is_some() || item.material_qty.is_some() {
        return Err(AppError::field(
            "materials",
            "Field bahan legacy tidak didukung. Gunakan array materials[].",
        ));
    }

    let inputs = item.materials.clone().unwrap_or_default();
    if inputs.is_empty() {
        if product.uses_material {
            return Err(AppError::field(
                "materials",
                &format!(
                    "Produk \"{}\" memakai bahan stok. Isi bahan yang digunakan untuk produksi.",
                    product.name
                ),
            ));
        }
        return Ok(Vec::new());
    }

    let mut seen = std::collections::HashSet::new();
    let mut result = Vec::with_capacity(inputs.len());
    for input in inputs {
        let qty = input.material_qty.unwrap_or_default();
        if qty <= Decimal::ZERO {
            return Err(AppError::field(
                "materials.material_qty",
                "Kuantitas bahan harus lebih dari 0",
            ));
        }
        if !seen.insert(input.raw_material_id) {
            return Err(AppError::field(
                "materials",
                "Bahan duplikat dalam satu item; gabungkan jumlahnya",
            ));
        }
        result.push(ProcessedMaterial {
            raw_material_id: input.raw_material_id,
            required_qty: qty,
            source_type: "MANUAL_POS".to_string(),
            consumption_basis: "MANUAL".to_string(),
            required_width_m: None,
            allow_offcut: false,
            bom_id: None,
            bom_line_id: None,
            bom_version: None,
            addon_id: None,
        });
    }
    Ok(result)
}

async fn resolve_addons(
    txn: &sea_orm::DatabaseTransaction,
    product: &entity::products::Model,
    item: &crate::dto::TransactionItemInput,
) -> Result<Vec<ProcessedAddon>, AppError> {
    let mut addons = Vec::new();
    for addon_input in item.addons.clone().unwrap_or_default() {
        let addon_qty = addon_input.qty.unwrap_or(1);
        if addon_qty < 1 {
            return Err(AppError::field("addons.qty", "Kuantitas add-on minimal 1"));
        }
        if let Some(addon_id) = addon_input.addon_id {
            let addon = ProductAddon::find_by_id(addon_id)
                .one(txn)
                .await?
                .ok_or_else(|| AppError::field("addons", "Add-on tidak ditemukan"))?;
            if !addon.is_active {
                return Err(AppError::conflict(format!("Add-on '{}' sudah dinonaktifkan", addon.name)));
            }
            if addon.category_id.is_some() && addon.category_id != product.category_id {
                return Err(AppError::field("addons", format!(
                    "Add-on '{}' tidak berlaku untuk kategori produk ini", addon.name
                )));
            }
            let price = match addon.price_type {
                RangePriceType::Fixed => addon.default_price,
                RangePriceType::Range => {
                    let price = addon_input.price.ok_or_else(|| {
                        AppError::field("addons.price", format!("Harga add-on '{}' wajib diisi", addon.name))
                    })?;
                    if price < addon.min_price || price > addon.max_price {
                        return Err(AppError::field("addons.price", format!(
                            "Harga add-on '{}' harus di antara {} dan {}", addon.name, addon.min_price, addon.max_price
                        )));
                    }
                    price
                }
            };
            addons.push(ProcessedAddon {
                addon_id: Some(addon.id),
                addon_name: addon.name,
                price,
                qty: addon_qty,
                subtotal: price * Decimal::from(addon_qty),
            });
        } else {
            let name = addon_input
                .addon_name
                .map(|name| name.trim().to_string())
                .filter(|name| !name.is_empty())
                .ok_or_else(|| AppError::field("addons", "Add-on kustom harus memiliki nama"))?;
            let price = addon_input.price.unwrap_or(Decimal::ZERO);
            if price < Decimal::ZERO {
                return Err(AppError::field("addons.price", "Harga add-on tidak boleh negatif"));
            }
            addons.push(ProcessedAddon {
                addon_id: None,
                addon_name: name,
                price,
                qty: addon_qty,
                subtotal: price * Decimal::from(addon_qty),
            });
        }
    }
    Ok(addons)
}

async fn insert_payment<C: sea_orm::ConnectionTrait>(
    db: &C,
    transaction_id: i32,
    payment_type: &str,
    amount: Decimal,
    payment_method: PaymentMethod,
    reference_no: Option<String>,
    notes: Option<String>,
    actor_id: Option<i32>,
) -> Result<(), AppError> {
    if amount <= Decimal::ZERO {
        return Ok(());
    }
    payments::ActiveModel {
        transaction_id: Set(transaction_id),
        payment_type: Set(payment_type.to_string()),
        amount: Set(amount),
        payment_method: Set(payment_method.as_str().to_string()),
        reference_no: Set(reference_no),
        notes: Set(notes),
        created_by: Set(actor_id),
        ..Default::default()
    }
    .insert(db)
    .await?;
    Ok(())
}

async fn add_production_event<C: sea_orm::ConnectionTrait>(
    db: &C,
    transaction_id: i32,
    event_type: &str,
    notes: Option<String>,
    actor_id: Option<i32>,
) -> Result<(), AppError> {
    production_events::ActiveModel {
        transaction_id: Set(transaction_id),
        event_type: Set(event_type.to_string()),
        notes: Set(notes),
        actor_id: Set(actor_id),
        ..Default::default()
    }
    .insert(db)
    .await?;
    Ok(())
}

async fn snapshots_for_transaction(
    txn: &sea_orm::DatabaseTransaction,
    transaction_id: i32,
) -> Result<Vec<transaction_item_materials::Model>, AppError> {
    let items = TransactionItem::find()
        .filter(transaction_items::Column::TransactionId.eq(transaction_id))
        .all(txn)
        .await?;
    let item_ids: Vec<i32> = items.iter().map(|item| item.id).collect();
    if item_ids.is_empty() {
        return Ok(vec![]);
    }
    Ok(TransactionItemMaterial::find()
        .filter(transaction_item_materials::Column::TransactionItemId.is_in(item_ids))
        .order_by_asc(transaction_item_materials::Column::RawMaterialId)
        .lock_exclusive()
        .all(txn)
        .await?)
}

async fn reserve_snapshot_materials(
    txn: &sea_orm::DatabaseTransaction,
    transaction_id: i32,
    invoice_number: &str,
    actor_id: Option<i32>,
    snapshots: Vec<SnapshotReservation>,
) -> Result<(), AppError> {
    let mut sorted = snapshots;
    sorted.sort_by_key(|snapshot| (snapshot.raw_material_id, snapshot.item_material_id));
    for snapshot in sorted {
        let reservation = inventory::reserve(
            txn,
            snapshot.raw_material_id,
            snapshot.qty,
            snapshot.required_width_m,
            snapshot.allow_offcut,
            inventory::LedgerContext {
                transaction_id: Some(transaction_id),
                transaction_item_id: Some(snapshot.item_id),
                transaction_item_material_id: Some(snapshot.item_material_id),
                actor_id,
                notes: Some(format!("Reservasi bahan untuk {}", invoice_number)),
                ..Default::default()
            },
        )
        .await?;
        inventory::mark_item_material_reserved(
            txn,
            snapshot.item_material_id,
            snapshot.qty,
            reservation.material_lot_id,
        )
        .await?;
    }
    Ok(())
}

async fn reserve_unreserved_snapshots(
    txn: &sea_orm::DatabaseTransaction,
    transaction: &transactions::Model,
    actor_id: Option<i32>,
) -> Result<usize, AppError> {
    let snapshots = snapshots_for_transaction(txn, transaction.id).await?;
    let reservations = snapshots
        .iter()
        .filter(|snapshot| snapshot.required_qty > Decimal::ZERO && snapshot.reserved_qty == Decimal::ZERO && snapshot.consumed_qty == Decimal::ZERO)
        .map(|snapshot| SnapshotReservation {
            item_id: snapshot.transaction_item_id,
            item_material_id: snapshot.id,
            raw_material_id: snapshot.raw_material_id,
            qty: snapshot.required_qty,
            required_width_m: snapshot.required_width_m,
            allow_offcut: snapshot.allow_offcut,
        })
        .collect::<Vec<_>>();
    let count = reservations.len();
    reserve_snapshot_materials(txn, transaction.id, &transaction.invoice_number, actor_id, reservations).await?;
    Ok(count)
}

pub async fn create(
    db: &DatabaseConnection,
    user_id: i32,
    payload: CreateTransactionRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    let idempotency_key = normalized_idempotency_key(payload.idempotency_key.clone())?;
    if let Some(key) = &idempotency_key {
        if let Some(existing) = Transaction::find()
            .filter(transactions::Column::IdempotencyKey.eq(Some(key.clone())))
            .one(db)
            .await?
        {
            return response_for(db, existing, true).await;
        }
    }
    if payload.pay_amount < Decimal::ZERO {
        return Err(AppError::field("pay_amount", "Pembayaran tidak boleh negatif"));
    }
    if payload.discount_amount.is_some_and(|discount| discount < Decimal::ZERO) {
        return Err(AppError::field("discount_amount", "Diskon tidak boleh negatif"));
    }

    let txn = db.begin().await?;
    // Defend again inside the transaction against a retry racing another retry.
    if let Some(key) = &idempotency_key {
        if let Some(existing) = Transaction::find()
            .filter(transactions::Column::IdempotencyKey.eq(Some(key.clone())))
            .one(&txn)
            .await?
        {
            txn.rollback().await?;
            return response_for(db, existing, true).await;
        }
    }

    let customer_name = match payload.customer_id {
        Some(customer_id) => Customer::find_by_id(customer_id)
            .one(&txn)
            .await?
            .map(|customer| customer.name)
            .ok_or_else(|| AppError::field("customer_id", "Pelanggan tidak ditemukan"))?,
        None => payload
            .customer_name
            .as_deref()
            .map(str::trim)
            .filter(|name| !name.is_empty())
            .unwrap_or("Umum")
            .to_string(),
    };

    let now: DateTime<Utc> = Utc::now();
    let date_str = now.format("%Y%m%d").to_string();
    let sequence = crate::services::invoice_counter::next(&txn, &date_str).await?;
    let invoice_number = format!("INV-{date_str}-{sequence:04}");
    let mut processed_items = Vec::new();
    let mut subtotal = Decimal::ZERO;

    for item_input in &payload.items {
        item_input.validate()?;
        validate_positive_dimensions(item_input.length, item_input.width)?;
        let product = Product::find_by_id(item_input.product_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::field("items", format!("Produk ID {} tidak ditemukan", item_input.product_id)))?;
        if !product.is_active {
            return Err(AppError::conflict(format!("Produk '{}' sudah dinonaktifkan", product.name)));
        }
        if item_input.qty < product.min_order.unwrap_or(1) {
            return Err(AppError::field(
                "qty",
                format!("Kuantitas produk '{}' belum memenuhi minimum order", product.name),
            ));
        }

        let variant = match item_input.product_variant_id {
            Some(variant_id) => {
                let variant = ProductVariant::find_by_id(variant_id)
                    .one(&txn)
                    .await?
                    .ok_or_else(|| AppError::field("items", "Varian produk tidak ditemukan"))?;
                if variant.product_id != product.id {
                    return Err(AppError::field("items", "Varian tidak cocok dengan produk"));
                }
                Some(variant)
            }
            None => None,
        };

        let (price, variant_name) = if let Some(variant) = &variant {
            let price = match variant.price_type {
                RangePriceType::Fixed => {
                    if let Some(custom) = item_input.custom_price {
                        if custom <= Decimal::ZERO {
                            return Err(AppError::field("custom_price", "Harga harus lebih dari 0"));
                        }
                        custom
                    } else {
                        variant.price
                    }
                }
                RangePriceType::Range => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field("custom_price", format!("Harga varian '{}' wajib diisi", variant.variant_name))
                    })?;
                    if custom < variant.min_price || custom > variant.max_price {
                        return Err(AppError::field("custom_price", "Harga varian di luar rentang master"));
                    }
                    custom
                }
            };
            (price, Some(variant.variant_name.clone()))
        } else {
            let price = match product.price_type {
                PriceType::Fixed => {
                    if let Some(custom) = item_input.custom_price {
                        if custom <= Decimal::ZERO {
                            return Err(AppError::field("custom_price", "Harga harus lebih dari 0"));
                        }
                        custom
                    } else {
                        product.default_price
                    }
                }
                PriceType::Range => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field("custom_price", format!("Harga produk '{}' wajib diisi", product.name))
                    })?;
                    if custom < product.min_price || custom > product.max_price {
                        return Err(AppError::field("custom_price", "Harga produk di luar rentang master"));
                    }
                    custom
                }
                PriceType::Custom => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field("custom_price", format!("Harga produk '{}' wajib diisi", product.name))
                    })?;
                    if custom < Decimal::ZERO {
                        return Err(AppError::field("custom_price", "Harga tidak boleh negatif"));
                    }
                    custom
                }
            };
            (price, None)
        };
        let item_subtotal = price * Decimal::from(item_input.qty);
        let addons = resolve_addons(&txn, &product, item_input).await?;
        let materials = resolve_product_materials(&product, item_input).await?;
        subtotal += item_subtotal + addons.iter().map(|addon| addon.subtotal).sum::<Decimal>();
        processed_items.push(ProcessedItem {
            product_id: product.id,
            product_variant_id: variant.as_ref().map(|value| value.id),
            product_name: product.name,
            variant_name,
            price,
            qty: item_input.qty,
            subtotal: item_subtotal,
            length: item_input.length,
            width: item_input.width,
            materials,
            addons,
        });
    }

    let discount = payload.discount_amount.unwrap_or(Decimal::ZERO);
    if discount > subtotal {
        return Err(AppError::field("discount_amount", "Diskon tidak boleh melebihi subtotal"));
    }
    let total = subtotal - discount;
    let tender = payload.pay_amount;
    let paid = tender.min(total);
    let change = tender - paid;
    let payment_status = payment_status_for(paid, total);
    let payment_method = payload.payment_method.unwrap_or(PaymentMethod::Cash);
    let transaction = transactions::ActiveModel {
        invoice_number: Set(invoice_number.clone()),
        idempotency_key: Set(idempotency_key),
        customer_id: Set(payload.customer_id),
        customer_name: Set(Some(customer_name)),
        subtotal_amount: Set(subtotal),
        discount_amount: Set(discount),
        total_amount: Set(total),
        pay_amount: Set(tender),
        change_amount: Set(change),
        payment_status: Set(payment_status.clone()),
        payment_method: Set(payment_method.clone()),
        settlement_payment_method: Set(None),
        settlement_pay_amount: Set(None),
        settlement_at: Set(None),
        order_status: Set(OrderStatus::Antrian),
        estimated_done_at: Set(payload.estimated_done_at),
        created_by: Set(Some(user_id)),
        ..Default::default()
    }
    .insert(&txn)
    .await?;

    let mut snapshot_reservations = Vec::new();
    for item in processed_items {
        let item_model = transaction_items::ActiveModel {
            transaction_id: Set(transaction.id),
            product_id: Set(Some(item.product_id)),
            product_variant_id: Set(item.product_variant_id),
            product_name: Set(item.product_name),
            variant_name: Set(item.variant_name),
            price: Set(item.price),
            qty: Set(item.qty),
            subtotal: Set(item.subtotal),
            length: Set(item.length),
            width: Set(item.width),
            ..Default::default()
        }
        .insert(&txn)
        .await?;
        for addon in item.addons {
            transaction_item_addons::ActiveModel {
                transaction_item_id: Set(item_model.id),
                addon_id: Set(addon.addon_id),
                addon_name: Set(addon.addon_name),
                price: Set(addon.price),
                qty: Set(addon.qty),
                subtotal: Set(addon.subtotal),
                ..Default::default()
            }
            .insert(&txn)
            .await?;
        }
        for material in item.materials {
            let raw_material = RawMaterial::find_by_id(material.raw_material_id)
                .one(&txn)
                .await?
                .ok_or_else(|| AppError::field("materials", "Bahan baku tidak ditemukan"))?;
            if !raw_material.is_active {
                return Err(AppError::conflict(format!("Bahan '{}' sudah dinonaktifkan", raw_material.name)));
            }
            let snapshot = transaction_item_materials::ActiveModel {
                transaction_item_id: Set(item_model.id),
                raw_material_id: Set(raw_material.id),
                material_lot_id: Set(None),
                required_width_m: Set(material.required_width_m),
                allow_offcut: Set(material.allow_offcut),
                material_name: Set(raw_material.name),
                unit: Set(raw_material.unit),
                required_qty: Set(material.required_qty),
                reserved_qty: Set(Decimal::ZERO),
                consumed_qty: Set(Decimal::ZERO),
                waste_qty: Set(Decimal::ZERO),
                source_type: Set(material.source_type),
                consumption_basis: Set(material.consumption_basis),
                bom_id: Set(material.bom_id),
                bom_line_id: Set(material.bom_line_id),
                bom_version: Set(material.bom_version),
                addon_id: Set(material.addon_id),
                ..Default::default()
            }
            .insert(&txn)
            .await?;
            snapshot_reservations.push(SnapshotReservation {
                item_id: item_model.id,
                item_material_id: snapshot.id,
                raw_material_id: snapshot.raw_material_id,
                qty: snapshot.required_qty,
                required_width_m: snapshot.required_width_m,
                allow_offcut: snapshot.allow_offcut,
            });
        }
    }

    if paid > Decimal::ZERO {
        insert_payment(
            &txn,
            transaction.id,
            "PAYMENT",
            paid,
            payment_method.clone(),
            None,
            Some(if change > Decimal::ZERO {
                format!("Tender {} dengan kembalian {}", tender, change)
            } else {
                "Pembayaran saat checkout".to_string()
            }),
            Some(user_id),
        )
        .await?;
        reserve_snapshot_materials(
            &txn,
            transaction.id,
            &invoice_number,
            Some(user_id),
            snapshot_reservations,
        )
        .await?;
        add_production_event(
            &txn,
            transaction.id,
            "STOCK_RESERVED",
            Some("DP/lunas diterima; bahan dikunci untuk produksi".to_string()),
            Some(user_id),
        )
        .await?;
    }
    add_production_event(
        &txn,
        transaction.id,
        "ORDER_CREATED",
        Some("Order dibuat melalui POS".to_string()),
        Some(user_id),
    )
    .await?;
    audit::log(
        &txn,
        Some(user_id),
        "CREATE_TRANSACTION",
        "TRANSACTION",
        transaction.id.to_string(),
        None,
        audit::snapshot(&transaction),
        Some("Checkout POS atomik".to_string()),
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, transaction.id).await
}

// ==========================================
// PAYMENT / RESERVATION
// ==========================================

pub async fn update_payment(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdatePaymentRequest,
) -> Result<TransactionResponse, AppError> {
    update_payment_as(db, None, id, payload).await
}

pub async fn update_payment_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    payload: UpdatePaymentRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    if payload.additional_pay_amount <= Decimal::ZERO {
        return Err(AppError::field("additional_pay_amount", "Pembayaran tambahan harus lebih dari 0"));
    }
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    if transaction.order_status == OrderStatus::Batal {
        return Err(AppError::conflict("Tidak dapat menerima pembayaran pada transaksi yang dibatalkan"));
    }
    let previous_paid = net_paid(&transaction);
    let outstanding = (transaction.total_amount - previous_paid).max(Decimal::ZERO);
    if outstanding == Decimal::ZERO {
        return Err(AppError::conflict("Transaksi ini sudah lunas; gunakan refund bila perlu"));
    }
    let tender = payload.additional_pay_amount;
    let applied = tender.min(outstanding);
    let change = tender - applied;
    let paid_after = previous_paid + applied;
    let status_after = payment_status_for(paid_after, transaction.total_amount);
    let payment_method = payload.payment_method.unwrap_or(PaymentMethod::Cash);
    let before = audit::snapshot(&transaction);
    let mut active: transactions::ActiveModel = transaction.clone().into();
    active.pay_amount = Set(transaction.pay_amount + tender);
    active.change_amount = Set(transaction.change_amount + change);
    active.payment_status = Set(status_after.clone());
    active.settlement_payment_method = Set(Some(payment_method.clone()));
    active.settlement_pay_amount = Set(Some(tender));
    active.settlement_at = Set(Some(Utc::now()));
    let updated = active.update(&txn).await?;
    insert_payment(
        &txn,
        updated.id,
        "PAYMENT",
        applied,
        payment_method,
        payload.reference_no.map(|value| value.trim().to_string()),
        payload.notes.map(|value| value.trim().to_string()).or_else(|| {
            Some(if change > Decimal::ZERO {
                format!("Tender {} dengan kembalian {}", tender, change)
            } else {
                "Pelunasan/DP tambahan".to_string()
            })
        }),
        actor_id,
    )
    .await?;
    let newly_reserved = if previous_paid == Decimal::ZERO
        && paid_after > Decimal::ZERO
        && updated.order_status == OrderStatus::Antrian
    {
        reserve_unreserved_snapshots(&txn, &updated, actor_id).await?
    } else {
        0
    };
    if newly_reserved > 0 {
        add_production_event(
            &txn,
            updated.id,
            "STOCK_RESERVED",
            Some("Pembayaran masuk; bahan order dikunci".to_string()),
            actor_id,
        )
        .await?;
    }
    add_production_event(
        &txn,
        updated.id,
        "PAYMENT_RECEIVED",
        Some(format!("Pembayaran neto {} diterima", applied)),
        actor_id,
    )
    .await?;
    audit::log(
        &txn,
        actor_id,
        "RECORD_PAYMENT",
        "TRANSACTION",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Pembayaran ditambahkan melalui ledger".to_string()),
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, updated.id).await
}

/// Pelunasan atomik: mencatat pembayaran + memajukan status ke DIAMBIL
/// dalam satu DB transaction. Menghindari inkonsistensi bila salah satu
/// langkah gagal (misal payment tercatat tapi status tidak berubah).
pub async fn settle_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    payload: SettleTransactionRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    if payload.pay_amount <= Decimal::ZERO {
        return Err(AppError::field("pay_amount", "Nominal pelunasan harus lebih dari 0"));
    }
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;

    // Validasi state: hanya order SELESAI yang bisa dilunasi+diambil
    if transaction.order_status == OrderStatus::Batal {
        return Err(AppError::conflict("Transaksi yang dibatalkan tidak dapat dilunasi"));
    }
    if transaction.order_status != OrderStatus::Selesai {
        return Err(AppError::conflict(format!(
            "Pelunasan hanya untuk order SELESAI. Status saat ini: {:?}",
            transaction.order_status
        )));
    }

    let previous_paid = net_paid(&transaction);
    let outstanding = (transaction.total_amount - previous_paid).max(Decimal::ZERO);
    if outstanding == Decimal::ZERO {
        return Err(AppError::conflict("Transaksi ini sudah lunas"));
    }

    let tender = payload.pay_amount;
    let applied = tender.min(outstanding);
    let change = tender - applied;
    let paid_after = previous_paid + applied;
    let payment_method = payload.payment_method.unwrap_or(PaymentMethod::Cash);

    let before = audit::snapshot(&transaction);
    let mut active: transactions::ActiveModel = transaction.clone().into();
    active.pay_amount = Set(transaction.pay_amount + tender);
    active.change_amount = Set(transaction.change_amount + change);
    active.payment_status = Set(payment_status_for(paid_after, transaction.total_amount));
    active.settlement_payment_method = Set(Some(payment_method.clone()));
    active.settlement_pay_amount = Set(Some(tender));
    active.settlement_at = Set(Some(Utc::now()));
    // Atomically advance to DIAMBIL
    active.order_status = Set(OrderStatus::Diambil);
    let updated = active.update(&txn).await?;

    insert_payment(
        &txn,
        updated.id,
        "PAYMENT",
        applied,
        payment_method,
        payload.reference_no.map(|v| v.trim().to_string()),
        payload.notes.map(|v| v.trim().to_string()).or_else(|| {
            Some(if change > Decimal::ZERO {
                format!("Pelunasan. Tender {} dengan kembalian {}", tender, change)
            } else {
                "Pelunasan".to_string()
            })
        }),
        actor_id,
    )
    .await?;

    add_production_event(
        &txn,
        updated.id,
        "ORDER_COMPLETED",
        Some("Pesanan dilunasi dan diserahkan ke pelanggan".to_string()),
        actor_id,
    )
    .await?;

    audit::log(
        &txn,
        actor_id,
        "SETTLE",
        "TRANSACTION",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Pelunasan atomik: pembayaran + status DIAMBIL".to_string()),
    )
    .await?;

    txn.commit().await?;
    get_by_id(db, updated.id).await
}

pub async fn refund_payment_as(
    db: &DatabaseConnection,
    actor_id: i32,
    id: i32,
    payload: RefundPaymentRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    if payload.amount <= Decimal::ZERO {
        return Err(AppError::field("amount", "Refund harus lebih dari 0"));
    }
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    let paid_before = net_paid(&transaction);
    if payload.amount > paid_before {
        return Err(AppError::conflict("Refund melebihi total pembayaran neto pelanggan"));
    }
    let paid_after = paid_before - payload.amount;
    let status_after = payment_status_for(paid_after, transaction.total_amount);
    let before = audit::snapshot(&transaction);
    let mut active: transactions::ActiveModel = transaction.clone().into();
    active.pay_amount = Set(transaction.pay_amount - payload.amount);
    active.payment_status = Set(status_after);
    active.settlement_payment_method = Set(Some(payload.payment_method.clone()));
    active.settlement_pay_amount = Set(Some(-payload.amount));
    active.settlement_at = Set(Some(Utc::now()));
    let updated = active.update(&txn).await?;
    insert_payment(
        &txn,
        updated.id,
        "REFUND",
        payload.amount,
        payload.payment_method,
        payload.reference_no.map(|value| value.trim().to_string()),
        Some(payload.reason.clone()),
        Some(actor_id),
    )
    .await?;
    // An antrian order without any remaining payment must no longer hold stock.
    if paid_after == Decimal::ZERO && updated.order_status == OrderStatus::Antrian {
        let reservations = StockReservation::find()
            .filter(stock_reservations::Column::TransactionId.eq(updated.id))
            .filter(stock_reservations::Column::State.eq("ACTIVE"))
            .order_by_asc(stock_reservations::Column::RawMaterialId)
            .lock_exclusive()
            .all(&txn)
            .await?;
        for reservation in reservations {
            inventory::release_reservation(
                &txn,
                &reservation,
                inventory::LedgerContext {
                    transaction_id: Some(updated.id),
                    transaction_item_material_id: Some(reservation.transaction_item_material_id),
                    actor_id: Some(actor_id),
                    notes: Some("Reservasi dilepas karena refund penuh".to_string()),
                    ..Default::default()
                },
            )
            .await?;
            inventory::mark_item_material_reserved(&txn, reservation.transaction_item_material_id, Decimal::ZERO, None).await?;
        }
    }
    add_production_event(
        &txn,
        updated.id,
        "PAYMENT_REFUNDED",
        Some(payload.reason),
        Some(actor_id),
    )
    .await?;
    audit::log(
        &txn,
        Some(actor_id),
        "REFUND_PAYMENT",
        "TRANSACTION",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Refund dicatat dalam payment ledger".to_string()),
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, updated.id).await
}

// ==========================================
// PRODUCTION STATE MACHINE
// ==========================================

pub async fn update_status(
    db: &DatabaseConnection,
    id: i32,
    order_status: OrderStatus,
) -> Result<TransactionResponse, AppError> {
    update_status_as(db, None, id, order_status).await
}

pub async fn update_status_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    target: OrderStatus,
) -> Result<TransactionResponse, AppError> {
    if target == OrderStatus::Batal {
        return Err(AppError::conflict("Gunakan endpoint pembatalan agar reservasi/waste dicatat dengan benar"));
    }
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    let valid_transition = matches!(
        (&transaction.order_status, &target),
        (OrderStatus::Antrian, OrderStatus::Proses)
            | (OrderStatus::Proses, OrderStatus::Selesai)
            | (OrderStatus::Selesai, OrderStatus::Diambil)
    );
    if !valid_transition {
        return Err(AppError::conflict(format!(
            "Transisi status {} ke {} tidak diizinkan",
            format!("{:?}", transaction.order_status).to_uppercase(),
            format!("{:?}", target).to_uppercase(),
        )));
    }
    let before = audit::snapshot(&transaction);
    if target == OrderStatus::Proses {
        if transaction.payment_status == PaymentStatus::Unpaid || net_paid(&transaction) <= Decimal::ZERO {
            return Err(AppError::conflict("Order belum memiliki DP/pembayaran; bahan belum boleh diproduksi"));
        }
        let snapshots = snapshots_for_transaction(&txn, transaction.id).await?;
        let reservations = StockReservation::find()
            .filter(stock_reservations::Column::TransactionId.eq(transaction.id))
            .filter(stock_reservations::Column::State.eq("ACTIVE"))
            .order_by_asc(stock_reservations::Column::RawMaterialId)
            .lock_exclusive()
            .all(&txn)
            .await?;
        let required_snapshot_count = snapshots
            .iter()
            .filter(|snapshot| snapshot.required_qty > Decimal::ZERO)
            .count();
        if required_snapshot_count > 0 && reservations.len() != required_snapshot_count {
            return Err(AppError::conflict(
                "Reservasi bahan belum lengkap. Periksa stok/reservasi sebelum memulai produksi.",
            ));
        }
        for reservation in reservations {
            let snapshot = snapshots
                .iter()
                .find(|snapshot| snapshot.id == reservation.transaction_item_material_id)
                .ok_or_else(|| AppError::Internal("Reservasi tidak memiliki snapshot bahan".into()))?;
            inventory::consume_reservation(
                &txn,
                &reservation,
                inventory::LedgerContext {
                    transaction_id: Some(transaction.id),
                    transaction_item_id: Some(snapshot.transaction_item_id),
                    transaction_item_material_id: Some(snapshot.id),
                    actor_id,
                    notes: Some("Bahan dikonsumsi saat pekerjaan mulai diproses".to_string()),
                    ..Default::default()
                },
            )
            .await?;
            inventory::mark_item_material_consumed(
                &txn,
                snapshot.id,
                snapshot.consumed_qty + reservation.qty,
            )
            .await?;
        }
        add_production_event(
            &txn,
            transaction.id,
            "PRODUCTION_STARTED",
            Some("Reservasi dikonversi menjadi konsumsi fisik".to_string()),
            actor_id,
        )
        .await?;
    }
    if target == OrderStatus::Diambil && transaction.payment_status != PaymentStatus::Paid {
        return Err(AppError::conflict("Pesanan hanya dapat diambil setelah pembayaran lunas"));
    }
    let mut active: transactions::ActiveModel = transaction.into();
    active.order_status = Set(target.clone());
    let updated = active.update(&txn).await?;
    let event_type = match target {
        OrderStatus::Proses => "STATUS_PROSES",
        OrderStatus::Selesai => "PRODUCTION_FINISHED",
        OrderStatus::Diambil => "ORDER_COLLECTED",
        _ => "STATUS_CHANGED",
    };
    add_production_event(
        &txn,
        updated.id,
        event_type,
        Some(format!("Status menjadi {:?}", target).to_uppercase()),
        actor_id,
    )
    .await?;
    audit::log(
        &txn,
        actor_id,
        "CHANGE_ORDER_STATUS",
        "TRANSACTION",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Transisi state machine produksi".to_string()),
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, updated.id).await
}

pub async fn record_waste_as(
    db: &DatabaseConnection,
    actor_id: i32,
    id: i32,
    payload: RecordWasteRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    if transaction.order_status != OrderStatus::Proses {
        return Err(AppError::conflict("Waste hanya dapat dicatat saat order berstatus PROSES"));
    }
    let snapshots = snapshots_for_transaction(&txn, transaction.id).await?;
    for waste in &payload.materials {
        if waste.qty <= Decimal::ZERO {
            return Err(AppError::field("materials.qty", "Kuantitas waste harus lebih dari 0"));
        }
        let snapshot = snapshots
            .iter()
            .find(|snapshot| snapshot.id == waste.transaction_item_material_id)
            .ok_or_else(|| AppError::field("transaction_item_material_id", "Bahan tidak milik transaksi ini"))?;
        inventory::record_waste_from_consumed(
            &txn,
            snapshot,
            waste.qty,
            &waste.reason_code.trim().to_ascii_uppercase(),
            inventory::LedgerContext {
                transaction_id: Some(transaction.id),
                transaction_item_id: Some(snapshot.transaction_item_id),
                actor_id: Some(actor_id),
                notes: payload.notes.clone(),
                ..Default::default()
            },
        )
        .await?;
    }
    add_production_event(
        &txn,
        transaction.id,
        "WASTE_RECORDED",
        payload.notes.clone().or_else(|| Some("Waste/print failure tercatat".to_string())),
        Some(actor_id),
    )
    .await?;
    audit::log(
        &txn,
        Some(actor_id),
        "RECORD_WASTE",
        "TRANSACTION",
        transaction.id.to_string(),
        None,
        Some(serde_json::to_string(&payload.materials).unwrap_or_default()),
        payload.notes,
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, transaction.id).await
}

pub async fn record_rework_as(
    db: &DatabaseConnection,
    actor_id: i32,
    id: i32,
    payload: RecordReworkRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    if transaction.order_status != OrderStatus::Proses {
        return Err(AppError::conflict("Rework hanya dapat dicatat saat order berstatus PROSES"));
    }
    let snapshots = snapshots_for_transaction(&txn, transaction.id).await?;
    for rework in &payload.materials {
        if rework.qty <= Decimal::ZERO {
            return Err(AppError::field("materials.qty", "Kuantitas rework harus lebih dari 0"));
        }
        let snapshot = snapshots
            .iter()
            .find(|snapshot| snapshot.id == rework.transaction_item_material_id)
            .ok_or_else(|| AppError::field("transaction_item_material_id", "Bahan tidak milik transaksi ini"))?;
        inventory::consume_for_rework(
            &txn,
            snapshot,
            rework.qty,
            &rework.reason_code.trim().to_ascii_uppercase(),
            inventory::LedgerContext {
                transaction_id: Some(transaction.id),
                transaction_item_id: Some(snapshot.transaction_item_id),
                actor_id: Some(actor_id),
                notes: payload.notes.clone(),
                ..Default::default()
            },
        )
        .await?;
    }
    add_production_event(
        &txn,
        transaction.id,
        "REWORK_CONSUMED",
        payload.notes.clone().or_else(|| Some("Bahan tambahan untuk rework dikonsumsi".to_string())),
        Some(actor_id),
    )
    .await?;
    audit::log(
        &txn,
        Some(actor_id),
        "RECORD_REWORK",
        "TRANSACTION",
        transaction.id.to_string(),
        None,
        Some(serde_json::to_string(&payload.materials).unwrap_or_default()),
        payload.notes,
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, transaction.id).await
}

pub async fn cancel(
    db: &DatabaseConnection,
    id: i32,
) -> Result<TransactionResponse, AppError> {
    cancel_as(
        db,
        None,
        id,
        CancelTransactionRequest {
            reason: "Pembatalan legacy/POS".to_string(),
            waste_materials: None,
        },
    )
    .await
}

pub async fn cancel_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    payload: CancelTransactionRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;
    let txn = db.begin().await?;
    let transaction = Transaction::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;
    match transaction.order_status {
        OrderStatus::Antrian | OrderStatus::Proses => {}
        OrderStatus::Selesai | OrderStatus::Diambil => {
            return Err(AppError::conflict("Order selesai/diambil tidak dapat dibatalkan; gunakan retur/refund terpisah"));
        }
        OrderStatus::Batal => return Err(AppError::conflict("Transaksi sudah dibatalkan")),
    }
    let before = audit::snapshot(&transaction);
    // Waste optional before cancel: useful when customer cancels after a print
    // failure. Physical consumption is never restored.
    if let Some(wastes) = &payload.waste_materials {
        let snapshots = snapshots_for_transaction(&txn, transaction.id).await?;
        for waste in wastes {
            if waste.qty <= Decimal::ZERO {
                return Err(AppError::field("waste_materials.qty", "Waste harus lebih dari 0"));
            }
            let snapshot = snapshots
                .iter()
                .find(|snapshot| snapshot.id == waste.transaction_item_material_id)
                .ok_or_else(|| AppError::field("waste_materials", "Bahan waste tidak milik transaksi"))?;
            inventory::record_waste_from_consumed(
                &txn,
                snapshot,
                waste.qty,
                &waste.reason_code.trim().to_ascii_uppercase(),
                inventory::LedgerContext {
                    transaction_id: Some(transaction.id),
                    transaction_item_id: Some(snapshot.transaction_item_id),
                    actor_id,
                    notes: Some(format!("Waste saat pembatalan: {}", payload.reason)),
                    ..Default::default()
                },
            )
            .await?;
        }
    }
    let reservations = StockReservation::find()
        .filter(stock_reservations::Column::TransactionId.eq(transaction.id))
        .filter(stock_reservations::Column::State.eq("ACTIVE"))
        .order_by_asc(stock_reservations::Column::RawMaterialId)
        .lock_exclusive()
        .all(&txn)
        .await?;
    for reservation in reservations {
        inventory::release_reservation(
            &txn,
            &reservation,
            inventory::LedgerContext {
                transaction_id: Some(transaction.id),
                transaction_item_material_id: Some(reservation.transaction_item_material_id),
                actor_id,
                notes: Some(format!("Reservasi dilepas: {}", payload.reason)),
                ..Default::default()
            },
        )
        .await?;
        inventory::mark_item_material_reserved(&txn, reservation.transaction_item_material_id, Decimal::ZERO, None).await?;
    }
    let mut active: transactions::ActiveModel = transaction.into();
    active.order_status = Set(OrderStatus::Batal);
    let updated = active.update(&txn).await?;
    add_production_event(
        &txn,
        updated.id,
        "ORDER_CANCELLED",
        Some(payload.reason.clone()),
        actor_id,
    )
    .await?;
    audit::log(
        &txn,
        actor_id,
        "CANCEL_TRANSACTION",
        "TRANSACTION",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some(payload.reason),
    )
    .await?;
    txn.commit().await?;
    get_by_id(db, updated.id).await
}

// ==========================================
// INVOICE
// ==========================================

pub async fn get_invoice_data(
    db: &DatabaseConnection,
    store: &StoreConfig,
    id: i32,
) -> Result<InvoicePrintData, AppError> {
    let transaction = get_by_id(db, id).await?;
    let remaining_amount = (transaction.total_amount - transaction.paid_amount).max(Decimal::ZERO);
    Ok(InvoicePrintData {
        store_name: store.name.clone(),
        store_address: store.address.clone(),
        store_phone: store.phone.clone(),
        invoice_number: transaction.invoice_number,
        date: transaction.created_at,
        cashier_name: transaction.cashier_name.unwrap_or_else(|| "Kasir".to_string()),
        customer_name: transaction.customer_name,
        payment_status: transaction.payment_status,
        payment_method: transaction.payment_method,
        settlement_payment_method: transaction.settlement_payment_method,
        settlement_pay_amount: transaction.settlement_pay_amount,
        order_status: transaction.order_status,
        estimated_done_at: transaction.estimated_done_at,
        items: transaction.items.unwrap_or_default(),
        subtotal_amount: transaction.subtotal_amount,
        discount_amount: transaction.discount_amount,
        total_amount: transaction.total_amount,
        pay_amount: transaction.pay_amount,
        paid_amount: transaction.paid_amount,
        change_amount: transaction.change_amount,
        remaining_amount,
    })
}
