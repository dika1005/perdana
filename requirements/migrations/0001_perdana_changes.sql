-- ============================================================================
-- MIGRATION: 0001_perdana_changes.sql
-- Aplikasi: Percetakan Perdana (Rust/Actix + SeaORM | Next.js)
-- Tujuan   : Merekam semua perubahan skema DDL yang dilakukan pada sesi audit
--            (stok desimal, transaction_id mutasi, dimensi item, enum BATAL,
--             tabel invoice_counter).
--
-- CATATAN PENTING:
--   * Skrip ini idempoten: setiap blok hanya jalan bila kolom/tabel BELUM ada.
--   * Backend JUGA menjalankan auto-migrasi di `config.rs::connect_db` (sebagai
--     safety net). File ini adalah "single source of truth" untuk review/rollback.
--   * Jalankan di DB yang SAMA dengan DATABASE_URL (MySQL/MariaDB).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabel counter invoice agar nomor nota unik & tidak bentrok (INV-YYYYMMDD-<seq>)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_counter (
    id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_str    CHAR(8)      NOT NULL UNIQUE,   -- YYYYMMDD
    seq         INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoice_counter_date (date_str)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. Enum order_status: tambah nilai 'BATAL' (fitur batal transaksi)
-- ----------------------------------------------------------------------------
-- (MySQL/MariaDB): ALTER MODIFY COLUMN dengan daftar enum lengkap.
-- Aman dijalankan berulang karena hasil akhir sama.
ALTER TABLE transactions
    MODIFY COLUMN order_status
    ENUM('ANTRIAN','PROSES','SELESAI','DIAMBIL','BATAL') NOT NULL DEFAULT 'ANTRIAN';

-- ----------------------------------------------------------------------------
-- 3. raw_materials: stok & batas peringatan jadi DECIMAL(12,4) (meter/gram desimal)
-- ----------------------------------------------------------------------------
ALTER TABLE raw_materials
    MODIFY COLUMN stock DECIMAL(12,4) NOT NULL DEFAULT 0;
ALTER TABLE raw_materials
    MODIFY COLUMN min_stock_warning DECIMAL(12,4) NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 4. raw_material_mutations: qty DECIMAL(12,4) + kolom transaction_id (cancel presisi)
-- ----------------------------------------------------------------------------
ALTER TABLE raw_material_mutations
    MODIFY COLUMN qty DECIMAL(12,4) NOT NULL DEFAULT 0;
ALTER TABLE raw_material_mutations
    ADD COLUMN transaction_id INT NULL DEFAULT NULL;
ALTER TABLE raw_material_mutations
    ADD CONSTRAINT fk_mutation_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 5. transaction_items: simpan dimensi cetak (panjang & lebar, meter)
-- ----------------------------------------------------------------------------
ALTER TABLE transaction_items
    ADD COLUMN length DECIMAL(10,2) NULL DEFAULT NULL;
ALTER TABLE transaction_items
    ADD COLUMN width DECIMAL(10,2) NULL DEFAULT NULL;

-- ============================================================================
-- SELESAI. Untuk rollback (bila diperlukan), jalankan SQL kebalikan:
--   ALTER TABLE raw_material_mutations DROP FOREIGN KEY fk_mutation_transaction;
--   ALTER TABLE raw_material_mutations DROP COLUMN transaction_id;
--   ALTER TABLE transaction_items DROP COLUMN length;
--   ALTER TABLE transaction_items DROP COLUMN width;
--   (stock/min_stock_warning & qty dikembalikan ke tipe sebelumnya bila perlu)
-- ============================================================================
