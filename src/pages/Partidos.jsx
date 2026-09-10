import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ActaOficialPanel from '../components/ActaOficialPanel';
import { useLocation } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useTeams } from '../hooks/useTeams';
import { generatePostMatchReportPDF, generateMatchesCalendarPDF } from '../utils/pdfGenerator';
import { generateGoogleCalendarUrl, generateICSContent, downloadICSFile } from '../utils/calendarHelper';
import { PREDEFINED_FORMATIONS } from '../utils/formaciones';
import { useCustomFormations } from '../hooks/useCustomFormations';
import { useMatchEvents } from '../hooks/useMatchEvents';
import CustomFormationModal from '../components/CustomFormationModal';
import FormationSelector from '../components/FormationSelector';
import LiveStats from '../components/LiveStats';
import { MultiMatchAnalysis } from '../components/MultiMatchAnalysis';
import { t, getEffectiveLanguage } from '../i18n/translations';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';
import { useLiveStats } from '../hooks/useLiveStats';
import { SvgDonut, SvgComparisonBars, HalfBreakdown } from '../components/LiveStatsCharts';
import PlayerAvatar from '../components/PlayerAvatar';
import MatchStatsBlock from '../components/MatchStatsBlock';
import MatchErrorBoundary from '../components/MatchErrorBoundary';
import './Partidos.css';
import { normalizeText } from '../utils/normalizeInput';
import { normalizeLineup, applyLineupChange, formatMatchDateSafe } from '../utils/lineupEngine';
import { buildSmartMatchSheetActual, getEffectiveMatchDuration, isMatchLocked, getUnifiedMatchEvents, calculateMinutesFromEvents } from '../utils/minutesEngine';
import { calcMixedRating, deriveStatsFromEvents } from '../utils/ratingFormula';
import { sanitizeMatchData } from '../utils/sanitizeMatchData';
import { showToast } from '../utils/toast';
import { SpellCheckedTextarea } from '../components/ui/SpellCheckedTextarea';

export const normalizeCapitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      if (word.includes('.')) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Pestañas con traducción automática
const TABS_CONFIG = [
  { id: 'PRE-PARTIDO', es: 'PRE-PARTIDO', en: 'PRE-MATCH' },
  { id: 'CONVOCATORIA', es: 'CONVOCATORIA', en: 'SQUAD' },
  { id: 'ALINEACIÓN', es: 'ALINEACIÓN', en: 'LINEUP' },
  { id: 'MATCH-DAY', es: 'DÍA DEL PARTIDO', en: 'MATCH-DAY' },
  { id: 'LIVE-STATS', es: 'ESTADÍSTICAS', en: 'LIVE STATS' },
  { id: 'ACTA', es: '📋 ACTA OFICIAL', en: '📋 MATCH SHEET' },
  { id: 'POST-PARTIDO', es: 'POST-PARTIDO', en: 'POST-MATCH' },
];

// Auxiliar para determinar la zona general de una posición táctica
const getGeneralZone = (pos) => {
  if (['POR'].includes(pos)) return 'POR';
  if (['DEF', 'LTD', 'LTI'].includes(pos)) return 'DEF';
  if (['MC', 'MCD', 'MCO', 'MD', 'MI'].includes(pos)) return 'MC';
  if (['DEL', 'EXT'].includes(pos)) return 'DEL';
  return 'MC';
};

// Distribuidor inteligente de jugadores según posiciones naturales
const alignStartersByPosition = (calledIds = [], players = [], positionsList = []) => {
  const startersIds = calledIds.slice(0, 11).filter(Boolean);
  const subsIds = Array.from({ length: 7 }, (_, i) => calledIds[11 + i] || null);
  const starters = startersIds.map(id => players.find(p => p && p.id === id)).filter(Boolean);
  const assigned = Array(11).fill(null);
  const unassigned = [...starters];

  // 1ra pasada: coincidencias exactas
  positionsList.forEach((slot, slotIdx) => {
    const exactMatchIdx = unassigned.findIndex(p => p.position === slot.pos);
    if (exactMatchIdx !== -1) {
      assigned[slotIdx] = unassigned[exactMatchIdx].id;
      unassigned.splice(exactMatchIdx, 1);
    }
  });

  // 2da pasada: zona general (ej: lateral derecho en defensa)
  positionsList.forEach((slot, slotIdx) => {
    if (assigned[slotIdx]) return;
    const slotZone = getGeneralZone(slot.pos);
    const zoneMatchIdx = unassigned.findIndex(p => getGeneralZone(p.position) === slotZone);
    if (zoneMatchIdx !== -1) {
      assigned[slotIdx] = unassigned[zoneMatchIdx].id;
      unassigned.splice(zoneMatchIdx, 1);
    }
  });

  // 3ra pasada: rellenar slots vacíos restantes con los jugadores sobrantes
  positionsList.forEach((slot, slotIdx) => {
    if (assigned[slotIdx]) return;
    if (unassigned.length > 0) {
      assigned[slotIdx] = unassigned[0].id;
      unassigned.splice(0, 1);
    }
  });

  const alignedXI = assigned.map(val => val || null);
  return [...alignedXI, ...subsIds];
};


// SVG Iconos reutilizables
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const Partidos = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { activeTeam } = useTeams();
  const activeTeamId = activeTeam?.id || null;
  const effectiveTeamId = activeTeamId;
  const { matches, loading: loadingMatches, addMatch, updateMatch, removeMatch } = useMatches(effectiveTeamId);
  const { players, loading: loadingPlayers } = usePlayers(effectiveTeamId);
  const { settings } = useSettings(effectiveTeamId);
  const { darkMode } = useTheme();
  const { language: currentGlobalLanguage, isEn: isGlobalEn } = useTranslation();

  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [mainTab, setMainTab] = useState('LIST'); // 'LIST' or 'ANALISIS'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [isSaving, setIsSaving] = useState(false);

  // Edit State
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const matchDataRef = useRef(matchData);
  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);
  const [calledPlayers, setCalledPlayers] = useState([]);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const pitchRef = useRef(null);
  const pitchExportRef = useRef(null);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  // En desktop y tablet landscape siempre horizontal
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(true); // Siempre horizontal en este layout
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const draggedDistanceRef = useRef(0);

  const [activeQuestion, setActiveQuestion] = useState('tactical');
  const [showReportPreview, setShowReportPreview] = useState(false);

  // --- Estados de Formación Personalizada ---
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomFormation, setEditingCustomFormation] = useState(null);
  const { customFormations, addCustomFormation, updateCustomFormation, deleteCustomFormation } = useCustomFormations();

  // --- Hook de Eventos de Partido (con guardado automático en Firestore) ---
  const { addEvent, removeEvent, makeSubstitution } = useMatchEvents(matchData, setMatchData, players, updateMatch);

  // --- Estados de Match Day (gestionados por MatchContext global) ---
  const {
    matchSeconds,
    isRunning: isTimerRunning,
    toggleTimer,
    resetTimer: resetTimerCtx,
    adjustTimer,
    setActiveMatchId,
    finishMatch,
    syncMatchState,
    currentMinute: ctxCurrentMinute,
    formatMatchTime,
  } = useMatch();

  const [subOutId, setSubOutId] = useState('');
  const [subInId, setSubInId] = useState('');
  const [pendingEventType, setPendingEventType] = useState(null); // 'amarilla' | 'roja' | 'lesion' | 'gol_local'
  const [showEventPlayerSelector, setShowEventPlayerSelector] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const matchDayRef = useRef(null);

  const getFormationPositions = useCallback((lineupName) => {
    if (PREDEFINED_FORMATIONS[lineupName]) {
      return PREDEFINED_FORMATIONS[lineupName];
    }
    const custom = customFormations.find(f => f.name === lineupName);
    if (custom) return custom.positions;
    return PREDEFINED_FORMATIONS['4-3-3'];
  }, [customFormations]);

  const toggleFullscreen = () => {
    if (!matchDayRef.current) return;
    if (!document.fullscreenElement) {
      matchDayRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const { matchId: activeMatchIdCtx } = useMatch();

  const handleTabChange = useCallback(async (tab) => {
    setEditTab(tab);
    const current = matchDataRef.current || matchData;
    if (current?.id) {
      try {
        localStorage.setItem(`mister11_last_edit_tab_${current.id}`, tab);
        // IMPORTANTE: excluir actaOficial del guardado automático para no sobreescribir
        // las correcciones manuales de minutos que el entrenador haya hecho en el panel del acta.
        const { actaOficial: _ignored, ...currentWithoutActa } = current;
        await updateMatch(current.id, { ...currentWithoutActa, convocados: calledPlayers });
      } catch (err) {
        console.error("Error auto-saving match on tab change:", err);
      }
    }
  }, [calledPlayers, updateMatch]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Registrar el partido activo en el contexto global al abrirlo si tiene ID
  useEffect(() => {
    if (matchData?.id) {
      setActiveMatchId(matchData.id);
    }
  }, [matchData?.id, setActiveMatchId]);

  // Manejar navegación directa a un partido si viene desde location.state
  useEffect(() => {
    if (location.state?.matchId && matches && matches.length > 0) {
      const targetMatch = matches.find(m => m.id === location.state.matchId);
      if (targetMatch) {
        handleEditMatch(targetMatch);
      }
    } else if (location.state?.mode === 'create') {
      handleNewMatch();
    }
  }, [location.state, matches]);

  // formatTime usa la función del contexto
  const formatTime = formatMatchTime;

  const isMatchFinished = isMatchLocked(matchData);
  const isEnLanguage = isGlobalEn;

  const handleTimerToggle = isMatchFinished ? () => {} : toggleTimer;
  const handleTimerReset = isMatchFinished ? () => {} : resetTimerCtx;
  const handleTimerAdjust = isMatchFinished ? () => {} : adjustTimer;

  const currentMinute = ctxCurrentMinute;
  const derivedHalf = (matchSeconds >= 2700 || (ctxCurrentMinute && ctxCurrentMinute > 45)) ? 2 : 1;
  const { events: liveEvents, addLiveEvent, resetLiveStats } = useLiveStats(effectiveTeamId, matchData?.id || null, ctxCurrentMinute || 0, derivedHalf);

  const effectiveLiveEvents = useMemo(() => {
    // Fuente principal: liveStats de Firestore (captura en tiempo real)
    const liveBase = (liveEvents && liveEvents.length > 0)
      ? liveEvents
      : (matchData?.liveStatsEvents && matchData.liveStatsEvents.length > 0
          ? matchData.liveStatsEvents
          : []);
    // Eventos del Match-Day (goles, tarjetas, sustituciones registrados en bitácora)
    const matchDayEvents = (matchData?.events || []).filter(Boolean);
    // Unir ambas fuentes deduplicando por id (liveBase tiene precedencia)
    const liveIds = new Set(liveBase.map(e => e?.id).filter(Boolean));
    const extraFromMatchDay = matchDayEvents.filter(e => e && e.id && !liveIds.has(e.id));
    const merged = [...liveBase, ...extraFromMatchDay];
    return merged.length > 0 ? merged : [];
  }, [liveEvents, matchData?.liveStatsEvents, matchData?.events]);

  // Derivados 100% canónicos desde events
  const derivedGoalsFor = useMemo(() => {
    return (matchData.events || []).filter(e => e && e.isValid !== false && (e.type === 'gol_local' || e.type === 'goal_own')).length;
  }, [matchData.events]);

  const derivedGoalsAgainst = useMemo(() => {
    return (matchData.events || []).filter(e => e && e.isValid !== false && (e.type === 'gol_rival' || e.type === 'goal_rival')).length;
  }, [matchData.events]);

  const derivedGoleadores = useMemo(() => {
    return (matchData.events || [])
      .filter(e => e && e.isValid !== false && e.type === 'gol_local')
      .map(e => ({
        jugadorId: e.playerId,
        nombre: e.playerName || (players || []).find(p => p && String(p.id) === String(e.playerId))?.name || 'Jugador',
        minuto: String(e.minute || 0),
        asistenciaId: e.asistenciaId || ''
      }));
  }, [matchData.events, players]);

  const derivedTarjetas = useMemo(() => {
    return (matchData.events || [])
      .filter(e => e && e.isValid !== false && (e.type === 'amarilla' || e.type === 'roja'))
      .map(e => ({
        jugadorId: e.playerId,
        nombre: e.playerName || (players || []).find(p => p && String(p.id) === String(e.playerId))?.name || 'Jugador',
        tipo: e.type,
        minuto: String(e.minute || 0)
      }));
  }, [matchData.events, players]);

  const matchHalfLabel = isMatchFinished
    ? (isEnLanguage ? 'Finished' : 'Finalizado')
    : (matchSeconds < 2700
        ? (isEnLanguage ? '1st Half' : '1ª Parte')
        : (isEnLanguage ? '2nd Half' : '2ª Parte'));

  const handleFinishMatch = useCallback(async () => {
    const currentMatch = matchDataRef.current || matchData;
    if (!currentMatch?.id) return;

    // Si ya está terminado, permitir reabrir o navegar directamente a post-partido
    if (currentMatch.status === 'Terminado') {
      const wantsReopen = window.confirm(
        isEnLanguage
          ? 'This match is already finished. Do you want to reopen it to record more events or edit data?'
          : 'Este partido ya está finalizado. ¿Deseas reabrirlo para registrar más eventos o corregir datos?'
      );
      if (wantsReopen) {
        const reopened = {
          ...currentMatch,
          status: 'Pendiente',
          actaOficial: {
            ...(currentMatch.actaOficial || {}),
            closed: false
          }
        };
        setMatchData(reopened);
        matchDataRef.current = reopened;
        syncMatchState(currentMatch.id, { status: 'Pendiente' });
        try {
          await updateMatch(currentMatch.id, reopened);
          showToast(isEnLanguage ? 'Match reopened.' : 'Partido reabierto.', 'info');
        } catch (e) {
          console.error(e);
        }
      } else {
        setEditTab('POST-PARTIDO');
      }
      return;
    }

    const confirmFinish = window.confirm(
      isEnLanguage
        ? 'Are you sure you want to finish the match? The match will be closed officially, timer stopped, and official sheet and player minutes consolidated.'
        : '¿Deseas dar por finalizado el partido? Se cerrará oficialmente el encuentro, se detendrá el cronómetro y se consolidarán los minutos reales y el acta oficial.'
    );
    if (!confirmFinish) return;

    const finalSec = Number.isFinite(matchSeconds) ? matchSeconds : (currentMatch.finalSeconds || 0);
    finishMatch(finalSec);
    const finalClockStr = formatMatchTime(finalSec);
    syncMatchState(currentMatch.id, { status: 'Terminado', finalSeconds: finalSec, finalClock: finalClockStr, elapsedSeconds: finalSec });

    const nominalDuration = parseInt(currentMatch.duration || currentMatch.duracion || 90, 10);
    let durationType = currentMatch.durationType || 'completo';

    // Si el partido finalizó antes de tiempo (ej. 39:30 en un partido de 90 min)
    if (finalSec > 0 && finalSec < (nominalDuration - 3) * 60) {
      const clockMin = Math.max(1, Math.ceil(finalSec / 60));
      const confirmEarly = window.confirm(
        `⏱️ El partido finalizó a los ${finalClockStr} (${clockMin} min).\n\n` +
        `¿Deseas registrarlo como finalizado anticipadamente (${clockMin} min)?\n\n` +
        `• [Aceptar] = Anticipado (${clockMin} min de juego real para cálculo de minutos).\n` +
        `• [Cancelar] = Completo reglamentario (${nominalDuration} min).`
      );
      durationType = confirmEarly ? 'anticipado' : 'completo';
    }

    const allEvents = getUnifiedMatchEvents({
      ...currentMatch,
      events: effectiveLiveEvents && effectiveLiveEvents.length > 0 ? effectiveLiveEvents : (currentMatch.events || []),
      liveStatsEvents: effectiveLiveEvents && effectiveLiveEvents.length > 0 ? effectiveLiveEvents : (currentMatch.liveStatsEvents || [])
    });

    const effectiveDuration = getEffectiveMatchDuration({
      ...currentMatch,
      status: 'Terminado',
      finalSeconds: finalSec,
      finalClock: finalClockStr,
      durationType,
    });

    const currentActual = currentMatch.actaOficial?.actual || {};
    const rsvpMap = currentMatch.playerRsvp || {};

    const rawTit = (Array.isArray(currentMatch.titulares) && currentMatch.titulares.length > 0)
      ? currentMatch.titulares
      : (calledPlayers || []).slice(0, 11);
    const rawSup = (Array.isArray(currentMatch.suplentes) && currentMatch.suplentes.length > 0)
      ? currentMatch.suplentes
      : (calledPlayers || []).slice(11, 18);
    const rawConv = (Array.isArray(currentMatch.convocados) && currentMatch.convocados.length > 0)
      ? currentMatch.convocados
      : (calledPlayers || []);

    const norm = normalizeLineup(rawTit, rawSup, rawConv);

    const smartActual = buildSmartMatchSheetActual(
      {
        ...currentMatch,
        status: 'Terminado',
        finalSeconds: finalSec,
        finalClock: finalClockStr,
        durationType,
        titulares: norm.titulares,
        suplentes: norm.suplentes,
        convocados: norm.convocados,
        liveStatsEvents: allEvents,
        events: allEvents,
      },
      currentActual,
      rsvpMap,
      user?.uid || 'staff',
      { preserveManual: true }
    );

    // D1: Calcular y asignar notas individuales y métricas GK
    const gkStatsMap = {};
    Object.entries(smartActual).forEach(([pid, act]) => {
      if (act && (act.minutes > 0 || act.minutesOverride > 0)) {
        const playerObj = (players || []).find(p => String(p.id) === String(pid));
        const role = playerObj?.position || playerObj?.posicion || null;
        const stats = deriveStatsFromEvents(pid, allEvents, role);

        if (!act.rating && !currentMatch?.playerRatings?.[pid] && !currentMatch?.ratings?.[pid]) {
          const { mixedRating } = calcMixedRating(stats, act.attitude || 3);
          act.rating = mixedRating;
        }

        if (role === 'POR' || stats.isGoalkeeper) {
          const saves = stats.saves || 0;
          const conceded = stats.conceded || 0;
          const totalShots = saves + conceded;
          const savePct = totalShots > 0 ? Math.round((saves / totalShots) * 100) : 0;
          gkStatsMap[pid] = {
            saves,
            conceded,
            cleanSheet: stats.cleanSheet ? 1 : 0,
            penaltySaves: stats.penaltySaves || 0,
            claims: stats.claims || 0,
            errorGoal: stats.errorGoal || 0,
            savePercentage: savePct,
            rating: act.rating || 6.0
          };
        }
      }
    });

    const nowIso = new Date().toISOString();
    const updated = { 
      ...currentMatch, 
      status: 'Terminado',
      finalClock: finalClockStr,
      finalSeconds: finalSec,
      elapsedSeconds: finalSec,
      durationType,
      titulares: norm.titulares,
      suplentes: norm.suplentes,
      convocados: norm.convocados,
      liveStatsEvents: allEvents,
      events: allEvents,
      goalsFor: derivedGoalsFor,
      goalsAgainst: derivedGoalsAgainst,
      goleadoresList: derivedGoleadores,
      tarjetasList: derivedTarjetas,
      actaOficial: {
        ...(currentMatch.actaOficial || {}),
        actual: smartActual,
        closed: true,
        closedAt: currentMatch.actaOficial?.closedAt || nowIso,
        closedBy: currentMatch.actaOficial?.closedBy || user?.uid || 'staff',
        closedByName: currentMatch.actaOficial?.closedByName || user?.displayName || 'Staff',
        totalDuration: effectiveDuration
      },
      gkStats: {
        ...(currentMatch.gkStats || {}),
        ...gkStatsMap
      }
    };

    // Limpiar campos undefined/Timestamp para garantizar compatibilidad con Firestore
    const deepClean = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(deepClean).filter(v => v !== undefined);
      if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
        try { return new Date(obj.seconds * 1000).toISOString(); } catch { return null; }
      }
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        const cleaned = deepClean(v);
        if (cleaned !== undefined) result[k] = cleaned;
      }
      return result;
    };
    const cleanUpdated = deepClean(updated);
    setMatchData(cleanUpdated);
    matchDataRef.current = cleanUpdated;

    try {
      await updateMatch(currentMatch.id, cleanUpdated);
      syncMatchState(currentMatch.id, cleanUpdated);
      showToast(
        isEnLanguage
          ? '🏁 Match officially finished and closed. Stats and official sheet consolidated.'
          : '🏁 Partido finalizado y cerrado con éxito. Estadísticas y acta oficial consolidadas.',
        'success'
      );
      setEditTab('POST-PARTIDO');
    } catch (err) {
      console.error("Error al finalizar partido:", err);
      showToast(isEnLanguage ? '❌ Error saving finalization: ' + (err.message || '') : '❌ Error al guardar finalización: ' + (err.message || ''), 'error');
    }
  }, [matchData, matchSeconds, finishMatch, formatMatchTime, syncMatchState, updateMatch, effectiveLiveEvents, calledPlayers, players, user, derivedGoalsFor, derivedGoalsAgainst, derivedGoleadores, derivedTarjetas, isEnLanguage]);

  const handleAddLiveEvent = useCallback(async (type, explicitHalf, extraData = {}) => {
    if (addLiveEvent) {
      return await addLiveEvent(type, explicitHalf, extraData);
    }
  }, [addLiveEvent]);

  const handleTriggerEvent = (type) => {
    if (isMatchFinished) {
      alert(isEnLanguage ? 'Match is finished. Cannot register new events.' : 'El partido está finalizado. No se pueden registrar eventos.');
      return;
    }
    if (type === 'gol_rival') {
      addEvent('gol_rival', 'Rival', 'Gol del Rival', currentMinute);
      if (handleAddLiveEvent) handleAddLiveEvent('shot_on_target_rival');
    } else {
      setPendingEventType(type);
      setShowEventPlayerSelector(true);
    }
  };

  const handleSelectEventPlayer = (playerId) => {
    if (isMatchFinished) return;
    if (playerId === 'unassigned') {
      const label = pendingEventType === 'gol_local'
        ? (isEnLanguage ? 'Opponent Own Goal / Unassigned' : 'Autogol rival / Sin asignar')
        : (isEnLanguage ? 'Unassigned' : 'Sin asignar');
      addEvent(pendingEventType, 'unassigned', label, currentMinute);
      if (handleAddLiveEvent && pendingEventType === 'gol_local') {
        handleAddLiveEvent('shot_on_target_own', null, { playerId: 'unassigned', playerName: label });
      }
      setPendingEventType(null);
      setShowEventPlayerSelector(false);
      return;
    }
    const player = players.find(p => p && p.id === playerId);
    if (!player) return;
    addEvent(pendingEventType, playerId, player.name, currentMinute);
    if (handleAddLiveEvent) {
      if (pendingEventType === 'gol_local') {
        handleAddLiveEvent('shot_on_target_own', null, { playerId, playerName: player.name });
      } else if (pendingEventType === 'amarilla') {
        handleAddLiveEvent('card_yellow_own', null, { playerId, playerName: player.name });
      } else if (pendingEventType === 'roja') {
        handleAddLiveEvent('card_red_own', null, { playerId, playerName: player.name });
      } else {
        handleAddLiveEvent('card_own', null, { playerId, playerName: player.name });
      }
    }
    setPendingEventType(null);
    setShowEventPlayerSelector(false);
  };

  const handleMakeSubstitution = () => {
    if (isMatchFinished) {
      alert(isEnLanguage ? 'Match is finished. Substitutions are locked.' : 'El partido ha finalizado. Las sustituciones están bloqueadas.');
      return;
    }
    if (!subOutId || !subInId) {
      alert(isEnLanguage ? 'Please select both the player leaving and entering.' : 'Por favor selecciona quién sale y quién entra.');
      return;
    }
    const result = makeSubstitution(subOutId, subInId, currentMinute);
    if (result && result.success) {
      const newCalled = [...calledPlayers];
      const idxOut = newCalled.indexOf(subOutId);
      const idxIn = newCalled.indexOf(subInId);
      if (idxOut !== -1 && idxIn !== -1) {
        newCalled[idxOut] = subInId;
        newCalled[idxIn] = subOutId;
        setCalledPlayers(newCalled);
      }
      setSubOutId('');
      setSubInId('');
    } else {
      alert(result?.reason || (isEnLanguage ? 'Error performing substitution. Check squad.' : 'Error al realizar la sustitución. Verifica la alineación.'));
    }
  };

  const handleRemoveEvent = (eventIdx) => {
    if (isMatchFinished) {
      if (!window.confirm(isEnLanguage ? 'Match is finished. Do you really want to remove this event from history?' : 'El partido está finalizado. ¿Seguro que deseas eliminar este evento del acta?')) {
        return;
      }
    }
    removeEvent(eventIdx);
  };

  const getLangText = (key) => {
    const isEn = isGlobalEn;
    const texts = {
      'post.title': { es: 'Resultados y Análisis', en: 'Results & Analysis' },
      'post.goalsFor': { es: 'Goles a Favor', en: 'Goals For' },
      'post.goalsAgainst': { es: 'Goles en Contra', en: 'Goals Against' },
      'post.mvp': { es: 'MVP del Partido', en: 'Match MVP' },
      'post.mvpSelect': { es: 'Seleccione MVP', en: 'Select MVP' },
      'post.scorers': { es: 'Goleadores y Asistencias', en: 'Scorers & Assists' },
      'post.scorersPlaceholder': { es: 'Ej. Juan (2), Pedro (1 asistencia)', en: 'e.g. John (2), Peter (1 assist)' },
      'post.notes': { es: 'Análisis General (Notas Tácticas)', en: 'General Analysis (Tactical Notes)' },
      'post.notesPlaceholder': { es: 'Escribe tus conclusiones del partido, puntos de mejora, etc.', en: 'Write match conclusions, areas of improvement, etc.' },
      'post.reportBuilder': { es: 'Informe Guiado (Cuestionario)', en: 'Guided Report (Questionnaire)' },
      'post.images': { es: 'Imágenes y Fotos del Partido', en: 'Match Images & Photos' },
      'post.uploadBtn': { es: 'Subir Fotos', en: 'Upload Photos' },
      'post.viewReport': { es: 'Visualizar Informe', en: 'View Report' },
      'post.downloadReport': { es: 'Descargar PDF', en: 'Download PDF' },
      'post.notFinished': { es: 'El partido aún no ha terminado', en: 'The match has not finished yet' },
      'post.notFinishedDesc': { es: 'Cambie el estado del partido a "Terminado" en la pestaña Pre-Partido para registrar el resultado.', en: 'Change the match status to "Terminado" in the Pre-Partido tab to record the result.' },
      'post.tactical': { es: 'Rendimiento Táctico', en: 'Tactical Performance' },
      'post.tacticalQ': { es: '¿Qué aspectos tácticos del plan de juego funcionaron y cuáles no?', en: 'Which tactical aspects of the game plan worked and which did not?' },
      'post.physical': { es: 'Aspecto Físico/Mental', en: 'Physical/Mental Aspect' },
      'post.physicalQ': { es: '¿Cómo evalúas el nivel físico, esfuerzo y la actitud mental del equipo?', en: 'How do you evaluate the physical level, effort, and mental attitude of the team?' },
      'post.improvement': { es: 'Puntos de Mejora', en: 'Areas for Improvement' },
      'post.improvementQ': { es: '¿Cuáles son los errores clave a corregir y las áreas de mejora prioritarias?', en: 'What are the key errors to correct and priority areas for improvement?' },
      'post.highlights': { es: 'Momentos Clave', en: 'Key Moments' },
      'post.highlightsQ': { es: '¿Qué jugadas destacadas, detalles individuales o notas adicionales deseas resaltar?', en: 'What highlights, individual details, or additional notes do you want to highlight?' },
      'post.previewTitle': { es: 'Vista Previa del Informe Post-Partido', en: 'Post-Match Report Preview' },
      'post.close': { es: 'Cerrar', en: 'Close' },
      'post.noAnswers': { es: 'Sin responder aún.', en: 'Not answered yet.' },
      'post.noImages': { es: 'No hay imágenes adjuntas.', en: 'No images attached.' }
    };
    return texts[key] ? (isEn ? texts[key].en : texts[key].es) : key;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
      const isPng = file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png');

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        if (isSvg) {
          setMatchData(prev => ({
            ...prev,
            postMatchImages: [...(prev.postMatchImages || []), event.target.result]
          }));
          return;
        }

        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          const compressedBase64 = canvas.toDataURL(mimeType, isPng ? 0.92 : 0.8);

          setMatchData(prev => ({
            ...prev,
            postMatchImages: [...(prev.postMatchImages || []), compressedBase64]
          }));
        };
      };
    });
  };

  const handleDeleteImage = (indexToRemove) => {
    setMatchData(prev => ({
      ...prev,
      postMatchImages: (prev.postMatchImages || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAnswerChange = (key, value) => {
    setMatchData(prev => ({
      ...prev,
      postMatchAnswers: {
        ...(prev.postMatchAnswers || {}),
        [key]: value
      }
    }));
  };

  const handleExportPDF = async () => {
    if (!matchData?.id) {
      alert(isGlobalEn ? 'Please save the match before exporting the PDF.' : 'Guarde el partido antes de exportar el PDF.');
      return;
    }
    let lineupImageBase64 = null;
    try {
      const { generateMatchPdfReport } = await import('../utils/matchPdfReport');
      const { drawTacticalPitchCanvas } = await import('../utils/pdfTheme');

      const effLang = currentGlobalLanguage || getEffectiveLanguage();
      const isEn = isGlobalEn;

      try {
        lineupImageBase64 = await drawTacticalPitchCanvas({
          matchData,
          calledPlayers: calledPlayers || [],
          players: players || [],
          customFormations,
          isEn
        });
      } catch (pitchErr) {
        console.warn('Could not generate tactical pitch canvas for PDF:', pitchErr);
      }

      await generateMatchPdfReport({
        mode: 'POST-MATCH',
        teamName: activeTeam?.nombre || activeTeam?.name || 'Mi Equipo',
        matchData,
        events: effectiveLiveEvents || [],
        players: players || [],
        calledPlayers: calledPlayers || [],
        lineupImage: lineupImageBase64,
        language: effLang,
      });
    } catch (e) {
      console.error("Error al exportar el PDF del partido:", e);
      alert(isGlobalEn ? 'Error generating PDF report.' : 'Error al generar el informe PDF del partido.');
    }
  };

  const reportQuestions = [
    { key: 'tactical', label: getLangText('post.tactical'), question: getLangText('post.tacticalQ') },
    { key: 'physical', label: getLangText('post.physical'), question: getLangText('post.physicalQ') },
    { key: 'improvement', label: getLangText('post.improvement'), question: getLangText('post.improvementQ') },
    { key: 'highlights', label: getLangText('post.highlights'), question: getLangText('post.highlightsQ') }
  ];

  const handleSlotClick = async (idx) => {
    if (selectedSlotIdx === null) {
      setSelectedSlotIdx(idx);
      return;
    }

    if (selectedSlotIdx === idx) {
      setSelectedSlotIdx(null);
      return;
    }

    const currentTitulares = Array.from({ length: 11 }, (_, i) => calledPlayers[i] || null);
    const currentSuplentes = Array.from({ length: 7 }, (_, i) => calledPlayers[11 + i] || null);

    const updatedLineup = applyLineupChange(
      {
        titulares: currentTitulares,
        suplentes: currentSuplentes,
        customPositions: matchData.customPositions || {}
      },
      { fromIdx: selectedSlotIdx, toIdx: idx }
    );

    const nextCalled = [...updatedLineup.titulares, ...updatedLineup.suplentes];
    setCalledPlayers(nextCalled);

    setMatchData(prev => ({
      ...prev,
      titulares: updatedLineup.titulares,
      suplentes: updatedLineup.suplentes,
      convocados: updatedLineup.convocados,
      customPositions: updatedLineup.customPositions
    }));

    setSelectedSlotIdx(null);

    // Persistencia inmediata si el partido ya existe en Firestore
    if (matchData.id) {
      try {
        await updateMatch(matchData.id, {
          titulares: updatedLineup.titulares,
          suplentes: updatedLineup.suplentes,
          convocados: updatedLineup.convocados,
          customPositions: updatedLineup.customPositions
        });
      } catch (err) {
        console.warn('[handleSlotClick] Error auto-guardando alineación:', err);
      }
    }
  };

  const handleAssignPosition = (idx, posName) => {
    setMatchData(prev => ({
      ...prev,
      customRoles: {
        ...(prev.customRoles || {}),
        [idx]: posName
      }
    }));
  };

  const handleResetPositions = () => {
    const currentLineup = matchData.lineup || '4-3-3';
    const slots = getFormationPositions(currentLineup);
    const newCalled = alignStartersByPosition(calledPlayers, players, slots);
    setCalledPlayers(newCalled);

    setMatchData(prev => ({
      ...prev,
      convocados: newCalled,
      customPositions: {},
      customRoles: {}
    }));
    setSelectedSlotIdx(null);
  };

  const handleDownloadLineupPng = async () => {
    if (!pitchExportRef.current) return;
    setIsDownloadingPng(true);
    let exportClone = null;
    try {
      const html2canvasMod = await import('html2canvas');
      const html2canvas = html2canvasMod.default || html2canvasMod;

      // Crear clon fuera de pantalla para forzar SIEMPRE renderizado HD profesional
      // idéntico a la versión de escritorio (780px, campo amplio, tarjetas FIFA completas y suplentes en 1 fila)
      exportClone = pitchExportRef.current.cloneNode(true);
      exportClone.classList.add('export-lineup-hd-capture');
      exportClone.style.position = 'fixed';
      exportClone.style.left = '-9999px';
      exportClone.style.top = '0';
      exportClone.style.width = '780px';
      exportClone.style.maxWidth = '780px';
      exportClone.style.minWidth = '780px';
      exportClone.style.boxSizing = 'border-box';
      exportClone.style.zIndex = '-9999';

      // Reubicar cada ficha del clon usando coordenadas exactas sin CSS transform
      // para eliminar completamente el bug de desplazamiento vertical hacia arriba de html2canvas
      const playerChips = exportClone.querySelectorAll('.pitch-player-3d');
      playerChips.forEach((chip) => {
        const topStr = chip.style.top || '50%';
        const leftStr = chip.style.left || '50%';
        const topVal = parseFloat(topStr);
        const leftVal = parseFloat(leftStr);

        chip.style.transform = 'none';
        chip.style.webkitTransform = 'none';
        // Centro exacto sin transform: ancho de tarjeta 58px / 2 = 29px; alto efectivo ~76px / 2 = 38px
        chip.style.left = `calc(${leftVal}% - 29px)`;
        chip.style.top = `calc(${topVal}% - 38px)`;
      });

      document.body.appendChild(exportClone);

      // Breve pausa para asegurar renderizado de fuentes y estilos en el clon
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(exportClone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1B3A2D',
        logging: false,
        width: 780,
        windowWidth: 1024
      });

      const dataUrl = canvas.toDataURL('image/png');
      const rivalName = (matchData.rival || (isGlobalEn ? 'match' : 'partido'))
        .trim()
        .replace(/[^a-zA-Z0-9_\-]/g, '_');
      const lineupName = (matchData.lineup || '4-3-3').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `alineacion_${rivalName}_${lineupName}_${Date.now()}.png`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(isGlobalEn ? 'Lineup exported successfully' : 'Alineación exportada con éxito', 'success');
    } catch (err) {
      console.error('Error al descargar PNG de alineación:', err);
      showToast(isGlobalEn ? 'Error exporting lineup' : 'Error al exportar alineación', 'error');
    } finally {
      if (exportClone && exportClone.parentNode) {
        exportClone.parentNode.removeChild(exportClone);
      }
      setIsDownloadingPng(false);
    }
  };

  const getSlotPosition = (idx) => {
    if (matchData.customRoles && matchData.customRoles[idx]) {
      return matchData.customRoles[idx];
    }
    const defaultForm = getFormationPositions(matchData.lineup || '4-3-3');
    return defaultForm[idx]?.pos || 'DEF';
  };

  const handleDragStart = (e, idx) => {
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    setDraggingIdx(idx);
    dragStartPosRef.current = { x: clientX, y: clientY };
    draggedDistanceRef.current = 0;
  };

  useEffect(() => {
    const handlePointerUpWindow = () => {
      if (draggingIdx !== null) {
        if (draggedDistanceRef.current < 8) {
          handleSlotClick(draggingIdx);
        }
        setDraggingIdx(null);
      }
    };
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('touchend', handlePointerUpWindow);
    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('touchend', handlePointerUpWindow);
    };
  }, [draggingIdx, selectedSlotIdx, calledPlayers, matchData]);

  const handlePitchPointerMove = (e) => {
    if (draggingIdx === null || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();

    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const dist = Math.hypot(clientX - dragStartPosRef.current.x, clientY - dragStartPosRef.current.y);
    draggedDistanceRef.current = dist;

    const xRel = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yRel = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setMatchData(prev => ({
      ...prev,
      customPositions: {
        ...(prev.customPositions || {}),
        [draggingIdx]: { top: `${yRel}%`, left: `${xRel}%` }
      }
    }));
  };

  const parseMatchDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const handleAddToGoogleCalendar = () => {
    if (!matchData.rival) {
      alert(isEnLanguage ? "Enter opponent name before syncing." : "Introduce el nombre del rival antes de sincronizar.");
      return;
    }
    const startDate = parseMatchDateTime(matchData.date, matchData.time);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    const url = generateGoogleCalendarUrl({
      title: `PARTIDO: ${activeTeam?.nombre || 'Mi Equipo'} vs ${matchData.rival}`,
      description: `Partido de fútbol. Alineación prevista: ${matchData.lineup || '4-3-3'}.`,
      location: matchData.location || '',
      startDate,
      endDate
    });
    window.open(url, '_blank');
  };

  const handleExportICS = () => {
    if (!matchData.rival) {
      alert(isEnLanguage ? "Enter opponent name before exporting." : "Introduce el nombre del rival antes de exportar.");
      return;
    }
    const startDate = parseMatchDateTime(matchData.date, matchData.time);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    const icsContent = generateICSContent([{
      id: matchData.id || `match-${Date.now()}`,
      title: `PARTIDO: ${activeTeam?.nombre || 'Mi Equipo'} vs ${matchData.rival}`,
      description: `Partido de fútbol. Alineación prevista: ${matchData.lineup || '4-3-3'}.`,
      location: matchData.location || '',
      startDate,
      endDate
    }]);
    downloadICSFile(`partido_${matchData.rival.replace(/\s+/g, '_')}.ics`, icsContent);
  };

  const handleExportAllMatchesICS = () => {
    if (matches.length === 0) return;
    const events = matches.map(m => {
      const startDate = parseMatchDateTime(m.date, m.time);
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
      return {
        id: m.id,
        title: `PARTIDO: ${activeTeam?.nombre || 'Mi Equipo'} vs ${m.rival}`,
        description: `Partido de fútbol. Alineación prevista: ${m.lineup || '4-3-3'}. Estado: ${m.status}.`,
        location: m.location || '',
        startDate,
        endDate
      };
    });
    const icsContent = generateICSContent(events);
    downloadICSFile(`calendario_partidos_${activeTeam?.nombre?.replace(/\s+/g, '_') || 'equipo'}.ics`, icsContent);
  };

  const handleCancel = () => {
    setActiveMatchId(null);
    setMatchData({});
    setCalledPlayers([]);
    setViewMode('LIST');
  };

  const [showWarningsDetail, setShowWarningsDetail] = useState(false);
  const [cleansingInProgress, setCleansingInProgress] = useState(false);

  const handleNewMatch = () => {
    setActiveMatchId(null);
    const defaultMatch = {
      rival: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      location: '',
      type: 'Local',
      status: 'Pendiente',
      duration: 90,
      durationType: 'completo',
      goalsFor: 0,
      goalsAgainst: 0,
      lineup: '4-3-3',
      events: [],
      liveStatsEvents: [],
      titulares: Array(11).fill(null),
      suplentes: Array(7).fill(null),
      convocados: [],
      postMatchAnswers: { tactical: '', physical: '', improvement: '', highlights: '' },
      postMatchImages: [],
      goleadoresList: [],
      tarjetasList: [],
      actaOficial: { closed: false, actual: {}, rsvp: {}, warnings: [] },
      warnings: []
    };
    const { sanitizedMatch } = sanitizeMatchData(defaultMatch, players);
    setMatchData(sanitizedMatch);
    setCalledPlayers([...sanitizedMatch.titulares, ...sanitizedMatch.suplentes]);
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const handleEditMatch = (rawMatch) => {
    if (!rawMatch) return;
    const { sanitizedMatch } = sanitizeMatchData(rawMatch, players);
    setActiveMatchId(sanitizedMatch.id);
    syncMatchState(sanitizedMatch.id, sanitizedMatch);
    setMatchData(sanitizedMatch);
    setCalledPlayers([...sanitizedMatch.titulares, ...sanitizedMatch.suplentes]);
    const savedTab = localStorage.getItem(`mister11_last_edit_tab_${sanitizedMatch.id}`);
    if (savedTab) setEditTab(savedTab);
    else setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const handleRepairAndOpenMatch = async () => {
    if (!matchData?.id) return;
    try {
      const { sanitizedMatch } = sanitizeMatchData(matchData, players);
      setMatchData(sanitizedMatch);
      setCalledPlayers([...sanitizedMatch.titulares, ...sanitizedMatch.suplentes]);
      if (updateMatch && matchData.id) {
        await updateMatch(matchData.id, sanitizedMatch);
      }
      showToast(isEnLanguage ? '✅ Match repaired and saved successfully.' : '✅ Partido reparado y persistido con éxito.', 'success');
    } catch (err) {
      console.error('Error reparando partido:', err);
      showToast(isEnLanguage ? '❌ Error repairing match.' : '❌ Error al reparar el partido.', 'error');
    }
  };

  const handleCleanseMatchEvents = async () => {
    if (!matchData?.id) return;
    setCleansingInProgress(true);
    try {
      const { sanitizedMatch, warnings } = sanitizeMatchData(matchData, players);
      setMatchData(sanitizedMatch);
      if (updateMatch) {
        await updateMatch(matchData.id, sanitizedMatch);
      }
      showToast(isEnLanguage ? `🧹 Log cleansed successfully. ${warnings.length} records sanitized.` : `🧹 Bitácora depurada con éxito. ${warnings.length} registros saneados.`, 'success');
    } catch (err) {
      console.error('Error depurando bitácora:', err);
      showToast(isEnLanguage ? '❌ Error cleansing log.' : '❌ Error al depurar la bitácora.', 'error');
    } finally {
      setCleansingInProgress(false);
    }
  };

  const togglePlayerCall = (id) => {
    const isCurrentlyCalled = calledPlayers.some(p => p === id);
    if (isCurrentlyCalled) {
      // Liberar el slot asignando null
      const updated = calledPlayers.map(p => (p === id ? null : p));
      const titulares = updated.slice(0, 11);
      const suplentes = updated.slice(11, 18);
      const convocados = [...titulares.filter(Boolean), ...suplentes.filter(Boolean)];
      setCalledPlayers(updated);
      setMatchData(prev => ({
        ...prev,
        titulares,
        suplentes,
        convocados
      }));
    } else {
      const activeCount = calledPlayers.filter(Boolean).length;
      if (activeCount >= 23) return alert(isEnLanguage ? "Maximum 23 selected players allowed." : "Máximo 23 convocados permitidos.");

      const updated = [...calledPlayers];
      while (updated.length < 18) {
        updated.push(null);
      }
      const firstEmptyIdx = updated.findIndex(p => !p);
      if (firstEmptyIdx !== -1 && firstEmptyIdx < 18) {
        updated[firstEmptyIdx] = id;
      } else {
        updated.push(id);
      }
      const titulares = updated.slice(0, 11);
      const suplentes = updated.slice(11, 18);
      const convocados = [...titulares.filter(Boolean), ...suplentes.filter(Boolean)];
      setCalledPlayers(updated);
      setMatchData(prev => ({
        ...prev,
        titulares,
        suplentes,
        convocados
      }));
    }
  };

  const handleSaveMatch = async () => {
    const current = matchDataRef.current || matchData;
    if (!current.rival || !current.rival.trim()) return alert(isEnLanguage ? "Opponent name is required." : "El nombre del rival es obligatorio.");
    setIsSaving(true);
    try {
      const norm = normalizeLineup(
        calledPlayers.slice(0, 11),
        calledPlayers.slice(11, 18),
        calledPlayers.filter(Boolean)
      );
      const isFinished = current.status === 'Terminado' || current.actaOficial?.closed === true;
      const dataToSave = { 
        ...current, 
        ...(isFinished ? {
          status: 'Terminado',
          actaOficial: {
            ...(current.actaOficial || {}),
            closed: true
          }
        } : {}),
        titulares: norm.titulares,
        suplentes: norm.suplentes,
        convocados: norm.convocados,
        liveStatsEvents: effectiveLiveEvents && effectiveLiveEvents.length > 0 ? effectiveLiveEvents : (current.liveStatsEvents || [])
      };
      if (current.id) {
        await updateMatch(current.id, dataToSave);
      } else {
        const newId = await addMatch(dataToSave);
        if (newId) setActiveMatchId(newId);
      }
      handleCancel();
    } catch (error) {
      console.error(error);
      alert(isEnLanguage ? "Error saving match." : "Error al guardar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchData.id) return;
    if (!window.confirm(isEnLanguage ? "Are you sure you want to delete this match?" : "¿Estás seguro de que deseas eliminar este partido?")) return;
    setIsSaving(true);
    try {
      await removeMatch(matchData.id);
      handleCancel();
    } catch (error) {
      console.error(error);
      alert(isEnLanguage ? "Error deleting match." : "Error al eliminar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'Pendientes') return m.status === 'Pendiente';
    if (filterMode === 'Terminados') return m.status === 'Terminado';
    return true;
  }).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (loadingMatches || loadingPlayers) {
    return <div style={{ padding: '24px', color: 'var(--partidos-text-primary)' }}>Cargando datos...</div>;
  }

  return (
    <div className="partidos-page">
      <header className="partidos-header">
        <div className="header-top w-full flex flex-col items-center space-y-3 md:flex-row md:justify-between px-4">
          <h1 className="whitespace-normal text-xl font-bold block text-center">{isGlobalEn ? 'MATCH MANAGEMENT' : 'GESTIÓN DE PARTIDOS'}</h1>
          <div className="partidos-page-actions flex flex-row gap-2 w-full justify-center md:w-auto">
            {viewMode === 'LIST' ? (
              <>
                {matches.length > 0 && (
                  <>
                    <button
                      className="btn-outline-dark flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm"
                      onClick={() => generateMatchesCalendarPDF(matches, activeTeam)}
                      style={{ minHeight: '40px', fontWeight: 'bold' }}
                      title={isGlobalEn ? "Export official season calendar to PDF" : "Exportar calendario oficial de la temporada a PDF"}
                    >
                      📄 {isGlobalEn ? 'PDF CALENDAR' : 'CALENDARIO PDF'}
                    </button>
                    <button
                      className="btn-outline-dark flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm"
                      onClick={handleExportAllMatchesICS}
                      style={{ minHeight: '40px', fontWeight: 'bold' }}
                    >
                      📥 {isGlobalEn ? 'EXPORT ICS' : 'EXPORTAR ICS'}
                    </button>
                  </>
                )}
                <button className="btn-primary-dark flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm" onClick={handleNewMatch} style={{ minHeight: '40px' }}>{isGlobalEn ? '+ NEW MATCH' : '+ NUEVO PARTIDO'}</button>
              </>
            ) : (
              <>
                {matchData.id && (
                  <button
                    className="btn-success flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm"
                    onClick={handleFinishMatch}
                    style={{
                      minHeight: '48px',
                      background: matchData.status === 'Terminado' ? '#1B3A2D' : '#4CAF7D',
                      color: '#FFFFFF',
                      border: matchData.status === 'Terminado' ? '1.5px solid #4CAF7D' : 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(76, 175, 125, 0.3)'
                    }}
                    title={matchData.status === 'Terminado' ? (isGlobalEn ? 'Match finished. Click to review or reopen.' : 'Partido finalizado. Clic para revisar o reabrir.') : (isGlobalEn ? 'Finish and close match' : 'Finalizar y cerrar partido')}
                  >
                    {matchData.status === 'Terminado' ? (isGlobalEn ? '✓ MATCH FINISHED' : '✓ PARTIDO TERMINADO') : (isGlobalEn ? '🏁 FINISH MATCH' : '🏁 FINALIZAR PARTIDO')}
                  </button>
                )}
                {matchData.id && (
                  <button className="btn-danger flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm" onClick={handleDeleteMatch} disabled={isSaving} style={{ minHeight: '40px' }}>
                    <TrashIcon /> {isGlobalEn ? 'DELETE' : 'ELIMINAR'}
                  </button>
                )}
                <button className="btn-outline-dark flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm" onClick={handleCancel} style={{ minHeight: '40px' }}>{isGlobalEn ? 'CANCEL' : 'CANCELAR'}</button>
                <button className="btn-primary-dark flex-1 md:flex-initial px-3 py-2 text-xs md:text-sm" onClick={handleSaveMatch} disabled={isSaving} style={{ minHeight: '40px' }}>
                  {isSaving ? (isGlobalEn ? 'SAVING...' : 'GUARDANDO...') : (isGlobalEn ? 'SAVE MATCH' : 'GUARDAR PARTIDO')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'LIST' && (
        <>
          <div className="list-filters px-4" style={{ margin: '16px auto 0', maxWidth: '1400px' }}>
            <button
              className={`filter-tab ${mainTab === 'LIST' ? 'active' : ''}`}
              onClick={() => setMainTab('LIST')}
              style={{ minHeight: '44px', fontWeight: 'bold' }}
            >
              📋 {t('partidos.tab.lista', settings?.language)}
            </button>
            <button
              className={`filter-tab ${mainTab === 'ANALISIS' ? 'active' : ''}`}
              onClick={() => setMainTab('ANALISIS')}
              style={{ minHeight: '44px', fontWeight: 'bold' }}
            >
              {t('partidos.tab.analisis', settings?.language)}
            </button>
          </div>

          {mainTab === 'LIST' ? (
            <div className="partidos-list-container">
              {matches.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--partidos-text-muted)' }}>
                  <h2>{isGlobalEn ? 'No matches registered' : 'No hay partidos registrados'}</h2>
                  <p>{isGlobalEn ? 'Start by adding a new match.' : 'Comienza añadiendo un nuevo partido.'}</p>
                </div>
              ) : (
                <>
                  <div className="list-filters">
                    <button className={`filter-tab ${filterMode === 'Todos' ? 'active' : ''}`} onClick={() => setFilterMode('Todos')}>{isGlobalEn ? 'All' : 'Todos'}</button>
                    <button className={`filter-tab ${filterMode === 'Pendientes' ? 'active' : ''}`} onClick={() => setFilterMode('Pendientes')}>{isGlobalEn ? 'Pending' : 'Pendientes'}</button>
                    <button className={`filter-tab ${filterMode === 'Terminados' ? 'active' : ''}`} onClick={() => setFilterMode('Terminados')}>{isGlobalEn ? 'Finished' : 'Terminados'}</button>
                  </div>

                    <div className="matches-grid">
                      {filteredMatches.map(m => {
                        const localScore = m.type === 'Local' ? (m.goalsFor ?? 0) : (m.goalsAgainst ?? 0);
                        const visitScore = m.type === 'Local' ? (m.goalsAgainst ?? 0) : (m.goalsFor ?? 0);
                        const isFinishedCard = m.status === 'Terminado' || m.status === 'Finalizado';
                        const statusLabel = isGlobalEn ? (isFinishedCard ? 'Finished' : 'Pending') : (m.status || 'Pendiente');
                        return (
                          <div key={m.id || Math.random()} className="match-card" onClick={() => handleEditMatch(m)}>
                            <div className="mc-header">
                              <span className={`status-badge ${(m.status || 'Pendiente').toLowerCase()}`}>{statusLabel}</span>
                              <span className="mc-date">{formatMatchDateSafe(m, settings?.language)}</span>
                            </div>

                            <div className="mc-body">
                              <div className="team-local">
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)' }}></div>
                                <span className="t-name">{m.type === 'Local' ? (activeTeam?.nombre || (isGlobalEn ? 'My Team' : 'Mi Equipo')) : (m.rival || (isGlobalEn ? 'Opponent' : 'Rival'))}</span>
                              </div>
                              <div className="mc-score">
                                {isFinishedCard ? (
                                  <span>{localScore} - {visitScore}</span>
                                ) : (
                                  <span className="vs">VS</span>
                                )}
                              </div>
                              <div className="team-visit">
                                <span className="t-name">{m.type === 'Visitante' ? (activeTeam?.nombre || (isGlobalEn ? 'My Team' : 'Mi Equipo')) : (m.rival || (isGlobalEn ? 'Opponent' : 'Rival'))}</span>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)' }}></div>
                              </div>
                            </div>

                            <div className="mc-footer">
                              <span>📍 {m.location || (isGlobalEn ? 'No venue' : 'Sin ubicación')}</span>
                              <span>🛡️ {isGlobalEn ? 'Formation: ' : 'Formación: '}{m.lineup || '4-3-3'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </>
              )}
            </div>
          ) : (
            <div className="partidos-list-container" style={{ padding: 0 }}>
              <MultiMatchAnalysis
                matches={matches}
                teamId={activeTeamId}
                language={settings?.language}
                activeTeam={activeTeam}
              />
            </div>
          )}
        </>
      )}

      {viewMode === 'EDIT' && (
        <MatchErrorBoundary
          matchData={matchData}
          onBackToList={() => setViewMode('LIST')}
          onRepairAndOpen={handleRepairAndOpenMatch}
        >
          <div className="partidos-editor-container">
            <div className="editor-tabs">
            {TABS_CONFIG.map(tabObj => (
              <button
                key={tabObj.id}
                className={`e-tab ${editTab === tabObj.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tabObj.id)}
              >
                {isGlobalEn ? tabObj.en : tabObj.es}
              </button>
            ))}
          </div>

          <div className={`editor-content ${editTab === 'LIVE-STATS' ? 'livestats-active' : ''}`}>
            {/* PESTAÑA: PRE-PARTIDO */}
            {editTab === 'PRE-PARTIDO' && (
              <div className="tab-pane pre-partido-container" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <h3 className="section-title">{isGlobalEn ? 'Match General Info' : 'Datos Generales del Encuentro'}</h3>
                <div className="form-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="form-group full">
                    <label>{isGlobalEn ? 'Opponent Team' : 'Equipo Rival'}</label>
                    <input
                      type="text"
                      className="partidos-input"
                      value={matchData.rival || ''}
                      onChange={e => setMatchData({ ...matchData, rival: e.target.value })}
                      onBlur={e => setMatchData(prev => ({ ...prev, rival: normalizeCapitalize(e.target.value) }))}
                      placeholder={isGlobalEn ? "e.g. Real Madrid C.F." : "Ej. Real Madrid C.F."}
                    />
                  </div>
                  <div className="form-group quarter">
                    <label>{isGlobalEn ? 'Date' : 'Fecha'}</label>
                    <input type="date" className="partidos-input" value={matchData.date || ''} onChange={e => setMatchData({ ...matchData, date: e.target.value })} />
                  </div>
                  <div className="form-group quarter">
                    <label>{isGlobalEn ? 'Time' : 'Hora'}</label>
                    <input type="time" className="partidos-input" value={matchData.time || ''} onChange={e => setMatchData({ ...matchData, time: e.target.value })} />
                  </div>
                  <div className="form-group quarter">
                    <label>{isGlobalEn ? 'Home / Away' : 'Local / Visitante'}</label>
                    <select className="partidos-input" value={matchData.type || 'Local'} onChange={e => setMatchData({ ...matchData, type: e.target.value })}>
                      <option value="Local">{isGlobalEn ? 'Home' : 'Local'}</option>
                      <option value="Visitante">{isGlobalEn ? 'Away' : 'Visitante'}</option>
                    </select>
                  </div>
                  <div className="form-group quarter">
                    <label>{isGlobalEn ? 'Status' : 'Estado'}</label>
                    <select className="partidos-input" value={matchData.status || 'Pendiente'} onChange={e => setMatchData({ ...matchData, status: e.target.value })}>
                      <option value="Pendiente">{isGlobalEn ? 'Pending' : 'Pendiente'}</option>
                      <option value="Terminado">{isGlobalEn ? 'Finished' : 'Terminado'}</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>{isGlobalEn ? 'Stadium / Venue' : 'Estadio / Lugar'}</label>
                    <input
                      type="text"
                      className="partidos-input"
                      value={matchData.location || ''}
                      onChange={e => setMatchData({ ...matchData, location: e.target.value })}
                      onBlur={e => setMatchData(prev => ({ ...prev, location: normalizeCapitalize(e.target.value) }))}
                      placeholder={isGlobalEn ? "e.g. Municipal Stadium / Sports Complex" : "Ej. Campo Municipal / Estadio"}
                    />
                  </div>
                  <div className="form-group full" style={{ marginTop: '16px' }}>
                    <label>{isGlobalEn ? 'Calendar Sync' : 'Sincronización de Calendario'}</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAddToGoogleCalendar}
                        style={{
                          backgroundColor: '#1B3A2D',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          minHeight: '44px',
                          border: 'none'
                        }}
                      >
                        📅 Google Calendar
                      </button>
                      <button
                        type="button"
                        onClick={handleExportICS}
                        style={{
                          backgroundColor: '#4CAF7D',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          minHeight: '44px',
                          border: 'none'
                        }}
                      >
                        📥 {isGlobalEn ? 'EXPORT .ICS' : 'EXPORTAR .ICS'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-actions-bottom">
                  <div>
                    {matchData.id && (
                      <button className="eliminar-toggle" onClick={handleDeleteMatch} disabled={isSaving}>
                        <TrashIcon />
                        <span>{isGlobalEn ? 'DELETE' : 'ELIMINAR'}</span>
                      </button>
                    )}
                  </div>
                  <div className="form-actions-right">
                    <button className="btn-outline-dark" onClick={() => setViewMode('LIST')}>{isGlobalEn ? 'CANCEL' : 'CANCELAR'}</button>
                    <button className="btn-primary-dark" onClick={handleSaveMatch} disabled={isSaving}>{isSaving ? (isGlobalEn ? 'SAVING...' : 'GUARDANDO...') : (isGlobalEn ? 'SAVE MATCH' : 'GUARDAR PARTIDO')}</button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: CONVOCATORIA */}
            {editTab === 'CONVOCATORIA' && (
              <div className="tab-pane convocatoria-container" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <div className="conv-header">
                  <h3 className="section-title">{isGlobalEn ? 'Player Selection' : 'Selección de Jugadores'}</h3>
                  <div className="conv-count">
                    {calledPlayers.filter(Boolean).length} / {players.length || 23} {isGlobalEn ? 'Called' : 'Convocados'}
                  </div>
                </div>
                <div className="players-checklist">
                  {players.map(p => {
                    const isSelected = calledPlayers.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`player-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePlayerCall(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px' }}
                      >
                        <PlayerAvatar player={p} size={36} showNumber={true} />
                        <div className="pc-info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="pc-name" style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</span>
                          <span className="pc-pos" style={{
                            fontSize: '11px',
                            color: (p.position === 'POR' || p.posicion === 'POR') ? '#2563EB' : 'var(--partidos-text-muted)',
                            fontWeight: (p.position === 'POR' || p.posicion === 'POR') ? '800' : 'normal'
                          }}>
                            {(p.position === 'POR' || p.posicion === 'POR') ? '🧤 POR' : (p.position || p.posicion || 'JUG')}
                          </span>
                        </div>
                        <div className="pc-check">{isSelected ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA: ALINEACIÓN */}
            {editTab === 'ALINEACIÓN' && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
                {/* Cabecera Superior de la Pestaña ALINEACIÓN con Botón Oficial de Descarga PNG */}
                <div
                  className="lineup-header-bar"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 28px 14px 28px',
                    borderBottom: '1.5px solid var(--partidos-border)',
                    flexWrap: 'wrap',
                    gap: '14px',
                    backgroundColor: 'var(--partidos-panel-bg)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--partidos-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📋</span>
                      <span>{t('matches.lineup.title')}</span>
                    </h3>
                    <span style={{ fontSize: '12.5px', color: 'var(--partidos-text-muted)', fontWeight: '500' }}>
                      {t('matches.lineup.subtitle')}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-download-lineup-png"
                    onClick={handleDownloadLineupPng}
                    disabled={isDownloadingPng}
                    style={{
                      minHeight: '48px',
                      padding: '0 22px',
                      backgroundColor: '#1B3A2D',
                      border: '1.5px solid #D4A843',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      cursor: isDownloadingPng ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(27, 58, 45, 0.25)',
                      transition: 'all 0.2s ease',
                      opacity: isDownloadingPng ? 0.7 : 1
                    }}
                    title={t('matches.lineup.downloadPng')}
                  >
                    <span style={{ fontSize: '16px' }}>{isDownloadingPng ? '⏳' : '📥'}</span>
                    <span>{isDownloadingPng ? t('matches.lineup.exportingPng') : t('matches.lineup.downloadPng')}</span>
                  </button>
                </div>

                <div className="tab-pane alineacion-layout" style={{ padding: '24px 28px', boxSizing: 'border-box' }}>
                <div className="alin-sidebar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <FormationSelector
                      activeFormation={matchData.lineup || '4-3-3'}
                      onSelect={(formationName, isCustom, customObj) => {
                        setMatchData(prev => ({
                          ...prev,
                          lineup: formationName
                        }));
                        const slots = isCustom ? customObj.positions : PREDEFINED_FORMATIONS[formationName];
                        if (slots) {
                          const newCalled = alignStartersByPosition(calledPlayers, players, slots);
                          setCalledPlayers(newCalled);
                          setMatchData(prev => ({ ...prev, convocados: newCalled }));
                        }
                      }}
                      onNewFormation={() => {
                        setEditingCustomFormation(null);
                        setIsCustomModalOpen(true);
                      }}
                      onEditFormation={(f) => {
                        setEditingCustomFormation(f);
                        setIsCustomModalOpen(true);
                      }}
                      onDeleteFormation={async (id) => {
                        try {
                          await deleteCustomFormation(id);
                          if (matchData.lineup === id) {
                            setMatchData(prev => ({ ...prev, lineup: '4-3-3' }));
                          }
                        } catch (err) {
                          console.error("Error al eliminar formación personalizada:", err);
                        }
                      }}
                      formations={customFormations}
                      isGlobalEn={isGlobalEn}
                    />
                    <button type="button" className="btn-reset-layout" onClick={handleResetPositions}>
                      🔄 {isGlobalEn ? 'Reset Field' : 'Restablecer Campo'}
                    </button>
                  </div>

                  {/* XI Titular - en una sola columna para nombre completo */}
                  <div>
                    <h4 style={{ margin: '8px 0' }}>{isGlobalEn ? 'Starting XI' : 'XI Titular'} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--partidos-text-muted)' }}>({calledPlayers.slice(0, 11).filter(Boolean).length}/11)</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      {Array.from({ length: 11 }).map((_, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? (players.find(p => p && p.id === pid) || null) : null;
                        const posName = getSlotPosition(idx);
                        const isSelected = selectedSlotIdx === idx;
                        const isEn = isGlobalEn;
                        const isGk = posName === 'POR' || (player && (player.position === 'POR' || player.posicion === 'POR'));

                        return (
                          <div
                            key={`starter-${idx}`}
                            className={`alin-player-item ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                            onClick={() => handleSlotClick(idx)}
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: '10px', cursor: 'pointer', minWidth: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <PlayerAvatar player={player} size={28} showNumber={false} />
                              <span className="slot-num" style={{ fontSize: '13px', fontWeight: '900', color: 'var(--partidos-gold)', minWidth: '18px' }}>{player ? (player.number ?? '-') : '-'}</span>
                              <span className="slot-name" style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{player ? (player.name || (isEn ? 'Player' : 'Jugador')) : (isEn ? 'Empty' : 'Vacío')}</span>
                            </div>
                            <span className="slot-role" style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isGk ? 'rgba(37,99,235,0.12)' : 'rgba(0,0,0,0.06)',
                              color: isGk ? '#2563EB' : 'var(--partidos-text-muted)',
                              fontWeight: '800'
                            }}>
                              {isGk ? '🧤 POR' : posName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suplentes - en una sola columna para nombre completo */}
                  <div>
                    <h4 style={{ margin: '8px 0' }}>Suplentes <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--partidos-text-muted)' }}>({calledPlayers.slice(11, 18).filter(Boolean).length}/7)</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      {Array.from({ length: 7 }).map((_, subIdx) => {
                        const idx = 11 + subIdx;
                        const pid = calledPlayers[idx];
                        const player = pid ? (players.find(p => p && p.id === pid) || null) : null;
                        const isSelected = selectedSlotIdx === idx;
                        const isEn = isGlobalEn;

                        return (
                          <div
                            key={`sub-${idx}`}
                            className={`alin-player-item ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                            onClick={() => handleSlotClick(idx)}
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: '10px', cursor: 'pointer', minWidth: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <PlayerAvatar player={player} size={28} showNumber={false} />
                              <span className="slot-num" style={{ fontSize: '13px', fontWeight: '900', color: 'var(--partidos-gold)', minWidth: '18px' }}>{player ? (player.number ?? '-') : '-'}</span>
                              <span className="slot-name" style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{player ? (player.name || (isEn ? 'Player' : 'Jugador')) : (isEn ? 'Empty' : 'Vacío')}</span>
                            </div>
                            <span className="slot-role" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)', color: 'var(--partidos-gold)', fontWeight: '800' }}>SUP</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedSlotIdx !== null && selectedSlotIdx < 11 && (
                    <div className="pos-assignment-panel">
                      <h5>Asignar Posición</h5>
                      <div className="pos-badges-grid">
                        {['POR', 'LTD', 'DEF', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'].map(posName => (
                          <button
                            key={posName}
                            type="button"
                            className={`pos-badge-btn ${getSlotPosition(selectedSlotIdx) === posName ? 'active' : ''}`}
                            onClick={() => handleAssignPosition(selectedSlotIdx, posName)}
                          >
                            {posName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="alin-pitch-wrapper"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '16px 20px 60px 20px',
                    overflow: 'visible',
                    position: 'relative',
                    minHeight: 'fit-content',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Pizarra Completa Exportable: Once Titular + Banquillo de Suplentes */}
                  <div
                    className="alin-pitch-export-board"
                    ref={pitchExportRef}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'linear-gradient(180deg, #142a20 0%, #1B3A2D 100%)',
                      padding: '18px 20px 22px 20px',
                      borderRadius: '16px',
                      border: '2px solid #D4A843',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                      width: '100%',
                      maxWidth: '740px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      className="alin-pitch-container-h3d"
                      ref={pitchRef}
                      onPointerMove={handlePitchPointerMove}
                      onTouchMove={handlePitchPointerMove}
                      style={{ touchAction: 'none' }}
                    >
                      {/* Terreno de juego HORIZONTAL NATIVO */}
                      <div className="pitch-h-outer">
                        <div className="pitch-h-center-line"></div>
                        <div className="pitch-h-center-circle"></div>
                        <div className="pitch-h-spot-center"></div>
                        <div className="pitch-h-penalty-left"></div>
                        <div className="pitch-h-goal-left"></div>
                        <div className="pitch-h-penalty-right"></div>
                        <div className="pitch-h-goal-right"></div>
                      </div>

                      {/* Fichas de Jugadores — posiciones directas de formaciones.js (ya en horizontal) */}
                      {getFormationPositions(matchData.lineup || '4-3-3').map((pos, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? (players.find(p => p && p.id === pid) || null) : null;
                        const customPos = matchData.customPositions && matchData.customPositions[idx];
                        const isEn = isGlobalEn;

                        // Las posiciones en formaciones.js ya son HORIZONTALES: left=X, top=Y
                        // Clampear top entre 12% y 84% para proteger márgenes superior e inferior sin desbordes
                        const rawTop = parseFloat(customPos ? customPos.top : pos.top);
                        const clampedTop = Math.min(Math.max(rawTop, 12), 84);
                        const topPos = `${clampedTop}%`;
                        const rawLeft = parseFloat(customPos ? customPos.left : pos.left);
                        const clampedLeft = Math.min(Math.max(rawLeft, 8), 90);
                        const leftPos = `${clampedLeft}%`;

                        const posLabel = getSlotPosition(idx);
                        const isSelected = selectedSlotIdx === idx;
                        const photoUrl = player ? (player.avatarUrl || player.photoUrl || player.photo || player.photoPreview) : null;

                        return (
                          <div
                            key={idx}
                            className={`pitch-player-3d ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                            style={{
                              top: topPos,
                              left: leftPos,
                              zIndex: draggingIdx === idx ? 99 : isSelected ? 30 : Math.round(clampedTop)
                            }}
                            title={player ? `Jugador: ${player.name}\nDorsal: ${player.number ?? '-'}\nPosición: ${player.position || posLabel}` : (isEn ? 'Empty Slot' : 'Slot Vacío')}
                            onPointerDown={(e) => handleDragStart(e, idx)}
                            onTouchStart={(e) => handleDragStart(e, idx)}
                          >
                            <div className="futu-card-badge">
                              <div className={`futu-card-frame ${player ? '' : 'empty-slot'}`}>
                                {player ? (
                                  photoUrl ? (
                                    <img src={photoUrl} alt={player.name} className="futu-card-photo" />
                                  ) : (
                                    <div className="futu-card-initials">
                                      {player.number || (player.name ? player.name.charAt(0).toUpperCase() : idx + 1)}
                                    </div>
                                  )
                                ) : (
                                  <div className="futu-card-initials empty">
                                    {idx + 1}
                                  </div>
                                )}
                                <span className="futu-card-number">{player?.number ?? (idx + 1)}</span>
                                <span className="futu-card-pos">{posLabel}</span>
                              </div>
                              <div className="futu-card-banner">
                                {player ? `${player.number !== undefined && player.number !== null ? player.number + ' - ' : ''}${player.name || (isEn ? 'Player' : 'Jugador')}` : `Slot ${idx + 1}`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Banquillo de Suplentes (7 slots) integrado en la pizarra */}
                    <div className="lineup-bench-board">
                      <div className="lineup-bench-header">
                        <span className="lineup-bench-title">
                          <span>🪑</span>
                          <span>{t('matches.lineup.benchTitle')}</span>
                        </span>
                        <span className="lineup-bench-count">
                          {calledPlayers.slice(11, 18).filter(Boolean).length}/7
                        </span>
                      </div>

                      <div className="lineup-bench-grid">
                        {Array.from({ length: 7 }).map((_, subIdx) => {
                          const idx = 11 + subIdx;
                          const pid = calledPlayers[idx];
                          const player = pid ? (players.find(p => p && p.id === pid) || null) : null;
                          const isSelected = selectedSlotIdx === idx;
                          const isGk = player && (player.position === 'POR' || player.posicion === 'POR');
                          const photoUrl = player ? (player.avatarUrl || player.photoUrl || player.photo || player.photoPreview) : null;

                          return (
                            <div
                              key={`bench-slot-${subIdx}`}
                              className={`bench-player-chip ${player ? 'bench-occupied' : 'bench-empty'} ${isSelected ? 'selected-swap' : ''}`}
                              onClick={() => handleSlotClick(idx)}
                              title={player ? `${player.name} (${isGk ? 'POR' : (player.position || player.posicion || 'SUB')})` : t('matches.lineup.emptySlot')}
                            >
                              {player ? (
                                <>
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={player.name} className="bench-player-avatar-img" />
                                  ) : (
                                    <div className="bench-player-avatar-placeholder">
                                      {player.number || (player.name ? player.name.charAt(0).toUpperCase() : 'S')}
                                    </div>
                                  )}
                                  <span className="bench-player-name">
                                    {player.name}
                                  </span>
                                  <span className="bench-player-pos" style={{ color: isGk ? '#60A5FA' : '#D4A843' }}>
                                    {isGk ? '🧤 POR' : (player.position || player.posicion || `SUB ${subIdx + 1}`)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="bench-empty-number">
                                    {subIdx + 1}
                                  </div>
                                  <span className="bench-empty-label">
                                    {t('matches.lineup.emptySlot')}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* PESTAÑA: MATCH-DAY */}
            {editTab === 'MATCH-DAY' && (
              <div className="tab-pane match-day-container" ref={matchDayRef} style={{ padding: '24px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>⏱️ {isGlobalEn ? 'Control Panel - Match Day' : 'Panel de Control - Día del Partido'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleFinishMatch}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        minHeight: '48px',
                        cursor: 'pointer',
                        border: matchData.status === 'Terminado' ? '1.5px solid #4CAF7D' : 'none',
                        borderRadius: '8px',
                        background: matchData.status === 'Terminado' ? '#1B3A2D' : '#4CAF7D',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(76, 175, 125, 0.3)'
                      }}
                    >
                      {matchData.status === 'Terminado' ? (isGlobalEn ? '✓ Match Finished' : '✓ Partido Terminado') : (isGlobalEn ? '🏁 Finish Match' : '🏁 Finalizar Partido')}
                    </button>
                    <button
                      type="button"
                      className="btn-outline-dark"
                      onClick={toggleFullscreen}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        minHeight: '44px',
                        cursor: 'pointer',
                        border: '1px solid var(--partidos-border)',
                        borderRadius: '8px',
                        background: 'var(--partidos-input-bg)',
                        color: 'var(--partidos-text-primary)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    >
                      {isFullscreen ? (isGlobalEn ? '🗗 Exit Fullscreen' : '🗗 Salir Pantalla Completa') : (isGlobalEn ? '📺 Fullscreen' : '📺 Pantalla Completa')}
                    </button>
                  </div>
                </div>

                <div className="match-day-grid">
                  {/* Cronómetro y Marcador */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="timer-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--partidos-text-muted)' }}>
                          {matchHalfLabel}
                        </span>
                        {isMatchFinished && (
                          <span style={{ background: '#15803D', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            ⏹️ {isEnLanguage ? 'FINAL' : 'FINAL'}
                          </span>
                        )}
                      </div>
                      <span className="timer-display">{formatTime(matchSeconds)}</span>
                      {!isMatchFinished ? (
                        <>
                          <div className="timer-controls">
                            <button
                              className={`timer-btn ${isTimerRunning ? 'pause' : 'start'}`}
                              onClick={handleTimerToggle}
                            >
                              {isTimerRunning ? (isGlobalEn ? '⏸️ Pause' : '⏸️ Pausar') : (isGlobalEn ? '▶️ Start' : '▶️ Iniciar')}
                            </button>
                            <button className="timer-btn reset" onClick={handleTimerReset}>🔄 {isGlobalEn ? 'Reset' : 'Reiniciar'}</button>
                          </div>
                          <div className="timer-adjust">
                            <button className="timer-adjust-btn" onClick={() => handleTimerAdjust(-60)}>-1m</button>
                            <button className="timer-adjust-btn" onClick={() => handleTimerAdjust(60)}>+1m</button>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', color: 'var(--partidos-text-muted)', textAlign: 'center', marginTop: '8px' }}>
                          🔒 {isEnLanguage ? 'Timer and controls frozen (Match Finished)' : 'Cronómetro y controles congelados (Partido Terminado)'}
                        </div>
                      )}
                    </div>

                    <div className="live-scoreboard">
                      <div className="scoreboard-teams">
                        <div className="scoreboard-team">{activeTeam?.nombre || (isGlobalEn ? 'My Team' : 'Mi Equipo')}</div>
                        <div className="scoreboard-score">
                          {derivedGoalsFor} - {derivedGoalsAgainst}
                        </div>
                        <div className="scoreboard-team">{matchData.rival || (isGlobalEn ? 'Opponent' : 'Rival')}</div>
                      </div>
                      <div className="scoreboard-buttons">
                        <button
                          className="scoreboard-btn local"
                          onClick={() => handleTriggerEvent('gol_local')}
                          disabled={isMatchFinished}
                          style={{ opacity: isMatchFinished ? 0.5 : 1, cursor: isMatchFinished ? 'not-allowed' : 'pointer' }}
                        >
                          ⚽ {isGlobalEn ? 'GOAL (US)' : 'GOL LOCAL'}
                        </button>
                        <button
                          className="scoreboard-btn rival"
                          onClick={() => handleTriggerEvent('gol_rival')}
                          disabled={isMatchFinished}
                          style={{ opacity: isMatchFinished ? 0.5 : 1, cursor: isMatchFinished ? 'not-allowed' : 'pointer' }}
                        >
                          ⚽ {isGlobalEn ? 'GOAL (OPPONENT)' : 'GOL RIVAL'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Sustituciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="substitutions-panel">
                      <h4 className="sub-section-title" style={{ borderBottom: '1px solid var(--partidos-border)', paddingBottom: '6px', marginBottom: '12px' }}>🔄 {isGlobalEn ? 'Make Substitution' : 'Realizar Sustitución'}</h4>
                      <div className="sub-selectors">
                        <div>
                          <label className="input-label-caps" style={{ fontSize: '11px' }}>{isGlobalEn ? 'Out (Starter on Field)' : 'Sale (Titular en Campo)'}</label>
                          <select
                            className="partidos-input"
                            value={subOutId}
                            onChange={e => setSubOutId(e.target.value)}
                            disabled={isMatchFinished}
                          >
                            <option value="">{isGlobalEn ? 'Select starter...' : 'Seleccionar titular...'}</option>
                            {calledPlayers.slice(0, 11).map((id, idx) => {
                              if (!id) return null;
                              const p = players.find(pl => pl && pl.id === id);
                              return p ? <option key={`out-${id}-${idx}`} value={id}>{p.number ? `#${p.number} ` : ''}{p.name}</option> : null;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="input-label-caps" style={{ fontSize: '11px' }}>{isGlobalEn ? 'In (Substitute on Bench)' : 'Entra (Suplente en Banquillo)'}</label>
                          <select
                            className="partidos-input"
                            value={subInId}
                            onChange={e => setSubInId(e.target.value)}
                            disabled={isMatchFinished}
                          >
                            <option value="">{isGlobalEn ? 'Select substitute...' : 'Seleccionar suplente...'}</option>
                            {calledPlayers.slice(11, 18).map((id, idx) => {
                              if (!id) return null;
                              const p = players.find(pl => pl && pl.id === id);
                              return p ? <option key={`in-${id}-${idx}`} value={id}>{p.number ? `#${p.number} ` : ''}{p.name}</option> : null;
                            })}
                          </select>
                        </div>
                      </div>
                      <button
                        className="btn-success-green-allcaps"
                        style={{ width: '100%', minHeight: '48px', opacity: isMatchFinished ? 0.5 : 1, cursor: isMatchFinished ? 'not-allowed' : 'pointer' }}
                        onClick={handleMakeSubstitution}
                        disabled={isMatchFinished}
                      >
                        🔄 {isGlobalEn ? 'Confirm Substitution' : 'Confirmar Sustitución'}
                      </button>
                    </div>

                    <div className="live-events-panel">
                      <div className="event-action-buttons">
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('amarilla')} disabled={isMatchFinished} style={{ opacity: isMatchFinished ? 0.5 : 1 }}>🟨 {isGlobalEn ? 'Yellow Card' : 'Amarilla'}</button>
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('roja')} disabled={isMatchFinished} style={{ opacity: isMatchFinished ? 0.5 : 1 }}>🟥 {isGlobalEn ? 'Red Card' : 'Roja'}</button>
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('lesion')} disabled={isMatchFinished} style={{ opacity: isMatchFinished ? 0.5 : 1 }}>🩺 {isGlobalEn ? 'Injury' : 'Lesión'}</button>
                      </div>
                    </div>
                  </div>

                  {/* Bitácora de Eventos */}
                  <div className="post-partido-full-width-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="events-log-card">
                      <h4 className="card-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📋 {isGlobalEn ? 'Match Event Log (Real Time)' : 'Bitácora del Partido (Tiempo Real)'}</span>
                        {matchData?.warnings && matchData.warnings.length > 0 && !matchData.warningsResolved && (
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleTabChange('acta')}
                            title={isGlobalEn
                              ? `${matchData.warnings.length} anomalies detected (click to view and resolve in Official Sheet)`
                              : `${matchData.warnings.length} anomalías detectadas (clic para ver y resolver en Acta Oficial)`}
                          >
                            ⚠️ {matchData.warnings.length}
                          </span>
                        )}
                      </h4>
                      <div className="events-log-list">
                        {(!matchData.events || matchData.events.length === 0) ? (
                          <p style={{ margin: '15px 0', fontSize: '14px', color: 'var(--partidos-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                            {isGlobalEn ? 'No events recorded in this match.' : 'No se han registrado eventos en este partido.'}
                          </p>
                        ) : (
                          [...matchData.events].reverse().map((ev, idx) => {
                            if (!ev) return null;
                            const originalIdx = matchData.events.length - 1 - idx;
                            let icon = '⚡';
                            let desc = '';
                            if (ev.type === 'gol_local') { icon = '⚽'; desc = isGlobalEn ? `GOAL! ${ev.playerName || 'Player'} scores for the team.` : `¡GOL! ${ev.playerName || 'Jugador'} anota para el equipo.`; }
                            else if (ev.type === 'gol_rival') { icon = '⚽'; desc = isGlobalEn ? `Goal for ${matchData.rival || 'Opponent'}.` : `Gol de ${matchData.rival || 'Rival'}.`; }
                            else if (ev.type === 'amarilla') { icon = '🟨'; desc = isGlobalEn ? `Yellow Card for ${ev.playerName || 'Player'}.` : `Tarjeta Amarilla para ${ev.playerName || 'Jugador'}.`; }
                            else if (ev.type === 'roja') { icon = '🟥'; desc = isGlobalEn ? `Red Card for ${ev.playerName || 'Player'}.` : `Tarjeta Roja para ${ev.playerName || 'Jugador'}.`; }
                            else if (ev.type === 'lesion') { icon = '🩺'; desc = isGlobalEn ? `Injury: ${ev.playerName || 'Player'}.` : `Lesión de ${ev.playerName || 'Jugador'}.`; }
                            else if (ev.type === 'sustitucion' || ev.type === 'cambio') { icon = '🔄'; desc = isGlobalEn ? `Sub: Out ${ev.playerOutName || 'Player'}, In ${ev.playerInName || 'Player'}.` : `Cambio: Sale ${ev.playerOutName || 'Jugador'} y entra ${ev.playerInName || 'Jugador'}.`; }

                            return (
                              <div key={idx} className="event-log-item">
                                <span className="event-log-time">Min. {ev.minute || 0}'</span>
                                <span style={{ fontSize: '18px' }}>{icon}</span>
                                <span className="event-log-desc">{desc}</span>
                                <button className="event-log-remove" onClick={() => handleRemoveEvent(originalIdx)} title={isGlobalEn ? 'Delete event' : 'Eliminar evento'}>✕</button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MODAL PARA SELECCIONAR JUGADOR EN EVENTO MATCH DAY (Dentro del contenedor Fullscreen) */}
                  {showEventPlayerSelector && (
                    <div className="event-selector-overlay" onClick={() => setShowEventPlayerSelector(false)} style={{ zIndex: 99999 }}>
                      <div className="event-selector-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 className="event-selector-title">
                            {pendingEventType === 'gol_local' ? (isGlobalEn ? '⚽ Select Goalscorer' : '⚽ Seleccionar Goleador') :
                              pendingEventType === 'amarilla' ? (isGlobalEn ? '🟨 Yellow Card' : '🟨 Tarjeta Amarilla') :
                                pendingEventType === 'roja' ? (isGlobalEn ? '🟥 Red Card' : '🟥 Tarjeta Roja') : (isGlobalEn ? '🩺 Record Injury' : '🩺 Registrar Lesión')}
                          </h4>
                          <button
                            onClick={() => setShowEventPlayerSelector(false)}
                            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--partidos-text-primary)' }}
                          >✕</button>
                        </div>

                        <div className="event-selector-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto', padding: '4px' }}>
                          {pendingEventType === 'gol_local' && (
                            <button
                              type="button"
                              className="event-selector-item"
                              onClick={() => handleSelectEventPlayer('unassigned')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                minHeight: '48px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1.5px dashed var(--partidos-gold, #D4A843)',
                                background: 'rgba(212, 168, 67, 0.08)',
                                color: 'var(--partidos-text-primary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>⚽</span>
                              <span>{isGlobalEn ? 'Opponent Own Goal / Unassigned' : 'Autogol rival / Sin asignar'}</span>
                            </button>
                          )}

                          {(() => {
                            const starterIds = (calledPlayers || []).slice(0, 11).filter(Boolean);
                            const subIds = (calledPlayers || []).slice(11, 18).filter(Boolean);
                            const hasCalled = starterIds.length > 0 || subIds.length > 0;

                            const renderPlayerBtn = (p, roleLabel, roleColor) => (
                              <button
                                key={p.id}
                                className="event-selector-item"
                                type="button"
                                onClick={() => handleSelectEventPlayer(p.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                  minHeight: '48px',
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  border: '1px solid var(--partidos-border, rgba(255,255,255,0.12))',
                                  background: 'var(--partidos-card-bg, rgba(255,255,255,0.04))',
                                  color: 'var(--partidos-text-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <PlayerAvatar player={p} size={32} showNumber={false} />
                                  <span style={{ fontWeight: 800, fontSize: '13px' }}>
                                    {p.number || p.dorsal ? `${p.number || p.dorsal} - ` : ''}{p.name || p.nombre}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {(p.position || p.posicion) && (
                                    <span style={{ fontSize: '11px', opacity: 0.7 }}>{p.position || p.posicion}</span>
                                  )}
                                  {roleLabel && (
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: roleColor ? `${roleColor}20` : 'rgba(0,0,0,0.1)',
                                      color: roleColor || 'inherit'
                                    }}>
                                      {roleLabel}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );

                            if (hasCalled) {
                              const starters = starterIds.map(id => players.find(pl => pl && pl.id === id)).filter(Boolean);
                              const subs = subIds.map(id => players.find(pl => pl && pl.id === id)).filter(Boolean);
                              const otherPlayers = (players || []).filter(pl => pl && !starterIds.includes(pl.id) && !subIds.includes(pl.id));

                              return (
                                <>
                                  {starters.length > 0 && (
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#4CAF7D', textTransform: 'uppercase', marginTop: '4px' }}>
                                      {isGlobalEn ? 'Starters' : 'Titulares'}
                                    </div>
                                  )}
                                  {starters.map(p => renderPlayerBtn(p, isGlobalEn ? 'TITULAR' : 'TITULAR', '#4CAF7D'))}

                                  {subs.length > 0 && (
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#D4A843', textTransform: 'uppercase', marginTop: '8px' }}>
                                      {isGlobalEn ? 'Substitutes' : 'Suplentes'}
                                    </div>
                                  )}
                                  {subs.map(p => renderPlayerBtn(p, isGlobalEn ? 'SUPLENTE' : 'SUPLENTE', '#D4A843'))}

                                  {otherPlayers.length > 0 && (
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '8px' }}>
                                      {isGlobalEn ? 'Other Squad Players' : 'Otros Jugadores'}
                                    </div>
                                  )}
                                  {otherPlayers.map(p => renderPlayerBtn(p, null, null))}
                                </>
                              );
                            }

                            return (players || []).map(p => renderPlayerBtn(p, null, null));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA: LIVE-STATS */}
            <div className="tab-pane" style={{ padding: 0, display: editTab === 'LIVE-STATS' ? 'block' : 'none' }}>
              <LiveStats
                teamId={activeTeamId}
                matchId={matchData?.id || null}
                matchData={matchData}
                players={players}
                calledPlayers={calledPlayers}
                events={effectiveLiveEvents}
                addLiveEvent={handleAddLiveEvent}
                resetLiveStats={resetLiveStats}
                language={settings?.language || 'Español (ES)'}
                onAddGoalFor={(playerId, playerName) => addEvent('gol_local', playerId || 'Equipo', playerName || (isGlobalEn ? 'Own Goal' : 'Gol Propio'), currentMinute)}
                onAddGoalAgainst={() => addEvent('gol_rival', 'Rival', isGlobalEn ? 'Opponent Goal' : 'Gol del Rival', currentMinute)}
                onAddCard={(cardType, playerId, playerName) => addEvent(cardType, playerId || 'Equipo', playerName || (isGlobalEn ? 'Player' : 'Jugador'), currentMinute)}
                onFinishMatch={handleFinishMatch}
              />
            </div>

            {/* PESTAÑA: ACTA OFICIAL */}
            {editTab === 'ACTA' && (
              <div className="tab-pane acta-container" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <ActaOficialPanel
                  matchId={matchData?.id || null}
                  matchData={matchData}
                  players={players}
                  calledPlayers={calledPlayers}
                  events={effectiveLiveEvents}
                  onNavigateTab={handleTabChange}
                  onUpdateMatchData={(updatedFields) => {
                    setMatchData(prev => {
                      const merged = { ...prev, ...updatedFields };
                      matchDataRef.current = merged;
                      return merged;
                    });
                  }}
                />
              </div>
            )}

            {/* PESTAÑA: POST-PARTIDO */}
            {editTab === 'POST-PARTIDO' && (
              <div className="tab-pane post-partido-container" style={{ padding: '24px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>📊 {isGlobalEn ? 'Post-Match Report & Analysis' : 'Informe Post-Partido y Análisis'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleFinishMatch}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        minHeight: '48px',
                        cursor: 'pointer',
                        border: matchData.status === 'Terminado' ? '1.5px solid #4CAF7D' : 'none',
                        borderRadius: '8px',
                        background: matchData.status === 'Terminado' ? '#1B3A2D' : '#4CAF7D',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(76, 175, 125, 0.3)'
                      }}
                    >
                      {matchData.status === 'Terminado' ? (isGlobalEn ? '✓ Match Finished' : '✓ Partido Terminado') : (isGlobalEn ? '🏁 Finish Match' : '🏁 Finalizar Partido')}
                    </button>
                    <button
                      type="button"
                      className="btn-save-match"
                      onClick={handleExportPDF}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: '48px', background: '#D4A843', color: '#0E1A14', fontWeight: 'bold' }}
                    >
                      📄 {isGlobalEn ? 'Export PDF' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>
                <div className="post-partido-grid-layout">
                  {/* Columna Izquierda: Marcador, Goleadores, Tarjetas */}
                  <div className="post-partido-left-col">
                    {/* Tarjeta 1: Marcador */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">⚽ {isGlobalEn ? 'Match Score (Derived from Events)' : 'Marcador del Partido (Derivado de Eventos)'}</h4>
                      <div className="score-inputs-container" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                        <div className="score-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.goalsFor')}</label>
                          <div style={{ minHeight: '48px', fontSize: '24px', fontWeight: '900', width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1.5px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: '#22C55E' }}>
                            {derivedGoalsFor}
                          </div>
                        </div>
                        <div className="score-divider" style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--partidos-text-primary)' }}>-</div>
                        <div className="score-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.goalsAgainst')}</label>
                          <div style={{ minHeight: '48px', fontSize: '24px', fontWeight: '900', width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1.5px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: '#EF4444' }}>
                            {derivedGoalsAgainst}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 2: Goleadores */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">⚽ {isGlobalEn ? 'Scorers (Canonical from Log)' : 'Goleadores (Canónico desde Bitácora)'}</h4>
                      <div className="goleadores-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        {derivedGoleadores.length === 0 ? (
                          <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--partidos-text-muted)', fontStyle: 'italic' }}>
                            {isEnLanguage ? 'No goals registered in match events.' : 'No se han registrado goles en los eventos del partido.'}
                          </p>
                        ) : (
                          derivedGoleadores.map((g, idx) => {
                            const p = players.find(pl => pl.id === g.jugadorId);
                            return (
                              <div key={idx} className="goleador-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                <PlayerAvatar player={p} size={28} showNumber={false} />
                                <span style={{ fontWeight: '700', fontSize: '13px', flex: 1 }}>{g.nombre}</span>
                                <span style={{ fontWeight: '800', fontSize: '12px', color: '#22C55E' }}>Min. {g.minuto}'</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Tarjeta 3: Tarjetas */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">🟨 {isGlobalEn ? 'Cards (Canonical from Log)' : 'Tarjetas (Canónico desde Bitácora)'}</h4>
                      <div className="goleadores-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        {derivedTarjetas.length === 0 ? (
                          <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--partidos-text-muted)', fontStyle: 'italic' }}>
                            {isEnLanguage ? 'No cards registered in match events.' : 'No se han registrado tarjetas en los eventos del partido.'}
                          </p>
                        ) : (
                          derivedTarjetas.map((t, idx) => {
                            const p = players.find(pl => pl.id === t.jugadorId);
                            return (
                              <div key={idx} className="goleador-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                <PlayerAvatar player={p} size={28} showNumber={false} />
                                <span style={{ fontWeight: '700', fontSize: '13px', flex: 1 }}>{t.nombre}</span>
                                <span>{t.tipo === 'amarilla' ? '🟨' : '🟥'}</span>
                                <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--partidos-text-muted)' }}>Min. {t.minuto}'</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Tarjeta 3b: Minutos Jugados Reales (Acta Oficial) */}
                    <div className="post-match-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <h4 className="card-section-title" style={{ margin: 0 }}>⏱️ {isGlobalEn ? 'Official Minutes Played' : 'Minutos Jugados Reales'}</h4>
                        <button
                          type="button"
                          onClick={() => setEditTab('ACTA')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#4CAF7D',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          📋 {isGlobalEn ? 'View Sheet' : 'Ver Acta'}
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--partidos-text-muted)', margin: '4px 0 10px 0' }}>
                        {isGlobalEn
                          ? 'Real minutes played calculated from starting XI, substitutions and cards in match sheet.'
                          : 'Minutos reales calculados según titularidad, sustituciones y tarjetas del acta oficial.'}
                      </p>
                      {(() => {
                        const rawTit = (Array.isArray(matchData.titulares) && matchData.titulares.length > 0)
                          ? matchData.titulares
                          : (calledPlayers || []).slice(0, 11);
                        const rawSup = (Array.isArray(matchData.suplentes) && matchData.suplentes.length > 0)
                          ? matchData.suplentes
                          : (calledPlayers || []).slice(11, 18);
                        const titIds = rawTit.filter(Boolean).map(String);
                        const supIds = rawSup.filter(Boolean).map(String);
                        const allCalled = [...new Set([...titIds, ...supIds, ...Object.keys(matchData.actaOficial?.actual || {})])];
                        const unifEvts = getUnifiedMatchEvents(matchData);
                        const dur = getEffectiveMatchDuration(matchData);

                        const rosterList = allCalled.map(pid => {
                          const p = (players || []).find(pl => String(pl.id) === String(pid));
                          const actual = matchData.actaOficial?.actual?.[pid] || {};
                          const isTit = titIds.includes(String(pid));
                          let minVal = null;
                          if (actual.minutesOverride !== undefined && actual.minutesOverride !== null && actual.minutesOverride !== '') {
                            minVal = parseInt(actual.minutesOverride, 10);
                          } else if (typeof actual.minutes === 'number' && actual.minutes > 0 && matchData.actaOficial?.closed) {
                            minVal = actual.minutes;
                          } else {
                            const calc = calculateMinutesFromEvents(
                              pid,
                              unifEvts,
                              titIds,
                              supIds,
                              dur,
                              null,
                              actual.status || (isTit ? 'presente' : 'sin_registro'),
                              actual.lateMin ?? null,
                              matchData.tarjetasList || []
                            );
                            minVal = calc.minutes;
                          }
                          return {
                            id: pid,
                            player: p,
                            name: p?.name || (isGlobalEn ? 'Player' : 'Jugador'),
                            number: p?.number || '-',
                            isStarter: isTit,
                            minutes: Number(minVal) || 0,
                            status: actual.status || (isTit ? 'presente' : 'sin_registro'),
                            isManual: actual.minutesOverride !== undefined && actual.minutesOverride !== null && actual.minutesOverride !== '',
                          };
                        });

                        rosterList.sort((a, b) => {
                          if (a.isStarter && !b.isStarter) return -1;
                          if (!a.isStarter && b.isStarter) return 1;
                          return b.minutes - a.minutes;
                        });

                        if (rosterList.length === 0) {
                          return (
                            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--partidos-text-muted)', fontStyle: 'italic' }}>
                              {isGlobalEn ? 'No players recorded in match squad.' : 'No hay jugadores registrados en la convocatoria.'}
                            </p>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                            {rosterList.map((r) => (
                              <div
                                key={r.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: 'rgba(255,255,255,0.04)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--partidos-border)',
                                  gap: '10px',
                                  minHeight: '48px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: '11px', fontWeight: '800', width: '22px', textAlign: 'center', color: '#D4A843' }}>
                                    #{r.number}
                                  </span>
                                  <PlayerAvatar player={r.player} size={28} showNumber={false} />
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--partidos-text-primary)' }}>{r.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--partidos-text-muted)' }}>
                                      {r.isStarter ? (isGlobalEn ? 'Starter' : 'Titular') : (isGlobalEn ? 'Substitute' : 'Suplente')}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {r.isManual && (
                                    <span style={{ fontSize: '10px', color: '#4CAF7D', fontWeight: '700', background: 'rgba(76,175,125,0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(76,175,125,0.3)' }}>
                                      ✏️ {isGlobalEn ? 'Manual' : 'Manual'}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: '800',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      background: r.minutes > 0 ? 'rgba(76, 175, 125, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                                      color: r.minutes > 0 ? '#4CAF7D' : 'var(--partidos-text-muted)',
                                      border: `1px solid ${r.isManual ? '#4CAF7D' : (r.minutes > 0 ? '#4CAF7D' : 'var(--partidos-border)')}`
                                    }}
                                  >
                                    {r.minutes}'
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Columna Derecha: MVP, Valoración, Notas, Botón de Guardar */}
                  <div className="post-partido-right-col">
                    {/* Tarjeta 4: MVP y Valoración */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">👑 {isGlobalEn ? 'MVP & Rating' : 'MVP y Valoración'}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        <div className="mvp-selection-box" style={{ display: 'flex', flexDirection: 'column' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.mvp')}</label>
                          <select
                            className="partidos-input"
                            value={matchData.mvp || ''}
                            onChange={e => setMatchData({ ...matchData, mvp: e.target.value })}
                            style={{ minHeight: '48px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                          >
                            <option value="">{getLangText('post.mvpSelect')}</option>
                            {calledPlayers.filter(Boolean).map(id => {
                              const p = players.find(pl => pl && pl.id === id);
                              return p ? <option key={id} value={p.name}>{p.name}</option> : null;
                            })}
                          </select>
                        </div>

                        {/* Valoración del equipo slider 1-10 */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--partidos-text-muted)' }}>{isGlobalEn ? 'TEAM RATING' : 'VALORACIÓN DEL EQUIPO'}</label>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--partidos-accent)' }}>{matchData.teamRating || 5} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={matchData.teamRating || 5}
                            onChange={e => setMatchData({ ...matchData, teamRating: parseInt(e.target.value) || 5 })}
                            style={{ width: '100%', cursor: 'pointer', height: '8px', borderRadius: '4px', background: 'var(--partidos-border)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta: Calificaciones Individuales del Míster (1 - 10) */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">⭐ {isGlobalEn ? "Coach's Individual Ratings (1 - 10)" : 'Calificación del Míster por Jugador (1 - 10)'}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', margin: '4px 0 12px 0' }}>
                        {isGlobalEn
                          ? 'Assign match rating to each player to automatically feed tactical performance and official averages.'
                          : 'Asigna la nota del partido a cada jugador para alimentar automáticamente su rendimiento táctico y notas medias oficiales.'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                        {calledPlayers.filter(Boolean).length === 0 ? (
                          <p style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', fontStyle: 'italic', margin: '6px 0' }}>
                            {isGlobalEn ? 'No players called up for this match.' : 'No hay jugadores convocados en este partido.'}
                          </p>
                        ) : (
                          calledPlayers.filter(Boolean).map(id => {
                            const p = players.find(pl => pl && pl.id === id);
                            if (!p) return null;
                            const currentRating = (matchData.playerRatings && matchData.playerRatings[id] !== undefined && matchData.playerRatings[id] !== null)
                              ? matchData.playerRatings[id]
                              : ((matchData.ratings && matchData.ratings[id] !== undefined && matchData.ratings[id] !== null) ? matchData.ratings[id] : '');

                            return (
                              <div
                                key={id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: 'rgba(255,255,255,0.04)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--partidos-border)',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                  <PlayerAvatar player={p} size={32} showNumber={false} />
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{p.position || (isGlobalEn ? 'Player' : 'Jugador')}</div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    placeholder="-"
                                    value={currentRating}
                                    onChange={e => {
                                      const rawVal = e.target.value;
                                      const parsed = rawVal === '' ? null : parseFloat(rawVal);
                                      setMatchData(prev => ({
                                        ...prev,
                                        playerRatings: {
                                          ...(prev.playerRatings || {}),
                                          [id]: parsed
                                        },
                                        ratings: {
                                          ...(prev.ratings || {}),
                                          [id]: parsed
                                        }
                                      }));
                                    }}
                                    onBlur={async () => {
                                      if (matchData.id) {
                                        try {
                                          await updateMatch(matchData.id, {
                                            playerRatings: matchData.playerRatings || {},
                                            ratings: matchData.ratings || {}
                                          });
                                        } catch (_) {}
                                      }
                                    }}
                                    style={{
                                      width: '65px',
                                      minHeight: '44px',
                                      textAlign: 'center',
                                      fontWeight: '900',
                                      fontSize: '15px',
                                      borderRadius: '8px',
                                      border: '1.5px solid var(--partidos-border)',
                                      background: 'var(--partidos-input-bg)',
                                      color: currentRating ? '#22C55E' : 'var(--partidos-text-primary)'
                                    }}
                                  />
                                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--partidos-text-muted)' }}>/ 10</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Tarjeta 5b: Comentario del Míster por Jugador (visible en portal jugador) */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">💬 {isGlobalEn ? 'Feedback for Player' : 'Comentario para el Jugador'}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', margin: '4px 0 12px 0' }}>
                        {isGlobalEn
                          ? 'Personal message from the coach — the player will see it in their portal under this match details. Max 280 characters. Positive and constructive tone.'
                          : 'Mensaje personal del míster — el jugador lo verá en su portal bajo el detalle de este partido. Máximo 280 caracteres. Tono positivo y constructivo.'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                        {calledPlayers.filter(Boolean).length === 0 ? (
                          <p style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', fontStyle: 'italic', margin: '6px 0' }}>
                            {isGlobalEn ? 'No players called up for this match.' : 'No hay jugadores convocados en este partido.'}
                          </p>
                        ) : (
                          calledPlayers.filter(Boolean).map(id => {
                            const p = players.find(pl => pl && pl.id === id);
                            if (!p) return null;
                            const currentComment = (matchData.playerComments && matchData.playerComments[id]) || '';
                            return (
                              <div
                                key={id}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  padding: '10px 12px',
                                  background: 'rgba(255,255,255,0.04)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--partidos-border)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <PlayerAvatar player={p} size={28} showNumber={false} />
                                  <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--partidos-text-primary)' }}>{p.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--partidos-text-muted)', marginLeft: 'auto' }}>{currentComment.length}/280</span>
                                </div>
                                <textarea
                                  maxLength={280}
                                  rows={2}
                                  placeholder={isGlobalEn ? `Write an encouraging comment for ${p.name}...` : `Escribe un comentario motivador para ${p.name}...`}
                                  value={currentComment}
                                  onChange={e => {
                                    const val = e.target.value.slice(0, 280);
                                    setMatchData(prev => ({
                                      ...prev,
                                      playerComments: { ...(prev.playerComments || {}), [id]: val }
                                    }));
                                  }}
                                  onBlur={async () => {
                                    if (matchData.id) {
                                      try {
                                        await updateMatch(matchData.id, { playerComments: matchData.playerComments || {} });
                                      } catch (_) {}
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1.5px solid var(--partidos-border)',
                                    background: 'var(--partidos-input-bg)',
                                    color: 'var(--partidos-text-primary)',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                    resize: 'vertical',
                                    minHeight: '56px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Tarjeta 5: Notas Tácticas */}

                    <div className="post-match-card">
                      <h4 className="card-section-title">📝 {isGlobalEn ? 'Tactical Notes' : 'Notas Tácticas'}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--partidos-text-muted)' }}>{getLangText('post.notes')}</label>
                        <SpellCheckedTextarea
                          className="partidos-input textarea-tall"
                          value={matchData.notes || ''}
                          onChange={e => setMatchData({ ...matchData, notes: e.target.value })}
                          placeholder={getLangText('post.notesPlaceholder')}
                          rows={5}
                          style={{ minHeight: '120px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Botón de Guardar Post-Partido (Verde Campo) */}
                    <button
                      type="button"
                      className="btn-success-green-allcaps"
                      onClick={handleSaveMatch}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        minHeight: '52px',
                        background: '#2E7D5C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 10px rgba(46,125,92,0.2)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '10px'
                      }}
                    >
                      {isSaving ? (isGlobalEn ? 'SAVING...' : 'GUARDANDO...') : (isGlobalEn ? '💾 SAVE POST-MATCH' : '💾 GUARDAR POST-PARTIDO')}
                    </button>
                  </div>

                  {/* Secciones de ancho completo abajo */}
                  <div className="post-partido-full-width-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Tarjeta Resumen del Partido (Gráficas Fase 3a) */}
                    <div className="post-match-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                        <h4 className="card-section-title" style={{ margin: 0 }}>
                          📈 {isGlobalEn ? 'Match Summary' : 'Resumen del Partido'}
                        </h4>
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          style={{
                            background: '#D4A843',
                            color: '#0E1A14',
                            border: 'none',
                            fontWeight: '800',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px'
                          }}
                        >
                          📄 {isGlobalEn ? 'Download PDF Report' : 'Descargar Informe PDF'}
                        </button>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <MatchStatsBlock
                          matchData={matchData}
                          events={effectiveLiveEvents || []}
                          language={currentGlobalLanguage || 'Español (ES)'}
                          showDonuts={true}
                          showComparison={true}
                          showHalves={true}
                          showDetailedTables={true}
                        />
                      </div>
                    </div>
                    {/* Tarjeta 6: Cuestionario de Análisis */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">📋 {isGlobalEn ? 'Match Report Questionnaire' : 'Cuestionario de Informe de Partido'}</h4>
                      <div className="questionnaire-fields" style={{ marginTop: '10px' }}>
                        {reportQuestions.map(q => (
                          <div key={q.key} className="questionnaire-field-block" style={{ marginBottom: '15px' }}>
                            <label className="question-field-label" style={{ fontWeight: 'bold', fontSize: '13px' }}>{q.label}</label>
                            <p className="question-field-desc" style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', margin: '4px 0 8px 0' }}>{q.question}</p>
                            <SpellCheckedTextarea
                              className="partidos-input"
                              rows={4}
                              value={(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) || ''}
                              onChange={e => handleAnswerChange(q.key, e.target.value)}
                              placeholder="..."
                              style={{ width: '100%', background: 'var(--partidos-input-bg)', minHeight: '100px', padding: '8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', color: 'var(--partidos-text-primary)' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tarjeta 7: Galería de Imágenes */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">📷 {getLangText('post.images')}</h4>
                      <div className="image-upload-wrapper" style={{ marginTop: '10px' }}>
                        <input
                          type="file"
                          accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .avif, .heic, .bmp"
                          multiple
                          id="post-match-photo-upload"
                          style={{ display: 'none' }}
                          onChange={handleImageUpload}
                        />
                        <label
                          htmlFor="post-match-photo-upload"
                          className="btn-primary-blue-allcaps"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            minHeight: '48px',
                            cursor: 'pointer',
                            padding: '0 24px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            background: '#1B3A2D',
                            color: '#FFFFFF'
                          }}
                        >
                          📷 {getLangText('post.uploadBtn')}
                        </label>
                      </div>

                      <div className="images-gallery" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                        {(matchData.postMatchImages || []).map((img, idx) => (
                          <div key={idx} className="gallery-thumbnail-container" style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--partidos-border)' }}>
                            <img src={img} alt={`Match Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botones de acción del informe */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-outline-dark"
                        style={{ minHeight: '48px', padding: '0 24px', borderRadius: '8px', fontWeight: '800', border: '1px solid var(--partidos-text-primary)', color: 'var(--partidos-text-primary)', background: 'transparent', cursor: 'pointer' }}
                        onClick={() => setShowReportPreview(true)}
                      >
                        👁️ {getLangText('post.viewReport')}
                      </button>
                      <button
                        type="button"
                        className="btn-success-green-allcaps"
                        style={{
                          minHeight: '48px',
                          padding: '0 24px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          background: '#2E7D5C',
                          color: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                        onClick={handleExportPDF}
                      >
                        📥 {getLangText('post.downloadReport')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MatchErrorBoundary>
    )}

      {/* MODAL DE VISTA PREVIA DEL INFORME */}
      {showReportPreview && (
        <div className="modal-overlay" onClick={() => setShowReportPreview(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--partidos-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>{getLangText('post.previewTitle')}</h2>
              <button className="btn-close" onClick={() => setShowReportPreview(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--partidos-text-primary)' }}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--partidos-player-card-bg)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800' }}>{activeTeam?.nombre || 'Mi Equipo'} vs {matchData.rival}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--partidos-text-muted)' }}>{matchData.date} | {matchData.time} | {matchData.location}</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--partidos-accent)' }}>
                  {matchData.type === 'Local' ? matchData.goalsFor : matchData.goalsAgainst} - {matchData.type === 'Local' ? matchData.goalsAgainst : matchData.goalsFor}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.mvp')}</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>{matchData.mvp || '-'}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.scorers')}</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>
                    {matchData.goleadoresList && matchData.goleadoresList.length > 0
                      ? matchData.goleadoresList.map(g => {
                        const p = players.find(pl => pl.id === g.jugadorId);
                        return `${p ? p.name : 'Jugador'} (${g.minuto}')`;
                      }).join(', ')
                      : '-'}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{isGlobalEn ? 'Cards' : 'Tarjetas'}</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>
                    {matchData.tarjetasList && matchData.tarjetasList.length > 0
                      ? matchData.tarjetasList.map(t => {
                        const p = players.find(pl => pl.id === t.jugadorId);
                        const emoji = t.tipo === 'amarilla' ? '🟨' : '🟥';
                        return `${emoji} ${p ? p.name : 'Jugador'} (${t.minuto}')`;
                      }).join(', ')
                      : '-'}
                  </p>
                </div>
              </div>

              {matchData.notes && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.notes')}</h4>
                  <p style={{ margin: '0', fontSize: '14px', background: 'var(--partidos-player-card-bg)', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{matchData.notes}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reportQuestions.map(q => (
                  <div key={q.key}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '800', color: 'var(--partidos-accent)' }}>{q.label}</h4>
                    <p style={{ margin: '0', fontSize: '14px', background: 'var(--partidos-player-card-bg)', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontStyle: !(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) ? 'italic' : 'normal', color: !(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) ? 'var(--partidos-text-muted)' : 'var(--partidos-text-primary)' }}>
                      {(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) || getLangText('post.noAnswers')}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.images')}</h4>
                {(!matchData.postMatchImages || matchData.postMatchImages.length === 0) ? (
                  <p style={{ margin: '0', fontSize: '14px', color: 'var(--partidos-text-muted)', fontStyle: 'italic' }}>{getLangText('post.noImages')}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                    {matchData.postMatchImages.map((img, idx) => (
                      <div key={idx} style={{ aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--partidos-border)' }}>
                        <img src={img} alt={`Preview Match ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary-dark" style={{ minHeight: '48px', padding: '0 24px' }} onClick={() => setShowReportPreview(false)}>{getLangText('post.close')}</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE FORMACIÓN PERSONALIZADA */}
      <CustomFormationModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingCustomFormation(null);
        }}
        editFormation={editingCustomFormation}
        onSave={async (formationData) => {
          try {
            let savedName = formationData.name;
            if (editingCustomFormation) {
              await updateCustomFormation(editingCustomFormation.id, formationData);
            } else {
              await addCustomFormation(formationData);
            }

            // Auto-seleccionar y auto-alinear
            setMatchData(prev => ({
              ...prev,
              lineup: savedName
            }));

            const newCalled = alignStartersByPosition(calledPlayers, players, formationData.positions);
            setCalledPlayers(newCalled);
            setMatchData(prev => ({
              ...prev,
              convocados: newCalled,
              lineup: savedName
            }));

            setIsCustomModalOpen(false);
            setEditingCustomFormation(null);
          } catch (err) {
            console.error("Error saving custom formation:", err);
            alert(isGlobalEn ? "Error saving custom formation." : "Error al guardar la formación personalizada.");
          }
        }}
      />

      {/* Contenedor oculto para captura en alta resolución del terreno de juego, alineación y suplentes para el PDF */}
      <div
        id="export-pitch-container"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '720px',
          background: '#0B1812',
          padding: '16px',
          borderRadius: '12px',
          zIndex: -9999,
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}
      >
        <div className="alin-pitch-container-h3d" style={{ width: '100%', height: '453px', transform: 'none', margin: 0 }}>
          <div className="pitch-h-outer">
            <div className="pitch-h-center-line"></div>
            <div className="pitch-h-center-circle"></div>
            <div className="pitch-h-spot-center"></div>
            <div className="pitch-h-penalty-left"></div>
            <div className="pitch-h-goal-left"></div>
            <div className="pitch-h-penalty-right"></div>
            <div className="pitch-h-goal-right"></div>
          </div>
          {getFormationPositions(matchData.lineup || '4-3-3').map((pos, idx) => {
            const pid = calledPlayers[idx];
            const player = pid ? players.find(p => p.id === pid) : null;
            const customPos = matchData.customPositions && matchData.customPositions[idx];
            const rawTop = parseFloat(customPos ? customPos.top : pos.top);
            const clampedTop = Math.min(Math.max(rawTop, 5), 92);
            const topPos = `${clampedTop}%`;
            const leftPos = customPos ? customPos.left : pos.left;
            const posLabel = getSlotPosition(idx);
            const photoUrl = player ? (player.avatarUrl || player.photoUrl || player.photo || player.photoPreview) : null;

            return (
              <div key={idx} className={`pitch-player-3d ${player ? '' : 'empty-slot'}`} style={{ top: topPos, left: leftPos }}>
                <div className="futu-card-badge">
                  <div className={`futu-card-frame ${player ? '' : 'empty-slot'}`}>
                    {player ? (
                      photoUrl ? (
                        <img src={photoUrl} alt={player.name} width="36" height="36" style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', borderRadius: '50%', objectFit: 'cover' }} className="futu-card-photo" crossOrigin="anonymous" />
                      ) : (
                        <div className="futu-card-initials" style={{ background: '#1B3A2D', color: '#D4A843', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: '50%', fontWeight: 'bold', fontSize: '15px' }}>
                          {player.number || (player.name ? player.name.charAt(0).toUpperCase() : idx + 1)}
                        </div>
                      )
                    ) : (
                      <div className="futu-card-initials empty">{idx + 1}</div>
                    )}
                    <span className="futu-card-number">{player?.number || idx + 1}</span>
                    <span className="futu-card-pos">{posLabel}</span>
                  </div>
                  <div className="futu-card-banner">
                    {player ? `${player.number ? player.number + ' - ' : ''}${player.name}` : `Slot ${idx + 1}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bloque de Suplentes / Relevos en la imagen exportada */}
        <div style={{
          marginTop: '16px',
          background: '#172D21',
          border: '1.5px solid #D4A843',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#D4A843', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isGlobalEn ? '🔄 Substitute Squad' : '🔄 Convocados Suplentes'} ({calledPlayers.length > 11 ? calledPlayers.length - 11 : 0})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {calledPlayers.slice(11).length > 0 ? (
              calledPlayers.slice(11).map((pid, sIdx) => {
                const player = players.find(p => p.id === pid);
                if (!player) return null;
                const photoUrl = player.avatarUrl || player.photoUrl || player.photo || player.photoPreview;
                return (
                  <div key={sIdx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(212, 168, 67, 0.4)'
                  }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={player.name} width="22" height="22" style={{ width: '22px', height: '22px', maxWidth: '22px', maxHeight: '22px', borderRadius: '50%', objectFit: 'cover' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#D4A843', color: '#172D21', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {player.number || (player.name ? player.name.charAt(0).toUpperCase() : '?')}
                      </div>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>
                      {player.number ? `${player.number}. ` : ''}{player.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#D4A843', fontWeight: '800', background: 'rgba(212,168,67,0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                      {player.position || 'SUP'}
                    </span>
                  </div>
                );
              })
            ) : (
              <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>{isGlobalEn ? 'No substitutes called' : 'Sin suplentes convocados'}</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Partidos;
