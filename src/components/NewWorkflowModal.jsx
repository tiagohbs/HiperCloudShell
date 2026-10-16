// src/components/NewWorkflowModal.jsx
import React, { useState } from 'react';
import { IconClose, IconZap, IconPlus, IconCheck, IconLayers } from './Icons.jsx';

export default function NewWorkflowModal({
  isOpen,
  onClose,
  onSubmit,
  squadCatalog = [],
  currentProvider = 'hybrid',
  currentEffort = 'ultracode'
}) {
  const [step, setStep] = useState(1); // 1: Intenção/Squad, 2: Motor/Orçamento, 3: Revisão
  const [prompt, setPrompt] = useState('ultracode: auditar rotas e executar verificações em worktree');
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [provider, setProvider] = useState(currentProvider);
  const [effort, setEffort] = useState(currentEffort);
  const [tokenBudget, setTokenBudget] = useState(50000);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'squads'

  if (!isOpen) return null;

  const categories = ['Todos', ...new Set(squadCatalog.map((s) => s.category).filter(Boolean))];
  const visibleSquads =
    selectedCategory === 'Todos'
      ? squadCatalog
      : squadCatalog.filter((s) => s.category === selectedCategory);

  const handleSelectSquad = (squad) => {
    setSelectedSquad(squad);
    setPrompt(`ultracode: ${squad.command} - ${squad.title}`);
    if (squad.recommendedEffort?.claude === 'xhigh' || squad.recommendedEffort?.antigravity === 'high') {
      setEffort('ultracode');
    }
    setStep(2);
  };

  const handleQuickPrompt = (text) => {
    setPrompt(text);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit({
      prompt,
      provider,
      effort,
      tokenBudget,
      squad: selectedSquad
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080b11]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/40 flex items-center justify-center font-bold">
              <IconZap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Novo Workflow Autônomo
              </h2>
              <p className="text-xs text-slate-400">
                Inicie um pipeline multiagente em sandbox JavaScript e Git Worktrees
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Wizard Progress */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 1 ? 'text-violet-400 font-bold' : step > 1 ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 1 ? 'bg-violet-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Intenção & Squad</span>
          </div>
          <span className="text-slate-700">───</span>
          <div
            onClick={() => step > 1 && setStep(2)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 2 ? 'text-violet-400 font-bold' : step > 2 ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 2 ? 'bg-violet-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>Motor & Orçamento</span>
          </div>
          <span className="text-slate-700">───</span>
          <div
            onClick={() => step > 2 && setStep(3)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 3 ? 'text-violet-400 font-bold' : 'text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 3 ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span>Revisão & Disparo</span>
          </div>
        </div>

        {/* Modal Body: Passo a Passo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Abas de Modo: Prompt Livre vs Squads Canônicos */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setInputMode('prompt')}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      inputMode === 'prompt'
                        ? 'bg-violet-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ✏️ Prompt Livre (Ultracode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('squads')}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      inputMode === 'squads'
                        ? 'bg-violet-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🚀 Arsenal de 8 Squads ({squadCatalog.length})
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  {inputMode === 'prompt' ? 'Descreva o objetivo livremente' : 'Escolha um template pronto'}
                </span>
              </div>

              {inputMode === 'prompt' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Descreva o que os subagentes devem executar:
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      placeholder="Ex: ultracode: auditar todas as rotas da API, balancear VRAM nos componentes 3D e executar suite Playwright..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-violet-200 focus:outline-none focus:border-violet-500 resize-none shadow-inner"
                    />
                  </div>

                  {/* Sugestões Rápidas */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                      Sugestões de Fluxos Comuns:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {[
                        'ultracode: auditar rotas e executar suite de testes em worktrees isoladas',
                        'ultracode: squad-pixel-forge-3d gerar 3 variantes de escudo 3D e prancha PNG',
                        'ultracode: squad-backend-fortress detectar race conditions nas APIs de banco',
                        'ultracode: squad-3d-shader-studio validar dispose de memória VRAM e 60 FPS'
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQuickPrompt(sug)}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 hover:bg-slate-900 text-slate-300 text-left text-[11px] font-mono transition cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Seleção por Arsenal de Squads */
                <div className="space-y-3">
                  {/* Categorias */}
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-violet-600 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Cards dos Squads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {visibleSquads.map((squad) => (
                      <div
                        key={squad.slug}
                        onClick={() => handleSelectSquad(squad)}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition cursor-pointer ${
                          selectedSquad?.slug === squad.slug
                            ? 'bg-violet-950/30 border-violet-500 shadow-md shadow-violet-900/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                              {squad.category}
                            </span>
                            <code className="text-[10px] text-slate-500 font-mono">{squad.command}</code>
                          </div>
                          <h4 className="font-bold text-slate-100 mb-1">{squad.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{squad.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Claude: {squad.recommendedEffort?.claude} • AGY: {squad.recommendedEffort?.antigravity}
                          </span>
                          <span className="text-violet-400 font-bold text-[11px]">Selecionar →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Selecione o Motor de IA e Limite Financeiro
              </h3>

              {/* Seletor de Motor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setProvider('hybrid')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    provider === 'hybrid'
                      ? 'border-violet-500 bg-violet-950/20 shadow-md shadow-violet-900/30'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white font-mono">⚡ Híbrido Autônomo</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600 text-white font-mono">Recomendado</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Claude Code arquiteta e valida; Antigravity testa e explora em paralelo.
                    </p>
                  </div>
                  <div className="text-[10px] text-violet-400 font-mono mt-3">Máximo desempenho e rigor</div>
                </div>

                <div
                  onClick={() => setProvider('claude')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    provider === 'claude'
                      ? 'border-orange-500 bg-orange-950/20 shadow-md shadow-orange-900/30'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white font-mono">Claude Code CLI</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-900/60 text-orange-300 font-mono">Sonnet 3.7</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Raciocínio profundo, refatorações amplas e conformidade de tipos rigorosa.
                    </p>
                  </div>
                  <div className="text-[10px] text-orange-400 font-mono mt-3">Foco em arquitetura e código</div>
                </div>

                <div
                  onClick={() => setProvider('antigravity')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    provider === 'antigravity'
                      ? 'border-blue-500 bg-blue-950/20 shadow-md shadow-blue-900/30'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white font-mono">Google Antigravity</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">agy CLI</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Velocidade de inferência, testes de estresse, scripts e integração com Stitch.
                    </p>
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono mt-3">Foco em velocidade e exploração</div>
                </div>
              </div>

              {/* Esforço de Raciocínio */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block mb-0.5">Nível de Esforço (/effort):</span>
                  <span className="text-[11px] text-slate-400">Controla o budget de pensamento e validações</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setEffort('high')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      effort === 'high' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    high
                  </button>
                  <button
                    type="button"
                    onClick={() => setEffort('ultracode')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      effort === 'ultracode' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    ultracode (xhigh)
                  </button>
                </div>
              </div>

              {/* Teto de Tokens */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold">Teto Financeiro de Segurança:</span>
                  <span className="text-cyan-400 font-bold">{tokenBudget.toLocaleString()} tokens (~${(tokenBudget * 0.000003).toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="10000"
                  value={tokenBudget}
                  onChange={(e) => setTokenBudget(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>10k tokens (Rápido)</span>
                  <span>50k (Padrão)</span>
                  <span>200k (Lote Complexo)</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Revisão do Pipeline Antes do Disparo
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Objetivo:</span>
                  <span className="text-slate-200 text-right font-bold truncate max-w-md">{prompt}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Motor Selecionado:</span>
                  <span className="text-violet-400 font-bold uppercase">{provider}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Nível de Esforço:</span>
                  <span className="text-slate-200 font-bold">{effort}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-900">
                  <span className="text-slate-400">Teto Financeiro:</span>
                  <span className="text-cyan-400 font-bold">{tokenBudget.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Isolamento Git:</span>
                  <span className="text-emerald-400 font-bold">Worktree Isolada + Zero-Copy Junctions</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-500/30 text-xs text-violet-300 font-mono">
                Ao disparar, o Maestro compilará o DAG em sandbox node:vm, alocará a branch isolada e executará os Quality Gates determinísticos antes de solicitar merge.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Navegação entre Passos */}
        <div className="p-4 border-t border-slate-800 bg-[#080b11] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 transition cursor-pointer"
            >
              ← Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono border border-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-md shadow-violet-900/40 cursor-pointer"
            >
              Próximo Passo →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-violet-600/50 flex items-center gap-2 cursor-pointer"
            >
              <IconZap className="w-4 h-4" />
              <span>Disparar Workflow Agora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
