use bcrypt::{DEFAULT_COST, hash, verify};

use crate::error::AppError;

/// Hash dummy agar waktu verifikasi tetap mirip saat username tidak ditemukan.
const DUMMY_HASH: &str = "$2b$12$KixkQxkQxkQxkQxkQxkQxeN1hQ8uQ8uQ8uQ8uQ8uQ8uQ8uQ8uQ8u";

pub fn hash_password(plain: &str) -> Result<String, AppError> {
    hash(plain, DEFAULT_COST).map_err(|err| {
        log::error!("Gagal hash password: {err}");
        AppError::Internal("Terjadi kesalahan pada server".into())
    })
}

pub fn verify_password(plain: &str, password_hash: &str) -> bool {
    verify(plain, password_hash).unwrap_or(false)
}

pub fn dummy_verify(plain: &str) {
    let _ = verify(plain, DUMMY_HASH);
}

pub fn validate_new_password(plain: &str) -> Result<(), AppError> {
    if plain.chars().count() < 8 {
        return Err(AppError::field(
            "password",
            "Password minimal 8 karakter",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify_password() {
        let password = "SecretPassword123";
        let hashed = hash_password(password).expect("hash harus berhasil");
        assert!(verify_password(password, &hashed));
        assert!(!verify_password("WrongPassword", &hashed));
    }

    #[test]
    fn test_password_length_validation() {
        assert!(validate_new_password("12345678").is_ok());
        assert!(validate_new_password("1234567").is_err());
    }
}
