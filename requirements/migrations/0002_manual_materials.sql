-- ============================================================================
-- MIGRATION: 0002_manual_materials.sql
-- Aplikasi: Percetakan Perdana (Rust/Actix + SeaORM | Next.js)
-- Tujuan   : Mendukung input bahan manual (tanpa BOM) saat checkout:
--              1. raw_materials.package_unit / package_size (konversi kemasan)
--              2. products.uses_material (wajib isi bahan saat checkout)
--            + template migrasi data satuan dasar (opsional, setelah opname).
--
-- CATATAN PENTING:
--   * Bagian DDL idempoten dan JUGA dijalankan otomatis oleh backend di
--     `config.rs::connect_db` (safety net). File ini source of truth review.
--   * Bagian MIGRASI DATA (blok 3) bersifat TEMPLATE: jalankan HANYA setelah
--     opname fisik dan konfirmasi owner; nilai package_size bertanda estimasi
--     dapat diubah kemudian lewat UI admin.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. raw_materials: kemasan beli untuk penerimaan & display (satuan dasar tetap di `unit`)
-- ----------------------------------------------------------------------------
ALTER TABLE raw_materials
    ADD COLUMN package_unit VARCHAR(50) NULL DEFAULT NULL AFTER unit;
ALTER TABLE raw_materials
    ADD COLUMN package_size DECIMAL(12,4) NULL DEFAULT NULL AFTER package_unit;

-- ----------------------------------------------------------------------------
-- 2. products: flag produk yang wajib diisi bahan manual saat checkout
-- ----------------------------------------------------------------------------
ALTER TABLE products
    ADD COLUMN uses_material TINYINT(1) NOT NULL DEFAULT 0 AFTER has_variants;

-- ----------------------------------------------------------------------------
-- 3. TEMPLATE MIGRASI DATA (jalankan manual setelah opname & konfirmasi owner)
-- ----------------------------------------------------------------------------
-- 3a. Kertas: stok rim -> lembar (1 rim = 500 lembar).
--     Sesuaikan WHERE dengan nama bahan di master data Anda.
-- UPDATE raw_materials
-- SET unit = 'lembar', package_unit = 'rim', package_size = 500,
--     stock = stock * 500,
--     reserved_stock = reserved_stock * 500,
--     min_stock_warning = min_stock_warning * 500
-- WHERE unit = 'rim';

-- 3b. Tinta: botol -> ml (estimasi 1 botol = 1000 ml; owner memilih ml).
-- UPDATE raw_materials
-- SET unit = 'ml', package_unit = 'botol', package_size = 1000,
--     stock = stock * 1000,
--     reserved_stock = reserved_stock * 1000,
--     min_stock_warning = min_stock_warning * 1000
-- WHERE name LIKE 'TINTA%' OR name LIKE 'BAHAN TINTA%';

-- 3c. Amplop & plastik undangan: pcs dengan kemasan box/dus (ESTIMASI,
--     dapat diganti owner lewat UI admin).
-- UPDATE raw_materials SET package_unit = 'box', package_size = 500 WHERE name LIKE 'AMPLOP%';
-- UPDATE raw_materials SET package_unit = 'dus', package_size = 100 WHERE name LIKE 'PLASTIK%';

-- 3d. Bahan meteran yang ingin distokkan (flexi/kain): buat master baru
--     dengan unit=meter, package rol=50 (ESTIMASI), stok awal 0 lalu opname.
-- INSERT INTO raw_materials (category_id, name, variant, unit, package_unit, package_size,
--     stock, reserved_stock, min_stock_warning, standard_cost, roll_width, is_active, created_at, updated_at)
-- VALUES
-- (NULL, 'FLEXI CHINA', '280gr', 'meter', 'rol', 50, 0, 0, 5, 0, NULL, 1, NOW(), NOW()),
-- (NULL, 'KAIN SPANDUK', NULL, 'meter', 'rol', 50, 0, 0, 5, 0, NULL, 1, NOW(), NOW()),
-- (NULL, 'KAIN UMBUL-UMBUL', NULL, 'meter', 'rol', 50, 0, 0, 5, 0, NULL, 1, NOW(), NOW());

-- 3e. Flag uses_material untuk produk fisik (sesuaikan pola nama).
-- UPDATE products SET uses_material = 1 WHERE name LIKE 'Nota%' OR name LIKE 'Brosur%'
--     OR name LIKE 'Kop Surat%' OR name LIKE 'Sertifikat%' OR name LIKE 'Amplop%'
--     OR name LIKE 'Undangan%' OR name LIKE 'Stempel%' OR name LIKE 'Sticker%'
--     OR name LIKE 'Spanduk%' OR name LIKE 'Umbul%';
