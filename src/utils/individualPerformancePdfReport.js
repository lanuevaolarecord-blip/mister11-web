/**
 * individualPerformancePdfReport.js
 * Generador oficial del informe PDF de "Rendimiento Individual (Mi Equipo)".
 *
 * Apertura 7:
 * - Paridad 1:1 con la tabla en pantalla (StatsDataTable) y Descargar CSV.
 * - Cabecera con escudo / nombre del equipo, rival, fecha, marcador y competición.
 * - Gráficos y barras comparativas en paleta canónica Tierra y Campo (Cero azul / morado).
 * - Pie institucional: "Generado por Míster11".
 */

import { cleanPdfText } from './pdfTheme.js';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;
  return { jsPDF, autoTable };
};

// Paleta canónica Tierra y Campo
const THEME_PRIMARY = [27, 58, 45];    // #1B3A2D Verde Selva
const THEME_CAMPO = [76, 175, 125];    // #4CAF7D Verde Campo
const THEME_ACCENT = [212, 168, 67];   // #D4A843 Oro / Ocre
const THEME_TERRA = [200, 90, 50];     // #C85A32 Terracota
const TEXT_DARK = [15, 23, 42];        // #0F172A Texto Oscuro
const TEXT_MUTED = [100, 116, 139];    // #64748B Texto Secundario
const BG_LIGHT = [248, 250, 248];      // #F8FAF8 Fondo Suave
const BORDER_COLOR = [226, 232, 240];  // #E2E8F0 Bordes

/**
 * Deriva las filas canónicas de la tabla con paridad estricta UI == PDF == CSV.
 * @param {Array} playerStats - Lista de jugadores procesados
 * @returns {Array<Array<string|number>>} Filas estructuradas para autoTable y CSV
 */
export const deriveIndividualPerformanceRows = (playerStats = []) => {
  return (playerStats || []).map((p, idx) => {
    const dorsal = p.dorsal || p.number || (idx + 1);
    const nombre = cleanPdfText(p.nombre || p.name || `Jugador #${idx + 1}`);
    const pos = p.posicion || p.position || 'MED';
    const minutos = Number(p.minutos ?? 0);
    const minStr = minutos > 0 ? `${minutos}'` : "0'";

    let ratingStr = '—';
    if (p.rating !== null && p.rating !== undefined && !isNaN(Number(p.rating))) {
      ratingStr = Number(p.rating).toFixed(1);
    }

    const goles = Number(p.goles || 0);
    const golStr = goles > 0 ? String(goles) : '—';

    const ast = Number(p.asistencias || 0);
    const astStr = ast > 0 ? String(ast) : '—';

    const xG = p.xG !== undefined && p.xG !== null ? Number(p.xG).toFixed(2) : '0.00';

    const pasesC = Number(p.pasesExitosos || 0);
    const pasesF = Number(p.pasesFallidos || 0);
    const pasesTot = pasesC + pasesF;
    const passPct = pasesTot > 0 ? Math.round((pasesC / pasesTot) * 100) : null;
    const pasesStr = pasesTot > 0 ? `${pasesC}/${pasesF} (${passPct}%)` : '0/0 (—)';

    const duelosG = Number(p.duelosGanados ?? p.entradas ?? 0);
    const duelosP = Number(p.duelosPerdidos ?? 0);
    const duelosTot = duelosG + duelosP;
    const duelPct = duelosTot > 0 ? Math.round((duelosG / duelosTot) * 100) : null;
    const duelosStr = duelosTot > 0 ? `${duelosG}/${duelosP} (${duelPct}%)` : '0/0 (—)';

    const rec = Number(p.recuperaciones || 0);
    const perd = Number(p.perdidas || 0);
    const recPerdStr = (rec > 0 || perd > 0) ? `${rec} / ${perd}` : '0 / 0';

    const tirosP = Number(p.tirosPuerta || 0);
    const tirosTot = Math.max(tirosP, Number(p.tiros || 0));
    const shotPct = tirosTot > 0 ? Math.round((tirosP / tirosTot) * 100) : null;
    const tirosStr = tirosTot > 0 ? `${tirosP}/${tirosTot} (${shotPct}%)` : '0/0 (—)';

    const par = Number(p.paradas || p.saves || 0);
    const parStr = par > 0 ? String(par) : '—';

    const faltas = Number(p.faltas || 0);
    const faltasStr = String(faltas);

    const amarillas = Number(p.amarillas || 0);
    const rojas = Number(p.rojas || 0);
    let tarjetasStr = '—';
    if (amarillas > 0 || rojas > 0) {
      const parts = [];
      if (amarillas > 0) parts.push(`${amarillas}A`);
      if (rojas > 0) parts.push(`${rojas}R`);
      tarjetasStr = parts.join(' ');
    }

    return [
      `#${dorsal}`,
      nombre,
      pos,
      minStr,
      ratingStr,
      golStr,
      astStr,
      xG,
      pasesStr,
      duelosStr,
      recPerdStr,
      tirosStr,
      parStr,
      faltasStr,
      tarjetasStr
    ];
  });
};

/**
 * Genera y descarga el PDF profesional de Rendimiento Individual.
 */
export const generateIndividualPerformancePdf = async ({
  matchData = {},
  playerStats = [],
  teamName = 'Mi Equipo',
  rivalName = 'Rival',
  matchDate = '',
  score = '',
  competition = '',
  isEn = false
}) => {
  const { jsPDF, autoTable } = await getPdfLibs();

  // Orientación Landscape (297 x 210 mm) para máxima legibilidad de las 15 columnas
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const cTeam = cleanPdfText(teamName || 'Mi Equipo');
  const cRival = cleanPdfText(rivalName || 'Rival');
  const cDate = cleanPdfText(matchDate || new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES'));
  const cScore = cleanPdfText(score || '-');
  const cComp = cleanPdfText(competition || (isEn ? 'Official Match' : 'Partido Oficial'));

  // ── 1. CABECERA INSTITUCIONAL TIERRA Y CAMPO ──────────────────────────────
  doc.setFillColor(...THEME_PRIMARY);
  doc.rect(0, 0, pageW, 28, 'F');

  // Franja dorada de acento
  doc.setFillColor(...THEME_ACCENT);
  doc.rect(0, 26, pageW, 2, 'F');

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleText = isEn
    ? 'MÍSTER 11 — INDIVIDUAL PERFORMANCE REPORT'
    : 'MÍSTER 11 — INFORME DE RENDIMIENTO INDIVIDUAL';
  doc.text(titleText, 14, 12);

  // Subtítulo con metadatos del partido
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const subtitle = `${cTeam} vs ${cRival}   |   ${isEn ? 'Date' : 'Fecha'}: ${cDate}   |   ${isEn ? 'Score' : 'Marcador'}: ${cScore}   |   ${cComp}`;
  doc.text(subtitle, 14, 20);

  // Badge derecho de verificación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...THEME_ACCENT);
  const badgeText = isEn ? 'OFFICIAL VERIFIED STATS' : 'ESTADÍSTICAS OFICIALES VERIFICADAS';
  doc.text(badgeText, pageW - 14, 16, { align: 'right' });

  // ── 2. CARDS DE RESUMEN Y GRÁFICOS COMPARATIVOS TIERRA Y CAMPO ─────────────
  // Cálculos acumulados del equipo
  let totGoles = 0, totAst = 0, totTirosP = 0, totTiros = 0, totPassC = 0, totPassTot = 0;
  let totDuelosG = 0, totDuelosTot = 0, totRec = 0, totPerd = 0;
  let maxRating = 0, bestPlayer = '—';

  playerStats.forEach(p => {
    totGoles += Number(p.goles || 0);
    totAst += Number(p.asistencias || 0);
    const tp = Number(p.tirosPuerta || 0);
    totTirosP += tp;
    totTiros += Math.max(tp, Number(p.tiros || 0));
    const pc = Number(p.pasesExitosos || 0);
    totPassC += pc;
    totPassTot += pc + Number(p.pasesFallidos || 0);
    const dg = Number(p.duelosGanados ?? p.entradas ?? 0);
    totDuelosG += dg;
    totDuelosTot += dg + Number(p.duelosPerdidos ?? 0);
    totRec += Number(p.recuperaciones || 0);
    totPerd += Number(p.perdidas || 0);
    const r = Number(p.rating || 0);
    if (r > maxRating) {
      maxRating = r;
      bestPlayer = p.nombre || p.name || '—';
    }
  });

  const shotAcc = totTiros > 0 ? Math.round((totTirosP / totTiros) * 100) : 0;
  const duelAcc = totDuelosTot > 0 ? Math.round((totDuelosG / totDuelosTot) * 100) : 0;
  const passAcc = totPassTot > 0 ? Math.round((totPassC / totPassTot) * 100) : 0;

  const cardY = 34;
  const cardH = 20;
  const cardGap = 8;
  const cardW = (pageW - 28 - (cardGap * 3)) / 4;

  const kpis = [
    {
      title: isEn ? 'SHOT ACCURACY' : 'PUNTERÍA TIROS',
      main: `${totTirosP}/${totTiros} (${shotAcc}%)`,
      sub: `${totGoles} ${isEn ? 'goals' : 'goles'} · ${totTirosP} ${isEn ? 'on target' : 'a puerta'}`,
      barPct: shotAcc,
      barColor: THEME_CAMPO
    },
    {
      title: isEn ? 'DUEL EFFICIENCY' : 'DUELOS GANADOS',
      main: `${totDuelosG}/${totDuelosTot} (${duelAcc}%)`,
      sub: `${totDuelosG} ${isEn ? 'won' : 'ganados'} / ${totDuelosTot - totDuelosG} ${isEn ? 'lost' : 'perdidos'}`,
      barPct: duelAcc,
      barColor: THEME_ACCENT
    },
    {
      title: isEn ? 'BALL BALANCE' : 'BALANCE REC / PÉRD',
      main: `${totRec} / ${totPerd}`,
      sub: `${totRec >= totPerd ? '+' : ''}${totRec - totPerd} ${isEn ? 'net differential' : 'diferencial neto'}`,
      barPct: (totRec + totPerd > 0) ? Math.round((totRec / (totRec + totPerd)) * 100) : 50,
      barColor: THEME_TERRA
    },
    {
      title: isEn ? 'MVP / TOP RATING' : 'MÁXIMO RENDIMIENTO',
      main: maxRating > 0 ? `${maxRating.toFixed(1)} ★` : '—',
      sub: cleanPdfText(bestPlayer),
      barPct: maxRating > 0 ? Math.round((maxRating / 10) * 100) : 0,
      barColor: THEME_PRIMARY
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = 14 + idx * (cardW + cardGap);

    // Fondo de tarjeta
    doc.setFillColor(...BG_LIGHT);
    doc.roundedRect(kX, cardY, cardW, cardH, 2, 2, 'F');
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(kX, cardY, cardW, cardH, 2, 2, 'S');

    // Título de métrica
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(kpi.title, kX + 5, cardY + 5);

    // Valor principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(kpi.main, kX + 5, cardY + 11);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(kpi.sub, kX + 5, cardY + 15.5);

    // Barra de progreso comparativa en paleta Tierra y Campo
    const barW = cardW - 10;
    const barH = 2;
    const barY = cardY + 17;
    doc.setFillColor(226, 232, 240);
    doc.rect(kX + 5, barY, barW, barH, 'F');

    const fillW = Math.max(0, Math.min(barW, (barW * kpi.barPct) / 100));
    if (fillW > 0) {
      doc.setFillColor(...kpi.barColor);
      doc.rect(kX + 5, barY, fillW, barH, 'F');
    }
  });

  // ── 3. TABLA CANÓNICA DE RENDIMIENTO INDIVIDUAL (15 COLUMNAS) ──────────────
  const headers = isEn ? [
    '#', 'Player', 'Pos', 'Min', 'Rating', 'GOL', 'AST', 'xG',
    'Passes C/F (%)', 'Duels W/L (%)', 'Rec / Loss', 'Shots OT/Tot (%)',
    'Saves', 'Fouls', 'Cards'
  ] : [
    '#', 'Jugador', 'Pos', 'Min', 'Nota', 'GOL', 'AST', 'xG',
    'Pases C/F (%)', 'Duelos G/P (%)', 'Rec / Pérd', 'Tiros P/Tot (%)',
    'PAR', 'Faltas', 'Tarjetas'
  ];

  const rows = deriveIndividualPerformanceRows(playerStats);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: cardY + cardH + 6,
    margin: { left: 14, right: 14, bottom: 16 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: TEXT_DARK,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: THEME_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 2.8
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' }, // #
      1: { halign: 'left', cellWidth: 38, fontStyle: 'bold' },   // Jugador
      2: { halign: 'center', cellWidth: 12 },                    // Pos
      3: { halign: 'center', cellWidth: 12 },                    // Min
      4: { halign: 'center', cellWidth: 14, fontStyle: 'bold', textColor: THEME_PRIMARY }, // Nota
      5: { halign: 'center', cellWidth: 12 },                    // GOL
      6: { halign: 'center', cellWidth: 12 },                    // AST
      7: { halign: 'center', cellWidth: 13, textColor: THEME_ACCENT }, // xG
      8: { halign: 'center', cellWidth: 26 },                    // Pases
      9: { halign: 'center', cellWidth: 26 },                    // Duelos
      10: { halign: 'center', cellWidth: 20 },                   // Rec / Pérd
      11: { halign: 'center', cellWidth: 26 },                   // Tiros
      12: { halign: 'center', cellWidth: 12 },                   // PAR
      13: { halign: 'center', cellWidth: 14 },                   // Faltas
      14: { halign: 'center', cellWidth: 18 }                    // Tarjetas
    },
    alternateRowStyles: {
      fillColor: [250, 252, 250] // Sutil alternancia Tierra y Campo
    },
    didDrawPage: (data) => {
      // ── 4. PIE DE PÁGINA INSTITUCIONAL ─────────────────────────────────────
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setDrawColor(...BORDER_COLOR);
      doc.line(14, pageH - 10, pageW - 14, pageH - 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...THEME_PRIMARY);
      doc.text('Generado por Míster11', 14, pageH - 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(' • mister11.app • Rendimiento Individual Verificable', 45, pageH - 5.5);

      const pageStr = isEn
        ? `Page ${pageNumber} of ${totalPages}`
        : `Página ${pageNumber} de ${totalPages}`;
      doc.text(pageStr, pageW - 14, pageH - 5.5, { align: 'right' });
    }
  });

  const safeTeam = cTeam.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  const fileName = isEn
    ? `individual_performance_${safeTeam}.pdf`
    : `rendimiento_individual_${safeTeam}.pdf`;

  doc.save(fileName);
  return doc;
};
