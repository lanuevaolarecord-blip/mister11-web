/**
 * src/config/xgWeights.js
 * Míster11 — Modelo Canónico xG-Lite e Índices Derivados (Fase 2)
 *
 * Pesos internos de probabilidad esperada de gol (xG) y derivación
 * de índices de exposición y exigencia de portería sin dependencias externas.
 * Soporta matriz 2D de 9 zonas (3 columnas x 3 alturas) y retrocompatibilidad 1D.
 */

export const XG_BASE_WEIGHTS = {
  penalti: 0.76,

  // 9 Zonas 2D canónicas
  centro_att: 0.30,
  izq_att: 0.12,
  der_att: 0.12,
  centro_med: 0.04,
  izq_med: 0.03,
  der_med: 0.03,
  centro_def: 0.01,
  izq_def: 0.01,
  der_def: 0.01,

  // Claves legacy (Match Intelligence Fase 2 inicial)
  dentro_centro: 0.30,
  dentro_lateral: 0.12,
  centro_dentro: 0.30,
  izq_dentro: 0.12,
  der_dentro: 0.12,
  fuera: 0.04,
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
 * 9 Zonas canónicas de la matriz 2D
 */
export const ZONES_2D = [
  'izq_def', 'centro_def', 'der_def',
  'izq_med', 'centro_med', 'der_med',
  'izq_att', 'centro_att', 'der_att'
];

/**
 * Normaliza la clave de zona a partir de atributos de zona, sector y coordenadas.
 * Para Match Intelligence 2D: dentro -> att, fuera -> med, penalti -> penalti.
 * Eventos históricos 1D con altura 'desconocida' mantienen su clave legacy o desconocida_1d.
 *
 * @param {string|Object} zoneOrShot
 * @returns {string} Clave normalizada de zona
 */
export function normalizeZone(zoneOrShot) {
  if (!zoneOrShot) return 'centro_att';

  let rawZone = '';
  let sector = '';
  let altura = '';

  if (typeof zoneOrShot === 'string') {
    rawZone = zoneOrShot.toLowerCase().trim();
  } else if (typeof zoneOrShot === 'object') {
    if (zoneOrShot.isPenalty || zoneOrShot.playType === 'penalti' || zoneOrShot.type === 'penalti') {
      return 'penalti';
    }
    if (zoneOrShot.zone2D) {
      rawZone = String(zoneOrShot.zone2D).toLowerCase().trim();
    } else if (zoneOrShot.zone) {
      rawZone = String(zoneOrShot.zone).toLowerCase().trim();
    }
    sector = String(zoneOrShot.sector || '').toLowerCase().trim();
    altura = String(zoneOrShot.altura || zoneOrShot.height || '').toLowerCase().trim();

    if (!rawZone && !sector) {
      // Deducir de coordenadas X e Y si existen
      const x = typeof zoneOrShot.x === 'number' ? zoneOrShot.x : 80;
      const y = typeof zoneOrShot.y === 'number' ? zoneOrShot.y : 50;
      const col = y < 35 ? 'izq' : (y > 65 ? 'der' : 'centro');
      const row = x > 65 ? 'att' : (x >= 35 ? 'med' : 'def');
      return `${col}_${row}`;
    }
  }

  if (rawZone === 'penalti' || rawZone.includes('penal')) return 'penalti';

  // Si ya es una clave 2D canónica exacta
  if (ZONES_2D.includes(rawZone)) return rawZone;

  // Si tiene combinación de sector + altura explícita
  if (sector && altura && altura !== 'desconocida' && altura !== 'unknown') {
    const col = sector === 'left' ? 'izq' : (sector === 'right' ? 'der' : 'centro');
    const row = (altura === 'att' || altura === 'ataque') ? 'att'
      : ((altura === 'def' || altura === 'defensa') ? 'def' : 'med');
    return `${col}_${row}`;
  }

  // Mapeo explícito Match Intelligence: dentro -> att, fuera -> med
  if (rawZone === 'dentro_centro' || rawZone === 'centro_dentro') return 'centro_att';
  if (rawZone === 'izq_dentro') return 'izq_att';
  if (rawZone === 'der_dentro') return 'der_att';
  if (rawZone === 'dentro_lateral') {
    if (sector === 'left') return 'izq_att';
    if (sector === 'right') return 'der_att';
    return 'dentro_lateral'; // conserva peso legacy
  }

  if (rawZone === 'centro_fuera') return 'centro_med';
  if (rawZone === 'izq_fuera') return 'izq_med';
  if (rawZone === 'der_fuera') return 'der_med';
  if (rawZone === 'fuera') {
    if (sector === 'left') return 'izq_med';
    if (sector === 'right') return 'der_med';
    if (sector === 'center') return 'centro_med';
    return 'fuera'; // conserva peso legacy
  }

  // Evento 1D legacy puro con altura desconocida:
  // Conserva su sector legacy o clave sin inventar altura 'med'
  if (altura === 'desconocida' || altura === 'unknown') {
    return 'desconocida_1d';
  }

  return rawZone || 'centro_att';
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
  let base = XG_BASE_WEIGHTS[zoneKey];

  // Fallbacks si la clave normalizada no está en el diccionario exacto
  if (base === undefined) {
    if (zoneKey.includes('att') && zoneKey.includes('centro')) base = 0.30;
    else if (zoneKey.includes('att')) base = 0.12;
    else if (zoneKey.includes('med') && zoneKey.includes('centro')) base = 0.05;
    else if (zoneKey.includes('med')) base = 0.03;
    else if (zoneKey.includes('def')) base = 0.01;
    else if (zoneKey === 'desconocida_1d') base = 0.04;
    else base = 0.12;
  }

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
 * - Mapa de exposición defensiva (9 celdas 2D + compatibilidad legacy)
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

  // Mapa de exposición defensiva 2D (9 celdas + penalti + compatibilidad legacy)
  const defensiveExposureMap = {
    // 9 Celdas 2D
    izq_att: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    centro_att: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    der_att: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    izq_med: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    centro_med: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    der_med: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    izq_def: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    centro_def: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    der_def: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    penalti: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },

    // Aliases legacy para reglas DAFO y tests existentes
    dentro_centro: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    dentro_lateral: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    fuera: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
    desconocida_1d: { comodo: 0, presionado: 0, muy_presionado: 0, total: 0 },
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

    if (type === 'gol_rival' && hasExplicitRivalGoalShot) return;
    if (type === 'gol_local' && hasExplicitOwnGoalShot) return;

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

        // Sincronizar también con alias legacy para que las reglas DAFO existentes sigan alimentándose
        let legacyZone = null;
        if (zone === 'centro_att') legacyZone = 'dentro_centro';
        else if (zone === 'izq_att' || zone === 'der_att') legacyZone = 'dentro_lateral';
        else if (zone.includes('med') || zone.includes('def')) legacyZone = 'fuera';
        else if (zone === 'penalti') legacyZone = 'penalti';

        if (legacyZone && defensiveExposureMap[legacyZone]) {
          defensiveExposureMap[legacyZone].total++;
          if (comfort === 'comodo') defensiveExposureMap[legacyZone].comodo++;
          else if (comfort === 'presionado') defensiveExposureMap[legacyZone].presionado++;
          else if (comfort === 'muy_presionado') defensiveExposureMap[legacyZone].muy_presionado++;
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
