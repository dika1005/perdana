-- ============================================================================
-- MIGRATION: 0003_migrasi_data_estimasi.sql
-- Aplikasi: Percetakan Perdana (Rust/Actix + SeaORM | Next.js)
-- Tujuan   : Mengisi master data untuk fitur input bahan manual, berbasis
--            data riil DB lokal (dump 2026-08-30) dengan NILAI ESTIMASI yang
--            sudah disetujui owner dan dapat diubah kemudian lewat UI admin.
--
-- CATATAN PENTING:
--   * IDEMPOTEN: aman dijalankan berulang (guard package_size IS NULL /
--     unit lama / uses_material=0).
--   * Stok kertas/amplop/plastik/flexi SUDAH dalam satuan dasar (lembar/pcs/
--     meter) di DB, sehingga TIDAK ada perkalian stok — hanya pengisian
--     package_unit/package_size untuk konversi penerimaan & display.
--   * Satu-satunya konversi angka: TINTA botol -> ml (x1000), keputusan owner.
--   * Jalankan setelah DDL 0002. Nilai estimasi (box=500, dus=100, rol=50)
--     dapat diganti owner kapan pun via halaman Inventaris.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Kemasan beli per kelompok bahan (display "≈ 8 rim + 200 lembar" & restock)
-- ----------------------------------------------------------------------------

-- 1a. Kertas: pembelian per rim (1 rim = 500 lembar)
UPDATE raw_materials
SET package_unit = 'rim', package_size = 500
WHERE unit = 'lembar'
  AND package_size IS NULL
  AND (name LIKE 'Kertas%' OR name LIKE 'Ciwi%' OR name LIKE 'HVS%' OR name LIKE 'NCR%');

-- 1b. Amplop: pembelian per box (1 box = 100 pcs, sesuai catatan master "Isi 100 / Box")
UPDATE raw_materials
SET package_unit = 'box', package_size = 100
WHERE unit = 'pcs'
  AND package_size IS NULL
  AND name LIKE 'Amplop%';

-- 1c. Plastik undangan: pembelian per dus (ESTIMASI 1 dus = 100 pcs)
UPDATE raw_materials
SET package_unit = 'dus', package_size = 100
WHERE unit = 'pcs'
  AND package_size IS NULL
  AND name LIKE 'Plastik%';

-- 1d. Bahan meteran (flexi/kain/stiker roll): pembelian per rol (ESTIMASI 50 m)
UPDATE raw_materials
SET package_unit = 'rol', package_size = 50
WHERE unit = 'meter'
  AND package_size IS NULL;

-- ----------------------------------------------------------------------------
-- 2. Tinta: konversi botol -> ml (keputusan owner), 1 botol = 1000 ml
--    (hanya master tinta riil; stok & batas peringatan ikut dikonversi)
-- ----------------------------------------------------------------------------
UPDATE raw_materials
SET unit = 'ml',
    package_unit = 'botol',
    package_size = 1000,
    stock = stock * 1000,
    reserved_stock = reserved_stock * 1000,
    min_stock_warning = min_stock_warning * 1000
WHERE unit = 'botol'
  AND name LIKE 'Bahan Tinta%';

-- ----------------------------------------------------------------------------
-- 3. Flag uses_material: produk yang produksinya memakai bahan stok
--    (operator WAJIB mengisi bahan saat checkout)
-- ----------------------------------------------------------------------------
UPDATE products
SET uses_material = 1
WHERE uses_material = 0
  AND name IN (
    'Spanduk /meter',
    'Spanduk Kain /meter',
    'Bendera / Umbul-umbul /meter',
    'Sticker (A3+)',
    'Sticker (Meter)',
    'Sticker Cutting',
    'Stempel Flash',
    'Stempel Kayu',
    'Undangan',
    'Undangan Blangko',
    'Amplop Polos',
    'Amplop Custom',
    'Nota / Faktur (HVS 1 Warna 1 Ply) 1 Rim',
    'Nota / Faktur (NCR 1 Warna 2 Ply) 1 Rim',
    'Nota / Faktur (NCR 1 Warna 3 Ply) 1 Rim',
    'Nota / Faktur (HVS Full Colour) 1 Rim',
    'Nota / Faktur (NCR Full Colour 2 Ply) 1 Rim',
    'Nota / Faktur (NCR Full Colour 3 Ply) 1 Rim',
    'Kop Surat (HVS 1 Warna) 1 Rim',
    'Kop Surat (HVS Full Colour) 1 Rim',
    'Brosur (Art Paper Full Colour) 1 Rim',
    'Brosur (Art Paper 1 Warna) 1 Rim',
    'Brosur (HVS Full Colour) 1 Rim',
    'Brosur (HVS 1 Warna) 1 Rim',
    'Sertifikat /rim'
  );

-- ----------------------------------------------------------------------------
-- 4. Produk barang jadi / jasa tetap tanpa bahan (default 0, tidak diubah):
--    Buku Yasin, Qur'an, Map/Sampul, Kalender, ID Card, Name Tag,
--    Gantungan Kunci, Box Makanan, Paper Bag, Raport, Note/Year Book,
--    Piagam/Medali, X/Roll Banner + Stand, Undangan Digital, Dll./Jasa.
-- ============================================================================
