-- DDL Database MySQL: perdana (Revisi 2 + Optimasi Indexing)

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_material_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    variant VARCHAR(100) DEFAULT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    -- `stock` adalah physical stock. Stok tersedia untuk order baru = stock - reserved_stock.
    stock DECIMAL(14, 4) NOT NULL DEFAULT 0,
    reserved_stock DECIMAL(14, 4) NOT NULL DEFAULT 0,
    min_stock_warning DECIMAL(14, 4) NOT NULL DEFAULT 0,
    standard_cost DECIMAL(14, 4) NOT NULL DEFAULT 0,
    roll_width DECIMAL(10, 4) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES raw_material_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS raw_material_mutations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    type ENUM('IN', 'OUT') NOT NULL,
    transaction_id INT DEFAULT NULL,
    qty DECIMAL(14, 4) NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    price_type ENUM('FIXED', 'RANGE', 'CUSTOM') NOT NULL DEFAULT 'FIXED',
    default_price DECIMAL(12, 2) DEFAULT 0.00,
    min_price DECIMAL(12, 2) DEFAULT 0.00,
    max_price DECIMAL(12, 2) DEFAULT 0.00,
    min_order INT DEFAULT 1,
    unit_name VARCHAR(50) DEFAULT 'pcs',
    has_variants BOOLEAN NOT NULL DEFAULT FALSE,
    raw_material_id INT DEFAULT NULL,
    material_amount DECIMAL(12, 4) DEFAULT 1.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(150) NOT NULL,
    price_type ENUM('FIXED', 'RANGE') NOT NULL DEFAULT 'FIXED',
    price DECIMAL(12, 2) DEFAULT 0.00,
    min_price DECIMAL(12, 2) DEFAULT 0.00,
    max_price DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    raw_material_id INT DEFAULT NULL,
    material_amount DECIMAL(12, 4) DEFAULT 1.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    price_type ENUM('FIXED', 'RANGE') NOT NULL DEFAULT 'FIXED',
    default_price DECIMAL(12, 2) DEFAULT 0.00,
    min_price DECIMAL(12, 2) DEFAULT 0.00,
    max_price DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    idempotency_key VARCHAR(100) DEFAULT NULL UNIQUE,
    customer_id INT DEFAULT NULL,
    customer_name VARCHAR(100) DEFAULT 'Umum',
    subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    pay_amount DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('PAID', 'DP', 'UNPAID') NOT NULL DEFAULT 'PAID',
    payment_method ENUM('CASH', 'QRIS', 'TRANSFER') NOT NULL DEFAULT 'CASH',
    settlement_payment_method ENUM('CASH', 'QRIS', 'TRANSFER') DEFAULT NULL,
    settlement_pay_amount DECIMAL(12, 2) DEFAULT NULL,
    settlement_at TIMESTAMP NULL DEFAULT NULL,
    order_status ENUM('ANTRIAN', 'PROSES', 'SELESAI', 'DIAMBIL', 'BATAL') NOT NULL DEFAULT 'ANTRIAN',
    estimated_done_at DATE DEFAULT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT,
    product_variant_id INT DEFAULT NULL,
    product_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(150) DEFAULT NULL,
    price DECIMAL(12, 2) NOT NULL,
    qty INT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    length DECIMAL(10, 4) DEFAULT NULL,
    width DECIMAL(10, 4) DEFAULT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_item_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_item_id INT NOT NULL,
    addon_id INT DEFAULT NULL,
    addon_name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_id) REFERENCES product_addons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category ENUM('BAHAN_BAKU', 'OPERASIONAL', 'MAINTENANCE', 'GAJI', 'LAINNYA') NOT NULL DEFAULT 'OPERASIONAL',
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('CASH', 'TRANSFER') NOT NULL DEFAULT 'CASH',
    notes TEXT DEFAULT NULL,
    expense_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(order_status, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date_cat ON expenses(expense_date, category);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_low_stock ON raw_materials(stock, min_stock_warning);

-- Performance Indexes (tambahan): mempercepat laporan rentang tanggal,
-- filter status pembayaran, rekap mutasi bahan, dan pencarian pelanggan.
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_created ON transactions(payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_mutations_material_created ON raw_material_mutations(raw_material_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Per-tanggal counter yang konsisten dengan backend `invoice_counter.rs`.
CREATE TABLE IF NOT EXISTS invoice_counter (
    date_key VARCHAR(12) PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

-- ============================================================================
-- PRODUCTION INVENTORY FOUNDATION
-- Semua saldo agregat di raw_materials diturunkan dari ledger immutable ini.
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_item_materials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_item_id INT NOT NULL,
    raw_material_id INT NOT NULL,
    material_lot_id INT DEFAULT NULL,
    required_width_m DECIMAL(10,4) DEFAULT NULL,
    allow_offcut BOOLEAN NOT NULL DEFAULT TRUE,
    material_name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    required_qty DECIMAL(14,4) NOT NULL,
    reserved_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
    consumed_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
    waste_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
    source_type VARCHAR(20) NOT NULL,
    consumption_basis VARCHAR(20) NOT NULL,
    addon_id INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tim_item (transaction_item_id),
    KEY idx_tim_material (raw_material_id),
    FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS material_lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    lot_code VARCHAR(100) NOT NULL,
    source_lot_id INT DEFAULT NULL,
    width_m DECIMAL(10,4) DEFAULT NULL,
    length_total DECIMAL(14,4) NOT NULL DEFAULT 0,
    length_remaining DECIMAL(14,4) NOT NULL DEFAULT 0,
    reserved_length DECIMAL(14,4) NOT NULL DEFAULT 0,
    is_offcut BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    unit_cost DECIMAL(14,4) NOT NULL DEFAULT 0,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_material_lot_code (raw_material_id, lot_code),
    KEY idx_material_lots_available (raw_material_id, status, is_offcut),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (source_lot_id) REFERENCES material_lots(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS stock_reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    transaction_item_material_id BIGINT NOT NULL,
    raw_material_id INT NOT NULL,
    material_lot_id INT DEFAULT NULL,
    qty DECIMAL(14,4) NOT NULL,
    required_width_m DECIMAL(10,4) DEFAULT NULL,
    allow_offcut BOOLEAN NOT NULL DEFAULT TRUE,
    state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL DEFAULT NULL,
    consumed_at TIMESTAMP NULL DEFAULT NULL,
    KEY idx_reservation_transaction_state (transaction_id, state),
    KEY idx_reservation_material_state (raw_material_id, state),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    FOREIGN KEY (transaction_item_material_id) REFERENCES transaction_item_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (material_lot_id) REFERENCES material_lots(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS inventory_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    transaction_id INT DEFAULT NULL,
    transaction_item_id INT DEFAULT NULL,
    transaction_item_material_id BIGINT DEFAULT NULL,
    material_lot_id INT DEFAULT NULL,
    entry_type VARCHAR(30) NOT NULL,
    qty DECIMAL(14,4) NOT NULL,
    physical_delta DECIMAL(14,4) NOT NULL DEFAULT 0,
    reserved_delta DECIMAL(14,4) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    reason_code VARCHAR(50) NOT NULL,
    notes TEXT DEFAULT NULL,
    actor_id INT DEFAULT NULL,
    idempotency_key VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inventory_ledger_idempotency (idempotency_key),
    KEY idx_inventory_ledger_material_created (raw_material_id, created_at),
    KEY idx_inventory_ledger_transaction (transaction_id, created_at),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_item_material_id) REFERENCES transaction_item_materials(id) ON DELETE SET NULL,
    FOREIGN KEY (material_lot_id) REFERENCES material_lots(id) ON DELETE SET NULL,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    reference_no VARCHAR(100) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_payments_transaction_created (transaction_id, created_at),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS production_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    notes TEXT DEFAULT NULL,
    actor_id INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_production_events_transaction_created (transaction_id, created_at),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS material_uom_conversions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    from_unit VARCHAR(30) NOT NULL,
    to_unit VARCHAR(30) NOT NULL,
    factor DECIMAL(14,6) NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_material_uom_conversion (raw_material_id, from_unit, to_unit),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT DEFAULT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    before_data LONGTEXT DEFAULT NULL,
    after_data LONGTEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_entity (entity_type, entity_id, created_at),
    KEY idx_audit_actor_created (actor_id, created_at),
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
