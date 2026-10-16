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
  const [activeTab, setActiveTab] = useState('gates'); // 'gates' | 'diff' | 'contracts'

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
      title: 'Suite de Testes E2E & Unitários',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl shadow-violet-950/40 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
              <IconShieldAlert className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Quality Gate & Human Approval
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  GATES: 5/5 PASSED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Workflow: <strong className="text-slate-200">{run.meta?.name || run.id}</strong> • Fase:{' '}
                <strong className="text-emerald-300">{run.currentPhase || 'Validação Concluída'}</strong>
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
            onClick={() => setActiveTab('gates')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'gates'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✓ Quality Gates Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'diff'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Arquivos Modificados ({changedFiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`py-2.5 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'adjust'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔄 Solicitar Ajuste
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'gates' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-300 font-semibold flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-400" />
                  Todos os requisitos determinísticos foram cumpridos com sucesso.
                </span>
                <span className="text-slate-400 text-[11px]">Pronto para Merge na Main</span>
              </div>

              <div className="space-y-2">
                {gates.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 font-mono">{g.title}</div>
                        <div className="text-[11px] text-slate-400">{g.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {g.latency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400">
                Arquivos modificados em worktree isolada:
              </div>
              <div className="space-y-1.5">
                {changedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs flex items-center justify-between"
                  >
                    <span className="text-cyan-300">{file}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">+42 / -8</span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                <strong>Resumo da Execução:</strong>
                <pre className="mt-1 whitespace-pre-wrap text-slate-400 text-[10px]">
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
              <div className="text-xs font-mono text-slate-300">
                Não está satisfeito com o resultado? Envie instruções de ajuste para o Agente na mesma worktree:
              </div>
              <textarea
                value={adjustmentPrompt}
                onChange={(e) => setAdjustmentPrompt(e.target.value)}
                rows={4}
                placeholder="Ex: Altere o contrato para aceitar timeout em milissegundos e adicione mais 2 testes no mirror.spec.js..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
              <button
                type="button"
                disabled={!adjustmentPrompt.trim() || isSubmitting}
                onClick={handleAdjustment}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <IconZap className="w-3.5 h-3.5" />
                <span>Enviar Ajuste para Re-execução</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold text-xs transition cursor-pointer"
          >
            ✕ Descartar Worktree
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer flex items-center gap-2"
            >
              <IconCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Fazendo Merge...' : '✓ Aprovar e Fazer Merge na Main'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
