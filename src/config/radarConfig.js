/**
 * src/config/radarConfig.js
 * Míster11 — Módulo Hoja de Configuración y Normalización del Radar Comparativo (6 Ejes)
 *
 * Módulo puro sin dependencias circulares. Proporciona:
 *  1. Metadatos de los 6 ejes canónicos (etiquetas bilingües ES/EN, máximos de referencia).
 *  2. Función pura computeRadarAxes para normalización resiliente (0 a 100)
 *     a prueba de datasets vacíos, valores nulos, strings o undefined.
 */

export const RADAR_AXES_CONFIG = [
  { id: 'shots', labelEs: 'Tiros a Puerta', labelEn: 'Shots on Target', maxRef: 8, inverted: false },
  { id: 'duels', labelEs: 'Duelos / Posesión', labelEn: 'Duels / Possession', maxRef: 12, inverted: false },
  { id: 'fouls', labelEs: 'Control Faltas', labelEn: 'Foul Control', maxRef: 12, inverted: true },
  { id: 'discipline', labelEs: 'Disciplina', labelEn: 'Discipline', maxRef: 5, inverted: true },
  { id: 'corners', labelEs: 'Córners (ABP)', labelEn: 'Corners (SP)', maxRef: 8, inverted: false },
  { id: 'xg', labelEs: 'Producción xG', labelEn: 'xG Production', maxRef: 2.5, inverted: false },
];

/**
 * Cuenta ocurrencias seguras de tipos de evento en una lista.
 */
function safeCount(events, types) {
  if (!Array.isArray(events)) return 0;
  const matchTypes = Array.isArray(types) ? types : [types];
  return events.filter(e => e && matchTypes.includes(e.type)).length;
}

/**
 * Normaliza un número asegurando que sea finito y esté dentro de [min, max].
 */
function clamp(val, min = 10, max = 100) {
  const num = Number(val);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, Math.round(num)));
}

/**
 * Calcula los 6 ejes normalizados (0-100) para ambos equipos de forma pura y resiliente.
 *
 * @param {Object} homeStats Estadísticas del equipo local / propio
 * @param {Object} awayStats Estadísticas del equipo rival / visitante
 * @param {Array} events Lista de eventos del partido (para fallback si no hay stats precalculadas)
 * @param {boolean} isEn Flag para idioma inglés
 * @returns {Array} Lista de 6 objetos de eje con { id, label, homeVal, awayVal, homeRaw, awayRaw }
 */
export function computeRadarAxes({
  homeStats = {},
  awayStats = {},
  events = [],
  isEn = false,
} = {}) {
  const hs = homeStats || {};
  const as = awayStats || {};
  const evts = Array.isArray(events) ? events.filter(Boolean) : [];

  // 1. Tiros a puerta
  const ownShotsOn = Number(hs.tirosPuerta ?? safeCount(evts, ['shot_on_target_own', 'shot_on_target', 'gol_local', 'gol'])) || 0;
  const rivalShotsOn = Number(as.tirosPuerta ?? safeCount(evts, ['shot_on_target_rival', 'gol_rival'])) || 0;

  // 2. Duelos ganados / intervenciones
  const ownDuels = Number(hs.duelosGanados ?? safeCount(evts, ['duel_won', 'duelo_ganado', 'recovery', 'recuperacion'])) || 0;
  const rivalDuels = Number(as.duelosGanados ?? safeCount(evts, ['duel_lost', 'duelo_perdido'])) || 0;

  // 3. Faltas cometidas (Invertido: menos faltas = mayor puntuación de control)
  const ownFouls = Number(hs.faltas ?? safeCount(evts, ['foul_against', 'falta_contra', 'foul', 'falta'])) || 0;
  const rivalFouls = Number(as.faltas ?? safeCount(evts, ['foul_favor', 'falta_favor'])) || 0;

  // 4. Tarjetas / Disciplina (Invertido: menos tarjetas = mayor disciplina)
  const ownYellows = Number(hs.amarillas ?? safeCount(evts, ['card_yellow_own', 'card_own', 'amarilla'])) || 0;
  const ownReds = Number(hs.rojas ?? safeCount(evts, ['card_red_own', 'roja'])) || 0;
  const ownCards = ownYellows + (ownReds * 2);

  const rivalYellows = Number(as.amarillas ?? safeCount(evts, ['card_yellow_rival', 'card_rival'])) || 0;
  const rivalReds = Number(as.rojas ?? safeCount(evts, ['card_red_rival'])) || 0;
  const rivalCards = rivalYellows + (rivalReds * 2);

  // 5. Córners
  const ownCorners = Number(hs.corners ?? safeCount(evts, ['corner_favor', 'corner_own'])) || 0;
  const rivalCorners = Number(as.corners ?? safeCount(evts, ['corner_against', 'corner_rival'])) || 0;

  // 6. Goles esperados (xG)
  const ownXg = Number(hs.xg ?? 0);
  const rivalXg = Number(as.xg ?? 0);

  return [
    {
      id: 'shots',
      label: isEn ? 'Shots on Target' : 'Tiros a Puerta',
      homeVal: clamp((ownShotsOn / 8) * 100),
      awayVal: clamp((rivalShotsOn / 8) * 100),
      homeRaw: ownShotsOn,
      awayRaw: rivalShotsOn,
    },
    {
      id: 'duels',
      label: isEn ? 'Duels / Possession' : 'Duelos / Posesión',
      homeVal: clamp((ownDuels / 12) * 100),
      awayVal: clamp((rivalDuels / 12) * 100),
      homeRaw: ownDuels,
      awayRaw: rivalDuels,
    },
    {
      id: 'fouls',
      label: isEn ? 'Foul Control' : 'Control Faltas',
      homeVal: clamp(100 - Math.min(90, ownFouls * 7)),
      awayVal: clamp(100 - Math.min(90, rivalFouls * 7)),
      homeRaw: ownFouls,
      awayRaw: rivalFouls,
    },
    {
      id: 'discipline',
      label: isEn ? 'Discipline' : 'Disciplina',
      homeVal: clamp(100 - Math.min(90, ownCards * 20)),
      awayVal: clamp(100 - Math.min(90, rivalCards * 20)),
      homeRaw: ownCards,
      awayRaw: rivalCards,
    },
    {
      id: 'corners',
      label: isEn ? 'Corners (SP)' : 'Córners (ABP)',
      homeVal: clamp((ownCorners / 8) * 100),
      awayVal: clamp((rivalCorners / 8) * 100),
      homeRaw: ownCorners,
      awayRaw: rivalCorners,
    },
    {
      id: 'xg',
      label: isEn ? 'xG Production' : 'Producción xG',
      homeVal: clamp((ownXg / 2.5) * 100),
      awayVal: clamp((rivalXg / 2.5) * 100),
      homeRaw: ownXg.toFixed(1),
      awayRaw: rivalXg.toFixed(1),
    },
  ];
}
