/**
 * src/components/canonical/calculateCanonicalStats.js
 * Míster11 — Cálculo Canónico Unificado de Métricas de Partido
 *
 * Consumido tanto por Partidos.jsx (render en App) como por matchPdfReport.js (PDF)
 * para garantizar paridad del 100% en las 10 métricas de barras, radar y sectores tácticos.
 */

export function calculateCanonicalStats(matchData = {}, rawEvents = []) {
  const events = Array.isArray(rawEvents) ? rawEvents.filter(e => e && e.isValid !== false) : [];

  const countOf = (type) => events.filter(e => e.type === type).length;
  const countOfSector = (sector) => events.filter(e => e.sector === sector).length;

  // Tiros propios y rivales
  const shotsOnOwn = countOf('shot_on_target_own') + countOf('shot_on_target');
  const shotsOffOwn = countOf('shot_off_target_own') + countOf('shot_off_target');
  const goalsOwn = countOf('gol_local') + countOf('goal_own') + countOf('goal');
  const shotsTotalOwn = Math.max(shotsOnOwn + shotsOffOwn, goalsOwn);

  const shotsOnRival = countOf('shot_on_target_rival');
  const shotsOffRival = countOf('shot_off_target_rival');
  const goalsRival = countOf('gol_rival') + countOf('goal_rival');
  const shotsTotalRival = Math.max(shotsOnRival + shotsOffRival, goalsRival);

  // Paradas
  const paradasOwn = countOf('save_own') + countOf('save');
  const paradasRival = countOf('save_rival');

  // Balón & Posesión
  const recoveries = countOf('recovery') + countOf('recuperacion');
  const losses = countOf('loss') + countOf('ball_loss') + countOf('perdida');
  const totalPossEvents = recoveries + losses;
  const possPctOwn = totalPossEvents > 0 ? Math.round((recoveries / totalPossEvents) * 100) : 50;
  const possPctRival = 100 - possPctOwn;

  // Pases
  const passesOwnComp = countOf('pass_completed') + countOf('pass_successful') + countOf('pase');
  const passesOwnFailed = countOf('pass_failed') || Math.round(losses * 0.4);
  const passesOwnTotal = passesOwnComp + passesOwnFailed;
  const passesRivalComp = Math.round(passesOwnComp * (possPctRival / (possPctOwn || 1)));
  const passesRivalTotal = Math.max(passesRivalComp, Math.round(passesRivalComp * 1.25));

  // ABP & Disciplina
  const cornersFavor = countOf('corner_favor');
  const cornersAgainst = countOf('corner_against');
  const foulsAgainst = countOf('foul_against') + countOf('foul');
  const foulsFavor = countOf('foul_favor');
  const yellowsOwn = countOf('card_yellow_own') + countOf('amarilla');
  const yellowsRival = countOf('card_yellow_rival');
  const penaltisOwn = countOf('penalty_won') || countOf('penalty_scored');
  const penaltisRival = countOf('penalty_conceded') || countOf('penalty_scored_rival');

  // Sectores (3 pasillos)
  const sectorLeft = countOfSector('left');
  const sectorCenter = countOfSector('center');
  const sectorRight = countOfSector('right');
  const totalSectors = sectorLeft + sectorCenter + sectorRight;
  const leftPct = totalSectors > 0 ? Math.round((sectorLeft / totalSectors) * 100) : 32;
  const centerPct = totalSectors > 0 ? Math.round((sectorCenter / totalSectors) * 100) : 44;
  const rightPct = totalSectors > 0 ? Math.round((sectorRight / totalSectors) * 100) : 24;

  const homeStats = {
    posesion: possPctOwn,
    tiros: shotsTotalOwn,
    tirosPuerta: shotsOnOwn,
    paradas: paradasOwn,
    pasesExitosos: passesOwnComp,
    pasesTotales: passesOwnTotal,
    recuperaciones: recoveries,
    corners: cornersFavor,
    faltas: foulsAgainst,
    amarillas: yellowsOwn,
    penaltis: penaltisOwn
  };

  const awayStats = {
    posesion: possPctRival,
    tiros: shotsTotalRival,
    tirosPuerta: shotsOnRival,
    paradas: paradasRival,
    pasesExitosos: passesRivalComp,
    pasesTotales: passesRivalTotal,
    recuperaciones: losses,
    corners: cornersAgainst,
    faltas: foulsFavor,
    amarillas: yellowsRival,
    penaltis: penaltisRival
  };

  const tacticsData = {
    leftPct,
    centerPct,
    rightPct,
    territorioOfensivo: possPctOwn > 0 ? Math.min(85, Math.max(25, possPctOwn + (shotsTotalOwn > shotsTotalRival ? 5 : -5))) : 52,
    penaltisHome: penaltisOwn,
    penaltisAway: penaltisRival
  };

  return { homeStats, awayStats, tacticsData };
}
