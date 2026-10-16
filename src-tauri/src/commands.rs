use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::blackboard::SharedBlackboard;
use crate::dual_engine::DualEngineAdapter;
use crate::pty_manager::PtyManager;
use crate::squads::{self, SquadTemplate};
use crate::worktree::WorktreeManager;

pub struct AppState {
    pub project_root: PathBuf,
    pub pty_manager: Arc<PtyManager>,
    pub blackboard: SharedBlackboard,
    pub worktree_manager: Arc<WorktreeManager>,
    pub dual_engine: Arc<DualEngineAdapter>,
    pub current_provider: Arc<Mutex<String>>,
}

#[tauri::command]
pub fn ultracode_set_provider(provider: String, state: State<AppState>) -> Result<serde_json::Value, String> {
    let mut curr = state.current_provider.lock().map_err(|e| e.to_string())?;
    *curr = provider.clone();
    Ok(serde_json::json!({ "provider": provider }))
}

#[tauri::command]
pub fn ultracode_set_token_budget(
    run_id: String,
    max_tokens_per_run: u64,
    state: State<AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    if let Some(run) = bb.get_run_mut(&run_id) {
        run.max_tokens_per_run = max_tokens_per_run;
        let run_clone = run.clone();
        drop(bb);
        let _ = app.emit("ultracode:workflow-update", &run_clone);
    }
    Ok(serde_json::json!({ "maxTokensPerRun": max_tokens_per_run }))
}

#[tauri::command]
pub fn ultracode_set_effort(effort_level: String, state: State<AppState>) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    bb.session_effort = effort_level.clone();
    bb.persist();
    Ok(serde_json::json!({ "effort": effort_level }))
}

#[tauri::command]
pub fn ultracode_get_squad_catalog() -> Result<Vec<SquadTemplate>, String> {
    Ok(squads::get_builtin_squad_templates())
}

#[tauri::command]
pub fn ultracode_launch_squad(
    slug: String,
    custom_prompt: Option<String>,
    apply_recommended_caps: Option<bool>,
    state: State<AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let catalog = squads::get_builtin_squad_templates();
    let squad = catalog
        .into_iter()
        .find(|s| s.slug == slug)
        .ok_or_else(|| format!("Squad '{}' não encontrado.", slug))?;

    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;

    if apply_recommended_caps.unwrap_or(false) {
        bb.engine_effort_caps.insert("claude".to_string(), squad.recommended_effort.claude.clone());
        bb.engine_effort_caps.insert("antigravity".to_string(), squad.recommended_effort.antigravity.clone());
    }

    let run_id = format!("wf_{}_{}", slug, chrono::Utc::now().timestamp_millis());
    let prompt_desc = custom_prompt.unwrap_or_else(|| format!("{}: {}", squad.title, squad.description));

    let meta = serde_json::json!({
        "name": squad.slug,
        "description": squad.description,
        "phases": []
    });

    let run_state = bb.create_run(run_id, prompt_desc, squad.script, meta, 50000);
    let caps = bb.engine_effort_caps.clone();
    drop(bb);

    let _ = app.emit("ultracode:workflow-update", &run_state);

    Ok(serde_json::json!({
        "run": run_state,
        "appliedCaps": caps
    }))
}

#[tauri::command]
pub async fn ultracode_submit_prompt(
    prompt: String,
    options: Option<serde_json::Value>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let dismissed_keyword = options
        .as_ref()
        .and_then(|o| o.get("DismissedKeyword"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let has_keyword = !dismissed_keyword && regex::Regex::new(r"(?i)\b(ultracode|workflow)\b")
        .unwrap()
        .is_match(&prompt);

    let is_session_ultracode = {
        let bb = state.blackboard.lock().map_err(|e| e.to_string())?;
        bb.session_effort == "ultracode"
    };

    let is_substantive = prompt.trim().len() > 45
        || regex::Regex::new(r"(?i)\b(audit|migrate|refactor|all|every|sweep|review|test)\b")
            .unwrap()
            .is_match(&prompt);

    let should_run_workflow = (is_session_ultracode && (is_substantive || has_keyword)) || has_keyword;

    let effort = if is_session_ultracode { "xhigh" } else { "high" };

    if !should_run_workflow {
        // Execução direta de turno único
        let provider = state
            .current_provider
            .lock()
            .map_err(|e| e.to_string())?
            .clone();

        let result = state
            .dual_engine
            .run_agent(
                None,
                prompt.clone(),
                Some(state.project_root.to_string_lossy().to_string()),
                Some(provider),
                Some(effort.to_string()),
                None,
                None,
                Some("direct-turn".to_string()),
                None,
                app.clone(),
            )
            .await?;

        return Ok(serde_json::json!({
            "mode": "single_turn",
            "effort": effort,
            "result": result
        }));
    }

    // Planejar Dynamic Workflow
    let run_id = format!("wf_{}", chrono::Utc::now().timestamp_millis());
    let provider = state
        .current_provider
        .lock()
        .map_err(|e| e.to_string())?
        .clone();

    // Invoca sidecar ou gera script dinâmico padrão
    let sidecar_script_path = state.project_root.join("orchestrator").join("sidecar.js");
    let generated_script = if sidecar_script_path.exists() {
        let output = Command::new("node")
            .arg(&sidecar_script_path)
            .arg("--plan")
            .arg(&prompt)
            .arg(effort)
            .arg(&provider)
            .current_dir(&state.project_root)
            .output()
            .await;

        match output {
            Ok(out) if out.status.success() => {
                let stdout_str = String::from_utf8_lossy(&out.stdout);
                stdout_str
                    .lines()
                    .filter_map(|l| serde_json::from_str::<serde_json::Value>(l).ok())
                    .find(|v| v["type"] == "plan-result")
                    .and_then(|v| v["data"]["script"].as_str().map(|s| s.to_string()))
                    .unwrap_or_else(|| default_script(&prompt))
            }
            _ => default_script(&prompt),
        }
    } else {
        default_script(&prompt)
    };

    let meta = serde_json::json!({
        "name": "dynamic-workflow",
        "description": prompt,
        "phases": [
            { "title": "Descoberta & Mapeamento" },
            { "title": "Execução Paralela" },
            { "title": "Síntese & Verificação" }
        ]
    });

    let run_state = {
        let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
        bb.create_run(run_id, prompt, generated_script, meta, 50000)
    };

    let _ = app.emit("ultracode:workflow-update", &run_state);

    Ok(serde_json::json!({
        "mode": "workflow",
        "effort": effort,
        "run": run_state
    }))
}

fn default_script(prompt: &str) -> String {
    format!(
        r#"const meta = {{
  name: "dynamic-workflow",
  description: "Workflow gerado para: {}",
  phases: [
    {{ title: "Descoberta & Análise" }},
    {{ title: "Execução & Refatoração" }},
    {{ title: "Verificação Determinística" }}
  ]
}};

phase("Descoberta & Análise");
const analysis = await agent("Analise o projeto e planeje os passos para: {}", {{
  label: "initial-analysis",
  provider: "claude"
}});

phase("Execução & Refatoração");
const execution = await agent(`Execute as mudanças necessárias baseadas em: ${{analysis}}`, {{
  label: "execute-tasks",
  provider: "antigravity",
  isolation: "worktree"
}});

phase("Verificação Determinística");
const gate = await verifyCmd("npm test");
return {{ analysis, execution, testGate: gate.ok }};"#,
        prompt.replace('"', "\\\""),
        prompt.replace('"', "\\\"")
    )
}

#[tauri::command]
pub async fn ultracode_approve_run(
    run_id: String,
    edited_script: Option<String>,
    args: Option<serde_json::Value>,
    max_tokens_per_run: Option<u64>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let (script, tokens_budget) = {
        let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
        let run = bb.get_run_mut(&run_id).ok_or_else(|| "Run não encontrado".to_string())?;
        if let Some(s) = edited_script {
            run.script = s;
        }
        if let Some(tb) = max_tokens_per_run {
            run.max_tokens_per_run = tb;
        }
        run.status = "running".to_string();
        let s = run.script.clone();
        let tb = run.max_tokens_per_run;
        let r_clone = run.clone();
        drop(bb);
        let _ = app.emit("ultracode:workflow-update", &r_clone);
        (s, tb)
    };

    // Spawna sidecar assincronamente lendo streams NDJSON
    let sidecar_script_path = state.project_root.join("orchestrator").join("sidecar.js");
    let project_root = state.project_root.clone();
    let run_id_clone = run_id.clone();
    let app_clone = app.clone();
    let args_str = args.unwrap_or_else(|| serde_json::json!({})).to_string();

    tokio::spawn(async move {
        let mut child = match Command::new("node")
            .arg(&sidecar_script_path)
            .arg("--run")
            .arg(&run_id_clone)
            .arg(&script)
            .arg(&args_str)
            .arg(tokens_budget.to_string())
            .current_dir(&project_root)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                let _ = app_clone.emit(
                    "ultracode:workflow-update",
                    serde_json::json!({
                        "id": run_id_clone,
                        "status": "failed",
                        "error": format!("Falha ao iniciar sidecar Node: {}", e)
                    }),
                );
                return;
            }
        };

        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(msg_type) = val.get("type").and_then(|t| t.as_str()) {
                        match msg_type {
                            "workflow-update" => {
                                if let Some(data) = val.get("data") {
                                    let _ = app_clone.emit("ultracode:workflow-update", data);
                                }
                            }
                            "agent-stream" => {
                                if let Some(data) = val.get("data") {
                                    let _ = app_clone.emit("ultracode:agent-stream", data);
                                }
                            }
                            "agent-telemetry" => {
                                if let Some(data) = val.get("data") {
                                    let _ = app_clone.emit("ultracode:agent-telemetry", data);
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }

        let _ = child.wait().await;
    });

    Ok(serde_json::json!({ "started": true, "runId": run_id }))
}

#[tauri::command]
pub fn ultracode_pause_run(
    run_id: String,
    state: State<AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    if let Some(run) = bb.get_run_mut(&run_id) {
        run.status = "paused".to_string();
        run.pause_reason = Some("Pausado pelo usuário".to_string());
        let run_clone = run.clone();
        drop(bb);
        let _ = app.emit("ultracode:workflow-update", &run_clone);
    }
    Ok(serde_json::json!({ "paused": true }))
}

#[tauri::command]
pub fn ultracode_resume_run(
    run_id: String,
    state: State<AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    if let Some(run) = bb.get_run_mut(&run_id) {
        run.status = "running".to_string();
        run.pause_reason = None;
        let run_clone = run.clone();
        drop(bb);
        let _ = app.emit("ultracode:workflow-update", &run_clone);
    }
    Ok(serde_json::json!({ "resumed": true }))
}

#[tauri::command]
pub fn ultracode_save_workflow(
    run_id: String,
    name: Option<String>,
    state: State<AppState>,
) -> Result<serde_json::Value, String> {
    let bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    let run = bb.get_run(&run_id).ok_or_else(|| "Run não encontrado".to_string())?;

    let workflows_dir = state.project_root.join(".claude").join("workflows");
    if !workflows_dir.exists() {
        let _ = std::fs::create_dir_all(&workflows_dir);
    }

    let file_name = name.unwrap_or_else(|| run_id.clone());
    let dest = workflows_dir.join(format!("{}.js", file_name));
    std::fs::write(&dest, &run.script).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "saved": true,
        "path": dest.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub async fn ultracode_term_create(
    term_id: String,
    cwd: Option<String>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    state.pty_manager.create_session(term_id, cwd, None, None, app).await
}

#[tauri::command]
pub async fn ultracode_term_takeover(
    term_id: String,
    provider: String,
    conversation_id: Option<String>,
    cwd: Option<String>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    state
        .pty_manager
        .spawn_interactive_takeover(term_id, provider, conversation_id, cwd, app)
        .await
}

#[tauri::command]
pub async fn ultracode_term_write(
    term_id: String,
    input: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.pty_manager.write(&term_id, &input).await
}

#[tauri::command]
pub async fn term_write(pane_id: String, text: String, state: State<'_, AppState>) -> Result<(), String> {
    state.pty_manager.write(&pane_id, &text).await
}

#[tauri::command]
pub async fn term_resize(
    pane_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.pty_manager.resize(&pane_id, cols, rows).await
}

#[tauri::command]
pub async fn term_kill(pane_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.pty_manager.kill(&pane_id).await
}

#[tauri::command]
pub async fn maestro_run_dag(
    dag_tasks: Vec<serde_json::Value>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    for task in &dag_tasks {
        if let Some(pane_id) = task.get("paneId").and_then(|p| p.as_str()) {
            let _ = state
                .pty_manager
                .create_session(
                    pane_id.to_string(),
                    Some(state.project_root.to_string_lossy().to_string()),
                    None,
                    None,
                    app.clone(),
                )
                .await;
        }
    }

    Ok(serde_json::json!({
        "status": "DAG_SCHEDULED",
        "tasksCount": dag_tasks.len()
    }))
}
