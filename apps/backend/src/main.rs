use actix_cors::Cors;
use actix_web::{web, App, HttpServer};

mod config;
mod routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Inisialisasi logging console
    env_logger::init();

    // Koneksi ke Database
    let db = config::connect_db()
        .await
        .expect("Gagal mengoneksikan database");

    println!("Server berjalan di http://127.0.0.1:8800");

    HttpServer::new(move || {
        // Setup CORS agar Next.js bisa akses
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            // Inject koneksi SeaORM ke State Actix Web
            .app_data(web::Data::new(db.clone()))
            // Register route
            .service(routes::health::health_check)
    })
    .bind(("127.0.0.1", 8800))?
    .run()
    .await
}