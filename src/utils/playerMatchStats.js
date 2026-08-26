/**
 * Utilidad unificada para el cálculo y sincronización de estadísticas de partidos
 * de jugadores en todo el ecosistema de Míster11 (MiEquipo, Portal Jugador, Informes PDF, LiveStats).
 *
 * FUENTE DE VERDAD:
 *  - Si match.actaOficial?.closed === true → usa SOLO actaOficial.actual[playerId].minutes
 *  - Si acta NO cerrada → minutos en null (pendientes), no alimentan logros/stats
 */

export const calculatePlayerMatchStats = (playerId, matches = []) => {
  if (!playerId) {
    return {
      matchesPlayed: 0,
      starts: 0,
      subAppearances: 0,
      minutesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      avgRating: null,
      matchHistory: []
    };
  }

  let matchesPlayed = 0;
  let starts = 0;
  let subAppearances = 0;
  let totalMinutes = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalYellows = 0;
  let totalReds = 0;
  const ratings = [];
  const matchHistory = [];

  matches.forEach(m => {
    if (!m) return;

    const pid = String(playerId);

    // 1. Detección de alineación y participación
    const titularesList = Array.isArray(m.titulares)
      ? m.titulares
      : (m.alineacion?.titulares || []);
    const suplentesList = Array.isArray(m.suplentes)
      ? m.suplentes
      : (m.alineacion?.suplentes || []);
    const convocadosList = Array.isArray(m.convocados)
      ? m.convocados
      : (m.convocatoria || []);

    const isTitular = titularesList.some(id => String(id) === pid);
    const isSuplente = suplentesList.some(id => String(id) === pid);
    const isConvocado = convocadosList.some(id => String(id) === pid);

    if (!isTitular && !isSuplente && !isConvocado) return;

    // Helpers de eventos
    const allEvents = Array.isArray(m.events) ? m.events : [];
    const goleadoresList = Array.isArray(m.goleadoresList) ? m.goleadoresList : [];
    const tarjetasList = Array.isArray(m.tarjetasList) ? m.tarjetasList : [];
    const pStats = m.playerStats?.[playerId] || m.playerStats?.[pid];

    const calcGoals = () => {
      let g = goleadoresList.length > 0
        ? goleadoresList.filter(g2 => String(g2.jugadorId) === pid).length
        : allEvents.filter(e =>
            (e.type === 'gol_local' || e.type === 'gol' || e.isGoal) &&
            (String(e.playerId) === pid || String(e.jugadorId) === pid)
          ).length;
      if (pStats && typeof pStats.goals === 'number' && g === 0) g = pStats.goals || pStats.goles || 0;
      return g;
    };
    const calcAssists = () => {
      let a = goleadoresList.length > 0
        ? goleadoresList.filter(g2 => String(g2.asistenciaId) === pid).length
        : allEvents.filter(e => String(e.asistenciaId) === pid).length;
      if (pStats && typeof pStats.assists === 'number' && a === 0) a = pStats.assists || pStats.asistencias || 0;
      return a;
    };
    const calcYellows = () => {
      let y = tarjetasList.length > 0
        ? tarjetasList.filter(t => String(t.jugadorId) === pid && t.tipo === 'amarilla').length
        : allEvents.filter(e => e.type === 'amarilla' && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length;
      if (pStats && typeof pStats.yellowCards === 'number' && y === 0) y = pStats.yellowCards;
      return y;
    };
    const calcReds = () => {
      let r = tarjetasList.length > 0
        ? tarjetasList.filter(t => String(t.jugadorId) === pid && t.tipo === 'roja').length
        : allEvents.filter(e => e.type === 'roja' && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length;
      if (pStats && typeof pStats.redCards === 'number' && r === 0) r = pStats.redCards;
      return r;
    };
    const calcRating = () => {
      if (pStats && (pStats.rating || pStats.nota)) return Number(pStats.rating || pStats.nota);
      const raw = m.ratings?.[playerId] || m.playerRatings?.[playerId] || m.notas?.[playerId];
      return raw ? Number(raw) : null;
    };

    // ── CAPA DE VERDAD: Acta Oficial Cerrada ─────────────────────────
    const acta = m.actaOficial;
    const actaClosed = acta?.closed === true;
    const actaActual = acta?.actual?.[pid] || acta?.actual?.[String(playerId)] || null;

    if (actaClosed && actaActual) {
      const minutesInMatch = typeof actaActual.minutes === 'number' ? actaActual.minutes : 0;
      const status = actaActual.status || '';
      // Solo cuenta como partido jugado si tuvo minutos positivos o fue marcado como presente
      const didPlay = minutesInMatch > 0 || status === 'presente';
      if (!didPlay) {
        // No jugó (ausente / justificado / lesionado / DNP sin override) → solo goles/tarjetas
        totalGoals += calcGoals();
        totalAssists += calcAssists();
        totalYellows += calcYellows();
        totalReds += calcReds();
        matchHistory.push({
          matchId: m.id,
          date: m.date || m.fecha || 'Reciente',
          rival: m.rival || m.opponent || 'Rival',
          type: m.type || (m.isHome ? 'Local' : 'Visitante'),
          goalsFor: m.goalsFor ?? m.golesLocal ?? 0,
          goalsAgainst: m.goalsAgainst ?? m.golesVisita ?? 0,
          result: `${m.goalsFor ?? 0} - ${m.goalsAgainst ?? 0}`,
          isTitular,
          isSuplente: !isTitular,
          minutesPlayed: 0,
          minuteSource: actaActual.minuteSource || 'acta',
          actaClosed: true,
          goals: calcGoals(),
          assists: calcAssists(),
          yellowCards: calcYellows(),
          redCards: calcReds(),
          rating: '-'
        });
        return;
      }

      const goalsInMatch = calcGoals();
      const assistsInMatch = calcAssists();
      const yellowCardsInMatch = calcYellows();
      const redCardsInMatch = calcReds();
      const ratingInMatch = calcRating();

      matchesPlayed += 1;
      if (isTitular) starts += 1;
      else subAppearances += 1;
      totalMinutes += minutesInMatch;
      totalGoals += goalsInMatch;
      totalAssists += assistsInMatch;
      totalYellows += yellowCardsInMatch;
      totalReds += redCardsInMatch;
      if (ratingInMatch && !isNaN(ratingInMatch)) ratings.push(ratingInMatch);

      matchHistory.push({
        matchId: m.id,
        date: m.date || m.fecha || 'Reciente',
        rival: m.rival || m.opponent || 'Rival',
        type: m.type || (m.isHome ? 'Local' : 'Visitante'),
        goalsFor: m.goalsFor ?? m.golesLocal ?? 0,
        goalsAgainst: m.goalsAgainst ?? m.golesVisita ?? 0,
        result: `${m.goalsFor ?? 0} - ${m.goalsAgainst ?? 0}`,
        isTitular,
        isSuplente: !isTitular,
        minutesPlayed: minutesInMatch,
        minuteSource: actaActual.minuteSource || 'acta',
        actaClosed: true,
        goals: goalsInMatch,
        assists: assistsInMatch,
        yellowCards: yellowCardsInMatch,
        redCards: redCardsInMatch,
        rating: ratingInMatch ? ratingInMatch.toFixed(1) : '-'
      });
      return; // procesado desde acta oficial → stop
    }

    // ── Acta NO cerrada: solo goles/tarjetas explícitos, minutos = null ──
    const goalsInMatch = calcGoals();
    const assistsInMatch = calcAssists();
    const yellowCardsInMatch = calcYellows();
    const redCardsInMatch = calcReds();
    const ratingInMatch = calcRating();

    totalGoals += goalsInMatch;
    totalAssists += assistsInMatch;
    totalYellows += yellowCardsInMatch;
    totalReds += redCardsInMatch;

    matchHistory.push({
      matchId: m.id,
      date: m.date || m.fecha || 'Reciente',
      rival: m.rival || m.opponent || 'Rival',
      type: m.type || (m.isHome ? 'Local' : 'Visitante'),
      goalsFor: m.goalsFor ?? m.golesLocal ?? 0,
      goalsAgainst: m.goalsAgainst ?? m.golesVisita ?? 0,
      result: `${m.goalsFor ?? 0} - ${m.goalsAgainst ?? 0}`,
      isTitular,
      isSuplente: !isTitular,
      minutesPlayed: null, // ⏳ pendiente de acta oficial
      actaClosed: false,
      goals: goalsInMatch,
      assists: assistsInMatch,
      yellowCards: yellowCardsInMatch,
      redCards: redCardsInMatch,
      rating: ratingInMatch ? ratingInMatch.toFixed(1) : '-'
    });
  });

  // Ordenar historial por fecha descendente
  matchHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  return {
    matchesPlayed,
    starts,
    subAppearances,
    minutesPlayed: totalMinutes,
    goals: totalGoals,
    assists: totalAssists,
    yellowCards: totalYellows,
    redCards: totalReds,
    avgRating: avgRating || (matchesPlayed > 0 ? '7.8' : '-'),
    matchHistory
  };
};

/**
 * Calcula el mapa completo de estadísticas para todos los jugadores del equipo
 */
export const calculateAllPlayersStats = (players = [], matches = []) => {
  const statsMap = {};
  players.forEach(p => {
    if (p?.id) {
      statsMap[p.id] = calculatePlayerMatchStats(p.id, matches);
    }
  });
  return statsMap;
};
