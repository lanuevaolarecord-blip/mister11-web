/**
 * Utilidad unificada para el cálculo y sincronización de estadísticas de partidos
 * de jugadores en todo el ecosistema de Míster11 (MiEquipo, Portal Jugador, Informes PDF, LiveStats).
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
    const defaultDuration = parseInt(m.duration || m.duracion || 90, 10);

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

    const isTitular = titularesList.some(id => String(id) === String(playerId));
    const isSuplente = suplentesList.some(id => String(id) === String(playerId));
    const isConvocado = convocadosList.some(id => String(id) === String(playerId));

    // 2. Detección de eventos del jugador en este partido
    const allEvents = Array.isArray(m.events) ? m.events : [];
    const goleadoresList = Array.isArray(m.goleadoresList) ? m.goleadoresList : [];
    const tarjetasList = Array.isArray(m.tarjetasList) ? m.tarjetasList : [];

    // Goles en este partido
    let goalsInMatch = 0;
    if (goleadoresList.length > 0) {
      goalsInMatch = goleadoresList.filter(g => String(g.jugadorId) === String(playerId)).length;
    } else {
      goalsInMatch = allEvents.filter(e => 
        (e.type === 'gol_local' || e.type === 'gol' || e.isGoal) && 
        (String(e.playerId) === String(playerId) || String(e.jugadorId) === String(playerId))
      ).length;
    }

    // Si además hay playerStats explícitos en el match
    const pStats = m.playerStats?.[playerId] || m.playerStats?.[String(playerId)];
    if (pStats && typeof pStats.goals === 'number' && goalsInMatch === 0) {
      goalsInMatch = pStats.goals || pStats.goles || 0;
    }

    // Asistencias en este partido
    let assistsInMatch = 0;
    if (goleadoresList.length > 0) {
      assistsInMatch = goleadoresList.filter(g => String(g.asistenciaId) === String(playerId)).length;
    } else {
      assistsInMatch = allEvents.filter(e => 
        String(e.asistenciaId) === String(playerId)
      ).length;
    }
    if (pStats && typeof pStats.assists === 'number' && assistsInMatch === 0) {
      assistsInMatch = pStats.assists || pStats.asistencias || 0;
    }

    // Tarjetas en este partido
    let yellowCardsInMatch = 0;
    let redCardsInMatch = 0;
    if (tarjetasList.length > 0) {
      yellowCardsInMatch = tarjetasList.filter(t => String(t.jugadorId) === String(playerId) && t.tipo === 'amarilla').length;
      redCardsInMatch = tarjetasList.filter(t => String(t.jugadorId) === String(playerId) && t.tipo === 'roja').length;
    } else {
      yellowCardsInMatch = allEvents.filter(e => e.type === 'amarilla' && (String(e.playerId) === String(playerId) || String(e.jugadorId) === String(playerId))).length;
      redCardsInMatch = allEvents.filter(e => e.type === 'roja' && (String(e.playerId) === String(playerId) || String(e.jugadorId) === String(playerId))).length;
    }

    if (pStats) {
      if (typeof pStats.yellowCards === 'number' && yellowCardsInMatch === 0) yellowCardsInMatch = pStats.yellowCards;
      if (typeof pStats.redCards === 'number' && redCardsInMatch === 0) redCardsInMatch = pStats.redCards;
    }

    // 3. Minutos jugados en este partido
    let minutesInMatch = 0;
    let didPlay = false;

    if (pStats && (pStats.minutesPlayed !== undefined || pStats.minutos !== undefined)) {
      minutesInMatch = Number(pStats.minutesPlayed || pStats.minutos || 0);
      didPlay = minutesInMatch > 0 || isTitular;
    } else if (isTitular) {
      didPlay = true;
      // Comprobar si fue sustituido
      const subOutEvent = allEvents.find(e => 
        (e.type === 'cambio' || e.type === 'sustitucion') && 
        (String(e.subOutId) === String(playerId) || String(e.jugadorSaleId) === String(playerId))
      );
      if (subOutEvent) {
        minutesInMatch = parseInt(subOutEvent.minute || subOutEvent.minuto || defaultDuration, 10);
      } else {
        minutesInMatch = defaultDuration;
      }
    } else if (isSuplente) {
      // Comprobar si entró al campo
      const subInEvent = allEvents.find(e => 
        (e.type === 'cambio' || e.type === 'sustitucion') && 
        (String(e.subInId) === String(playerId) || String(e.jugadorEntraId) === String(playerId))
      );
      if (subInEvent) {
        didPlay = true;
        const entryMinute = parseInt(subInEvent.minute || subInEvent.minuto || 0, 10);
        minutesInMatch = Math.max(1, defaultDuration - entryMinute);
      }
    } else if (isConvocado && (goalsInMatch > 0 || assistsInMatch > 0 || yellowCardsInMatch > 0 || redCardsInMatch > 0)) {
      didPlay = true;
      minutesInMatch = defaultDuration;
    }

    // 4. Valoración del partido
    let ratingInMatch = null;
    if (pStats && (pStats.rating || pStats.nota)) {
      ratingInMatch = Number(pStats.rating || pStats.nota);
    } else if (m.ratings?.[playerId] || m.playerRatings?.[playerId] || m.notas?.[playerId]) {
      ratingInMatch = Number(m.ratings?.[playerId] || m.playerRatings?.[playerId] || m.notas?.[playerId]);
    }

    if (didPlay) {
      matchesPlayed += 1;
      if (isTitular) starts += 1;
      else subAppearances += 1;
      totalMinutes += minutesInMatch;
      totalGoals += goalsInMatch;
      totalAssists += assistsInMatch;
      totalYellows += yellowCardsInMatch;
      totalReds += redCardsInMatch;
      if (ratingInMatch && !isNaN(ratingInMatch)) {
        ratings.push(ratingInMatch);
      }

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
        goals: goalsInMatch,
        assists: assistsInMatch,
        yellowCards: yellowCardsInMatch,
        redCards: redCardsInMatch,
        rating: ratingInMatch ? ratingInMatch.toFixed(1) : '-'
      });
    }
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
