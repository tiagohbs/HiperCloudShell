import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

import { UltracodeGates } from '../orchestrator/gates.js';
import { WorktreeManager } from '../orchestrator/worktree-manager.js';
import { BlackboardManager } from '../orchestrator/blackboard.js';
import { MaestroOrchestrator } from '../orchestrator/maestro.js';
import { TerminalManager, DualEngineAdapter } from '../orchestrator/term.js';

describe('Autonomous Engineering Primitives & Circuit Breaker', () => {
  let tmpRepo;

  before(() => {
    tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'hcs-auto-eng-'));
    execSync('git init -b main', { cwd: tmpRepo, stdio: 'ignore' });
    execSync('git config user.name "Test Runner"', { cwd: tmpRepo, stdio: 'ignore' });
    execSync('git config user.email "test@hipercloudshell.io"', { cwd: tmpRepo, stdio: 'ignore' });
    fs.writeFileSync(path.join(tmpRepo, 'index.js'), 'export const hello = () => "world";\n', 'utf8');
    execSync('git add . && git commit -m "initial commit"', { cwd: tmpRepo, stdio: 'ignore' });
  });

  after(() => {
    try {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    } catch (_) {}
  });

  // ==========================================================================
  // 1. TOKEN FINANCIAL CIRCUIT BREAKER (UltracodeGates)
  // ==========================================================================
  test('UltracodeGates enforces token financial budget and clamps effort', () => {
    // Under budget: does not throw
    assert.doesNotThrow(() => {
      UltracodeGates.enforceTokenBudget(5000, 10000);
    });

    // Over budget: throws TOKEN_BUDGET_EXCEEDED error
    assert.throws(
      () => {
        UltracodeGates.enforceTokenBudget(10500, 10000);
      },
      (err) => {
        return err.code === 'TOKEN_BUDGET_EXCEEDED' && err.message.includes('10500 tokens');
      }
    );

    // Clamp effort per provider
    assert.equal(UltracodeGates.clampEffort('ultracode', 'xhigh'), 'xhigh');
    assert.equal(UltracodeGates.clampEffort('high', 'high'), 'high');
  });

  // ==========================================================================
  // 2. TERMINAL MANAGER: NDJSON TELEMETRY, DETERMINISTIC CMD & TAKEOVER
  // ==========================================================================
  test('TerminalManager parses live NDJSON telemetry events and runs commands', async () => {
    const adapter = new DualEngineAdapter({ projectRoot: tmpRepo });

    // Live tool use
    const toolEvt = adapter.parseLiveStreamEvent(
      JSON.stringify({ type: 'tool_use', tool_name: 'bash', input: { command: 'npm test' } }),
      'claude'
    );
    assert.equal(toolEvt.type, 'tool_use');
    assert.equal(toolEvt.toolName, 'bash');

    // Live thinking block
    const thinkEvt = adapter.parseLiveStreamEvent(
      JSON.stringify({ type: 'thinking', thinking: 'Analisando a árvore AST...' }),
      'claude'
    );
    assert.equal(thinkEvt.type, 'thinking');
    assert.ok(thinkEvt.text.includes('AST'));

    // Deterministic Command execution
    const successResult = await adapter.runDeterministicCommand('node -e "console.log(\'OK_TEST\')"');
    assert.equal(successResult.ok, true);
    assert.equal(successResult.exitCode, 0);
    assert.ok(successResult.stdout.includes('OK_TEST'));

    const failResult = await adapter.runDeterministicCommand('node -e "process.exit(2)"');
    assert.equal(failResult.ok, false);
    assert.equal(failResult.exitCode, 2);
  });

  // ==========================================================================
  // 3. SMART WORKTREE AUTO-MERGE & AI CONFLICT RESOLUTION
  // ==========================================================================
  test('WorktreeManager merges branch cleanly and resolves conflicts via resolverFn', async () => {
    const wm = new WorktreeManager(tmpRepo);

    // Criar worktree 1 para alterar index.js
    const { branchName: b1, worktreePath: wt1 } = await wm.createIsolatedWorktree('feat-auto-1');
    fs.writeFileSync(path.join(wt1, 'feature1.js'), 'export const f1 = 1;\n', 'utf8');
    execSync('git add feature1.js && git commit -m "add feature1"', { cwd: wt1, stdio: 'ignore' });

    // Merge limpo
    const mergeClean = await wm.mergeWorktreeBranch(b1);
    assert.equal(mergeClean.merged, true);
    assert.equal(mergeClean.conflictsResolved, false);
    await wm.removeWorktree(wt1, b1);

    // Criar conflito intencional na branch 2
    const { branchName: b2, worktreePath: wt2 } = await wm.createIsolatedWorktree('feat-conflict');
    fs.writeFileSync(path.join(wt2, 'index.js'), 'export const hello = () => "conflict-b2";\n', 'utf8');
    execSync('git add index.js && git commit -m "change hello in b2"', { cwd: wt2, stdio: 'ignore' });

    // Modificar o mesmo arquivo na main
    fs.writeFileSync(path.join(tmpRepo, 'index.js'), 'export const hello = () => "conflict-main";\n', 'utf8');
    execSync('git add index.js && git commit -m "change hello in main"', { cwd: tmpRepo, stdio: 'ignore' });

    // Executa merge com resolverFn automática por IA
    let resolverCalled = false;
    const mergeWithConflict = await wm.mergeWorktreeBranch(b2, {
      resolverFn: async ({ conflictFiles, cwd }) => {
        resolverCalled = true;
        assert.ok(conflictFiles.includes('index.js'));
        // Resolve o conflito escrevendo a versão unificada
        fs.writeFileSync(
          path.join(cwd, 'index.js'),
          'export const hello = () => "resolved-by-ai";\n',
          'utf8'
        );
        return true;
      }
    });

    assert.equal(resolverCalled, true);
    assert.equal(mergeWithConflict.merged, true);
    assert.equal(mergeWithConflict.conflictsResolved, true);

    const mergedContent = fs.readFileSync(path.join(tmpRepo, 'index.js'), 'utf8');
    assert.ok(mergedContent.includes('resolved-by-ai'));

    await wm.removeWorktree(wt2, b2);
  });

  // ==========================================================================
  // 4. BLACKBOARD: MEMORY, TOKEN BUDGET & TELEMETRY
  // ==========================================================================
  test('BlackboardManager handles shared memory, telemetry sliding window, and max tokens', () => {
    const bb = new BlackboardManager(tmpRepo);
    const run = bb.createRun({ id: 'run-test-1', script: 'test', triggerType: 'keyword', maxTokensPerRun: 15000 });

    assert.equal(run.maxTokensPerRun, 15000);

    // Shared Memory
    bb.setMemory(run.id, 'auditKey', { passed: true, score: 98 });
    const memVal = bb.getMemory(run.id, 'auditKey');
    assert.deepEqual(memVal, { passed: true, score: 98 });

    // Telemetry sliding window
    for (let i = 0; i < 50; i++) {
      bb.appendAgentTelemetry(run.id, {
        agentId: 'sub-1',
        label: 'auditor',
        type: 'thinking',
        text: `Step ${i}`
      });
    }

    const updatedRun = bb.getRun(run.id);
    const ag = updatedRun.agents.find((a) => a.id === 'sub-1');
    assert.ok(ag);
    // Garante janela deslizante de no máximo 40 logs
    assert.equal(ag.logs.length, 40);
    assert.equal(ag.logs[ag.logs.length - 1].text, 'Step 49');
  });

  // ==========================================================================
  // 5. ADVANCED SANDBOX PRIMITIVES: consensus(), speculate(), verifyCmd(), memory
  // ==========================================================================
  test('Maestro executes consensus(), speculate(), and verifyCmd() inside sandbox', async () => {
    const executedAgents = [];

    const mockAdapter = {
      defaultProvider: 'hybrid',
      async runAgent(opts) {
        executedAgents.push(opts);
        if (opts.label === 'consensus:arbitrator') {
          return {
            output: { decision: 'unify', securityPassed: true },
            tokens: 300
          };
        }
        if (opts.label?.includes('consensus')) {
          return {
            output: { findings: [`finding from ${opts.provider}`] },
            tokens: 250
          };
        }
        return {
          output: `result for ${opts.label || 'agent'}`,
          tokens: 200
        };
      },
      async runDeterministicCommand(cmd) {
        return { ok: true, exitCode: 0, stdout: 'All tests passed', stderr: '' };
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      llmAdapter: mockAdapter
    });

    const advancedScript = `
phase("1. Consenso Multi-Provedor");
const c = await consensus({
  prompt: "Auditar autenticação",
  providerA: "claude",
  providerB: "antigravity",
  schema: { type: "object", properties: { decision: { type: "string" } } }
});
memory.set("consensusOutput", c.arbitrated);

phase("2. Execução Especulativa");
const s = await speculate({
  strategyA: async (ctx) => "patch A aplicado",
  strategyB: async (ctx) => "patch B aplicado",
  testCmd: "npm test"
});
memory.set("speculateWinner", s.winner);

phase("3. Validação Determinística");
const v = await verifyCmd("npm test");

return {
  consensusResult: c.arbitrated,
  winner: s.winner,
  verified: v.ok,
  savedMemory: memory.get("consensusOutput")
};
`;

    const runState = await maestro.prepareWorkflowRun('teste avancado', { customScript: advancedScript });
    const final = await maestro.executeWorkflowRun(runState.id);

    assert.ok(final);
    assert.equal(final.verified, true);
    assert.equal(final.winner, 'strategyA');
    assert.equal(final.consensusResult.decision, 'unify');
    assert.equal(final.savedMemory.decision, 'unify');

    const completed = maestro.blackboard.getRun(runState.id);
    assert.equal(completed.status, 'completed');
  });

  // ==========================================================================
  // 6. TOKEN BUDGET AUTO-PAUSE IN MAESTRO WORKFLOW
  // ==========================================================================
  test('Maestro automatically pauses workflow when token budget is exceeded', async () => {
    const highTokenAdapter = {
      defaultProvider: 'hybrid',
      async runAgent() {
        return {
          output: 'Heavy payload',
          tokens: 15000 // Excede orçamento de 10000
        };
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      llmAdapter: highTokenAdapter
    });

    const scriptWithMultipleAgents = `
phase("P1");
await agent("Task 1");
await agent("Task 2");
return "done";
`;

    const runState = await maestro.prepareWorkflowRun('limite financeiro', {
      customScript: scriptWithMultipleAgents,
      maxTokensPerRun: 10000 // Orçamento estrito
    });

    const result = await maestro.executeWorkflowRun(runState.id);
    assert.equal(result, null);

    const pausedRun = maestro.blackboard.getRun(runState.id);
    assert.equal(pausedRun.status, 'paused');
    assert.ok(pausedRun.pauseReason.includes('Disjuntor financeiro ativado'));
  });

  // ==========================================================================
  // 7. HARNESS PRIMITIVE (OVERCLOCK.SH HARNESS ARMOR)
  // ==========================================================================
  test('Maestro harness(config) wraps subagents with roles, skills, effort, and provider', async () => {
    let capturedAgentCall = null;
    const mockAdapter = {
      defaultProvider: 'hybrid',
      async runAgent(opts) {
        capturedAgentCall = opts;
        return {
          output: 'Harness validation passed',
          tokens: 150
        };
      }
    };

    const maestro = new MaestroOrchestrator({
      repoRoot: tmpRepo,
      llmAdapter: mockAdapter
    });

    const harnessScript = `
const secSpecialist = harness({
  role: "AppSec Fortress",
  provider: "claude",
  effort: "high",
  skills: ["owasp-top-10", "memory-safety"]
});

return await secSpecialist("Verificar integridade de entrada");
`;

    const runState = await maestro.prepareWorkflowRun('test harness', { customScript: harnessScript });
    const result = await maestro.executeWorkflowRun(runState.id);

    assert.equal(result, 'Harness validation passed');
    assert.ok(capturedAgentCall);
    assert.equal(capturedAgentCall.provider, 'claude');
    assert.equal(capturedAgentCall.effort, 'high');
    assert.equal(capturedAgentCall.label, 'AppSec Fortress');
    assert.ok(capturedAgentCall.prompt.includes('[ROLE: AppSec Fortress]'));
    assert.ok(capturedAgentCall.prompt.includes('[ACTIVE SKILLS / RULES: owasp-top-10, memory-safety]'));
    assert.ok(capturedAgentCall.prompt.includes('Verificar integridade de entrada'));
  });

  // ==========================================================================
  // 8. BUILTIN SQUAD TEMPLATES CATALOG & DISK SEEDING
  // ==========================================================================
  test('BlackboardManager seeds 7 Builtin Squad Templates to .claude/workflows and returns catalog', () => {
    const bb = new BlackboardManager(tmpRepo);
    const seeded = bb.seedDefaultTemplates();

    const expectedSquads = [
      'qa-mutation-hunter',
      'qa-e2e-visual-healer',
      'qa-chaos-fuzzer',
      'squad-frontend-cinema',
      'squad-backend-fortress',
      'squad-3d-shader-studio',
      'squad-cybersec-purple-team'
    ];

    for (const slug of expectedSquads) {
      assert.ok(seeded[slug], `Template ${slug} deve estar no seed`);
      const filePath = path.join(tmpRepo, '.claude', 'workflows', `${slug}.js`);
      assert.ok(fs.existsSync(filePath), `Arquivo ${slug}.js deve existir em .claude/workflows`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      assert.ok(fileContent.length > 50);
    }

    const catalog = bb.getSquadCatalog();
    assert.equal(catalog.length, 7);
    const mutationSquad = catalog.find((s) => s.slug === 'qa-mutation-hunter');
    assert.ok(mutationSquad);
    assert.equal(mutationSquad.command, '/qa-mutation-hunter');
    assert.equal(mutationSquad.recommendedEffort.claude, 'high');
    assert.equal(mutationSquad.recommendedEffort.antigravity, 'medium');

    const cinemaSquad = catalog.find((s) => s.slug === 'squad-frontend-cinema');
    assert.ok(cinemaSquad);
    assert.equal(cinemaSquad.category, 'Frontend & UX');
  });
});
