// src/tauri-bridge.js
// Bridges Tauri v2 Rust commands and events to the HiperCloudShell UI

export function initTauriBridge() {
  if (typeof window === 'undefined') return;

  const hasTauri =
    (typeof window.__TAURI__ !== 'undefined' && window.__TAURI__.core) ||
    typeof window.__TAURI_INTERNALS__ !== 'undefined';

  if (!hasTauri) {
    return;
  }

  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  const bridge = {
    // Event listeners
    onWorkflowUpdate: (callback) => {
      const unlistenPromise = listen('ultracode:workflow-update', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },
    onAgentStream: (callback) => {
      const unlistenPromise = listen('ultracode:agent-stream', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },
    onAgentTelemetry: (callback) => {
      const unlistenPromise = listen('ultracode:agent-telemetry', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },
    onTermData: (callback) => {
      const unlistenPromise = listen('ultracode:term-data', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },

    // Commands
    setProvider: (provider) => invoke('ultracode_set_provider', { provider }),
    setTokenBudget: (runId, maxTokensPerRun) =>
      invoke('ultracode_set_token_budget', { runId, maxTokensPerRun: Number(maxTokensPerRun) || 0 }),
    setEffort: (effortLevel) => invoke('ultracode_set_effort', { effortLevel }),
    getSquadCatalog: () => invoke('ultracode_get_squad_catalog'),
    launchSquad: (slug, customPrompt, applyRecommendedCaps = true) =>
      invoke('ultracode_launch_squad', {
        slug,
        customPrompt: customPrompt || null,
        applyRecommendedCaps: Boolean(applyRecommendedCaps)
      }),
    submitPrompt: (prompt, options = {}) =>
      invoke('ultracode_submit_prompt', { prompt, options }),
    approveRun: (runId, editedScript, { args, maxTokensPerRun } = {}) =>
      invoke('ultracode_approve_run', {
        runId,
        editedScript: editedScript || null,
        args: args || null,
        maxTokensPerRun: maxTokensPerRun ? Number(maxTokensPerRun) : null
      }),
    pauseRun: (runId) => invoke('ultracode_pause_run', { runId }),
    resumeRun: (runId) => invoke('ultracode_resume_run', { runId }),
    saveWorkflow: (runId, name) => invoke('ultracode_save_workflow', { runId, name: name || null }),

    // Terminais & PTY Hot-Takeover
    createTerminal: (termId, cwd) =>
      invoke('ultracode_term_create', { termId, cwd: cwd || null }),
    takeoverAgentTerminal: ({ termId, provider, conversationId, cwd }) =>
      invoke('ultracode_term_takeover', {
        termId,
        provider,
        conversationId: conversationId || null,
        cwd: cwd || null
      }),
    termWrite: (termId, input) => invoke('ultracode_term_write', { termId, input }),

    // Grid PTY
    runDag: (dagTasks) => invoke('maestro_run_dag', { dagTasks }),
    paneWrite: (paneId, text) => invoke('term_write', { paneId, text }),
    paneResize: (paneId, cols, rows) => invoke('term_resize', { paneId, cols, rows }),
    paneKill: (paneId) => invoke('term_kill', { paneId })
  };

  window.ultracodeAPI = bridge;
  window.hiperAPI = bridge;
}

initTauriBridge();
