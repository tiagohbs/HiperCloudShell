// src/components/views/SelfImprovementView.jsx
import React from 'react';
import {
  IconShieldAlert,
  IconCloud,
  IconCheck,
  IconZap
} from '../Icons.jsx';

export default function SelfImprovementView({
  selfImpConfig,
  updateSelfImprovementConfig,
  customImprovementGoal,
  setCustomImprovementGoal,
  handleTriggerCloudShellImprovement,
  improvements = {},
  selectedImprovementId,
  setSelectedImprovementId,
  cloudShellLogs = {},
  cloudShellCommandInput,
  setCloudShellCommandInput,
  handleSendCloudShellAdjustment,
  onMergeImprovement
}) {
  const activeImp = selectedImprovementId ? improvements[selectedImprovementId] : null;
  const logs = activeImp ? (cloudShellLogs[activeImp.cloudshell_term_id] || [
    `[CloudShell PTY] Conectado à sessão ${activeImp.cloudshell_term_id}`,
    `Worktree: ${activeImp.worktree_path} (Branch: ${activeImp.branch_name || 'HEAD'})`,
    `Motor Ativo: ${activeImp.engine}`,
    `Status: ${activeImp.status}`
  ]) : [];

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto bg-[#06080c]">
      {/* Coluna Esquerda (5/12): Configurações do Motor, Gatilhos e Lista de Tarefas */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto min-h-0">
        {/* Bloco 1: Painel de Controle do Motor de Auto-Melhoria */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f17]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <IconShieldAlert className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Motor de Auto-Melhoria Contínua
              </h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
              <input
                type="checkbox"
                checked={selfImpConfig.enabled}
                onChange={(e) => updateSelfImprovementConfig({ enabled: e.target.checked })}
                className="accent-rose-500 rounded"
              />
              <span className={selfImpConfig.enabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {selfImpConfig.enabled ? 'ATIVO' : 'PAUSADO'}
              </span>
            </label>
          </div>

          {/* Seletor de Motor Preferencial para Auto-Heal */}
          <div className="mb-3">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">
              Motor Padrão de Diagnóstico & Correção:
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'claude' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer ${
                  selfImpConfig.preferredEngine === 'claude'
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Claude Code
              </button>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'antigravity' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer ${
                  selfImpConfig.preferredEngine === 'antigravity'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Antigravity
              </button>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'hybrid' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer ${
                  selfImpConfig.preferredEngine === 'hybrid'
                    ? 'bg-gradient-to-r from-orange-600 via-violet-600 to-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Híbrido Auto
              </button>
            </div>
          </div>

          {/* Opções Avançadas de Auto-Heal */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Modo Contínuo:</span>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ continuousMode: !selfImpConfig.continuousMode })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  selfImpConfig.continuousMode
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {selfImpConfig.continuousMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Threshold Gargalo:</span>
              <span className="text-amber-300 font-bold text-[11px]">
                {Math.round(selfImpConfig.bottleneckThresholdMs / 1000)}s
              </span>
            </div>
          </div>

          {/* Gatilho Manual de Melhoria */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">
              Disparar Melhoria Manual via CloudShell:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customImprovementGoal}
                onChange={(e) => setCustomImprovementGoal(e.target.value)}
                placeholder="Ex: Otimizar latência do IPC em commands.rs"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleTriggerCloudShellImprovement()}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-900/30 transition font-mono whitespace-nowrap cursor-pointer"
              >
                Disparar
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Lista de Tarefas de Auto-Melhoria */}
        <div className="flex-1 p-4 rounded-xl border border-slate-800 bg-[#0b0f17] flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3 flex items-center justify-between">
            <span>Fila de Melhorias ({Object.keys(improvements).length})</span>
            <span className="text-[10px] text-slate-500">Isolação Git Worktree</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {Object.values(improvements).length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">Nenhuma tarefa de melhoria ativa.</p>
            ) : (
              Object.values(improvements).map((imp) => {
                const isSelected = selectedImprovementId === imp.id;
                const statusBadge =
                  imp.status === 'ready_to_merge'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : imp.status === 'running_cloudshell'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800 animate-pulse'
                    : imp.status === 'validating_gate'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800';

                return (
                  <div
                    key={imp.id}
                    onClick={() => setSelectedImprovementId(imp.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/60 shadow-sm shadow-rose-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 font-mono">
                        {imp.source_notification_code || imp.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusBadge}`}>
                        {imp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mb-2">
                      Motor: <span className="text-slate-200">{imp.engine}</span> • Worktree:{' '}
                      <span className="text-slate-200">{imp.worktree_path}</span>
                    </div>
                    {imp.diagnosis && (
                      <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 line-clamp-2">
                        {imp.diagnosis}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Coluna Direita (7/12): Inspeção, Diagnóstico e Terminal CloudShell Integrado */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto min-h-0">
        {activeImp ? (
          <>
            {/* Header da Tarefa Selecionada com Ações */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f17] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-bold text-white font-mono">
                    {activeImp.source_notification_code || activeImp.id}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                    Auto-Heal Session
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Worktree: <span className="text-slate-200">{activeImp.worktree_path}</span> • Branch:{' '}
                  <span className="text-slate-200">{activeImp.branch_name}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerCloudShellImprovement({
                      notificationCode: activeImp.source_notification_code,
                      customGoal: `Re-executar melhoria na estratégia oposta`,
                      engineOverride: activeImp.engine === 'claude' ? 'antigravity' : 'claude'
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 cursor-pointer"
                >
                  🔄 Alternar para {activeImp.engine === 'claude' ? 'Antigravity' : 'Claude'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onMergeImprovement) onMergeImprovement(activeImp);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-900/40 cursor-pointer"
                >
                  ✓ Fazer Merge da Melhoria na Main
                </button>
              </div>
            </div>

            {/* Diagnóstico e Resumo do Patch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">Diagnóstico da Causa Raiz:</div>
                <p className="text-slate-300 text-[11px]">{activeImp.diagnosis}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1">Patch & Validação Gate:</div>
                <p className="text-slate-300 text-[11px]">
                  {activeImp.patch_summary || 'Executando verificações determinísticas no CloudShell...'}
                </p>
              </div>
            </div>

            {/* Terminal CloudShell Interativo do Agente de Auto-Melhoria */}
            <div className="flex-1 min-h-[320px] flex flex-col bg-[#05070a] border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <IconCloud className="w-3.5 h-3.5" />
                  <span>CloudShell Worktree Terminal ({activeImp.worktree_path})</span>
                </span>
                <span>Zero-Copy Junction Ativa • Buffer Sincronizado</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-emerald-300 mb-2 pr-1">
                {logs.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>

              <form onSubmit={handleSendCloudShellAdjustment} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={cloudShellCommandInput}
                  onChange={(e) => setCloudShellCommandInput(e.target.value)}
                  placeholder={`Envie uma instrução de ajuste para o agente ${activeImp.engine} ou comando bash no CloudShell...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Ajustar Agente
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="m-auto text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
            <IconShieldAlert className="w-8 h-8 text-slate-700" />
            <span>Selecione uma tarefa de auto-melhoria ao lado para inspecionar o CloudShell.</span>
          </div>
        )}
      </div>
    </div>
  );
}
