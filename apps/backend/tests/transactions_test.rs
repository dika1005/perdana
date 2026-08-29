use backend::config::{self, AppConfig};
use backend::dto::{
    CategoryRequest, CreateAddonRequest, CreateCustomerRequest, CreateProductRequest,
    CreateTransactionRequest, CreateUserRequest, CreateVariantRequest, Pagination,
    TransactionAddonInput, TransactionItemInput, TransactionQuery, UpdatePaymentRequest,
};
use backend::services::{
    addons as addon_service, categories as category_service, customers as customer_service,
    products as product_service, transactions as transaction_service, users as user_service,
};
use entity::enums::{OrderStatus, PaymentStatus, PriceType, RangePriceType, UserRole};
use rust_decimal::Decimal;

#[tokio::test]
async fn test_pos_transaction_complete_lifecycle() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Create Cashier user
    let cashier = user_service::create(
        &db,
        CreateUserRequest {
            name: format!("Kasir {}", unique_suffix),
            username: format!("kasir_{}", unique_suffix),
            password: "password123".to_string(),
            role: UserRole::Admin,
        },
    )
    .await
    .expect("Create cashier");

    // 2. Create Customer
    let customer = customer_service::create(
        &db,
        CreateCustomerRequest {
            name: format!("Pelanggan Percetakan {}", unique_suffix),
            phone: Some("08123456789".to_string()),
            address: Some("Jl. Merdeka No. 45".to_string()),
        },
    )
    .await
    .expect("Create customer");

    // 3. Create Product Category & Products
    let cat = category_service::create_product_category(
        &db,
        CategoryRequest {
            name: format!("Undangan & Souvenir {}", unique_suffix),
        },
    )
    .await
    .expect("Create category");

    // Fixed product: Kartu Nama (Rp 35.000 / box)
    let prod_kartu_nama = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(cat.id),
            name: format!("Kartu Nama {}", unique_suffix),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(35000)),
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("box".to_string()),
            has_variants: Some(false),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create fixed product");

    // Range product with variants: Buku Yasin
    let prod_yasin = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(cat.id),
            name: format!("Buku Yasin Custom {}", unique_suffix),
            price_type: PriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(10000)),
            max_price: Some(Decimal::from(50000)),
            min_order: Some(10),
            unit_name: Some("buku".to_string()),
            has_variants: Some(true),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create range product");

    let variant_hardcover = product_service::create_variant(
        &db,
        prod_yasin.id,
        CreateVariantRequest {
            variant_name: "Hard Cover Beludru".to_string(),
            price_type: RangePriceType::Range,
            price: None,
            min_price: Some(Decimal::from(25000)),
            max_price: Some(Decimal::from(40000)),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create variant");

    // Addon: Pita Pembatas (Fixed Rp 1.500)
    let addon_pita = addon_service::create(
        &db,
        CreateAddonRequest {
            name: format!("Pita Rumbai {}", unique_suffix),
            category_id: Some(cat.id),
            price_type: RangePriceType::Fixed,
            default_price: Some(Decimal::from(1500)),
            min_price: None,
            max_price: None,
        },
    )
    .await
    .expect("Create addon");

    // 4. Create POS Transaction with DP (Down Payment)
    // Item 1: Kartu Nama (qty 2 @ Rp 35.000 = Rp 70.000)
    // Item 2: Buku Yasin (qty 50 @ Rp 30.000 = Rp 1.500.000) + Addon Pita (qty 50 @ Rp 1.500 = Rp 75.000)
    // Subtotal = 70.000 + 1.500.000 + 75.000 = 1.645.000
    // Discount = 45.000 -> Total = 1.600.000
    // Pay DP = 600.000 -> Remaining = 1.000.000, PaymentStatus = DP, OrderStatus = Antrian
    let trans = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: Some(customer.id),
            customer_name: None,
            discount_amount: Some(Decimal::from(45000)),
            pay_amount: Decimal::from(600000),
            payment_status: Some(PaymentStatus::Dp),
            estimated_done_at: Some(chrono::NaiveDate::from_ymd_opt(2026, 8, 25).unwrap()),
            items: vec![
                TransactionItemInput {
                    product_id: prod_kartu_nama.id,
                    product_variant_id: None,
                    custom_price: None,
                    qty: 2,
                    addons: None,
                    ..Default::default()
                },
                TransactionItemInput {
                    product_id: prod_yasin.id,
                    product_variant_id: Some(variant_hardcover.id),
                    custom_price: Some(Decimal::from(30000)),
                    qty: 50,
                    addons: Some(vec![TransactionAddonInput {
                        addon_id: Some(addon_pita.id),
                        addon_name: None,
                        price: None,
                        qty: Some(50),
                    }]),
                    ..Default::default()
                },
            ],
            ..Default::default()
        },
    )
    .await
    .expect("Create POS Transaction");

    assert_eq!(trans.subtotal_amount, Decimal::from(1645000));
    assert_eq!(trans.discount_amount, Decimal::from(45000));
    assert_eq!(trans.total_amount, Decimal::from(1600000));
    assert_eq!(trans.pay_amount, Decimal::from(600000));
    assert_eq!(trans.change_amount, Decimal::ZERO);
    assert_eq!(trans.payment_status, PaymentStatus::Dp);
    assert_eq!(trans.order_status, OrderStatus::Antrian);
    assert_eq!(trans.items.as_ref().unwrap().len(), 2);
    assert_eq!(trans.cashier_name.as_deref(), Some(cashier.name.as_str()));

    // 5. Update Order Status (Antrian -> Proses -> Selesai)
    let updated_status =
        transaction_service::update_status(&db, trans.id, OrderStatus::Proses)
            .await
            .expect("Update order status to Proses");
    assert_eq!(updated_status.order_status, OrderStatus::Proses);

    let finished_status =
        transaction_service::update_status(&db, trans.id, OrderStatus::Selesai)
            .await
            .expect("Update order status to Selesai");
    assert_eq!(finished_status.order_status, OrderStatus::Selesai);

    // 6. Settle DP (Pelunasan sisa Rp 1.000.000 + bayar Rp 1.050.000 -> kembalian Rp 50.000)
    let settled = transaction_service::update_payment(
        &db,
        trans.id,
        UpdatePaymentRequest {
            additional_pay_amount: Decimal::from(1050000),
            payment_status: Some(PaymentStatus::Paid),
            ..Default::default()
        },
    )
    .await
    .expect("Settle DP payment");
    assert_eq!(settled.pay_amount, Decimal::from(1650000));
    assert_eq!(settled.change_amount, Decimal::from(50000));
    assert_eq!(settled.payment_status, PaymentStatus::Paid);

    // 7. Customer picks up order (Selesai -> Diambil)
    let picked_up = transaction_service::update_status(&db, trans.id, OrderStatus::Diambil)
        .await
        .expect("Update order status to Diambil");
    assert_eq!(picked_up.order_status, OrderStatus::Diambil);

    // 8. Generate Invoice Print Data
    let invoice = transaction_service::get_invoice_data(&db, &config.store, trans.id)
        .await
        .expect("Get invoice print data");
    assert_eq!(invoice.invoice_number, trans.invoice_number);
    assert_eq!(invoice.remaining_amount, Decimal::ZERO);
    assert_eq!(invoice.change_amount, Decimal::from(50000));
    assert_eq!(invoice.items.len(), 2);
    assert_eq!(invoice.store_name, config.store.name);

    // 9. List transactions with filter
    let pagination = Pagination::default();
    let (list_res, meta) = transaction_service::list(
        &db,
        &pagination,
        TransactionQuery {
            search: Some(trans.invoice_number.clone()),
            date: None,
            payment_status: Some(PaymentStatus::Paid),
            order_status: Some(OrderStatus::Diambil),
            ..Default::default()
        },
    )
    .await
    .expect("List transactions");
    assert_eq!(meta.total, 1);
    assert_eq!(list_res[0].id, trans.id);
}
