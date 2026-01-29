use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::fs;
use tauri::{AppHandle, Manager};

use crate::error::CommandError;

pub type DbPool = Pool<SqliteConnectionManager>;

pub fn init_db(app_handle: &AppHandle) -> Result<DbPool, CommandError> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::Internal(e.to_string()))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    let db_path = app_dir.join("trainhub.db");
    println!("Database path: {:?}", db_path);
    let manager = SqliteConnectionManager::file(&db_path);
    let pool = Pool::new(manager)?;

    let conn = pool.get()?;

    // PRAGMA settings for performance/integrity
    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    // WAL mode removed to ensure data persistence stability in dev environment

    // --- Migrations ---
    // In a real app, use a migration tool like `refinery` or `sqlx`.
    // For now, we keep the idempotent "CREATE TABLE IF NOT EXISTS" approach.

    conn.execute(
        "CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            instructions TEXT,
            enrichment TEXT,
            tags TEXT,
            video_url TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS training_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sections TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS programs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS program_weeks (
            id TEXT PRIMARY KEY,
            program_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            notes TEXT,
            FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS program_workouts (
            id TEXT PRIMARY KEY,
            week_id TEXT NOT NULL,
            program_id TEXT NOT NULL,
            day TEXT NOT NULL,
            type TEXT NOT NULL,
            ref_id TEXT,
            name TEXT,
            description TEXT,
            completed BOOLEAN DEFAULT 0,
            FOREIGN KEY(week_id) REFERENCES program_weeks(id) ON DELETE CASCADE,
            FOREIGN KEY(program_id) REFERENCES programs(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS analysis_sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            video_path TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            name TEXT,
            description TEXT,
            color TEXT,
            FOREIGN KEY(session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS flashcard_sets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            set_id TEXT,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Primitive Migration: Check if column exists, if not ignore error or handle gracefully
    // Since sqlite doesn't support IF NOT EXISTS for columns easily without logic:
    // We try to add it, if it fails (duplicate column), we ignore.
    let _ = conn.execute("ALTER TABLE flashcards ADD COLUMN set_id TEXT", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(pool)
}
