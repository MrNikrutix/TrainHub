use crate::db::DbPool;
use crate::engine::analysis; // Import engine
use crate::error::CommandError;
use crate::models::{AnalysisSession, Annotation};
use tauri::State;

#[tauri::command]
pub fn get_analysis_sessions(
    state: State<'_, DbPool>,
) -> Result<Vec<AnalysisSession>, CommandError> {
    let conn = state.get()?;
    analysis::get_sessions(&conn)
}

#[tauri::command]
pub fn create_analysis_session(
    state: State<'_, DbPool>,
    name: String,
    video_path: Option<String>,
) -> Result<AnalysisSession, CommandError> {
    let conn = state.get()?;
    analysis::create_session(&conn, &name, video_path)
}

#[tauri::command]
pub fn delete_analysis_session(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    analysis::delete_session(&conn, &id)
}

// --- Annotations ---

#[tauri::command]
pub fn get_annotations(
    state: State<'_, DbPool>,
    session_id: String,
) -> Result<Vec<Annotation>, CommandError> {
    let conn = state.get()?;
    analysis::get_annotations(&conn, &session_id)
}

#[tauri::command]
pub fn add_annotation(
    state: State<'_, DbPool>,
    session_id: String,
    start_time: f64,
    end_time: f64,
    name: String,
    description: String,
    color: String,
) -> Result<Annotation, CommandError> {
    let conn = state.get()?;
    analysis::add_annotation(
        &conn,
        &session_id,
        start_time,
        end_time,
        &name,
        &description,
        &color,
    )
}

#[tauri::command]
pub fn update_annotation(
    state: State<'_, DbPool>,
    annotation: Annotation,
) -> Result<(), CommandError> {
    let conn = state.get()?;
    analysis::update_annotation(&conn, &annotation)
}

#[tauri::command]
pub fn delete_annotation(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    analysis::delete_annotation(&conn, &id)
}

// --- Utils (Video Picker) ---

#[tauri::command]
pub async fn pick_video_file() -> Result<Option<String>, CommandError> {
    let file = rfd::AsyncFileDialog::new()
        .add_filter("Video", &["mp4", "mov", "avi", "mkv", "webm"])
        .pick_file()
        .await;

    match file {
        Some(f) => Ok(Some(f.path().to_string_lossy().to_string())),
        None => Ok(None),
    }
}
