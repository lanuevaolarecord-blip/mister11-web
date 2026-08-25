/**
 * src/config/achievements.js
 * Catálogo de Logros Deportivos Dinámicos para Míster11 (v3).
 * Basado en la realidad de la temporada de fútbol formativo y amateur (10 meses, Sept-Junio).
 */

export const ACHIEVEMENT_TIERS = {
  BRONZE: {
    id: 'bronze',
    name: 'Bronce',
    color: '#CD7F32',
    bg: 'rgba(205, 127, 50, 0.12)',
    border: 'rgba(205, 127, 50, 0.35)',
    icon: '🥉',
    resetPeriod: 'weekly', // Lunes 00:00
    periodLabel: 'Esta semana'
  },
  SILVER: {
    id: 'silver',
    name: 'Plata',
    color: '#B0BEC5',
    bg: 'rgba(176, 190, 197, 0.12)',
    border: 'rgba(176, 190, 197, 0.35)',
    icon: '🥈',
    resetPeriod: 'biweekly', // 14 días
    periodLabel: 'Esta quincena'
  },
  GOLD: {
    id: 'gold',
    name: 'Oro',
    color: '#C9A84C',
    bg: 'rgba(201, 168, 76, 0.15)',
    border: 'rgba(201, 168, 76, 0.45)',
    icon: '🥇',
    resetPeriod: 'season', // Al finalizar la temporada (30 junio)
    periodLabel: 'Temporada 2026-27'
  }
};

export const ACHIEVEMENTS_CATALOG = [
  // ─── TIER BRONCE (Semanal - 25 XP cada uno) ──────────────────────────────
  {
    id: 'weekly_perfect_week',
    tier: 'BRONZE',
    name: 'Semana Perfecta',
    desc: 'Asiste al 100% de las sesiones de entrenamiento programadas esta semana.',
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
    desc: 'Registra tu estado de descanso y molestias en los días de entrenamiento.',
    category: 'wellness',
    icon: 'HeartPulse',
    targetType: 'dynamic_sessions',
    defaultTarget: 2,
    xp: 25
  },
  {
    id: 'weekly_scholar',
    tier: 'BRONZE',
    name: 'Mente Fuerte',
    desc: 'Completa al menos 1 test psicológico o evaluación en el portal.',
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
    desc: 'Completa los ejercicios de tu plan individual asignado.',
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
    desc: 'Consulta los detalles del próximo partido o entrenamiento antes de la citación.',
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
    desc: '100% de asistencia durante 14 días consecutivos.',
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
    desc: 'Envía tu check-in de bienestar en al menos el 80% de los días.',
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
    desc: 'Realiza 3 tests psicológicos de afrontamiento o fortaleza mental.',
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
    desc: 'Registra o supera tu mejor marca en las pruebas físicas del equipo.',
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
    desc: 'Confirma tu asistencia (RSVP) a todos los eventos con antelación.',
    category: 'attendance',
    icon: 'Users',
    targetType: 'fixed',
    defaultTarget: 4,
    xp: 50
  },

  // ─── TIER ORO (Temporada 10 Meses - Máximo 100 XP cada uno) ───────────────
  {
    id: 'season_veteran',
    tier: 'GOLD',
    name: 'Veterano de la Temporada',
    desc: 'Participa o acude convocado al menos al 80% de los partidos del año.',
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
    desc: 'Alcanza el objetivo de goles marcados en competición oficial.',
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
    desc: 'Reparte asistencias de gol decisivas a tus compañeros.',
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
    desc: 'Mantén una racha activa de 21 días de constancia deportiva.',
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
    desc: 'Completa todos los cuestionarios y evaluaciones del catálogo.',
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
    desc: '100% de asistencia a entrenamientos y partidos durante un mes completo.',
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
  wellnessStreakDays: 21
};
