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

- **`src/components/SelfImprovementView.jsx` (`activeView === 'self-improvement'`)**:
  - Sistema de auto-cura contínua com alternância de motor (`claude` / `antigravity` / `hybrid`).
  - Rastreamento de gargalos de latência (> 45s).
  - Terminal interativo CloudShell em Worktree isolada com Zero-Copy Junctions.

---

## 3. Sistema de Tema Diurno / Noturno (Bege Claro vs Calça Jeans Escura)

- **Modo Diurno (`light`)**:
  - **Fundo**: Bege linho/pergaminho (`bg-beige-100`, `bg-beige-50`).
  - **Tipografia**: Café expresso escuro quase preto (`text-espresso-950`, `text-espresso-900`) garantindo alto contraste e leitura sem cansar a vista.
  - **Botões de Ação**: Gradiente dourado brilhante (`from-gold-500 via-yellow-400 to-amber-500`) com sombra luminosa (`shadow-gold`).

- **Modo Noturno (`dark`)**:
  - **Fundo / Canvas**: Calça jeans escura índigo profundo (`bg-denim-950` #0B1324, `bg-denim-900` #0F1A30), intencionalmente puxado para o azul saturado em vez do preto acromático #000000.
  - **Superfícies & Cartões**: Azul jeans lavado escuro (`bg-denim-850` #132240) com bordas de trama denim twill (`border-denim-700` #223D72, `border-denim-800` #182B50).
  - **Tipografia**: Ice denim blue (`text-denim-50`, `text-denim-100`, `text-denim-200`).
  - **Botões & Rebites**: Ouro metálico brilhante mantido em contraste perfeito, emulando os rebites de bronze e a costura dourada tradicional das calças jeans escuras.
- **Alternador de Tema**:
  - Botão com ícones animados `IconSun` / `IconMoon` no `Header.jsx`.
  - Seletor dedicado com cartões visuais em `SettingsModal.jsx` (Aba *Tema & Visual*).
  - Persistência imediata via `localStorage.getItem('hcs_theme')` e comutação instantânea via `<html class="dark">`.
