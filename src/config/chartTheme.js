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

    // Tokens de Contraste AA Tipográficos (WCAG AA Estricto)
    ink: '#F2EDE4',               // Arena clara de alto contraste (fondo oscuro)
    inkMuted: '#C9D4CC',          // Tinta secundaria atenuada (contraste >= 4.5:1)
    accentText: '#E4C878',        // Dorado aclarado accesible sobre verdes oscuros

    // Tipografía y líneas
    textPrimary: '#F2EDE4',       // Arena clara de alto contraste
    textSecondary: '#C9D4CC',     // Texto secundario legible
    textMuted: '#C9D4CC',
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

    // Tokens de Contraste AA Tipográficos (WCAG AA Estricto)
    ink: '#1B3A2D',               // Verde institucional profundo sobre crema/blanco
    inkMuted: '#4A5C50',          // Verde grisáceo oscuro (contraste >= 4.5:1 sobre crema)
    accentText: '#85682B',        // Dorado tostado accesible (>= 4.5:1 sobre crema/blanco)

    // Tipografía y líneas
    textPrimary: '#1B3A2D',       // Verde selva oscuro
    textSecondary: '#4A5C50',
    textMuted: '#4A5C50',
    gridLines: 'rgba(27, 58, 45, 0.12)',
    pitchLines: 'rgba(27, 58, 45, 0.45)',
    border: 'rgba(27, 58, 45, 0.2)',
  }
};

export const getChartColors = (isDark = true) => (isDark ? CHART_THEME.dark : CHART_THEME.light);
