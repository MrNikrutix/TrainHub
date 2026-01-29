use crate::error::CommandError;
use crate::models::{ChatMessage, ChatSession};
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn create_session(
    conn: &Connection,
    title: Option<String>,
) -> Result<ChatSession, CommandError> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Local::now().to_rfc3339();
    let title = title.unwrap_or_else(|| "Nowy czat".to_string());

    conn.execute(
        "INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, title, now, now],
    )?;

    Ok(ChatSession {
        id,
        title,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_sessions(conn: &Connection) -> Result<Vec<ChatSession>, CommandError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(ChatSession {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;

    let mut sessions = Vec::new();
    for r in rows {
        sessions.push(r?);
    }
    Ok(sessions)
}

pub fn update_title(conn: &Connection, id: &str, title: &str) -> Result<(), CommandError> {
    conn.execute(
        "UPDATE chat_sessions SET title = ?1 WHERE id = ?2",
        params![title, id],
    )?;
    Ok(())
}

pub fn delete_session(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM chat_sessions WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn save_message(
    conn: &Connection,
    session_id: &str,
    role: &str,
    content: &str,
) -> Result<ChatMessage, CommandError> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, session_id, role, content, now],
    )?;

    // Update session updated_at
    conn.execute(
        "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
        params![now, session_id],
    )?;

    Ok(ChatMessage {
        id,
        session_id: session_id.to_string(),
        role: role.to_string(),
        content: content.to_string(),
        created_at: now,
    })
}

pub fn get_history(conn: &Connection, session_id: &str) -> Result<Vec<ChatMessage>, CommandError> {
    let mut stmt = conn.prepare("SELECT id, session_id, role, content, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC")?;
    let rows = stmt.query_map(params![session_id], |row| {
        Ok(ChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    let mut messages = Vec::new();
    for r in rows {
        messages.push(r?);
    }
    Ok(messages)
}
