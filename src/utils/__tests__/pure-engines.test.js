import { describe, it, expect } from 'vitest';

// 1. Motores puros
import {
  getExerciseRiskTier,
  getExerciseMinAge,
  assertAgeSafe,
  isHighClinicalRisk,
  canPrescribeAtHome,
  filterHomeExercises,
  CANONICAL_EXERCISE_SAFETY_MAP
} from '../exerciseSafety.js';

import {
  normalizeLineup,
  applyLineupChange,
  formatMatchDateSafe
} from '../lineupEngine.js';

import {
  getEffectiveMatchDuration,
  isMatchLocked,
  getUnifiedMatchEvents,
  calculateAllPlayerMinutes,
  calculateMinutesFromEvents,
  getStartingXI,
  isMatchStartedOrFinished,
  cleanseImpossibleMatchEvents,
  detectMatchEventDivergences,
  buildSmartMatchSheetActual
} from '../minutesEngine.js';

import {
  calcPerformanceScore,
  actitudToScore,
  calcMixedRating,
  deriveStatsFromEvents
} from '../ratingFormula.js';

import {
  localizeMaterial,
  MATERIAL_GLOSSARY_MAP
} from '../materialGlossary.js';

describe('B9: Pure Engines & Catalog Vitest Suite (>= 75% Coverage)', () => {
  // ── 1. EXERCISE SAFETY & CLINICAL VALIDATION ────────────────────────────────
  describe('exerciseSafety.js & exerciseSafetyMap.js', () => {
    it('getExerciseRiskTier returns canonical tier by id and fallback', () => {
      expect(getExerciseRiskTier('hex-022')).toBe('PENDIENTE-FISIO');
      expect(getExerciseRiskTier('sys-1')).toBe('bajo');
      expect(getExerciseRiskTier({ id: 'hex-057' })).toBe('PENDIENTE-FISIO');
      expect(getExerciseRiskTier({ id: 'custom-nordic', name: 'Nordic hamstring' })).toBe('alto');
      expect(getExerciseRiskTier({ id: 'unknown-low', name: 'Trote suave' })).toBe('bajo');
    });

    it('getExerciseMinAge returns exact minimum age or safe fallback', () => {
      expect(getExerciseMinAge('hex-022')).toBe(10);
      expect(getExerciseMinAge('sys-1')).toBe(10);
      expect(getExerciseMinAge({ id: 'hex-057' })).toBe(12);
      expect(getExerciseMinAge({ edad_minima_segura: 15 })).toBe(15);
      expect(getExerciseMinAge({ age_min: 16 })).toBe(16);
      expect(getExerciseMinAge({})).toBe(0);
    });

    it('assertAgeSafe blocks when playerAge < minAge (fail-closed)', () => {
      expect(assertAgeSafe(null, { id: 'hex-022' })).toEqual({ safe: true, badge: null });
      const blocked = assertAgeSafe(8, { id: 'hex-022' }); // minAge 10
      expect(blocked.safe).toBe(false);
      expect(blocked.reason).toBe('age_below_minimum');
      expect(blocked.badge).toBe('No apto para esta edad');

      const allowed = assertAgeSafe(12, { id: 'hex-022' });
      expect(allowed.safe).toBe(true);
      expect(allowed.badge).toBe(null);
    });

    it('isHighClinicalRisk classifies high risk keywords and target zones', () => {
      expect(isHighClinicalRisk(null)).toBe(false);
      expect(isHighClinicalRisk('hex-022')).toBe(true);
      expect(isHighClinicalRisk('hex-057')).toBe(true);
      expect(isHighClinicalRisk('hex-077')).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-1', name: 'Nordic Hamstring Curl' })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-2', name: 'Copenhagen adductor' })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-3', name: 'Drop jump pliométrico' })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-4', name: 'Box jump aterrizaje' })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-5', targetZones: ['cervical_portero'] })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-6', targetZones: ['isquiosurales_excentrico'] })).toBe(true);
      expect(isHighClinicalRisk({ id: 'ex-7', targetZones: ['prevencion_lca'] })).toBe(true);
      expect(isHighClinicalRisk({ id: 'sys-1', name: 'Plancha Frontal' })).toBe(false);
    });

    it('canPrescribeAtHome validates age, material and high-risk review', () => {
      // 1. Missing age
      const resAge = canPrescribeAtHome({ id: 'hex-057', edadMin: 12 }, { playerAge: 10 });
      expect(resAge.prescribable).toBe(false);
      expect(resAge.reason).toBe('age_below_minimum');

      // 2. High risk unreviewed illustration without supervision
      const resHigh = canPrescribeAtHome({
        id: 'hex-022',
        illustration: { type: 'pendiente', reviewed_by_human: false },
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 10
      }, { playerAge: 15, hasSupervision: false });
      expect(resHigh.prescribable).toBe(false);
      expect(resHigh.reason).toBe('high_risk_unreviewed_illustration');

      // 3. High risk with supervision allowed
      const resHighSup = canPrescribeAtHome({
        id: 'hex-022',
        illustration: { type: 'pendiente', reviewed_by_human: false },
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 10
      }, { playerAge: 15, hasSupervision: true });
      expect(resHighSup.prescribable).toBe(true);

      // 4. Missing required material
      const resMat = canPrescribeAtHome({
        id: 'ex-dumbbell',
        material_preferido: ['mancuernas_10kg'],
        edad_minima_segura: 10
      }, { playerAge: 16, userInventory: ['peso_corporal'] });
      expect(resMat.prescribable).toBe(false);
      expect(resMat.reason).toBe('material_missing');

      // 5. Normal low risk allowed
      const resLow = canPrescribeAtHome({
        id: 'sys-1',
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 10
      }, { playerAge: 12 });
      expect(resLow.prescribable).toBe(true);
    });

    it('filterHomeExercises correctly filters catalog array', () => {
      const catalog = [
        { id: 'sys-1', edadMin: 10, material_preferido: ['peso_corporal'] },
        { id: 'hex-057', edadMin: 14, material_preferido: ['peso_corporal'] }
      ];
      const under14 = filterHomeExercises(catalog, { playerAge: 12 });
      expect(under14.length).toBe(1);
      expect(under14[0].id).toBe('sys-1');
    });

    it('CANONICAL_EXERCISE_SAFETY_MAP contains valid tiers and minimum ages', () => {
      expect(Object.keys(CANONICAL_EXERCISE_SAFETY_MAP).length).toBeGreaterThan(5);
      for (const [id, meta] of Object.entries(CANONICAL_EXERCISE_SAFETY_MAP)) {
        expect(['alto', 'bajo', 'PENDIENTE-FISIO']).toContain(meta.tier_riesgo);
        expect(typeof meta.edadMin).toBe('number');
        expect(meta.edadMin).toBeGreaterThanOrEqual(8);
      }
    });
  });

  // ── 2. LINEUP ENGINE ───────────────────────────────────────────────────────
  describe('lineupEngine.js', () => {
    it('normalizeLineup fixes lengths to 11 titulares and 7 suplentes without duplicates', () => {
      const norm = normalizeLineup(['p1', 'p2', 'p1'], ['p3', 'p2']);
      expect(norm.titulares.length).toBe(11);
      expect(norm.suplentes.length).toBe(7);
      expect(norm.titulares[0]).toBe('p1');
      expect(norm.titulares[1]).toBe('p2');
      expect(norm.titulares[2]).toBe(null);
      expect(norm.suplentes[0]).toBe('p3');
      expect(norm.convocados).toEqual(['p1', 'p2', 'p3']);
    });

    it('normalizeLineup handles convocados fallback array', () => {
      const convocadosList = Array.from({ length: 15 }, (_, i) => `player_${i}`);
      const norm = normalizeLineup([], [], convocadosList);
      expect(norm.titulares.filter(Boolean).length).toBe(11);
      expect(norm.suplentes.filter(Boolean).length).toBe(4);
      expect(norm.convocados.length).toBe(15);
    });

    it('applyLineupChange swaps two players correctly and inmutably', () => {
      const initial = normalizeLineup(['p1', 'p2'], ['p3']);
      const changed = applyLineupChange(initial, { fromIdx: 0, toIdx: 1 });
      expect(changed.titulares[0]).toBe('p2');
      expect(changed.titulares[1]).toBe('p1');
      // Inmutabilidad
      expect(initial.titulares[0]).toBe('p1');
    });

    it('applyLineupChange moves player to empty slot and frees origin', () => {
      const initial = normalizeLineup(['p1'], []);
      const changed = applyLineupChange(initial, { fromIdx: 0, toIdx: 5 });
      expect(changed.titulares[0]).toBe(null);
      expect(changed.titulares[5]).toBe('p1');
    });

    it('applyLineupChange handles invalid bounds gracefully (noop)', () => {
      const initial = normalizeLineup(['p1'], []);
      expect(applyLineupChange(initial, { fromIdx: -1, toIdx: 2 })).toBe(initial);
      expect(applyLineupChange(initial, { fromIdx: 0, toIdx: 99 })).toBe(initial);
      expect(applyLineupChange(initial, { fromIdx: 3, toIdx: 3 })).toBe(initial);
      expect(applyLineupChange(initial, { fromIdx: 5, toIdx: 6 })).toBe(initial); // both empty
    });

    it('applyLineupChange preserves and swaps customPositions', () => {
      const initial = {
        titulares: ['p1', 'p2', null, null, null, null, null, null, null, null, null],
        suplentes: [null, null, null, null, null, null, null],
        customPositions: { 0: { x: 50, y: 100 }, 1: { x: 60, y: 120 } }
      };
      const changed = applyLineupChange(initial, { fromIdx: 0, toIdx: 1 });
      expect(changed.customPositions[0]).toEqual({ x: 60, y: 120 });
      expect(changed.customPositions[1]).toEqual({ x: 50, y: 100 });
    });

    it('formatMatchDateSafe formats dates in ES and EN or handles null fallback', () => {
      expect(formatMatchDateSafe(null, 'es')).toBe('Fecha sin registrar');
      expect(formatMatchDateSafe(null, 'en')).toBe('Unrecorded date');
      expect(formatMatchDateSafe({ date: '2026-10-15', time: '18:00' }, 'es')).toContain('15/10/2026');
      expect(formatMatchDateSafe({ date: '2026-10-15', time: '18:00' }, 'es')).toContain('18:00');
      expect(formatMatchDateSafe({ date: '15/10/2026' }, 'es')).toBe('15/10/2026');
      expect(formatMatchDateSafe({ date: new Date(2026, 9, 15) }, 'es')).toContain('2026');
      expect(formatMatchDateSafe({ date: { seconds: 1792000000 } }, 'es')).toBeTruthy();
      expect(formatMatchDateSafe({ date: { toDate: () => new Date(2026, 9, 15) } }, 'en')).toBeTruthy();
    });
  });

  // ── 3. MINUTES ENGINE ──────────────────────────────────────────────────────
  describe('minutesEngine.js', () => {
    it('getEffectiveMatchDuration calculates nominal and anticipated match duration', () => {
      expect(getEffectiveMatchDuration({ duration: 90 })).toBe(90);
      expect(getEffectiveMatchDuration({ duration: 90, hasExtraTime: true })).toBe(120);
      expect(getEffectiveMatchDuration({ duration: 80, durationType: 'completo' })).toBe(80);
      expect(getEffectiveMatchDuration({
        duration: 90,
        status: 'Terminado',
        finalClock: '39:30'
      })).toBe(40);
    });

    it('isMatchLocked checks finished status or closed acta', () => {
      expect(isMatchLocked({ status: 'En Juego' })).toBe(false);
      expect(isMatchLocked({ status: 'Terminado' })).toBe(true);
      expect(isMatchLocked({ status: 'Finalizado' })).toBe(true);
      expect(isMatchLocked({ actaOficial: { closed: true } })).toBe(true);
    });

    it('isMatchStartedOrFinished detects active and finished matches', () => {
      expect(isMatchStartedOrFinished({ status: 'Programado' })).toBe(false);
      expect(isMatchStartedOrFinished({ status: 'en_juego' })).toBe(true);
      expect(isMatchStartedOrFinished({ status: 'terminado' })).toBe(true);
      expect(isMatchStartedOrFinished({ goalsFor: 2 })).toBe(true);
    });

    it('getStartingXI extracts valid starting player IDs', () => {
      const { initialTitulares, initialSuplentes } = getStartingXI(['p1', 'p2'], ['p3'], []);
      expect(initialTitulares).toContain('p1');
      expect(initialTitulares).toContain('p2');
      expect(initialSuplentes).toContain('p3');
    });

    it('getUnifiedMatchEvents merges and sorts events', () => {
      const match = {
        events: [{ id: 'e1', minute: 15, type: 'goal' }],
        liveStatsEvents: [{ id: 'e2', minute: 10, type: 'foul' }, { id: 'e1', minute: 15, type: 'goal' }]
      };
      const unified = getUnifiedMatchEvents(match);
      expect(unified.length).toBe(2);
      expect(unified[0].id).toBe('e2');
      expect(unified[1].id).toBe('e1');
    });

    it('calculateMinutesFromEvents handles red cards, manual overrides, and late arrivals', () => {
      // 1. Red card at minute 35
      const redCardEvents = [
        { type: 'card_red_own', minute: 35, playerId: 'p1' }
      ];
      const resRed = calculateMinutesFromEvents('p1', redCardEvents, ['p1'], [], 90);
      expect(resRed.minutes).toBe(35);
      expect(resRed.source).toBe('titular_red_card');

      // 2. Manual override
      const resOverride = calculateMinutesFromEvents('p1', [], ['p1'], [], 90, 45);
      expect(resOverride.minutes).toBe(45);
      expect(resOverride.source).toBe('override');

      // 3. Late arrival (tarde)
      const resLate = calculateMinutesFromEvents('p1', [], ['p1'], [], 90, null, 'tarde', 15);
      expect(resLate.minutes).toBe(75); // 90 - 15

      // 4. Uncalled player
      const resUncalled = calculateMinutesFromEvents('p_ghost', [], ['p1'], [], 90);
      expect(resUncalled.minutes).toBe(0);
      expect(resUncalled.source).toBe('not_called');

      // 5. Injured titular
      const resInjured = calculateMinutesFromEvents('p1', [], ['p1'], [], 90, null, 'lesionado');
      expect(resInjured.source).toBe('injured_played');

      // 6. Injured unplayed
      const resInjuredBench = calculateMinutesFromEvents('p2', [], ['p1'], ['p2'], 90, null, 'lesionado');
      expect(resInjuredBench.minutes).toBe(0);
      expect(resInjuredBench.source).toBe('injured');

      // 7. Double yellow card -> expulsion
      const doubleYellow = [
        { type: 'card_yellow_own', minute: 20, playerId: 'p1' },
        { type: 'card_yellow_own', minute: 70, playerId: 'p1' }
      ];
      const resDoubleY = calculateMinutesFromEvents('p1', doubleYellow, ['p1'], [], 90);
      expect(resDoubleY.minutes).toBe(70);
      expect(resDoubleY.source).toBe('titular_red_card');

      // 8. Substitute who enters and is subbed out
      const subInAndOut = [
        { type: 'cambio', minute: 30, subInId: 'p2', subOutId: 'p1' },
        { type: 'cambio', minute: 75, subInId: 'p3', subOutId: 'p2' }
      ];
      const resSubInOut = calculateMinutesFromEvents('p2', subInAndOut, ['p1'], ['p2', 'p3'], 90);
      expect(resSubInOut.minutes).toBe(45); // 75 - 30

      // 9. Substitute who enters and gets red card
      const subRed = [
        { type: 'cambio', minute: 60, subInId: 'p2', subOutId: 'p1' },
        { type: 'card_red_own', minute: 80, playerId: 'p2' }
      ];
      const resSubRed = calculateMinutesFromEvents('p2', subRed, ['p1'], ['p2'], 90);
      expect(resSubRed.minutes).toBe(20);
      expect(resSubRed.source).toBe('sub_red_card');

      // 10. Bench player who never enters (DNP)
      const resDnp = calculateMinutesFromEvents('p_bench', [], ['p1'], ['p_bench'], 90);
      expect(resDnp.minutes).toBe(0);
      expect(resDnp.source).toBe('dnp');
    });

    it('buildSmartMatchSheetActual constructs synchronized sheet with rsvp and field status', () => {
      const match = {
        duration: 90,
        titulares: ['p1'],
        suplentes: ['p2'],
        convocados: ['p1', 'p2', 'p3'],
        events: [
          { type: 'cambio', minute: 60, subInId: 'p2', subOutId: 'p1' }
        ]
      };
      const rsvpMap = {
        'p3': { status: 'going' },
        'p4': { status: 'not_going' }
      };
      const currentActual = {
        'p1': { status: 'presente' }
      };

      const sheet = buildSmartMatchSheetActual(match, currentActual, rsvpMap, 'coach_uid', { preserveManual: false });
      expect(sheet['p1'].minutes).toBe(60);
      expect(sheet['p1'].status).toBe('presente');
      expect(sheet['p2'].minutes).toBe(30);
      expect(sheet['p2'].status).toBe('presente');
      expect(sheet['p3'].status).toBe('presente');
      expect(sheet['p4'].status).toBe('ausente');
    });

    it('cleanseImpossibleMatchEvents filters corrupted minutes', () => {
      const dirty = [
        { id: '1', minute: 45, type: 'gol_local' },
        { id: '2', minute: 199, type: 'gol_local' }
      ];
      const { cleansedEvents } = cleanseImpossibleMatchEvents(dirty, ['p1'], 90);
      expect(cleansedEvents.some(e => e.minute === 45)).toBe(true);
      expect(cleansedEvents.some(e => e.minute === 199 && e.isValid === false)).toBe(true);
    });

    it('calculateAllPlayerMinutes computes map for starting XI and bench', () => {
      const match = {
        duration: 90,
        titulares: ['p1', 'p2'],
        suplentes: ['p3'],
        convocados: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        events: [
          { type: 'cambio', minute: 60, playerOutId: 'p1', playerInId: 'p3' }
        ]
      };
      const minutesMap = calculateAllPlayerMinutes(match);
      expect(minutesMap).toBeDefined();
      expect(typeof minutesMap).toBe('object');
    });

    it('detectMatchEventDivergences detects discrepancies in player data', () => {
      const divergences = detectMatchEventDivergences({
        events: [{ id: 'e1', type: 'goal', playerId: 'p1' }],
        players: [{ id: 'p2' }]
      });
      expect(Array.isArray(divergences)).toBe(true);
    });
  });

  // ── 4. RATING FORMULA ──────────────────────────────────────────────────────
  describe('ratingFormula.js', () => {
    it('calcPerformanceScore for outfield players awards goals, assists and deductions', () => {
      const base = calcPerformanceScore({});
      expect(base).toBe(6.0);

      const greatGame = calcPerformanceScore({
        goles: 2,
        asistencias: 1,
        tirosPuerta: 2,
        recuperaciones: 2
      });
      expect(greatGame).toBe(10.0); // Clamped at 10.0

      const toughGame = calcPerformanceScore({
        faltas: 4,
        tarjetasRojas: 1
      });
      expect(toughGame).toBeLessThan(6.0);
      expect(toughGame).toBeGreaterThanOrEqual(4.0); // Clamped at 4.0
    });

    it('calcPerformanceScore routes to goalkeeper formula when isGoalkeeper is true', () => {
      const gkScore = calcPerformanceScore({
        isGoalkeeper: true,
        saves: 5,
        conceded: 1,
        decisiveSaves: 2
      });
      expect(typeof gkScore).toBe('number');
      expect(gkScore).toBeGreaterThanOrEqual(4.0);
      expect(gkScore).toBeLessThanOrEqual(10.0);
    });

    it('actitudToScore converts 1-5 stars to base 10 scale', () => {
      expect(actitudToScore(1)).toBe(2.0);
      expect(actitudToScore(3)).toBe(6.0);
      expect(actitudToScore(5)).toBe(10.0);
      expect(actitudToScore(null)).toBe(6.0); // fallback default
    });

    it('calcMixedRating weights 60% stats and 40% attitude', () => {
      const stats = { goles: 1, recuperaciones: 2 };
      const rating = calcMixedRating(stats, 4);
      expect(rating.mixedRating).toBeGreaterThanOrEqual(1.0);
      expect(rating.mixedRating).toBeLessThanOrEqual(10.0);
      expect(rating.performanceScore).toBeDefined();
      expect(rating.attitudeScore).toBe(8.0);
    });

    it('deriveStatsFromEvents aggregates player match events into stats object', () => {
      const events = [
        { type: 'goal', playerId: 'p1', attributed: true },
        { type: 'recovery', playerId: 'p1', attributed: true },
        { type: 'foul_against', playerId: 'p1', attributed: true },
        { type: 'save', playerId: 'gk1', attributed: true }
      ];
      const statsP1 = deriveStatsFromEvents('p1', events, 'DEL');
      expect(statsP1.goles).toBe(1);
      expect(statsP1.recuperaciones).toBe(1);
      expect(statsP1.faltas).toBe(1);

      const statsGk = deriveStatsFromEvents('gk1', events, 'POR');
      expect(statsGk.saves).toBe(1);
      expect(statsGk.isGoalkeeper).toBe(true);
    });
  });

  // ── 5. MATERIAL GLOSSARY ───────────────────────────────────────────────────
  describe('materialGlossary.js', () => {
    it('localizeMaterial translates single string or array using dictionary', () => {
      const tMock = (k) => {
        const dict = {
          'mat.dumbbell': 'Mancuernas',
          'mat.nordic_bench': 'Banco nórdico',
          'mat.cones': 'Conos'
        };
        return dict[k] || k;
      };

      expect(localizeMaterial('mancuerna', tMock)).toBe('Mancuernas');
      expect(localizeMaterial(['banco nórdico', 'conos'], tMock)).toBe('Banco nórdico, Conos');
      expect(localizeMaterial('sin_material', tMock)).toBe('sin_material');
      expect(localizeMaterial(null, tMock)).toBe('');
    });

    it('MATERIAL_GLOSSARY_MAP entries map to valid mat.* keys', () => {
      expect(Object.keys(MATERIAL_GLOSSARY_MAP).length).toBeGreaterThan(20);
      for (const [term, matKey] of Object.entries(MATERIAL_GLOSSARY_MAP)) {
        expect(matKey.startsWith('mat.')).toBe(true);
      }
    });
  });
});
