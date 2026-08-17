use dotenvy::dotenv;
use sea_orm::{Database, DatabaseConnection, DbErr};
use std::env;

pub async fn connect_db() -> Result<DatabaseConnection, DbErr> {
    dotenv().ok();
    
    let db_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL harus diatur pada file .env");

    let db = Database::connect(&db_url).await?;
    println!("Database MySQL berhasil terhubung.");
    Ok(db)
}