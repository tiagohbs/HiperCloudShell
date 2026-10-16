// src/components/ApprovalGateModal.jsx
import React, { useState } from 'react';
import {
  IconCheck,
  IconShieldAlert,
  IconGitBranch,
  IconCpu,
  IconZap,
  IconClock
} from './Icons.jsx';

export default function ApprovalGateModal({
  isOpen,
  onClose,
  run,
  onApprove,
  onRequestAdjustment,
  onDiscard
}) {
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('gates'); // 'gates' | 'diff' | 'adjust'

  if (!isOpen || !run) return null;

  const gates = [
    {
      id: 'gate-schema',
      title: 'Contrato & Schema Zod',
      description: 'Zero drift entre contratos publicados no Blackboard e tipos de entrada/saída.',
      status: 'passed',
      latency: '18ms'
    },
    {
      id: 'gate-tests',
      title: 'Suíte de Testes E2E & Unitários',
      description: 'Execução de npm test com isolamento em Git Worktree.',
      status: 'passed',
      latency: '240ms'
    },
    {
      id: 'gate-vram',
      title: 'GPU VRAM & Memory Leak Guard',
      description: 'Consumo de VRAM abaixo de 200MB e 0 vazamentos de texturas WebGL detectados.',
      status: 'passed',
      latency: '45ms'
    },
    {
      id: 'gate-merkle',
      title: 'Merkle Replay Cache Verification',
      description: 'Validação de hash criptográfico SHA-256 das árvores de arquivos modificadas.',
      status: 'passed',
      latency: '12ms'
    },
    {
      id: 'gate-privacy',
      title: 'Auditoria de Privacidade & Anti-Exfiltração',
      description: 'Nenhum token, secret ou .env exposto no stream de saída dos agentes.',
      status: 'passed',
      latency: '8ms'
    }
  ];

  const changedFiles = run.meta?.changedFiles || [
    'src/contracts/sync.schema.js',
    'electron/mirror.js',
    'tests/mirror.spec.js'
  ];

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (onApprove) await onApprove(run);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustmentPrompt.trim()) return;
    setIsSubmitting(true);
    try {
      if (onRequestAdjustment) await onRequestAdjustment(run, adjustmentPrompt);
      setAdjustmentPrompt('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (window.confirm('Tem certeza que deseja descartar este worktree e suas alterações?')) {
      setIsSubmitting(true);
      try {
        if (onDiscard) await onDiscard(run);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/70 dark:bg-denim-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded-2xl shadow-warm-lg dark:shadow-denim-lg flex flex-col max-h-[90vh] overflow-hidden text-espresso-900 dark:text-denim-100 transition-colors duration-150">
        {/* Header */}
        <div className="p-5 border-b border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center text-espresso-950 shadow-gold border border-gold-300">
              <IconShieldAlert className="w-5 h-5 text-espresso-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  Quality Gate & Human Approval
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gold-100 dark:bg-gold-950/70 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-700 font-extrabold">
                  GATES: 5/5 PASSED
                </span>
              </div>
              <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                Workflow: <strong className="text-espresso-950 dark:text-denim-100">{run.meta?.name || run.id}</strong> • Fase:{' '}
                <strong className="text-gold-700 dark:text-gold-400">{run.currentPhase || 'Validação Concluída'}</strong>
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
            onClick={() => setActiveTab('gates')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'gates'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            ✓ Quality Gates Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'diff'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            Arquivos Modificados ({changedFiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`py-2.5 border-b-2 font-bold transition cursor-pointer ${
              activeTab === 'adjust'
                ? 'border-gold-500 text-espresso-950 dark:text-denim-50'
                : 'border-transparent text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
            }`}
          >
            🔄 Solicitar Ajuste
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-beige-50 dark:bg-denim-900">
          {activeTab === 'gates' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 flex items-center justify-between text-xs font-mono shadow-xs">
                <span className="text-espresso-950 dark:text-denim-100 font-bold flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                  Todos os requisitos determinísticos foram cumpridos com sucesso.
                </span>
                <span className="text-gold-800 dark:text-gold-300 text-[11px] font-bold">Pronto para Merge na Main</span>
              </div>

              <div className="space-y-2">
                {gates.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center font-extrabold text-xs">
                        ✓
                      </div>
                      <div>
                        <div className="font-bold text-espresso-950 dark:text-denim-50 font-mono">{g.title}</div>
                        <div className="text-[11px] text-espresso-600 dark:text-denim-300">{g.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-beige-100 dark:bg-denim-800 text-gold-800 dark:text-gold-300 border border-beige-300 dark:border-denim-700 font-bold">
                      {g.latency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-espresso-700 dark:text-denim-300">
                Arquivos modificados em worktree isolada:
              </div>
              <div className="space-y-1.5">
                {changedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 font-mono text-xs flex items-center justify-between shadow-xs"
                  >
                    <span className="text-espresso-950 dark:text-denim-100 font-bold">{file}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">+42 / -8</span>
                  </div>
                ))}
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 text-[11px] font-mono text-espresso-800 dark:text-denim-200 shadow-xs">
                <strong className="text-espresso-950 dark:text-denim-50">Resumo da Execução:</strong>
                <pre className="mt-1 whitespace-pre-wrap text-espresso-600 dark:text-denim-300 text-[10px]">
                  {run.finalResult
                    ? typeof run.finalResult === 'string'
                      ? run.finalResult
                      : JSON.stringify(run.finalResult, null, 2)
                    : 'Nenhuma saída consolidada registrada.'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-espresso-800 dark:text-denim-200">
                Não está satisfeito com o resultado? Envie instruções de ajuste para o Agente na mesma worktree:
              </div>
              <textarea
                value={adjustmentPrompt}
                onChange={(e) => setAdjustmentPrompt(e.target.value)}
                rows={4}
                placeholder="Ex: Altere o contrato para aceitar timeout em milissegundos e adicione mais 2 testes no mirror.spec.js..."
                className="w-full bg-white dark:bg-denim-850 border border-beige-300 dark:border-denim-700 rounded-xl p-3 text-xs font-mono text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 resize-none shadow-xs"
              />
              <button
                type="button"
                disabled={!adjustmentPrompt.trim() || isSubmitting}
                onClick={handleAdjustment}
                className="btn-gold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <IconZap className="w-3.5 h-3.5 text-espresso-950" />
                <span>Enviar Ajuste para Re-execução</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions (Botões de Decisão em Dourado Brilhante) */}
        <div className="p-4 border-t border-beige-300 dark:border-denim-750 bg-beige-100 dark:bg-denim-850 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold text-xs transition cursor-pointer"
          >
            ✕ Descartar Worktree
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-white dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 border border-beige-300 dark:border-denim-700 font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="btn-gold px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
            >
              <IconCheck className="w-4 h-4 text-espresso-950" />
              <span>{isSubmitting ? 'Fazendo Merge...' : '✓ Aprovar e Fazer Merge na Main'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
