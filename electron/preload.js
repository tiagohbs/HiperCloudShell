// electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';

// API Oficial do Modo Ultracode & Dynamic Workflows
const ultracodeAPI = {
  setEffort: (effort) => ipcRenderer.invoke('ultracode:set-effort', effort),
  submitPrompt: (prompt, options) =>
    ipcRenderer.invoke('ultracode:submit-prompt', { prompt, options }),
  approveRun: (runId, editedScript, args) =>
    ipcRenderer.invoke('ultracode:approve-run', { runId, editedScript, args }),
  pauseRun: (runId) => ipcRenderer.invoke('ultracode:pause-run', runId),
  resumeRun: (runId) => ipcRenderer.invoke('ultracode:resume-run', runId),
  saveWorkflow: (runId, name) => ipcRenderer.invoke('ultracode:save-workflow', { runId, name }),
  onWorkflowUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ultracode:workflow-update', handler);
    return () => ipcRenderer.removeListener('ultracode:workflow-update', handler);
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
