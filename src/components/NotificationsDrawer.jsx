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
  notificationHistory = [],
  onFollowTrace,
  onOpenImprovement,
  onAcknowledge,
  onClearAll,
  onRestoreNotification,
  onPurgeHistory
}) {
  const [activeTab, setActiveTab] = React.useState('active'); // 'active' | 'history'

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
                {unreadCount > 0 && activeTab === 'active' && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-espresso-600 dark:text-denim-300 font-mono">
                Rastreamento Determinístico & Histórico HCS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 flex items-center justify-center transition cursor-pointer text-xs shadow-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub-tabs: Ativas vs Histórico Arquivado */}
        <div className="px-4 py-2 bg-beige-100/70 dark:bg-denim-850/70 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 bg-beige-200/80 dark:bg-denim-800 p-0.5 rounded-lg border border-beige-300 dark:border-denim-700">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-100'
              }`}
            >
              <span>🔔 Ativas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-beige-200 dark:bg-denim-800 text-espresso-800 dark:text-denim-200">
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-100'
              }`}
            >
              <span>📜 Histórico</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-beige-200 dark:bg-denim-800 text-espresso-800 dark:text-denim-200">
                {notificationHistory.length}
              </span>
            </button>
          </div>

          <div>
            {activeTab === 'active' && notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[10px] text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50 font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 hover:bg-gold-100 dark:hover:bg-denim-700 transition cursor-pointer shadow-xs font-bold"
                title="Move todas as notificações ativas para o Histórico Arquivado"
              >
                📦 Arquivar Todas
              </button>
            )}

            {activeTab === 'history' && notificationHistory.length > 0 && (
              <button
                type="button"
                onClick={onPurgeHistory}
                className="text-[10px] text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 font-mono px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 transition cursor-pointer font-bold"
                title="Limpa permanentemente o histórico arquivado"
              >
                Limpar Definitivo
              </button>
            )}
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-beige-50 dark:bg-denim-900">
          {activeTab === 'active' && notifications.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-espresso-500 dark:text-denim-400 font-mono text-xs text-center p-4 space-y-2">
              <IconCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="font-bold">Nenhuma notificação ativa.</span>
              <p className="text-[11px] text-espresso-600 dark:text-denim-400 max-w-xs">
                Seus alertas anteriores foram salvos no Histórico Arquivado ({notificationHistory.length} registros).
              </p>
              {notificationHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 text-xs font-mono font-bold text-espresso-900 dark:text-denim-100 hover:border-gold-400 transition cursor-pointer shadow-xs"
                >
                  Ver Histórico Arquivado →
                </button>
              )}
            </div>
          )}

          {activeTab === 'history' && notificationHistory.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-espresso-500 dark:text-denim-400 font-mono text-xs text-center p-4">
              <IconClock className="w-8 h-8 text-espresso-300 dark:text-denim-600 mb-2" />
              <span className="font-bold">Histórico Arquivado Vazio.</span>
              <p className="text-[11px] text-espresso-600 dark:text-denim-400 mt-1 max-w-xs">
                Quando você arquivar notificações ativas, elas serão preservadas aqui permanentemente.
              </p>
            </div>
          )}
          {/* Render Active or History Items */}
          {(activeTab === 'active' ? notifications : notificationHistory).map((item) => {
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
                  item.acknowledged && activeTab === 'active'
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

                  <div className="flex items-center gap-1.5">
                    {activeTab === 'history' && onRestoreNotification && (
                      <button
                        type="button"
                        onClick={() => onRestoreNotification(item.id)}
                        className="text-[10px] text-gold-800 dark:text-gold-300 hover:text-gold-950 dark:hover:text-gold-100 font-mono whitespace-nowrap cursor-pointer font-bold px-2 py-0.5 rounded bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700"
                        title="Restaurar para a lista de ativas"
                      >
                        ↩ Restaurar
                      </button>
                    )}

                    {activeTab === 'active' && !item.acknowledged && (
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
                </div>

                <p className="text-[11px] text-espresso-700 dark:text-denim-200 leading-relaxed">
                  {item.message}
                </p>

                {/* Timestamp & Archive info */}
                <div className="flex items-center justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                  <span>Criado: {new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.archivedAt && (
                    <span className="text-gold-700 dark:text-gold-400 font-bold">
                      📦 Arquivado às {new Date(item.archivedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

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
          })}
        </div>
      </div>
    </div>
  );
}
