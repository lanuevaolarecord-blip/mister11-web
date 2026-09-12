/**
 * src/utils/matchAnalytics.js
 * Míster11 — Pipeline Canónico de Datos de Partido (SSOT: Single Source of Truth)
 *
 * PRINCIPIO RECTOR:
 * 1 gráfica = 1 componente canónico + 1 módulo de datos (matchAnalytics.js).
 * Tab Estadísticas, secciones de Post-Partido y PDF consumen exactamente
 * este mismo objeto de datos serializable.
 */

import { calculateShotXg } from '../config/xgWeights.js';
import { calculateCanonicalStats } from '../components/canonical/calculateCanonicalStats.js';
import { computeRadarAxes } from '../config/radarConfig.js';

/**
 * Función Hash determinista para generación de semillas pseudo-aleatorias estables.
 * Garantiza paridad de coordenadas entre la app interactiva y el raster 3x del PDF.
 */
export function hashString(str) {
  if (!str) return 42;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export const ZONE_9_DEFINITIONS = [
  { id: 'izq_def', nameEs: 'Izq. Defensiva', nameEn: 'Def. Left', x: [0, 35], y: [0, 22] },
  { id: 'centro_def', nameEs: 'Centro Defensivo', nameEn: 'Def. Center', x: [0, 35], y: [22, 46] },
  { id: 'der_def', nameEs: 'Der. Defensiva', nameEn: 'Def. Right', x: [0, 35], y: [46, 68] },
  { id: 'izq_med', nameEs: 'Medio Izquierdo', nameEn: 'Mid Left', x: [35, 70], y: [0, 22] },
  { id: 'centro_med', nameEs: 'Centro del Campo', nameEn: 'Midfield', x: [35, 70], y: [22, 46] },
  { id: 'der_med', nameEs: 'Medio Derecho', nameEn: 'Mid Right', x: [35, 70], y: [46, 68] },
  { id: 'izq_att', nameEs: 'Izq. Ofensiva', nameEn: 'Att. Left', x: [70, 105], y: [0, 22] },
  { id: 'centro_att', nameEs: 'Centro Ofensivo', nameEn: 'Att. Center', x: [70, 105], y: [22, 46] },
  { id: 'der_att', nameEs: 'Der. Ofensiva', nameEn: 'Att. Right', x: [70, 105], y: [46, 68] },
];

export function normalizeEventTo9Zone(e) {
  if (!e) return 'centro_med';
  const z2 = String(e.zone2D || e.zone || e.sector || '').toLowerCase();

  if (z2.includes('izq_def') || (z2.includes('left') && z2.includes('def'))) return 'izq_def';
  if (z2.includes('der_def') || (z2.includes('right') && z2.includes('def'))) return 'der_def';
  if (z2.includes('centro_def') || (z2.includes('cent') && z2.includes('def'))) return 'centro_def';

  if (z2.includes('izq_att') || (z2.includes('left') && (z2.includes('att') || z2.includes('ataq')))) return 'izq_att';
  if (z2.includes('der_att') || (z2.includes('right') && (z2.includes('att') || z2.includes('ataq')))) return 'der_att';
  if (z2.includes('centro_att') || (z2.includes('cent') && (z2.includes('att') || z2.includes('ataq')))) return 'centro_att';

  if (z2.includes('izq_med') || (z2.includes('left') && z2.includes('med'))) return 'izq_med';
  if (z2.includes('der_med') || (z2.includes('right') && z2.includes('med'))) return 'der_med';
  if (z2.includes('centro_med') || (z2.includes('cent') && z2.includes('med'))) return 'centro_med';

  if (typeof e.x === 'number' && typeof e.y === 'number') {
    const normX = e.x > 70 ? 'att' : (e.x < 35 ? 'def' : 'med');
    const normY = e.y > 66 ? 'der' : (e.y < 33 ? 'izq' : 'centro');
    return `${normY}_${normX}`;
  }

  if (z2.includes('left') || z2.includes('izq')) return 'izq_med';
  if (z2.includes('right') || z2.includes('der')) return 'der_med';
  return 'centro_med';
}

/**
 * Generador único de analítica y métricas para un partido.
 */
export function getMatchAnalytics(matchData = {}, rawEvents = [], options = {}) {
  const matchId = matchData.id || matchData.matchId || 'match_default';
  const events = Array.isArray(rawEvents) ? rawEvents.filter(e => e && e.isValid !== false) : [];
  const isEn = Boolean(options.isEn);

  // 1. Estadísticas canónicas base (10 métricas de comparación)
  const { homeStats, awayStats, tacticsData } = calculateCanonicalStats(matchData, events);

  // 2. Filtrado de eventos propios vs rivales
  const ownEvents = events.filter(e => {
    if (!e) return false;
    const type = String(e.type || '').toLowerCase();
    return e.team !== 'rival' && e.team !== 'away' && !type.includes('rival');
  });

  const rivalEvents = events.filter(e => {
    if (!e) return false;
    const type = String(e.type || '').toLowerCase();
    return e.team === 'rival' || e.team === 'away' || type.includes('rival');
  });

  // 3. Procesamiento y dispersión determinista de Tiros (Jitter con seed = hash(matchId + shotId))
  const allShotEvents = events.filter(e => {
    if (!e) return false;
    const t = String(e.type || '').toLowerCase();
    return t.includes('shot') || t.includes('tiro') || t.includes('gol') || t.includes('goal') || e.isShot || e.isGoal;
  });

  let ownXgSum = 0;
  let rivalXgSum = 0;
  let ownComfortableCount = 0;
  let rivalComfortableCount = 0;

  const sectorCounts = {
    left: { count: 0, onTarget: 0, goals: 0, xG: 0 },
    center: { count: 0, onTarget: 0, goals: 0, xG: 0 },
    right: { count: 0, onTarget: 0, goals: 0, xG: 0 },
  };

  const processedShots = allShotEvents.map((shot, idx) => {
    const isRival = shot.team === 'rival' || shot.team === 'away' || String(shot.type || '').includes('rival');
    const shotId = shot.id || `shot-${idx}`;
    const seed = hashString(`${matchId}_${shotId}`);

    // Normalización de sector
    let sector = 'center';
    const rawSector = String(shot.sector || shot.zone || '').toLowerCase();
    if (rawSector.includes('left') || rawSector.includes('izq')) sector = 'left';
    else if (rawSector.includes('right') || rawSector.includes('der')) sector = 'right';

    // Coordenadas base
    let baseY = sector === 'left' ? 18 : (sector === 'right' ? 82 : 50);
    let baseX = 78;

    if (typeof shot.x === 'number') baseX = shot.x;
    if (typeof shot.y === 'number') baseY = shot.y;

    // Dispersión determinista si son coordenadas discretas
    const jitterX = ((seed % 100) / 100 - 0.5) * 6;
    const jitterY = (((seed >> 7) % 100) / 100 - 0.5) * 10;
    const finalX = Math.max(55, Math.min(96, baseX + jitterX));
    const finalY = Math.max(8, Math.min(92, baseY + jitterY));

    // Distancia en metros (campo estándar 105x68)
    const dx = ((100 - finalX) / 100) * 105;
    const dy = Math.abs(50 - finalY) * 0.68;
    const distMeters = Math.max(2, Math.round(Math.sqrt(dx * dx + dy * dy)));

    // Cálculo unificado de xG
    const xG = shot.xG !== undefined ? Number(shot.xG) : calculateShotXg({ ...shot, x: finalX, y: finalY });
    const roundedXG = Number(xG.toFixed(2));

    const typeStr = String(shot.type || '').toLowerCase();
    const isGoal = shot.outcome === 'goal' || typeStr.includes('gol') || typeStr.includes('goal') || shot.isGoal;
    const isOffTarget = shot.outcome === 'off_target' || shot.outcome === 'missed' || typeStr.includes('off_target') || typeStr.includes('tiro_fuera');
    const isOnTarget = !isOffTarget && (isGoal || shot.outcome === 'on_target' || typeStr.includes('shot_on_target') || typeStr.includes('tiro_puerta') || typeStr.includes('puerta'));

    if (isRival) {
      rivalXgSum += roundedXG;
      if (shot.shooterComfort === 'comodo' || shot.comodidad === 'comodo') rivalComfortableCount++;
    } else {
      ownXgSum += roundedXG;
      if (shot.shooterComfort === 'comodo' || shot.comodidad === 'comodo') ownComfortableCount++;

      sectorCounts[sector].count += 1;
      sectorCounts[sector].xG = Number((sectorCounts[sector].xG + roundedXG).toFixed(2));
      if (isOnTarget) sectorCounts[sector].onTarget += 1;
      if (isGoal) sectorCounts[sector].goals += 1;
    }

    return {
      ...shot,
      id: shotId,
      isRival,
      sector,
      x: Number(finalX.toFixed(1)),
      y: Number(finalY.toFixed(1)),
      distMeters,
      xG: roundedXG,
      isGoal: Boolean(isGoal),
      isOnTarget: Boolean(isOnTarget),
      minute: shot.minute || shot.time || '—',
      playerName: shot.playerName || shot.jugadorNombre || (shot.playerNumber ? `#${shot.playerNumber}` : '—')
    };
  });

  const ownShots = processedShots.filter(s => !s.isRival);
  const rivalShots = processedShots.filter(s => s.isRival);

  const ownGoalsCount = ownShots.filter(s => s.isGoal).length;
  const ownOnTargetCount = ownShots.filter(s => s.isOnTarget).length;
  const rivalGoalsCount = rivalShots.filter(s => s.isGoal).length;
  const rivalOnTargetCount = rivalShots.filter(s => s.isOnTarget).length;

  const ownTotalXg = Number(ownXgSum.toFixed(2));
  const rivalTotalXg = Number(rivalXgSum.toFixed(2));

  // 4. Distribución Territorial 9 Zonas (3x3)
  const zoneStats = {};
  ZONE_9_DEFINITIONS.forEach(z => {
    zoneStats[z.id] = { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0 };
  });

  let totalOwnEventsInZones = 0;
  ownEvents.forEach(e => {
    const zoneId = normalizeEventTo9Zone(e);
    if (!zoneStats[zoneId]) zoneStats[zoneId] = { total: 0, duelsWon: 0, duelsLost: 0, recoveries: 0, shots: 0, fouls: 0 };

    zoneStats[zoneId].total += 1;
    totalOwnEventsInZones += 1;
    const type = String(e.type || '').toLowerCase();

    if (type === 'duel_won' || type === 'duelo_ganado') zoneStats[zoneId].duelsWon += 1;
    else if (type === 'duel_lost' || type === 'duelo_perdido') zoneStats[zoneId].duelsLost += 1;
    else if (type === 'recovery' || type === 'recuperacion') zoneStats[zoneId].recoveries += 1;
    else if (type.includes('shot') || type.includes('tiro') || type.includes('gol') || type.includes('goal')) zoneStats[zoneId].shots += 1;
    else if (type.includes('foul') || type.includes('falta')) zoneStats[zoneId].fouls += 1;
  });

  const maxZoneEvents = Math.max(1, ...Object.values(zoneStats).map(s => s.total));

  // 5. Reglas de Narrativa Táctica Explícita
  // Regla 1: goles < xG - 1.5 -> Eficacia Rematadora
  const hasFinishingDeficit = ownGoalsCount < (ownTotalXg - 1.5);
  // Regla 2: xG rival > 1.5 y comodidad >= 60% -> Aviso Defensivo
  const rivalComfortPct = rivalShots.length > 0 ? Math.round((rivalComfortableCount / rivalShots.length) * 100) : 0;
  const hasDefensiveAlert = (rivalTotalXg > 1.5) && (rivalComfortPct >= 60);

  // Regla 3: zona con > 40% eventos -> Zona Dominante
  let dominantZone = null;
  if (totalOwnEventsInZones > 0) {
    for (const z of ZONE_9_DEFINITIONS) {
      const zTotal = zoneStats[z.id]?.total || 0;
      const pct = Math.round((zTotal / totalOwnEventsInZones) * 100);
      if (pct >= 40) {
        dominantZone = {
          id: z.id,
          nameEs: z.nameEs,
          nameEn: z.nameEn,
          pct
        };
        break;
      }
    }
  }

  // 6. Red de Pases Condicional (< 5 pases propios -> deshabilitar red de pases con tooltip)
  const passCount = ownEvents.filter(e => {
    const t = String(e.type || '').toLowerCase();
    return t.includes('pass') || t.includes('pase');
  }).length;
  const passNetworkAvailable = passCount >= 5;

  // 7. Ejes de Radar Canónicos (6 ejes calculados)
  const radarAxes = computeRadarAxes({
    homeStats,
    awayStats,
    events,
    isEn
  });

  // 8. Objeto Serializado Canónico Consolidado
  return {
    matchId,
    homeTeamName: String(matchData.local || (isEn ? 'Home' : 'Local')).trim(),
    awayTeamName: String(matchData.rival || (isEn ? 'Away' : 'Rival')).trim(),
    homeStats,
    awayStats,
    tacticsData,
    radarAxes,
    shots: {
      ownShots,
      rivalShots,
      all: processedShots,
      ownTotalXg,
      rivalTotalXg,
      ownGoalsCount,
      ownOnTargetCount,
      rivalGoalsCount,
      rivalOnTargetCount,
      ownOnTarget: ownOnTargetCount,
      ownOffTarget: Math.max(0, ownShots.length - ownOnTargetCount),
      rivalOnTarget: rivalOnTargetCount,
      rivalOffTarget: Math.max(0, rivalShots.length - rivalOnTargetCount),
      conversionRate: ownShots.length > 0 ? Math.round((ownGoalsCount / ownShots.length) * 100) : 0,
      bySector: sectorCounts
    },
    zones: {
      definitions: ZONE_9_DEFINITIONS,
      stats: zoneStats,
      maxZoneEvents,
      totalOwnEvents: totalOwnEventsInZones,
      dominantZone
    },
    narrative: {
      hasFinishingDeficit,
      hasDefensiveAlert,
      dominantZone,
      finishingDeficitTextEs: 'Eficacia rematadora: Volumen alto de ocasiones con déficit en definición respecto al xG generado.',
      finishingDeficitTextEn: 'Finishing Efficiency: High volume of scoring chances with deficit in conversion vs generated xG.',
      defensiveAlertTextEs: `Aviso defensivo: El rival generó ${rivalTotalXg} xG con un ${rivalComfortPct}% de remates en alta comodidad.`,
      defensiveAlertTextEn: `Defensive Alert: Opponent generated ${rivalTotalXg} xG with ${rivalComfortPct}% comfortable shooting opportunities.`,
      dominantZoneTextEs: dominantZone ? `Zona dominante: El ${dominantZone.pct}% de las intervenciones se concentraron en ${dominantZone.nameEs}.` : null,
      dominantZoneTextEn: dominantZone ? `Dominant zone: ${dominantZone.pct}% of team actions concentrated in ${dominantZone.nameEn}.` : null
    },
    passNetwork: {
      count: passCount,
      available: passNetworkAvailable,
      tooltipEs: 'Se requieren al menos 5 pases registrados para generar la red táctica. Se muestra el mapa territorial.',
      tooltipEn: 'At least 5 recorded passes required for tactical pass network. Showing territorial map instead.'
    }
  };
}
