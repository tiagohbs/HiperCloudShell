// src/components/Sidebar.jsx
import React from 'react';
import {
  IconHome,
  IconZap,
  IconTerminal,
  IconPalette,
  IconShieldAlert,
  IconSettings,
  IconPlus
} from './Icons.jsx';

export default function Sidebar({
  activeView,
  onNavigate,
  onOpenNewWorkflow,
  onOpenSettings,
  workflowRunsCount = 0,
  improvementsCount = 0,
  provider = 'hybrid'
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <IconHome className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'workflows',
      label: 'Workflows & DAG',
      icon: <IconZap className="w-4 h-4" />,
      badge: workflowRunsCount > 0 ? String(workflowRunsCount) : null,
      badgeColor: 'bg-violet-900/60 text-violet-300 border-violet-500/40'
    },
    {
      id: 'grid',
      label: 'Terminais PTY',
      icon: <IconTerminal className="w-4 h-4" />,
      badge: 'ConPTY',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'
    },
    {
      id: 'pixel-forge',
      label: 'Pixel Forge 3D',
      icon: <IconPalette className="w-4 h-4" />,
      badge: 'Squad 8',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
    },
    {
      id: 'self-improvement',
      label: 'Auto-Melhoria',
      icon: <IconShieldAlert className="w-4 h-4" />,
      badge: improvementsCount > 0 ? String(improvementsCount) : null,
      badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-800/40'
    }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#090c13] border-r border-slate-800/90 flex flex-col justify-between select-none z-20">
      {/* Top: Logo & Main Action */}
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 font-bold text-white text-sm">
              H
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs uppercase tracking-wider text-white">HiperCloudShell</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">ADE</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Ultracode Multi-Agent</p>
            </div>
          </div>
        </div>

        {/* Global Primary Action Button: "+ Novo Workflow" */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-900/40 flex items-center justify-between transition group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <IconPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Novo Workflow</span>
            </span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-violet-100 font-mono">Ctrl+K</kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
            Espaços de Trabalho
          </div>

          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                  isActive
                    ? 'bg-violet-600/15 text-white font-semibold border border-violet-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-violet-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Connection Status & Settings */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#06080e]/60">
        {/* Stitch MCP Status Pill */}
        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Google Stitch</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">Conectado</span>
        </div>

        {/* Dual Engine Info */}
        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
          <span className="text-slate-400">Motor Ativo:</span>
          <span className="text-[10px] text-violet-300 font-semibold uppercase">
            {provider === 'hybrid' ? '⚡ Híbrido' : provider}
          </span>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition flex items-center gap-2 cursor-pointer"
        >
          <IconSettings className="w-3.5 h-3.5 text-slate-400" />
          <span>Configurações & Integrações</span>
        </button>
      </div>
    </aside>
  );
}
