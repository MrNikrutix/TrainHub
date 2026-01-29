use crate::db::DbPool;
use crate::engine::chat;
use crate::error::CommandError;
use crate::models::{ChatMessage, ChatSession};
use tauri::State;

#[tauri::command]
pub fn create_chat_session(
    state: State<'_, DbPool>,
    title: Option<String>,
) -> Result<ChatSession, CommandError> {
    let conn = state.get()?;
    chat::create_session(&conn, title)
}

#[tauri::command]
pub fn get_chat_sessions(state: State<'_, DbPool>) -> Result<Vec<ChatSession>, CommandError> {
    let conn = state.get()?;
    chat::get_sessions(&conn)
}

#[tauri::command]
pub fn update_chat_title(
    state: State<'_, DbPool>,
    id: String,
    title: String,
) -> Result<(), CommandError> {
    let conn = state.get()?;
    chat::update_title(&conn, &id, &title)
}

#[tauri::command]
pub fn delete_chat_session(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    chat::delete_session(&conn, &id)
}

#[tauri::command]
pub fn save_chat_message(
    state: State<'_, DbPool>,
    session_id: String,
    role: String,
    content: String,
) -> Result<ChatMessage, CommandError> {
    let conn = state.get()?;
    chat::save_message(&conn, &session_id, &role, &content)
}

#[tauri::command]
pub fn get_chat_history(
    state: State<'_, DbPool>,
    session_id: String,
) -> Result<Vec<ChatMessage>, CommandError> {
    let conn = state.get()?;
    chat::get_history(&conn, &session_id)
}
