use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use std::env;
use std::path::PathBuf;
use std::time::Duration;

use crate::utils::jwt::JwtConfig;

#[derive(Clone, Debug)]
pub struct SeedConfig {
    pub name: String,
    pub username: String,
    pub password: String,
}

#[derive(Clone, Debug)]
pub struct StoreConfig {
    pub name: String,
    pub address: String,
    pub phone: String,
}

#[derive(Clone, Debug)]
pub struct GeminiConfig {
    pub api_key: Option<String>,
    pub model: String,
    pub fallback_model: String,
}


#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub frontend_origin: String,
    pub jwt: JwtConfig,
    pub seed: SeedConfig,
    pub store: StoreConfig,
    pub gemini: GeminiConfig,
}


impl AppConfig {
    pub fn from_env() -> Self {
        load_dotenv();

        let database_url =
            env::var("DATABASE_URL").expect("DATABASE_URL harus diatur pada file .env");
        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let server_port = env::var("SERVER_PORT")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or(8800);
        let frontend_origin =
            env::var("FRONTEND_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());
        let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET harus diatur pada file .env");
        if jwt_secret.len() < 32 {
            panic!("JWT_SECRET minimal 32 karakter");
        }

        let jwt = JwtConfig {
            secret: jwt_secret,
            access_ttl_secs: env_i64("JWT_ACCESS_TTL_SECS", 8 * 60 * 60),
            refresh_ttl_secs: env_i64("JWT_REFRESH_TTL_SECS", 7 * 24 * 60 * 60),
        };

        let seed = SeedConfig {
            name: env::var("SEED_SUPERADMIN_NAME")
                .unwrap_or_else(|_| "Super Admin".to_string()),
            username: env::var("SEED_SUPERADMIN_USERNAME")
                .unwrap_or_else(|_| "superadmin".to_string()),
            password: env::var("SEED_SUPERADMIN_PASSWORD")
                .expect("SEED_SUPERADMIN_PASSWORD harus diatur pada file .env"),
        };

        let store = StoreConfig {
            name: env::var("STORE_NAME")
                .unwrap_or_else(|_| "PERDANA PRINTING & POS".to_string()),
            address: env::var("STORE_ADDRESS")
                .unwrap_or_else(|_| "Jl. Percetakan Perdana No. 1, Kota".to_string()),
            phone: env::var("STORE_PHONE")
                .unwrap_or_else(|_| "0812-3456-7890".to_string()),
        };

        let gemini = GeminiConfig {
            api_key: env::var("GEMINI_API_KEY").ok().filter(|s| !s.trim().is_empty()),
            model: env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-2.5-flash-lite".to_string()),
            fallback_model: env::var("GEMINI_FALLBACK_MODEL").unwrap_or_else(|_| "gemini-2.0-flash".to_string()),
        };

        Self {
            database_url,
            server_host,
            server_port,
            frontend_origin,
            jwt,
            seed,
            store,
            gemini,
        }
    }
}


pub async fn connect_db(database_url: &str) -> Result<DatabaseConnection, DbErr> {
    use sea_orm::ConnectionTrait;

    let mut options = ConnectOptions::new(database_url.to_owned());
    options
        .max_connections(20)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(8))
        .sqlx_logging(false);

    let db = Database::connect(options).await?;
    db.ping().await?;
    log::info!("Database MySQL/MariaDB berhasil terhubung");

    let create_expenses_sql = r#"
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
    "#;
    let _ = db.execute_unprepared(create_expenses_sql).await;

    // Migrasi BOM (Resep Bahan Baku) pada products dan product_variants jika belum ada
    let _ = db.execute_unprepared("ALTER TABLE products ADD COLUMN raw_material_id INT NULL DEFAULT NULL;").await;
    let _ = db.execute_unprepared("ALTER TABLE products ADD COLUMN material_amount DECIMAL(12,4) NULL DEFAULT 1.0000;").await;
    let _ = db.execute_unprepared("ALTER TABLE products ADD CONSTRAINT fk_products_raw_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL;").await;

    let _ = db.execute_unprepared("ALTER TABLE product_variants ADD COLUMN raw_material_id INT NULL DEFAULT NULL;").await;
    let _ = db.execute_unprepared("ALTER TABLE product_variants ADD COLUMN material_amount DECIMAL(12,4) NULL DEFAULT 1.0000;").await;
    let _ = db.execute_unprepared("ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_raw_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL;").await;

    Ok(db)
}


fn env_i64(key: &str, default: i64) -> i64 {
    env::var(key)
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(default)
}

fn load_dotenv() {
    let _ = dotenvy::dotenv_override();

    let mut search_dirs = Vec::new();
    if let Ok(manifest_dir) = env::var("CARGO_MANIFEST_DIR") {
        search_dirs.push(PathBuf::from(manifest_dir));
    }
    if let Ok(current_dir) = env::current_dir() {
        search_dirs.push(current_dir);
    }

    for start_dir in search_dirs {
        let mut dir = Some(start_dir);
        while let Some(path) = dir {
            let candidate = path.join(".env");
            if candidate.is_file() {
                if dotenvy::from_path_override(&candidate).is_ok() {
                    return;
                }
            }
            dir = path.parent().map(PathBuf::from);
        }
    }
}

#[cfg(test)]
mod tests {
    use entity::prelude::*;
    use sea_orm::EntityTrait;

    use super::*;

    #[tokio::test]
    async fn database_and_entity_are_in_sync() {
        let config = AppConfig::from_env();
        let db = connect_db(&config.database_url)
            .await
            .expect("koneksi database gagal");

        User::find()
            .all(&db)
            .await
            .expect("query entity::User harus sesuai tabel users");
        Product::find()
            .all(&db)
            .await
            .expect("query entity::Product harus sesuai tabel products");
        Transaction::find()
            .all(&db)
            .await
            .expect("query entity::Transaction harus sesuai tabel transactions");
    }
}
