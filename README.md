# HiperCloudShell ADE

> **Motor Híbrido de Orquestração Multi-Agente:** União entre terminais locais isolados por Git Worktrees (`node-pty`) e nós em nuvem via Google Cloud Shell SSH, coordenados por um Grafo Acíclico Dirigido (DAG) com Quality Gates determinísticos e Blackboard centralizado.

---

## 🏛️ Visão Geral da Arquitetura

HiperCloudShell ADE implementa uma arquitetura robusta para squads de agentes de IA operando em paralelo sem conflitos de merge ou vazamento de contexto:

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| **Worktree Manager** | `electron/orchestrator/worktree-manager.js` | Aloca branches temporárias (`maestro/<task-id>`) e diretórios `.worktrees/<task-id>`, detecta acoplamento oculto (*Co-Change Git Log*) e executa merges seguros pós-Gate. |
| **Blackboard Central** | `electron/orchestrator/blackboard.js` | Gerencia estado compartilhado atômico em `.maestro/blackboard.json` e injeta Context Packs (`.maestro/TASK_SPEC.md`) com escopo estrito de arquivos (*Zero-Exploration* & *Anti-Mind-Virus*). |
| **Terminal Manager** | `electron/term.js` | Gerencia sessões locais via `node-pty` ou remotas via SSH/CloudShell, limpa códigos ANSI, monitora o marcador `<<MAESTRO_TASK_DONE>>` e aciona o Watchdog de Silêncio para prompts `[y/N]`. |
| **Quality Gates** | `electron/orchestrator/gates.js` | Executa validação determinística (`build`, `test`, `lint`) dentro do worktree do agente, envia as últimas 35 linhas de erro via `stdin` para autocorreção e aciona o Circuit Breaker (`SIGKILL`) na 3ª falha. |
| **Maestro Orchestrator** | `electron/orchestrator/maestro.js` | Orquestrador do Grafo Acíclico Dirigido (DAG): despacha nós prontos em paralelo, monitora orçamento global de tokens e integra os resultados. |
| **Cockpit ADE UI** | `src/App.jsx` | Grid interativo multi-terminal (2x2, 3x2, 1x1), inspetor de Blackboard JSON, visualizador de Worktrees e simulador de cenários (`100% Limpo`, `Auto-Heal`, `Circuit Breaker`). |

---

## 🚀 Como Executar

### 1. Pré-requisitos
- **Node.js**: v20+ (recomendado v22 ou v24)
- **Git**: Configurado no sistema

### 2. Instalação
```bash
npm install
```

### 3. Rodar a Interface de Simulação e Cockpit (Vite / React)
```bash
npm run dev
```
Acesse `http://localhost:5173`.

### 4. Rodar os Testes Automatizados do Orquestrador
```bash
npm test
```
Executa a suíte de testes com cobertura de DAG E2E, Blackboard, ANSI stripper, detecção de acoplamento Co-Change e Circuit Breaker.

### 5. Iniciar via Electron (Aplicação Desktop)
```bash
npm start
```

---

## 🛡️ Pilares Táticos de Confiabilidade

1. **Isolamento Físico de Worktrees**: Cada agente edita apenas sua cópia do repositório em `.worktrees/<task-id>`, prevenindo colisões de escrita.
2. **Context Packs Zero-Exploration**: Redução de até 80% no consumo de tokens ao fornecer listas estritas de arquivos de leitura e escrita.
3. **Blindagem Anti-Mind-Virus**: Instruções para agentes tratarem saídas e comentários de outros agentes como dados não-confiáveis, validando apenas contra os contratos e os gates determinísticos.
4. **Auto-Heal em Loop Fechado**: Quando um teste falha, o erro compactado é injetado diretamente no terminal do agente para que ele mesmo corrija o código.
5. **Circuit Breaker Financeiro**: Se o agente falhar 3 vezes consecutivas ou se o orçamento global de tokens for atingido, o processo é encerrado imediatamente com `SIGKILL`.
6. **Watchdog de Silêncio**: Detecta prompts interativos que travam agentes de terminal (ex: `[y/N]`, `Continue?`) e pode responder automaticamente quando dentro de worktrees isoladas.

---

## 📄 Licença
MIT
