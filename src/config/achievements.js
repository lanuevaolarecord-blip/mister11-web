/**
 * src/config/achievements.js
 * Catálogo de Logros Deportivos Dinámicos para Míster11 (v3).
 * Basado en la realidad de la temporada de fútbol formativo y amateur (10 meses, Sept-Junio).
 */

export const ACHIEVEMENT_TIERS = {
  BRONZE: {
    id: 'bronze',
    name: 'Bronce',
    nameKey: 'player.achievements.tierBronze',
    color: '#CD7F32',
    bg: 'rgba(205, 127, 50, 0.12)',
    border: 'rgba(205, 127, 50, 0.35)',
    icon: '🥉',
    resetPeriod: 'weekly', // Lunes 00:00
    periodLabel: 'Esta semana',
    periodKey: 'player.achievements.thisWeek'
  },
  SILVER: {
    id: 'silver',
    name: 'Plata',
    nameKey: 'player.achievements.tierSilver',
    color: '#B0BEC5',
    bg: 'rgba(176, 190, 197, 0.12)',
    border: 'rgba(176, 190, 197, 0.35)',
    icon: '🥈',
    resetPeriod: 'biweekly', // 14 días
    periodLabel: 'Esta quincena',
    periodKey: 'player.achievements.thisFortnight'
  },
  GOLD: {
    id: 'gold',
    name: 'Oro',
    nameKey: 'player.achievements.tierGold',
    color: '#C9A84C',
    bg: 'rgba(201, 168, 76, 0.15)',
    border: 'rgba(201, 168, 76, 0.45)',
    icon: '🥇',
    resetPeriod: 'season', // Al finalizar la temporada (30 junio)
    periodLabel: 'Temporada 2026-27',
    periodKey: 'player.achievements.seasonPeriod'
  }
};

export const ACHIEVEMENTS_CATALOG = [
  // ─── TIER BRONCE (Semanal - 25 XP cada uno) ──────────────────────────────
  {
    id: 'weekly_perfect_week',
    tier: 'BRONZE',
    name: 'Semana Perfecta',
    nameKey: 'ach.weekly_perfect_week.name',
    desc: 'Asiste al 100% de las sesiones de entrenamiento programadas esta semana.',
    descKey: 'ach.weekly_perfect_week.desc',
    category: 'attendance',
    icon: 'Flame',
    targetType: 'dynamic_sessions',
    defaultTarget: 2,
    xp: 25
  },
  {
    id: 'weekly_wellness',
    tier: 'BRONZE',
    name: 'Check-in de Salud',
    nameKey: 'ach.weekly_wellness.name',
    desc: 'Registra tu estado de descanso y molestias en los días de entrenamiento.',
    descKey: 'ach.weekly_wellness.desc',
    category: 'wellness',
    icon: 'Activity',
    targetType: 'dynamic_sessions',
    defaultTarget: 2,
    xp: 25
  },
  {
    id: 'weekly_scholar',
    tier: 'BRONZE',
    name: 'Mente Fuerte',
    nameKey: 'ach.weekly_scholar.name',
    desc: 'Completa al menos 1 test psicológico o evaluación en el portal.',
    descKey: 'ach.weekly_scholar.desc',
    category: 'tests',
    icon: 'Brain',
    targetType: 'fixed',
    defaultTarget: 1,
    xp: 25
  },
  {
    id: 'weekly_committed',
    tier: 'BRONZE',
    name: 'Trabajo Invisible',
    nameKey: 'ach.weekly_committed.name',
    desc: 'Completa los ejercicios de tu plan individual asignado.',
    descKey: 'ach.weekly_committed.desc',
    category: 'plans',
    icon: 'ClipboardCheck',
    targetType: 'fixed',
    defaultTarget: 1,
    xp: 25
  },
  {
    id: 'weekly_attentive',
    tier: 'BRONZE',
    name: 'Siempre Atento',
    nameKey: 'ach.weekly_attentive.name',
    desc: 'Consulta los detalles del próximo partido o entrenamiento antes de la citación.',
    descKey: 'ach.weekly_attentive.desc',
    category: 'engagement',
    icon: 'Calendar',
    targetType: 'fixed',
    defaultTarget: 1,
    xp: 25
  },

  // ─── TIER PLATA (Quincenal / 14 días - 50 XP cada uno) ───────────────────
  {
    id: 'biweekly_iron',
    tier: 'SILVER',
    name: 'Jugador de Hierro',
    nameKey: 'ach.biweekly_iron.name',
    desc: '100% de asistencia durante 14 días consecutivos.',
    descKey: 'ach.biweekly_iron.desc',
    category: 'attendance',
    icon: 'Shield',
    targetType: 'fixed',
    defaultTarget: 4,
    xp: 50
  },
  {
    id: 'biweekly_self_care',
    tier: 'SILVER',
    name: 'Hábito Saludable',
    nameKey: 'ach.biweekly_self_care.name',
    desc: 'Envía tu check-in de bienestar en al menos el 80% de los días.',
    descKey: 'ach.biweekly_self_care.desc',
    category: 'wellness',
    icon: 'Activity',
    targetType: 'fixed',
    defaultTarget: 6,
    xp: 50
  },
  {
    id: 'biweekly_strong_mind',
    tier: 'SILVER',
    name: 'Resiliencia de Competición',
    nameKey: 'ach.biweekly_strong_mind.name',
    desc: 'Realiza 3 tests psicológicos de afrontamiento o fortaleza mental.',
    descKey: 'ach.biweekly_strong_mind.desc',
    category: 'tests',
    icon: 'Zap',
    targetType: 'fixed',
    defaultTarget: 3,
    xp: 50
  },
  {
    id: 'biweekly_fit',
    tier: 'SILVER',
    name: 'Evolución Física',
    nameKey: 'ach.biweekly_fit.name',
    desc: 'Registra o supera tu mejor marca en las pruebas físicas del equipo.',
    descKey: 'ach.biweekly_fit.desc',
    category: 'tests',
    icon: 'TrendingUp',
    targetType: 'fixed',
    defaultTarget: 1,
    xp: 50
  },
  {
    id: 'biweekly_teammate',
    tier: 'SILVER',
    name: 'Compromiso con el Grupo',
    nameKey: 'ach.biweekly_teammate.name',
    desc: 'Confirma tu asistencia (RSVP) a todos los eventos con antelación (único reto basado en intención).',
    descKey: 'ach.biweekly_teammate.desc',
    category: 'attendance',
    icon: 'Users',
    targetType: 'fixed',
    defaultTarget: 4,
    xp: 50,
    isRsvpIntentionOnly: true
  },

  // ─── TIER ORO (Temporada 10 Meses - Máximo 100 XP cada uno) ───────────────
  {
    id: 'season_veteran',
    tier: 'GOLD',
    name: 'Veterano de la Temporada',
    nameKey: 'ach.season_veteran.name',
    desc: 'Participa con minutos verificados en al menos el 80% de los partidos oficiales del año.',
    descKey: 'ach.season_veteran.desc',
    category: 'matches',
    icon: 'Trophy',
    targetType: 'dynamic_matches_pct',
    defaultTarget: 18,
    xp: 100
  },
  {
    id: 'season_scorer',
    tier: 'GOLD',
    name: 'Goleador de Temporada',
    nameKey: 'ach.season_scorer.name',
    desc: 'Alcanza el objetivo de goles marcados en competición oficial.',
    descKey: 'ach.season_scorer.desc',
    category: 'performance',
    icon: 'Target',
    targetType: 'setting_goals',
    defaultTarget: 10,
    xp: 100
  },
  {
    id: 'season_assist',
    tier: 'GOLD',
    name: 'Motor del Equipo',
    nameKey: 'ach.season_assist.name',
    desc: 'Reparte asistencias de gol decisivas a tus compañeros.',
    descKey: 'ach.season_assist.desc',
    category: 'performance',
    icon: 'Sparkles',
    targetType: 'setting_assists',
    defaultTarget: 10,
    xp: 100
  },
  {
    id: 'season_unstoppable',
    tier: 'GOLD',
    name: 'Racha Imparable',
    nameKey: 'ach.season_unstoppable.name',
    desc: 'Mantén una racha activa de 21 días de constancia deportiva.',
    descKey: 'ach.season_unstoppable.desc',
    category: 'wellness',
    icon: 'Flame',
    targetType: 'fixed',
    defaultTarget: 21,
    xp: 100
  },
  {
    id: 'season_analyst',
    tier: 'GOLD',
    name: 'Máster Táctico y Psicológico',
    nameKey: 'ach.season_analyst.name',
    desc: 'Completa todos los cuestionarios y evaluaciones del catálogo.',
    descKey: 'ach.season_analyst.desc',
    category: 'tests',
    icon: 'Award',
    targetType: 'fixed',
    defaultTarget: 4,
    xp: 100
  },
  {
    id: 'season_captain',
    tier: 'GOLD',
    name: 'Espíritu de Capitán',
    nameKey: 'ach.season_captain.name',
    desc: '100% de asistencia verificada por el entrenador a entrenamientos y partidos durante un mes completo.',
    descKey: 'ach.season_captain.desc',
    category: 'attendance',
    icon: 'Star',
    targetType: 'fixed',
    defaultTarget: 8,
    xp: 100
  }
];

/**
 * Obtiene la configuración por defecto de objetivos de temporada para un equipo.
 */
export const DEFAULT_SEASON_SETTINGS = {
  autoMode: true,
  seasonStart: '2026-09-01',
  seasonEnd: '2027-06-30',
  veteranPct: 80,
  seasonGoals: 10,
  seasonAssists: 10,
  wellnessStreakDays: 21,
  xpPresente: 10,
  xpTarde: 5,
  xpJustificado: 2,
  xpAusente: 0,
  xpLesionado: 2
};
