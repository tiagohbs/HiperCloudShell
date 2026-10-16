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
  provider = 'hybrid',
  effort = 'ultracode',
  squadCatalog = [],
  improvements = {},
  notifications = []
}) {
  const runsList = Object.values(workflowRuns);
  const activeRunsCount = runsList.filter((r) => r.status === 'running').length;
  const pendingApprovalCount = runsList.filter((r) => r.status === 'pending_approval').length;
  const criticalNotifsCount = notifications.filter((n) => n.severity === 'critical' && !n.acknowledged).length;

  const quickSquads = squadCatalog.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950/40 via-[#0d121f] to-cyan-950/30 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                HiperCloudShell ADE v2
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Stitch MCP Conectado
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Ambiente de Desenvolvimento Autônomo Multiagente
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Orquestre squads de Claude Code e Antigravity em Git Worktrees isoladas com Merkle Replay,
              Quality Gates determinísticos e Hot-Takeover ConPTY.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 transition group cursor-pointer"
            >
              <IconPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Iniciar Novo Workflow</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono ml-1">Ctrl+K</kbd>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('grid')}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <IconTerminal className="w-4 h-4 text-cyan-400" />
              <span>Ver Terminais PTY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400">Workflows Ativos</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{activeRunsCount}</div>
            <div className="text-[10px] text-violet-400 font-mono mt-1">
              {pendingApprovalCount > 0 ? `${pendingApprovalCount} aguardando aprovação` : 'Sem pendências'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <IconZap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400">Orçamento de Tokens</div>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-0.5">
              {consumedTokens.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              de {(maxTokensBudget / 1000).toFixed(0)}k configurados
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <IconCpu className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400">Auto-Melhorias</div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">
              {Object.keys(improvements).length}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">
              Auto-Heal CloudShell Ativo
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <IconShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400">Alertas do Sistema</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
              {criticalNotifsCount}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {criticalNotifsCount === 0 ? 'Nenhum erro crítico' : 'Requer atenção'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <IconShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Flow: Recent Executions & Start Points */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Execuções Recentes & Quality Gate Approvals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0b0f17] border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <IconZap className="w-4 h-4 text-violet-400" />
                  <span>Jornada de Workflows & DAG</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Acompanhe cada execução do início ao merge final
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('workflows')}
                className="text-xs font-mono text-violet-400 hover:text-violet-300 transition cursor-pointer"
              >
                Abrir Workflows →
              </button>
            </div>

            <div className="space-y-3">
              {runsList.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-400 font-mono">
                    Nenhum workflow foi disparado ainda nesta sessão.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNewWorkflow}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer inline-flex items-center gap-2"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    <span>Lançar Primeiro Workflow</span>
                  </button>
                </div>
              ) : (
                runsList.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-xs">
                            {run.meta?.name || run.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                              run.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : run.status === 'pending_approval'
                                ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                                : run.status === 'running'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {run.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Aprovar & Merge</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectRun) onSelectRun(run.id);
                            onNavigate('workflows');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition cursor-pointer"
                        >
                          Inspecionar
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Fase: <strong className="text-slate-300">{run.currentPhase || 'Em andamento'}</strong></span>
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
          <div className="p-5 rounded-2xl bg-[#0b0f17] border border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <IconPalette className="w-4 h-4 text-emerald-400" />
                <span>Squads Recomendados (Overclock.sh)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Templates com CLI, harness e gates pré-configurados
              </p>
            </div>

            <div className="space-y-2.5">
              {quickSquads.map((squad) => (
                <div
                  key={squad.slug}
                  onClick={onOpenNewWorkflow}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/10 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono group-hover:text-violet-300 transition">
                      {squad.title}
                    </span>
                    <span className="text-[10px] font-mono text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                      {squad.command}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {squad.description}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-violet-300 text-xs font-mono font-semibold border border-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
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
