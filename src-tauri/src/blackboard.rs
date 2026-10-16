use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

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

pub struct BlackboardState {
    pub session_id: String,
    pub session_effort: String,
    pub engine_effort_caps: HashMap<String, String>,
    pub budget: GlobalBudget,
    pub runs: HashMap<String, WorkflowRunState>,
    pub telemetry_sliding_window: VecDeque<TelemetryEvent>,
    pub maestro_dir: PathBuf,
}

impl BlackboardState {
    pub fn new(project_root: &Path) -> Self {
        let maestro_dir = project_root.join(".maestro");
        if !maestro_dir.exists() {
            let _ = fs::create_dir_all(&maestro_dir);
        }

        let mut engine_effort_caps = HashMap::new();
        engine_effort_caps.insert("claude".to_string(), "xhigh".to_string());
        engine_effort_caps.insert("antigravity".to_string(), "high".to_string());

        let session_id = format!("maestro-{}", chrono::Utc::now().timestamp_millis());

        Self {
            session_id,
            session_effort: "high".to_string(),
            engine_effort_caps,
            budget: GlobalBudget::default(),
            runs: HashMap::new(),
            telemetry_sliding_window: VecDeque::with_capacity(40),
            maestro_dir,
        }
    }

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
        self.persist();
        run_state
    }

    pub fn get_run(&self, run_id: &str) -> Option<&WorkflowRunState> {
        self.runs.get(run_id)
    }

    pub fn get_run_mut(&mut self, run_id: &str) -> Option<&mut WorkflowRunState> {
        self.runs.get_mut(run_id)
    }

    pub fn record_tokens(&mut self, run_id: &str, tokens: u64) {
        self.budget.consumed_tokens += tokens;
        if let Some(run) = self.runs.get_mut(run_id) {
            run.tokens_used += tokens;
        }
        self.persist();
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

    pub fn persist(&self) {
        let file_path = self.maestro_dir.join("blackboard.json");
        let snapshot = serde_json::json!({
            "sessionId": self.session_id,
            "sessionEffort": self.session_effort,
            "engineEffortCaps": self.engine_effort_caps,
            "globalBudget": self.budget,
            "runsCount": self.runs.len(),
            "updatedAt": chrono::Utc::now().to_rfc3339()
        });
        let _ = fs::write(file_path, serde_json::to_string_pretty(&snapshot).unwrap_or_default());
    }
}

pub type SharedBlackboard = Arc<Mutex<BlackboardState>>;
