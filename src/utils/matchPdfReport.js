/**
 * matchPdfReport.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generador de Informes PDF de Partido (Post-Partido Total & Live Stats).
 * Incluye captura visual con html2canvas de las gráficas SVG (donus, barras) +
 * tablas de datos estructuradas, cuestionario guiado, alineaciones y cronología.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { savePdfUniversal } from './pdfGenerator';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const html2canvasMod = await import('html2canvas');
  const autoTable = autoTableMod.default || autoTableMod;
  const html2canvas = html2canvasMod.default || html2canvasMod;
  return { jsPDF, autoTable, html2canvas };
};

// Nombres legibles de eventos para la cronología
const EVENT_NAMES = {
  shot_on_target_own:   '🟢 Tiro a puerta (Propio)',
  shot_on_target_rival: '🔴 Tiro a puerta (Rival)',
  shot_off_target_own:  '⬜ Tiro fuera (Propio)',
  shot_off_target_rival: '🔲 Tiro fuera (Rival)',
  recovery:             '↑ Recuperación de balón',
  loss:                 '↓ Pérdida de balón',
  duel_won:             '✊ Duelo ganado',
  duel_lost:            '🤜 Duelo perdido',
  foul_favor:           '✅ Falta a favor',
  foul_against:         '❌ Falta en contra',
  counter_not_cut:      '⚡ Contra no cortada',
  player_no_finish:     '😤 Jugador no finaliza',
  card_own:             '🟨 Tarjeta recibida (Propia)',
  card_rival:           '🟥 Tarjeta provocada (Rival)',
  corner_favor:         '🚩 Córner a favor',
  corner_against:       '⛳ Córner en contra',
  offside_own:          '🏃 Fuera de juego (Propio)',
  offside_rival:       '🏃‍♂️ Fuera de juego (Rival)',
  gol_local:            '⚽ GOL PROPIO',
  gol_rival:            '⚽ GOL RIVAL',
};

export const generateMatchPdfReport = async ({
  mode = 'POST-MATCH', // 'POST-MATCH' or 'LIVE-STATS'
  teamName = 'Mi Equipo',
  matchData = {},
  events = [],
  players = [],
}) => {
  window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Generando Informe PDF...' } }));
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { jsPDF, autoTable, html2canvas } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = [23, 45, 33];    // #172D21 (Verde institucional)
    const colorAccent  = [212, 168, 67];  // #D4A843 (Dorado)

    const titleText = mode === 'POST-MATCH' 
      ? 'INFORME TOTAL POST-PARTIDO' 
      : 'INFORME DE ESTADÍSTICAS EN VIVO';

    // ── 1. ENCABEZADO DE MARCA ─────────────────────────────────────────────
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 34, pageW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`MÍSTER 11 — ${titleText}`, 14, 16);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const fechaStr = matchData?.date ? new Date(matchData.date).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
    doc.text(`Fecha: ${fechaStr} | ${teamName} vs ${matchData?.rival || 'Rival'}`, 14, 26);

    let y = 46;

    // ── 2. DATOS DEL PARTIDO & MARCADOR ─────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'S');

    const rivalName = matchData?.rival || 'Rival';
    const goalsFor = matchData?.goalsFor ?? matchData?.golesLocal ?? 0;
    const goalsAgainst = matchData?.goalsAgainst ?? matchData?.golesVisita ?? 0;

    doc.setTextColor(...colorPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${teamName}  vs  ${rivalName}`, 20, y + 12);

    doc.setFontSize(22);
    doc.setTextColor(...colorAccent);
    doc.text(`${goalsFor} - ${goalsAgainst}`, pageW - 40, y + 16, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`MVP: ${matchData?.mvp || 'N/A'} | Valoración Equipo: ${matchData?.teamRating || 5}/10 | Formación: ${matchData?.lineup || '4-3-3'}`, 20, y + 24);

    y += 38;

    // ── 3. DESTACADOS & GOLEADORES (Solo en POST-MATCH) ────────────────────
    if (mode === 'POST-MATCH') {
      let scorersText = matchData.scorers;
      if (!scorersText && matchData.goleadoresList && matchData.goleadoresList.length > 0) {
        scorersText = matchData.goleadoresList
          .map((g) => {
            const p = players.find((pl) => pl.id === g.jugadorId);
            return `${p ? (p.name || p.nombre) : 'Jugador'} (${g.minuto}')`;
          })
          .join(', ');
      }
      if (!scorersText) scorersText = 'Sin registros';

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => pl.id === t.jugadorId);
            const tipo = t.tipo === 'amarilla' ? '🟨 Amarilla' : '🟥 Roja';
            return `${tipo} - ${p ? (p.name || p.nombre) : 'Jugador'} (${t.minuto}')`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = 'Ninguna';

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text('⚽ GOLEADORES, ASISTENCIAS Y TARJETAS', 14, y);
      y += 6;

      const highlightsTable = [
        ['Goleadores / Asistencias', scorersText],
        ['Tarjetas Sancionadas', cardsText],
      ];

      autoTable(doc, {
        startY: y,
        body: highlightsTable,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3.5 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [241, 245, 249], width: 55 } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 10;
    }

    // ── 4. CAPTURA VISUAL DE LAS GRÁFICAS SVG CON HTML2CANVAS ─────────────
    const chartContainerId = mode === 'POST-MATCH' 
      ? 'livestats-charts-container-post' 
      : 'livestats-charts-container-live';
    const chartElement = document.getElementById(chartContainerId) || document.querySelector('.livestats-summary-grid');

    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: null, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - 28;
        const imgH = (canvas.height * imgW) / canvas.width;

        if (y + imgH > pageH - 20) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text('📊 RESUMEN Y GRÁFICAS TÁCTICAS EN IMAGEN', 14, y);
        y += 6;

        doc.addImage(imgData, 'PNG', 14, y, imgW, Math.min(imgH, 120));
        y += Math.min(imgH, 120) + 10;
      } catch (e) {
        console.warn('No se pudo capturar html2canvas de las gráficas:', e);
      }
    }

    // ── 5. TABLAS TÁCTICAS DE EFICIENCIA Y COMPARATIVA ──────────────────────
    if (y > pageH - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text('🎯 TABLA DE EFICIENCIA TÁCTICA Y COMPARATIVA', 14, y);
    y += 6;

    const countOf = (t) => events.filter((e) => e.type === t).length;
    const duelsWon = countOf('duel_won');
    const duelsLost = countOf('duel_lost');
    const totalDuels = duelsWon + duelsLost;
    const duelsPct = totalDuels > 0 ? Math.round((duelsWon / totalDuels) * 100) : 0;

    const shotsOn = countOf('shot_on_target_own');
    const shotsOff = countOf('shot_off_target_own');
    const totalShots = shotsOn + shotsOff;
    const shotsPct = totalShots > 0 ? Math.round((shotsOn / totalShots) * 100) : 0;

    const rec = countOf('recovery');
    const loss = countOf('loss');
    const totalPoss = rec + loss;
    const possPct = totalPoss > 0 ? Math.round((rec / totalPoss) * 100) : 0;

    const effData = [
      ['Métrica Táctica', 'Eventos Positivos', 'Eventos Negativos', '% Eficiencia'],
      ['Duelos individuales', `${duelsWon} Ganados`, `${duelsLost} Perdidos`, `${duelsPct}% Éxito`],
      ['Precisión de Tiro', `${shotsOn} a Puerta`, `${shotsOff} Fuera`, `${shotsPct}% Puerta`],
      ['Balance de Balón', `${rec} Recuperaciones`, `${loss} Pérdidas`, `${possPct}% Retención`],
    ];

    autoTable(doc, {
      startY: y,
      head: [effData[0]],
      body: effData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 30) + 8;

    // ── 6. NOTAS TÁCTICAS Y CUESTIONARIO POST-PARTIDO (Solo en POST-MATCH) ─
    if (mode === 'POST-MATCH') {
      if (y > pageH - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text('📝 NOTAS TÁCTICAS Y CUESTIONARIO DEL ENTRENADOR', 14, y);
      y += 6;

      const questionsList = [
        { label: 'Notas Tácticas Generales', text: matchData.notes || 'Sin notas registradas' },
        { label: 'Aspectos Tácticos Clave', text: matchData.postMatchAnswers?.tactical || 'Sin respuesta' },
        { label: 'Aspectos Físicos y Mentales', text: matchData.postMatchAnswers?.physical || 'Sin respuesta' },
        { label: 'Puntos de Mejora para Entrenamientos', text: matchData.postMatchAnswers?.improvement || 'Sin respuesta' },
        { label: 'Jugadores Destacados y MVP', text: matchData.postMatchAnswers?.highlights || 'Sin respuesta' },
      ];

      const qRows = questionsList.map((q) => [q.label, q.text]);

      autoTable(doc, {
        startY: y,
        body: qRows,
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        columnStyles: { 0: { fontStyle: 'bold', width: 60, textColor: colorPrimary } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 8;
    }

    // ── 7. CRONOLOGÍA DE EVENTOS EN VIVO ──────────────────────────────────
    doc.addPage();

    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('📜 CRONOLOGÍA DETALLADA DE EVENTOS', 14, 13);

    const sortedEvents = [...events].sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half;
      return (a.minute || 0) - (b.minute || 0);
    });

    const timelineRows = sortedEvents.map((e, idx) => [
      `${idx + 1}`,
      `${e.minute || 1}'`,
      `${e.half === 1 ? '1T' : '2T'}`,
      EVENT_NAMES[e.type] || e.type,
    ]);

    if (timelineRows.length === 0) {
      timelineRows.push(['-', '-', '-', 'No hay eventos registrados en vivo']);
    }

    autoTable(doc, {
      startY: 26,
      head: [['#', 'Minuto', 'Mitad', 'Evento Registrado']],
      body: timelineRows,
      theme: 'striped',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });

    // Guardar PDF
    const safeTitle = (matchData?.rival || 'Partido').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${mode === 'POST-MATCH' ? 'Informe_Total_PostPartido' : 'Informe_LiveStats'}_${safeTitle}_${Date.now()}.pdf`;
    await savePdfUniversal(doc, filename);
  } catch (err) {
    console.error('Error al generar el informe PDF:', err);
    alert('Error al generar el PDF del informe. Intenta nuevamente.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
