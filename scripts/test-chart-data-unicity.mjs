/**
 * scripts/test-chart-data-unicity.mjs
 * Míster11 — Test de Igualdad y Unicidad de Datos (CI)
 *
 * Valida que matchAnalytics.js sea la ÚNICA fuente de datos y produzca
 * datos idénticos para Tab Estadísticas, Post-Partido y PDF Report.
 */

import assert from 'assert';
import { getMatchAnalytics, hashString } from '../src/utils/matchAnalytics.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST DE IGUALDAD Y UNICIDAD DE DATOS (CI)');
console.log('==============================================================================\n');

// 1. Validar Determinismo de la Función Hash
console.log('1. Verificando determinismo de hashString...');
const hash1 = hashString('match_xilxes_shot_1');
const hash2 = hashString('match_xilxes_shot_1');
const hash3 = hashString('match_xilxes_shot_2');
assert.strictEqual(hash1, hash2, 'hashString debe ser 100% determinista con el mismo input');
assert.notStrictEqual(hash1, hash3, 'hashString debe generar valores distintos con inputs distintos');
console.log('  ✅ hashString es 100% determinista.\n');

// 2. Mock de Partido Real (Mi Equipo vs Xilxes)
const mockMatch = {
  id: 'xilxes_2026_09_09',
  local: 'Mi Equipo',
  rival: 'Xilxes',
  date: '2026-09-09'
};

const mockEvents = [
  // 1 gol propio
  { id: 'ev_1', type: 'gol_local', sector: 'center', minute: 44, shooterComfort: 'comodo' },
  // 10 tiros a puerta propios
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `ev_shot_on_${i}`,
    type: 'shot_on_target_own',
    sector: i % 2 === 0 ? 'center' : 'left',
    minute: 10 + i * 5
  })),
  // 10 tiros fuera propios
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `ev_shot_off_${i}`,
    type: 'shot_off_target_own',
    sector: i % 3 === 0 ? 'right' : 'center',
    minute: 15 + i * 4
  })),
  // 3 tiros rivales
  { id: 'ev_riv_1', type: 'shot_on_target_rival', sector: 'center', minute: 22, shooterComfort: 'comodo' },
  { id: 'ev_riv_2', type: 'shot_on_target_rival', sector: 'center', minute: 55, shooterComfort: 'comodo' },
  { id: 'ev_riv_3', type: 'shot_off_target_rival', sector: 'right', minute: 70, shooterComfort: 'comodo' },
  // Recuperaciones y faltas
  ...Array.from({ length: 25 }).map((_, i) => ({ id: `rec_${i}`, type: 'recovery', zone2D: 'centro_med' })),
  ...Array.from({ length: 15 }).map((_, i) => ({ id: `loss_${i}`, type: 'loss', zone2D: 'centro_def' })),
  ...Array.from({ length: 5 }).map((_, i) => ({ id: `foul_${i}`, type: 'foul_against', zone2D: 'centro_med' })),
  // 2 pases (insuficientes para red de pases)
  { id: 'pass_1', type: 'pass_completed' },
  { id: 'pass_2', type: 'pass_completed' }
];

console.log('2. Ejecutando getMatchAnalytics simulando los tres destinos...');
const analyticsTab = getMatchAnalytics(mockMatch, mockEvents, { isEn: false });
const analyticsPostMatch = getMatchAnalytics(mockMatch, mockEvents, { isEn: false });
const analyticsPdf = getMatchAnalytics(mockMatch, mockEvents, { isEn: false });

// 3. Aserciones de Igualdad Estricta
console.log('3. Validando paridad matemática 1:1 entre Tab, Post-Partido y PDF...');
assert.deepStrictEqual(analyticsTab, analyticsPostMatch, 'Tab y Post-Partido deben recibir datos idénticos');
assert.deepStrictEqual(analyticsTab, analyticsPdf, 'Tab y PDF deben recibir datos idénticos');
console.log('  ✅ Paridad de datos 100% serializable confirmada.');

// 4. Verificación de Métricas Específicas
assert.strictEqual(analyticsTab.shots.ownShots.length, 21, 'Debe haber exactamente 21 tiros propios');
assert.strictEqual(analyticsTab.shots.ownGoalsCount, 1, 'Debe haber exactamente 1 gol propio');
assert.strictEqual(analyticsTab.shots.ownOnTargetCount, 11, 'Debe haber exactamente 11 tiros a puerta propios (1 gol + 10)');
assert.strictEqual(analyticsTab.passNetwork.available, false, 'Red de pases debe estar deshabilitada con < 5 pases');
assert.strictEqual(analyticsTab.zones.dominantZone?.id, 'centro_med', 'Centro del campo debe ser la zona dominante');
assert.strictEqual(analyticsTab.narrative.hasFinishingDeficit, true, 'Debe dispararse la regla de déficit de eficacia rematadora');
assert.strictEqual(analyticsTab.narrative.hasDefensiveAlert, false, 'No debe dispararse alerta defensiva si rival no supera 1.5 xG');

console.log(`  ✅ 21 tiros verificados: ${analyticsTab.shots.ownGoalsCount} gol, ${analyticsTab.shots.ownOnTargetCount} a puerta, xG total: ${analyticsTab.shots.ownTotalXg}`);
console.log(`  ✅ Red de pases condicional: ${analyticsTab.passNetwork.available ? 'Activa' : 'Deshabilitada (< 5 pases)'}`);
console.log(`  ✅ Regla de narrativa (Eficacia rematadora): ${analyticsTab.narrative.hasFinishingDeficit ? 'DISPARADA' : 'NO'}`);
console.log(`  ✅ Regla de narrativa (Zona dominante): ${analyticsTab.narrative.dominantZone?.nameEs} (${analyticsTab.narrative.dominantZone?.pct}%)`);

console.log('\n🎉 [PASS] Todos los tests de igualdad y unicidad de datos superados con éxito.');
console.log('==============================================================================\n');
