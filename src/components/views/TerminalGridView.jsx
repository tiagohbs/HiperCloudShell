// src/components/views/TerminalGridView.jsx
import React, { useState } from 'react';
import {
  IconTerminal,
  IconGitBranch,
  IconShieldAlert,
  IconCheck,
  IconZap
} from '../Icons.jsx';

export default function TerminalGridView({
  taskList = [],
  paneLogs = {},
  paneInputs = {},
  onPaneInputChange,
  onPaneInputSubmit,
  blackboard = {},
  circuitAlerts = [],
  generateTaskSpecMarkdown
}) {
  const [gridLayout, setGridLayout] = useState('2x2'); // '1x1' | '2x2' | '3x2'
  const [focusedPaneId, setFocusedPaneId] = useState('pane-1');
  const [rightTab, setRightTab] = useState('blackboard'); // 'blackboard' | 'worktrees' | 'spec'
  const [selectedSpecTaskId, setSelectedSpecTaskId] = useState('T1_ARCHITECT');

  const visibleTasks =
    gridLayout === '1x1'
      ? taskList.filter((t) => t.paneId === focusedPaneId)
      : taskList;

  const currentSpecTask = taskList.find((t) => t.id === selectedSpecTaskId) || taskList[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#06080c]">
      {/* Sub-header Toolbar */}
      <div className="p-3 border-b border-slate-800 bg-[#090d15] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Layout switcher & Focus */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Layout PTY:</span>
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {['1x1', '2x2', '3x2'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setGridLayout(l)}
                className={`px-2.5 py-1 rounded text-[11px] transition cursor-pointer ${
                  gridLayout === l
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {gridLayout === '1x1' && (
            <select
              value={focusedPaneId}
              onChange={(e) => setFocusedPaneId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              {taskList.map((t) => (
                <option key={t.paneId} value={t.paneId}>
                  Focar: {t.agentName} ({t.paneId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Tab switch for info panel */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setRightTab('blackboard')}
            className={`px-3 py-1 rounded text-[11px] transition cursor-pointer ${
              rightTab === 'blackboard'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blackboard (.json)
          </button>
          <button
            type="button"
            onClick={() => setRightTab('worktrees')}
            className={`px-3 py-1 rounded text-[11px] transition cursor-pointer ${
              rightTab === 'worktrees'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Worktrees (3)
          </button>
          <button
            type="button"
            onClick={() => setRightTab('spec')}
            className={`px-3 py-1 rounded text-[11px] transition cursor-pointer ${
              rightTab === 'spec'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task Spec MD
          </button>
        </div>
      </div>

      {/* Main Grid Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Terminals Area (7/12) */}
        <div
          className={`lg:col-span-7 p-3 grid gap-3 overflow-y-auto min-h-0 ${
            gridLayout === '1x1'
              ? 'grid-cols-1'
              : gridLayout === '3x2'
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {visibleTasks.map((task) => (
            <div
              key={task.paneId}
              className="flex flex-col rounded-xl border border-slate-800 bg-[#0b0f17] overflow-hidden shadow-lg h-[280px]"
            >
              {/* Terminal Title Bar */}
              <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.color }} />
                  <span className="font-bold text-white font-mono">{task.agentName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {task.cli}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-fuchsia-300">{task.branch}</span>
              </div>

              {/* Terminal Logs Window */}
              <div className="p-3 font-mono text-[11px] bg-[#05070a] flex-1 overflow-y-auto space-y-1">
                {(paneLogs[task.paneId] || []).map((logLine, idx) => (
                  <div key={idx} className="text-slate-300 whitespace-pre-wrap leading-tight">
                    {logLine}
                  </div>
                ))}
              </div>

              {/* Terminal Quick Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onPaneInputSubmit) onPaneInputSubmit(task.paneId);
                }}
                className="flex border-t border-slate-800 bg-slate-950 p-1.5 gap-1.5"
              >
                <input
                  type="text"
                  value={paneInputs[task.paneId] || ''}
                  onChange={(e) => {
                    if (onPaneInputChange) onPaneInputChange(task.paneId, e.target.value);
                  }}
                  placeholder={`$ comando para ${task.paneId}...`}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-[10px] font-mono font-semibold text-slate-200 transition cursor-pointer"
                >
                  Enviar
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* Info Area (5/12) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#090d14] flex flex-col min-h-0 overflow-hidden">
          {rightTab === 'blackboard' && (
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Blackboard JSON (.maestro/blackboard.json)
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Merkle Hash Verificado</span>
              </div>
              <pre className="flex-1 p-3 rounded-xl bg-[#05070a] border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-auto shadow-inner">
                {JSON.stringify(blackboard, null, 2)}
              </pre>
            </div>
          )}

          {rightTab === 'worktrees' && (
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Pool de Git Worktrees (Zero-Copy Junctions)
              </h3>
              <div className="space-y-2">
                {taskList.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{task.worktree}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Ativa
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">Branch: <strong className="text-cyan-300">{task.branch}</strong></div>
                    <div className="text-slate-400 text-[11px]">Role: <span className="text-violet-300">{task.roleId}</span></div>
                    <div className="text-slate-500 text-[10px]">Gate: <code>{task.gateCommand}</code></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab === 'spec' && currentSpecTask && (
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 font-mono">
                  Task Spec (Zero-Exploration)
                </h3>
                <select
                  value={selectedSpecTaskId}
                  onChange={(e) => setSelectedSpecTaskId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono text-slate-200"
                >
                  {taskList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </select>
              </div>
              <pre className="flex-1 p-3 rounded-xl bg-[#05070a] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap">
                {generateTaskSpecMarkdown
                  ? generateTaskSpecMarkdown(currentSpecTask, blackboard.sharedArtifacts?.contracts || [])
                  : 'Especificação determinística gerada para a worktree.'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
