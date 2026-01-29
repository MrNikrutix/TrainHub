use crate::db::DbPool;
use crate::error::CommandError;
use crate::models::Exercise;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_exercises(state: State<'_, DbPool>) -> Result<Vec<Exercise>, CommandError> {
    let conn = state.get()?;
    let mut stmt =
        conn.prepare("SELECT id, name, instructions, enrichment, tags, video_url FROM exercises")?;
    let exercise_iter = stmt.query_map([], |row| {
        Ok(Exercise {
            id: row.get(0)?,
            name: row.get(1)?,
            instructions: row.get(2)?,
            enrichment: row.get(3)?,
            tags: row.get(4)?,
            video_url: row.get(5)?,
        })
    })?;

    let mut exercises = Vec::new();
    for exercise in exercise_iter {
        exercises.push(exercise?);
    }
    Ok(exercises)
}

#[tauri::command]
pub fn add_exercise(
    state: State<'_, DbPool>,
    name: String,
    instructions: String,
    enrichment: String,
    tags: String,
    video_url: String,
) -> Result<Exercise, CommandError> {
    let conn = state.get()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO exercises (id, name, instructions, enrichment, tags, video_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, instructions, enrichment, tags, video_url],
    )?;

    Ok(Exercise {
        id,
        name,
        instructions,
        enrichment,
        tags,
        video_url,
    })
}

#[tauri::command]
pub fn update_exercise(state: State<'_, DbPool>, exercise: Exercise) -> Result<(), CommandError> {
    let conn = state.get()?;
    conn.execute(
        "UPDATE exercises SET name = ?1, instructions = ?2, enrichment = ?3, tags = ?4, video_url = ?5 WHERE id = ?6",
        params![exercise.name, exercise.instructions, exercise.enrichment, exercise.tags, exercise.video_url, exercise.id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_exercise(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    conn.execute("DELETE FROM exercises WHERE id = ?1", params![id])?;
    Ok(())
}
