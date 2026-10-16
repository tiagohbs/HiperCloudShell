// src/components/views/PixelForgeView.jsx
import React from 'react';
import {
  IconPalette,
  IconCheck,
  IconZap
} from '../Icons.jsx';

export default function PixelForgeView({
  pixelForgeItem,
  setPixelForgeItem,
  pixelForgeVariants,
  pixelForgeCustomArg,
  setPixelForgeCustomArg,
  pixelForgeFeedback,
  setPixelForgeFeedback,
  onApproveVariant,
  onReplayDelta,
  onRunPlaywrightTest,
  PixelSwordPreview
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#06080c]">
      {/* Header Bar da Forja */}
      <div className="border-b border-slate-800 bg-[#090d14] px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
            <IconPalette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Pixel Forge 3D Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                squad-pixel-forge-3d
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                Quality Gate: PASSED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                Merkle Replay: HIT (0 tokens)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Item: <strong className="text-slate-200">{pixelForgeItem.itemId}</strong> • Lote:{' '}
              <strong className="text-slate-200">{pixelForgeItem.lote}</strong> • Res:{' '}
              <strong className="text-slate-200">{pixelForgeItem.iconHeightPx}px (Master: 1024px)</strong>
            </p>
          </div>
        </div>

        {/* Controles de Zoom & Sub-abas */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <span className="text-[10px] font-mono text-slate-400 px-1.5">Zoom Pixelated:</span>
            {[1, 2, 5].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPixelForgeItem((prev) => ({ ...prev, zoomScale: z }))}
                className={`px-2.5 py-0.5 text-[11px] font-mono rounded transition cursor-pointer ${
                  pixelForgeItem.zoomScale === z
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {z}× {z === 1 ? '(112px)' : z === 2 ? '(224px)' : '(560px)'}
              </button>
            ))}
          </div>

          {/* Sub-abas */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'variants' }))}
              className={`px-3 py-1 rounded text-xs transition font-medium cursor-pointer ${
                pixelForgeItem.selectedTab === 'variants'
                  ? 'bg-slate-800 text-emerald-300 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 Variantes
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'comparison' }))}
              className={`px-3 py-1 rounded text-xs transition font-medium cursor-pointer ${
                pixelForgeItem.selectedTab === 'comparison'
                  ? 'bg-slate-800 text-emerald-300 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prancha PIL
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'bag-playwright' }))}
              className={`px-3 py-1 rounded text-xs transition font-medium cursor-pointer ${
                pixelForgeItem.selectedTab === 'bag-playwright'
                  ? 'bg-slate-800 text-emerald-300 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bolsa & Playwright
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {pixelForgeFeedback && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-emerald-400" />
            <span>{pixelForgeFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPixelForgeFeedback(null)}
            className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {pixelForgeItem.selectedTab === 'variants' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pixelForgeVariants.map((v) => (
                <div
                  key={v.id}
                  className={`flex flex-col rounded-xl border bg-[#0b0f17] overflow-hidden transition ${
                    v.approved
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top of Card */}
                  <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{v.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{v.cliArgs}</span>
                    </div>
                    {v.approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <IconCheck className="w-3 h-3" /> Aprovado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                        Candidato
                      </span>
                    )}
                  </div>

                  {/* Pixel Art Preview Container */}
                  <div className="p-4 bg-[#05070a] flex items-center justify-center min-h-[220px] relative border-b border-slate-800/80">
                    <div
                      className="p-3 rounded-lg border border-slate-800/60 bg-[#090d14] flex items-center justify-center shadow-inner overflow-auto max-w-full"
                      style={{
                        backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                      }}
                    >
                      {PixelSwordPreview && (
                        <PixelSwordPreview
                          variantId={v.id}
                          zoomScale={pixelForgeItem.zoomScale}
                        />
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-slate-400">
                      {pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}×{pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}px
                    </div>
                  </div>

                  {/* Metadata and Palette */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs text-slate-300 font-mono mb-2">
                        <strong>Geometria:</strong> {v.preview3d}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mb-1">
                        Materiais (bpy / bmesh):
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {v.materials.map((m, mi) => (
                          <span
                            key={mi}
                            className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-cyan-300"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Color Ramp */}
                      <div className="text-[11px] font-mono text-slate-400 mb-1 flex justify-between">
                        <span>Paleta Determinística ({v.bands} faixas):</span>
                        <span className="text-emerald-400 font-bold">100% Budget</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-1.5 rounded bg-slate-900 border border-slate-800 mb-2">
                        {v.ramp.map((color, ci) => (
                          <div key={ci} className="flex flex-col items-center">
                            <div
                              className="w-full h-5 rounded border border-white/10"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {v.budget[ci]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <button
                        type="button"
                        onClick={() => onApproveVariant(v.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          v.approved
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-800 hover:bg-emerald-600/80 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>{v.approved ? 'Variante Aprovada' : `Aprovar Variante ${v.id}`}</span>
                      </button>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={pixelForgeCustomArg}
                          onChange={(e) => setPixelForgeCustomArg(e.target.value)}
                          placeholder="Ex: --cabo=0.85 --curvatura=1.1"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => onReplayDelta(v.id, pixelForgeCustomArg)}
                          className="px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 rounded text-[10px] font-mono font-semibold transition cursor-pointer whitespace-nowrap"
                          title="Re-executa delta usando Merkle Replay sem custo de tokens"
                        >
                          Merkle Replay
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pixelForgeItem.selectedTab === 'comparison' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f17]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Prancha Comparativa PIL (512×112px com Escala Master 1024px)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Gerada pelo script PIL do pipeline determinístico para validação humana simultânea.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPixelForgeFeedback(
                      'Master 1024px exportado com sucesso para /dist/game/sprites/espada_bambu.png!'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Exportar Master 1024px</span>
                </button>
              </div>

              {/* Simulated PIL Board */}
              <div className="p-6 rounded-lg bg-[#05070a] border border-slate-800 flex flex-col items-center">
                <div className="w-full flex justify-around text-[10px] font-mono text-slate-500 mb-2 border-b border-slate-800 pb-1">
                  <span>[X: 0..112] Variante 1</span>
                  <span>[X: 112..224] Variante 2</span>
                  <span>[X: 224..336] Variante 3</span>
                </div>

                <div className="flex items-center justify-around w-full max-w-3xl py-4 bg-[#080c14] rounded-lg border border-slate-800/80 shadow-inner">
                  {[1, 2, 3].map((id) => (
                    <div key={id} className="flex flex-col items-center">
                      {PixelSwordPreview && <PixelSwordPreview variantId={id} zoomScale={1.5} />}
                      <span className="mt-2 text-xs font-mono text-slate-300 font-bold">
                        Variante {id} {pixelForgeVariants.find((v) => v.id === id)?.approved && '⭐'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {pixelForgeItem.selectedTab === 'bag-playwright' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Bag simulator */}
            <div className="lg:col-span-7 p-4 rounded-xl border border-slate-800 bg-[#0b0f17]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Simulador de Bolsa / Hotbar (Capybound RPG)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Item equipado no slot primário para validação de legibilidade em jogo.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  HUD Ativo: 16 slots
                </span>
              </div>

              <div className="p-4 rounded-xl border-2 border-[#2b354f] bg-[#14181f] grid grid-cols-4 gap-3 max-w-md mx-auto shadow-2xl">
                {/* Slot 1: Equipped sword */}
                <div className="aspect-square rounded-lg border-2 border-amber-400 bg-[#1c2331] p-1.5 flex flex-col items-center justify-center relative shadow-lg shadow-amber-500/20 group">
                  {PixelSwordPreview && (
                    <PixelSwordPreview
                      variantId={pixelForgeVariants.find((v) => v.approved)?.id || 1}
                      zoomScale={0.7}
                    />
                  )}
                  <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-amber-300 font-bold">
                    1
                  </span>
                </div>

                {/* Slots 2 to 16 */}
                {Array.from({ length: 15 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg border border-[#2b354f] bg-[#18202c]/60 flex items-center justify-center text-slate-600 text-xs font-mono"
                  >
                    {idx === 0 ? '🧪' : idx === 1 ? '🍎' : idx === 2 ? '🛡️' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Playwright Report */}
            <div className="lg:col-span-5 p-4 rounded-xl border border-slate-800 bg-[#0b0f17] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    Playwright Visual Hotbar Test
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    4/4 PASSED (142ms)
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Slot 112px contido em 128px com margem 8px</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Contraste em fundo escuro (#14181f): 4.82:1 &gt;= 4.5:1</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Ramp de cor: 4 faixas estritas [15, 35, 35, 15]</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={onRunPlaywrightTest}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 transition flex items-center justify-center gap-2 font-mono cursor-pointer"
                >
                  <IconZap className="w-3.5 h-3.5" />
                  <span>Re-executar Suite Playwright na Worktree</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
