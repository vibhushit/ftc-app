use sqlx::PgPool;
use std::sync::{Arc, RwLock};
use crate::models::creator::Creator;

#[derive(Clone, Debug, Default)]
pub struct AppState {
    pub pool: Option<PgPool>,
    pub memory_creators: Arc<RwLock<Vec<Creator>>>,
}

impl AppState {
    pub fn new(pool: Option<PgPool>) -> Self {
        Self {
            pool,
            memory_creators: Arc::new(RwLock::new(Vec::new())),
        }
    }
}
