import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import {
  drawPdfFooter,
  imageUrlToBase64,
  drawMomentumChartCanvas,
  drawRadarChartCanvas,
  drawMatchRadarChartCanvas,
  drawTacticalPitchCanvas,
  drawPostMatchDonutsCanvas,
  drawStatsComparisonAndHalvesCanvas,
  drawSectorsDistributionCanvas,
  cleanPdfText,
  PDF_COLORS
} from './pdfTheme';

export { imageUrlToBase64 };

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
  recovery: 'Recuperación de balón',
  loss: 'Pérdida de balón',
  ball_loss: 'Pérdida de balón',
  duel_won: 'Duelo ganado',
  duel_lost: 'Duelo perdido',
  foul_favor: 'Falta a favor',
  foul_against: 'Falta en contra',
  foul: 'Falta cometida',
  counter_not_cut: 'Contra no cortada',
  player_no_finish: 'Jugador no finaliza',
  card_own: 'Tarjeta recibida (Propia)',
  card_rival: 'Tarjeta provocada (Rival)',
  card_yellow_own: 'Tarjeta Amarilla (Propia)',
  card_red_own: 'Tarjeta Roja (Propia)',
  card_yellow_rival: 'Tarjeta Amarilla (Rival)',
  card_red_rival: 'Tarjeta Roja (Rival)',
  amarilla: 'Tarjeta Amarilla',
  roja: 'Tarjeta Roja',
  yellow_card: 'Tarjeta Amarilla',
  red_card: 'Tarjeta Roja',
  corner_favor: 'Córner a favor',
  corner_against: 'Córner en contra',
  offside_own: 'Fuera de juego (Propio)',
  offside_rival: 'Fuera de juego (Rival)',
  gol_local: 'Gol a favor',
  goal_own: 'Gol a favor',
  gol_rival: 'Gol en contra',
  goal_rival: 'Gol en contra',
  pass_completed: 'Pase completado',
  key_pass: 'Pase clave',
  sustitucion: 'Sustitución / Cambio',
  substitution: 'Sustitución / Cambio',
  lesion: 'Atención por lesión',
  injury: 'Atención por lesión',
};

const EVENT_NAMES_EN = {
  shot_on_target_own: 'Shot on target (Own)',
  shot_on_target_rival: 'Shot on target (Opponent)',
  shot_off_target_own: 'Shot off target (Own)',
  shot_off_target_rival: 'Shot off target (Opponent)',
  recovery: 'Ball Recovery',
  loss: 'Ball Loss',
  ball_loss: 'Ball Loss',
  duel_won: 'Duel Won',
  duel_lost: 'Duel Lost',
  foul_favor: 'Foul in Favor',
  foul_against: 'Foul Against',
  foul: 'Foul',
  counter_not_cut: 'Counter-attack not cut',
  player_no_finish: 'Player did not finish',
  card_own: 'Card received (Own)',
  card_rival: 'Card forced (Opponent)',
  card_yellow_own: 'Yellow Card (Own)',
  card_red_own: 'Red Card (Own)',
  card_yellow_rival: 'Yellow Card (Opponent)',
  card_red_rival: 'Red Card (Opponent)',
  amarilla: 'Yellow Card',
  roja: 'Red Card',
  yellow_card: 'Yellow Card',
  red_card: 'Red Card',
  corner_favor: 'Corner in Favor',
  corner_against: 'Corner Against',
  offside_own: 'Offside (Own)',
  offside_rival: 'Offside (Opponent)',
  gol_local: 'Goal in Favor',
  goal_own: 'Goal in Favor',
  gol_rival: 'Goal Against',
  goal_rival: 'Goal Against',
  pass_completed: 'Completed Pass',
  key_pass: 'Key Pass',
  sustitucion: 'Substitution',
  substitution: 'Substitution',
  lesion: 'Injury Treatment',
  injury: 'Injury Treatment',
};

const formatEventText = (type, isEn) => {
  if (!type) return '-';
  const dict = isEn ? EVENT_NAMES_EN : EVENT_NAMES_ES;
  if (dict[type]) return dict[type];
  return cleanPdfText(
    type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

const STATUS_LABELS = {
  presente: { es: 'Presente', en: 'Present', color: [34, 197, 94] },
  ausente: { es: 'Ausente', en: 'Absent', color: [220, 38, 38] },
  tarde: { es: 'Tarde', en: 'Late', color: [249, 115, 22] },
  justificado: { es: 'Justificado', en: 'Justified', color: [59, 130, 246] },
  lesionado: { es: 'Lesionado', en: 'Injured', color: [139, 92, 246] },
  sin_registro: { es: 'Sin Registro', en: 'No Record', color: [148, 163, 184] }
};

export const generateMatchPdfReport = async ({
  mode = 'POST-MATCH', // 'POST-MATCH', 'ACTA' or 'LIVE-STATS'
  teamName = 'Mi Equipo',
  matchData = {},
  events = [],
  players = [],
  calledPlayers = [],
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
    const { jsPDF, autoTable } = await getPdfLibs();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colorPrimary = PDF_COLORS.primary; // [23, 45, 33]
    const colorAccent = PDF_COLORS.accent;   // [212, 168, 67]

    const isActaMode = mode === 'ACTA';
    const isLiveMode = mode === 'LIVE-STATS';

    let titleText = isEn ? 'FULL POST-MATCH REPORT' : 'INFORME TOTAL POST-PARTIDO';
    if (isActaMode) {
      titleText = isEn ? 'OFFICIAL MATCH SHEET' : 'ACTA OFICIAL DE PARTIDO';
    } else if (isLiveMode) {
      titleText = isEn ? 'LIVE STATS REPORT' : 'INFORME DE ESTADÍSTICAS EN VIVO';
    }

    const rivalName = cleanPdfText(matchData?.rival || (isEn ? 'Opponent' : 'Rival'));
    const safeTeamName = cleanPdfText(teamName);
    const dateLoc = isEn ? 'en-US' : 'es-ES';
    const fechaStr = matchData?.date ? new Date(matchData.date).toLocaleDateString(dateLoc) : new Date().toLocaleDateString(dateLoc);
    const goalsFor = matchData?.goalsFor ?? matchData?.golesLocal ?? 0;
    const goalsAgainst = matchData?.goalsAgainst ?? matchData?.golesVisita ?? 0;

    // ── 1. ENCABEZADO INSTITUCIONAL ────────────────────────────────────────
    doc.setFillColor(...colorPrimary);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFillColor(...colorAccent);
    doc.rect(0, 34, pageW, 2, 'F');

    // Logo oficial de Míster11 a la izquierda
    const mr11LogoData = await imageUrlToBase64('/logo_mister11.png', 'M11', false);
    if (mr11LogoData) {
      doc.addImage(mr11LogoData, 'PNG', 14, 8, 18, 18);
    }

    // Escudo del equipo a la derecha
    if (matchData?.escudo || matchData?.activeTeam?.escudo) {
      const shieldSrc = matchData.escudo || matchData.activeTeam.escudo;
      const shieldData = await imageUrlToBase64(shieldSrc, safeTeamName, false);
      if (shieldData) {
        doc.addImage(shieldData, 'PNG', pageW - 32, 8, 18, 18);
      }
    }

    // Título Principal Centrado
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorAccent);
    doc.text(`MÍSTER 11 — ${titleText}`, pageW / 2, 14, { align: 'center' });

    // Subtítulo con Metadatos del Encuentro
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const timeStr = matchData?.time ? ` ${matchData.time}` : '';
    const matchTypeStr = matchData?.type ? ` [${cleanPdfText(matchData.type)}]` : '';
    doc.text(
      `${isEn ? 'Date' : 'Fecha'}: ${fechaStr}${timeStr}   |   ${safeTeamName} vs ${rivalName}${matchTypeStr}`,
      pageW / 2,
      22,
      { align: 'center' }
    );

    // Tagline institucional
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const isClosed = matchData.actaOficial?.closed === true;
    const statusTag = isClosed
      ? (isEn ? 'OFFICIALLY CLOSED MATCH SHEET' : 'ACTA CERRADA OFICIALMENTE')
      : (isEn ? 'PROVISIONAL MATCH SHEET (IN REVIEW)' : 'ACTA EN REVISIÓN (BORRADOR OFICIAL)');
    doc.text(
      `SISTEMA OFICIAL DE COMPETICIÓN · ${statusTag}`,
      pageW / 2,
      29,
      { align: 'center' }
    );

    let y = 44;

    // ── 2. DATOS DEL PARTIDO & MARCADOR ─────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 30, 3, 3, 'S');

    doc.setTextColor(...colorPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${safeTeamName}   vs   ${rivalName}`, 20, y + 12);

    doc.setFontSize(22);
    doc.setTextColor(...colorAccent);
    doc.text(`${goalsFor} - ${goalsAgainst}`, pageW - 40, y + 16, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const durationMin = matchData.actaOficial?.totalDuration || matchData.duration || 90;
    const venueStr = cleanPdfText(matchData.field || matchData.lugar || (isEn ? 'Standard Pitch' : 'Campo Oficial'));
    const mvpStr = cleanPdfText(matchData.mvp || 'N/A');
    doc.text(
      `MVP: ${mvpStr}   |   ${isEn ? 'Duration' : 'Duración'}: ${durationMin}'   |   ${isEn ? 'Venue' : 'Lugar'}: ${venueStr}   |   ${isEn ? 'Formation' : 'Formación'}: ${matchData?.lineup || '4-3-3'}`,
      20,
      y + 24
    );

    y += 36;

    // ── GESTIÓN DE PLANTILLA & ACTA OFICIAL (MODO ACTA Y MODO POST-MATCH) ──
    const actualMap = matchData.actaOficial?.actual || {};
    const titularesIds = Array.isArray(matchData.titulares)
      ? matchData.titulares.filter(Boolean).map(String)
      : (Array.isArray(matchData.convocados) ? matchData.convocados.slice(0, 11).filter(Boolean).map(String) : []);
    const suplentesIds = Array.isArray(matchData.suplentes)
      ? matchData.suplentes.filter(Boolean).map(String)
      : (Array.isArray(matchData.convocados) ? matchData.convocados.slice(11).filter(Boolean).map(String) : []);

    const allCalledIds = [...new Set([
      ...titularesIds,
      ...suplentesIds,
      ...Object.keys(actualMap)
    ])];

    const squadRoster = allCalledIds.map((pid) => {
      const pObj = players.find((pl) => String(pl.id) === String(pid)) || { name: 'Jugador', number: '-' };
      const actual = actualMap[pid] || {};
      const isStarter = titularesIds.includes(String(pid));
      const statusKey = actual.status || (isStarter ? 'presente' : 'sin_registro');
      const minutesVal = typeof actual.minutes === 'number' ? actual.minutes : (isStarter ? durationMin : 0);
      const ratingVal = actual.rating ?? matchData?.playerRatings?.[pid] ?? matchData?.ratings?.[pid] ?? '-';
      const isManual = actual.minutesOverride !== undefined && actual.minutesOverride !== null;

      const rsvpObj = matchData.actaOficial?.rsvp?.[pid];
      let rsvpText = '-';
      if (rsvpObj) {
        if (rsvpObj.status === 'going') rsvpText = isEn ? 'Confirmed' : 'Confirmó';
        else if (rsvpObj.status === 'not_going') rsvpText = isEn ? 'Declined' : 'No asiste';
        else if (rsvpObj.status === 'late') rsvpText = isEn ? 'Late notice' : 'Avisó tarde';
        else if (rsvpObj.status === 'justified') rsvpText = isEn ? 'Justified' : 'Justificado';
      }

      return {
        pid,
        player: pObj,
        number: pObj.number || '-',
        name: cleanPdfText(pObj.name || pObj.nombre || 'Jugador'),
        position: cleanPdfText(pObj.position || pObj.posicion || '-'),
        isStarter,
        role: isStarter ? (isEn ? 'Starter' : 'Titular') : (isEn ? 'Substitute' : 'Suplente'),
        statusKey,
        statusLabel: STATUS_LABELS[statusKey] ? (isEn ? STATUS_LABELS[statusKey].en : STATUS_LABELS[statusKey].es) : statusKey,
        statusColor: STATUS_LABELS[statusKey] ? STATUS_LABELS[statusKey].color : [100, 116, 139],
        minutes: minutesVal,
        source: isManual ? (isEn ? 'Manual' : 'Manual') : (isEn ? 'Auto' : 'Auto'),
        rating: ratingVal !== '-' ? `${ratingVal}/10` : '-',
        rsvpText
      };
    });

    // Ordenar: Titulares primero, luego suplentes por minutos desc
    squadRoster.sort((a, b) => {
      if (a.isStarter && !b.isStarter) return -1;
      if (!a.isStarter && b.isStarter) return 1;
      return (Number(b.minutes) || 0) - (Number(a.minutes) || 0);
    });

    // ── A) MODO EXCLUSIVO ACTA OFICIAL ─────────────────────────────────────
    if (isActaMode) {
      // 1. Tarjetas Resumen de Asistencia y Participación
      let countPresent = 0;
      let countAbsent = 0;
      let countLate = 0;
      let countJustified = 0;
      let countInjured = 0;
      let totalPlayerMinutes = 0;

      squadRoster.forEach((r) => {
        if (r.statusKey === 'presente') countPresent++;
        else if (r.statusKey === 'ausente') countAbsent++;
        else if (r.statusKey === 'tarde') countLate++;
        else if (r.statusKey === 'justificado') countJustified++;
        else if (r.statusKey === 'lesionado') countInjured++;
        totalPlayerMinutes += Number(r.minutes) || 0;
      });

      const totalConvocados = squadRoster.length;
      const kpiCardW = (pageW - 28 - 12) / 5;
      const actaKpis = [
        { label: isEn ? 'CALL-UP' : 'CONVOCADOS', val: `${totalConvocados} jug.`, color: colorPrimary },
        { label: isEn ? 'STARTERS / SUBS' : 'TIT. / SUPL.', val: `${titularesIds.length} / ${suplentesIds.length}`, color: colorPrimary },
        { label: isEn ? 'ATTENDANCE' : 'ASISTENCIA', val: `${countPresent + countLate}`, color: [34, 197, 94] },
        { label: isEn ? 'ABSENCES' : 'FALTAS / TARDES', val: `${countAbsent} / ${countLate}`, color: countAbsent > 0 ? [220, 38, 38] : colorPrimary },
        { label: isEn ? 'TOTAL MINUTES' : 'MINUTOS TOT.', val: `${totalPlayerMinutes}'`, color: colorAccent }
      ];

      actaKpis.forEach((c, idx) => {
        const cx = 14 + idx * (kpiCardW + 3);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(cx, y, kpiCardW, 18, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, y, kpiCardW, 18, 2, 2, 'S');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(c.label, cx + 2.5, y + 5.5);

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.color);
        doc.text(String(c.val), cx + 2.5, y + 13.5);
      });

      y += 24;

      // 2. Tabla Oficial de la Plantilla con Minutos y Asistencia
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'OFFICIAL ROSTER, MINUTES & ATTENDANCE RECORD' : 'REGISTRO OFICIAL DE PLANTILLA, ASISTENCIA Y MINUTOS', 14, y);
      y += 5;

      const actaTableHead = isEn
        ? [['#', 'Player Name', 'Pos', 'Role', 'Official Attendance', 'Minutes', 'Source', 'Rating', 'RSVP']]
        : [['#', 'Jugador', 'Pos', 'Rol', 'Estado Asistencia', 'Minutos', 'Fuente', 'Nota', 'RSVP']];

      const actaTableBody = squadRoster.map((r) => [
        r.number,
        r.name,
        r.position,
        r.role,
        r.statusLabel,
        `${r.minutes}'`,
        r.source,
        r.rating,
        r.rsvpText
      ]);

      autoTable(doc, {
        startY: y,
        head: actaTableHead,
        body: actaTableBody,
        theme: 'grid',
        headStyles: {
          fillColor: colorPrimary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.8,
          halign: 'center'
        },
        styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [15, 23, 42] },
        columnStyles: {
          0: { width: 8, halign: 'center' },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { width: 11, halign: 'center' },
          3: { width: 18, halign: 'center', fontStyle: 'bold' },
          4: { width: 26, halign: 'center', fontStyle: 'bold' },
          5: { width: 15, halign: 'center', fontStyle: 'bold' },
          6: { width: 14, halign: 'center' },
          7: { width: 14, halign: 'center' },
          8: { width: 22, halign: 'center' }
        },
        didParseCell(data) {
          if (data.section === 'body' && data.column.index === 4) {
            const raw = String(data.cell.raw);
            if (raw.includes('Present') || raw.includes('Presente')) {
              data.cell.styles.textColor = [34, 197, 94];
            } else if (raw.includes('Absent') || raw.includes('Ausente')) {
              data.cell.styles.textColor = [220, 38, 38];
            } else if (raw.includes('Late') || raw.includes('Tarde')) {
              data.cell.styles.textColor = [249, 115, 22];
            } else if (raw.includes('Justified') || raw.includes('Justificado')) {
              data.cell.styles.textColor = [59, 130, 246];
            }
          }
        }
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 50) + 9;

      // 3. Incidencias Oficiales (Goles, Tarjetas y Sustituciones)
      if (y + 45 > pageH - 35) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'OFFICIAL MATCH INCIDENTS (GOALS, CARDS & SUBS)' : 'INCIDENCIAS OFICIALES (GOLES, TARJETAS Y CAMBIOS)', 14, y);
      y += 5;

      let scorersText = matchData.scorers;
      if (!scorersText && matchData.goleadoresList && matchData.goleadoresList.length > 0) {
        scorersText = matchData.goleadoresList
          .map((g) => {
            const p = players.find((pl) => String(pl.id) === String(g.jugadorId));
            const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
            return `${pName} (${g.minuto}')`;
          })
          .join(', ');
      }
      if (!scorersText) scorersText = isEn ? 'None recorded' : 'Ninguno registrado';

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => String(pl.id) === String(t.jugadorId));
            const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
            const tipo = t.tipo === 'amarilla' ? (isEn ? 'Yellow' : 'Amarilla') : (isEn ? 'Red' : 'Roja');
            return `${tipo} - ${pName} (${t.minuto}')`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = isEn ? 'None recorded' : 'Ninguna registrada';

      let subsText = '';
      if (matchData.cambiosList && matchData.cambiosList.length > 0) {
        subsText = matchData.cambiosList
          .map((c) => {
            const pIn = players.find((pl) => String(pl.id) === String(c.entraId));
            const pOut = players.find((pl) => String(pl.id) === String(c.saleId));
            const nameIn = pIn ? cleanPdfText(pIn.name || pIn.nombre) : (isEn ? 'In' : 'Entra');
            const nameOut = pOut ? cleanPdfText(pOut.name || pOut.nombre) : (isEn ? 'Out' : 'Sale');
            return `Min ${c.minuto}': ${nameIn} <-> ${nameOut}`;
          })
          .join(' | ');
      }
      if (!subsText) subsText = isEn ? 'No substitutions recorded' : 'Sin cambios registrados';

      const incidentsTable = [
        [isEn ? 'Goals & Scorers' : 'Goleadores y Anotaciones', scorersText],
        [isEn ? 'Disciplinary Cards' : 'Tarjetas y Sanciones', cardsText],
        [isEn ? 'Substitutions' : 'Sustituciones Realizadas', subsText]
      ];

      autoTable(doc, {
        startY: y,
        body: incidentsTable,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [241, 245, 249], width: 55, textColor: colorPrimary } }
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 35) + 8;

      // 4. Advertencias y Observaciones Arbitrales / Del Cuerpo Técnico
      const warnings = matchData.actaOficial?.warnings || [];
      if (warnings.length > 0) {
        if (y + 30 > pageH - 35) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(isEn ? '[WARNINGS] NOTED IRREGULARITIES' : '[ADVERTENCIAS] ANOMALÍAS DETECTADAS EN ACTA', 14, y);
        y += 4;

        const warnRows = warnings.map((w, idx) => [`${idx + 1}`, cleanPdfText(w)]);
        autoTable(doc, {
          startY: y,
          body: warnRows,
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 2, textColor: [185, 28, 28] },
          columnStyles: { 0: { width: 8, halign: 'center', fontStyle: 'bold' } }
        });
        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 8;
      }

      // 5. Doble Firma Reglamentaria (Entrenador / Delegado & Árbitro / Capitán)
      if (y + 35 > pageH - 25) {
        doc.addPage();
        y = 25;
      }

      const boxW = 75;
      const sig1X = 18;
      const sig2X = pageW - 18 - boxW;

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);

      // Firma 1: Entrenador / Delegado
      doc.line(sig1X, y + 18, sig1X + boxW, y + 18);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(
        isEn ? 'Head Coach / Club Delegate Signature' : 'Firma del Entrenador / Delegado',
        sig1X + boxW / 2,
        y + 22,
        { align: 'center' }
      );
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(safeTeamName, sig1X + boxW / 2, y + 26, { align: 'center' });

      // Firma 2: Árbitro / Capitán
      doc.line(sig2X, y + 18, sig2X + boxW, y + 18);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(
        isEn ? 'Referee / Captain Signature' : 'Firma del Árbitro / Capitán',
        sig2X + boxW / 2,
        y + 22,
        { align: 'center' }
      );
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        isEn ? 'Official Validation · Míster 11 Platform' : 'Conformidad Oficial · Plataforma Míster 11',
        sig2X + boxW / 2,
        y + 26,
        { align: 'center' }
      );

      // ── ANEXO OFICIAL: ESTADÍSTICAS TÁCTICAS Y RENDIMIENTO EN ACTA OFICIAL ──
      doc.addPage();
      y = 20;

      // Encabezado de Anexo Oficial
      doc.setFillColor(...colorPrimary);
      doc.roundedRect(14, y, pageW - 28, 14, 2, 2, 'F');
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(
        isEn ? 'OFFICIAL ANNEX: TACTICAL STATS & MATCH REPORT' : 'ANEXO OFICIAL: ESTADÍSTICAS TÁCTICAS Y RENDIMIENTO',
        pageW / 2,
        y + 9.5,
        { align: 'center' }
      );
      y += 22;

      // 1. Radar Táctico Oficial (6 Ejes Comparativos)
      try {
        const radarImg = drawMatchRadarChartCanvas({
          events,
          homeTeamName: safeTeamName,
          awayTeamName: rivalName,
          isEn,
          width: 520,
          height: 400
        });
        if (radarImg) {
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorPrimary);
          doc.text(
            isEn ? 'OFFICIAL TACTICAL RADAR (6 COMPARATIVE AXES)' : 'RADAR TÁCTICO OFICIAL (6 EJES COMPARATIVOS)',
            14,
            y
          );
          y += 5;

          const radarW = 125;
          const radarH = (400 / 520) * radarW; // ~96 mm
          const radarX = (pageW - radarW) / 2;
          doc.addImage(radarImg, 'PNG', radarX, y, radarW, radarH);
          y += radarH + 9;
        }
      } catch (radarErr) {
        console.warn('Error dibujando radar en Acta Oficial:', radarErr);
      }

      // 2. Terreno de Juego con la Alineación Táctica Oficial (11 Titulares + Banquillo de Suplentes)
      let actaLineupImage = lineupImage;
      if (!actaLineupImage) {
        try {
          actaLineupImage = await drawTacticalPitchCanvas({
            matchData,
            calledPlayers,
            players,
            isEn
          });
        } catch (pitchErr) {
          console.warn('Error generando alineación para Acta Oficial:', pitchErr);
        }
      }

      if (actaLineupImage) {
        if (y + 105 > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(
          isEn ? 'OFFICIAL TACTICAL LINEUP & SQUAD BENCH' : 'ALINEACIÓN TÁCTICA OFICIAL Y BANQUILLO',
          14,
          y
        );
        y += 5;

        const pitchW = 152;
        const pitchH = (510 / 720) * pitchW;
        const pitchX = (pageW - pitchW) / 2;
        doc.addImage(actaLineupImage, 'PNG', pitchX, y, pitchW, pitchH);
        y += pitchH + 9;
      }

      // 3. Gráfica de Momentum Táctico y Dinámica del Partido
      try {
        const momentumImg = drawMomentumChartCanvas(events, durationMin, 640, 200);
        if (momentumImg) {
          if (y + 65 > pageH - 20) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorPrimary);
          doc.text(
            isEn ? 'MATCH MOMENTUM & DYNAMICS' : 'MOMENTUM Y DINÁMICA DEL PARTIDO',
            14,
            y
          );
          y += 5;

          doc.addImage(momentumImg, 'PNG', 14, y, pageW - 28, 56);
          y += 64;
        }
      } catch (mErr) {
        console.warn('Error generando momentum en Acta Oficial:', mErr);
      }

      // 4. Tabla de Eficiencia Táctica y Comparativa Directa
      if (y + 55 > pageH - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(
        isEn ? 'TACTICAL EFFICIENCY AND COMPARISON TABLE' : 'TABLA DE EFICIENCIA TÁCTICA Y COMPARATIVA',
        14,
        y
      );
      y += 5;

      const countOfActa = (t) => events.filter((e) => e.type === t).length;
      const duelsWonActa = countOfActa('duel_won');
      const duelsLostActa = countOfActa('duel_lost');
      const totalDuelsActa = duelsWonActa + duelsLostActa;
      const duelsPctActa = totalDuelsActa > 0 ? Math.round((duelsWonActa / totalDuelsActa) * 100) : 0;

      const shotsOnActa = countOfActa('shot_on_target_own');
      const shotsOffActa = countOfActa('shot_off_target_own');
      const totalShotsActa = shotsOnActa + shotsOffActa;
      const shotsPctActa = totalShotsActa > 0 ? Math.round((shotsOnActa / totalShotsActa) * 100) : 0;

      const recActa = countOfActa('recovery');
      const lossActa = countOfActa('loss');
      const totalPossActa = recActa + lossActa;
      const possPctActa = totalPossActa > 0 ? Math.round((recActa / totalPossActa) * 100) : 0;

      const effDataActa = isEn ? [
        ['Tactical Metric', 'Positive Events', 'Negative Events', '% Efficiency'],
        ['Individual Duels', `${duelsWonActa} Won`, `${duelsLostActa} Lost`, `${duelsPctActa}% Success`],
        ['Shots Accuracy', `${shotsOnActa} On Target`, `${shotsOffActa} Off Target`, `${shotsPctActa}% On Target`],
        ['Ball Balance', `${recActa} Recoveries`, `${lossActa} Losses`, `${possPctActa}% Retention`],
      ] : [
        ['Métrica Táctica', 'Eventos Positivos', 'Eventos Negativos', '% Eficiencia'],
        ['Duelos individuales', `${duelsWonActa} Ganados`, `${duelsLostActa} Perdidos`, `${duelsPctActa}% Éxito`],
        ['Precisión de Tiro', `${shotsOnActa} a Puerta`, `${shotsOffActa} Fuera`, `${shotsPctActa}% Puerta`],
        ['Balance de Balón', `${recActa} Recuperaciones`, `${lossActa} Pérdidas`, `${possPctActa}% Retención`],
      ];

      autoTable(doc, {
        startY: y,
        head: [effDataActa[0]],
        body: effDataActa.slice(1),
        theme: 'grid',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.8 },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 30) + 8;

      // 5. Comparativa Directa Cara a Cara (Local vs Rival)
      if (y + 55 > pageH - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(
        isEn ? 'HEAD-TO-HEAD STATISTICAL COMPARISON' : 'COMPARATIVA ESTADÍSTICA CARA A CARA',
        14,
        y
      );
      y += 5;

      const shotsOnRivalActa = countOfActa('shot_on_target_rival');
      const shotsOffRivalActa = countOfActa('shot_off_target_rival');
      const cornersFavorActa = countOfActa('corner_favor');
      const cornersAgainstActa = countOfActa('corner_against');
      const foulsAgainstActa = countOfActa('foul_against');
      const foulsFavorActa = countOfActa('foul_favor');
      const offsidesOwnActa = countOfActa('offside_own');
      const offsidesRivalActa = countOfActa('offside_rival');
      const yellowOwnActa = events.filter((e) => e.type === 'card_yellow_own' || e.type === 'yellow_card' || e.type === 'amarilla').length;
      const yellowRivalActa = countOfActa('card_yellow_rival');
      const redOwnActa = events.filter((e) => e.type === 'card_red_own' || e.type === 'red_card' || e.type === 'roja').length;
      const redRivalActa = countOfActa('card_red_rival');

      const compDataActa = isEn ? [
        ['Comparative Metric', safeTeamName, rivalName],
        ['Total Shots', `${shotsOnActa + shotsOffActa}`, `${shotsOnRivalActa + shotsOffRivalActa}`],
        ['Shots on Target', `${shotsOnActa}`, `${shotsOnRivalActa}`],
        ['Shots off Target', `${shotsOffActa}`, `${shotsOffRivalActa}`],
        ['Corner Kicks', `${cornersFavorActa}`, `${cornersAgainstActa}`],
        ['Fouls', `${foulsAgainstActa}`, `${foulsFavorActa}`],
        ['Offsides', `${offsidesOwnActa}`, `${offsidesRivalActa}`],
        ['Yellow Cards', `${yellowOwnActa}`, `${yellowRivalActa}`],
        ['Red Cards', `${redOwnActa}`, `${redRivalActa}`],
        ['Estimated Possession', `${possPctActa}%`, `${100 - possPctActa}%`],
      ] : [
        ['Métrica Comparativa', safeTeamName, rivalName],
        ['Tiros Totales', `${shotsOnActa + shotsOffActa}`, `${shotsOnRivalActa + shotsOffRivalActa}`],
        ['Tiros a Puerta', `${shotsOnActa}`, `${shotsOnRivalActa}`],
        ['Tiros Fuera', `${shotsOffActa}`, `${shotsOffRivalActa}`],
        ['Córners', `${cornersFavorActa}`, `${cornersAgainstActa}`],
        ['Faltas cometidas', `${foulsAgainstActa}`, `${foulsFavorActa}`],
        ['Fueras de Juego', `${offsidesOwnActa}`, `${offsidesRivalActa}`],
        ['Tarjetas Amarillas', `${yellowOwnActa}`, `${yellowRivalActa}`],
        ['Tarjetas Rojas', `${redOwnActa}`, `${redRivalActa}`],
        ['Posesión Estimada', `${possPctActa}%`, `${100 - possPctActa}%`],
      ];

      autoTable(doc, {
        startY: y,
        head: [compDataActa[0]],
        body: compDataActa.slice(1),
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: { 0: { fontStyle: 'bold', width: 65 } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 45) + 8;
    }

    // ── B) MODO INFORME TOTAL POST-PARTIDO (CON GRÁFICAS, FOTOS Y ACTA) ───
    if (!isActaMode) {
      // 1. Goleadores y Tarjetas
      let scorersText = matchData.scorers;
      if (!scorersText && matchData.goleadoresList && matchData.goleadoresList.length > 0) {
        scorersText = matchData.goleadoresList
          .map((g) => {
            const p = players.find((pl) => String(pl.id) === String(g.jugadorId));
            return `${p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador')} (${g.minuto}')`;
          })
          .join(', ');
      }
      if (!scorersText) scorersText = isEn ? 'No records' : 'Sin registros';

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => String(pl.id) === String(t.jugadorId));
            const tipo = t.tipo === 'amarilla' ? (isEn ? 'Yellow' : 'Amarilla') : (isEn ? 'Red' : 'Roja');
            return `${tipo} - ${p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador')} (${t.minuto}')`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = isEn ? 'None' : 'Ninguna';

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'SCORERS, ASSISTS AND CARDS' : 'GOLEADORES, ASISTENCIAS Y TARJETAS', 14, y);
      y += 5;

      const highlightsTable = [
        [isEn ? 'Scorers / Assists' : 'Goleadores / Asistencias', scorersText],
        [isEn ? 'Cards Issued' : 'Tarjetas Sancionadas', cardsText],
      ];

      autoTable(doc, {
        startY: y,
        body: highlightsTable,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [15, 23, 42] },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [241, 245, 249], width: 55, textColor: colorPrimary } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 9;

      // 2. Resumen del Acta Oficial y Minutos de Jugadores (Integrado en Post-Partido)
      if (squadRoster.length > 0) {
        if (y + 40 > pageH - 35) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'SQUAD MINUTES & ATTENDANCE BREAKDOWN (OFFICIAL SHEET)' : 'MINUTOS Y ASISTENCIA DE LA PLANTILLA (ACTA OFICIAL)', 14, y);
        y += 5;

        const hasComments = squadRoster.some((r) => matchData?.playerComments?.[r.pid]);
        const rosterHeaders = isEn
          ? (hasComments ? ['#', 'Player', 'Role', 'Status', 'Minutes', 'Rating', 'Coach Feedback'] : ['#', 'Player', 'Role', 'Status', 'Minutes', 'Rating'])
          : (hasComments ? ['#', 'Jugador', 'Rol', 'Estado', 'Minutos', 'Nota', 'Comentario del Míster'] : ['#', 'Jugador', 'Rol', 'Estado', 'Minutos', 'Nota']);

        const rosterRows = squadRoster.map((r) => {
          const base = [
            r.number,
            r.name,
            r.role,
            r.statusLabel,
            `${r.minutes}'`,
            r.rating
          ];
          if (hasComments) {
            const commentVal = cleanPdfText(matchData?.playerComments?.[r.pid] || '-');
            base.push(commentVal);
          }
          return base;
        });

        const colStyles = hasComments ? {
          0: { width: 8, halign: 'center' },
          1: { fontStyle: 'bold', width: 34 },
          2: { width: 18, halign: 'center' },
          3: { width: 18, halign: 'center' },
          4: { width: 14, halign: 'center', fontStyle: 'bold' },
          5: { width: 14, halign: 'center' },
          6: { fontSize: 7, textColor: [51, 65, 85] }
        } : {
          0: { width: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { width: 22, halign: 'center' },
          3: { width: 24, halign: 'center' },
          4: { width: 18, halign: 'center', fontStyle: 'bold' },
          5: { width: 16, halign: 'center' }
        };

        autoTable(doc, {
          startY: y,
          head: [rosterHeaders],
          body: rosterRows,
          theme: 'striped',
          headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.5, cellPadding: 2 },
          columnStyles: colStyles
        });

        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 30) + 9;
      }

      // ── PÁGINA 2: ALINEACIÓN TÁCTICA Y RADAR COMPARATIVO OFICIAL ──
      doc.addPage();
      y = 20;

      // 3. Alineación Táctica Inicial (Terreno de juego oficial con Titulares y Suplentes)
      let effectiveLineupImage = lineupImage;
      if (!effectiveLineupImage) {
        try {
          effectiveLineupImage = await drawTacticalPitchCanvas({
            matchData,
            calledPlayers,
            players,
            isEn
          });
        } catch (pitchGenErr) {
          console.warn('Error generando terreno de juego táctico canvas:', pitchGenErr);
        }
      }

      if (effectiveLineupImage) {
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'INITIAL TACTICAL LINEUP & SUBSTITUTES' : 'ALINEACIÓN TÁCTICA INICIAL Y SUPLENTES', 14, y);
        y += 5;

        const pitchW = 152;
        const pitchH = (510 / 720) * pitchW; // ~107mm
        const pitchX = (pageW - pitchW) / 2;
        try {
          doc.addImage(effectiveLineupImage, 'PNG', pitchX, y, pitchW, pitchH);
          y += pitchH + 8;
        } catch (e) {
          console.error("Error al incluir gráfico de alineación:", e);
        }
      }

      // 4. Radar Táctico Oficial (6 Ejes Comparativos)
      try {
        const radarImg = drawMatchRadarChartCanvas({
          events,
          homeTeamName: safeTeamName,
          awayTeamName: rivalName,
          isEn,
          width: 520,
          height: 380
        });
        if (radarImg) {
          if (y + 88 > pageH - 20) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorPrimary);
          doc.text(isEn ? 'OFFICIAL TACTICAL RADAR (6 COMPARATIVE AXES)' : 'RADAR TÁCTICO OFICIAL (6 EJES COMPARATIVOS)', 14, y);
          y += 5;

          const radarW = 115;
          const radarH = (380 / 520) * radarW; // ~84 mm
          const radarX = (pageW - radarW) / 2;
          doc.addImage(radarImg, 'PNG', radarX, y, radarW, radarH);
          y += radarH + 8;
        }
      } catch (radarErr) {
        console.warn('Error generando radar chart post-partido:', radarErr);
      }

      // ── PÁGINA 3: MOMENTUM TÁCTICO, GRÁFICAS DONUT DE EFICIENCIA Y SECTORES ──
      doc.addPage();
      y = 20;

      // 5. Gráfica de Momentum Táctico (Canvas HD)
      try {
        const momentumImg = drawMomentumChartCanvas(events, 90, 640, 180);
        if (momentumImg) {
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorPrimary);
          doc.text(isEn ? 'TACTICAL MOMENTUM & MATCH DYNAMICS' : 'MOMENTUM TÁCTICO Y DINÁMICA DEL PARTIDO', 14, y);
          y += 5;

          const momW = pageW - 28;
          const momH = (180 / 640) * momW; // ~51 mm
          doc.addImage(momentumImg, 'PNG', 14, y, momW, momH);
          y += momH + 8;
        }
      } catch (chartErr) {
        console.warn('[matchPdfReport] Error generando momentum chart:', chartErr);
      }

      // 6. Gráficas Donut de Eficiencia Táctica (4 Donas vectoriales)
      try {
        const donutsImg = drawPostMatchDonutsCanvas({ events, isEn, width: 660, height: 190 });
        if (donutsImg) {
          const dW = pageW - 28;
          const dH = (190 / 660) * dW; // ~52 mm
          doc.addImage(donutsImg, 'PNG', 14, y, dW, dH);
          y += dH + 8;
        }
      } catch (donutsErr) {
        console.warn('[matchPdfReport] Error generando donas chart:', donutsErr);
      }

      // 7. Distribución Táctica por Sectores (Banda Izquierda, Pasillo Central, Banda Derecha)
      try {
        const sectorsImg = drawSectorsDistributionCanvas({ events, isEn, width: 660, height: 80 });
        if (sectorsImg) {
          const sW = pageW - 28;
          const sH = (80 / 660) * sW; // ~22 mm
          doc.addImage(sectorsImg, 'PNG', 14, y, sW, sH);
          y += sH + 8;
        }
      } catch (secErr) {
        console.warn('[matchPdfReport] Error generando sectors chart:', secErr);
      }

      // ── PÁGINA 4: COMPARATIVA BARRAS, MITADES Y DETALLE POR CATEGORÍAS ──
      doc.addPage();
      y = 20;

      // 8. Barras Comparativas Propio vs Rival y Desglose por Mitades
      try {
        const compBarsImg = drawStatsComparisonAndHalvesCanvas({
          events,
          homeTeamName: safeTeamName,
          awayTeamName: rivalName,
          isEn,
          width: 660,
          height: 240
        });
        if (compBarsImg) {
          const cW = pageW - 28;
          const cH = (240 / 660) * cW; // ~66 mm
          doc.addImage(compBarsImg, 'PNG', 14, y, cW, cH);
          y += cH + 8;
        }
      } catch (cErr) {
        console.warn('[matchPdfReport] Error generando comp bars chart:', cErr);
      }

      // Métricas auxiliares para tablas
      const countOf = (t) => events.filter((e) => e && e.type === t).length;
      const duelsWon = countOf('duel_won');
      const duelsLost = countOf('duel_lost');
      const shotsOn = countOf('shot_on_target_own');
      const shotsOff = countOf('shot_off_target_own');
      const shotsOnRival = countOf('shot_on_target_rival');
      const shotsOffRival = countOf('shot_off_target_rival');
      const goalsOwn = countOf('gol_local') + countOf('goal_own');
      const goalsRival = countOf('gol_rival') + countOf('goal_rival');
      const rec = countOf('recovery');
      const loss = countOf('loss');
      const totalPoss = rec + loss;
      const possPct = totalPoss > 0 ? Math.round((rec / totalPoss) * 100) : 50;
      const cornersFavor = countOf('corner_favor');
      const cornersAgainst = countOf('corner_against');
      const foulsFavor = countOf('foul_favor');
      const foulsAgainst = countOf('foul_against');
      const counterNotCut = countOf('counter_not_cut');
      const playerNoFinish = countOf('player_no_finish');
      const offsidesOwn = countOf('offside_own');
      const offsidesRival = countOf('offside_rival');
      const yellowOwn = countOf('card_yellow_own') + countOf('amarilla');
      const yellowRival = countOf('card_yellow_rival');
      const redOwn = countOf('card_red_own') + countOf('roja');
      const redRival = countOf('card_red_rival');

      // 9. Detalle Estadístico por Categorías Tácticas (Remates, Defensa, Faltas, Disciplina)
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'OFFICIAL CATEGORIZED BREAKDOWN' : 'DETALLE OFICIAL POR CATEGORÍAS TÁCTICAS', 14, y);
      y += 5;

      const catTableData = isEn ? [
        ['Tactical Category', 'Key Performance Metrics', 'Match Counts'],
        ['Shots & Finishing', 'Shots on Target (Own / Opp.) | Off Target | Total Shots | Goals', `${shotsOn} - ${shotsOnRival} | ${shotsOff} - ${shotsOffRival} | ${shotsOn + shotsOff} - ${shotsOnRival + shotsOffRival} | ${goalsOwn} - ${goalsRival}`],
        ['Defense & Possession', 'Ball Recoveries | Losses | Duels Won / Lost | Est. Possession', `${rec} | ${loss} | ${duelsWon} / ${duelsLost} | ${possPct}% - ${100 - possPct}%`],
        ['Fouls & Transitions', 'Fouls (In Favor / Against) | Uncut Counters | Unfinished Plays', `${foulsFavor} / ${foulsAgainst} | ${counterNotCut} | ${playerNoFinish}`],
        ['Set Pieces & Discipline', 'Corner Kicks (Favor / Against) | Offsides (Own / Opp.) | Yellow / Red Cards', `${cornersFavor} / ${cornersAgainst} | ${offsidesOwn} / ${offsidesRival} | Y: ${yellowOwn} / R: ${redOwn}`]
      ] : [
        ['Categoría Táctica', 'Métricas Clave de Rendimiento', 'Registros Oficiales'],
        ['Remates y Finalización', 'Tiros a Puerta (Propio / Rival) | Tiros Fuera | Total Remates | Goles', `${shotsOn} - ${shotsOnRival} | ${shotsOff} - ${shotsOffRival} | ${shotsOn + shotsOff} - ${shotsOnRival + shotsOffRival} | ${goalsOwn} - ${goalsRival}`],
        ['Defensa y Posesión', 'Recuperaciones de Balón | Pérdidas | Duelos Ganados / Perdidos | Posesión', `${rec} | ${loss} | ${duelsWon} / ${duelsLost} | ${possPct}% - ${100 - possPct}%`],
        ['Faltas y Transiciones', 'Faltas (A Favor / En Contra) | Contras no Cortadas | Jugadas sin Finalizar', `${foulsFavor} / ${foulsAgainst} | ${counterNotCut} | ${playerNoFinish}`],
        ['Balón Parado y Disciplina', 'Córners (A Favor / En Contra) | Fueras de Juego (Propio / Rival) | Tarjetas', `${cornersFavor} / ${cornersAgainst} | ${offsidesOwn} / ${offsidesRival} | Amar.: ${yellowOwn} / Rojas: ${redOwn}`]
      ];

      autoTable(doc, {
        startY: y,
        head: [catTableData[0]],
        body: catTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.6 },
        columnStyles: {
          0: { fontStyle: 'bold', width: 44, textColor: colorPrimary },
          1: { width: 88, textColor: [71, 85, 105] },
          2: { fontStyle: 'bold', halign: 'right' }
        }
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 35) + 8;

      // 10. Tabla Comparativa Cara a Cara
      if (y + 55 > pageH - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'HEAD-TO-HEAD STATISTICAL COMPARISON' : 'COMPARATIVA ESTADÍSTICA PROPIO VS RIVAL', 14, y);
      y += 5;

      const compData = isEn ? [
        ['Comparative Metric', safeTeamName, rivalName],
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
        ['Métrica Comparativa', safeTeamName, rivalName],
        ['Tiros Totales', `${shotsOn + shotsOff}`, `${shotsOnRival + shotsOffRival}`],
        ['Tiros a Puerta', `${shotsOn}`, `${shotsOnRival}`],
        ['Tiros Fuera', `${shotsOff}`, `${shotsOffRival}`],
        ['Córners', `${cornersFavor}`, `${cornersAgainst}`],
        ['Faltas cometidas', `${foulsAgainst}`, `${foulsFavor}`],
        ['Fueras de Juego', `${offsidesOwn}`, `${offsidesRival}`],
        ['Tarjetas Amarillas', `${yellowOwn}`, `${yellowRival}`],
        ['Tarjetas Rojas', `${redOwn}`, `${redRival}`],
        ['Posesión Estimada', `${possPct}%`, `${100 - possPct}%`],
      ];

      autoTable(doc, {
        startY: y,
        head: [compData[0]],
        body: compData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.4 },
        columnStyles: { 0: { fontStyle: 'bold', width: 65 } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 45) + 8;

      // ── PÁGINA 5: CUESTIONARIO TÁCTICO, NOTAS Y FOTOGRAFÍAS ──
      doc.addPage();
      y = 20;

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'TACTICAL NOTES AND COACH QUESTIONNAIRE' : 'NOTAS TÁCTICAS Y CUESTIONARIO DEL ENTRENADOR', 14, y);
      y += 5;

      const questionsList = isEn ? [
        { label: 'General Tactical Notes', text: cleanPdfText(matchData.notes || 'No notes recorded') },
        { label: 'Key Tactical Aspects', text: cleanPdfText(matchData.postMatchAnswers?.tactical || 'No answer') },
        { label: 'Physical and Mental Aspects', text: cleanPdfText(matchData.postMatchAnswers?.physical || 'No answer') },
        { label: 'Training Improvement Points', text: cleanPdfText(matchData.postMatchAnswers?.improvement || 'No answer') },
        { label: 'Highlighted Players and MVP', text: cleanPdfText(matchData.postMatchAnswers?.highlights || 'No answer') },
      ] : [
        { label: 'Notas Tácticas Generales', text: cleanPdfText(matchData.notes || 'Sin notas registradas') },
        { label: 'Aspectos Tácticos Clave', text: cleanPdfText(matchData.postMatchAnswers?.tactical || 'Sin respuesta') },
        { label: 'Aspectos Físicos y Mentales', text: cleanPdfText(matchData.postMatchAnswers?.physical || 'Sin respuesta') },
        { label: 'Puntos de Mejora para Entrenamientos', text: cleanPdfText(matchData.postMatchAnswers?.improvement || 'Sin respuesta') },
        { label: 'Jugadores Destacados y MVP', text: cleanPdfText(matchData.postMatchAnswers?.highlights || 'Sin respuesta') },
      ];

      const qRows = questionsList.map((q) => [q.label, q.text]);

      autoTable(doc, {
        startY: y,
        body: qRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 60, textColor: colorPrimary } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 8;

      // Fotografías Registradas Post-Partido
      const rawPostImages = matchData.postMatchImages || (matchData.postMatchPhoto ? [matchData.postMatchPhoto] : []);
      const postImagesB64 = [];
      for (let imgUrl of rawPostImages) {
        if (!imgUrl) continue;
        if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
          postImagesB64.push(imgUrl);
        } else {
          try {
            const b64 = await imageUrlToBase64(imgUrl);
            if (b64) postImagesB64.push(b64);
          } catch (errImg) {
            console.warn('Could not convert post-match image:', errImg);
          }
        }
      }

      if (postImagesB64.length > 0) {
        if (y + 55 > pageH - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'POST-MATCH PHOTOGRAPHS' : 'FOTOGRAFÍAS REGISTRADAS DEL POST-PARTIDO', 14, y);
        y += 5;

        for (let imgB64 of postImagesB64) {
          if (!imgB64) continue;
          try {
            if (y + 70 > pageH - 20) {
              doc.addPage();
              y = 20;
            }
            doc.addImage(imgB64, 'JPEG', 14, y, 100, 65);
            y += 70;
          } catch (errImg) {
            try {
              if (y + 70 > pageH - 20) {
                doc.addPage();
                y = 20;
              }
              doc.addImage(imgB64, 'PNG', 14, y, 100, 65);
              y += 70;
            } catch (e) {
              console.warn('Could not add post-match image to PDF:', e);
            }
          }
        }
      }

      // ── PÁGINA 6: CRONOLOGÍA DETALLADA DE EVENTOS ──
      doc.addPage();

      doc.setFillColor(...colorPrimary);
      doc.rect(0, 0, pageW, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(isEn ? 'DETAILED TIMELINE OF EVENTS' : 'CRONOLOGÍA DETALLADA DE EVENTOS (TIEMPO REAL)', 14, 13);

      const sortedEvents = [...events].sort((a, b) => {
        if (a.half !== b.half) return (a.half || 1) - (b.half || 1);
        return (a.minute || 0) - (b.minute || 0);
      });

      const timelineRows = sortedEvents.map((e, idx) => {
        const halfLabel = e.half === 2 || Number(e.minute) > 45
          ? (isEn ? '2nd Half' : '2T')
          : (isEn ? '1st Half' : '1T');
        const minStr = `${e.minute || 1}'`;
        const evDesc = formatEventText(e.type, isEn);

        return [
          `${idx + 1}`,
          minStr,
          halfLabel,
          evDesc
        ];
      });

      if (timelineRows.length === 0) {
        timelineRows.push(['-', '-', '-', isEn ? 'No live events recorded' : 'No hay eventos registrados en vivo']);
      }

      autoTable(doc, {
        startY: 26,
        head: [isEn ? ['#', 'Minute', 'Half', 'Registered Event'] : ['#', 'Minuto', 'Mitad', 'Evento Registrado']],
        body: timelineRows,
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.8 },
        columnStyles: {
          0: { width: 10, halign: 'center' },
          1: { width: 18, halign: 'center', fontStyle: 'bold' },
          2: { width: 18, halign: 'center' },
          3: { fontStyle: 'bold' }
        }
      });
    }

    // Pie de página unificado en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, pageW, pageH, i, totalPages);
    }

    // Guardar PDF
    const safeTitle = (matchData?.rival || (isEn ? 'Match' : 'Partido')).replace(/[^a-zA-Z0-9]/g, '_');
    let prefix = 'Informe_Total_PostPartido';
    if (isActaMode) prefix = isEn ? 'Official_Match_Sheet' : 'Acta_Oficial_Partido';
    else if (isLiveMode) prefix = isEn ? 'LiveStats_Report' : 'Informe_LiveStats';

    const filename = `${prefix}_${safeTitle}_${Date.now()}.pdf`;
    await savePdfUniversal(doc, filename);
  } catch (err) {
    console.error('Error al generar el informe PDF:', err);
    alert(isEn ? 'Error generating PDF report. Please try again.' : 'Error al generar el PDF del informe. Intenta nuevamente.');
  } finally {
    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
  }
};
