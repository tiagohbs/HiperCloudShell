// src/components/NewWorkflowModal.jsx
import React, { useState } from 'react';
import { IconClose, IconZap, IconPlus, IconCheck, IconLayers, IconCpu } from './Icons.jsx';

export default function NewWorkflowModal({
  isOpen,
  onClose,
  squadCatalog = [],
  onLaunchSquad,
  onCustomWorkflow,
  defaultProvider = 'hybrid',
  defaultEffort = 'ultracode',
  defaultBudget = 50000
}) {
  const [step, setStep] = useState(1); // 1: Intenção/Squad, 2: Motor/Orçamento, 3: Revisão
  const [prompt, setPrompt] = useState('ultracode: auditar rotas e executar verificações em worktree');
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [provider, setProvider] = useState(defaultProvider);
  const [effort, setEffort] = useState(defaultEffort);
  const [tokenBudget, setTokenBudget] = useState(defaultBudget);
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

    if (selectedSquad && onLaunchSquad) {
      onLaunchSquad(selectedSquad, prompt, true);
    } else if (onCustomWorkflow) {
      onCustomWorkflow(prompt);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso-950/70 dark:bg-denim-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-2xl shadow-warm-lg dark:shadow-denim-lg overflow-hidden flex flex-col max-h-[90vh] text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between bg-beige-100 dark:bg-denim-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-espresso-950 border border-gold-300 flex items-center justify-center font-bold shadow-gold">
              <IconZap className="w-4 h-4 text-espresso-950" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 uppercase tracking-wider font-mono">
                Novo Workflow Autônomo
              </h2>
              <p className="text-xs text-espresso-600 dark:text-denim-300">
                Inicie um pipeline multiagente em sandbox JavaScript e Git Worktrees
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-espresso-500 dark:text-denim-400 hover:text-espresso-950 dark:hover:text-denim-50 hover:bg-beige-200 dark:hover:bg-denim-750 transition cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Wizard Progress */}
        <div className="px-6 py-3 bg-beige-100/70 dark:bg-denim-850/70 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between text-xs font-mono">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 1 ? 'text-espresso-950 dark:text-denim-50 font-extrabold' : step > 1 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 1 ? 'bg-gold-500 text-espresso-950 shadow-gold' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Intenção & Squad</span>
          </div>
          <span className="text-beige-400 dark:text-denim-700">───</span>
          <div
            onClick={() => step > 1 && setStep(2)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 2 ? 'text-espresso-950 dark:text-denim-50 font-extrabold' : step > 2 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 2 ? 'bg-gold-500 text-espresso-950 shadow-gold' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>Motor & Orçamento</span>
          </div>
          <span className="text-beige-400 dark:text-denim-700">───</span>
          <div
            onClick={() => step > 2 && setStep(3)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 3 ? 'text-espresso-950 dark:text-denim-50 font-extrabold' : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 3 ? 'bg-gold-500 text-espresso-950 shadow-gold' : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
            }`}>
              3
            </span>
            <span>Revisão & Disparo</span>
          </div>
        </div>

        {/* Modal Body / Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-beige-50 dark:bg-denim-900">
          {/* STEP 1: Intenção & Squad */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-espresso-900 dark:text-denim-100 font-mono">
                    Como deseja iniciar?
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300">
                    Digite um objetivo livre ou escolha um dos 8 Squads pré-configurados do Overclock.sh
                  </p>
                </div>

                <div className="flex bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-0.5 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setInputMode('prompt')}
                    className={`px-3 py-1 rounded transition cursor-pointer ${
                      inputMode === 'prompt' ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 font-bold shadow-xs' : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
                    }`}
                  >
                    Prompt Livre
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('squads')}
                    className={`px-3 py-1 rounded transition cursor-pointer ${
                      inputMode === 'squads' ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 font-bold shadow-xs' : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
                    }`}
                  >
                    Catálogo Squads ({squadCatalog.length})
                  </button>
                </div>
              </div>

              {inputMode === 'prompt' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-2 shadow-xs">
                    <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-1.5">
                      <IconZap className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                      <span>Instrução Principal do Workflow</span>
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      placeholder="Ex: ultracode: refatorar toda a camada de comunicação do backend e criar testes com worktree"
                      className="w-full bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-lg p-3 text-xs font-mono text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-espresso-500 dark:text-denim-400 font-mono">
                      <span>Prefixo "ultracode:" ativa o planejador dinâmico em JavaScript sandbox</span>
                      <span>{prompt.length} caracteres</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-300">Sugestões Rápidas:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'ultracode: auditar integridade de worktrees e sincronização Zod',
                        'ultracode: /squad-backend-fortress testar concorrência e race condition',
                        'ultracode: /squad-3d-shader-studio cena Three.js 60fps com shaders GLSL',
                        'ultracode: /squad-pixel-forge-3d forjar asset 3D e exportar pixel art'
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQuickPrompt(sug)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-denim-800 hover:bg-beige-100 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 text-[11px] font-mono border border-beige-300 dark:border-denim-700 transition cursor-pointer text-left shadow-xs"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 border-b border-beige-300 dark:border-denim-750 pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-gold-500 text-espresso-950 font-bold shadow-gold'
                            : 'bg-white dark:bg-denim-800 text-espresso-700 dark:text-denim-200 border border-beige-300 dark:border-denim-700 hover:bg-beige-100 dark:hover:bg-denim-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {visibleSquads.map((squad) => (
                      <div
                        key={squad.slug}
                        onClick={() => handleSelectSquad(squad)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          selectedSquad?.slug === squad.slug
                            ? 'border-gold-500 bg-gold-50/70 dark:bg-gold-950/40 shadow-gold'
                            : 'border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 hover:border-gold-400 dark:hover:border-denim-600 hover:shadow-warm dark:hover:shadow-denim'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-extrabold text-xs text-espresso-950 dark:text-denim-50">{squad.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-100 dark:bg-gold-950/70 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-700 font-bold">
                              {squad.command}
                            </span>
                          </div>
                          <p className="text-[11px] text-espresso-700 dark:text-denim-200 leading-relaxed">
                            {squad.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-beige-200 dark:border-denim-750 flex items-center justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                          <span>Categoria: <strong className="text-espresso-800 dark:text-denim-200">{squad.category}</strong></span>
                          <span className="text-gold-700 dark:text-gold-400 font-bold">Selecionar →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Motor Dual-Engine & Orçamento */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  1. Seleção do Provedor de Agentes (Dual-Engine)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    onClick={() => setProvider('claude')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'claude'
                        ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-espresso-950 dark:text-denim-50 shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-orange-700 dark:text-orange-400">Claude Code CLI</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Especialista em Refatoração & QA</div>
                  </div>

                  <div
                    onClick={() => setProvider('antigravity')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'antigravity'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-espresso-950 dark:text-denim-50 shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-blue-700 dark:text-blue-400">Antigravity CLI</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Especialista em Exploração & 3D</div>
                  </div>

                  <div
                    onClick={() => setProvider('hybrid')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'hybrid'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 text-espresso-950 dark:text-denim-50 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-gold-700 dark:text-gold-400">⚡ Híbrido Auto</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Roteia pela skill ideal do Squad</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  2. Nível de Esforço Cognitivo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setEffort('high')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      effort === 'high'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-espresso-950 dark:text-denim-50 shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-800 dark:text-amber-400">High Effort</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Foco rápido e direto</div>
                  </div>

                  <div
                    onClick={() => setEffort('ultracode')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      effort === 'ultracode'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 text-espresso-950 dark:text-denim-50 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-gold-700 dark:text-gold-400">⚡ Ultracode Multi-Agent</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1">Harness máximo com DAG em worktrees</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono">
                    3. Teto Orçamentário de Tokens
                  </label>
                  <span className="text-xs font-bold text-gold-700 dark:text-gold-400 font-mono bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
                    {tokenBudget.toLocaleString()} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="5000"
                  value={tokenBudget}
                  onChange={(e) => setTokenBudget(Number(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                  <span>10.000 (Rápido)</span>
                  <span>50.000 (Padrão)</span>
                  <span>150.000 (Extenso)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Revisão & Disparo */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <h3 className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono uppercase tracking-wider">
                  Resumo do Pipeline a Ser Gerado
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between">
                    <span className="text-espresso-600 dark:text-denim-300">Prompt:</span>
                    <span className="font-bold text-espresso-950 dark:text-denim-100 truncate max-w-md">{prompt}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between">
                    <span className="text-espresso-600 dark:text-denim-300">Motor Selecionado:</span>
                    <span className="font-bold text-gold-700 dark:text-gold-400 uppercase">{provider}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between">
                    <span className="text-espresso-600 dark:text-denim-300">Esforço Cognitivo:</span>
                    <span className="font-bold text-gold-700 dark:text-gold-400 uppercase">{effort}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between">
                    <span className="text-espresso-600 dark:text-denim-300">Orçamento Limite:</span>
                    <span className="font-bold text-espresso-950 dark:text-denim-100">{tokenBudget.toLocaleString()} tokens</span>
                  </div>
                </div>

                <div className="p-3 bg-gold-50/80 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 rounded-lg text-xs font-mono text-espresso-900 dark:text-denim-100 space-y-1">
                  <div className="font-bold text-gold-800 dark:text-gold-400 flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                    <span>Garantias de Execução Determinística:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-espresso-700 dark:text-denim-200 space-y-0.5 ml-1">
                    <li>Ambiente isolado em Git Worktree com Zero-Copy Junctions</li>
                    <li>Quality Gates de Zod Schema e testes unitários antes de qualquer merge</li>
                    <li>Histórico ordenado gravado no Merkle Replay Cache</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 border border-beige-300 dark:border-denim-700 font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                ← Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-700 dark:text-denim-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-bold text-xs shadow-gold hover:shadow-gold-lg transition cursor-pointer border border-gold-300"
              >
                Avançar →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold hover:shadow-gold-lg transition cursor-pointer flex items-center gap-1.5 border border-gold-300"
              >
                <IconZap className="w-4 h-4 text-espresso-950" />
                <span>Disparar Workflow Autônomo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
