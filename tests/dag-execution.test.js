// tests/dag-execution.test.js
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EventEmitter } from 'node:events';

import { MaestroOrchestrator } from '../electron/orchestrator/maestro.js';
import { DualEngineAdapter } from '../electron/term.js';

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

describe('DualEngineAdapter (Claude Code CLI + Antigravity CLI)', () => {
  const adapter = new DualEngineAdapter({ defaultProvider: 'hybrid' });

  test('resolves provider correctly for explicit options, model strings, and hybrid phases', () => {
    // 1. Explicit options
    assert.equal(adapter.resolveProvider({ provider: 'antigravity' }), 'antigravity');
    assert.equal(adapter.resolveProvider({ provider: 'claude' }), 'claude');

    // 2. Model inference
    assert.equal(adapter.resolveProvider({ model: 'gemini-2.5-pro' }), 'antigravity');
    assert.equal(adapter.resolveProvider({ model: 'claude-3-7-sonnet' }), 'claude');

    // 3. Hybrid phase routing heuristics
    assert.equal(adapter.resolveProvider({ phase: 'Descoberta (Antigravity)' }), 'antigravity');
    assert.equal(adapter.resolveProvider({ phase: 'Fan-Out Híbrido' }), 'antigravity');
    assert.equal(adapter.resolveProvider({ phase: 'Verificação Cruzada Adversarial' }), 'claude');
    assert.equal(adapter.resolveProvider({ phase: 'Síntese Executiva' }), 'claude');
  });

  test('formats CLI command arguments with JSON output, schemas, effort, and boost', () => {
    const testSchema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] };

    // Claude CLI arguments
    const claudeArgs = adapter.buildClaudeArgs({
      prompt: 'Refatore o módulo',
      effort: 'ultracode',
      acceptEdits: true,
      schema: testSchema
    });
    assert.ok(claudeArgs.includes('-p'));
    assert.ok(claudeArgs.includes('--output-format'));
    assert.ok(claudeArgs.includes('json'));
    assert.ok(claudeArgs.includes('--effort'));
    assert.ok(claudeArgs.includes('xhigh'));
    assert.ok(claudeArgs.includes('--permission-mode'));
    assert.ok(claudeArgs.includes('acceptEdits'));
    assert.ok(claudeArgs.includes('--json-schema'));
    assert.ok(claudeArgs.includes(JSON.stringify(testSchema)));

    // Antigravity CLI arguments
    const agyArgs = adapter.buildAntigravityArgs({
      prompt: 'Varra o repositório',
      effort: 'ultracode',
      acceptEdits: true,
      schema: testSchema
    });
    assert.ok(agyArgs.includes('-p'));
    assert.ok(agyArgs.some((a) => a.startsWith('/boost Varra o repositório')));
    assert.ok(agyArgs.includes('--output-format'));
    assert.ok(agyArgs.includes('--mode'));
    assert.ok(agyArgs.includes('accept-edits'));
    assert.ok(agyArgs.includes('--json-schema'));
  });

  test('normalizes CLI JSON envelopes and handles NDJSON line fallback', () => {
    // 1. Antigravity JSON envelope
    const agyJson = JSON.stringify({
      conversation_id: 'agy-session-999',
      status: 'SUCCESS',
      structured_output: { targets: ['fileA.js', 'fileB.js'] },
      usage: { total_tokens: 580 }
    });
    const parsedAgy = adapter.parseCliJsonEnvelope(agyJson, 'antigravity');
    assert.deepEqual(parsedAgy.output, { targets: ['fileA.js', 'fileB.js'] });
    assert.equal(parsedAgy.tokens, 580);
    assert.equal(parsedAgy.conversationId, 'agy-session-999');

    // 2. Claude Code JSON envelope
    const claudeJson = JSON.stringify({
      type: 'result',
      structured_output: { confirmed: true, rationale: 'Testes confirmaram a hipótese' },
      usage: { input_tokens: 300, output_tokens: 120 },
      session_id: 'claude-session-777'
    });
    const parsedClaude = adapter.parseCliJsonEnvelope(claudeJson, 'claude');
    assert.deepEqual(parsedClaude.output, { confirmed: true, rationale: 'Testes confirmaram a hipótese' });
    assert.equal(parsedClaude.tokens, 420);
    assert.equal(parsedClaude.conversationId, 'claude-session-777');

    // 3. NDJSON streaming fallback
    const ndjson = [
      '{"type":"init","session_id":"sess_1"}',
      '{"type":"progress","step":1}',
      '{"type":"result","result":"Síntese Final Concluída","usage":{"total_tokens":450}}'
    ].join('\n');
    const parsedNdjson = adapter.parseCliJsonEnvelope(ndjson, 'claude');
    assert.equal(parsedNdjson.output, 'Síntese Final Concluída');
    assert.equal(parsedNdjson.tokens, 450);
  });
});

describe('Cross-Provider Hybrid Orchestration (Maestro + DualEngineAdapter)', () => {
  let tmpRepo;

  before(() => {
    tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-hybrid-'));
    execSync('git init', { cwd: tmpRepo, stdio: 'pipe' });
    execSync('git config user.name "Hybrid Test"', { cwd: tmpRepo, stdio: 'pipe' });
    execSync('git config user.email "test@hybrid.local"', { cwd: tmpRepo, stdio: 'pipe' });
    fs.writeFileSync(path.join(tmpRepo, 'index.js'), 'console.log("hello");\n', 'utf-8');
    execSync('git add index.js && git commit -m "initial"', { cwd: tmpRepo, stdio: 'pipe' });
  });

  after(() => {
    try {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    } catch (_) {}
  });

  test('runs complete 4-phase hybrid dynamic workflow with cross-provider adversarial check', async () => {
    const executedCalls = [];

    const mockDualAdapter = {
      defaultProvider: 'hybrid',
      async runAgent({ prompt, provider, schema, label, phase }) {
        executedCalls.push({ label, provider, phase, schemaProvided: Boolean(schema) });

        if (label === 'agy-discover') {
          return {
            provider: 'antigravity',
            output: { targets: ['src/auth.js', 'src/payment.js'] },
            tokens: 280
          };
        }

        if (label?.startsWith('antigravity:analyze:') || label?.startsWith('claude:analyze:')) {
          return {
            provider,
            output: {
              target: 'src/auth.js',
              analyzer: provider,
              hasIssue: true,
              finding: 'Token JWT sem expiração configurada'
            },
            tokens: 350
          };
        }

        if (label?.includes('cross-verify')) {
          return {
            provider,
            output: {
              confirmed: true,
              rationale: 'Confirmado por inspeção do código da rota de login'
            },
            tokens: 410
          };
        }

        return {
          provider: 'claude',
          output: 'Relatório Executivo: 1 vulnerabilidade crítica validada e pronta para patch.',
          tokens: 500
        };
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      llmAdapter: mockDualAdapter
    });

    const runState = await maestro.prepareWorkflowRun('ultracode: auditar auth e pagamentos com verificação cruzada');
    const finalResult = await maestro.executeWorkflowRun(runState.id);

    assert.ok(finalResult);
    assert.ok(typeof finalResult === 'string' && finalResult.includes('Relatório Executivo'));

    // Verifica se ambas as provedoras foram acionadas nas fases correspondentes
    const providersUsed = new Set(executedCalls.map((c) => c.provider));
    assert.ok(providersUsed.has('antigravity'), 'Antigravity CLI deve ter sido utilizado na descoberta/análise');
    assert.ok(providersUsed.has('claude'), 'Claude CLI deve ter sido utilizado na verificação cruzada ou síntese');

    // Valida que o Blackboard registrou os provedores de cada subagente
    const completedRun = maestro.blackboard.getRun(runState.id);
    assert.equal(completedRun.status, 'completed');
    assert.ok(completedRun.agents.length >= 3);
    assert.ok(completedRun.agents.some((ag) => ag.provider === 'antigravity'));
  });

  test('aborts and pauses workflow gracefully when signal is triggered', async () => {
    let callCount = 0;
    const slowAdapter = {
      defaultProvider: 'hybrid',
      async runAgent({ signal }) {
        callCount++;
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve({ output: 'ok', tokens: 100 }), 300);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new Error('WORKFLOW_PAUSED'));
            });
          }
        });
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      llmAdapter: slowAdapter
    });

    const customScript = `
phase("P1");
await agent("Step 1");
await agent("Step 2");
return "done";
`;

    const runState = await maestro.prepareWorkflowRun('test abort', { customScript });
    const runPromise = maestro.executeWorkflowRun(runState.id);

    // Dispara pausa logo após iniciar
    setTimeout(() => {
      maestro.pauseWorkflowRun(runState.id);
    }, 40);

    const res = await runPromise;
    assert.equal(res, null);

    const pausedRun = maestro.blackboard.getRun(runState.id);
    assert.equal(pausedRun.status, 'paused');
  });
});
