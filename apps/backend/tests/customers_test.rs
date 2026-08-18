use backend::config::{self, AppConfig};
use backend::dto::{CreateCustomerRequest, CustomerQuery, Pagination, UpdateCustomerRequest};
use backend::services::customers as customer_service;

#[tokio::test]
async fn test_customers_lifecycle() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Create customer
    let cust = customer_service::create(
        &db,
        CreateCustomerRequest {
            name: format!("SMK Negeri 1 {}", unique_suffix),
            phone: Some("08123456789".to_string()),
            address: Some("Jl. Pendidikan No. 10".to_string()),
        },
    )
    .await
    .expect("Create customer");
    assert_eq!(cust.phone.as_deref(), Some("08123456789"));

    // 2. Get customer
    let fetched = customer_service::get_by_id(&db, cust.id)
        .await
        .expect("Get customer");
    assert_eq!(fetched.id, cust.id);

    // 3. Update customer
    let updated = customer_service::update(
        &db,
        cust.id,
        UpdateCustomerRequest {
            name: format!("SMK Negeri 1 Updated {}", unique_suffix),
            phone: Some("08999999999".to_string()),
            address: Some("Jl. Pendidikan Baru No. 12".to_string()),
        },
    )
    .await
    .expect("Update customer");
    assert_eq!(updated.phone.as_deref(), Some("08999999999"));

    // 4. List customers with search
    let pagination = Pagination::default();
    let (list_res, meta) = customer_service::list(
        &db,
        &pagination,
        CustomerQuery {
            search: Some(format!("{}", unique_suffix)),
        },
    )
    .await
    .expect("List customers");
    assert_eq!(meta.total, 1);
    assert_eq!(list_res[0].id, cust.id);

    // 5. Delete customer
    customer_service::delete(&db, cust.id)
        .await
        .expect("Delete customer");
    assert!(customer_service::get_by_id(&db, cust.id).await.is_err());
}
