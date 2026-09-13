import assert from 'assert';
import { getUnifiedMatchEvents } from '../src/utils/minutesEngine.js';
import { calculateCanonicalStats } from '../src/components/canonical/calculateCanonicalStats.js';
import { translations } from '../src/i18n/translations.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST SUITE: MULTI-MATCH ANALYSIS DATA INTEGRITY & I18N');
console.log('==============================================================================\n');

// 1. Validar claves i18n
const requiredKeys = [
  'analisis.title',
  'analisis.subtitle',
  'analisis.selectMatches',
  'analisis.shortcuts.title',
  'analisis.shortcuts.last3',
  'analisis.shortcuts.last5',
  'analisis.shortcuts.allSeason',
  'analisis.mode.title',
  'analisis.mode.averages',
  'analisis.mode.totals',
  'analisis.loadingData',
  'analisis.noMatchesSelected',
  'analisis.kpi.shots',
  'analisis.kpi.shotsSubAvg',
  'analisis.kpi.shotsSubTot',
  'analisis.kpi.duels',
  'analisis.kpi.duelsSub',
  'analisis.kpi.recoveries',
  'analisis.kpi.recLossSubAvg',
  'analisis.kpi.recLossSubTot',
  'analisis.kpi.counters',
  'analisis.kpi.countersSub',
  'analisis.chart.trend',
  'analisis.chart.bars',
  'analisis.chart.radar',
  'analisis.chart.recoveries',
  'analisis.chart.losses',
  'analisis.chart.shotsOwn',
  'analisis.chart.shotsOwnTitle',
  'analisis.chart.shotsRival',
  'analisis.chart.axisShots',
  'analisis.chart.axisDuels',
  'analisis.chart.axisRecoveries',
  'analisis.chart.axisLossControl',
  'analisis.chart.axisCounterEff',
  'analisis.table.title',
  'analisis.table.match',
  'analisis.table.result',
  'analisis.table.shots',
  'analisis.table.duels',
  'analisis.table.recLoss',
  'analisis.table.fouls',
  'analisis.table.cards',
  'analisis.exportPdf',
  'analisis.exportingPdf',
  'analisis.modal.title',
  'analisis.modal.confirm',
  'analisis.modal.clear',
  'analisis.modal.all',
  'analisis.modal.selectedCount',
  'analisis.modal.noDate',
  'analisis.modal.pending',
];

const esTranslations = translations['Español (ES)'];
const enTranslations = translations['English (EN)'];

assert(esTranslations, 'Faltan traducciones en Español (ES)');
assert(enTranslations, 'Faltan traducciones en English (EN)');

let missingEs = 0;
let missingEn = 0;

for (const k of requiredKeys) {
  if (!esTranslations[k]) {
    console.error(`❌ Falta clave en ES: ${k}`);
    missingEs++;
  }
  if (!enTranslations[k]) {
    console.error(`❌ Falta clave en EN: ${k}`);
    missingEn++;
  }
}

assert.strictEqual(missingEs, 0, `Hay ${missingEs} claves faltantes en Español`);
assert.strictEqual(missingEn, 0, `Hay ${missingEn} claves faltantes en Inglés`);
console.log(`✅ [PASS] Todas las ${requiredKeys.length} claves de i18n están sincronizadas al 100% en ES y EN.`);

// 2. Simular partidos reales con eventos canónicos y variados
const mockMatch1 = {
  id: 'm1',
  rival: 'Atlético Juvenil',
  date: '2026-09-01',
  status: 'Terminado',
  goalsFor: 2,
  goalsAgainst: 1,
  events: [
    { id: 'e1', type: 'shot_on_target_own', minute: 12 },
    { id: 'e2', type: 'gol_local', minute: 15 },
    { id: 'e3', type: 'duel_won', minute: 20 },
    { id: 'e4', type: 'recovery', minute: 25 },
    { id: 'e5', type: 'duel_lost', minute: 30 },
    { id: 'e6', type: 'loss', minute: 35 },
    { id: 'e7', type: 'foul_favor', minute: 40 },
    { id: 'e8', type: 'card_yellow_own', minute: 42 },
  ],
  liveStatsEvents: [
    { id: 'e9', type: 'shot_on_target_rival', minute: 50 },
    { id: 'e10', type: 'gol_rival', minute: 55 },
    { id: 'e11', type: 'recuperacion', minute: 60 },
    { id: 'e12', type: 'shot_on_target', minute: 65 },
    { id: 'e13', type: 'duelo_ganado', minute: 70 },
  ],
};

const mockMatch2 = {
  id: 'm2',
  rival: 'Real Deportivo',
  date: '2026-09-08',
  status: 'Terminado',
  goalsFor: 3,
  goalsAgainst: 0,
  events: [
    { id: 'e21', type: 'shot_on_target_own', minute: 10 },
    { id: 'e22', type: 'gol_local', minute: 18 },
    { id: 'e23', type: 'duel_won', minute: 22 },
    { id: 'e24', type: 'recovery', minute: 28 },
    { id: 'e25', type: 'shot_on_target_own', minute: 44 },
    { id: 'e26', type: 'loss', minute: 50 },
    { id: 'e27', type: 'shot_on_target_rival', minute: 60 },
  ],
};

// 3. Probar unificación de eventos
const unified1 = getUnifiedMatchEvents(mockMatch1);
assert.strictEqual(unified1.length, 13, `Debe haber 13 eventos unificados en mockMatch1 (obtenidos: ${unified1.length})`);
console.log(`✅ [PASS] getUnifiedMatchEvents fusiona eventos y liveStatsEvents correctamente (13 eventos).`);

// 4. Probar canonical stats
const canonical1 = calculateCanonicalStats(mockMatch1, unified1);
assert(canonical1.homeStats.recuperaciones >= 2, 'Recuperaciones debe ser >= 2');
assert(canonical1.homeStats.tirosPuerta >= 2, 'Tiros a puerta propios directos debe ser >= 2');
assert(canonical1.awayStats.tirosPuerta >= 1, 'Tiros a puerta rival debe ser >= 1');
console.log(`✅ [PASS] calculateCanonicalStats extrae tiros y recuperaciones canónicas con éxito.`);

// 5. Probar cálculo de agregados multipartido
const selectedMatches = [mockMatch1, mockMatch2];
const metrics = selectedMatches.map((m) => {
  const evs = getUnifiedMatchEvents(m);
  const { homeStats, awayStats } = calculateCanonicalStats(m, evs);
  const countOf = (types) => {
    const typeArr = Array.isArray(types) ? types : [types];
    return evs.filter((e) => typeArr.includes(e.type)).length;
  };
  const duelsWon = countOf(['duel_won', 'duelo_ganado']);
  const duelsLost = countOf(['duel_lost', 'duelo_perdido']);
  const duelsTotal = duelsWon + duelsLost;
  const duelPct = duelsTotal > 0 ? Math.round((duelsWon / duelsTotal) * 100) : 50;
  const shotsOwn = Math.max(homeStats?.tirosPuerta || 0, countOf(['shot_on_target_own', 'shot_on_target', 'gol_local']));
  const shotsRival = Math.max(awayStats?.tirosPuerta || 0, countOf(['shot_on_target_rival', 'gol_rival']));
  const recoveries = countOf(['recovery', 'recuperacion']) || (homeStats?.recuperaciones || 0);
  const losses = countOf(['loss', 'perdida']) || (awayStats?.recuperaciones || 0);
  const counterEff = recoveries > 0 ? Math.min(100, Math.round((shotsOwn / recoveries) * 100)) : 0;
  return {
    id: m.id,
    shotsOwn,
    shotsRival,
    duelPct,
    recoveries,
    losses,
    counterEff,
  };
});

assert(metrics[0].shotsOwn > 0, 'mockMatch1 shotsOwn debe ser > 0');
assert(metrics[0].shotsRival > 0, 'mockMatch1 shotsRival debe ser > 0');
assert(metrics[0].duelPct > 0, 'mockMatch1 duelPct debe ser > 0');
assert(metrics[0].recoveries > 0, 'mockMatch1 recoveries debe ser > 0');
assert(metrics[0].counterEff > 0, 'mockMatch1 counterEff debe ser > 0');

assert(metrics[1].shotsOwn > 0, 'mockMatch2 shotsOwn debe ser > 0');
assert(metrics[1].recoveries > 0, 'mockMatch2 recoveries debe ser > 0');

console.log(`✅ [PASS] Métricas individuales verificables:`);
console.log(`   - Partido 1: Tiros propios = ${metrics[0].shotsOwn}, Rival = ${metrics[0].shotsRival}, % Duelos = ${metrics[0].duelPct}%, Rec = ${metrics[0].recoveries}, Contras = ${metrics[0].counterEff}%`);
console.log(`   - Partido 2: Tiros propios = ${metrics[1].shotsOwn}, Rival = ${metrics[1].shotsRival}, % Duelos = ${metrics[1].duelPct}%, Rec = ${metrics[1].recoveries}, Contras = ${metrics[1].counterEff}%`);

const sumShotsOwn = metrics.reduce((acc, m) => acc + m.shotsOwn, 0);
const avgShotsOwn = (sumShotsOwn / metrics.length).toFixed(1);
assert.strictEqual(parseFloat(avgShotsOwn) > 0, true, 'El promedio de tiros a favor debe ser estrictamente > 0');

console.log(`✅ [PASS] Promedio colectivo de tiros a puerta = ${avgShotsOwn} (NUNCA MÁS 0.0)`);
console.log('==============================================================================\n');
