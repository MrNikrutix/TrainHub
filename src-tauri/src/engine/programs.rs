use crate::error::CommandError;
use crate::models::{Program, Week, Workout};
use rusqlite::{params, Connection};
use uuid::Uuid;

// --- Programs ---

pub fn get_programs(conn: &Connection) -> Result<Vec<Program>, CommandError> {
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM programs")?;
    let rows = stmt.query_map([], |row| {
        Ok(Program {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
        })
    })?;

    let mut programs = Vec::new();
    for r in rows {
        programs.push(r?);
    }
    Ok(programs)
}

pub fn create_program(conn: &Connection, name: &str) -> Result<Program, CommandError> {
    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO programs (id, name, created_at) VALUES (?1, ?2, ?3)",
        params![id, name, created_at],
    )?;

    Ok(Program {
        id,
        name: name.to_string(),
        created_at,
    })
}

pub fn delete_program(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM programs WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn duplicate_program(conn: &mut Connection, id: &str) -> Result<Program, CommandError> {
    let tx = conn.transaction()?;

    // 1. Get original program
    let mut stmt = tx.prepare("SELECT name FROM programs WHERE id = ?1")?;
    let original_name: String = stmt.query_row(params![id], |row| row.get(0))?;
    drop(stmt); // Close statement to release borrow

    // 2. Create new program
    let new_program_id = Uuid::new_v4().to_string();
    let new_name = format!("{} (Kopia)", original_name);
    let created_at = chrono::Local::now().to_rfc3339();

    tx.execute(
        "INSERT INTO programs (id, name, created_at) VALUES (?1, ?2, ?3)",
        params![new_program_id, new_name, created_at],
    )?;

    // 3. Get original weeks
    let mut stmt_weeks =
        tx.prepare("SELECT id, position, notes FROM program_weeks WHERE program_id = ?1")?;
    let weeks_rows = stmt_weeks.query_map(params![id], |row| {
        Ok((
            row.get::<_, String>(0)?, // id
            row.get::<_, i32>(1)?,    // position
            row.get::<_, String>(2)?, // notes
        ))
    })?;

    // Collect into vec to avoid borrow issues with stmt_weeks while inserting
    let mut weeks_data = Vec::new();
    for w in weeks_rows {
        weeks_data.push(w?);
    }
    drop(stmt_weeks);

    // 4. Clone weeks and their workouts
    for (old_week_id, position, notes) in weeks_data {
        let new_week_id = Uuid::new_v4().to_string();

        tx.execute(
            "INSERT INTO program_weeks (id, program_id, position, notes) VALUES (?1, ?2, ?3, ?4)",
            params![new_week_id, new_program_id, position, notes],
        )?;

        // Clone workouts for this week
        let mut stmt_workouts = tx.prepare(
            "SELECT day, type, ref_id, name, description FROM program_workouts WHERE week_id = ?1",
        )?;
        let workouts_rows = stmt_workouts.query_map(params![old_week_id], |row| {
            Ok((
                row.get::<_, String>(0)?,         // day
                row.get::<_, String>(1)?,         // type
                row.get::<_, Option<String>>(2)?, // ref_id
                row.get::<_, String>(3)?,         // name
                row.get::<_, String>(4)?,         // description
            ))
        })?;

        let mut workouts_data = Vec::new();
        for wo in workouts_rows {
            workouts_data.push(wo?);
        }
        drop(stmt_workouts);

        for (day, type_, ref_id, name, description) in workouts_data {
            let new_workout_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO program_workouts (id, week_id, program_id, day, type, ref_id, name, description, completed) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0)",
                params![new_workout_id, new_week_id, new_program_id, day, type_, ref_id, name, description],
            )?;
        }
    }

    tx.commit()?;

    Ok(Program {
        id: new_program_id,
        name: new_name,
        created_at,
    })
}

// --- Weeks ---

pub fn get_weeks(conn: &Connection, program_id: &str) -> Result<Vec<Week>, CommandError> {
    let mut stmt = conn.prepare("SELECT id, program_id, position, notes FROM program_weeks WHERE program_id = ?1 ORDER BY position ASC")?;
    let rows = stmt.query_map(params![program_id], |row| {
        Ok(Week {
            id: row.get(0)?,
            program_id: row.get(1)?,
            position: row.get(2)?,
            notes: row.get(3).unwrap_or_default(),
        })
    })?;

    let mut weeks = Vec::new();
    for r in rows {
        weeks.push(r?);
    }
    Ok(weeks)
}

pub fn add_week(conn: &Connection, program_id: &str, position: i32) -> Result<Week, CommandError> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO program_weeks (id, program_id, position, notes) VALUES (?1, ?2, ?3, ?4)",
        params![id, program_id, position, ""],
    )?;
    Ok(Week {
        id,
        program_id: program_id.to_string(),
        position,
        notes: "".to_string(),
    })
}

pub fn update_week_note(conn: &Connection, id: &str, notes: &str) -> Result<(), CommandError> {
    conn.execute(
        "UPDATE program_weeks SET notes = ?1 WHERE id = ?2",
        params![notes, id],
    )?;
    Ok(())
}

pub fn delete_week(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM program_weeks WHERE id = ?1", params![id])?;
    Ok(())
}

// --- Workouts ---

pub fn get_workouts(conn: &Connection, program_id: &str) -> Result<Vec<Workout>, CommandError> {
    let mut stmt = conn.prepare("SELECT id, week_id, program_id, day, type, ref_id, name, description, completed FROM program_workouts WHERE program_id = ?1")?;
    let rows = stmt.query_map(params![program_id], |row| {
        Ok(Workout {
            id: row.get(0)?,
            week_id: row.get(1)?,
            program_id: row.get(2)?,
            day: row.get(3)?,
            type_: row.get(4)?,
            ref_id: row.get(5)?,
            name: row.get(6)?,
            description: row.get(7)?,
            completed: row.get(8)?,
        })
    })?;

    let mut workouts = Vec::new();
    for r in rows {
        workouts.push(r?);
    }
    Ok(workouts)
}

pub fn add_workout(
    conn: &Connection,
    week_id: &str,
    program_id: &str,
    day: &str,
    type_: &str,
    ref_id: Option<String>,
    name: &str,
    description: &str,
) -> Result<Workout, CommandError> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO program_workouts (id, week_id, program_id, day, type, ref_id, name, description, completed) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0)",
        params![id, week_id, program_id, day, type_, ref_id, name, description],
    )?;
    Ok(Workout {
        id,
        week_id: week_id.to_string(),
        program_id: program_id.to_string(),
        day: day.to_string(),
        type_: type_.to_string(),
        ref_id,
        name: name.to_string(),
        description: description.to_string(),
        completed: false,
    })
}

pub fn update_workout(conn: &Connection, workout: &Workout) -> Result<(), CommandError> {
    conn.execute(
        "UPDATE program_workouts SET day = ?1, week_id = ?2, type = ?3, ref_id = ?4, name = ?5, description = ?6, completed = ?7 WHERE id = ?8",
        params![workout.day, workout.week_id, workout.type_, workout.ref_id, workout.name, workout.description, workout.completed, workout.id],
    )?;
    Ok(())
}

pub fn delete_workout(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM program_workouts WHERE id = ?1", params![id])?;
    Ok(())
}
