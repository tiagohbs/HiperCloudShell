import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { BlackboardManager } from '../orchestrator/blackboard.js';
import { TerminalManager, CloudShellEngine } from '../orchestrator/term.js';
import { MaestroOrchestrator } from '../orchestrator/maestro.js';

test('Self-Improvement System & CloudShell Engine', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hcs-self-imp-test-'));

  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await t.test('BlackboardManager emits system notifications and registers improvements', () => {
    const bb = new BlackboardManager(tempDir);

    const notif1 = bb.emitSystemNotification({
      kind: 'error',
      severity: 'critical',
      title: 'Teste de Falha Crítica',
      message: 'Exceção simulada no agente T1',
      sourceTrace: { agentId: 'ag_t1', paneId: 'pane-1', provider: 'claude' }
    });

    assert.ok(notif1.code.startsWith('HCS-ERR-'));
    assert.equal(notif1.kind, 'error');
    assert.equal(notif1.sourceTrace.agentId, 'ag_t1');

    const notif2 = bb.emitSystemNotification({
      kind: 'bottleneck',
      severity: 'warning',
      title: 'Gargalo em T2',
      message: 'Subagente levou 48s',
      sourceTrace: { agentId: 'ag_t2', paneId: 'pane-2', provider: 'antigravity' }
    });

    assert.ok(notif2.code.startsWith('HCS-BTL-'));

    const impTask = bb.registerImprovementTask({
      id: 'imp_test_1',
      sourceNotificationCode: notif1.code,
      category: 'error_fix',
      status: 'running_cloudshell',
      engine: 'claude',
      cloudshellTermId: 'cs_pane_1'
    });

    assert.equal(bb.state.selfImprovement.improvements['imp_test_1'].id, 'imp_test_1');
    assert.equal(bb.state.selfImprovement.notifications.length, 2);

    // Verifica persistência do log .jsonl
    const logPath = path.join(tempDir, '.maestro', 'self-improvement.log.jsonl');
    assert.ok(fs.existsSync(logPath));
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    assert.equal(lines.length, 2);
  });

  await t.test('CloudShellEngine is instantiated as default in TerminalManager', () => {
    const termMgr = new TerminalManager();
    assert.ok(termMgr.cloudShellProvider instanceof CloudShellEngine);

    const session = termMgr.cloudShellProvider.spawnSession({
      paneId: 'cs_test_pane',
      cwd: tempDir
    });

    assert.ok(session);
    assert.ok(termMgr.cloudShellProvider.activeCloudSessions.has('cs_test_pane'));
    session.kill();
  });

  await t.test('MaestroOrchestrator resolves self-improvement engine correctly', () => {
    const bb = new BlackboardManager(tempDir);
    const maestro = new MaestroOrchestrator({
      repoRoot: tempDir,
      blackboard: bb
    });

    bb.state.selfImprovement.preferredEngine = 'hybrid';
    assert.equal(maestro.resolveSelfImprovementEngine('bottleneck_opt'), 'antigravity');
    assert.equal(maestro.resolveSelfImprovementEngine('error_fix'), 'claude');

    bb.state.selfImprovement.preferredEngine = 'claude';
    assert.equal(maestro.resolveSelfImprovementEngine('bottleneck_opt'), 'claude');

    bb.state.selfImprovement.preferredEngine = 'antigravity';
    assert.equal(maestro.resolveSelfImprovementEngine('error_fix'), 'antigravity');
  });
});
