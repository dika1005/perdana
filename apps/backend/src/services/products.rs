use entity::enums::PriceType;
use entity::prelude::*;
use entity::{product_variants, products};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, LoaderTrait, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set, TransactionTrait,
};
use validator::Validate;

use crate::dto::{
    CreateProductRequest, CreateVariantRequest, Pagination, PaginationMeta, ProductQuery,
    ProductResponse, ProductVariantResponse, UpdateProductRequest, UpdateVariantRequest,
};
use crate::error::AppError;
use crate::services::audit;

pub fn map_variant(m: &product_variants::Model) -> ProductVariantResponse {
    ProductVariantResponse {
        id: m.id,
        product_id: m.product_id,
        variant_name: m.variant_name.clone(),
        price_type: m.price_type.clone(),
        price: m.price,
        min_price: m.min_price,
        max_price: m.max_price,
        is_active: m.is_active,
        raw_material_id: m.raw_material_id,
        material_amount: m.material_amount,
        created_at: m.created_at,
    }
}

pub fn map_product(
    m: &products::Model,
    variants: Option<Vec<ProductVariantResponse>>,
) -> ProductResponse {
    ProductResponse {
        id: m.id,
        category_id: m.category_id,
        name: m.name.clone(),
        price_type: m.price_type.clone(),
        default_price: m.default_price,
        min_price: m.min_price,
        max_price: m.max_price,
        min_order: m.min_order.unwrap_or(1),
        unit_name: m.unit_name.clone().unwrap_or_else(|| "pcs".to_string()),
        has_variants: m.has_variants,
        is_active: m.is_active,
        raw_material_id: m.raw_material_id,
        material_amount: m.material_amount,
        created_at: m.created_at,
        variants,
    }
}

async fn validate_linked_material<C: ConnectionTrait>(
    db: &C,
    raw_material_id: Option<i32>,
    material_amount: Option<Decimal>,
) -> Result<(), AppError> {
    if let Some(amount) = material_amount {
        if amount <= Decimal::ZERO {
            return Err(AppError::field(
                "material_amount",
                "Pemakaian bahan harus lebih dari 0 bila diisi",
            ));
        }
    }
    if let Some(material_id) = raw_material_id {
        let material = RawMaterial::find_by_id(material_id)
            .one(db)
            .await?
            .ok_or_else(|| AppError::field("raw_material_id", "Bahan baku tidak ditemukan"))?;
        if !material.is_active {
            return Err(AppError::conflict("Bahan baku utama sudah dinonaktifkan"));
        }
    }
    Ok(())
}

// ==========================================
// PRODUCTS
// ==========================================

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: ProductQuery,
) -> Result<(Vec<ProductResponse>, PaginationMeta), AppError> {
    let mut select = Product::find()
        .filter(products::Column::IsActive.eq(true))
        .order_by_asc(products::Column::Name);

    if let Some(cat_id) = query.category_id {
        select = select.filter(products::Column::CategoryId.eq(cat_id));
    }

    if let Some(search) = query.search {
        let keyword = format!("%{}%", search.trim());
        select = select.filter(products::Column::Name.like(&keyword));
    }

    let (items, meta) = pagination.fetch(select, db).await?;

    // Batch load variants for products that have variants
    let variants = items.load_many(ProductVariant::find(), db).await?;

    let result = items
        .into_iter()
        .zip(variants.into_iter())
        .map(|(prod, vars)| {
            let var_res = if prod.has_variants {
                Some(
                    vars.iter()
                        .filter(|variant| variant.is_active)
                        .map(map_variant)
                        .collect(),
                )
            } else {
                None
            };
            map_product(&prod, var_res)
        })
        .collect();

    Ok((result, meta))
}

pub async fn get_by_id(db: &DatabaseConnection, id: i32) -> Result<ProductResponse, AppError> {
    let product = Product::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;

    let variants = if product.has_variants {
        let vars = product
            .find_related(ProductVariant)
            .filter(product_variants::Column::IsActive.eq(true))
            .all(db)
            .await?;
        Some(vars.iter().map(map_variant).collect())
    } else {
        None
    };

    Ok(map_product(&product, variants))
}

pub async fn create(
    db: &DatabaseConnection,
    payload: CreateProductRequest,
) -> Result<ProductResponse, AppError> {
    create_as(db, None, payload).await
}

pub async fn create_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    payload: CreateProductRequest,
) -> Result<ProductResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama produk tidak boleh kosong"));
    }

    let unit_name = payload.unit_name.unwrap_or_else(|| "pcs".to_string()).trim().to_string();
    if unit_name.is_empty() {
        return Err(AppError::field("unit_name", "Satuan produk tidak boleh kosong"));
    }
    let txn = db.begin().await?;
    if let Some(cat_id) = payload.category_id {
        let cat_exists = ProductCategory::find_by_id(cat_id).one(&txn).await?;
        if cat_exists.is_none() {
            return Err(AppError::field("category_id", "Kategori produk tidak ditemukan"));
        }
    }
    validate_linked_material(&txn, payload.raw_material_id, payload.material_amount).await?;

    let default_price = payload.default_price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == PriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum tidak boleh melebihi harga maksimum"));
    }

    let active_model = products::ActiveModel {
        category_id: Set(payload.category_id),
        name: Set(name),
        price_type: Set(payload.price_type),
        default_price: Set(default_price),
        min_price: Set(min_price),
        max_price: Set(max_price),
        min_order: Set(Some(payload.min_order.unwrap_or(1).max(1))),
        unit_name: Set(Some(unit_name)),
        has_variants: Set(payload.has_variants.unwrap_or(false)),
        raw_material_id: Set(payload.raw_material_id),
        material_amount: Set(payload.material_amount.or(Some(Decimal::ONE))),
        is_active: Set(true),
        ..Default::default()
    };

    let item = active_model.insert(&txn).await?;
    audit::log(
        &txn,
        actor_id,
        "CREATE",
        "PRODUCT",
        item.id.to_string(),
        None,
        audit::snapshot(&item),
        Some("Master produk dibuat".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(map_product(&item, None))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateProductRequest,
) -> Result<ProductResponse, AppError> {
    update_as(db, None, id, payload).await
}

pub async fn update_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
    payload: UpdateProductRequest,
) -> Result<ProductResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama produk tidak boleh kosong"));
    }

    let unit_name = payload.unit_name.unwrap_or_else(|| "pcs".to_string()).trim().to_string();
    if unit_name.is_empty() {
        return Err(AppError::field("unit_name", "Satuan produk tidak boleh kosong"));
    }
    let txn = db.begin().await?;
    let product = Product::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;
    if !product.is_active {
        return Err(AppError::conflict("Produk sudah dinonaktifkan"));
    }

    if let Some(cat_id) = payload.category_id {
        let cat_exists = ProductCategory::find_by_id(cat_id).one(&txn).await?;
        if cat_exists.is_none() {
            return Err(AppError::field("category_id", "Kategori produk tidak ditemukan"));
        }
    }
    validate_linked_material(&txn, payload.raw_material_id, payload.material_amount).await?;

    let default_price = payload.default_price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == PriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum tidak boleh melebihi harga maksimum"));
    }

    let before = audit::snapshot(&product);
    let mut active_model: products::ActiveModel = product.into();
    active_model.category_id = Set(payload.category_id);
    active_model.name = Set(name);
    active_model.price_type = Set(payload.price_type);
    active_model.default_price = Set(default_price);
    active_model.min_price = Set(min_price);
    active_model.max_price = Set(max_price);
    active_model.min_order = Set(Some(payload.min_order.unwrap_or(1).max(1)));
    active_model.unit_name = Set(Some(unit_name));
    if let Some(has_variants) = payload.has_variants {
        active_model.has_variants = Set(has_variants);
    }
    active_model.raw_material_id = Set(payload.raw_material_id);
    if payload.material_amount.is_some() {
        active_model.material_amount = Set(payload.material_amount);
    }

    let updated = active_model.update(&txn).await?;
    let variants = if updated.has_variants {
        let vars = updated
            .find_related(ProductVariant)
            .filter(product_variants::Column::IsActive.eq(true))
            .all(&txn)
            .await?;
        Some(vars.iter().map(map_variant).collect())
    } else {
        None
    };
    let response = map_product(&updated, variants);
    audit::log(
        &txn,
        actor_id,
        "UPDATE",
        "PRODUCT",
        updated.id.to_string(),
        before,
        audit::snapshot(&response),
        Some("Master produk diperbarui".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(response)
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    delete_as(db, None, id).await
}

pub async fn delete_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    id: i32,
) -> Result<(), AppError> {
    let txn = db.begin().await?;
    let product = Product::find_by_id(id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;
    let before = audit::snapshot(&product);
    let mut active_model: products::ActiveModel = product.into();
    active_model.is_active = Set(false);
    let updated = active_model.update(&txn).await?;
    let variants = ProductVariant::find()
        .filter(product_variants::Column::ProductId.eq(id))
        .filter(product_variants::Column::IsActive.eq(true))
        .all(&txn)
        .await?;
    for variant in variants {
        let mut active_variant: product_variants::ActiveModel = variant.into();
        active_variant.is_active = Set(false);
        active_variant.update(&txn).await?;
    }
    audit::log(
        &txn,
        actor_id,
        "DEACTIVATE",
        "PRODUCT",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Produk dan varian aktif dinonaktifkan; histori transaksi dipertahankan".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(())
}

// ==========================================
// VARIANTS
// ==========================================

pub async fn list_variants(
    db: &DatabaseConnection,
    product_id: i32,
) -> Result<Vec<ProductVariantResponse>, AppError> {
    let product = Product::find_by_id(product_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;

    let vars = product
        .find_related(ProductVariant)
        .filter(product_variants::Column::IsActive.eq(true))
        .order_by_asc(product_variants::Column::VariantName)
        .all(db)
        .await?;

    Ok(vars.iter().map(map_variant).collect())
}

pub async fn create_variant(
    db: &DatabaseConnection,
    product_id: i32,
    payload: CreateVariantRequest,
) -> Result<ProductVariantResponse, AppError> {
    create_variant_as(db, None, product_id, payload).await
}

pub async fn create_variant_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    product_id: i32,
    payload: CreateVariantRequest,
) -> Result<ProductVariantResponse, AppError> {
    payload.validate()?;

    let var_name = payload.variant_name.trim().to_string();
    if var_name.is_empty() {
        return Err(AppError::field("variant_name", "Nama varian tidak boleh kosong"));
    }

    let txn = db.begin().await?;
    let product = Product::find_by_id(product_id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;
    if !product.is_active {
        return Err(AppError::conflict("Produk sudah dinonaktifkan"));
    }
    validate_linked_material(&txn, payload.raw_material_id, payload.material_amount).await?;

    let price = payload.price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == entity::enums::RangePriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum varian tidak boleh melebihi harga maksimum"));
    }

    let active_variant = product_variants::ActiveModel {
        product_id: Set(product_id),
        variant_name: Set(var_name),
        price_type: Set(payload.price_type),
        price: Set(price),
        min_price: Set(min_price),
        max_price: Set(max_price),
        is_active: Set(true),
        raw_material_id: Set(payload.raw_material_id),
        material_amount: Set(payload.material_amount.or(Some(Decimal::ONE))),
        ..Default::default()
    };

    let variant = active_variant.insert(&txn).await?;

    // Auto-ensure parent product has_variants is true
    if !product.has_variants {
        let mut active_product: products::ActiveModel = product.into();
        active_product.has_variants = Set(true);
        active_product.update(&txn).await?;
    }
    let response = map_variant(&variant);
    audit::log(
        &txn,
        actor_id,
        "CREATE",
        "PRODUCT_VARIANT",
        variant.id.to_string(),
        None,
        audit::snapshot(&response),
        Some("Varian produk dibuat".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(response)
}

pub async fn update_variant(
    db: &DatabaseConnection,
    variant_id: i32,
    payload: UpdateVariantRequest,
) -> Result<ProductVariantResponse, AppError> {
    update_variant_as(db, None, variant_id, payload).await
}

pub async fn update_variant_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    variant_id: i32,
    payload: UpdateVariantRequest,
) -> Result<ProductVariantResponse, AppError> {
    payload.validate()?;

    let var_name = payload.variant_name.trim().to_string();
    if var_name.is_empty() {
        return Err(AppError::field("variant_name", "Nama varian tidak boleh kosong"));
    }

    let txn = db.begin().await?;
    let variant = ProductVariant::find_by_id(variant_id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Varian produk tidak ditemukan"))?;
    if !variant.is_active {
        return Err(AppError::conflict("Varian sudah dinonaktifkan"));
    }
    validate_linked_material(&txn, payload.raw_material_id, payload.material_amount).await?;

    let price = payload.price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == entity::enums::RangePriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum varian tidak boleh melebihi harga maksimum"));
    }

    let before = audit::snapshot(&variant);
    let mut active_variant: product_variants::ActiveModel = variant.into();
    active_variant.variant_name = Set(var_name);
    active_variant.price_type = Set(payload.price_type);
    active_variant.price = Set(price);
    active_variant.min_price = Set(min_price);
    active_variant.max_price = Set(max_price);
    active_variant.raw_material_id = Set(payload.raw_material_id);
    if payload.material_amount.is_some() {
        active_variant.material_amount = Set(payload.material_amount);
    }

    let updated = active_variant.update(&txn).await?;
    let response = map_variant(&updated);
    audit::log(
        &txn,
        actor_id,
        "UPDATE",
        "PRODUCT_VARIANT",
        updated.id.to_string(),
        before,
        audit::snapshot(&response),
        Some("Varian produk diperbarui".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(response)
}

pub async fn delete_variant(db: &DatabaseConnection, variant_id: i32) -> Result<(), AppError> {
    delete_variant_as(db, None, variant_id).await
}

pub async fn delete_variant_as(
    db: &DatabaseConnection,
    actor_id: Option<i32>,
    variant_id: i32,
) -> Result<(), AppError> {
    let txn = db.begin().await?;
    let variant = ProductVariant::find_by_id(variant_id)
        .lock_exclusive()
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Varian produk tidak ditemukan"))?;

    let product_id = variant.product_id;
    let before = audit::snapshot(&variant);
    let mut active_model: product_variants::ActiveModel = variant.into();
    active_model.is_active = Set(false);
    let updated = active_model.update(&txn).await?;

    // Check if product has remaining variants; if not, update has_variants = false
    let remaining_count = ProductVariant::find()
        .filter(product_variants::Column::ProductId.eq(product_id))
        .filter(product_variants::Column::IsActive.eq(true))
        .count(&txn)
        .await?;

    if remaining_count == 0 {
        if let Some(product) = Product::find_by_id(product_id).one(&txn).await? {
            let mut active_prod: products::ActiveModel = product.into();
            active_prod.has_variants = Set(false);
            active_prod.update(&txn).await?;
        }
    }
    audit::log(
        &txn,
        actor_id,
        "DEACTIVATE",
        "PRODUCT_VARIANT",
        updated.id.to_string(),
        before,
        audit::snapshot(&updated),
        Some("Varian dinonaktifkan; histori transaksi dipertahankan".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(())
}
