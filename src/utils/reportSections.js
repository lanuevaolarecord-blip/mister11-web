/**
 * src/utils/reportSections.js
 * Míster11 — Compositor Canónico de Informe Post-Partido
 *
 * Define el registro canónico único consumido tanto por la pestaña POST-PARTIDO
 * de Partidos.jsx como por matchPdfReport.js para garantizar paridad 1:1,
 * orden estricto de 11 secciones, alineación con fotos protegida y cero duplicados.
 */

export const CANONICAL_REPORT_SECTIONS = [
  {
    id: 'sec1_lineup',
    order: 1,
    titleKey: 'exports.report.sec1_lineup',
    anchorId: 'sec_lineup',
    dataSource: 'lineup',
    pdfPage: 1,
    description: 'Alineación táctica en césped con fotos de titulares y bloque de suplentes [PROTEGIDA].'
  },
  {
    id: 'sec2_timeline',
    order: 2,
    titleKey: 'exports.report.sec2_timeline',
    anchorId: 'sec_timeline',
    dataSource: 'timeline',
    pdfPage: 2,
    description: 'Marcador oficial y cronología temporal de eventos del partido.'
  },
  {
    id: 'sec3_momentum',
    order: 3,
    titleKey: 'exports.report.sec3_momentum',
    anchorId: 'sec_momentum',
    dataSource: 'momentum',
    pdfPage: 2,
    description: 'Evolución del momentum ofensivo y posesión por bloques de 15 minutos.'
  },
  {
    id: 'sec4_bars',
    order: 4,
    titleKey: 'exports.report.sec4_bars',
    anchorId: 'sec_bars',
    dataSource: 'bars',
    pdfPage: 3,
    description: 'Barras comparativas de las 10 métricas canónicas del encuentro.'
  },
  {
    id: 'sec5_radar',
    order: 5,
    titleKey: 'exports.report.sec5_radar',
    anchorId: 'sec_radar',
    dataSource: 'radar',
    pdfPage: 3,
    description: 'Radar normalizado comparativo de 6 ejes: Propio vs Rival.'
  },
  {
    id: 'sec6_top5',
    order: 6,
    titleKey: 'exports.report.sec6_top5',
    anchorId: 'sec_top5',
    dataSource: 'top5',
    pdfPage: 3,
    description: 'Tabla de las 5 métricas más diferenciales del encuentro.'
  },
  {
    id: 'sec7_shots',
    order: 7,
    titleKey: 'exports.report.sec7_shots',
    anchorId: 'sec_shots',
    dataSource: 'shots',
    pdfPage: 4,
    description: 'Mapas de tiros en campo con modelo de probabilidad xG-Lite y comodidad.'
  },
  {
    id: 'sec8_tactics',
    order: 8,
    titleKey: 'exports.report.sec8_tactics',
    anchorId: 'sec_tactics',
    dataSource: 'tactics',
    pdfPage: 4,
    description: 'Campo y táctica: distribución por pasillos, balance ABP y bloques de territorio.'
  },
  {
    id: 'sec9_gk',
    order: 9,
    titleKey: 'exports.report.sec9_gk',
    anchorId: 'sec_gk',
    dataSource: 'gk',
    pdfPage: 5,
    description: 'Índice de exigencia, eficacia y desglose de paradas normales y decisivas.'
  },
  {
    id: 'sec10_players',
    order: 10,
    titleKey: 'exports.report.sec10_players',
    anchorId: 'sec_players',
    dataSource: 'players',
    pdfPage: 6,
    description: 'Tabla de rendimiento individual, minutos disputados y bloque de portería.'
  },
  {
    id: 'sec11_swot',
    order: 11,
    titleKey: 'exports.report.sec11_swot',
    anchorId: 'sec_swot',
    dataSource: 'swot',
    pdfPage: 7,
    description: 'Matriz DAFO 2x2 trazable con chips de origen y síntesis táctica redactada.'
  }
];

/**
 * Obtiene las secciones ordenadas canónicamente.
 */
export function getCanonicalSections() {
  return [...CANONICAL_REPORT_SECTIONS].sort((a, b) => a.order - b.order);
}

/**
 * Obtiene una sección por su identificador único.
 */
export function getSectionById(id) {
  return CANONICAL_REPORT_SECTIONS.find(s => s.id === id) || null;
}
