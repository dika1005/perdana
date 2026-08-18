use sea_orm::{DatabaseConnection, DbErr, EntityTrait, PaginatorTrait, Select};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

const DEFAULT_PAGE: u64 = 1;
const DEFAULT_PER_PAGE: u64 = 20;
const MAX_PER_PAGE: u64 = 100;

#[derive(Debug, Clone, Copy, Deserialize, ToSchema)]
pub struct PaginationQuery {
    pub page: Option<u64>,
    pub per_page: Option<u64>,
}

#[derive(Debug, Clone, Copy)]
pub struct Pagination {
    pub page: u64,
    pub per_page: u64,
}

impl PaginationQuery {
    pub fn sanitize(self) -> Pagination {
        Pagination {
            page: self.page.unwrap_or(DEFAULT_PAGE).max(1),
            per_page: self.per_page.unwrap_or(DEFAULT_PER_PAGE).clamp(1, MAX_PER_PAGE),
        }
    }
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            page: DEFAULT_PAGE,
            per_page: DEFAULT_PER_PAGE,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, ToSchema)]
pub struct PaginationMeta {
    pub page: u64,
    pub per_page: u64,
    pub total: u64,
}

impl Pagination {
    pub fn meta(&self, total: u64) -> PaginationMeta {
        PaginationMeta {
            page: self.page,
            per_page: self.per_page,
            total,
        }
    }

    pub async fn fetch<E>(
        &self,
        select: Select<E>,
        db: &DatabaseConnection,
    ) -> Result<(Vec<E::Model>, PaginationMeta), DbErr>
    where
        E: EntityTrait,
        E::Model: Sync + Send,
    {
        let paginator = select.paginate(db, self.per_page);
        let total = paginator.num_items().await?;
        let items = paginator.fetch_page(self.page.saturating_sub(1)).await?;
        Ok((items, self.meta(total)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_defaults_and_clamping() {
        let query = PaginationQuery {
            page: None,
            per_page: None,
        };
        let p = query.sanitize();
        assert_eq!(p.page, 1);
        assert_eq!(p.per_page, 20);

        let query_custom = PaginationQuery {
            page: Some(0),
            per_page: Some(500),
        };
        let p2 = query_custom.sanitize();
        assert_eq!(p2.page, 1);
        assert_eq!(p2.per_page, 100);

        let meta = p.meta(45);
        assert_eq!(meta.page, 1);
        assert_eq!(meta.per_page, 20);
        assert_eq!(meta.total, 45);
    }
}
