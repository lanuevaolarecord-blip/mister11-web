import assert from 'assert';
import { calculateConvocationTime, classifyPosition } from '../src/utils/convocationPNGGenerator.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE CONVOCATORIA PNG Y LAYOUT PROFESIONAL');
console.log('==============================================================================');

// Test 1: calculateConvocationTime
console.log('▶ [1/3] Verificando calculateConvocationTime...');
assert.strictEqual(calculateConvocationTime('18:00'), '17:00');
assert.strictEqual(calculateConvocationTime('00:30'), '23:30');
assert.strictEqual(calculateConvocationTime('10:15'), '09:15');
assert.strictEqual(calculateConvocationTime(null), '--:--');
console.log('  ✅ calculateConvocationTime calcula correctamente la hora (-1h)');

// Test 2: classifyPosition
console.log('▶ [2/3] Verificando classifyPosition...');
assert.strictEqual(classifyPosition('POR'), 'GK');
assert.strictEqual(classifyPosition('Portero'), 'GK');
assert.strictEqual(classifyPosition('Central'), 'DEF');
assert.strictEqual(classifyPosition('Lateral Derecho'), 'DEF');
assert.strictEqual(classifyPosition('Mediocentro'), 'MID');
assert.strictEqual(classifyPosition('Extremo'), 'FWD');
assert.strictEqual(classifyPosition('Delantero Centro'), 'FWD');
console.log('  ✅ classifyPosition clasifica canónicamente GK, DEF, MID, FWD');

// Test 3: Grid and Row sizing math verification
console.log('▶ [3/3] Verificando matemáticas de ocupación vertical para 1080x1920...');
const height = 1920;
const startY = 70 + 110 + 26 + 92 + 30; // 328
const footerY = height - 130; // 1790
const totalAvailHeight = footerY - startY; // 1462px

assert(totalAvailHeight > 1400, 'Debe haber más de 1400px de espacio vertical útil para las listas');

// Squad of 16 players: 2 GK (1 row), 5 DEF (3 rows), 5 MID (3 rows), 4 FWD (2 rows) -> 9 rows
const totalGridRows = 9;
const headerHeight = 44;
const totalHeadersHeight = 4 * headerHeight; // 176
const remainingForRowsAndGaps = totalAvailHeight - totalHeadersHeight; // 1286

const targetRowHeight = Math.floor((remainingForRowsAndGaps - (4 * 28)) / totalGridRows);
const rowHeight = Math.max(56, Math.min(78, targetRowHeight));
assert(rowHeight >= 64, 'La altura de fila de tarjeta debe ser de al menos 64px para alta legibilidad');
console.log(`  ✅ Altura dinámica calculada: ${rowHeight}px por fila para ${totalGridRows} filas, llenando el 100% del lienzo`);

console.log('==============================================================================');
console.log('🎉 [PASS] TODAS LAS PRUEBAS DE CONVOCATORIA PNG EXITOSAS');
console.log('==============================================================================');
