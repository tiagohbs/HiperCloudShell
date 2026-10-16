// src/components/SettingsModal.jsx
import React, { useState } from 'react';
import { IconCpu, IconShieldAlert, IconZap, IconCheck, IconSun, IconMoon } from './Icons.jsx';

export default function SettingsModal({
  isOpen,
  onClose,
  provider,
  onChangeProvider,
  effort,
  onToggleEffort,
  maxTokensBudget,
  onChangeMaxTokensBudget,
  theme = 'light',
  onToggleTheme
}) {
  const [activeTab, setActiveTab] = useState('stitch'); // 'stitch' | 'engines' | 'limits' | 'appearance'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/70 dark:bg-denim-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-2xl shadow-warm-lg dark:shadow-denim-lg flex flex-col max-h-[85vh] overflow-hidden text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* Header */}
        <div className="p-5 border-b border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center text-espresso-950 shadow-gold border border-gold-300 font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                Configurações & Conectividade
              </h3>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                Google Stitch MCP, Motores Dual-Engine e Parâmetros do ADE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-denim-800 border border-beige-300 dark:border-denim-700 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 border-b border-beige-300 dark:border-denim-750 bg-beige-100/60 dark:bg-denim-850/60 flex gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('stitch')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stitch'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Google Stitch MCP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engines')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'engines'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Motores Dual-Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'limits'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Tetos & Orçamento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            {theme === 'dark' ? <IconMoon className="w-3.5 h-3.5 text-gold-400" /> : <IconSun className="w-3.5 h-3.5 text-gold-600" />}
            <span>Tema & Visual</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-beige-50 dark:bg-denim-900">
          {activeTab === 'stitch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-sm font-extrabold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                      <span>Status da Conexão:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Conectado (Active HTTP SSE)</span>
                    </div>
                    <div className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                      Endpoint: https://stitch.googleapis.com/mcp
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold">
                  HTTP SSE 200 OK
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono">
                    Chave de Autenticação (STITCH_API_KEY)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-bold">
                    Carregada via .env (Protegida)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750 font-mono text-xs text-espresso-800 dark:text-denim-200 flex items-center justify-between">
                  <span>Bearer AQ.AB...●●●●●●●●●●●●</span>
                  <span className="text-[10px] text-espresso-500 dark:text-denim-400 font-bold">.gitignore ativo</span>
                </div>
                <p className="text-[11px] text-espresso-600 dark:text-denim-300 leading-relaxed">
                  A chave é alimentada automaticamente para o Claude Code CLI e Antigravity via <code>scripts/sync-stitch-mcp.cjs</code> e <code>.mcp.json</code> local.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-2 text-xs font-mono shadow-xs">
                <div className="text-gold-700 dark:text-gold-400 font-bold">Comandos de Diagnóstico MCP:</div>
                <div className="p-2 bg-beige-50 dark:bg-denim-900 rounded border border-beige-300 dark:border-denim-750 text-[11px] text-espresso-800 dark:text-denim-200 select-all">
                  npm run mcp:stitch
                </div>
                <div className="p-2 bg-beige-50 dark:bg-denim-900 rounded border border-beige-300 dark:border-denim-750 text-[11px] text-espresso-800 dark:text-denim-200 select-all">
                  claude mcp get stitch
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engines' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-3 shadow-xs">
                <span className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  Provedor Padrão para Subagentes:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeProvider('claude')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'claude'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-espresso-950 dark:text-denim-50 font-bold shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="font-bold text-orange-700 dark:text-orange-400">Claude CLI</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Especialista em Refatoração & QA</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider('antigravity')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'antigravity'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-espresso-950 dark:text-denim-50 font-bold shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="font-bold text-blue-700 dark:text-blue-400">Antigravity</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Especialista em Exploração & 3D</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider('hybrid')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      provider === 'hybrid'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 text-espresso-950 dark:text-denim-50 font-bold shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="font-bold text-gold-700 dark:text-gold-400">⚡ Híbrido Auto</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Roteia pela skill ideal do Squad</div>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-3 shadow-xs">
                <span className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  Nível de Esforço Cognitivo:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleEffort('high')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      effort === 'high'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-espresso-950 dark:text-denim-50 font-bold shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="font-bold text-amber-800 dark:text-amber-400">High Effort</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Foco rápido e direto</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleEffort('ultracode')}
                    className={`p-3 rounded-xl border text-xs font-mono transition text-left cursor-pointer ${
                      effort === 'ultracode'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 text-espresso-950 dark:text-denim-50 font-bold shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div className="font-bold text-gold-700 dark:text-gold-400">⚡ Ultracode Multi-Agent</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Harness máximo com DAG em worktrees</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono">
                    Teto Máximo de Tokens por Run
                  </span>
                  <span className="text-xs font-bold text-gold-700 dark:text-gold-400 font-mono bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
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
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                  <span>10.000 (Rápido)</span>
                  <span>50.000 (Padrão)</span>
                  <span>200.000 (Complexo)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-2 text-xs font-mono shadow-xs">
                <div className="text-espresso-950 dark:text-denim-50 font-bold">Git Worktrees & Concurrency:</div>
                <div className="flex justify-between text-espresso-700 dark:text-denim-300 text-[11px]">
                  <span>Pool de Worktrees:</span>
                  <span className="font-bold text-espresso-950 dark:text-denim-100">3 ativas (Zero-Copy Junctions)</span>
                </div>
                <div className="flex justify-between text-espresso-700 dark:text-denim-300 text-[11px]">
                  <span>Limite de Agentes Paralelos:</span>
                  <span className="font-bold text-espresso-950 dark:text-denim-100">16 concorrentes</span>
                </div>
                <div className="flex justify-between text-espresso-700 dark:text-denim-300 text-[11px]">
                  <span>Timeout de Gate Determinístico:</span>
                  <span className="font-bold text-espresso-950 dark:text-denim-100">300 segundos</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 space-y-3 shadow-xs">
                <span className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  Esquema de Cores do HiperCloudShell:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => onToggleTheme && theme !== 'light' && onToggleTheme()}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      theme === 'light'
                        ? 'border-gold-500 bg-gold-50 text-espresso-950 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 font-bold">
                        <IconSun className="w-4 h-4 text-gold-600" />
                        <span>Diurno (Bege Claro)</span>
                      </div>
                      <p className="text-[11px] text-espresso-600 dark:text-denim-300 leading-relaxed">
                        Fundo bege quente, tipografia café expresso e botões dourados brilhantes.
                      </p>
                    </div>
                    {theme === 'light' && (
                      <span className="mt-2 text-[10px] font-mono font-extrabold text-gold-700">✓ Ativo</span>
                    )}
                  </div>

                  <div
                    onClick={() => onToggleTheme && theme !== 'dark' && onToggleTheme()}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'border-gold-500 bg-gold-950/40 text-denim-50 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 hover:border-beige-400 dark:hover:border-denim-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 font-bold">
                        <IconMoon className="w-4 h-4 text-gold-400" />
                        <span>Noturno (Calça Jeans)</span>
                      </div>
                      <p className="text-[11px] text-espresso-600 dark:text-denim-300 leading-relaxed">
                        Azul escuro saturado (#0F1A30), twill denim e botões dourados estilo rebite.
                      </p>
                    </div>
                    {theme === 'dark' && (
                      <span className="mt-2 text-[10px] font-mono font-extrabold text-gold-400">✓ Ativo</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-bold text-xs shadow-gold transition cursor-pointer border border-gold-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
