use chrono::Utc;
use entity::prelude::*;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::error::AppError;

pub async fn export_sql_dump(db: &DatabaseConnection) -> Result<String, AppError> {
    let now = Utc::now();
    let mut sql = String::new();

    sql.push_str(&format!(
        "-- ========================================================\n\
         -- PERDANA PRINTING & POS - DATABASE BACKUP DUMP\n\
         -- Tanggal Ekspor : {}\n\
         -- Format         : MySQL / MariaDB SQL Insert Statements\n\
         -- ========================================================\n\n\
         SET FOREIGN_KEY_CHECKS = 0;\n\n",
        now.to_rfc3339()
    ));

    // 1. Users
    let users_list = User::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: users ({} rows)\n", users_list.len()));
    for u in users_list {
        sql.push_str(&format!(
            "INSERT INTO users (id, name, username, password_hash, role, is_active, created_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role);\n",
            u.id,
            sql_str(&u.name),
            sql_str(&u.username),
            sql_str(&u.password_hash),
            sql_str(u.role.as_str()),
            if u.is_active { 1 } else { 0 },
            sql_ts(&u.created_at),
        ));
    }
    sql.push('\n');

    // 2. Product Categories
    let prod_cats = ProductCategory::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: product_categories ({} rows)\n", prod_cats.len()));
    for c in prod_cats {
        sql.push_str(&format!(
            "INSERT INTO product_categories (id, name, created_at) \
             VALUES ({}, {}, {}) \
             ON DUPLICATE KEY UPDATE name=VALUES(name);\n",
            c.id,
            sql_str(&c.name),
            sql_ts(&c.created_at)
        ));
    }
    sql.push('\n');

    // 3. Raw Material Categories
    let raw_cats = RawMaterialCategory::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: raw_material_categories ({} rows)\n", raw_cats.len()));
    for c in raw_cats {
        sql.push_str(&format!(
            "INSERT INTO raw_material_categories (id, name, created_at) \
             VALUES ({}, {}, {}) \
             ON DUPLICATE KEY UPDATE name=VALUES(name);\n",
            c.id,
            sql_str(&c.name),
            sql_ts(&c.created_at)
        ));
    }
    sql.push('\n');

    // 4. Raw Materials
    let raw_mats = RawMaterial::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: raw_materials ({} rows)\n", raw_mats.len()));
    for m in raw_mats {
        sql.push_str(&format!(
            "INSERT INTO raw_materials (id, category_id, name, variant, unit, stock, min_stock_warning, created_at, updated_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE stock=VALUES(stock), name=VALUES(name);\n",
            m.id,
            sql_opt_num(m.category_id),
            sql_str(&m.name),
            sql_opt_str(m.variant.as_deref()),
            sql_str(&m.unit),
            m.stock,
            m.min_stock_warning,
            sql_ts(&m.created_at),
            sql_ts(&m.updated_at)
        ));
    }
    sql.push('\n');

    // 5. Products
    let prods = Product::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: products ({} rows)\n", prods.len()));
    for p in prods {
        sql.push_str(&format!(
            "INSERT INTO products (id, category_id, name, price_type, default_price, min_price, max_price, min_order, unit_name, has_variants, raw_material_id, material_amount, created_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE name=VALUES(name), default_price=VALUES(default_price);\n",
            p.id,
            sql_opt_num(p.category_id),
            sql_str(&p.name),
            sql_str(&format!("{:?}", p.price_type).to_uppercase()),
            p.default_price,
            p.min_price,
            p.max_price,
            sql_opt_num(p.min_order),
            sql_opt_str(p.unit_name.as_deref()),
            if p.has_variants { 1 } else { 0 },
            sql_opt_num(p.raw_material_id),
            p.material_amount.map(|d| d.to_string()).unwrap_or_else(|| "1.0000".to_string()),
            sql_ts(&p.created_at)
        ));
    }
    sql.push('\n');

    // 6. Product Variants
    let vars = ProductVariant::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: product_variants ({} rows)\n", vars.len()));
    for v in vars {
        sql.push_str(&format!(
            "INSERT INTO product_variants (id, product_id, variant_name, price_type, price, min_price, max_price, raw_material_id, material_amount, created_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE variant_name=VALUES(variant_name), price=VALUES(price);\n",
            v.id,
            v.product_id,
            sql_str(&v.variant_name),
            sql_str(&format!("{:?}", v.price_type).to_uppercase()),
            v.price,
            v.min_price,
            v.max_price,
            sql_opt_num(v.raw_material_id),
            v.material_amount.map(|d| d.to_string()).unwrap_or_else(|| "1.0000".to_string()),
            sql_ts(&v.created_at)
        ));
    }
    sql.push('\n');

    // 7. Customers
    let custs = Customer::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: customers ({} rows)\n", custs.len()));
    for c in custs {
        sql.push_str(&format!(
            "INSERT INTO customers (id, name, phone, address, created_at) \
             VALUES ({}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone);\n",
            c.id,
            sql_str(&c.name),
            sql_opt_str(c.phone.as_deref()),
            sql_opt_str(c.address.as_deref()),
            sql_ts(&c.created_at)
        ));
    }
    sql.push('\n');

    // 8. Transactions
    let txs = Transaction::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: transactions ({} rows)\n", txs.len()));
    for t in txs {
        sql.push_str(&format!(
            "INSERT INTO transactions (id, invoice_number, customer_id, customer_name, subtotal_amount, discount_amount, total_amount, pay_amount, change_amount, payment_status, order_status, estimated_done_at, created_by, created_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE payment_status=VALUES(payment_status), order_status=VALUES(order_status);\n",
            t.id,
            sql_str(&t.invoice_number),
            sql_opt_num(t.customer_id),
            sql_opt_str(t.customer_name.as_deref()),
            t.subtotal_amount,
            t.discount_amount,
            t.total_amount,
            t.pay_amount,
            t.change_amount,
            sql_str(&format!("{:?}", t.payment_status).to_uppercase()),
            sql_str(&format!("{:?}", t.order_status).to_uppercase()),
            sql_opt_date(t.estimated_done_at),
            sql_opt_num(t.created_by),
            sql_ts(&t.created_at)
        ));
    }
    sql.push('\n');

    // 9. Expenses
    let exps = Expense::find().all(db).await?;
    sql.push_str(&format!("-- TABLE: expenses ({} rows)\n", exps.len()));
    for e in exps {
        sql.push_str(&format!(
            "INSERT INTO expenses (id, title, category, amount, payment_method, notes, expense_date, created_by, created_at) \
             VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}) \
             ON DUPLICATE KEY UPDATE title=VALUES(title), amount=VALUES(amount);\n",
            e.id,
            sql_str(&e.title),
            sql_str(&format!("{:?}", e.category).to_uppercase()),
            e.amount,
            sql_str(&format!("{:?}", e.payment_method).to_uppercase()),
            sql_opt_str(e.notes.as_deref()),
            sql_ts(&e.expense_date),
            sql_opt_num(e.created_by),
            sql_ts(&e.created_at)
        ));
    }
    sql.push('\n');

    sql.push_str("SET FOREIGN_KEY_CHECKS = 1;\n-- END OF BACKUP\n");

    Ok(sql)
}

fn sql_str(val: &str) -> String {
    format!("'{}'", val.replace('\\', "\\\\").replace('\'', "''"))
}

fn sql_opt_str(val: Option<&str>) -> String {
    match val {
        Some(v) => sql_str(v),
        None => "NULL".to_string(),
    }
}

fn sql_opt_num<T: std::fmt::Display>(val: Option<T>) -> String {
    match val {
        Some(v) => v.to_string(),
        None => "NULL".to_string(),
    }
}

fn sql_ts(val: &chrono::DateTime<chrono::Utc>) -> String {
    format!("'{}'", val.format("%Y-%m-%d %H:%M:%S"))
}

fn sql_opt_date(val: Option<chrono::NaiveDate>) -> String {
    match val {
        Some(d) => format!("'{}'", d.format("%Y-%m-%d")),
        None => "NULL".to_string(),
    }
}
