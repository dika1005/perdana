use actix_web::web;

pub mod addons;
pub mod ai;
pub mod auth;
pub mod categories;
pub mod customers;
pub mod health;
pub mod products;
pub mod public;
pub mod raw_materials;
pub mod reports;
pub mod transactions;
pub mod users;
pub mod expenses;
pub mod backup;

pub fn configure(cfg: &mut web::ServiceConfig) {

    cfg.route("/health", web::get().to(health::health_check))
        .service(
            web::scope("/public")
                .route("/catalog", web::get().to(public::catalog))
                .route("/tracking", web::get().to(public::tracking)),
        )
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
        )
        .service(
            web::scope("/product-categories")
                .route("", web::get().to(categories::list_product_categories))
                .route("", web::post().to(categories::create_product_category))
                .route("/{id}", web::get().to(categories::get_product_category))
                .route("/{id}", web::put().to(categories::update_product_category))
                .route(
                    "/{id}",
                    web::delete().to(categories::delete_product_category),
                ),
        )
        .service(
            web::scope("/raw-material-categories")
                .route("", web::get().to(categories::list_raw_material_categories))
                .route("", web::post().to(categories::create_raw_material_category))
                .route(
                    "/{id}",
                    web::get().to(categories::get_raw_material_category),
                )
                .route(
                    "/{id}",
                    web::put().to(categories::update_raw_material_category),
                )
                .route(
                    "/{id}",
                    web::delete().to(categories::delete_raw_material_category),
                ),
        )
        .service(
            web::scope("/products")
                .route("", web::get().to(products::list))
                .route("", web::post().to(products::create))
                .route("/{id}", web::get().to(products::get))
                .route("/{id}", web::put().to(products::update))
                .route("/{id}", web::delete().to(products::delete))
                .route("/{id}/variants", web::get().to(products::list_variants))
                .route(
                    "/{id}/variants",
                    web::post().to(products::create_variant),
                ),
        )
        .service(
            web::scope("/product-variants")
                .route("/{id}", web::put().to(products::update_variant))
                .route("/{id}", web::delete().to(products::delete_variant)),
        )
        .service(
            web::scope("/addons")
                .route("", web::get().to(addons::list))
                .route("", web::post().to(addons::create))
                .route("/{id}", web::get().to(addons::get))
                .route("/{id}", web::put().to(addons::update))
                .route("/{id}", web::delete().to(addons::delete)),
        )
        .service(
            web::scope("/raw-materials")
                .route("/mutations", web::post().to(raw_materials::create_mutation))
                .route("/{id}/lots", web::get().to(raw_materials::list_lots))
                .route("/{id}/lots", web::post().to(raw_materials::receive_lot))
                .route(
                    "/{id}/uom-conversions",
                    web::put().to(raw_materials::upsert_uom_conversion),
                )
                .route("/{id}/mutations", web::get().to(raw_materials::list_mutations))
                .route("", web::get().to(raw_materials::list))
                .route("", web::post().to(raw_materials::create))
                .route("/{id}", web::get().to(raw_materials::get))
                .route("/{id}", web::put().to(raw_materials::update))
                .route("/{id}", web::delete().to(raw_materials::delete)),
        )
        .service(
            web::scope("/customers")
                .route("", web::get().to(customers::list))
                .route("", web::post().to(customers::create))
                .route("/{id}", web::get().to(customers::get))
                .route("/{id}", web::put().to(customers::update))
                .route("/{id}", web::delete().to(customers::delete))
                .route(
                    "/{id}/transactions",
                    web::get().to(customers::list_transactions),
                ),
        )
        .service(
            web::scope("/transactions")
                .route("", web::get().to(transactions::list))
                .route("", web::post().to(transactions::create))
                .route("/{id}", web::get().to(transactions::get))
                .route("/{id}/status", web::patch().to(transactions::update_status))
                .route(
                    "/{id}/payment",
                    web::patch().to(transactions::update_payment),
                )
                .route("/{id}/refund", web::post().to(transactions::refund_payment))
                .route("/{id}/settle", web::post().to(transactions::settle))
                .route("/{id}/waste", web::post().to(transactions::record_waste))
                .route("/{id}/rework", web::post().to(transactions::record_rework))
                .route(
                    "/{id}/invoice",
                    web::get().to(transactions::get_invoice),
                )
                .route(
                    "/{id}/cancel",
                    web::post().to(transactions::cancel),
                ),
        )
        .service(
            web::scope("/reports")
                .route("/summary", web::get().to(reports::summary))
                .route("/monthly-sales", web::get().to(reports::monthly_sales))
                .route("/daily-sales", web::get().to(reports::daily_sales))
                .route("/top-products", web::get().to(reports::top_products))
                .route(
                    "/inventory-mutations",
                    web::get().to(reports::inventory_mutations),
                )
                .route("/receivables", web::get().to(reports::receivables))
                .route("/low-stock", web::get().to(reports::low_stock))
                .route(
                    "/ledger-reconciliation",
                    web::get().to(reports::ledger_reconciliation),
                ),
        )
        .service(
            web::scope("/ai")
                .route("/parse-order", web::post().to(ai::parse_order)),
        )
        .service(
            web::scope("/backup")
                .route("/export", web::get().to(backup::export_backup)),
        )
        .configure(expenses::configure);
}



