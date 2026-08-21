use entity::enums::PriceType;
use entity::prelude::*;
use entity::{product_variants, products};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, LoaderTrait, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use validator::Validate;

use crate::dto::{
    CreateProductRequest, CreateVariantRequest, Pagination, PaginationMeta, ProductQuery,
    ProductResponse, ProductVariantResponse, UpdateProductRequest, UpdateVariantRequest,
};
use crate::error::AppError;

pub fn map_variant(m: &product_variants::Model) -> ProductVariantResponse {
    ProductVariantResponse {
        id: m.id,
        product_id: m.product_id,
        variant_name: m.variant_name.clone(),
        price_type: m.price_type.clone(),
        price: m.price,
        min_price: m.min_price,
        max_price: m.max_price,
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
        raw_material_id: m.raw_material_id,
        material_amount: m.material_amount,
        created_at: m.created_at,
        variants,
    }
}

// ==========================================
// PRODUCTS
// ==========================================

pub async fn list(
    db: &DatabaseConnection,
    pagination: &Pagination,
    query: ProductQuery,
) -> Result<(Vec<ProductResponse>, PaginationMeta), AppError> {
    let mut select = Product::find().order_by_asc(products::Column::Name);

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
                Some(vars.iter().map(map_variant).collect())
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
        let vars = product.find_related(ProductVariant).all(db).await?;
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
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama produk tidak boleh kosong"));
    }

    if let Some(cat_id) = payload.category_id {
        let cat_exists = ProductCategory::find_by_id(cat_id).one(db).await?;
        if cat_exists.is_none() {
            return Err(AppError::field("category_id", "Kategori produk tidak ditemukan"));
        }
    }

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
        unit_name: Set(Some(payload.unit_name.unwrap_or_else(|| "pcs".to_string()))),
        has_variants: Set(payload.has_variants.unwrap_or(false)),
        raw_material_id: Set(payload.raw_material_id),
        material_amount: Set(payload.material_amount.or(Some(Decimal::ONE))),
        ..Default::default()
    };

    let item = active_model.insert(db).await?;
    Ok(map_product(&item, None))
}

pub async fn update(
    db: &DatabaseConnection,
    id: i32,
    payload: UpdateProductRequest,
) -> Result<ProductResponse, AppError> {
    payload.validate()?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::field("name", "Nama produk tidak boleh kosong"));
    }

    let product = Product::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;

    if let Some(cat_id) = payload.category_id {
        let cat_exists = ProductCategory::find_by_id(cat_id).one(db).await?;
        if cat_exists.is_none() {
            return Err(AppError::field("category_id", "Kategori produk tidak ditemukan"));
        }
    }

    let default_price = payload.default_price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == PriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum tidak boleh melebihi harga maksimum"));
    }

    let mut active_model: products::ActiveModel = product.into();
    active_model.category_id = Set(payload.category_id);
    active_model.name = Set(name);
    active_model.price_type = Set(payload.price_type);
    active_model.default_price = Set(default_price);
    active_model.min_price = Set(min_price);
    active_model.max_price = Set(max_price);
    active_model.min_order = Set(Some(payload.min_order.unwrap_or(1).max(1)));
    active_model.unit_name = Set(Some(payload.unit_name.unwrap_or_else(|| "pcs".to_string())));
    if let Some(has_variants) = payload.has_variants {
        active_model.has_variants = Set(has_variants);
    }
    active_model.raw_material_id = Set(payload.raw_material_id);
    if payload.material_amount.is_some() {
        active_model.material_amount = Set(payload.material_amount);
    }

    let updated = active_model.update(db).await?;
    let variants = if updated.has_variants {
        let vars = updated.find_related(ProductVariant).all(db).await?;
        Some(vars.iter().map(map_variant).collect())
    } else {
        None
    };

    Ok(map_product(&updated, variants))
}

pub async fn delete(db: &DatabaseConnection, id: i32) -> Result<(), AppError> {
    let product = Product::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;

    let active_model: products::ActiveModel = product.into();
    active_model.delete(db).await?;
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
    payload.validate()?;

    let var_name = payload.variant_name.trim().to_string();
    if var_name.is_empty() {
        return Err(AppError::field("variant_name", "Nama varian tidak boleh kosong"));
    }

    let product = Product::find_by_id(product_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;

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
        raw_material_id: Set(payload.raw_material_id),
        material_amount: Set(payload.material_amount.or(Some(Decimal::ONE))),
        ..Default::default()
    };

    let variant = active_variant.insert(db).await?;

    // Auto-ensure parent product has_variants is true
    if !product.has_variants {
        let mut active_product: products::ActiveModel = product.into();
        active_product.has_variants = Set(true);
        active_product.update(db).await?;
    }

    Ok(map_variant(&variant))
}

pub async fn update_variant(
    db: &DatabaseConnection,
    variant_id: i32,
    payload: UpdateVariantRequest,
) -> Result<ProductVariantResponse, AppError> {
    payload.validate()?;

    let var_name = payload.variant_name.trim().to_string();
    if var_name.is_empty() {
        return Err(AppError::field("variant_name", "Nama varian tidak boleh kosong"));
    }

    let variant = ProductVariant::find_by_id(variant_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Varian produk tidak ditemukan"))?;

    let price = payload.price.unwrap_or(Decimal::ZERO);
    let min_price = payload.min_price.unwrap_or(Decimal::ZERO);
    let max_price = payload.max_price.unwrap_or(Decimal::ZERO);

    if payload.price_type == entity::enums::RangePriceType::Range && min_price > max_price {
        return Err(AppError::field("min_price", "Harga minimum varian tidak boleh melebihi harga maksimum"));
    }

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

    let updated = active_variant.update(db).await?;
    Ok(map_variant(&updated))
}

pub async fn delete_variant(db: &DatabaseConnection, variant_id: i32) -> Result<(), AppError> {
    let variant = ProductVariant::find_by_id(variant_id)
        .one(db)
        .await?
        .ok_or_else(|| AppError::not_found("Varian produk tidak ditemukan"))?;

    let product_id = variant.product_id;
    let active_model: product_variants::ActiveModel = variant.into();
    active_model.delete(db).await?;

    // Check if product has remaining variants; if not, update has_variants = false
    let remaining_count = ProductVariant::find()
        .filter(product_variants::Column::ProductId.eq(product_id))
        .count(db)
        .await?;

    if remaining_count == 0 {
        if let Some(product) = Product::find_by_id(product_id).one(db).await? {
            let mut active_prod: products::ActiveModel = product.into();
            active_prod.has_variants = Set(false);
            active_prod.update(db).await?;
        }
    }

    Ok(())
}
