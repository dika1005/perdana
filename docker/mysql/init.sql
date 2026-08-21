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
    stock INT NOT NULL DEFAULT 0,
    min_stock_warning INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES raw_material_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS raw_material_mutations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    raw_material_id INT NOT NULL,
    type ENUM('IN', 'OUT') NOT NULL,
    qty INT NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
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
    raw_material_id INT DEFAULT NULL,
    material_amount DECIMAL(12, 4) DEFAULT 1.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_type ENUM('FIXED', 'RANGE') NOT NULL DEFAULT 'FIXED',
    default_price DECIMAL(12, 2) DEFAULT 0.00,
    min_price DECIMAL(12, 2) DEFAULT 0.00,
    max_price DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    customer_id INT DEFAULT NULL,
    customer_name VARCHAR(100) DEFAULT 'Umum',
    subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    pay_amount DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('PAID', 'DP', 'UNPAID') NOT NULL DEFAULT 'PAID',
    order_status ENUM('ANTRIAN', 'PROSES', 'SELESAI', 'DIAMBIL') NOT NULL DEFAULT 'ANTRIAN',
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
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_item_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_item_id INT NOT NULL,
    addon_name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE CASCADE
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
