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
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-beige-100 text-espresso-900">
      {/* Header Bar da Forja */}
      <div className="border-b border-beige-300 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center font-bold text-espresso-950 shadow-gold border border-gold-300">
            <IconPalette className="w-4 h-4 text-espresso-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-espresso-950 font-mono">
                Pixel Forge 3D Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                squad-pixel-forge-3d
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-800 font-bold">
                Quality Gate: PASSED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-100 border border-gold-300 text-gold-900 font-bold">
                Merkle Replay: HIT (0 tokens)
              </span>
            </div>
            <p className="text-[11px] text-espresso-600 font-mono mt-0.5">
              Item: <strong className="text-espresso-950">{pixelForgeItem.itemId}</strong> • Lote:{' '}
              <strong className="text-espresso-950">{pixelForgeItem.lote}</strong> • Res:{' '}
              <strong className="text-espresso-950">{pixelForgeItem.iconHeightPx}px (Master: 1024px)</strong>
            </p>
          </div>
        </div>

        {/* Controles de Zoom & Sub-abas */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-beige-200 border border-beige-300 p-1 rounded-lg text-xs">
            <span className="text-[10px] font-mono text-espresso-600 px-1.5 font-bold">Zoom Pixelated:</span>
            {[1, 2, 5].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPixelForgeItem((prev) => ({ ...prev, zoomScale: z }))}
                className={`px-2.5 py-0.5 text-[11px] font-mono rounded transition cursor-pointer font-bold ${
                  pixelForgeItem.zoomScale === z
                    ? 'bg-gold-500 text-espresso-950 shadow-gold'
                    : 'text-espresso-700 hover:text-espresso-950'
                }`}
              >
                {z}× {z === 1 ? '(112px)' : z === 2 ? '(224px)' : '(560px)'}
              </button>
            ))}
          </div>

          {/* Sub-abas */}
          <div className="flex items-center gap-1 bg-beige-200 border border-beige-300 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'variants' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'variants'
                  ? 'bg-white text-espresso-950 shadow-xs'
                  : 'text-espresso-600 hover:text-espresso-950'
              }`}
            >
              3 Variantes
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'comparison' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'comparison'
                  ? 'bg-white text-espresso-950 shadow-xs'
                  : 'text-espresso-600 hover:text-espresso-950'
              }`}
            >
              Prancha PIL
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'bag-playwright' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'bag-playwright'
                  ? 'bg-white text-espresso-950 shadow-xs'
                  : 'text-espresso-600 hover:text-espresso-950'
              }`}
            >
              Bolsa & Playwright
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {pixelForgeFeedback && (
        <div className="bg-gold-100 border-b border-gold-300 px-4 py-2 text-xs font-mono text-gold-900 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-gold-700" />
            <span>{pixelForgeFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPixelForgeFeedback(null)}
            className="text-espresso-600 hover:text-espresso-950 text-[11px] cursor-pointer"
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
                  className={`flex flex-col rounded-xl border bg-white overflow-hidden transition shadow-warm ${
                    v.approved
                      ? 'border-gold-500 shadow-gold'
                      : 'border-beige-300 hover:border-gold-400'
                  }`}
                >
                  {/* Top of Card */}
                  <div className="px-4 py-3 bg-beige-50 border-b border-beige-300 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-espresso-950">{v.name}</h3>
                      <span className="text-[10px] font-mono text-espresso-600">{v.cliArgs}</span>
                    </div>
                    {v.approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-gold-100 border border-gold-300 text-gold-900 text-[10px] font-mono font-extrabold flex items-center gap-1 shadow-xs">
                        <IconCheck className="w-3 h-3 text-gold-700" /> Aprovado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-beige-200 text-espresso-700 text-[10px] font-mono font-bold">
                        Candidato
                      </span>
                    )}
                  </div>

                  {/* Pixel Art Preview Container */}
                  <div className="p-4 bg-beige-50/50 flex items-center justify-center min-h-[220px] relative border-b border-beige-200">
                    <div
                      className="p-3 rounded-lg border border-beige-300 bg-white flex items-center justify-center shadow-inner overflow-auto max-w-full"
                      style={{
                        backgroundImage: 'radial-gradient(#D5C7AF 1px, transparent 1px)',
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
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/90 border border-beige-300 text-[9px] font-mono text-espresso-700 font-bold shadow-xs">
                      {pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}×{pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}px
                    </div>
                  </div>

                  {/* Metadata and Palette */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <div>
                      <div className="text-xs text-espresso-800 font-mono mb-2">
                        <strong>Geometria:</strong> {v.preview3d}
                      </div>

                      <div className="text-[11px] font-mono text-espresso-600 mb-1">
                        Materiais (bpy / bmesh):
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {v.materials.map((m, mi) => (
                          <span
                            key={mi}
                            className="px-2 py-0.5 rounded bg-beige-100 border border-beige-300 text-[10px] font-mono text-espresso-800 font-bold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Color Ramp */}
                      <div className="text-[11px] font-mono text-espresso-700 mb-1 flex justify-between">
                        <span>Paleta Determinística ({v.bands} faixas):</span>
                        <span className="text-gold-700 font-extrabold">100% Budget</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-1.5 rounded bg-beige-50 border border-beige-300 mb-2">
                        {v.ramp.map((color, ci) => (
                          <div key={ci} className="flex flex-col items-center">
                            <div
                              className="w-full h-5 rounded border border-beige-300"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[9px] font-mono text-espresso-600 mt-0.5 font-bold">
                              {v.budget[ci]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons (Dourado Brilhante) */}
                    <div className="pt-2 border-t border-beige-200 space-y-2">
                      <button
                        type="button"
                        onClick={() => onApproveVariant(v.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                          v.approved
                            ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 shadow-gold border-gold-300'
                            : 'bg-beige-100 hover:bg-gold-100 text-espresso-900 border-beige-300'
                        }`}
                      >
                        <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                        <span>{v.approved ? 'Variante Aprovada' : `Aprovar Variante ${v.id}`}</span>
                      </button>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={pixelForgeCustomArg}
                          onChange={(e) => setPixelForgeCustomArg(e.target.value)}
                          placeholder="Ex: --cabo=0.85 --curvatura=1.1"
                          className="flex-1 bg-beige-50 border border-beige-300 rounded px-2 py-1 text-[11px] font-mono text-espresso-950 focus:outline-none focus:border-gold-500"
                        />
                        <button
                          type="button"
                          onClick={() => onReplayDelta(v.id, pixelForgeCustomArg)}
                          className="px-2.5 py-1 bg-gold-100 hover:bg-gold-200 border border-gold-300 text-gold-900 rounded text-[10px] font-mono font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs"
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
            <div className="p-5 rounded-xl border border-beige-300 bg-white shadow-warm">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950">
                    Prancha Comparativa PIL (512×112px com Escala Master 1024px)
                  </h3>
                  <p className="text-xs text-espresso-600 font-mono">
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
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold transition flex items-center gap-1.5 cursor-pointer border border-gold-300"
                >
                  <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Exportar Master 1024px</span>
                </button>
              </div>

              {/* Simulated PIL Board */}
              <div className="p-6 rounded-lg bg-beige-50 border border-beige-300 flex flex-col items-center">
                <div className="w-full flex justify-around text-[10px] font-mono text-espresso-500 mb-2 border-b border-beige-300 pb-1 font-bold">
                  <span>[X: 0..112] Variante 1</span>
                  <span>[X: 112..224] Variante 2</span>
                  <span>[X: 224..336] Variante 3</span>
                </div>

                <div className="flex items-center justify-around w-full max-w-3xl py-4 bg-white rounded-lg border border-beige-300 shadow-inner">
                  {[1, 2, 3].map((id) => (
                    <div key={id} className="flex flex-col items-center">
                      {PixelSwordPreview && <PixelSwordPreview variantId={id} zoomScale={1.5} />}
                      <span className="mt-2 text-xs font-mono text-espresso-950 font-extrabold">
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
            <div className="lg:col-span-7 p-5 rounded-xl border border-beige-300 bg-white shadow-warm">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950">
                    Simulador de Bolsa / Hotbar (Capybound RPG)
                  </h3>
                  <p className="text-xs text-espresso-600 font-mono">
                    Item equipado no slot primário para validação de legibilidade em jogo.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300">
                  HUD Ativo: 16 slots
                </span>
              </div>

              <div className="p-4 rounded-xl border-2 border-beige-300 bg-beige-50 grid grid-cols-4 gap-3 max-w-md mx-auto shadow-inner">
                {/* Slot 1: Equipped sword */}
                <div className="aspect-square rounded-lg border-2 border-gold-500 bg-gold-50 p-1.5 flex flex-col items-center justify-center relative shadow-gold group">
                  {PixelSwordPreview && (
                    <PixelSwordPreview
                      variantId={pixelForgeVariants.find((v) => v.approved)?.id || 1}
                      zoomScale={0.7}
                    />
                  )}
                  <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-gold-900 font-extrabold">
                    1
                  </span>
                </div>

                {/* Slots 2 to 16 */}
                {Array.from({ length: 15 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg border border-beige-300 bg-white flex items-center justify-center text-espresso-400 text-xs font-mono shadow-xs"
                  >
                    {idx === 0 ? '🧪' : idx === 1 ? '🍎' : idx === 2 ? '🛡️' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Playwright Report */}
            <div className="lg:col-span-5 p-5 rounded-xl border border-beige-300 bg-white flex flex-col justify-between shadow-warm">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 font-mono">
                    Playwright Visual Hotbar Test
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                    4/4 PASSED (142ms)
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded bg-beige-50 border border-emerald-300 text-emerald-900 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Slot 112px contido em 128px com margem 8px</span>
                  </div>
                  <div className="p-2.5 rounded bg-beige-50 border border-emerald-300 text-emerald-900 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Contraste em fundo: 4.82:1 &gt;= 4.5:1 (WCAG AA+)</span>
                  </div>
                  <div className="p-2.5 rounded bg-beige-50 border border-emerald-300 text-emerald-900 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ramp de cor: 4 faixas estritas [15, 35, 35, 15]</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-beige-200 mt-4">
                <button
                  type="button"
                  onClick={onRunPlaywrightTest}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold transition flex items-center justify-center gap-2 font-mono cursor-pointer border border-gold-300"
                >
                  <IconZap className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Re-executar Suíte Playwright</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
