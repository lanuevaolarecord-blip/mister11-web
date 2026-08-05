/**
 * matchPdfReport.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generador de Informe PDF Completo de Partido (Fase 3a).
 * Lazy loading de jsPDF e html2canvas.
 *
 * SECCIONES:
 *  1. Encabezado: Equipo, Rival, Fecha, Marcador Final, MVP.
 *  2. Eficiencia Táctica (% Duelos, % Remates, Balón).
 *  3. Comparativa Propio vs Rival (Barras comparativas).
 *  4. Desglose 1T vs 2T (Comparativa por mitades).
 *  5. Cronología del Partido (Línea de tiempo de eventos por minuto y mitad).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { savePdfUniversal } from './pdfGenerator';

const getJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  return jsPDF;
};

// Nombres legibles de eventos para la cronología en el PDF
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
  teamName = 'Mi Equipo',
  matchData = {},
  events = [],
}) => {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();

  const colorPrimary = [23, 45, 33];    // #172D21 (Verde institucional)
  const colorAccent  = [212, 168, 67];  // #D4A843 (Dorado)

  // ── 1. ENCABEZADO SUPERIOR DE MARCA ──────────────────────────────────────
  doc.setFillColor(...colorPrimary);
  doc.rect(0, 0, pageW, 36, 'F');

  // Franja dorada decorativa
  doc.setFillColor(...colorAccent);
  doc.rect(0, 34, pageW, 2, 'F');

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MÍSTER 11 — INFORME TÁCTICO DE PARTIDO', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  const fechaStr = matchData?.date ? new Date(matchData.date).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
  doc.text(`Fecha: ${fechaStr} | Generado automáticamente por Míster 11`, 14, 26);

  // ── SECCIÓN 1: DATOS DEL PARTIDO & MARCADOR ──────────────────────────────
  let y = 46;

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
  doc.text(`MVP: ${matchData?.mvp || 'N/A'} | Valoración: ${matchData?.teamRating || 5}/10`, 20, y + 24);

  y += 38;

  // ── SECCIÓN 2: EFICIENCIA TÁCTICA (%) ────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimary);
  doc.text('🎯 EFICIENCIA TÁCTICA', 14, y);
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

  doc.autoTable({
    startY: y,
    head: [effData[0]],
    body: effData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 4 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── SECCIÓN 3: COMPARATIVA PROPIO VS RIVAL ───────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimary);
  doc.text('⚔️ COMPARATIVA PROPIO VS RIVAL', 14, y);
  y += 6;

  const compData = [
    ['Categoría', 'Equipo Propio', 'Equipo Rival', 'Dominio'],
    ['Tiros a Puerta', countOf('shot_on_target_own'), countOf('shot_on_target_rival'), countOf('shot_on_target_own') >= countOf('shot_on_target_rival') ? 'Propio' : 'Rival'],
    ['Córners', countOf('corner_favor'), countOf('corner_against'), countOf('corner_favor') >= countOf('corner_against') ? 'Propio' : 'Rival'],
    ['Tarjetas Recibidas', countOf('card_own'), countOf('card_rival'), countOf('card_own') <= countOf('card_rival') ? 'Favor' : 'Contra'],
    ['Fueras de Juego', countOf('offside_own'), countOf('offside_rival'), '-'],
  ];

  doc.autoTable({
    startY: y,
    head: [compData[0]],
    body: compData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: colorAccent, textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 4 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── SECCIÓN 4: DESGLOSE POR MITADES (1T vs 2T) ───────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimary);
  doc.text('⏱️ DESGLOSE POR MITADES', 14, y);
  y += 6;

  const t1 = events.filter((e) => e.half === 1);
  const t2 = events.filter((e) => e.half === 2);
  const getHCount = (list, types) => list.filter((e) => types.includes(e.type)).length;

  const halfData = [
    ['Métrica', '1ª Mitad (1T)', '2ª Mitad (2T)', 'Total Partido'],
    ['Eventos Totales', t1.length, t2.length, events.length],
    ['Remates Propios', getHCount(t1, ['shot_on_target_own', 'shot_off_target_own']), getHCount(t2, ['shot_on_target_own', 'shot_off_target_own']), totalShots],
    ['Recuperaciones', getHCount(t1, ['recovery']), getHCount(t2, ['recovery']), rec],
    ['Faltas Cometidas', getHCount(t1, ['foul_against']), getHCount(t2, ['foul_against']), countOf('foul_against')],
  ];

  doc.autoTable({
    startY: y,
    head: [halfData[0]],
    body: halfData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 4 },
  });

  // ── SECCIÓN 5: CRONOLOGÍA DETALLADA DEL PARTIDO ─────────────────────────
  doc.addPage();

  doc.setFillColor(...colorPrimary);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('📜 CRONOLOGÍA DE EVENTOS REGISTRADOS', 14, 13);

  // Ordenar eventos por mitad y minuto
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
    timelineRows.push(['-', '-', '-', 'No hay eventos en vivo registrados']);
  }

  doc.autoTable({
    startY: 26,
    head: [['#', 'Minuto', 'Mitad', 'Evento Registrado']],
    body: timelineRows,
    theme: 'striped',
    headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  // Guardar de forma universal (Web + APK)
  const filename = `Informe_Partido_${rivalName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
  await savePdfUniversal(doc, filename);
};
