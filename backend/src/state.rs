use sqlx::PgPool;

#[derive(Clone, Debug, Default)]
pub struct AppState {
    pub pool: Option<PgPool>,
}

impl AppState {
    pub fn new(pool: Option<PgPool>) -> Self {
        Self { pool }
    }
}
