// src/tauri-bridge.js
// Bridges Tauri v2 Rust commands and events to the HiperCloudShell UI

import { invoke as tauriInvoke, isTauri } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';

function getInvoke() {
  if (typeof window !== 'undefined' && window.__TAURI__?.core?.invoke) {
    return window.__TAURI__.core.invoke;
  }
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__?.invoke) {
    return window.__TAURI_INTERNALS__.invoke;
  }
  return tauriInvoke;
}

function getListen() {
  if (typeof window !== 'undefined' && window.__TAURI__?.event?.listen) {
    return window.__TAURI__.event.listen;
  }
  return tauriListen;
}

export function initTauriBridge() {
  if (typeof window === 'undefined') return null;

  let runningInTauri = false;
  try {
    runningInTauri = isTauri();
  } catch (err) {
    console.warn('[Tauri Bridge] Detecção isTauri falhou:', err);
    runningInTauri =
      typeof window.__TAURI_INTERNALS__ !== 'undefined' ||
      typeof window.__TAURI__ !== 'undefined';
  }

  const safeInvoke = async (command, args) => {
    if (!runningInTauri) {
      console.warn(`[Tauri Bridge] Modo Browser/Mock para: ${command}`, args);
      return null;
    }
    try {
      const invoker = getInvoke();
      return await invoker(command, args);
    } catch (err) {
      console.error(`[Tauri Bridge] Erro ao invocar ${command}:`, err);
      throw err;
    }
  };

  const safeListen = (eventName, callback) => {
    if (!runningInTauri) {
      return () => {};
    }
    const listener = getListen();
    let unlistenFn = null;
    let isCancelled = false;

    listener(eventName, (event) => {
      try {
        callback(event.payload);
      } catch (err) {
        console.error(`[Tauri Bridge] Erro no listener ${eventName}:`, err);
      }
    })
      .then((fn) => {
        if (isCancelled) {
          if (typeof fn === 'function') fn();
        } else {
          unlistenFn = fn;
        }
      })
      .catch((err) => {
        console.warn(`[Tauri Bridge] Falha ao registrar listener ${eventName}:`, err);
      });

    return () => {
      isCancelled = true;
      if (typeof unlistenFn === 'function') {
        unlistenFn();
      }
    };
  };

  const bridge = {
    isTauri: runningInTauri,

    // Event listeners
    onWorkflowUpdate: (callback) => safeListen('ultracode:workflow-update', callback),
    onAgentStream: (callback) => safeListen('ultracode:agent-stream', callback),
    onAgentTelemetry: (callback) => safeListen('ultracode:agent-telemetry', callback),
    onTermData: (callback) => safeListen('ultracode:term-data', callback),
    onSystemNotification: (callback) => safeListen('ultracode:system-notification', callback),
    onImprovementUpdate: (callback) => safeListen('ultracode:improvement-update', callback),
    onCloudShellAnomaly: (callback) => safeListen('ultracode:cloudshell-anomaly', callback),

    // Commands & Persisted Settings
    getAppSettings: () => safeInvoke('ultracode_get_app_settings'),
    setProvider: (provider) => safeInvoke('ultracode_set_provider', { provider }),
    setTokenBudget: (runId, maxTokensPerRun) =>
      safeInvoke('ultracode_set_token_budget', { runId, maxTokensPerRun: Number(maxTokensPerRun) || 0 }),
    setTokenBudgetUnlimited: (unlimited) =>
      safeInvoke('ultracode_set_token_budget_unlimited', { unlimited: Boolean(unlimited) }),
    setGlobalTokenBudget: (budget) =>
      safeInvoke('ultracode_set_global_token_budget', { budget: Number(budget) || 0 }),
    setEffort: (effortLevel) => safeInvoke('ultracode_set_effort', { effortLevel }),
    getSquadCatalog: () => safeInvoke('ultracode_get_squad_catalog'),
    launchSquad: (slug, customPrompt, applyRecommendedCaps = true) =>
      safeInvoke('ultracode_launch_squad', {
        slug,
        customPrompt: customPrompt || null,
        applyRecommendedCaps: Boolean(applyRecommendedCaps)
      }),
    submitPrompt: (prompt, options = {}) =>
      safeInvoke('ultracode_submit_prompt', { prompt, options }),
    approveRun: (runId, editedScript, { args, maxTokensPerRun } = {}) =>
      safeInvoke('ultracode_approve_run', {
        runId,
        editedScript: editedScript || null,
        args: args || null,
        maxTokensPerRun: maxTokensPerRun ? Number(maxTokensPerRun) : null
      }),
    pauseRun: (runId) => safeInvoke('ultracode_pause_run', { runId }),
    resumeRun: (runId) => safeInvoke('ultracode_resume_run', { runId }),
    saveWorkflow: (runId, name) => safeInvoke('ultracode_save_workflow', { runId, name: name || null }),

    // Terminais & PTY Hot-Takeover
    createTerminal: (termId, cwd) =>
      safeInvoke('ultracode_term_create', { termId, cwd: cwd || null }),
    takeoverAgentTerminal: ({ termId, provider, conversationId, cwd }) =>
      safeInvoke('ultracode_term_takeover', {
        termId,
        provider,
        conversationId: conversationId || null,
        cwd: cwd || null
      }),
    termWrite: (termId, input) => safeInvoke('ultracode_term_write', { termId, input }),

    // Grid PTY
    runDag: (dagTasks) => safeInvoke('maestro_run_dag', { dagTasks }),
    paneWrite: (paneId, text) => safeInvoke('term_write', { paneId, text }),
    paneResize: (paneId, cols, rows) => safeInvoke('term_resize', { paneId, cols, rows }),
    paneKill: (paneId) => safeInvoke('term_kill', { paneId }),

    // Fast Worktrees & Merkle DAG Replay
    acquireFastWorktree: (taskId, baseRef) =>
      safeInvoke('acquire_fast_worktree', { taskId, baseRef: baseRef || null }),
    releaseFastWorktree: (taskId, deleteBranch = true) =>
      safeInvoke('release_fast_worktree', { taskId, deleteBranch: Boolean(deleteBranch) }),
    verifyMerkleReplay: (query) =>
      safeInvoke('verify_merkle_replay', { query }),
    commitMerkleReplay: (entry) =>
      safeInvoke('commit_merkle_replay', { entry }),

    // Comandos de Auto-Melhoria & Rastreamento de Notificações
    getSelfImprovementConfig: () => safeInvoke('ultracode_get_self_improvement_config'),
    setSelfImprovementConfig: (config) =>
      safeInvoke('ultracode_set_self_improvement_config', { config }),
    getNotifications: () => safeInvoke('ultracode_get_notifications'),
    getImprovements: () => safeInvoke('ultracode_get_improvements'),
    followNotificationSource: (notificationId) =>
      safeInvoke('ultracode_follow_notification_source', { notificationId }),
    triggerSelfImprovement: ({ notificationCode, customGoal, engineOverride, targetFiles } = {}) =>
      safeInvoke('ultracode_trigger_self_improvement', {
        notificationCode: notificationCode || null,
        customGoal: customGoal || null,
        engineOverride: engineOverride || null,
        targetFiles: targetFiles || null
      }),
    inspectCloudShell: (termId) => safeInvoke('ultracode_cloudshell_inspect', { termId }),

    // Gestão de Projetos & GitHub
    getProjectContext: () => safeInvoke('ultracode_get_project_context'),
    gitSync: (action = 'status') => safeInvoke('ultracode_git_sync', { action }),
    githubListRepos: () => safeInvoke('ultracode_github_list_repos')
  };

  window.ultracodeAPI = bridge;
  window.hiperAPI = bridge;
  return bridge;
}

// Auto-inicializa com segurança
try {
  initTauriBridge();
} catch (e) {
  console.warn('[Tauri Bridge] Inicialização segura disparou aviso:', e);
}
