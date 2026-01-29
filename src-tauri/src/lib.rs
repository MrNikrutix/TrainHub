mod commands;
mod db;
mod engine;
mod error;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Database init
            let pool = db::init_db(app.handle())?;
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Exercises
            commands::exercises::get_exercises,
            commands::exercises::add_exercise,
            commands::exercises::update_exercise,
            commands::exercises::delete_exercise,
            // Plans
            commands::plans::get_plans,
            commands::plans::create_plan,
            commands::plans::update_plan,
            commands::plans::delete_plan,
            // Programs
            commands::programs::get_programs,
            commands::programs::create_program,
            commands::programs::duplicate_program,
            commands::programs::delete_program,
            commands::programs::get_weeks,
            commands::programs::add_week,
            commands::programs::update_week_note,
            commands::programs::delete_week,
            commands::programs::get_workouts,
            commands::programs::add_workout,
            commands::programs::update_workout,
            commands::programs::delete_workout,
            // Analysis
            commands::analysis::get_analysis_sessions,
            commands::analysis::create_analysis_session,
            commands::analysis::delete_analysis_session,
            commands::analysis::get_annotations,
            commands::analysis::add_annotation,
            commands::analysis::update_annotation,
            commands::analysis::delete_annotation,
            commands::analysis::pick_video_file, // Video Picker
            // Chat
            commands::chat::create_chat_session,
            commands::chat::get_chat_sessions,
            commands::chat::update_chat_title,
            commands::chat::delete_chat_session,
            commands::chat::save_chat_message,
            commands::chat::get_chat_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
