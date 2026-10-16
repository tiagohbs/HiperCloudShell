pub mod blackboard;
pub mod commands;
pub mod dual_engine;
pub mod gates;
pub mod pty_manager;
pub mod squads;
pub mod worktree;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use blackboard::BlackboardState;
use commands::AppState;
use dual_engine::DualEngineAdapter;
use pty_manager::PtyManager;
use worktree::WorktreeManager;

pub fn run() {
    let project_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // Inicializa pastas e templates canônicos
    let _ = squads::seed_default_templates(&project_root);

    let worktree_mgr = WorktreeManager::new(project_root.clone(), 3)
        .expect("Falha ao inicializar WorktreeManager");
    let blackboard = BlackboardState::new(project_root.clone(), 500_000)
        .expect("Falha ao inicializar BlackboardState");

    let app_state = AppState {
        project_root: project_root.clone(),
        pty_manager: Arc::new(PtyManager::new()),
        blackboard: blackboard.clone(),
        worktree_manager: worktree_mgr.clone(),
        dual_engine: Arc::new(DualEngineAdapter::new()),
        current_provider: Arc::new(Mutex::new("hybrid".to_string())),
    };

    tauri::Builder::default()
        .manage(worktree_mgr)
        .manage(blackboard)
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::ultracode_set_provider,
            commands::ultracode_set_token_budget,
            commands::ultracode_set_effort,
            commands::ultracode_get_squad_catalog,
            commands::ultracode_launch_squad,
            commands::ultracode_submit_prompt,
            commands::ultracode_approve_run,
            commands::ultracode_pause_run,
            commands::ultracode_resume_run,
            commands::ultracode_save_workflow,
            commands::ultracode_term_create,
            commands::ultracode_term_takeover,
            commands::ultracode_term_write,
            commands::maestro_run_dag,
            commands::term_write,
            commands::term_resize,
            commands::term_kill,
            commands::acquire_fast_worktree,
            commands::release_fast_worktree,
            commands::verify_merkle_replay,
            commands::commit_merkle_replay,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar aplicação Tauri v2 HiperCloudShell");
}
