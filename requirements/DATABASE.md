-- DDL Database MySQL: perdana (Revisi 2)

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- INVENTORY / BAHAN MENTAH
-- ============================

CREATE TABLE IF NOT EXISTS raw_material_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    variant VARCHAR(100) DEFAULT NULL,     -- contoh: 'Merah/Pink', 'Ukuran 11', 'Cyan'
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

-- ============================
-- KATALOG PRODUK
-- ============================

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
    unit_name VARCHAR(50) DEFAULT 'pcs',   -- pcs, rim, meter, dll
    has_variants BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

-- BARU: varian produk (mis. Buku Yasin 128hlm/SoftCover, 176hlm/HardCover, dst)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(150) NOT NULL,      -- contoh: '176 Halaman HVS + Hard Cover'
    price_type ENUM('FIXED', 'RANGE') NOT NULL DEFAULT 'FIXED',
    price DECIMAL(12, 2) DEFAULT 0.00,       -- dipakai jika FIXED
    min_price DECIMAL(12, 2) DEFAULT 0.00,   -- dipakai jika RANGE
    max_price DECIMAL(12, 2) DEFAULT 0.00,   -- dipakai jika RANGE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- UBAH: add-on kini mendukung harga rentang (mis. Cutting +5k-15k)
CREATE TABLE IF NOT EXISTS product_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_type ENUM('FIXED', 'RANGE') NOT NULL DEFAULT 'FIXED',
    default_price DECIMAL(12, 2) DEFAULT 0.00,   -- dipakai jika FIXED
    min_price DECIMAL(12, 2) DEFAULT 0.00,       -- dipakai jika RANGE
    max_price DECIMAL(12, 2) DEFAULT 0.00,       -- dipakai jika RANGE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- PELANGGAN (BARU)
-- ============================

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- TRANSAKSI
-- ============================

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT DEFAULT NULL,               -- BARU: relasi ke pelanggan terdaftar
    customer_name VARCHAR(100) DEFAULT 'Umum',   -- tetap dipakai untuk pembeli tanpa data
    subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,  -- BARU
    total_amount DECIMAL(12, 2) NOT NULL,
    pay_amount DECIMAL(12, 2) NOT NULL,
    change_amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('PAID', 'DP', 'UNPAID') NOT NULL DEFAULT 'PAID',
    order_status ENUM('ANTRIAN', 'PROSES', 'SELESAI', 'DIAMBIL') NOT NULL DEFAULT 'ANTRIAN', -- BARU
    estimated_done_at DATE DEFAULT NULL,         -- BARU: estimasi tanggal selesai
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT,
    product_variant_id INT DEFAULT NULL,   -- BARU: opsional, jika produk pakai varian
    product_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(150) DEFAULT NULL, -- snapshot nama varian saat transaksi dibuat
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
    price DECIMAL(12, 2) NOT NULL,   -- harga final yang dipakai kasir (jika addon RANGE, kasir input manual dalam batas min-max)
    qty INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (transaction_item_id) REFERENCES transaction_items(id) ON DELETE CASCADE
);
