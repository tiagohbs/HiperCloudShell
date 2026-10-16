# Arquitetura de Componentes Frontend (UI Modular HiperCloudShell)

A interface foi reestruturada de forma modular, eliminando a tela única monolítica e estabelecendo uma **jornada do usuário clara (Início, Meio e Fim de Fluxo)** com abas de trabalho e modais dedicados.

---

## 1. Modais de Controle & Governança

- **`src/components/NewWorkflowModal.jsx` (Início de Fluxo)**:
  - Assistente guiado em 3 passos (Seleção de Template/Prompt -> Configuração de Motor & Budget -> Validação & Disparo).
  - Catálogo dos 8 Squads Canônicos (Mutation Hunter, Cinema Frontend, 3D Shader Studio, Pixel Forge 3D, etc.).
  - Atalho global `Ctrl+K`.

- **`src/components/ApprovalGateModal.jsx` (Fim de Fluxo & Merge na Main)**:
  - Human-in-the-Loop review acionado quando um workflow atinge `pending_approval` ou o usuário deseja fazer o merge na `main`.
  - Checklist dos 5 Quality Gates determinísticos (Zod Schema, `npm test`, VRAM < 200MB, Merkle Replay SHA-256 e Anti-Exfiltração).
  - Ações: `[✓ Fazer Merge na Main]`, `[🔄 Solicitar Ajuste ao Agente]`, `[✕ Descartar Worktree]`.

- **`src/components/SettingsModal.jsx` (Conectividade & Parâmetros)**:
  - Exibe o status do **Google Stitch MCP** (`✔ Connected`), endpoint `https://stitch.googleapis.com/mcp` e chave `STITCH_API_KEY` protegida via `.env`.
  - Configuração de motor padrão (`claude` | `antigravity` | `hybrid`), esforço e teto financeiro de tokens.

- **`src/components/NotificationsDrawer.jsx` (Centro de Notificações Rastreáveis)**:
  - Painel lateral deslizante com códigos `HCS-ERR-*`, `HCS-BTL-*` e `HCS-IMP-*`.
  - Deep-linking direto para o agente de origem no Grid PTY ou para a sessão de Auto-Melhoria no CloudShell.

---

## 2. Vistas Modulares (Abas de Navegação)

- **`src/components/views/DashboardView.jsx` (`activeView === 'dashboard'`)**:
  - Visão executiva inicial com métricas de sistema (tokens consumidos, worktrees ativas, auto-melhorias).
  - Botão de destaque para início de workflow e lançadores rápidos dos principais Squads.
  - Tabela resumida de execuções com botão de merge rápido para fluxos aprovados.

- **`src/components/views/WorkflowsView.jsx` (`activeView === 'workflows'`)**:
  - Painel de inspeção de Dynamic Workflows com abas internas:
    - *Sandbox JavaScript (node:vm)*: Editor do script determinístico.
    - *Subagentes & PTY*: Cards com status, métricas e botão de **Hot-Takeover ConPTY**.
    - *Resultado Consolidado*: JSON/Markdown final retornado ao contexto pai.

- **`src/components/views/TerminalGridView.jsx` (`activeView === 'grid'`)**:
  - Grid de terminais ConPTY com layouts `1x1`, `2x2` e `3x2`.
  - Linha de entrada para comandos diretos nos terminais isolados.
  - Painel lateral com visualizador do Blackboard JSON e especificações de tarefas Zero-Exploration.

- **`src/components/views/PixelForgeView.jsx` (`activeView === 'pixel-forge'`)**:
  - Estúdio procedural 3D -> Pixel Art 16-bit para o Squad 8 (`squad-pixel-forge-3d`).
  - 3 variantes comparativas com zoom Nearest-Neighbor (`1x`, `2x`, `5x`).
  - Prancha PIL comparativa e simulador de bolsa de 16 slots com suíte de testes Playwright.

- **`src/components/views/SelfImprovementView.jsx` (`activeView === 'self-improvement'`)**:
  - Sistema de auto-cura contínua com alternância de motor (`claude` / `antigravity` / `hybrid`).
  - Rastreamento de gargalos de latência (> 45s).
  - Terminal interativo CloudShell em Worktree isolada com Zero-Copy Junctions.
