// electron/orchestrator/worktree-manager.js
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export class WorktreeManager {
  constructor(repoRoot) {
    this.repoRoot = repoRoot;
    this.worktreesDir = path.join(repoRoot, '.worktrees');
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
        // Lista arquivos que mudaram junto com fileA nos ultimos 15 commits
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
  commitWorktreeChanges(worktreePath, taskId, summary) {
    // Remove o pacote temporario de contexto antes de commitar
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

    execFileSync('git', ['commit', '-m', `feat(maestro:${taskId}): ${summary}`], {
      cwd: worktreePath,
      stdio: 'pipe'
    });

    return { committed: true, changedFiles };
  }

  /**
   * Faz o merge da branch do worktree de volta para a branch principal do projeto
   */
  mergeWorktreeToBase(taskId) {
    const safeId = taskId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const branchName = `maestro/${safeId}`;

    execFileSync('git', ['merge', '--no-ff', branchName, '-m', `merge(maestro): integra tarefa ${taskId}`], {
      cwd: this.repoRoot,
      stdio: 'pipe'
    });
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
      // Fallback para Windows caso handles pendentes impeçam a remoção direta
      try {
        execFileSync('git', ['worktree', 'prune'], {
          cwd: this.repoRoot,
          stdio: 'pipe'
        });
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
