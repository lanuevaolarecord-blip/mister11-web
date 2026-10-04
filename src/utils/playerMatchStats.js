import { calculateMinutesFromEvents, getUnifiedMatchEvents, getEffectiveMatchDuration } from './minutesEngine.js';

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
      gkStats: {
        saves: 0,
        savesPerMatch: 0,
        conceded: 0,
        concededPerMatch: 0,
        cleanSheets: 0,
        penaltySaves: 0,
        claims: 0,
        errors: 0,
        savePercentage: 0,
      },
      matchHistory: []
    };
  }

  const pid = String(playerId);
  let matchesPlayed = 0;
  let starts = 0;
  let subAppearances = 0;
  let totalMinutes = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let totalYellows = 0;
  let totalReds = 0;
  let totalSaves = 0;
  let totalConceded = 0;
  let totalPenaltySaves = 0;
  let totalClaims = 0;
  let totalErrors = 0;
  let totalCleanSheets = 0;
  const ratings = [];
  const matchHistory = [];

  (matches || []).forEach(m => {
    if (!m) return;

    // Detectar convocatoria y rol del jugador
    const titularesList = Array.isArray(m.titulares)
      ? m.titulares.map(String)
      : (m.alineacion?.titulares || []).map(String);
    const suplentesList = Array.isArray(m.suplentes)
      ? m.suplentes.map(String)
      : (m.alineacion?.suplentes || []).map(String);
    const convocadosList = Array.isArray(m.convocados)
      ? m.convocados.map(String)
      : (m.convocatoria || []).map(String);

    const isTitular = titularesList.includes(pid);
    const isSuplente = suplentesList.includes(pid);
    const isConvocado = convocadosList.includes(pid);

    if (!isTitular && !isSuplente && !isConvocado && !m.actaOficial?.actual?.[pid]) return;

    // ── CAPA DE VERDAD: Acta Oficial Cerrada ─────────────────────────
    const acta = m.actaOficial;
    const actaClosed = acta?.closed === true;
    const actaActual = acta?.actual?.[pid] || acta?.actual?.[String(playerId)] || null;

    // Goles oficiales a favor del equipo en este partido
    const teamGoalsFor = Number(acta?.goalsFor ?? acta?.golesLocal ?? m.goalsFor ?? m.golesLocal ?? 0);

    // Helpers de eventos con Acta como única fuente de verdad
    const allEvents = Array.isArray(m.events) ? m.events : [];
    const goleadoresList = Array.isArray(m.goleadoresList) ? m.goleadoresList : [];
    const tarjetasList = Array.isArray(m.tarjetasList) ? m.tarjetasList : [];

    const calcGoals = () => {
      // Si el equipo no anotó goles en el partido, ningún jugador puede tener goles
      if (teamGoalsFor === 0) return 0;
      // Solo partidos cerrados computan goles oficiales
      if (!actaClosed) return 0;

      if (goleadoresList.length > 0) {
        return goleadoresList.filter(g2 => !g2.esRival && !g2.rival && String(g2.jugadorId || g2.playerId) === pid).length;
      }
      const unifiedEvents = getUnifiedMatchEvents(m);
      return unifiedEvents.filter(e =>
        (e.type === 'gol_local' || e.type === 'goal_own') &&
        (String(e.playerId) === pid || String(e.jugadorId) === pid)
      ).length;
    };

    const calcAssists = () => {
      if (teamGoalsFor === 0) return 0;
      if (!actaClosed) return 0;
      if (goleadoresList.length > 0) {
        return goleadoresList.filter(g2 => !g2.esRival && !g2.rival && String(g2.asistenciaId) === pid).length;
      }
      const unifiedEvents = getUnifiedMatchEvents(m);
      return unifiedEvents.filter(e =>
        String(e.asistenciaId) === pid &&
        (e.type === 'gol_local' || e.type === 'goal_own')
      ).length;
    };

    const calcYellows = () => {
      if (!actaClosed) return 0;
      if (tarjetasList.length > 0) {
        return tarjetasList.filter(t => String(t.jugadorId || t.playerId) === pid && (t.tipo === 'amarilla' || t.tipo === 'yellow')).length;
      }
      const unifiedEvents = getUnifiedMatchEvents(m);
      return unifiedEvents.filter(e =>
        (e.type === 'amarilla' || e.type === 'card_yellow_own' || e.type === 'yellow_card') &&
        (String(e.playerId) === pid || String(e.jugadorId) === pid)
      ).length;
    };

    const calcReds = () => {
      if (!actaClosed) return 0;
      if (tarjetasList.length > 0) {
        return tarjetasList.filter(t => String(t.jugadorId || t.playerId) === pid && (t.tipo === 'roja' || t.tipo === 'red')).length;
      }
      const unifiedEvents = getUnifiedMatchEvents(m);
      return unifiedEvents.filter(e =>
        (e.type === 'roja' || e.type === 'card_red_own' || e.type === 'red_card') &&
        (String(e.playerId) === pid || String(e.jugadorId) === pid)
      ).length;
    };

    const calcRating = () => {
      const actaRating = actaActual?.rating;
      if (actaRating !== undefined && actaRating !== null && actaRating !== '') return Number(actaRating);
      const raw = m.ratings?.[playerId] || m.playerRatings?.[playerId] || m.notas?.[playerId];
      return raw ? Number(raw) : null;
    };

    if (actaClosed && actaActual) {
      let minutesInMatch = 0;
      if (actaActual.minutesOverride !== undefined && actaActual.minutesOverride !== null) {
        minutesInMatch = parseInt(actaActual.minutesOverride, 10) || 0;
      } else {
        const computed = calculateMinutesFromEvents(
          pid,
          getUnifiedMatchEvents(m),
          m.titulares,
          m.suplentes,
          getEffectiveMatchDuration(m),
          actaActual.minutesOverride ?? null,
          actaActual.status,
          actaActual.lateMin ?? null,
          m.tarjetasList || []
        );
        minutesInMatch = computed.minutes;
      }

      const status = actaActual.status || '';
      // Solo cuenta como partido jugado si tuvo minutos en campo (> 0) o si fue titular y no estuvo ausente/lesionado
      const didPlay = minutesInMatch > 0 || (isTitular && status !== 'ausente' && status !== 'lesionado' && status !== 'justificado');
      if (!didPlay) {
        // Convocado sin minutos jugados → no incrementa matchesPlayed
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
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
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

      // Extraer eventos de liveStats filtrados por este jugador (para detalle de partido)
      const allLiveEvents = [
        ...(Array.isArray(m.liveStatsEvents) ? m.liveStatsEvents : []),
        ...(Array.isArray(m.events) ? m.events : [])
      ].filter(e => e && e.playerId && String(e.playerId) === pid);

      // Extraer eventos GK y métricas de portero del partido
      const mGk = m.gkStats?.[pid] || {};
      const gkEvents = allLiveEvents.filter(e => ['save', 'save_own', 'conceded', 'penaltySave', 'claim', 'errorGoal'].includes(e.type));
      const savesInMatch = mGk.saves ?? allLiveEvents.filter(e => e.type === 'save' || e.type === 'save_own').length;
      const concededInMatch = mGk.conceded ?? allLiveEvents.filter(e => e.type === 'conceded').length;
      const penaltySavesInMatch = mGk.penaltySaves ?? allLiveEvents.filter(e => e.type === 'penaltySave').length;
      const claimsInMatch = mGk.claims ?? allLiveEvents.filter(e => e.type === 'claim').length;
      const errorsInMatch = mGk.errors ?? allLiveEvents.filter(e => e.type === 'errorGoal').length;
      const cleanSheetInMatch = mGk.cleanSheet ?? (concededInMatch === 0 && minutesInMatch > 0 ? 1 : 0);
      const shotsFaced = savesInMatch + concededInMatch;
      const savePctInMatch = shotsFaced > 0 ? Math.round((savesInMatch / shotsFaced) * 100) : (cleanSheetInMatch ? 100 : 0);

      totalSaves += savesInMatch;
      totalConceded += concededInMatch;
      totalPenaltySaves += penaltySavesInMatch;
      totalClaims += claimsInMatch;
      totalErrors += errorsInMatch;
      totalCleanSheets += cleanSheetInMatch;

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
        rating: ratingInMatch ? ratingInMatch.toFixed(1) : '-',
        // ── Métricas GK de este partido ──
        gk: {
          saves: savesInMatch,
          conceded: concededInMatch,
          penaltySaves: penaltySavesInMatch,
          claims: claimsInMatch,
          errors: errorsInMatch,
          cleanSheet: cleanSheetInMatch,
          savePercentage: savePctInMatch
        },
        gkEvents,
        // ── Datos enriquecidos para el detalle expandible ──
        misterNote: actaActual.nota ?? actaActual.misterNote ?? null,
        misterComment: (m.playerComments && m.playerComments[pid]) || null,
        actitudStars: actaActual.actitud ?? null,
        liveEvents: allLiveEvents,
        // Estadísticas tácticas de los liveStats del partido completo (no filtrado por jugador)
        allMatchLiveEvents: [
          ...(Array.isArray(m.liveStatsEvents) ? m.liveStatsEvents : []),
          ...(Array.isArray(m.events) ? m.events : [])
        ]
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
      rating: ratingInMatch ? ratingInMatch.toFixed(1) : '-',
      gk: {
        saves: 0,
        conceded: 0,
        penaltySaves: 0,
        claims: 0,
        errors: 0,
        cleanSheet: 0,
        savePercentage: 0
      },
      gkEvents: [],
      misterNote: null,
      misterComment: null,
      actitudStars: null,
      liveEvents: [],
      allMatchLiveEvents: []
    });
  });

  // Ordenar historial por fecha descendente
  matchHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  const totalShotsFaced = totalSaves + totalConceded;
  const savePercentage = totalShotsFaced > 0 
    ? Math.round((totalSaves / totalShotsFaced) * 100) 
    : (totalCleanSheets > 0 ? 100 : 0);
  const savesPerMatch = matchesPlayed > 0 ? parseFloat((totalSaves / matchesPlayed).toFixed(1)) : 0;
  const concededPerMatch = matchesPlayed > 0 ? parseFloat((totalConceded / matchesPlayed).toFixed(1)) : 0;

  return {
    matchesPlayed,
    starts,
    subAppearances,
    minutesPlayed: totalMinutes,
    goals: totalGoals,
    assists: totalAssists,
    yellowCards: totalYellows,
    redCards: totalReds,
    avgRating: avgRating || '-',
    gkStats: {
      saves: totalSaves,
      savesPerMatch,
      conceded: totalConceded,
      concededPerMatch,
      cleanSheets: totalCleanSheets,
      penaltySaves: totalPenaltySaves,
      claims: totalClaims,
      errors: totalErrors,
      savePercentage,
    },
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
