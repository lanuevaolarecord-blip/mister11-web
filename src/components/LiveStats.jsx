/**
 * LiveStats.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de estadísticas avanzadas, captura en vivo y suite de análisis táctico.
 * 
 * Incluye:
 *  • Filtros avanzados multidimensionales (Tiempo, Equipos, Jugador, Zonas, Acciones).
 *  • Barra de herramientas rápida (Exportar PDF, Compartir, Notas, Destacado).
 *  • Visualizaciones de élite: Heat Maps 10x15, Red de Pases, Shot Map con xG,
 *    Radar Chart de 6 ejes, Timeline de Momentum y Tabla de Jugadores.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';
import { useTheme } from '../context/ThemeContext';
import { useMatch } from '../context/MatchContext';
import { SvgDonut, SvgComparisonBars, HalfBreakdown } from './LiveStatsCharts';
import { getEffectiveLanguage } from '../i18n/translations';
import { isMatchLocked } from '../utils/minutesEngine';
import { showToast } from '../utils/toast';
import MatchStatsBlock from './MatchStatsBlock';

// ── Nuevos Componentes de la Suite de Estadísticas ────────────────────────────
import { StatsFilters } from './MatchStats/StatsFilters';
import { MatchActionsToolbar } from './MatchStats/MatchActionsToolbar';
import { HeatMap } from './MatchStats/HeatMap';
import { PassNetwork } from './MatchStats/PassNetwork';
import { ShotMap } from './MatchStats/ShotMap';
import { MatchRadarChart } from './MatchStats/MatchRadarChart';
import { MatchTimeline } from './MatchStats/MatchTimeline';
import { ComparativeStatsBars } from './MatchStats/ComparativeStatsBars';
import { StatsDataTable } from './MatchStats/StatsDataTable';

import './LiveStats.css';
import './MatchStats/MatchStats.css';

// ── Paleta de acentos por categoría ──────────────────────────────────────────
const C = {
  green: '#4CAF7D',
  gold: '#D4A843',
  orange: '#F97316',
  teal: '#0D9488',
};

// ── Textos bilingüe ───────────────────────────────────────────────────────────
const TEXTS = {
  'live.title': { es: 'Live Stats', en: 'Live Stats' },
  'live.noMatch': { es: 'Inicia un partido en Match Day para capturar estadísticas en vivo', en: 'Start a match in Match Day to capture live statistics' },
  'live.half': { es: 'Mitad', en: 'Half' },
  'live.minute': { es: 'Min', en: 'Min' },
  'live.totalEvents': { es: 'eventos capturados', en: 'events captured' },
  'live.fullscreen.enter': { es: 'Pantalla completa', en: 'Fullscreen' },
  'live.fullscreen.exit': { es: 'Salir', en: 'Exit' },
  'live.timer.start': { es: '▶ INICIAR', en: '▶ START' },
  'live.timer.pause': { es: '❚❚ PAUSAR', en: '❚❚ PAUSE' },
  'live.timer.reset': { es: 'Reiniciar cronómetro', en: 'Reset timer' },
  'live.goal.for': { es: '+1 Gol propio', en: '+1 Own Goal' },
  'live.goal.against': { es: '+1 Gol rival', en: '+1 Rival Goal' },
  'live.summary.title': { es: 'Resumen en Vivo', en: 'Live Summary' },
  'live.summary.efficiency': { es: 'Eficiencia Táctica (% Éxito)', en: 'Tactical Efficiency (% Success)' },
  'live.summary.comparison': { es: 'Comparativa Propio vs Rival', en: 'Own vs Rival Comparison' },
  'live.summary.halves': { es: 'Desglose por Mitades (1T vs 2T)', en: 'Half Breakdown (1st vs 2nd)' },
  'live.donut.duels': { es: 'Duelos', en: 'Duels' },
  'live.donut.shots': { es: 'Remates', en: 'Shots' },
  'live.donut.possession': { es: 'Balón', en: 'Possession' },
  'live.label.won': { es: 'Gan', en: 'Won' },
  'live.label.lost': { es: 'Perd', en: 'Lost' },
  'live.label.onTarget': { es: 'Puerta', en: 'On' },
  'live.label.offTarget': { es: 'Fuera', en: 'Off' },
  'live.label.recovery': { es: 'Recup', en: 'Rec' },
  'live.label.loss': { es: 'Pérd', en: 'Loss' },
  'live.cat.shots': { es: '⚽ Remates', en: '⚽ Shots' },
  'live.cat.possession': { es: '🔄 Defensa / Posesión', en: '🔄 Defense / Possession' },
  'live.cat.fouls': { es: '⚡ Faltas / Transiciones', en: '⚡ Fouls / Transitions' },
  'live.cat.discipline': { es: '🟨 Disciplina / Balón parado', en: '🟨 Discipline / Set Pieces' },
  'live.btn.shot_on_own': { es: 'Tiro a puerta\n(Propio)', en: 'Shot on Target\n(Own)' },
  'live.btn.shot_on_rival': { es: 'Tiro a puerta\n(Rival)', en: 'Shot on Target\n(Rival)' },
  'live.btn.shot_off_own': { es: 'Tiro fuera\n(Propio)', en: 'Shot off Target\n(Own)' },
  'live.btn.shot_off_rival': { es: 'Tiro fuera\n(Rival)', en: 'Shot off Target\n(Rival)' },
  'live.btn.recovery': { es: 'Recuperación', en: 'Recovery' },
  'live.btn.loss': { es: 'Pérdida', en: 'Ball Loss' },
  'live.btn.duel_won': { es: 'Duelo ganado', en: 'Duel Won' },
  'live.btn.duel_lost': { es: 'Duelo perdido', en: 'Duel Lost' },
  'live.btn.foul_favor': { es: 'Falta a favor', en: 'Foul in Favor' },
  'live.btn.foul_against': { es: 'Falta en contra', en: 'Foul Against' },
  'live.btn.counter_not_cut': { es: 'Contra no\ncortada', en: 'Counter Not\nCut' },
  'live.btn.player_no_finish': { es: 'Jugador no\nfinaliza', en: 'Player No\nFinish' },
  'live.btn.card_own': { es: 'Tarjeta (Propia)', en: 'Card (Own)' },
  'live.btn.card_rival': { es: 'Tarjeta (Rival)', en: 'Card (Rival)' },
  'live.btn.card_yellow_own': { es: 'Amarilla\n(Propia)', en: 'Yellow Card\n(Own)' },
  'live.btn.card_red_own': { es: 'Roja\n(Propia)', en: 'Red Card\n(Own)' },
  'live.btn.card_yellow_rival': { es: 'Amarilla\n(Rival)', en: 'Yellow Card\n(Rival)' },
  'live.btn.card_red_rival': { es: 'Roja\n(Rival)', en: 'Red Card\n(Rival)' },
  'live.btn.corner_favor': { es: 'Córner\na favor', en: 'Corner\nIn Favor' },
  'live.btn.corner_against': { es: 'Córner\nen contra', en: 'Corner\nAgainst' },
  'live.btn.offside_own': { es: 'Fuera de juego\n(Propio)', en: 'Offside\n(Own)' },
  'live.btn.offside_rival': { es: 'Fuera de juego\n(Rival)', en: 'Offside\n(Rival)' },
  'live.half.select': { es: 'Mitad:', en: 'Half:' },
  'live.half.1': { es: '1ª Mitad', en: '1st Half' },
  'live.half.2': { es: '2ª Mitad', en: '2nd Half' },
  'live.feedback.saved': { es: '¡Guardado!', en: 'Saved!' },
  'live.tab.capture': { es: 'Captura en Vivo', en: 'Live Capture' },
  'live.tab.tactical': { es: 'Campo & Táctica', en: 'Field & Tactics' },
  'live.tab.analytics': { es: 'Análisis Avanzado', en: 'Advanced Analysis' },
  'live.tab.players': { es: 'Jugadores & CSV', en: 'Players & CSV' },
};

// ── Grupos de botones de captura rápida ──────────────────────────────────────
const BUTTON_GROUPS = [
  {
    catKey: 'live.cat.shots',
    color: C.green,
    colsClass: 'cols-4',
    buttons: [
      { type: 'shot_on_target_own', labelKey: 'live.btn.shot_on_own', icon: '🟢' },
      { type: 'shot_on_target_rival', labelKey: 'live.btn.shot_on_rival', icon: '🔴' },
      { type: 'shot_off_target_own', labelKey: 'live.btn.shot_off_own', icon: '⬜' },
      { type: 'shot_off_target_rival', labelKey: 'live.btn.shot_off_rival', icon: '🔲' },
    ],
  },
  {
    catKey: 'live.cat.possession',
    color: C.teal,
    colsClass: 'cols-4',
    buttons: [
      { type: 'recovery', labelKey: 'live.btn.recovery', icon: '↑' },
      { type: 'loss', labelKey: 'live.btn.loss', icon: '↓' },
      { type: 'duel_won', labelKey: 'live.btn.duel_won', icon: '✊' },
      { type: 'duel_lost', labelKey: 'live.btn.duel_lost', icon: '🤜' },
    ],
  },
  {
    catKey: 'live.cat.fouls',
    color: C.orange,
    colsClass: 'cols-4',
    buttons: [
      { type: 'foul_favor', labelKey: 'live.btn.foul_favor', icon: '✅' },
      { type: 'foul_against', labelKey: 'live.btn.foul_against', icon: '❌' },
      { type: 'counter_not_cut', labelKey: 'live.btn.counter_not_cut', icon: '⚡' },
      { type: 'player_no_finish', labelKey: 'live.btn.player_no_finish', icon: '😤' },
    ],
  },
  {
    catKey: 'live.cat.discipline',
    color: C.gold,
    colsClass: 'cols-4',
    buttons: [
      { type: 'card_yellow_own', labelKey: 'live.btn.card_yellow_own', icon: '🟨' },
      { type: 'card_red_own', labelKey: 'live.btn.card_red_own', icon: '🟥' },
      { type: 'card_yellow_rival', labelKey: 'live.btn.card_yellow_rival', icon: '🟨' },
      { type: 'card_red_rival', labelKey: 'live.btn.card_red_rival', icon: '🟥' },
      { type: 'corner_favor', labelKey: 'live.btn.corner_favor', icon: '🚩' },
      { type: 'corner_against', labelKey: 'live.btn.corner_against', icon: '⛳' },
      { type: 'offside_own', labelKey: 'live.btn.offside_own', icon: '🏃' },
      { type: 'offside_rival', labelKey: 'live.btn.offside_rival', icon: '🏃‍♂️' },
    ],
  },
];

const LiveStats = ({
  teamId,
  matchId,
  matchData,
  players,
  calledPlayers,
  language,
  onAddGoalFor,
  onAddGoalAgainst,
  events: parentEvents,
  addLiveEvent: parentAddLiveEvent,
  resetLiveStats: parentResetLiveStats,
  onResetEvents,
  onFinishMatch,
}) => {
  const isEn = language === 'English (EN)';
  const tx = useCallback(
    (key) => (TEXTS[key] ? (isEn ? TEXTS[key].en : TEXTS[key].es) : key),
    [isEn]
  );

  const { darkMode } = useTheme();
  const {
    matchSeconds,
    isRunning,
    toggleTimer,
    resetTimer,
    currentMinute,
    formatMatchTime,
  } = useMatch();

  const isLocked = isMatchLocked(matchData);
  const isMatchFinished = isLocked;
  const displayHalf = isMatchFinished ? 2 : (matchSeconds < 2700 ? 1 : 2);
  const displaySeconds = isMatchFinished && Number.isFinite(matchData?.finalSeconds) ? matchData.finalSeconds : matchSeconds;

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentHalf, setCurrentHalf] = useState(displayHalf);
  const [showResetModal, setShowResetModal] = useState(false);

  // ── Estados de Navegación por Pestañas ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState('capture'); // 'capture', 'tactical', 'analytics', 'players'

  // ── Estados de Filtros Avanzados ──────────────────────────────────────────
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '1T', '2T', 'extra'
  const [timeRange, setTimeRange] = useState([0, 90]);
  const [teamFilter, setTeamFilter] = useState('both'); // 'both', 'home', 'away'
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [zoneFilter, setZoneFilter] = useState('all'); // 'all', 'def', 'mid', 'att'
  const [actionTypes, setActionTypes] = useState({
    passes: true,
    shots: true,
    defense: true,
    fouls: true,
    setPieces: true
  });

  // ── Estados de Acciones Rápidas ────────────────────────────────────────────
  const [tacticalNotes, setTacticalNotes] = useState([]);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const liveStatsHook = useLiveStats(teamId, matchId, currentMinute, currentHalf);

  // ── Estado local para reflejo INMEDIATO (optimista) de eventos capturados ──
  const [localEvents, setLocalEvents] = useState([]);

  // Resetear localEvents cuando cambia el partido
  useEffect(() => {
    setLocalEvents([]);
  }, [matchId]);

  // La fuente de verdad es: parentEvents ∪ localEvents (deduplicados por id)
  const rawEvents = useMemo(() => {
    const base = (parentEvents && parentEvents.length > 0)
      ? parentEvents
      : ((liveStatsHook.events && liveStatsHook.events.length > 0)
          ? liveStatsHook.events
          : (matchData?.liveStatsEvents || matchData?.events || []));
    const cleanBase = Array.isArray(base) ? base.filter(Boolean) : [];
    if (localEvents.length === 0) return cleanBase;
    const baseIds = new Set(cleanBase.map(e => e?.id || `evt_${e?.minute}_${e?.type}`).filter(Boolean));
    const unique = localEvents.filter(e => e && !baseIds.has(e?.id));
    return [...cleanBase, ...unique];
  }, [parentEvents, liveStatsHook.events, matchData, localEvents]);

  const saving = liveStatsHook.saving;

  const [flashType, setFlashType] = useState(null);
  const [selectedSector, setSelectedSector] = useState('center'); // 'left' | 'center' | 'right'

  // ── Extraer Jugadores Reales y Nombres de Equipo ────────────────────────────
  const homeTeamName = matchData?.local || matchData?.equipoLocal || 'Mi Equipo';
  const awayTeamName = matchData?.visitante || matchData?.equipoVisitante || matchData?.rival || 'Rival';

  const playersList = useMemo(() => {
    const rawList = (calledPlayers && calledPlayers.length > 0)
      ? calledPlayers
      : (players && players.length > 0)
        ? players
        : (matchData?.players || matchData?.jugadores || matchData?.convocados || []);

    const validList = Array.isArray(rawList) ? rawList.filter(Boolean) : [];

    if (validList.length > 0) {
      return validList.map((p, idx) => {
        if ((typeof p === 'string' || typeof p === 'number') && Array.isArray(players) && players.length > 0) {
          const found = players.find(x => x && String(x.id) === String(p));
          if (found) {
            return {
              id: String(found.id),
              dorsal: found.dorsal || found.number || (idx + 1),
              nombre: found.nombre || found.name || `Jugador ${idx + 1}`,
              posicion: found.posicion || found.position || 'JUG'
            };
          }
          return {
            id: String(p),
            dorsal: idx + 1,
            nombre: `Jugador ${idx + 1}`,
            posicion: 'JUG'
          };
        }
        if (p && typeof p === 'object') {
          return {
            id: String(p.id || p.dorsal || idx + 1),
            dorsal: p.dorsal || p.number || (idx + 1),
            nombre: p.nombre || p.name || `Jugador ${p.dorsal || idx + 1}`,
            posicion: p.posicion || p.position || 'JUG'
          };
        }
        return {
          id: String(idx + 1),
          dorsal: idx + 1,
          nombre: `Jugador ${idx + 1}`,
          posicion: 'JUG'
        };
      });
    }

    return [
      { id: '1', dorsal: 1, nombre: 'Portero', posicion: 'POR' },
      { id: '2', dorsal: 2, nombre: 'Lateral Der.', posicion: 'DEF' },
      { id: '3', dorsal: 4, nombre: 'Central Izq.', posicion: 'DEF' },
      { id: '4', dorsal: 5, nombre: 'Central Der.', posicion: 'DEF' },
      { id: '5', dorsal: 3, nombre: 'Lateral Izq.', posicion: 'DEF' },
      { id: '6', dorsal: 6, nombre: 'Pivote', posicion: 'MED' },
      { id: '7', dorsal: 8, nombre: 'Interior Der.', posicion: 'MED' },
      { id: '8', dorsal: 10, nombre: 'Mediapunta', posicion: 'MED' },
      { id: '9', dorsal: 7, nombre: 'Extremo Der.', posicion: 'DEL' },
      { id: '10', dorsal: 9, nombre: 'Delantero', posicion: 'DEL' },
      { id: '11', dorsal: 11, nombre: 'Extremo Izq.', posicion: 'DEL' },
    ];
  }, [players, calledPlayers, matchData]);


  // ── Filtrado Multidimensional de Eventos ────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return (rawEvents || []).filter(e => {
      if (!e) return false;
      // 1. Filtro de Tiempo
      const m = Number(e.minute || e.time || 0);
      if (m < timeRange[0] || m > timeRange[1]) return false;
      if (timeFilter === '1T' && e.half !== 1 && m > 45) return false;
      if (timeFilter === '2T' && e.half !== 2 && m <= 45) return false;

      // 2. Filtro de Equipo
      if (teamFilter === 'home' && e.team === 'away') return false;
      if (teamFilter === 'away' && e.team === 'home') return false;

      // 3. Filtro de Jugador
      if (selectedPlayers.length > 0) {
        if (!e.playerId || !selectedPlayers.includes(e.playerId)) return false;
      }

      // 4. Filtro de Zona
      if (zoneFilter !== 'all') {
        const x = typeof e.x === 'number' ? e.x : 50;
        if (zoneFilter === 'def' && x > 35) return false;
        if (zoneFilter === 'mid' && (x <= 35 || x > 65)) return false;
        if (zoneFilter === 'att' && x <= 65) return false;
      }

      return true;
    });
  }, [rawEvents, timeFilter, timeRange, teamFilter, selectedPlayers, zoneFilter]);

  const countByType = useCallback(
    (type) => filteredEvents.filter((e) => e && e.type === type).length,
    [filteredEvents]
  );

  // ── Extraer Disparos para el Shot Map ───────────────────────────────────────
  const shotsList = useMemo(() => {
    return (filteredEvents || []).filter(e => 
      e && ['shot', 'tiro', 'shot_on_target_own', 'shot_off_target_own', 'shot_on_target_rival', 'shot_off_target_rival', 'gol', 'goal', 'gol_local', 'gol_rival'].includes(e.type)
    );
  }, [filteredEvents]);

  // ── Extraer Pases para la Red de Pases ──────────────────────────────────────
  const passesList = useMemo(() => {
    return (filteredEvents || []).filter(e => 
      e && ['pass', 'pase', 'recovery', 'duel_won'].includes(e.type)
    );
  }, [filteredEvents]);

  // ── Listener de eventos Fullscreen nativos ──────────────────────────────────
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const elem = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── Manejo de Exportar PDF ──────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    try {
      const { generateMatchPdfReport } = await import('../utils/matchPdfReport');
      await generateMatchPdfReport({
        mode: 'LIVE-STATS',
        teamName: homeTeamName,
        matchData,
        events: filteredEvents,
        language: getEffectiveLanguage(),
      });
    } catch (err) {
      console.error("Error al exportar informe PDF de Live Stats:", err);
    }
  }, [matchData, filteredEvents, homeTeamName]);

  const innerAddLiveEvent = useCallback(async (type, explicitHalf = null, customCoords = {}) => {
    if (isMatchLocked(matchData)) {
      showToast('⚠️ Partido finalizado — usa Reabrir Acta para corregir.', 'warning');
      return null;
    }
    const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const targetHalf = explicitHalf !== null ? explicitHalf : currentHalf;

    const xMap = { left: 20, center: 50, right: 80 };
    const yCoord = customCoords?.y ?? (targetHalf === 1 ? 30 : 70);
    const xCoord = customCoords?.x ?? (xMap[type] || 50);

    const localDoc = {
      id: tempId,
      type,
      half: targetHalf,
      minute: currentMinute || 1,
      sector: selectedSector,
      x: xCoord,
      y: yCoord,
      timestamp: new Date().toISOString()
    };

    setLocalEvents(prev => [...prev, localDoc]);
    const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
    if (hook) {
      const realId = await hook(type, explicitHalf, { sector: selectedSector, x: xCoord, y: yCoord });
      if (realId && realId !== tempId) {
        setLocalEvents(prev => prev.filter(e => e.id !== tempId));
      }
      return realId;
    }
    return tempId;
  }, [parentAddLiveEvent, liveStatsHook.addLiveEvent, currentHalf, currentMinute, selectedSector, matchData]);

  const addLiveEvent = innerAddLiveEvent;
  const resetLiveStats = useCallback(async () => {
    if (isMatchLocked(matchData)) {
      showToast('⚠️ Partido finalizado — usa Reabrir Acta para corregir.', 'warning');
      return;
    }
    setLocalEvents([]);
    const hook = parentResetLiveStats || liveStatsHook.resetLiveStats;
    if (hook) await hook();
  }, [parentResetLiveStats, liveStatsHook.resetLiveStats, matchData]);

  const handlePress = useCallback(
    async (type) => {
      if (isMatchLocked(matchData)) {
        showToast('⚠️ Partido finalizado — usa Reabrir Acta para corregir.', 'warning');
        return;
      }
      const id = await addLiveEvent(type, currentHalf);
      if (id) {
        setFlashType(type);
        setTimeout(() => setFlashType(null), 650);
      }
    },
    [addLiveEvent, currentHalf, matchData]
  );


  const handleAddTacticalNote = (noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      minute: currentMinute || 0,
      timestamp: new Date().toISOString()
    };
    setTacticalNotes(prev => [newNote, ...prev]);
  };

  const handleToggleHighlight = () => {
    setIsHighlighted(prev => !prev);
  };

  if (!matchId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '48px' }}>📊</span>
        <p style={{ color: darkMode ? '#94A3B8' : '#64748B', fontSize: '15px', maxWidth: '340px', lineHeight: 1.6 }}>
          {tx('live.noMatch')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`livestats-container ${darkMode ? 'dark-theme dark theme-dark' : 'light-theme theme-light'} ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{
        backgroundColor: darkMode ? '#0B1317' : '#F1F5F9',
        color: darkMode ? '#FFFFFF' : '#0F172A',
      }}
    >
      {/* Aviso Banner de Partido Bloqueado / Histórico Inmutable */}
      {isLocked && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          color: '#FCA5A5',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          margin: '12px 16px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <span>🔒</span>
          <span>{isEn ? 'Match finished — Controls locked (Immutable historical record. Reopen match sheet to edit)' : 'Partido finalizado — Controles bloqueados (Registro histórico inmutable. Reabre el acta para editar)'}</span>
        </div>
      )}

      {/* ── 1. Barra de Navegación por Pestañas de LiveStats ────────────────── */}
      <nav className="livestats-tab-navigation">
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture')}
        >
          🔴 {tx('live.tab.capture')}
        </button>
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'tactical' ? 'active' : ''}`}
          onClick={() => setActiveTab('tactical')}
        >
          ⚽ {tx('live.tab.tactical')}
        </button>
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 {tx('live.tab.analytics')}
        </button>
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          📋 {tx('live.tab.players')}
        </button>
      </nav>

      {/* ── 2. Barra de Herramientas Rápida ─────────────────────────────────── */}
      <MatchActionsToolbar
        matchData={matchData}
        teamName={homeTeamName}
        events={filteredEvents}
        players={playersList}
        tacticalNotes={tacticalNotes}
        onAddTacticalNote={handleAddTacticalNote}
        isHighlighted={isHighlighted}
        onToggleHighlight={handleToggleHighlight}
        language={language}
      />

      {/* ── 3. Panel Desplegable de Filtros Avanzados ───────────────────────── */}
      {activeTab !== 'capture' && (
        <StatsFilters
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          selectedPlayers={selectedPlayers}
          setSelectedPlayers={setSelectedPlayers}
          zoneFilter={zoneFilter}
          setZoneFilter={setZoneFilter}
          actionTypes={actionTypes}
          setActionTypes={setActionTypes}
          players={playersList}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          language={language}
        />
      )}

      {/* ── 4. Cabecera Principal del Cronómetro (Modo captura y pantalla completa) ─── */}
      {(activeTab === 'capture' || isFullscreen) && (
        <header className="livestats-header">
          {/* Cronómetro y Mitad */}
          <div className="livestats-timer-card">
            <div className="livestats-timer-display" style={{ color: isMatchFinished ? '#94A3B8' : (isRunning ? '#4CAF7D' : '#D4A843') }}>
              <span className="livestats-timer-time">{formatMatchTime(displaySeconds)}</span>
              {isMatchFinished ? (
                <span className="livestats-timer-badge" style={{ background: '#15803D', color: '#FFFFFF', fontWeight: '800' }}>
                  ⏹️ {isEn ? 'FINAL' : 'FINAL'}
                </span>
              ) : (
                <span className="livestats-timer-badge">
                  {tx('live.half')} {displayHalf} · {currentMinute}′
                </span>
              )}
            </div>

            <div className="livestats-timer-actions">
              <button
                type="button"
                id="livestats-btn-toggle-timer"
                onClick={isMatchFinished ? undefined : toggleTimer}
                disabled={isMatchFinished}
                title={isMatchFinished ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : (isRunning ? tx('live.timer.pause') : tx('live.timer.start'))}
                className={`livestats-btn-timer ${isMatchFinished ? 'paused' : (isRunning ? 'running' : 'paused')}`}
                style={isMatchFinished ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {isMatchFinished
                  ? (isEn ? 'Finished' : 'Finalizado')
                  : (isRunning ? tx('live.timer.pause') : tx('live.timer.start'))}
              </button>

              <button
                type="button"
                id="livestats-btn-reset-timer"
                onClick={isMatchFinished ? undefined : resetTimer}
                disabled={isMatchFinished}
                className="livestats-btn-icon-timer"
                title={isMatchFinished ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : tx('live.timer.reset')}
                style={isMatchFinished ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                ↺
              </button>
            </div>
          </div>

          {/* Marcador en vivo */}
          <div className="livestats-score-card">
            <div className="livestats-score-teams">
              <div className="livestats-team home">
                <span className="livestats-team-name">{homeTeamName}</span>
                <span className="livestats-team-score">{matchData?.goalsFor ?? matchData?.marcadorLocal ?? 0}</span>
                {onAddGoalFor && (
                  <button
                    type="button"
                    onClick={isLocked ? undefined : onAddGoalFor}
                    disabled={isLocked}
                    title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : tx('live.goal.for')}
                    className="livestats-btn-goal for"
                    style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    {tx('live.goal.for')}
                  </button>
                )}
              </div>

              <span className="livestats-score-separator">-</span>

              <div className="livestats-team away">
                <span className="livestats-team-score">{matchData?.goalsAgainst ?? matchData?.marcadorVisitante ?? 0}</span>
                <span className="livestats-team-name">{awayTeamName}</span>
                {onAddGoalAgainst && (
                  <button
                    type="button"
                    onClick={isLocked ? undefined : onAddGoalAgainst}
                    disabled={isLocked}
                    title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : tx('live.goal.against')}
                    className="livestats-btn-goal against"
                    style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    {tx('live.goal.against')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Mitad y Acciones de Cabecera */}
          <div className="livestats-header-right">
            <div className="livestats-half-selector">
              <span className="livestats-half-label">{tx('live.half.select')}</span>
              <button
                type="button"
                onClick={isLocked ? undefined : () => setCurrentHalf(1)}
                disabled={isLocked}
                title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                className={`livestats-half-pill ${currentHalf === 1 ? 'active' : ''}`}
                style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {tx('live.half.1')}
              </button>
              <button
                type="button"
                onClick={isLocked ? undefined : () => setCurrentHalf(2)}
                disabled={isLocked}
                title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                className={`livestats-half-pill ${currentHalf === 2 ? 'active' : ''}`}
                style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {tx('live.half.2')}
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="livestats-fullscreen-btn"
              title={isFullscreen ? tx('live.fullscreen.exit') : tx('live.fullscreen.enter')}
            >
              <span>{isFullscreen ? tx('live.fullscreen.exit') : tx('live.fullscreen.enter')}</span>
            </button>
          </div>
        </header>
      )}

      {/* ── 5. Contenido Dinámico por Pestaña ────────────────────────────── */}
      <main className="livestats-body">
        {/* PESTAÑA 1: Captura Rápida */}
        {(activeTab === 'capture' || isFullscreen) && (
          <>
            {/* Selector Táctico de Sector */}
            <div className="livestats-sector-bar">
              <span className="sector-bar-title">📍 Sector de la Jugada:</span>
              <div className="sector-bar-pills">
                <button
                  type="button"
                  className={`sector-pill ${selectedSector === 'left' ? 'active' : ''}`}
                  onClick={isLocked ? undefined : () => setSelectedSector('left')}
                  disabled={isLocked}
                  title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                  style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  ⬅️ Banda Izquierda
                </button>
                <button
                  type="button"
                  className={`sector-pill ${selectedSector === 'center' ? 'active' : ''}`}
                  onClick={isLocked ? undefined : () => setSelectedSector('center')}
                  disabled={isLocked}
                  title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                  style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  ⏺️ Centro / Pasillo Central
                </button>
                <button
                  type="button"
                  className={`sector-pill ${selectedSector === 'right' ? 'active' : ''}`}
                  onClick={isLocked ? undefined : () => setSelectedSector('right')}
                  disabled={isLocked}
                  title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                  style={isLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  ➡️ Banda Derecha
                </button>
              </div>
            </div>

            <div className="livestats-categories-grid">
              {BUTTON_GROUPS.map((group) => (
                <section
                  key={group.catKey}
                  className="livestats-category-card"
                  style={{
                    backgroundColor: darkMode ? '#122415' : '#FFFFFF',
                    borderColor: darkMode ? 'rgba(212, 168, 67, 0.35)' : '#CBD5E1',
                    borderWidth: '1.5px',
                    borderStyle: 'solid'
                  }}
                >
                  <div className="livestats-category-title" style={{ color: group.color }}>
                    <span>{tx(group.catKey)}</span>
                  </div>

                  <div className={`livestats-buttons-grid ${group.colsClass}`}>
                    {group.buttons.map(({ type, labelKey, icon }) => {
                      const count = countByType(type);
                      const isFlashing = flashType === type;
                      const label = tx(labelKey);
                      const lines = label.split('\n');

                      return (
                        <button
                          key={type}
                          type="button"
                          id={`livestats-btn-${type}`}
                          onClick={isLocked ? undefined : () => handlePress(type)}
                          disabled={saving || isLocked}
                          title={isLocked ? (isEn ? 'Match finished — Reopen match sheet to edit' : 'Partido finalizado — usa Reabrir Acta para corregir') : undefined}
                          className={`livestats-btn ${isFlashing ? 'flashing' : ''}`}
                          style={{
                            backgroundColor: isFlashing
                              ? `${group.color}25`
                              : darkMode ? 'rgba(255, 255, 255, 0.08)' : '#F8FAFC',
                            borderColor: isFlashing
                              ? group.color
                              : darkMode ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                            boxShadow: isFlashing ? `0 0 14px ${group.color}55` : undefined,
                            opacity: isLocked ? 0.6 : 1,
                            cursor: isLocked ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <span className="livestats-btn-icon">{icon}</span>
                          <span
                            className="livestats-btn-label"
                            style={{ color: darkMode ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}
                          >
                            {lines[0]}
                            {lines[1] && (
                              <span
                                className="livestats-btn-label-sub"
                                style={{ color: darkMode ? '#E2E8F0' : '#475569', fontWeight: 700 }}
                              >
                                {lines[1]}
                              </span>
                            )}
                          </span>
                          {count > 0 && (
                            <span
                              className="livestats-btn-count"
                              style={{
                                color: group.color,
                                backgroundColor: darkMode ? '#000000' : '#FFFFFF',
                                borderColor: darkMode ? group.color : '#CBD5E1'
                              }}
                            >
                              {count}
                            </span>
                          )}
                          {isFlashing && (
                            <span className="livestats-flash-msg" style={{ color: group.color }}>
                              {tx('live.feedback.saved')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Resumen Rápido con Donas SVG Reutilizable */}
            <section style={{ marginTop: '28px', maxWidth: '1400px', margin: '28px auto 0' }}>
              <MatchStatsBlock
                matchData={matchData}
                events={filteredEvents}
                language={language}
                showDonuts={true}
                showComparison={true}
                showHalves={true}
                showDetailedTables={true}
              />
            </section>
          </>
        )}

        {/* PESTAÑA 2: Campo & Táctica (Heat Map, Red de Pases, Shot Map) */}
        {activeTab === 'tactical' && (
          <div className="tactical-tab-content">
            {/* Heat Map de Actividad */}
            <HeatMap
              events={filteredEvents}
              players={playersList}
              teamName={homeTeamName}
            />

            {/* Red de Pases Táctica */}
            <PassNetwork
              passes={passesList}
              players={playersList}
              teamName={homeTeamName}
            />

            {/* Mapa de Tiros con Modelo xG */}
            <ShotMap
              shots={shotsList}
              players={playersList}
              teamName={homeTeamName}
            />
          </div>
        )}

        {/* PESTAÑA 3: Análisis Avanzado (Radar Chart, Timeline, Barras Comparativas) */}
        {activeTab === 'analytics' && (() => {
          // ── Calcular TODOS los stats desde eventos reales ──────────────────
          const recHome   = countByType('recovery');
          const lossHome  = countByType('loss');
          const totalPossEvents = recHome + lossHome;
          // Posesión: proporción recuperaciones / (recuperaciones + pérdidas)
          const posHome = totalPossEvents > 0 ? Math.round((recHome / totalPossEvents) * 100) : 50;
          const posAway = 100 - posHome;

          const tirosHome   = countByType('shot_on_target_own') + countByType('shot_off_target_own');
          const tirosAway   = countByType('shot_on_target_rival') + countByType('shot_off_target_rival');
          const duelsWon    = countByType('duel_won');
          const duelsLost   = countByType('duel_lost');
          const cornHome    = countByType('corner_favor');
          const cornAway    = countByType('corner_against');
          const faultsBy    = countByType('foul_against');
          const faultsOpp   = countByType('foul_favor');
          const yellHome    = countByType('card_yellow_own');
          const yellAway    = countByType('card_yellow_rival');
          const redHome     = countByType('card_red_own');
          const redAway     = countByType('card_red_rival');
          // Pases proxy: recuperaciones + duelos ganados ≈ pases exitosos propios
          const pasesExHome = recHome + duelsWon;
          const pasesExAway = lossHome + duelsLost;

          return (
          <div className="analytics-tab-content">
            <ComparativeStatsBars
              homeStats={{
                posesion: posHome,
                tiros: tirosHome,
                tirosPuerta: countByType('shot_on_target_own'),
                pasesExitosos: pasesExHome,
                pasesTotales: pasesExHome + faultsBy,
                recuperaciones: recHome,
                corners: cornHome,
                faltas: faultsBy,
                amarillas: yellHome
              }}
              awayStats={{
                posesion: posAway,
                tiros: tirosAway,
                tirosPuerta: countByType('shot_on_target_rival'),
                pasesExitosos: pasesExAway,
                pasesTotales: pasesExAway + faultsOpp,
                recuperaciones: lossHome,
                corners: cornAway,
                faltas: faultsOpp,
                amarillas: yellAway
              }}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />

            <div className="analytics-grid-two-cols">
              <MatchRadarChart
                homeStats={{
                  pasesExitosos: pasesExHome,
                  pasesTotales: Math.max(pasesExHome, 1),
                  tiros: tirosHome,
                  recuperaciones: recHome,
                  entradas: duelsWon,
                  regates: cornHome,
                  aereos: yellHome + redHome,
                  presiones: faultsBy,
                  intercepciones: countByType('offside_rival')
                }}
                awayStats={{
                  pasesExitosos: pasesExAway,
                  pasesTotales: Math.max(pasesExAway, 1),
                  tiros: tirosAway,
                  recuperaciones: lossHome,
                  entradas: duelsLost,
                  regates: cornAway,
                  aereos: yellAway + redAway,
                  presiones: faultsOpp,
                  intercepciones: countByType('offside_own')
                }}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                players={playersList}
              />

              <MatchTimeline
                events={filteredEvents}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                matchDuration={90}
              />
            </div>
          </div>
          );
        })()}

        {/* PESTAÑA 4: Rendimiento Individual de Jugadores & CSV — derivado de eventos reales */}
        {activeTab === 'players' && (
          <div className="players-tab-content">
            <StatsDataTable
              playerStats={playersList.map((p) => {
                const pid = p.id;
                const evsByPlayer = filteredEvents.filter(e => e.playerId === pid || e.fromPlayerId === pid);
                const countP = (t) => evsByPlayer.filter(e => e.type === t).length;
                return {
                  ...p,
                  goles: filteredEvents.filter(e => (e.type === 'gol_local' || e.type === 'goal') && e.playerId === pid).length,
                  asistencias: filteredEvents.filter(e => e.asistenciaId === pid).length,
                  tiros: countP('shot_on_target_own') + countP('shot_off_target_own'),
                  tirosPuerta: countP('shot_on_target_own'),
                  pasesExitosos: countP('recovery') + countP('duel_won'),
                  pasesFallidos: countP('loss'),
                  pasesClave: countP('duel_won'),
                  recuperaciones: countP('recovery'),
                  entradas: countP('duel_won') + countP('duel_lost'),
                  faltas: countP('foul_against'),
                  xG: parseFloat(((countP('shot_on_target_own') * 0.35) + (countP('shot_off_target_own') * 0.05)).toFixed(2))
                };
              })}
              teamName={homeTeamName}
            />
          </div>
        )}

        {/* Modal de confirmación para reiniciar conteo */}
        {showResetModal && (
          <div className="event-selector-overlay" onClick={() => setShowResetModal(false)} style={{ zIndex: 99999 }}>
            <div className="event-selector-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '24px', borderRadius: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: darkMode ? '#F8FAFC' : '#0F172A', marginBottom: '12px' }}>
                ¿Reiniciar eventos de este partido?
              </h3>
              <p style={{ fontSize: '13px', color: darkMode ? '#94A3B8' : '#64748B', marginBottom: '20px', lineHeight: 1.5 }}>
                Se eliminarán permanentemente todas las estadísticas grabadas en vivo para este partido y todos los contadores volverán a 0.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{ minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowResetModal(false);
                    if (resetLiveStats) await resetLiveStats();
                    if (onResetEvents) onResetEvents();
                  }}
                  style={{ minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Sí, Reiniciar Conteo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveStats;
