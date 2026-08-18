use backend::config::{self, AppConfig, SeedConfig};
use backend::dto::{
    CreateUserRequest, LoginRequest, Pagination, ResetPasswordRequest, UpdateUserRequest,
    UserQuery,
};
use backend::services::{auth as auth_service, users as user_service};
use entity::enums::UserRole;

#[tokio::test]
async fn test_auth_and_users_lifecycle() {
    let config = AppConfig::from_env();
    let db = config::connect_db(&config.database_url)
        .await
        .expect("Koneksi DB untuk testing gagal");

    // 1. Seed super admin
    let seed = SeedConfig {
        name: "Super Admin Test".to_string(),
        username: "test_superadmin".to_string(),
        password: "supersecretpassword123".to_string(),
    };
    auth_service::seed_super_admin(&db, &seed)
        .await
        .expect("Seed super admin harus berhasil");

    // 2. Login as Super Admin
    let login_req = LoginRequest {
        username: "test_superadmin".to_string(),
        password: "supersecretpassword123".to_string(),
    };
    let login_res = auth_service::login(&db, &config.jwt, login_req)
        .await
        .expect("Login super admin harus sukses");
    assert_eq!(login_res.user.username, "test_superadmin");
    assert_eq!(login_res.user.role, UserRole::SuperAdmin);
    assert!(!login_res.token.is_empty());
    assert!(!login_res.refresh_token.is_empty());

    let superadmin_id = login_res.user.id;

    // 3. Login with invalid password
    let wrong_login = LoginRequest {
        username: "test_superadmin".to_string(),
        password: "wrongpassword123".to_string(),
    };
    assert!(
        auth_service::login(&db, &config.jwt, wrong_login)
            .await
            .is_err()
    );

    // 4. Test GET /auth/me
    let me_res = auth_service::me(&db, superadmin_id)
        .await
        .expect("Me harus sukses");
    assert_eq!(me_res.id, superadmin_id);

    // 5. Test token refresh
    let refresh_res = auth_service::refresh(&db, &config.jwt, &login_res.refresh_token)
        .await
        .expect("Refresh token harus sukses");
    assert!(!refresh_res.token.is_empty());

    // 6. Super admin creates a new Cashier (Admin)
    let cashier_username = format!("kasir_{}", chrono::Utc::now().timestamp_millis());
    let create_cashier = CreateUserRequest {
        name: "Kasir Test".to_string(),
        username: cashier_username.clone(),
        password: "kasirpassword123".to_string(),
        role: UserRole::Admin,
    };
    let cashier = user_service::create(&db, create_cashier)
        .await
        .expect("Create kasir harus sukses");
    assert_eq!(cashier.role, UserRole::Admin);
    assert!(cashier.is_active);

    // 7. Cashier can log in
    let cashier_login = LoginRequest {
        username: cashier_username.clone(),
        password: "kasirpassword123".to_string(),
    };
    let cashier_auth = auth_service::login(&db, &config.jwt, cashier_login)
        .await
        .expect("Kasir login harus sukses");
    assert_eq!(cashier_auth.user.id, cashier.id);

    // 8. Super admin lists users (with search and role filter)
    let pagination = Pagination::default();
    let (users_list, meta) = user_service::list(
        &db,
        &pagination,
        UserQuery {
            search: Some(cashier_username.clone()),
            role: None,
        },
    )
    .await
    .expect("List user harus sukses");
    assert!(meta.total >= 1);
    assert!(users_list.iter().any(|u| u.id == cashier.id));

    // 9. Super admin updates cashier details
    let update_req = UpdateUserRequest {
        name: "Kasir Utama".to_string(),
        role: UserRole::Admin,
        is_active: Some(true),
    };
    let updated_cashier = user_service::update(&db, cashier.id, superadmin_id, update_req)
        .await
        .expect("Update kasir harus sukses");
    assert_eq!(updated_cashier.name, "Kasir Utama");

    // 10. Super admin resets cashier password
    let reset_req = ResetPasswordRequest {
        password: "newpassword123".to_string(),
    };
    user_service::reset_password(&db, cashier.id, reset_req)
        .await
        .expect("Reset password kasir harus sukses");

    // Old password should fail
    let old_pw_login = LoginRequest {
        username: cashier_username.clone(),
        password: "kasirpassword123".to_string(),
    };
    assert!(
        auth_service::login(&db, &config.jwt, old_pw_login)
            .await
            .is_err()
    );

    // New password should succeed
    let new_pw_login = LoginRequest {
        username: cashier_username.clone(),
        password: "newpassword123".to_string(),
    };
    let new_auth = auth_service::login(&db, &config.jwt, new_pw_login)
        .await
        .expect("Login dengan password baru harus sukses");
    assert_eq!(new_auth.user.id, cashier.id);

    // 11. Cannot deactivate own super admin account
    assert!(
        user_service::deactivate(&db, superadmin_id, superadmin_id)
            .await
            .is_err()
    );

    // 12. Super admin deactivates cashier
    user_service::deactivate(&db, cashier.id, superadmin_id)
        .await
        .expect("Deactivate kasir harus sukses");

    // Deactivated user cannot log in
    let deactivated_login = LoginRequest {
        username: cashier_username.clone(),
        password: "newpassword123".to_string(),
    };
    let deactivated_err = auth_service::login(&db, &config.jwt, deactivated_login).await;
    assert!(deactivated_err.is_err());

    // 13. Test Cookie Generation & Logout Clearance
    let access_cookie = backend::routes::auth::make_access_cookie("test_token", 3600);
    assert_eq!(access_cookie.name(), "access_token");
    assert_eq!(access_cookie.value(), "test_token");
    assert_eq!(access_cookie.http_only(), Some(true));
    assert_eq!(access_cookie.path(), Some("/"));

    let refresh_cookie = backend::routes::auth::make_refresh_cookie("test_refresh", 86400);
    assert_eq!(refresh_cookie.name(), "refresh_token");
    assert_eq!(refresh_cookie.http_only(), Some(true));

    let removal_cookie = backend::routes::auth::make_removal_cookie("access_token");
    assert_eq!(removal_cookie.value(), "");
    assert_eq!(removal_cookie.max_age(), Some(actix_web::cookie::time::Duration::ZERO));
}

