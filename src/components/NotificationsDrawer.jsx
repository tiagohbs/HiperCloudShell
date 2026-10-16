// src/components/NotificationsDrawer.jsx
import React from 'react';
import {
  IconShieldAlert,
  IconZap,
  IconTerminal,
  IconClock,
  IconCheck
} from './Icons.jsx';

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  onFollowTrace,
  onOpenImprovement,
  onAcknowledge,
  onClearAll
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.acknowledged).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-espresso-950/60 dark:bg-denim-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-beige-50 dark:bg-denim-900 border-l border-beige-300 dark:border-denim-700 h-full flex flex-col shadow-warm-lg dark:shadow-denim-lg animate-in slide-in-from-right duration-200 text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* Header */}
        <div className="p-4 border-b border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-800 dark:text-gold-300 flex items-center justify-center font-bold shadow-xs">
              <IconShieldAlert className="w-4 h-4 text-gold-700 dark:text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  Centro de Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-espresso-600 dark:text-denim-300 font-mono">
                Rastreamento Determinístico HCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[10px] text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 font-mono px-2 py-1 rounded bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 hover:bg-beige-200 dark:hover:bg-denim-700 transition cursor-pointer shadow-xs"
              >
                Limpar Todas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 flex items-center justify-center transition cursor-pointer text-xs shadow-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-beige-50 dark:bg-denim-900">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-espresso-400 dark:text-denim-400 font-mono text-xs">
              <IconCheck className="w-8 h-8 text-espresso-300 dark:text-denim-600 mb-2" />
              <span>Nenhuma notificação no momento.</span>
            </div>
          ) : (
            notifications.map((item) => {
              const badgeStyle =
                item.severity === 'critical'
                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                  : item.severity === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-gold-100 dark:bg-gold-950/70 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-700';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs transition space-y-2.5 ${
                    item.acknowledged
                      ? 'bg-beige-100/70 dark:bg-denim-900/70 border-beige-300 dark:border-denim-800 opacity-75'
                      : 'bg-white dark:bg-denim-850 border-beige-300 dark:border-denim-700 shadow-warm dark:shadow-denim'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-extrabold ${badgeStyle}`}>
                        {item.code}
                      </span>
                      <span className="font-extrabold text-espresso-950 dark:text-denim-50 font-mono text-xs">
                        {item.title}
                      </span>
                    </div>

                    {!item.acknowledged && (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(item.id)}
                        className="text-[10px] text-espresso-500 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50 font-mono whitespace-nowrap cursor-pointer font-bold"
                        title="Marcar como lida"
                      >
                        ✓ Lida
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-espresso-700 dark:text-denim-200 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Source Trace Metadata */}
                  {item.source_trace && (
                    <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750 text-[10px] font-mono text-espresso-600 dark:text-denim-300 space-y-0.5">
                      {item.source_trace.agent_id && (
                        <div>Agente: <strong className="text-espresso-950 dark:text-denim-100">{item.source_trace.agent_id}</strong></div>
                      )}
                      {item.source_trace.worktree_path && (
                        <div>Worktree: <span className="text-gold-700 dark:text-gold-400 font-bold">{item.source_trace.worktree_path}</span></div>
                      )}
                      {item.source_trace.file_target && (
                        <div>Arquivo: <span className="text-espresso-950 dark:text-denim-100 font-bold">{item.source_trace.file_target}</span></div>
                      )}
                    </div>
                  )}

                  {/* Deep Linking Actions */}
                  <div className="pt-2 border-t border-beige-200 dark:border-denim-750 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onFollowTrace) onFollowTrace(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 text-[10px] font-mono font-bold border border-beige-300 dark:border-denim-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <IconTerminal className="w-3 h-3 text-gold-700 dark:text-gold-400" />
                      <span>Ir para o Agente</span>
                    </button>

                    {item.improvement_id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenImprovement) onOpenImprovement(item.improvement_id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gold-100 dark:bg-gold-950/70 hover:bg-gold-200 dark:hover:bg-gold-900 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 text-[10px] font-mono font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <IconZap className="w-3 h-3 text-gold-700 dark:text-gold-400" />
                        <span>Auto-Heal CloudShell</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
