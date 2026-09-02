use backend::config::{self, AppConfig};
use backend::dto::{
    CategoryRequest, CreateAddonRequest, CreateCustomerRequest, CreateMutationRequest,
    CreateProductRequest, CreateTransactionRequest, CreateUserRequest, CreateVariantRequest,
    LoginRequest, ResetPasswordRequest, TransactionItemInput, UpdatePaymentRequest,
};
use backend::error::AppError;
use backend::services::{
    addons as addon_service, auth as auth_service, categories as category_service,
    customers as customer_service, products as product_service,
    raw_materials as raw_material_service, transactions as transaction_service,
    users as user_service,
};
use entity::enums::{MutationType, PriceType, RangePriceType, UserRole};
use rust_decimal::Decimal;

#[tokio::test]
async fn test_auth_and_user_error_cases() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();
    let username = format!("user_err_{}", unique_suffix);

    // 1. Create a user
    let user = user_service::create(
        &db,
        CreateUserRequest {
            name: "User Error Test".to_string(),
            username: username.clone(),
            password: "validpassword123".to_string(),
            role: UserRole::Admin,
        },
    )
    .await
    .expect("Create user");

    // 2. Duplicate username -> Conflict Error
    let dup_res = user_service::create(
        &db,
        CreateUserRequest {
            name: "Duplicate User".to_string(),
            username: username.clone(),
            password: "validpassword123".to_string(),
            role: UserRole::Admin,
        },
    )
    .await;
    match dup_res {
        Err(AppError::Conflict(_)) => {}
        other => panic!("Expected Conflict error for duplicate username, got {:?}", other),
    }

    // 3. Login with wrong password -> Unauthorized Error
    let wrong_pw_res = auth_service::login(
        &db,
        &config.jwt,
        LoginRequest {
            username: username.clone(),
            password: "wrongpassword".to_string(),
        },
    )
    .await;
    match wrong_pw_res {
        Err(AppError::Unauthorized(_)) => {}
        other => panic!("Expected Unauthorized error for wrong password, got {:?}", other),
    }

    // 4. Login with non-existent username -> Unauthorized Error
    let non_existent_res = auth_service::login(
        &db,
        &config.jwt,
        LoginRequest {
            username: format!("nonexistent_{}", unique_suffix),
            password: "password123".to_string(),
        },
    )
    .await;
    match non_existent_res {
        Err(AppError::Unauthorized(_)) => {}
        other => panic!("Expected Unauthorized error for non-existent user, got {:?}", other),
    }

    // 5. Reset password with short password (< 8 chars) -> Validation Error
    let short_pw_res = user_service::reset_password(
        &db,
        user.id,
        ResetPasswordRequest {
            password: "123".to_string(),
        },
    )
    .await;
    match short_pw_res {
        Err(AppError::Validation { .. }) => {}
        other => panic!("Expected Validation error for short password, got {:?}", other),
    }

    // 6. Deactivated user login test
    user_service::deactivate(&db, user.id, 9999999)
        .await
        .expect("Deactivate user");
    let inactive_login = auth_service::login(
        &db,
        &config.jwt,
        LoginRequest {
            username: username.clone(),
            password: "validpassword123".to_string(),
        },
    )
    .await;
    match inactive_login {
        Err(AppError::Unauthorized(_)) => {}
        other => panic!("Expected Unauthorized error for inactive user, got {:?}", other),
    }
}

#[tokio::test]
async fn test_category_and_product_validation_and_errors() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Category with empty name -> Validation Error
    let empty_cat = category_service::create_product_category(
        &db,
        CategoryRequest {
            name: "   ".to_string(),
        },
    )
    .await;
    assert!(matches!(empty_cat, Err(AppError::Validation { .. })));

    // 2. Non-existent category lookup -> Not Found Error
    let not_found_cat = category_service::get_product_category(&db, 9999999).await;
    assert!(matches!(not_found_cat, Err(AppError::NotFound(_))));

    // 3. Create Product with Range price where min_price > max_price -> Validation Error
    let invalid_range_prod = product_service::create(
        &db,
        CreateProductRequest {
            category_id: None,
            name: format!("Invalid Range Product {}", unique_suffix),
            price_type: PriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(50000)),
            max_price: Some(Decimal::from(20000)), // min > max
            min_order: Some(1),
            unit_name: Some("pcs".to_string()),
            has_variants: Some(false),
            uses_material: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await;
    assert!(matches!(invalid_range_prod, Err(AppError::Validation { .. })));

    // 4. Create Product with non-existent category_id -> Validation Error
    let fake_cat_prod = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(9999999),
            name: format!("Fake Cat Product {}", unique_suffix),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(10000)),
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("pcs".to_string()),
            has_variants: Some(false),
            uses_material: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await;
    assert!(matches!(fake_cat_prod, Err(AppError::Validation { .. })));

    // 5. Create Product Variant for non-existent product_id -> Not Found Error
    let fake_prod_variant = product_service::create_variant(
        &db,
        9999999,
        CreateVariantRequest {
            variant_name: "Fake Variant".to_string(),
            price_type: RangePriceType::Fixed,
            price: Some(Decimal::from(10000)),
            min_price: None,
            max_price: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await;
    assert!(matches!(fake_prod_variant, Err(AppError::NotFound(_))));

    // 6. Create Add-on with Range price where min_price > max_price -> Validation Error
    let invalid_range_addon = addon_service::create(
        &db,
        CreateAddonRequest {
            name: format!("Invalid Addon {}", unique_suffix),
            category_id: None,
            price_type: RangePriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(15000)),
            max_price: Some(Decimal::from(5000)), // min > max
        },
    )
    .await;
    assert!(matches!(invalid_range_addon, Err(AppError::Validation { .. })));
}

#[tokio::test]
async fn test_inventory_and_customer_errors() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Customer with empty name -> Validation Error
    let empty_cust = customer_service::create(
        &db,
        CreateCustomerRequest {
            name: "".to_string(),
            phone: None,
            address: None,
        },
    )
    .await;
    assert!(matches!(empty_cust, Err(AppError::Validation { .. })));

    // 2. Non-existent customer lookup -> Not Found Error
    let not_found_cust = customer_service::get_by_id(&db, 9999999).await;
    assert!(matches!(not_found_cust, Err(AppError::NotFound(_))));

    // 3. Create raw material with empty name -> Validation Error
    let empty_mat = raw_material_service::create(
        &db,
        backend::dto::CreateRawMaterialRequest {
            category_id: None,
            name: "".to_string(),
            variant: None,
            unit: None,
            package_unit: None,
            package_size: None,
            stock: None,
            min_stock_warning: None,
            standard_cost: None,
            roll_width: None,
        },
    )
    .await;
    assert!(matches!(empty_mat, Err(AppError::Validation { .. })));

    // 4. Create raw material with non-existent category_id -> Validation Error
    let fake_cat_mat = raw_material_service::create(
        &db,
        backend::dto::CreateRawMaterialRequest {
            category_id: Some(9999999),
            name: format!("Fake Cat Material {}", unique_suffix),
            variant: None,
            unit: None,
            package_unit: None,
            package_size: None,
            stock: None,
            min_stock_warning: None,
            standard_cost: None,
            roll_width: None,
        },
    )
    .await;
    assert!(matches!(fake_cat_mat, Err(AppError::Validation { .. })));

    // 5. Mutation with non-existent raw_material_id -> Not Found Error
    let fake_mat_mut = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: 9999999,
            mutation_type: MutationType::In,
            qty: Decimal::from(10),
            unit: None,
            notes: None,
        },
    )
    .await;
    assert!(matches!(fake_mat_mut, Err(AppError::NotFound(_))));

    // 6. Mutation with invalid qty (0 or negative) -> Validation Error
    let zero_qty_mut = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: 1,
            mutation_type: MutationType::In,
            qty: Decimal::from(0),
            unit: None,
            notes: None,
        },
    )
    .await;
    assert!(matches!(zero_qty_mut, Err(AppError::Validation { .. })));
}

#[tokio::test]
async fn test_pos_transaction_business_rule_errors() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // Setup Cashier
    let cashier = user_service::create(
        &db,
        CreateUserRequest {
            name: format!("Kasir Error Test {}", unique_suffix),
            username: format!("kasir_biz_{}", unique_suffix),
            password: "password123".to_string(),
            role: UserRole::Admin,
        },
    )
    .await
    .expect("Create user");

    // Setup Products
    let prod_min_order = product_service::create(
        &db,
        CreateProductRequest {
            category_id: None,
            name: format!("Undangan Blangko {}", unique_suffix),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(2000)),
            min_price: None,
            max_price: None,
            min_order: Some(100), // Min order is 100!
            unit_name: Some("lembar".to_string()),
            has_variants: Some(false),
            uses_material: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create product with min_order");

    let prod_range = product_service::create(
        &db,
        CreateProductRequest {
            category_id: None,
            name: format!("Brosur Range {}", unique_suffix),
            price_type: PriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(500)),
            max_price: Some(Decimal::from(2000)),
            min_order: Some(1),
            unit_name: Some("lembar".to_string()),
            has_variants: Some(false),
            uses_material: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create range product");

    let prod_custom = product_service::create(
        &db,
        CreateProductRequest {
            category_id: None,
            name: format!("Desain Custom {}", unique_suffix),
            price_type: PriceType::Custom,
            default_price: None,
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("desain".to_string()),
            has_variants: Some(false),
            uses_material: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create custom product");

    // 1. Transaction with empty items -> Validation Error
    let empty_items_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![], // Empty!
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(empty_items_tx, Err(AppError::Validation { .. })));

    // 2. Transaction with qty < min_order -> Validation Error
    let under_min_order_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_min_order.id,
                product_variant_id: None,
                custom_price: None,
                qty: 50, // Less than min_order 100!
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(under_min_order_tx, Err(AppError::Validation { .. })));

    // 3. Range product transaction without custom_price -> Validation Error
    let missing_range_price_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_range.id,
                product_variant_id: None,
                custom_price: None, // Missing!
                qty: 10,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(missing_range_price_tx, Err(AppError::Validation { .. })));

    // 4. Range product transaction with custom_price out of bounds (below min) -> Validation Error
    let low_range_price_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_range.id,
                product_variant_id: None,
                custom_price: Some(Decimal::from(300)), // Below min 500!
                qty: 10,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(low_range_price_tx, Err(AppError::Validation { .. })));

    // 5. Range product transaction with custom_price out of bounds (above max) -> Validation Error
    let high_range_price_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_range.id,
                product_variant_id: None,
                custom_price: Some(Decimal::from(3000)), // Above max 2000!
                qty: 10,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(high_range_price_tx, Err(AppError::Validation { .. })));

    // 6. Custom price product without custom_price -> Validation Error
    let missing_custom_price_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: None,
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_custom.id,
                product_variant_id: None,
                custom_price: None, // Missing!
                qty: 1,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(missing_custom_price_tx, Err(AppError::Validation { .. })));

    // 7. Transaction with non-existent customer_id -> Validation Error
    let fake_customer_tx = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: Some(9999999), // Fake!
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(10000),
            payment_status: None,
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod_range.id,
                product_variant_id: None,
                custom_price: Some(Decimal::from(1000)),
                qty: 10,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(fake_customer_tx, Err(AppError::Validation { .. })));

    // 8. Update payment on non-existent transaction -> Not Found Error
    let fake_tx_payment = transaction_service::update_payment(
        &db,
        9999999,
        UpdatePaymentRequest {
            additional_pay_amount: Decimal::from(50000),
            payment_status: None,
            ..Default::default()
        },
    )
    .await;
    assert!(matches!(fake_tx_payment, Err(AppError::NotFound(_))));
}
