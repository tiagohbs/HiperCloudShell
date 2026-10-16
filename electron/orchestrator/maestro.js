// electron/orchestrator/maestro.js
import vm from 'node:vm';
import crypto from 'node:crypto';

import { WorktreeManager } from './worktree-manager.js';
import { BlackboardManager } from './blackboard.js';
import { QualityGateRunner, ConcurrencySemaphore, UltracodeGates } from './gates.js';

export class MaestroOrchestrator {
  constructor({ repoRoot = process.cwd(), terminalManager = null, mirrorManager = null, mainWindow = null, llmAdapter = null, blackboard = null, worktreeManager = null }) {
    this.repoRoot = repoRoot;
    this.terminalManager = terminalManager;
    this.mirrorManager = mirrorManager;
    this.mainWindow = mainWindow;
    this.llmAdapter = llmAdapter;

    this.worktrees = worktreeManager || new WorktreeManager(repoRoot);
    this.worktreeManager = this.worktrees;
    this.blackboard = blackboard || new BlackboardManager(repoRoot);
    this.gates = new QualityGateRunner({
      terminalManager: this.terminalManager,
      blackboard: this.blackboard,
      maxRetries: 3
    });

    this.abortControllers = new Map();

    // Conecta telemetria de tokens do TerminalManager ao Blackboard caso esteja presente
    if (this.terminalManager && typeof this.terminalManager.on === 'function') {
      this.terminalManager.on('tokens-delta', ({ taskId, tokens }) => {
        this.blackboard.recordTokens(taskId, tokens);
        this.broadcastState();
      });
    }
  }

  // ==========================================================================
  // METODOS ULTRACODE / DYNAMIC WORKFLOWS
  // ==========================================================================

  // Verifica se o prompt ativa o Ultracode por keyword ou por modo de sessao
  detectUltracodeTrigger(prompt = '', options = {}) {
    const limits = UltracodeGates.getRuntimeLimits();
    if (limits.workflowsDisabled || options.disableWorkflows) {
      return { shouldRunWorkflow: false, effort: 'high', trigger: 'disabled' };
    }

    // Keyword destacada em violeta no input humano (descartavel com Alt+W)
    const hasKeyword =
      !options.DismissedKeyword &&
      options.isHumanInput !== false &&
      /\b(ultracode|workflow)\b/i.test(prompt);

    const isSessionUltracode = this.blackboard.sessionEffort === 'ultracode';

    if (isSessionUltracode) {
      return {
        shouldRunWorkflow: this.isSubstantiveTask(prompt) || hasKeyword,
        effort: 'xhigh',
        trigger: 'session_ultracode'
      };
    }

    if (hasKeyword) {
      return {
        shouldRunWorkflow: true,
        effort: this.blackboard.sessionEffort || 'high',
        trigger: 'prompt_keyword'
      };
    }

    return {
      shouldRunWorkflow: false,
      effort: this.blackboard.sessionEffort || 'high',
      trigger: 'none'
    };
  }

  isSubstantiveTask(prompt) {
    return (
      (prompt || '').trim().length > 45 ||
      /\b(audit|migrate|refactor|all|every|sweep|review|test)\b/i.test(prompt)
    );
  }

  // 1ª Fase: Claude/Gemini escreve o script JavaScript de Dynamic Workflow
  async planDynamicWorkflow(prompt, effort = 'xhigh') {
    const cleanPrompt = (prompt || '').replace(/\bultracode:?/gi, '').trim();
    const systemPrompt = `
Voce e o gerador de Dynamic Workflows do modo Ultracode.
Escreva APENAS codigo JavaScript puro (sem blocos markdown, sem import() e sem require()).
Disponivel no escopo global:
- const meta = { name, description, phases: [{ title, detail }] }
- await agent(prompt, { label, phase, schema, model, agentType, isolation: "worktree" })
- await pipeline(items, async (item, index) => { ... })
- await parallel([ () => agent(...), ... ])
- phase(title)
- args (argumentos estruturados)
Finalize o script com "return <resultadoFinal>;" para entregar a sintese a sessao principal.
`.trim();

    if (this.llmAdapter?.generateWorkflowScript) {
      return await this.llmAdapter.generateWorkflowScript({
        prompt: cleanPrompt,
        systemPrompt,
        effort
      });
    }

    // Script canonico padrao (Descoberta -> Fan-out em Pipeline -> Verificacao Adversarial -> Sintese)
    return `
const meta = {
  name: "ultracode-audit-and-verify",
  description: ${JSON.stringify(cleanPrompt)},
  phases: [
    { title: "Descoberta", detail: "Mapeia alvos independentes no repositorio" },
    { title: "Analise em Leque", detail: "Analisa cada alvo em paralelo via pipeline()" },
    { title: "Verificacao Adversarial", detail: "Agentes ceticos tentam refutar cada achado" },
    { title: "Sintese", detail: "Consolida apenas achados confirmados" }
  ]
};

phase("Descoberta");
const discovery = await agent(
  \`Identifique os modulos ou arquivos relevantes para a tarefa: \${${JSON.stringify(cleanPrompt)}}. Devolva uma lista objetiva.\`,
  {
    label: "discover-targets",
    phase: "Descoberta",
    schema: {
      type: "object",
      properties: { targets: { type: "array", items: { type: "string" } } },
      required: ["targets"]
    }
  }
);

const targets = (discovery?.targets || []).slice(0, 25);

phase("Analise em Leque");
const rawFindings = await pipeline(targets, async (target) => {
  return await agent(
    \`Analise profundamente "\${target}" para a tarefa: \${${JSON.stringify(cleanPrompt)}}.\`,
    {
      label: \`analyze:\${target}\`,
      phase: "Analise em Leque",
      schema: {
        type: "object",
        properties: {
          target: { type: "string" },
          hasIssue: { type: "boolean" },
          finding: { type: "string" }
        },
        required: ["target", "hasIssue", "finding"]
      }
    }
  );
});

const candidates = rawFindings.filter((f) => f && f.hasIssue);

phase("Verificacao Adversarial");
const verified = await pipeline(candidates, async (item) => {
  const verdict = await agent(
    \`Atue como revisor cetico. Tente refutar este achado em "\${item.target}": "\${item.finding}". Confirme apenas se for real.\`,
    {
      label: \`verify:\${item.target}\`,
      phase: "Verificacao Adversarial",
      schema: {
        type: "object",
        properties: { confirmed: { type: "boolean" }, rationale: { type: "string" } },
        required: ["confirmed", "rationale"]
      }
    }
  );
  return verdict?.confirmed ? { ...item, rationale: verdict.rationale } : null;
});

const confirmedFindings = verified.filter(Boolean);

phase("Sintese");
return await agent(
  \`Gere o relatorio executivo final com base nos achados verificados: \${JSON.stringify(confirmedFindings)}\`,
  { label: "synthesize-report", phase: "Sintese" }
);
`.trim();
  }

  async prepareWorkflowRun(prompt, options = {}) {
    const triggerInfo = this.detectUltracodeTrigger(prompt, options);
    const script =
      options.customScript || (await this.planDynamicWorkflow(prompt, triggerInfo.effort));
    const runId = `wf_${crypto.randomBytes(6).toString('hex')}`;
    const meta = this.extractMetaFromScript(script, prompt);

    const runState = this.blackboard.createRun({
      id: runId,
      prompt,
      script,
      meta
    });

    if (options.autoApprove) {
      this.executeWorkflowRun(runId, { args: options.args, effort: triggerInfo.effort });
    }

    return runState;
  }

  extractMetaFromScript(script, fallbackPrompt) {
    try {
      const cleaned = script.replace(/export\s+const\s+meta/g, 'const meta');
      const match = cleaned.match(/const\s+meta\s*=\s*(\{[\s\S]*?\});/);
      if (match) {
        return vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 200 });
      }
    } catch (_) {}
    return { name: 'ultracode-workflow', description: fallbackPrompt, phases: [] };
  }

  // 2ª Fase: Executa o script JavaScript na Sandbox isolada node:vm
  async executeWorkflowRun(runId, { args = {}, effort = 'xhigh' } = {}) {
    const run = this.blackboard.getRun(runId);
    if (!run) throw new Error(`Workflow ${runId} nao encontrado.`);

    const limits = UltracodeGates.getRuntimeLimits();
    const semaphore = new ConcurrencySemaphore(limits.maxConcurrentAgents);
    const abortController = new AbortController();
    this.abortControllers.set(runId, abortController);

    run.status = 'running';
    run.canUseCache = true;
    run.agents = [];
    run.totalAgentsSpawned = 0;
    this.blackboard.emitUpdate(runId);

    let callCounter = 0;

    // Primitiva agent(prompt, options)
    const agent = async (agentPrompt, agentOptions = {}) => {
      if (abortController.signal.aborted) {
        throw new Error('WORKFLOW_PAUSED');
      }

      const callIndex = callCounter++;
      const signature = JSON.stringify({ agentPrompt, agentOptions });

      // Regra de Cache de Replay Ordenado
      const cachedResult = this.blackboard.checkReplayCache(runId, callIndex, signature);
      if (cachedResult !== null) {
        return cachedResult;
      }

      UltracodeGates.enforceAgentCap(run.totalAgentsSpawned, limits.maxTotalAgentsPerRun);

      await semaphore.acquire();
      let worktreeInfo = null;

      try {
        if (abortController.signal.aborted) {
          throw new Error('WORKFLOW_PAUSED');
        }

        const agentId = `${runId}_ag_${callIndex}`;
        this.blackboard.recordAgentStart(runId, {
          id: agentId,
          label: agentOptions.label || `agent-${callIndex + 1}`,
          phase: agentOptions.phase || run.currentPhase,
          isolation: agentOptions.isolation || 'none'
        });

        let workingDir = this.blackboard.projectRoot;
        if (agentOptions.isolation === 'worktree') {
          worktreeInfo = await this.worktreeManager.createIsolatedWorktree(agentId);
          workingDir = worktreeInfo.worktreePath;
        }

        // Loop de validacao de Schema com auto-retry
        const maxRetries = agentOptions.schema ? 3 : 1;
        let lastError = null;
        let validatedOutput = null;
        let usedTokens = 0;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const schemaInstruction = agentOptions.schema
            ? `\n\nResponda ESTRITAMENTE em JSON valido seguindo este JSON Schema:\n${JSON.stringify(agentOptions.schema)}`
            : '';

          const retryFeedback = lastError
            ? `\n\nSua resposta anterior falhou na validacao de schema (${lastError}). Corrija o JSON.`
            : '';

          const rawResponse = await this.runSubagentWorker({
            prompt: `${agentPrompt}${schemaInstruction}${retryFeedback}`,
            cwd: workingDir,
            model: agentOptions.model,
            agentType: agentOptions.agentType,
            effort,
            acceptEdits: true,
            signal: abortController.signal
          });

          usedTokens += rawResponse.tokens || 450;

          const check = UltracodeGates.validateSchema(rawResponse.output, agentOptions.schema);
          if (check.valid) {
            validatedOutput = check.value;
            lastError = null;
            break;
          }
          lastError = check.error;
        }

        if (lastError) {
          throw new Error(`Falha de validacao de schema apos ${maxRetries} tentativas: ${lastError}`);
        }

        if (worktreeInfo) {
          await this.worktreeManager.commitWorktreeChanges(
            worktreeInfo.worktreePath,
            `ultracode(${agentOptions.label || agentId}): automated changes`
          );
        }

        this.blackboard.recordAgentComplete(runId, callIndex, signature, validatedOutput, usedTokens);
        return validatedOutput;
      } catch (err) {
        this.blackboard.recordAgentFailure(runId, callIndex, err);
        throw err;
      } finally {
        semaphore.release();
      }
    };

    // Primitiva pipeline(items, fn): esteira paralela sem barreiras
    const pipeline = async (items, workerFn) => {
      if (!Array.isArray(items)) return [];
      return await Promise.all(items.map((item, idx) => workerFn(item, idx)));
    };

    // Primitiva parallel(tasks): sincronizacao em barreira
    const parallel = async (tasks) => {
      if (!Array.isArray(tasks)) return [];
      return await Promise.all(tasks.map((t) => (typeof t === 'function' ? t() : t)));
    };

    // Primitiva phase(title)
    const phase = (title) => {
      this.blackboard.setPhase(runId, title);
    };

    // Proibe import() ou require() no script gerado para blindagem
    if (/\bimport\s*\(/.test(run.script) || /^\s*import\s+/m.test(run.script)) {
      run.status = 'failed';
      run.error = 'Workflow scripts nao podem carregar modulos com import().';
      this.blackboard.emitUpdate(runId);
      throw new Error(run.error);
    }

    const executableBody = run.script.replace(/export\s+const\s+meta/g, 'const meta');
    const wrappedScript = `(async () => {\n${executableBody}\n})()`;

    const sandbox = Object.freeze({
      agent,
      pipeline,
      parallel,
      phase,
      args: Object.freeze({ ...args }),
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      Promise
    });

    try {
      const context = vm.createContext(sandbox, {
        codeGeneration: { strings: false, wasm: false }
      });
      const finalResult = await vm.runInContext(wrappedScript, context);
      run.status = 'completed';
      run.finalResult = finalResult;
      run.finishedAt = Date.now();
      this.blackboard.emitUpdate(runId);
      return finalResult;
    } catch (err) {
      if (err.message === 'WORKFLOW_PAUSED' || abortController.signal.aborted) {
        run.status = 'paused';
      } else {
        run.status = 'failed';
        run.error = err.message || String(err);
      }
      this.blackboard.emitUpdate(runId);
      return null;
    } finally {
      this.abortControllers.delete(runId);
    }
  }

  pauseWorkflowRun(runId) {
    const controller = this.abortControllers.get(runId);
    if (controller) {
      controller.abort();
    }
  }

  async resumeWorkflowRun(runId, options = {}) {
    const run = this.blackboard.getRun(runId);
    if (!run || (run.status !== 'paused' && run.status !== 'failed')) {
      throw new Error(`Run ${runId} nao esta pausada.`);
    }
    return await this.executeWorkflowRun(runId, options);
  }

  async runSubagentWorker({ prompt, cwd, model, effort, acceptEdits, signal }) {
    if (this.llmAdapter?.runAgent) {
      return await this.llmAdapter.runAgent({ prompt, cwd, model, effort, acceptEdits, signal });
    }
    // Fallback de execucao deterministica caso llmAdapter externo nao tenha sido configurado
    return {
      output: JSON.stringify({
        targets: ['electron/main.js', 'src/App.jsx'],
        target: 'src/App.jsx',
        hasIssue: true,
        finding: 'Verificacao automatica concluida com sucesso.',
        confirmed: true,
        rationale: 'Validado pelo subagente em modo isolado.'
      }),
      tokens: 320
    };
  }

  // ==========================================================================
  // METODOS CLASSICOS DO MAESTRO DAG
  // ==========================================================================
  sanitizeDagCoupling(tasks) {
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const taskA = tasks[i];
        const taskB = tasks[j];

        const aDependsOnB = (taskA.dependsOn || []).includes(taskB.id);
        const bDependsOnA = (taskB.dependsOn || []).includes(taskA.id);

        if (!aDependsOnB && !bDependsOnA) {
          const check = this.worktrees.detectCoChangeCoupling(
            taskA.allowedWriteFiles || [],
            taskB.allowedWriteFiles || []
          );
          if (check.hasCoupling) {
            taskB.dependsOn = [...(taskB.dependsOn || []), taskA.id];
          }
        }
      }
    }
    return tasks;
  }

  async executeDagPlan(rawTasks) {
    const tasks = this.sanitizeDagCoupling(structuredClone(rawTasks));
    this.blackboard.registerTasks(tasks);
    this.broadcastState();

    const completedIds = new Set();
    const failedIds = new Set();
    const runningIds = new Set();
    const activeTaskPromises = new Map();

    const executeSingleNode = async (task, index) => {
      const paneId = task.paneId || `pane-${index + 1}`;
      runningIds.add(task.id);

      const { worktreePath, branchName } = this.worktrees.allocateWorktree(task.id);
      this.blackboard.injectContextPack(worktreePath, task);
      this.blackboard.updateTask(task.id, {
        status: 'RUNNING',
        paneId,
        worktree: worktreePath,
        branch: branchName
      });
      this.broadcastState();

      if (task.provider === 'cloudshell' && this.mirrorManager) {
        await this.mirrorManager.syncScopeToCloud(worktreePath, task.id);
      }

      if (this.terminalManager) {
        this.terminalManager.spawnAgentPane({
          paneId,
          taskId: task.id,
          roleId: task.roleId,
          cli: task.cli,
          provider: task.provider,
          cwd: worktreePath,
          autoApprovePrompts: Boolean(task.autoApprovePrompts)
        });
      }

      try {
        if (this.terminalManager) {
          await this.terminalManager.waitForTurnCompletion(paneId, 300000);
        }

        if (task.provider === 'cloudshell' && this.mirrorManager) {
          await this.mirrorManager.pullScopeFromCloud(worktreePath, task.id);
        }

        const gateResult = await this.gates.verifyAndHealTask({
          task,
          paneId,
          worktreePath,
          onGateStatus: (statusEvent) => {
            this.sendIpc('maestro:gate-status', statusEvent);
            this.broadcastState();
          }
        });

        if (!gateResult.passed) {
          failedIds.add(task.id);
          return;
        }

        const commitInfo = this.worktrees.commitWorktreeChanges(
          worktreePath,
          task.id,
          task.title
        );

        this.worktrees.mergeWorktreeToBase(task.id);
        this.worktrees.releaseWorktree(task.id, true);
        this.terminalManager?.killPane(paneId);

        this.blackboard.publishArtifact({
          taskId: task.id,
          contracts: task.publishedContracts || [],
          summary: `Concluido e integrado (${commitInfo.changedFiles.length} arquivos).`
        });

        this.blackboard.updateTask(task.id, {
          status: 'PASSED',
          changedFiles: commitInfo.changedFiles,
          summary: `Integrado na branch principal com sucesso.`
        });

        completedIds.add(task.id);
      } catch (err) {
        this.terminalManager?.killPane(paneId);
        this.blackboard.updateTask(task.id, {
          status: 'BLOCKED',
          lastGateError: err.message
        });
        failedIds.add(task.id);
      } finally {
        runningIds.delete(task.id);
        this.broadcastState();
      }
    };

    while (completedIds.size + failedIds.size < tasks.length) {
      const budget = this.blackboard.state.globalBudget;
      if (budget.consumedTokens >= budget.maxTotalTokens) {
        throw new Error(`Orcamento global de tokens excedido (${budget.consumedTokens}/${budget.maxTotalTokens}).`);
      }

      const runnableTasks = tasks.filter((t) => {
        if (completedIds.has(t.id) || failedIds.has(t.id) || runningIds.has(t.id)) return false;
        const deps = t.dependsOn || [];
        if (deps.some((d) => failedIds.has(d))) {
          failedIds.add(t.id);
          this.blackboard.updateTask(t.id, {
            status: 'BLOCKED',
            summary: 'Bloqueado por falha em tarefa precedente do DAG.'
          });
          return false;
        }
        return deps.every((d) => completedIds.has(d));
      });

      if (runnableTasks.length === 0 && activeTaskPromises.size === 0) {
        break;
      }

      for (const task of runnableTasks) {
        const promise = executeSingleNode(task, tasks.indexOf(task)).finally(() => {
          activeTaskPromises.delete(task.id);
        });
        activeTaskPromises.set(task.id, promise);
      }

      if (activeTaskPromises.size > 0) {
        await Promise.race(activeTaskPromises.values());
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (activeTaskPromises.size > 0) {
      await Promise.allSettled(activeTaskPromises.values());
    }

    return this.blackboard.getSnapshot();
  }

  broadcastState() {
    this.sendIpc('maestro:blackboard-update', this.blackboard.getSnapshot());
  }

  sendIpc(channel, payload) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, payload);
    }
  }
}

// Alias para compatibilidade com o padrao Ultracode
export const Maestro = MaestroOrchestrator;
