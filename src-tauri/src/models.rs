use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Exercise {
    pub id: String,
    pub name: String,
    pub instructions: String,
    pub enrichment: String,
    pub tags: String, // stored as JSON array string
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrainingPlan {
    pub id: String,
    pub name: String,
    pub sections: String, // stored as JSON String
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Program {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Week {
    pub id: String,
    pub program_id: String,
    pub position: i32,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workout {
    pub id: String,
    pub week_id: String,
    pub program_id: String,
    pub day: String,
    #[serde(rename = "type")]
    pub type_: String, // "exercise" | "plan" (mapped from 'type' in DB)
    pub ref_id: Option<String>,
    pub name: String,
    pub description: String,
    pub completed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisSession {
    pub id: String,
    pub name: String,
    pub date: String,
    pub video_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Annotation {
    pub id: String,
    pub session_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub name: String,
    pub description: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Flashcard {
    pub id: String,
    pub set_id: String,
    pub front: String,
    pub back: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlashcardSet {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}
