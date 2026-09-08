-- ============================================================================
-- MIGRATION: 0006_fix_amplop_package_size.sql
-- Aplikasi: Percetakan Perdana (Rust/Actix + SeaORM | Next.js)
-- Tujuan   : Memperbaiki faktor konversi kemasan (box) bahan Amplop yang
--            terekam salah sebagai 500, padahal label varian master adalah
--            "Isi 100 / Box".
--
-- STATUS EKSEKUSI:
--   * Isi file ini kini JUGA dijalankan otomatis (idempoten) oleh
--     apps/backend/src/config.rs setiap aplikasi boot, sehingga database
--     mana pun yang masih menyimpan faktor 500 akan terkoreksi sendiri.
--   * File SQL ini dipertahankan sebagai dokumentasi & acuan manual
--     (mis. untuk DB produksi yang dikoreksi sebelum aplikasi diperbarui).
--
-- LATAR BELAKANG (BUG "restock 17 box -> stok fisik 8.500 pcs"):
--   * seed.rs lama menyalin pola kertas (rim = 500) ke baris Amplop:
--     package_size = 500 + material_uom_conversions box->pcs faktor 500.
--   * 0003_migrasi_data_estimasi.sql sebenarnya hendak menyetel 100, tetapi
--     guard `package_size IS NULL` tidak pernah terpenuhi karena seed.rs
--     sudah mengisi 500, sehingga koreksi itu tak pernah berlaku.
--   * Akibatnya:
--       - Restock per box mengalikan input dengan 500 (17 box -> 8.500 pcs,
--         seharusnya 1.700 pcs).
--       - Tabel inventaris menampilkan "≈ 17 box" untuk 8.500 pcs.
--
-- CATATAN PENTING:
--   * Perbaikan ini HANYA meluruskan faktor konversi ke depan (display
--     "≈ X box" dan restock per box). Sesuai desain aplikasi, konversi
--     satuan tidak pernah mengubah saldo stok, jadi saldo fisik yang sudah
--     terlanjur lebih/kurang TIDAK dikoreksi otomatis — lakukan stock opname
--     (lihat blok 3).
--   * IDEMPOTEN: aman dijalankan berulang; baris yang sudah diubah owner
--     lewat UI (faktor bukan 500) tidak akan tersentuh.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Kemasan box bahan Amplop: 1 box = 100 pcs (sesuai label "Isi 100 / Box")
-- ----------------------------------------------------------------------------
UPDATE raw_materials
SET package_size = 100
WHERE unit = 'pcs'
  AND package_unit = 'box'
  AND package_size = 500
  AND name LIKE 'Amplop%';

-- ----------------------------------------------------------------------------
-- 2. Konversi eksplisit box -> pcs yang salah faktor (dipakai endpoint mutasi
--    bila field `unit` dikirim; prioritasnya di atas package_size)
-- ----------------------------------------------------------------------------
UPDATE material_uom_conversions
SET factor = 100,
    notes = '1 box = 100 pcs amplop'
WHERE from_unit = 'box'
  AND to_unit = 'pcs'
  AND factor = 500
  AND raw_material_id IN (
      SELECT id FROM raw_materials WHERE name LIKE 'Amplop%'
  );

-- ----------------------------------------------------------------------------
-- 3. TEMPLATE KOREKSI SALDO (jalankan HANYA setelah opname fisik & persetujuan
--    owner). Contoh: restock N box yang terlanjur tercatat N x 500 pcs berarti
--    kelebihan N x 400 pcs. Koreksi lewat mutasi OUT agar histori mutasi dan
--    ledger tetap konsisten (bukan UPDATE langsung ke kolom stock):
-- ----------------------------------------------------------------------------
-- INSERT INTO raw_material_mutations (raw_material_id, mutation_type, qty, notes, created_at)
-- SELECT id, 'OUT', <kelebihan_qty>,
--        'Koreksi stok: faktor box salah 500 -> 100, hasil opname <tanggal>',
--        NOW()
-- FROM raw_materials
-- WHERE name LIKE 'Amplop%';
