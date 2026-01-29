use crate::error::CommandError;
use crate::models::{AnalysisSession, Annotation};
use rusqlite::{params, Connection};
use uuid::Uuid;

pub fn get_sessions(conn: &Connection) -> Result<Vec<AnalysisSession>, CommandError> {
    let mut stmt = conn
        .prepare("SELECT id, name, date, video_path FROM analysis_sessions ORDER BY date DESC")?;
    let rows = stmt.query_map([], |row| {
        Ok(AnalysisSession {
            id: row.get(0)?,
            name: row.get(1)?,
            date: row.get(2)?,
            video_path: row.get(3)?,
        })
    })?;

    let mut sessions = Vec::new();
    for r in rows {
        sessions.push(r?);
    }
    Ok(sessions)
}

pub fn create_session(
    conn: &Connection,
    name: &str,
    video_path: Option<String>,
) -> Result<AnalysisSession, CommandError> {
    let id = Uuid::new_v4().to_string();
    let date = chrono::Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO analysis_sessions (id, name, date, video_path) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, date, video_path],
    )?;

    Ok(AnalysisSession {
        id,
        name: name.to_string(),
        date,
        video_path,
    })
}

pub fn delete_session(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM analysis_sessions WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_annotations(
    conn: &Connection,
    session_id: &str,
) -> Result<Vec<Annotation>, CommandError> {
    let mut stmt = conn.prepare("SELECT id, session_id, start_time, end_time, name, description, color FROM annotations WHERE session_id = ?1")?;
    let rows = stmt.query_map(params![session_id], |row| {
        Ok(Annotation {
            id: row.get(0)?,
            session_id: row.get(1)?,
            start_time: row.get(2)?,
            end_time: row.get(3)?,
            name: row.get(4)?,
            description: row.get(5)?,
            color: row.get(6)?,
        })
    })?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r?);
    }
    Ok(list)
}

pub fn add_annotation(
    conn: &Connection,
    session_id: &str,
    start_time: f64,
    end_time: f64,
    name: &str,
    description: &str,
    color: &str,
) -> Result<Annotation, CommandError> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO annotations (id, session_id, start_time, end_time, name, description, color) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, session_id, start_time, end_time, name, description, color],
    )?;

    Ok(Annotation {
        id,
        session_id: session_id.to_string(),
        start_time,
        end_time,
        name: name.to_string(),
        description: description.to_string(),
        color: color.to_string(),
    })
}

pub fn update_annotation(conn: &Connection, annotation: &Annotation) -> Result<(), CommandError> {
    conn.execute(
        "UPDATE annotations SET start_time=?1, end_time=?2, name=?3, description=?4, color=?5 WHERE id=?6",
        params![annotation.start_time, annotation.end_time, annotation.name, annotation.description, annotation.color, annotation.id],
    )?;
    Ok(())
}

pub fn delete_annotation(conn: &Connection, id: &str) -> Result<(), CommandError> {
    conn.execute("DELETE FROM annotations WHERE id = ?1", params![id])?;
    Ok(())
}
