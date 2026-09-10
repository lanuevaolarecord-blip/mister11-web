import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage } from '../i18n/translations';
import { getUnifiedMatchEvents, calculateMinutesFromEvents, getEffectiveMatchDuration } from './minutesEngine';
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
  save_own: 'Parada portero (Propio)',
  save_rival: 'Parada portero (Rival)',
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
  save: 'Parada portero',
  conceded: 'Gol encajado',
  penaltySave: 'Penalti parado',
  claim: 'Salida aérea / Despeje',
  errorGoal: 'Error que causa gol',
};

const EVENT_NAMES_EN = {
  shot_on_target_own: 'Shot on target (Own)',
  shot_on_target_rival: 'Shot on target (Opponent)',
  shot_off_target_own: 'Shot off target (Own)',
  shot_off_target_rival: 'Shot off target (Opponent)',
  save_own: 'Goalkeeper Save (Own)',
  save_rival: 'Goalkeeper Save (Opponent)',
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
  save: 'Goalkeeper Save',
  conceded: 'Goal Conceded',
  penaltySave: 'Penalty Saved',
  claim: 'Aerial Claim / Punch',
  errorGoal: 'Error leading to goal',
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

  // Unificar eventos para garantizar datos completos bajo cualquier modo
  const rawEvents = (Array.isArray(events) && events.length > 0)
    ? events.filter(Boolean)
    : getUnifiedMatchEvents(matchData);
  const safeEvents = Array.isArray(rawEvents) ? rawEvents : [];

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
    const durationMin = getEffectiveMatchDuration(matchData) || matchData.actaOficial?.totalDuration || matchData.duration || 90;
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

    const unifiedMatchEvents = getUnifiedMatchEvents({
      ...matchData,
      events: safeEvents,
      liveStatsEvents: safeEvents
    });

    const squadRoster = allCalledIds.map((pid) => {
      const pObj = players.find((pl) => String(pl.id) === String(pid)) || { name: 'Jugador', number: '-' };
      const actual = actualMap[pid] || {};
      const isStarter = titularesIds.includes(String(pid));
      const statusKey = actual.status || (isStarter ? 'presente' : 'sin_registro');
      const isManual = actual.minutesOverride !== undefined && actual.minutesOverride !== null && actual.minutesOverride !== '';

      let minutesVal = null;
      // 1) Prioridad: Override manual del míster en el acta
      if (isManual) {
        const parsed = parseInt(actual.minutesOverride, 10);
        if (!isNaN(parsed)) minutesVal = parsed;
      }

      // 2) Si no hay override manual, calcular con el motor canónico exacto como en el Acta de la app
      if (minutesVal === null) {
        if (typeof actual.minutes === 'number' && actual.minutes > 0 && matchData.actaOficial?.closed) {
          minutesVal = actual.minutes;
        } else {
          const computed = calculateMinutesFromEvents(
            pid,
            unifiedMatchEvents,
            titularesIds,
            suplentesIds,
            durationMin,
            null,
            statusKey,
            actual.lateMin ?? null,
            matchData.tarjetasList || []
          );
          minutesVal = computed.minutes;
        }
      }

      if (typeof minutesVal !== 'number' || isNaN(minutesVal)) {
        minutesVal = isStarter ? durationMin : 0;
      }

      const ratingVal = actual.rating ?? matchData?.playerRatings?.[pid] ?? matchData?.ratings?.[pid] ?? '-';

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

      // 3.5 Rendimiento de Portería (Acta Oficial)
      const gkRosterActa = squadRoster.filter(r => (r.position === 'POR' || r.role === 'POR' || r.position === 'GK') && (parseInt(r.minutes, 10) > 0 || r.minutes > 0));
      if (gkRosterActa.length > 0) {
        if (y + 35 > pageH - 35) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'GOALKEEPING PERFORMANCE' : 'RENDIMIENTO DE PORTERÍA', 14, y);
        y += 5;

        const gkHead = isEn
          ? [['#', 'Goalkeeper', 'Minutes', 'Saves', 'Conceded', 'Save %', 'Clean Sheet', 'Pen. Saved', 'Claims', 'Rating']]
          : [['#', 'Portero', 'Minutos', 'Paradas', 'Encajados', '% Paradas', 'Imbatibilidad', 'Pen. Parados', 'Salidas', 'Nota']];

        const gkBody = gkRosterActa.map(r => {
          const pEvts = safeEvents.filter(e => e && String(e.playerId) === String(r.pid));
          const saves = pEvts.filter(e => e.type === 'save' || e.type === 'save_own').length;
          const conceded = pEvts.filter(e => e.type === 'conceded').length;
          const penSaves = pEvts.filter(e => e.type === 'penaltySave').length;
          const claims = pEvts.filter(e => e.type === 'claim').length;
          const total = saves + conceded;
          const savePct = total > 0 ? `${Math.round((saves / total) * 100)}%` : '-';
          const cleanSheet = conceded === 0 ? (isEn ? 'Yes' : 'Sí') : 'No';

          return [
            r.number,
            r.name,
            `${r.minutes}'`,
            String(saves),
            String(conceded),
            savePct,
            cleanSheet,
            String(penSaves),
            String(claims),
            String(r.rating || '-')
          ];
        });

        autoTable(doc, {
          startY: y,
          head: gkHead,
          body: gkBody,
          theme: 'striped',
          headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
          styles: { fontSize: 7.2, cellPadding: 2, halign: 'center' },
          columnStyles: {
            0: { width: 8 },
            1: { halign: 'left', fontStyle: 'bold', width: 34 }
          }
        });

        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 25) + 8;
      }

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

    } else {
      // ── B) MODO INFORME TOTAL POST-PARTIDO (PÁGINA 1: RESUMEN GENERAL) ────
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

        // Resumen de Portería para Modo Partido / Live Stats
        const gkRosterPost = squadRoster.filter(r => (r.position === 'POR' || r.role === 'POR' || r.position === 'GK') && (parseInt(r.minutes, 10) > 0 || r.minutes > 0));
        if (gkRosterPost.length > 0) {
          if (y + 35 > pageH - 35) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorPrimary);
          doc.text(isEn ? 'GOALKEEPING PERFORMANCE' : 'RENDIMIENTO DE PORTERÍA', 14, y);
          y += 5;

          const gkHead = isEn
            ? [['#', 'Goalkeeper', 'Minutes', 'Saves', 'Conceded', 'Save %', 'Clean Sheet', 'Pen. Saved', 'Claims', 'Rating']]
            : [['#', 'Portero', 'Minutos', 'Paradas', 'Encajados', '% Paradas', 'Imbatibilidad', 'Pen. Parados', 'Salidas', 'Nota']];

          const gkBody = gkRosterPost.map(r => {
            const pEvts = safeEvents.filter(e => e && String(e.playerId) === String(r.pid));
            const saves = pEvts.filter(e => e.type === 'save' || e.type === 'save_own').length;
            const conceded = pEvts.filter(e => e.type === 'conceded').length;
            const penSaves = pEvts.filter(e => e.type === 'penaltySave').length;
            const claims = pEvts.filter(e => e.type === 'claim').length;
            const total = saves + conceded;
            const savePct = total > 0 ? `${Math.round((saves / total) * 100)}%` : '-';
            const cleanSheet = conceded === 0 ? (isEn ? 'Yes' : 'Sí') : 'No';

            return [
              r.number,
              r.name,
              `${r.minutes}'`,
              String(saves),
              String(conceded),
              savePct,
              cleanSheet,
              String(penSaves),
              String(claims),
              String(r.rating || '-')
            ];
          });

          autoTable(doc, {
            startY: y,
            head: gkHead,
            body: gkBody,
            theme: 'striped',
            headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
            styles: { fontSize: 7.2, cellPadding: 2, halign: 'center' },
            columnStyles: {
              0: { width: 8 },
              1: { halign: 'left', fontStyle: 'bold', width: 34 }
            }
          });

          y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 25) + 8;
        }
      }
    }

    // ── SUITE TÁCTICA Y RESUMEN DEL PARTIDO (UNIFICADA PARA AMBOS MODOS) ───────
    // ── PÁGINA 2: ALINEACIÓN TÁCTICA Y RADAR COMPARATIVO OFICIAL ──
    doc.addPage();
    y = 20;

    if (isActaMode) {
      doc.setFillColor(...colorPrimary);
      doc.roundedRect(14, y, pageW - 28, 12, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(
        isEn ? 'OFFICIAL ANNEX: TACTICAL STATS & MATCH REPORT' : 'ANEXO OFICIAL: ESTADÍSTICAS TÁCTICAS Y RENDIMIENTO',
        pageW / 2,
        y + 8,
        { align: 'center' }
      );
      y += 18;
    }

    // 1. Alineación Táctica Oficial (Terreno de juego oficial con Titulares y Suplentes)
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
      doc.text(isEn ? 'OFFICIAL TACTICAL LINEUP & SQUAD BENCH' : 'ALINEACIÓN TÁCTICA INICIAL Y SUPLENTES', 14, y);
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

    // 2. Radar Táctico Oficial (6 Ejes Comparativos)
    try {
      const radarImg = drawMatchRadarChartCanvas({
        events: safeEvents,
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

    // ── PÁGINA 3: RESUMEN DEL PARTIDO (DONUTS, SECTORES, MOMENTUM Y EFICIENCIA) ──
    doc.addPage();
    y = 20;

    // Header Principal de Resumen del Partido
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'MATCH SUMMARY: TACTICAL EFFICIENCY & OFFICIAL CHARTS' : 'RESUMEN DEL PARTIDO: EFICIENCIA TÁCTICA Y GRÁFICAS OFICIALES', 14, y);
    y += 6;

    // 3. Gráficas Donut de Eficiencia Táctica (4 Donas vectoriales)
    try {
      const donutsImg = drawPostMatchDonutsCanvas({ events: safeEvents, isEn, width: 660, height: 190 });
      if (donutsImg) {
        const dW = pageW - 28;
        const dH = (190 / 660) * dW; // ~52 mm
        doc.addImage(donutsImg, 'PNG', 14, y, dW, dH);
        y += dH + 6;
      }
    } catch (donutsErr) {
      console.warn('[matchPdfReport] Error generando donas chart:', donutsErr);
    }

    // 4. Distribución Táctica por Sectores (Banda Izquierda, Pasillo Central, Banda Derecha)
    try {
      const sectorsImg = drawSectorsDistributionCanvas({ events: safeEvents, isEn, width: 660, height: 80 });
      if (sectorsImg) {
        const sW = pageW - 28;
        const sH = (80 / 660) * sW; // ~22 mm
        doc.addImage(sectorsImg, 'PNG', 14, y, sW, sH);
        y += sH + 6;
      }
    } catch (secErr) {
      console.warn('[matchPdfReport] Error generando sectors chart:', secErr);
    }

    // 5. Gráfica de Momentum Táctico y Dinámica del Partido (Canvas HD)
    try {
      const momentumImg = drawMomentumChartCanvas(safeEvents, durationMin || 90, 640, 180, isEn);
      if (momentumImg) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'TACTICAL MOMENTUM & MATCH DYNAMICS' : 'MOMENTUM TÁCTICO Y DINÁMICA DEL PARTIDO', 14, y);
        y += 4.5;

        const momW = pageW - 28;
        const momH = (180 / 640) * momW; // ~51 mm
        doc.addImage(momentumImg, 'PNG', 14, y, momW, momH);
        y += momH + 6;
      }
    } catch (chartErr) {
      console.warn('[matchPdfReport] Error generando momentum chart:', chartErr);
    }

    // 6. Métricas auxiliares y Tabla de Eficiencia Táctica
    const countOfSafe = (types) => {
      const arr = Array.isArray(types) ? types : [types];
      return safeEvents.filter((e) => e && arr.includes(e.type)).length;
    };
    const duelsWonVal = countOfSafe(['duel_won', 'duelo_ganado']);
    const duelsLostVal = countOfSafe(['duel_lost', 'duelo_perdido']);
    const totalDuelsVal = duelsWonVal + duelsLostVal;
    const duelsPctVal = totalDuelsVal > 0 ? Math.round((duelsWonVal / totalDuelsVal) * 100) : 0;

    const shotsOnVal = countOfSafe(['shot_on_target_own', 'shot_on_target', 'tiro_puerta']);
    const shotsOffVal = countOfSafe(['shot_off_target_own', 'shot_off_target', 'tiro_fuera']);
    const totalShotsVal = shotsOnVal + shotsOffVal;
    const shotsPctVal = totalShotsVal > 0 ? Math.round((shotsOnVal / totalShotsVal) * 100) : 0;

    const recVal = countOfSafe(['recovery', 'recuperacion']);
    const lossVal = countOfSafe(['loss', 'ball_loss', 'perdida']);
    const totalPossVal = recVal + lossVal;
    const possPctVal = totalPossVal > 0 ? Math.round((recVal / totalPossVal) * 100) : 50;

    const effTableData = isEn ? [
      ['Tactical Metric', 'Positive Events', 'Negative Events', '% Efficiency'],
      ['Individual Duels', `${duelsWonVal} Won`, `${duelsLostVal} Lost`, `${duelsPctVal}% Success`],
      ['Shots Accuracy', `${shotsOnVal} On Target`, `${shotsOffVal} Off Target`, `${shotsPctVal}% On Target`],
      ['Ball Balance', `${recVal} Recoveries`, `${lossVal} Losses`, `${possPctVal}% Retention`],
    ] : [
      ['Métrica Táctica', 'Eventos Positivos', 'Eventos Negativos', '% Eficiencia'],
      ['Duelos individuales', `${duelsWonVal} Ganados`, `${duelsLostVal} Perdidos`, `${duelsPctVal}% Éxito`],
      ['Precisión de Tiro', `${shotsOnVal} a Puerta`, `${shotsOffVal} Fuera`, `${shotsPctVal}% Puerta`],
      ['Balance de Balón', `${recVal} Recuperaciones`, `${lossVal} Pérdidas`, `${possPctVal}% Retención`],
    ];

    autoTable(doc, {
      startY: y,
      head: [effTableData[0]],
      body: effTableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.8 },
      styles: { fontSize: 7.5, cellPadding: 2.2 },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 25) + 6;

    // ── PÁGINA 4: BARRAS COMPARATIVAS, MITADES Y DETALLE POR CATEGORÍAS ──
    doc.addPage();
    y = 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'HEAD-TO-HEAD COMPARISON & HALF BREAKDOWN' : 'COMPARATIVA DIRECTA Y RENDIMIENTO POR MITADES', 14, y);
    y += 6;

    // 7. Barras Comparativas Propio vs Rival y Desglose por Mitades
    try {
      const compBarsImg = drawStatsComparisonAndHalvesCanvas({
        events: safeEvents,
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

    // Métricas auxiliares para tablas comparativas
    const shotsOnRival = countOfSafe(['shot_on_target_rival']);
    const shotsOffRival = countOfSafe(['shot_off_target_rival']);
    const goalsOwn = countOfSafe(['gol_local', 'goal_own', 'gol']);
    const goalsRival = countOfSafe(['gol_rival', 'goal_rival']);
    const cornersFavor = countOfSafe(['corner_favor', 'corner_own']);
    const cornersAgainst = countOfSafe(['corner_against', 'corner_rival']);
    const foulsFavor = countOfSafe(['foul_favor', 'falta_favor']);
    const foulsAgainst = countOfSafe(['foul_against', 'falta_contra', 'foul']);
    const counterNotCut = countOfSafe(['counter_not_cut']);
    const playerNoFinish = countOfSafe(['player_no_finish']);
    const offsidesOwn = countOfSafe(['offside_own']);
    const offsidesRival = countOfSafe(['offside_rival']);
    const yellowOwn = countOfSafe(['card_yellow_own', 'amarilla', 'yellow_card']);
    const yellowRival = countOfSafe(['card_yellow_rival']);
    const redOwn = countOfSafe(['card_red_own', 'roja', 'red_card']);
    const redRival = countOfSafe(['card_red_rival']);

    // 8. Detalle Estadístico por Categorías Tácticas (Remates, Defensa, Faltas, Disciplina)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'OFFICIAL CATEGORIZED BREAKDOWN' : 'DETALLE OFICIAL POR CATEGORÍAS TÁCTICAS', 14, y);
    y += 5;

    const catTableData = isEn ? [
      ['Tactical Category', 'Key Performance Metrics', 'Match Counts'],
      ['Shots & Finishing', 'Shots on Target (Own / Opp.) | Off Target | Total Shots | Goals', `${shotsOnVal} - ${shotsOnRival} | ${shotsOffVal} - ${shotsOffRival} | ${shotsOnVal + shotsOffVal} - ${shotsOnRival + shotsOffRival} | ${goalsOwn} - ${goalsRival}`],
      ['Defense & Possession', 'Ball Recoveries | Losses | Duels Won / Lost | Est. Possession', `${recVal} | ${lossVal} | ${duelsWonVal} / ${duelsLostVal} | ${possPctVal}% - ${100 - possPctVal}%`],
      ['Fouls & Transitions', 'Fouls (In Favor / Against) | Uncut Counters | Unfinished Plays', `${foulsFavor} / ${foulsAgainst} | ${counterNotCut} | ${playerNoFinish}`],
      ['Set Pieces & Discipline', 'Corner Kicks (Favor / Against) | Offsides (Own / Opp.) | Yellow / Red Cards', `${cornersFavor} / ${cornersAgainst} | ${offsidesOwn} / ${offsidesRival} | Y: ${yellowOwn} / R: ${redOwn}`]
    ] : [
      ['Categoría Táctica', 'Métricas Clave de Rendimiento', 'Registros Oficiales'],
      ['Remates y Finalización', 'Tiros a Puerta (Propio / Rival) | Tiros Fuera | Total Remates | Goles', `${shotsOnVal} - ${shotsOnRival} | ${shotsOffVal} - ${shotsOffRival} | ${shotsOnVal + shotsOffVal} - ${shotsOnRival + shotsOffRival} | ${goalsOwn} - ${goalsRival}`],
      ['Defensa y Posesión', 'Recuperaciones de Balón | Pérdidas | Duelos Ganados / Perdidos | Posesión', `${recVal} | ${lossVal} | ${duelsWonVal} / ${duelsLostVal} | ${possPctVal}% - ${100 - possPctVal}%`],
      ['Faltas y Transiciones', 'Faltas (A Favor / En Contra) | Contras no Cortadas | Jugadas sin Finalizar', `${foulsFavor} / ${foulsAgainst} | ${counterNotCut} | ${playerNoFinish}`],
      ['Balón Parado y Disciplina', 'Córners (A Favor / En Contra) | Fueras de Juego (Propio / Rival) | Tarjetas', `${cornersFavor} / ${cornersAgainst} | ${offsidesOwn} / ${offsidesRival} | Amar.: ${yellowOwn} / Rojas: ${redOwn}`]
    ];

    autoTable(doc, {
      startY: y,
      head: [catTableData[0]],
      body: catTableData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.8 },
      styles: { fontSize: 7.2, cellPadding: 2.4 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 44, textColor: colorPrimary },
        1: { width: 88, textColor: [71, 85, 105] },
        2: { fontStyle: 'bold', halign: 'right' }
      }
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 35) + 6;

    // 9. Tabla Comparativa Cara a Cara
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimary);
    doc.text(isEn ? 'HEAD-TO-HEAD STATISTICAL COMPARISON' : 'COMPARATIVA ESTADÍSTICA PROPIO VS RIVAL', 14, y);
    y += 5;

    const compData = isEn ? [
      ['Comparative Metric', safeTeamName, rivalName],
      ['Total Shots', `${shotsOnVal + shotsOffVal}`, `${shotsOnRival + shotsOffRival}`],
      ['Shots on Target', `${shotsOnVal}`, `${shotsOnRival}`],
      ['Shots off Target', `${shotsOffVal}`, `${shotsOffRival}`],
      ['Corner Kicks', `${cornersFavor}`, `${cornersAgainst}`],
      ['Fouls', `${foulsAgainst}`, `${foulsFavor}`],
      ['Offsides', `${offsidesOwn}`, `${offsidesRival}`],
      ['Yellow Cards', `${yellowOwn}`, `${yellowRival}`],
      ['Red Cards', `${redOwn}`, `${redRival}`],
      ['Estimated Possession', `${possPctVal}%`, `${100 - possPctVal}%`],
    ] : [
      ['Métrica Comparativa', safeTeamName, rivalName],
      ['Tiros Totales', `${shotsOnVal + shotsOffVal}`, `${shotsOnRival + shotsOffRival}`],
      ['Tiros a Puerta', `${shotsOnVal}`, `${shotsOnRival}`],
      ['Tiros Fuera', `${shotsOffVal}`, `${shotsOffRival}`],
      ['Córners', `${cornersFavor}`, `${cornersAgainst}`],
      ['Faltas cometidas', `${foulsAgainst}`, `${foulsFavor}`],
      ['Fueras de Juego', `${offsidesOwn}`, `${offsidesRival}`],
      ['Tarjetas Amarillas', `${yellowOwn}`, `${yellowRival}`],
      ['Tarjetas Rojas', `${redOwn}`, `${redRival}`],
      ['Posesión Estimada', `${possPctVal}%`, `${100 - possPctVal}%`],
    ];

    autoTable(doc, {
      startY: y,
      head: [compData[0]],
      body: compData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.8 },
      styles: { fontSize: 7.2, cellPadding: 2.2 },
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

      const sortedEvents = [...safeEvents].sort((a, b) => {
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
