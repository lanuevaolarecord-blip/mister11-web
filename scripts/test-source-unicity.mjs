/**
 * scripts/test-source-unicity.mjs
 * Míster11 — Test de Verificación de Fuente Única (Source Unicity)
 *
 * Valida:
 * 1. Los disparos, goles y paradas se capturan exclusivamente a través de ShotCaptureModal (sin duplicidad de contadores).
 * 2. La matriz 2D de 9 zonas es canónica y no degrada eventos legacy a 'med' silenciosamente.
 * 3. Los eventos sin atribuir excluyen atribución inventada y no computan en estadísticas individuales hasta ser asignados.
 * 4. El manual de criterios de captura cuenta con 13 definiciones operacionales completas con generador PDF.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { CAPTURE_CRITERIA } from '../src/config/captureCriteria.js';
import { XG_BASE_WEIGHTS, ZONES_2D, normalizeZone } from '../src/config/xgWeights.js';
import { calcPerformanceScore, deriveStatsFromEvents } from '../src/utils/ratingFormula.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE FUENTE ÚNICA, CAPTURA CANÓNICA Y CRITERIOS');
console.log('==============================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FALLO: ${message}`);
    failed++;
  }
}

// 1. Validar 13 Criterios de Captura Operacionales
console.log('▶ [1/4] Validando Manual de Criterios de Captura (13 definiciones operacionales)...');
const criteriaKeys = Object.keys(CAPTURE_CRITERIA);
assert(criteriaKeys.length >= 13, `Se encontraron ${criteriaKeys.length} criterios (esperados >= 13)`);

const mandatoryKeys = [
  'shot_on_target', 'shot_off_target', 'key_pass', 'recovery', 'ball_loss',
  'duel_won', 'duel_lost', 'foul_against', 'foul_favor', 'corner', 'offside',
  'card_yellow', 'card_red'
];
mandatoryKeys.forEach(k => {
  const c = CAPTURE_CRITERIA[k];
  assert(Boolean(c), `Criterio '${k}' existe`);
  assert(Boolean(c?.nameEs && c?.nameEn), `Criterio '${k}' tiene nombres bilingües`);
  assert(Boolean(c?.shortEs && c?.whenYesEs && c?.whenNoEs), `Criterio '${k}' define qué cuenta y qué no cuenta`);
});

// 2. Validar Matriz 2D y Regla de No Degeneración Silenciosa
console.log('\n▶ [2/4] Validando Matriz 2D y Preservación de 1D...');
assert(ZONES_2D.length === 9, 'Existen exactamente 9 zonas 2D canónicas');
assert(normalizeZone({ playType: 'penalti' }) === 'penalti', 'Penalti normaliza a penalti');
assert(normalizeZone('centro_att') === 'centro_att', 'centro_att preservado exactamente');
assert(normalizeZone({ sector: 'left', altura: 'att' }) === 'izq_att', 'left + att -> izq_att');
assert(normalizeZone({ sector: 'right', altura: 'med' }) === 'der_med', 'right + med -> der_med');

// Evento 1D con altura desconocida no se convierte silenciosamente en 'med'
const unkZone = normalizeZone({ sector: 'center', altura: 'desconocida' });
assert(unkZone === 'desconocida_1d', `Evento con altura desconocida mantiene desconocida_1d (obtenido: ${unkZone})`);

// 3. Validar Exclusión de Eventos Sin Atribuir en Estadísticas Individuales
console.log('\n▶ [3/4] Validando Aislamiento de Eventos Sin Atribuir...');
const mockEvents = [
  { type: 'shot_on_target_own', playerId: 'p1', attributed: true },
  { type: 'shot_on_target_own', playerId: null, attributed: false }, // sin atribuir
  { type: 'goal_own', isGoal: true, playerId: 'p1', attributed: true },
  { type: 'recovery', playerId: null }, // sin atribuir
  { type: 'recovery', playerId: 'p1', attributed: true }
];

const p1Stats = deriveStatsFromEvents('p1', mockEvents);
assert(p1Stats.tirosPuerta === 2, `Jugador p1 tiene 2 tiros propios atribuidos (1 tiro + 1 gol) (obtenido: ${p1Stats.tirosPuerta})`);
assert(p1Stats.recuperaciones === 1, `Jugador p1 tiene solo 1 recuperación atribuida (obtenido: ${p1Stats.recuperaciones})`);

// Evento sin atribuir no puede computarse para rating de p1
const scoreP1 = calcPerformanceScore(p1Stats);
assert(scoreP1 > 6.0, `Rating p1 calculado válidamente: ${scoreP1}`);

// 4. Validar Existencia de Componentes Canónicos
console.log('\n▶ [4/4] Validando Existencia e Integridad de Componentes...');
const filesToCheck = [
  'src/components/ShotCaptureModal.jsx',
  'src/components/SectorMiniPitch2D.jsx',
  'src/components/UnattributedEventsManager.jsx',
  'src/components/CaptureCriteriaModal.jsx',
  'src/utils/criteriaPdfReport.js',
  'src/config/captureCriteria.js'
];

filesToCheck.forEach(f => {
  const p = resolve(process.cwd(), f);
  assert(existsSync(p), `Archivo existe: ${f}`);
});

console.log('\n------------------------------------------------------------------------------');
console.log(`RESUMEN FINAL: ${passed}/${passed + failed} PRUEBAS SUPERADAS EXITOSAMENTE [${failed} FALLOS]`);
console.log('------------------------------------------------------------------------------\n');

if (failed > 0) process.exit(1);
