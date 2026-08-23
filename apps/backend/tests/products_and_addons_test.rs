use backend::config::{self, AppConfig};
use backend::dto::{
    AddonQuery, CategoryRequest, CreateAddonRequest, CreateProductRequest, CreateVariantRequest,
    Pagination, ProductQuery, UpdateAddonRequest, UpdateVariantRequest,
};
use backend::services::{
    addons as addon_service, categories as category_service, products as product_service,
};
use entity::enums::{PriceType, RangePriceType};
use rust_decimal::Decimal;

#[tokio::test]
async fn test_products_variants_and_addons_lifecycle() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB gagal");

    let unique_suffix = chrono::Utc::now().timestamp_micros();

    // 1. Create a category for the product
    let cat = category_service::create_product_category(
        &db,
        CategoryRequest {
            name: format!("Kategori Test {}", unique_suffix),
        },
    )
    .await
    .expect("Create category");

    // 2. Create a FIXED price product (e.g. Amplop Polos)
    let prod_fixed = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(cat.id),
            name: format!("Amplop Polos {}", unique_suffix),
            price_type: PriceType::Fixed,
            default_price: Some(Decimal::from(20000)),
            min_price: None,
            max_price: None,
            min_order: Some(1),
            unit_name: Some("pack".to_string()),
            has_variants: Some(false),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create fixed price product");
    assert_eq!(prod_fixed.default_price, Decimal::from(20000));
    assert!(!prod_fixed.has_variants);

    // 3. Create a RANGE price product with variants (e.g. Buku Yasin)
    let prod_range = product_service::create(
        &db,
        CreateProductRequest {
            category_id: Some(cat.id),
            name: format!("Buku Yasin {}", unique_suffix),
            price_type: PriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(10000)),
            max_price: Some(Decimal::from(50000)),
            min_order: Some(20),
            unit_name: Some("buku".to_string()),
            has_variants: Some(true),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create range price product");
    assert_eq!(prod_range.min_order, 20);

    // 4. Add Variants to the product
    let var1 = product_service::create_variant(
        &db,
        prod_range.id,
        CreateVariantRequest {
            variant_name: "128 Halaman Soft Cover".to_string(),
            price_type: RangePriceType::Fixed,
            price: Some(Decimal::from(12000)),
            min_price: None,
            max_price: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create variant 1");
    assert_eq!(var1.price, Decimal::from(12000));

    let var2 = product_service::create_variant(
        &db,
        prod_range.id,
        CreateVariantRequest {
            variant_name: "176 Halaman Hard Cover".to_string(),
            price_type: RangePriceType::Range,
            price: None,
            min_price: Some(Decimal::from(25000)),
            max_price: Some(Decimal::from(35000)),
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Create variant 2");
    assert_eq!(var2.min_price, Decimal::from(25000));

    // 5. List variants of the product
    let vars = product_service::list_variants(&db, prod_range.id)
        .await
        .expect("List variants");
    assert_eq!(vars.len(), 2);

    // 6. Update variant
    let updated_var1 = product_service::update_variant(
        &db,
        var1.id,
        UpdateVariantRequest {
            variant_name: "128 Halaman Soft Cover Updated".to_string(),
            price_type: RangePriceType::Fixed,
            price: Some(Decimal::from(13500)),
            min_price: None,
            max_price: None,
            raw_material_id: None,
            material_amount: None,
        },
    )
    .await
    .expect("Update variant");
    assert_eq!(updated_var1.price, Decimal::from(13500));

    // 7. Get Product with variants eagerly loaded
    let fetched_prod = product_service::get_by_id(&db, prod_range.id)
        .await
        .expect("Get product by id");
    assert!(fetched_prod.has_variants);
    assert_eq!(fetched_prod.variants.as_ref().unwrap().len(), 2);

    // 8. List products with category_id and search filter
    let pagination = Pagination::default();
    let (list_res, meta) = product_service::list(
        &db,
        &pagination,
        ProductQuery {
            category_id: Some(cat.id),
            search: Some(format!("{}", unique_suffix)),
        },
    )
    .await
    .expect("List products");
    assert_eq!(meta.total, 2);
    assert_eq!(list_res.len(), 2);

    // 9. Create Add-ons (Fixed and Range)
    let addon_fixed = addon_service::create(
        &db,
        CreateAddonRequest {
            name: format!("Pita Pembatas {}", unique_suffix),
            category_id: Some(cat.id),
            price_type: RangePriceType::Fixed,
            default_price: Some(Decimal::from(1000)),
            min_price: None,
            max_price: None,
        },
    )
    .await
    .expect("Create fixed addon");
    assert_eq!(addon_fixed.default_price, Decimal::from(1000));
    assert_eq!(addon_fixed.category_id, Some(cat.id));

    let addon_range = addon_service::create(
        &db,
        CreateAddonRequest {
            name: format!("Finishing Cutting {}", unique_suffix),
            category_id: None,
            price_type: RangePriceType::Range,
            default_price: None,
            min_price: Some(Decimal::from(5000)),
            max_price: Some(Decimal::from(15000)),
        },
    )
    .await
    .expect("Create range addon");
    assert_eq!(addon_range.max_price, Decimal::from(15000));

    // 10. Update Add-on
    let updated_addon = addon_service::update(
        &db,
        addon_fixed.id,
        UpdateAddonRequest {
            name: format!("Pita Emas {}", unique_suffix),
            category_id: Some(cat.id),
            price_type: RangePriceType::Fixed,
            default_price: Some(Decimal::from(1500)),
            min_price: None,
            max_price: None,
        },
    )
    .await
    .expect("Update addon");
    assert_eq!(updated_addon.default_price, Decimal::from(1500));

    // 11. List Add-ons
    let (addons_list, _) = addon_service::list(
        &db,
        &pagination,
        AddonQuery {
            search: Some(format!("{}", unique_suffix)),
            category_id: None,
        },
    )
    .await
    .expect("List addons");
    assert_eq!(addons_list.len(), 2);

    // 12. Delete variant and product cleanup
    product_service::delete_variant(&db, var1.id)
        .await
        .expect("Delete variant 1");
    product_service::delete_variant(&db, var2.id)
        .await
        .expect("Delete variant 2");

    let prod_after_var_del = product_service::get_by_id(&db, prod_range.id)
        .await
        .expect("Get product after all variants deleted");
    assert!(!prod_after_var_del.has_variants);

    product_service::delete(&db, prod_range.id)
        .await
        .expect("Delete product");
    product_service::delete(&db, prod_fixed.id)
        .await
        .expect("Delete product fixed");
    addon_service::delete(&db, addon_fixed.id)
        .await
        .expect("Delete addon fixed");
    addon_service::delete(&db, addon_range.id)
        .await
        .expect("Delete addon range");
    category_service::delete_product_category(&db, cat.id)
        .await
        .expect("Delete category");
}
