# Interface Frontend: Ponte IPC Tauri v2 (src/tauri-bridge.js)

> **Arquivo de Origem:** src/tauri-bridge.js  
> **Tamanho:** 153 linhas (5.7 KB)  

`javascript
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
    onSystemNotification: (callback) => {
      const unlistenPromise = listen('ultracode:system-notification', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },
    onImprovementUpdate: (callback) => {
      const unlistenPromise = listen('ultracode:improvement-update', (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    },
    onCloudShellAnomaly: (callback) => {
      const unlistenPromise = listen('ultracode:cloudshell-anomaly', (event) => {
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
    paneKill: (paneId) => invoke('term_kill', { paneId }),

    // Fast Worktrees & Merkle DAG Replay
    acquireFastWorktree: (taskId, baseRef) =>
      invoke('acquire_fast_worktree', { taskId, baseRef: baseRef || null }),
    releaseFastWorktree: (taskId, deleteBranch = true) =>
      invoke('release_fast_worktree', { taskId, deleteBranch: Boolean(deleteBranch) }),
    verifyMerkleReplay: (query) =>
      invoke('verify_merkle_replay', { query }),
    commitMerkleReplay: (entry) =>
      invoke('commit_merkle_replay', { entry }),

    // Comandos de Auto-Melhoria & Rastreamento de Notificações
    getSelfImprovementConfig: () => invoke('ultracode_get_self_improvement_config'),
    setSelfImprovementConfig: (config) =>
      invoke('ultracode_set_self_improvement_config', { config }),
    getNotifications: () => invoke('ultracode_get_notifications'),
    getImprovements: () => invoke('ultracode_get_improvements'),
    followNotificationSource: (notificationId) =>
      invoke('ultracode_follow_notification_source', { notificationId }),
    triggerSelfImprovement: ({ notificationCode, customGoal, engineOverride, targetFiles } = {}) =>
      invoke('ultracode_trigger_self_improvement', {
        notificationCode: notificationCode || null,
        customGoal: customGoal || null,
        engineOverride: engineOverride || null,
        targetFiles: targetFiles || null
      }),
    inspectCloudShell: (termId) => invoke('ultracode_cloudshell_inspect', { termId })
  };

  window.ultracodeAPI = bridge;
  window.hiperAPI = bridge;
}

initTauriBridge();
`
