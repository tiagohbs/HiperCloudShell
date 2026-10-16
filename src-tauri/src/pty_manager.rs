// src-tauri/src/pty_manager.rs
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex as StdMutex};
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TermDataPayload {
    #[serde(rename = "termId")]
    pub term_id: String,
    pub data: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CloudShellAnomalyPayload {
    pub code: String,
    #[serde(rename = "termId")]
    pub term_id: String,
    pub provider: String,
    pub cwd: Option<String>,
    pub snippet: String,
    pub timestamp: i64,
}

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    clean_buffer: Arc<StdMutex<String>>,
    cwd: Option<String>,
    provider: String,
    conversation_id: Option<String>,
}

#[derive(Clone)]
pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, Session>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn strip_ansi(input: &str) -> String {
        let re = regex::Regex::new(r"\x1b\[[0-9;]*[a-zA-Z]").unwrap();
        re.replace_all(input, "").to_string()
    }

    /// Cria uma nova sessão PTY/CloudShell com buffer inspecionável e detector de anomalias
    pub async fn create_session(
        &self,
        term_id: String,
        cwd: Option<String>,
        shell: Option<String>,
        env: Option<HashMap<String, String>>,
        app_handle: AppHandle,
    ) -> Result<(), String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: 34,
                cols: 120,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Falha ao abrir PTY: {}", e))?;

        let default_shell = if cfg!(target_os = "windows") {
            shell.unwrap_or_else(|| "powershell.exe".to_string())
        } else {
            shell.unwrap_or_else(|| std::env::var("SHELL").unwrap_or_else(|_| "bash".to_string()))
        };

        let mut cmd = CommandBuilder::new(default_shell);
        if let Some(ref c) = cwd {
            cmd.cwd(c);
        }
        if let Some(envs) = env {
            for (k, v) in envs {
                cmd.env(k, v);
            }
        }
        cmd.env("TERM", "xterm-256color");
        cmd.env("FORCE_COLOR", "1");

        let _child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Falha ao iniciar processo no PTY: {}", e))?;

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Falha ao clonar leitor PTY: {}", e))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Falha ao obter escritor PTY: {}", e))?;

        let clean_buffer = Arc::new(StdMutex::new(String::new()));
        let buffer_clone = Arc::clone(&clean_buffer);
        let t_id = term_id.clone();
        let cwd_clone = cwd.clone();

        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 {
                    break;
                }
                let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                let clean_chunk = Self::strip_ansi(&chunk);

                if let Ok(mut guard) = buffer_clone.lock() {
                    guard.push_str(&clean_chunk);
                    if guard.len() > 60_000 {
                        let drain_len = guard.len() - 45_000;
                        guard.drain(..drain_len);
                    }
                }

                // Detector em tempo real de falhas críticas no CloudShell
                if clean_chunk.contains("ERR!")
                    || clean_chunk.contains("panicked at")
                    || clean_chunk.contains("SyntaxError:")
                    || clean_chunk.contains("TOKEN_BUDGET_EXCEEDED")
                {
                    let _ = app_handle.emit(
                        "ultracode:cloudshell-anomaly",
                        CloudShellAnomalyPayload {
                            code: "HCS-ERR-PTY-501".to_string(),
                            term_id: t_id.clone(),
                            provider: "cloudshell".to_string(),
                            cwd: cwd_clone.clone(),
                            snippet: clean_chunk.chars().take(300).collect(),
                            timestamp: chrono::Utc::now().timestamp_millis(),
                        },
                    );
                }

                let _ = app_handle.emit(
                    "ultracode:term-data",
                    TermDataPayload {
                        term_id: t_id.clone(),
                        data: chunk,
                    },
                );
            }
        });

        let mut sessions = self.sessions.lock().await;
        sessions.insert(
            term_id,
            Session {
                master: pair.master,
                writer,
                clean_buffer,
                cwd,
                provider: "cloudshell".to_string(),
                conversation_id: None,
            },
        );

        Ok(())
    }

    /// Hot-Takeover: abre terminal PTY interativo acoplado diretamente à conversa do subagente
    pub async fn spawn_interactive_takeover(
        &self,
        term_id: String,
        provider: String,
        conversation_id: Option<String>,
        cwd: Option<String>,
        app_handle: AppHandle,
    ) -> Result<(), String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: 34,
                cols: 120,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

        let is_agy = provider == "antigravity";
        let binary = if is_agy { "agy" } else { "claude" };

        let mut cmd = CommandBuilder::new(binary);
        if let Some(ref c) = cwd {
            cmd.cwd(c);
        }

        if let Some(ref cid) = conversation_id {
            if is_agy {
                cmd.arg("--conversation-id");
                cmd.arg(cid);
            } else {
                cmd.arg("--resume");
                cmd.arg(cid);
            }
        }

        cmd.env("FORCE_COLOR", "1");
        cmd.env("TERM", "xterm-256color");

        let _child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Falha ao iniciar takeover no PTY: {}", e))?;

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| e.to_string())?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| e.to_string())?;

        let clean_buffer = Arc::new(StdMutex::new(String::new()));
        let buffer_clone = Arc::clone(&clean_buffer);
        let t_id = term_id.clone();

        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 {
                    break;
                }
                let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
                if let Ok(mut guard) = buffer_clone.lock() {
                    guard.push_str(&Self::strip_ansi(&chunk));
                }
                let _ = app_handle.emit(
                    "ultracode:term-data",
                    TermDataPayload {
                        term_id: t_id.clone(),
                        data: chunk,
                    },
                );
            }
        });

        let mut sessions = self.sessions.lock().await;
        sessions.insert(
            term_id,
            Session {
                master: pair.master,
                writer,
                clean_buffer,
                cwd,
                provider,
                conversation_id,
            },
        );

        Ok(())
    }

    /// Inicia uma sessão CloudShell dedicada ao Agente de Auto-Melhoria (Claude ou Antigravity)
    pub async fn spawn_cloudshell_improvement_agent(
        &self,
        term_id: String,
        engine: String, // "claude" | "antigravity"
        worktree_path: String,
        improvement_prompt: String,
        app_handle: AppHandle,
    ) -> Result<(), String> {
        let mut envs = HashMap::new();
        envs.insert("HCS_SELF_IMPROVEMENT".to_string(), "1".to_string());
        envs.insert("HCS_ENGINE".to_string(), engine.clone());

        self.create_session(
            term_id.clone(),
            Some(worktree_path),
            None,
            Some(envs),
            app_handle,
        )
        .await?;

        let escaped_prompt = improvement_prompt.replace('"', "\\\"");
        let cli_cmd = if engine == "antigravity" {
            format!("agy -p \"/boost {}\" --mode accept-edits --effort high\r", escaped_prompt)
        } else {
            format!("claude -p \"{}\" --permission-mode acceptEdits --effort xhigh\r", escaped_prompt)
        };

        self.write(&term_id, &cli_cmd).await?;
        Ok(())
    }

    /// Retorna o snapshot recente do buffer limpo e metadados da sessão CloudShell
    pub async fn inspect_session(&self, term_id: &str) -> Result<serde_json::Value, String> {
        let sessions = self.sessions.lock().await;
        if let Some(session) = sessions.get(term_id) {
            let tail = session
                .clean_buffer
                .lock()
                .map(|b| {
                    let len = b.len();
                    let start = len.saturating_sub(4000);
                    b[start..].to_string()
                })
                .unwrap_or_default();

            Ok(serde_json::json!({
                "termId": term_id,
                "cwd": session.cwd,
                "provider": session.provider,
                "conversationId": session.conversation_id,
                "bufferTail": tail
            }))
        } else {
            Err(format!("Sessão CloudShell {} não encontrada", term_id))
        }
    }

    pub async fn write(&self, term_id: &str, input: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().await;
        if let Some(session) = sessions.get_mut(term_id) {
            session
                .writer
                .write_all(input.as_bytes())
                .map_err(|e| e.to_string())?;
            session.writer.flush().map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("Sessão PTY {} não encontrada", term_id))
        }
    }

    pub async fn resize(&self, term_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().await;
        if let Some(session) = sessions.get(term_id) {
            session
                .master
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err(format!("Sessão PTY {} não encontrada", term_id))
        }
    }

    pub async fn kill(&self, term_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().await;
        sessions.remove(term_id);
        Ok(())
    }
}
