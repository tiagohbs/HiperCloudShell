# Diário de Bordo — Pixel Forge 3D & Capybound RPG

Este documento registra todas as entregas de modelos procedurais 3D, configuração de ambiente isolado no Scratchpad (`uv venv blend --python 3.13`), testes de câmera de 24° e pranchas comparativas de 8 vistas (Turnaround 360°).

---

## [2026-10-16] Setup do Ambiente Scratchpad & Pipeline de 8 Vistas

### 1. Ambiente Isolado no Scratchpad (Fora do Repositório)
- **Comando de inicialização**:
  \`\`\`bash
  cd .scratchpad && uv venv blend --python 3.13 -q
  uv pip install --python blend/bin/python bpy
  \`\`\`
- **Motivação**: O `bpy` (Blender Python API ~5.2) e binários do Blender 4.5 LTS são instalados em sandbox isolado no scratchpad para não poluir o repositório git e manter o clone e git status instantâneos.
- **Rastreabilidade**: Adicionado ao `.gitignore` (`.scratchpad/`, `scratchpad/`, `*.blend`).

### 2. Câmera a 24° e 8 Vistas Multi-Ângulo (Turnaround 360°)
- **Elevação da Câmera**: 24.0° (projeção dimétrica clássica 2.5D RPG).
- **8 Vistas Ortogonais (passo de 45°)**:
  - `0°`: Sul (Frontal)
  - `45°`: Sudeste (SE)
  - `90°`: Leste (Perfil Direito)
  - `135°`: Nordeste (NE)
  - `180°`: Norte (Traseira / Costas)
  - `225°`: Noroeste (NW)
  - `270°`: Oeste (Perfil Esquerdo)
  - `315°`: Sudoeste (SW)

### 3. Modelagem Procedural da Capivara a partir da PLANTA
- **Script**: `tools/icones/capivara.py`
- **Perfil de Cor Determinístico**: `tools/icones/perfis/capivara.json`
- **Características**:
  - Proporções semi-cilíndricas fiéis à planta de montaria do Capybound RPG.
  - Focinho quadrado característico com orelhas arredondadas no topo.
  - 4 patas curtas e estáveis.
  - Sela acolchoada de aventureiro com fivelas metálicas douradas.
- **Entrega de Modelos Nativos**:
  - `dist/game/models/capivara_8vistas.blend`
  - `dist/game/models/espada_bambu_8vistas.blend`
- **Pranchas de Prova**:
  - Consolidação das 8 vistas em resolução Master 512px e Pixel Art determinístico 112px com escalonamento `Image.NEAREST`.

## [2026-10-16T18:31:29.853Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T18:32:13.775Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T18:42:35.659Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T18:44:49.656Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T19:00:54.524Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T19:06:03.561Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)

## [2026-10-16T19:07:27.072Z] Render 8 Vistas e Modelagem a partir da PLANTA: capivara
- **Camera Elevacao**: 24.0° (dimetrico RPG 2.5D)
- **8 Vistas (360°)**: 0° (Sul), 45° (SE), 90° (Leste), 135° (NE), 180° (Norte), 225° (NW), 270° (Oeste), 315° (SW)
- **Resolucao**: 256px (Master) -> 112px (Pixel Art 16-bit)
- **Arquivo .blend Master Entregue**: `C:\Users\DEV\Documents\HiperCloudShell\dist\game\models\capivara_8vistas.blend`
- **Ambiente Isolado**: Scratchpad (`uv venv blend --python 3.13` + bpy 5.2 fora do git)
- **Status do Gate**: APROVADO (zero violacoes de VRAM / zero numpy.float64 bugs)
