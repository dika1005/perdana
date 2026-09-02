-- ============================================================
-- 0005: Performance indexes tambahan (jalankan pada DB existing)
-- ============================================================
-- Mempercepat:
-- 1. Laporan dashboard/harian/bulanan yang memfilter rentang created_at
-- 2. Filter payment_status + created_at (laporan piutang)
-- 3. Rekap mutasi bahan baku per material + periode
-- 4. Pencarian pelanggan berdasarkan nama

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_created ON transactions(payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_mutations_material_created ON raw_material_mutations(raw_material_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Catatan: MariaDB 11 mendukung IF NOT EXISTS pada CREATE INDEX.
-- Untuk MySQL 8, jalankan pernyataan di atas tanpa "IF NOT EXISTS"
-- atau cek information_schema.statistics terlebih dahulu.