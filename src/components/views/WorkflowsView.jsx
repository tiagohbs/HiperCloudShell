// src/components/views/WorkflowsView.jsx
import React, { useState, useEffect } from 'react';
import {
  IconZap,
  IconTerminal,
  IconCpu,
  IconShieldAlert,
  IconCheck,
  IconPlus
} from '../Icons.jsx';

export default function WorkflowsView({
  workflowRuns = {},
  selectedRunId,
  onSelectRun,
  editingScript,
  setEditingScript,
  onApproveRun,
  onPauseRun,
  onResumeRun,
  onSaveWorkflow,
  maxTokensBudget,
  setMaxTokensBudget,
  activePtyTerm,
  setActivePtyTerm,
  ptyBuffer,
  ptyInput,
  setPtyInput,
  onSendPtyInput,
  onTakeoverAgent,
  onOpenNewWorkflow,
  onOpenApprovalGate
}) {
  const [activeTab, setActiveTab] = useState('script'); // 'script' | 'agents' | 'result'
  const runsList = Object.values(workflowRuns);
  const activeRun = selectedRunId ? workflowRuns[selectedRunId] : runsList[0] || null;

  useEffect(() => {
    if (activeRun?.script && (!editingScript || editingScript.trim() === '')) {
      setEditingScript(activeRun.script);
    }
  }, [activeRun?.id, activeRun?.script]);

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-beige-100 dark:bg-denim-900 text-espresso-900 dark:text-denim-50 transition-colors duration-150">
      {/* Left Sidebar (Runs List) */}
      <div className="w-full md:w-80 flex-shrink-0 bg-beige-150 dark:bg-denim-950 border-r border-beige-300 dark:border-denim-800 flex flex-col min-h-0">
        <div className="p-3.5 border-b border-beige-300 dark:border-denim-800 flex items-center justify-between bg-beige-100/60 dark:bg-denim-900/60">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-1.5">
              <IconZap className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              <span>Execuções Ativas</span>
            </h2>
            <span className="text-[10px] text-espresso-600 dark:text-denim-400 font-mono">
              {runsList.length} {runsList.length === 1 ? 'workflow' : 'workflows'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="p-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/40 text-gold-900 dark:text-gold-300 border border-gold-400 dark:border-gold-700 text-xs transition cursor-pointer font-bold shadow-xs"
            title="Novo Workflow (Ctrl+K)"
          >
            <IconPlus className="w-3.5 h-3.5 text-espresso-950 dark:text-gold-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {runsList.length === 0 ? (
            <div className="p-6 text-center text-espresso-500 dark:text-denim-400 font-mono text-xs">
              Nenhum workflow ativo. Clique em "+ Novo Workflow" para iniciar.
            </div>
          ) : (
            runsList.map((run) => {
              const isSelected = activeRun?.id === run.id;
              return (
                <div
                  key={run.id}
                  onClick={() => {
                    onSelectRun(run.id);
                    if (run.script) setEditingScript(run.script);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                    isSelected
                      ? 'border-gold-500 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim'
                      : 'border-beige-300 dark:border-denim-800 bg-white/70 dark:bg-denim-900/70 hover:border-gold-300 dark:hover:border-denim-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-espresso-950 dark:text-white font-mono truncate mr-2">
                      {run.meta?.name || run.id}
                    </span>
                    <span
                      className={`uppercase text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold border whitespace-nowrap ${
                        run.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : run.status === 'pending_approval'
                          ? 'bg-gold-100 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 border-gold-400 dark:border-gold-600 animate-pulse'
                          : run.status === 'running'
                          ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                          : 'bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 border-beige-300 dark:border-denim-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <p className="text-espresso-700 dark:text-denim-200 truncate text-[11px] font-mono">{run.prompt}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400 pt-1.5 border-t border-beige-200 dark:border-denim-800">
                    <span>Fase: <strong className="text-espresso-900 dark:text-denim-100">{run.currentPhase || 'N/A'}</strong></span>
                    <span>Agentes: {run.activeAgentsCount || 0}/16</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area (Run Inspector & Editor) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-beige-50 dark:bg-denim-900">
        {!activeRun ? (
          <div className="flex-1 flex flex-col items-center justify-center text-espresso-400 dark:text-denim-500 font-mono text-xs p-6">
            <IconZap className="w-10 h-10 text-espresso-300 dark:text-denim-700 mb-3" />
            <p>Selecione um workflow na lista ou crie um novo para inspecionar.</p>
          </div>
        ) : (
          <>
            {/* Topbar of Selected Run */}
            <div className="p-4 border-b border-beige-300 dark:border-denim-800 bg-white dark:bg-denim-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-white font-mono">{activeRun.meta?.name || activeRun.id}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/80 text-gold-900 dark:text-gold-300 border border-gold-300 dark:border-gold-700 font-bold">
                    Fase: {activeRun.currentPhase || 'Pronto'}
                  </span>
                </div>
                <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5 truncate max-w-xl">
                  {activeRun.prompt}
                </p>
              </div>

              {/* Action Buttons for Run */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750 px-2.5 py-1 rounded-lg text-xs font-mono">
                  <span className="text-[10px] text-espresso-600 dark:text-denim-400">Teto Tokens:</span>
                  <input
                    type="number"
                    value={maxTokensBudget}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setMaxTokensBudget(val);
                      const bridge = window.ultracodeAPI || window.hiperAPI;
                      if (bridge?.setTokenBudget) bridge.setTokenBudget(activeRun.id, val);
                    }}
                    step={10000}
                    className="w-20 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-gold-800 dark:text-gold-300 font-bold focus:outline-none"
                  />
                </div>

                {activeRun.status === 'pending_approval' && (
                  <button
                    type="button"
                    onClick={() => onOpenApprovalGate(activeRun)}
                    className="btn-gold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                    <span>Quality Gate & Aprovação</span>
                  </button>
                )}

                {activeRun.status === 'running' && (
                  <button
                    type="button"
                    onClick={() => onPauseRun(activeRun.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                  >
                    Pausar
                  </button>
                )}

                {activeRun.status === 'paused' && (
                  <button
                    type="button"
                    onClick={() => onResumeRun(activeRun.id)}
                    className="btn-gold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    Retomar (Cache)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSaveWorkflow(activeRun.id, activeRun.meta?.name)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-denim-800 hover:bg-beige-100 dark:hover:bg-denim-750 text-xs font-bold border border-beige-300 dark:border-denim-700 text-espresso-800 dark:text-denim-100 transition cursor-pointer shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Sub-tabs header */}
            <div className="px-4 border-b border-beige-300 dark:border-denim-800 bg-beige-100/70 dark:bg-denim-950/70 flex gap-4 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('script')}
                className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
                  activeTab === 'script'
                    ? 'border-gold-500 text-espresso-950 dark:text-white'
                    : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                Sandbox JavaScript (node:vm)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('agents')}
                className={`py-2.5 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'agents'
                    ? 'border-gold-500 text-espresso-950 dark:text-white'
                    : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                <span>Subagentes ({activeRun.agents?.length || 0})</span>
                {activePtyTerm && <span className="w-1.5 h-1.5 rounded-full bg-gold-600 dark:bg-gold-400 animate-pulse" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
                  activeTab === 'result'
                    ? 'border-gold-500 text-espresso-950 dark:text-white'
                    : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                Resultado Consolidado
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {activeTab === 'script' && (
                <div className="flex flex-col h-full min-h-[350px]">
                  <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400 mb-2 flex items-center justify-between">
                    <span>Script Determinístico JavaScript (Executado no sandbox seguro node:vm):</span>
                    {activeRun.status === 'pending_approval' && (
                      <span className="text-gold-700 dark:text-gold-400 font-bold">Modo Edição Habilitado</span>
                    )}
                  </div>
                  <textarea
                    value={editingScript || activeRun?.script || ''}
                    onChange={(e) => setEditingScript(e.target.value)}
                    disabled={activeRun.status !== 'pending_approval'}
                    rows={16}
                    className="flex-1 w-full bg-espresso-950 dark:bg-denim-950 border border-espresso-800 dark:border-denim-750 rounded-xl p-3.5 font-mono text-xs text-gold-200 dark:text-gold-300 focus:outline-none focus:border-gold-500 resize-none shadow-warm dark:shadow-denim"
                  />
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-4">
                  {/* Agents list */}
                  <div className="space-y-2.5">
                    {(!activeRun.agents || activeRun.agents.length === 0) ? (
                      <div className="p-8 text-center text-espresso-600 dark:text-denim-300 font-mono text-xs border border-dashed border-beige-300 dark:border-denim-750 rounded-xl bg-white dark:bg-denim-850 space-y-2">
                        <div className="font-bold text-espresso-950 dark:text-denim-100">
                          Fase Ativa: {activeRun.currentPhase || 'Planejamento Inicial'}
                        </div>
                        <p className="text-[11px] text-espresso-500 dark:text-denim-400 max-w-md mx-auto">
                          O orquestrador está estruturando o DAG de tarefas para esta missão.
                          Subagentes aparecerão aqui com telemetria viva de tokens, worktree e ConPTY.
                        </p>
                      </div>
                    ) : (
                      activeRun.agents.map((ag) => (
                        <div
                          key={ag.id}
                          className="p-3 bg-white dark:bg-denim-850 rounded-xl border border-beige-300 dark:border-denim-750 text-xs flex flex-col gap-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                                  ag.provider === 'antigravity'
                                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                    : ag.provider === 'claude'
                                    ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                                    : 'bg-gold-100 dark:bg-gold-950/70 text-gold-900 dark:text-gold-300 border border-gold-300 dark:border-gold-700'
                                }`}
                              >
                                {ag.provider === 'antigravity' ? 'agy' : ag.provider === 'claude' ? 'claude' : 'hybrid'}
                              </span>
                              <span className="font-extrabold text-espresso-950 dark:text-white font-mono">{ag.label}</span>
                              <span className="text-[10px] text-espresso-500 dark:text-denim-400 font-mono">[{ag.phase}]</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {ag.tokens && (
                                <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300 font-bold">{ag.tokens} tok</span>
                              )}
                              <button
                                type="button"
                                onClick={() => onTakeoverAgent(ag)}
                                className="px-2.5 py-1 rounded bg-gold-100 dark:bg-gold-950/70 hover:bg-gold-200 dark:hover:bg-gold-900 text-[10px] text-gold-900 dark:text-gold-300 font-extrabold transition cursor-pointer flex items-center gap-1 border border-gold-300 dark:border-gold-700 shadow-xs"
                              >
                                <span>⚡ Assumir ConPTY</span>
                              </button>
                              <span
                                className={`text-[10px] uppercase font-mono font-extrabold ${
                                  ag.status === 'completed'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : ag.status === 'failed'
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {ag.status}
                              </span>
                            </div>
                          </div>

                          {ag.logs && ag.logs.length > 0 && (
                            <div className="font-mono text-[10px] text-espresso-700 dark:text-denim-300 bg-beige-50 dark:bg-denim-900 px-2.5 py-1.5 rounded-lg truncate border border-beige-200 dark:border-denim-800">
                              {ag.logs[ag.logs.length - 1].text}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hot Takeover Interactive Terminal */}
                  {activePtyTerm && (
                    <div className="bg-espresso-950 dark:bg-denim-950 border border-gold-500/80 rounded-xl p-4 font-mono text-xs shadow-warm-lg dark:shadow-denim-lg">
                      <div className="flex justify-between items-center border-b border-espresso-800 dark:border-denim-800 pb-2 mb-2">
                        <span className="text-gold-400 font-bold flex items-center gap-1.5">
                          <IconZap className="w-3.5 h-3.5 text-gold-400" />
                          <span>PTY Live Takeover: {activePtyTerm.label} ({activePtyTerm.provider})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePtyTerm(null)}
                          className="px-2.5 py-0.5 rounded bg-espresso-800 dark:bg-denim-800 hover:bg-espresso-700 text-espresso-200 dark:text-denim-200 text-[11px] transition cursor-pointer"
                        >
                          ✕ Fechar Takeover
                        </button>
                      </div>

                      <pre className="h-40 overflow-y-auto text-gold-200 whitespace-pre-wrap mb-2 text-[11px] bg-espresso-900 dark:bg-denim-900 p-2.5 rounded-lg border border-espresso-800 dark:border-denim-800">
                        {ptyBuffer || 'Aguardando saída do processo...'}
                      </pre>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (onSendPtyInput) onSendPtyInput(activePtyTerm.termId, ptyInput);
                          setPtyInput('');
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={ptyInput}
                          onChange={(e) => setPtyInput(e.target.value)}
                          placeholder="Envie instruções diretamente para a sessão do subagente..."
                          className="flex-1 bg-espresso-900 dark:bg-denim-900 border border-espresso-800 dark:border-denim-800 rounded-lg px-3 py-1.5 text-gold-100 text-xs focus:outline-none focus:border-gold-500 font-mono"
                        />
                        <button
                          type="submit"
                          className="btn-gold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
                        >
                          Enviar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'result' && (
                <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 text-xs font-mono space-y-2 shadow-xs">
                  <div className="text-gold-700 dark:text-gold-400 font-extrabold flex items-center gap-2">
                    <IconCheck className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                    <span>Resultado Consolidado da Execução:</span>
                  </div>
                  <pre className="p-3 bg-beige-50 dark:bg-denim-900 rounded-lg border border-beige-300 dark:border-denim-750 text-espresso-950 dark:text-denim-50 text-[11px] whitespace-pre-wrap overflow-x-auto max-h-96">
                    {activeRun.finalResult
                      ? typeof activeRun.finalResult === 'string'
                        ? activeRun.finalResult
                        : JSON.stringify(activeRun.finalResult, null, 2)
                      : 'Nenhum resultado final disponível até o momento.'}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
