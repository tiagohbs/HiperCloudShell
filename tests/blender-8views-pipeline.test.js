// tests/blender-8views-pipeline.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveScratchpadPath } from '../scripts/setup-blender-env.cjs';
import { render8Views } from '../scripts/render-8views.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper de auditoria de perfis do gates.rs
function auditPixelForgeProfile(profileObj, bpyCode) {
  const violations = [];
  if (!profileObj._global) violations.push('MISSING_GLOBAL_CONFIG');

  for (const [pieceId, cfg] of Object.entries(profileObj)) {
    if (pieceId === '_global') continue;
    const budgetSum = (cfg.budget || []).reduce((acc, v) => acc + v, 0);
    if (budgetSum !== 100) violations.push(`PIECE_${pieceId}_BUDGET_NOT_100`);
    if ((cfg.budget || []).length !== cfg.bands) violations.push(`PIECE_${pieceId}_BANDS_MISMATCH`);
  }

  if (bpyCode.includes('np.') && bpyCode.includes('Vector(') && !bpyCode.includes('float(')) {
    violations.push('NUMPY_FLOAT64_VECTOR_BUG');
  }
  return { passed: violations.length === 0, violations };
}

test('PixelForge 3D: Validação do Modelo e Perfil da Capivara (Mascote / Montaria RPG)', () => {
  const capyBpyPath = path.join(rootDir, 'tools', 'icones', 'capivara.py');
  const capyProfilePath = path.join(rootDir, 'tools', 'icones', 'perfis', 'capivara.json');

  assert.ok(fs.existsSync(capyBpyPath), 'capivara.py deve existir');
  assert.ok(fs.existsSync(capyProfilePath), 'capivara.json deve existir');

  const bpyCode = fs.readFileSync(capyBpyPath, 'utf-8');
  const profileObj = JSON.parse(fs.readFileSync(capyProfilePath, 'utf-8'));

  const result = auditPixelForgeProfile(profileObj, bpyCode);
  assert.equal(result.passed, true, `Violações encontradas: ${result.violations.join(', ')}`);
  assert.ok(bpyCode.includes('from cena import'), 'Deve usar helper de cena');
  assert.ok(bpyCode.includes('render('), 'Deve chamar render');
  assert.ok(bpyCode.includes('CAMERA_PITCH_DEG'), 'Deve suportar pitch da câmera 24°');
});

test('PixelForge 3D: Validação da Espada de Bambu com suporte a 8 vistas', () => {
  const swordBpyPath = path.join(rootDir, 'tools', 'icones', 'espada_bambu.py');
  const swordProfilePath = path.join(rootDir, 'tools', 'icones', 'perfis', 'espada_bambu.json');

  assert.ok(fs.existsSync(swordBpyPath), 'espada_bambu.py deve existir');
  assert.ok(fs.existsSync(swordProfilePath), 'espada_bambu.json deve existir');

  const bpyCode = fs.readFileSync(swordBpyPath, 'utf-8');
  const profileObj = JSON.parse(fs.readFileSync(swordProfilePath, 'utf-8'));

  const result = auditPixelForgeProfile(profileObj, bpyCode);
  assert.equal(result.passed, true);
});

test('PixelForge 3D: Cálculo Matemático de Câmera 24° e 8 Vistas (Turnaround 360°)', () => {
  const pitchDeg = 24.0;
  const pitchRad = (pitchDeg * Math.PI) / 180.0;
  const distance = 5.0;

  const expectedZ = distance * Math.sin(pitchRad);
  assert.ok(Math.abs(expectedZ - 2.03368) < 0.01, 'Elevação Z a 24° deve ser ~2.03');

  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  assert.equal(angles.length, 8, 'Devem ser exatamente 8 vistas');

  for (const deg of angles) {
    const azimuthRad = (deg * Math.PI) / 180.0;
    const x = distance * Math.sin(azimuthRad) * Math.cos(pitchRad);
    const y = -distance * Math.cos(azimuthRad) * Math.cos(pitchRad);
    const r = Math.sqrt(x * x + y * y);
    assert.ok(Math.abs(r - distance * Math.cos(pitchRad)) < 0.001, 'Raio no plano XY deve ser constante');
  }
});

test('PixelForge 3D: Resolução do Scratchpad isolado fora do Git', () => {
  const scratchpad = resolveScratchpadPath();
  assert.ok(scratchpad.includes('.scratchpad') || scratchpad.includes('scratchpad'));

  // Valida que o .gitignore contém as regras para manter o repositório limpo
  const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf-8');
  assert.ok(gitignoreContent.includes('.scratchpad/'));
  assert.ok(gitignoreContent.includes('*.blend'));
});

test('PixelForge 3D: Render 8 Vistas gera prancha, entrega .blend e atualiza DIÁRIO', () => {
  const res = render8Views({
    itemId: 'capivara',
    resolution: 256
  });

  assert.equal(res.success, true);
  assert.equal(res.cameraPitch, 24.0);
  assert.equal(res.angles.length, 8);
  assert.ok(fs.existsSync(res.diarioPath), 'Arquivo do diário deve existir');

  const diarioContent = fs.readFileSync(res.diarioPath, 'utf-8');
  assert.ok(diarioContent.includes('Render 8 Vistas e Modelagem a partir da PLANTA: capivara'));
  assert.ok(diarioContent.includes('Camera Elevacao'));
  assert.ok(diarioContent.includes('24.0°'));
  assert.ok(diarioContent.includes('.blend Master Entregue'));
});
