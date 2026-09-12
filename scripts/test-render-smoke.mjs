/**
 * scripts/test-render-smoke.mjs
 * Míster11 — Suite de Smoke Tests de Renderizado Canónico SVG (App + PDF)
 *
 * Valida la resiliencia de los 5 motores SVG canónicos frente a:
 *  1. Dataset Vacío ({}, [], undefined)
 *  2. Dataset Parcial (datos incompletos, métricas ausentes)
 *  3. Dataset Completo (partido real con goles, tiros xG, pases y táctica)
 *
 * Verificaciones:
 *  - Cero excepciones no controladas.
 *  - Retorna markup SVG válido (<svg ... </svg>).
 *  - Cero coordenadas 'NaN' en atributos generados.
 */

import { renderRadarCompareSvgString } from '../src/components/canonical/RadarCompareSVG.js';
import { renderComparisonBarsSvgString } from '../src/components/canonical/ComparisonBarsSVG.js';
import { renderMomentumSvgString } from '../src/components/canonical/MomentumSVG.js';
import { renderSectorTacticsSvgString } from '../src/components/canonical/SectorTacticsSVG.js';
import { renderShotMapSvgString } from '../src/components/canonical/ShotMapSVG.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — SMOKE TESTS DE RENDERIZADO CANÓNICO SVG (CI)');
console.log('==============================================================================\n');

let passed = 0;
let failed = 0;

function assert(cond, desc, detail = null) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${desc}`);
  } else {
    failed++;
    console.error(`  ❌ FALLO: ${desc}${detail ? ` -> ${detail}` : ''}`);
  }
}

function validateSvg(svgString, componentName, scenario) {
  const isString = typeof svgString === 'string';
  const hasOpenTag = isString && svgString.includes('<svg');
  const hasCloseTag = isString && svgString.includes('</svg>');
  const hasNoNaN = isString && !svgString.includes('="NaN"') && !svgString.includes('NaN,') && !svgString.includes(' NaN');

  assert(
    isString && hasOpenTag && hasCloseTag,
    `[${componentName}] [${scenario}] genera SVG bien formado (<svg>...</svg>)`,
    isString ? (hasOpenTag ? 'falta </svg>' : 'falta <svg>') : 'no es string'
  );

  assert(
    hasNoNaN,
    `[${componentName}] [${scenario}] sin coordenadas ni atributos NaN corruptos`,
    hasNoNaN ? null : 'se detectó "NaN" en el SVG'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATASETS DE PRUEBA
// ─────────────────────────────────────────────────────────────────────────────

// 1. Dataset Vacío
const EMPTY_DATASET = {
  events: [],
  homeStats: {},
  awayStats: {},
  tacticsData: {},
  shots: [],
  matchDuration: 90,
  homeTeamName: '',
  awayTeamName: ''
};

// 2. Dataset Parcial
const PARTIAL_DATASET = {
  events: [
    { minute: 12, type: 'goal', team: 'home', x: 88, y: 50 },
    { minute: null, type: null }
  ],
  homeStats: {
    tiros: 3,
    posesion: 52
  },
  awayStats: {
    faltas: 4
  },
  tacticsData: {
    leftPct: 35
  },
  shots: [
    { minute: 12, x: 88, y: 50, isGoal: true, isOwn: true, xG: 0.45 }
  ],
  matchDuration: 90,
  homeTeamName: 'Mi Equipo',
  awayTeamName: undefined
};

// 3. Dataset Completo
const COMPLETE_DATASET = {
  events: [
    { minute: 8, type: 'shot_on_target_own', team: 'home', x: 85, y: 48, isOwn: true },
    { minute: 15, type: 'recovery', team: 'home', x: 50, y: 30, isOwn: true },
    { minute: 23, type: 'duel_won', team: 'home', x: 60, y: 40, isOwn: true },
    { minute: 34, type: 'gol_local', team: 'home', x: 92, y: 50, isOwn: true, isGoal: true },
    { minute: 42, type: 'card_yellow_own', team: 'home', x: 45, y: 20, isOwn: true },
    { minute: 58, type: 'gol_rival', team: 'away', x: 12, y: 50, isOwn: false, isGoal: true },
    { minute: 71, type: 'corner_favor', team: 'home', x: 100, y: 5, isOwn: true },
    { minute: 85, type: 'save_own', team: 'home', x: 5, y: 50, isOwn: true }
  ],
  homeStats: {
    posesion: 58,
    tiros: 12,
    tirosPuerta: 6,
    paradas: 3,
    pasesExitosos: 340,
    pasesTotales: 410,
    recuperaciones: 45,
    corners: 5,
    faltas: 8,
    amarillas: 1,
    duelosGanados: 54,
    expectedGoals: 1.85
  },
  awayStats: {
    posesion: 42,
    tiros: 7,
    tirosPuerta: 4,
    paradas: 5,
    pasesExitosos: 220,
    pasesTotales: 300,
    recuperaciones: 38,
    corners: 3,
    faltas: 14,
    amarillas: 3,
    duelosGanados: 46,
    expectedGoals: 0.95
  },
  tacticsData: {
    leftPct: 30,
    centerPct: 45,
    rightPct: 25,
    territorialDominance: 62,
    setPiecesDominance: 60
  },
  shots: [
    { minute: 8, x: 85, y: 48, isOwn: true, onTarget: true, isGoal: false, xG: 0.18, comfort: 'normal' },
    { minute: 34, x: 92, y: 50, isOwn: true, onTarget: true, isGoal: true, xG: 0.65, comfort: 'comodo' },
    { minute: 58, x: 12, y: 50, isOwn: false, onTarget: true, isGoal: true, xG: 0.55, comfort: 'comodo' }
  ],
  ownXg: 1.85,
  rivalXg: 0.95,
  matchDuration: 90,
  homeTeamName: 'Mi Equipo Senior',
  awayTeamName: 'Xilxes CF'
};

// ─────────────────────────────────────────────────────────────────────────────
// EJECUCIÓN DE SMOKE TESTS
// ─────────────────────────────────────────────────────────────────────────────

console.log('1. Probando RadarCompareSVG (renderRadarCompareSvgString)...');
try {
  validateSvg(renderRadarCompareSvgString(EMPTY_DATASET), 'RadarCompareSVG', 'Vacío');
  validateSvg(renderRadarCompareSvgString(PARTIAL_DATASET), 'RadarCompareSVG', 'Parcial');
  validateSvg(renderRadarCompareSvgString(COMPLETE_DATASET), 'RadarCompareSVG', 'Completo');
} catch (err) {
  assert(false, `RadarCompareSVG crash inesperado: ${err.message}`);
}

console.log('\n2. Probando ComparisonBarsSVG (renderComparisonBarsSvgString)...');
try {
  validateSvg(renderComparisonBarsSvgString(EMPTY_DATASET), 'ComparisonBarsSVG', 'Vacío');
  validateSvg(renderComparisonBarsSvgString(PARTIAL_DATASET), 'ComparisonBarsSVG', 'Parcial');
  validateSvg(renderComparisonBarsSvgString(COMPLETE_DATASET), 'ComparisonBarsSVG', 'Completo');
} catch (err) {
  assert(false, `ComparisonBarsSVG crash inesperado: ${err.message}`);
}

console.log('\n3. Probando MomentumSVG (renderMomentumSvgString)...');
try {
  validateSvg(renderMomentumSvgString(EMPTY_DATASET), 'MomentumSVG', 'Vacío');
  validateSvg(renderMomentumSvgString(PARTIAL_DATASET), 'MomentumSVG', 'Parcial');
  validateSvg(renderMomentumSvgString(COMPLETE_DATASET), 'MomentumSVG', 'Completo');
} catch (err) {
  assert(false, `MomentumSVG crash inesperado: ${err.message}`);
}

console.log('\n4. Probando SectorTacticsSVG (renderSectorTacticsSvgString)...');
try {
  validateSvg(renderSectorTacticsSvgString(EMPTY_DATASET), 'SectorTacticsSVG', 'Vacío');
  validateSvg(renderSectorTacticsSvgString(PARTIAL_DATASET), 'SectorTacticsSVG', 'Parcial');
  validateSvg(renderSectorTacticsSvgString(COMPLETE_DATASET), 'SectorTacticsSVG', 'Completo');
} catch (err) {
  assert(false, `SectorTacticsSVG crash inesperado: ${err.message}`);
}

console.log('\n5. Probando ShotMapSVG (renderShotMapSvgString)...');
try {
  validateSvg(renderShotMapSvgString(EMPTY_DATASET), 'ShotMapSVG', 'Vacío');
  validateSvg(renderShotMapSvgString(PARTIAL_DATASET), 'ShotMapSVG', 'Parcial');
  validateSvg(renderShotMapSvgString(COMPLETE_DATASET), 'ShotMapSVG', 'Completo');
} catch (err) {
  assert(false, `ShotMapSVG crash inesperado: ${err.message}`);
}

console.log('\n==============================================================================');
console.log(`RESULTADOS: ${passed} PASADOS | ${failed} FALLADOS`);
console.log('==============================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS LOS SMOKE TESTS DE RENDERIZADO CANÓNICO SVG COMPLETADOS CON ÉXITO.\n');
  process.exit(0);
}
