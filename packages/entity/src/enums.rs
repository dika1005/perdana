use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "role")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    #[sea_orm(string_value = "SUPER_ADMIN")]
    #[serde(alias = "super_admin", alias = "SuperAdmin", alias = "SUPERADMIN")]
    SuperAdmin,
    #[sea_orm(string_value = "ADMIN")]
    #[serde(alias = "admin", alias = "Admin")]
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
        match value.trim().to_uppercase().as_str() {
            "SUPER_ADMIN" | "SUPERADMIN" => Some(Self::SuperAdmin),
            "ADMIN" => Some(Self::Admin),
            _ => None,
        }
    }

    pub fn is_super_admin(&self) -> bool {
        matches!(self, Self::SuperAdmin)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "type")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MutationType {
    #[sea_orm(string_value = "IN")]
    #[serde(alias = "in", alias = "In")]
    In,
    #[sea_orm(string_value = "OUT")]
    #[serde(alias = "out", alias = "Out")]
    Out,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "price_type")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PriceType {
    #[sea_orm(string_value = "FIXED")]
    #[serde(alias = "fixed", alias = "Fixed")]
    Fixed,
    #[sea_orm(string_value = "RANGE")]
    #[serde(alias = "range", alias = "Range")]
    Range,
    #[sea_orm(string_value = "CUSTOM")]
    #[serde(alias = "custom", alias = "Custom")]
    Custom,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "variant_price_type")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RangePriceType {
    #[sea_orm(string_value = "FIXED")]
    #[serde(alias = "fixed", alias = "Fixed")]
    Fixed,
    #[sea_orm(string_value = "RANGE")]
    #[serde(alias = "range", alias = "Range")]
    Range,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "payment_status")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PaymentStatus {
    #[sea_orm(string_value = "PAID")]
    #[serde(alias = "paid", alias = "Paid")]
    Paid,
    #[sea_orm(string_value = "DP")]
    #[serde(alias = "dp", alias = "Dp")]
    Dp,
    #[sea_orm(string_value = "UNPAID")]
    #[serde(alias = "unpaid", alias = "Unpaid")]
    Unpaid,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "order_status")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderStatus {
    #[sea_orm(string_value = "ANTRIAN")]
    #[serde(alias = "antrian", alias = "Antrian")]
    Antrian,
    #[sea_orm(string_value = "PROSES")]
    #[serde(alias = "proses", alias = "Proses")]
    Proses,
    #[sea_orm(string_value = "SELESAI")]
    #[serde(alias = "selesai", alias = "Selesai")]
    Selesai,
    #[sea_orm(string_value = "DIAMBIL")]
    #[serde(alias = "diambil", alias = "Diambil")]
    Diambil,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "expense_category")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExpenseCategory {
    #[sea_orm(string_value = "BAHAN_BAKU")]
    #[serde(alias = "bahan_baku", alias = "BahanBaku")]
    BahanBaku,
    #[sea_orm(string_value = "OPERASIONAL")]
    #[serde(alias = "operasional", alias = "Operasional")]
    Operasional,
    #[sea_orm(string_value = "MAINTENANCE")]
    #[serde(alias = "maintenance", alias = "Maintenance")]
    Maintenance,
    #[sea_orm(string_value = "GAJI")]
    #[serde(alias = "gaji", alias = "Gaji")]
    Gaji,
    #[sea_orm(string_value = "LAINNYA")]
    #[serde(alias = "lainnya", alias = "Lainnya")]
    Lainnya,
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "expense_payment_method")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExpensePaymentMethod {
    #[sea_orm(string_value = "CASH")]
    #[serde(alias = "cash", alias = "Cash")]
    Cash,
    #[sea_orm(string_value = "TRANSFER")]
    #[serde(alias = "transfer", alias = "Transfer")]
    Transfer,
}

