// src/components/views/DashboardView.jsx
import React from 'react';
import {
  IconZap,
  IconTerminal,
  IconShieldAlert,
  IconPalette,
  IconCpu,
  IconGitBranch,
  IconPlus,
  IconCheck
} from '../Icons.jsx';

export default function DashboardView({
  onOpenNewWorkflow,
  onNavigate,
  workflowRuns = {},
  selectedRunId,
  onSelectRun,
  onOpenApprovalGate,
  consumedTokens = 0,
  maxTokensBudget = 50000,
  unlimitedTokens = false,
  provider = 'hybrid',
  effort = 'ultracode',
  squadCatalog = [],
  improvements = {},
  notifications = [],
  activeProject = null,
  onOpenProjectSelector = null
}) {
  const runsList = Object.values(workflowRuns);
  const activeRunsCount = runsList.filter((r) => r.status === 'running').length;
  const pendingApprovalCount = runsList.filter((r) => r.status === 'pending_approval').length;
  const criticalNotifsCount = notifications.filter((n) => n.severity === 'critical' && !n.acknowledged).length;

  const quickSquads = squadCatalog.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full bg-beige-100 dark:bg-denim-900 text-espresso-900 dark:text-denim-50 transition-colors duration-150">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-100/70 via-beige-50 to-beige-100 dark:from-denim-850 dark:via-denim-900 dark:to-denim-950 border border-gold-300/80 dark:border-denim-700 p-6 shadow-warm dark:shadow-denim">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-200/80 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 border border-gold-300 dark:border-gold-700">
                HiperCloudShell ADE v2
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Stitch MCP Conectado
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-espresso-950 dark:text-white tracking-tight">
              Ambiente de Desenvolvimento Autônomo Multiagente
            </h1>
            <p className="text-xs md:text-sm text-espresso-700 dark:text-denim-200 max-w-2xl leading-relaxed">
              Orquestre squads de Claude Code e Antigravity em Git Worktrees isoladas com Merkle Replay,
              Quality Gates determinísticos e Hot-Takeover ConPTY.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="btn-gold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 group cursor-pointer"
            >
              <IconPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200 text-espresso-950" />
              <span>Iniciar Novo Workflow</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-espresso-950/10 dark:bg-black/20 font-mono ml-1 font-bold">
                Ctrl+K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('grid')}
              className="px-4 py-3 rounded-xl bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 border border-beige-300 dark:border-denim-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <IconTerminal className="w-4 h-4 text-gold-700 dark:text-gold-400" />
              <span>Ver Terminais PTY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Apple HIG / Material 3 Focused Project Context Bar */}
      <div className="p-4 rounded-2xl bg-white/90 dark:bg-denim-850/90 border border-beige-300 dark:border-denim-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-warm dark:shadow-denim">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 flex items-center justify-center font-bold text-lg shadow-xs">
            📁
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-espresso-600 dark:text-denim-300">
                Projeto Focado
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                Git Conectado
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base font-extrabold text-espresso-950 dark:text-white font-mono">
                {activeProject?.name || 'HiperCloudShell'}
              </h2>
              <span className="text-xs font-mono font-bold text-gold-800 dark:text-gold-400 bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded-full border border-gold-300 dark:border-gold-700">
                 {activeProject?.branch || 'main'}
              </span>
            </div>
            <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono truncate max-w-md">
              {activeProject?.remoteUrl || 'https://github.com/tiagohbs/HiperCloudShell.git'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenProjectSelector ? onOpenProjectSelector() : (onNavigate && onNavigate('projects'))}
            className="btn-gold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            title="Alternar o projeto ativo ou carregar uma pasta/repositório"
          >
            <span>🔄 Alternar Projeto</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('projects')}
            className="px-4 py-2 rounded-xl bg-beige-200/80 dark:bg-denim-800 hover:bg-gold-100 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 font-bold text-xs border border-beige-300 dark:border-denim-700 transition cursor-pointer flex items-center gap-2 shadow-xs group"
          >
            <span>Repositório & Issues</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 flex items-center justify-between shadow-warm dark:shadow-denim">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400 font-bold">Workflows Ativos</div>
            <div className="text-xl font-extrabold text-espresso-950 dark:text-white font-mono mt-0.5">{activeRunsCount}</div>
            <div className="text-[10px] text-gold-700 dark:text-gold-400 font-mono mt-1 font-bold">
              {pendingApprovalCount > 0 ? `${pendingApprovalCount} aguardando aprovação` : 'Sem pendências'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/60 border border-gold-300 dark:border-gold-800 text-gold-800 dark:text-gold-400 flex items-center justify-center shadow-xs">
            <IconZap className="w-5 h-5 text-gold-700 dark:text-gold-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 flex items-center justify-between shadow-warm dark:shadow-denim">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400 font-bold">Orçamento de Tokens</div>
            <div className="text-xl font-extrabold text-gold-700 dark:text-gold-400 font-mono mt-0.5">
              {consumedTokens.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono mt-1">
              {unlimitedTokens ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">♾️ Sem teto (Ilimitado)</span>
              ) : (
                <span className="text-espresso-500 dark:text-denim-400">de {(maxTokensBudget / 1000).toFixed(0)}k configurados</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 text-espresso-800 dark:text-denim-200 flex items-center justify-center shadow-xs">
            <IconCpu className="w-5 h-5 text-espresso-800 dark:text-denim-200" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 flex items-center justify-between shadow-warm dark:shadow-denim">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400 font-bold">Auto-Melhorias</div>
            <div className="text-xl font-extrabold text-espresso-950 dark:text-white font-mono mt-0.5">
              {Object.keys(improvements).length}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-1 font-bold">
              Auto-Heal CloudShell Ativo
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-400 flex items-center justify-center shadow-xs">
            <IconShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 flex items-center justify-between shadow-warm dark:shadow-denim">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400 font-bold">Alertas do Sistema</div>
            <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-0.5">
              {criticalNotifsCount}
            </div>
            <div className="text-[10px] text-espresso-500 dark:text-denim-400 font-mono mt-1">
              {criticalNotifsCount === 0 ? 'Nenhum erro crítico' : 'Requer atenção'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <IconShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Main Flow: Recent Executions & Start Points */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Execuções Recentes & Quality Gate Approvals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 flex flex-col shadow-warm dark:shadow-denim">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-white font-mono flex items-center gap-2">
                  <IconZap className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                  <span>Jornada de Workflows & DAG</span>
                </h3>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                  Acompanhe cada execução do início ao merge final
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('workflows')}
                className="text-xs font-mono font-bold text-gold-700 dark:text-gold-400 hover:text-gold-900 dark:hover:text-gold-300 transition cursor-pointer"
              >
                Abrir Workflows →
              </button>
            </div>

            <div className="space-y-3">
              {runsList.length === 0 ? (
                <div className="p-8 rounded-xl bg-beige-50 dark:bg-denim-900/60 border border-dashed border-beige-300 dark:border-denim-750 text-center space-y-3">
                  <p className="text-xs text-espresso-600 dark:text-denim-400 font-mono">
                    Nenhum workflow foi disparado ainda nesta sessão.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNewWorkflow}
                    className="btn-gold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
                    <span>Lançar Primeiro Workflow</span>
                  </button>
                </div>
              ) : (
                runsList.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl bg-beige-50/70 dark:bg-denim-900/80 border border-beige-300 dark:border-denim-750 hover:border-gold-400 dark:hover:border-gold-500 transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-espresso-950 dark:text-white font-mono text-xs">
                            {run.meta?.name || run.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-extrabold border ${
                              run.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : run.status === 'pending_approval'
                                ? 'bg-gold-100 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 border-gold-400 dark:border-gold-600 animate-pulse'
                                : run.status === 'running'
                                ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                                : 'bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 border-beige-300 dark:border-denim-700'
                            }`}
                          >
                            {run.status}
                          </span>
                        </div>
                        <p className="text-xs text-espresso-700 dark:text-denim-200 line-clamp-1 mt-1">
                          {run.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {run.status === 'pending_approval' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectRun) onSelectRun(run.id);
                              if (onOpenApprovalGate) onOpenApprovalGate(run);
                            }}
                            className="btn-gold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                            <span>Aprovar & Merge</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectRun) onSelectRun(run.id);
                            onNavigate('workflows');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 font-mono text-xs font-bold border border-beige-300 dark:border-denim-700 transition cursor-pointer shadow-xs"
                        >
                          Inspecionar
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-espresso-600 dark:text-denim-400 pt-2 border-t border-beige-200 dark:border-denim-800">
                      <span>Fase: <strong className="text-espresso-950 dark:text-denim-100">{run.currentPhase || 'Em andamento'}</strong></span>
                      <span>Agentes: {run.activeAgentsCount || 0} ativos</span>
                      <span>Tokens: {run.tokensUsed || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Quick Squad Launchers */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 space-y-3 shadow-warm dark:shadow-denim">
            <div>
              <h3 className="text-sm font-extrabold text-espresso-950 dark:text-white font-mono flex items-center gap-2">
                <IconPalette className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                <span>Squads Multi-Agentes Recomendados</span>
              </h3>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                Templates com CLI, harness e gates pré-configurados
              </p>
            </div>

            <div className="space-y-2.5">
              {quickSquads.map((squad) => (
                <div
                  key={squad.slug}
                  onClick={onOpenNewWorkflow}
                  className="p-3.5 rounded-xl bg-beige-50/60 dark:bg-denim-900/60 border border-beige-300 dark:border-denim-750 hover:border-gold-400 dark:hover:border-gold-500 hover:bg-gold-50/50 dark:hover:bg-denim-800/80 transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-espresso-950 dark:text-denim-50 text-xs font-mono group-hover:text-gold-900 dark:group-hover:text-gold-300 transition">
                      {squad.title}
                    </span>
                    <span className="text-[10px] font-mono text-gold-900 dark:text-gold-300 bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700 font-bold">
                      {squad.command}
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-700 dark:text-denim-300 line-clamp-2 mt-1.5 leading-relaxed">
                    {squad.description}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="w-full py-2.5 rounded-xl bg-beige-100 dark:bg-denim-800 hover:bg-gold-100 dark:hover:bg-denim-750 text-espresso-950 dark:text-denim-100 text-xs font-mono font-bold border border-beige-300 dark:border-denim-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Ver todos os 8 Squads no Assistente</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
