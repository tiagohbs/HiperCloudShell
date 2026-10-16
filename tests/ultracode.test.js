// tests/ultracode.test.js
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { BlackboardManager } from '../orchestrator/blackboard.js';
import { WorktreeManager } from '../orchestrator/worktree-manager.js';
import { ConcurrencySemaphore, UltracodeGates } from '../orchestrator/gates.js';
import { MaestroOrchestrator } from '../orchestrator/maestro.js';

describe('Ultracode Gates & Concurrency Semaphore', () => {
  test('ConcurrencySemaphore respects concurrency limits', async () => {
    const sem = new ConcurrencySemaphore(2);
    let concurrentCount = 0;
    let maxObserved = 0;

    const worker = async () => {
      await sem.acquire();
      concurrentCount++;
      maxObserved = Math.max(maxObserved, concurrentCount);
      await new Promise((r) => setTimeout(r, 20));
      concurrentCount--;
      sem.release();
    };

    await Promise.all([worker(), worker(), worker(), worker(), worker()]);
    assert.equal(maxObserved, 2);
    assert.equal(sem.current, 0);
  });

  test('enforceAgentCap throws on 1000 agents to prevent infinite loops', () => {
    assert.throws(() => {
      UltracodeGates.enforceAgentCap(1000, 1000);
    }, /trava anti-loop/);
  });

  test('validateSchema verifies types and extracts markdown JSON code blocks', () => {
    const schema = {
      type: 'object',
      properties: { target: { type: 'string' }, count: { type: 'number' } },
      required: ['target', 'count']
    };

    // Bloco markdown com JSON
    const markdownResponse = '```json\n{"target": "src/api.js", "count": 5}\n```';
    const validResult = UltracodeGates.validateSchema(markdownResponse, schema);
    assert.equal(validResult.valid, true);
    assert.equal(validResult.value.target, 'src/api.js');
    assert.equal(validResult.value.count, 5);

    // JSON com campo faltando
    const invalidResult = UltracodeGates.validateSchema('{"target": "src/api.js"}', schema);
    assert.equal(invalidResult.valid, false);
    assert.match(invalidResult.error, /Campo obrigatorio ausente: "count"/);
  });
});

describe('Ultracode Trigger Detection & Session Effort', () => {
  test('detects keyword in prompt and respects dismissal', () => {
    const maestro = new MaestroOrchestrator({});

    const trig1 = maestro.detectUltracodeTrigger('ultracode: refatorar modulos');
    assert.equal(trig1.shouldRunWorkflow, true);
    assert.equal(trig1.trigger, 'prompt_keyword');

    // Com palavra dispensada (Alt+W)
    const trig2 = maestro.detectUltracodeTrigger('ultracode: refatorar modulos', {
      DismissedKeyword: true
    });
    assert.equal(trig2.shouldRunWorkflow, false);
  });

  test('session effort ultracode elevates effort to xhigh', () => {
    const bb = new BlackboardManager();
    bb.sessionEffort = 'ultracode';
    const maestro = new MaestroOrchestrator({ blackboard: bb });

    const trig = maestro.detectUltracodeTrigger('audit every single file');
    assert.equal(trig.shouldRunWorkflow, true);
    assert.equal(trig.effort, 'xhigh');
    assert.equal(trig.trigger, 'session_ultracode');
  });
});

describe('Ultracode Dynamic Workflows & Replay Cache', () => {
  let tmpRepo;

  before(() => {
    tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ultracode-test-'));
  });

  after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  });

  test('executes dynamic workflow in node:vm sandbox with Ordered Replay Cache', async () => {
    const blackboard = new BlackboardManager(tmpRepo);
    const worktreeManager = new WorktreeManager(tmpRepo);

    let callCount = 0;
    const mockLlm = {
      async runAgent({ prompt }) {
        callCount++;
        if (prompt.includes('discover-targets') || prompt.includes('Identifique')) {
          return { output: JSON.stringify({ targets: ['user.js', 'auth.js'] }), tokens: 100 };
        }
        if (prompt.includes('Analise profundamente')) {
          return {
            output: JSON.stringify({ target: 'user.js', hasIssue: true, finding: 'Missing CSRF' }),
            tokens: 150
          };
        }
        if (prompt.includes('revisor cetico') || prompt.includes('revisor')) {
          return {
            output: JSON.stringify({ confirmed: true, rationale: 'Confirmado na linha 14' }),
            tokens: 120
          };
        }
        return { output: 'Relatorio final verificado com sucesso.', tokens: 80 };
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      blackboard,
      worktreeManager,
      llmAdapter: mockLlm
    });

    const runState = await maestro.prepareWorkflowRun('ultracode: auditar rotas de seguranca');
    assert.ok(runState.id.startsWith('wf_'));

    const finalReport = await maestro.executeWorkflowRun(runState.id);
    assert.equal(finalReport, 'Relatorio final verificado com sucesso.');

    const finishedRun = blackboard.getRun(runState.id);
    assert.equal(finishedRun.status, 'completed');
    assert.ok(callCount >= 4);

    // Teste de Replay Ordenado: ao re-executar, deve ler do cache sem incrementar callCount
    const initialCallCount = callCount;
    await maestro.executeWorkflowRun(runState.id);
    assert.equal(callCount, initialCallCount, 'Subagentes completados devem ser recuperados do cache ordenado');
  });

  test('saves workflow script to .claude/workflows', () => {
    const bb = new BlackboardManager(tmpRepo);
    const runState = bb.createRun({
      id: 'wf_test_save',
      prompt: 'test prompt',
      script: 'return "hello from saved workflow";',
      meta: { name: 'audit-api' }
    });

    const result = bb.saveWorkflowToDisk(runState.id, 'audit-api');
    assert.equal(result.command, '/audit-api');
    assert.ok(fs.existsSync(result.filePath));
    const content = fs.readFileSync(result.filePath, 'utf-8');
    assert.equal(content, 'return "hello from saved workflow";');
  });
});
