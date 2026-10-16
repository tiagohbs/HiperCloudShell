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
      badgeColor: 'bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-700'
    },
    {
      id: 'grid',
      label: 'Terminais PTY',
      icon: <IconTerminal className="w-4 h-4" />,
      badge: 'ConPTY',
      badgeColor: 'bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-200 border-beige-300 dark:border-denim-700'
    },
    {
      id: 'pixel-forge',
      label: 'Pixel Forge 3D',
      icon: <IconPalette className="w-4 h-4" />,
      badge: 'Squad 8',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
    },
    {
      id: 'self-improvement',
      label: 'Auto-Melhoria',
      icon: <IconShieldAlert className="w-4 h-4" />,
      badge: improvementsCount > 0 ? String(improvementsCount) : null,
      badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
    }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-beige-150 dark:bg-denim-950 border-r border-beige-300 dark:border-denim-800 flex flex-col justify-between select-none z-20 transition-colors duration-150">
      {/* Top: Logo & Main Action */}
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-beige-300 dark:border-denim-800 flex items-center justify-between bg-beige-100/60 dark:bg-denim-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center shadow-gold font-extrabold text-espresso-950 text-sm border border-gold-300">
              H
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs uppercase tracking-wider text-espresso-950 dark:text-denim-50">
                  HiperCloudShell
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-200/60 dark:bg-gold-950/70 text-gold-800 dark:text-gold-300 font-mono font-bold border border-gold-300 dark:border-gold-700">
                  ADE
                </span>
              </div>
              <p className="text-[10px] text-espresso-600 dark:text-denim-400 font-mono">Ultracode Multi-Agent</p>
            </div>
          </div>
        </div>

        {/* Global Primary Action Button: "+ Novo Workflow" (Dourado Brilhante) */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-bold text-xs shadow-gold hover:shadow-gold-lg flex items-center justify-between transition-all duration-200 group cursor-pointer border border-gold-300"
          >
            <span className="flex items-center gap-2">
              <IconPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200 text-espresso-950" />
              <span>Novo Workflow</span>
            </span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-espresso-950/10 dark:bg-black/20 text-espresso-900 dark:text-denim-950 font-mono font-bold">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-espresso-500 dark:text-denim-400 px-2 py-1 font-mono">
            Espaços de Trabalho
          </div>

          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-denim-850 text-espresso-950 dark:text-denim-50 border border-gold-400 dark:border-gold-500 shadow-warm dark:shadow-denim font-bold'
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50 hover:bg-beige-200/70 dark:hover:bg-denim-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-gold-600 dark:text-gold-400 font-bold' : 'text-espresso-500 dark:text-denim-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-200 border-beige-300 dark:border-denim-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Google Stitch Status & Settings */}
      <div className="p-3 border-t border-beige-300 dark:border-denim-800 bg-beige-100/60 dark:bg-denim-900/60 space-y-2">
        <div className="p-2.5 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-[11px] font-mono leading-tight">
              <div className="font-bold text-espresso-950 dark:text-denim-50 flex items-center gap-1">
                <span>Stitch MCP</span>
                <span className="text-emerald-700 dark:text-emerald-400 text-[10px]">✔</span>
              </div>
              <div className="text-[10px] text-espresso-500 dark:text-denim-400">Google Remote SSE</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 hover:bg-beige-200 dark:hover:bg-denim-800 transition cursor-pointer"
            title="Configurações & Chaves"
          >
            <IconSettings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400 px-1">
          <span>Dual-Engine:</span>
          <span className="font-bold uppercase text-gold-700 dark:text-gold-400">{provider}</span>
        </div>
      </div>
    </aside>
  );
}
