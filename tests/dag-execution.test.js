// tests/dag-execution.test.js
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EventEmitter } from 'node:events';

import { MaestroOrchestrator } from '../electron/orchestrator/maestro.js';

describe('Maestro DAG End-to-End Execution', () => {
  let tmpRepo;

  before(() => {
    tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-e2e-'));
    // Inicializa repositorio Git temporario isolado
    execSync('git init', { cwd: tmpRepo, stdio: 'pipe' });
    execSync('git config user.name "Maestro Test"', { cwd: tmpRepo, stdio: 'pipe' });
    execSync('git config user.email "test@maestro.local"', { cwd: tmpRepo, stdio: 'pipe' });
    fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Test Project\n', 'utf-8');
    execSync('git add README.md && git commit -m "chore: initial commit"', { cwd: tmpRepo, stdio: 'pipe' });
  });

  after(() => {
    try {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    } catch (_) {}
  });

  test('executes 2-step DAG sequentially with worktree isolation, gate check, and base merge', async () => {
    const mockTerminal = new EventEmitter();
    mockTerminal.spawnAgentPane = ({ paneId, taskId, cwd }) => {
      // Simula a escrita de um arquivo pelo agente dentro do seu worktree
      if (taskId === 'STEP_1') {
        fs.writeFileSync(path.join(cwd, 'contract.txt'), 'SCHEMA_V1', 'utf-8');
      } else if (taskId === 'STEP_2') {
        fs.writeFileSync(path.join(cwd, 'consumer.txt'), 'USES_SCHEMA_V1', 'utf-8');
      }
    };
    mockTerminal.waitForTurnCompletion = async () => ({ reason: 'MARKER_DETECTED' });
    mockTerminal.writeToPane = () => {};
    mockTerminal.killPane = () => {};

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      terminalManager: mockTerminal
    });

    const dagPlan = [
      {
        id: 'STEP_1',
        title: 'Gerar Contrato',
        roleId: 'architect',
        cli: 'gemini',
        provider: 'local',
        paneId: 'pane-1',
        dependsOn: [],
        expectedFiles: ['contract.txt'],
        publishedContracts: ['contract.txt'],
        gateCommand: 'node -e "process.exit(0)"',
        prompt: 'Gere contract.txt'
      },
      {
        id: 'STEP_2',
        title: 'Consumir Contrato',
        roleId: 'backend',
        cli: 'claude',
        provider: 'local',
        paneId: 'pane-2',
        dependsOn: ['STEP_1'],
        expectedFiles: ['consumer.txt'],
        gateCommand: 'node -e "process.exit(0)"',
        prompt: 'Consuma o contrato'
      }
    ];

    const finalSnapshot = await maestro.executeDagPlan(dagPlan);

    assert.equal(finalSnapshot.tasks['STEP_1'].status, 'PASSED');
    assert.equal(finalSnapshot.tasks['STEP_2'].status, 'PASSED');
    assert.deepEqual(finalSnapshot.sharedArtifacts.contracts, ['contract.txt']);

    // Verifica se os arquivos foram merged com sucesso na branch principal do repo
    assert.ok(fs.existsSync(path.join(tmpRepo, 'contract.txt')));
    assert.ok(fs.existsSync(path.join(tmpRepo, 'consumer.txt')));
  });
});
