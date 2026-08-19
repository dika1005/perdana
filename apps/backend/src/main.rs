use actix_cors::Cors;
use actix_web::{App, HttpServer, middleware::Logger, web};
use backend::config::{self, AppConfig};
use backend::http::json_config;
use backend::openapi::ApiDoc;
use backend::routes;
use backend::services::auth::seed_super_admin;
use backend::state::AppState;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

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
        store: app_config.store.clone(),
        gemini: app_config.gemini.clone(),
        http_client: reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(20))
            .build()
            .unwrap_or_default(),
    };


    let bind_addr = (app_config.server_host.as_str(), app_config.server_port);
    log::info!(
        "Server berjalan di http://{}:{}",
        app_config.server_host,
        app_config.server_port
    );
    log::info!(
        "Swagger UI tersedia di http://{}:{}/swagger-ui/",
        app_config.server_host,
        app_config.server_port
    );

    let frontend_origin = app_config.frontend_origin.clone();
    let openapi = ApiDoc::openapi();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&frontend_origin)
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("http://localhost:3001")
            .allowed_origin("http://127.0.0.1:3001")
            .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);


        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(state.clone()))
            .app_data(json_config())
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-docs/openapi.json", openapi.clone()),
            )
            .service(
                SwaggerUi::new("/api/v1/swagger-ui/{_:.*}")
                    .url("/api/v1/api-docs/openapi.json", openapi.clone()),
            )
            .route("/health", web::get().to(routes::health::health_check))
            .service(web::scope("/api/v1").configure(routes::configure))
            .configure(routes::configure)
    })
    .bind(bind_addr)?
    .run()
    .await
}
