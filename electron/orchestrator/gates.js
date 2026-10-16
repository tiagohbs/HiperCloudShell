// electron/orchestrator/gates.js
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
          this.terminalManager.killPane(paneId);
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

        this.terminalManager.writeToPane(paneId, `${healInstruction}\r`);

        // Aguarda o agente terminar o ciclo de correcao antes de re-executar o Gate
        await this.terminalManager.waitForTurnCompletion(paneId, 240000);
      }
    }
  }
}
