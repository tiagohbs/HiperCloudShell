// src/components/Header.jsx
import React from 'react';
import { IconShieldAlert, IconZap, IconPlus } from './Icons.jsx';

export default function Header({
  activeView,
  activeRun,
  provider,
  onChangeProvider,
  effort,
  onToggleEffort,
  consumedTokens = 0,
  maxTokensBudget = 50000,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  onOpenNewWorkflow
}) {
  const getBreadcrumbs = () => {
    switch (activeView) {
      case 'dashboard':
        return [
          { label: 'HiperCloudShell', highlight: false },
          { label: 'Dashboard Executivo', highlight: true }
        ];
      case 'workflows':
        return [
          { label: 'Workflows', highlight: false },
          { label: activeRun ? activeRun.meta?.name || activeRun.id : 'Nenhum Workflow Selecionado', highlight: true },
          ...(activeRun?.currentPhase ? [{ label: `Fase: ${activeRun.currentPhase}`, highlight: false }] : [])
        ];
      case 'grid':
        return [
          { label: 'Espaço de Trabalho', highlight: false },
          { label: 'Grid Multi-Terminal ConPTY', highlight: true }
        ];
      case 'pixel-forge':
        return [
          { label: 'Estúdio 3D', highlight: false },
          { label: 'Pixel Forge 3D (squad-pixel-forge-3d)', highlight: true }
        ];
      case 'self-improvement':
        return [
          { label: 'Resiliência', highlight: false },
          { label: 'Sistema de Auto-Melhoria Contínua', highlight: true }
        ];
      default:
        return [{ label: 'HiperCloudShell', highlight: true }];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-14 flex-shrink-0 bg-[#090d14]/95 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 backdrop-blur z-20 select-none">
      {/* Left: Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-slate-600">/</span>}
            <span
              className={
                crumb.highlight
                  ? 'text-white font-bold tracking-wide'
                  : 'text-slate-400'
              }
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Dual Engine, Effort, Token Budget & Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Token Budget Gauge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Tokens:</span>
          <span className="text-cyan-300 font-semibold">{consumedTokens.toLocaleString()}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{(maxTokensBudget / 1000).toFixed(0)}k</span>
        </div>

        {/* Dual Engine Selector */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onChangeProvider('claude')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'claude'
                ? 'bg-orange-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Claude CLI
          </button>
          <button
            type="button"
            onClick={() => onChangeProvider('antigravity')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'antigravity'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Antigravity
          </button>
          <button
            type="button"
            onClick={() => onChangeProvider('hybrid')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'hybrid'
                ? 'bg-gradient-to-r from-orange-600 via-violet-600 to-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Híbrido
          </button>
        </div>

        {/* /effort Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onToggleEffort('high')}
            className={`px-2 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              effort === 'high' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            /effort high
          </button>
          <button
            type="button"
            onClick={() => onToggleEffort('ultracode')}
            className={`px-2 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              effort === 'ultracode' ? 'bg-violet-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            /effort ultracode
          </button>
        </div>

        {/* Notifications Button with Badge */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className={`relative p-2 rounded-lg border transition flex items-center gap-1.5 text-xs cursor-pointer ${
            unreadNotificationsCount > 0
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Centro de Notificações Rastreáveis"
        >
          <IconShieldAlert className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px] font-bold">{unreadNotificationsCount}</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
}
