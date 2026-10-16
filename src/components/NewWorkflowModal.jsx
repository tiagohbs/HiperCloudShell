// src/components/NewWorkflowModal.jsx
import React, { useState, useEffect } from 'react';
import { IconClose, IconZap, IconPlus, IconCheck, IconLayers, IconCpu, IconPalette, IconBox, IconSearch } from './Icons.jsx';

export default function NewWorkflowModal({
  isOpen,
  onClose,
  squadCatalog = [],
  onLaunchSquad,
  onCustomWorkflow,
  onLaunchWorkflow,
  defaultProvider = 'hybrid',
  defaultEffort = 'ultracode',
  defaultBudget = 50000,
  initialPrompt = '',
  activeProjectName = 'HiperCloudShell'
}) {
  const [step, setStep] = useState(1); // 1: Missão & Squads, 2: Motor, Esforço & Orçamento, 3: Revisão & Disparo

  // Missão em Linguagem Natural do Usuário
  const [missionPrompt, setMissionPrompt] = useState(
    initialPrompt || 'Criar rotas autenticadas e testes determinísticos com isolamento em worktrees'
  );

  useEffect(() => {
    if (initialPrompt) {
      setMissionPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Modo de Alocação de Squads: 'auto' (Maestro decide) ou 'manual' (Usuário escolhe)
  const [squadMode, setSquadMode] = useState('auto');
  const [selectedSquads, setSelectedSquads] = useState([]);
  const [squadCategoryFilter, setSquadCategoryFilter] = useState('Todos');

  // Parâmetros de Motor e Esforço Cognitivo
  const [provider, setProvider] = useState(defaultProvider);
  const [effort, setEffort] = useState(defaultEffort);
  const [tokenBudget, setTokenBudget] = useState(defaultBudget > 0 ? defaultBudget : 50000);
  const [unlimitedTokens, setUnlimitedTokens] = useState(defaultBudget === 0);

  if (!isOpen) return null;

  const categories = ['Todos', ...new Set(squadCatalog.map((s) => s.category).filter(Boolean))];
  const filteredSquads =
    squadCategoryFilter === 'Todos'
      ? squadCatalog
      : squadCatalog.filter((s) => s.category === squadCategoryFilter);

  // Toggle de seleção manual de squads (múltipla escolha)
  const toggleSquadSelection = (squad) => {
    setSelectedSquads((prev) => {
      const exists = prev.some((s) => s.slug === squad.slug);
      if (exists) {
        return prev.filter((s) => s.slug !== squad.slug);
      } else {
        return [...prev, squad];
      }
    });
  };

  const handleQuickMission = (text) => {
    setMissionPrompt(text);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!missionPrompt.trim()) return;

    const payload = {
      prompt: missionPrompt.trim(),
      squadMode,
      selectedSquads,
      provider,
      effort,
      tokenBudget: unlimitedTokens ? 0 : tokenBudget,
      unlimitedTokens
    };

    if (onLaunchWorkflow) {
      onLaunchWorkflow(payload);
    } else if (squadMode === 'manual' && selectedSquads.length === 1 && onLaunchSquad) {
      onLaunchSquad(selectedSquads[0], missionPrompt, true);
    } else if (onCustomWorkflow) {
      const squadNote =
        squadMode === 'manual' && selectedSquads.length > 0
          ? `[Squads: ${selectedSquads.map((s) => s.title).join(', ')}] `
          : '';
      onCustomWorkflow(`${squadNote}${missionPrompt}`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso-950/70 dark:bg-denim-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-2xl shadow-warm-lg dark:shadow-denim-lg overflow-hidden flex flex-col max-h-[92vh] text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* =================================================================== */}
        {/* MODAL HEADER                                                        */}
        {/* =================================================================== */}
        <div className="p-4 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between bg-white dark:bg-denim-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-espresso-950 border border-gold-300 flex items-center justify-center font-bold shadow-gold">
              <IconZap className="w-4 h-4 text-espresso-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 uppercase tracking-wider font-mono">
                  Novo Workflow Autônomo
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 font-bold">
                  Projeto: {activeProjectName}
                </span>
              </div>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                Defina a missão, escolha ou delegue os squads e configure o esforço cognitivo
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

        {/* =================================================================== */}
        {/* STEPPER WIZARD PROGRESS (APPLE HIG + MATERIAL 3)                    */}
        {/* =================================================================== */}
        <div className="px-6 py-3 bg-beige-100/70 dark:bg-denim-850/70 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between text-xs font-mono">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              step === 1
                ? 'text-espresso-950 dark:text-denim-50 font-extrabold'
                : step > 1
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : step > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span>1. Missão & Squads</span>
          </div>
          <span className="text-beige-300 dark:text-denim-700">───</span>
          <div
            onClick={() => step > 1 && setStep(2)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              step === 2
                ? 'text-espresso-950 dark:text-denim-50 font-extrabold'
                : step > 2
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : step > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
              }`}
            >
              {step > 2 ? '✓' : '2'}
            </span>
            <span>2. Esforço & Motor</span>
          </div>
          <span className="text-beige-300 dark:text-denim-700">───</span>
          <div
            onClick={() => step > 2 && setStep(3)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              step === 3
                ? 'text-espresso-950 dark:text-denim-50 font-extrabold'
                : 'text-espresso-400 dark:text-denim-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 3
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : 'bg-beige-300 dark:bg-denim-700 text-espresso-600 dark:text-denim-300'
              }`}
            >
              3
            </span>
            <span>3. Revisão & Disparo</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MODAL BODY                                                          */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-beige-50 dark:bg-denim-900">
          {/* ----------------------------------------------------------------- */}
          {/* STEP 1: DEFINIÇÃO DE MISSÃO & ALOCAÇÃO DE SQUADS                 */}
          {/* ----------------------------------------------------------------- */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Card da Missão / Objetivo Principal */}
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                    <IconZap className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                    <span>Qual é a Missão deste Workflow no Projeto {activeProjectName}?</span>
                  </label>
                  <span className="text-[10px] text-espresso-500 dark:text-denim-400 font-mono">
                    Linguagem Natural
                  </span>
                </div>

                <textarea
                  value={missionPrompt}
                  onChange={(e) => setMissionPrompt(e.target.value)}
                  rows={3}
                  placeholder="Ex: Criar rotas autenticadas de inventário, integrar com banco de dados e validar com testes automatizados de regressão..."
                  className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-3 text-xs font-mono text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 resize-none shadow-inner"
                />

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-espresso-600 dark:text-denim-300 font-bold">
                    Exemplos Rápidos de Missão:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Criar endpoint seguro com schema Zod e testes de integração',
                      'Refatorar componentes para seguir design system Apple/Material',
                      'Gerar suíte de testes unitários e auditar cobertura com Vitest',
                      'Modelar asset 3D e quantizar em 8 vistas isométricas a 24°',
                      'Auditar vulnerabilidades de segurança e isolar escopo em worktrees'
                    ].map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickMission(ex)}
                        className="px-2.5 py-1 rounded bg-beige-100 dark:bg-denim-800 hover:bg-gold-100 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 text-[11px] font-mono border border-beige-300 dark:border-denim-700 transition cursor-pointer text-left shadow-xs"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seletor do Modo de Alocação de Squads */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                    Como os Squads devem trabalhar nesta Missão?
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                    Você pode delegar a decisão de composição ao Maestro ou escolher manualmente cada equipe.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Opção 1: Automático pelo Maestro */}
                  <div
                    onClick={() => {
                      setSquadMode('auto');
                      setSelectedSquads([]);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      squadMode === 'auto'
                        ? 'border-gold-500 bg-gold-50/80 dark:bg-gold-950/40 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-espresso-950 dark:text-denim-50 flex items-center gap-1.5 font-mono">
                          <span>🤖</span>
                          <span>Decisão Automática pelo Maestro</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-200 leading-relaxed font-mono">
                        O Maestro analisa sua missão em linguagem natural e convoca autonomamente os esquadrões e papéis necessários no DAG (Arquiteto, Backend, Frontend, QA, etc.).
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-beige-200 dark:border-denim-750 text-[10px] font-mono text-gold-700 dark:text-gold-400 font-bold flex items-center gap-1">
                      {squadMode === 'auto' ? '✓ Modo Ativo (Zero Config)' : 'Selecionar Modo Automático'}
                    </div>
                  </div>

                  {/* Opção 2: Seleção Manual Sob Medida */}
                  <div
                    onClick={() => setSquadMode('manual')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      squadMode === 'manual'
                        ? 'border-gold-500 bg-gold-50/80 dark:bg-gold-950/40 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-espresso-950 dark:text-denim-50 flex items-center gap-1.5 font-mono">
                          <span>👥</span>
                          <span>Escolher os Squads que Irão Trabalhar</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-beige-200 dark:bg-denim-750 text-espresso-800 dark:text-denim-200 font-bold">
                          Composição
                        </span>
                      </div>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-200 leading-relaxed font-mono">
                        Escolha exatamente quais equipes (1 ou múltiplas) devem trabalhar nesta missão. Você tem controle total dos papéis e especialidades.
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-beige-200 dark:border-denim-750 text-[10px] font-mono text-espresso-600 dark:text-denim-300 font-bold flex items-center justify-between">
                      <span>{selectedSquads.length} squad(s) selecionado(s)</span>
                      <span className="text-gold-700 dark:text-gold-400 font-bold">Configurar →</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Seleção Manual de Squads (Exibida quando squadMode === 'manual') */}
              {squadMode === 'manual' && (
                <div className="space-y-3 pt-2 border-t border-beige-300 dark:border-denim-750">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-espresso-950 dark:text-denim-50">
                        Marque as Equipes Participantes:
                      </span>
                      <span className="text-[11px] font-mono text-gold-700 dark:text-gold-400 font-bold bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
                        {selectedSquads.length} selecionado(s)
                      </span>
                    </div>

                    {/* Filtro por Categoria */}
                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSquadCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer font-bold ${
                            squadCategoryFilter === cat
                              ? 'bg-gold-500 text-espresso-950 shadow-xs'
                              : 'bg-white dark:bg-denim-800 text-espresso-700 dark:text-denim-200 border border-beige-300 dark:border-denim-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid de Squads Selecionáveis com Checkbox */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {filteredSquads.map((squad) => {
                      const isSelected = selectedSquads.some((s) => s.slug === squad.slug);
                      return (
                        <div
                          key={squad.slug}
                          onClick={() => toggleSquadSelection(squad)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-gold-500 bg-gold-50/80 dark:bg-gold-950/50 shadow-gold ring-1 ring-gold-400'
                              : 'border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 hover:border-gold-400'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="font-extrabold text-xs text-espresso-950 dark:text-denim-50 font-mono">
                                {squad.title}
                              </span>
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition ${
                                  isSelected
                                    ? 'bg-gold-500 text-espresso-950 shadow-gold'
                                    : 'border border-beige-400 dark:border-denim-600 bg-beige-100 dark:bg-denim-900 text-transparent'
                                }`}
                              >
                                ✓
                              </div>
                            </div>
                            <p className="text-[11px] text-espresso-700 dark:text-denim-300 font-mono leading-relaxed">
                              {squad.description}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-beige-200 dark:border-denim-750 flex items-center justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                            <span>Categoria: <strong className="text-espresso-800 dark:text-denim-200">{squad.category}</strong></span>
                            <span className={isSelected ? 'text-gold-700 dark:text-gold-400 font-bold' : ''}>
                              {isSelected ? 'Equipe Ativa ✓' : '+ Adicionar'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 2: NÍVEL DE ESFORÇO MÁXIMO, MOTOR & ORÇAMENTO               */}
          {/* ----------------------------------------------------------------- */}
          {step === 2 && (
            <div className="space-y-4">
              {/* 1. Nível de Esforço Cognitivo & Raciocínio (Thinking Effort) */}
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-1.5">
                    <IconZap className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                    <span>1. Nível de Esforço Cognitivo & Raciocínio (Thinking Effort)</span>
                  </label>
                  <span className="text-[10px] font-mono text-gold-700 dark:text-gold-400 font-bold bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
                    Ativo: {effort.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Esforço Máximo (Ultracode) */}
                  <div
                    onClick={() => setEffort('ultracode')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      effort === 'ultracode'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/50 text-espresso-950 dark:text-denim-50 shadow-gold ring-1 ring-gold-400'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-gold-700 dark:text-gold-300 font-mono flex items-center gap-1">
                        <span>⚡</span>
                        <span>Esforço Máximo</span>
                      </div>
                      <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                        Raciocínio profundo, auto-correção, consenso cruzado e quality gates rigorosos.
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-mono font-bold text-gold-800 dark:text-gold-400">
                      Ultracode (Max)
                    </span>
                  </div>

                  {/* Alto Esforço (High) */}
                  <div
                    onClick={() => setEffort('high')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      effort === 'high'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-espresso-950 dark:text-denim-50 shadow-xs ring-1 ring-amber-400'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-amber-700 dark:text-amber-300 font-mono flex items-center gap-1">
                        <span>🔥</span>
                        <span>Alto Esforço</span>
                      </div>
                      <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                        Raciocínio estendido, testes unitários e análise estática completa.
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-mono font-bold text-amber-800 dark:text-amber-400">
                      High Thinking
                    </span>
                  </div>

                  {/* Médio (Medium) */}
                  <div
                    onClick={() => setEffort('medium')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      effort === 'medium'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 text-espresso-950 dark:text-denim-50 shadow-xs ring-1 ring-cyan-400'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-cyan-700 dark:text-cyan-300 font-mono flex items-center gap-1">
                        <span>⚖️</span>
                        <span>Médio</span>
                      </div>
                      <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                        Equilíbrio ideal entre velocidade de resposta e validação de código.
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-mono font-bold text-cyan-800 dark:text-cyan-400">
                      Balanced
                    </span>
                  </div>

                  {/* Rápido (Low) */}
                  <div
                    onClick={() => setEffort('low')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      effort === 'low'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-espresso-950 dark:text-denim-50 shadow-xs ring-1 ring-emerald-400'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1">
                        <span>⏱️</span>
                        <span>Rápido</span>
                      </div>
                      <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                        Tarefas pontuais, baixo consumo de tokens e execução direta.
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      Fast / Low
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Seleção do Provedor de Agentes (Dual-Engine) */}
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono block">
                  2. Seleção do Motor Dual-Engine
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    onClick={() => setProvider('hybrid')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'hybrid'
                        ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 text-espresso-950 dark:text-denim-50 shadow-gold'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-gold-700 dark:text-gold-400 font-mono">⚡ Híbrido Auto (Recomendado)</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                      Alterna Claude Code e Antigravity pela especialidade de cada fase.
                    </div>
                  </div>

                  <div
                    onClick={() => setProvider('claude')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'claude'
                        ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-espresso-950 dark:text-denim-50 shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-orange-700 dark:text-orange-400 font-mono">Claude Code CLI</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                      Especialista em refatoração profunda, lógica de backend e testes.
                    </div>
                  </div>

                  <div
                    onClick={() => setProvider('antigravity')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      provider === 'antigravity'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-espresso-950 dark:text-denim-50 shadow-xs'
                        : 'border-beige-300 dark:border-denim-700 bg-beige-50/50 dark:bg-denim-800 hover:bg-white dark:hover:bg-denim-750 text-espresso-800 dark:text-denim-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-blue-700 dark:text-blue-400 font-mono">Antigravity CLI</div>
                    <div className="text-[10px] text-espresso-600 dark:text-denim-300 mt-1 font-mono">
                      Especialista em exploração de código, 3D procedural e arquitetura.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Teto Orçamentário de Tokens com Botão Ilimitado */}
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono">
                    3. Teto Orçamentário de Tokens
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold text-espresso-800 dark:text-denim-200">
                      <input
                        type="checkbox"
                        checked={unlimitedTokens}
                        onChange={(e) => setUnlimitedTokens(e.target.checked)}
                        className="accent-gold-500 cursor-pointer"
                      />
                      <span>Tokens Ilimitados (Sem Teto)</span>
                    </label>

                    {!unlimitedTokens && (
                      <span className="text-xs font-bold text-gold-700 dark:text-gold-400 font-mono bg-gold-100 dark:bg-gold-950/70 px-2 py-0.5 rounded border border-gold-300 dark:border-gold-700">
                        {tokenBudget.toLocaleString()} tokens
                      </span>
                    )}
                  </div>
                </div>

                {!unlimitedTokens ? (
                  <>
                    <input
                      type="range"
                      min="10000"
                      max="200000"
                      step="5000"
                      value={tokenBudget}
                      onChange={(e) => setTokenBudget(Number(e.target.value))}
                      className="w-full accent-gold-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-espresso-500 dark:text-denim-400">
                      <span>10.000 (Rápido)</span>
                      <span>50.000 (Padrão)</span>
                      <span>200.000 (Extenso)</span>
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 text-[11px] font-mono text-gold-900 dark:text-gold-300 font-bold">
                    ⚡ Modo sem teto ativado: o pipeline executará sem interrupção até atingir os Quality Gates da missão.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 3: REVISÃO & DISPARO                                         */}
          {/* ----------------------------------------------------------------- */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl space-y-3 shadow-xs">
                <h3 className="text-xs font-bold text-espresso-950 dark:text-denim-50 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>Resumo do Pipeline a Ser Disparado</span>
                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-bold">
                    Pronto para Execução
                  </span>
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  {/* Missão */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex flex-col gap-1">
                    <span className="text-[10px] text-espresso-500 dark:text-denim-400 font-bold uppercase">Missão do Workflow:</span>
                    <span className="font-extrabold text-espresso-950 dark:text-denim-100">{missionPrompt}</span>
                  </div>

                  {/* Alocação de Squads */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between items-center">
                    <span className="text-espresso-600 dark:text-denim-300">Alocação de Equipes:</span>
                    <span className="font-bold text-espresso-950 dark:text-denim-50 text-right">
                      {squadMode === 'auto' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">🤖 Decisão Dinâmica pelo Maestro</span>
                      ) : selectedSquads.length > 0 ? (
                        <span className="text-gold-700 dark:text-gold-400">
                          {selectedSquads.map((s) => s.title).join(', ')}
                        </span>
                      ) : (
                        <span className="text-espresso-400">Nenhum selecionado (Maestro assumirá)</span>
                      )}
                    </span>
                  </div>

                  {/* Esforço */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between items-center">
                    <span className="text-espresso-600 dark:text-denim-300">Nível de Esforço Cognitivo:</span>
                    <span className="font-extrabold text-gold-700 dark:text-gold-400 uppercase">
                      {effort === 'ultracode' ? '⚡ Esforço Máximo (Ultracode)' : effort.toUpperCase()}
                    </span>
                  </div>

                  {/* Motor Dual-Engine */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between items-center">
                    <span className="text-espresso-600 dark:text-denim-300">Motor Selecionado:</span>
                    <span className="font-bold text-gold-700 dark:text-gold-400 uppercase">{provider}</span>
                  </div>

                  {/* Orçamento */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between items-center">
                    <span className="text-espresso-600 dark:text-denim-300">Orçamento Limite:</span>
                    <span className="font-bold text-espresso-950 dark:text-denim-100">
                      {unlimitedTokens ? '⚡ Ilimitado (Sem Teto)' : `${tokenBudget.toLocaleString()} tokens`}
                    </span>
                  </div>

                  {/* Repositório */}
                  <div className="p-2.5 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex justify-between items-center">
                    <span className="text-espresso-600 dark:text-denim-300">Repositório & Worktree:</span>
                    <span className="font-bold text-espresso-950 dark:text-denim-100">{activeProjectName} (branch maestro/...)</span>
                  </div>
                </div>

                {/* Garantias Determinísticas */}
                <div className="p-3 bg-gold-50/80 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 rounded-lg text-xs font-mono text-espresso-900 dark:text-denim-100 space-y-1">
                  <div className="font-bold text-gold-800 dark:text-gold-400 flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                    <span>Garantias de Execução Determinística:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-espresso-700 dark:text-denim-200 space-y-0.5 ml-1">
                    <li>Ambiente isolado em Git Worktree com Zero-Copy Junctions</li>
                    <li>Quality Gates determinísticos antes de qualquer merge na main</li>
                    <li>Ordered Merkle Replay Cache ativado para evitar consumo duplicado de tokens</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* MODAL FOOTER CONTROLS                                               */}
        {/* =================================================================== */}
        <div className="p-4 border-t border-beige-300 dark:border-denim-750 bg-white dark:bg-denim-850 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 border border-beige-300 dark:border-denim-700 font-semibold text-xs transition cursor-pointer shadow-xs font-mono"
              >
                ← Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-700 dark:text-denim-300 font-semibold text-xs transition cursor-pointer font-mono"
            >
              Cancelar
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-bold text-xs shadow-gold hover:shadow-gold-lg transition cursor-pointer border border-gold-300 font-mono"
              >
                Avançar →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold hover:shadow-gold-lg transition cursor-pointer flex items-center gap-2 border border-gold-300 font-mono"
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
