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
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto bg-beige-100 text-espresso-900">
      {/* Coluna Esquerda (5/12): Configurações do Motor, Gatilhos e Lista de Tarefas */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto min-h-0">
        {/* Bloco 1: Painel de Controle do Motor de Auto-Melhoria */}
        <div className="p-4 rounded-xl border border-beige-300 bg-white shadow-warm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gold-100 border border-gold-300 text-gold-800 flex items-center justify-center font-bold">
                <IconShieldAlert className="w-3.5 h-3.5 text-gold-700" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 font-mono">
                Motor de Auto-Melhoria Contínua
              </h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold">
              <input
                type="checkbox"
                checked={selfImpConfig.enabled}
                onChange={(e) => updateSelfImprovementConfig({ enabled: e.target.checked })}
                className="accent-gold-500 rounded"
              />
              <span className={selfImpConfig.enabled ? 'text-emerald-700 font-extrabold' : 'text-espresso-400'}>
                {selfImpConfig.enabled ? 'ATIVO' : 'PAUSADO'}
              </span>
            </label>
          </div>

          {/* Seletor de Motor Preferencial para Auto-Heal */}
          <div className="mb-3">
            <span className="text-[10px] font-mono text-espresso-600 font-bold block mb-1">
              Motor Padrão de Diagnóstico & Correção:
            </span>
            <div className="grid grid-cols-3 gap-1 bg-beige-50 p-1 rounded-lg border border-beige-300 text-xs">
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'claude' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer font-bold ${
                  selfImpConfig.preferredEngine === 'claude'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-espresso-700 hover:text-espresso-950'
                }`}
              >
                Claude
              </button>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'antigravity' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer font-bold ${
                  selfImpConfig.preferredEngine === 'antigravity'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-espresso-700 hover:text-espresso-950'
                }`}
              >
                Antigravity
              </button>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'hybrid' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer font-extrabold ${
                  selfImpConfig.preferredEngine === 'hybrid'
                    ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 shadow-gold border border-gold-300'
                    : 'text-espresso-700 hover:text-espresso-950'
                }`}
              >
                ⚡ Híbrido
              </button>
            </div>
          </div>

          {/* Opções Avançadas de Auto-Heal */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="p-2.5 rounded bg-beige-50 border border-beige-300 flex items-center justify-between">
              <span className="text-espresso-600 text-[11px] font-bold">Modo Contínuo:</span>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ continuousMode: !selfImpConfig.continuousMode })}
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${
                  selfImpConfig.continuousMode
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white text-espresso-600 border-beige-300'
                }`}
              >
                {selfImpConfig.continuousMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="p-2.5 rounded bg-beige-50 border border-beige-300 flex items-center justify-between">
              <span className="text-espresso-600 text-[11px] font-bold">Threshold Gargalo:</span>
              <span className="text-gold-700 font-extrabold text-[11px]">
                {Math.round(selfImpConfig.bottleneckThresholdMs / 1000)}s
              </span>
            </div>
          </div>

          {/* Gatilho Manual de Melhoria */}
          <div className="pt-2 border-t border-beige-200">
            <span className="text-[10px] font-mono text-espresso-600 font-bold block mb-1">
              Disparar Melhoria Manual via CloudShell:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customImprovementGoal}
                onChange={(e) => setCustomImprovementGoal(e.target.value)}
                placeholder="Ex: Otimizar latência do IPC em commands.rs"
                className="flex-1 bg-beige-50 border border-beige-300 rounded-lg px-2.5 py-1 text-xs text-espresso-950 placeholder-espresso-400 focus:outline-none focus:border-gold-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleTriggerCloudShellImprovement()}
                className="px-3.5 py-1 bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 rounded-lg text-xs font-extrabold shadow-gold transition font-mono whitespace-nowrap cursor-pointer border border-gold-300"
              >
                Disparar
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Lista de Tarefas de Auto-Melhoria */}
        <div className="flex-1 p-4 rounded-xl border border-beige-300 bg-white flex flex-col min-h-0 overflow-hidden shadow-warm">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 font-mono mb-3 flex items-center justify-between">
            <span>Fila de Melhorias ({Object.keys(improvements).length})</span>
            <span className="text-[10px] text-espresso-500 font-normal">Isolação Git Worktree</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {Object.values(improvements).length === 0 ? (
              <p className="text-xs text-espresso-500 font-mono">Nenhuma tarefa de melhoria ativa.</p>
            ) : (
              Object.values(improvements).map((imp) => {
                const isSelected = selectedImprovementId === imp.id;
                const statusBadge =
                  imp.status === 'ready_to_merge'
                    ? 'bg-gold-100 text-gold-900 border-gold-300 font-extrabold'
                    : imp.status === 'running_cloudshell'
                    ? 'bg-cyan-100 text-cyan-800 border-cyan-300 animate-pulse font-bold'
                    : imp.status === 'validating_gate'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                    : 'bg-beige-200 text-espresso-700 border-beige-300';

                return (
                  <div
                    key={imp.id}
                    onClick={() => setSelectedImprovementId(imp.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-gold-50 border-gold-500 shadow-gold'
                        : 'bg-beige-50/50 border-beige-300 hover:border-gold-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-espresso-950 font-mono">
                        {imp.source_notification_code || imp.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusBadge}`}>
                        {imp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-espresso-700 font-mono truncate mb-2">
                      Motor: <span className="font-bold text-espresso-950">{imp.engine}</span> • Worktree:{' '}
                      <span className="font-bold text-gold-700">{imp.worktree_path}</span>
                    </div>
                    {imp.diagnosis && (
                      <div className="text-[11px] text-espresso-800 bg-white p-2 rounded-lg border border-beige-200 line-clamp-2 shadow-xs">
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
            <div className="p-4 rounded-xl border border-beige-300 bg-white flex flex-wrap items-center justify-between gap-3 shadow-warm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-extrabold text-espresso-950 font-mono">
                    {activeImp.source_notification_code || activeImp.id}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-100 border border-gold-300 text-gold-900 font-bold">
                    Auto-Heal Session
                  </span>
                </div>
                <p className="text-xs text-espresso-600 font-mono">
                  Worktree: <span className="font-bold text-espresso-950">{activeImp.worktree_path}</span> • Branch:{' '}
                  <span className="font-bold text-gold-700">{activeImp.branch_name}</span>
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
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-beige-100 text-xs font-mono font-bold text-espresso-950 border border-beige-300 cursor-pointer shadow-xs"
                >
                  🔄 Alternar para {activeImp.engine === 'claude' ? 'Antigravity' : 'Claude'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onMergeImprovement) onMergeImprovement(activeImp);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-xs font-extrabold text-espresso-950 shadow-gold cursor-pointer border border-gold-300"
                >
                  ✓ Fazer Merge da Melhoria na Main
                </button>
              </div>
            </div>

            {/* Diagnóstico e Resumo do Patch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white border border-beige-300 shadow-xs">
                <div className="text-amber-800 font-extrabold mb-1">Diagnóstico da Causa Raiz:</div>
                <p className="text-espresso-700 text-[11px] leading-relaxed">{activeImp.diagnosis}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-beige-300 shadow-xs">
                <div className="text-emerald-800 font-extrabold mb-1">Patch & Validação Gate:</div>
                <p className="text-espresso-700 text-[11px] leading-relaxed">
                  {activeImp.patch_summary || 'Executando verificações determinísticas no CloudShell...'}
                </p>
              </div>
            </div>

            {/* Terminal CloudShell Interativo (Deep Espresso com Texto Dourado) */}
            <div className="flex-1 min-h-[320px] flex flex-col bg-espresso-950 border border-espresso-800 rounded-xl p-3.5 font-mono text-xs overflow-hidden shadow-warm-lg">
              <div className="flex items-center justify-between text-[11px] text-espresso-400 border-b border-espresso-800 pb-2 mb-2">
                <span className="flex items-center gap-1.5 text-gold-400 font-bold">
                  <IconCloud className="w-3.5 h-3.5 text-gold-400" />
                  <span>CloudShell Worktree Terminal ({activeImp.worktree_path})</span>
                </span>
                <span>Zero-Copy Junction Ativa • Buffer Sincronizado</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-gold-200 mb-2 pr-1">
                {logs.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>

              <form onSubmit={handleSendCloudShellAdjustment} className="flex gap-2 pt-2 border-t border-espresso-800">
                <input
                  type="text"
                  value={cloudShellCommandInput}
                  onChange={(e) => setCloudShellCommandInput(e.target.value)}
                  placeholder={`Envie uma instrução de ajuste para o agente ${activeImp.engine} ou comando bash...`}
                  className="flex-1 bg-espresso-900 border border-espresso-800 rounded-lg px-3 py-1.5 text-xs text-gold-100 placeholder-espresso-500 focus:outline-none focus:border-gold-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 font-extrabold text-xs cursor-pointer shadow-gold border border-gold-300"
                >
                  Ajustar Agente
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="m-auto text-xs font-mono text-espresso-400 flex flex-col items-center gap-2">
            <IconShieldAlert className="w-8 h-8 text-espresso-300" />
            <span>Selecione uma tarefa de auto-melhoria ao lado para inspecionar o CloudShell.</span>
          </div>
        )}
      </div>
    </div>
  );
}
