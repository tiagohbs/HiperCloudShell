// tests/squad-3d-and-pixel-forge.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

// Simulacao fiel das regras deterministicas do gates.rs para a suite Node.js
function auditShaderAndVram(code) {
  const violations = [];
  const hasAlloc = /(Geometry\(|Material\(|WebGLRenderTarget\()/g.test(code);
  const hasDispose = code.includes('.dispose()');
  if (hasAlloc && !hasDispose) {
    violations.push('VRAM_LEAK_MISSING_DISPOSE');
  }
  if (code.includes('useFrame(') && /useFrame\([\s\S]*new THREE\./.test(code)) {
    violations.push('GC_THRASHING_IN_USEFRAME');
  }
  return { passed: violations.length === 0, violations };
}

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

test('squad-3d-shader-studio Gate: bloqueia componente R3F sem .dispose() ou alocando em useFrame', () => {
  const badR3fCode = `
    export function SwordScene() {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      useFrame(() => {
        const temp = new THREE.Vector3(0, 1, 0);
      });
      return <mesh geometry={geo} />;
    }
  `;
  const res = auditShaderAndVram(badR3fCode);
  assert.equal(res.passed, false);
  assert.ok(res.violations.includes('VRAM_LEAK_MISSING_DISPOSE'));
  assert.ok(res.violations.includes('GC_THRASHING_IN_USEFRAME'));
});

test('squad-pixel-forge-3d Gate: valida perfil Capybound e detecta bug numpy.float64 com Vector', () => {
  const validProfile = {
    _global: { light: [-0.35, 0.55, 0.76], sil: 0.6, zt: 0.05, outline_L: 0.1 },
    '1': {
      kind: 'cloth',
      ramp: ['#0e2242', '#183a6a', '#25548e', '#3a72b0'],
      bands: 4,
      budget: [15, 35, 35, 15],
      min_cluster: 2
    }
  };

  const buggyBpyCode = `
    import bpy, numpy as np
    from mathutils import Vector
    v = Vector((np.cos(0.5), 0, 1))
  `;

  const failRes = auditPixelForgeProfile(validProfile, buggyBpyCode);
  assert.equal(failRes.passed, false);
  assert.deepEqual(failRes.violations, ['NUMPY_FLOAT64_VECTOR_BUG']);

  const fixedBpyCode = `
    import bpy, numpy as np
    from mathutils import Vector
    v = Vector((float(np.cos(0.5)), 0.0, 1.0))
  `;
  const passRes = auditPixelForgeProfile(validProfile, fixedBpyCode);
  assert.equal(passRes.passed, true);
});
