use actix_web::ResponseError;
use actix_web::error::InternalError;
use actix_web::web::JsonConfig;

use crate::error::AppError;

pub fn json_config() -> JsonConfig {
    JsonConfig::default().error_handler(|err, _req| {
        let message = format!("Body JSON tidak valid: {err}");
        let response = AppError::field("body", message).error_response();
        InternalError::from_response(err, response).into()
    })
}
