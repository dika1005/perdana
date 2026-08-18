use actix_web::web;

pub mod auth;
pub mod health;
pub mod users;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(health::health_check))
        .service(
            web::scope("/auth")
                .route("/login", web::post().to(auth::login))
                .route("/refresh", web::post().to(auth::refresh))
                .route("/logout", web::post().to(auth::logout))
                .route("/me", web::get().to(auth::me)),
        )
        .service(
            web::scope("/users")
                .route("", web::get().to(users::list))
                .route("", web::post().to(users::create))
                .route("/{id}", web::get().to(users::get))
                .route("/{id}", web::put().to(users::update))
                .route("/{id}/password", web::patch().to(users::reset_password))
                .route("/{id}", web::delete().to(users::delete)),
        );
}

