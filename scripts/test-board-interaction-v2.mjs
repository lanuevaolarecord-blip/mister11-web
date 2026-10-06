/**
 * scripts/test-board-interaction-v2.mjs
 * MÍSTER11 — Pizarra v2: SECCIÓN 0.5 (O1/O2/O3 + gesto) y frentes H, I, J, K, L1.
 * Importa el código REAL de producción (mister11-pieces.js, mister11-field.js, mister11-materials catálogo).
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIELD_WINDOWS,
  remapCoordinatesByWindow,
  resolvePointerGesture,
  removeAllTacticalPieces,
} from '../src/lib/mister11-pieces.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// mister11-field.js importa fabric (canvas) -> extraemos el catálogo de formaciones evaluando solo el literal.
const fieldSrc = fs.readFileSync(path.join(root, 'src/lib/mister11-field.js'), 'utf8');
const formationsLiteral = fieldSrc.slice(fieldSrc.indexOf('export const FORMATIONS = {') + 'export const FORMATIONS = '.length, fieldSrc.indexOf('export const FORMATIONS_BY_FORMAT'));
const FORMATIONS = Function(`return ${formationsLiteral.trim().replace(/;\s*$/, '')}`)();
const byFormatLiteral = fieldSrc.slice(fieldSrc.indexOf('Object.freeze({', fieldSrc.indexOf('FORMATIONS_BY_FORMAT')) + 'Object.freeze('.length, fieldSrc.indexOf('});', fieldSrc.indexOf('FORMATIONS_BY_FORMAT')) + 1);
const FORMATIONS_BY_FORMAT = Function(`return ${byFormatLiteral}`)();

let pass = 0;
const test = (d, fn) => { try { fn(); console.log(`  ✅ ${d}`); pass++; } catch (e) { console.error(`  ❌ ${d}: ${e.message}`); process.exit(1); } };

console.log('==============================================================================');
console.log('MÍSTER 11 — PIZARRA v2: O1/O2/O3 + GESTO + H/I/J/K/L1');
console.log('==============================================================================\n');

// ── SECCIÓN 0.5 — REGLA DE GESTO ────────────────────────────────────────────
console.log('▶ [SECCIÓN 0.5] Regla de resolución de gesto');
const cono = { id: 'c1', isMaterial: true, data: { type: 'material' } };
const campo = { id: 'campo', isFieldLayer: true };
test('tool sticky (platillo) + click sobre cono existente -> DRAG_EXISTING (no coloca encima)', () => {
  assert.strictEqual(resolvePointerGesture({ target: cono, activeTool: 'place_material', placingMat: 'platillo' }), 'DRAG_EXISTING');
});
test('tool sticky + click sobre vacío -> PLACE_STICKY', () => {
  assert.strictEqual(resolvePointerGesture({ target: null, activeTool: 'place_material', placingMat: 'platillo' }), 'PLACE_STICKY');
  assert.strictEqual(resolvePointerGesture({ target: campo, activeTool: 'place_material', placingMat: 'platillo' }), 'PLACE_STICKY');
});
test('tool línea + click sobre línea existente -> DRAG_EXISTING; sobre vacío -> DRAW_NEW', () => {
  const linea = { isTool: true, type: 'line', data: { tool: 'straight_dashed_line' } };
  assert.strictEqual(resolvePointerGesture({ target: linea, activeTool: 'straight_dashed_line' }), 'DRAG_EXISTING');
  assert.strictEqual(resolvePointerGesture({ target: null, activeTool: 'straight_dashed_line' }), 'DRAW_NEW');
});
test('tool select + vacío -> SELECT_CANVAS', () => {
  assert.strictEqual(resolvePointerGesture({ target: null, activeTool: 'select' }), 'SELECT_CANVAS');
});

// ── FRENTE H — FIELD-MAP (fixture Picture 14) ───────────────────────────────
console.log('\n▶ [FRENTE H] Remapeo O1 por ventana normalizada');
// 11 piezas en campo completo, incluidos dorsales 6 y 7 en la mitad defensiva (x<0.5)
const once = FORMATIONS['4-3-3'].map((p, i) => ({ id: `p${i + 1}`, x: p.relX, y: p.relY }));
const targets = ['half_attack', 'half_defense', 'third_def', 'third_mid', 'third_off', 'penalty_zoom', 'f7', 'f8'];
test('Picture 14: completo -> 1/2 ataque: CERO piezas fuera de límites (incluye dorsales 6 y 7)', () => {
  once.forEach(p => {
    const r = remapCoordinatesByWindow(p.x, p.y, 'full', 'half_attack');
    assert.ok(r.x >= 0 && r.x <= 1 && r.y >= 0 && r.y <= 1, `${p.id} fuera: ${JSON.stringify(r)}`);
  });
});
targets.forEach(t => test(`completo -> ${t}: 11/11 dentro de [0,1]² y objetos constantes`, () => {
  const out = once.map(p => remapCoordinatesByWindow(p.x, p.y, 'full', t));
  assert.strictEqual(out.length, 11);
  out.forEach(r => assert.ok(r.x >= 0 && r.x <= 1 && r.y >= 0 && r.y <= 1));
}));
test('Relaciones relativas preservadas dentro de la ventana (orden en X de piezas visibles)', () => {
  const visibles = once.filter(p => p.x >= 0.55).sort((a, b) => a.x - b.x);
  const mapped = visibles.map(p => remapCoordinatesByWindow(p.x, p.y, 'full', 'half_attack').x);
  for (let i = 1; i < mapped.length; i++) assert.ok(mapped[i] >= mapped[i - 1], 'orden X preservado');
});
test('Ida y vuelta completo -> 1/2 ataque -> completo conserva pieza visible (x=0.8)', () => {
  const a = remapCoordinatesByWindow(0.8, 0.5, 'full', 'half_attack');
  const b = remapCoordinatesByWindow(a.x, a.y, 'half_attack', 'full');
  assert.ok(Math.abs(b.x - 0.8) < 1e-9 && Math.abs(b.y - 0.5) < 1e-9);
});
test('Ventanas declaradas para todos los fieldType del prompt', () => {
  ['full', 'half_attack', 'half_defense', 'third_def', 'third_mid', 'third_off', 'f7', 'f8', 'reduced'].forEach(k => assert.ok(FIELD_WINDOWS[k], k));
});

// ── FRENTE I — FORMAT (fixture Picture 15) ──────────────────────────────────
console.log('\n▶ [FRENTE I] Formato -> nº jugadores y catálogo de formaciones');
const expected = { f11: 11, f8: 8, f7: 7, futsal: 5 };
Object.entries(FORMATIONS_BY_FORMAT).forEach(([fmt, list]) => test(`${fmt}: todas las formaciones del dropdown tienen exactamente ${expected[fmt]} piezas`, () => {
  assert.ok(list.length >= 4);
  list.forEach(f => assert.strictEqual(FORMATIONS[f].length, expected[fmt], `${f}`));
}));
test('Picture 15: Fútbol 7 NO ofrece 4-3-3 y APLICAR 2-3-1 da 7 piezas', () => {
  assert.ok(!FORMATIONS_BY_FORMAT.f7.includes('4-3-3'));
  assert.strictEqual(FORMATIONS['2-3-1'].length, 7);
});
test('Formatos disjuntos (ninguna formación de 11 aparece en f7/f8/futsal)', () => {
  FORMATIONS_BY_FORMAT.f11.forEach(f => {
    assert.ok(!FORMATIONS_BY_FORMAT.f7.includes(f) && !FORMATIONS_BY_FORMAT.f8.includes(f) && (!FORMATIONS_BY_FORMAT.futsal || !FORMATIONS_BY_FORMAT.futsal.includes(f)));
  });
});
test('Cambio f11 -> f7 con remoción por categoría: 7 jugadores, cero restos de 11', () => {
  const canvas = { objs: [campo], getObjects() { return [...this.objs]; }, remove(o) { this.objs.splice(this.objs.indexOf(o), 1); }, add(o) { this.objs.push(o); } };
  FORMATIONS['4-3-3'].forEach((_, i) => canvas.add({ id: `l${i}`, isPlayerPiece: true, data: { type: 'player' } }));
  removeAllTacticalPieces(canvas);
  FORMATIONS['2-3-1'].forEach((_, i) => canvas.add({ id: `f7_${i}`, isPlayerPiece: true, data: { type: 'player' } }));
  assert.strictEqual(canvas.getObjects().filter(o => o.isPlayerPiece).length, 7);
  assert.strictEqual(canvas.getObjects().length, 8);
});

// ── FRENTE J — SELECT-HIT (código real) ─────────────────────────────────────
console.log('\n▶ [FRENTE J] Hit-area y drag sin re-selección');
const matSrc = fs.readFileSync(path.join(root, 'src/lib/mister11-materials.js'), 'utf8');
const toolsSrc = fs.readFileSync(path.join(root, 'src/lib/mister11-tools.js'), 'utf8');
test('Líneas/paths: padding 16 + stroke ≥2 -> zona de agarre ≥ 34px CSS (≈48dp con DPR≥1.4) y perPixelTargetFind=false', () => {
  assert.ok(/padding:\s*isLineOrPath\s*\?\s*16/.test(matSrc));
  assert.ok(/perPixelTargetFind:\s*false/.test(matSrc));
});
test('ToolManager: mousedown sobre pieza existente en fase idle -> setActiveObject y return (no crea superpuesta)', () => {
  assert.ok(toolsSrc.includes("this._drawState.phase === 'idle' && e.target && !isFieldLayer(e.target)"));
});
test('Herramientas de dibujo mantienen piezas seleccionables (drag sin volver a la flecha)', () => {
  assert.ok(toolsSrc.includes('o.selectable = !isFieldLayer(o)'));
});

// ── FRENTE K — STICKY-PLACE (código real) ───────────────────────────────────
console.log('\n▶ [FRENTE K] Colocación sticky');
const pizSrc = fs.readFileSync(path.join(root, 'src/pages/PizarraTactica.jsx'), 'utf8');
const placeBlock = pizSrc.slice(pizSrc.indexOf('Material placement (O3'), pizSrc.indexOf('Undo / Redo (connected'));
test('Tras colocar NO se resetea a select ni se desengancha el listener (5 taps = 5 platillos)', () => {
  const onDown = placeBlock.slice(placeBlock.indexOf('const onDown'), placeBlock.indexOf('const onKeyDown'));
  assert.ok(!onDown.includes("setActiveTool('select')"));
  assert.ok(!onDown.includes('setPlacingMat(null)'));
  assert.ok(!onDown.includes("fc.off('mouse:down'"));
  // simulación: 5 taps en vacío
  let placed = 0; for (let i = 0; i < 5; i++) if (resolvePointerGesture({ target: null, placingMat: 'platillo' }) === 'PLACE_STICKY') placed++;
  assert.strictEqual(placed, 5);
});
test('Salida: Esc, flecha (activeTool != place_material) y toggle del mismo material', () => {
  assert.ok(placeBlock.includes("e.key === 'Escape'"));
  assert.ok(pizSrc.includes("activeTool !== 'place_material' && placingMat"));
  const panel = fs.readFileSync(path.join(root, 'src/components/pizarra/MaterialsPanel.jsx'), 'utf8');
  assert.ok(panel.includes('if (placingMat === id)'));
});
test('Gesto en sticky: click sobre platillo existente con cono activo -> mueve, no coloca', () => {
  assert.ok(placeBlock.includes('o.target && !isFieldLayer(o.target)'));
  assert.strictEqual(resolvePointerGesture({ target: { isMaterial: true, data: { type: 'material', itemId: 'platillo' } }, placingMat: 'cono' }), 'DRAG_EXISTING');
});

// ── FRENTE L1 — AUDITORÍA DE CATÁLOGO (sin inventar) ───────────────────────
console.log('\n▶ [FRENTE L1] Checklist de catálogo de materiales (presente / PENDIENTE DUEÑO)');
const catalog = [
  ['Conos (varios colores)', ['cono', 'cono_amarillo', 'cono_rojo', 'cono_negro']],
  ['Mini conos', ['mini_cono']], ['Grupo de conos', ['grupo_conos']],
  ['Línea / arco de conos', ['grupo_conos_linea', 'grupo_conos_arco']],
  ['Platillos', ['platillo']], ['Banderines', ['banderin']], ['Picas / estacas', ['pica']], ['Postes / palos', ['poste']],
  ['Vallas', ['valla']], ['Escalera de agilidad', ['escalera']], ['Aros', ['aro']],
  ['Porterías / mini-porterías', ['porteria_pequena', 'porteria_grande', 'porteria_lateral']],
  ['Petos', ['peto']], ['Balones', ['balon', 'balon_negro', 'grupo_balones']],
  ['Cuerdas', ['cuerda']], ['Medicine ball', ['medicine_ball']], ['Maniquí / espantapájaros', ['maniqui']],
];
const rows = catalog.map(([name, ids]) => ({ material: name, estado: ids.every(id => matSrc.includes(`${id}: {`)) ? 'PRESENTE' : '[PENDIENTE DUEÑO]' }));
console.table(rows);
test('Catálogo auditado contra la librería real (huecos marcados, no rellenados)', () => {
  assert.ok(rows.filter(r => r.estado === 'PRESENTE').length >= 14);
});

console.log(`\n🎉 [PASS] ${pass}/${pass} asserts de interacción v2\n`);
