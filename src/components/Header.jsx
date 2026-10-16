// src/components/Header.jsx
import React from 'react';
import { IconShieldAlert, IconZap, IconPlus, IconSun, IconMoon } from './Icons.jsx';

export default function Header({
  activeView,
  activeRun,
  provider,
  onChangeProvider,
  effort,
  onToggleEffort,
  consumedTokens = 0,
  maxTokensBudget = 50000,
  unlimitedTokens = false,
  onToggleUnlimitedTokens,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  onOpenNewWorkflow,
  theme = 'light',
  onToggleTheme,
  activeProject,
  onNavigate
}) {
  const getBreadcrumbs = () => {
    switch (activeView) {
      case 'dashboard':
        return [
          { label: 'HiperCloudShell', highlight: false },
          { label: 'Dashboard Executivo', highlight: true }
        ];
      case 'projects':
        return [
          { label: 'Central de Projetos', highlight: false },
          { label: activeProject?.name || 'GitHub', highlight: true }
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
    <header className="h-14 flex-shrink-0 bg-white/80 dark:bg-denim-950/80 border-b border-beige-300 dark:border-denim-800 px-4 flex items-center justify-between gap-4 backdrop-blur-md z-20 select-none transition-colors duration-150">
      {/* Left: Dynamic Breadcrumb & Active Project Chip */}
      <div className="flex items-center gap-3">
        {/* Active Project Pill (Apple HIG Style) */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('projects')}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-beige-200/70 dark:bg-denim-850 border border-beige-300 dark:border-denim-700 text-xs font-mono transition-all hover:border-gold-400 hover:shadow-xs cursor-pointer group"
          title="Ver Detalhes do Projeto e Repositório GitHub"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-espresso-950 dark:text-denim-50 group-hover:text-gold-700 dark:group-hover:text-gold-400">
            {activeProject?.name || 'HiperCloudShell'}
          </span>
          <span className="text-espresso-400 dark:text-denim-500">•</span>
          <span className="text-gold-800 dark:text-gold-300 font-bold">
             {activeProject?.branch || 'main'}
          </span>
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-espresso-400 dark:text-denim-400">/</span>}
              <span
                className={
                  crumb.highlight
                    ? 'text-espresso-950 dark:text-denim-50 font-extrabold tracking-wide'
                    : 'text-espresso-600 dark:text-denim-200 font-medium'
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Theme Switcher, Dual Engine, Effort, Token Budget & Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Day / Night Theme Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 text-[11px] font-mono text-espresso-900 dark:text-denim-100 hover:border-gold-400 transition cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Mudar para Modo Diurno (Bege Claro)' : 'Mudar para Modo Noturno (Jeans Escuro)'}
        >
          {theme === 'dark' ? (
            <>
              <IconMoon className="w-3.5 h-3.5 text-gold-400" />
              <span className="hidden sm:inline font-bold text-denim-100">Noturno (Jeans)</span>
            </>
          ) : (
            <>
              <IconSun className="w-3.5 h-3.5 text-gold-600" />
              <span className="hidden sm:inline font-bold text-espresso-900">Diurno (Bege)</span>
            </>
          )}
        </button>

        {/* Token Budget Gauge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 text-[11px] font-mono shadow-xs text-espresso-900 dark:text-denim-100">
          <span className="text-espresso-500 dark:text-denim-400">Tokens:</span>
          <span className="text-gold-700 dark:text-gold-400 font-bold">{consumedTokens.toLocaleString()}</span>
          <span className="text-espresso-300 dark:text-denim-600">/</span>
          {unlimitedTokens ? (
            <button
              type="button"
              onClick={() => onToggleUnlimitedTokens && onToggleUnlimitedTokens(false)}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              title="Teto desativado (Clique para reativar teto)"
            >
              <span>∞ Ilimitado</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleUnlimitedTokens && onToggleUnlimitedTokens(true)}
              className="text-espresso-600 dark:text-denim-300 hover:text-gold-600 font-medium cursor-pointer"
              title="Teto ativo (Clique para desativar teto)"
            >
              {(maxTokensBudget / 1000).toFixed(0)}k
            </button>
          )}
        </div>

        {/* Dual Engine Selector */}
        <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-900 border border-beige-300 dark:border-denim-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onChangeProvider('claude')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'claude'
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : 'text-espresso-700 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Claude CLI
          </button>
          <button
            type="button"
            onClick={() => onChangeProvider('antigravity')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'antigravity'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-espresso-700 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Antigravity
          </button>
          <button
            type="button"
            onClick={() => onChangeProvider('hybrid')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition cursor-pointer ${
              provider === 'hybrid'
                ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 font-extrabold shadow-gold border border-gold-300'
                : 'text-espresso-700 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            ⚡ Híbrido
          </button>
        </div>

        {/* Cognitive Effort Toggle */}
        <div className="hidden sm:flex items-center gap-1 bg-beige-200 dark:bg-denim-900 border border-beige-300 dark:border-denim-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onToggleEffort('high')}
            className={`px-2 py-1 text-[10px] font-mono rounded-md transition cursor-pointer ${
              effort === 'high'
                ? 'bg-white dark:bg-denim-800 text-espresso-950 dark:text-denim-50 font-bold shadow-xs border border-beige-300 dark:border-denim-700'
                : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            High Effort
          </button>
          <button
            type="button"
            onClick={() => onToggleEffort('ultracode')}
            className={`px-2 py-1 text-[10px] font-mono rounded-md transition cursor-pointer flex items-center gap-1 ${
              effort === 'ultracode'
                ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-espresso-950 font-extrabold shadow-gold'
                : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            <IconZap className="w-3 h-3 text-espresso-950" />
            <span>Ultracode</span>
          </button>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative p-2 rounded-lg bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-white hover:bg-beige-50 dark:hover:bg-denim-800 transition cursor-pointer shadow-xs"
          title="Notificações & Rastreabilidade"
        >
          <IconShieldAlert className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Quick Launch Header Button */}
        <button
          type="button"
          onClick={onOpenNewWorkflow}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-bold text-xs shadow-gold hover:shadow-gold-lg transition cursor-pointer border border-gold-300"
        >
          <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
          <span>Novo</span>
        </button>
      </div>
    </header>
  );
}
