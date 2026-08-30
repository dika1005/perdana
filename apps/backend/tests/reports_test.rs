use backend::config::{self, AppConfig};
use backend::dto::{
    CategoryRequest, CreateCustomerRequest, CreateMutationRequest, CreateProductRequest,
    CreateTransactionRequest, CreateUserRequest, ReportDateQuery, TransactionItemInput,
};
use backend::services::{
    categories as category_service, customers as customer_service, products as product_service,
    raw_materials as raw_material_service, reports as report_service,
    transactions as transaction_service, users as user_service,
};
use entity::enums::{MutationType, PaymentStatus, PriceType, UserRole};
use rust_decimal::Decimal;

#[tokio::test]
async fn test_reports_and_analytics() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Setup User, Customer, Product, Category
    let cashier = user_service::create(
        &db,
        CreateUserRequest {
            name: format!("Kasir Report {}", unique_suffix),
            username: format!("kasir_rep_{}", unique_suffix),
            password: "password123".to_string(),
            role: UserRole::Admin,
        },
    )
    .await
    .expect("Create user");

    let customer = customer_service::create(
        &db,
        CreateCustomerRequest {
            name: format!("Customer Report {}", unique_suffix),
            phone: None,
            address: None,
        },
    )
    .await
    .expect("Create customer");

    let cat = category_service::create_product_category(
        &db,
        CategoryRequest {
            name: format!("Kategori Report {}", unique_suffix),
        },
    )
    .await
    .expect("Create category");

    let prod = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(cat.id),
            name: format!("Spanduk Flexi {}", unique_suffix),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(50000)),
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("meter".to_string()),
            has_variants: Some(false),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create product");

    // 2. Create Transaction: Spanduk Flexi (qty 2 @ Rp 50.000 = Rp 100.000, Paid in full)
    let _trans = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: Some(customer.id),
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(100000),
            payment_status: Some(PaymentStatus::Paid),
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod.id,
                product_variant_id: None,
                custom_price: None,
                qty: 2,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await
    .expect("Create transaction");

    // 3. Create Raw Material and Mutate
    let mat_cat = category_service::create_raw_material_category(
        &db,
        CategoryRequest {
            name: format!("Kategori Bahan Report {}", unique_suffix),
        },
    )
    .await
    .expect("Create raw material category");

    let mat = raw_material_service::create(
        &db,
        backend::dto::CreateRawMaterialRequest {
            category_id: Some(mat_cat.id),
            name: format!("Bahan Flexi 280gr {}", unique_suffix),
            variant: None,
            unit: Some("meter".to_string()),
            stock: Some(Decimal::from(10)),
            min_stock_warning: Some(Decimal::from(20)), // Low stock
            standard_cost: None,
            roll_width: None,
        },
    )
    .await
    .expect("Create raw material");

    let _mut_in = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::In,
            qty: Decimal::from(50),
            notes: Some("Restock report test".to_string()),
        },
    )
    .await
    .expect("Mutation IN");

    // 4. Test Summary Report
    let summary = report_service::get_dashboard_summary(
        &db,
        ReportDateQuery {
            start_date: None,
            end_date: None,
        },
    )
    .await
    .expect("Get summary report");

    assert!(summary.total_omset >= Decimal::from(100000));
    assert!(summary.total_transactions >= 1);
    assert!(summary.paid_transactions >= 1);

    // 5. Test Daily Sales Report
    let today = chrono::Utc::now().naive_utc().date();
    let daily_sales = report_service::get_daily_sales(
        &db,
        ReportDateQuery {
            start_date: Some(today),
            end_date: Some(today),
        },
    )
    .await
    .expect("Get daily sales");
    assert!(!daily_sales.is_empty());

    // 6. Test Top Products Report
    let top_prods = report_service::get_top_products(
        &db,
        ReportDateQuery {
            start_date: Some(today),
            end_date: Some(today),
        },
    )
    .await
    .expect("Get top products");
    assert!(top_prods.iter().any(|p| p.product_name == prod.name));

    // 7. Test Inventory Mutations Report
    let inv_mutations = report_service::get_inventory_mutations(
        &db,
        ReportDateQuery {
            start_date: Some(today),
            end_date: Some(today),
        },
    )
    .await
    .expect("Get inventory mutations report");
    assert!(inv_mutations.iter().any(|m| m.raw_material_id == mat.id && m.in_qty >= Decimal::from(50)));

    // 8. Test Receivables Report
    let _dp_trans = transaction_service::create(
        &db,
        cashier.id,
        CreateTransactionRequest {
            customer_id: Some(customer.id),
            customer_name: None,
            discount_amount: None,
            pay_amount: Decimal::from(20000), // Total 50k, paid 20k -> DP remaining 30k
            payment_status: Some(PaymentStatus::Dp),
            estimated_done_at: None,
            items: vec![TransactionItemInput {
                product_id: prod.id,
                product_variant_id: None,
                custom_price: None,
                qty: 1,
                addons: None,
                ..Default::default()
            }],
            ..Default::default()
        },
    )
    .await
    .expect("Create DP transaction");

    let receivables = report_service::get_receivables(
        &db,
        ReportDateQuery {
            start_date: Some(today),
            end_date: Some(today),
        },
    )
    .await
    .expect("Get receivables report");
    assert!(receivables.iter().any(|r| r.remaining_amount == Decimal::from(30000)));

    // 9. Test Low Stock Report
    let low_mat = raw_material_service::create(
        &db,
        backend::dto::CreateRawMaterialRequest {
            category_id: Some(mat_cat.id),
            name: format!("Tinta Menipis {}", unique_suffix),
            variant: None,
            unit: Some("botol".to_string()),
            stock: Some(Decimal::from(3)),
            min_stock_warning: Some(Decimal::from(10)),
            standard_cost: None,
            roll_width: None,
        },
    )
    .await
    .expect("Create low stock raw material");

    let low_stock_list = report_service::get_low_stock(&db)
        .await
        .expect("Get low stock report");
    assert!(low_stock_list.iter().any(|ls| ls.id == low_mat.id));
}

