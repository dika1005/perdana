use std::collections::HashMap;

use actix_web::http::StatusCode;
use actix_web::{HttpResponse, ResponseError};
use sea_orm::DbErr;
use serde::Serialize;
use thiserror::Error;
use validator::ValidationErrors;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{message}")]
    Validation {
        message: String,
        errors: HashMap<String, Vec<String>>,
    },
    #[error("{0}")]
    Unauthorized(String),
    #[error("{0}")]
    Forbidden(String),
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    Conflict(String),
    #[error("{0}")]
    ServiceUnavailable(String),
    #[error("{0}")]
    Internal(String),
}

#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub errors: HashMap<String, Vec<String>>,
}

impl AppError {
    pub fn validation(
        message: impl Into<String>,
        errors: HashMap<String, Vec<String>>,
    ) -> Self {
        Self::Validation {
            message: message.into(),
            errors,
        }
    }

    pub fn field(field: &str, message: impl Into<String>) -> Self {
        let mut errors = HashMap::new();
        errors.insert(field.to_string(), vec![message.into()]);
        Self::validation("Validasi gagal", errors)
    }

    pub fn unauthorized() -> Self {
        Self::Unauthorized("Token tidak valid atau sudah kedaluwarsa".into())
    }

    pub fn forbidden() -> Self {
        Self::Forbidden("Anda tidak punya akses ke resource ini".into())
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::NotFound(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    fn body(&self) -> ErrorBody {
        match self {
            Self::Validation { message, errors } => ErrorBody {
                success: false,
                message: message.clone(),
                errors: errors.clone(),
            },
            other => ErrorBody {
                success: false,
                message: other.to_string(),
                errors: HashMap::new(),
            },
        }
    }
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::Validation { .. } => StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::Forbidden(_) => StatusCode::FORBIDDEN,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(self.body())
    }
}

impl From<DbErr> for AppError {
    fn from(err: DbErr) -> Self {
        log::error!("Database error: {err}");
        Self::Internal("Terjadi kesalahan pada server".into())
    }
}

impl From<ValidationErrors> for AppError {
    fn from(errs: ValidationErrors) -> Self {
        let mut errors = HashMap::new();
        for (field, field_errors) in errs.field_errors() {
            let messages = field_errors
                .iter()
                .map(|error| {
                    error
                        .message
                        .clone()
                        .map(|message| message.to_string())
                        .unwrap_or_else(|| error.code.to_string())
                })
                .collect();
            errors.insert(field.to_string(), messages);
        }
        Self::validation("Validasi gagal", errors)
    }
}
