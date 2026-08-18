use chrono::{DateTime, Utc};
use entity::enums::{OrderStatus, PaymentStatus, PriceType, RangePriceType};
use entity::prelude::*;
use entity::{transaction_item_addons, transaction_items, transactions, users};
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

    let result = items
        .into_iter()
        .map(|t| {
            let c_name = t.created_by.and_then(|id| {
                cashiers
                    .iter()
                    .find(|u| u.id == id)
                    .map(|u| u.name.clone())
            });
            map_transaction(&t, c_name, None)
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

    // 2. Generate Invoice Number: INV-YYYYMMDD-XXXX
    let now: DateTime<Utc> = Utc::now();
    let date_str = now.format("%Y%m%d").to_string();
    let rand_suffix = (now.timestamp_subsec_micros() % 9000) + 1000;
    let invoice_number = format!("INV-{date_str}-{rand_suffix}");

    // 3. Process Items & Addons
    let mut total_subtotal = Decimal::ZERO;

    struct ProcessedAddon {
        addon_name: String,
        price: Decimal,
        qty: i32,
        subtotal: Decimal,
    }

    struct ProcessedItem {
        product_id: i32,
        product_variant_id: Option<i32>,
        product_name: String,
        variant_name: Option<String>,
        price: Decimal,
        qty: i32,
        subtotal: Decimal,
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

        let (unit_price, variant_name) = if let Some(variant_id) = item_input.product_variant_id {
            let variant = ProductVariant::find_by_id(variant_id)
                .one(&txn)
                .await?
                .ok_or_else(|| AppError::field("items", "Varian produk tidak ditemukan"))?;

            if variant.product_id != product.id {
                return Err(AppError::field("items", "Varian tidak cocok dengan produk"));
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

        processed_items.push(ProcessedItem {
            product_id: product.id,
            product_variant_id: item_input.product_variant_id,
            product_name: product.name,
            variant_name,
            price: unit_price,
            qty: item_input.qty,
            subtotal: item_subtotal,
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

    // 5. Insert Transaction
    let active_trans = transactions::ActiveModel {
        invoice_number: Set(invoice_number),
        customer_id: Set(payload.customer_id),
        customer_name: Set(Some(customer_name)),
        subtotal_amount: Set(total_subtotal),
        discount_amount: Set(discount),
        total_amount: Set(total_amount),
        pay_amount: Set(pay_amount),
        change_amount: Set(change_amount),
        payment_status: Set(payment_status),
        order_status: Set(OrderStatus::Antrian),
        estimated_done_at: Set(payload.estimated_done_at),
        created_by: Set(Some(user_id)),
        ..Default::default()
    };

    let trans = active_trans.insert(&txn).await?;

    // 6. Insert Items & Addons
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

    let new_pay_amount = transaction.pay_amount + payload.additional_pay_amount;
    let total = transaction.total_amount;

    let (new_status, new_change) = if new_pay_amount >= total {
        (PaymentStatus::Paid, new_pay_amount - total)
    } else {
        (payload.payment_status.unwrap_or(PaymentStatus::Dp), Decimal::ZERO)
    };

    let mut active_trans: transactions::ActiveModel = transaction.into();
    active_trans.pay_amount = Set(new_pay_amount);
    active_trans.change_amount = Set(new_change);
    active_trans.payment_status = Set(new_status);
    let updated = active_trans.update(db).await?;

    get_by_id(db, updated.id).await
}

pub async fn get_invoice_data(
    db: &DatabaseConnection,
    id: i32,
) -> Result<InvoicePrintData, AppError> {
    let trans = get_by_id(db, id).await?;

    let remaining_amount = if trans.total_amount > trans.pay_amount {
        trans.total_amount - trans.pay_amount
    } else {
        Decimal::ZERO
    };

    Ok(InvoicePrintData {
        store_name: "PERDANA PRINTING & POS".to_string(),
        store_address: "Jl. Percetakan Perdana No. 1, Kota".to_string(),
        store_phone: "0812-3456-7890".to_string(),
        invoice_number: trans.invoice_number,
        date: trans.created_at,
        cashier_name: trans.cashier_name.unwrap_or_else(|| "Kasir".to_string()),
        customer_name: trans.customer_name,
        payment_status: trans.payment_status,
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
