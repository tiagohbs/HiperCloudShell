// src-tauri/src/blackboard.rs
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, VecDeque};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleCacheEntry {
    pub merkle_key: String,
    pub task_id: String,
    pub harness_id: String,
    pub output_json: serde_json::Value,
    pub changed_files: Vec<String>,
    pub tokens_saved_on_hit: u64,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleQueryInput {
    pub task_id: String,
    pub harness_id: String,
    pub cli_engine: String,
    pub effort: String,
    pub prompt: String,
    pub allowed_read_files: Vec<String>,
    pub parent_merkle_keys: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalBudget {
    pub max_total_tokens: u64,
    pub consumed_tokens: u64,
    pub max_retries_per_task: u32,
    pub timeout_seconds_per_task: u32,
}

impl Default for GlobalBudget {
    fn default() -> Self {
        Self {
            max_total_tokens: 500_000,
            consumed_tokens: 0,
            max_retries_per_task: 3,
            timeout_seconds_per_task: 300,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionInfo {
    pub call_index: usize,
    pub label: String,
    pub provider: String,
    pub model: Option<String>,
    pub effort: Option<String>,
    pub prompt: String,
    pub status: String,
    pub started_at: i64,
    pub finished_at: Option<i64>,
    pub result_preview: Option<String>,
    pub tokens: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRunState {
    pub id: String,
    pub prompt: String,
    pub script: String,
    pub meta: serde_json::Value,
    pub status: String, // "pending_approval" | "running" | "paused" | "completed" | "failed"
    pub current_phase: String,
    pub total_agents_spawned: u32,
    pub active_agents_count: u32,
    pub tokens_used: u64,
    pub max_tokens_per_run: u64,
    pub pause_reason: Option<String>,
    pub shared_memory: serde_json::Value,
    pub started_at: i64,
    pub finished_at: Option<i64>,
    pub agents: Vec<AgentExecutionInfo>,
    pub final_result: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub timestamp: i64,
    pub agent_id: String,
    pub provider: String,
    pub event_type: String, // "tool_use", "thinking", "token_budget", "error", etc.
    pub message: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlackboardData {
    pub session_id: String,
    pub max_token_budget: u64,
    pub consumed_tokens: u64,
    pub merkle_cache: HashMap<String, MerkleCacheEntry>,
    pub node_merkle_map: HashMap<String, String>, // task_id -> ultimo merkle_key
    #[serde(default = "default_session_effort")]
    pub session_effort: String,
    #[serde(default = "default_engine_effort_caps")]
    pub engine_effort_caps: HashMap<String, String>,
    #[serde(default)]
    pub budget: GlobalBudget,
    #[serde(default)]
    pub runs: HashMap<String, WorkflowRunState>,
    #[serde(default)]
    pub telemetry_sliding_window: VecDeque<TelemetryEvent>,
}

fn default_session_effort() -> String {
    "high".to_string()
}

fn default_engine_effort_caps() -> HashMap<String, String> {
    let mut caps = HashMap::new();
    caps.insert("claude".to_string(), "xhigh".to_string());
    caps.insert("antigravity".to_string(), "high".to_string());
    caps
}

impl Default for BlackboardData {
    fn default() -> Self {
        Self {
            session_id: format!("session-{}", BlackboardState::now_secs()),
            max_token_budget: 500_000,
            consumed_tokens: 0,
            merkle_cache: HashMap::new(),
            node_merkle_map: HashMap::new(),
            session_effort: default_session_effort(),
            engine_effort_caps: default_engine_effort_caps(),
            budget: GlobalBudget::default(),
            runs: HashMap::new(),
            telemetry_sliding_window: VecDeque::with_capacity(40),
        }
    }
}

impl BlackboardData {
    pub fn create_run(
        &mut self,
        id: String,
        prompt: String,
        script: String,
        meta: serde_json::Value,
        max_tokens_per_run: u64,
    ) -> WorkflowRunState {
        let run_state = WorkflowRunState {
            id: id.clone(),
            prompt,
            script,
            meta,
            status: "pending_approval".to_string(),
            current_phase: "Initializing".to_string(),
            total_agents_spawned: 0,
            active_agents_count: 0,
            tokens_used: 0,
            max_tokens_per_run,
            pause_reason: None,
            shared_memory: serde_json::json!({}),
            started_at: chrono::Utc::now().timestamp_millis(),
            finished_at: None,
            agents: Vec::new(),
            final_result: None,
            error: None,
        };

        self.runs.insert(id, run_state.clone());
        run_state
    }

    pub fn get_run(&self, run_id: &str) -> Option<&WorkflowRunState> {
        self.runs.get(run_id)
    }

    pub fn get_run_mut(&mut self, run_id: &str) -> Option<&mut WorkflowRunState> {
        self.runs.get_mut(run_id)
    }

    pub fn record_tokens(&mut self, run_id: &str, tokens: u64) {
        self.consumed_tokens += tokens;
        self.budget.consumed_tokens += tokens;
        if let Some(run) = self.runs.get_mut(run_id) {
            run.tokens_used += tokens;
        }
    }

    pub fn add_telemetry(&mut self, event: TelemetryEvent) {
        if self.telemetry_sliding_window.len() >= 40 {
            self.telemetry_sliding_window.pop_front();
        }
        self.telemetry_sliding_window.push_back(event);
    }

    pub fn get_telemetry(&self) -> Vec<TelemetryEvent> {
        self.telemetry_sliding_window.iter().cloned().collect()
    }
}

#[derive(Clone)]
pub struct BlackboardState {
    pub repo_root: PathBuf,
    pub storage_path: PathBuf,
    data: Arc<Mutex<BlackboardData>>,
}

impl BlackboardState {
    pub fn new(repo_root: impl Into<PathBuf>, max_token_budget: u64) -> Result<Self, String> {
        let repo_root = repo_root.into();
        let maestro_dir = repo_root.join(".maestro");
        if !maestro_dir.exists() {
            fs::create_dir_all(&maestro_dir)
                .map_err(|e| format!("Erro ao criar diretorio .maestro: {}", e))?;
        }

        let storage_path = maestro_dir.join("blackboard.json");
        let initial_data = if storage_path.exists() {
            let raw = fs::read_to_string(&storage_path).unwrap_or_default();
            serde_json::from_str::<BlackboardData>(&raw).unwrap_or_else(|_| BlackboardData {
                session_id: format!("session-{}", Self::now_secs()),
                max_token_budget,
                ..Default::default()
            })
        } else {
            BlackboardData {
                session_id: format!("session-{}", Self::now_secs()),
                max_token_budget,
                ..Default::default()
            }
        };

        Ok(Self {
            repo_root,
            storage_path,
            data: Arc::new(Mutex::new(initial_data)),
        })
    }

    pub fn lock(&self) -> Result<std::sync::MutexGuard<'_, BlackboardData>, String> {
        self.data
            .lock()
            .map_err(|_| "Mutex do Blackboard corrompido".to_string())
    }

    /// Calcula o Merkle Hash (SHA-256) deterministico de um no do DAG
    pub fn compute_merkle_key(&self, input: &MerkleQueryInput) -> String {
        let mut hasher = Sha256::new();

        // 1. Identidade do Harness, Motor CLI, Esforco e Prompt
        hasher.update(b"HARNESS:");
        hasher.update(input.harness_id.as_bytes());
        hasher.update(b"|ENGINE:");
        hasher.update(input.cli_engine.as_bytes());
        hasher.update(b"|EFFORT:");
        hasher.update(input.effort.as_bytes());
        hasher.update(b"|PROMPT:");
        hasher.update(input.prompt.as_bytes());

        // 2. Hashes de conteudo dos arquivos de leitura (ordenados para determinismo)
        let mut sorted_files = input.allowed_read_files.clone();
        sorted_files.sort();

        for rel_file in sorted_files {
            hasher.update(b"|FILE:");
            hasher.update(rel_file.as_bytes());
            let full_path = self.repo_root.join(&rel_file);
            if let Ok(bytes) = fs::read(&full_path) {
                let mut file_hasher = Sha256::new();
                file_hasher.update(&bytes);
                hasher.update(file_hasher.finalize());
            } else {
                hasher.update(b":MISSING");
            }
        }

        // 3. Encadeamento Merkle: Hashes dos nos pais no DAG (A -> B -> C)
        let mut sorted_parents = input.parent_merkle_keys.clone();
        sorted_parents.sort();
        for parent_key in sorted_parents {
            hasher.update(b"|PARENT_MERKLE:");
            hasher.update(parent_key.as_bytes());
        }

        hex::encode(hasher.finalize())
    }

    /// Verifica se o no ja possui resultado valido no Merkle Replay Cache
    pub fn lookup_merkle_cache(
        &self,
        input: &MerkleQueryInput,
    ) -> Result<(String, Option<MerkleCacheEntry>), String> {
        let merkle_key = self.compute_merkle_key(input);
        let guard = self.lock()?;

        let hit = guard.merkle_cache.get(&merkle_key).cloned();
        Ok((merkle_key, hit))
    }

    /// Registra o resultado validado pelo Quality Gate no Merkle Cache e persiste atomicamente
    pub fn commit_merkle_entry(&self, entry: MerkleCacheEntry) -> Result<(), String> {
        let mut guard = self.lock()?;

        guard
            .node_merkle_map
            .insert(entry.task_id.clone(), entry.merkle_key.clone());
        guard
            .merkle_cache
            .insert(entry.merkle_key.clone(), entry);

        self.persist_atomic(&guard)
    }

    /// Incrementa tokens e retorna erro se o Token Financial Circuit Breaker disparar
    pub fn record_tokens_and_check_breaker(&self, delta_tokens: u64) -> Result<(u64, bool), String> {
        let mut guard = self.lock()?;

        guard.consumed_tokens = guard.consumed_tokens.saturating_add(delta_tokens);
        guard.budget.consumed_tokens = guard.consumed_tokens;
        let breaker_tripped = guard.consumed_tokens > guard.max_token_budget;

        self.persist_atomic(&guard)?;
        Ok((guard.consumed_tokens, breaker_tripped))
    }

    /// Escrita atomica (grava em .tmp e faz rename) para evitar JSON corrompido entre threads
    pub fn persist_atomic(&self, state: &BlackboardData) -> Result<(), String> {
        let tmp_path: PathBuf = self.storage_path.with_extension("json.tmp");
        let payload = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Erro ao serializar Blackboard: {}", e))?;

        fs::write(&tmp_path, payload)
            .map_err(|e| format!("Falha ao gravar Blackboard temporario: {}", e))?;

        if let Err(_) = fs::rename(&tmp_path, &self.storage_path) {
            let _ = fs::remove_file(&self.storage_path);
            fs::rename(&tmp_path, &self.storage_path)
                .map_err(|e| format!("Falha no rename atomico do Blackboard: {}", e))?;
        }

        Ok(())
    }

    pub fn persist(&self) -> Result<(), String> {
        let guard = self.lock()?;
        self.persist_atomic(&guard)
    }

    pub fn now_secs() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0)
    }
}

pub type SharedBlackboard = Arc<BlackboardState>;
