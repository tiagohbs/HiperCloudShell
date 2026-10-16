# HiperCloudShell - Arquivos do Núcleo e Orquestrador para IAs

Esta pasta contém a transcrição integral dos arquivos do núcleo em formato Markdown (`.md`) para facilitar a leitura, análise e geração de código compatível por agentes de IA que não executam arquivos de código nativamente.

### Tabela de Mapeamento

| Arquivo MD | Arquivo Fonte Original | Linguagem | Descrição |
|---|---|---|---|
| **[`lib.rs.md`](lib.rs.md)** / [`00_rust_lib.md`](00_rust_lib.md) | `src-tauri/src/lib.rs` | rust | Ponto de entrada do runtime Tauri v2: inicialização de builders, estados e registro dos 20 handlers IPC. |
| **[`01_rust_dual_engine.md`](01_rust_dual_engine.md)** | `src-tauri/src/dual_engine.rs` | rust | Adaptador Rust nativo para orquestrar Claude Code (`claude`) e Antigravity (`agy`). |
| **[`02_rust_pty_manager.md`](02_rust_pty_manager.md)** | `src-tauri/src/pty_manager.rs` | rust | Gerenciador PTY nativo (ConPTY no Windows) para spawn de sessões interativas e hot-takeover. |
| **[`03_rust_blackboard.md`](03_rust_blackboard.md)** | `src-tauri/src/blackboard.rs` | rust | Blackboard, Merkle Replay Cache (SHA-256 DAG) e Circuit Breaker financeiro de tokens. |
| **[`04_rust_commands.md`](04_rust_commands.md)** | `src-tauri/src/commands.rs` | rust | Handlers IPC do Tauri para Worktrees, PTY, Merkle Cache e Quality Gates. |
| **[`05_rust_worktree.md`](05_rust_worktree.md)** | `src-tauri/src/worktree.rs` | rust | WorktreeManager com Zero-Copy Junctions (`mklink /J`) e Pre-Warming Pool assíncrono (< 150ms). |
| **[`06_rust_gates.md`](06_rust_gates.md)** | `src-tauri/src/gates.rs` | rust | Validadores determinísticos de VRAM leaks (Three.js/R3F) e conformidade de pipeline 3D Pixel Art. |
| **[`07_rust_squads.md`](07_rust_squads.md)** | `src-tauri/src/squads.rs` | rust | Catálogo dos 8 Squads Canônicos do HiperCloudShell em Rust. |
| **[`08_orchestrator_maestro.md`](08_orchestrator_maestro.md)** | `orchestrator/maestro.js` | javascript | Motor central de workflows em sandbox `node:vm` com `speculate()`, `consensus()`, `parallel()` e `pipeline()`. |
| **[`09_orchestrator_term.md`](09_orchestrator_term.md)** | `orchestrator/term.js` | javascript | TerminalManager com streaming NDJSON e ANSI stripping. |
| **[`10_orchestrator_blackboard.md`](10_orchestrator_blackboard.md)** | `orchestrator/blackboard.js` | javascript | Memória compartilhada do DAG, injeção de Context Packs e templates em `.claude/workflows`. |
| **[`11_frontend_tauri_bridge.md`](11_frontend_tauri_bridge.md)** | `src/tauri-bridge.js` | javascript | Ponte IPC (`window.ultracodeAPI`) conectando a UI aos módulos Rust e Node.js. |
| **[`App.jsx.md`](App.jsx.md)** / [`12_frontend_app_jsx.md`](12_frontend_app_jsx.md) | `src/App.jsx` | javascript/jsx | Cockpit completo com Grid PTY, Mission Control e Estúdio Pixel Forge 3D interativo. |
