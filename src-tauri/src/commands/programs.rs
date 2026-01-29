use crate::db::DbPool;
use crate::engine::programs; // Import engine
use crate::error::CommandError;
use crate::models::{Program, Week, Workout};
use tauri::State;

// --- Programs ---

#[tauri::command]
pub fn get_programs(state: State<'_, DbPool>) -> Result<Vec<Program>, CommandError> {
    let conn = state.get()?;
    programs::get_programs(&conn)
}

#[tauri::command]
pub fn create_program(state: State<'_, DbPool>, name: String) -> Result<Program, CommandError> {
    let conn = state.get()?;
    programs::create_program(&conn, &name)
}

#[tauri::command]
pub fn delete_program(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    programs::delete_program(&conn, &id)
}

#[tauri::command]
pub fn duplicate_program(state: State<'_, DbPool>, id: String) -> Result<Program, CommandError> {
    let mut conn = state.get()?;
    programs::duplicate_program(&mut conn, &id)
}

// --- Weeks ---

#[tauri::command]
pub fn get_weeks(state: State<'_, DbPool>, program_id: String) -> Result<Vec<Week>, CommandError> {
    let conn = state.get()?;
    programs::get_weeks(&conn, &program_id)
}

#[tauri::command]
pub fn add_week(
    state: State<'_, DbPool>,
    program_id: String,
    position: i32,
) -> Result<Week, CommandError> {
    let conn = state.get()?;
    programs::add_week(&conn, &program_id, position)
}

#[tauri::command]
pub fn update_week_note(
    state: State<'_, DbPool>,
    id: String,
    notes: String,
) -> Result<(), CommandError> {
    let conn = state.get()?;
    programs::update_week_note(&conn, &id, &notes)
}

#[tauri::command]
pub fn delete_week(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    programs::delete_week(&conn, &id)
}

// --- Workouts ---

#[tauri::command]
pub fn get_workouts(
    state: State<'_, DbPool>,
    program_id: String,
) -> Result<Vec<Workout>, CommandError> {
    let conn = state.get()?;
    programs::get_workouts(&conn, &program_id)
}

#[tauri::command]
pub fn add_workout(
    state: State<'_, DbPool>,
    week_id: String,
    program_id: String,
    day: String,
    type_: String,
    ref_id: Option<String>,
    name: String,
    description: String,
) -> Result<Workout, CommandError> {
    let conn = state.get()?;
    programs::add_workout(
        &conn,
        &week_id,
        &program_id,
        &day,
        &type_,
        ref_id,
        &name,
        &description,
    )
}

#[tauri::command]
pub fn update_workout(state: State<'_, DbPool>, workout: Workout) -> Result<(), CommandError> {
    let conn = state.get()?;
    programs::update_workout(&conn, &workout)
}

#[tauri::command]
pub fn delete_workout(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    programs::delete_workout(&conn, &id)
}
