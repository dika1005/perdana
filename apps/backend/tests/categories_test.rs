use backend::config::{self, AppConfig};
use backend::dto::{CategoryQuery, CategoryRequest};
use backend::services::categories as category_service;

#[tokio::test]
async fn test_categories_crud() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Create Product Category
    let p_cat_name = format!("Kategori Produk {}", unique_suffix);
    let created_p_cat = category_service::create_product_category(
        &db,
        CategoryRequest {
            name: p_cat_name.clone(),
        },
    )
    .await
    .expect("Create product category");
    assert_eq!(created_p_cat.name, p_cat_name);

    // 2. Get Product Category
    let fetched_p_cat = category_service::get_product_category(&db, created_p_cat.id)
        .await
        .expect("Get product category");
    assert_eq!(fetched_p_cat.id, created_p_cat.id);

    // 3. Update Product Category
    let updated_p_cat_name = format!("Kategori Produk Updated {}", unique_suffix);
    let updated_p_cat = category_service::update_product_category(
        &db,
        created_p_cat.id,
        CategoryRequest {
            name: updated_p_cat_name.clone(),
        },
    )
    .await
    .expect("Update product category");
    assert_eq!(updated_p_cat.name, updated_p_cat_name);

    // 4. List Product Category with search
    let list_p_cat = category_service::list_product_categories(
        &db,
        CategoryQuery {
            search: Some(format!("{}", unique_suffix)),
        },
    )
    .await
    .expect("List product categories");
    assert!(!list_p_cat.is_empty());

    // 5. Delete Product Category
    category_service::delete_product_category(&db, created_p_cat.id)
        .await
        .expect("Delete product category");
    assert!(
        category_service::get_product_category(&db, created_p_cat.id)
            .await
            .is_err()
    );

    // 6. Create Raw Material Category
    let rm_cat_name = format!("Kategori Bahan {}", unique_suffix);
    let created_rm_cat = category_service::create_raw_material_category(
        &db,
        CategoryRequest {
            name: rm_cat_name.clone(),
        },
    )
    .await
    .expect("Create raw material category");
    assert_eq!(created_rm_cat.name, rm_cat_name);

    // 7. Update Raw Material Category
    let updated_rm_cat_name = format!("Kategori Bahan Updated {}", unique_suffix);
    let updated_rm_cat = category_service::update_raw_material_category(
        &db,
        created_rm_cat.id,
        CategoryRequest {
            name: updated_rm_cat_name.clone(),
        },
    )
    .await
    .expect("Update raw material category");
    assert_eq!(updated_rm_cat.name, updated_rm_cat_name);

    // 8. Delete Raw Material Category
    category_service::delete_raw_material_category(&db, created_rm_cat.id)
        .await
        .expect("Delete raw material category");
    assert!(
        category_service::get_raw_material_category(&db, created_rm_cat.id)
            .await
            .is_err()
    );
}
