/**
 * src/config/chartTheme.js
 * Míster11 — Tokens Centralizados para Gráficas Canónicas (Tierra y Campo)
 *
 * PROHIBICIÓN ESTRICTA: Cero tonos azul marino/navy y cero azules eléctricos.
 * Fondo oscuro institucional único: #1B3A2D.
 */

export const CHART_THEME = {
  dark: {
    // Fondos institucionales
    bgCard: '#1B3A2D',
    bgPitch: '#152C22',
    bgPitchStripe1: 'rgba(0, 0, 0, 0.08)',
    bgPitchStripe2: 'rgba(255, 255, 255, 0.03)',
    bgOverlay: 'rgba(27, 58, 45, 0.85)',

    // Series de datos
    teamHome: '#4CAF7D',          // Verde Campo institucional
    teamHomeLight: '#10B981',     // Verde brillante acento
    teamAway: '#EF4444',          // Rojo deportivo rival
    teamAwayLight: '#F87171',     // Rojo suave

    // Acentos nobles y semánticos
    gold: '#D4A843',              // Dorado institucional Míster11
    goldLight: '#E5C06E',
    goldSubtle: 'rgba(212, 168, 67, 0.18)',

    // Tipografía y líneas
    textPrimary: '#F2EDE4',       // Arena clara de alto contraste
    textSecondary: '#CBD5E1',     // Texto secundario
    textMuted: 'rgba(242, 237, 228, 0.65)',
    gridLines: 'rgba(76, 175, 125, 0.18)',
    pitchLines: 'rgba(255, 255, 255, 0.65)',
    border: 'rgba(212, 168, 67, 0.25)',
  },
  light: {
    // Fondos institucionales
    bgCard: '#F2EDE4',            // Crema institucional
    bgPitch: '#E8F5E9',
    bgPitchStripe1: 'rgba(0, 0, 0, 0.03)',
    bgPitchStripe2: 'rgba(255, 255, 255, 0.4)',
    bgOverlay: 'rgba(242, 237, 228, 0.92)',

    // Series de datos
    teamHome: '#2E7D5C',          // Verde institucional profundo
    teamHomeLight: '#4CAF7D',
    teamAway: '#DC2626',          // Rojo carmesí
    teamAwayLight: '#EF4444',

    // Acentos nobles y semánticos
    gold: '#B8860B',
    goldLight: '#D4A843',
    goldSubtle: 'rgba(212, 168, 67, 0.15)',

    // Tipografía y líneas
    textPrimary: '#1B3A2D',       // Verde selva oscuro
    textSecondary: '#475569',
    textMuted: '#64748B',
    gridLines: 'rgba(27, 58, 45, 0.12)',
    pitchLines: 'rgba(27, 58, 45, 0.45)',
    border: 'rgba(27, 58, 45, 0.2)',
  }
};

export const getChartColors = (isDark = true) => (isDark ? CHART_THEME.dark : CHART_THEME.light);
