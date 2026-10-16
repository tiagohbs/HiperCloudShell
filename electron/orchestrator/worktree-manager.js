// electron/orchestrator/worktree-manager.js
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);

export class WorktreeManager {
  constructor(repoRoot = process.cwd()) {
    this.repoRoot = repoRoot;
    this.worktreesDir = path.join(this.repoRoot, '.worktrees');
    this.ensureWorktreesDirectory();
  }

  ensureWorktreesDirectory() {
    if (!fs.existsSync(this.worktreesDir)) {
      fs.mkdirSync(this.worktreesDir, { recursive: true });
    }

    // Garante que .worktrees e .maestro nao poluam o status principal do Git
    const gitignorePath = path.join(this.repoRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const additions = [];
      if (!content.includes('.worktrees/')) additions.push('.worktrees/');
      if (!content.includes('.maestro/')) additions.push('.maestro/');
      if (additions.length > 0) {
        fs.appendFileSync(gitignorePath, `\n# HiperCloudShell Maestro\n${additions.join('\n')}\n`);
      }
    } else {
      fs.writeFileSync(gitignorePath, `# HiperCloudShell Maestro\n.worktrees/\n.maestro/\n`, 'utf-8');
    }
  }

  // ==========================================================================
  // METODOS ULTRACODE WORKFLOWS
  // ==========================================================================
  async createIsolatedWorktree(agentId, baseBranch = 'HEAD') {
    fs.mkdirSync(this.worktreesDir, { recursive: true });
    const sanitizedId = agentId.replace(/[^a-zA-Z0-9_-]/g, '-');
    const branchName = `ultracode/${sanitizedId}-${Date.now()}`;
    const worktreePath = path.join(this.worktreesDir, sanitizedId);

    if (fs.existsSync(worktreePath)) {
      await this.removeWorktree(worktreePath, branchName).catch(() => {});
    }

    await execFileAsync('git', [
      'worktree',
      'add',
      '-b',
      branchName,
      worktreePath,
      baseBranch
    ], { cwd: this.repoRoot });

    return { worktreePath, branchName };
  }

  async getWorktreeDiff(worktreePath) {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: worktreePath
    }).catch(() => ({ stdout: '' }));
    return (stdout || '').trim();
  }

  async removeWorktree(worktreePath, branchName, deleteBranch = false) {
    await execFileAsync('git', ['worktree', 'remove', '--force', worktreePath], {
      cwd: this.repoRoot
    }).catch(() => {});

    try {
      await execFileAsync('git', ['worktree', 'prune'], { cwd: this.repoRoot });
    } catch (_) {}

    if (fs.existsSync(worktreePath)) {
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      } catch (_) {}
    }

    if (deleteBranch && branchName) {
      await execFileAsync('git', ['branch', '-D', branchName], {
        cwd: this.repoRoot
      }).catch(() => {});
    }
  }

  // ==========================================================================
  // METODOS CLASSICOS DO MAESTRO DAG
  // ==========================================================================
  /**
   * Analisa o historico recente do Git (Co-Change) para detectar acoplamento oculto
   * entre duas listas de arquivos antes de permitir paralelismo no DAG.
   */
  detectCoChangeCoupling(filesTaskA = [], filesTaskB = []) {
    const conflicts = [];
    const setB = new Set(filesTaskB);

    for (const fileA of filesTaskA) {
      if (setB.has(fileA)) {
        conflicts.push({ type: 'DIRECT_OVERLAP', file: fileA });
        continue;
      }
      try {
        const logOut = execFileSync(
          'git',
          ['log', '-n', '15', '--name-only', '--pretty=format:', '--', fileA],
          { cwd: this.repoRoot, encoding: 'utf-8', stdio: 'pipe' }
        );
        const coChangedFiles = logOut
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean);

        for (const coFile of coChangedFiles) {
          if (setB.has(coFile)) {
            conflicts.push({
              type: 'CO_CHANGE_COUPLING',
              source: fileA,
              coupledWith: coFile
            });
          }
        }
      } catch (_) {
        // Ignora caso o arquivo ainda seja novo no repositorio
      }
    }

    return {
      hasCoupling: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Aloca um Git Worktree dedicado e uma branch isolada para o painel do agente
   */
  allocateWorktree(taskId, baseBranch = 'HEAD') {
    const safeId = taskId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const branchName = `maestro/${safeId}`;
    const worktreePath = path.join(this.worktreesDir, safeId);

    if (fs.existsSync(worktreePath)) {
      this.releaseWorktree(taskId, true);
    }

    execFileSync('git', ['worktree', 'add', '-B', branchName, worktreePath, baseBranch], {
      cwd: this.repoRoot,
      stdio: 'pipe'
    });

    return {
      taskId,
      safeId,
      branchName,
      worktreePath
    };
  }

  /**
   * Realiza o commit das alteracoes validadas pelo Gate dentro do worktree
   */
  commitWorktreeChanges(worktreePath, summaryOrMessage = 'automated changes') {
    const localMaestroDir = path.join(worktreePath, '.maestro');
    if (fs.existsSync(localMaestroDir)) {
      fs.rmSync(localMaestroDir, { recursive: true, force: true });
    }

    execFileSync('git', ['add', '-A'], { cwd: worktreePath, stdio: 'pipe' });
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: worktreePath,
      encoding: 'utf-8'
    }).trim();

    if (!status) return { committed: false, changedFiles: [] };

    const changedFiles = status
      .split('\n')
      .map((line) => line.slice(3).trim())
      .filter(Boolean);

    const message = summaryOrMessage.startsWith('feat(') || summaryOrMessage.startsWith('ultracode(')
      ? summaryOrMessage
      : `feat(maestro): ${summaryOrMessage}`;

    execFileSync('git', ['commit', '-m', message], {
      cwd: worktreePath,
      stdio: 'pipe'
    });

    return { committed: true, changedFiles };
  }

  /**
   * Faz o merge da branch do worktree de volta para a branch principal do projeto
   * com protecao automatica (abort na presenca de conflitos)
   */
  mergeWorktreeToBase(taskId) {
    const safeId = taskId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const branchName = `maestro/${safeId}`;

    try {
      execFileSync(
        'git',
        ['merge', '--no-ff', branchName, '-m', `merge(maestro): integra tarefa ${taskId}`],
        { cwd: this.repoRoot, stdio: 'pipe' }
      );
    } catch (err) {
      try {
        execFileSync('git', ['merge', '--abort'], { cwd: this.repoRoot, stdio: 'pipe' });
      } catch (_) {}
      throw new Error(`Conflito ao integrar worktree da tarefa ${taskId}. Merge abortado para preservar branch base.`);
    }
  }

  /**
   * Remove o worktree e limpa a branch temporaria
   */
  releaseWorktree(taskId, deleteBranch = false) {
    const safeId = taskId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const branchName = `maestro/${safeId}`;
    const worktreePath = path.join(this.worktreesDir, safeId);

    try {
      execFileSync('git', ['worktree', 'remove', '--force', worktreePath], {
        cwd: this.repoRoot,
        stdio: 'pipe'
      });
    } catch (_) {
      try {
        execFileSync('git', ['worktree', 'prune'], { cwd: this.repoRoot, stdio: 'pipe' });
      } catch (_) {}
    }

    if (fs.existsSync(worktreePath)) {
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      } catch (_) {}
    }

    if (deleteBranch) {
      try {
        execFileSync('git', ['branch', '-D', branchName], {
          cwd: this.repoRoot,
          stdio: 'pipe'
        });
      } catch (_) {}
    }
  }
}
