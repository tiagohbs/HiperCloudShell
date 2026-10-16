# Núcleo Rust: Gerenciador PTY Interativo (Hot-Takeover & Terminal Virtual)

> **Arquivo de Origem:** src-tauri/src/pty_manager.rs  
> **Tamanho:** 244 linhas (7.0 KB)  
> **Descrição:** Gerenciador PTY baseado em portable-pty para spawn de sessões interativas no Windows (ConPTY) e Unix, permitindo que o usuário assuma qualquer subagente.

`rust
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TermDataPayload {
    #[serde(rename = "termId")]
    pub term_id: String,
    pub data: String,
}

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    _clean_buffer: String,
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

    /// Cria uma nova sessão PTY e inicia a thread de streaming para o frontend
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
        if let Some(c) = cwd {
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

        let t_id = term_id.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 {
                    break;
                }
                let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
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
                _clean_buffer: String::new(),
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
        if let Some(c) = cwd {
            cmd.cwd(c);
        }

        if let Some(cid) = conversation_id {
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

        let t_id = term_id.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 {
                    break;
                }
                let chunk = String::from_utf8_lossy(&buf[..n]).to_string();
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
                _clean_buffer: String::new(),
            },
        );

        Ok(())
    }

    /// Envia dados de teclado/input ao processo PTY
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

    /// Redimensiona o terminal PTY
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

    /// Encerra a sessão PTY
    pub async fn kill(&self, term_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().await;
        sessions.remove(term_id);
        Ok(())
    }
}
`
