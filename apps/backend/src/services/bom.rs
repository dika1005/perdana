//! Versioned bill-of-materials services. The active BOM is the server-side
//! source of truth used at checkout; client material estimates are only a
//! controlled legacy fallback.

use chrono::{NaiveDate, Utc};
use entity::prelude::*;
use entity::{addon_bom_lines, product_bom_lines, product_boms};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QueryOrder, Set, TransactionTrait,
};
use validator::Validate;

use crate::dto::{
    AddonBomLineResponse, BomLineInput, BomLineResponse, ProductBomResponse, UpsertAddonBomRequest,
    UpsertProductBomRequest,
};
use crate::error::AppError;
use crate::services::audit;

pub const BASIS_PER_UNIT: &str = "PER_UNIT";
pub const BASIS_PER_AREA: &str = "PER_AREA";
pub const BASIS_PER_LENGTH: &str = "PER_LENGTH";
pub const BASIS_FIXED: &str = "FIXED";

#[derive(Debug, Clone)]
pub struct ResolvedMaterialLine {
    pub raw_material_id: i32,
    pub source_type: String,
    pub consumption_basis: String,
    pub qty_per_output: Decimal,
    pub waste_pct: Decimal,
    pub width_requirement_m: Option<Decimal>,
    pub bom_id: Option<i32>,
    pub bom_line_id: Option<i32>,
    pub bom_version: Option<i32>,
    pub addon_id: Option<i32>,
}

fn normalized_basis(value: &str) -> Result<String, AppError> {
    let basis = value.trim().to_ascii_uppercase();
    if matches!(basis.as_str(), BASIS_PER_UNIT | BASIS_PER_AREA | BASIS_PER_LENGTH | BASIS_FIXED) {
        Ok(basis)
    } else {
        Err(AppError::field(
            "consumption_basis",
            "Basis konsumsi harus PER_UNIT, PER_AREA, PER_LENGTH, atau FIXED",
        ))
    }
}

fn normalized_component(value: Option<&str>) -> Result<String, AppError> {
    let component = value.unwrap_or("MATERIAL").trim().to_ascii_uppercase();
    if matches!(component.as_str(), "MATERIAL" | "FINISHING" | "PACKAGING") {
        Ok(component)
    } else {
        Err(AppError::field(
            "component_type",
            "Tipe komponen harus MATERIAL, FINISHING, atau PACKAGING",
        ))
    }
}

fn validate_line(line: &BomLineInput) -> Result<(String, String, Decimal), AppError> {
    let basis = normalized_basis(&line.consumption_basis)?;
    let component = normalized_component(line.component_type.as_deref())?;
    let waste = line.waste_pct.unwrap_or(Decimal::ZERO);
    if line.raw_material_id <= 0 || line.qty_per_output <= Decimal::ZERO {
        return Err(AppError::field("lines", "Material dan kuantitas BOM harus valid"));
    }
    if waste < Decimal::ZERO || waste >= Decimal::ONE {
        return Err(AppError::field("waste_pct", "Waste harus di antara 0 dan kurang dari 1"));
    }
    if let Some(width) = line.width_requirement_m {
        if width <= Decimal::ZERO {
            return Err(AppError::field("width_requirement_m", "Lebar kebutuhan harus lebih dari 0"));
        }
    }
    Ok((component, basis, waste))
}

fn effective(bom: &product_boms::Model, on_date: NaiveDate) -> bool {
    bom.status == "ACTIVE"
        && bom.effective_from.map(|date| date <= on_date).unwrap_or(true)
        && bom.effective_to.map(|date| date >= on_date).unwrap_or(true)
}

pub fn map_product_line(m: &product_bom_lines::Model) -> BomLineResponse {
    BomLineResponse {
        id: m.id,
        raw_material_id: m.raw_material_id,
        component_type: m.component_type.clone(),
        consumption_basis: m.consumption_basis.clone(),
        qty_per_output: m.qty_per_output,
        waste_pct: m.waste_pct,
        width_requirement_m: m.width_requirement_m,
        allow_offcut: m.allow_offcut,
        is_required: m.is_required,
        sort_order: m.sort_order,
    }
}

pub fn map_addon_line(m: &addon_bom_lines::Model) -> AddonBomLineResponse {
    AddonBomLineResponse {
        id: m.id,
        addon_id: m.addon_id,
        raw_material_id: m.raw_material_id,
        consumption_basis: m.consumption_basis.clone(),
        qty_per_addon: m.qty_per_addon,
        waste_pct: m.waste_pct,
        is_required: m.is_required,
        sort_order: m.sort_order,
    }
}

async fn map_product_bom<C: ConnectionTrait>(
    db: &C,
    bom: product_boms::Model,
) -> Result<ProductBomResponse, AppError> {
    let lines = ProductBomLine::find()
        .filter(product_bom_lines::Column::BomId.eq(bom.id))
        .order_by_asc(product_bom_lines::Column::SortOrder)
        .all(db)
        .await?;
    Ok(ProductBomResponse {
        id: bom.id,
        product_id: bom.product_id,
        product_variant_id: bom.product_variant_id,
        version: bom.version,
        status: bom.status,
        output_qty: bom.output_qty,
        notes: bom.notes,
        effective_from: bom.effective_from,
        effective_to: bom.effective_to,
        created_at: bom.created_at,
        activated_at: bom.activated_at,
        lines: lines.iter().map(map_product_line).collect(),
    })
}

pub async fn active_product_bom<C: ConnectionTrait>(
    db: &C,
    product_id: i32,
    product_variant_id: Option<i32>,
) -> Result<Option<(product_boms::Model, Vec<product_bom_lines::Model>)>, AppError> {
    let today = Utc::now().date_naive();
    let mut candidates = Vec::new();
    if let Some(variant_id) = product_variant_id {
        candidates = ProductBom::find()
            .filter(product_boms::Column::ProductId.eq(product_id))
            .filter(product_boms::Column::ProductVariantId.eq(Some(variant_id)))
            .filter(product_boms::Column::Status.eq("ACTIVE"))
            .order_by_desc(product_boms::Column::Version)
            .all(db)
            .await?;
    }
    if candidates.is_empty() {
        candidates = ProductBom::find()
            .filter(product_boms::Column::ProductId.eq(product_id))
            .filter(product_boms::Column::ProductVariantId.is_null())
            .filter(product_boms::Column::Status.eq("ACTIVE"))
            .order_by_desc(product_boms::Column::Version)
            .all(db)
            .await?;
    }
    let Some(bom) = candidates.into_iter().find(|bom| effective(bom, today)) else {
        return Ok(None);
    };
    let lines = ProductBomLine::find()
        .filter(product_bom_lines::Column::BomId.eq(bom.id))
        .filter(product_bom_lines::Column::IsRequired.eq(true))
        .order_by_asc(product_bom_lines::Column::SortOrder)
        .all(db)
        .await?;
    Ok(Some((bom, lines)))
}

pub async fn get_product_bom(
    db: &DatabaseConnection,
    product_id: i32,
    product_variant_id: Option<i32>,
) -> Result<Option<ProductBomResponse>, AppError> {
    let Some((bom, _)) = active_product_bom(db, product_id, product_variant_id).await? else {
        return Ok(None);
    };
    Ok(Some(map_product_bom(db, bom).await?))
}

pub async fn upsert_product_bom(
    db: &DatabaseConnection,
    actor_id: i32,
    product_id: i32,
    payload: UpsertProductBomRequest,
) -> Result<ProductBomResponse, AppError> {
    payload.validate()?;
    let output_qty = payload.output_qty.unwrap_or(Decimal::ONE);
    if output_qty <= Decimal::ZERO {
        return Err(AppError::field("output_qty", "Output BOM harus lebih dari 0"));
    }
    if let (Some(from), Some(to)) = (payload.effective_from, payload.effective_to) {
        if from > to {
            return Err(AppError::field("effective_to", "Tanggal akhir tidak boleh sebelum tanggal mulai"));
        }
    }
    for line in &payload.lines {
        validate_line(line)?;
    }

    let txn = db.begin().await?;
    let product = Product::find_by_id(product_id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Produk tidak ditemukan"))?;
    if !product.is_active {
        return Err(AppError::conflict("Produk nonaktif tidak dapat memiliki BOM aktif"));
    }
    if let Some(variant_id) = payload.product_variant_id {
        let variant = ProductVariant::find_by_id(variant_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::field("product_variant_id", "Varian tidak ditemukan"))?;
        if variant.product_id != product_id {
            return Err(AppError::field("product_variant_id", "Varian tidak milik produk ini"));
        }
    }
    for line in &payload.lines {
        let material = RawMaterial::find_by_id(line.raw_material_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::field("lines", "Bahan BOM tidak ditemukan"))?;
        if !material.is_active {
            return Err(AppError::field("lines", format!("Bahan '{}' tidak aktif", material.name)));
        }
    }

    let existing = ProductBom::find()
        .filter(product_boms::Column::ProductId.eq(product_id))
        .filter(product_boms::Column::ProductVariantId.eq(payload.product_variant_id))
        .order_by_desc(product_boms::Column::Version)
        .all(&txn)
        .await?;
    let version = existing.iter().map(|bom| bom.version).max().unwrap_or(0) + 1;
    let before = audit::snapshot(&existing);
    for old in existing.into_iter().filter(|bom| bom.status == "ACTIVE") {
        let mut active: product_boms::ActiveModel = old.into();
        active.status = Set("RETIRED".to_string());
        active.update(&txn).await?;
    }

    let bom = product_boms::ActiveModel {
        product_id: Set(product_id),
        product_variant_id: Set(payload.product_variant_id),
        version: Set(version),
        status: Set("ACTIVE".to_string()),
        output_qty: Set(output_qty),
        notes: Set(payload.notes.map(|note| note.trim().to_string())),
        effective_from: Set(payload.effective_from),
        effective_to: Set(payload.effective_to),
        created_by: Set(Some(actor_id)),
        activated_at: Set(Some(Utc::now())),
        ..Default::default()
    }
    .insert(&txn)
    .await?;
    for (index, line) in payload.lines.iter().enumerate() {
        let (component, basis, waste) = validate_line(line)?;
        product_bom_lines::ActiveModel {
            bom_id: Set(bom.id),
            raw_material_id: Set(line.raw_material_id),
            component_type: Set(component),
            consumption_basis: Set(basis),
            qty_per_output: Set(line.qty_per_output),
            waste_pct: Set(waste),
            width_requirement_m: Set(line.width_requirement_m),
            allow_offcut: Set(line.allow_offcut.unwrap_or(true)),
            is_required: Set(line.is_required.unwrap_or(true)),
            sort_order: Set(index as i32),
            ..Default::default()
        }
        .insert(&txn)
        .await?;
    }
    let response = map_product_bom(&txn, bom).await?;
    audit::log(
        &txn,
        Some(actor_id),
        "ACTIVATE_BOM_VERSION",
        "PRODUCT_BOM",
        response.id.to_string(),
        before,
        audit::snapshot(&response),
        Some("Versi BOM baru diaktifkan; versi aktif sebelumnya dipensiunkan".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(response)
}

pub async fn addon_bom_lines<C: ConnectionTrait>(
    db: &C,
    addon_id: i32,
) -> Result<Vec<addon_bom_lines::Model>, AppError> {
    Ok(AddonBomLine::find()
        .filter(addon_bom_lines::Column::AddonId.eq(addon_id))
        .filter(addon_bom_lines::Column::IsRequired.eq(true))
        .order_by_asc(addon_bom_lines::Column::SortOrder)
        .all(db)
        .await?)
}

pub async fn get_addon_bom(
    db: &DatabaseConnection,
    addon_id: i32,
) -> Result<Vec<AddonBomLineResponse>, AppError> {
    if ProductAddon::find_by_id(addon_id).one(db).await?.is_none() {
        return Err(AppError::not_found("Add-on tidak ditemukan"));
    }
    Ok(addon_bom_lines(db, addon_id)
        .await?
        .iter()
        .map(map_addon_line)
        .collect())
}

pub async fn upsert_addon_bom(
    db: &DatabaseConnection,
    actor_id: i32,
    addon_id: i32,
    payload: UpsertAddonBomRequest,
) -> Result<Vec<AddonBomLineResponse>, AppError> {
    payload.validate()?;
    for line in &payload.lines {
        validate_line(line)?;
    }
    let txn = db.begin().await?;
    let addon = ProductAddon::find_by_id(addon_id)
        .one(&txn)
        .await?
        .ok_or_else(|| AppError::not_found("Add-on tidak ditemukan"))?;
    if !addon.is_active {
        return Err(AppError::conflict("Add-on nonaktif tidak dapat memiliki BOM"));
    }
    for line in &payload.lines {
        let material = RawMaterial::find_by_id(line.raw_material_id)
            .one(&txn)
            .await?
            .ok_or_else(|| AppError::field("lines", "Bahan BOM add-on tidak ditemukan"))?;
        if !material.is_active {
            return Err(AppError::field("lines", format!("Bahan '{}' tidak aktif", material.name)));
        }
    }
    let old = AddonBomLine::find()
        .filter(addon_bom_lines::Column::AddonId.eq(addon_id))
        .all(&txn)
        .await?;
    let before = audit::snapshot(&old);
    AddonBomLine::delete_many()
        .filter(addon_bom_lines::Column::AddonId.eq(addon_id))
        .exec(&txn)
        .await?;
    let mut result = Vec::with_capacity(payload.lines.len());
    for (index, line) in payload.lines.iter().enumerate() {
        let (_, basis, waste) = validate_line(line)?;
        let record = addon_bom_lines::ActiveModel {
            addon_id: Set(addon_id),
            raw_material_id: Set(line.raw_material_id),
            consumption_basis: Set(basis),
            qty_per_addon: Set(line.qty_per_output),
            waste_pct: Set(waste),
            is_required: Set(line.is_required.unwrap_or(true)),
            sort_order: Set(index as i32),
            ..Default::default()
        }
        .insert(&txn)
        .await?;
        result.push(map_addon_line(&record));
    }
    audit::log(
        &txn,
        Some(actor_id),
        "REPLACE_ADDON_BOM",
        "ADDON_BOM",
        addon_id.to_string(),
        before,
        audit::snapshot(&result),
        Some("Resep bahan add-on diperbarui".to_string()),
    )
    .await?;
    txn.commit().await?;
    Ok(result)
}

pub fn calculate_required_qty(
    basis: &str,
    qty_per_output: Decimal,
    waste_pct: Decimal,
    order_qty: i32,
    length: Option<Decimal>,
    width: Option<Decimal>,
    output_qty: Decimal,
) -> Result<Decimal, AppError> {
    let normalized_output = if output_qty > Decimal::ZERO { output_qty } else { Decimal::ONE };
    let units = Decimal::from(order_qty) / normalized_output;
    let base = match basis {
        BASIS_PER_UNIT => units * qty_per_output,
        BASIS_PER_AREA => {
            let length = length.filter(|value| *value > Decimal::ZERO).ok_or_else(|| {
                AppError::field("length", "BOM PER_AREA membutuhkan panjang lebih dari 0")
            })?;
            let width = width.filter(|value| *value > Decimal::ZERO).ok_or_else(|| {
                AppError::field("width", "BOM PER_AREA membutuhkan lebar lebih dari 0")
            })?;
            units * length * width * qty_per_output
        }
        BASIS_PER_LENGTH => {
            let length = length.filter(|value| *value > Decimal::ZERO).ok_or_else(|| {
                AppError::field("length", "BOM PER_LENGTH membutuhkan panjang lebih dari 0")
            })?;
            units * length * qty_per_output
        }
        BASIS_FIXED => qty_per_output,
        _ => return Err(AppError::Internal("Basis BOM tidak dikenal".into())),
    };
    Ok(base * (Decimal::ONE + waste_pct))
}
