// electron/orchestrator/gates.js
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class ConcurrencySemaphore {
  constructor(maxConcurrent = 4) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.maxConcurrent) {
      this.current += 1;
      return;
    }
    await new Promise((resolve) => this.queue.push(resolve));
    this.current += 1;
  }

  release() {
    this.current = Math.max(0, this.current - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }
}

export class UltracodeGates {
  static getRuntimeLimits() {
    const cpus = os.cpus() || [];
    const cpuScaledCap = Math.min(16, Math.max(2, cpus.length * 2));
    const envConcurrent = Number(process.env.CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS);
    return {
      maxConcurrentAgents:
        Number.isFinite(envConcurrent) && envConcurrent > 0
          ? Math.min(envConcurrent, 16)
          : cpuScaledCap,
      maxTotalAgentsPerRun: 1000,
      workflowsDisabled: process.env.CLAUDE_CODE_DISABLE_WORKFLOWS === '1',
      defaultProviderCaps: {
        claude: 'xhigh',
        antigravity: 'xhigh'
      }
    };
  }

  static clampEffort(requestedEffort = 'high', maxCap = 'xhigh') {
    const levels = ['low', 'medium', 'high', 'xhigh'];
    const reqIndex = levels.indexOf(requestedEffort === 'ultracode' ? 'xhigh' : requestedEffort);
    const capIndex = levels.indexOf(maxCap);
    if (reqIndex === -1) return maxCap || 'high';
    if (capIndex === -1) return requestedEffort;
    return levels[Math.min(reqIndex, capIndex)];
  }

  static enforceTokenBudget(currentTokensUsed, maxTokensPerRun = 0) {
    if (maxTokensPerRun && maxTokensPerRun > 0 && currentTokensUsed >= maxTokensPerRun) {
      const err = new Error(
        `TOKEN_BUDGET_EXCEEDED: Disjuntor financeiro ativado. Consumo atual (${currentTokensUsed} tokens) atingiu o orçamento máximo de ${maxTokensPerRun} tokens.`
      );
      err.code = 'TOKEN_BUDGET_EXCEEDED';
      throw err;
    }
  }

  static enforceAgentCap(totalSpawned, maxTotal = 1000) {
    if (totalSpawned >= maxTotal) {
      throw new Error(
        `Ultracode Gate: Limite maximo de ${maxTotal} subagentes por execucao atingido (trava anti-loop).`
      );
    }
  }

  // Validador deterministico para a opcao { schema } do agent()
  static validateSchema(data, schema) {
    if (!schema) return { valid: true, value: data };

    let parsed = data;
    if (typeof data === 'string') {
      try {
        const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, data];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (err) {
        return { valid: false, error: `Saida nao e um JSON valido: ${err.message}` };
      }
    }

    if (schema.type === 'object') {
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'Esperado um objeto JSON.' };
      }
      if (Array.isArray(schema.required)) {
        for (const reqField of schema.required) {
          if (!(reqField in parsed) || parsed[reqField] === undefined) {
            return { valid: false, error: `Campo obrigatorio ausente: "${reqField}".` };
          }
        }
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in parsed && parsed[key] !== null) {
            const actualType = Array.isArray(parsed[key]) ? 'array' : typeof parsed[key];
            if (propSchema.type && actualType !== propSchema.type) {
              return {
                valid: false,
                error: `Campo "${key}" esperava tipo "${propSchema.type}", mas recebeu "${actualType}".`
              };
            }
          }
        }
      }
    } else if (schema.type === 'array' && !Array.isArray(parsed)) {
      return { valid: false, error: 'Esperado um array JSON.' };
    }

    return { valid: true, value: parsed };
  }
}

export class QualityGateRunner {
  constructor({ terminalManager, blackboard, maxRetries = 3 }) {
    this.terminalManager = terminalManager;
    this.blackboard = blackboard;
    this.maxRetries = maxRetries;
  }

  /**
   * Executa o loop de validacao deterministica com Circuit Breaker integrado
   */
  async verifyAndHealTask({ task, paneId, worktreePath, onGateStatus }) {
    const gateCmd = task.gateCommand || 'npm test';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      this.blackboard.updateTask(task.id, {
        status: 'GATE_CHECK',
        retries: attempt - 1
      });
      onGateStatus?.({ taskId: task.id, paneId, status: 'CHECKING', attempt });

      try {
        // 1. Verifica se arquivos obrigatorios (contratos/outputs) foram gerados
        if (Array.isArray(task.expectedFiles)) {
          for (const relFile of task.expectedFiles) {
            const fullPath = path.join(worktreePath, relFile);
            if (!fs.existsSync(fullPath)) {
              throw new Error(`Arquivo esperado pelo contrato nao foi encontrado: ${relFile}`);
            }
          }
        }

        // 2. Executa o comando deterministico (Build / Lint / Testes) no Worktree
        const stdout = execSync(gateCmd, {
          cwd: worktreePath,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 90000
        });

        this.blackboard.updateTask(task.id, {
          status: 'PASSED',
          lastGateError: null
        });

        onGateStatus?.({ taskId: task.id, paneId, status: 'PASSED', attempt, stdout });
        return { passed: true, attempt, output: stdout };
      } catch (err) {
        const rawError = `${err.stdout || ''}\n${err.stderr || err.message || ''}`.trim();
        // Compacta para as ultimas 35 linhas para nao poluir a janela de contexto do agente
        const compactTraceback = rawError.split('\n').slice(-35).join('\n');

        this.blackboard.updateTask(task.id, {
          retries: attempt,
          lastGateError: compactTraceback
        });

        // Verifica se atingiu o limite do Circuit Breaker
        if (attempt >= this.maxRetries) {
          this.terminalManager?.killPane(paneId);
          this.blackboard.updateTask(task.id, {
            status: 'BLOCKED',
            summary: `Circuit Breaker acionado apos ${attempt} falhas no Gate.`
          });

          onGateStatus?.({
            taskId: task.id,
            paneId,
            status: 'CIRCUIT_OPEN',
            attempt,
            error: compactTraceback
          });

          return {
            passed: false,
            circuitBroken: true,
            attempt,
            error: compactTraceback
          };
        }

        // Envia feedback enxuto para o stdin do mesmo terminal para autocorrecao
        onGateStatus?.({
          taskId: task.id,
          paneId,
          status: 'RETRYING',
          attempt,
          error: compactTraceback
        });

        const healInstruction = [
          ``,
          `[MAESTRO QUALITY GATE FAILED - TENTATIVA ${attempt}/${this.maxRetries}]`,
          `Comando executado: ${gateCmd}`,
          `Traceback (ultimas 35 linhas):`,
          compactTraceback,
          `Corrija apenas a causa raiz dentro dos arquivos permitidos no seu TASK_SPEC.md e imprima <<MAESTRO_TASK_DONE>> ao concluir.`,
          ``
        ].join('\n');

        this.terminalManager?.writeToPane(paneId, `${healInstruction}\r`);

        // Aguarda o agente terminar o ciclo de correcao antes de re-executar o Gate
        if (typeof this.terminalManager?.waitForTurnCompletion === 'function') {
          await this.terminalManager.waitForTurnCompletion(paneId, 240000);
        }
      }
    }
  }
}
