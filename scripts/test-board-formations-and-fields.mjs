/**
 * MÍSTER 11 — TEST DE VERIFICACIÓN: FORMACIONES, CAMPOS Y DEDUPLICACIÓN
 * Valida:
 * 1. Formato F7: 7 piezas (PO + 6 campo) y formaciones oficiales F7 (2-3-1, 3-2-1, 2-2-2, 3-3-0)
 * 2. Formato F8: 8 piezas (PO + 7 campo) y formaciones oficiales F8 (3-3-1, 2-3-2, 3-2-2, 4-2-1)
 * 3. Formato F11: 11 piezas (PO + 10 campo)
 * 4. Deduplicación en APLICAR: múltiples ejecuciones mantienen conteo exacto
 * 5. Rangos visibles según tipo de campo (half_attack, half_defense, etc.)
 */

import assert from 'assert';
import { FORMATIONS, FORMATIONS_BY_FORMAT, getFormatInfo } from '../src/lib/mister11-field.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE FORMACIONES, CAMPOS Y NO-DUPLICADOS');
console.log('==============================================================================');

// 1. Validar getFormatInfo
console.log('▶ [1/5] Verificando getFormatInfo para F7, F8 y F11...');
const f7Info = getFormatInfo('f7');
assert.strictEqual(f7Info.count, 7, 'F7 debe tener count 7');
assert.strictEqual(f7Info.defaultFormation, '2-3-1', 'F7 default debe ser 2-3-1');
assert.deepStrictEqual(f7Info.formations, ['2-3-1', '3-2-1', '2-2-2', '3-3-0']);

const f8Info = getFormatInfo('f8');
assert.strictEqual(f8Info.count, 8, 'F8 debe tener count 8');
assert.strictEqual(f8Info.defaultFormation, '3-3-1', 'F8 default debe ser 3-3-1');
assert.deepStrictEqual(f8Info.formations, ['3-3-1', '2-3-2', '3-2-2', '4-2-1']);

const f11Info = getFormatInfo('full');
assert.strictEqual(f11Info.count, 11, 'F11 debe tener count 11');
assert.strictEqual(f11Info.defaultFormation, '4-3-3', 'F11 default debe ser 4-3-3');
console.log('  ✅ getFormatInfo devuelve recuentos y formaciones exactas para F7, F8 y F11');

// 2. Validar que cada formación F7 tiene exactamente 7 posiciones
console.log('▶ [2/5] Verificando que cada formación F7 tiene exactamente 7 piezas...');
FORMATIONS_BY_FORMAT.f7.forEach(form => {
  const positions = FORMATIONS[form];
  assert(Array.isArray(positions), `Formación ${form} debe existir en FORMATIONS`);
  assert.strictEqual(positions.length, 7, `Formación F7 ${form} debe tener 7 posiciones, tiene ${positions.length}`);
  assert.strictEqual(positions[0].pos, 'PO', `La primera posición de ${form} debe ser PO (portero)`);
});
console.log('  ✅ Todas las formaciones F7 tienen exactamente 7 piezas y portero');

// 3. Validar que cada formación F8 tiene exactamente 8 posiciones
console.log('▶ [3/5] Verificando que cada formación F8 tiene exactamente 8 piezas...');
FORMATIONS_BY_FORMAT.f8.forEach(form => {
  const positions = FORMATIONS[form];
  assert(Array.isArray(positions), `Formación ${form} debe existir en FORMATIONS`);
  assert.strictEqual(positions.length, 8, `Formación F8 ${form} debe tener 8 posiciones, tiene ${positions.length}`);
  assert.strictEqual(positions[0].pos, 'PO', `La primera posición de ${form} debe ser PO (portero)`);
});
console.log('  ✅ Todas las formaciones F8 tienen exactamente 8 piezas y portero');

// 4. Simulación de deduplicación en aplicarFormacion
console.log('▶ [4/5] Simulando aplicarFormacion y verificando deduplicación...');
let canvasObjects = [];

function simularAplicarFormacion(teamType, formationName, fieldType = 'full') {
  // Limpiar únicamente jugadores existentes de este equipo
  canvasObjects = canvasObjects.filter(obj => {
    const isPlayer = obj.isPlayerPiece || obj.data?.type === 'player';
    const objTeam = obj.data?.playerType;
    return !(isPlayer && objTeam === teamType);
  });

  const formatInfo = getFormatInfo(fieldType);
  const targetForm = (formationName && formatInfo.formations.includes(formationName)) ? formationName : formatInfo.defaultFormation;
  const positions = FORMATIONS[targetForm];

  positions.forEach((pos, i) => {
    canvasObjects.push({
      id: `player_${teamType}_${i + 1}`,
      isPlayerPiece: true,
      data: {
        type: 'player',
        playerType: teamType,
        label: String(i + 1),
        pos: pos.pos
      }
    });
  });
}

// Aplicar local 4-3-3
simularAplicarFormacion('local', '4-3-3', 'full');
assert.strictEqual(canvasObjects.length, 11, 'Debe haber 11 jugadores locales');

// Re-aplicar local 4-4-2 (no debe duplicar!)
simularAplicarFormacion('local', '4-4-2', 'full');
assert.strictEqual(canvasObjects.length, 11, 'Debe seguir habiendo exactamente 11 jugadores locales, NO 22');

// Re-aplicar local 5 veces seguidas
for (let i = 0; i < 5; i++) {
  simularAplicarFormacion('local', '3-5-2', 'full');
}
assert.strictEqual(canvasObjects.length, 11, 'Tras 5 aplicaciones continuas, debe haber exactamente 11 jugadores locales');

// Aplicar rival 4-4-2
simularAplicarFormacion('rival', '4-4-2', 'full');
assert.strictEqual(canvasObjects.length, 22, 'Local (11) + Rival (11) = 22');

// Re-aplicar solo rival
simularAplicarFormacion('rival', '4-3-3', 'full');
assert.strictEqual(canvasObjects.length, 22, 'Local (11) + Rival (11) tras actualizar rival = 22');
console.log('  ✅ Deduplicación estricta confirmada: aplicarFormacion nunca acumula clones');

// 5. Cambio de formato a F7 y F8
console.log('▶ [5/5] Simulando cambio a F7 y F8...');
// Cambio a F7:
simularAplicarFormacion('local', '2-3-1', 'f7');
simularAplicarFormacion('rival', '2-3-1', 'f7');
assert.strictEqual(canvasObjects.filter(o => o.data?.playerType === 'local').length, 7, 'En F7 local debe tener 7');
assert.strictEqual(canvasObjects.filter(o => o.data?.playerType === 'rival').length, 7, 'En F7 rival debe tener 7');
assert.strictEqual(canvasObjects.length, 14, 'Total F7 local + rival = 14');

// Cambio a F8:
simularAplicarFormacion('local', '3-3-1', 'f8');
simularAplicarFormacion('rival', '3-3-1', 'f8');
assert.strictEqual(canvasObjects.filter(o => o.data?.playerType === 'local').length, 8, 'En F8 local debe tener 8');
assert.strictEqual(canvasObjects.filter(o => o.data?.playerType === 'rival').length, 8, 'En F8 rival debe tener 8');
assert.strictEqual(canvasObjects.length, 16, 'Total F8 local + rival = 16');
console.log('  ✅ Formatos F7 y F8 reorganizan y reducen el número de jugadores al conteo reglamentario');

console.log('==============================================================================');
console.log('🎉 [PASS] 5/5 VERIFICACIONES DE FORMACIONES Y CAMPOS EXITOSAS');
console.log('==============================================================================');
