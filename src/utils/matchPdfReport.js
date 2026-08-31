import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import { drawPdfFooter, imageUrlToBase64, drawMomentumChartCanvas, drawRadarChartCanvas } from './pdfTheme';

const getPdfLibs = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const html2canvasMod = await import('html2canvas');
  const autoTable = autoTableMod.default || autoTableMod;
  const html2canvas = html2canvasMod.default || html2canvasMod;
  return { jsPDF, autoTable, html2canvas };
};

// Nombres legibles en texto plano (sin caracteres emojis para evitar corrupción en PDF)
const EVENT_NAMES_ES = {
  shot_on_target_own: 'Tiro a puerta (Propio)',
  shot_on_target_rival: 'Tiro a puerta (Rival)',
  shot_off_target_own: 'Tiro fuera (Propio)',
  shot_off_target_rival: 'Tiro fuera (Rival)',
  recovery: 'Recuperacion de balon',
  loss: 'Perdida de balon',
  duel_won: 'Duelo ganado',
  duel_lost: 'Duelo perdido',
  foul_favor: 'Falta a favor',
  foul_against: 'Falta en contra',
  counter_not_cut: 'Contra no cortada',
  player_no_finish: 'Jugador no finaliza',
  card_own: 'Tarjeta recibida (Propia)',
  card_rival: 'Tarjeta provocada (Rival)',
  card_yellow_own: 'Tarjeta Amarilla (Propia)',
  card_red_own: 'Tarjeta Roja (Propia)',
  card_yellow_rival: 'Tarjeta Amarilla (Rival)',
  card_red_rival: 'Tarjeta Roja (Rival)',
  corner_favor: 'Corner a favor',
  corner_against: 'Corner en contra',
  offside_own: 'Fuera de juego (Propio)',
  offside_rival: 'Fuera de juego (Rival)',
  gol_local: 'GOL PROPIO',
  gol_rival: 'GOL RIVAL',
};

const EVENT_NAMES_EN = {
  shot_on_target_own: 'Shot on target (Own)',
  shot_on_target_rival: 'Shot on target (Opponent)',
  shot_off_target_own: 'Shot off target (Own)',
  shot_off_target_rival: 'Shot off target (Opponent)',
  recovery: 'Ball Recovery',
  loss: 'Ball Loss',
  duel_won: 'Duel Won',
  duel_lost: 'Duel Lost',
  foul_favor: 'Foul in Favor',
  foul_against: 'Foul Against',
  counter_not_cut: 'Counter-attack not cut',
  player_no_finish: 'Player did not finish',
  card_own: 'Card received (Own)',
  card_rival: 'Card forced (Opponent)',
  card_yellow_own: 'Yellow Card (Own)',
  card_red_own: 'Red Card (Own)',
  card_yellow_rival: 'Yellow Card (Opponent)',
  card_red_rival: 'Red Card (Opponent)',
  corner_favor: 'Corner in Favor',
  corner_against: 'Corner Against',
  offside_own: 'Offside (Own)',
  offside_rival: 'Offside (Opponent)',
  gol_local: 'OWN GOAL',
  gol_rival: 'OPPONENT GOAL',
};

export const generateMatchPdfReport = async ({
  mode = 'POST-MATCH', // 'POST-MATCH' or 'LIVE-STATS'
  teamName = 'Mi Equipo',
  matchData = {},
  events = [],
  players = [],
  lineupImage = null,
  language = null,
}) => {
  const effLang = getEffectiveLanguage(language || matchData?.language);
  const isEn = effLang === 'English (EN)';

  window.dispatchEvent(new CustomEvent('m11-loading', {
    detail: { show: true, message: isEn ? 'Generating PDF Report...' : 'Generando Informe PDF...' }
  }));
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { jsPDF, autoTable, html2canvas } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = [23, 45, 33];    // #172D21 (Verde institucional)
    const colorAccent = [212, 168, 67];  // #D4A843 (Dorado)

    const titleText = mode === 'POST-MATCH'
      ? (isEn ? 'FULL POST-MATCH REPORT' : 'INFORME TOTAL POST-PARTIDO')
      : (isEn ? 'LIVE STATS REPORT' : 'INFORME DE ESTADÍSTICAS EN VIVO');

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
    const dateLoc = isEn ? 'en-US' : 'es-ES';
    const fechaStr = matchData?.date ? new Date(matchData.date).toLocaleDateString(dateLoc) : new Date().toLocaleDateString(dateLoc);
    doc.text(`${isEn ? 'Date' : 'Fecha'}: ${fechaStr} | ${teamName} vs ${matchData?.rival || (isEn ? 'Opponent' : 'Rival')}`, 14, 26);

    let y = 46;

    // ── 2. DATOS DEL PARTIDO & MARCADOR ─────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'S');

    const rivalName = matchData?.rival || (isEn ? 'Opponent' : 'Rival');
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
    const ratingLabel = isEn ? 'Team Rating' : 'Valoracion Equipo';
    const formationLabel = isEn ? 'Formation' : 'Formacion';
    doc.text(`MVP: ${matchData?.mvp || 'N/A'} | ${ratingLabel}: ${matchData?.teamRating || 5}/10 | ${formationLabel}: ${matchData?.lineup || '4-3-3'}`, 20, y + 24);

    y += 38;

    // ── 3. DESTACADOS & GOLEADORES (Solo en POST-MATCH) ────────────────────
    if (mode === 'POST-MATCH') {
      let scorersText = matchData.scorers;
      if (!scorersText && matchData.goleadoresList && matchData.goleadoresList.length > 0) {
        scorersText = matchData.goleadoresList
          .map((g) => {
            const p = players.find((pl) => pl.id === g.jugadorId);
            return `${p ? (p.name || p.nombre) : (isEn ? 'Player' : 'Jugador')} (${g.minuto}')`;
          })
          .join(', ');
      }
      if (!scorersText) scorersText = isEn ? 'No records' : 'Sin registros';

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => pl.id === t.jugadorId);
            const tipo = t.tipo === 'amarilla' ? (isEn ? 'Yellow' : 'Amarilla') : (isEn ? 'Red' : 'Roja');
            return `${tipo} - ${p ? (p.name || p.nombre) : (isEn ? 'Player' : 'Jugador')} (${t.minuto}')`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = isEn ? 'None' : 'Ninguna';

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'SCORERS, ASSISTS AND CARDS' : 'GOLEADORES, ASISTENCIAS Y TARJETAS', 14, y);
      y += 6;

      const highlightsTable = [
        [isEn ? 'Scorers / Assists' : 'Goleadores / Asistencias', scorersText],
        [isEn ? 'Cards Issued' : 'Tarjetas Sancionadas', cardsText],
      ];

      autoTable(doc, {
        startY: y,
        body: highlightsTable,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3.5, textColor: [15, 23, 42] },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [241, 245, 249], width: 55, textColor: colorPrimary } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 10;

      // ── ALINEACIÓN TÁCTICA INICIAL Y SUPLENTES (IMAGEN) ──
      if (lineupImage) {
        if (y + 105 > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'INITIAL TACTICAL LINEUP & SUBSTITUTES' : 'ALINEACIÓN TÁCTICA INICIAL Y SUPLENTES', 14, y);
        y += 6;
        const pitchW = 145;
        const pitchH = (530 / 720) * pitchW;
        const pitchX = (pageW - pitchW) / 2;
        try {
          doc.addImage(lineupImage, 'PNG', pitchX, y, pitchW, pitchH);
          y += pitchH + 10;
        } catch (e) {
          console.error("Error al incluir gráfico de alineación:", e);
        }
      }
    }


    // ── 4. GRÁFICAS TÁCTICAS NATIVAS (MOMENTUM & RADAR EN CANVAS 2D) ───────────
    try {
      const momentumImg = drawMomentumChartCanvas(events, 90, 640, 200);
      if (momentumImg) {
        if (y + 75 > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'TACTICAL MOMENTUM & MATCH DYNAMICS' : 'MOMENTUM TÁCTICO Y DINÁMICA DEL PARTIDO', 14, y);
        y += 6;

        doc.addImage(momentumImg, 'PNG', 14, y, pageW - 28, 62);
        y += 70;
      }
    } catch (chartErr) {
      console.warn('[matchPdfReport] Error generando momentum chart:', chartErr);
    }

    // ── 5. TABLAS TÁCTICAS DE EFICIENCIA Y COMPARATIVA ──────────────────────
    if (y > pageH - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'TACTICAL EFFICIENCY AND COMPARISON TABLE' : 'TABLA DE EFICIENCIA TÁCTICA Y COMPARATIVA', 14, y);
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

    const effData = isEn ? [
      ['Tactical Metric', 'Positive Events', 'Negative Events', '% Efficiency'],
      ['Individual Duels', `${duelsWon} Won`, `${duelsLost} Lost`, `${duelsPct}% Success`],
      ['Shots Accuracy', `${shotsOn} On Target`, `${shotsOff} Off Target`, `${shotsPct}% On Target`],
      ['Ball Balance', `${rec} Recoveries`, `${loss} Losses`, `${possPct}% Retention`],
    ] : [
      ['Metrica Tactica', 'Eventos Positivos', 'Eventos Negativos', '% Eficiencia'],
      ['Duelos individuales', `${duelsWon} Ganados`, `${duelsLost} Perdidos`, `${duelsPct}% Exito`],
      ['Precision de Tiro', `${shotsOn} a Puerta`, `${shotsOff} Fuera`, `${shotsPct}% Puerta`],
      ['Balance de Balon', `${rec} Recuperaciones`, `${loss} Perdidas`, `${possPct}% Retencion`],
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

    // ── 5b. TABLA COMPARATIVA DIRECTA (EQUIPO VS RIVAL) ─────────────────────
    if (y > pageH - 70) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'HEAD-TO-HEAD STATISTICAL COMPARISON' : 'COMPARATIVA ESTADÍSTICA PROPIO VS RIVAL', 14, y);
    y += 6;

    const shotsOnRival = countOf('shot_on_target_rival');
    const shotsOffRival = countOf('shot_off_target_rival');
    const cornersFavor = countOf('corner_favor');
    const cornersAgainst = countOf('corner_against');
    const foulsFavor = countOf('foul_favor');
    const foulsAgainst = countOf('foul_against');
    const offsidesOwn = countOf('offside_own');
    const offsidesRival = countOf('offside_rival');
    const yellowOwn = countOf('card_yellow_own') + countOf('amarilla');
    const yellowRival = countOf('card_yellow_rival');
    const redOwn = countOf('card_red_own') + countOf('roja');
    const redRival = countOf('card_red_rival');

    const homeTeam = matchData.local || teamName || (isEn ? 'Our Team' : 'Mi Equipo');
    const awayTeam = matchData.visitante || matchData.rival || (isEn ? 'Opponent' : 'Rival');

    const compData = isEn ? [
      ['Comparative Metric', homeTeam, awayTeam],
      ['Total Shots', `${shotsOn + shotsOff}`, `${shotsOnRival + shotsOffRival}`],
      ['Shots on Target', `${shotsOn}`, `${shotsOnRival}`],
      ['Shots off Target', `${shotsOff}`, `${shotsOffRival}`],
      ['Corner Kicks', `${cornersFavor}`, `${cornersAgainst}`],
      ['Fouls', `${foulsAgainst}`, `${foulsFavor}`],
      ['Offsides', `${offsidesOwn}`, `${offsidesRival}`],
      ['Yellow Cards', `${yellowOwn}`, `${yellowRival}`],
      ['Red Cards', `${redOwn}`, `${redRival}`],
      ['Estimated Possession', `${possPct}%`, `${100 - possPct}%`],
    ] : [
      ['Metrica Comparativa', homeTeam, awayTeam],
      ['Tiros Totales', `${shotsOn + shotsOff}`, `${shotsOnRival + shotsOffRival}`],
      ['Tiros a Puerta', `${shotsOn}`, `${shotsOnRival}`],
      ['Tiros Fuera', `${shotsOff}`, `${shotsOffRival}`],
      ['Corners', `${cornersFavor}`, `${cornersAgainst}`],
      ['Faltas cometidas', `${foulsAgainst}`, `${foulsFavor}`],
      ['Fueras de Juego', `${offsidesOwn}`, `${offsidesRival}`],
      ['Tarjetas Amarillas', `${yellowOwn}`, `${yellowRival}`],
      ['Tarjetas Rojas', `${redOwn}`, `${redRival}`],
      ['Posesion Estimada', `${possPct}%`, `${100 - possPct}%`],
    ];

    autoTable(doc, {
      startY: y,
      head: [compData[0]],
      body: compData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', width: 65 } },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 45) + 8;

    // ── 6. NOTAS TÁCTICAS Y CUESTIONARIO POST-PARTIDO (Solo en POST-MATCH) ─
    if (mode === 'POST-MATCH') {
      if (y > pageH - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'TACTICAL NOTES AND COACH QUESTIONNAIRE' : 'NOTAS TÁCTICAS Y CUESTIONARIO DEL ENTRENADOR', 14, y);
      y += 6;

      const questionsList = isEn ? [
        { label: 'General Tactical Notes', text: matchData.notes || 'No notes recorded' },
        { label: 'Key Tactical Aspects', text: matchData.postMatchAnswers?.tactical || 'No answer' },
        { label: 'Physical and Mental Aspects', text: matchData.postMatchAnswers?.physical || 'No answer' },
        { label: 'Training Improvement Points', text: matchData.postMatchAnswers?.improvement || 'No answer' },
        { label: 'Highlighted Players and MVP', text: matchData.postMatchAnswers?.highlights || 'No answer' },
      ] : [
        { label: 'Notas Tacticas Generales', text: matchData.notes || 'Sin notas registradas' },
        { label: 'Aspectos Tacticos Clave', text: matchData.postMatchAnswers?.tactical || 'Sin respuesta' },
        { label: 'Aspectos Fisicos y Mentales', text: matchData.postMatchAnswers?.physical || 'Sin respuesta' },
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

      // ── 6b. FOTOGRAFÍAS REGISTRADAS POST-PARTIDO (EVIDENCIA FOTOGRÁFICA) ──
      const rawPostImages = matchData.postMatchImages || (matchData.postMatchPhoto ? [matchData.postMatchPhoto] : []);
      const postImagesB64 = [];
      for (let imgUrl of rawPostImages) {
        if (!imgUrl) continue;
        if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
          postImagesB64.push(imgUrl);
        } else {
          const b64 = await imageUrlToBase64(imgUrl);
          if (b64) postImagesB64.push(b64);
        }
      }

      if (postImagesB64.length > 0) {
        if (y + 55 > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'POST-MATCH PHOTOGRAPHS' : 'FOTOGRAFÍAS REGISTRADAS DEL POST-PARTIDO', 14, y);
        y += 6;

        for (let imgB64 of postImagesB64) {
          if (!imgB64) continue;
          try {
            if (y + 70 > pageH - 20) {
              doc.addPage();
              y = 20;
            }
            doc.addImage(imgB64, 'JPEG', 14, y, 100, 65);
            y += 72;
          } catch (errImg) {
            try {
              if (y + 70 > pageH - 20) {
                doc.addPage();
                y = 20;
              }
              doc.addImage(imgB64, 'PNG', 14, y, 100, 65);
              y += 72;
            } catch (e) {
              console.warn('Could not add post-match image to PDF:', e);
            }
          }
        }
      }
    }

    // ── 7. CRONOLOGÍA DE EVENTOS EN VIVO ──────────────────────────────────
    doc.addPage();

    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(isEn ? 'DETAILED TIMELINE OF EVENTS' : 'CRONOLOGÍA DETALLADA DE EVENTOS', 14, 13);

    const sortedEvents = [...events].sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half;
      return (a.minute || 0) - (b.minute || 0);
    });

    const eventDict = isEn ? EVENT_NAMES_EN : EVENT_NAMES_ES;
    const timelineRows = sortedEvents.map((e, idx) => [
      `${idx + 1}`,
      `${e.minute || 1}'`,
      `${e.half === 1 ? (isEn ? '1st Half' : '1T') : (isEn ? '2nd Half' : '2T')}`,
      eventDict[e.type] || e.type,
    ]);

    if (timelineRows.length === 0) {
      timelineRows.push(['-', '-', '-', isEn ? 'No live events recorded' : 'No hay eventos registrados en vivo']);
    }

    autoTable(doc, {
      startY: 26,
      head: [isEn ? ['#', 'Minute', 'Half', 'Registered Event'] : ['#', 'Minuto', 'Mitad', 'Evento Registrado']],
      body: timelineRows,
      theme: 'striped',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });

    // Pie de página unificado en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, pageW, pageH, i, totalPages);
    }

    // Guardar PDF
    const safeTitle = (matchData?.rival || (isEn ? 'Match' : 'Partido')).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${mode === 'POST-MATCH' ? (isEn ? 'PostMatch_FullReport' : 'Informe_Total_PostPartido') : (isEn ? 'LiveStats_Report' : 'Informe_LiveStats')}_${safeTitle}_${Date.now()}.pdf`;
    await savePdfUniversal(doc, filename);
  } catch (err) {
    console.error('Error al generar el informe PDF:', err);
    alert(isEn ? 'Error generating PDF report. Please try again.' : 'Error al generar el PDF del informe. Intenta nuevamente.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
