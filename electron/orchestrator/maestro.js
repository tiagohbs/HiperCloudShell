// electron/orchestrator/maestro.js
import { WorktreeManager } from './worktree-manager.js';
import { BlackboardManager } from './blackboard.js';
import { QualityGateRunner } from './gates.js';

export class MaestroOrchestrator {
  constructor({ repoRoot, terminalManager, mirrorManager = null, mainWindow = null }) {
    this.repoRoot = repoRoot;
    this.terminalManager = terminalManager;
    this.mirrorManager = mirrorManager;
    this.mainWindow = mainWindow;

    this.worktrees = new WorktreeManager(repoRoot);
    this.blackboard = new BlackboardManager(repoRoot);
    this.gates = new QualityGateRunner({
      terminalManager: this.terminalManager,
      blackboard: this.blackboard,
      maxRetries: 3
    });

    // Conecta telemetria de tokens do TerminalManager ao Blackboard
    this.terminalManager.on('tokens-delta', ({ taskId, tokens }) => {
      this.blackboard.recordTokens(taskId, tokens);
      this.broadcastState();
    });
  }

  /**
   * Audita o DAG antes de iniciar: se duas tarefas paralelas possuem acoplamento Co-Change
   * no historico do Git, adiciona dependencia automatica para serializa-las com seguranca.
   */
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

  /**
   * Executa um plano completo de Squad em DAG com isolamento Worktree e Quality Gates
   */
  async executeDagPlan(rawTasks) {
    const tasks = this.sanitizeDagCoupling(structuredClone(rawTasks));
    this.blackboard.registerTasks(tasks);
    this.broadcastState();

    const completedIds = new Set();
    const failedIds = new Set();
    const runningIds = new Set();
    const activeTaskPromises = new Map(); // Map<taskId, Promise> para rastreamento continuo

    const executeSingleNode = async (task, index) => {
      const paneId = task.paneId || `pane-${index + 1}`;
      runningIds.add(task.id);

      // 1. Aloca Worktree fisico isolado
      const { worktreePath, branchName } = this.worktrees.allocateWorktree(task.id);

      // 2. Injeta o Context Pack (.maestro/TASK_SPEC.md) com contratos atuais do Blackboard
      this.blackboard.injectContextPack(worktreePath, task);
      this.blackboard.updateTask(task.id, {
        status: 'RUNNING',
        paneId,
        worktree: worktreePath,
        branch: branchName
      });
      this.broadcastState();

      // 3. Se o agente roda no Google Cloud Shell, sincroniza o escopo isolado via mirror.js
      if (task.provider === 'cloudshell' && this.mirrorManager) {
        await this.mirrorManager.syncScopeToCloud(worktreePath, task.id);
      }

      // 4. Abre a sessao PTY no painel do Grid e dispara o Agente
      this.terminalManager.spawnAgentPane({
        paneId,
        taskId: task.id,
        roleId: task.roleId,
        cli: task.cli,
        provider: task.provider,
        cwd: worktreePath,
        autoApprovePrompts: Boolean(task.autoApprovePrompts)
      });

      try {
        // 5. Aguarda o agente imprimir <<MAESTRO_TASK_DONE>>
        await this.terminalManager.waitForTurnCompletion(paneId, 300000);

        // Se estava no Cloud Shell, puxa os arquivos modificados de volta para o worktree local antes do Gate
        if (task.provider === 'cloudshell' && this.mirrorManager) {
          await this.mirrorManager.pullScopeFromCloud(worktreePath, task.id);
        }

        // 6. Executa o Quality Gate com Auto-Retry e Circuit Breaker (max 3 tentativas)
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

        // 7. Gate Aprovado: faz commit no Worktree, atualiza Blackboard e faz merge na base
        const commitInfo = this.worktrees.commitWorktreeChanges(
          worktreePath,
          task.id,
          task.title
        );

        this.worktrees.mergeWorktreeToBase(task.id);
        this.worktrees.releaseWorktree(task.id, true);
        this.terminalManager.killPane(paneId);

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
        this.terminalManager.killPane(paneId);
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

    // Loop de agendamento do DAG (dispara em paralelo todos os nos cujas dependencias ja passaram)
    while (completedIds.size + failedIds.size < tasks.length) {
      // Verifica orcamento global de tokens (Circuit Breaker Financeiro)
      const budget = this.blackboard.state.globalBudget;
      if (budget.consumedTokens >= budget.maxTotalTokens) {
        throw new Error(`Orcamento global de tokens excedido (${budget.consumedTokens}/${budget.maxTotalTokens}).`);
      }

      const runnableTasks = tasks.filter((t) => {
        if (completedIds.has(t.id) || failedIds.has(t.id) || runningIds.has(t.id)) return false;
        const deps = t.dependsOn || [];
        // Se alguma dependencia falhou/bloqueou, bloqueia este no tambem
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
        break; // Evita deadlock caso haja ciclo ou bloqueio total
      }

      // Adiciona todas as tarefas prontas ao pool ativo de execucao
      for (const task of runnableTasks) {
        const promise = executeSingleNode(task, tasks.indexOf(task)).finally(() => {
          activeTaskPromises.delete(task.id);
        });
        activeTaskPromises.set(task.id, promise);
      }

      // Aguarda qualquer tarefa do pool ativo concluir para reavaliar imediatamente dependencias
      if (activeTaskPromises.size > 0) {
        await Promise.race(activeTaskPromises.values());
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Garante que todas as promessas em voo finalizaram antes de retornar
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
