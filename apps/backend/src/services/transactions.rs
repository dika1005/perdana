use chrono::{DateTime, Utc};
use entity::enums::{MutationType, OrderStatus, PaymentMethod, PaymentStatus, PriceType, RangePriceType};
use entity::prelude::*;
use entity::{raw_material_mutations, raw_materials, transaction_item_addons, transaction_items, transactions, users};
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, LoaderTrait, ModelTrait,
    QueryFilter, QueryOrder, Set, TransactionTrait,
};
use validator::Validate;

use crate::dto::{
    CreateTransactionRequest, InvoicePrintData, Pagination, PaginationMeta,
    TransactionItemAddonResponse, TransactionItemResponse, TransactionQuery, TransactionResponse,
    UpdatePaymentRequest,
};
use crate::error::AppError;

pub fn map_item_addon(m: &transaction_item_addons::Model) -> TransactionItemAddonResponse {
    TransactionItemAddonResponse {
        id: m.id,
        addon_name: m.addon_name.clone(),
        price: m.price,
        qty: m.qty,
        subtotal: m.subtotal,
    }
}

pub fn map_item(
    m: &transaction_items::Model,
    addons: Vec<TransactionItemAddonResponse>,
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
        addons,
    }
}

pub fn map_transaction(
    m: &transactions::Model,
    cashier_name: Option<String>,
    items: Option<Vec<TransactionItemResponse>>,
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
    }
}

// ==========================================
// TRANSACTIONS
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

    if let Some(p_status) = query.payment_status {
        select = select.filter(transactions::Column::PaymentStatus.eq(p_status));
    }

    if let Some(pm) = query.payment_method {
        select = select.filter(
            transactions::Column::PaymentMethod
                .eq(pm.clone())
                .or(transactions::Column::SettlementPaymentMethod.eq(Some(pm))),
        );
    }

    if let Some(o_status) = query.order_status {
        select = select.filter(transactions::Column::OrderStatus.eq(o_status));
    }

    let (items, meta) = pagination.fetch(select, db).await?;

    // Load cashier users
    let cashier_ids: Vec<i32> = items.iter().filter_map(|t| t.created_by).collect();
    let cashiers = if !cashier_ids.is_empty() {
        User::find()
            .filter(users::Column::Id.is_in(cashier_ids))
            .all(db)
            .await?
    } else {
        vec![]
    };

    // Load items for each transaction
    let tx_items_list = items.load_many(TransactionItem::find(), db).await?;
    let all_item_ids: Vec<i32> = tx_items_list.iter().flat_map(|its| its.iter().map(|it| it.id)).collect();
    let all_addons = if !all_item_ids.is_empty() {
        TransactionItemAddon::find()
            .filter(transaction_item_addons::Column::TransactionItemId.is_in(all_item_ids))
            .all(db)
            .await?
    } else {
        vec![]
    };

    let result = items
        .into_iter()
        .zip(tx_items_list.into_iter())
        .map(|(t, t_items)| {
            let c_name = t.created_by.and_then(|id| {
                cashiers
                    .iter()
                    .find(|u| u.id == id)
                    .map(|u| u.name.clone())
            });

            let mapped_items: Vec<TransactionItemResponse> = t_items
                .into_iter()
                .map(|it| {
                    let it_addons = all_addons
                        .iter()
                        .filter(|ad| ad.transaction_item_id == it.id)
                        .map(map_item_addon)
                        .collect();
                    map_item(&it, it_addons)
                })
                .collect();

            map_transaction(&t, c_name, Some(mapped_items))
        })
        .collect();

    Ok((result, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<TransactionResponse, AppError> {
    let transaction = Transaction::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;

    let cashier_name = if let Some(uid) = transaction.created_by {
        User::find_by_id(uid)
            .one(db)
            .await?
            .map(|u| u.name)
    } else {
        None
    };

    let items = transaction
        .find_related(TransactionItem)
        .order_by_asc(transaction_items::Column::Id)
        .all(db)
        .await?;

    let addons = items.load_many(TransactionItemAddon::find(), db).await?;

    let item_responses = items
        .into_iter()
        .zip(addons.into_iter())
        .map(|(item, item_addons)| {
            let addon_res = item_addons.iter().map(map_item_addon).collect();
            map_item(&item, addon_res)
        })
        .collect();

    Ok(map_transaction(&transaction, cashier_name, Some(item_responses)))
}

pub async fn create(
    db: &DatabaseConnection,
    user_id: i32,
    payload: CreateTransactionRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;

    let txn = db.begin().await?;

    // 1. Resolve Customer
    let customer_name = if let Some(cust_id) = payload.customer_id {
        let cust = Customer::find_by_id(cust_id).one(&txn).await?;
        if let Some(c) = cust {
            c.name
        } else {
            return Err(AppError::field("customer_id", "Pelanggan tidak ditemukan"));
        }
    } else {
        payload
            .customer_name
            .filter(|n| !n.trim().is_empty())
            .unwrap_or_else(|| "Umum".to_string())
    };

    // 2. Generate Invoice Number unik: INV-YYYYMMDD-<sequence>
    //    Sequence diambil dari counter tabel `invoice_counter` agar tidak
    //    pernah bentrok walau dua transaksi dibuat dalam detik yang sama.
    let now: DateTime<Utc> = Utc::now();
    let date_str = now.format("%Y%m%d").to_string();
    let seq = crate::services::invoice_counter::next(&txn, &date_str).await?;
    let invoice_number = format!("INV-{date_str}-{seq:04}");

    // 3. Process Items & Addons
    let mut total_subtotal = Decimal::ZERO;

    struct ProcessedAddon {
        addon_name: String,
        price: Decimal,
        qty: i32,
        subtotal: Decimal,
    }

    struct ProcessedMaterial {
        raw_material_id: i32,
        material_qty: i32,
    }

    struct ProcessedItem {
        product_id: i32,
        product_variant_id: Option<i32>,
        product_name: String,
        variant_name: Option<String>,
        price: Decimal,
        qty: i32,
        subtotal: Decimal,
        materials: Vec<ProcessedMaterial>,
        addons: Vec<ProcessedAddon>,
    }

    let mut processed_items = Vec::new();

    for item_input in payload.items {
        item_input.validate()?;

        let product = Product::find_by_id(item_input.product_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::field("items", format!("Produk ID {} tidak ditemukan", item_input.product_id)))?;

        let min_order = product.min_order.unwrap_or(1);
        if item_input.qty < min_order {
            return Err(AppError::field(
                "qty",
                format!("Kuantitas produk '{}' minimal {}", product.name, min_order),
            ));
        }

        let mut linked_raw_material_id = product.raw_material_id;
        let mut linked_material_amount = product.material_amount.unwrap_or(Decimal::ONE);

        let (unit_price, variant_name) = if let Some(variant_id) = item_input.product_variant_id {
            let variant = ProductVariant::find_by_id(variant_id)
                .one(&txn)
                .await?
                .ok_or_else(|| AppError::field("items", "Varian produk tidak ditemukan"))?;

            if variant.product_id != product.id {
                return Err(AppError::field("items", "Varian tidak cocok dengan produk"));
            }

            if variant.raw_material_id.is_some() {
                linked_raw_material_id = variant.raw_material_id;
                linked_material_amount = variant.material_amount.unwrap_or(Decimal::ONE);
            }

            let price = match variant.price_type {
                RangePriceType::Fixed => variant.price,
                RangePriceType::Range => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field(
                            "custom_price",
                            format!(
                                "Varian '{}' memiliki harga rentang ({}-{}). Harga wajib diisi",
                                variant.variant_name, variant.min_price, variant.max_price
                            ),
                        )
                    })?;
                    if custom < variant.min_price || custom > variant.max_price {
                        return Err(AppError::field(
                            "custom_price",
                            format!(
                                "Harga varian '{}' harus di antara {} dan {}",
                                variant.variant_name, variant.min_price, variant.max_price
                            ),
                        ));
                    }
                    custom
                }
            };
            (price, Some(variant.variant_name))
        } else {
            let price = match product.price_type {
                PriceType::Fixed => product.default_price,
                PriceType::Range => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field(
                            "custom_price",
                            format!(
                                "Produk '{}' memiliki harga rentang ({}-{}). Harga wajib diisi",
                                product.name, product.min_price, product.max_price
                            ),
                        )
                    })?;
                    if custom < product.min_price || custom > product.max_price {
                        return Err(AppError::field(
                            "custom_price",
                            format!(
                                "Harga produk '{}' harus di antara {} dan {}",
                                product.name, product.min_price, product.max_price
                            ),
                        ));
                    }
                    custom
                }
                PriceType::Custom => {
                    let custom = item_input.custom_price.ok_or_else(|| {
                        AppError::field(
                            "custom_price",
                            format!("Produk '{}' bertipe custom. Harga wajib diisi", product.name),
                        )
                    })?;
                    if custom < Decimal::ZERO {
                        return Err(AppError::field("custom_price", "Harga tidak boleh negatif"));
                    }
                    custom
                }
            };
            (price, None)
        };

        let item_subtotal = unit_price * Decimal::from(item_input.qty);
        total_subtotal += item_subtotal;

        let mut processed_addons = Vec::new();
        if let Some(addons_input) = item_input.addons {
            for addon_in in addons_input {
                let addon_qty = addon_in.qty.unwrap_or(1).max(1);

                let (addon_name, addon_price) = if let Some(addon_id) = addon_in.addon_id {
                    let addon = ProductAddon::find_by_id(addon_id)
                        .one(&txn)
                        .await?
                        .ok_or_else(|| AppError::field("addons", "Add-on tidak ditemukan"))?;

                    let price = match addon.price_type {
                        RangePriceType::Fixed => addon.default_price,
                        RangePriceType::Range => {
                            let custom = addon_in.price.ok_or_else(|| {
                                AppError::field(
                                    "addons.price",
                                    format!(
                                        "Add-on '{}' memiliki harga rentang ({}-{}). Harga wajib diisi",
                                        addon.name, addon.min_price, addon.max_price
                                    ),
                                )
                            })?;
                            if custom < addon.min_price || custom > addon.max_price {
                                return Err(AppError::field(
                                    "addons.price",
                                    format!(
                                        "Harga add-on '{}' harus di antara {} dan {}",
                                        addon.name, addon.min_price, addon.max_price
                                    ),
                                ));
                            }
                            custom
                        }
                    };
                    (addon.name, price)
                } else if let Some(name) = addon_in.addon_name {
                    let price = addon_in.price.unwrap_or(Decimal::ZERO);
                    (name, price)
                } else {
                    return Err(AppError::field("addons", "Add-on harus memiliki ID atau nama"));
                };

                let addon_subtotal = addon_price * Decimal::from(addon_qty);
                total_subtotal += addon_subtotal;

                processed_addons.push(ProcessedAddon {
                    addon_name,
                    price: addon_price,
                    qty: addon_qty,
                    subtotal: addon_subtotal,
                });
            }
        }

        // Build materials list: prefer new multi-material, fallback to legacy single, then BOM link
        let mut final_materials: Vec<ProcessedMaterial> = Vec::new();
        if let Some(mats) = item_input.materials {
            if !mats.is_empty() {
                for m in mats {
                    if m.material_qty > 0 {
                        final_materials.push(ProcessedMaterial {
                            raw_material_id: m.raw_material_id,
                            material_qty: m.material_qty,
                        });
                    }
                }
            }
        }
        // Legacy fallback: single raw_material_id
        if final_materials.is_empty() {
            let legacy_mat_id = item_input.raw_material_id.or(linked_raw_material_id);
            if let Some(mat_id) = legacy_mat_id {
                let deduct_qty = if let Some(manual_qty) = item_input.material_qty {
                    manual_qty
                } else {
                    (Decimal::from(item_input.qty) * linked_material_amount)
                        .to_f64()
                        .unwrap_or(item_input.qty as f64)
                        .ceil() as i32
                };
                if deduct_qty > 0 {
                    final_materials.push(ProcessedMaterial {
                        raw_material_id: mat_id,
                        material_qty: deduct_qty,
                    });
                }
            }
        }

        processed_items.push(ProcessedItem {
            product_id: product.id,
            product_variant_id: item_input.product_variant_id,
            product_name: product.name,
            variant_name,
            price: unit_price,
            qty: item_input.qty,
            subtotal: item_subtotal,
            materials: final_materials,
            addons: processed_addons,
        });
    }

    // 4. Calculate Financials
    let discount = payload.discount_amount.unwrap_or(Decimal::ZERO).min(total_subtotal);
    let total_amount = total_subtotal - discount;
    let pay_amount = payload.pay_amount;

    let (payment_status, change_amount) = if pay_amount >= total_amount {
        (PaymentStatus::Paid, pay_amount - total_amount)
    } else if pay_amount > Decimal::ZERO {
        (payload.payment_status.unwrap_or(PaymentStatus::Dp), Decimal::ZERO)
    } else {
        (PaymentStatus::Unpaid, Decimal::ZERO)
    };

    let payment_method = payload.payment_method.unwrap_or(PaymentMethod::Cash);

    // 5. Insert Transaction
    let active_trans = transactions::ActiveModel {
        invoice_number: Set(invoice_number.clone()),
        customer_id: Set(payload.customer_id),
        customer_name: Set(Some(customer_name)),
        subtotal_amount: Set(total_subtotal),
        discount_amount: Set(discount),
        total_amount: Set(total_amount),
        pay_amount: Set(pay_amount),
        change_amount: Set(change_amount),
        payment_status: Set(payment_status),
        payment_method: Set(payment_method),
        settlement_payment_method: Set(None),
        settlement_pay_amount: Set(None),
        settlement_at: Set(None),
        order_status: Set(OrderStatus::Antrian),
        estimated_done_at: Set(payload.estimated_done_at),
        created_by: Set(Some(user_id)),
        ..Default::default()
    };

    let trans = active_trans.insert(&txn).await?;

    // 6. Insert Items & Addons + Auto-deduct Raw Material Stock (BOM or Manual)
    let mut response_items = Vec::new();
    for p_item in processed_items {
        let active_item = transaction_items::ActiveModel {
            transaction_id: Set(trans.id),
            product_id: Set(Some(p_item.product_id)),
            product_variant_id: Set(p_item.product_variant_id),
            product_name: Set(p_item.product_name.clone()),
            variant_name: Set(p_item.variant_name.clone()),
            price: Set(p_item.price),
            qty: Set(p_item.qty),
            subtotal: Set(p_item.subtotal),
            ..Default::default()
        };

        let item_model = active_item.insert(&txn).await?;

        // Auto deduct raw materials (multi-material support)
        for p_mat in &p_item.materials {
            if p_mat.material_qty > 0 {
                if let Some(raw_mat) = RawMaterial::find_by_id(p_mat.raw_material_id).one(&txn).await? {
                    let unit_name = raw_mat.unit.clone();
                    let mat_name = raw_mat.name.clone();
                    let old_stock = raw_mat.stock;

                    // BUG FIX: jangan biarkan stok negatif. Validasi dulu;
                    // kalau kurang, tolak seluruh transaksi (rollback otomatis
                    // karena belum commit) dengan pesan jelas ke kasir.
                    crate::services::raw_materials::ensure_sufficient_stock(&raw_mat, p_mat.material_qty)?;

                    let new_stock = old_stock - p_mat.material_qty;
                    let mut active_mat: raw_materials::ActiveModel = raw_mat.into();
                    active_mat.stock = Set(new_stock);
                    active_mat.update(&txn).await?;

                    log::info!(
                        "📦 STOK BAHAN BAKU TERPOTONG: ID={}, Nama='{}', Qty={}, Stok Lama={}, Stok Baru={}",
                        p_mat.raw_material_id, mat_name, p_mat.material_qty, old_stock, new_stock
                    );

                    let active_mutation = raw_material_mutations::ActiveModel {
                        raw_material_id: Set(p_mat.raw_material_id),
                        mutation_type: Set(MutationType::Out),
                        qty: Set(p_mat.material_qty),
                        notes: Set(Some(format!(
                            "Otomatis dari Transaksi {} ({} {})",
                            invoice_number, p_mat.material_qty, unit_name
                        ))),
                        ..Default::default()
                    };
                    active_mutation.insert(&txn).await?;
                }
            }
        }

        let mut response_addons = Vec::new();
        for p_addon in p_item.addons {
            let active_addon = transaction_item_addons::ActiveModel {
                transaction_item_id: Set(item_model.id),
                addon_name: Set(p_addon.addon_name.clone()),
                price: Set(p_addon.price),
                qty: Set(p_addon.qty),
                subtotal: Set(p_addon.subtotal),
                ..Default::default()
            };

            let addon_model = active_addon.insert(&txn).await?;
            response_addons.push(map_item_addon(&addon_model));
        }

        response_items.push(map_item(&item_model, response_addons));
    }

    txn.commit().await?;

    let cashier_name = User::find_by_id(user_id)
        .one(db)
        .await?
        .map(|u| u.name);

    Ok(map_transaction(&trans, cashier_name, Some(response_items)))
}

pub async fn update_status(
    db: &DatabaseConnection,
    id: i32,
    order_status: OrderStatus,
) -> Result<TransactionResponse, AppError> {
    let transaction = Transaction::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;

    let mut active_trans: transactions::ActiveModel = transaction.into();
    active_trans.order_status = Set(order_status);
    let updated = active_trans.update(db).await?;

    get_by_id(db, updated.id).await
}

pub async fn update_payment(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdatePaymentRequest,
) -> Result<TransactionResponse, AppError> {
    payload.validate()?;

    let transaction = Transaction::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;

    // Keamanan: hitung ulang status dari perbandingan total vs total dibayar.
    // Jangan percaya `payment_status` dari client — mencegah kasir menandai
    // "LUNAS" padahal bayaran kurang (BUG C).
    let new_pay_amount = transaction.pay_amount + payload.additional_pay_amount;
    let total = transaction.total_amount;

    let (new_status, new_change) = if new_pay_amount >= total {
        (PaymentStatus::Paid, new_pay_amount - total)
    } else {
        // Sisa tagihan masih ada -> tetap DP (atau Unpaid bila belum ada bayaran sama sekali).
        if new_pay_amount > Decimal::ZERO {
            (PaymentStatus::Dp, Decimal::ZERO)
        } else {
            (PaymentStatus::Unpaid, Decimal::ZERO)
        }
    };

    let settlement_method = payload.payment_method.unwrap_or(PaymentMethod::Cash);

    let mut active_trans: transactions::ActiveModel = transaction.into();
    active_trans.pay_amount = Set(new_pay_amount);
    active_trans.change_amount = Set(new_change);
    active_trans.payment_status = Set(new_status);
    active_trans.settlement_payment_method = Set(Some(settlement_method));
    active_trans.settlement_pay_amount = Set(Some(payload.additional_pay_amount));
    active_trans.settlement_at = Set(Some(Utc::now()));
    let updated = active_trans.update(db).await?;

    get_by_id(db, updated.id).await
}

/// Membatalkan transaksi dan mengembalikan stok bahan baku yang sudah
/// terpotong saat transaksi dibuat.
///
/// Aturan:
/// - Transaksi yang sudah `DIAMBIL` tidak boleh dibatalkan (barang sudah
///   diserahkan ke pelanggan).
/// - Hanya boleh dibatalkan satu kali (idempoten): kalau status sudah `BATAL`,
///   kembalikan error agar stok tidak dobel balik.
/// - Pengembalian stok dicatat sebagai mutasi `IN` dengan catatan otomatis,
///   sehingga laporan mutasi tetap konsisten.
pub async fn cancel(
    db: &DatabaseConnection,
    id: i32,
) -> Result<TransactionResponse, AppError> {
    let transaction = Transaction::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Transaksi tidak ditemukan"))?;

    if transaction.order_status == OrderStatus::Diambil {
        return Err(AppError::conflict(
            "Transaksi yang sudah diambil tidak dapat dibatalkan",
        ));
    }
    if transaction.order_status == OrderStatus::Batal {
        return Err(AppError::conflict(
            "Transaksi ini sudah dibatalkan sebelumnya",
        ));
    }

    let txn = db.begin().await?;

    // Kembalikan stok berdasarkan mutasi OUT otomatis milik transaksi ini.
    let note_like = format!("%{}%", transaction.invoice_number);
    let mutations = RawMaterialMutation::find()
        .filter(raw_material_mutations::Column::Notes.like(&note_like))
        .filter(raw_material_mutations::Column::MutationType.eq(MutationType::Out))
        .all(&txn)
        .await?;

    for m in mutations {
        if let Some(mat) = RawMaterial::find_by_id(m.raw_material_id).one(&txn).await? {
            let new_stock = mat.stock + m.qty;
            let mut active_mat: raw_materials::ActiveModel = mat.into();
            active_mat.stock = Set(new_stock);
            active_mat.update(&txn).await?;

            let restore = raw_material_mutations::ActiveModel {
                raw_material_id: Set(m.raw_material_id),
                mutation_type: Set(MutationType::In),
                qty: Set(m.qty),
                notes: Set(Some(format!(
                    "Pengembalian dari pembatalan Transaksi {}",
                    transaction.invoice_number
                ))),
                ..Default::default()
            };
            restore.insert(&txn).await?;
        }
    }

    let mut active_trans: transactions::ActiveModel = transaction.into();
    active_trans.order_status = Set(OrderStatus::Batal);
    let updated = active_trans.update(&txn).await?;

    txn.commit().await?;

    get_by_id(db, updated.id).await
}

use crate::config::StoreConfig;

pub async fn get_invoice_data(
    db: &DatabaseConnection,
    store: &StoreConfig,
    id: i32,
) -> Result<InvoicePrintData, AppError> {
    let trans = get_by_id(db, id).await?;

    let remaining_amount = if trans.total_amount > trans.pay_amount {
        trans.total_amount - trans.pay_amount
    } else {
        Decimal::ZERO
    };

    Ok(InvoicePrintData {
        store_name: store.name.clone(),
        store_address: store.address.clone(),
        store_phone: store.phone.clone(),
        invoice_number: trans.invoice_number,
        date: trans.created_at,
        cashier_name: trans.cashier_name.unwrap_or_else(|| "Kasir".to_string()),
        customer_name: trans.customer_name,
        payment_status: trans.payment_status,
        payment_method: trans.payment_method,
        settlement_payment_method: trans.settlement_payment_method,
        settlement_pay_amount: trans.settlement_pay_amount,
        order_status: trans.order_status,
        estimated_done_at: trans.estimated_done_at,
        items: trans.items.unwrap_or_default(),
        subtotal_amount: trans.subtotal_amount,
        discount_amount: trans.discount_amount,
        total_amount: trans.total_amount,
        pay_amount: trans.pay_amount,
        change_amount: trans.change_amount,
        remaining_amount,
    })
}
