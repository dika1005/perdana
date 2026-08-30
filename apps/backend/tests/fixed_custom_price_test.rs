use backend::config::{self, AppConfig};
use backend::dto::{CreateProductRequest, CreateTransactionRequest, TransactionItemInput};
use backend::services::{products as product_service, transactions as transaction_service};
use entity::enums::PriceType;
use rust_decimal::Decimal;

#[tokio::test]
async fn test_fixed_product_accepts_custom_price() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique = chrono::Utc::now().timestamp_micros();

    // Produk FIXED dengan default 70000
    let prod = product_service::create(
        &db,
        CreateProductRequest {
            category_id: None,
            name: format!("Test Fixed Meteran {}", unique),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(70000)),
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("meter".to_string()),
            has_variants: Some(false),
            uses_material: Some(false),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create fixed product");

    // Create cashier user
    let user = backend::services::users::create(
        &db,
        backend::dto::CreateUserRequest {
            name: format!("Kasir {}", unique),
            username: format!("kasir_{}", unique),
            password: "password123".to_string(),
            role: entity::enums::UserRole::Admin,
        },
    )
    .await
    .expect("Create user");

    // Checkout TANPA custom_price -> harus pakai default 70000
    let tx_default = transaction_service::create(
        &db,
        user.id,
        CreateTransactionRequest {
            customer_name: Some("Test Default".to_string()),
            pay_amount: Decimal::from(70000),
            items: vec![TransactionItemInput {
                product_id: prod.id,
                qty: 1,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await
    .expect("Create tx default");
    assert_eq!(tx_default.total_amount, Decimal::from(70000));

    // Checkout DENGAN custom_price 140000 (simulasi 2m x 70k/m) -> harus pakai 140000
    let tx_custom = transaction_service::create(
        &db,
        user.id,
        CreateTransactionRequest {
            customer_name: Some("Test Custom".to_string()),
            pay_amount: Decimal::from(140000),
            items: vec![TransactionItemInput {
                product_id: prod.id,
                qty: 1,
                custom_price: Some(Decimal::from(140000)),
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await
    .expect("Create tx custom");
    assert_eq!(
        tx_custom.total_amount,
        Decimal::from(140000),
        "FIXED product should accept custom_price for meteran auto-pricing"
    );

    // Item price juga harus 140000
    let item = &tx_custom.items.as_ref().unwrap()[0];
    assert_eq!(item.price, Decimal::from(140000));
}
