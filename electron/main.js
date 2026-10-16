// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TerminalManager } from './term.js';
import { MaestroOrchestrator } from './orchestrator/maestro.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

let mainWindow = null;
let termManager = null;
let maestro = null;

export function setupMaestroIpc(window, targetRepoRoot = repoRoot, cloudShellProvider = null, mirrorManager = null) {
  termManager = new TerminalManager(window, cloudShellProvider);
  maestro = new MaestroOrchestrator({
    repoRoot: targetRepoRoot,
    terminalManager: termManager,
    mirrorManager,
    mainWindow: window
  });

  // Dispara um plano completo em DAG vindo do Maestro Command Center (src/ask.jsx)
  ipcMain.handle('maestro:run-dag', async (_event, dagTasks) => {
    return await maestro.executeDagPlan(dagTasks);
  });

  // Permite ao usuario digitar manualmente em qualquer painel do Grid ou destravar prompts
  ipcMain.on('term:write', (_event, { paneId, text }) => {
    termManager.writeToPane(paneId, text);
  });

  // Redimensionamento dinamico do xterm.js no Grid (1x1, 2x2, 3x2)
  ipcMain.on('term:resize', (_event, { paneId, cols, rows }) => {
    termManager.resizePane(paneId, cols, rows);
  });

  // Botao de Kill/Reset manual por painel no cabecalho do Grid
  ipcMain.on('term:kill', (_event, { paneId }) => {
    termManager.killPane(paneId);
  });

  return { termManager, maestro };
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

  setupMaestroIpc(mainWindow, repoRoot);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(repoRoot, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(() => {
      // Fallback enquanto a UI React não é compilada
    });
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
