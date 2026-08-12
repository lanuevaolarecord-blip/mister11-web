import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import { drawPdfFooter } from './pdfTheme';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default || autoTableMod;
  return { jsPDF, autoTable };
};

export const generateAttendancePdfReport = async ({
  teamName = 'Mi Equipo',
  squadStats = [],
  threshold = 70,
  language = null,
}) => {
  const effLang = getEffectiveLanguage(language);
  const isEn = effLang === 'English (EN)';

  window.dispatchEvent(new CustomEvent('m11-loading', {
    detail: { show: true, message: isEn ? 'Generating Attendance PDF Report...' : 'Generando Informe de Asistencia...' }
  }));
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { jsPDF, autoTable } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = [23, 45, 33];    // #172D21
    const colorAccent = [212, 168, 67];  // #D4A843

    const titleText = isEn ? 'TEAM ATTENDANCE CONTROL REPORT' : 'INFORME DE CONTROL DE ASISTENCIA DEL EQUIPO';

    // ── 1. ENCABEZADO DE MARCA ─────────────────────────────────────────────
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 34, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(`MÍSTER 11 — ${titleText}`, 14, 16);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const fechaStr = new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES');
    doc.text(`${isEn ? 'Date' : 'Fecha'}: ${fechaStr} | ${isEn ? 'Team' : 'Equipo'}: ${teamName} | ${isEn ? 'Threshold' : 'Umbral Alerta'}: ${threshold}%`, 14, 26);

    let y = 46;

    // ── 2. RESUMEN EJECUTIVO DE ASISTENCIA ──────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 26, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 26, 3, 3, 'S');

    const totalSquad = squadStats.length;
    const avgPct = totalSquad > 0
      ? Math.round(squadStats.reduce((acc, s) => acc + s.pct, 0) / totalSquad)
      : 100;
    const lowAttenders = squadStats.filter((s) => s.pct < threshold);

    doc.setTextColor(...colorPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(isEn ? 'ATTENDANCE METRICS' : 'MÉTRICAS CLAVE DE ASISTENCIA', 20, y + 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${isEn ? 'Squad Players' : 'Jugadores en Plantilla'}: ${totalSquad}  |  ${isEn ? 'Team Average' : 'Media del Equipo'}: ${avgPct}%  |  ${isEn ? 'Players at Risk' : 'Jugadores bajo Umbral'}: ${lowAttenders.length}`,
      20,
      y + 19
    );

    y += 34;

    // ── 3. TABLA DE ASISTENCIA DE LA PLANTILLA ────────────────────────────
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'SQUAD ATTENDANCE SUMMARY' : 'RESUMEN DE ASISTENCIA DE LA PLANTILLA', 14, y);
    y += 6;

    const tableHead = isEn
      ? [['#', 'Player Name', 'Pos', 'Present', 'Absent', 'Justified', 'Late', 'Injured', '% Att.']]
      : [['#', 'Jugador', 'Pos', 'Presente', 'Ausente', 'Justif.', 'Tarde', 'Lesion.', '% Asist.']];

    const sortedStats = [...squadStats].sort((a, b) => b.pct - a.pct);
    const tableBody = sortedStats.map((s) => [
      s.player?.number || '-',
      s.player?.name || 'Jugador',
      s.player?.position || '-',
      s.present,
      s.absent,
      s.justified,
      s.late,
      s.injured,
      `${s.pct}%${s.pct < threshold ? ' ⚠️' : ''}`
    ]);

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [15, 23, 42] },
      columnStyles: {
        0: { width: 10, halign: 'center' },
        2: { width: 15, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { fontStyle: 'bold', halign: 'center' },
      },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 12;

    // ── 4. ALERTAS DE JUGADORES BAJO EL UMBRAL ────────────────────────────
    if (lowAttenders.length > 0) {
      if (y + 40 > pageH - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Rojo
      doc.text(
        isEn
          ? `⚠️ ATTENTION: PLAYERS BELOW ${threshold}% THRESHOLD`
          : `⚠️ JUGADORES REQUIRIENDO ATENCIÓN (BAJO EL ${threshold}% DE ASISTENCIA)`,
        14,
        y
      );
      y += 6;

      const riskRows = lowAttenders.map((s) => [
        `#${s.player?.number || '-'} ${s.player?.name || 'Jugador'} (${s.player?.position || ''})`,
        `${s.pct}% ${isEn ? 'Attendance' : 'Asistencia'}`,
        `${s.absent} ${isEn ? 'Absences' : 'Faltas no justificadas'}, ${s.late} ${isEn ? 'Lates' : 'Tardanzas'}`
      ]);

      autoTable(doc, {
        startY: y,
        body: riskRows,
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [185, 28, 28] },
        columnStyles: { 0: { fontStyle: 'bold', width: 70 } },
      });
    }

    // Pie de página unificado en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, pageW, pageH, i, totalPages);
    }

    const pdfName = `control_asistencia_${teamName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    savePdfUniversal(doc, pdfName);
  } catch (error) {
    console.error('Error al generar PDF de Asistencia:', error);
    alert(isEn ? 'Error generating Attendance PDF' : 'Error al generar el PDF de Asistencia');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
