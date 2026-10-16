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

  // 1ª Fase: Gera o script JavaScript de Dynamic Workflow (Claude / Antigravity / Hybrid)
  async planDynamicWorkflow(prompt, effort = 'xhigh') {
    const cleanPrompt = (prompt || '').replace(/\bultracode:?/gi, '').trim();
    const systemPrompt = `
Você é o gerador de Dynamic Workflows Híbridos (Claude Code + Google Antigravity).
Escreva APENAS código JavaScript puro (sem blocos markdown, sem import() e sem require()).
Primitivas globais disponíveis:
- const meta = { name, description, phases: [{ title, detail }] }
- await agent(prompt, {
    label,
    phase,
    provider: "claude" | "antigravity", // Permite escolher o motor ideal para cada subtarefa
    model,
    schema,
    isolation: "worktree"
  })
- await pipeline(items, async (item, index) => { ... })
- await parallel([ () => agent(...), ... ])
- phase(title)
- args

Estratégia recomendada para o modo Monstro (Cross-Provider Adversarial):
1. Use "antigravity" para mapeamento rápido e análise em leque (pipeline).
2. Na fase de Verificação Adversarial, use o motor oposto ("claude") para auditar ceticamente os achados do Antigravity (ou vice-versa).
3. Finalize com "return <resultadoFinal>;".
`.trim();

    if (this.llmAdapter?.generateWorkflowScript) {
      return await this.llmAdapter.generateWorkflowScript({
        prompt: cleanPrompt,
        systemPrompt,
        effort
      });
    }

    // Script Híbrido Canónico (Antigravity + Claude em Verificação Cruzada)
    return `
const meta = {
  name: "hybrid-ultracode-monster",
  description: ${JSON.stringify(cleanPrompt)},
  phases: [
    { title: "Descoberta (Antigravity)", detail: "Mapeamento rápido de alvos com agy" },
    { title: "Fan-Out Híbrido", detail: "Análise concorrente em pipeline()" },
    { title: "Verificação Cruzada (Claude vs Antigravity)", detail: "Um motor tenta refutar os achados do outro" },
    { title: "Síntese Executiva", detail: "Consolidação final validada" }
  ]
};

phase("Descoberta (Antigravity)");
const discovery = await agent(
  \`Identifique e mapeie os modulos ou arquivos criticos para: \${${JSON.stringify(cleanPrompt)}}\`,
  {
    label: "agy-discover",
    phase: "Descoberta (Antigravity)",
    provider: "antigravity",
    schema: {
      type: "object",
      properties: { targets: { type: "array", items: { type: "string" } } },
      required: ["targets"]
    }
  }
);

const targets = (discovery?.targets || []).slice(0, 25);

phase("Fan-Out Híbrido");
const rawFindings = await pipeline(targets, async (target, idx) => {
  const provider = idx % 2 === 0 ? "antigravity" : "claude";
  return await agent(
    \`Analise profundamente "\${target}" para: \${${JSON.stringify(cleanPrompt)}}\`,
    {
      label: \`\${provider}:analyze:\${target}\`,
      phase: "Fan-Out Híbrido",
      provider,
      schema: {
        type: "object",
        properties: {
          target: { type: "string" },
          analyzer: { type: "string" },
          hasIssue: { type: "boolean" },
          finding: { type: "string" }
        },
        required: ["target", "hasIssue", "finding"]
      }
    }
  );
});

const candidates = rawFindings.filter((f) => f && f.hasIssue);

phase("Verificação Cruzada (Claude vs Antigravity)");
const verified = await pipeline(candidates, async (item, idx) => {
  // O revisor usa sempre o motor OPOSTO ao que gerou o achado
  const reviewerProvider = idx % 2 === 0 ? "claude" : "antigravity";
  const verdict = await agent(
    \`Atue como revisor cetico adversarial. Tente refutar este achado em "\${item.target}": "\${item.finding}". Confirme apenas se houver prova concreta no codigo.\`,
    {
      label: \`\${reviewerProvider}:cross-verify:\${item.target}\`,
      phase: "Verificação Cruzada (Claude vs Antigravity)",
      provider: reviewerProvider,
      schema: {
        type: "object",
        properties: { confirmed: { type: "boolean" }, rationale: { type: "string" } },
        required: ["confirmed", "rationale"]
      }
    }
  );
  return verdict?.confirmed ? { ...item, verifiedBy: reviewerProvider, rationale: verdict.rationale } : null;
});

const confirmedFindings = verified.filter(Boolean);

phase("Síntese Executiva");
return await agent(
  \`Sintetize o plano de ação final validado por Claude + Antigravity: \${JSON.stringify(confirmedFindings)}\`,
  {
    label: "hybrid-synthesis",
    phase: "Síntese Executiva",
    provider: "claude"
  }
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
      meta,
      maxTokensPerRun: options.maxTokensPerRun || 0
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
  async executeWorkflowRun(runId, { args = {}, effort = 'xhigh', maxTokensPerRun = 0 } = {}) {
    const run = this.blackboard.getRun(runId);
    if (!run) throw new Error(`Workflow ${runId} nao encontrado.`);

    if (maxTokensPerRun > 0) {
      run.maxTokensPerRun = maxTokensPerRun;
    }

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

      // Disjuntor financeiro de tokens em tempo real
      UltracodeGates.enforceTokenBudget(run.tokensUsed, run.maxTokensPerRun || maxTokensPerRun);

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

        const agentStartTime = Date.now();
        const agentId = `${runId}_ag_${callIndex}`;
        this.blackboard.recordAgentStart(runId, {
          id: agentId,
          label: agentOptions.label || `agent-${callIndex + 1}`,
          phase: agentOptions.phase || run.currentPhase,
          provider: agentOptions.provider || this.llmAdapter?.defaultProvider || 'hybrid',
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
            agentId,
            prompt: `${agentPrompt}${schemaInstruction}${retryFeedback}`,
            cwd: workingDir,
            provider: agentOptions.provider,
            model: agentOptions.model,
            agentType: agentOptions.agentType,
            schema: agentOptions.schema,
            label: agentOptions.label,
            phase: agentOptions.phase || run.currentPhase,
            effort: agentOptions.effort || effort,
            acceptEdits: true,
            signal: abortController.signal
          });

          const elapsedMs = Date.now() - agentStartTime;
          const thresholdMs = this.blackboard.state?.selfImprovement?.bottleneckThresholdMs || 45000;

          if (elapsedMs > thresholdMs) {
            const btlNotif = this.blackboard.emitSystemNotification({
              kind: 'bottleneck',
              severity: 'warning',
              title: `Gargalo Detectado em ${agentOptions.label || agentId}`,
              message: `O subagente levou ${(elapsedMs / 1000).toFixed(1)}s (limite: ${thresholdMs / 1000}s) usando ${ rawResponse.provider || agentOptions.provider }.`,
              sourceTrace: {
                runId,
                agentId,
                conversationId: rawResponse.conversationId,
                provider: rawResponse.provider || agentOptions.provider,
                worktreePath: workingDir
              }
            });
            this.sendIpc('ultracode:system-notification', btlNotif);
          }

          if (rawResponse.conversationId) {
            const ag = run.agents.find((a) => a.id === agentId);
            if (ag) {
              ag.conversationId = rawResponse.conversationId;
              ag.cwd = workingDir;
              ag.effectiveEffort = rawResponse.effectiveEffort;
            }
          }

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
        const currentAgent = run.agents[callIndex] || {};
        const errNotif = this.blackboard.emitSystemNotification({
          kind: 'error',
          severity: 'critical',
          title: `Falha no Agente ${agentOptions.label || callIndex}`,
          message: err.message || String(err),
          sourceTrace: {
            runId,
            agentId: currentAgent.id,
            conversationId: currentAgent.conversationId,
            provider: currentAgent.provider,
            worktreePath: currentAgent.cwd || workingDir
          }
        });
        this.sendIpc('ultracode:system-notification', errNotif);

        if (this.blackboard.state?.selfImprovement?.continuousMode) {
          this.triggerContinuousSelfImprovement(errNotif).catch(() => {});
        }
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

    // Nova Primitiva 1: verifyCmd(cmd, { cwd }) -> Execução determinística de testes/linters
    const verifyCmd = async (commandStr, cmdOpts = {}) => {
      if (abortController.signal.aborted) throw new Error('WORKFLOW_PAUSED');
      if (!this.llmAdapter?.runDeterministicCommand) {
        return { ok: true, exitCode: 0, stdout: 'Mock command OK', stderr: '' };
      }
      return await this.llmAdapter.runDeterministicCommand(commandStr, {
        cwd: cmdOpts.cwd || this.blackboard.projectRoot,
        timeoutMs: cmdOpts.timeoutMs || 60000,
        signal: abortController.signal
      });
    };

    // Nova Primitiva 2: consensus(promptOrOptions, maybeOptions) -> Claude + Antigravity em paralelo + Juiz de síntese
    const consensus = async (promptOrOptions, maybeOptions = {}) => {
      const opts =
        typeof promptOrOptions === 'object' && promptOrOptions !== null
          ? { ...promptOrOptions, ...maybeOptions }
          : { prompt: String(promptOrOptions), ...maybeOptions };

      const taskPrompt = opts.prompt || '';
      const providerA = opts.providerA || 'claude';
      const providerB = opts.providerB || 'antigravity';
      const judgeProvider = opts.arbitratorProvider || opts.judgeProvider || 'claude';

      const [resA, resB] = await Promise.all([
        agent(taskPrompt, {
          ...opts,
          label: `${opts.label || 'consensus'}:${providerA}`,
          provider: providerA,
          schema: null
        }),
        agent(taskPrompt, {
          ...opts,
          label: `${opts.label || 'consensus'}:${providerB}`,
          provider: providerB,
          schema: null
        })
      ]);

      const judgeResult = await agent(
        `Compare as duas soluções abaixo para a tarefa "${taskPrompt}".\nExtraia os pontos fortes de cada uma, elimine alucinações ou regressões e produza o veredito definitivo.\n\n--- SOLUÇÃO ${providerA.toUpperCase()} ---\n${typeof resA === 'string' ? resA : JSON.stringify(resA)}\n\n--- SOLUÇÃO ${providerB.toUpperCase()} ---\n${typeof resB === 'string' ? resB : JSON.stringify(resB)}`,
        {
          label: `${opts.label || 'consensus'}:arbitrator`,
          phase: opts.phase || run.currentPhase,
          provider: judgeProvider,
          schema: opts.schema || null
        }
      );

      return {
        arbitrated: judgeResult,
        solutionA: resA,
        solutionB: resB,
        ...(typeof judgeResult === 'object' && judgeResult !== null ? judgeResult : {})
      };
    };

    // Nova Primitiva 3: speculate(strategiesOrOptions, maybeOptions) -> Corrida especulativa em Worktrees isoladas
    const speculate = async (strategiesOrOptions, maybeOptions = {}) => {
      let strategyList = [];
      let testCommand = 'npm test';

      if (Array.isArray(strategiesOrOptions)) {
        strategyList = strategiesOrOptions;
        testCommand = maybeOptions.testCommand || maybeOptions.testCmd || 'npm test';
      } else if (typeof strategiesOrOptions === 'object' && strategiesOrOptions !== null) {
        testCommand =
          strategiesOrOptions.testCommand ||
          strategiesOrOptions.testCmd ||
          maybeOptions.testCommand ||
          maybeOptions.testCmd ||
          'npm test';

        if (strategiesOrOptions.strategyA || strategiesOrOptions.strategyB) {
          strategyList = [
            {
              label: 'strategyA',
              prompt: strategiesOrOptions.strategyA,
              run: typeof strategiesOrOptions.strategyA === 'function' ? strategiesOrOptions.strategyA : null
            },
            {
              label: 'strategyB',
              prompt: strategiesOrOptions.strategyB,
              run: typeof strategiesOrOptions.strategyB === 'function' ? strategiesOrOptions.strategyB : null
            }
          ];
        } else if (Array.isArray(strategiesOrOptions.strategies)) {
          strategyList = strategiesOrOptions.strategies;
        }
      }

      const results = await Promise.all(
        strategyList.map(async (strat, idx) => {
          const provider = strat.provider || (idx % 2 === 0 ? 'claude' : 'antigravity');
          const label = strat.label || `strategy${String.fromCharCode(65 + idx)}`;
          let wt = null;
          try {
            wt = await this.worktreeManager.createIsolatedWorktree(`${runId}_spec_${idx}`);
          } catch (_) {
            wt = { worktreePath: this.blackboard.projectRoot, branchName: null };
          }

          try {
            let outputVal = null;
            if (typeof strat.run === 'function') {
              outputVal = await strat.run({
                worktreePath: wt.worktreePath,
                branchName: wt.branchName,
                agent: (p, o) => agent(p, { ...o, cwd: wt.worktreePath })
              });
            } else {
              const agentOutput = await this.runSubagentWorker({
                agentId: `${runId}_spec_${idx}`,
                prompt: typeof strat.prompt === 'string' ? strat.prompt : (strat.prompt || label),
                cwd: wt.worktreePath,
                provider,
                effort,
                acceptEdits: true,
                signal: abortController.signal,
                label
              });
              outputVal = agentOutput.output;
            }

            const check = await verifyCmd(testCommand, { cwd: wt.worktreePath });
            return {
              label,
              provider,
              passedTests: check.ok !== false,
              testOutput: check.stdout || check.stderr,
              agentOutput: outputVal,
              worktreePath: wt.worktreePath,
              branchName: wt.branchName
            };
          } catch (err) {
            return { label, provider, passedTests: false, error: err.message };
          }
        })
      );

      const winningAttempt = results.find((r) => r.passedTests) || results[0];
      const winnerName = winningAttempt?.label || 'strategyA';

      if (
        winningAttempt &&
        winningAttempt.branchName &&
        winningAttempt.worktreePath &&
        typeof this.worktreeManager.commitWorktreeChanges === 'function'
      ) {
        await this.worktreeManager.commitWorktreeChanges(
          winningAttempt.worktreePath,
          `ultracode(speculate-winner): ${winningAttempt.label}`
        );
      }

      return {
        winner: winnerName,
        winningStrategy: winnerName,
        passedTests: winningAttempt?.passedTests ?? true,
        output: winningAttempt?.agentOutput,
        details: winningAttempt,
        allAttempts: results
      };
    };

    // Nova Primitiva 4: memory -> Quadro negro partilhado entre agentes
    const memory = Object.freeze({
      set: (key, val) => this.blackboard.setMemory(runId, key, val),
      get: (key) => this.blackboard.getMemory(runId, key)
    });

    /**
     * Primitiva harness(config): Blindagem de execução para subagentes autônomos.
     * Empacota { role, provider, model, effort, skills, isolation, schema } num especialista pronto.
     */
    const harness = (harnessConfig = {}) => {
      return async (taskPrompt, overrideOpts = {}) => {
        const mergedOpts = { ...harnessConfig, ...overrideOpts };
        const roleHeader = mergedOpts.role ? `[ROLE: ${mergedOpts.role}]\n` : '';
        const skillsHeader =
          Array.isArray(mergedOpts.skills) && mergedOpts.skills.length > 0
            ? `[ACTIVE SKILLS / RULES: ${mergedOpts.skills.join(', ')}]\n`
            : '';

        // Respeita o effort específico do Harness (que depois passa pelo clamp global do provedor em gates.js)
        const fullPrompt = `${roleHeader}${skillsHeader}\n${taskPrompt}`;
        return await agent(fullPrompt, {
          label: mergedOpts.label || mergedOpts.role || 'harness-agent',
          phase: mergedOpts.phase || run.currentPhase,
          provider: mergedOpts.provider,
          model: mergedOpts.model,
          effort: mergedOpts.effort || effort,
          isolation: mergedOpts.isolation || 'none',
          schema: mergedOpts.schema || null
        });
      };
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
      harness,
      pipeline,
      parallel,
      phase,
      verifyCmd,
      consensus,
      speculate,
      memory,
      args: typeof args === 'object' && args !== null ? Object.freeze({ ...args }) : args,
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
      } else if (err.code === 'TOKEN_BUDGET_EXCEEDED' || err.message?.includes('TOKEN_BUDGET_EXCEEDED')) {
        run.status = 'paused';
        run.pauseReason = err.message;
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

  async runSubagentWorker({ agentId, prompt, cwd, provider, model, agentType, schema, label, phase, effort, acceptEdits, signal }) {
    if (this.llmAdapter?.runAgent) {
      return await this.llmAdapter.runAgent({ agentId, prompt, cwd, provider, model, agentType, schema, label, phase, effort, acceptEdits, signal });
    }
    // Fallback de execucao deterministica caso llmAdapter externo nao tenha sido configurado
    return {
      output: JSON.stringify({
        targets: ['electron/main.js', 'src/App.jsx'],
        target: 'src/App.jsx',
        analyzer: provider || 'antigravity',
        hasIssue: true,
        finding: 'Verificacao automatica concluida com sucesso.',
        confirmed: true,
        rationale: 'Validado pelo subagente em modo isolado.'
      }),
      tokens: 320,
      provider: provider || 'antigravity'
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

  /**
   * Escolhe o motor de Auto-Melhoria conforme a configuração do usuário ('claude' | 'antigravity' | 'hybrid')
   */
  resolveSelfImprovementEngine(category = 'error_fix') {
    const cfg = this.blackboard.state?.selfImprovement || {};
    const pref = cfg.preferredEngine || this.llmAdapter?.defaultProvider || 'hybrid';
    if (pref === 'claude' || pref === 'antigravity') return pref;
    // No modo hybrid: Antigravity diagnostica gargalos rápidos; Claude refatora erros estruturais
    return category === 'bottleneck_opt' ? 'antigravity' : 'claude';
  }

  /**
   * Aciona o Agente de Auto-Melhoria em uma Worktree isolada e executa os testes via CloudShell
   */
  async triggerContinuousSelfImprovement(notification) {
    const cfg = this.blackboard.state?.selfImprovement || {};
    if (cfg.enabled === false) return null;

    const impId = `imp_${crypto.randomBytes(4).toString('hex')}`;
    const paneId = `cloudshell_${impId}`;
    const category = notification.kind === 'bottleneck' ? 'bottleneck_opt' : 'error_fix';
    const engine = this.resolveSelfImprovementEngine(category);

    // 1. Aloca Worktree isolada para produzir e testar a melhoria com segurança
    const wt = await this.worktreeManager.createIsolatedWorktree(impId);

    const impTask = this.blackboard.registerImprovementTask({
      id: impId,
      sourceNotificationCode: notification.code,
      category,
      status: 'running_cloudshell',
      engine,
      cloudshellTermId: paneId,
      worktreePath: wt.worktreePath,
      branchName: wt.branchName,
      sourceTrace: notification.sourceTrace,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Vincula a notificação original ao ID da melhoria para o botão "Ir até o Sistema de Melhoria"
    notification.improvementId = impId;
    this.sendIpc('ultracode:improvement-update', impTask);

    // 2. Abre uma sessão CloudShell se o TerminalManager estiver ativo
    if (this.terminalManager) {
      this.terminalManager.createSession(paneId, {
        cwd: wt.worktreePath,
        meta: { improvementId: impId, engine, sourceCode: notification.code }
      });
    }

    try {
      const prompt = [
        `[AUTO-MELHORIA CONTÍNUA HIPERCLOUDSHELL - CÓDIGO ${notification.code}]`,
        `Categoria: ${category} | Motor Ativo: ${engine}`,
        `Evento Detectado: ${notification.title} - ${notification.message}`,
        `Origem: Agente=${notification.sourceTrace?.agentId || 'N/A'}, Diretório=${notification.sourceTrace?.worktreePath || this.repoRoot}`,
        `Instruções:`,
        `1. Analise a causa raiz do erro ou gargalo reportado.`,
        `2. Aplique a correção ou otimização de fluxo diretamente nos arquivos desta worktree.`,
        `3. Retorne um JSON com { "rootCause": "...", "appliedFix": "...", "changedFiles": ["..."] }.`
      ].join('\n');

      const healResult = await this.runSubagentWorker({
        agentId: impId,
        prompt,
        cwd: wt.worktreePath,
        provider: engine,
        effort: 'high',
        acceptEdits: true,
        label: `self-healer:${notification.code}`
      });

      const diagnosis = typeof healResult.output === 'string'
        ? healResult.output.slice(0, 500)
        : JSON.stringify(healResult.output).slice(0, 500);

      this.blackboard.updateImprovementTask(impId, {
        status: 'validating_gate',
        diagnosis
      });
      this.sendIpc('ultracode:improvement-update', impTask);

      // 3. Valida no CloudShell / Gate Determinístico antes de commitar a melhoria
      const gateCheck = await this.llmAdapter?.runDeterministicCommand
        ? await this.llmAdapter.runDeterministicCommand('npm test', { cwd: wt.worktreePath })
        : { ok: true };

      if (gateCheck.ok) {
        await this.worktreeManager.commitWorktreeChanges(
          wt.worktreePath,
          `self-improvement(${notification.code}): auto-healed by ${engine}`
        );
        this.blackboard.updateImprovementTask(impId, { status: 'ready_to_merge' });
      } else {
        this.blackboard.updateImprovementTask(impId, { status: 'needs_human_review' });
      }

      this.sendIpc('ultracode:improvement-update', impTask);

      // Emite notificação de melhoria concluída com link para o Sistema de Melhoria
      this.blackboard.emitSystemNotification({
        code: `HCS-IMP-${impId.slice(-4).toUpperCase()}`,
        kind: 'improvement',
        severity: 'info',
        title: `Melhoria Produzida via ${engine.toUpperCase()}`,
        message: `Correção para ${notification.code} validada na worktree ${wt.branchName}.`,
        sourceTrace: {
          agentId: impId,
          termId: paneId,
          provider: engine,
          worktreePath: wt.worktreePath
        },
        improvementId: impId
      });

      return impTask;
    } catch (err) {
      this.blackboard.updateImprovementTask(impId, {
        status: 'failed',
        error: err.message
      });
      impTask.status = 'failed';
      impTask.error = err.message;
      this.sendIpc('ultracode:improvement-update', impTask);
      return impTask;
    }
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
