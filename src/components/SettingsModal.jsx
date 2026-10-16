// src/components/SettingsModal.jsx
import React, { useState } from 'react';
import { IconCpu, IconShieldAlert, IconZap, IconCheck } from './Icons.jsx';

export default function SettingsModal({
  isOpen,
  onClose,
  provider,
  onChangeProvider,
  effort,
  onToggleEffort,
  maxTokensBudget,
  onChangeMaxTokensBudget
}) {
  const [copiedKeyHint, setCopiedKeyHint] = useState(false);
  const [activeTab, setActiveTab] = useState('stitch'); // 'stitch' | 'engines' | 'limits'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl shadow-violet-950/40 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-950/40 font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Configurações & Conectividade
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Google Stitch MCP, Motores Dual-Engine e Parâmetros do ADE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 border-b border-slate-800/80 bg-slate-950 flex gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('stitch')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stitch'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Stitch MCP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engines')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'engines'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Motores Dual-Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'limits'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tetos & Orçamento
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'stitch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <span>Status da Conexão:</span>
                      <span className="text-emerald-400">Conectado (Active HTTP SSE)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Endpoint: https://stitch.googleapis.com/mcp
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  HTTP SSE 200 OK
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    Chave de Autenticação (STITCH_API_KEY)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Carregada via .env (Protegida)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 flex items-center justify-between">
                  <span>Bearer AQ.AB...●●●●●●●●●●●●</span>
                  <span className="text-[10px] text-slate-500">.gitignore ativo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  A chave é alimentada automaticamente para o Claude Code CLI e Antigravity via <code>scripts/sync-stitch-mcp.cjs</code> e <code>.mcp.json</code> local.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-violet-300 font-semibold">Comandos de Diagnóstico MCP:</div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-cyan-300 select-all">
                  npm run mcp:stitch
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-cyan-300 select-all">
                  claude mcp get stitch
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engines' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white font-mono block">
                  Provedor Padrão para Subagentes:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeProvider('claude')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'claude'
                        ? 'border-orange-500 bg-orange-950/30 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-orange-400">Claude CLI</div>
                    <div className="text-[10px] text-slate-400 mt-1">Especialista em Refatoração & QA</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider('antigravity')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'antigravity'
                        ? 'border-blue-500 bg-blue-950/30 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-blue-400">Antigravity</div>
                    <div className="text-[10px] text-slate-400 mt-1">Especialista em Exploração & 3D</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider('hybrid')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'hybrid'
                        ? 'border-violet-500 bg-violet-950/30 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-violet-400">Híbrido Auto</div>
                    <div className="text-[10px] text-slate-400 mt-1">Roteia pela skill ideal do Squad</div>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white font-mono block">
                  Nível de Esforço Cognitivo:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleEffort('high')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      effort === 'high'
                        ? 'border-amber-500 bg-amber-950/30 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-amber-400">High Effort</div>
                    <div className="text-[10px] text-slate-400 mt-1">Foco rápido e direto</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleEffort('ultracode')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      effort === 'ultracode'
                        ? 'border-violet-500 bg-violet-950/30 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-violet-400">⚡ Ultracode Multi-Agent</div>
                    <div className="text-[10px] text-slate-400 mt-1">Harness máximo com DAG em worktrees</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    Teto Máximo de Tokens por Run
                  </span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {maxTokensBudget.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="5000"
                  value={maxTokensBudget}
                  onChange={(e) => onChangeMaxTokensBudget(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>10.000 (Rápido)</span>
                  <span>50.000 (Padrão)</span>
                  <span>200.000 (Complexo)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-300 font-semibold">Git Worktrees & Concurrency:</div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Pool de Worktrees:</span>
                  <span className="text-white">3 ativas (Zero-Copy Junctions)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Limite de Agentes Paralelos:</span>
                  <span className="text-white">16 concorrentes</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Timeout de Gate Determinístico:</span>
                  <span className="text-white">300 segundos</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
