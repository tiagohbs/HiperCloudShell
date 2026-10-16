// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TerminalManager } from './term.js';
import { MaestroOrchestrator } from './orchestrator/maestro.js';
import { BlackboardManager } from './orchestrator/blackboard.js';
import { WorktreeManager } from './orchestrator/worktree-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

let mainWindow = null;
let termManager = null;
let maestro = null;
let blackboard = null;
let worktreeManager = null;

export function setupUltracodeIPC(window, projectRoot = repoRoot, llmAdapter = null) {
  blackboard = new BlackboardManager(projectRoot);
  worktreeManager = new WorktreeManager(projectRoot);
  termManager = new TerminalManager(window);
  maestro = new MaestroOrchestrator({
    repoRoot: projectRoot,
    terminalManager: termManager,
    blackboard,
    worktreeManager,
    mainWindow: window,
    llmAdapter
  });

  blackboard.on('workflow:update', (runSnapshot) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('ultracode:workflow-update', runSnapshot);
    }
  });

  // Handlers do modo Ultracode (Dynamic Workflows)
  ipcMain.handle('ultracode:set-effort', (_event, effortLevel) => {
    blackboard.sessionEffort = effortLevel; // 'high' | 'ultracode'
    return { effort: blackboard.sessionEffort };
  });

  ipcMain.handle('ultracode:submit-prompt', async (_event, { prompt, options = {} }) => {
    const detection = maestro.detectUltracodeTrigger(prompt, options);
    if (!detection.shouldRunWorkflow) {
      return { mode: 'single_turn', effort: detection.effort };
    }
    const runState = await maestro.prepareWorkflowRun(prompt, options);
    return { mode: 'workflow', effort: detection.effort, run: runState };
  });

  ipcMain.handle('ultracode:approve-run', async (_event, { runId, editedScript, args }) => {
    const run = blackboard.getRun(runId);
    if (run && editedScript) {
      run.script = editedScript;
    }
    maestro.executeWorkflowRun(runId, { args });
    return { started: true, runId };
  });

  ipcMain.handle('ultracode:pause-run', (_event, runId) => {
    maestro.pauseWorkflowRun(runId);
    return { paused: true };
  });

  ipcMain.handle('ultracode:resume-run', (_event, runId) => {
    maestro.resumeWorkflowRun(runId);
    return { resumed: true };
  });

  ipcMain.handle('ultracode:save-workflow', (_event, { runId, name }) => {
    return blackboard.saveWorkflowToDisk(runId, name);
  });

  // Handlers classicos do DAG & Grid de Terminais
  ipcMain.handle('maestro:run-dag', async (_event, dagTasks) => {
    return await maestro.executeDagPlan(dagTasks);
  });

  ipcMain.on('term:write', (_event, { paneId, text }) => {
    termManager.writeToPane(paneId, text);
  });

  ipcMain.on('term:resize', (_event, { paneId, cols, rows }) => {
    termManager.resizePane(paneId, cols, rows);
  });

  ipcMain.on('term:kill', (_event, { paneId }) => {
    termManager.killPane(paneId);
  });

  return { blackboard, worktreeManager, maestro, termManager };
}

export function setupMaestroIpc(window, targetRepoRoot = repoRoot) {
  return setupUltracodeIPC(window, targetRepoRoot);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  setupUltracodeIPC(mainWindow, repoRoot);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(repoRoot, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(() => {});
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (process.type === 'browser') {
  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
