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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-beige-100 dark:bg-denim-900 text-espresso-900 dark:text-denim-50 transition-colors duration-150">
      {/* Sub-header Toolbar */}
      <div className="p-3 border-b border-beige-300 dark:border-denim-800 bg-white dark:bg-denim-950 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs">
        {/* Left: Layout switcher & Focus */}
        <div className="flex items-center gap-2">
          <span className="text-espresso-600 dark:text-denim-300 font-bold">Layout PTY:</span>
          <div className="flex bg-beige-200 dark:bg-denim-900 border border-beige-300 dark:border-denim-800 rounded-lg p-0.5">
            {['1x1', '2x2', '3x2'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setGridLayout(l)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  gridLayout === l
                    ? 'bg-gold-500 text-espresso-950 shadow-gold'
                    : 'text-espresso-700 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
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
              className="bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded px-2 py-1 text-espresso-950 dark:text-denim-100 text-xs font-bold focus:outline-none"
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
        <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-900 border border-beige-300 dark:border-denim-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setRightTab('blackboard')}
            className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              rightTab === 'blackboard'
                ? 'bg-white dark:bg-denim-800 text-espresso-950 dark:text-denim-50 shadow-xs'
                : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Blackboard (.json)
          </button>
          <button
            type="button"
            onClick={() => setRightTab('worktrees')}
            className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              rightTab === 'worktrees'
                ? 'bg-white dark:bg-denim-800 text-espresso-950 dark:text-denim-50 shadow-xs'
                : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Worktrees (3)
          </button>
          <button
            type="button"
            onClick={() => setRightTab('spec')}
            className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              rightTab === 'spec'
                ? 'bg-white dark:bg-denim-800 text-espresso-950 dark:text-denim-50 shadow-xs'
                : 'text-espresso-600 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50'
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
              className="flex flex-col rounded-xl border border-beige-300 dark:border-denim-750 bg-white dark:bg-denim-850 overflow-hidden shadow-warm dark:shadow-denim h-[280px]"
            >
              {/* Terminal Title Bar */}
              <div className="px-3 py-2 bg-beige-100 dark:bg-denim-900 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.color }} />
                  <span className="font-extrabold text-espresso-950 dark:text-white font-mono">{task.agentName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-denim-800 text-espresso-800 dark:text-denim-200 border border-beige-300 dark:border-denim-700 font-bold">
                    {task.cli}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gold-800 dark:text-gold-400 font-bold">{task.branch}</span>
              </div>

              {/* Terminal Logs Window (Deep Espresso Obsidian / Denim com Texto Dourado/Creme) */}
              <div className="p-3 font-mono text-[11px] bg-espresso-950 dark:bg-denim-950 flex-1 overflow-y-auto space-y-1">
                {(paneLogs[task.paneId] || []).map((logLine, idx) => (
                  <div key={idx} className="text-gold-200 dark:text-gold-300 whitespace-pre-wrap leading-tight">
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
                className="flex border-t border-espresso-900 dark:border-denim-850 bg-espresso-950 dark:bg-denim-950 p-1.5 gap-1.5"
              >
                <input
                  type="text"
                  value={paneInputs[task.paneId] || ''}
                  onChange={(e) => {
                    if (onPaneInputChange) onPaneInputChange(task.paneId, e.target.value);
                  }}
                  placeholder={`$ comando para ${task.paneId}...`}
                  className="flex-1 bg-espresso-900 dark:bg-denim-900 px-2 text-xs font-mono text-gold-100 dark:text-denim-100 placeholder-espresso-500 dark:placeholder-denim-500 rounded focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-gold-500 hover:bg-gold-400 text-[10px] font-mono font-bold text-espresso-950 transition cursor-pointer shadow-gold"
                >
                  Enviar
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* Info Area (5/12) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-beige-300 dark:border-denim-800 bg-beige-50 dark:bg-denim-950 flex flex-col min-h-0 overflow-hidden">
          {rightTab === 'blackboard' && (
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-white font-mono">
                  Blackboard JSON (.maestro/blackboard.json)
                </h3>
                <span className="text-[10px] font-mono text-gold-700 dark:text-gold-300 font-bold bg-gold-100 dark:bg-gold-950/80 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
                  Merkle Hash Verificado
                </span>
              </div>
              <pre className="flex-1 p-3 rounded-xl bg-espresso-950 dark:bg-denim-900 border border-espresso-800 dark:border-denim-750 text-[11px] font-mono text-gold-200 dark:text-gold-300 overflow-auto shadow-warm dark:shadow-denim">
                {JSON.stringify(blackboard, null, 2)}
              </pre>
            </div>
          )}

          {rightTab === 'worktrees' && (
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-white font-mono">
                Pool de Git Worktrees (Zero-Copy Junctions)
              </h3>
              <div className="space-y-2">
                {taskList.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-750 text-xs font-mono space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-espresso-950 dark:text-white">{task.worktree}</span>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-bold">
                        Ativa
                      </span>
                    </div>
                    <div className="text-espresso-700 dark:text-denim-200 text-[11px]">Branch: <strong className="text-gold-700 dark:text-gold-400">{task.branch}</strong></div>
                    <div className="text-espresso-700 dark:text-denim-200 text-[11px]">Role: <span className="text-espresso-950 dark:text-white font-bold">{task.roleId}</span></div>
                    <div className="text-espresso-500 dark:text-denim-400 text-[10px]">Gate: <code>{task.gateCommand}</code></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab === 'spec' && currentSpecTask && (
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-white font-mono">
                  Task Spec (Zero-Exploration)
                </h3>
                <select
                  value={selectedSpecTaskId}
                  onChange={(e) => setSelectedSpecTaskId(e.target.value)}
                  className="bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded px-2 py-0.5 text-[11px] font-mono text-espresso-950 dark:text-denim-100 font-bold"
                >
                  {taskList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </select>
              </div>
              <pre className="flex-1 p-3.5 rounded-xl bg-white dark:bg-denim-900 border border-beige-300 dark:border-denim-750 text-[11px] font-mono text-espresso-800 dark:text-denim-200 overflow-auto whitespace-pre-wrap shadow-xs">
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
