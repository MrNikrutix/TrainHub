use crate::db::DbPool;
use crate::error::CommandError;
use crate::models::TrainingPlan;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_plans(state: State<'_, DbPool>) -> Result<Vec<TrainingPlan>, CommandError> {
    println!("get_plans called");
    let conn = state.get()?;
    let mut stmt = conn.prepare("SELECT id, name, sections FROM training_plans")?;
    let plan_iter = stmt.query_map([], |row| {
        Ok(TrainingPlan {
            id: row.get(0)?,
            name: row.get(1)?,
            sections: row.get(2)?,
        })
    })?;

    let mut plans = Vec::new();
    for plan in plan_iter {
        plans.push(plan?);
    }
    println!("get_plans returning {} plans", plans.len());
    Ok(plans)
}

#[tauri::command]
pub fn create_plan(
    state: State<'_, DbPool>,
    name: String,
    sections: String,
) -> Result<TrainingPlan, CommandError> {
    println!("create_plan called: {}", name);
    let conn = state.get()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO training_plans (id, name, sections) VALUES (?1, ?2, ?3)",
        params![id, name, sections],
    )?;
    println!("create_plan inserted id: {}", id);
    Ok(TrainingPlan { id, name, sections })
}

#[tauri::command]
pub fn update_plan(state: State<'_, DbPool>, plan: TrainingPlan) -> Result<(), CommandError> {
    let conn = state.get()?;
    conn.execute(
        "UPDATE training_plans SET name = ?1, sections = ?2 WHERE id = ?3",
        params![plan.name, plan.sections, plan.id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_plan(state: State<'_, DbPool>, id: String) -> Result<(), CommandError> {
    let conn = state.get()?;
    conn.execute("DELETE FROM training_plans WHERE id = ?1", params![id])?;
    Ok(())
}
