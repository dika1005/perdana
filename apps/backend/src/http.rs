use actix_web::ResponseError;
use actix_web::error::InternalError;
use actix_web::web::JsonConfig;

use crate::error::AppError;

pub fn json_config() -> JsonConfig {
    JsonConfig::default().error_handler(|err, _req| {
        let response = AppError::field("body", "Body JSON tidak valid").error_response();
        InternalError::from_response(err, response).into()
    })
}
