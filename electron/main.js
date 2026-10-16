// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TerminalManager, DualEngineAdapter } from './term.js';
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
let llmAdapter = null;

export function setupUltracodeIPC(window, projectRoot = repoRoot, customAdapter = null) {
  blackboard = new BlackboardManager(projectRoot);
  worktreeManager = new WorktreeManager(projectRoot);
  termManager = new TerminalManager(window);
  llmAdapter = customAdapter || new DualEngineAdapter({
    defaultProvider: 'hybrid', // Usa Claude + Antigravity em conjunto por padrão
    projectRoot
  });

  maestro = new MaestroOrchestrator({
    repoRoot: projectRoot,
    terminalManager: termManager,
    blackboard,
    worktreeManager,
    mainWindow: window,
    llmAdapter
  });

  // Eventos em tempo real do Blackboard e do Streaming dos CLIs
  blackboard.on('workflow:update', (runSnapshot) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('ultracode:workflow-update', runSnapshot);
    }
  });

  llmAdapter.on('agent:stream', (streamEvent) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('ultracode:agent-stream', streamEvent);
    }
  });

  llmAdapter.on('agent:telemetry', (evt) => {
    for (const [runId, run] of blackboard.runs.entries()) {
      if (run.status === 'running' && evt.agentId) {
        blackboard.appendAgentTelemetry(runId, evt.agentId, evt);
      }
    }
    if (window && !window.isDestroyed()) {
      window.webContents.send('ultracode:agent-telemetry', evt);
    }
  });

  termManager.on('term:data', (payload) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('ultracode:term-data', payload);
    }
  });

  // Alterna entre 'claude', 'antigravity' ou 'hybrid'
  ipcMain.handle('ultracode:set-provider', (_event, provider) => {
    llmAdapter.defaultProvider = provider;
    return { provider: llmAdapter.defaultProvider };
  });

  ipcMain.handle('ultracode:set-token-budget', (_event, { runId, maxTokensPerRun }) => {
    const run = blackboard.getRun(runId);
    if (run) {
      run.maxTokensPerRun = Number(maxTokensPerRun) || 0;
      blackboard.emitUpdate(runId);
    }
    return { maxTokensPerRun };
  });

  ipcMain.handle('ultracode:set-effort', (_event, effortLevel) => {
    blackboard.sessionEffort = effortLevel; // 'high' | 'ultracode'
    return { effort: blackboard.sessionEffort };
  });

  ipcMain.handle('ultracode:submit-prompt', async (_event, { prompt, options = {} }) => {
    const detection = maestro.detectUltracodeTrigger(prompt, options);
    if (!detection.shouldRunWorkflow) {
      const directResult = await llmAdapter.runAgent({
        prompt,
        cwd: projectRoot,
        provider: options?.provider,
        effort: detection.effort,
        acceptEdits: false
      });
      return { mode: 'single_turn', effort: detection.effort, result: directResult };
    }
    const runState = await maestro.prepareWorkflowRun(prompt, options);
    return { mode: 'workflow', effort: detection.effort, run: runState };
  });

  ipcMain.handle('ultracode:approve-run', async (_event, { runId, editedScript, args, maxTokensPerRun }) => {
    const run = blackboard.getRun(runId);
    if (run) {
      if (editedScript) run.script = editedScript;
      if (maxTokensPerRun) run.maxTokensPerRun = Number(maxTokensPerRun) || 0;
    }
    maestro.executeWorkflowRun(runId, { args, maxTokensPerRun });
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

  // Catálogo Oficial de Squads & Templates (Harness)
  blackboard.seedDefaultTemplates();

  ipcMain.handle('ultracode:get-squad-catalog', () => {
    return blackboard.getSquadCatalog();
  });

  ipcMain.handle('ultracode:launch-squad', async (_event, { slug, customPrompt, applyRecommendedCaps }) => {
    const catalog = blackboard.getSquadCatalog();
    const squad = catalog.find((s) => s.slug === slug);
    if (!squad) throw new Error(`Squad ${slug} não encontrado.`);

    // Opcionalmente ajusta os tetos de esforço de Claude e Antigravity para o perfil ótimo do Squad
    if (applyRecommendedCaps && squad.recommendedEffort) {
      llmAdapter.setProviderMaxEffort('claude', squad.recommendedEffort.claude);
      llmAdapter.setProviderMaxEffort('antigravity', squad.recommendedEffort.antigravity);
    }

    const runState = await maestro.prepareWorkflowRun(
      customPrompt || `${squad.title}: ${squad.description}`,
      {
        customScript: squad.script,
        args: { prompt: customPrompt || '' },
        autoApprove: false
      }
    );

    return {
      run: runState,
      appliedCaps: llmAdapter.providerMaxEffort
    };
  });

  // Endpoints de Terminal PTY (para rodar `claude` ou `agy` interativos ou Hot-Takeover)
  ipcMain.handle('ultracode:term-create', (_event, { termId, cwd }) =>
    termManager.createSession(termId, { cwd: cwd || projectRoot })
  );
  ipcMain.handle('ultracode:term-takeover', (_event, { termId, provider, conversationId, cwd }) =>
    termManager.spawnInteractiveTakeover(termId, {
      provider,
      conversationId,
      cwd: cwd || projectRoot
    })
  );
  ipcMain.handle('ultracode:term-write', (_event, { termId, input }) =>
    termManager.write(termId, input)
  );

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

  return { blackboard, worktreeManager, maestro, termManager, llmAdapter };
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
