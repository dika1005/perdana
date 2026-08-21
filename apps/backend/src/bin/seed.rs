use std::env;
use bcrypt::{DEFAULT_COST, hash};
use dotenvy::dotenv;
use entity::enums::{PriceType, RangePriceType, UserRole};
use entity::{
    customers, product_addons, product_categories, products,
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

    println!("Connecting to database: {}", database_url);
    let db: DatabaseConnection = Database::connect(&database_url).await?;

    println!("🧹 Membersihkan data lama...");
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
    println!("  -> Owner: superadmin (Password: {})", superadmin_password);

    let _u_kasir1 = users::ActiveModel {
        name: Set("Budi Kasir Pagi".to_string()),
        username: Set("kasir_budi".to_string()),
        password_hash: Set(cashier_hash.clone()),
        role: Set(UserRole::Admin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Kasir 1: kasir_budi (Password: password123)");

    let _u_kasir2 = users::ActiveModel {
        name: Set("Siti Kasir Siang".to_string()),
        username: Set("kasir_siti".to_string()),
        password_hash: Set(cashier_hash.clone()),
        role: Set(UserRole::Admin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Kasir 2: kasir_siti (Password: password123)");

    let _u_kasir3 = users::ActiveModel {
        name: Set("Rian Operator Malam".to_string()),
        username: Set("kasir_rian".to_string()),
        password_hash: Set(cashier_hash),
        role: Set(UserRole::Admin),
        is_active: Set(true),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> Kasir 3: kasir_rian (Password: password123)");

    println!("\n🌱 Menanam Kategori Produk (4 Kategori)...");
    let cat_banner = product_categories::ActiveModel {
        name: Set("Banner & Spanduk".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_stiker = product_categories::ActiveModel {
        name: Set("Stiker & Label Kemasan".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_undangan = product_categories::ActiveModel {
        name: Set("Undangan & Kartu Nama".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_brosur = product_categories::ActiveModel {
        name: Set("Brosur & Dokumen Promosi".to_string()),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> 4 Kategori berhasil ditambahkan.");

    println!("\n🌱 Menanam Produk (2 Produk per Kategori)...");

    // Cat 1: Banner & Spanduk
    products::ActiveModel {
        category_id: Set(Some(cat_banner.id)),
        name: Set("Spanduk Flexi 280gr (Outdoor)".to_string()),
        price_type: Set(PriceType::Custom),
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
        name: Set("X-Banner 60x160cm (Indoor + Rangka)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(75000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("set".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // Cat 2: Stiker & Label
    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        name: Set("Stiker Chromo A3+ (Kiss Cut)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(12000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(5)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_stiker.id)),
        name: Set("Stiker Vinyl Waterproof A3+ (Die Cut)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(18000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(5)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // Cat 3: Undangan & Kartu Nama
    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Kartu Nama 2 Sisi (Box isi 100)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(35000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(1)),
        unit_name: Set(Some("box".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_undangan.id)),
        name: Set("Undangan Pernikahan Softcover".to_string()),
        price_type: Set(PriceType::Range),
        default_price: Set(Decimal::from(3500)),
        min_price: Set(Decimal::from(2500)),
        max_price: Set(Decimal::from(6000)),
        min_order: Set(Some(100)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    // Cat 4: Brosur & Dokumen
    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        name: Set("Brosur A4 Full Color (Art Paper 150gr)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(1500)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(50)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;

    products::ActiveModel {
        category_id: Set(Some(cat_brosur.id)),
        name: Set("Poster A3+ High Res (Art Carton 260gr)".to_string()),
        price_type: Set(PriceType::Fixed),
        default_price: Set(Decimal::from(8000)),
        min_price: Set(Decimal::ZERO),
        max_price: Set(Decimal::ZERO),
        min_order: Set(Some(2)),
        unit_name: Set(Some("lembar".to_string())),
        has_variants: Set(false),
        ..Default::default()
    }.insert(&db).await?;
    println!("  -> 8 Produk berhasil ditambahkan (2 per kategori).");

    println!("\n🌱 Menanam Add-ons / Finishing...");
    let addons = vec![
        ("Laminasi Doff A3+", Decimal::from(3000)),
        ("Laminasi Glossy A3+", Decimal::from(3000)),
        ("Mata Ayam / Ring Banner", Decimal::from(1000)),
        ("Potong Sudut Bulat (Round Corner)", Decimal::from(5000)),
    ];
    for (name, price) in addons {
        product_addons::ActiveModel {
            name: Set(name.to_string()),
            price_type: Set(RangePriceType::Fixed),
            default_price: Set(price),
            min_price: Set(Decimal::ZERO),
            max_price: Set(Decimal::ZERO),
            ..Default::default()
        }.insert(&db).await?;
    }
    println!("  -> 4 Add-on / Finishing berhasil ditambahkan.");

    println!("\n🌱 Menanam Pelanggan (5 Pelanggan Nyata)...");
    let cust_list = vec![
        ("PT. Sinar Maju Bersama", Some("0812-8899-7711"), Some("Jl. Sudirman No. 45, Jakarta")),
        ("Warung Kopi Nusantara", Some("0857-1234-5678"), Some("Jl. Melati No. 12, Bandung")),
        ("Haji Ahmad Subari", Some("0813-9876-5432"), Some("Perumahan Griya Indah Blok B3")),
        ("Dian Wedding Organizer", Some("0821-4567-8901"), Some("Jl. Mawar No. 8, Surabaya")),
        ("Klinik Sehat Keluarga", Some("0878-3344-5566"), Some("Jl. Ahmad Yani No. 102")),
    ];
    for (name, phone, address) in cust_list {
        customers::ActiveModel {
            name: Set(name.to_string()),
            phone: Set(phone.map(|s| s.to_string())),
            address: Set(address.map(|s| s.to_string())),
            ..Default::default()
        }.insert(&db).await?;
    }
    println!("  -> 5 Pelanggan berhasil ditambahkan.");

    println!("\n🌱 Menanam Inventaris Bahan Baku...");
    let cat_kertas = raw_material_categories::ActiveModel {
        name: Set("Kertas & Karton".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_banner_mat = raw_material_categories::ActiveModel {
        name: Set("Bahan Banner & Vinyl".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let cat_tinta = raw_material_categories::ActiveModel {
        name: Set("Tinta & Toner".to_string()),
        ..Default::default()
    }.insert(&db).await?;

    let raw_list = vec![
        ("Art Paper 150gr", Some("A3+"), "lembar", 500, 100, cat_kertas.id),
        ("Art Carton 260gr", Some("A3+"), "lembar", 400, 80, cat_kertas.id),
        ("Flexi 280gr", Some("Roll 3.2m x 50m"), "roll", 10, 2, cat_banner_mat.id),
        ("Stiker Vinyl Glossy", Some("Roll 1.05m x 50m"), "roll", 8, 2, cat_banner_mat.id),
        ("Tinta Solvent Cyan", Some("Botol 1L"), "liter", 5, 2, cat_tinta.id),
    ];
    for (name, variant, unit, stock, min_w, c_id) in raw_list {
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
    println!("  -> 3 Kategori Bahan & 5 Bahan Baku berhasil ditambahkan.");

    println!("\n🎉 SEEDING SELESAI DENGAN SUKSES!");
    Ok(())
}
