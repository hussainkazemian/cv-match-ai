// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose, Engine as _};

#[tauri::command]
fn read_file_base64(path: String) -> Result<String, String> {
    // Basic local-file reader for importing PDFs (frontend parses PDF -> text).
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(bytes))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_file_base64])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
