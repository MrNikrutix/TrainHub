use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CommandError {
    #[error("Database error: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("Pool error: {0}")]
    Pool(#[from] r2d2::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Helper to convert generic strings to CommandError
impl From<String> for CommandError {
    fn from(s: String) -> Self {
        CommandError::Internal(s)
    }
}
