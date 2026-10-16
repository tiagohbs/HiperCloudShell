use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::process::Command;

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
}

impl WorktreeManager {
    pub fn new(repo_root: impl AsRef<Path>) -> Self {
        let root = repo_root.as_ref().to_path_buf();
        let wt_dir = root.join(".worktrees");
        let _ = std::fs::create_dir_all(&wt_dir);

        // Garante .gitignore com .worktrees/ e .maestro/
        let gitignore_path = root.join(".gitignore");
        if let Ok(mut content) = std::fs::read_to_string(&gitignore_path) {
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
                let _ = std::fs::write(&gitignore_path, content);
            }
        } else {
            let _ = std::fs::write(&gitignore_path, ".worktrees/\n.maestro/\n");
        }

        Self {
            repo_root: root,
            worktrees_dir: wt_dir,
        }
    }

    /// Cria worktree isolada para o subagente
    pub async fn create_isolated_worktree(
        &self,
        agent_id: &str,
        base_branch: Option<&str>,
    ) -> Result<WorktreeInfo, String> {
        let sanitized = agent_id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "-");
        let branch_name = format!("ultracode/{}-{}", sanitized, chrono::Utc::now().timestamp_millis());
        let wt_path = self.worktrees_dir.join(&sanitized);

        if wt_path.exists() {
            let _ = self.remove_worktree(&wt_path.to_string_lossy(), Some(&branch_name), true).await;
        }

        let base = base_branch.unwrap_or("HEAD");
        let out = Command::new("git")
            .current_dir(&self.repo_root)
            .args(["worktree", "add", "-b", &branch_name, &wt_path.to_string_lossy(), base])
            .output()
            .await
            .map_err(|e| format!("Falha ao invocar git worktree: {}", e))?;

        if !out.status.success() {
            return Err(format!("Erro ao criar worktree: {}", String::from_utf8_lossy(&out.stderr)));
        }

        Ok(WorktreeInfo {
            worktree_path: wt_path.to_string_lossy().to_string(),
            branch_name,
        })
    }

    /// Commita alterações produzidas pelo subagente na worktree
    pub async fn commit_worktree_changes(&self, worktree_path: &str, message: &str) -> Result<bool, String> {
        let _ = Command::new("git")
            .current_dir(worktree_path)
            .args(["add", "-A"])
            .output()
            .await;

        let status = Command::new("git")
            .current_dir(worktree_path)
            .args(["status", "--porcelain"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let status_str = String::from_utf8_lossy(&status.stdout);
        if status_str.trim().is_empty() {
            return Ok(false);
        }

        let out = Command::new("git")
            .current_dir(worktree_path)
            .args(["commit", "-m", message])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        Ok(out.status.success())
    }

    /// Faz o merge da branch da worktree de volta na branch principal com detecção de conflitos
    pub async fn merge_worktree_branch(&self, branch_name: &str) -> Result<MergeBranchResult, String> {
        let merge_out = Command::new("git")
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
        let diff_out = Command::new("git")
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
        let _ = Command::new("git")
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
        let _ = Command::new("git")
            .current_dir(&self.repo_root)
            .args(["worktree", "remove", "--force", worktree_path])
            .output()
            .await;

        let _ = Command::new("git")
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
                let _ = Command::new("git")
                    .current_dir(&self.repo_root)
                    .args(["branch", "-D", b])
                    .output()
                    .await;
            }
        }

        Ok(())
    }
}
