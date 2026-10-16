# Núcleo Rust: WorktreeManager (Zero-Copy Junctions & Pre-Warming Pool)

> **Arquivo de Origem:** src-tauri/src/worktree.rs  
> **Tamanho:** 463 linhas (15.4 KB)  
> **Descrição:** Criação instantânea (< 150ms) de Git Worktrees isoladas com Zero-Copy Junctions (mklink /J / symlink) para node_modules e pool pré-aquecido assíncrono.

`rust
// src-tauri/src/worktree.rs
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeLease {
    pub task_id: String,
    pub branch_name: String,
    pub worktree_path: PathBuf,
    pub from_warm_pool: bool,
    pub junction_attached: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WorktreeInfo {
    #[serde(rename = "worktreePath")]
    pub worktree_path: String,
    #[serde(rename = "branchName")]
    pub branch_name: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MergeBranchResult {
    pub merged: bool,
    #[serde(rename = "hadConflicts")]
    pub had_conflicts: bool,
    #[serde(rename = "conflictsResolved")]
    pub conflicts_resolved: bool,
    #[serde(rename = "conflictedFiles")]
    pub conflicted_files: Vec<String>,
    #[serde(rename = "branchName")]
    pub branch_name: String,
    pub error: Option<String>,
}

#[derive(Clone)]
pub struct WorktreeManager {
    pub repo_root: PathBuf,
    pub worktrees_dir: PathBuf,
    warm_pool: Arc<Mutex<VecDeque<PathBuf>>>,
    target_pool_size: usize,
}

impl WorktreeManager {
    pub fn new(repo_root: impl Into<PathBuf>, target_pool_size: usize) -> Result<Self, String> {
        let repo_root = repo_root.into();
        let worktrees_dir = repo_root.join(".worktrees");

        if !worktrees_dir.exists() {
            fs::create_dir_all(&worktrees_dir)
                .map_err(|e| format!("Falha ao criar .worktrees: {}", e))?;
        }

        // Garante .gitignore com .worktrees/ e .maestro/
        let gitignore_path = repo_root.join(".gitignore");
        if let Ok(mut content) = fs::read_to_string(&gitignore_path) {
            let mut changed = false;
            if !content.contains(".worktrees/") {
                content.push_str("\n.worktrees/\n");
                changed = true;
            }
            if !content.contains(".maestro/") {
                content.push_str(".maestro/\n");
                changed = true;
            }
            if changed {
                let _ = fs::write(&gitignore_path, content);
            }
        } else {
            let _ = fs::write(&gitignore_path, ".worktrees/\n.maestro/\n");
        }

        let manager = Self {
            repo_root,
            worktrees_dir,
            warm_pool: Arc::new(Mutex::new(VecDeque::new())),
            target_pool_size,
        };

        // Pre-aquece os slots iniciais para que o primeiro speculate() seja instantaneo
        let _ = manager.replenish_warm_pool();
        Ok(manager)
    }

    /// Abastece o Pre-Warming Pool com worktrees em modo detached HEAD ja com Junction de node_modules
    pub fn replenish_warm_pool(&self) -> Result<usize, String> {
        let mut pool = self
            .warm_pool
            .lock()
            .map_err(|_| "Mutex warm_pool envenenado".to_string())?;

        let mut created = 0;
        while pool.len() < self.target_pool_size {
            let slot_id = format!("warm-slot-{}-{}", pool.len() + 1, Self::timestamp_ms());
            let slot_path = self.worktrees_dir.join(&slot_id);

            if slot_path.exists() {
                let _ = self.safe_remove_worktree_dir(&slot_path);
            }

            // Cria worktree em modo --detach para poder trocar de branch instantaneamente depois
            let output = Command::new("git")
                .args([
                    "worktree",
                    "add",
                    "--detach",
                    slot_path.to_string_lossy().as_ref(),
                    "HEAD",
                ])
                .current_dir(&self.repo_root)
                .output()
                .map_err(|e| format!("Erro ao executar git worktree add: {}", e))?;

            if !output.status.success() {
                return Err(format!(
                    "Git worktree warm slot falhou: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }

            // Injeta Zero-Copy Junction para node_modules
            let _ = self.attach_zero_copy_junctions(&slot_path);
            pool.push_back(slot_path);
            created += 1;
        }

        Ok(created)
    }

    /// Adquire uma Worktree isolada em < 150ms (retirando do Warm Pool se disponivel)
    pub fn acquire_worktree(&self, task_id: &str, base_ref: &str) -> Result<WorktreeLease, String> {
        let safe_id = Self::sanitize_id(task_id);
        let branch_name = format!("maestro/{}", safe_id);
        let final_path = self.worktrees_dir.join(&safe_id);

        if final_path.exists() {
            self.release_worktree(task_id, true)?;
        }

        // 1. Tenta retirar um slot pre-aquecido do Pool
        let warm_slot = {
            let mut pool = self
                .warm_pool
                .lock()
                .map_err(|_| "Mutex warm_pool envenenado".to_string())?;
            pool.pop_front()
        };

        if let Some(slot_path) = warm_slot {
            // Move o worktree pre-aquecido para o caminho definitivo da tarefa
            let move_out = Command::new("git")
                .args([
                    "worktree",
                    "move",
                    slot_path.to_string_lossy().as_ref(),
                    final_path.to_string_lossy().as_ref(),
                ])
                .current_dir(&self.repo_root)
                .output();

            if let Ok(out) = move_out {
                if out.status.success() {
                    // Faz checkout para a branch exclusiva da tarefa
                    let checkout_out = Command::new("git")
                        .args(["checkout", "-B", &branch_name, base_ref])
                        .current_dir(&final_path)
                        .output()
                        .map_err(|e| format!("Falha no git checkout -B: {}", e))?;

                    if checkout_out.status.success() {
                        let junction_ok = self.attach_zero_copy_junctions(&final_path).unwrap_or(false);
                        return Ok(WorktreeLease {
                            task_id: task_id.to_string(),
                            branch_name,
                            worktree_path: final_path,
                            from_warm_pool: true,
                            junction_attached: junction_ok,
                        });
                    }
                }
            }
        }

        // 2. Fallback: Alocacao direta caso o Warm Pool esteja vazio
        let output = Command::new("git")
            .args([
                "worktree",
                "add",
                "-B",
                &branch_name,
                final_path.to_string_lossy().as_ref(),
                base_ref,
            ])
            .current_dir(&self.repo_root)
            .output()
            .map_err(|e| format!("Falha ao rodar git worktree add: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Erro ao alocar worktree {}: {}",
                task_id,
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let junction_ok = self.attach_zero_copy_junctions(&final_path).unwrap_or(false);

        Ok(WorktreeLease {
            task_id: task_id.to_string(),
            branch_name,
            worktree_path: final_path,
            from_warm_pool: false,
            junction_attached: junction_ok,
        })
    }

    /// Cria Directory Junction (Windows) ou Symlink (Linux/macOS) para node_modules
    pub fn attach_zero_copy_junctions(&self, worktree_path: &Path) -> Result<bool, String> {
        let root_node_modules = self.repo_root.join("node_modules");
        if !root_node_modules.exists() {
            return Ok(false);
        }

        let wt_node_modules = worktree_path.join("node_modules");
        if wt_node_modules.exists() || wt_node_modules.symlink_metadata().is_ok() {
            return Ok(true);
        }

        #[cfg(target_os = "windows")]
        {
            // Usa mklink /J nativo do Windows (nao exige privilegio de Administrador!)
            let status = Command::new("cmd")
                .args([
                    "/C",
                    "mklink",
                    "/J",
                    wt_node_modules.to_string_lossy().as_ref(),
                    root_node_modules.to_string_lossy().as_ref(),
                ])
                .output()
                .map_err(|e| format!("Erro ao criar Junction mklink /J: {}", e))?;

            Ok(status.status.success())
        }

        #[cfg(not(target_os = "windows"))]
        {
            std::os::unix::fs::symlink(&root_node_modules, &wt_node_modules)
                .map_err(|e| format!("Erro ao criar symlink Unix para node_modules: {}", e))?;
            Ok(true)
        }
    }

    /// CRITICO: Remove o link da Junction ANTES de deletar a worktree para proteger o node_modules raiz
    fn detach_zero_copy_junctions(&self, worktree_path: &Path) {
        let wt_node_modules = worktree_path.join("node_modules");
        if wt_node_modules.symlink_metadata().is_ok() {
            #[cfg(target_os = "windows")]
            {
                // rmdir em uma Junction no Windows remove apenas o ponteiro sem tocar no alvo
                let _ = Command::new("cmd")
                    .args(["/C", "rmdir", wt_node_modules.to_string_lossy().as_ref()])
                    .output();
            }
            #[cfg(not(target_os = "windows"))]
            {
                let _ = fs::remove_file(&wt_node_modules);
            }
        }
    }

    fn safe_remove_worktree_dir(&self, worktree_path: &Path) -> Result<(), String> {
        self.detach_zero_copy_junctions(worktree_path);

        let _ = Command::new("git")
            .args([
                "worktree",
                "remove",
                "--force",
                worktree_path.to_string_lossy().as_ref(),
            ])
            .current_dir(&self.repo_root)
            .output();

        if worktree_path.exists() {
            let _ = fs::remove_dir_all(worktree_path);
        }
        Ok(())
    }

    /// Libera a worktree e opcionalmente deleta a branch temporaria
    pub fn release_worktree(&self, task_id: &str, delete_branch: bool) -> Result<(), String> {
        let safe_id = Self::sanitize_id(task_id);
        let branch_name = format!("maestro/{}", safe_id);
        let worktree_path = self.worktrees_dir.join(&safe_id);

        self.safe_remove_worktree_dir(&worktree_path)?;

        if delete_branch {
            let _ = Command::new("git")
                .args(["branch", "-D", &branch_name])
                .current_dir(&self.repo_root)
                .output();
        }

        Ok(())
    }

    fn sanitize_id(raw: &str) -> String {
        raw.chars()
            .map(|c| {
                if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                    c.to_ascii_lowercase()
                } else {
                    '-'
                }
            })
            .collect()
    }

    fn timestamp_ms() -> u128 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    }

    /// Cria worktree isolada para o subagente
    pub async fn create_isolated_worktree(
        &self,
        agent_id: &str,
        base_branch: Option<&str>,
    ) -> Result<WorktreeInfo, String> {
        let lease = self.acquire_worktree(agent_id, base_branch.unwrap_or("HEAD"))?;
        Ok(WorktreeInfo {
            worktree_path: lease.worktree_path.to_string_lossy().to_string(),
            branch_name: lease.branch_name,
        })
    }

    /// Commita alterações produzidas pelo subagente na worktree
    pub async fn commit_worktree_changes(&self, worktree_path: &str, message: &str) -> Result<bool, String> {
        let _ = tokio::process::Command::new("git")
            .current_dir(worktree_path)
            .args(["add", "-A"])
            .output()
            .await;

        let status = tokio::process::Command::new("git")
            .current_dir(worktree_path)
            .args(["status", "--porcelain"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let status_str = String::from_utf8_lossy(&status.stdout);
        if status_str.trim().is_empty() {
            return Ok(false);
        }

        let out = tokio::process::Command::new("git")
            .current_dir(worktree_path)
            .args(["commit", "-m", message])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        Ok(out.status.success())
    }

    /// Faz o merge da branch da worktree de volta na branch principal com detecção de conflitos
    pub async fn merge_worktree_branch(&self, branch_name: &str) -> Result<MergeBranchResult, String> {
        let merge_out = tokio::process::Command::new("git")
            .current_dir(&self.repo_root)
            .args(["merge", "--no-ff", "-m", &format!("Merge {}", branch_name), branch_name])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if merge_out.status.success() {
            return Ok(MergeBranchResult {
                merged: true,
                had_conflicts: false,
                conflicts_resolved: false,
                conflicted_files: vec![],
                branch_name: branch_name.to_string(),
                error: None,
            });
        }

        // Conflitos detectados
        let diff_out = tokio::process::Command::new("git")
            .current_dir(&self.repo_root)
            .args(["diff", "--name-only", "--diff-filter=U"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let conflicted_files: Vec<String> = String::from_utf8_lossy(&diff_out.stdout)
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();

        // Aborta o merge limpo caso não haja resolução imediata
        let _ = tokio::process::Command::new("git")
            .current_dir(&self.repo_root)
            .args(["merge", "--abort"])
            .output()
            .await;

        Ok(MergeBranchResult {
            merged: false,
            had_conflicts: true,
            conflicts_resolved: false,
            conflicted_files,
            branch_name: branch_name.to_string(),
            error: Some(String::from_utf8_lossy(&merge_out.stderr).to_string()),
        })
    }

    /// Remove a worktree e opcionalmente apaga a branch
    pub async fn remove_worktree(
        &self,
        worktree_path: &str,
        branch_name: Option<&str>,
        delete_branch: bool,
    ) -> Result<(), String> {
        let _ = tokio::process::Command::new("git")
            .current_dir(&self.repo_root)
            .args(["worktree", "remove", "--force", worktree_path])
            .output()
            .await;

        let _ = tokio::process::Command::new("git")
            .current_dir(&self.repo_root)
            .args(["worktree", "prune"])
            .output()
            .await;

        let path = Path::new(worktree_path);
        if path.exists() {
            let _ = std::fs::remove_dir_all(path);
        }

        if delete_branch {
            if let Some(b) = branch_name {
                let _ = tokio::process::Command::new("git")
                    .current_dir(&self.repo_root)
                    .args(["branch", "-D", b])
                    .output()
                    .await;
            }
        }

        Ok(())
    }
}
`
