// src/components/views/WorkflowsView.jsx
import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('script'); // 'script' | 'agents' | 'dag' | 'result'
  const runsList = Object.values(workflowRuns);
  const activeRun = selectedRunId ? workflowRuns[selectedRunId] : runsList[0] || null;

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#06080c]">
      {/* Left Sidebar (Runs List) */}
      <div className="w-full md:w-80 flex-shrink-0 bg-[#090d15] border-r border-slate-800 flex flex-col min-h-0">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <IconZap className="w-3.5 h-3.5 text-violet-400" />
              <span>Execuções Ativas</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              {runsList.length} {runsList.length === 1 ? 'workflow' : 'workflows'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="p-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/60 text-violet-200 border border-violet-500/40 text-xs transition cursor-pointer"
            title="Novo Workflow (Ctrl+K)"
          >
            <IconPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {runsList.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">
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
                      ? 'border-violet-500 bg-violet-950/25 shadow-md shadow-violet-950/30'
                      : 'border-slate-800/90 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white font-mono truncate mr-2">
                      {run.meta?.name || run.id}
                    </span>
                    <span
                      className={`uppercase text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border whitespace-nowrap ${
                        run.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : run.status === 'pending_approval'
                          ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                          : run.status === 'running'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <p className="text-slate-400 truncate text-[11px] font-mono">{run.prompt}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/60">
                    <span>Fase: <strong className="text-slate-400">{run.currentPhase || 'N/A'}</strong></span>
                    <span>Agentes: {run.activeAgentsCount || 0}/16</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area (Run Inspector & Editor) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0e16]">
        {!activeRun ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-xs p-6">
            <IconZap className="w-10 h-10 text-slate-700 mb-3" />
            <p>Selecione um workflow na lista ou crie um novo para inspecionar.</p>
          </div>
        ) : (
          <>
            {/* Topbar of Selected Run */}
            <div className="p-4 border-b border-slate-800 bg-[#0c101a] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono">{activeRun.meta?.name || activeRun.id}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Fase: {activeRun.currentPhase || 'Pronto'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                  {activeRun.prompt}
                </p>
              </div>

              {/* Action Buttons for Run */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
                  <span className="text-[10px] text-slate-400">Teto Tokens:</span>
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
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-cyan-300 focus:outline-none"
                  />
                </div>

                {activeRun.status === 'pending_approval' && (
                  <button
                    type="button"
                    onClick={() => onOpenApprovalGate(activeRun)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Quality Gate & Aprovação</span>
                  </button>
                )}

                {activeRun.status === 'running' && (
                  <button
                    type="button"
                    onClick={() => onPauseRun(activeRun.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Pausar
                  </button>
                )}

                {activeRun.status === 'paused' && (
                  <button
                    type="button"
                    onClick={() => onResumeRun(activeRun.id)}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Retomar (Cache)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSaveWorkflow(activeRun.id, activeRun.meta?.name)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 text-slate-200 transition cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Sub-tabs header */}
            <div className="px-4 border-b border-slate-800 bg-slate-950/80 flex gap-4 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('script')}
                className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
                  activeTab === 'script'
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sandbox JavaScript (node:vm)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('agents')}
                className={`py-2.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'agents'
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Subagentes ({activeRun.agents?.length || 0})</span>
                {activePtyTerm && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
                  activeTab === 'result'
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Resultado Consolidado
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {activeTab === 'script' && (
                <div className="flex flex-col h-full min-h-[350px]">
                  <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                    <span>Script Determinístico JavaScript (Executado no sandbox seguro node:vm):</span>
                    {activeRun.status === 'pending_approval' && (
                      <span className="text-amber-400">Modo Edição Habilitado</span>
                    )}
                  </div>
                  <textarea
                    value={editingScript}
                    onChange={(e) => setEditingScript(e.target.value)}
                    disabled={activeRun.status !== 'pending_approval'}
                    rows={16}
                    className="flex-1 w-full bg-[#05070a] border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-violet-200 focus:outline-none focus:border-violet-500 resize-none shadow-inner"
                  />
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-4">
                  {/* Agents list */}
                  <div className="space-y-2.5">
                    {(!activeRun.agents || activeRun.agents.length === 0) ? (
                      <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                        Nenhum subagente despachado para esta fase ainda.
                      </div>
                    ) : (
                      activeRun.agents.map((ag) => (
                        <div
                          key={ag.id}
                          className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                                  ag.provider === 'antigravity'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : ag.provider === 'claude'
                                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                                    : 'bg-violet-950 text-violet-300 border border-violet-800'
                                }`}
                              >
                                {ag.provider === 'antigravity' ? 'agy' : ag.provider === 'claude' ? 'claude' : 'hybrid'}
                              </span>
                              <span className="font-semibold text-slate-200 font-mono">{ag.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">[{ag.phase}]</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {ag.tokens && (
                                <span className="text-[10px] font-mono text-slate-400">{ag.tokens} tok</span>
                              )}
                              <button
                                type="button"
                                onClick={() => onTakeoverAgent(ag)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-600 text-[10px] text-slate-200 font-semibold transition cursor-pointer flex items-center gap-1"
                              >
                                <span>⚡ Assumir ConPTY</span>
                              </button>
                              <span
                                className={`text-[10px] uppercase font-mono font-semibold ${
                                  ag.status === 'completed'
                                    ? 'text-emerald-400'
                                    : ag.status === 'failed'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {ag.status}
                              </span>
                            </div>
                          </div>

                          {ag.logs && ag.logs.length > 0 && (
                            <div className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg truncate border border-slate-800">
                              {ag.logs[ag.logs.length - 1].text}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hot Takeover Interactive Terminal */}
                  {activePtyTerm && (
                    <div className="bg-black border border-violet-700/80 rounded-xl p-4 font-mono text-xs shadow-xl shadow-violet-950/40">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <span className="text-violet-400 font-bold flex items-center gap-1.5">
                          <IconZap className="w-3.5 h-3.5" />
                          <span>PTY Live Takeover: {activePtyTerm.label} ({activePtyTerm.provider})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePtyTerm(null)}
                          className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                        >
                          ✕ Fechar Takeover
                        </button>
                      </div>

                      <pre className="h-40 overflow-y-auto text-emerald-400 whitespace-pre-wrap mb-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-900">
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
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-violet-500 font-mono"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Enviar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'result' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <IconCheck className="w-4 h-4" />
                    <span>Resultado Consolidado da Execução:</span>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-lg border border-slate-900 text-slate-300 text-[11px] whitespace-pre-wrap overflow-x-auto max-h-96">
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
