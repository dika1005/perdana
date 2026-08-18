use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "role")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    #[sea_orm(string_value = "SUPER_ADMIN")]
    SuperAdmin,
    #[sea_orm(string_value = "ADMIN")]
    Admin,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::SuperAdmin => "SUPER_ADMIN",
            Self::Admin => "ADMIN",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "SUPER_ADMIN" => Some(Self::SuperAdmin),
            "ADMIN" => Some(Self::Admin),
            _ => None,
        }
    }

    pub fn is_super_admin(&self) -> bool {
        matches!(self, Self::SuperAdmin)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "type")]
pub enum MutationType {
    #[sea_orm(string_value = "IN")]
    In,
    #[sea_orm(string_value = "OUT")]
    Out,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "price_type")]
pub enum PriceType {
    #[sea_orm(string_value = "FIXED")]
    Fixed,
    #[sea_orm(string_value = "RANGE")]
    Range,
    #[sea_orm(string_value = "CUSTOM")]
    Custom,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "variant_price_type")]
pub enum RangePriceType {
    #[sea_orm(string_value = "FIXED")]
    Fixed,
    #[sea_orm(string_value = "RANGE")]
    Range,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "payment_status")]
pub enum PaymentStatus {
    #[sea_orm(string_value = "PAID")]
    Paid,
    #[sea_orm(string_value = "DP")]
    Dp,
    #[sea_orm(string_value = "UNPAID")]
    Unpaid,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "order_status")]
pub enum OrderStatus {
    #[sea_orm(string_value = "ANTRIAN")]
    Antrian,
    #[sea_orm(string_value = "PROSES")]
    Proses,
    #[sea_orm(string_value = "SELESAI")]
    Selesai,
    #[sea_orm(string_value = "DIAMBIL")]
    Diambil,
}
