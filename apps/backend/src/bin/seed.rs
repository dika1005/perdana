use std::env;
use bcrypt::{DEFAULT_COST, hash};
use dotenvy::dotenv;
use entity::enums::{PriceType, RangePriceType, UserRole};
use entity::{
    customers, product_addons, product_categories, product_variants, products,
    raw_material_categories, raw_materials, users,
};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ConnectionTrait, Database, DatabaseConnection, DbBackend,
    Set, Statement,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    env_logger::init();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "mysql://dika:dikaramadan@localhost:3306/perdana".to_string());

    println!("==================================================");
    println!("  PERCETAKAN PERDANA - SEEDING DATA PRODUK ASLI");
    println!("  Depan Polsek Ciawigebang - Kuningan");
    println!("==================================================");
    println!("Connecting to database: {}", database_url);
    let db: DatabaseConnection = Database::connect(&database_url).await?;

    println!("\n🧹 Membersihkan data lama di database...");
    db.execute(Statement::from_string(DbBackend::MySql, "SET FOREIGN_KEY_CHECKS = 0;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM transaction_item_addons;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM transaction_items;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM transactions;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM expenses;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM raw_material_mutations;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM raw_materials;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM raw_material_categories;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM product_addons;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM product_variants;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM products;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM product_categories;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM customers;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "DELETE FROM users;")).await?;
    db.execute(Statement::from_string(DbBackend::MySql, "SET FOREIGN_KEY_CHECKS = 1;")).await?;
    println!("✅ Database berhasil dikosongkan.");

    // 1. Akun Pengguna
    println!("\n👤 Membuat Akun Pengguna...");
    let superadmin_password = env::var("SEED_SUPERADMIN_PASSWORD").unwrap_or_else(|_| "perdana1".to_string());
    let superadmin_hash = hash(&superadmin_password, DEFAULT_COST)?;
    let cashier_hash = hash("password123", DEFAULT_COST)?;

    let _u_owner = users::ActiveModel {
        name: Set("Owner Percetakan Perdana".to_string()),
        username: Set("superadmin".to_string()),
        password_hash: Set(superadmin_hash),
        role: Set(UserRole::SuperAdmin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Super Admin / Owner: superadmin");

    let _u_kasir1 = users::ActiveModel {
        name: Set("Kasir Percetakan".to_string()),
        username: Set("kasir".to_string()),
        password_hash: Set(cashier_hash),
        role: Set(UserRole::Admin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Kasir Operasional: kasir");

    // 2. Kategori Bahan Baku & Stok Bahan Baku Fisik
    println!("\n📦 Menanam Kategori & Stok Bahan Baku Asli...");
    let rcat_kertas = raw_material_categories::ActiveModel {
        name: Set("Kertas & Karton".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let rcat_amplop = raw_material_categories::ActiveModel {
        name: Set("Amplop & Plastik Undangan".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let rcat_tinta_display = raw_material_categories::ActiveModel {
        name: Set("Tinta, Banner & Perlengkapan Cetak".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let raw_mats = vec![
        // Kertas & Karton
        ("Kertas BW 23", Some("Plano / Pack"), "lembar", 200, 20, rcat_kertas.id),
        ("Kertas BW 21", Some("Plano / Pack"), "lembar", 200, 20, rcat_kertas.id),
        ("Kertas Kunsruk (Art Paper)", Some("Plano / Rim"), "lembar", 500, 50, rcat_kertas.id),
        ("Kertas Stiker Cromo", Some("Rim / Pack"), "lembar", 150, 20, rcat_kertas.id),
        ("Kertas BC Tik", Some("Plano / Pack"), "lembar", 300, 30, rcat_kertas.id),
        ("Kertas Ciwi Putih", Some("F4 / Rim"), "rim", 40, 5, rcat_kertas.id),
        ("Kertas Ciwi Merah/Pink", Some("F4 / Rim"), "rim", 25, 5, rcat_kertas.id),
        ("Kertas Ciwi Hijau", Some("F4 / Rim"), "rim", 25, 5, rcat_kertas.id),
        ("Kertas Ciwi Kuning", Some("F4 / Rim"), "rim", 25, 5, rcat_kertas.id),
        ("Kertas Ciwi Biru", Some("F4 / Rim"), "rim", 25, 5, rcat_kertas.id),
        ("Kertas HVS F4 Putih", Some("70gr / Rim"), "rim", 100, 10, rcat_kertas.id),
        ("Kertas HVS F4 Kuning", Some("70gr / Rim"), "rim", 30, 5, rcat_kertas.id),
        ("Kertas HVS F4 Hijau", Some("70gr / Rim"), "rim", 30, 5, rcat_kertas.id),
        ("Kertas HVS F4 Biru", Some("70gr / Rim"), "rim", 30, 5, rcat_kertas.id),
        ("Kertas NCR Putih", Some("Top / Rim"), "rim", 50, 10, rcat_kertas.id),
        ("Kertas NCR Merah", Some("Middle/Bottom"), "rim", 40, 5, rcat_kertas.id),
        ("Kertas NCR Kuning", Some("Middle/Bottom"), "rim", 40, 5, rcat_kertas.id),
        ("Kertas NCR Biru", Some("Middle/Bottom"), "rim", 40, 5, rcat_kertas.id),
        ("Kertas NCR Hijau", Some("Middle/Bottom"), "rim", 40, 5, rcat_kertas.id),

        // Amplop & Plastik Undangan
        ("Amplop Sedang", Some("Isi 100"), "box", 50, 10, rcat_amplop.id),
        ("Amplop Panjang", Some("Isi 100"), "box", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 11", Some("8, 8.5, 9, 9.5, 10, 10.5"), "pack", 60, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 11.5", Some("11.5 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 12", Some("12 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 12.5", Some("12.5 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 13", Some("13 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 13.5", Some("13.5 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 14", Some("14 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 14.5", Some("14.5 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 15", Some("15 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 15.5", Some("15.5 cm"), "pack", 50, 10, rcat_amplop.id),
        ("Plastik Undangan Ukuran 16", Some("17, 17.5, 18 cm"), "pack", 50, 10, rcat_amplop.id),

        // Tinta & Perlengkapan Cetak
        ("Bahan Tinta Cetak Cyan", Some("Botol 1L"), "botol", 20, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Magenta", Some("Botol 1L"), "botol", 20, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Yellow", Some("Botol 1L"), "botol", 20, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Black", Some("Botol 1L"), "botol", 30, 5, rcat_tinta_display.id),
        ("Bahan Karet Stempel", Some("Flash / Runaflek"), "lembar", 40, 5, rcat_tinta_display.id),
        ("Lem Fox", Some("Kaleng 1kg"), "kaleng", 15, 3, rcat_tinta_display.id),
        ("Bahan Flexi Banner", Some("Roll 3.2m x 50m"), "roll", 10, 2, rcat_tinta_display.id),
        ("Bahan Spanduk Kain TC", Some("Roll 1.2m x 50m"), "roll", 8, 2, rcat_tinta_display.id),
        ("Bahan Stiker Vinyl", Some("Roll 1.05m x 50m"), "roll", 12, 2, rcat_tinta_display.id),
        ("Stand X Banner", Some("60 x 160 cm"), "pcs", 35, 5, rcat_tinta_display.id),
        ("Stand Y Banner", Some("60 x 160 cm"), "pcs", 25, 5, rcat_tinta_display.id),
        ("Rangka Roll Banner", Some("60 x 160 / 80 x 200 cm"), "pcs", 15, 3, rcat_tinta_display.id),
        ("Tali Lanyard & Case", Some("Set Lanyard"), "pcs", 200, 30, rcat_tinta_display.id),
    ];

    for (name, variant, unit, stock, min_w, c_id) in raw_mats {
        raw_materials::ActiveModel {
            category_id: Set(Some(c_id)),
            name: Set(name.to_string()),
            variant: Set(variant.map(|s| s.to_string())),
            unit: Set(unit.to_string()),
            stock: Set(stock),
            min_stock_warning: Set(min_w),
            ..Default::default()
        }.insert(&db).await?;
    }
    println!("  -> 44 Item Stok Bahan Baku berhasil ditanam.");

    // 3. Kategori Produk
    println!("\n🏷️ Menanam Kategori Produk...");
    let cat_banner = product_categories::ActiveModel {
        name: Set("Banner, Spanduk & Display".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_stiker = product_categories::ActiveModel {
        name: Set("Stiker & Label".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_offset = product_categories::ActiveModel {
        name: Set("Nota, Faktur, Brosur & Kop Surat".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_yasin = product_categories::ActiveModel {
        name: Set("Buku Yasin, Majmu & Qur'an".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_undangan = product_categories::ActiveModel {
        name: Set("Undangan & Map Ijazah".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_merchandise = product_categories::ActiveModel {
        name: Set("Stempel, ID Card & Merchandise".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_buku_kemasan = product_categories::ActiveModel {
        name: Set("Buku, Kalender & Kemasan".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    // 4. Produk-Produk Asli Percetakan Perdana
    println!("\n🖨️ Menanam Produk-Produk Asli Percetakan Perdana...");

    // === KATEGORI 1: Banner, Spanduk & Display ===
    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Spanduk /meter".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(25000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Spanduk Kain /meter".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(60000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Bendera / Umbul-umbul /meter".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(70000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("X Banner + Stand".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(70000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("set".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    let p_stand_banner = products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Stand Y / X Banner".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::from(35000)),
        max_price: Set(Decimal::from(40000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stand_banner.id),
        variant_name: Set("Stand X Banner".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stand_banner.id),
        variant_name: Set("Stand Y Banner".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(40000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Roll Banner".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(200000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("set".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 2: Stiker & Label ===
    let p_stiker_a3 = products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        name: Set("Sticker (A3+)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stiker_a3.id),
        variant_name: Set("Stiker Cromo A3+".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stiker_a3.id),
        variant_name: Set("Stiker Vinyl Waterproof A3+".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        name: Set("Sticker (Meter)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(90000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 3: Nota, Faktur, Brosur & Kop Surat ===
    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (HVS 1 Warna 1 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(200000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    let p_nota_ncr2 = products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (NCR 1 Warna 2 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(300000)),
        min_price: Set(Decimal::from(300000)),
        max_price: Set(Decimal::from(350000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_nota_ncr2.id),
        variant_name: Set("Standar (Tanpa Nomorator)".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(300000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_nota_ncr2.id),
        variant_name: Set("Plus Nomorator".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(350000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    let p_nota_ncr3 = products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (NCR 1 Warna 3 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(450000)),
        min_price: Set(Decimal::from(450000)),
        max_price: Set(Decimal::from(500000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_nota_ncr3.id),
        variant_name: Set("Standar (Tanpa Nomorator)".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(450000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_nota_ncr3.id),
        variant_name: Set("Plus Nomorator".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(500000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (HVS Full Colour) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(500000)),
        min_price: Set(Decimal::from(500000)),
        max_price: Set(Decimal::from(550000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (NCR Full Colour 2 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(600000)),
        min_price: Set(Decimal::from(600000)),
        max_price: Set(Decimal::from(650000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Nota / Faktur (NCR Full Colour 3 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(750000)),
        min_price: Set(Decimal::from(750000)),
        max_price: Set(Decimal::from(800000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Kop Surat (HVS 1 Warna) 1 Rim".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(200000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Kop Surat (HVS Full Colour) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(350000)),
        min_price: Set(Decimal::from(350000)),
        max_price: Set(Decimal::from(450000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Brosur (HVS 1 Warna) 1 Rim".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(200000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Brosur (HVS Full Colour) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(350000)),
        min_price: Set(Decimal::from(350000)),
        max_price: Set(Decimal::from(450000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Brosur (Art Paper 1 Warna) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(420000)),
        min_price: Set(Decimal::from(420000)),
        max_price: Set(Decimal::from(500000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Brosur (Art Paper Full Colour) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(650000)),
        min_price: Set(Decimal::from(650000)),
        max_price: Set(Decimal::from(750000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_offset.id)),
        name: Set("Sertifikat / Piagam /rim".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(150000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 4: Buku Yasin, Majmu & Qur'an ===
    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (Arab Tanpa Latin)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(12000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (128 Halaman + Soft Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(13000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (128 Halaman + Hard Cover)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (176 Halaman HVS + Soft Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(13000)),
        min_price: Set(Decimal::from(13000)),
        max_price: Set(Decimal::from(17000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (176 Halaman HVS + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::from(15000)),
        max_price: Set(Decimal::from(20000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (176 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::from(20000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (208 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(23000)),
        min_price: Set(Decimal::from(23000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (210 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(23000)),
        min_price: Set(Decimal::from(23000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin (224 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(25000)),
        min_price: Set(Decimal::from(25000)),
        max_price: Set(Decimal::from(28000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin Majmu Kecil".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(12000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Buku Yasin Majmu Sedang".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(13000)),
        min_price: Set(Decimal::from(13000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Qur'an Kecil".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::from(35000)),
        max_price: Set(Decimal::from(40000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        name: Set("Qur'an Besar".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(50000)),
        min_price: Set(Decimal::from(50000)),
        max_price: Set(Decimal::from(55000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 5: Undangan & Map Ijazah ===
    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Undangan (Custom Cetak)".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(2000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(100)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Undangan Blangko".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(2500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(50)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    let p_und_digital = products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Undangan Digital".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(100000)),
        min_price: Set(Decimal::from(100000)),
        max_price: Set(Decimal::from(150000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("tema".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_und_digital.id),
        variant_name: Set("Undangan Digital Website".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(100000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_und_digital.id),
        variant_name: Set("Undangan Video Motion Full HD".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(150000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Map / Sampul Ijazah (Polos)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(5000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(10)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    let p_map_embos = products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Map / Sampul Ijazah (Embos / Sablon)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(6000)),
        min_price: Set(Decimal::from(6000)),
        max_price: Set(Decimal::from(10000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_map_embos.id),
        variant_name: Set("Sablon 1 Warna".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(6000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_map_embos.id),
        variant_name: Set("Hotprint Emas / Embos Busa".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Amplop Polos".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("box".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Amplop Custom Kop".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(40000)),
        min_price: Set(Decimal::from(40000)),
        max_price: Set(Decimal::from(50000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("box".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 6: Stempel, ID Card & Merchandise ===
    let p_stempel_flash = products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Stempel Flash (Otomatis)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(60000)),
        min_price: Set(Decimal::from(60000)),
        max_price: Set(Decimal::from(100000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_flash.id),
        variant_name: Set("Stempel Flash 1 Warna".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(60000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_flash.id),
        variant_name: Set("Stempel Flash 2 Warna".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(80000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_flash.id),
        variant_name: Set("Stempel Flash Ukuran Besar / Jumbo".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(100000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    let p_stempel_kayu = products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Stempel Kayu (Manual)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::from(35000)),
        max_price: Set(Decimal::from(50000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_kayu.id),
        variant_name: Set("Stempel Kayu Ukuran Kecil".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_kayu.id),
        variant_name: Set("Stempel Kayu Ukuran Sedang / Standar".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(40000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stempel_kayu.id),
        variant_name: Set("Stempel Kayu Ukuran Besar".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(50000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    let p_id_card = products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("ID Card + Lanyard (Min. Order 20pcs)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::from(15000)),
        max_price: Set(Decimal::from(20000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("set".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_id_card.id),
        variant_name: Set("ID Card 1 Sisi + Lanyard".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_id_card.id),
        variant_name: Set("ID Card 2 Sisi + Lanyard Printing".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    let p_name_tag = products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Name Tag Dada".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::from(20000)),
        max_price: Set(Decimal::from(30000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_name_tag.id),
        variant_name: Set("Name Tag Peniti".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_name_tag.id),
        variant_name: Set("Name Tag Magnet Kuat".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(30000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    let p_ganci_kecil = products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Gantungan Kunci Kecil".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(3000)),
        min_price: Set(Decimal::from(3000)),
        max_price: Set(Decimal::from(5000)),
        min_order: Set(Some(10)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(true),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_ganci_kecil.id),
        variant_name: Set("Pin Gantungan Kunci 1 Sisi".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(3000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_ganci_kecil.id),
        variant_name: Set("Gantungan Kunci 2 Sisi / Putar".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(5000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Gantungan Kunci Besar".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(8000)),
        min_price: Set(Decimal::from(8000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(10)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        name: Set("Gantungan Kunci Akrilik".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(3000)),
        min_price: Set(Decimal::from(3000)),
        max_price: Set(Decimal::from(5000)),
        min_order: Set(Some(10)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KATEGORI 7: Buku, Kalender & Kemasan ===
    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Box Makanan (Kemasan)".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(1500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(500)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Paper Bag (Tas Kertas)".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(3500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(100)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Raport Sekolah".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Note Book / Buku Catatan".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(20)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Year Book / Buku Tahunan".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(65000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(30)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Kalender Dinding / Meja".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(18000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(50)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_buku_kemasan.id)),
        name: Set("Piagam / Medali (Min. Order 20pcs)".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(20)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    println!("  -> 41 Produk Asli Percetakan Perdana berhasil ditanam.");

    // 5. Add-on & Finishing Asli
    println!("\n✨ Menanam Add-ons / Finishing Asli...");
    let addons_list = vec![
        ("Cutting Stiker (Kiss Cut / Die Cut)", RangePriceType::Range, Decimal::from(5000), Decimal::from(5000), Decimal::from(15000)),
        ("Tambah Warna Stempel", RangePriceType::Fixed, Decimal::from(5000), Decimal::ZERO, Decimal::ZERO),
        ("Tambah Pita Rumbai (Buku Yasin)", RangePriceType::Fixed, Decimal::from(1000), Decimal::ZERO, Decimal::ZERO),
        ("Tambah Sudut Siku Emas (Buku Yasin)", RangePriceType::Fixed, Decimal::from(2000), Decimal::ZERO, Decimal::ZERO),
        ("Mata Ayam / Ring Banner (per lubang)", RangePriceType::Fixed, Decimal::from(1000), Decimal::ZERO, Decimal::ZERO),
        ("Laminasi Glossy A3+", RangePriceType::Fixed, Decimal::from(3000), Decimal::ZERO, Decimal::ZERO),
        ("Laminasi Doff A3+", RangePriceType::Fixed, Decimal::from(3000), Decimal::ZERO, Decimal::ZERO),
        ("Potong Sudut Bulat (Round Corner)", RangePriceType::Fixed, Decimal::from(5000), Decimal::ZERO, Decimal::ZERO),
    ];

    for (name, ptype, def_p, min_p, max_p) in addons_list {
        product_addons::ActiveModel {
            name: Set(name.to_string()),
            price_type: Set(ptype),
            default_price: Set(def_p),
            min_price: Set(min_p),
            max_price: Set(max_p),
            ..Default::default()
        }.insert(&db).await?;
    }
    println!("  -> 8 Add-on / Finishing Asli berhasil ditambahkan.");

    // 6. Data Pelanggan Nyata Percetakan Perdana
    println!("\n👥 Menanam Data Pelanggan Nyata...");
    let cust_list = vec![
        ("Kantor Desa Ciawigebang", Some("0812-2233-4455"), Some("Kec. Ciawigebang, Kuningan")),
        ("Polsek Ciawigebang", Some("0813-1122-3344"), Some("Depan Percetakan Perdana, Kuningan")),
        ("SMK / SMA Negeri Ciawigebang", Some("0852-9988-7766"), Some("Jl. Raya Ciawigebang, Kuningan")),
        ("KUA & Majelis Taklim Al-Hidayah", Some("0877-5566-7788"), Some("Ciawigebang, Kuningan")),
        ("CV. Berkah Mandiri Kuningan", Some("0821-3344-5566"), Some("Kuningan Jawa Barat")),
    ];
    for (name, phone, address) in cust_list {
        customers::ActiveModel {
            name: Set(name.to_string()),
            phone: Set(phone.map(|s| s.to_string())),
            address: Set(address.map(|s| s.to_string())),
            ..Default::default()
        }.insert(&db).await?;
    }
    println!("  -> 5 Kontak Pelanggan Nyata berhasil ditambahkan.");

    println!("\n==================================================");
    println!("🎉 SEEDING DATA ASLI PERCETAKAN PERDANA SUKSES!");
    println!("==================================================");
    Ok(())
}
