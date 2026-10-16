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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#090d15] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <IconShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  Centro de Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Rastreamento Determinístico HCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[10px] text-slate-400 hover:text-slate-200 font-mono px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
              >
                Limpar Todas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
              <IconCheck className="w-8 h-8 text-slate-700 mb-2" />
              <span>Nenhuma notificação no momento.</span>
            </div>
          ) : (
            notifications.map((item) => {
              const badgeStyle =
                item.severity === 'critical'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : item.severity === 'warning'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-800';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border text-xs transition space-y-2 ${
                    item.acknowledged
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                      : 'bg-slate-900/90 border-slate-700/80 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${badgeStyle}`}>
                        {item.code}
                      </span>
                      <span className="font-semibold text-slate-200 font-mono text-xs">
                        {item.title}
                      </span>
                    </div>

                    {!item.acknowledged && (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(item.id)}
                        className="text-[10px] text-slate-400 hover:text-white font-mono whitespace-nowrap cursor-pointer"
                        title="Marcar como lida"
                      >
                        ✓ Lida
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Source Trace Metadata */}
                  {item.source_trace && (
                    <div className="p-2 rounded bg-slate-950/70 border border-slate-800/70 text-[10px] font-mono text-slate-400 space-y-0.5">
                      {item.source_trace.agent_id && (
                        <div>Agente: <strong className="text-slate-300">{item.source_trace.agent_id}</strong></div>
                      )}
                      {item.source_trace.worktree_path && (
                        <div>Worktree: <span className="text-cyan-400">{item.source_trace.worktree_path}</span></div>
                      )}
                      {item.source_trace.file_target && (
                        <div>Arquivo: <span className="text-violet-400">{item.source_trace.file_target}</span></div>
                      )}
                    </div>
                  )}

                  {/* Deep Linking Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onFollowTrace) onFollowTrace(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <IconTerminal className="w-3 h-3 text-cyan-400" />
                      <span>Ir para o Agente</span>
                    </button>

                    {item.improvement_id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenImprovement) onOpenImprovement(item.improvement_id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[10px] font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <IconZap className="w-3 h-3 text-rose-400" />
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
