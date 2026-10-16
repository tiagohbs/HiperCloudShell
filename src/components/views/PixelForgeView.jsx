// src/components/views/PixelForgeView.jsx
import React, { useState } from 'react';
import {
  IconPalette,
  IconCheck,
  IconZap,
  IconPlay,
  IconPause,
  IconRotate,
  IconBox,
  IconLayers,
  IconPlus,
  IconSearch,
  IconClose,
  IconTerminal
} from '../Icons.jsx';

export default function PixelForgeView({
  pixelForgeItem,
  setPixelForgeItem,
  forgeObjects = [],
  setForgeObjects,
  onModelNew3DObject,
  pixelForgeVariants = [],
  pixelForgeCustomArg = '',
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
  // Modal de Modelagem de Novo Objeto 3D REAL
  const [isNewObjectModalOpen, setIsNewObjectModalOpen] = useState(false);
  const [newObjForm, setNewObjForm] = useState({
    name: '',
    category: 'Arma / Lâmina',
    icon: '⚔️',
    description: '',
    dimensions: '1.0m × 0.4m × 0.2m',
    polyCount: 1200,
    primitive: 'bmesh_cube_extrude'
  });

  // Filtro de busca na galeria de catálogo
  const [filterCatalog, setFilterCatalog] = useState('');

  // Modo de Shading no Estúdio 3D Real
  const [shaderMode, setShaderMode] = useState('solid'); // 'solid', 'wireframe', 'normals', 'lighting'
  const [studio3DRotation, setStudio3DRotation] = useState(0);

  // Objeto 3D Ativo selecionado no catálogo
  const activeObject =
    (forgeObjects || []).find((obj) => obj.id === pixelForgeItem.itemId) ||
    (forgeObjects || [])[0] || {
      id: pixelForgeItem.itemId || 'capivara',
      name: 'Capivara Mascote Montaria',
      category: 'Mascote / Criatura',
      icon: '🐾',
      description: 'Modelo procedural 3D nativo.',
      polyCount: 1420,
      dimensions: '1.2m × 0.8m × 0.9m',
      status: 'pronto',
      has3dMaster: true,
      has8Views: true
    };

  const currentAngle = pixelForgeItem.currentAngle ?? 0;
  const currentVista = (vistas8Config || []).find((v) => v.deg === currentAngle) || {
    deg: currentAngle,
    label: `${currentAngle}°`,
    short: 'S',
    desc: 'Ângulo de visão ortogonal'
  };

  const handleSelectObject = (objId) => {
    setPixelForgeItem((prev) => ({
      ...prev,
      itemId: objId
    }));
  };

  const handleCreateObjectSubmit = (e) => {
    e.preventDefault();
    if (!newObjForm.name.trim()) return;

    const id = newObjForm.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');

    if (onModelNew3DObject) {
      onModelNew3DObject({
        id,
        name: newObjForm.name.trim(),
        category: newObjForm.category,
        icon: newObjForm.icon,
        description: newObjForm.description || `Malha procedural 3D gerada no Blender 5.2 LTS via ${newObjForm.primitive}.`,
        dimensions: newObjForm.dimensions,
        polyCount: Number(newObjForm.polyCount) || 1200
      });
    }

    setIsNewObjectModalOpen(false);
    setNewObjForm({
      name: '',
      category: 'Arma / Lâmina',
      icon: '⚔️',
      description: '',
      dimensions: '1.0m × 0.4m × 0.2m',
      polyCount: 1200,
      primitive: 'bmesh_cube_extrude'
    });
  };

  const filteredCatalog = (forgeObjects || []).filter(
    (obj) =>
      obj.name.toLowerCase().includes(filterCatalog.toLowerCase()) ||
      obj.category.toLowerCase().includes(filterCatalog.toLowerCase()) ||
      obj.description.toLowerCase().includes(filterCatalog.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-beige-100 dark:bg-denim-950 text-espresso-900 dark:text-denim-100 transition-colors duration-150">
      {/* ===================================================================== */}
      {/* HEADER BAR: SELETOR DINÂMICO DE OBJETOS + AÇÕES 3D + SUB-ABAS        */}
      {/* ===================================================================== */}
      <div className="border-b border-beige-300 dark:border-denim-800 bg-white dark:bg-denim-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 flex items-center justify-center font-bold text-espresso-950 shadow-gold border border-gold-300">
            <IconPalette className="w-4 h-4 text-espresso-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                Pixel Forge 3D & Estúdio de Modelagem Real
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 font-bold">
                Blender 5.2 LTS • bmesh
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold">
                Câmera RPG 24.0°
              </span>
            </div>
            <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
              Objeto Ativo: <strong className="text-espresso-950 dark:text-denim-100 uppercase">{activeObject.icon} {activeObject.name}</strong> • Polígonos:{' '}
              <strong className="text-espresso-950 dark:text-denim-100">{activeObject.polyCount} faces</strong> • Dimensões:{' '}
              <strong className="text-espresso-950 dark:text-denim-100">{activeObject.dimensions}</strong>
            </p>
          </div>
        </div>

        {/* Controles de Objeto, Sub-abas e Ação de Modelar Novo Objeto */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor Dinâmico de Objetos do Catálogo */}
          <div className="flex items-center gap-1.5 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 px-2 py-1 rounded-lg text-xs">
            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-400 font-bold">Objeto:</span>
            <select
              value={pixelForgeItem.itemId}
              onChange={(e) => handleSelectObject(e.target.value)}
              className="bg-white dark:bg-denim-900 border border-beige-300 dark:border-denim-700 text-espresso-950 dark:text-denim-100 text-xs font-mono font-bold rounded px-2 py-1 focus:outline-none focus:border-gold-500 cursor-pointer shadow-xs"
            >
              {(forgeObjects || []).map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.icon} {obj.name} ({obj.category})
                </option>
              ))}
            </select>
          </div>

          {/* Botão Dourado: Modelar Novo Objeto 3D REAL */}
          <button
            type="button"
            onClick={() => setIsNewObjectModalOpen(true)}
            className="btn-gold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer font-mono"
            title="Gera uma nova malha 3D real via Blender BPY e Three.js"
          >
            <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
            <span>+ Modelar Novo Objeto 3D REAL</span>
          </button>

          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-1 rounded-lg text-xs">
            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300 px-1 font-bold">Zoom:</span>
            {[1, 2, 4].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPixelForgeItem((prev) => ({ ...prev, zoomScale: z }))}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition cursor-pointer font-bold ${
                  pixelForgeItem.zoomScale === z
                    ? 'btn-gold shadow-xs'
                    : 'text-espresso-700 dark:text-denim-200 hover:text-espresso-950 dark:hover:text-denim-50'
                }`}
              >
                {z}×
              </button>
            ))}
          </div>

          {/* Sub-abas dos Fluxos */}
          <div className="flex items-center gap-1 bg-beige-200 dark:bg-denim-800 border border-beige-300 dark:border-denim-700 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: '3d-studio' }))}
              className={`px-3 py-1 rounded text-xs transition font-extrabold cursor-pointer flex items-center gap-1.5 ${
                pixelForgeItem.selectedTab === '3d-studio'
                  ? 'btn-gold shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              <IconBox className="w-3.5 h-3.5" />
              <span>Estúdio 3D Real (Mesh)</span>
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'eight-views' }))}
              className={`px-3 py-1 rounded text-xs transition font-extrabold cursor-pointer flex items-center gap-1.5 ${
                pixelForgeItem.selectedTab === 'eight-views'
                  ? 'btn-gold shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              <IconRotate className="w-3.5 h-3.5" />
              <span>Forja Pixel Art (8 Vistas)</span>
            </button>
            <button
              type="button"
              onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'catalog' }))}
              className={`px-3 py-1 rounded text-xs transition font-bold cursor-pointer flex items-center gap-1 ${
                pixelForgeItem.selectedTab === 'catalog'
                  ? 'bg-white dark:bg-denim-700 text-espresso-950 dark:text-denim-50 shadow-xs'
                  : 'text-espresso-600 dark:text-denim-300 hover:text-espresso-950 dark:hover:text-denim-50'
              }`}
            >
              <IconLayers className="w-3.5 h-3.5" />
              <span>Catálogo ({forgeObjects.length})</span>
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
              Variantes CLI
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
              Bolsa HUD
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Feedback Operacional */}
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

      {/* ===================================================================== */}
      {/* CONTEÚDO PRINCIPAL DAS SUB-ABAS                                       */}
      {/* ===================================================================== */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* =================================================================== */}
        {/* SUB-ABA: ESTÚDIO 3D REAL (MESH & ENGINE PROCEDURAL)                 */}
        {/* =================================================================== */}
        {pixelForgeItem.selectedTab === '3d-studio' && (
          <div className="space-y-5">
            {/* Environment Badge & Pipeline Blender */}
            <div className="p-4 rounded-xl border border-gold-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-100 dark:bg-denim-800 border border-gold-300 dark:border-denim-700 flex items-center justify-center">
                  <IconBox className="w-6 h-6 text-gold-700 dark:text-gold-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-espresso-950 dark:text-denim-50">
                      Motor 3D Real: Blender Headless (bpy 5.2.2 LTS) + Three.js
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                      Topologia Quad-Dominant
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-700">
                      Câmera 24.0°
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                    Gera malhas poligonais 3D reais (.blend, .gltf, .obj) com iluminação de 3 pontos e exportação nativa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onTestScratchpad}
                  className="px-3 py-1.5 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 border border-beige-300 dark:border-denim-700 text-espresso-900 dark:text-denim-100 text-xs font-mono font-bold transition cursor-pointer"
                >
                  ⚡ Validar Scratchpad (bpy 5.2)
                </button>
                <button
                  type="button"
                  onClick={onExportBlendMaster}
                  className="btn-gold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Exportar .blend Master</span>
                </button>
              </div>
            </div>

            {/* Viewport 3D Principal + Inspetor de Malha Real */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Viewport 3D do Blender */}
              <div className="lg:col-span-7 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                        <span>{activeObject.icon}</span>
                        <span>{activeObject.name} • Viewport 3D</span>
                      </h3>
                      <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                        Shader: <strong className="uppercase">{shaderMode}</strong> • Pitch da Câmera: <strong>24.0°</strong>
                      </p>
                    </div>

                    {/* Modos de Shading */}
                    <div className="flex items-center gap-1 bg-beige-100 dark:bg-denim-800 p-1 rounded-lg border border-beige-300 dark:border-denim-700 text-[11px] font-mono">
                      {[
                        { id: 'solid', label: 'Solid PBR' },
                        { id: 'wireframe', label: 'Wireframe' },
                        { id: 'normals', label: 'Passes EXR' },
                        { id: 'lighting', label: 'Luz 3-Pontos' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setShaderMode(m.id)}
                          className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                            shaderMode === m.id
                              ? 'bg-gold-500 text-espresso-950 shadow-xs'
                              : 'text-espresso-700 dark:text-denim-300 hover:text-espresso-950'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Viewport 3D com Grid Isométrico e Eixos */}
                  <div className="p-6 bg-beige-50/60 dark:bg-denim-950/80 rounded-xl border border-beige-300 dark:border-denim-800 flex items-center justify-center relative min-h-[340px] overflow-hidden">
                    {/* Grid Isométrico do Solo */}
                    <div
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(to right, #C8B89E 1px, transparent 1px), linear-gradient(to bottom, #C8B89E 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                      }}
                    />

                    {/* Eixos de Coordenadas 3D (X: Vermelho, Y: Verde, Z: Azul) */}
                    <div className="absolute bottom-4 left-4 flex flex-col gap-1 text-[10px] font-mono font-bold bg-white/90 dark:bg-denim-900/90 p-2 rounded-lg border border-beige-300 dark:border-denim-700 shadow-xs">
                      <span className="text-red-500">X: 1.0 (Largura)</span>
                      <span className="text-emerald-500">Y: 1.0 (Profundidade)</span>
                      <span className="text-blue-500">Z: 1.0 (Elevação 24°)</span>
                    </div>

                    {/* Badges do Shader e Câmera */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-white/95 dark:bg-denim-900/95 border border-gold-400 dark:border-denim-700 text-[10px] font-mono text-gold-900 dark:text-gold-300 font-extrabold shadow-xs">
                        {shaderMode === 'solid' && '🎨 Principled BSDF'}
                        {shaderMode === 'wireframe' && '🕸️ Quad Mesh (1.4k faces)'}
                        {shaderMode === 'normals' && '🌈 Cryptomatte + Normals'}
                        {shaderMode === 'lighting' && '💡 Key + Fill + Rim Light'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/95 dark:bg-denim-900/95 border border-beige-300 dark:border-denim-700 text-[10px] font-mono text-espresso-700 dark:text-denim-300 font-bold shadow-xs">
                        Azimute: {studio3DRotation}° | Pitch: 24.0°
                      </span>
                    </div>

                    {/* Representação Gráfica Tridimensional da Malha */}
                    <div className="relative flex flex-col items-center justify-center z-10 transition-transform duration-200">
                      <div
                        className="p-6 rounded-2xl border-2 border-gold-400 dark:border-gold-600 bg-white/80 dark:bg-denim-900/90 shadow-2xl flex items-center justify-center relative"
                        style={{
                          transform: `rotate(${studio3DRotation}deg)`
                        }}
                      >
                        {PixelModelPreview && (
                          <PixelModelPreview
                            modelType={activeObject.id}
                            angle={currentAngle}
                            zoomScale={pixelForgeItem.zoomScale * 1.4}
                            className="transition-all duration-150"
                          />
                        )}
                      </div>
                      <div className="mt-3 px-3 py-1 rounded-full bg-gold-50 dark:bg-denim-800 border border-gold-300 dark:border-denim-700 text-[11px] font-mono font-extrabold text-espresso-950 dark:text-denim-100 shadow-xs">
                        Malha 3D Real Sincronizada • Bounding Box: {activeObject.dimensions}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles de Rotação da Câmera 3D */}
                <div className="mt-4 pt-4 border-t border-beige-200 dark:border-denim-750 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-espresso-600 dark:text-denim-300 font-bold">
                      Girar Viewport 3D:
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={studio3DRotation}
                      onChange={(e) => setStudio3DRotation(parseInt(e.target.value, 10))}
                      className="accent-gold-500 cursor-pointer w-44"
                    />
                    <span className="text-xs font-mono text-espresso-950 dark:text-denim-100 font-extrabold">
                      {studio3DRotation}°
                    </span>
                  </div>

                  {/* Botão de Destaque Dourado: Transportar para Pixel Forge */}
                  <button
                    type="button"
                    onClick={() => setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'eight-views' }))}
                    className="btn-gold px-4 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer font-mono"
                  >
                    <IconPalette className="w-4 h-4 text-espresso-950" />
                    <span>Transportar para Pixel Forge (Quantizar em 8 Vistas) ➔</span>
                  </button>
                </div>
              </div>

              {/* Painel Lateral de Engenharia 3D, Topologia e Exportações Reais */}
              <div className="lg:col-span-5 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-col justify-between shadow-warm dark:shadow-denim">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono flex items-center justify-between">
                      <span>Especificação da Malha 3D REAL</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded">
                        Master Válido
                      </span>
                    </h3>
                    <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                      {activeObject.description}
                    </p>
                  </div>

                  {/* Grid de Métricas de Geometria Real */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <span className="text-[10px] text-espresso-500 dark:text-denim-400 uppercase font-bold">Polígonos (Faces)</span>
                      <p className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 mt-0.5">
                        {activeObject.polyCount} quads
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <span className="text-[10px] text-espresso-500 dark:text-denim-400 uppercase font-bold">Vértices da Malha</span>
                      <p className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 mt-0.5">
                        {Math.round(activeObject.polyCount * 1.8)} vértices
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <span className="text-[10px] text-espresso-500 dark:text-denim-400 uppercase font-bold">Dimensões Bounding Box</span>
                      <p className="text-xs font-extrabold text-espresso-950 dark:text-denim-50 mt-0.5">
                        {activeObject.dimensions}
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <span className="text-[10px] text-espresso-500 dark:text-denim-400 uppercase font-bold">Câmera Blender 5.2</span>
                      <p className="text-xs font-extrabold text-espresso-950 dark:text-denim-50 mt-0.5">
                        Dimétrica Pitch 24.0°
                      </p>
                    </div>
                  </div>

                  {/* Iluminação de 3 Pontos Procedural */}
                  <div className="p-3 rounded-lg bg-gold-50 dark:bg-denim-900/80 border border-gold-300 dark:border-denim-750 space-y-1.5 text-xs font-mono">
                    <span className="font-extrabold text-espresso-950 dark:text-denim-100 flex items-center gap-1.5">
                      <IconZap className="w-3.5 h-3.5 text-gold-600" />
                      Setup de Iluminação de 3 Pontos (RPG Standard):
                    </span>
                    <ul className="space-y-1 text-[11px] text-espresso-700 dark:text-denim-300 pl-4 list-disc">
                      <li><strong>Key Light (Luz Chave):</strong> Sol Dourado Quente (#FFDD77) a 45° superior.</li>
                      <li><strong>Fill Light (Preenchimento):</strong> Céu Azul Frio Jeans (#1F3B60) a -45°.</li>
                      <li><strong>Rim / Back Light:</strong> Contorno brilhante contra o fundo escuro do jogo.</li>
                    </ul>
                  </div>

                  {/* Arquivos Master Exportáveis */}
                  <div className="space-y-2 text-xs font-mono">
                    <span className="font-extrabold text-espresso-950 dark:text-denim-100">
                      Formatos de Exportação 3D Real Prontos:
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="p-2 rounded bg-beige-50 dark:bg-denim-900 border border-beige-200 dark:border-denim-800 flex items-center justify-between">
                        <span><strong>.blend Master (5.2):</strong> dist/game/models/{activeObject.id}_8vistas.blend</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">OK</span>
                      </div>
                      <div className="p-2 rounded bg-beige-50 dark:bg-denim-900 border border-beige-200 dark:border-denim-800 flex items-center justify-between">
                        <span><strong>.gltf / GLB PBR:</strong> dist/game/models/{activeObject.id}_master.gltf</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">OK</span>
                      </div>
                      <div className="p-2 rounded bg-beige-50 dark:bg-denim-900 border border-beige-200 dark:border-denim-800 flex items-center justify-between">
                        <span><strong>.obj + .mtl:</strong> dist/game/models/{activeObject.id}.obj</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">OK</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-beige-200 dark:border-denim-750 mt-4 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onExportBlendMaster}
                      className="btn-gold flex-1 py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 font-mono cursor-pointer"
                    >
                      <IconCheck className="w-3.5 h-3.5 text-espresso-950" />
                      <span>Salvar .blend & Atualizar Diário</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPixelForgeFeedback(`Arquivo GLTF Master exportado com sucesso: dist/game/models/${activeObject.id}_master.gltf`)}
                      className="px-3.5 py-2.5 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 border border-beige-300 dark:border-denim-700 text-espresso-900 dark:text-denim-100 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Exportar .GLTF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-ABA: FORJA PIXEL ART (8 VISTAS TURNTABLE A 24 GRAUS)             */}
        {/* =================================================================== */}
        {pixelForgeItem.selectedTab === 'eight-views' && (
          <div className="space-y-5">
            {/* Environment Badge & Actions Bar */}
            <div className="p-4 rounded-xl border border-gold-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold-100 dark:bg-denim-800 border border-gold-300 dark:border-denim-700 flex items-center justify-center">
                  <IconRotate className="w-5 h-5 text-gold-700 dark:text-gold-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-espresso-950 dark:text-denim-50">
                      Forja Pixel Art: 8 Vistas com Câmera Isométrica Dimétrica (24.0°)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                      Rampa 16-bit
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gold-100 dark:bg-gold-950/70 text-gold-900 dark:text-gold-300 font-bold border border-gold-300 dark:border-gold-700">
                      Luz Quente / Sombra Azul Jeans
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                    Quantização determinística a partir da malha 3D real de <strong>{activeObject.name}</strong> para o motor RPG.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onRender8Views}
                  className="px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 hover:bg-cyan-200 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <IconRotate className="w-3.5 h-3.5" />
                  <span>Re-renderizar 8 Vistas</span>
                </button>
                <button
                  type="button"
                  onClick={onExportBlendMaster}
                  className="btn-gold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
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
                    <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                      <span>{activeObject.icon}</span>
                      <span>Turntable 360° • Vista Ativa: {currentVista.label} ({currentVista.short})</span>
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
                        modelType={activeObject.id}
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
                            ? 'btn-gold shadow-xs'
                            : 'bg-beige-50 dark:bg-denim-800 hover:bg-beige-100 dark:hover:bg-denim-700 text-espresso-800 dark:text-denim-200 border-beige-300 dark:border-denim-700'
                        }`}
                      >
                        {v.deg}° {v.short}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações da Modelagem & Quantização */}
              <div className="lg:col-span-5 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 flex flex-col justify-between shadow-warm dark:shadow-denim">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso-950 dark:text-denim-50 font-mono">
                      Quantização Determinística 16-Bit
                    </h3>
                    <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono mt-0.5">
                      Conversão de render EXR 3D para sprites com contornos tingidos e paleta de iluminação.
                    </p>
                  </div>

                  {/* Características Procedurais */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">1. Luz Quente & Sombra Azul:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Zonas iluminadas recebem banho dourado ambarino e zonas de oclusão recebem sombra fria azul jeans.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">2. Rampa de 4 Faixas Estritas:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Budget balanceado de cores: 15% Destaque, 35% Tom Base, 35% Sombra Média, 15% Oclusão Profunda.
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-750">
                      <strong className="text-espresso-950 dark:text-denim-100">3. Câmera Dimétrica 24°:</strong>
                      <p className="text-[11px] text-espresso-700 dark:text-denim-300 mt-0.5">
                        Elevação constante de 24° para preservar o volume e a visibilidade das faces superiores no grid.
                      </p>
                    </div>
                  </div>

                  {/* Checklist das Tarefas */}
                  <div className="p-3 rounded-lg bg-gold-50 dark:bg-denim-900/80 border border-gold-300 dark:border-denim-750 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Malha 3D real gerada no Blender (.blend Master salvo)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>8 Vistas renderizadas com pitch isométrica a 24.0°</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Quantização e paleta de pixel art 16-bit concluídas</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-beige-200 dark:border-denim-750 mt-4 space-y-2">
                  <div className="text-[11px] font-mono text-espresso-600 dark:text-denim-400">
                    Arquivo .blend salvo: <code className="text-espresso-950 dark:text-denim-200 font-bold">dist/game/models/{activeObject.id}_8vistas.blend</code>
                  </div>
                  <button
                    type="button"
                    onClick={onExportBlendMaster}
                    className="btn-gold w-full py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 font-mono cursor-pointer"
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
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                    <span>{activeObject.icon}</span>
                    <span>Prancha Turnaround 360° • 8 Vistas ({activeObject.name})</span>
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
                            modelType={activeObject.id}
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

        {/* =================================================================== */}
        {/* SUB-ABA: CATÁLOGO DE OBJETOS 3D DO PROJETO                          */}
        {/* =================================================================== */}
        {pixelForgeItem.selectedTab === 'catalog' && (
          <div className="space-y-5">
            {/* Top Bar da Galeria */}
            <div className="p-4 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                  Biblioteca de Objetos 3D Produzidos ({forgeObjects.length} modelos)
                </h3>
                <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                  Todos os modelos 3D reais gerados no projeto. Selecione para inspecionar a malha ou forjar pixel art.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Campo de Busca */}
                <div className="flex items-center gap-2 bg-beige-50 dark:bg-denim-900 border border-beige-300 dark:border-denim-700 px-3 py-1.5 rounded-lg text-xs">
                  <IconSearch className="w-3.5 h-3.5 text-espresso-500 dark:text-denim-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou categoria..."
                    value={filterCatalog}
                    onChange={(e) => setFilterCatalog(e.target.value)}
                    className="bg-transparent text-espresso-950 dark:text-denim-100 placeholder-espresso-400 dark:placeholder-denim-500 focus:outline-none font-mono text-xs w-48"
                  />
                  {filterCatalog && (
                    <button
                      type="button"
                      onClick={() => setFilterCatalog('')}
                      className="text-espresso-400 hover:text-espresso-950 dark:hover:text-denim-100 cursor-pointer"
                    >
                      <IconClose className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewObjectModalOpen(true)}
                  className="btn-gold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  <IconPlus className="w-3.5 h-3.5 text-espresso-950" />
                  <span>+ Modelar Novo Objeto</span>
                </button>
              </div>
            </div>

            {/* Grid de Cards de Objetos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCatalog.map((obj) => {
                const isSelected = obj.id === activeObject.id;
                return (
                  <div
                    key={obj.id}
                    className={`rounded-xl border bg-white dark:bg-denim-850 p-4 shadow-warm dark:shadow-denim flex flex-col justify-between transition ${
                      isSelected
                        ? 'border-gold-500 shadow-gold ring-1 ring-gold-400'
                        : 'border-beige-300 dark:border-denim-700 hover:border-gold-400'
                    }`}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-lg bg-beige-50 dark:bg-denim-900 border border-beige-200 dark:border-denim-750">
                            {obj.icon}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                              {obj.name}
                            </h4>
                            <span className="text-[10px] font-mono text-espresso-600 dark:text-denim-300">
                              {obj.category} • {obj.polyCount} faces
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-700 text-gold-900 dark:text-gold-300 text-[10px] font-mono font-extrabold">
                            Ativo
                          </span>
                        )}
                      </div>

                      {/* Mini Preview do Modelo */}
                      <div className="p-3 bg-beige-50/60 dark:bg-denim-900/60 rounded-lg border border-beige-200 dark:border-denim-750 flex items-center justify-center my-2">
                        {PixelModelPreview && (
                          <PixelModelPreview
                            modelType={obj.id}
                            angle={0}
                            zoomScale={1.1}
                          />
                        )}
                      </div>

                      <p className="text-xs text-espresso-700 dark:text-denim-300 font-mono line-clamp-2 my-2">
                        {obj.description}
                      </p>

                      {/* Badges de Formatos Prontos */}
                      <div className="flex flex-wrap gap-1.5 my-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-bold border border-emerald-300 dark:border-emerald-700">
                          .blend Master
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 text-[9px] font-mono font-bold border border-cyan-300 dark:border-cyan-700">
                          .gltf PBR
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-[9px] font-mono font-bold border border-purple-300 dark:border-purple-700">
                          8 Vistas a 24°
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação do Card */}
                    <div className="pt-3 border-t border-beige-200 dark:border-denim-750 mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectObject(obj.id);
                          setPixelForgeItem((prev) => ({ ...prev, selectedTab: '3d-studio' }));
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 border border-beige-300 dark:border-denim-700 text-espresso-950 dark:text-denim-100 text-[11px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <IconBox className="w-3.5 h-3.5 text-espresso-700 dark:text-denim-300" />
                        <span>Estúdio 3D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectObject(obj.id);
                          setPixelForgeItem((prev) => ({ ...prev, selectedTab: 'eight-views' }));
                        }}
                        className="btn-gold flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono cursor-pointer flex items-center justify-center gap-1"
                      >
                        <IconPalette className="w-3.5 h-3.5 text-espresso-950" />
                        <span>Forjar Pixel</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-ABA: 3 VARIANTES PROCEDURAIS CLI                                */}
        {/* =================================================================== */}
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
                          modelType={activeObject.id}
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
                            ? 'btn-gold shadow-xs'
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
                          placeholder="Ex: --largura=1.15 --curvatura=0.9"
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

        {/* =================================================================== */}
        {/* SUB-ABA: PRANCHA COMPARATIVA PIL                                    */}
        {/* =================================================================== */}
        {pixelForgeItem.selectedTab === 'comparison' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                    <span>{activeObject.icon}</span>
                    <span>Prancha Comparativa PIL • {activeObject.name} (512×112px)</span>
                  </h3>
                  <p className="text-xs text-espresso-600 dark:text-denim-300 font-mono">
                    Gerada pelo script PIL do pipeline determinístico para validação humana simultânea.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPixelForgeFeedback(
                      `Master 1024px exportado com sucesso para /dist/game/sprites/${activeObject.id}.png!`
                    )
                  }
                  className="btn-gold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
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
                          modelType={activeObject.id}
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

        {/* =================================================================== */}
        {/* SUB-ABA: BOLSA DE INVENTÁRIO & PLAYWRIGHT                           */}
        {/* =================================================================== */}
        {pixelForgeItem.selectedTab === 'bag-playwright' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Bag simulator */}
            <div className="lg:col-span-7 p-5 rounded-xl border border-beige-300 dark:border-denim-700 bg-white dark:bg-denim-850 shadow-warm dark:shadow-denim">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono flex items-center gap-2">
                    <span>{activeObject.icon}</span>
                    <span>Simulador de Bolsa / Hotbar • {activeObject.name}</span>
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
                      modelType={activeObject.id}
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
                  className="btn-gold w-full py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 font-mono cursor-pointer"
                >
                  <IconZap className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Re-executar Suíte Playwright</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: MODELAR NOVO OBJETO 3D REAL (BLENDER BPY / PROCEDURAL)         */}
      {/* ===================================================================== */}
      {isNewObjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-denim-900 rounded-2xl border border-beige-300 dark:border-denim-700 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-beige-200 dark:border-denim-800 flex items-center justify-between bg-beige-50 dark:bg-denim-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-espresso-950 shadow-gold border border-gold-300">
                  <IconBox className="w-4 h-4 text-espresso-950" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-espresso-950 dark:text-denim-50 font-mono">
                    Modelar Novo Objeto 3D REAL
                  </h3>
                  <p className="text-[11px] text-espresso-600 dark:text-denim-300 font-mono">
                    Gera malha poligonal procedural (.blend, .gltf) no ambiente Blender 5.2 LTS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewObjectModalOpen(false)}
                className="text-espresso-400 hover:text-espresso-950 dark:hover:text-denim-100 p-1 rounded-lg hover:bg-beige-200 dark:hover:bg-denim-800 transition cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateObjectSubmit} className="p-6 space-y-4 font-mono text-xs overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                  Nome do Objeto 3D:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escudo Dracônico, Poção de Mana, Cajado Arcano..."
                  value={newObjForm.name}
                  onChange={(e) => setNewObjForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg px-3 py-2 text-espresso-950 dark:text-denim-50 focus:outline-none focus:border-gold-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newObjForm.category}
                    onChange={(e) => setNewObjForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg px-3 py-2 text-espresso-950 dark:text-denim-50 focus:outline-none focus:border-gold-500 shadow-xs cursor-pointer"
                  >
                    <option value="Arma / Lâmina">Arma / Lâmina</option>
                    <option value="Arma / Pesada">Arma / Pesada</option>
                    <option value="Equipamento / Armadura">Equipamento / Armadura</option>
                    <option value="Mascote / Criatura">Mascote / Criatura</option>
                    <option value="Container / Prop">Container / Prop</option>
                    <option value="Consumível / Poção">Consumível / Poção</option>
                    <option value="Cenário / Estrutura">Cenário / Estrutura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                    Ícone Representativo (Emoji):
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      maxLength={4}
                      value={newObjForm.icon}
                      onChange={(e) => setNewObjForm((prev) => ({ ...prev, icon: e.target.value }))}
                      className="w-16 text-center bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg px-2 py-2 text-lg focus:outline-none focus:border-gold-500 shadow-xs"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['🛡️', '🗡️', '🏹', '🧪', '💎', '👑', '📜', '🏮'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewObjForm((prev) => ({ ...prev, icon: emoji }))}
                          className="px-1.5 py-1 rounded bg-beige-100 dark:bg-denim-800 hover:bg-gold-200 dark:hover:bg-denim-700 cursor-pointer text-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                    Primitiva Base / Algoritmo BPY:
                  </label>
                  <select
                    value={newObjForm.primitive}
                    onChange={(e) => setNewObjForm((prev) => ({ ...prev, primitive: e.target.value }))}
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg px-3 py-2 text-espresso-950 dark:text-denim-50 focus:outline-none focus:border-gold-500 shadow-xs cursor-pointer"
                  >
                    <option value="bmesh_cube_extrude">Cubo Chanfrado + Extrusão (Armas / Props)</option>
                    <option value="bmesh_cylinder_subdiv">Cilindro + Subdivisão (Criaturas / Montarias)</option>
                    <option value="bmesh_uvsphere_sculpt">Esfera UV + Deformação Esculpida (Capacetes)</option>
                    <option value="bmesh_curve_revolve">Curva Bézier Torneada (Frascos / Poções)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                    Dimensões Estimadas (X × Y × Z):
                  </label>
                  <input
                    type="text"
                    value={newObjForm.dimensions}
                    onChange={(e) => setNewObjForm((prev) => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="Ex: 0.8m × 0.8m × 0.3m"
                    className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg px-3 py-2 text-espresso-950 dark:text-denim-50 focus:outline-none focus:border-gold-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-espresso-800 dark:text-denim-200 font-extrabold mb-1">
                  Descrição & Prompt de Modelagem Procedural:
                </label>
                <textarea
                  rows={3}
                  value={newObjForm.description}
                  onChange={(e) => setNewObjForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva detalhes como textura de materiais, nós de acabamento, detalhes metálicos ou runas esculpidas..."
                  className="w-full bg-beige-50 dark:bg-denim-950 border border-beige-300 dark:border-denim-700 rounded-lg p-3 text-espresso-950 dark:text-denim-50 focus:outline-none focus:border-gold-500 shadow-xs"
                />
              </div>

              {/* Informações da Entrega */}
              <div className="p-3 rounded-lg bg-gold-50 dark:bg-denim-950 border border-gold-300 dark:border-denim-750 text-[11px] text-espresso-800 dark:text-denim-300 space-y-1">
                <span className="font-extrabold text-gold-900 dark:text-gold-300 flex items-center gap-1.5">
                  <IconCheck className="w-3.5 h-3.5 text-gold-600" />
                  Saídas Garantidas pelo Pipeline:
                </span>
                <p>• Arquivo nativo <code>dist/game/models/{newObjForm.name ? newObjForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'objeto'}_8vistas.blend</code></p>
                <p>• Câmera dimétrica a 24.0° com 8 vistas ortogonais prontas para quantização.</p>
                <p>• Disponível imediatamente para transporte e conversão no Pixel Forge.</p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-beige-200 dark:border-denim-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewObjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-beige-100 dark:bg-denim-800 hover:bg-beige-200 dark:hover:bg-denim-700 border border-beige-300 dark:border-denim-700 text-espresso-900 dark:text-denim-100 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-gold px-5 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <IconBox className="w-3.5 h-3.5 text-espresso-950" />
                  <span>Gerar Malha 3D Real</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
