// electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';

// API Oficial do Modo Ultracode & Dynamic Workflows
const ultracodeAPI = {
  setProvider: (provider) => ipcRenderer.invoke('ultracode:set-provider', provider),
  setEffort: (effort) => ipcRenderer.invoke('ultracode:set-effort', effort),
  submitPrompt: (prompt, options) =>
    ipcRenderer.invoke('ultracode:submit-prompt', { prompt, options }),
  approveRun: (runId, editedScript, args) =>
    ipcRenderer.invoke('ultracode:approve-run', { runId, editedScript, args }),
  pauseRun: (runId) => ipcRenderer.invoke('ultracode:pause-run', runId),
  resumeRun: (runId) => ipcRenderer.invoke('ultracode:resume-run', runId),
  saveWorkflow: (runId, name) => ipcRenderer.invoke('ultracode:save-workflow', { runId, name }),
  termCreate: (termId, cwd) => ipcRenderer.invoke('ultracode:term-create', { termId, cwd }),
  termWrite: (termId, input) => ipcRenderer.invoke('ultracode:term-write', { termId, input }),
  takeoverAgentTerminal: (payload) => ipcRenderer.invoke('ultracode:term-takeover', payload),
  setTokenBudget: (runId, maxTokensPerRun) =>
    ipcRenderer.invoke('ultracode:set-token-budget', { runId, maxTokensPerRun }),
  getSquadCatalog: () => ipcRenderer.invoke('ultracode:get-squad-catalog'),
  launchSquad: (slug, customPrompt, applyRecommendedCaps = true) =>
    ipcRenderer.invoke('ultracode:launch-squad', { slug, customPrompt, applyRecommendedCaps }),
  onWorkflowUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ultracode:workflow-update', handler);
    return () => ipcRenderer.removeListener('ultracode:workflow-update', handler);
  },
  onAgentStream: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ultracode:agent-stream', handler);
    return () => ipcRenderer.removeListener('ultracode:agent-stream', handler);
  },
  onTermData: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('ultracode:term-data', listener);
    return () => ipcRenderer.removeListener('ultracode:term-data', listener);
  }
};

// API do Orquestrador Clássico Maestro DAG e Terminais
const maestroAPI = {
  // DAG Execution
  runDag: (dagTasks) => ipcRenderer.invoke('maestro:run-dag', dagTasks),

  // Terminal Controls
  writeToPane: (paneId, text) => ipcRenderer.send('term:write', { paneId, text }),
  resizePane: (paneId, cols, rows) => ipcRenderer.send('term:resize', { paneId, cols, rows }),
  killPane: (paneId) => ipcRenderer.send('term:kill', { paneId }),

  // Event Listeners
  onTermData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('term:data', handler);
    return () => ipcRenderer.removeListener('term:data', handler);
  },
  onTermExit: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('term:exit', handler);
    return () => ipcRenderer.removeListener('term:exit', handler);
  },
  onBlackboardUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('maestro:blackboard-update', handler);
    return () => ipcRenderer.removeListener('maestro:blackboard-update', handler);
  },
  onGateStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('maestro:gate-status', handler);
    return () => ipcRenderer.removeListener('maestro:gate-status', handler);
  },
  onPaneStuck: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('maestro:pane-stuck', handler);
    return () => ipcRenderer.removeListener('maestro:pane-stuck', handler);
  },
  onAgentAutoApproved: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('maestro:agent-auto-approved', handler);
    return () => ipcRenderer.removeListener('maestro:agent-auto-approved', handler);
  }
};

contextBridge.exposeInMainWorld('ultracodeAPI', ultracodeAPI);
contextBridge.exposeInMainWorld('maestroAPI', maestroAPI);
contextBridge.exposeInMainWorld('hiperAPI', { ...maestroAPI, ...ultracodeAPI });
