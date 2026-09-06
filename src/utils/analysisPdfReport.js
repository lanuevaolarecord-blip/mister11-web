import { PDF_COLORS, cleanPdfText, drawRadarChartCanvas, imageUrlToBase64 } from './pdfTheme';
import { savePdfUniversal } from './pdfGenerator';
import autoTable from 'jspdf-autotable';

const THEME_COLOR = PDF_COLORS.primary;
const ACCENT_COLOR = PDF_COLORS.accent;
const TEXT_DARK = PDF_COLORS.textDark;

/**
 * Exporta un informe completo en PDF con el análisis comparativo multipartido
 */
export const exportMultiMatchAnalysisPDF = async ({
  selectedMatches = [],
  perMatchMetrics = [],
  aggregates = {},
  viewMode = 'AVERAGES',
  activeTeam = null
}) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando Informe de Análisis Multipartido...' } }));
  await new Promise((r) => setTimeout(r, 150));

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const teamName = cleanPdfText(activeTeam?.nombre || activeTeam?.name || 'Mi Equipo');
    const category = cleanPdfText(activeTeam?.categoria || activeTeam?.category || 'Oficial');
    const isAverages = viewMode === 'AVERAGES';
    const modeLabel = isAverages ? 'PROMEDIOS POR PARTIDO' : 'TOTALES ACUMULADOS';

    // ── CABECERA INSTITUCIONAL ────────────────────────────────────────────────
    doc.setFillColor(...THEME_COLOR);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(0, 34, pageW, 2, 'F');

    // Logo Míster11 a la izquierda
    const logoData = await imageUrlToBase64('/logo_mister11.png', 'M11', false);
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 14, 5, 18, 18);
      } catch (e) {
        console.warn('Error dibujando logo:', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MÍSTER 11 · ANÁLISIS COMPARATIVO MULTIPARTIDO', 36, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(210, 230, 220);
    const dateStr = new Date().toLocaleDateString('es-ES');
    doc.text(`${teamName} (${category}) · Muestra: ${selectedMatches.length} partidos · Emisión: ${dateStr}`, 36, 23);

    // Escudo del equipo si está disponible
    if (activeTeam?.escudo) {
      const shieldData = await imageUrlToBase64(activeTeam.escudo, teamName, true);
      if (shieldData) {
        try {
          doc.addImage(shieldData, 'PNG', pageW - 30, 5, 18, 18);
        } catch (e) {
          console.warn('Error dibujando escudo:', e);
        }
      }
    }

    let y = 44;

    // ── BANNER DE RESUMEN DE MUESTRA Y MODO DE ANÁLISIS ────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, y, pageW - 24, 18, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, y, pageW - 24, 18, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...THEME_COLOR);
    doc.text('RESUMEN DE LA MUESTRA ANALIZADA', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const firstDate = selectedMatches[0]?.date ? selectedMatches[0].date.split('-').reverse().join('/') : '-';
    const lastDate = selectedMatches[selectedMatches.length - 1]?.date
      ? selectedMatches[selectedMatches.length - 1].date.split('-').reverse().join('/')
      : '-';

    doc.text(`Período de análisis: ${firstDate} al ${lastDate}   |   Partidos seleccionados: ${selectedMatches.length} encuentros   |   Modo: ${modeLabel}`, 18, y + 12);

    y += 24;

    // ── BLOQUE DE KPIS TÁCTICOS ───────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...THEME_COLOR);
    doc.text('INDICADORES CLAVE DE RENDIMIENTO (KPIS COLECTIVOS)', 12, y);
    y += 4;

    const cardW = (pageW - 24 - 9) / 4; // 4 tarjetas con 3 gaps de 3mm
    const cardH = 22;

    const kpiData = [
      {
        title: 'TIROS A PUERTA',
        value: isAverages
          ? `${aggregates.avgShotsOwn || 0} / ${aggregates.avgShotsRival || 0}`
          : `${aggregates.totalShotsOwn || 0} / ${aggregates.totalShotsRival || 0}`,
        sub: isAverages ? 'Prom. Propio vs Rival' : 'Total Propio vs Rival',
        color: [16, 185, 129], // Verde
      },
      {
        title: 'DUELOS GANADOS',
        value: `${aggregates.avgDuelPct || 0}%`,
        sub: 'Efectividad en disputas',
        color: [59, 130, 246], // Azul
      },
      {
        title: 'RECUPERACIONES',
        value: isAverages
          ? `${aggregates.avgRecoveries || 0} / ${aggregates.avgLosses || 0}`
          : `${aggregates.totalRecoveries || 0} / ${aggregates.totalLosses || 0}`,
        sub: isAverages ? 'Prom. Rec / Perd' : 'Total Rec / Perd',
        color: [245, 158, 11], // Ámbar
      },
      {
        title: 'EFECT. CONTRAATAQUE',
        value: `${aggregates.avgCounterEff || 0}%`,
        sub: 'Ratio de conversión ofensiva',
        color: [139, 92, 246], // Morado
      },
    ];

    kpiData.forEach((kpi, idx) => {
      const cX = 12 + idx * (cardW + 3);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cX, y, cardW, cardH, 2.5, 2.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cX, y, cardW, cardH, 2.5, 2.5, 'S');

      // Pequeña barra superior de color
      doc.setFillColor(...kpi.color);
      doc.roundedRect(cX, y, cardW, 2.5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.title, cX + cardW / 2, y + 7, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...THEME_COLOR);
      doc.text(kpi.value, cX + cardW / 2, y + 14, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.sub, cX + cardW / 2, y + 19, { align: 'center' });
    });

    y += cardH + 8;

    // ── RADAR TÁCTICO COLECTIVO 360° ──────────────────────────────────────────
    const shotsScore = Math.min(99, Math.max(10, Math.round((aggregates.avgShotsOwn || 0) * 12)));
    const duelsScore = Math.min(99, Math.max(10, aggregates.avgDuelPct || 50));
    const recRatio = (aggregates.totalRecoveries || 1) / Math.max(1, aggregates.totalLosses || 1);
    const recScore = Math.min(99, Math.max(10, Math.round(recRatio * 50)));
    const counterScore = Math.min(99, Math.max(10, aggregates.avgCounterEff || 40));
    const goalsBalance = (aggregates.totalGoalsFor || 0) - (aggregates.totalGoalsAgainst || 0);
    const goalsScore = Math.min(99, Math.max(10, Math.round(50 + goalsBalance * 5)));

    const tacticalMetrics = [
      { label: 'Tiros Puerta', value: shotsScore },
      { label: 'Duelos Ganados', value: duelsScore },
      { label: 'Recuperaciones', value: recScore },
      { label: 'Contraataques', value: counterScore },
      { label: 'Eficacia Goleadora', value: goalsScore },
    ];

    const radarImg = drawRadarChartCanvas(tacticalMetrics, 440);
    if (radarImg) {
      const radarSize = 65;
      const radarX = (pageW - radarSize) / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...THEME_COLOR);
      doc.text('PERFIL TÁCTICO PROMEDIO DEL EQUIPO (360°)', pageW / 2, y, { align: 'center' });

      doc.addImage(radarImg, 'PNG', radarX, y + 3, radarSize, radarSize);
      y += radarSize + 8;
    }

    // ── TABLA DETALLADA POR PARTIDO ───────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...THEME_COLOR);
    doc.text('DESGLOSE DETALLADO PARTIDO A PARTIDO', 12, y);
    y += 4;

    const tableHeaders = ['Fecha', 'Rival / Partido', 'Resultado', 'Tiros (P/R)', '% Duelos', 'Rec / Pérd', 'Faltas (F/C)', 'Tarjetas'];

    const tableRows = perMatchMetrics.map((pm) => {
      const fDate = pm.date ? pm.date.split('-').reverse().join('/') : '--/--';
      const rivalName = cleanPdfText(pm.rival || 'Rival');
      const scoreStr = `${pm.goalsFor ?? 0} - ${pm.goalsAgainst ?? 0}`;
      const shotsStr = `${pm.shotsOwn ?? 0} / ${pm.shotsRival ?? 0}`;
      const duelStr = `${pm.duelPct ?? 0}%`;
      const recStr = `${pm.recoveries ?? 0} / ${pm.losses ?? 0}`;
      const foulsStr = `${pm.foulsFavor ?? 0} / ${pm.foulsAgainst ?? 0}`;
      const cardsStr = `A:${pm.cardsOwn ?? 0} | R:${pm.cardsRival ?? 0}`;

      return [fDate, `vs ${rivalName}`, scoreStr, shotsStr, duelStr, recStr, foulsStr, cardsStr];
    });

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: THEME_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: TEXT_DARK,
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.bgLight,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 12, right: 12 },
    });

    let finalY = doc.lastAutoTable.finalY + 8;

    // Si queda poco espacio, añadir página para observaciones técnicas
    if (finalY > pageH - 40) {
      doc.addPage();
      finalY = 24;
    }

    // ── CAJA DE CONCLUSIONES TÁCTICAS DEL CUERPO TÉCNICO ─────────────────────
    doc.setFillColor(250, 248, 240);
    doc.roundedRect(12, finalY, pageW - 24, 22, 2.5, 2.5, 'F');
    doc.setFillColor(...ACCENT_COLOR);
    doc.rect(12, finalY, 3, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...THEME_COLOR);
    doc.text('OBSERVACIONES Y NOTAS METODOLÓGICAS (CUERPO TÉCNICO)', 18, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const goalDiff = (aggregates.totalGoalsFor || 0) - (aggregates.totalGoalsAgainst || 0);
    const balanceText = goalDiff >= 0 ? `Balance goleador positivo (+${goalDiff} goles)` : `Balance goleador a corregir (${goalDiff} goles)`;
    const conclusionText = `Muestra de ${selectedMatches.length} partidos con efectividad global en duelos del ${aggregates.avgDuelPct || 0}%. Promedio de tiros a favor: ${aggregates.avgShotsOwn || 0} vs ${aggregates.avgShotsRival || 0} recibidos. ${balanceText}. Se recomienda consolidar la presión tras pérdida y finalizar las transiciones ofensivas.`;

    const splitNotes = doc.splitTextToSize(cleanPdfText(conclusionText), pageW - 36);
    doc.text(splitNotes, 18, finalY + 12);

    // ── PIE DE PÁGINA OFICIAL EN TODAS LAS PÁGINAS ────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...THEME_COLOR);
      doc.rect(0, pageH - 9, pageW, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Míster 11 Club Engine · Módulo de Inteligencia y Análisis Táctico', 12, pageH - 3.5);
      doc.text(`Página ${p} de ${totalPages}`, pageW - 12, pageH - 3.5, { align: 'right' });
    }

    const safeName = teamName.replace(/\s+/g, '_');
    const fileName = `Analisis_Comparativo_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    await savePdfUniversal(doc, fileName);
  } catch (err) {
    console.error('[exportMultiMatchAnalysisPDF] Error:', err);
    alert('Hubo un error al generar el PDF de análisis multipartido.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
