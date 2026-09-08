use backend::config::{self, AppConfig};
use backend::dto::{
    CategoryRequest, CreateMutationRequest, CreateRawMaterialRequest, Pagination,
    RawMaterialQuery, UpdateRawMaterialRequest, UpsertUomConversionRequest,
};
use backend::services::{categories as category_service, material_lots as material_lot_service, raw_materials as raw_material_service};
use entity::enums::MutationType;
use rust_decimal::Decimal;
use sea_orm::{ConnectionTrait, DbBackend, Statement};

/// ID user valid untuk kolom actor audit log (FK ke users).
async fn any_actor_id(
    db: &sea_orm::DatabaseConnection,
) -> i32 {
    let row = db
        .query_one(Statement::from_string(
            DbBackend::MySql,
            "SELECT id FROM users ORDER BY id LIMIT 1".to_string(),
        ))
        .await
        .expect("Query user")
        .expect("Minimal satu user harus ada untuk audit log");
    row.try_get::<i32>("", "id").expect("Kolom id user")
}

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
            package_unit: None,
            package_size: None,
            stock: Some(Decimal::from(50)),
            min_stock_warning: Some(Decimal::from(20)),
            standard_cost: None,
            roll_width: None,
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
            package_unit: None,
            package_size: None,
            min_stock_warning: Some(Decimal::from(30)),
            standard_cost: None,
            roll_width: None,
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
            unit: None,
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
            unit: None,
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
            unit: None,
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
    // Pembuatan stok awal juga merupakan pergerakan inventori yang harus dapat
    // diaudit, selain mutasi IN dan OUT yang dibuat pada test ini.
    assert_eq!(meta.total, 3);
    assert_eq!(history.len(), 3);

    // 9. Cleanup
    raw_material_service::delete(&db, mat.id)
        .await
        .expect("Delete raw material");
    category_service::delete_raw_material_category(&db, cat.id)
        .await
        .expect("Delete category");
}

/// Konversi satuan pada mutasi restock diproses di server (to_base_unit):
/// klien hanya mengirim qty kemasan + nama satuan. Pastikan juga upsert
/// konversi pada pasangan kemasan beli otomatis menyinkronkan package_size
/// sehingga tidak ada lagi dua sumber faktor yang berbeda.
#[tokio::test]
async fn test_mutation_with_uom_conversion() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    let mat = raw_material_service::create(
        &db,
        CreateRawMaterialRequest {
            category_id: None,
            name: format!("Amplop Uji Konversi {}", unique_suffix),
            variant: Some("Isi 100 / Box".to_string()),
            unit: Some("pcs".to_string()),
            package_unit: Some("box".to_string()),
            package_size: Some(Decimal::from(100)),
            stock: Some(Decimal::from(200)),
            min_stock_warning: Some(Decimal::from(50)),
            standard_cost: None,
            roll_width: None,
        },
    )
    .await
    .expect("Create raw material");

    // 1. Restock 3 box -> +300 pcs (konversi di server, bukan di klien).
    let mut_in = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::In,
            qty: Decimal::from(3),
            unit: Some("box".to_string()),
            notes: Some("Kulakan 3 box".to_string()),
        },
    )
    .await
    .expect("Mutation IN with package unit");
    assert_eq!(mut_in.qty, Decimal::from(300));

    let after_in = raw_material_service::get_by_id(&db, mat.id)
        .await
        .expect("Get material after IN");
    assert_eq!(after_in.stock, Decimal::from(500)); // 200 + 300

    // 2. Satuan dasar tetap diterima tanpa konversi.
    raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::Out,
            qty: Decimal::from(100),
            unit: Some("pcs".to_string()),
            notes: None,
        },
    )
    .await
    .expect("Mutation OUT with base unit");
    let after_out = raw_material_service::get_by_id(&db, mat.id)
        .await
        .expect("Get material after OUT");
    assert_eq!(after_out.stock, Decimal::from(400));

    // 3. Satuan yang tidak dikenal ditolak dengan pesan yang menjelaskan
    //    daftar satuan yang valid.
    let unknown_unit = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::In,
            qty: Decimal::from(1),
            unit: Some("dus".to_string()),
            notes: None,
        },
    )
    .await;
    assert!(unknown_unit.is_err());

    // 4. Upsert konversi pada pasangan kemasan beli (box -> pcs) harus
    //    menyinkronkan package_size master dalam transaksi yang sama.
    material_lot_service::upsert_uom_conversion_as(
        &db,
        any_actor_id(&db).await,
        mat.id,
        UpsertUomConversionRequest {
            from_unit: "box".to_string(),
            to_unit: "pcs".to_string(),
            factor: Decimal::from(150),
            notes: None,
        },
    )
    .await
    .expect("Upsert UOM conversion");

    let synced = raw_material_service::get_by_id(&db, mat.id)
        .await
        .expect("Get material after UOM sync");
    assert_eq!(synced.package_size, Some(Decimal::from(150)));

    // 5. Konversi tersimpan dapat dibaca kembali (modal UOM tidak menebak).
    let conversions = material_lot_service::list_uom_conversions(&db, mat.id)
        .await
        .expect("List UOM conversions");
    assert!(conversions
        .iter()
        .any(|c| c.from_unit == "box" && c.to_unit == "pcs" && c.factor == Decimal::from(150)));

    // 6. Mutasi berikutnya memakai faktor baru: 2 box = 300 pcs.
    let mut_in_new = raw_material_service::create_mutation(
        &db,
        CreateMutationRequest {
            raw_material_id: mat.id,
            mutation_type: MutationType::In,
            qty: Decimal::from(2),
            unit: Some("box".to_string()),
            notes: None,
        },
    )
    .await
    .expect("Mutation IN with updated factor");
    assert_eq!(mut_in_new.qty, Decimal::from(300));

    raw_material_service::delete(&db, mat.id)
        .await
        .expect("Delete raw material");
}
