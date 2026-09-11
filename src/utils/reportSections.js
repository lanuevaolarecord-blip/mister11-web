/**
 * src/utils/reportSections.js
 * Míster11 — Compositor Canónico de Informe Post-Partido (Fase 5)
 *
 * Define el registro canónico único consumido tanto por la pestaña POST-PARTIDO
 * de Partidos.jsx como por matchPdfReport.js para garantizar paridad 1:1,
 * orden estricto de 9 secciones, alineación con fotos protegida y cero duplicados.
 */

export const CANONICAL_REPORT_SECTIONS = [
  {
    id: 'sec1_timeline',
    order: 1,
    titleKey: 'exports.report.sec1_timeline',
    anchorId: 'sec_timeline',
    dataSource: 'timeline',
    pdfPage: 1,
    description: 'Marcador oficial y cronología temporal de eventos del partido.'
  },
  {
    id: 'sec2_momentum',
    order: 2,
    titleKey: 'exports.report.sec2_momentum',
    anchorId: 'sec_momentum',
    dataSource: 'momentum',
    pdfPage: 2,
    description: 'Evolución del momentum ofensivo y posesión por bloques de 15 minutos.'
  },
  {
    id: 'sec3_radar',
    order: 3,
    titleKey: 'exports.report.sec3_radar',
    anchorId: 'sec_radar',
    dataSource: 'radar',
    pdfPage: 2,
    description: 'Radar normalizado comparativo de 6 ejes: Propio vs Rival.'
  },
  {
    id: 'sec4_top5',
    order: 4,
    titleKey: 'exports.report.sec4_top5',
    anchorId: 'sec_top5',
    dataSource: 'top5',
    pdfPage: 3,
    description: 'Tabla de las 5 métricas más diferenciales del encuentro.'
  },
  {
    id: 'sec5_shots',
    order: 5,
    titleKey: 'exports.report.sec5_shots',
    anchorId: 'sec_shots',
    dataSource: 'shots',
    pdfPage: 3,
    description: 'Mapas de tiros en campo con modelo de probabilidad xG-Lite y comodidad.'
  },
  {
    id: 'sec6_gk',
    order: 6,
    titleKey: 'exports.report.sec6_gk',
    anchorId: 'sec_gk',
    dataSource: 'gk',
    pdfPage: 4,
    description: 'Índice de exigencia, eficacia y desglose de paradas normales y decisivas.'
  },
  {
    id: 'sec7_lineup',
    order: 7,
    titleKey: 'exports.report.sec7_lineup',
    anchorId: 'sec_lineup',
    dataSource: 'lineup',
    pdfPage: 4,
    description: 'Alineación táctica en césped con fotos de titulares y bloque de suplentes [PROTEGIDA].'
  },
  {
    id: 'sec8_players',
    order: 8,
    titleKey: 'exports.report.sec8_players',
    anchorId: 'sec_players',
    dataSource: 'players',
    pdfPage: 5,
    description: 'Tabla de rendimiento individual, minutos disputados y bloque de portería.'
  },
  {
    id: 'sec9_swot',
    order: 9,
    titleKey: 'exports.report.sec9_swot',
    anchorId: 'sec_swot',
    dataSource: 'swot',
    pdfPage: 6,
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
