import { describe, it, expect } from 'vitest';

// 1. Motores puros
import {
  getExerciseRiskTier,
  getExerciseMinAge,
  requiresEffectiveSupervision,
  resolveExerciseAlias,
  getIllustrationRenderState,
  assertAgeSafe,
  isHighClinicalRisk,
  canPrescribeAtHome,
  filterHomeExercises,
  normalizeTargetZone,
  normalizeExerciseTargetZones,
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
  deriveStatsFromEvents,
  getGkConcededCount
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

      // 2. High risk unreviewed illustration without supervision (ejercicio clínico tier alto no PENDIENTE-FISIO, ej. sys-4)
      const resHigh = canPrescribeAtHome({
        id: 'sys-4',
        name: 'Nordic Hamstring',
        illustration: { type: 'pendiente', reviewed_by_human: false },
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 14
      }, { playerAge: 16, hasSupervision: false });
      expect(resHigh.prescribable).toBe(false);
      expect(resHigh.reason).toBe('high_risk_unreviewed_illustration');

      // 3. High risk with coach supervision allowed for non-PENDIENTE-FISIO
      const resHighSup = canPrescribeAtHome({
        id: 'sys-4',
        name: 'Nordic Hamstring',
        illustration: { type: 'pendiente', reviewed_by_human: false },
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 14
      }, { playerAge: 16, hasSupervision: true });
      expect(resHighSup.prescribable).toBe(true);

      // 4. Missing required material
      const resMat = canPrescribeAtHome({
        id: 'ex-dumbbell',
        material_preferido: ['mancuernas_10kg'],
        edad_minima_segura: 10
      }, { playerAge: 16, userInventory: ['peso_corporal'] });
      expect(resMat.prescribable).toBe(false);
      expect(resMat.reason).toBe('material_missing');

      // 5. Normal low risk allowed (hex-002; hex-001 es alias de sys-3 según Q1=A)
      const resLow = canPrescribeAtHome({
        id: 'hex-002',
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 10
      }, { playerAge: 12 });
      expect(resLow.prescribable).toBe(true);

      // 6. D2 / Q3=C: Ilustración rechazada por el dueño (fail-closed absoluto)
      const resRejected = canPrescribeAtHome({
        id: 'sys-1',
        illustration: { status: 'rejected_by_owner', reviewed_by_human: false }
      }, { playerAge: 15 });
      expect(resRejected.prescribable).toBe(false);
      expect(resRejected.reason).toBe('illustration_rejected_by_owner');
    });

    it('P12-A Q1=A: hex-001 is alias of sys-3, inherits rejected_by_owner block, and is excluded from filterHomeExercises', () => {
      const aliasInfo = resolveExerciseAlias('hex-001');
      expect(aliasInfo.isAlias).toBe(true);
      expect(aliasInfo.duplicateOf).toBe('sys-3');
      expect(aliasInfo.independentPrescribable).toBe(false);
      expect(aliasInfo.parentIllustrationStatus).toBe('rejected_by_owner');

      const resHex001 = canPrescribeAtHome({
        id: 'hex-001',
        duplicateOf: 'sys-3',
        material_preferido: ['pared'],
        edad_minima_segura: 10
      }, { playerAge: 18, hasSupervision: true });
      expect(resHex001.prescribable).toBe(false);
      expect(resHex001.reason).toBe('alias_of_blocked_exercise');
      expect(resHex001.inheritedReason).toBe('illustration_rejected_by_owner');

      // Incluso si un alias apuntara a un ejercicio no rechazado (ej. sys-10), Q1=A impide prescribirlo como ficha independiente
      const resSyntheticAlias = canPrescribeAtHome({
        id: 'hex-alias-test',
        duplicateOf: 'sys-10',
        material_preferido: ['peso_corporal'],
        edad_minima_segura: 10
      }, { playerAge: 18, hasSupervision: true });
      expect(resSyntheticAlias.prescribable).toBe(false);
      expect(resSyntheticAlias.reason).toBe('alias_not_independent');

      const filtered = filterHomeExercises([
        { id: 'hex-001', duplicateOf: 'sys-3', edad_minima_segura: 10, material_preferido: ['peso_corporal'] },
        { id: 'hex-002', edad_minima_segura: 10, material_preferido: ['peso_corporal'] }
      ], { playerAge: 18, hasSupervision: true });
      expect(filtered.map(e => e.id)).toEqual(['hex-002']);
    });

    it('P12-A Q2=B: edadMin=8 exercises require effective supervision without promoting risk tier to alto', () => {
      expect(getExerciseRiskTier('hex-093')).toBe('bajo');
      expect(requiresEffectiveSupervision('hex-093')).toBe(true);
      expect(requiresEffectiveSupervision({ id: 'hex-093', edad_minima_segura: 8, requiere_supervision_presencial: false })).toBe(true);

      const exAge8 = {
        id: 'hex-093',
        edad_minima_segura: 8,
        requiere_supervision_presencial: false,
        material_preferido: ['toalla']
      };

      // Jugador 10 años sin supervisión -> bloqueado
      const res10NoSup = canPrescribeAtHome(exAge8, { playerAge: 10, hasSupervision: false });
      expect(res10NoSup.prescribable).toBe(false);
      expect(res10NoSup.reason).toBe('supervision_required');
      expect(res10NoSup.subReason).toBe('q2_age_min_under_10');

      // Jugador 10 años con supervisión -> permitido
      const res10Sup = canPrescribeAtHome(exAge8, { playerAge: 10, hasSupervision: true });
      expect(res10Sup.prescribable).toBe(true);

      // Jugador 8 años sin supervisión -> bloqueado
      const res8NoSup = canPrescribeAtHome(exAge8, { playerAge: 8, hasSupervision: false });
      expect(res8NoSup.prescribable).toBe(false);

      // Jugador 8 años con supervisión -> permitido
      const res8Sup = canPrescribeAtHome(exAge8, { playerAge: 8, hasSupervision: true });
      expect(res8Sup.prescribable).toBe(true);

      // Jugador 7 años con supervisión -> bloqueado por edad mínima (7 < 8)
      const res7Sup = canPrescribeAtHome(exAge8, { playerAge: 7, hasSupervision: true });
      expect(res7Sup.prescribable).toBe(false);
      expect(res7Sup.reason).toBe('age_below_minimum');
    });

    it('P12-A Q3=C & Q4=B: getIllustrationRenderState blocks rejected SVGs and targetZones normalize cleanly', () => {
      for (const id of ['sys-1', 'sys-2', 'sys-3', 'sys-8', 'sys-9']) {
        const state = getIllustrationRenderState(id);
        expect(state.renderable).toBe(false);
        expect(state.svgAllowed).toBe(false);
        expect(state.guideAllowed).toBe(false);
        expect(state.status).toBe('rejected_by_owner');
        expect(state.placeholder).toBe('Ilustración pendiente de rediseño aprobado por el DUEÑO');
      }

      const stateHex001 = getIllustrationRenderState('hex-001');
      expect(stateHex001.renderable).toBe(false);
      expect(stateHex001.inheritedFrom).toBe('sys-3');
      expect(stateHex001.placeholder).toBe('Ilustración pendiente de rediseño aprobado por el DUEÑO');

      expect(normalizeTargetZone('isquiosural')).toBe('isquiosurales');
      expect(normalizeTargetZone('isquiosurales')).toBe('isquiosurales');
      expect(normalizeTargetZone('tobillos')).toBe('tobillo');
      expect(normalizeTargetZone('gemelo')).toBe('gemelos');
      expect(normalizeTargetZone('tendón_aquiles')).toBe('tendon_aquiles');
      expect(normalizeTargetZone('gluteo', 'hex-007')).toBe('gluteo_mayor');
      expect(normalizeTargetZone('gluteo', 'hex-008')).toBe('gluteo_medio');
      expect(normalizeTargetZone('gluteo')).toBe('[TARGETZONE_NO_CANONICA]');
      expect(normalizeTargetZone('zona_fantasma')).toBe('[TARGETZONE_NO_CANONICA]');
      expect(normalizeExerciseTargetZones(['isquiosural', 'gemelo', 'tobillos'])).toEqual(['isquiosurales', 'gemelos', 'tobillo']);
    });

    it('exerciseSafety R4: PENDIENTE-FISIO tier requires rigVerifiedBy even if reviewed_by_human is true or hasSupervision is true', () => {
      // hex-022 is canonical tier PENDIENTE-FISIO
      const exWithoutFisio = {
        id: 'hex-022',
        edad_minima_segura: 10,
        illustration: {
          reviewed_by_human: true,
          type: 'vectorial'
          // Sin rigVerifiedBy
        }
      };
      // Sin supervisión
      const resWithout = canPrescribeAtHome(exWithoutFisio, { playerAge: 16, hasSupervision: false });
      expect(resWithout.prescribable).toBe(false);
      expect(resWithout.reason).toBe('high_risk_fisio_verification_required');

      // S1 (R4): Test de inyección: hasSupervision: true + PENDIENTE-FISIO + sin rigVerifiedBy => prescribable: false
      const resSupWithoutFisio = canPrescribeAtHome(exWithoutFisio, { playerAge: 16, hasSupervision: true });
      expect(resSupWithoutFisio.prescribable).toBe(false);
      expect(resSupWithoutFisio.reason).toBe('high_risk_fisio_verification_required');

      const exWithFisio = {
        id: 'hex-022',
        edad_minima_segura: 10,
        illustration: {
          reviewed_by_human: true,
          type: 'vectorial',
          rigVerifiedBy: 'col_fisio_madrid_1234'
        }
      };
      const resWith = canPrescribeAtHome(exWithFisio, { playerAge: 16, hasSupervision: false });
      expect(resWith.prescribable).toBe(true);

      const resWithSup = canPrescribeAtHome(exWithFisio, { playerAge: 16, hasSupervision: true });
      expect(resWithSup.prescribable).toBe(true);
    });

    it('filterHomeExercises correctly filters catalog array', () => {
      const catalog = [
        { id: 'sys-10', edadMin: 10, material_preferido: ['peso_corporal'] },
        { id: 'hex-057', edadMin: 14, material_preferido: ['peso_corporal'] }
      ];
      const under14 = filterHomeExercises(catalog, { playerAge: 12 });
      expect(under14.length).toBe(1);
      expect(under14[0].id).toBe('sys-10');
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
        'p4': { status: 'not_going' },
        'p5': { status: 'late' },
        'p6': { status: 'justified' },
        'p7': { status: 'unknown_status' }
      };
      const currentActual = {
        'p1': { status: 'presente', lateMin: 10 },
        'p8': { source: 'manual', status: 'presente', minutesOverride: 45 }
      };

      const sheet = buildSmartMatchSheetActual(match, currentActual, rsvpMap, 'coach_uid', { preserveManual: true });
      expect(sheet['p1'].minutes).toBe(60);
      expect(sheet['p1'].status).toBe('presente');
      expect(sheet['p2'].minutes).toBe(30);
      expect(sheet['p2'].status).toBe('presente');
      expect(sheet['p3'].status).toBe('presente');
      expect(sheet['p4'].status).toBe('ausente');
      expect(sheet['p5'].status).toBe('tarde');
      expect(sheet['p6'].status).toBe('justificado');
      expect(sheet['p7'].status).toBe('sin_registro');
      expect(sheet['p8'].minutes).toBe(45);
      expect(sheet['p8'].source).toBe('manual');
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

    it('detectMatchEventDivergences detects all divergence edge cases', () => {
      const matchData = {
        duration: 90,
        goalsFor: 3,
        goalsAgainst: 2,
        titulares: ['p1', 'p2'],
        events: [
          { type: 'gol_local', minute: 10, playerId: 'p1' }, // only 1 goal vs 3 declared
          // 0 goals rival vs 2 declared
          { type: 'falta', minute: 95, playerId: 'p1' }, // beyond 90 min
          { type: 'cambio', minute: 20, subInId: 'p1', subOutId: 'p2' }, // p1 already in field
          { type: 'cambio', minute: 40, subInId: 'p3', subOutId: 'p4' }  // p4 not in field
        ]
      };

      const sheetActual = {
        'p3': { minutes: 0, minuteSource: 'dnp', status: 'presente' }, // entered at 40' but dnp
        'p2': { minutes: 90, minuteSource: 'titular_full', status: 'presente' }, // subbed out at 20' but titular_full
        'p5': { status: 'tarde', lateMin: 0 }, // late missing minutes
        'p6': { status: 'sin_registro' } // no status
      };

      const players = [
        { id: 'p1', name: 'Jugador 1' },
        { id: 'p2', name: 'Jugador 2' },
        { id: 'p3', name: 'Jugador 3' },
        { id: 'p4', name: 'Jugador 4' },
        { id: 'p5', name: 'Jugador 5' },
        { id: 'p6', name: 'Jugador 6' }
      ];

      const divergences = detectMatchEventDivergences(matchData, sheetActual, players);
      expect(divergences.some(d => d.type === 'goals_for_mismatch')).toBe(true);
      expect(divergences.some(d => d.type === 'goals_against_mismatch')).toBe(true);
      expect(divergences.some(d => d.type === 'event_beyond_final_whistle')).toBe(true);
      expect(divergences.some(d => d.type === 'impossible_substitution_in')).toBe(true);
      expect(divergences.some(d => d.type === 'impossible_substitution_out')).toBe(true);
      expect(divergences.some(d => d.type === 'sub_in_zero_minutes')).toBe(true);
      expect(divergences.some(d => d.type === 'sub_out_full_minutes')).toBe(true);
      expect(divergences.some(d => d.type === 'late_missing_minutes')).toBe(true);
      expect(divergences.some(d => d.type === 'player_no_status')).toBe(true);
    });

    it('cleanseImpossibleMatchEvents purges duplicate cards and impossible substitutions', () => {
      const dirtyEvents = [
        { id: 'e1', type: 'card_yellow_own', minute: 15, playerId: 'p1' },
        { id: 'e2', type: 'card_yellow_own', minute: 15, playerId: 'p1' }, // duplicate signature
        { id: 'e3', type: 'cambio', minute: 30, subInId: 'p1', subOutId: 'p2' }, // p1 already titular
        { id: 'e4', type: 'cambio', minute: 50, subInId: 'p3', subOutId: 'p99' }, // p99 not in match
        { id: 'e5', type: 'gol_rival', minute: 120 } // beyond 90 min
      ];
      const { cleansedEvents, removedCount, details } = cleanseImpossibleMatchEvents(dirtyEvents, ['p1', 'p2'], 90);
      expect(cleansedEvents.length).toBeGreaterThan(0);
      expect(removedCount).toBeGreaterThan(0);
      expect(details.length).toBeGreaterThan(0);
    });

    it('getUnifiedMatchEvents deduplicates goals and cards with various signatures', () => {
      const match = {
        events: [
          { type: 'gol_rival', minute: 30, playerId: 'r1' },
          { type: 'card_yellow_own', minute: 40, playerId: 'p1' }
        ],
        liveStatsEvents: [
          { type: 'gol_rival', minute: 30, playerId: 'r1' }, // duplicate goal
          { type: 'card_yellow_own', minute: 40, playerId: 'p1' }, // duplicate yellow
          { type: 'roja', minute: 85, playerId: 'p2' }
        ]
      };
      const unified = getUnifiedMatchEvents(match);
      expect(unified.length).toBe(3);
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

      // Con override explícito del míster
      const ratingWithOverride = calcMixedRating(stats, 4, 8.5);
      expect(ratingWithOverride.mixedRating).toBe(8.5);
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

      // Llamada con firma invertida (events primero)
      const statsP1Inverted = deriveStatsFromEvents(events, 'p1', 'DEL');
      expect(statsP1Inverted.goles).toBe(1);

      const statsGk = deriveStatsFromEvents('gk1', events, 'POR');
      expect(statsGk.saves).toBe(1);
      expect(statsGk.isGoalkeeper).toBe(true);
    });

    it('deriveStatsFromEvents correctly reflects rival goals as conceded for goalkeepers', () => {
      const eventsWithRivalGoal = [
        { type: 'save', playerId: 'gk1', attributed: true },
        { type: 'gol_rival', minute: 23, playerId: 'Rival' }
      ];
      const statsGk = deriveStatsFromEvents('gk1', eventsWithRivalGoal, 'POR');
      expect(statsGk.saves).toBe(1);
      expect(statsGk.conceded).toBe(1);
    });

    it('getGkConcededCount accurately counts and deduplicates rival goals and conceded events', () => {
      const gk = { id: 'gk_pau', name: 'Pau Barruguer' };

      // 1. Caso sin eventos ni goles
      expect(getGkConcededCount([], gk, { goalsAgainst: 0 })).toBe(0);

      // 2. Fallback con solo marcador en matchData
      expect(getGkConcededCount([], gk, { goalsAgainst: 2 })).toBe(2);

      // 3. Caso de gol rival desde Día del Partido (gol_rival sin evento 'conceded')
      const rivalGoalEvents = [
        { type: 'gol_rival', minute: 15, half: 1 }
      ];
      expect(getGkConcededCount(rivalGoalEvents, gk, { goalsAgainst: 1 })).toBe(1);

      // 4. Caso con evento 'conceded' explícito del portero
      const explicitConceded = [
        { type: 'conceded', playerId: 'gk_pau', minute: 30, half: 1 }
      ];
      expect(getGkConcededCount(explicitConceded, gk, null)).toBe(1);

      // 5. Deduplicación cuando coexisten 'gol_rival' y 'conceded' para el mismo gol
      const duplicatePairSameMinute = [
        { type: 'conceded', playerId: 'gk_pau', minute: 30, half: 1 },
        { type: 'gol_rival', playerId: 'Rival', minute: 30, half: 1 }
      ];
      expect(getGkConcededCount(duplicatePairSameMinute, gk, { goalsAgainst: 1 })).toBe(1);

      // 6. Deduplicación por rivalGoalId
      const duplicatePairWithId = [
        { type: 'shot_on_target_rival', outcome: 'goal', isGoal: true, rivalGoalId: 'rg_1', minute: 40 },
        { type: 'conceded', playerId: 'gk_pau', rivalGoalId: 'rg_1', minute: 40 },
        { type: 'gol_rival', playerId: 'Rival', rivalGoalId: 'rg_1', minute: 40 }
      ];
      expect(getGkConcededCount(duplicatePairWithId, gk, { goalsAgainst: 1 })).toBe(1);

      // 7. Múltiples goles rivales distintos
      const multiGoals = [
        { type: 'gol_rival', minute: 12, half: 1 },
        { type: 'gol_rival', minute: 68, half: 2 }
      ];
      expect(getGkConcededCount(multiGoals, gk, { goalsAgainst: 2 })).toBe(2);

      // 8. Eventos aislados de outfield player (ej. Anas #17 en filtro) pero gol rival registrado en matchData.events
      const outfieldOnlyEvents = [
        { type: 'pass_completed', playerId: 'anas_17', minute: 20 }
      ];
      const matchWithRivalGoal = {
        events: [{ type: 'gol_rival', minute: 34, playerName: 'Gol del Rival' }]
      };
      expect(getGkConcededCount(outfieldOnlyEvents, gk, matchWithRivalGoal)).toBe(1);

      // 9. Partido como Visitante con marcador local en contra
      expect(getGkConcededCount([], gk, { type: 'Visitante', marcadorLocal: 2 })).toBe(2);
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
