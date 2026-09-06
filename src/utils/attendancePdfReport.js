import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import { drawPdfFooter, cleanPdfText, imageUrlToBase64, PDF_COLORS } from './pdfTheme';
import { calculateSquadAveragePct } from './attendanceMath';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;
  return { jsPDF, autoTable };
};

/**
 * generateAttendancePdfReport
 * Genera el informe oficial completo de control de asistencia de la plantilla en PDF,
 * con gráficas visuales de distribución, KPIs globales, ranking de constancia y alertas,
 * garantizando cero caracteres corruptos o emojis rotos.
 */
export const generateAttendancePdfReport = async ({
  teamName = 'Mi Equipo',
  activeTeam = null,
  squadStats = [],
  threshold = 70,
  language = null,
  isEn: isEnProp = false
}) => {
  const effLang = getEffectiveLanguage(language);
  const isEn = isEnProp || effLang === 'English (EN)';

  window.dispatchEvent(new CustomEvent('m11-loading', {
    detail: { show: true, message: isEn ? 'Generating Attendance PDF Report...' : 'Generando Informe de Asistencia...' }
  }));
  await new Promise((r) => setTimeout(r, 120));

  try {
    const { jsPDF, autoTable } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = PDF_COLORS.primary; // [23, 45, 33]
    const colorAccent = PDF_COLORS.accent;   // [212, 168, 67]

    const titleText = isEn ? 'TEAM ATTENDANCE CONTROL REPORT' : 'INFORME OFICIAL DE CONTROL DE ASISTENCIA';

    // ── 1. ENCABEZADO INSTITUCIONAL CON LOGOTIPOS ──────────────────────────
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 34, pageW, 2, 'F');

    // Logo oficial de Míster11 a la izquierda
    const mr11LogoData = await imageUrlToBase64('/logo_mister11.png', 'M11', false);
    if (mr11LogoData) {
      doc.addImage(mr11LogoData, 'PNG', 14, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('MÍSTER11', 36, 16);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MÍSTER11', 14, 16);
    }

    // Escudo del equipo a la derecha
    if (activeTeam?.escudo) {
      const shieldData = await imageUrlToBase64(activeTeam.escudo, cleanPdfText(teamName), false);
      if (shieldData) {
        doc.addImage(shieldData, 'PNG', pageW - 32, 5, 18, 18);
      }
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorAccent);
    doc.text(titleText, pageW / 2, 15, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const fechaStr = new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES');
    const displayTeamName = cleanPdfText(activeTeam?.nombre || activeTeam?.name || teamName);
    doc.text(`${isEn ? 'Date' : 'Fecha'}: ${fechaStr}   |   ${isEn ? 'Team' : 'Equipo'}: ${displayTeamName}   |   ${isEn ? 'Alert Threshold' : 'Umbral Alerta'}: ${threshold}%`, pageW / 2, 25, { align: 'center' });

    let y = 44;

    // ── 2. CÁLCULO DE MÉTRICAS GLOBALES & DISTRIBUCIÓN ────────────────────
    const totalSquad = squadStats.length;
    const avgPct = calculateSquadAveragePct(squadStats);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalJustified = 0;
    let totalLate = 0;
    let totalInjured = 0;

    let countOptimo = 0;   // >= 85%
    let countAceptable = 0; // 70-84%
    let countRiesgo = 0;    // < 70%

    squadStats.forEach((s) => {
      totalPresent += Number(s.present || 0);
      totalAbsent += Number(s.absent || 0);
      totalJustified += Number(s.justified || 0);
      totalLate += Number(s.late || 0);
      totalInjured += Number(s.injured || 0);

      if (s.hasData && typeof s.pct === 'number') {
        if (s.pct >= 85) countOptimo++;
        else if (s.pct >= threshold) countAceptable++;
        else countRiesgo++;
      }
    });

    const totalEvaluated = countOptimo + countAceptable + countRiesgo;

    // ── 3. TARJETAS DE KPIS GLOBALES (4 COLUMNAS) ─────────────────────────
    const cardW = (pageW - 28 - 9) / 4;
    const kpiCards = [
      { label: isEn ? 'MEDIA ASISTENCIA' : 'MEDIA ASISTENCIA', val: `${avgPct}%`, color: avgPct >= threshold ? [34, 197, 94] : [220, 38, 38] },
      { label: isEn ? 'ASISTENCIAS' : 'ASISTENCIAS', val: totalPresent, color: colorPrimary },
      { label: isEn ? 'FALTAS / RETRASOS' : 'FALTAS / RETRASOS', val: `${totalAbsent} / ${totalLate}`, color: totalAbsent > 0 ? [220, 38, 38] : colorPrimary },
      { label: isEn ? 'EN RIESGO' : 'EN RIESGO', val: `${countRiesgo} jug.`, color: countRiesgo > 0 ? [220, 38, 38] : [34, 197, 94] }
    ];

    kpiCards.forEach((c, idx) => {
      const cx = 14 + idx * (cardW + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cx, y, cardW, 20, 2.5, 2.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cx, y, cardW, 20, 2.5, 2.5, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cx + 3, y + 6);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.color);
      doc.text(String(c.val), cx + 3, y + 15);
    });

    y += 26;

    // ── 4. GRÁFICA VISUAL DE DISTRIBUCIÓN DE ASISTENCIA ───────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 28, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 28, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'SQUAD ATTENDANCE DISTRIBUTION' : 'DISTRIBUCIÓN DE LA PLANTILLA SEGÚN ASISTENCIA', 20, y + 7);

    // Barra horizontal segmentada
    const barX = 20;
    const barY = y + 11;
    const barW = pageW - 48;
    const barH = 7;

    const pctOptimo = totalEvaluated > 0 ? countOptimo / totalEvaluated : 0;
    const pctAceptable = totalEvaluated > 0 ? countAceptable / totalEvaluated : 0;
    const pctRiesgo = totalEvaluated > 0 ? countRiesgo / totalEvaluated : 0;

    let curX = barX;

    // Segmento Verde (Óptimo >= 85%)
    if (pctOptimo > 0) {
      const wOpt = barW * pctOptimo;
      doc.setFillColor(34, 197, 94);
      doc.rect(curX, barY, wOpt, barH, 'F');
      curX += wOpt;
    }
    // Segmento Amarillo/Dorado (Aceptable 70-84%)
    if (pctAceptable > 0) {
      const wAcep = barW * pctAceptable;
      doc.setFillColor(212, 168, 67);
      doc.rect(curX, barY, wAcep, barH, 'F');
      curX += wAcep;
    }
    // Segmento Rojo (Riesgo < 70%)
    if (pctRiesgo > 0) {
      const wRiesg = barW * pctRiesgo;
      doc.setFillColor(220, 38, 38);
      doc.rect(curX, barY, wRiesg, barH, 'F');
    }

    // Marco exterior de la barra
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.3);
    doc.rect(barX, barY, barW, barH, 'S');

    // Leyenda de la gráfica
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    // Verde
    doc.setFillColor(34, 197, 94);
    doc.rect(20, y + 22, 3, 3, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text(`${isEn ? 'Optimal (>=85%)' : 'Óptimo (>=85%)'}: ${countOptimo} jug. (${Math.round(pctOptimo * 100)}%)`, 25, y + 25);

    // Dorado
    doc.setFillColor(212, 168, 67);
    doc.rect(80, y + 22, 3, 3, 'F');
    doc.text(`${isEn ? 'Acceptable' : 'Aceptable'} (${threshold}-84%): ${countAceptable} jug. (${Math.round(pctAceptable * 100)}%)`, 85, y + 25);

    // Rojo
    doc.setFillColor(220, 38, 38);
    doc.rect(145, y + 22, 3, 3, 'F');
    doc.text(`${isEn ? 'At Risk' : 'Bajo Umbral'} (<${threshold}%): ${countRiesgo} jug. (${Math.round(pctRiesgo * 100)}%)`, 150, y + 25);

    y += 34;

    // ── 5. TABLA DE ASISTENCIA DE LA PLANTILLA ────────────────────────────
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'SQUAD ATTENDANCE DETAILS' : 'DESGLOSE INDIVIDUAL DE ASISTENCIA Y PUNTUALIDAD', 14, y);
    y += 5;

    const tableHead = isEn
      ? [['#', 'Player Name', 'Pos', 'Present', 'Absent', 'Justif.', 'Late', 'Injured', '% Att.', 'Status']]
      : [['#', 'Jugador', 'Pos', 'Presente', 'Ausente', 'Justif.', 'Tarde', 'Lesión', '% Asist.', 'Estado']];

    const sortedStats = [...squadStats].sort((a, b) => {
      if (!a.hasData && !b.hasData) return 0;
      if (!a.hasData) return 1;
      if (!b.hasData) return -1;
      return (b.pct ?? 0) - (a.pct ?? 0);
    });

    const tableBody = sortedStats.map((s) => {
      const hasPct = s.hasData && typeof s.pct === 'number';
      let statusTag = '-';
      if (hasPct) {
        if (s.pct >= 85) statusTag = isEn ? 'OPTIMAL' : 'ÓPTIMO';
        else if (s.pct >= threshold) statusTag = isEn ? 'REGULAR' : 'ACEPTABLE';
        else statusTag = isEn ? 'AT RISK' : 'BAJO UMBRAL';
      }

      return [
        cleanPdfText(s.player?.number || '-'),
        cleanPdfText(s.player?.name || 'Jugador'),
        cleanPdfText(s.player?.position || '-'),
        s.present || 0,
        s.absent || 0,
        s.justified || 0,
        s.late || 0,
        s.injured || 0,
        hasPct ? `${s.pct}%` : (isEn ? 'No data' : 'Sin datos'),
        statusTag
      ];
    });

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [15, 23, 42] },
      columnStyles: {
        0: { width: 9, halign: 'center' },
        1: { halign: 'left', fontStyle: 'bold' },
        2: { width: 12, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { fontStyle: 'bold', halign: 'center' },
        9: { fontStyle: 'bold', halign: 'center' },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 9) {
          const raw = String(data.cell.raw);
          if (raw.includes('ÓPTIMO') || raw.includes('OPTIMAL')) {
            data.cell.styles.textColor = [34, 197, 94];
          } else if (raw.includes('BAJO') || raw.includes('AT RISK')) {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (raw.includes('ACEPTABLE') || raw.includes('REGULAR')) {
            data.cell.styles.textColor = [212, 168, 67];
          }
        }
      }
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 12;

    // ── 6. ALERTAS DE JUGADORES BAJO EL UMBRAL (LIMPIO, SIN CARACTERES RAROS) ──
    const lowAttenders = squadStats.filter((s) => s.hasData && typeof s.pct === 'number' && s.pct < threshold);
    if (lowAttenders.length > 0) {
      if (y + 40 > pageH - 25) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(
        isEn
          ? `[ALERTA] JUGADORES CON ASISTENCIA INFERIOR AL ${threshold}%`
          : `[ALERTA] JUGADORES CON ASISTENCIA INFERIOR AL ${threshold}%`,
        14,
        y
      );
      y += 5;

      const riskRows = lowAttenders.map((s) => [
        `#${cleanPdfText(s.player?.number || '-')} ${cleanPdfText(s.player?.name || 'Jugador')} (${cleanPdfText(s.player?.position || '')})`,
        `${s.pct}% ${isEn ? 'Attendance' : 'Asistencia'}`,
        `${s.absent} ${isEn ? 'unexcused absences' : 'faltas injustificadas'}, ${s.late} ${isEn ? 'lates' : 'tardanzas'}`
      ]);

      autoTable(doc, {
        startY: y,
        body: riskRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [185, 28, 28] },
        columnStyles: { 0: { fontStyle: 'bold', width: 70 } },
      });
      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 10;
    }

    // ── 7. BLOQUE DE FIRMA Y CONFORMIDAD ──────────────────────────────────
    if (y + 30 > pageH - 25) {
      doc.addPage();
      y = 20;
    }

    const sigX = pageW - 75;
    doc.setDrawColor(180, 180, 180);
    doc.line(sigX, y + 16, sigX + 55, y + 16);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(isEn ? 'Staff / Head Coach Signature' : 'Firma del Cuerpo Técnico / Club', sigX + 27.5, y + 20, { align: 'center' });

    // Pie de página unificado en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, pageW, pageH, i, totalPages);
    }

    const safeTeam = teamName.replace(/\s+/g, '_').toLowerCase();
    const pdfName = `Control_Asistencia_${safeTeam}_${new Date().toISOString().split('T')[0]}.pdf`;
    await savePdfUniversal(doc, pdfName);
  } catch (error) {
    console.error('Error al generar PDF de Asistencia:', error);
    alert(isEn ? 'Error generating Attendance PDF' : 'Error al generar el PDF de Asistencia');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
