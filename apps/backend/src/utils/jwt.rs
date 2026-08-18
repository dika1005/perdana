use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

const ACCESS_TYPE: &str = "access";
const REFRESH_TYPE: &str = "refresh";

#[derive(Debug, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub access_ttl_secs: i64,
    pub refresh_ttl_secs: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub typ: String,
    pub exp: i64,
    pub iat: i64,
}

impl Claims {
    pub fn user_id(&self) -> Result<i32, AppError> {
        self.sub
            .parse()
            .map_err(|_| AppError::unauthorized())
    }
}

impl JwtConfig {
    pub fn issue_access(&self, user_id: i32, role: &str) -> Result<(String, chrono::DateTime<Utc>), AppError> {
        self.issue(user_id, role, ACCESS_TYPE, self.access_ttl_secs)
    }

    pub fn issue_refresh(&self, user_id: i32, role: &str) -> Result<String, AppError> {
        self.issue(user_id, role, REFRESH_TYPE, self.refresh_ttl_secs)
            .map(|(token, _)| token)
    }

    pub fn decode_access(&self, token: &str) -> Result<Claims, AppError> {
        let claims = self.decode(token)?;
        if claims.typ != ACCESS_TYPE {
            return Err(AppError::unauthorized());
        }
        Ok(claims)
    }

    pub fn decode_refresh(&self, token: &str) -> Result<Claims, AppError> {
        let claims = self.decode(token)?;
        if claims.typ != REFRESH_TYPE {
            return Err(AppError::unauthorized());
        }
        Ok(claims)
    }

    fn issue(
        &self,
        user_id: i32,
        role: &str,
        typ: &str,
        ttl_secs: i64,
    ) -> Result<(String, chrono::DateTime<Utc>), AppError> {
        let now = Utc::now();
        let expires_at = now + Duration::seconds(ttl_secs);
        let claims = Claims {
            sub: user_id.to_string(),
            role: role.to_string(),
            typ: typ.to_string(),
            iat: now.timestamp(),
            exp: expires_at.timestamp(),
        };
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|err| {
            log::error!("Gagal membuat JWT: {err}");
            AppError::Internal("Terjadi kesalahan pada server".into())
        })?;
        Ok((token, expires_at))
    }

    fn decode(&self, token: &str) -> Result<Claims, AppError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|_| AppError::unauthorized())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_jwt_config() -> JwtConfig {
        JwtConfig {
            secret: "test_secret_must_be_at_least_32_characters_long_123".to_string(),
            access_ttl_secs: 3600,
            refresh_ttl_secs: 86400,
        }
    }

    #[test]
    fn test_issue_and_decode_access_token() {
        let config = test_jwt_config();
        let (token, _expires_at) = config.issue_access(42, "SUPER_ADMIN").expect("issue access token");
        let claims = config.decode_access(&token).expect("decode access token");
        assert_eq!(claims.user_id().unwrap(), 42);
        assert_eq!(claims.role, "SUPER_ADMIN");
        assert_eq!(claims.typ, "access");

        // Refresh decoder should reject access token
        assert!(config.decode_refresh(&token).is_err());
    }

    #[test]
    fn test_issue_and_decode_refresh_token() {
        let config = test_jwt_config();
        let refresh_token = config.issue_refresh(99, "ADMIN").expect("issue refresh token");
        let claims = config.decode_refresh(&refresh_token).expect("decode refresh token");
        assert_eq!(claims.user_id().unwrap(), 99);
        assert_eq!(claims.role, "ADMIN");
        assert_eq!(claims.typ, "refresh");

        // Access decoder should reject refresh token
        assert!(config.decode_access(&refresh_token).is_err());
    }
}
