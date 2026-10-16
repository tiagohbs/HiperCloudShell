use crate::blackboard::{NotificationSourceTrace, SystemNotification};
use crate::gates::UltracodeGates;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentStreamPayload {
    pub label: String,
    pub provider: String,
    pub chunk: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentTelemetryPayload {
    #[serde(rename = "agentId")]
    pub agent_id: Option<String>,
    pub label: String,
    pub provider: String,
    #[serde(rename = "effectiveEffort")]
    pub effective_effort: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub text: String,
    #[serde(rename = "toolName")]
    pub tool_name: Option<String>,
    #[serde(rename = "conversationId")]
    pub conversation_id: Option<String>,
    #[serde(rename = "tokensDelta")]
    pub tokens_delta: Option<usize>,
    pub cwd: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DeterministicCmdResult {
    pub ok: bool,
    #[serde(rename = "exitCode")]
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentRunResult {
    pub provider: String,
    #[serde(rename = "effectiveEffort")]
    pub effective_effort: String,
    pub output: Value,
    pub tokens: usize,
    #[serde(rename = "conversationId")]
    pub conversation_id: Option<String>,
    pub cwd: Option<String>,
}

#[derive(Clone)]
pub struct DualEngineAdapter {
    pub default_provider: Arc<Mutex<String>>,
    pub claude_bin: Arc<Mutex<String>>,
    pub antigravity_bin: Arc<Mutex<String>>,
    pub provider_max_effort: Arc<Mutex<HashMap<String, String>>>,
}

impl DualEngineAdapter {
    pub fn new() -> Self {
        let mut caps = HashMap::new();
        caps.insert("claude".to_string(), "xhigh".to_string());
        caps.insert("antigravity".to_string(), "high".to_string());

        Self {
            default_provider: Arc::new(Mutex::new("hybrid".to_string())),
            claude_bin: Arc::new(Mutex::new("claude".to_string())),
            antigravity_bin: Arc::new(Mutex::new("agy".to_string())),
            provider_max_effort: Arc::new(Mutex::new(caps)),
        }
    }

    pub async fn set_provider_max_effort(&self, provider: &str, cap: &str) {
        let mut caps = self.provider_max_effort.lock().await;
        caps.insert(provider.to_string(), cap.to_string());
    }

    pub async fn get_effective_effort(&self, provider: &str, requested_effort: &str) -> String {
        let caps = self.provider_max_effort.lock().await;
        let cap = caps.get(provider).map(|s| s.as_str()).unwrap_or("high");
        UltracodeGates::clamp_effort(requested_effort, cap)
    }

    pub async fn resolve_provider(&self, provider: Option<&str>, phase: Option<&str>) -> String {
        if let Some(p) = provider {
            if p == "antigravity" || p == "agy" || p == "gemini" {
                return "antigravity".to_string();
            }
            if p == "claude" {
                return "claude".to_string();
            }
        }

        if let Some(ph) = phase {
            let lower = ph.to_lowercase();
            if lower.contains("descoberta") || lower.contains("fan-out") || lower.contains("mapeamento") {
                return "antigravity".to_string();
            }
            if lower.contains("adversarial") || lower.contains("síntese") || lower.contains("verificação") {
                return "claude".to_string();
            }
        }

        let def = self.default_provider.lock().await;
        if *def == "antigravity" {
            "antigravity".to_string()
        } else {
            "claude".to_string()
        }
    }

    /// Executa um subagente em processo isolado lendo eventos NDJSON em tempo real
    pub async fn run_agent(
        &self,
        agent_id: Option<String>,
        prompt: String,
        cwd: Option<String>,
        provider: Option<String>,
        effort: Option<String>,
        schema: Option<Value>,
        resume_id: Option<String>,
        label: Option<String>,
        phase: Option<String>,
        app_handle: AppHandle,
    ) -> Result<AgentRunResult, String> {
        let start_time = Instant::now();
        let target_provider = self.resolve_provider(provider.as_deref(), phase.as_deref()).await;
        let requested_effort = effort.unwrap_or_else(|| "high".to_string());
        let effective_effort = self.get_effective_effort(&target_provider, &requested_effort).await;

        let is_agy = target_provider == "antigravity";
        let binary_name = if is_agy {
            self.antigravity_bin.lock().await.clone()
        } else {
            self.claude_bin.lock().await.clone()
        };

        let mut args: Vec<String> = Vec::new();
        let effective_prompt = if is_agy && (effective_effort == "xhigh" || requested_effort == "ultracode") && !prompt.starts_with("/boost") {
            format!("/boost {}", prompt)
        } else {
            prompt.clone()
        };

        args.push("-p".to_string());
        args.push(effective_prompt);
        args.push("--output-format".to_string());
        args.push("stream-json".to_string());
        args.push("--verbose".to_string());

        if is_agy {
            args.push("--mode".to_string());
            args.push("accept-edits".to_string());
            if let Some(r_id) = &resume_id {
                args.push("--conversation-id".to_string());
                args.push(r_id.clone());
            }
        } else {
            args.push("--permission-mode".to_string());
            args.push("acceptEdits".to_string());
            if let Some(r_id) = &resume_id {
                args.push("--resume".to_string());
                args.push(r_id.clone());
            }
        }

        args.push("--effort".to_string());
        args.push(effective_effort.clone());

        if let Some(s) = &schema {
            args.push("--json-schema".to_string());
            args.push(s.to_string());
        }

        let mut cmd = Command::new(&binary_name);
        cmd.args(&args);
        if let Some(ref c) = cwd {
            cmd.current_dir(c);
        }
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        cmd.env("FORCE_COLOR", "0");

        let agent_label = label.unwrap_or_else(|| "subagent".to_string());
        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                let err_msg = format!("Falha ao iniciar processo '{}': {}", binary_name, e);
                let notif = SystemNotification {
                    id: format!("notif_err_{}", chrono::Utc::now().timestamp_millis()),
                    code: "HCS-ERR-SPAWN".to_string(),
                    kind: "error".to_string(),
                    severity: "critical".to_string(),
                    title: format!("Falha ao iniciar '{}'", binary_name),
                    message: err_msg.clone(),
                    timestamp: chrono::Utc::now().timestamp_millis(),
                    acknowledged: false,
                    source_trace: NotificationSourceTrace {
                        run_id: None,
                        agent_id: agent_id.clone(),
                        term_id: None,
                        pane_id: None,
                        conversation_id: resume_id.clone(),
                        provider: Some(target_provider.clone()),
                        worktree_path: cwd.clone(),
                        file_target: None,
                        line_hint: None,
                    },
                    improvement_id: None,
                };
                let _ = app_handle.emit("ultracode:system-notification", &notif);
                return Err(err_msg);
            }
        };

        let stdout = child.stdout.take().ok_or("Falha ao capturar stdout")?;
        let mut reader = BufReader::new(stdout).lines();

        let mut full_output = String::new();
        let mut total_tokens = 0usize;
        let mut last_conversation_id = resume_id.clone();

        while let Ok(Some(line)) = reader.next_line().await {
            full_output.push_str(&line);
            full_output.push('\n');

            let _ = app_handle.emit(
                "ultracode:agent-stream",
                AgentStreamPayload {
                    label: agent_label.clone(),
                    provider: target_provider.clone(),
                    chunk: format!("{}\n", line),
                },
            );

            // Parser de telemetria NDJSON
            if let Ok(evt) = serde_json::from_str::<Value>(&line) {
                if let Some(cid) = evt.get("session_id").or_else(|| evt.get("conversation_id")).and_then(|v| v.as_str()) {
                    last_conversation_id = Some(cid.to_string());
                }

                let mut tokens_delta = 0usize;
                if let Some(usage) = evt.get("usage") {
                    let in_tok = usage.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                    let out_tok = usage.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                    tokens_delta = in_tok + out_tok;
                    total_tokens += tokens_delta;
                }

                let (evt_type, text_content) = if evt.get("type").and_then(|t| t.as_str()) == Some("thinking") {
                    ("thinking".to_string(), evt.get("thinking").and_then(|t| t.as_str()).unwrap_or("A raciocinar...").to_string())
                } else if evt.get("type").and_then(|t| t.as_str()) == Some("tool_use") || evt.get("tool_name").is_some() {
                    let t_name = evt.get("tool_name").and_then(|t| t.as_str()).unwrap_or("tool").to_string();
                    let input_str = evt.get("input").map(|i| i.to_string()).unwrap_or_default();
                    ("tool_use".to_string(), format!("[Tool: {}] {}", t_name, input_str))
                } else {
                    let t = evt.get("delta").and_then(|d| d.get("text")).and_then(|s| s.as_str())
                        .or_else(|| evt.get("response").and_then(|s| s.as_str()))
                        .or_else(|| evt.get("result").and_then(|s| s.as_str()))
                        .unwrap_or("");
                    ("text".to_string(), t.to_string())
                };

                let _ = app_handle.emit(
                    "ultracode:agent-telemetry",
                    AgentTelemetryPayload {
                        agent_id: agent_id.clone(),
                        label: agent_label.clone(),
                        provider: target_provider.clone(),
                        effective_effort: effective_effort.clone(),
                        event_type: evt_type,
                        text: text_content,
                        tool_name: None,
                        conversation_id: last_conversation_id.clone(),
                        tokens_delta: Some(tokens_delta),
                        cwd: cwd.clone(),
                    },
                );
            }
        }

        let elapsed_ms = start_time.elapsed().as_millis() as u64;
        if elapsed_ms > 45_000 {
            let notif = SystemNotification {
                id: format!("notif_btl_{}", chrono::Utc::now().timestamp_millis()),
                code: format!("HCS-BTL-{}", &target_provider[..target_provider.len().min(3)].to_uppercase()),
                kind: "bottleneck".to_string(),
                severity: "warning".to_string(),
                title: format!("Gargalo de Latência Detectado ({:.1}s)", elapsed_ms as f64 / 1000.0),
                message: format!("O agente '{}' ({}) excedeu o limite de 45s (tempo total: {}ms).", agent_label, target_provider, elapsed_ms),
                timestamp: chrono::Utc::now().timestamp_millis(),
                acknowledged: false,
                source_trace: NotificationSourceTrace {
                    run_id: None,
                    agent_id: agent_id.clone(),
                    term_id: None,
                    pane_id: None,
                    conversation_id: last_conversation_id.clone(),
                    provider: Some(target_provider.clone()),
                    worktree_path: cwd.clone(),
                    file_target: None,
                    line_hint: None,
                },
                improvement_id: None,
            };
            let _ = app_handle.emit("ultracode:system-notification", &notif);
        }

        let status = child.wait().await.map_err(|e| e.to_string())?;
        if !status.success() && full_output.trim().is_empty() {
            let code_num = status.code().unwrap_or(1);
            let notif = SystemNotification {
                id: format!("notif_err_{}", chrono::Utc::now().timestamp_millis()),
                code: format!("HCS-ERR-{}", code_num),
                kind: "error".to_string(),
                severity: "critical".to_string(),
                title: format!("Erro no Agente '{}'", agent_label),
                message: format!("O processo '{}' encerrou com status de falha {}.", binary_name, status),
                timestamp: chrono::Utc::now().timestamp_millis(),
                acknowledged: false,
                source_trace: NotificationSourceTrace {
                    run_id: None,
                    agent_id: agent_id.clone(),
                    term_id: None,
                    pane_id: None,
                    conversation_id: last_conversation_id.clone(),
                    provider: Some(target_provider.clone()),
                    worktree_path: cwd.clone(),
                    file_target: None,
                    line_hint: None,
                },
                improvement_id: None,
            };
            let _ = app_handle.emit("ultracode:system-notification", &notif);
            return Err(format!("Processo encerrou com status {}", status));
        }

        // Tenta extrair resposta estruturada final
        let output_val = if let Some(ref s) = schema {
            UltracodeGates::validate_schema(&full_output, s).unwrap_or(Value::String(full_output.trim().to_string()))
        } else {
            Value::String(full_output.trim().to_string())
        };

        Ok(AgentRunResult {
            provider: target_provider,
            effective_effort,
            output: output_val,
            tokens: total_tokens.max(350),
            conversation_id: last_conversation_id,
            cwd,
        })
    }

    /// Executa um comando determinístico de verificação (ex: `npm test`, `eslint`)
    pub async fn run_deterministic_command(
        &self,
        command_str: &str,
        cwd: Option<&str>,
        timeout_ms: u64,
    ) -> Result<DeterministicCmdResult, String> {
        let (prog, args) = if cfg!(target_os = "windows") {
            ("powershell.exe", vec!["-NoProfile", "-Command", command_str])
        } else {
            ("sh", vec!["-c", command_str])
        };

        let mut cmd = Command::new(prog);
        cmd.args(args);
        if let Some(c) = cwd {
            cmd.current_dir(c);
        }
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        cmd.env("CI", "true");
        cmd.env("FORCE_COLOR", "0");

        let child = cmd.spawn().map_err(|e| format!("Falha ao executar comando: {}", e))?;

        let timeout_fut = tokio::time::sleep(Duration::from_millis(timeout_ms));
        tokio::select! {
            output_res = child.wait_with_output() => {
                match output_res {
                    Ok(out) => {
                        let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                        let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                        let code = out.status.code().unwrap_or(1);
                        Ok(DeterministicCmdResult {
                            ok: out.status.success(),
                            exit_code: code,
                            stdout,
                            stderr,
                        })
                    }
                    Err(e) => Err(format!("Erro ao aguardar processo: {}", e)),
                }
            }
            _ = timeout_fut => {
                Err(format!("Comando atingiu timeout de {}ms", timeout_ms))
            }
        }
    }
}
