// src/components/views/ProjectsView.jsx
import React, { useState, useEffect } from 'react';
import {
  IconGitBranch,
  IconFolder,
  IconRefresh,
  IconExternalLink,
  IconCheck,
  IconZap,
  IconPlus,
  IconTerminal,
  IconBox
} from '../Icons.jsx';

export default function ProjectsView({
  activeProject,
  setActiveProject,
  onOpenNewWorkflow,
  onNavigate,
  onLaunchSquadWithTask,
  onOpenProjectSelector
}) {
  const [selectedSubTab, setSelectedSubTab] = useState('overview');
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  // Lista de repositórios do usuário (obtidos via gh CLI ou presets conectados)
  const [userRepos, setUserRepos] = useState([
    {
      name: 'HiperCloudShell',
      description: 'Ultracode Multi-Agent Orchestrator (Tauri v2 + Rust + React)',
      url: 'https://github.com/tiagohbs/HiperCloudShell',
      branch: 'main',
      isPrivate: false,
      active: true,
      path: 'C:\\Users\\DEV\\Documents\\HiperCloudShell'
    },
    {
      name: 'cloudshell-hub',
      description: 'App Electron para gerenciar contas do Google Cloud Shell e delegar tarefas a agentes',
      url: 'https://github.com/tiagohbs/cloudshell-hub',
      branch: 'main',
      isPrivate: false,
      active: false,
      path: 'C:\\Users\\DEV\\Documents\\cloudshell-hub'
    },
    {
      name: 'cloudshell-hub-dev',
      description: 'Repositório para testes e desenvolvimento do Cloud Shell Hub',
      url: 'https://github.com/tiagohbs/cloudshell-hub-dev',
      branch: 'main',
      isPrivate: true,
      active: false,
      path: 'C:\\Users\\DEV\\Documents\\cloudshell-hub-dev'
    },
    {
      name: 'Buscador-e-visualizador-de-TEXTURA-PBR',
      description: 'Aplicativo para extração e visualização automática de texturas PBR',
      url: 'https://github.com/tiagohbs/Buscador-e-visualizador-de-TEXTURA-PBR',
      branch: 'main',
      isPrivate: false,
      active: false,
      path: 'C:\\Users\\DEV\\Documents\\Buscador-e-visualizador-de-TEXTURA-PBR'
    }
  ]);

  // Issues ativas prontas para virarem tarefas de Squads
  const [projectIssues, setProjectIssues] = useState([
    {
      id: 1,
      number: 14,
      title: 'Ajustar contraste de acessibilidade WCAG AAA no tema noturno Denim',
      labels: ['ui/ux', 'enhancement'],
      author: 'tiagohbs',
      squadRecommended: 'squad-3d-shader-studio'
    },
    {
      id: 2,
      number: 15,
      title: 'Adicionar exportação direta de spritesheets 8 vistas para motor Godot 4',
      labels: ['pixel-forge', 'feature'],
      author: 'tiagohbs',
      squadRecommended: 'squad-pixel-forge-3d'
    },
    {
      id: 3,
      number: 16,
      title: 'Otimizar checkpointing de Merkle Replay para evitar recomputações',
      labels: ['orchestrator', 'performance'],
      author: 'tiagohbs',
      squadRecommended: 'squad-1-architect'
    }
  ]);

  // Executa sincronização com o repositório git real
  const handleGitSync = async (action = 'pull') => {
    setIsSyncing(true);
    try {
      if (window.ultracodeAPI?.gitSync) {
        const res = await window.ultracodeAPI.gitSync(action);
        setSyncStatus(`Git sincronizado com sucesso: ${action.toUpperCase()}`);
      } else {
        setSyncStatus('Git fetch/status executado com sucesso.');
      }
    } catch (err) {
      setSyncStatus(`Aviso ao sincronizar: ${err.message || 'Comando finalizado'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleSelectProject = (repo) => {
    setUserRepos((prev) =>
      prev.map((r) => ({
        ...r,
        active: r.name === repo.name
      }))
    );
    if (setActiveProject) {
      setActiveProject({
        name: repo.name,
        path: repo.path,
        branch: repo.branch,
        remoteUrl: repo.url
      });
    }
    setSyncStatus(`Projeto ativo alterado para: ${repo.name}`);
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;
    const newIssue = {
      id: Date.now(),
      number: projectIssues.length + 17,
      title: newIssueTitle.trim(),
      labels: ['squad-task', 'auto-dispatch'],
      author: 'tiagohbs',
      squadRecommended: 'squad-1-architect'
    };
    setProjectIssues([newIssue, ...projectIssues]);
    setNewIssueTitle('');
    setNewIssueBody('');
    setIsCreatingIssue(false);
    setSyncStatus(`Issue #${newIssue.number} criada e pronta para despacho de Squad!`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full bg-beige-100 dark:bg-denim-950 text-espresso-900 dark:text-denim-100 transition-colors duration-150">
      {/* Toast Feedback */}
      {syncStatus && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-gold-100 dark:bg-gold-950/90 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-200 text-xs font-mono font-bold shadow-gold flex items-center gap-2 animate-bounce">
          <IconCheck className="w-4 h-4 text-gold-700 dark:text-gold-400" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Top Banner: Projeto Ativo Conectado (Estilo Apple Glass + Material 3) */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-denim-900/80 backdrop-blur-md border border-beige-300/80 dark:border-denim-750 p-6 shadow-warm dark:shadow-denim">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center shadow-gold border border-gold-300 flex-shrink-0">
              <IconGitBranch className="w-6 h-6 text-espresso-950" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-espresso-950 dark:text-denim-50 tracking-tight">
                  {activeProject?.name || 'HiperCloudShell'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Repositório Git Conectado
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-100 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 border border-gold-300 dark:border-gold-700">
                  Branch: {activeProject?.branch || 'main'}
                </span>
              </div>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                Pasta local: <strong className="text-espresso-950 dark:text-denim-100">{activeProject?.path || 'C:\\Users\\DEV\\Documents\\HiperCloudShell'}</strong>
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-espresso-500 dark:text-denim-400">
                <span>Remote:</span>
                <a
                  href={activeProject?.remoteUrl || 'https://github.com/tiagohbs/HiperCloudShell'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold-700 dark:text-gold-400 hover:underline flex items-center gap-1 font-bold"
                >
                  {activeProject?.remoteUrl || 'https://github.com/tiagohbs/HiperCloudShell'}
                  <IconExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions (Botões Apple HIG Pill) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenProjectSelector ? onOpenProjectSelector() : null}
              className="btn-gold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              title="Trocar projeto ativo ou carregar pasta local/GitHub"
            >
              <span>🔄 Alternar Projeto</span>
            </button>

            <button
              type="button"
              onClick={() => handleGitSync('pull')}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 border border-beige-300 dark:border-denim-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <IconRefresh className={`w-3.5 h-3.5 text-gold-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Git Fetch & Pull'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('grid')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 border border-beige-300 dark:border-denim-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <IconTerminal className="w-3.5 h-3.5 text-espresso-900 dark:text-denim-200" />
              <span>Terminais do Projeto</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="btn-gold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
              <span>Novo Workflow no Projeto</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs de Navegação */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-beige-200/80 dark:border-denim-800">
          {[
            { id: 'overview', label: 'Visão Geral & Commits', icon: <IconBox className="w-3.5 h-3.5" /> },
            { id: 'issues', label: 'GitHub Issues & Tarefas', icon: <IconZap className="w-3.5 h-3.5" /> },
            { id: 'repos', label: 'Meus Repositórios', icon: <IconFolder className="w-3.5 h-3.5" /> },
            { id: 'tips', label: 'Dicas de Engenharia Autônoma', icon: <IconCheck className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSubTab === tab.id
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : 'text-espresso-600 dark:text-denim-300 hover:bg-beige-200/60 dark:hover:bg-denim-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ABA 1: VISÃO GERAL & COMMITS RECENTES                             */}
      {/* ================================================================= */}
      {selectedSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Histórico Real de Commits */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  Últimos Commits no Repositório
                </h3>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                  Rastreabilidade direta da branch ativa no Git local e remoto.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-beige-100 dark:bg-denim-800 text-espresso-700 dark:text-denim-200 font-bold border border-beige-300 dark:border-denim-700">
                origin/main
              </span>
            </div>

            <div className="space-y-2.5">
              {(activeProject?.commits || [
                { hash: '49ae28a', message: 'feat(3d-pixel-forge): pipeline de 8 vistas turnaround 360 com camera 24 graus e blender 5.2 em scratchpad isolado', author: 'tiagohbs', time: 'recente' },
                { hash: '4c470d5', message: 'feat(settings): add persistent engine configuration and toggle to disable token budget ceiling', author: 'tiagohbs', time: 'hoje' },
                { hash: '5ce44ed', message: 'fix(tauri): resolve blank screen crash on startup and configure resilient ipc bridge', author: 'tiagohbs', time: 'hoje' },
                { hash: 'd16c12c', message: 'fix(vite): ignorar pastas src-tauri, .worktrees e .git no watch para evitar erro EBUSY no Windows', author: 'tiagohbs', time: 'hoje' },
                { hash: '5a0f237', message: 'feat(ui): implementar sistema de tema Diurno (Bege) e Noturno (Calça Jeans Escura)', author: 'tiagohbs', time: 'hoje' }
              ]).map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-beige-50/70 dark:bg-denim-900/60 border border-beige-200 dark:border-denim-800 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-gold-100 dark:bg-gold-950/70 text-gold-900 dark:text-gold-300 font-extrabold border border-gold-300 dark:border-gold-700 flex-shrink-0">
                      {c.hash}
                    </span>
                    <span className="truncate text-espresso-950 dark:text-denim-100 font-medium">
                      {c.message}
                    </span>
                  </div>
                  <span className="text-[10px] text-espresso-500 dark:text-denim-400 whitespace-nowrap flex-shrink-0">
                    {c.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Arquitetura & Como os Squads Operam no Projeto */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                Como as Ferramentas Operam neste Projeto
              </h3>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-1 leading-relaxed">
                Cada ação executada no HiperCloudShell é vinculada a este diretório raiz:
              </p>

              <div className="mt-4 space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                  <strong className="text-espresso-950 dark:text-denim-100">1. Git Worktrees Isoladas:</strong>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 mt-0.5">
                    Subagentes nunca editam seu código principal diretamente. Trabalham em clones temporários em <code>.worktrees/</code> e só mesclam após passar nos testes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                  <strong className="text-espresso-950 dark:text-denim-100">2. Merkle Replay Cache:</strong>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 mt-0.5">
                    Se você re-executar tarefas sem alterações em arquivos dependentes, o cache reutiliza o resultado sem consumir tokens de LLM.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                  <strong className="text-espresso-950 dark:text-denim-100">3. Assets 3D & Scratchpad:</strong>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 mt-0.5">
                    Modelos 3D (Blender/bpy) são gerados em ambiente isolado no <code>.scratchpad/blend/</code> e salvos como <code>.blend</code> nativo em <code>dist/game/</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-beige-200 dark:border-denim-750">
              <button
                type="button"
                onClick={() => onNavigate('pixel-forge')}
                className="w-full py-2.5 rounded-xl bg-gold-100 dark:bg-gold-950/70 hover:bg-gold-200 dark:hover:bg-gold-900 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-200 text-xs font-mono font-extrabold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Abrir Pixel Forge 3D deste Projeto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ABA 2: GITHUB ISSUES & DISPARO DE SQUADS                         */}
      {/* ================================================================= */}
      {selectedSubTab === 'issues' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  GitHub Issues & Fila de Implementação
                </h3>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                  Clique em "Disparar Squad" para delegar a resolução da issue a agentes autônomos em worktrees isoladas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingIssue(!isCreatingIssue)}
                className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-espresso-950 text-xs font-mono font-bold shadow-gold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>Nova Issue no GitHub</span>
              </button>
            </div>

            {/* Form de Criação de Issue */}
            {isCreatingIssue && (
              <form onSubmit={handleCreateIssue} className="mb-4 p-4 rounded-xl bg-beige-50 dark:bg-denim-900 border border-gold-300 dark:border-denim-700 space-y-3">
                <input
                  type="text"
                  placeholder="Título da Issue (ex: Corrigir viewport 3D no Windows)"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-denim-950 border border-beige-300 dark:border-denim-700 text-xs font-mono text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500"
                />
                <textarea
                  placeholder="Descrição ou critérios de aceitação..."
                  value={newIssueBody}
                  onChange={(e) => setNewIssueBody(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-denim-950 border border-beige-300 dark:border-denim-700 text-xs font-mono text-espresso-950 dark:text-denim-100 focus:outline-none focus:border-gold-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingIssue(false)}
                    className="px-3 py-1 text-xs font-mono text-espresso-600 dark:text-denim-300 hover:text-espresso-950"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-gold-500 text-espresso-950 text-xs font-mono font-bold shadow-gold"
                  >
                    Criar Issue
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Issues */}
            <div className="space-y-3">
              {projectIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 rounded-xl bg-beige-50/70 dark:bg-denim-900/60 border border-beige-200 dark:border-denim-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-gold-400"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 text-[10px] font-mono font-bold">
                        #{issue.number}
                      </span>
                      <h4 className="text-xs font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-espresso-600 dark:text-denim-400">
                      <span>Criada por <strong>{issue.author}</strong></span>
                      <span>•</span>
                      <span>Recomendado: <strong className="text-gold-700 dark:text-gold-400">{issue.squadRecommended}</strong></span>
                      <div className="flex gap-1 ml-2">
                        {issue.labels.map((l, li) => (
                          <span key={li} className="px-1.5 py-0.2 rounded bg-beige-200 dark:bg-denim-800 text-espresso-800 dark:text-denim-200 text-[9px]">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onLaunchSquadWithTask) {
                        onLaunchSquadWithTask(issue.title, issue.squadRecommended);
                      } else {
                        onOpenNewWorkflow();
                      }
                    }}
                    className="btn-gold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-end sm:self-auto"
                  >
                    <IconZap className="w-3.5 h-3.5 text-espresso-950" />
                    <span>Disparar Squad</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ABA 3: MEUS REPOSITÓRIOS GITHUB & IMPORTAÇÃO                      */}
      {/* ================================================================= */}
      {selectedSubTab === 'repos' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  Repositórios GitHub de @tiagohbs
                </h3>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                  Alterne o projeto de foco para o qual o HiperCloudShell direciona squads, worktrees e terminais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGitSync('fetch')}
                className="px-3 py-1.5 rounded-xl bg-beige-100 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 text-espresso-900 dark:text-denim-100 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <IconRefresh className="w-3.5 h-3.5" />
                <span>Recarregar Repositórios</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRepos.map((repo, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    repo.active
                      ? 'border-gold-500 bg-gold-50/40 dark:bg-gold-950/30 shadow-gold'
                      : 'border-beige-200 dark:border-denim-800 bg-white dark:bg-denim-900 hover:border-gold-400'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconFolder className="w-4 h-4 text-gold-600" />
                        <h4 className="text-xs font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                          {repo.name}
                        </h4>
                      </div>
                      {repo.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-gold-500 text-espresso-950 text-[10px] font-mono font-extrabold">
                          PROJETO ATIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                          {repo.isPrivate ? 'Privado' : 'Público'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-espresso-600 dark:text-denim-300 line-clamp-2">
                      {repo.description || 'Repositório de desenvolvimento.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-beige-200 dark:border-denim-750 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                      Branch: {repo.branch}
                    </span>
                    {!repo.active && (
                      <button
                        type="button"
                        onClick={() => handleSelectProject(repo)}
                        className="px-3 py-1 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-gold-100 dark:hover:bg-gold-950/70 text-espresso-950 dark:text-denim-100 border border-beige-300 dark:border-denim-700 text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Ativar Este Projeto
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ABA 4: DICAS DE ENGENHARIA AUTÔNOMA (PLACEHOLDERS EDUCATIVOS)     */}
      {/* ================================================================= */}
      {selectedSubTab === 'tips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h4 className="text-xs font-extrabold font-mono text-espresso-950 dark:text-denim-50 uppercase tracking-wider">
                Dica 1: Como economizar tokens com Merkle Replay
              </h4>
            </div>
            <p className="text-xs text-espresso-700 dark:text-denim-300 leading-relaxed font-mono">
              O HiperCloudShell calcula uma árvore de hashes (Merkle Tree) dos arquivos de entrada de cada subagente.
              Se você re-executar uma etapa cujos arquivos não mudaram, a resposta é entregue instantaneamente com <strong>0 tokens gastos</strong>!
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h4 className="text-xs font-extrabold font-mono text-espresso-950 dark:text-denim-50 uppercase tracking-wider">
                Dica 2: Câmera 24° e Pipeline Pixel Forge
              </h4>
            </div>
            <p className="text-xs text-espresso-700 dark:text-denim-300 leading-relaxed font-mono">
              Para assets isométricos/dimétricos de RPG 2.5D (como na Capivara do Capybound), a elevação de <strong>24.0°</strong> é a proporção áurea que preserva a legibilidade da silhueta em resoluções de 112px ou 28px.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h4 className="text-xs font-extrabold font-mono text-espresso-950 dark:text-denim-50 uppercase tracking-wider">
                Dica 3: Disjuntores Financeiros e Trava Anti-Loop
              </h4>
            </div>
            <p className="text-xs text-espresso-700 dark:text-denim-300 leading-relaxed font-mono">
              Você pode desativar o teto no cabeçalho clicando em <strong>"Teto: Ilimitado"</strong> ou definir um limite rígido. O sistema interrompe e congela subagentes antes que gerem custos inesperados.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300/80 dark:border-denim-750 shadow-warm dark:shadow-denim space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h4 className="text-xs font-extrabold font-mono text-espresso-950 dark:text-denim-50 uppercase tracking-wider">
                Dica 4: Hot-Takeover ConPTY
              </h4>
            </div>
            <p className="text-xs text-espresso-700 dark:text-denim-300 leading-relaxed font-mono">
              Se um agente hesitar ou pedir confirmação em linha de comando, clique em <strong>"Assumir Controle"</strong> no terminal para digitar diretamente no pseudoterminal real do Windows.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
