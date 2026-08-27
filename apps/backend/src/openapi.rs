use utoipa::openapi::security::{ApiKey, ApiKeyValue, HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

use crate::dto::*;
use crate::routes;
use entity::enums::*;

#[derive(OpenApi)]
#[openapi(
    paths(
        routes::health::health_check,
        routes::auth::login,
        routes::auth::refresh,
        routes::auth::logout,
        routes::auth::me,
        routes::users::list,
        routes::users::get,
        routes::users::create,
        routes::users::update,
        routes::users::reset_password,
        routes::users::delete,
        routes::categories::list_product_categories,
        routes::categories::get_product_category,
        routes::categories::create_product_category,
        routes::categories::update_product_category,
        routes::categories::delete_product_category,
        routes::categories::list_raw_material_categories,
        routes::categories::get_raw_material_category,
        routes::categories::create_raw_material_category,
        routes::categories::update_raw_material_category,
        routes::categories::delete_raw_material_category,
        routes::products::list,
        routes::products::get,
        routes::products::create,
        routes::products::update,
        routes::products::delete,
        routes::products::list_variants,
        routes::products::create_variant,
        routes::products::update_variant,
        routes::products::delete_variant,
        routes::addons::list,
        routes::addons::get,
        routes::addons::create,
        routes::addons::update,
        routes::addons::delete,
        routes::raw_materials::list,
        routes::raw_materials::get,
        routes::raw_materials::create,
        routes::raw_materials::update,
        routes::raw_materials::delete,
        routes::raw_materials::create_mutation,
        routes::raw_materials::list_mutations,
        routes::customers::list,
        routes::customers::get,
        routes::customers::create,
        routes::customers::update,
        routes::customers::delete,
        routes::customers::list_transactions,
        routes::transactions::list,
        routes::transactions::get,
        routes::transactions::create,
        routes::transactions::update_status,
        routes::transactions::update_payment,
        routes::transactions::get_invoice,
        routes::reports::summary,
        routes::reports::daily_sales,
        routes::reports::top_products,
        routes::reports::inventory_mutations,
        routes::reports::receivables,
        routes::reports::low_stock,
        routes::ai::parse_order,
        routes::expenses::list,
        routes::expenses::summary,
        routes::expenses::get,
        routes::expenses::create,
        routes::expenses::update,
        routes::expenses::delete,
    ),
    components(
        schemas(
            UserRole, MutationType, PriceType, RangePriceType, PaymentStatus, PaymentMethod, OrderStatus,
            ExpenseCategory, ExpensePaymentMethod,
            PaginationMeta, PaginationQuery, MessageData, HealthData,
            LoginRequest, RefreshRequest, PublicUser, LoginData, RefreshData,
            CreateUserRequest, UpdateUserRequest, ResetPasswordRequest, UserQuery,
            CategoryRequest, CategoryResponse, CategoryQuery,
            CreateProductRequest, UpdateProductRequest, ProductQuery, ProductResponse,
            CreateVariantRequest, UpdateVariantRequest, ProductVariantResponse,
            CreateAddonRequest, UpdateAddonRequest, AddonQuery, AddonResponse,
            CreateRawMaterialRequest, UpdateRawMaterialRequest, RawMaterialQuery, RawMaterialResponse,
            CreateMutationRequest, MutationResponse,
            CreateCustomerRequest, UpdateCustomerRequest, CustomerQuery, CustomerResponse,
            TransactionAddonInput, TransactionItemInput, CreateTransactionRequest, TransactionQuery,
            UpdateOrderStatusRequest, UpdatePaymentRequest,
            TransactionItemAddonResponse, TransactionItemResponse, TransactionResponse, InvoicePrintData,
            ReportDateQuery, DashboardSummaryResponse, DailySalesReportItem, TopProductReportItem,
            InventoryMutationReportItem, ReceivableItem, LowStockItem,
            ParseOrderRequest, ParseOrderResponse, ParsedOrderItem,
            CreateExpenseRequest, UpdateExpenseRequest, ExpenseQuery, ExpenseResponse,
            ExpenseCategoryBreakdown, ExpenseSummaryResponse,
        )
    ),

    modifiers(&SecurityAddon),
    info(
        title = "Perdana Percetakan POS & Inventory API",
        version = "1.0.0",
        description = "Dokumentasi OpenAPI & Swagger UI interaktif untuk sistem kasir POS, katalog produk percetakan, manajemen inventaris bahan baku, mutasi stok, dan analytics laporan keuangan.",
        contact(
            name = "Perdana IT Team",
            email = "support@perdana.com"
        )
    ),
    tags(
        (name = "Auth", description = "Autentikasi JWT & HttpOnly Cookie Management"),
        (name = "Users", description = "Manajemen Pengguna & Hak Akses (Super Admin only)"),
        (name = "Product Categories", description = "Kategori Katalog Jasa Cetak"),
        (name = "Raw Material Categories", description = "Kategori Master Bahan Baku Inventaris"),
        (name = "Products", description = "Master Produk Cetak (Fixed, Range, Custom Price)"),
        (name = "Product Variants", description = "Varian Produk Cetak"),
        (name = "Addons", description = "Master Add-ons / Finishing Cetak"),
        (name = "Inventory / Raw Materials", description = "Stok Bahan Baku & Mutasi In/Out"),
        (name = "Customers", description = "Data Pelanggan Percetakan"),
        (name = "POS Transactions", description = "Kasir, Checkout Atomik, DP, Order Tracking, dan Invoice"),
        (name = "Reports & Analytics", description = "Laporan Omset, Piutang, Grafik Penjualan, Top Produk, & Mutasi Bahan"),
        (name = "AI Features", description = "Google AI Studio / Gemini Smart Order Parser"),
        (name = "Health", description = "Health check status server dan database")
    )
)]
pub struct ApiDoc;


struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .description(Some("Masukkan JWT Access Token: `Bearer <token>`"))
                        .build(),
                ),
            );
            components.add_security_scheme(
                "cookie_auth",
                SecurityScheme::ApiKey(
                    ApiKey::Cookie(
                        ApiKeyValue::new("access_token")
                    )
                )
            );
        }
    }
}
