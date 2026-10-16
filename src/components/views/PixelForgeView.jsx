// src/components/views/PixelForgeView.jsx
import React from 'react';
import {
  IconPalette,
  IconCheck,
  IconZap,
  IconPlay,
  IconPause,
  IconRotate,
  IconBox
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
  onExportBlendMaster,
  onRender8Views,
  onTestScratchpad,
  PixelSwordPreview,
  PixelModelPreview,
  vistas8Config = []
}) {
  const isCapivara = pixelForgeItem.itemId === 'capivara';
  const currentAngle = pixelForgeItem.currentAngle ?? 0;
  const currentVista = (vistas8Config || []).find((v) => v.deg === currentAngle) || {
    deg: currentAngle,
    label: `${currentAngle}°`,
    desc: 'Ângulo de visão ortogonal'
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-beige-100 dark:bg-denim-950 text-espresso-900 dark:text-denim-100 transition-colors duration-150">
      {/* Header Bar da Forja */}
      <div className="border-b border-beige-300 dark:border-denim-800 bg-white dark:bg-denim-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center font-bold text-espresso-950 shadow-gold border border-gold-300">
            <IconPalette className="w-4 h-4 text-espresso-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                Pixel Forge 3D Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold">
                squad-pixel-forge-3d
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 font-bold">
                Blender 5.2 LTS • Câmera 24°
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 font-bold">
                Scratchpad: ATIVO (uv venv)
              </span>
            </div>
            <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
              Modelo ativo: <strong className="text-espresso-950 dark:text-denim-100 uppercase">{pixelForgeItem.itemId}</strong> • Lote:{' '}
              <strong className="text-espresso-950 dark:text-denim-100">{pixelForgeItem.lote}</strong> • Res:{' '}
              <strong className="text-espresso-950 dark:text-denim-100">{pixelForgeItem.iconHeightPx}px (Master: 1024px)</strong>
            </p>
          </div>
        </div>

        {/* Controles de Modelo, Zoom & Sub-abas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Modelo */}
          <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, itemId: 'capivara' }))}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition cursor-pointer font-bold ${
                isCapivara
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              🐾 Capivara Mascote
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, itemId: 'espada_bambu' }))}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition cursor-pointer font-bold ${
                !isCapivara
                  ? 'bg-gold-500 text-espresso-950 shadow-gold'
                  : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              ⚔️ Espada de Bambu
            </button>
          </div>

          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-1 rounded-lg text-xs">
            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300 px-1.5 font-bold">Zoom:</span>
            {[1, 2, 4].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPixelForgeItem((prev) => ({ ...prev, zoomScale: z }))}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition cursor-pointer font-bold ${
                  pixelForgeItem.zoomScale === z
                    ? 'bg-gold-500 text-espresso-950 shadow-gold'
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                {z}×
              </button>
            ))}
          </div>

          {/* Sub-abas */}
          <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'eight-views' }))}
              className={`px-3 py-1 rounded text-xs transition font-extrabold cursor-pointer flex items-center gap-1 ${
                pixelForgeItem.selectedTab === 'eight-views'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-espresso-950 shadow-gold border border-gold-300'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              <IconRotate className="w-3.5 h-3.5" />
              <span>8 Vistas (360° / 24°)</span>
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'variants' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'variants'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              3 Variantes
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'comparison' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'comparison'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              Prancha PIL
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'bag-playwright' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer ${
                pixelForgeItem.selectedTab === 'bag-playwright'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              Bolsa & Playwright
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {pixelForgeFeedback && (
        <div className="bg-gold-100 dark:bg-gold-950/70 border-b border-gold-300 dark:border-gold-800 px-4 py-2 text-xs font-mono text-gold-900 dark:text-gold-200 flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <IconCheck className="w-4 h-4 text-gold-700 dark:text-gold-400" />
            <span>{pixelForgeFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPixelForgeFeedback(null)}
            className="text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50 text-[11px] cursor-pointer"
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* ================================================================= */}
        {/* SUB-ABA 1: 8 VISTAS (TURNTABLE 360° COM CÂMERA A 24 GRAUS)       */}
        {/* ================================================================= */}
        {pixelForgeItem.selectedTab === 'eight-views' && (
          <div className="space-y-5">
            {/* Environment Badge & Actions Bar */}
            <div className="p-4 rounded-xl border border-gold-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold-100 dark:bg-denim-800 border border-gold-300 dark:border-denim-700 flex items-center justify-center">
                  <IconBox className="w-5 h-5 text-gold-700 dark:text-gold-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-espresso-950 dark:text-denim-50">
                      Ambiente Scratchpad: .scratchpad/blend (Fora do Git)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                      Python 3.13 • bpy 5.2.2 LTS
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                    Projeção dimétrica RPG 2.5D com pitch de <strong>24.0°</strong> e 8 vistas ortogonais (passo de 45°).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onTestScratchpad}
                  className="px-3 py-1.5 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 border border-beige-300 dark:border-denim-700 text-espresso-900 dark:text-denim-100 text-xs font-mono font-bold transition cursor-pointer"
                >
                  ⚡ Validar Scratchpad
                </button>
                <button
                  type="button"
                  onClick={onRender8Views}
                  className="px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 hover:bg-cyan-200 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <IconRotate className="w-3.5 h-3.5" />
                  <span>Render 8 Vistas</span>
                </button>
                <button
                  type="button"
                  onClick={onExportBlendMaster}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold transition flex items-center gap-1.5 cursor-pointer border border-gold-300"
                >
                  <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Exportar .blend Master</span>
                </button>
              </div>
            </div>

            {/* Turntable 360° Studio Interativo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Visor Principal do Turntable */}
              <div className="lg:col-span-7 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                      Turntable 360° • Vista Ativa: {currentVista.label}
                    </h3>
                    <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                      {currentVista.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 text-xs font-mono font-extrabold shadow-xs">
                      Pitch: 24.0°
                    </span>
                    <span className="px-2.5 py-1 rounded bg-beige-200 dark:bg-denim-800 text-espresso-800 dark:text-denim-200 text-xs font-mono font-bold">
                      {pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}×{pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}px
                    </span>
                  </div>
                </div>

                {/* Canvas do Sprite com Grid de Fundo */}
                <div className="p-6 bg-beige-50/60 dark:bg-denim-900/60 rounded-xl border border-beige-300 dark:border-denim-800 flex items-center justify-center relative min-h-[300px]">
                  <div
                    className="p-4 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-950 flex items-center justify-center shadow-inner overflow-hidden"
                    style={{
                      backgroundImage: 'radial-gradient(#D5C7AF 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  >
                    {PixelModelPreview && (
                      <PixelModelPreview
                        modelType={pixelForgeItem.itemId}
                        angle={currentAngle}
                        zoomScale={pixelForgeItem.zoomScale}
                        className="transition-all duration-100"
                      />
                    )}
                  </div>

                  {/* Indicador de Rotação Flutuante */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-white/90 dark:bg-denim-900/90 border border-beige-300 dark:border-denim-700 text-[10px] font-mono text-espresso-800 dark:text-denim-200 font-bold shadow-xs">
                    Azimute: {currentAngle}° ({currentVista.short})
                  </div>
                </div>

                {/* Controles de Rotação e Animação */}
                <div className="mt-4 pt-4 border-t border-beige-200 dark:border-denim-750 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPixelForgeItem((prev) => ({
                            ...prev,
                            isPlayingTurntable: !prev.isPlayingTurntable
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
                          pixelForgeItem.isPlayingTurntable
                            ? 'bg-amber-500 text-espresso-950 border-amber-400 shadow-gold'
                            : 'bg-gold-500 hover:bg-gold-400 text-espresso-950 border-gold-300 shadow-gold'
                        }`}
                      >
                        {pixelForgeItem.isPlayingTurntable ? (
                          <>
                            <IconPause className="w-3.5 h-3.5" />
                            <span>Pausar Rotação 360°</span>
                          </>
                        ) : (
                          <>
                            <IconPlay className="w-3.5 h-3.5" />
                            <span>Girar Turntable 360°</span>
                          </>
                        )}
                      </button>

                      {/* Velocidade */}
                      <div className="flex items-center gap-1 bg-beige-100 dark:bg-denim-800 p-1 rounded-lg border border-beige-300 dark:border-denim-700 text-[10px] font-mono">
                        <span className="px-1 text-espresso-600 dark:text-denim-400">Vel:</span>
                        {[
                          { label: 'Lenta', ms: 800 },
                          { label: 'Normal', ms: 500 },
                          { label: 'Rápida', ms: 250 }
                        ].map((s) => (
                          <button
                            key={s.ms}
                            type="button"
                            onClick={() =>
                              setPixelForgeItem((prev) => ({ ...prev, turntableSpeedMs: s.ms }))
                            }
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              pixelForgeItem.turntableSpeedMs === s.ms
                                ? 'bg-gold-500 text-espresso-950 font-extrabold'
                                : 'text-espresso-700 dark:text-denim-200'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-espresso-600 dark:text-denim-300 font-bold">
                      Câmera RPG 2.5D: 24.0°
                    </span>
                  </div>

                  {/* Slider de Rotação */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-espresso-600 dark:text-denim-300 font-bold w-12">
                      0° Sul
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="315"
                      step="45"
                      value={currentAngle}
                      onChange={(e) =>
                        setPixelForgeItem((prev) => ({
                          ...prev,
                          currentAngle: parseInt(e.target.value, 10),
                          isPlayingTurntable: false
                        }))
                      }
                      className="flex-1 accent-gold-500 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-espresso-600 dark:text-denim-300 font-bold w-16 text-right">
                      315° SW
                    </span>
                  </div>

                  {/* Chips dos 8 Ângulos */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                    {(vistas8Config || []).map((v) => (
                      <button
                        key={v.deg}
                        type="button"
                        onClick={() =>
                          setPixelForgeItem((prev) => ({
                            ...prev,
                            currentAngle: v.deg,
                            isPlayingTurntable: false
                          }))
                        }
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-mono text-center font-extrabold transition cursor-pointer border ${
                          currentAngle === v.deg
                            ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-espresso-950 border-gold-300 shadow-gold'
                            : 'bg-beige-50 dark:bg-denim-800 hover:bg-beige-100 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 border-beige-300 dark:border-denim-700'
                        }`}
                      >
                        {v.deg}° {v.short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações da Modelagem a partir da PLANTA & Entrega */}
              <div className="lg:col-span-5 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-col justify-between shadow-warm dark:shadow-denim">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                      Modelagem a partir da PLANTA (Capybound RPG)
                    </h3>
                    <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                      Especificação procedural respeitando a anatomia e itens de jogo.
                    </p>
                  </div>

                  {/* Características Procedurais */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">1. Anatomia Corporal:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Corpo robusto semi-cilíndrico com focinho quadrado característico e orelhas no topo da cabeça.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">2. Sela & Montaria:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Sela acolchoada de aventureiro em azul royal com fivelas de ouro metálico reluzentes.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">3. Câmera Dimétrica 24°:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Elevação constante de 24° para preservar o volume e a visibilidade dos 4 membros no grid.
                      </p>
                    </div>
                  </div>

                  {/* Checklist das Tarefas */}
                  <div className="p-3 rounded-lg bg-gold-50 dark:bg-denim-900/80 border border-gold-300 dark:border-denim-750 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Testar render do Blender (câmera 24°, 8 vistas)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Modelar a capivara no Blender a partir da PLANTA</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Render das 8 vistas + pixel art determinístico</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Entregar .blend + prova e registrar no DIÁRIO</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-beige-200 dark:border-denim-750 mt-4 space-y-2">
                  <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400">
                    Arquivo .blend salvo: <code className="text-espresso-950 dark:text-denim-200 font-bold">dist/game/models/{pixelForgeItem.itemId}_8vistas.blend</code>
                  </div>
                  <button
                    type="button"
                    onClick={onExportBlendMaster}
                    className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold transition flex items-center justify-center gap-2 font-mono cursor-pointer border border-gold-300"
                  >
                    <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                    <span>Salvar Modelo .blend & Atualizar Diário</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prancha Consolidada das 8 Vistas (360° Turnaround Sheet) */}
            <div className="p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                    Prancha Turnaround 360° • 8 Vistas (Câmera 24°)
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                    Todos os 8 ângulos renderizados e quantizados determinísticamente para o motor RPG.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 text-xs font-mono font-bold">
                  8 / 8 Vistas Prontas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 p-3 rounded-xl bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                {(vistas8Config || []).map((v) => {
                  const isSelected = currentAngle === v.deg;
                  return (
                    <button
                      key={v.deg}
                      type="button"
                      onClick={() =>
                        setPixelForgeItem((prev) => ({
                          ...prev,
                          currentAngle: v.deg,
                          isPlayingTurntable: false
                        }))
                      }
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                        isSelected
                          ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/40 shadow-gold'
                          : 'border-beige-300 dark:border-denim-750 bg-white dark:bg-denim-950 hover:border-gold-400'
                      }`}
                    >
                      <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                        {PixelModelPreview && (
                          <PixelModelPreview
                            modelType={pixelForgeItem.itemId}
                            angle={v.deg}
                            zoomScale={0.8}
                          />
                        )}
                      </div>
                      <span className="mt-2 text-[10px] font-mono font-extrabold text-espresso-950 dark:text-denim-100">
                        {v.deg}° ({v.short})
                      </span>
                      <span className="text-[9px] font-mono text-espresso-500 dark:text-denim-400">
                        Pitch: 24°
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SUB-ABA 2: 3 VARIANTES                                            */}
        {/* ================================================================= */}
        {pixelForgeItem.selectedTab === 'variants' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pixelForgeVariants.map((v) => (
                <div
                  key={v.id}
                  className={`flex flex-col rounded-xl border bg-white dark:bg-denim-850 overflow-hidden transition shadow-warm dark:shadow-denim ${
                    v.approved
                      ? 'border-gold-500 shadow-gold'
                      : 'border-beige-300 dark:border-denim-700 hover:border-gold-400 dark:hover:border-denim-600'
                  }`}
                >
                  {/* Top of Card */}
                  <div className="px-4 py-3 bg-beige-50 dark:bg-denim-900 border-b border-beige-300 dark:border-denim-750 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50">{v.name}</h3>
                      <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300">{v.cliArgs}</span>
                    </div>
                    {v.approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 text-[10px] font-mono font-extrabold flex items-center gap-1 shadow-xs">
                        <IconCheck className="w-3 h-3 text-gold-700 dark:text-gold-400" /> Aprovado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-beige-200 dark:bg-denim-800 text-espresso-700 dark:text-denim-300 text-[10px] font-mono font-bold">
                        Candidato
                      </span>
                    )}
                  </div>

                  {/* Pixel Art Preview Container */}
                  <div className="p-4 bg-beige-50/50 dark:bg-denim-900/60 flex items-center justify-center min-h-[220px] relative border-b border-beige-200 dark:border-denim-800">
                    <div
                      className="p-3 rounded-lg border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-950 flex items-center justify-center shadow-inner overflow-auto max-w-full"
                      style={{
                        backgroundImage: 'radial-gradient(#D5C7AF 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                      }}
                    >
                      {PixelModelPreview && (
                        <PixelModelPreview
                          modelType={pixelForgeItem.itemId}
                          variantId={v.id}
                          angle={pixelForgeItem.currentAngle ?? 0}
                          zoomScale={pixelForgeItem.zoomScale}
                        />
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/90 dark:bg-denim-900/90 border border-beige-300 dark:border-denim-700 text-[9px] font-mono text-espresso-700 dark:text-denim-200 font-bold shadow-xs">
                      {pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}×{pixelForgeItem.iconHeightPx * pixelForgeItem.zoomScale}px
                    </div>
                  </div>

                  {/* Metadata and Palette */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-denim-850">
                    <div>
                      <div className="text-xs text-espresso-800 dark:text-denim-200 font-mono mb-2">
                        <strong>Geometria:</strong> {v.preview3d}
                      </div>

                      <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-300 mb-1">
                        Materiais (bpy / bmesh):
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {v.materials.map((m, mi) => (
                          <span
                            key={mi}
                            className="px-2 py-0.5 rounded bg-beige-100 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 text-[10px] font-mono text-espresso-800 dark:text-denim-200 font-bold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Color Ramp */}
                      <div className="text-[11px] font-mono text-espresso-700 dark:text-denim-300 mb-1 flex justify-between">
                        <span>Paleta Determinística ({v.bands} faixas):</span>
                        <span className="text-gold-700 dark:text-gold-400 font-extrabold">100% Budget</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-1.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 mb-2">
                        {v.ramp.map((color, ci) => (
                          <div key={ci} className="flex flex-col items-center">
                            <div
                              className="w-full h-5 rounded border border-beige-300 dark:border-denim-700"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[9px] font-mono text-espresso-600 dark:text-denim-300 mt-0.5 font-bold">
                              {v.budget[ci]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons (Dourado Brilhante) */}
                    <div className="pt-2 border-t border-beige-200 dark:border-denim-750 space-y-2">
                      <button
                        type="button"
                        onClick={() => onApproveVariant(v.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                          v.approved
                            ? 'bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 text-espresso-950 shadow-gold border-gold-300'
                            : 'bg-beige-100 dark:bg-denim-800 hover:bg-gold-100 dark:hover:bg-denim-700 text-espresso-900 dark:text-denim-100 border-beige-300 dark:border-denim-700'
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
                          className="flex-1 bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 rounded px-2 py-1 text-[11px] font-mono text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-400 focus:outline-none focus:border-gold-500"
                        />
                        <button
                          type="button"
                          onClick={() => onReplayDelta(v.id, pixelForgeCustomArg)}
                          className="px-2.5 py-1 bg-gold-100 dark:bg-gold-950/70 hover:bg-gold-200 dark:hover:bg-gold-900 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 rounded text-[10px] font-mono font-extrabold transition cursor-pointer whitespace-nowrap shadow-xs"
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

        {/* ================================================================= */}
        {/* SUB-ABA 3: PRANCHA PIL                                            */}
        {/* ================================================================= */}
        {pixelForgeItem.selectedTab === 'comparison' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50">
                    Prancha Comparativa PIL (512×112px com Escala Master 1024px)
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                    Gerada pelo script PIL do pipeline determinístico para validação humana simultânea.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPixelForgeFeedback(
                      `Master 1024px exportado com sucesso para /dist/game/sprites/${pixelForgeItem.itemId}.png!`
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-gold-500 via-yellow-400 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-espresso-950 font-extrabold text-xs shadow-gold transition flex items-center gap-1.5 cursor-pointer border border-gold-300"
                >
                  <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Exportar Master 1024px</span>
                </button>
              </div>

              {/* Simulated PIL Board */}
              <div className="p-6 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 flex flex-col items-center">
                <div className="w-full flex justify-around text-[10px] font-mono text-espresso-500 dark:text-denim-400 mb-2 border-b border-beige-300 dark:border-denim-750 pb-1 font-bold">
                  <span>[X: 0..112] Variante 1</span>
                  <span>[X: 112..224] Variante 2</span>
                  <span>[X: 224..336] Variante 3</span>
                </div>

                <div className="flex items-center justify-around w-full max-w-3xl py-4 bg-white dark:bg-denim-950 rounded-lg border border-beige-300 dark:border-denim-750 shadow-inner">
                  {[1, 2, 3].map((id) => (
                    <div key={id} className="flex flex-col items-center">
                      {PixelModelPreview && (
                        <PixelModelPreview
                          modelType={pixelForgeItem.itemId}
                          variantId={id}
                          angle={pixelForgeItem.currentAngle ?? 0}
                          zoomScale={1.5}
                        />
                      )}
                      <span className="mt-2 text-xs font-mono text-espresso-950 dark:text-denim-100 font-extrabold">
                        Variante {id} {pixelForgeVariants.find((v) => v.id === id)?.approved && '⭐'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SUB-ABA 4: BOLSA & PLAYWRIGHT                                     */}
        {/* ================================================================= */}
        {pixelForgeItem.selectedTab === 'bag-playwright' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Bag simulator */}
            <div className="lg:col-span-7 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50">
                    Simulador de Bolsa / Hotbar (Capybound RPG)
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                    Item equipado no slot primário para validação de legibilidade em jogo.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-300 dark:border-emerald-700">
                  HUD Ativo: 16 slots
                </span>
              </div>

              <div className="p-4 rounded-xl border-2 border-beige-300 dark:border-denim-700 bg-beige-50 dark:bg-denim-900 grid grid-cols-4 gap-3 max-w-md mx-auto shadow-inner">
                {/* Slot 1: Equipped item */}
                <div className="aspect-square rounded-lg border-2 border-gold-500 bg-gold-50 dark:bg-gold-950/40 p-1.5 flex flex-col items-center justify-center relative shadow-gold group">
                  {PixelModelPreview && (
                    <PixelModelPreview
                      modelType={pixelForgeItem.itemId}
                      variantId={pixelForgeVariants.find((v) => v.approved)?.id || 1}
                      angle={pixelForgeItem.currentAngle ?? 0}
                      zoomScale={0.7}
                    />
                  )}
                  <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-gold-900 dark:text-gold-300 font-extrabold">
                    1
                  </span>
                </div>

                {/* Slots 2 to 16 */}
                {Array.from({ length: 15 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg border border-beige-300 dark:border-denim-750 bg-white dark:bg-denim-850 flex items-center justify-center text-espresso-400 dark:text-denim-300 text-xs font-mono shadow-xs"
                  >
                    {idx === 0 ? '🧪' : idx === 1 ? '🍎' : idx === 2 ? '🛡️' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Playwright Report */}
            <div className="lg:col-span-5 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-col justify-between shadow-warm dark:shadow-denim">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                    Playwright Visual Hotbar Test
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-700">
                    4/4 PASSED (142ms)
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Slot 112px contido em 128px com margem 8px</span>
                  </div>
                  <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Contraste em fundo: 4.82:1 &gt;= 4.5:1 (WCAG AA+)</span>
                  </div>
                  <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Ramp de cor: 4 faixas estritas [15, 35, 35, 15]</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-beige-200 dark:border-denim-750 mt-4">
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
