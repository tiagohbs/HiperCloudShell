// tests/orchestrator.test.js
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { stripAnsi, TerminalManager } from '../orchestrator/term.js';
import { BlackboardManager } from '../orchestrator/blackboard.js';
import { WorktreeManager } from '../orchestrator/worktree-manager.js';
import { QualityGateRunner } from '../orchestrator/gates.js';
import { MaestroOrchestrator } from '../orchestrator/maestro.js';

describe('Terminal Utilities & ANSI Stripper', () => {
  test('stripAnsi cleans terminal control sequences and colors', () => {
    const rawAnsi = '\u001b[31mError:\u001b[0m \u001b[1mProcess failed\u001b[22m';
    const clean = stripAnsi(rawAnsi);
    assert.equal(clean, 'Error: Process failed');
  });

  test('buildAgentLaunchCommand formats command per CLI adapter', () => {
    const tm = new TerminalManager();
    const cmdGemini = tm.buildAgentLaunchCommand('gemini', '.maestro/TASK_SPEC.md');
    assert.equal(cmdGemini, 'gemini --prompt-file ".maestro/TASK_SPEC.md"');

    const cmdClaude = tm.buildAgentLaunchCommand('claude', '.maestro/TASK_SPEC.md');
    assert.match(cmdClaude, /claude -p/);

    const cmdCustom = tm.buildAgentLaunchCommand('custom-cli', '.maestro/TASK_SPEC.md');
    assert.equal(cmdCustom, 'custom-cli ".maestro/TASK_SPEC.md"');
  });
});

describe('BlackboardManager', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('registers tasks and tracks token usage', () => {
    const bb = new BlackboardManager(tmpDir, 'test-session');
    bb.registerTasks([
      { id: 'T1', title: 'Task 1', roleId: 'coder', cli: 'gemini' }
    ]);

    const snapshot1 = bb.getSnapshot();
    assert.equal(snapshot1.tasks['T1'].status, 'PENDING');
    assert.equal(snapshot1.tasks['T1'].consumedTokens, 0);

    bb.recordTokens('T1', 150);
    const snapshot2 = bb.getSnapshot();
    assert.equal(snapshot2.globalBudget.consumedTokens, 150);
    assert.equal(snapshot2.tasks['T1'].consumedTokens, 150);
  });

  test('publishes artifacts and injects context pack markdown', () => {
    const bb = new BlackboardManager(tmpDir, 'test-session');
    bb.publishArtifact({
      taskId: 'T1',
      contracts: ['src/contracts/user.schema.js'],
      exportedSymbols: { UserSchema: 'z.object({})' },
      summary: 'Schema de usuario criado'
    });

    const worktreePath = path.join(tmpDir, 'worktree-t2');
    fs.mkdirSync(worktreePath, { recursive: true });

    const specFile = bb.injectContextPack(worktreePath, {
      id: 'T2',
      title: 'Implementar Usuario',
      roleId: 'backend',
      cli: 'claude',
      provider: 'local',
      prompt: 'Implemente o CRUD com base no contrato.',
      allowedReadFiles: ['src/contracts/user.schema.js'],
      allowedWriteFiles: ['src/user.js'],
      gateCommand: 'node --check src/user.js'
    });

    assert.ok(fs.existsSync(specFile));
    const content = fs.readFileSync(specFile, 'utf-8');
    assert.match(content, /TASK SPEC: T2 - Implementar Usuario/);
    assert.match(content, /src\/contracts\/user\.schema\.js/);
    assert.match(content, /<<MAESTRO_TASK_DONE>>/);
  });
});

describe('DAG Sanitization and Co-Change Coupling', () => {
  test('sanitizeDagCoupling adds dependency when files have direct overlap', () => {
    const orchestratorMock = Object.create(MaestroOrchestrator.prototype);
    orchestratorMock.worktrees = {
      detectCoChangeCoupling: (filesA, filesB) => {
        const overlap = filesA.some((f) => filesB.includes(f));
        return { hasCoupling: overlap, conflicts: [] };
      }
    };

    const tasks = [
      { id: 'T1', allowedWriteFiles: ['src/shared.js'] },
      { id: 'T2', allowedWriteFiles: ['src/shared.js'], dependsOn: [] }
    ];

    const sanitized = orchestratorMock.sanitizeDagCoupling(tasks);
    assert.deepEqual(sanitized[1].dependsOn, ['T1']);
  });
});

describe('QualityGateRunner', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('passes when deterministic command succeeds', async () => {
    const bb = new BlackboardManager(tmpDir, 'gate-sess-1');
    bb.registerTasks([{ id: 'GT1', title: 'Test Task' }]);

    const tm = { writeToPane: () => {}, killPane: () => {}, waitForTurnCompletion: async () => {} };
    const gates = new QualityGateRunner({ terminalManager: tm, blackboard: bb, maxRetries: 3 });

    const result = await gates.verifyAndHealTask({
      task: { id: 'GT1', gateCommand: 'node -e "process.exit(0)"' },
      paneId: 'pane-test',
      worktreePath: tmpDir
    });

    assert.equal(result.passed, true);
    assert.equal(bb.getSnapshot().tasks['GT1'].status, 'PASSED');
  });

  test('circuit breaker triggers and kills pane on max retries', async () => {
    const bb = new BlackboardManager(tmpDir, 'gate-sess-2');
    bb.registerTasks([{ id: 'GT2', title: 'Failing Task' }]);

    let killedPane = null;
    let writtenToPane = [];
    const tm = {
      writeToPane: (_paneId, text) => writtenToPane.push(text),
      killPane: (paneId) => { killedPane = paneId; },
      waitForTurnCompletion: async () => ({ reason: 'MOCK_RETRY_DONE' })
    };

    const gates = new QualityGateRunner({ terminalManager: tm, blackboard: bb, maxRetries: 2 });

    const result = await gates.verifyAndHealTask({
      task: { id: 'GT2', gateCommand: 'node -e "console.error(\\\"Intentional error\\\"); process.exit(1)"' },
      paneId: 'pane-fail',
      worktreePath: tmpDir
    });

    assert.equal(result.passed, false);
    assert.equal(result.circuitBroken, true);
    assert.equal(killedPane, 'pane-fail');
    assert.equal(bb.getSnapshot().tasks['GT2'].status, 'BLOCKED');
    assert.equal(writtenToPane.length, 1); // 1 retry instruction sent before 2nd fatal attempt
    assert.match(writtenToPane[0], /TENTATIVA 1\/2/);
  });
});

