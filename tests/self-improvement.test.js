// tests/self-improvement.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { BlackboardManager } from '../orchestrator/blackboard.js';
import { MaestroOrchestrator } from '../orchestrator/maestro.js';
import { TerminalManager, CloudShellEngine } from '../orchestrator/term.js';

// Adaptador leve de compatibilidade Vitest/Jest -> node:test & node:assert
const vi = {
  fn: (impl) => {
    const calls = [];
    const fn = async function (...args) {
      calls.push(args);
      if (fn._impl) return fn._impl(...args);
      if (impl) return impl(...args);
    };
    fn.mock = { calls };
    fn.mockImplementationOnce = (oneImpl) => {
      const prev = fn._impl;
      fn._impl = async (...args) => {
        fn._impl = prev;
        return oneImpl(...args);
      };
      return fn;
    };
    fn.mockResolvedValue = (val) => {
      fn._impl = async () => val;
      return fn;
    };
    return fn;
  }
};

const expect = (actual) => ({
  toBe: (expected) => assert.equal(actual, expected),
  toEqual: (expected) => assert.deepEqual(actual, expected),
  toBeDefined: () => assert.ok(actual !== undefined && actual !== null),
  toBeGreaterThanOrEqual: (expected) =>
    assert.ok(actual >= expected, `Expected ${actual} to be >= ${expected}`),
  toMatch: (regex) =>
    assert.ok(regex.test(actual), `Expected ${actual} to match ${regex}`),
  toHaveBeenCalledTimes: (count) =>
    assert.equal(actual.mock.calls.length, count),
  toHaveBeenCalledWith: (...expectedArgs) => {
    assert.ok(actual.mock.calls.length > 0, 'Expected function to have been called');
    const lastCall = actual.mock.calls[actual.mock.calls.length - 1];
    expectedArgs.forEach((arg, i) => {
      if (arg && arg.__isStringContaining) {
        assert.ok(
          String(lastCall[i]).includes(arg.str),
          `Expected ${lastCall[i]} to contain ${arg.str}`
        );
      } else {
        assert.deepEqual(lastCall[i], arg);
      }
    });
  }
});
expect.stringContaining = (str) => ({ __isStringContaining: true, str });

describe('Sistema de Auto-Melhoria Contínua, Notificações e CloudShell', () => {
  let tmpRepoDir;
  let blackboard;
  let mockWorktreeManager;
  let mockLlmAdapter;
  let terminalManager;
  let maestro;

  beforeEach(() => {
    tmpRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hcs-self-imp-'));
    blackboard = new BlackboardManager(tmpRepoDir, 'test-session');
    blackboard.initSelfImprovementSystem();

    mockWorktreeManager = {
      createIsolatedWorktree: vi.fn(async (id) => {
        const wtPath = path.join(tmpRepoDir, '.worktrees', id);
        fs.mkdirSync(wtPath, { recursive: true });
        return {
          worktreePath: wtPath,
          branchName: `maestro/${id}`
        };
      }),
      commitWorktreeChanges: vi.fn(async () => true),
      detectCoChangeCoupling: vi.fn(() => ({ hasCoupling: false }))
    };

    mockLlmAdapter = {
      defaultProvider: 'hybrid',
      runAgent: vi.fn(async ({ provider, prompt }) => ({
        provider: provider || 'claude',
        effectiveEffort: 'high',
        output: JSON.stringify({
          rootCause: 'Loop síncrono bloqueante detectado no stream.',
          appliedFix: 'Refatorado para pipeline assíncrono em lote.',
          changedFiles: ['orchestrator/term.js']
        }),
        tokens: 410,
        conversationId: `conv_${provider || 'claude'}_991`,
        cwd: tmpRepoDir
      })),
      runDeterministicCommand: vi.fn(async () => ({
        ok: true,
        exitCode: 0,
        stdout: 'PASS tests/orchestrator.test.js',
        stderr: ''
      }))
    };

    const cloudShell = new CloudShellEngine({ projectRoot: tmpRepoDir });
    terminalManager = new TerminalManager(null, cloudShell);

    maestro = new MaestroOrchestrator({
      repoRoot: tmpRepoDir,
      blackboard,
      worktreeManager: mockWorktreeManager,
      llmAdapter: mockLlmAdapter,
      terminalManager
    });
  });

  it('1. Deve emitir notificações com códigos padronizados (HCS-ERR, HCS-BTL, HCS-IMP) e gravar log JSONL', () => {
    const errNotif = blackboard.emitSystemNotification({
      kind: 'error',
      severity: 'critical',
      title: 'Falha no Subagente de Auditoria',
      message: 'Schema JSON inválido retornado pelo processo.',
      sourceTrace: {
        runId: 'wf_123',
        agentId: 'wf_123_ag_0',
        paneId: 'pane-1',
        provider: 'claude',
        conversationId: 'conv_claude_001',
        worktreePath: '.worktrees/t1-architect',
        fileTarget: 'src/contracts/sync.schema.js'
      }
    });

    const btlNotif = blackboard.emitSystemNotification({
      kind: 'bottleneck',
      severity: 'warning',
      title: 'Gargalo de Execução Detectado',
      message: 'Subagente excedeu 45s de processamento.',
      sourceTrace: {
        agentId: 'T2_BACKEND',
        paneId: 'pane-2',
        provider: 'antigravity'
      }
    });

    expect(errNotif.code).toBe('HCS-ERR-001');
    expect(errNotif.sourceTrace.conversationId).toBe('conv_claude_001');
    expect(errNotif.sourceTrace.fileTarget).toBe('src/contracts/sync.schema.js');

    expect(btlNotif.code).toBe('HCS-BTL-002');
    expect(btlNotif.sourceTrace.paneId).toBe('pane-2');

    // Verifica persistência no arquivo de log contínuo (.maestro/self-improvement.log.jsonl)
    const logContent = fs.readFileSync(blackboard.improvementLogPath, 'utf8').trim().split('\n');
    expect(logContent.length).toBe(2);
    expect(JSON.parse(logContent[0]).code).toBe('HCS-ERR-001');
    expect(JSON.parse(logContent[1]).code).toBe('HCS-BTL-002');
  });

  it('2. Deve selecionar dinamicamente entre Claude, Antigravity e Hybrid conforme a configuração do usuário', () => {
    // Modo Hybrid (Padrão): Gargalos -> Antigravity | Erros -> Claude
    blackboard.state.selfImprovement.preferredEngine = 'hybrid';
    expect(maestro.resolveSelfImprovementEngine('bottleneck_opt')).toBe('antigravity');
    expect(maestro.resolveSelfImprovementEngine('error_fix')).toBe('claude');

    // Forçando Antigravity nas configurações do usuário
    blackboard.state.selfImprovement.preferredEngine = 'antigravity';
    expect(maestro.resolveSelfImprovementEngine('error_fix')).toBe('antigravity');

    // Forçando Claude nas configurações do usuário
    blackboard.state.selfImprovement.preferredEngine = 'claude';
    expect(maestro.resolveSelfImprovementEngine('bottleneck_opt')).toBe('claude');
  });

  it('3. Deve disparar o Agente de Auto-Melhoria no CloudShell em Worktree isolada e vincular à notificação de origem', async () => {
    blackboard.state.selfImprovement.preferredEngine = 'antigravity';

    const sourceNotif = blackboard.emitSystemNotification({
      code: 'HCS-BTL-105',
      kind: 'bottleneck',
      severity: 'warning',
      title: 'Lentidão em syncScopeToCloud',
      message: 'Tempo de sincronização acima de 48s.',
      sourceTrace: {
        agentId: 'T2_BACKEND',
        paneId: 'pane-2',
        provider: 'claude',
        worktreePath: '.worktrees/t2-backend',
        fileTarget: 'electron/mirror.js'
      }
    });

    const impTask = await maestro.triggerContinuousSelfImprovement(sourceNotif);

    // Verifica criação da Worktree isolada e vínculo bidirecional
    expect(mockWorktreeManager.createIsolatedWorktree).toHaveBeenCalledTimes(1);
    expect(impTask).toBeDefined();
    expect(impTask.sourceNotificationCode).toBe('HCS-BTL-105');
    expect(impTask.engine).toBe('antigravity');
    expect(impTask.status).toBe('ready_to_merge');
    expect(sourceNotif.improvementId).toBe(impTask.id);

    // Verifica que a sessão do CloudShell foi aberta para a melhoria
    expect(terminalManager.sessions.has(impTask.cloudshellTermId)).toBe(true);

    // Verifica que o commit na worktree foi efetuado após passar no Quality Gate
    expect(mockWorktreeManager.commitWorktreeChanges).toHaveBeenCalledWith(
      impTask.worktreePath,
      expect.stringContaining('self-improvement(HCS-BTL-105): auto-healed by antigravity')
    );

    // Limpa a sessão PTY de teste
    terminalManager.kill(impTask.cloudshellTermId);
  });

  it('4. Deve detectar gargalo automaticamente durante executeWorkflowRun quando subagente ultrapassa o threshold', async () => {
    // Configura threshold baixo (20ms) para simular gargalo em tempo real
    blackboard.state.selfImprovement.bottleneckThresholdMs = 20;

    mockLlmAdapter.runAgent.mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, 45));
      return {
        provider: 'antigravity',
        output: 'Análise concluída',
        tokens: 250,
        conversationId: 'conv_agy_slow_77'
      };
    });

    const run = blackboard.createRun({
      id: 'wf_bottleneck_test',
      prompt: 'Auditar performance',
      script: `
        phase("Análise");
        const res = await agent("Verificar gargalos", { label: "slow-analyzer", provider: "antigravity" });
        return res;
      `
    });

    await maestro.executeWorkflowRun(run.id);

    const bottleneckNotifs = blackboard.state.selfImprovement.notifications.filter(
      (n) => n.kind === 'bottleneck'
    );
    expect(bottleneckNotifs.length).toBeGreaterThanOrEqual(1);
    expect(bottleneckNotifs[0].code).toMatch(/^HCS-BTL-/);
    expect(bottleneckNotifs[0].sourceTrace.conversationId).toBe('conv_agy_slow_77');
    expect(bottleneckNotifs[0].sourceTrace.provider).toBe('antigravity');
  });
});
