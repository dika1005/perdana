use backend::config::{self, AppConfig};
use backend::dto::{
    CategoryRequest, CreateMutationRequest, CreateRawMaterialRequest, Pagination,
    RawMaterialQuery, UpdateRawMaterialRequest,
};
use backend::services::{categories as category_service, raw_materials as raw_material_service};
use entity::enums::MutationType;
use rust_decimal::Decimal;

#[tokio::test]
async fn test_raw_materials_and_mutations_lifecycle() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Create a raw material category
    let cat = category_service::create_raw_material_category(
        &db,
        CategoryRequest {
            name: format!("Kategori Kertas {}", unique_suffix),
        },
    )
    .await
    .expect("Create raw material category");

    // 2. Create raw material
    let mat = raw_material_service::create(
        &db,
        CreateRawMaterialRequest {
            category_id: Some(cat.id),
            name: format!("Kertas Art Paper 260gr {}", unique_suffix),
            variant: Some("Plano".to_string()),
            unit: Some("lembar".to_string()),
            stock: Some(Decimal::from(50)),
            min_stock_warning: Some(Decimal::from(20)),
        },
    )
    .await
    .expect("Create raw material");
    assert_eq!(mat.stock, Decimal::from(50));
    assert!(!mat.is_low_stock);

    // 3. Update raw material
    let updated_mat = raw_material_service::update(
        &db,
        mat.id,
        UpdateRawMaterialRequest {
            category_id: Some(cat.id),
            name: format!("Kertas Art Paper 260gr Premium {}", unique_suffix),
            variant: Some("A3+".to_string()),
            unit: Some("lembar".to_string()),
            min_stock_warning: Some(Decimal::from(30)),
        },
    )
    .await
    .expect("Update raw material");
    assert_eq!(updated_mat.min_stock_warning, Decimal::from(30));

    // 4. Record Mutation IN (+30)
    let mut_in = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::In,
            qty: Decimal::from(30),
            notes: Some("Restock supplier".to_string()),
        },
    )
    .await
    .expect("Record mutation IN");
    assert_eq!(mut_in.qty, Decimal::from(30));

    let mat_after_in = raw_material_service::get_by_id(&db, mat.id)
        .await
        .expect("Get material after IN");
    assert_eq!(mat_after_in.stock, Decimal::from(80)); // 50 + 30

    // 5. Record Mutation OUT (-65) -> Stock becomes 15 (which is <= min_stock_warning 30) -> is_low_stock = true
    let mut_out = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::Out,
            qty: Decimal::from(65),
            notes: Some("Produksi cetak undangan".to_string()),
        },
    )
    .await
    .expect("Record mutation OUT");
    assert_eq!(mut_out.qty, Decimal::from(65));

    let mat_after_out = raw_material_service::get_by_id(&db, mat.id)
        .await
        .expect("Get material after OUT");
    assert_eq!(mat_after_out.stock, Decimal::from(15));
    assert!(mat_after_out.is_low_stock);

    // 6. Test Mutation OUT exceeds stock -> should fail with Conflict error
    let excess_mut = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::Out,
            qty: Decimal::from(100), // Stock is only 15
            notes: Some("Over requested".to_string()),
        },
    )
    .await;
    assert!(excess_mut.is_err());

    // 7. List materials with low_stock filter
    let pagination = Pagination::default();
    let (low_stock_list, _) = raw_material_service::list(
        &db,
        &pagination,
        RawMaterialQuery {
            category_id: Some(cat.id),
            search: None,
            low_stock: Some(true),
        },
    )
    .await
    .expect("List low stock materials");
    assert!(low_stock_list.iter().any(|m| m.id == mat.id));

    // 8. List mutations history of material
    let (history, meta) = raw_material_service::list_mutations(&db, mat.id, &pagination)
        .await
        .expect("List mutations history");
    assert_eq!(meta.total, 2);
    assert_eq!(history.len(), 2);

    // 9. Cleanup
    raw_material_service::delete(&db, mat.id)
        .await
        .expect("Delete raw material");
    category_service::delete_raw_material_category(&db, cat.id)
        .await
        .expect("Delete category");
}
