import { savePdfUniversal } from './pdfGenerator';
import { getEffectiveLanguage, t as i18nT } from '../i18n/translations';
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
  drawGkExertionCanvas,
  drawShotMapCanvas,
  cleanPdfText,
  PDF_COLORS
} from './pdfTheme';
import { calculateMatchDerivedIndices } from '../config/xgWeights';
import { evaluateSwotRules } from './swotRules';
import { CANONICAL_REPORT_SECTIONS } from './reportSections';
import { rasterizeSvgToDataUrl } from '../components/canonical/rasterizeSvg';
import { renderMomentumSvgString } from '../components/canonical/MomentumSVG';
import { renderComparisonBarsSvgString } from '../components/canonical/ComparisonBarsSVG';
import { renderRadarCompareSvgString } from '../components/canonical/RadarCompareSVG';
import { renderShotMapSvgString } from '../components/canonical/ShotMapSVG';
import { renderSectorTacticsSvgString } from '../components/canonical/SectorTacticsSVG';
import { calculateCanonicalStats } from '../components/canonical/calculateCanonicalStats';
import { getMatchAnalytics } from './matchAnalytics';

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

    // Eventos de gol propios y rivales
    const ownGoalEvents = safeEvents.filter(e => e && (
      e.type === 'gol_local' || e.type === 'goal_own' ||
      (String(e.type || '').includes('own') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol'))
    ));
    const rivalGoalEvents = safeEvents.filter(e => e && (
      e.type === 'gol_rival' || e.type === 'goal_rival' ||
      (String(e.type || '').includes('rival') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol'))
    ));

    const goalsFor = ownGoalEvents.length > 0
      ? ownGoalEvents.length
      : (matchData?.goalsFor ?? matchData?.golesLocal ?? 0);
    const goalsAgainst = rivalGoalEvents.length > 0
      ? rivalGoalEvents.length
      : (matchData?.goalsAgainst ?? matchData?.golesVisita ?? 0);

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

    // Subtítulo con Metadatos del Encuentro (sin artefactos de corchetes e.g. "BURRIANA B vs Xilxes (visitante)")
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const timeStr = matchData?.time ? ` ${matchData.time}` : '';
    const matchTypeClean = matchData?.type ? cleanPdfText(matchData.type) : '';
    const matchTypeStr = matchTypeClean ? ` (${matchTypeClean})` : '';
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

    // Cálculo y selección de MVP transparente: solo entre jugadores con estadísticas atribuidas
    let mvpStr = cleanPdfText(matchData.mvp || '');
    if (!mvpStr) {
      const candidates = (Array.isArray(players) ? players : []).map((pl) => {
        const pEvts = safeEvents.filter((e) => e && String(e.playerId || e.jugadorId) === String(pl.id));
        const goals = pEvts.filter((e) => e.type === 'gol_local' || e.type === 'goal_own' || e.outcome === 'goal').length;
        const saves = pEvts.filter((e) => e.type === 'save' || e.type === 'save_own').length;
        const duels = pEvts.filter((e) => e.type === 'duel_won').length;
        const hasStats = (goals + saves + duels) > 0;
        const score = (goals * 4) + (saves * 2) + duels;
        return { name: cleanPdfText(pl.name || pl.nombre || 'Jugador'), score, hasStats };
      }).sort((a, b) => b.score - a.score);

      const topWithStats = candidates.find((c) => c.hasStats && c.score >= 2);
      if (topWithStats) {
        mvpStr = topWithStats.name;
      } else {
        mvpStr = isEn ? 'Not specified' : 'No especificado';
      }
    }

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
        { label: isEn ? 'ROSTER PRESENCE' : 'PRESENCIA DE PLANTILLA', val: `${countPresent + countLate}`, color: [34, 197, 94] },
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

      // 2. Tabla Oficial de la Plantilla con Minutos y Presencia
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorPrimary);
      doc.text(isEn ? 'OFFICIAL ROSTER, MINUTES & PRESENCE RECORD' : 'REGISTRO OFICIAL DE PLANTILLA, PRESENCIA Y MINUTOS', 14, y);
      y += 5;

      const actaTableHead = isEn
        ? [['#', 'Player Name', 'Pos', 'Role', 'Official Presence', 'Minutes', 'Source', 'Rating', 'RSVP']]
        : [['#', 'Jugador', 'Pos', 'Rol', 'Presencia Oficial', 'Minutos', 'Fuente', 'Nota', 'RSVP']];

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

      // Lista completa de anotaciones (propio y rival)
      const allScorersListActa = [];
      if (Array.isArray(matchData.goleadoresList) && matchData.goleadoresList.length > 0) {
        matchData.goleadoresList.forEach((g) => {
          const p = players.find((pl) => String(pl.id) === String(g.jugadorId));
          const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
          const minStr = (g.minuto || g.minute) ? `${g.minuto || g.minute}'` : (isEn ? 's/m' : 's/m');
          allScorersListActa.push(`${pName} (${minStr})`);
        });
      } else if (ownGoalEvents.length > 0) {
        ownGoalEvents.forEach((g) => {
          const p = players.find((pl) => String(pl.id) === String(g.playerId || g.jugadorId));
          const pName = p ? cleanPdfText(p.name || p.nombre) : safeTeamName;
          const minStr = (g.minute || g.minuto) ? `${g.minute || g.minuto}'` : (isEn ? 's/m' : 's/m');
          allScorersListActa.push(`${pName} (${minStr})`);
        });
      }

      if (rivalGoalEvents.length > 0) {
        rivalGoalEvents.forEach((rg) => {
          const minStr = (rg.minute || rg.minuto) ? `${rg.minute || rg.minuto}'` : (isEn ? 's/m' : 's/m');
          allScorersListActa.push(`${rivalName} (${minStr})`);
        });
      } else if (goalsAgainst > 0) {
        allScorersListActa.push(`${rivalName} (${isEn ? 'Goal' : 'Gol'})`);
      }

      let scorersText = '';
      if (allScorersListActa.length > 0) {
        scorersText = allScorersListActa.join(', ');
      } else if (matchData.scorers) {
        scorersText = matchData.scorers;
        if (goalsAgainst > 0 && !scorersText.toLowerCase().includes(rivalName.toLowerCase())) {
          scorersText += `, ${rivalName} (${isEn ? 'Goal' : 'Gol'})`;
        }
      } else {
        scorersText = isEn ? 'None recorded' : 'Ninguno registrado';
      }

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => String(pl.id) === String(t.jugadorId));
            const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
            const tipo = t.tipo === 'amarilla' ? (isEn ? 'Yellow' : 'Amarilla') : (isEn ? 'Red' : 'Roja');
            const minStr = (t.minuto || t.minute) ? `${t.minuto || t.minute}'` : (isEn ? 's/m' : 's/m');
            return `${tipo} - ${pName} (${minStr})`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = isEn ? 'None recorded' : 'Ninguna registrada';

      const allSubsListActa = [];
      if (matchData.cambiosList && matchData.cambiosList.length > 0) {
        matchData.cambiosList.forEach((c) => {
          const pIn = players.find((pl) => String(pl.id) === String(c.entraId || c.inId || c.playerInId));
          const pOut = players.find((pl) => String(pl.id) === String(c.saleId || c.outId || c.playerOutId));
          const nameIn = pIn ? cleanPdfText(pIn.name || pIn.nombre) : (isEn ? 'In' : 'Entra');
          const nameOut = pOut ? cleanPdfText(pOut.name || pOut.nombre) : (isEn ? 'Out' : 'Sale');
          const minStr = (c.minuto || c.minute) ? `${c.minuto || c.minute}'` : (isEn ? 's/m' : 's/m');
          allSubsListActa.push(`Min ${minStr}: ${nameIn} <-> ${nameOut}`);
        });
      }

      const subEventsFromSafe = safeEvents.filter(e => e && (
        e.type === 'cambio' || e.type === 'sustitucion' || e.type === 'substitution' || e.type === 'sub'
      ));
      subEventsFromSafe.forEach(se => {
        const inId = se.subInId || se.jugadorEntraId || se.playerInId || se.inId;
        const outId = se.subOutId || se.jugadorSaleId || se.playerOutId || se.outId;
        const pIn = players.find(pl => String(pl.id) === String(inId));
        const pOut = players.find(pl => String(pl.id) === String(outId));
        const nameIn = pIn ? cleanPdfText(pIn.name || pIn.nombre) : (inId ? `J#${inId}` : (isEn ? 'In' : 'Entra'));
        const nameOut = pOut ? cleanPdfText(pOut.name || pOut.nombre) : (outId ? `J#${outId}` : (isEn ? 'Out' : 'Sale'));
        const minStr = (se.minute || se.minuto) ? `${se.minute || se.minuto}'` : (isEn ? 's/m' : 's/m');
        const entry = `Min ${minStr}: ${nameIn} <-> ${nameOut}`;
        if (!allSubsListActa.includes(entry)) {
          allSubsListActa.push(entry);
        }
      });

      if (allSubsListActa.length === 0) {
        const subsWithMinutes = squadRoster.filter(r => !r.isStarter && (Number(r.minutes) > 0));
        if (subsWithMinutes.length > 0) {
          subsWithMinutes.forEach(s => {
            const entryMin = Math.max(1, durationMin - Number(s.minutes));
            allSubsListActa.push(`Min ${entryMin}': ${isEn ? 'Sub In' : 'Entra'} ${s.name} (${s.minutes}' ${isEn ? 'played' : 'jugados'})`);
          });
        }
      }

      let subsText = allSubsListActa.length > 0
        ? allSubsListActa.join(' | ')
        : (isEn ? 'No substitutions recorded' : 'Sin sustituciones registradas');

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
          let conceded = pEvts.filter(e => e.type === 'conceded').length;

          // Derivación fiel: si el rival marcó goles y el portero estuvo en campo, registrar encajados
          if (conceded === 0 && goalsAgainst > 0) {
            conceded = goalsAgainst;
          }

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
      // ── B) MODO INFORME TOTAL POST-PARTIDO: 11 SECCIONES CANÓNICAS ─────────
      const effLangKey = isEn ? 'en' : 'es';
      const drawSectionHeader = (secId, yOffset = 0) => {
        const secDef = CANONICAL_REPORT_SECTIONS.find((s) => s.id === secId);
        const title = secDef ? i18nT(secDef.titleKey, effLang) : secId;
        doc.setFillColor(...colorPrimary);
        doc.roundedRect(14, y + yOffset, pageW - 28, 8, 1.5, 1.5, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(cleanPdfText(title), 18, y + yOffset + 5.5);
        return y + yOffset + 12;
      };

      const analytics = getMatchAnalytics(matchData, safeEvents, { isEn });
      const derivedIndices = calculateMatchDerivedIndices(safeEvents);
      const swotResult = evaluateSwotRules(matchData, safeEvents, calledPlayers);
      const { homeStats, awayStats, tacticsData } = analytics;
      const shotEvents = analytics.shots.all;

      // Función de aserción estricta: si una sección gráfica obligatoria queda en blanco, FALLAR PDF
      let embeddedGraphicsCount = 0;
      const assertGraphicEmbedded = (secId, dataUrl, minBytes = 1000) => {
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length < minBytes) {
          throw new Error(
            `[PDF GENERATION CRITICAL ERROR] La sección gráfica obligatoria '${secId}' falló al rasterizar o quedó en blanco (bytes: ${dataUrl?.length || 0}). La generación del PDF ha sido cancelada para evitar entregar un informe incompleto.`
          );
        }
        embeddedGraphicsCount++;
      };

      // ── PÁGINA 1: SECCIÓN 1 — ALINEACIÓN TÁCTICA CON FOTOGRAFÍAS Y SUPLENTES ──
      y = drawSectionHeader('sec1_lineup');
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

      assertGraphicEmbedded('sec1_lineup', effectiveLineupImage);
      const pitchW = 142;
      const pitchH = (510 / 720) * pitchW; // ~100.5mm
      const pitchX = (pageW - pitchW) / 2;
      doc.addImage(effectiveLineupImage, 'PNG', pitchX, y, pitchW, pitchH);
      y += pitchH + 4;

      // Suplentes Convocados en el pie de la Página 1
      const subsRoster = squadRoster.filter(r => !r.isStarter);
      if (subsRoster.length > 0 && y < pageH - 24) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'SUBSTITUTES BENCH' : 'BANQUILLO DE SUPLENTES', 14, y);
        y += 3;

        const subHeaders = isEn ? ['#', 'Player Name', 'Pos', 'Minutes', 'Rating'] : ['#', 'Jugador', 'Pos', 'Minutos', 'Nota'];
        const subRows = subsRoster.slice(0, 6).map(s => [
          s.number,
          s.name,
          s.position,
          `${s.minutes}'`,
          s.rating
        ]);

        autoTable(doc, {
          startY: y,
          head: [subHeaders],
          body: subRows,
          theme: 'striped',
          headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.8 },
          styles: { fontSize: 6.8, cellPadding: 1.6 },
          columnStyles: {
            0: { width: 8, halign: 'center' },
            1: { fontStyle: 'bold' },
            2: { width: 14, halign: 'center' },
            3: { width: 16, halign: 'center', fontStyle: 'bold' },
            4: { width: 14, halign: 'center' }
          }
        });
      }

      // ── PÁGINA 2: SECCIÓN 2 & SECCIÓN 3 — CRONOLOGÍA Y MOMENTUM ────────────
      doc.addPage();
      y = 18;

      // 2. Marcador Oficial y Cronología de Eventos
      y = drawSectionHeader('sec2_timeline');

      // Goleadores y anotaciones (propios y rivales con minuto obligatorio)
      const allScorersListPost = [];
      if (Array.isArray(matchData.goleadoresList) && matchData.goleadoresList.length > 0) {
        matchData.goleadoresList.forEach((g) => {
          const p = players.find((pl) => String(pl.id) === String(g.jugadorId));
          const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
          const minStr = (g.minuto || g.minute) ? `${g.minuto || g.minute}'` : (isEn ? 's/m' : 's/m');
          allScorersListPost.push(`${pName} (${minStr})`);
        });
      } else if (ownGoalEvents.length > 0) {
        ownGoalEvents.forEach((g) => {
          const p = players.find((pl) => String(pl.id) === String(g.playerId || g.jugadorId));
          const pName = p ? cleanPdfText(p.name || p.nombre) : safeTeamName;
          const minStr = (g.minute || g.minuto) ? `${g.minute || g.minuto}'` : (isEn ? 's/m' : 's/m');
          allScorersListPost.push(`${pName} (${minStr})`);
        });
      }

      if (rivalGoalEvents.length > 0) {
        rivalGoalEvents.forEach((rg) => {
          const minStr = (rg.minute || rg.minuto) ? `${rg.minute || rg.minuto}'` : (isEn ? 's/m' : 's/m');
          allScorersListPost.push(`${rivalName} (${minStr})`);
        });
      } else if (goalsAgainst > 0) {
        allScorersListPost.push(`${rivalName} (${isEn ? 'Goal' : 'Gol'})`);
      }

      let scorersText = '';
      if (allScorersListPost.length > 0) {
        scorersText = allScorersListPost.join(', ');
      } else if (matchData.scorers) {
        scorersText = matchData.scorers;
        if (goalsAgainst > 0 && !scorersText.toLowerCase().includes(rivalName.toLowerCase())) {
          scorersText += `, ${rivalName} (${isEn ? 'Goal' : 'Gol'})`;
        }
      } else {
        scorersText = isEn ? 'None recorded' : 'Ninguno registrado';
      }

      let cardsText = '';
      if (matchData.tarjetasList && matchData.tarjetasList.length > 0) {
        cardsText = matchData.tarjetasList
          .map((t) => {
            const p = players.find((pl) => String(pl.id) === String(t.jugadorId));
            const pName = p ? cleanPdfText(p.name || p.nombre) : (isEn ? 'Player' : 'Jugador');
            const tipo = t.tipo === 'amarilla' ? (isEn ? 'Yellow' : 'Amarilla') : (isEn ? 'Red' : 'Roja');
            const minStr = (t.minuto || t.minute) ? `${t.minuto || t.minute}'` : (isEn ? 's/m' : 's/m');
            return `${tipo} - ${pName} (${minStr})`;
          })
          .join(', ');
      }
      if (!cardsText) cardsText = isEn ? 'None recorded' : 'Ninguna registrada';

      const allSubsListPost = [];
      if (matchData.cambiosList && matchData.cambiosList.length > 0) {
        matchData.cambiosList.forEach((c) => {
          const pIn = players.find((pl) => String(pl.id) === String(c.entraId || c.inId || c.playerInId));
          const pOut = players.find((pl) => String(pl.id) === String(c.saleId || c.outId || c.playerOutId));
          const nameIn = pIn ? cleanPdfText(pIn.name || pIn.nombre) : (isEn ? 'In' : 'Entra');
          const nameOut = pOut ? cleanPdfText(pOut.name || pOut.nombre) : (isEn ? 'Out' : 'Sale');
          const minStr = (c.minuto || c.minute) ? `${c.minuto || c.minute}'` : (isEn ? 's/m' : 's/m');
          allSubsListPost.push(`Min ${minStr}: ${nameIn} <-> ${nameOut}`);
        });
      }

      const subEvtsPost = safeEvents.filter(e => e && (
        e.type === 'cambio' || e.type === 'sustitucion' || e.type === 'substitution' || e.type === 'sub'
      ));
      subEvtsPost.forEach(se => {
        const inId = se.subInId || se.jugadorEntraId || se.playerInId || se.inId;
        const outId = se.subOutId || se.jugadorSaleId || se.playerOutId || se.outId;
        const pIn = players.find(pl => String(pl.id) === String(inId));
        const pOut = players.find(pl => String(pl.id) === String(outId));
        const nameIn = pIn ? cleanPdfText(pIn.name || pIn.nombre) : (inId ? `J#${inId}` : (isEn ? 'In' : 'Entra'));
        const nameOut = pOut ? cleanPdfText(pOut.name || pOut.nombre) : (outId ? `J#${outId}` : (isEn ? 'Out' : 'Sale'));
        const minStr = (se.minute || se.minuto) ? `${se.minute || se.minuto}'` : (isEn ? 's/m' : 's/m');
        const entry = `Min ${minStr}: ${nameIn} <-> ${nameOut}`;
        if (!allSubsListPost.includes(entry)) {
          allSubsListPost.push(entry);
        }
      });

      if (allSubsListPost.length === 0) {
        const subsWithMinutes = squadRoster.filter(r => !r.isStarter && (Number(r.minutes) > 0));
        if (subsWithMinutes.length > 0) {
          subsWithMinutes.forEach(s => {
            const entryMin = Math.max(1, durationMin - Number(s.minutes));
            allSubsListPost.push(`Min ${entryMin}': ${isEn ? 'Sub In' : 'Entra'} ${s.name} (${s.minutes}' ${isEn ? 'played' : 'jugados'})`);
          });
        }
      }

      let subsText = allSubsListPost.length > 0
        ? allSubsListPost.join(' | ')
        : (isEn ? 'No substitutions recorded' : 'Sin sustituciones registradas');

      const keyIncidents = [
        [isEn ? 'Goals & Scorers' : 'Goleadores y Anotaciones', scorersText],
        [isEn ? 'Cards Issued' : 'Tarjetas Sancionadas', cardsText],
        [isEn ? 'Substitutions' : 'Sustituciones Realizadas', subsText],
      ];

      autoTable(doc, {
        startY: y,
        body: keyIncidents,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.8, textColor: [15, 23, 42] },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [241, 245, 249], width: 55, textColor: colorPrimary } },
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 26) + 6;

      // Cronología resumida de eventos clave
      const sortedEvents = [...safeEvents].sort((a, b) => {
        const hA = a.half || 1;
        const hB = b.half || 1;
        if (hA !== hB) return hA - hB;
        const mA = parseInt(a.minute || a.minuto || a.min || 0, 10);
        const mB = parseInt(b.minute || b.minuto || b.min || 0, 10);
        return mA - mB;
      });

      const keyEventsTimeline = sortedEvents
        .filter((e) => {
          const t = String(e.type || '').toLowerCase();
          return t.includes('shot') || t.includes('gol') || t.includes('goal') || t.includes('save') ||
                 t.includes('card') || t.includes('amarilla') || t.includes('roja') || t.includes('foul') ||
                 t.includes('cambio') || t.includes('sustitucion');
        })
        .slice(0, 8)
        .map((e, idx) => {
          const rawMin = parseInt(e.minute || e.minuto || e.min, 10);
          const minLabel = (!isNaN(rawMin) && rawMin > 0) ? `${rawMin}'` : (isEn ? 'Unknown' : 's/m');
          const halfLabel = e.half === 2 ? (isEn ? '2nd Half' : '2T') : (isEn ? '1st Half' : '1T');
          return [
            `${idx + 1}`,
            minLabel,
            halfLabel,
            formatEventText(e.type, isEn)
          ];
        });

      if (keyEventsTimeline.length > 0) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'KEY MATCH EVENTS CHRONOLOGY' : 'CRONOLOGÍA DE EVENTOS DESTACADOS', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [isEn ? ['#', 'Min', 'Half', 'Event Description'] : ['#', 'Min', 'Mitad', 'Descripción del Evento']],
          body: keyEventsTimeline,
          theme: 'striped',
          headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.2, cellPadding: 2.2 },
          columnStyles: {
            0: { width: 10, halign: 'center' },
            1: { width: 16, halign: 'center', fontStyle: 'bold' },
            2: { width: 18, halign: 'center' },
            3: { fontStyle: 'bold' }
          }
        });
        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 6;
      }

      // 3. Momentum y Posesión por Bloques 15'
      y = drawSectionHeader('sec3_momentum');
      const momentumSvg = renderMomentumSvgString({
        events: safeEvents,
        durationMin: durationMin || 90,
        isEn,
        width: 640,
        height: 180
      });
      const momentumImg = await rasterizeSvgToDataUrl(momentumSvg, 640, 180, 3);
      assertGraphicEmbedded('sec3_momentum', momentumImg);
      const momW = pageW - 28;
      const momH = (180 / 640) * momW;
      doc.addImage(momentumImg, 'PNG', 14, y, momW, momH);
      y += momH + 5;

      // ── PÁGINA 3: SECCIÓN 4, 5 & 6 — BARRAS, RADAR Y TOP-5 ────────────────
      doc.addPage();
      y = 18;

      // 4. Barras Comparativas (10 Métricas Canónicas)
      y = drawSectionHeader('sec4_bars');
      const barsSvg = renderComparisonBarsSvgString({
        homeStats,
        awayStats,
        homeTeamName: safeTeamName,
        awayTeamName: rivalName,
        isEn,
        width: 660,
        height: 250
      });
      const barsImg = await rasterizeSvgToDataUrl(barsSvg, 660, 250, 3);
      assertGraphicEmbedded('sec4_bars', barsImg);
      const bW = pageW - 28;
      const bH = (250 / 660) * bW;
      doc.addImage(barsImg, 'PNG', 14, y, bW, bH);
      y += bH + 6;

      // 5. Radar Táctico Oficial (6 Ejes Comparativos)
      y = drawSectionHeader('sec5_radar');
      const radarSvg = renderRadarCompareSvgString({
        homeStats,
        awayStats,
        homeTeamName: safeTeamName,
        awayTeamName: rivalName,
        isEn,
        width: 500,
        height: 260
      });
      const radarImg = await rasterizeSvgToDataUrl(radarSvg, 500, 260, 3);
      assertGraphicEmbedded('sec5_radar', radarImg);
      const rW = 110;
      const rH = (260 / 500) * rW;
      const rX = (pageW - rW) / 2;
      doc.addImage(radarImg, 'PNG', rX, y, rW, rH);
      y += rH + 6;

      // 6. Métricas Top-5 Diferenciales
      y = drawSectionHeader('sec6_top5');

      const countOfSafe = (types) => {
        const arr = Array.isArray(types) ? types : [types];
        return safeEvents.filter((e) => e && arr.includes(e.type)).length;
      };

      const duelsWonVal = countOfSafe(['duel_won', 'duelo_ganado']);
      const duelsLostVal = countOfSafe(['duel_lost', 'duelo_perdido']);
      const totalDuelsVal = duelsWonVal + duelsLostVal;
      const duelsPctVal = totalDuelsVal > 0 ? Math.round((duelsWonVal / totalDuelsVal) * 100) : 50;

      const shotsOnVal = analytics.shots.ownOnTarget;
      const totalOwnShots = analytics.shots.ownShots.length;
      const shotsOnRival = analytics.shots.rivalOnTarget;
      const totalRivalShots = analytics.shots.rivalShots.length;

      const recVal = countOfSafe(['recovery', 'recuperacion']);
      const lossVal = countOfSafe(['loss', 'ball_loss', 'perdida']);

      const top5TableRows = isEn ? [
        ['1. Expected Goals (xG-Lite)', `${derivedIndices.ownXg} xG`, `${derivedIndices.rivalXg} xG`, `${derivedIndices.ownXg >= derivedIndices.rivalXg ? '+' : ''}${(derivedIndices.ownXg - derivedIndices.rivalXg).toFixed(2)} xG`],
        ['2. Shots on Target Ratio', `${shotsOnVal} / ${totalOwnShots}`, `${shotsOnRival} / ${totalRivalShots}`, `${shotsOnVal >= shotsOnRival ? '+' : ''}${shotsOnVal - shotsOnRival}`],
        ['3. Individual Duels Won', `${duelsWonVal} (${duelsPctVal}%)`, `${duelsLostVal} (${100 - duelsPctVal}%)`, `${duelsPctVal >= 50 ? 'Favorable' : 'Deficit'}`],
        ['4. Ball Retention Balance', `${recVal} Recoveries`, `${lossVal} Losses`, `${recVal >= lossVal ? 'Positive' : 'Vulnerable'}`],
        ['5. Set Pieces & Cards', `${countOfSafe(['corner_favor'])} Corners`, `${countOfSafe(['corner_against'])} Corners`, `Y: ${countOfSafe(['card_yellow_own'])} / ${countOfSafe(['card_yellow_rival'])}`]
      ] : [
        ['1. Goles Esperados (xG-Lite)', `${derivedIndices.ownXg} xG`, `${derivedIndices.rivalXg} xG`, `${derivedIndices.ownXg >= derivedIndices.rivalXg ? '+' : ''}${(derivedIndices.ownXg - derivedIndices.rivalXg).toFixed(2)} xG`],
        ['2. Efectividad a Puerta', `${shotsOnVal} / ${totalOwnShots}`, `${shotsOnRival} / ${totalRivalShots}`, `${shotsOnVal >= shotsOnRival ? '+' : ''}${shotsOnVal - shotsOnRival}`],
        ['3. Duelos Individuales', `${duelsWonVal} (${duelsPctVal}%)`, `${duelsLostVal} (${100 - duelsPctVal}%)`, `${duelsPctVal >= 50 ? 'Favorable' : 'Déficit'}`],
        ['4. Balance de Balón', `${recVal} Recuperaciones`, `${lossVal} Pérdidas`, `${recVal >= lossVal ? 'Positivo' : 'Vulnerable'}`],
        ['5. Balón Parado y Tarjetas', `${countOfSafe(['corner_favor'])} Córners`, `${countOfSafe(['corner_against'])} Córners`, `A: ${countOfSafe(['card_yellow_own'])} / ${countOfSafe(['card_yellow_rival'])}`]
      ];

      autoTable(doc, {
        startY: y,
        head: [isEn ? ['Top-5 Differential Metric', safeTeamName, rivalName, 'Net Differential'] : ['Top-5 Métrica Diferencial', safeTeamName, rivalName, 'Diferencial Neto']],
        body: top5TableRows,
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.2, cellPadding: 2.2 },
        columnStyles: {
          0: { fontStyle: 'bold', width: 62 },
          1: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold', textColor: colorAccent }
        }
      });

      // ── PÁGINA 4: SECCIÓN 7 — MAPAS DE TIROS Y MODELO xG-LITE ─────────────
      doc.addPage();
      y = 18;

      // 7. Mapas de Tiros & Modelo xG-Lite (PitchFrame 105:68)
      y = drawSectionHeader('sec7_shots');
      const shotSvg = renderShotMapSvgString({
        shots: analytics.shots.all,
        ownXg: analytics.shots.ownTotalXg,
        rivalXg: analytics.shots.rivalTotalXg,
        homeTeamName: safeTeamName,
        awayTeamName: rivalName,
        isEn,
        width: 1050,
        height: 680
      });
      const shotMapImg = await rasterizeSvgToDataUrl(shotSvg, 1050, 680, 2);
      assertGraphicEmbedded('sec7_shots', shotMapImg);
      const smW = 150;
      const smH = smW / 1.5441;
      const smX = (pageW - smW) / 2;
      const shotMapAspect = smW / smH;
      if (Math.abs(shotMapAspect - 1.5441) > 0.05) {
        throw new Error(`[ASPECT RATIO ERROR] sec7_shots aspect ratio is ${shotMapAspect.toFixed(2)}, expected 1.54 ± 2%`);
      }
      doc.addImage(shotMapImg, 'PNG', smX, y, smW, smH);
      y += smH + 5;

      // Tabla cuantitativa de tiros xG-lite
      const ownComfortableCount = analytics.shots.ownShots.filter(e => e.shooterComfort === 'comodo').length;
      const ownComfortablePct = analytics.shots.ownShots.length > 0 ? Math.round((ownComfortableCount / analytics.shots.ownShots.length) * 100) : 0;
      const rivalComfortableCount = derivedIndices.rivalComfortableShots ?? analytics.shots.rivalShots.filter(e => e.shooterComfort === 'comodo').length;
      const rivalComfortablePct = derivedIndices.rivalComfortPct ?? (analytics.shots.rivalShots.length > 0 ? Math.round((rivalComfortableCount / analytics.shots.rivalShots.length) * 100) : 0);

      const shotComparisonData = isEn ? [
        ['Shot Metric', safeTeamName, rivalName],
        ['Cumulative xG-Lite', `${analytics.shots.ownTotalXg} xG`, `${analytics.shots.rivalTotalXg} xG`],
        ['Total Shot Attempts', `${analytics.shots.ownShots.length}`, `${analytics.shots.rivalShots.length}`],
        ['Comfortable Shots (% Comfortable)', `${ownComfortableCount} (${ownComfortablePct}%)`, `${rivalComfortableCount} (${rivalComfortablePct}%)`],
        ['Penalty Box Central Shots', `${analytics.shots.bySector.center.count}`, `${derivedIndices.defensiveExposureMap?.dentro_centro?.total ?? 0}`]
      ] : [
        ['Métrica de Remate', safeTeamName, rivalName],
        ['xG-Lite Acumulado', `${analytics.shots.ownTotalXg} xG`, `${analytics.shots.rivalTotalXg} xG`],
        ['Remates Totales', `${analytics.shots.ownShots.length}`, `${analytics.shots.rivalShots.length}`],
        ['Tiros Cómodos (% Comodidad)', `${ownComfortableCount} (${ownComfortablePct}%)`, `${rivalComfortableCount} (${rivalComfortablePct}%)`],
        ['Tiros en Área Central', `${analytics.shots.bySector.center.count}`, `${derivedIndices.defensiveExposureMap?.dentro_centro?.total ?? 0}`]
      ];

      autoTable(doc, {
        startY: y,
        head: [shotComparisonData[0]],
        body: shotComparisonData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', width: 65 },
          1: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'center' }
        }
      });

      // ── PÁGINA 5: SECCIÓN 8 & SECCIÓN 9 — CAMPO/TÁCTICA Y PORTERÍA ─────────
      doc.addPage();
      y = 18;

      // 8. Campo & Táctica (Pasillos Reglamentarios FIFA 105:68, ABP y Territorio)
      y = drawSectionHeader('sec8_tactics');
      const tacticsSvg = renderSectorTacticsSvgString({
        tacticsData,
        homeStats: {
          corners: countOfSafe(['corner_favor']),
          faltas: countOfSafe(['foul_committed']),
          penaltis: countOfSafe(['penalty_goal_favor', 'penalty_miss_favor'])
        },
        awayStats: {
          corners: countOfSafe(['corner_against']),
          faltas: countOfSafe(['foul_received']),
          penaltis: countOfSafe(['penalty_goal_against', 'penalty_saved'])
        },
        homeTeamName: safeTeamName,
        awayTeamName: rivalName,
        isEn,
        width: 700,
        height: 480
      });
      const tacticsImg = await rasterizeSvgToDataUrl(tacticsSvg, 700, 480, 2);
      assertGraphicEmbedded('sec8_tactics', tacticsImg);
      const tW = 150;
      const tH = (480 / 700) * tW;
      const tX = (pageW - tW) / 2;
      doc.addImage(tacticsImg, 'PNG', tX, y, tW, tH);
      y += tH + 6;

      // 9. Exigencia & Rendimiento de Portería
      y = drawSectionHeader('sec9_gk');
      const effectiveGkConceded = Math.max(derivedIndices.concededGoals || 0, goalsAgainst);
      const effectiveGkTotalSaves = (derivedIndices.normalSaves || 0) + (derivedIndices.decisiveSaves || 0);
      const effectiveGkTotal = effectiveGkTotalSaves + effectiveGkConceded;
      const effectiveGkSavePct = effectiveGkTotal > 0
        ? Math.round((effectiveGkTotalSaves / effectiveGkTotal) * 100)
        : (effectiveGkConceded > 0 ? 0 : 100);

      const gkIndicesForCanvas = {
        ...derivedIndices,
        concededGoals: effectiveGkConceded,
        totalSaves: effectiveGkTotalSaves,
        totalSavePct: effectiveGkSavePct
      };

      try {
        const gkImg = drawGkExertionCanvas({
          gkIndices: gkIndicesForCanvas,
          isEn,
          width: 660,
          height: 200
        });
        if (gkImg) {
          const gkW = pageW - 28;
          const gkH = (200 / 660) * gkW;
          doc.addImage(gkImg, 'PNG', 14, y, gkW, gkH);
          y += gkH + 5;
        }
      } catch (gkErr) {
        console.warn('Error gk exertion canvas:', gkErr);
      }

      // Tabla GK detallada
      const gkBreakdownHead = isEn
        ? [['Exertion Index', 'Normal Saves', 'Decisive Saves (x2)', 'Penalties Saved', 'Conceded Goals', 'Total Save %']]
        : [['Índice Exigencia', 'Paradas Normales', 'Paradas Decisivas (x2)', 'Penaltis Parados', 'Goles Encajados', '% Total Paradas']];

      const gkBreakdownRow = [
        String(derivedIndices.gkExertionIndex),
        String(derivedIndices.normalSaves),
        String(derivedIndices.decisiveSaves),
        String(derivedIndices.penaltySaves),
        String(effectiveGkConceded),
        `${effectiveGkSavePct}%`
      ];

      autoTable(doc, {
        startY: y,
        head: gkBreakdownHead,
        body: [gkBreakdownRow],
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 2.2, halign: 'center' },
      });

      // ── PÁGINA 6: SECCIÓN 10 — RENDIMIENTO INDIVIDUAL & PLANTILLA ─────────
      doc.addPage();
      y = 18;

      y = drawSectionHeader('sec10_players');

      const hasComments = squadRoster.some((r) => matchData?.playerComments?.[r.pid]);
      const rosterHeaders = isEn
        ? (hasComments ? ['#', 'Player Name', 'Pos', 'Role', 'Status', 'Minutes', 'Rating', 'Coach Feedback'] : ['#', 'Player Name', 'Pos', 'Role', 'Status', 'Minutes', 'Rating'])
        : (hasComments ? ['#', 'Jugador', 'Pos', 'Rol', 'Estado', 'Minutos', 'Nota', 'Comentario del Míster'] : ['#', 'Jugador', 'Pos', 'Rol', 'Estado', 'Minutos', 'Nota']);

      const rosterRows = squadRoster.map((r) => {
        const base = [
          r.number,
          r.name,
          r.position,
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

      const rosterColStyles = hasComments ? {
        0: { width: 8, halign: 'center' },
        1: { fontStyle: 'bold', width: 34 },
        2: { width: 14, halign: 'center' },
        3: { width: 18, halign: 'center' },
        4: { width: 18, halign: 'center' },
        5: { width: 14, halign: 'center', fontStyle: 'bold' },
        6: { width: 12, halign: 'center' },
        7: { fontSize: 7, textColor: [51, 65, 85] }
      } : {
        0: { width: 8, halign: 'center' },
        1: { fontStyle: 'bold' },
        2: { width: 18, halign: 'center' },
        3: { width: 22, halign: 'center' },
        4: { width: 24, halign: 'center' },
        5: { width: 18, halign: 'center', fontStyle: 'bold' },
        6: { width: 16, halign: 'center' }
      };

      autoTable(doc, {
        startY: y,
        head: [rosterHeaders],
        body: rosterRows,
        theme: 'striped',
        headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.2, cellPadding: 2 },
        columnStyles: rosterColStyles
      });

      // Nota al pie de eventos sin atribuir
      const unattributedEvents = safeEvents.filter(e =>
        e && !e.playerId && !e.jugadorId && !e.playerInId && !e.subInId
      );
      const unattributedCount = unattributedEvents.length;
      if (unattributedCount > 0) {
        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 60) + 3;
        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        const footnote = isEn
          ? `* ${unattributedCount} unattributed event(s) available to refine individual ratings (optional)`
          : `* ${unattributedCount} evento(s) sin atribuir disponibles para refinar notas individuales (opcional)`;
        doc.text(footnote, 14, y);
      }

      // ── PÁGINA 7: SECCIÓN 11 — MATRIZ DAFO, RECOMENDACIONES Y FOTOS ───────
      doc.addPage();
      y = 18;

      y = drawSectionHeader('sec11_swot');

      // 1. Matriz DAFO 2x2
      const swotQuadrants = swotResult?.quadrants || {};
      const formatQuadrantItems = (items) => {
        if (!items || items.length === 0) {
          return isEn ? '• No relevant patterns identified' : '• Sin patrones destacados identificados';
        }
        return items
          .map((item) => {
            const translatedText = item.textKey ? i18nT(item.textKey, effLang) : item.text;
            const metricsStr = (item.metricRefs || [])
              .map((m) => `${m.label}: ${m.value}`)
              .join(' | ');
            return `• ${translatedText}${metricsStr ? ` (${metricsStr})` : ''}`;
          })
          .join('\n');
      };

      const swotGridTable = [
        [
          isEn ? 'STRENGTHS (Internal)' : 'FORTALEZAS (Internas)',
          isEn ? 'WEAKNESSES (Internal)' : 'DEBILIDADES (Internas)'
        ],
        [
          formatQuadrantItems(swotQuadrants.strengths),
          formatQuadrantItems(swotQuadrants.weaknesses)
        ],
        [
          isEn ? 'OPPORTUNITIES (External)' : 'OPORTUNIDADES (Externas)',
          isEn ? 'THREATS (External)' : 'AMENAZAS (Externas)'
        ],
        [
          formatQuadrantItems(swotQuadrants.opportunities),
          formatQuadrantItems(swotQuadrants.threats)
        ]
      ];

      autoTable(doc, {
        startY: y,
        body: swotGridTable,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 3.5, textColor: [15, 23, 42] },
        columnStyles: {
          0: { width: (pageW - 28) / 2 },
          1: { width: (pageW - 28) / 2 }
        },
        didParseCell: (data) => {
          if (data.row.index === 0 || data.row.index === 2) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = colorPrimary;
            data.cell.styles.fontSize = 8;
          }
        }
      });

      y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 65) + 6;

      // 2. Síntesis Táctica / Párrafo redactado
      const aiSummaryText = cleanPdfText(matchData?.swotAiSummary || matchData?.tacticalSummary || '');
      if (aiSummaryText) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'TACTICAL SYNTHESIS' : 'SÍNTESIS TÁCTICA Y CONCLUSIONES', 18, y + 6);

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitSummary = doc.splitTextToSize(aiSummaryText, pageW - 36);
        doc.text(splitSummary, 18, y + 12);

        y += 28;
      }

      // 3. Cuestionario de Análisis del Entrenador (Notas Tácticas)
      const tacticalNotesVal = cleanPdfText(matchData.notes || '');
      if (tacticalNotesVal && y < pageH - 45) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorPrimary);
        doc.text(isEn ? 'COACH TACTICAL NOTES' : 'NOTAS TÁCTICAS DEL ENTRENADOR', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          body: [[isEn ? 'Coach Notes' : 'Observaciones', tacticalNotesVal]],
          theme: 'grid',
          styles: { fontSize: 7.5, cellPadding: 2.5 },
          columnStyles: { 0: { fontStyle: 'bold', width: 45, fillColor: [241, 245, 249], textColor: colorPrimary } }
        });
        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 20) + 6;
      }

      // ── FOTOGRAFÍAS REGISTRADAS POR EL ENTRENADOR (postMatchImages) ────────
      const rawPostImages = matchData.postMatchImages || (matchData.postMatchPhoto ? [matchData.postMatchPhoto] : []);
      const validPostImages = Array.isArray(rawPostImages) ? rawPostImages.filter(Boolean) : [];
      if (validPostImages.length > 0) {
        const postImagesB64 = [];
        for (const imgUrl of validPostImages) {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
            postImagesB64.push(imgUrl);
          } else {
            try {
              const b64 = await imageUrlToBase64(imgUrl);
              if (b64) postImagesB64.push(b64);
            } catch (err) {
              console.warn('Error convirtiendo imagen del entrenador a base64:', err);
            }
          }
        }

        if (postImagesB64.length > 0) {
          if (y + 55 > pageH - 22) {
            doc.addPage();
            y = 18;
          }
          doc.setFillColor(...colorPrimary);
          doc.roundedRect(14, y, pageW - 28, 8, 1.5, 1.5, 'F');
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(
            isEn ? 'COACH POST-MATCH PHOTOGRAPHS & EVIDENCE' : 'FOTOGRAFÍAS Y EVIDENCIAS DEL ENTRENADOR',
            18,
            y + 5.5
          );
          y += 12;

          const colW = (pageW - 28 - 8) / 2; // ~87mm
          const colH = 55;
          for (let i = 0; i < postImagesB64.length; i += 2) {
            if (y + colH > pageH - 22) {
              doc.addPage();
              y = 18;
            }
            const img1 = postImagesB64[i];
            if (img1) {
              try {
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(14, y, colW, colH, 2, 2, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(14, y, colW, colH, 2, 2, 'S');
                doc.addImage(img1, 'JPEG', 15, y + 1, colW - 2, colH - 2);
              } catch {
                try {
                  doc.addImage(img1, 'PNG', 15, y + 1, colW - 2, colH - 2);
                } catch (imgErr) {
                  console.warn('Error incrustando foto 1 del entrenador:', imgErr);
                }
              }
            }

            if (i + 1 < postImagesB64.length) {
              const img2 = postImagesB64[i + 1];
              const col2X = 14 + colW + 8;
              if (img2) {
                try {
                  doc.setFillColor(248, 250, 252);
                  doc.roundedRect(col2X, y, colW, colH, 2, 2, 'F');
                  doc.setDrawColor(226, 232, 240);
                  doc.roundedRect(col2X, y, colW, colH, 2, 2, 'S');
                  doc.addImage(img2, 'JPEG', col2X + 1, y + 1, colW - 2, colH - 2);
                } catch {
                  try {
                    doc.addImage(img2, 'PNG', col2X + 1, y + 1, colW - 2, colH - 2);
                  } catch (imgErr2) {
                    console.warn('Error incrustando foto 2 del entrenador:', imgErr2);
                  }
                }
              }
            }
            y += colH + 6;
          }
        }
      }
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
