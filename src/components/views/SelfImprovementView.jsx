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
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto bg-beige-100 dark:bg-denim-950 text-espresso-900 dark:text-denim-100 transition-colors duration-150">
      {/* Coluna Esquerda (5/12): Configurações do Motor, Gatilhos e Lista de Tarefas */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto min-h-0">
        {/* Bloco 1: Painel de Controle do Motor de Auto-Melhoria */}
        <div className="p-4 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-800 dark:text-gold-300 flex items-center justify-center font-bold">
                <IconShieldAlert className="w-3.5 h-3.5 text-gold-700 dark:text-gold-400" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
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
              <span className={selfImpConfig.enabled ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-espresso-400 dark:text-denim-400'}>
                {selfImpConfig.enabled ? 'ATIVO' : 'PAUSADO'}
              </span>
            </label>
          </div>

          {/* Seletor de Motor Preferencial para Auto-Heal */}
          <div className="mb-3">
            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300 font-bold block mb-1">
              Motor Padrão de Diagnóstico & Correção:
            </span>
            <div className="grid grid-cols-3 gap-1 bg-beige-50 dark:bg-denim-900 p-1 rounded-lg border border-beige-300 dark:border-denim-700 text-xs">
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'claude' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer font-bold ${
                  selfImpConfig.preferredEngine === 'claude'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
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
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                Antigravity
              </button>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ preferredEngine: 'hybrid' })}
                className={`py-1 rounded font-mono text-[11px] transition cursor-pointer font-extrabold ${
                  selfImpConfig.preferredEngine === 'hybrid'
                    ? 'btn-gold shadow-xs'
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                ⚡ Híbrido
              </button>
            </div>
          </div>

          {/* Opções Avançadas de Auto-Heal */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex items-center justify-between">
              <span className="text-espresso-600 dark:text-denim-300 text-[11px] font-bold">Modo Contínuo:</span>
              <button
                type="button"
                onClick={() => updateSelfImprovementConfig({ continuousMode: !selfImpConfig.continuousMode })}
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer border ${
                  selfImpConfig.continuousMode
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-denim-800 text-espresso-600 dark:text-denim-300 border-beige-300 dark:border-denim-700'
                }`}
              >
                {selfImpConfig.continuousMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex items-center justify-between">
              <span className="text-espresso-600 dark:text-denim-300 text-[11px] font-bold">Threshold Gargalo:</span>
              <span className="text-gold-700 dark:text-gold-400 font-extrabold text-[11px]">
                {Math.round(selfImpConfig.bottleneckThresholdMs / 1000)}s
              </span>
            </div>
          </div>

          {/* Gatilho Manual de Melhoria */}
          <div className="pt-2 border-t border-beige-200 dark:border-denim-750">
            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300 font-bold block mb-1">
              Disparar Melhoria Manual via CloudShell:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customImprovementGoal}
                onChange={(e) => setCustomImprovementGoal(e.target.value)}
                placeholder="Ex: Otimizar latência do IPC em commands.rs"
                className="flex-1 bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-lg px-2.5 py-1 text-xs text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleTriggerCloudShellImprovement()}
                className="btn-gold px-3.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap cursor-pointer"
              >
                Disparar
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Lista de Tarefas de Auto-Melhoria */}
        <div className="flex-1 p-4 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-col min-h-0 overflow-hidden shadow-warm dark:shadow-denim">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono mb-3 flex items-center justify-between">
            <span>Fila de Melhorias ({Object.keys(improvements).length})</span>
            <span className="text-[10px] text-espresso-500 dark:text-denim-400 font-normal">Isolação Git Worktree</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {Object.values(improvements).length === 0 ? (
              <p className="text-xs text-espresso-500 dark:text-denim-400 font-mono">Nenhuma tarefa de melhoria ativa.</p>
            ) : (
              Object.values(improvements).map((imp) => {
                const isSelected = selectedImprovementId === imp.id;
                const statusBadge =
                  imp.status === 'ready_to_merge'
                    ? 'bg-gold-100 dark:bg-gold-950/70 text-gold-900 dark:text-gold-300 border-gold-300 dark:border-gold-700 font-extrabold'
                    : imp.status === 'running_cloudshell'
                    ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 animate-pulse font-bold'
                    : imp.status === 'validating_gate'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold'
                    : 'bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 border-beige-300 dark:border-denim-700';

                return (
                  <div
                    key={imp.id}
                    onClick={() => setSelectedImprovementId(imp.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-gold-50 dark:bg-gold-950/40 border-gold-500 shadow-gold'
                        : 'bg-beige-50/50 dark:bg-denim-900/60 border-beige-300 dark:border-denim-750 hover:border-gold-300 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                        {imp.source_notification_code || imp.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusBadge}`}>
                        {imp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-espresso-700 dark:text-denim-300 font-mono truncate mb-2">
                      Motor: <span className="font-bold text-espresso-950 dark:text-denim-100">{imp.engine}</span> • Worktree:{' '}
                      <span className="font-bold text-gold-700 dark:text-gold-400">{imp.worktree_path}</span>
                    </div>
                    {imp.diagnosis && (
                      <div className="text-[11px] text-espresso-800 dark:text-denim-200 bg-white dark:bg-denim-900 p-2 rounded-lg border border-beige-200 dark:border-denim-750 line-clamp-2 shadow-xs">
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
            <div className="p-4 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-wrap items-center justify-between gap-3 shadow-warm dark:shadow-denim">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                    {activeImp.source_notification_code || activeImp.id}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 font-bold">
                    Auto-Heal Session
                  </span>
                </div>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                  Worktree: <span className="font-bold text-espresso-950 dark:text-denim-100">{activeImp.worktree_path}</span> • Branch:{' '}
                  <span className="font-bold text-gold-700 dark:text-gold-400">{activeImp.branch_name}</span>
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
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-denim-800 hover:bg-beige-100 dark:hover:bg-denim-700 text-xs font-mono font-bold text-espresso-950 dark:text-denim-100 border border-beige-300 dark:border-denim-700 cursor-pointer shadow-xs"
                >
                  🔄 Alternar para {activeImp.engine === 'claude' ? 'Antigravity' : 'Claude'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onMergeImprovement) onMergeImprovement(activeImp);
                  }}
                  className="btn-gold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  ✓ Fazer Merge da Melhoria na Main
                </button>
              </div>
            </div>

            {/* Diagnóstico e Resumo do Patch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 shadow-xs">
                <div className="text-amber-800 dark:text-amber-400 font-extrabold mb-1">Diagnóstico da Causa Raiz:</div>
                <p className="text-espresso-700 dark:text-denim-200 text-[11px] leading-relaxed">{activeImp.diagnosis}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 shadow-xs">
                <div className="text-emerald-800 dark:text-emerald-400 font-extrabold mb-1">Patch & Validação Gate:</div>
                <p className="text-espresso-700 dark:text-denim-200 text-[11px] leading-relaxed">
                  {activeImp.patch_summary || 'Executando verificações determinísticas no CloudShell...'}
                </p>
              </div>
            </div>

            {/* Terminal CloudShell Interativo (Dark Denim profundo com Texto Dourado) */}
            <div className="flex-1 min-h-[320px] flex flex-col bg-espresso-950 dark:bg-denim-950 border border-espresso-800 dark:border-denim-750 rounded-xl p-3.5 font-mono text-xs overflow-hidden shadow-warm-lg dark:shadow-denim-lg">
              <div className="flex items-center justify-between text-[11px] text-espresso-400 dark:text-denim-300 border-b border-espresso-800 dark:border-denim-800 pb-2 mb-2">
                <span className="flex items-center gap-1.5 text-gold-400 font-bold">
                  <IconCloud className="w-3.5 h-3.5 text-gold-400" />
                  <span>CloudShell Worktree Terminal ({activeImp.worktree_path})</span>
                </span>
                <span>Zero-Copy Junction Ativa • Buffer Sincronizado</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-gold-200 dark:text-gold-200 mb-2 pr-1">
                {logs.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>

              <form onSubmit={handleSendCloudShellAdjustment} className="flex gap-2 pt-2 border-t border-espresso-800 dark:border-denim-800">
                <input
                  type="text"
                  value={cloudShellCommandInput}
                  onChange={(e) => setCloudShellCommandInput(e.target.value)}
                  placeholder={`Envie uma instrução de ajuste para o agente ${activeImp.engine} ou comando bash...`}
                  className="flex-1 bg-espresso-900 dark:bg-denim-900 border border-espresso-800 dark:border-denim-750 rounded-lg px-3 py-1.5 text-xs text-gold-100 placeholder-espresso-500 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500 font-mono"
                />
                <button
                  type="submit"
                  className="btn-gold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  Ajustar Agente
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="m-auto text-xs font-mono text-espresso-400 dark:text-denim-400 flex flex-col items-center gap-2">
            <IconShieldAlert className="w-8 h-8 text-espresso-300 dark:text-denim-600" />
            <span>Selecione uma tarefa de auto-melhoria ao lado para inspecionar o CloudShell.</span>
          </div>
        )}
      </div>
    </div>
  );
}
