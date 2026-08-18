use actix_cors::Cors;
use actix_web::http::header;
use actix_web::{App, HttpServer, middleware::Logger, web};
use backend::config::{self, AppConfig};
use backend::http::json_config;
use backend::routes;
use backend::services::auth::seed_super_admin;
use backend::state::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let app_config = AppConfig::from_env();
    let db = config::connect_db(&app_config.database_url)
        .await
        .expect("Gagal mengoneksikan database");

    seed_super_admin(&db, &app_config.seed)
        .await
        .expect("Gagal seed Super Admin");

    let state = AppState {
        db,
        jwt: app_config.jwt.clone(),
    };

    let bind_addr = (app_config.server_host.as_str(), app_config.server_port);
    log::info!(
        "Server berjalan di http://{}:{}",
        app_config.server_host,
        app_config.server_port
    );

    let frontend_origin = app_config.frontend_origin.clone();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&frontend_origin)
            .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                header::AUTHORIZATION,
                header::ACCEPT,
                header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(state.clone()))
            .app_data(json_config())
            .route("/health", web::get().to(routes::health::health_check))
            .service(web::scope("/api/v1").configure(routes::configure))
    })
    .bind(bind_addr)?
    .run()
    .await
}
