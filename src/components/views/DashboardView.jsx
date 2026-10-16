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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full bg-beige-100 text-espresso-900">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-100/70 via-beige-50 to-beige-100 border border-gold-300/80 p-6 shadow-warm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-200/80 text-gold-900 border border-gold-300">
                HiperCloudShell ADE v2
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Stitch MCP Conectado
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-espresso-950 tracking-tight">
              Ambiente de Desenvolvimento Autônomo Multiagente
            </h1>
            <p className="text-xs md:text-sm text-espresso-700 max-w-2xl leading-relaxed">
              Orquestre squads de Claude Code e Antigravity em Git Worktrees isoladas com Merkle Replay,
              Quality Gates determinísticos e Hot-Takeover ConPTY.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold hover:shadow-gold-lg flex items-center justify-center gap-2 transition-all duration-200 group cursor-pointer border border-gold-300"
            >
              <IconPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200 text-espresso-950" />
              <span>Iniciar Novo Workflow</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-espresso-950/10 font-mono ml-1 font-bold">
                Ctrl+K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('grid')}
              className="px-4 py-3 rounded-xl bg-white hover:bg-beige-200 text-espresso-950 border border-beige-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <IconTerminal className="w-4 h-4 text-gold-700" />
              <span>Ver Terminais PTY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-beige-300 flex items-center justify-between shadow-warm">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 font-bold">Workflows Ativos</div>
            <div className="text-xl font-extrabold text-espresso-950 font-mono mt-0.5">{activeRunsCount}</div>
            <div className="text-[10px] text-gold-700 font-mono mt-1 font-bold">
              {pendingApprovalCount > 0 ? `${pendingApprovalCount} aguardando aprovação` : 'Sem pendências'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-300 text-gold-800 flex items-center justify-center shadow-xs">
            <IconZap className="w-5 h-5 text-gold-700" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-beige-300 flex items-center justify-between shadow-warm">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 font-bold">Orçamento de Tokens</div>
            <div className="text-xl font-extrabold text-gold-700 font-mono mt-0.5">
              {consumedTokens.toLocaleString()}
            </div>
            <div className="text-[10px] text-espresso-500 font-mono mt-1">
              de {(maxTokensBudget / 1000).toFixed(0)}k configurados
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-beige-200 border border-beige-300 text-espresso-800 flex items-center justify-center shadow-xs">
            <IconCpu className="w-5 h-5 text-espresso-800" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-beige-300 flex items-center justify-between shadow-warm">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 font-bold">Auto-Melhorias</div>
            <div className="text-xl font-extrabold text-espresso-950 font-mono mt-0.5">
              {Object.keys(improvements).length}
            </div>
            <div className="text-[10px] text-emerald-700 font-mono mt-1 font-bold">
              Auto-Heal CloudShell Ativo
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 flex items-center justify-center shadow-xs">
            <IconShieldAlert className="w-5 h-5 text-rose-700" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-beige-300 flex items-center justify-between shadow-warm">
          <div>
            <div className="text-[11px] font-mono text-espresso-600 font-bold">Alertas do Sistema</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">
              {criticalNotifsCount}
            </div>
            <div className="text-[10px] text-espresso-500 font-mono mt-1">
              {criticalNotifsCount === 0 ? 'Nenhum erro crítico' : 'Requer atenção'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs">
            <IconShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
        </div>
      </div>

      {/* Main Flow: Recent Executions & Start Points */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Execuções Recentes & Quality Gate Approvals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-beige-300 flex flex-col shadow-warm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 font-mono flex items-center gap-2">
                  <IconZap className="w-4 h-4 text-gold-600" />
                  <span>Jornada de Workflows & DAG</span>
                </h3>
                <p className="text-xs text-espresso-600 font-mono mt-0.5">
                  Acompanhe cada execução do início ao merge final
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('workflows')}
                className="text-xs font-mono font-bold text-gold-700 hover:text-gold-900 transition cursor-pointer"
              >
                Abrir Workflows →
              </button>
            </div>

            <div className="space-y-3">
              {runsList.length === 0 ? (
                <div className="p-8 rounded-xl bg-beige-50 border border-dashed border-beige-300 text-center space-y-3">
                  <p className="text-xs text-espresso-600 font-mono">
                    Nenhum workflow foi disparado ainda nesta sessão.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNewWorkflow}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 font-extrabold text-xs shadow-gold transition cursor-pointer inline-flex items-center gap-2 border border-gold-300"
                  >
                    <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
                    <span>Lançar Primeiro Workflow</span>
                  </button>
                </div>
              ) : (
                runsList.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl bg-beige-50/70 border border-beige-300 hover:border-gold-400 transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-espresso-950 font-mono text-xs">
                            {run.meta?.name || run.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-extrabold border ${
                              run.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : run.status === 'pending_approval'
                                ? 'bg-gold-100 text-gold-900 border-gold-400 animate-pulse'
                                : run.status === 'running'
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                : 'bg-beige-200 text-espresso-700 border-beige-300'
                            }`}
                          >
                            {run.status}
                          </span>
                        </div>
                        <p className="text-xs text-espresso-700 line-clamp-1 mt-1">
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
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold flex items-center gap-1.5 transition cursor-pointer border border-gold-300"
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
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-beige-200 text-espresso-950 font-mono text-xs font-bold border border-beige-300 transition cursor-pointer shadow-xs"
                        >
                          Inspecionar
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-espresso-600 pt-2 border-t border-beige-200">
                      <span>Fase: <strong className="text-espresso-950">{run.currentPhase || 'Em andamento'}</strong></span>
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
          <div className="p-5 rounded-2xl bg-white border border-beige-300 space-y-3 shadow-warm">
            <div>
              <h3 className="text-sm font-extrabold text-espresso-950 font-mono flex items-center gap-2">
                <IconPalette className="w-4 h-4 text-gold-600" />
                <span>Squads Recomendados (Overclock.sh)</span>
              </h3>
              <p className="text-xs text-espresso-600 font-mono mt-0.5">
                Templates com CLI, harness e gates pré-configurados
              </p>
            </div>

            <div className="space-y-2.5">
              {quickSquads.map((squad) => (
                <div
                  key={squad.slug}
                  onClick={onOpenNewWorkflow}
                  className="p-3.5 rounded-xl bg-beige-50/60 border border-beige-300 hover:border-gold-400 hover:bg-gold-50/50 transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-espresso-950 text-xs font-mono group-hover:text-gold-900 transition">
                      {squad.title}
                    </span>
                    <span className="text-[10px] font-mono text-gold-900 bg-gold-100 px-2 py-0.5 rounded border border-gold-300 font-bold">
                      {squad.command}
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-700 line-clamp-2 mt-1.5 leading-relaxed">
                    {squad.description}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenNewWorkflow}
              className="w-full py-2.5 rounded-xl bg-beige-100 hover:bg-gold-100 text-espresso-950 text-xs font-mono font-bold border border-beige-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
