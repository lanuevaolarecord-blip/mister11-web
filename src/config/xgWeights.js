/**
 * src/config/xgWeights.js
 * Míster11 — Modelo Canónico xG-Lite e Índices Derivados (Fase 2)
 *
 * Pesos internos de probabilidad esperada de gol (xG) y derivación
 * de índices de exposición y exigencia de portería sin dependencias externas.
 */

export const XG_BASE_WEIGHTS = {
  penalti: 0.76,
  dentro_centro: 0.30,
  dentro_lateral: 0.12,
  fuera: 0.04,
  // Fallbacks / alias
  centro_dentro: 0.30,
  izq_dentro: 0.12,
  der_dentro: 0.12,
  centro_fuera: 0.04,
  izq_fuera: 0.04,
  der_fuera: 0.04,
};

export const XG_COMFORT_MULTIPLIERS = {
  comodo: 1.15,
  presionado: 0.85,
  muy_presionado: 0.65,
  // alias
  'muy presionado': 0.65,
  normal: 1.00,
  sin_contexto: 1.00,
};

export const XG_PLAY_TYPE_MULTIPLIERS = {
  contra: 1.10,
  balon_parado: 0.90,
  'balon parado': 0.90,
  jugada: 1.00,
  penalti: 1.00,
  sin_contexto: 1.00,
};

/**
 * Normaliza la clave de zona a partir de atributos de zona, sector y coordenadas.
 * @param {string|Object} zoneOrShot
 * @returns {'penalti'|'dentro_centro'|'dentro_lateral'|'fuera'}
 */
export function normalizeZone(zoneOrShot) {
  if (!zoneOrShot) return 'dentro_centro';

  let zone = '';
  if (typeof zoneOrShot === 'string') {
    zone = zoneOrShot.toLowerCase().trim();
  } else if (typeof zoneOrShot === 'object') {
    if (zoneOrShot.isPenalty || zoneOrShot.playType === 'penalti' || zoneOrShot.type === 'penalti') {
      return 'penalti';
    }
    if (zoneOrShot.zone) {
      zone = String(zoneOrShot.zone).toLowerCase().trim();
    } else {
      // Deducir de coordenadas X e Y si existen
      const x = typeof zoneOrShot.x === 'number' ? zoneOrShot.x : 80;
      const y = typeof zoneOrShot.y === 'number' ? zoneOrShot.y : 50;
      const isInside = x >= 83 && y >= 22 && y <= 78;
      const isCenter = y >= 36 && y <= 64;
      if (!isInside) return 'fuera';
      return isCenter ? 'dentro_centro' : 'dentro_lateral';
    }
  }

  if (zone === 'penalti' || zone.includes('penal')) return 'penalti';
  if (zone === 'dentro_centro' || zone === 'centro_dentro') return 'dentro_centro';
  if (zone === 'dentro_lateral' || zone === 'izq_dentro' || zone === 'der_dentro') return 'dentro_lateral';
  if (zone === 'fuera' || zone.includes('fuera')) return 'fuera';

  return 'dentro_centro';
}

/**
 * Normaliza el multiplicador de comodidad.
 */
export function normalizeComfort(comfort) {
  if (!comfort) return 1.00;
  const key = String(comfort).toLowerCase().trim().replace(/\s+/g, '_');
  return XG_COMFORT_MULTIPLIERS[key] || 1.00;
}

/**
 * Normaliza el multiplicador de tipo de jugada.
 */
export function normalizePlayType(playType) {
  if (!playType) return 1.00;
  const key = String(playType).toLowerCase().trim().replace(/\s+/g, '_');
  return XG_PLAY_TYPE_MULTIPLIERS[key] || 1.00;
}

/**
 * Calcula el valor xG de un remate individual.
 * @param {Object} shot
 * @returns {number} xG clamped [0.01, 0.99]
 */
export function calculateShotXg(shot = {}) {
  // Si ya tiene xG precalculado explícito numérico y no es 0
  if (typeof shot.xgExplicit === 'number' && shot.xgExplicit > 0) {
    return Math.min(0.99, Math.max(0.01, Math.round(shot.xgExplicit * 100) / 100));
  }

  const zoneKey = normalizeZone(shot);
  const base = XG_BASE_WEIGHTS[zoneKey] ?? 0.12;

  const comfortMult = normalizeComfort(shot.shooterComfort || shot.comfort);
  const playTypeMult = normalizePlayType(shot.playType);

  const raw = base * comfortMult * playTypeMult;
  return Math.min(0.99, Math.max(0.01, Math.round(raw * 100) / 100));
}

/**
 * Calcula los índices derivados de un partido:
 * - xG propio y rival acumulados
 * - Índice de exigencia GK (paradas + 2*decisivas)
 * - % paradas total y por dificultad
 * - Índice de comodidad rival (% tiros cómodos)
 * - Mapa de exposición defensiva (zona x comodidad)
 *
 * @param {Array} events - Lista de eventos del partido
 * @param {Object} [options]
 * @returns {Object} Índices derivados
 */
export function calculateMatchDerivedIndices(events = [], options = {}) {
  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];

  let ownXg = 0;
  let rivalXg = 0;
  let ownShotsCount = 0;
  let rivalShotsCount = 0;

  let rivalComfortableShots = 0;
  let rivalTotalShotsWithComfort = 0;

  // Mapa de exposición defensiva (tiros rivales por zona x comodidad)
  const defensiveExposureMap = {
    dentro_centro: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    dentro_lateral: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    fuera: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    penalti: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
  };

  // Métricas GK
  let normalSaves = 0;
  let decisiveSaves = 0;
  let penaltySaves = 0;
  let concededGoals = 0;

  // Si hay eventos de tiro explícitos que ya representan goles, no duplicar con gol_local / gol_rival
  const hasExplicitRivalGoalShot = safeEvents.some(e => {
    const t = String(e.type || '').toLowerCase();
    return t.includes('rival') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol');
  });
  const hasExplicitOwnGoalShot = safeEvents.some(e => {
    const t = String(e.type || '').toLowerCase();
    return (t.includes('own') || t === 'shot_favor') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol');
  });

  safeEvents.forEach(e => {
    const type = String(e.type || '').toLowerCase();
    const isOwnShot = type.includes('own') || type === 'gol_local' || type === 'shot_favor' || (type.includes('shot') && !type.includes('rival'));
    const isRivalShot = type.includes('rival') || type === 'gol_rival' || type === 'shot_rival';

    // Descartar evento 'gol_rival' genérico si ya se contó como shot con goal
    if (type === 'gol_rival' && hasExplicitRivalGoalShot) {
      return;
    }
    // Descartar evento 'gol_local' genérico si ya se contó como shot con goal
    if (type === 'gol_local' && hasExplicitOwnGoalShot) {
      return;
    }

    // Disparos y xG
    if (type.includes('shot') || type.startsWith('gol_') || type === 'goal') {
      const shotXg = e.xG !== undefined ? Number(e.xG) : calculateShotXg(e);

      if (isRivalShot) {
        rivalXg += shotXg;
        rivalShotsCount++;

        const comfort = String(e.shooterComfort || e.comfort || 'sin_contexto').toLowerCase().replace(/\s+/g, '_');
        if (comfort === 'comodo') rivalComfortableShots++;
        if (comfort === 'comodo' || comfort === 'presionado' || comfort === 'muy_presionado') {
          rivalTotalShotsWithComfort++;
        }

        const zone = normalizeZone(e);
        if (defensiveExposureMap[zone]) {
          defensiveExposureMap[zone].total++;
          if (comfort === 'comodo') defensiveExposureMap[zone].comodo++;
          else if (comfort === 'presionado') defensiveExposureMap[zone].presionado++;
          else if (comfort === 'muy_presionado') defensiveExposureMap[zone].muy_presionado++;
        }

        if (e.outcome === 'goal' || e.isGoal || e.result === 'gol') {
          concededGoals++;
        }
      } else if (isOwnShot) {
        ownXg += shotXg;
        ownShotsCount++;
      }
    }

    // Paradas del portero propio
    if (type === 'save_own' || type === 'save' || type === 'parada') {
      const diff = String(e.saveDifficulty || e.difficulty || 'normal').toLowerCase();
      if (diff === 'decisiva' || diff === 'decisive') {
        decisiveSaves++;
      } else {
        normalSaves++;
      }
    }

    if (type === 'penalty_save' || type === 'penaltysave' || type === 'penalti_parado') {
      penaltySaves++;
    }

    if (type === 'conceded') {
      concededGoals++;
    }
  });

  const totalSaves = normalSaves + decisiveSaves;
  const shotsFaced = totalSaves + concededGoals;

  // Índice de Exigencia GK = paradas + 2*decisivas
  const gkExertionIndex = normalSaves + (2 * decisiveSaves);
  const isDemandingMatch = gkExertionIndex >= 6 || decisiveSaves >= 3;

  // Porcentaje de paradas total y por dificultad
  const totalSavePct = shotsFaced > 0 ? Math.round((totalSaves / shotsFaced) * 100) : (concededGoals === 0 && totalSaves > 0 ? 100 : 0);
  const normalSavePct = (normalSaves + concededGoals) > 0 ? Math.round((normalSaves / (normalSaves + concededGoals)) * 100) : 0;
  const decisiveSavePct = decisiveSaves > 0 ? 100 : 0;

  // Índice de comodidad rival (% tiros cómodos)
  const rivalComfortPct = rivalTotalShotsWithComfort > 0
    ? Math.round((rivalComfortableShots / rivalTotalShotsWithComfort) * 100)
    : (rivalShotsCount > 0 ? Math.round((rivalComfortableShots / rivalShotsCount) * 100) : 0);

  return {
    ownXg: Number(ownXg.toFixed(2)),
    rivalXg: Number(rivalXg.toFixed(2)),
    ownShotsCount,
    rivalShotsCount,
    gkExertionIndex,
    isDemandingMatch,
    normalSaves,
    decisiveSaves,
    totalSaves,
    penaltySaves,
    concededGoals,
    shotsFaced,
    totalSavePct,
    normalSavePct,
    decisiveSavePct,
    rivalComfortableShots,
    rivalComfortPct,
    defensiveExposureMap,
  };
}
