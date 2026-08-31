//! Additive runtime migration for installations that existed before the
//! production-inventory domain was introduced. Fresh installations use
//! `docker/mysql/init.sql`; this module only brings an existing database up to
//! the same contract without dropping business data.

use sea_orm::{ConnectionTrait, DatabaseConnection, DbErr};

pub async fn apply(db: &DatabaseConnection) -> Result<(), DbErr> {
    // These ALTER statements deliberately tolerate "duplicate column" errors.
    // MySQL/MariaDB versions differ in support for `IF NOT EXISTS` on columns.
    for statement in [
        "ALTER TABLE raw_materials ADD COLUMN reserved_stock DECIMAL(14,4) NOT NULL DEFAULT 0",
        "ALTER TABLE raw_materials ADD COLUMN standard_cost DECIMAL(14,4) NOT NULL DEFAULT 0",
        "ALTER TABLE raw_materials ADD COLUMN roll_width DECIMAL(10,4) NULL DEFAULT NULL",
        "ALTER TABLE raw_materials ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE product_addons ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE raw_materials MODIFY COLUMN stock DECIMAL(14,4) NOT NULL DEFAULT 0",
        "ALTER TABLE raw_materials MODIFY COLUMN min_stock_warning DECIMAL(14,4) NOT NULL DEFAULT 0",
        "ALTER TABLE raw_material_mutations MODIFY COLUMN qty DECIMAL(14,4) NOT NULL DEFAULT 0",
        "ALTER TABLE raw_material_mutations ADD COLUMN transaction_id INT NULL DEFAULT NULL",
        "ALTER TABLE transaction_items ADD COLUMN length DECIMAL(10,4) NULL DEFAULT NULL",
        "ALTER TABLE transaction_items ADD COLUMN width DECIMAL(10,4) NULL DEFAULT NULL",
        "ALTER TABLE transaction_item_materials ADD COLUMN required_width_m DECIMAL(10,4) NULL DEFAULT NULL",
        "ALTER TABLE transaction_item_materials ADD COLUMN allow_offcut BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE stock_reservations ADD COLUMN required_width_m DECIMAL(10,4) NULL DEFAULT NULL",
        "ALTER TABLE stock_reservations ADD COLUMN allow_offcut BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE transactions ADD COLUMN payment_method ENUM('CASH','QRIS','TRANSFER') NOT NULL DEFAULT 'CASH'",
        "ALTER TABLE transactions ADD COLUMN settlement_payment_method ENUM('CASH','QRIS','TRANSFER') NULL DEFAULT NULL",
        "ALTER TABLE transactions ADD COLUMN settlement_pay_amount DECIMAL(12,2) NULL DEFAULT NULL",
        "ALTER TABLE transactions ADD COLUMN settlement_at TIMESTAMP NULL DEFAULT NULL",
        "ALTER TABLE transactions ADD COLUMN idempotency_key VARCHAR(100) NULL DEFAULT NULL",
        "ALTER TABLE transaction_item_addons ADD COLUMN addon_id INT NULL DEFAULT NULL",
        "ALTER TABLE transactions MODIFY COLUMN order_status ENUM('ANTRIAN','PROSES','SELESAI','DIAMBIL','BATAL') NOT NULL DEFAULT 'ANTRIAN'",
        // Compatibility with the pre-audit invoice_counter(date_str, seq)
        // contract. Existing rows are copied below; the unique key makes the
        // atomic INSERT IGNORE + UPDATE counter safe after upgrade.
        "ALTER TABLE invoice_counter ADD COLUMN date_key VARCHAR(12) NULL",
        "ALTER TABLE invoice_counter ADD COLUMN last_seq INT NULL DEFAULT 0",
    ] {
        let _ = db.execute_unprepared(statement).await;
    }

    // Both statements are intentionally best-effort: on a fresh schema the
    // legacy columns do not exist, while on an old schema they preserve the
    // last used sequence per date.
    let _ = db
        .execute_unprepared("UPDATE invoice_counter SET date_key = date_str WHERE date_key IS NULL")
        .await;
    let _ = db
        .execute_unprepared("UPDATE invoice_counter SET last_seq = seq WHERE last_seq IS NULL OR last_seq = 0")
        .await;

    for statement in DOMAIN_TABLES {
        db.execute_unprepared(statement).await?;
    }

    for statement in [
        "CREATE INDEX idx_raw_materials_available ON raw_materials(is_active, stock, reserved_stock)",
        "CREATE INDEX idx_transactions_status_date ON transactions(order_status, payment_status, created_at)",
        "CREATE INDEX idx_product_addons_active ON product_addons(is_active, category_id)",
        "CREATE UNIQUE INDEX uq_transactions_idempotency_key ON transactions(idempotency_key)",
        "CREATE UNIQUE INDEX uq_invoice_counter_date_key ON invoice_counter(date_key)",
    ] {
        let _ = db.execute_unprepared(statement).await;
    }

    Ok(())
}

const DOMAIN_TABLES: &[&str] = &[
    "CREATE TABLE IF NOT EXISTS invoice_counter (date_key VARCHAR(12) PRIMARY KEY, last_seq INT NOT NULL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS material_lots (
        id INT AUTO_INCREMENT PRIMARY KEY, raw_material_id INT NOT NULL, lot_code VARCHAR(100) NOT NULL,
        source_lot_id INT NULL, width_m DECIMAL(10,4) NULL, length_total DECIMAL(14,4) NOT NULL DEFAULT 0,
        length_remaining DECIMAL(14,4) NOT NULL DEFAULT 0, reserved_length DECIMAL(14,4) NOT NULL DEFAULT 0,
        is_offcut BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        unit_cost DECIMAL(14,4) NOT NULL DEFAULT 0, received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_material_lot_code (raw_material_id, lot_code),
        KEY idx_material_lots_available (raw_material_id, status, is_offcut),
        CONSTRAINT fk_material_lots_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
        CONSTRAINT fk_material_lots_source FOREIGN KEY (source_lot_id) REFERENCES material_lots(id) ON DELETE RESTRICT
    )",
    "CREATE TABLE IF NOT EXISTS transaction_item_materials (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, transaction_item_id INT NOT NULL, raw_material_id INT NOT NULL,
        material_lot_id INT NULL, required_width_m DECIMAL(10,4) NULL, allow_offcut BOOLEAN NOT NULL DEFAULT TRUE, material_name VARCHAR(150) NOT NULL, unit VARCHAR(30) NOT NULL,
        required_qty DECIMAL(14,4) NOT NULL, reserved_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
        consumed_qty DECIMAL(14,4) NOT NULL DEFAULT 0, waste_qty DECIMAL(14,4) NOT NULL DEFAULT 0,
        source_type VARCHAR(20) NOT NULL, consumption_basis VARCHAR(20) NOT NULL,
        addon_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_tim_item (transaction_item_id), KEY idx_tim_material (raw_material_id),
        CONSTRAINT fk_tim_item FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE RESTRICT,
        CONSTRAINT fk_tim_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
    )",
    "CREATE TABLE IF NOT EXISTS stock_reservations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, transaction_id INT NOT NULL, transaction_item_material_id BIGINT NOT NULL,
        raw_material_id INT NOT NULL, material_lot_id INT NULL, qty DECIMAL(14,4) NOT NULL,
        required_width_m DECIMAL(10,4) NULL, allow_offcut BOOLEAN NOT NULL DEFAULT TRUE,
        state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        released_at TIMESTAMP NULL, consumed_at TIMESTAMP NULL,
        KEY idx_reservation_transaction_state (transaction_id, state), KEY idx_reservation_material_state (raw_material_id, state),
        CONSTRAINT fk_reservation_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
        CONSTRAINT fk_reservation_item_material FOREIGN KEY (transaction_item_material_id) REFERENCES transaction_item_materials(id) ON DELETE RESTRICT,
        CONSTRAINT fk_reservation_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
        CONSTRAINT fk_reservation_lot FOREIGN KEY (material_lot_id) REFERENCES material_lots(id) ON DELETE RESTRICT
    )",
    "CREATE TABLE IF NOT EXISTS inventory_ledger (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, raw_material_id INT NOT NULL, transaction_id INT NULL,
        transaction_item_id INT NULL, transaction_item_material_id BIGINT NULL, material_lot_id INT NULL,
        entry_type VARCHAR(30) NOT NULL, qty DECIMAL(14,4) NOT NULL,
        physical_delta DECIMAL(14,4) NOT NULL DEFAULT 0, reserved_delta DECIMAL(14,4) NOT NULL DEFAULT 0,
        unit VARCHAR(30) NOT NULL, reason_code VARCHAR(50) NOT NULL, notes TEXT NULL,
        actor_id INT NULL, idempotency_key VARCHAR(100) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_inventory_ledger_idempotency (idempotency_key),
        KEY idx_inventory_ledger_material_created (raw_material_id, created_at), KEY idx_inventory_ledger_transaction (transaction_id, created_at),
        CONSTRAINT fk_ledger_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
        CONSTRAINT fk_ledger_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
        CONSTRAINT fk_ledger_item FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE SET NULL,
        CONSTRAINT fk_ledger_item_material FOREIGN KEY (transaction_item_material_id) REFERENCES transaction_item_materials(id) ON DELETE SET NULL,
        CONSTRAINT fk_ledger_lot FOREIGN KEY (material_lot_id) REFERENCES material_lots(id) ON DELETE SET NULL,
        CONSTRAINT fk_ledger_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )",
    "CREATE TABLE IF NOT EXISTS payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, transaction_id INT NOT NULL, payment_type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL, payment_method VARCHAR(20) NOT NULL, reference_no VARCHAR(100) NULL,
        notes TEXT NULL, created_by INT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_payments_transaction_created (transaction_id, created_at),
        CONSTRAINT fk_payments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
        CONSTRAINT fk_payments_actor FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )",
    "CREATE TABLE IF NOT EXISTS production_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, transaction_id INT NOT NULL, event_type VARCHAR(30) NOT NULL,
        notes TEXT NULL, actor_id INT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_production_events_transaction_created (transaction_id, created_at),
        CONSTRAINT fk_production_event_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
        CONSTRAINT fk_production_event_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )",
    "CREATE TABLE IF NOT EXISTS material_uom_conversions (
        id INT AUTO_INCREMENT PRIMARY KEY, raw_material_id INT NOT NULL, from_unit VARCHAR(30) NOT NULL,
        to_unit VARCHAR(30) NOT NULL, factor DECIMAL(14,6) NOT NULL, notes VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_material_uom_conversion (raw_material_id, from_unit, to_unit),
        CONSTRAINT fk_uom_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT
    )",
    "CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id INT NULL, action VARCHAR(60) NOT NULL,
        entity_type VARCHAR(60) NOT NULL, entity_id VARCHAR(100) NOT NULL, before_data LONGTEXT NULL,
        after_data LONGTEXT NULL, notes TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_audit_entity (entity_type, entity_id, created_at), KEY idx_audit_actor_created (actor_id, created_at),
        CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )",
];
