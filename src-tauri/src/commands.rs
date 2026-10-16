use std::path::PathBuf;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::blackboard::{
    BlackboardState, ImprovementTask, MerkleCacheEntry, MerkleQueryInput,
    NotificationSourceTrace, SelfImprovementConfig, SystemNotification,
};
use crate::dual_engine::DualEngineAdapter;
use crate::pty_manager::PtyManager;
use crate::squads::{self, SquadTemplate};
use crate::worktree::{WorktreeLease, WorktreeManager};

pub struct AppState {
    pub project_root: PathBuf,
    pub pty_manager: Arc<PtyManager>,
    pub blackboard: BlackboardState,
    pub worktree_manager: WorktreeManager,
    pub dual_engine: Arc<DualEngineAdapter>,
    pub current_provider: Arc<Mutex<String>>,
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct MerkleLookupResponse {
    pub merkle_key: String,
    pub cache_hit: bool,
    pub entry: Option<MerkleCacheEntry>,
}

#[tauri::command]
pub fn ultracode_set_provider(provider: String, state: State<AppState>) -> Result<serde_json::Value, String> {
    {
        let mut curr = state.current_provider.lock().map_err(|e| e.to_string())?;
        *curr = provider.clone();
    }
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    bb.current_provider = provider.clone();
    let _ = state.blackboard.persist_atomic(&bb);
    Ok(serde_json::json!({ "provider": provider }))
}

#[tauri::command]
pub fn ultracode_set_token_budget_unlimited(
    unlimited: bool,
    state: State<AppState>,
) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    bb.unlimited_tokens = unlimited;
    let _ = state.blackboard.persist_atomic(&bb);
    Ok(serde_json::json!({ "unlimitedTokens": unlimited }))
}

#[tauri::command]
pub fn ultracode_set_global_token_budget(
    budget: u64,
    state: State<AppState>,
) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    bb.max_token_budget = budget;
    bb.budget.max_total_tokens = budget;
    let _ = state.blackboard.persist_atomic(&bb);
    Ok(serde_json::json!({ "maxTokensBudget": budget }))
}

#[tauri::command]
pub fn ultracode_get_app_settings(state: State<AppState>) -> Result<serde_json::Value, String> {
    let bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    let provider = state
        .current_provider
        .lock()
        .map(|p| p.clone())
        .unwrap_or_else(|_| bb.current_provider.clone());

    Ok(serde_json::json!({
        "provider": provider,
        "effort": bb.session_effort,
        "maxTokensBudget": bb.max_token_budget,
        "unlimitedTokens": bb.unlimited_tokens,
        "selfImprovementConfig": bb.self_improvement_config,
    }))
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
        let _ = state.blackboard.persist_atomic(&bb);
        drop(bb);
        let _ = app.emit("ultracode:workflow-update", &run_clone);
    }
    Ok(serde_json::json!({ "maxTokensPerRun": max_tokens_per_run }))
}

#[tauri::command]
pub fn ultracode_set_effort(effort_level: String, state: State<AppState>) -> Result<serde_json::Value, String> {
    let mut bb = state.blackboard.lock().map_err(|e| e.to_string())?;
    bb.session_effort = effort_level.clone();
    let _ = state.blackboard.persist_atomic(&bb);
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
    let _ = state.blackboard.persist_atomic(&bb);
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
        let rs = bb.create_run(run_id, prompt, generated_script, meta, 50000);
        let _ = state.blackboard.persist_atomic(&bb);
        rs
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
        let _ = state.blackboard.persist_atomic(&bb);
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
                            "system-notification" => {
                                if let Some(data) = val.get("data") {
                                    let _ = app_clone.emit("ultracode:system-notification", data);
                                }
                            }
                            "improvement-update" => {
                                if let Some(data) = val.get("data") {
                                    let _ = app_clone.emit("ultracode:improvement-update", data);
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
        let _ = state.blackboard.persist_atomic(&bb);
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
        let _ = state.blackboard.persist_atomic(&bb);
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

#[tauri::command]
pub async fn acquire_fast_worktree(
    worktree_mgr: State<'_, WorktreeManager>,
    task_id: String,
    base_ref: Option<String>,
) -> Result<WorktreeLease, String> {
    let base = base_ref.unwrap_or_else(|| "HEAD".to_string());
    let lease = worktree_mgr.acquire_worktree(&task_id, &base)?;
    // Reabastece 1 slot em background para manter o pool sempre quente
    let _ = worktree_mgr.replenish_warm_pool();
    Ok(lease)
}

#[tauri::command]
pub async fn release_fast_worktree(
    worktree_mgr: State<'_, WorktreeManager>,
    task_id: String,
    delete_branch: bool,
) -> Result<(), String> {
    worktree_mgr.release_worktree(&task_id, delete_branch)
}

#[tauri::command]
pub async fn verify_merkle_replay(
    blackboard: State<'_, BlackboardState>,
    query: MerkleQueryInput,
) -> Result<MerkleLookupResponse, String> {
    let (merkle_key, entry) = blackboard.lookup_merkle_cache(&query)?;
    Ok(MerkleLookupResponse {
        merkle_key,
        cache_hit: entry.is_some(),
        entry,
    })
}

#[tauri::command]
pub async fn commit_merkle_replay(
    blackboard: State<'_, BlackboardState>,
    entry: MerkleCacheEntry,
) -> Result<(), String> {
    blackboard.commit_merkle_entry(entry)
}

#[tauri::command]
pub fn ultracode_get_self_improvement_config(
    state: State<AppState>,
) -> Result<SelfImprovementConfig, String> {
    let bb = state.blackboard.lock()?;
    Ok(bb.self_improvement_config.clone())
}

#[tauri::command]
pub fn ultracode_set_self_improvement_config(
    config: SelfImprovementConfig,
    state: State<AppState>,
    app: AppHandle,
) -> Result<SelfImprovementConfig, String> {
    let mut bb = state.blackboard.lock()?;
    bb.self_improvement_config = config.clone();
    let _ = state.blackboard.persist_atomic(&bb);
    drop(bb);
    let _ = app.emit("ultracode:self-improvement-config", &config);
    Ok(config)
}

#[tauri::command]
pub fn ultracode_get_notifications(
    state: State<AppState>,
) -> Result<Vec<SystemNotification>, String> {
    let bb = state.blackboard.lock()?;
    Ok(bb.notifications.iter().cloned().collect())
}

#[tauri::command]
pub fn ultracode_get_improvements(
    state: State<AppState>,
) -> Result<Vec<ImprovementTask>, String> {
    let bb = state.blackboard.lock()?;
    Ok(bb.improvements.values().cloned().collect())
}

/// Segue a notificação até a fonte do agente (abre Hot-Takeover no PTY se necessário)
/// ou retorna a referência direta para o painel do Sistema de Auto-Melhoria
#[tauri::command]
pub async fn ultracode_follow_notification_source(
    notification_id: String,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let (notif, imp_task) = {
        let mut bb = state.blackboard.lock()?;
        let found = bb
            .notifications
            .iter_mut()
            .find(|n| n.id == notification_id || n.code == notification_id)
            .cloned()
            .ok_or_else(|| format!("Notificação '{}' não encontrada.", notification_id))?;

        if let Some(n) = bb
            .notifications
            .iter_mut()
            .find(|n| n.id == notification_id || n.code == notification_id)
        {
            n.acknowledged = true;
        }
        let imp = found
            .improvement_id
            .as_ref()
            .and_then(|id| bb.improvements.get(id).cloned());
        let _ = state.blackboard.persist_atomic(&bb);
        (found, imp)
    };

    // Caso 1: É uma notificação de Melhoria ou já possui tarefa ativa no Sistema de Melhoria
    if notif.kind == "improvement" || imp_task.is_some() {
        return Ok(serde_json::json!({
            "action": "OPEN_IMPROVEMENT_SYSTEM",
            "notification": notif,
            "improvement": imp_task
        }));
    }

    // Caso 2: Erro ou Gargalo -> Segue o agente até a fonte (PTY / Takeover / Worktree)
    let trace = &notif.source_trace;
    let target_term_id = trace
        .term_id
        .clone()
        .or_else(|| trace.pane_id.clone())
        .unwrap_or_else(|| format!("takeover_{}", notif.id));

    if state.pty_manager.inspect_session(&target_term_id).await.is_err() {
        if let Some(ref provider) = trace.provider {
            if provider == "claude" || provider == "antigravity" {
                let _ = state
                    .pty_manager
                    .spawn_interactive_takeover(
                        target_term_id.clone(),
                        provider.clone(),
                        trace.conversation_id.clone(),
                        trace.worktree_path.clone(),
                        app.clone(),
                    )
                    .await;
            } else {
                let _ = state
                    .pty_manager
                    .create_session(
                        target_term_id.clone(),
                        trace.worktree_path.clone(),
                        None,
                        None,
                        app.clone(),
                    )
                    .await;
            }
        }
    }

    Ok(serde_json::json!({
        "action": "FOLLOW_AGENT_SOURCE",
        "termId": target_term_id,
        "trace": trace,
        "notification": notif
    }))
}

/// Dispara o Agente de Auto-Melhoria no CloudShell em uma Worktree isolada
#[tauri::command]
pub async fn ultracode_trigger_self_improvement(
    notification_code: Option<String>,
    custom_goal: Option<String>,
    engine_override: Option<String>,
    target_files: Option<Vec<String>>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let imp_id = format!("imp_{}", chrono::Utc::now().timestamp_millis());
    let cloudshell_term_id = format!("cs_imp_{}", imp_id);

    // 1. Adquire Worktree isolada (<150ms via Warm Pool)
    let lease = state.worktree_manager.acquire_worktree(&imp_id, "HEAD")?;
    let _ = state.worktree_manager.replenish_warm_pool();
    let wt_path = lease.worktree_path.to_string_lossy().to_string();

    // 2. Resolve o motor (Claude, Antigravity ou Hybrid)
    let (chosen_engine, notif_context) = {
        let bb = state.blackboard.lock()?;
        let pref = engine_override.unwrap_or_else(|| bb.self_improvement_config.preferred_engine.clone());
        let resolved = if pref == "hybrid" {
            // No modo híbrido: Antigravity para gargalos de performance, Claude para erros complexos/arquitetura
            if notification_code.as_deref().unwrap_or("").contains("BTL") {
                "antigravity".to_string()
            } else {
                "claude".to_string()
            }
        } else {
            pref
        };

        let ctx = notification_code
            .as_ref()
            .and_then(|code| bb.notifications.iter().find(|n| &n.code == code || &n.id == code))
            .map(|n| format!("[{}] {}: {}", n.code, n.title, n.message))
            .unwrap_or_else(|| "Melhoria contínua solicitada pelo orquestrador.".to_string());

        (resolved, ctx)
    };

    let code_str = notification_code.unwrap_or_else(|| format!("HCS-IMP-{}", chrono::Utc::now().timestamp_millis() % 1000));
    let goal = custom_goal.unwrap_or_else(|| notif_context.clone());

    let task = ImprovementTask {
        id: imp_id.clone(),
        source_notification_code: code_str.clone(),
        category: if code_str.contains("BTL") {
            "bottleneck_opt".to_string()
        } else if code_str.contains("ERR") {
            "error_fix".to_string()
        } else {
            "continuous_improvement".to_string()
        },
        status: "running_cloudshell".to_string(),
        engine: chosen_engine.clone(),
        cloudshell_term_id: cloudshell_term_id.clone(),
        worktree_path: Some(wt_path.clone()),
        branch_name: Some(lease.branch_name.clone()),
        target_files: target_files.unwrap_or_default(),
        diagnosis: Some(format!("Diagnosticando via {} no CloudShell...", chosen_engine)),
        patch_summary: None,
        created_at: chrono::Utc::now().timestamp_millis(),
        updated_at: chrono::Utc::now().timestamp_millis(),
    };

    let notif = SystemNotification {
        id: format!("notif_{}", imp_id),
        code: code_str.clone(),
        kind: "improvement".to_string(),
        severity: "info".to_string(),
        title: format!("Auto-Melhoria Iniciada ({})", chosen_engine.to_uppercase()),
        message: goal.clone(),
        timestamp: chrono::Utc::now().timestamp_millis(),
        acknowledged: false,
        source_trace: NotificationSourceTrace {
            run_id: None,
            agent_id: Some(imp_id.clone()),
            term_id: Some(cloudshell_term_id.clone()),
            pane_id: Some(cloudshell_term_id.clone()),
            conversation_id: None,
            provider: Some(chosen_engine.clone()),
            worktree_path: Some(wt_path.clone()),
            file_target: task.target_files.first().cloned(),
            line_hint: None,
        },
        improvement_id: Some(imp_id.clone()),
    };

    {
        let mut bb = state.blackboard.lock()?;
        bb.register_improvement(task.clone());
        bb.push_notification(notif.clone());
        let _ = state.blackboard.persist_atomic(&bb);
    }

    let _ = app.emit("ultracode:system-notification", &notif);
    let _ = app.emit("ultracode:improvement-update", &task);

    // 3. Dispara o agente dentro do CloudShell PTY conectado à Worktree
    let prompt = format!(
        "SISTEMA DE AUTO-MELHORIA HIPERCLOUDSHELL [Código: {}].\nContexto/Alvo: {}\n1. Rastreie a causa raiz nos arquivos do projeto.\n2. Implemente a melhoria/correção mínima e segura nesta worktree.\n3. Execute 'npm test' para validar os Quality Gates.\n4. Ao concluir com testes verdes, imprima <<MAESTRO_TASK_DONE>>.",
        code_str, goal
    );

    state
        .pty_manager
        .spawn_cloudshell_improvement_agent(
            cloudshell_term_id.clone(),
            chosen_engine,
            wt_path,
            prompt,
            app,
        )
        .await?;

    Ok(serde_json::json!({
        "improvement": task,
        "notification": notif
    }))
}

#[tauri::command]
pub async fn ultracode_cloudshell_inspect(
    term_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state.pty_manager.inspect_session(&term_id).await
}
