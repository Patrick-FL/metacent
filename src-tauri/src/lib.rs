// metacent — Tauri 2.0 Rust Core Backend & Native IPC Commands
mod db;

use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("metacent: Hallo, {}!", name)
}

#[tauri::command]
async fn check_ollama_local(endpoint: Option<String>) -> Result<bool, String> {
    let base_url = endpoint.unwrap_or_else(|| "http://localhost:11434".to_string());
    let url = format!("{}/api/tags", base_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(&url).send().await {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
fn save_budget_file(path: String, content: String) -> Result<(), String> {
    let p = PathBuf::from(path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(p, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_budget_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_ollama_local,
            save_budget_file,
            read_budget_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
