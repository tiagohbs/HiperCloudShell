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
    <div className="fixed inset-0 z-50 flex justify-end bg-espresso-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-beige-50 border-l border-beige-300 h-full flex flex-col shadow-warm-lg animate-in slide-in-from-right duration-200 text-espresso-900">
        {/* Header */}
        <div className="p-4 border-b border-beige-300 bg-beige-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-100 border border-gold-300 text-gold-800 flex items-center justify-center font-bold shadow-xs">
              <IconShieldAlert className="w-4 h-4 text-gold-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-espresso-950 font-mono">
                  Centro de Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-espresso-600 font-mono">
                Rastreamento Determinístico HCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[10px] text-espresso-600 hover:text-espresso-950 font-mono px-2 py-1 rounded bg-white border border-beige-300 hover:bg-beige-200 transition cursor-pointer shadow-xs"
              >
                Limpar Todas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white border border-beige-300 hover:bg-beige-200 text-espresso-600 hover:text-espresso-950 flex items-center justify-center transition cursor-pointer text-xs shadow-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-beige-50">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-espresso-400 font-mono text-xs">
              <IconCheck className="w-8 h-8 text-espresso-300 mb-2" />
              <span>Nenhuma notificação no momento.</span>
            </div>
          ) : (
            notifications.map((item) => {
              const badgeStyle =
                item.severity === 'critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : item.severity === 'warning'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-gold-100 text-gold-800 border-gold-300';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs transition space-y-2.5 ${
                    item.acknowledged
                      ? 'bg-beige-100/70 border-beige-300 opacity-75'
                      : 'bg-white border-beige-300 shadow-warm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-extrabold ${badgeStyle}`}>
                        {item.code}
                      </span>
                      <span className="font-extrabold text-espresso-950 font-mono text-xs">
                        {item.title}
                      </span>
                    </div>

                    {!item.acknowledged && (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(item.id)}
                        className="text-[10px] text-espresso-500 hover:text-espresso-950 font-mono whitespace-nowrap cursor-pointer font-bold"
                        title="Marcar como lida"
                      >
                        ✓ Lida
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-espresso-700 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Source Trace Metadata */}
                  {item.source_trace && (
                    <div className="p-2.5 rounded-lg bg-beige-50 border border-beige-300 text-[10px] font-mono text-espresso-600 space-y-0.5">
                      {item.source_trace.agent_id && (
                        <div>Agente: <strong className="text-espresso-950">{item.source_trace.agent_id}</strong></div>
                      )}
                      {item.source_trace.worktree_path && (
                        <div>Worktree: <span className="text-gold-700 font-bold">{item.source_trace.worktree_path}</span></div>
                      )}
                      {item.source_trace.file_target && (
                        <div>Arquivo: <span className="text-espresso-950 font-bold">{item.source_trace.file_target}</span></div>
                      )}
                    </div>
                  )}

                  {/* Deep Linking Actions */}
                  <div className="pt-2 border-t border-beige-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onFollowTrace) onFollowTrace(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-beige-100 hover:bg-beige-200 text-espresso-800 text-[10px] font-mono font-bold border border-beige-300 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <IconTerminal className="w-3 h-3 text-gold-700" />
                      <span>Ir para o Agente</span>
                    </button>

                    {item.improvement_id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenImprovement) onOpenImprovement(item.improvement_id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gold-100 hover:bg-gold-200 border border-gold-300 text-gold-900 text-[10px] font-mono font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <IconZap className="w-3 h-3 text-gold-700" />
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
