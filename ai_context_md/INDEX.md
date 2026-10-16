# HiperCloudShell - Arquivos do Núcleo e Orquestrador para IAs

Esta pasta contém a transcrição integral dos arquivos do núcleo em formato Markdown (.md) para facilitar a leitura, análise e geração de código compatível por agentes de IA.

| Arquivo MD | Arquivo Fonte Original | Linguagem | Descrição |
|---|---|---|---|
| [01_rust_dual_engine.md](01_rust_dual_engine.md) | src-tauri/src/dual_engine.rs | rust | Adaptador Rust nativo para orquestrar Claude Code (claude) e Google Antigravity (agy), unificando schemas JSON, flags de esforço e piping assíncrono. |
| [02_rust_pty_manager.md](02_rust_pty_manager.md) | src-tauri/src/pty_manager.rs | rust | Gerenciador PTY baseado em portable-pty para spawn de sessões interativas no Windows (ConPTY) e Unix, permitindo que o usuário assuma qualquer subagente. |
| [03_rust_blackboard.md](03_rust_blackboard.md) | src-tauri/src/blackboard.rs | rust | Estado compartilhado thread-safe (Arc<RwLock>) com persistência atômica (.tmp + rename), Merkle Replay Cache baseado em SHA-256 da árvore Git e Circuit Breaker financeiro de tokens. |
| [04_rust_commands.md](04_rust_commands.md) | src-tauri/src/commands.rs | rust | Endpoints invocáveis pelo frontend para gerenciamento de worktrees com junctions, verificação de Merkle Cache, PTY e execução de Quality Gates. |
| [05_rust_worktree.md](05_rust_worktree.md) | src-tauri/src/worktree.rs | rust | Criação instantânea (< 150ms) de Git Worktrees isoladas com Zero-Copy Junctions (mklink /J / symlink) para node_modules e pool pré-aquecido assíncrono. |
| [06_rust_gates.md](06_rust_gates.md) | src-tauri/src/gates.rs | rust | Validadores nativos de vazamento de memória GPU em Three.js/R3F (dispose checks, allocation in useFrame) e conformidade de scripts Blender EXR -> Pixel Art. |
| [07_rust_squads.md](07_rust_squads.md) | src-tauri/src/squads.rs | rust | Definições oficiais dos 8 squads canônicos do HiperCloudShell, incluindo o squad-pixel-forge-3d. |
| [08_orchestrator_maestro.md](08_orchestrator_maestro.md) | orchestrator/maestro.js | javascript | Motor central de workflows autônomos em sandbox node:vm com primitivas speculate(), consensus(), parallel(), pipeline(), gates determinísticos e hot-takeover. |
| [09_orchestrator_term.md](09_orchestrator_term.md) | orchestrator/term.js | javascript | Gerenciamento de processos PTY locais e CloudShell SSH com parser de eventos NDJSON em streaming e stripping de sequências ANSI. |
| [10_orchestrator_blackboard.md](10_orchestrator_blackboard.md) | orchestrator/blackboard.js | javascript | Gerenciador de memória compartilhada do DAG (.maestro/blackboard.json), injeção de Context Packs, sementeira de templates em .claude/workflows e catálogo de squads. |
| [11_frontend_tauri_bridge.md](11_frontend_tauri_bridge.md) | src/tauri-bridge.js | javascript | Adaptador de invocação tauri invoke/listen para comunicação entre a UI React e os módulos Rust/Node.js com fallbacks automáticos. |
| [12_frontend_app_jsx.md](12_frontend_app_jsx.md) | src/App.jsx | javascript | Cockpit completo contendo Grid Multi-Terminal PTY, Mission Control de Dynamic Workflows, Galeria de Squads e o Estúdio Interativo Pixel Forge 3D com zoom pixelated e aprovação 1-click. |
