-- ============================================================================
-- MIGRATION: 0004_hapus_modul_bom.sql
-- Aplikasi: Percetakan Perdana (Rust/Actix + SeaORM | Next.js)
-- Tujuan   : Menghapus seluruh artefak modul BOM (Bill of Materials).
--            Kebutuhan bahan kini diinput manual oleh kasir saat checkout
--            (lihat migrations/0002_manual_materials.sql), sehingga tabel
--            dan kolom resep BOM tidak lagi dipakai oleh kode mana pun.
--
-- CATATAN PENTING:
--   * IDEMPOTEN: semua DROP memakai IF EXISTS.
--   * Jalankan SETELAH deploy backend versi yang tidak lagi membaca BOM.
--   * Data di tabel BOM hanya resep (bukan transaksi); tidak ada data
--     keuangan atau stok yang hilang karena migrasi ini.
--   * transaction_item_materials lama masih menyimpan bom_id NULL pada
--     baris historis; kolomnya di-drop di sini setelah kode tidak membacanya.
-- ============================================================================

-- 1. Buang kolom BOM pada snapshot bahan transaksi (harus sebelum tabel BOM
--    bila ada FK; di sini tidak ada FK dari kolom ini, tapi urutan tetap aman).
ALTER TABLE transaction_item_materials DROP COLUMN IF EXISTS bom_id;
ALTER TABLE transaction_item_materials DROP COLUMN IF EXISTS bom_line_id;
ALTER TABLE transaction_item_materials DROP COLUMN IF EXISTS bom_version;

-- 2. Buang tabel BOM (anak dulu, lalu induk).
DROP TABLE IF EXISTS addon_bom_lines;
DROP TABLE IF EXISTS product_bom_lines;
DROP TABLE IF EXISTS product_boms;
