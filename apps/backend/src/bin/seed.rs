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

    // ── Safety guard ────────────────────────────────────────────────────
    let confirm = env::var("SEED_CONFIRM").unwrap_or_default();
    if confirm != "yes" {
        eprintln!("⚠️  SEED_CONFIRM tidak diset ke 'yes'. Seeding dibatalkan.");
        eprintln!("   Jalankan dengan: SEED_CONFIRM=yes cargo run --bin seed");
        std::process::exit(1);
    }

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "mysql://dika:dikaramadan@localhost:3306/perdana".to_string());

    println!("==================================================");
    println!("  PERCETAKAN PERDANA - SEEDING DATA RESMI & ASLI");
    println!("  Depan Polsek Ciawigebang - Kuningan");
    println!("==================================================");
    println!("Connecting to database: {}", database_url);
    let db: DatabaseConnection = Database::connect(&database_url).await?;

    println!("\n🧹 Membersihkan data lama di database...");
    db.execute(Statement::from_string(DbBackend::MySql, "SET FOREIGN_KEY_CHECKS = 0;")).await?;
    // Production-domain tables (order matters for FK)
    for table in [
        "audit_logs", "production_events", "payments", "inventory_ledger",
        "stock_reservations", "transaction_item_materials", "material_lots",
        "material_uom_conversions", "addon_bom_lines", "product_bom_lines",
        "product_boms", "invoice_counter",
        // Legacy core tables
        "transaction_item_addons", "transaction_items", "transactions",
        "expenses", "raw_material_mutations", "raw_materials",
        "raw_material_categories", "product_addons", "product_variants",
        "products", "product_categories", "customers", "users",
    ] {
        let _ = db.execute(Statement::from_string(DbBackend::MySql, format!("DELETE FROM {};", table))).await;
    }
    db.execute(Statement::from_string(DbBackend::MySql, "SET FOREIGN_KEY_CHECKS = 1;")).await?;

    // Migrasi Skema Tabel jika kolom category_id belum ada pada product_addons
    let _ = db.execute(Statement::from_string(DbBackend::MySql, "ALTER TABLE product_addons ADD COLUMN category_id INT NULL DEFAULT NULL;")).await;
    let _ = db.execute(Statement::from_string(DbBackend::MySql, "ALTER TABLE product_addons ADD CONSTRAINT fk_product_addons_category FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;")).await;

    println!("✅ Database bersih & skema terverifikasi.");


    // 1. Akun Pengguna: 1 Super Admin & 1 Admin Kasir
    println!("\n👤 Membuat Akun Pengguna...");
    let superadmin_password = env::var("SEED_SUPERADMIN_PASSWORD").unwrap_or_else(|_| "perdana1".to_string());
    let superadmin_hash = hash(&superadmin_password, DEFAULT_COST)?;
    let admin_hash = hash("password123", DEFAULT_COST)?;

    let _u_owner = users::ActiveModel {
        name: Set("Owner Percetakan Perdana".to_string()),
        username: Set("superadmin".to_string()),
        password_hash: Set(superadmin_hash),
        role: Set(UserRole::SuperAdmin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Super Admin / Owner: superadmin");

    let _u_admin = users::ActiveModel {
        name: Set("Admin Kasir Perdana".to_string()),
        username: Set("admin".to_string()),
        password_hash: Set(admin_hash),
        role: Set(UserRole::Admin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Admin Kasir: admin");

    // 2. Kategori Bahan Baku Fisik
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
        name: Set("Tinta, Banner, Stempel & Perlengkapan".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    // Daftar Lengkap Bahan Baku Sesuai DAFTAR STOK BARANG
    let raw_mats = vec![
        // I. Kertas & Karton (Satuan Dasar: Lembar)
        ("Kertas BW 23", Some("Plano / Pack"), "lembar", 250, 30, rcat_kertas.id),
        ("Kertas BW 21", Some("Plano / Pack"), "lembar", 250, 30, rcat_kertas.id),
        ("Kertas Kunsruk", Some("Art Paper Plano"), "lembar", 500, 50, rcat_kertas.id),
        ("Kertas Stiker Cromo", Some("A3+ / Pack"), "lembar", 350, 30, rcat_kertas.id),
        ("Kertas BC Tik", Some("Plano / Pack"), "lembar", 300, 30, rcat_kertas.id),
        ("Kertas Ciwi Putih", Some("F4 / 50 Rim"), "lembar", 25000, 1500, rcat_kertas.id),
        ("Ciwi Merah/Pink", Some("F4 / 30 Rim"), "lembar", 15000, 1000, rcat_kertas.id),
        ("Ciwi Hijau", Some("F4 / 30 Rim"), "lembar", 15000, 1000, rcat_kertas.id),
        ("Ciwi Kuning", Some("F4 / 30 Rim"), "lembar", 15000, 1000, rcat_kertas.id),
        ("Ciwi Biru", Some("F4 / 30 Rim"), "lembar", 15000, 1000, rcat_kertas.id),
        ("Kertas HVS F4 Putih", Some("70-80gr / 120 Rim"), "lembar", 60000, 2500, rcat_kertas.id),
        ("HVS F4 Kuning", Some("70gr / 40 Rim"), "lembar", 20000, 1000, rcat_kertas.id),
        ("HVS F4 Hijau", Some("70gr / 40 Rim"), "lembar", 20000, 1000, rcat_kertas.id),
        ("HVS F4 Biru", Some("70gr / 40 Rim"), "lembar", 20000, 1000, rcat_kertas.id),
        ("Kertas NCR Putih", Some("Top / 60 Rim"), "lembar", 30000, 2500, rcat_kertas.id),
        ("NCR Merah", Some("Middle/Bottom / 50 Rim"), "lembar", 25000, 1500, rcat_kertas.id),
        ("NCR Kuning", Some("Middle/Bottom / 50 Rim"), "lembar", 25000, 1500, rcat_kertas.id),
        ("NCR Biru", Some("Middle/Bottom / 50 Rim"), "lembar", 25000, 1500, rcat_kertas.id),
        ("NCR Hijau", Some("Middle/Bottom / 50 Rim"), "lembar", 25000, 1500, rcat_kertas.id),

        // II. Amplop & Plastik Undangan (Satuan Dasar: Pcs)
        ("Amplop Sedang", Some("Isi 100 / Box"), "pcs", 6000, 500, rcat_amplop.id),
        ("Amplop Panjang", Some("Isi 100 / Box"), "pcs", 6000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 8", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 8.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 9", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 9.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 10", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 10.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 11", Some("Pack Isi 100"), "pcs", 6000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 11.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 12", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 12.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 13", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 13.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 14", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 14.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 15", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 15.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 16", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 17", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 17.5", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),
        ("Plastik Und. Ukuran 18", Some("Pack Isi 100"), "pcs", 5000, 500, rcat_amplop.id),

        // III. Tinta, Banner, Stempel & Lem
        ("Bahan Tinta Cetak Cyan", Some("Botol 1L"), "botol", 25, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Magenta", Some("Tinta Merah 1L"), "botol", 25, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Yellow", Some("Botol 1L"), "botol", 25, 3, rcat_tinta_display.id),
        ("Bahan Tinta Cetak Black", Some("Botol 1L"), "botol", 35, 5, rcat_tinta_display.id),
        ("Bahan Karet Stempel", Some("Flash / Kayu"), "lembar", 50, 5, rcat_tinta_display.id),
        ("Lem Fox", Some("Kaleng 1kg"), "kaleng", 25, 3, rcat_tinta_display.id),
        ("Bahan Flexi Banner 280G", Some("Roll 3.2m x 50m / 12 Roll"), "meter", 600, 50, rcat_tinta_display.id),
        ("Bahan Spanduk Kain TC", Some("Roll 1.2m x 50m / 10 Roll"), "meter", 500, 50, rcat_tinta_display.id),
        ("Bahan Stiker Vinyl Roll", Some("Roll 1.05m x 50m / 15 Roll"), "meter", 750, 50, rcat_tinta_display.id),
        ("Stand X Banner", Some("Rangka 60x160cm"), "pcs", 40, 5, rcat_tinta_display.id),
        ("Stand Y Banner", Some("Rangka 60x160cm"), "pcs", 30, 5, rcat_tinta_display.id),
        ("Rangka Roll Banner", Some("Aluminium 60x160cm"), "pcs", 20, 3, rcat_tinta_display.id),
        ("Tali Lanyard & Case ID", Some("Set Lengkap"), "pcs", 250, 30, rcat_tinta_display.id),
        ("Gantungan Kunci Polos", Some("Bahan Akrilik/Pin"), "pcs", 300, 30, rcat_tinta_display.id),
    ];

    let mut map_mat_id = std::collections::HashMap::new();
    for (name, variant, unit, stock, min_w, c_id) in raw_mats {
        let inserted = raw_materials::ActiveModel {
            category_id: Set(Some(c_id)),
            name: Set(name.to_string()),
            variant: Set(variant.map(|s| s.to_string())),
            unit: Set(unit.to_string()),
            stock: Set(Decimal::from(stock)),
            min_stock_warning: Set(Decimal::from(min_w)),
            ..Default::default()
        }.insert(&db).await?;
        map_mat_id.insert(name.to_string(), inserted.id);
    }
    println!("  -> {} Bahan Baku Asli berhasil ditanam.", map_mat_id.len());

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

    let cat_stempel = product_categories::ActiveModel {
        name: Set("Stempel & Aksesoris".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_undangan = product_categories::ActiveModel {
        name: Set("Undangan & Amplop".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_nota = product_categories::ActiveModel {
        name: Set("Nota, Faktur & Kop Surat".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_yasin = product_categories::ActiveModel {
        name: Set("Buku Yasin, Majmu & Qur'an".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_brosur = product_categories::ActiveModel {
        name: Set("Brosur, Map & Kalender".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_merchandise = product_categories::ActiveModel {
        name: Set("Souvenir, ID Card & Kemasan".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    // 4. Produk-Produk Asli Percetakan Perdana (57 Produk Lengkap)
    println!("\n🖨️ Menanam Produk-Produk Asli Percetakan Perdana...");

    let mat_flexi = map_mat_id.get("Bahan Flexi Banner 280G").copied();
    let mat_kain = map_mat_id.get("Bahan Spanduk Kain TC").copied();
    let mat_stand_x = map_mat_id.get("Stand X Banner").copied();
    let mat_roll_b = map_mat_id.get("Rangka Roll Banner").copied();
    let mat_stiker_cromo = map_mat_id.get("Kertas Stiker Cromo").copied();
    let mat_stiker_vinyl = map_mat_id.get("Bahan Stiker Vinyl Roll").copied();
    let mat_karet_stempel = map_mat_id.get("Bahan Karet Stempel").copied();
    let mat_hvs_f4 = map_mat_id.get("Kertas HVS F4 Putih").copied();
    let mat_ncr_putih = map_mat_id.get("Kertas NCR Putih").copied();
    let mat_kunsruk = map_mat_id.get("Kertas Kunsruk").copied();
    let mat_amplop_sedang = map_mat_id.get("Amplop Sedang").copied();
    let mat_lanyard = map_mat_id.get("Tali Lanyard & Case ID").copied();
    let mat_ganci = map_mat_id.get("Gantungan Kunci Polos").copied();

    // === KELOMPOK 1: Banner, Spanduk & Display ===
    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        raw_material_id: Set(mat_flexi),
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
        raw_material_id: Set(mat_kain),
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
        raw_material_id: Set(mat_kain),
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
        raw_material_id: Set(mat_stand_x),
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

    let p_stand = products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        raw_material_id: Set(mat_stand_x),
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
        product_id: Set(p_stand.id),
        variant_name: Set("Stand X Banner".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    product_variants::ActiveModel {
        product_id: Set(p_stand.id),
        variant_name: Set("Stand Y Banner".to_string()),
        price_type: Set(RangePriceType::Fixed),
        price: Set(Decimal::from(40000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        raw_material_id: Set(mat_roll_b),
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

    // === KELOMPOK 2: Stiker & Label ===
    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        raw_material_id: Set(mat_stiker_cromo),
        name: Set("Sticker (A3+)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(70000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("paket".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        raw_material_id: Set(mat_stiker_vinyl),
        name: Set("Sticker (Meter)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        raw_material_id: Set(mat_stiker_vinyl),
        name: Set("Sticker Cutting".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(90000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("meter".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KELOMPOK 3: Stempel & Aksesoris ===
    products::ActiveModel {
        category_id: Set(Some(cat_stempel.id)),
        raw_material_id: Set(mat_karet_stempel),
        name: Set("Stempel Flash".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(60000)),
        min_price: Set(Decimal::from(60000)),
        max_price: Set(Decimal::from(100000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_stempel.id)),
        raw_material_id: Set(mat_karet_stempel),
        name: Set("Stempel Kayu".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::from(35000)),
        max_price: Set(Decimal::from(50000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KELOMPOK 4: Undangan & Amplop ===
    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Undangan".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(2500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        raw_material_id: Set(None),
        name: Set("Undangan Digital".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(100000)),
        min_price: Set(Decimal::from(100000)),
        max_price: Set(Decimal::from(150000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("tema".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        raw_material_id: Set(None),
        name: Set("Undangan Blangko".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(1500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        raw_material_id: Set(mat_amplop_sedang),
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
        raw_material_id: Set(mat_amplop_sedang),
        name: Set("Amplop Custom".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(40000)),
        min_price: Set(Decimal::from(40000)),
        max_price: Set(Decimal::from(50000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("box".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KELOMPOK 5: Nota, Faktur & Kop Surat ===
    products::ActiveModel {
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_hvs_f4),
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

    products::ActiveModel {
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_ncr_putih),
        name: Set("Nota / Faktur (NCR 1 Warna 2 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(300000)),
        min_price: Set(Decimal::from(300000)),
        max_price: Set(Decimal::from(350000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_ncr_putih),
        name: Set("Nota / Faktur (NCR 1 Warna 3 Ply) 1 Rim".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(450000)),
        min_price: Set(Decimal::from(450000)),
        max_price: Set(Decimal::from(500000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_hvs_f4),
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
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_ncr_putih),
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
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_ncr_putih),
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
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_hvs_f4),
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
        category_id: Set(Some(cat_nota.id)),
        raw_material_id: Set(mat_hvs_f4),
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

    // === KELOMPOK 6: Buku Yasin, Majmu & Qur'an ===
    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin (Arab Tanpa Latin)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(12000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin (128 Halaman + Soft Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(13000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin (128 Halaman + Hard Cover)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin (176 Halaman HVS + Soft Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(13000)),
        min_price: Set(Decimal::from(13000)),
        max_price: Set(Decimal::from(17000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin (176 Halaman HVS + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::from(15000)),
        max_price: Set(Decimal::from(20000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Buku Yasin (176 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::from(20000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Buku Yasin (208 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(23000)),
        min_price: Set(Decimal::from(23000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Buku Yasin (210 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(23000)),
        min_price: Set(Decimal::from(23000)),
        max_price: Set(Decimal::from(25000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Buku Yasin (224 Halaman AP + Hard Cover)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(25000)),
        min_price: Set(Decimal::from(25000)),
        max_price: Set(Decimal::from(28000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin Majmu Kecil".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::from(10000)),
        max_price: Set(Decimal::from(12000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(mat_hvs_f4),
        name: Set("Buku Yasin Majmu Sedang".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(13000)),
        min_price: Set(Decimal::from(13000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_yasin.id)),
        raw_material_id: Set(None),
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
        raw_material_id: Set(None),
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

    // === KELOMPOK 7: Brosur, Map & Kalender ===
    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_kunsruk),
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
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_kunsruk),
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
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_hvs_f4),
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
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_hvs_f4),
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
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(None),
        name: Set("Map / Sampul Ijazah (Polos)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(5000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(None),
        name: Set("Map / Sampul Ijazah (Cetak / Emboss)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(6000)),
        min_price: Set(Decimal::from(6000)),
        max_price: Set(Decimal::from(10000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Kalender".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(18000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        raw_material_id: Set(mat_kunsruk),
        name: Set("Sertifikat /rim".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(200000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("rim".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // === KELOMPOK 8: Souvenir, ID Card & Kemasan ===
    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(mat_lanyard),
        name: Set("ID Card + Lanyard (Min. Order 20pcs)".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::from(15000)),
        max_price: Set(Decimal::from(20000)),
        min_order: Set(Some(20)),
        unit_name: Set(Some("set".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Name Tag".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(20000)),
        min_price: Set(Decimal::from(20000)),
        max_price: Set(Decimal::from(30000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(mat_ganci),
        name: Set("Gantungan Kunci Kecil".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(3000)),
        min_price: Set(Decimal::from(3000)),
        max_price: Set(Decimal::from(5000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(mat_ganci),
        name: Set("Gantungan Kunci Besar".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(8000)),
        min_price: Set(Decimal::from(8000)),
        max_price: Set(Decimal::from(15000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(mat_ganci),
        name: Set("Gantungan Kunci Akrilik".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(3000)),
        min_price: Set(Decimal::from(3000)),
        max_price: Set(Decimal::from(5000)),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Box Makanan".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(1500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Paper Bag".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(3500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("pcs".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Raport".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Note Book".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(15000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Year Book".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(65000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("buku".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
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

    products::ActiveModel {
        category_id: Set(Some(cat_merchandise.id)),
        raw_material_id: Set(None),
        name: Set("Dll. / Jasa Cetak & Setting".to_string()),
        price_type: Set(PriceType::Custom),
        default_price: Set(Decimal::from(10000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("jasa".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    println!("  -> 57 Produk Asli Percetakan Perdana berhasil ditanam.");

    // 5. Add-on & Finishing Asli Spesifik Kategori & Global
    println!("\n✨ Menanam Add-ons / Finishing Asli...");
    let addons_list = vec![
        ("Cutting Stiker (Kiss Cut / Die Cut)", Some(cat_stiker.id), RangePriceType::Range, Decimal::from(5000), Decimal::from(5000), Decimal::from(15000)),
        ("Tambah Warna Stempel", Some(cat_stempel.id), RangePriceType::Fixed, Decimal::from(5000), Decimal::ZERO, Decimal::ZERO),
        ("Tambah Pita Rumbai (Buku Yasin)", Some(cat_yasin.id), RangePriceType::Fixed, Decimal::from(1000), Decimal::ZERO, Decimal::ZERO),
        ("Tambah Sudut Siku Emas (Buku Yasin)", Some(cat_yasin.id), RangePriceType::Fixed, Decimal::from(2000), Decimal::ZERO, Decimal::ZERO),
        ("Mata Ayam / Ring Banner (per lubang)", Some(cat_banner.id), RangePriceType::Fixed, Decimal::from(1000), Decimal::ZERO, Decimal::ZERO),
        ("Laminasi Glossy A3+", None, RangePriceType::Fixed, Decimal::from(2000), Decimal::ZERO, Decimal::ZERO),
        ("Laminasi Doff A3+", None, RangePriceType::Fixed, Decimal::from(2000), Decimal::ZERO, Decimal::ZERO),
        ("Potong Sudut Bulat (Round Corner)", None, RangePriceType::Fixed, Decimal::from(3000), Decimal::ZERO, Decimal::ZERO),
    ];

    for (name, cat_id, ptype, def_p, min_p, max_p) in addons_list {
        product_addons::ActiveModel {
            name: Set(name.to_string()),
            category_id: Set(cat_id),
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

    // 7. Contoh BOM (Bill of Materials) untuk demonstrasi produksi
    println!("\n🔧 Menanam Contoh BOM Produk...");
    // We insert BOM rows via raw SQL because the seeder runs before
    // the SeaORM entity for `product_boms` is generated with full
    // ActiveModel support. Using SQL keeps the seeder simple.

    // ── Spanduk /meter: 1 m² Flexi Banner per output, 5% waste allowance
    if let (Some(p_spanduk_id), Some(mat_flexi_id)) = (
        find_product_id(&db, "Spanduk /meter").await,
        mat_flexi,
    ) {
        let bom_id = insert_bom_sql(&db, p_spanduk_id, None, 1).await?;
        insert_bom_line_sql(&db, bom_id, mat_flexi_id, "MATERIAL", "PER_AREA", "1.0000", "0.0500", true, 0).await?;
        println!("  -> BOM Spanduk /meter (Flexi Banner PER_AREA)");
    }

    // ── Sticker (A3+): 1 lembar Stiker Cromo per unit, 3% waste
    if let (Some(p_stiker_id), Some(mat_cromo_id)) = (
        find_product_id(&db, "Sticker (A3+)").await,
        mat_stiker_cromo,
    ) {
        let bom_id = insert_bom_sql(&db, p_stiker_id, None, 1).await?;
        insert_bom_line_sql(&db, bom_id, mat_cromo_id, "MATERIAL", "PER_UNIT", "1.0000", "0.0300", true, 0).await?;
        println!("  -> BOM Sticker A3+ (Cromo PER_UNIT)");
    }

    // ── Nota NCR 2 Ply: 500 lembar NCR Putih + 500 lembar NCR warna per rim
    if let (Some(p_nota_id), Some(mat_ncr_id)) = (
        find_product_id(&db, "Nota / Faktur (NCR 1 Warna 2 Ply) 1 Rim").await,
        mat_ncr_putih,
    ) {
        let bom_id = insert_bom_sql(&db, p_nota_id, None, 1).await?;
        insert_bom_line_sql(&db, bom_id, mat_ncr_id, "MATERIAL", "PER_UNIT", "500.0000", "0.0200", true, 0).await?;
        // Tinta sebagai fixed component
        if let Some(mat_tinta_id) = map_mat_id.get("Bahan Tinta Cetak Black").copied() {
            insert_bom_line_sql(&db, bom_id, mat_tinta_id, "MATERIAL", "FIXED", "0.0500", "0.0000", true, 1).await?;
        }
        println!("  -> BOM Nota NCR 2 Ply (NCR + Tinta)");
    }

    // ── Addon BOM: Mata Ayam → 0 bahan wajib (jasa murni), tapi bisa ditambahkan
    // Contoh: Laminasi Glossy membutuhkan bahan laminasi (belum ada di stok, skip)
    println!("  -> Addon BOMs: skipped (add-on saat ini adalah jasa tanpa bahan)");

    // 8. Contoh UOM Conversions
    println!("\n📐 Menanam Konversi Satuan Bahan...");
    // HVS F4: 1 rim = 500 lembar
    if let Some(hvs_id) = map_mat_id.get("Kertas HVS F4 Putih").copied() {
        let _ = db.execute(Statement::from_string(DbBackend::MySql, format!(
            "INSERT IGNORE INTO material_uom_conversions (raw_material_id, from_unit, to_unit, factor, notes) VALUES ({}, 'rim', 'lembar', 500.000000, '1 rim = 500 lembar HVS')",
            hvs_id
        ))).await;
        println!("  -> HVS F4: 1 rim = 500 lembar");
    }
    // NCR Putih: 1 rim = 500 lembar
    if let Some(ncr_id) = map_mat_id.get("Kertas NCR Putih").copied() {
        let _ = db.execute(Statement::from_string(DbBackend::MySql, format!(
            "INSERT IGNORE INTO material_uom_conversions (raw_material_id, from_unit, to_unit, factor, notes) VALUES ({}, 'rim', 'lembar', 500.000000, '1 rim = 500 lembar NCR')",
            ncr_id
        ))).await;
        println!("  -> NCR Putih: 1 rim = 500 lembar");
    }
    // Art Paper: 1 rim = 500 lembar
    if let Some(ap_id) = map_mat_id.get("Kertas Kunsruk").copied() {
        let _ = db.execute(Statement::from_string(DbBackend::MySql, format!(
            "INSERT IGNORE INTO material_uom_conversions (raw_material_id, from_unit, to_unit, factor, notes) VALUES ({}, 'rim', 'lembar', 500.000000, '1 rim = 500 lembar Art Paper')",
            ap_id
        ))).await;
        println!("  -> Art Paper: 1 rim = 500 lembar");
    }
    // Amplop: 1 box = 100 pcs
    if let Some(amp_id) = map_mat_id.get("Amplop Sedang").copied() {
        let _ = db.execute(Statement::from_string(DbBackend::MySql, format!(
            "INSERT IGNORE INTO material_uom_conversions (raw_material_id, from_unit, to_unit, factor, notes) VALUES ({}, 'box', 'pcs', 100.000000, '1 box = 100 pcs amplop')",
            amp_id
        ))).await;
        println!("  -> Amplop Sedang: 1 box = 100 pcs");
    }

    println!("\n==================================================");
    println!("🎉 SEEDING DATA ASLI PERCETAKAN PERDANA SUKSES!");
    println!("==================================================");
    Ok(())
}

// ── Helper functions for BOM seeding via raw SQL ─────────────────────

async fn find_product_id(db: &DatabaseConnection, name: &str) -> Option<i32> {
    let result = db
        .query_one(Statement::from_string(
            DbBackend::MySql,
            format!("SELECT id FROM products WHERE name = '{}' LIMIT 1", name.replace('\'', "''")),
        ))
        .await
        .ok()
        .flatten();
    result.and_then(|row| {
        row.try_get::<i32>("", "id").ok()
    })
}

async fn insert_bom_sql(
    db: &DatabaseConnection,
    product_id: i32,
    variant_id: Option<i32>,
    version: i32,
) -> Result<i32, Box<dyn std::error::Error>> {
    let variant_sql = variant_id.map_or("NULL".to_string(), |v| v.to_string());
    db.execute(Statement::from_string(DbBackend::MySql, format!(
        "INSERT INTO product_boms (product_id, product_variant_id, version, status, output_qty, notes, activated_at) \
         VALUES ({product_id}, {variant_sql}, {version}, 'ACTIVE', 1.0000, 'Seeded by initial setup', NOW())"
    ))).await?;
    let row = db.query_one(Statement::from_string(DbBackend::MySql, "SELECT LAST_INSERT_ID() as id".to_string())).await?.unwrap();
    let id: i64 = row.try_get::<i64>("", "id")?;
    Ok(id as i32)
}

async fn insert_bom_line_sql(
    db: &DatabaseConnection,
    bom_id: i32,
    raw_material_id: i32,
    component_type: &str,
    consumption_basis: &str,
    qty_per_output: &str,
    waste_pct: &str,
    is_required: bool,
    sort_order: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    db.execute(Statement::from_string(DbBackend::MySql, format!(
        "INSERT INTO product_bom_lines (bom_id, raw_material_id, component_type, consumption_basis, qty_per_output, waste_pct, is_required, sort_order) \
         VALUES ({bom_id}, {raw_material_id}, '{component_type}', '{consumption_basis}', {qty_per_output}, {waste_pct}, {}, {sort_order})",
        if is_required { "TRUE" } else { "FALSE" }
    ))).await?;
    Ok(())
}
