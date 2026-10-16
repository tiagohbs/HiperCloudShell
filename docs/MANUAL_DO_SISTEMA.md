# Manual Completo do Sistema: HiperCloudShell ADE v2.0
> **Ambiente de Desenvolvimento Autônomo Multiagente (Tauri v2 + Rust + React + Claude Code CLI + Antigravity CLI + Blender BPY)**

---

## 1. Visão Geral e Propósito

O **HiperCloudShell ADE** é uma estação de engenharia de software autônoma e orquestrador multiagente de nível industrial. Ele permite que desenvolvedores coordenem exércitos de agentes de inteligência artificial (alimentados pelo **Claude Code CLI** e pelo **Antigravity CLI**) em ambientes isolados por **Git Worktrees**, com cache determinístico via **Merkle Replay**, terminais interativos em tempo real via **ConPTY do Windows**, pipelines 3D reais no **Blender Headless**, e um sistema integrado de **Auto-Melhoria Contínua**.

Ao contrário de interfaces convencionais de chat com IA, o HiperCloudShell opera como um verdadeiro **Ambiente de Engenharia Determinístico**:
1. O código do seu repositório principal nunca é tocado diretamente por subagentes até que passem por **Quality Gates** automatizados (testes unitários, linter e build).
2. O consumo financeiro de tokens é protegido por **Circuit Breakers** configuráveis com opção de teto ilimitado.
3. Se um subagente hesitar ou requerer intervenção, você pode realizar **Hot-Takeover** instantâneo no pseudoterminal real do processo.
4. Todo o sistema é focado em um **Projeto Ativo** selecionável, conectando branches, commits e GitHub Issues diretamente ao ciclo de vida dos agentes.

---

## 2. Identidade Visual & Design System (Apple HIG + Material 3)

O sistema segue rigorosas diretrizes de elegância visual, inspiradas no **Apple Human Interface Guidelines** e no **Material Design 3 do Google**, eliminando qualquer vestígio de "IA slop" (degradês fluorescentes ou amarelos berrantes).

### 2.1 Temas Diurno e Noturno
- **Modo Diurno (Bege Clássico & Café)**:
  - Fundo principal em tons de bege suave e linho nobre (`#F7F4EE`, `#EFE9DC`, `#DFD5C0`).
  - Textos de alta densidade e tipografia em marrom-café escuro quase preto (`#1A120B`, `#2C1E14`), garantindo contraste **WCAG AAA** sem cansaço visual.
  - Elementos de destaque, bordas e botões de ação em ouro acetinado plano (`#C5A059`, `#B38F46`).
- **Modo Noturno (Denim / Calça Jeans Escura)**:
  - Fundo principal em azul jeans profundo (`#0A1120`, `#0F1A30`, `#1A2C50`), proporcionando foco noturno muito superior ao preto puro OLED.
  - Textos em azul gelo e branco pérola (`#F0F5FF`, `#D6E4FF`).
  - Destaques e botões de decisão em ouro fosco nobre (`#D4AF37`, `#E5C158`).

### 2.2 Botões e Elementos de Ação
- **Botão Primário (`.btn-gold`)**: Fundo plano em ouro acetinado com borda de reforço suave e sombra sutil (`shadow-sm`). Sem degradês berrantes.
- **Botão Secundário (`.btn-secondary`)**: Fundo translúcido Apple Glass com bordas adaptativas.
- **Botão Fantasma (`.btn-ghost`)**: Transição rápida e minimalista para menus e ações secundárias.

---

## 3. Central de Projetos Focados & Integração GitHub

O HiperCloudShell não opera de forma genérica no vácuo: **cada ação, squad, terminal e worktree é vinculado a um projeto ativo**.

### 3.1 Modal de Seleção de Projetos (`ProjectSelectorModal`)
Acessível a qualquer instante através do pill no cabeçalho ou pelos botões **`[ 🔄 Alternar Projeto ]`** no Dashboard e na aba Projetos:
1. **Projetos Salvos & Recentes**:
   - Lista seus projetos acessados com data, caminho em disco, branch Git ativa e repositório remoto.
   - Permite alternar o foco do ecossistema com um único clique.
2. **Abrir Pasta Local do PC**:
   - Permite digitar ou colar o caminho absoluto de qualquer pasta no armazenamento interno do computador (ex: `C:\Users\DEV\Documents\MeuProjeto`).
   - O sistema detecta automaticamente se há repositório Git inicializado e extrai o nome do projeto.
3. **Clonar do GitHub (`git clone`)**:
   - Cole a URL HTTPS ou SSH de um repositório GitHub (ex: `https://github.com/usuario/repo.git`).
   - Especifique a pasta de destino local. O HiperCloudShell registra o projeto e ativa o escopo.
4. **Criar Novo Projeto**:
   - Cria uma nova pasta no disco com inicialização automática do Git (`git init`) e branch principal pronta para receber squads.

### 3.2 GitHub Issues & Despacho Direto de Squads
Na aba **Central de Projetos**:
- Visualize as issues abertas no GitHub com seus números, autores e tags.
- Clique em **"Disparar Squad"** em qualquer issue: o sistema preenche a missão, seleciona o squad ideal (ex: Arquiteto, 3D Shader, Backend) e inicia a resolução em worktree isolada.
- Crie novas issues diretamente pela interface, que são sincronizadas e enfileiradas no ecossistema.

---

## 4. Arquitetura Dual-Engine: Claude Code CLI & Antigravity CLI

O HiperCloudShell integra de maneira nativa as duas maiores ferramentas de CLI de agentes autônomos:

### 4.1 Modos de Motor
- **Claude Code CLI (`claude`)**:
  - Especializado em raciocínio analítico denso, refatorações cirúrgicas, geração de código tipado e testes rigorosos.
  - Utiliza flags de saída estruturada em JSON (`--output-format json`).
- **Antigravity CLI (`antigravity`)**:
  - Especializado em execução paralela massiva, busca semântica em repositórios, subagentes aninhados e planejamento de DAG.
- **Modo Híbrido (`hybrid`)**:
  - O Maestro delega tarefas de arquitetura e planejamento para o Antigravity, implementação para o Claude Code e validação para verificação adversarial cruzada.

### 4.2 Níveis de Esforço Cognitivo (Effort Control)
- **Low**: Execução ágil para tarefas repetitivas, correções de sintaxe ou scripts utilitários.
- **Medium**: Padrão balanceado para a maioria das funcionalidades.
- **High**: Análise aprofundada com múltiplas perspectivas antes da escrita de código.
- **Ultracode (Max Effort / xhigh)**: Ativa o modo de pensamento máximo, decomposição rigorosa de tarefas, criação de contratos Zod e execução em múltiplos subagentes.

### 4.3 Disjuntor Financeiro e Teto de Tokens
- Permite definir um orçamento rígido (ex: 50.000 tokens) para evitar surpresas financeiras.
- **Botão Modo Ilimitado (♾️)**: Localizado nas Configurações e no Header, permite desativar o teto financeiro quando você estiver rodando pipelines longos ou tarefas noturnas.

---

## 5. Orquestração Autônoma de Workflows (O Maestro & DAG)

O núcleo do HiperCloudShell é o **Maestro Orchestrator**, um motor determinístico que executa pipelines em um sandbox seguro `node:vm`.

### 5.1 O Modal de Novo Workflow Autônomo
Ao pressionar `Ctrl+K` ou clicar em **"Novo Workflow"**:
- **Etapa 1: Definição da Missão em Linguagem Natural**: Descreva o que você precisa que o sistema faça, com exemplos rápidos (ex: *"Criar API de pagamentos com webhook resiliente"*).
- **Etapa 2: Alocação dos Especialistas**:
  - **🤖 Modo Automático (Maestro)**: O orquestrador analisa semanticamente a missão e convoca dinamicamente os especialistas necessários.
  - **👥 Modo Manual (Composição de Squads)**: Selecione individualmente os squads desejados (checkboxes com missão clara e quality gates). O Maestro sintetiza um pipeline encadeado de fases.
- **Etapa 3: Governança & Esforço**: Escolha o motor (Híbrido, Claude ou Antigravity), o nível de esforço e o orçamento financeiro.

### 5.2 Primitivas JavaScript do Sandbox
Os workflows são código JavaScript determinístico auditável:
```javascript
// Exemplo de Script gerado pelo Maestro
phase("Planejamento & Contratos");
await speculate("Analisar schema do banco e gerar contratos Zod");

phase("Implementação Isolada");
await agent("Codificar repositório e rotas em .worktrees/backend-feat");

phase("Quality Gate Determinístico");
await verifyCmd("npm test");

return "Pipeline concluído com sucesso!";
```

### 5.3 Isolamento em Git Worktrees
- Cada subagente opera em uma pasta temporária isolada em `.worktrees/<nome-da-tarefa>`.
- O seu diretório principal de trabalho não sofre alterações até que você revise as diferenças e clique em **"✓ Aprovar e Fazer Merge na Main"** no modal de Quality Gate.
- Se o agente falhar ou o resultado não for o esperado, você pode clicar em **"✕ Descartar Worktree"** sem afetar nada em seu repositório.

### 5.4 Cache de Execução Merkle Replay
- O sistema gera hashes SHA-256 em árvore (Merkle Tree) de todos os arquivos de entrada de cada etapa.
- Se você re-executar uma etapa cujos arquivos fonte não foram alterados, o HiperCloudShell recupera o resultado imediatamente com **0 tokens gastos**.

---

## 6. Hot-Takeover ConPTY (Pseudoterminal Real do Windows)

Em tarefas autônomas complexas, um agente de CLI pode parar aguardando uma confirmação (ex: `Proceed with changes? [y/N]` ou senha de autorização).

- O HiperCloudShell utiliza o sistema nativo **ConPTY do Windows** através do Rust / Tauri v2.
- A qualquer momento, na aba **Workflows** ou no **Grid Multi-Terminal**, você pode clicar em **"⚡ Assumir ConPTY"**.
- Um terminal interativo com entrada direta é aberto, permitindo que você envie comandos, responda prompts interativos ou continue a tarefa manualmente.

---

## 7. Estúdio 3D Real & Forja Pixel Art (Squad 8)

O HiperCloudShell possui um subsistema gráfico profissional para jogos e aplicações visuais, dividindo o fluxo de maneira inteligente entre **3D Real** e **Pixel Art**.

### 7.1 Malha 3D Real (Real Mesh Studio)
- **Não se limita a pixel art**: Gera malhas poligonais completas em 3D procedural usando **Blender 5.2 LTS (BPY)** e renderização em tempo real via **Three.js**.
- **Ambiente Isolado Scratchpad**: O script do Blender roda em um ambiente virtual isolado fora do Git (`.scratchpad/blend/` ou diretório temporário), garantindo que bibliotecas pesadas como `bpy` ou `numpy` não sujem o repositório.
- **Catálogo de Modelos do Projeto**: Modelos como a Capivara Mascote Montaria, Katana de Bambu e Machado Rúnico ficam catalogados com estatísticas de polígonos, dimensões e arquivos nativos:
  - Arquivo Master do Blender: `dist/game/models/<id>_master.blend`
  - Arquivo GLTF: `dist/game/models/<id>_master.gltf`
  - Arquivo OBJ: `dist/game/models/<id>.obj`
- **Modal de Modelagem de Novo Objeto 3D**: Permite criar novos objetos procedurais escolhendo categoria (Arma, Criatura, Armadura, Prop), algoritmo de primitivas (Cubo Chanfrado, Cilindro, Esfera UV, Curva Bézier), emoji e descrição.

### 7.2 Forja Pixel Art (Turnaround 8 Vistas com Câmera a 24.0°)
- **Câmera Dimétrica a 24.0°**: Utiliza a proporção áurea matemática para RPGs 2.5D (estilo clássico Capybound / Final Fantasy Tactics), preservando a silhueta dos modelos tanto em 112px quanto em 28px.
- **Turntable Interativo 360°**: Permite rotacionar o modelo em 8 ângulos ortogonais e diagonais:
  - `0° Sul (Frente)`
  - `45° Sudoeste`
  - `90° Oeste (Perfil)`
  - `135° Noroeste`
  - `180° Norte (Costas)`
  - `225° Nordeste`
  - `270° Leste (Perfil)`
  - `315° Sudeste`
- **Quantização e Paleta**: Sombra azul jeans com luz quente dourada e contorno tingido.
- **Diário de Produção Automatizado**: Toda exportação e turnaround atualiza o log técnico em [docs/DIARIO_3D_PIXEL_FORGE.md](file:///C:/Users/DEV/Documents/HiperCloudShell/docs/DIARIO_3D_PIXEL_FORGE.md).

---

## 8. Sistema de Auto-Melhoria Contínua & Resiliência

Um ambiente autônomo deve ser capaz de detectar suas próprias falhas e evoluir sem interrupção humana.

### 8.1 Monitoramento de Thresholds e Gargalos
- Se um subagente demorar mais que o threshold configurado (ex: 45 segundos) ou encontrar erros repetitivos de compilação/teste, o sistema emite um alerta de resiliência.
- As notificações possuem códigos padronizados rastreáveis:
  - `HCS-ERR`: Erros críticos de execução ou falhas de compilação.
  - `HCS-BTL`: Detecção de gargalo ou loop em agente CLI.
  - `HCS-IMP`: Proposta de auto-melhoria de arquitetura ou resiliência.

### 8.2 Terminal de Auto-Heal no CloudShell
- A aba **Auto-Melhoria Contínua** conecta-se a uma sessão isolada de terminal PTY com Zero-Copy Junctions preparadas.
- O agente de auto-melhoria investiga o log da notificação, formula um diagnóstico da causa raiz, gera o patch em worktree separada e valida os quality gates.
- Você revisa o diagnóstico e clica em **"✓ Fazer Merge da Melhoria na Main"**.

### 8.3 Centro de Notificações com Histórico Permanente
- Clicar em **"Limpar Todas"** remove as notificações da visão ativa, mas **armazena todas no Histórico de Arquivo**.
- Você pode restaurar qualquer notificação anterior para inspecionar sua telemetria ou realizar um purge permanente quando desejar.

---

## 9. Google Stitch MCP Integrado

O HiperCloudShell possui suporte nativo ao **Google Stitch MCP** para geração e sincronização de telas de design UI:
- Comando de sincronização: `npm run mcp:stitch`
- Lê as credenciais seguras do `.env` e configura automaticamente o `.mcp.json`, o arquivo do Gemini/Antigravity (`mcp_config.json`) e a configuração do Claude Code CLI.
- Permite invocar ferramentas do Stitch para criação de projetos, geração de componentes a partir de texto e exportação de especificações `DESIGN.md`.

---

## 10. Catálogo dos 8 Squads Especialistas Embutidos

| Squad | Slug | Especialidade | Quality Gate Principal |
|---|---|---|---|
| **Squad 1: Arquiteto** | `squad-1-architect` | Modelagem DDD, especificação de contratos Zod e Merkle DAG | Validação de schema JSON e TypeScript strict |
| **Squad 2: Backend Dev** | `squad-2-backend-dev` | APIs REST/tRPC, bancos SQLite/PostgreSQL e Rust Tauri IPC | `npm run test:backend` ou `cargo test` |
| **Squad 3: Frontend Dev** | `squad-3-frontend-dev` | Telas React, Tailwind CSS, Apple HIG, Material 3 e Acessibilidade | `npm run build` e linter de contraste |
| **Squad 4: Testing & QA** | `squad-4-testing-qa` | Testes de unidade, E2E com Playwright e cobertura de regressão | `node --test` e relatórios de asserções |
| **Squad 5: Cloud & DevOps** | `squad-5-cloud-devops` | Pipelines CI/CD, Docker, CloudShell e scripts de automação | Validação de sintaxe e dry-run de comandos |
| **Squad 6: Security Auditor** | `squad-6-security-auditor` | Auditoria OWASP, análise estática de dependências e proteção de segredos | Verificação de vazamento de chaves e permissões |
| **Squad 7: 3D Shader Studio** | `squad-3d-shader-studio` | Shaders GLSL, Three.js, React Three Fiber e efeitos visuais | `dispose()` de geometrias e taxa de 60 FPS |
| **Squad 8: Pixel Forge 3D** | `squad-pixel-forge-3d` | Modelagem procedural Blender BPY e turnaround 8 vistas 24° | Presença de malha .blend e prancha 8 vistas |

---

## 11. Guia Prático de Operação e Comandos

### 11.1 Executando o Ambiente em Modo de Desenvolvimento
```powershell
# Iniciar o aplicativo desktop com hot-reload de front-end e ConPTY Rust
npm run tauri:dev
```

### 11.2 Executando a Suíte de Testes Automatizados
```powershell
# Executa os 43 testes de unidade dos primitivos autônomos, gates e 3D
npm test
```

### 11.3 Gerando o Pacote de Produção
```powershell
# Compila o frontend Vite
npm run build

# Compila o instalador nativo do Windows (.msi / .exe)
npm run tauri build
```

### 11.4 Sincronizando o Google Stitch MCP
```powershell
# Registra as ferramentas do Stitch MCP nos clientes Claude e Antigravity
npm run mcp:stitch
```

---

## 12. Soluções de Problemas Comuns no Windows

1. **Erro `EBUSY: resource busy or locked` durante o watch do Vite:**
   - O `vite.config.js` do projeto já está configurado com `ignored: ['**/src-tauri/**', '**/.worktrees/**', '**/.git/**']` para evitar que o bloqueio temporário das `.dll` do Rust cause colisão com o watch do Node.js.
2. **Crash ou Tela Branca ao Abrir:**
   - O Tauri v2 aguarda a porta `http://localhost:5173/` estar disponível. Certifique-se de que nenhum outro processo esteja utilizando esta porta.
3. **Persistência de Dados:**
   - As escolhas de motor (`claude`, `antigravity`, `hybrid`), nível de esforço (`low`, `medium`, `high`, `ultracode`), orçamento financeiro e lista de projetos são persistidas em `localStorage`. Ao reabrir o app, todas as suas preferências são restauradas instantaneamente.
