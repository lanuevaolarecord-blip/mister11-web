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
import { isMatchLocked, getStartingXI, calculateMinutesFromEvents, getEffectiveMatchDuration } from '../utils/minutesEngine';
import { showToast } from '../utils/toast';
import { t } from '../i18n/index.js';
import MatchStatsBlock from './MatchStatsBlock';

// ── Nuevos Componentes de la Suite de Estadísticas ────────────────────────────
import { StatsFilters } from './MatchStats/StatsFilters';
import { MatchActionsToolbar } from './MatchStats/MatchActionsToolbar';
import { HeatMap } from './MatchStats/HeatMap';
import { PassNetwork } from './MatchStats/PassNetwork';
import { ShotMap } from './MatchStats/ShotMap';
import { ShotCaptureModal } from './ShotCaptureModal';
import { MatchRadarChart } from './MatchStats/MatchRadarChart';
import { MatchTimeline } from './MatchStats/MatchTimeline';
import { ComparativeStatsBars } from './MatchStats/ComparativeStatsBars';
import { StatsDataTable } from './MatchStats/StatsDataTable';
import { SectorMiniPitch2D } from './SectorMiniPitch2D';
import { UnattributedEventsManager, isAttributableOwnEvent } from './UnattributedEventsManager';
import { CaptureCriteriaModal } from './CaptureCriteriaModal';
import { CAPTURE_CRITERIA } from '../config/captureCriteria';

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
  'live.btn.save_own': { es: 'Parada portero\n(Propio)', en: 'Goalkeeper Save\n(Own)' },
  'live.btn.save_rival': { es: 'Parada portero\n(Rival)', en: 'Goalkeeper Save\n(Rival)' },
  'live.select.scorer': { es: '⚽ Seleccionar Goleador', en: '⚽ Select Goalscorer' },
  'live.select.yellow': { es: '🟨 Tarjeta Amarilla (Propia)', en: '🟨 Yellow Card (Own)' },
  'live.select.red': { es: '🟥 Tarjeta Roja (Propia)', en: '🟥 Red Card (Own)' },
  'live.select.unassigned_goal': { es: 'Autogol rival / Sin asignar', en: 'Opponent Own Goal / Unassigned' },
  'live.select.starters': { es: 'Titulares', en: 'Starters' },
  'live.select.substitutes': { es: 'Suplentes', en: 'Substitutes' },
  'live.select.squad': { es: 'Otros Jugadores', en: 'Other Squad Players' },
  'live.select.cancel': { es: 'Cancelar', en: 'Cancel' },
  'live.half.select': { es: 'Mitad:', en: 'Half:' },
  'live.half.1': { es: '1ª Mitad', en: '1st Half' },
  'live.half.2': { es: '2ª Mitad', en: '2nd Half' },
  'live.feedback.saved': { es: '¡Guardado!', en: 'Saved!' },
  'live.tab.capture': { es: 'Captura en Vivo', en: 'Live Capture' },
  'live.tab.tactical': { es: 'Campo & Táctica', en: 'Field & Tactics' },
  'live.tab.analytics': { es: 'Análisis Avanzado', en: 'Advanced Analysis' },
  'live.tab.players': { es: 'Jugadores & CSV', en: 'Players & CSV' },
  'capture.team.shot_own': { es: 'Tiro\nPropio', en: 'Shot\n(Own)' },
  'capture.team.shot_rival': { es: 'Tiro\nRival', en: 'Shot\n(Rival)' },
  'capture.hud.shot': { es: 'Tiro', en: 'Shot' },
  'capture.hud.recovery': { es: 'Recuper.', en: 'Recov.' },
  'capture.hud.duel_won': { es: 'Duelo\nGanado', en: 'Duel\nWon' },
  'capture.hud.foul': { es: 'Falta', en: 'Foul' },
  'capture.hud.advanced': { es: 'Avanzado', en: 'Advanced' },
  'capture.hud.key_pass': { es: 'Pase\nClave', en: 'Key\nPass' },
  'capture.hud.turnover': { es: 'Pérdida', en: 'Turnover' },
  'capture.hud.duel_lost': { es: 'Duelo\nPerdido', en: 'Duel\nLost' },
  'capture.hud.unattributed': { es: 'Sin atribuir', en: 'Unattributed' },
};

// ── Grupos de botones de captura rápida (Panel de Equipo Reducido: 12 botones) ────
const BUTTON_GROUPS = [
  {
    catKey: 'live.cat.shots',
    color: C.green,
    colsClass: 'cols-2',
    buttons: [
      { type: 'shot_own', labelKey: 'capture.team.shot_own', icon: '⚽', criterionId: 'shot_on_target' },
      { type: 'shot_rival', labelKey: 'capture.team.shot_rival', icon: '🔴', criterionId: 'shot_on_target' },
    ],
  },
  {
    catKey: 'live.cat.fouls',
    color: C.orange,
    colsClass: 'cols-2',
    buttons: [
      { type: 'foul_favor', labelKey: 'live.btn.foul_favor', icon: '✅', criterionId: 'foul_favor' },
      { type: 'foul_against', labelKey: 'live.btn.foul_against', icon: '⚡', criterionId: 'foul_against' },
    ],
  },
  {
    catKey: 'live.cat.discipline',
    color: C.gold,
    colsClass: 'cols-4',
    buttons: [
      { type: 'card_yellow_own', labelKey: 'live.btn.card_yellow_own', icon: '🟨', criterionId: 'card_yellow' },
      { type: 'card_red_own', labelKey: 'live.btn.card_red_own', icon: '🟥', criterionId: 'card_red' },
      { type: 'card_yellow_rival', labelKey: 'live.btn.card_yellow_rival', icon: '🟨', criterionId: 'card_yellow' },
      { type: 'card_red_rival', labelKey: 'live.btn.card_red_rival', icon: '🟥', criterionId: 'card_red' },
    ],
  },
  {
    catKey: 'live.cat.discipline',
    color: C.teal,
    colsClass: 'cols-4',
    buttons: [
      { type: 'corner_favor', labelKey: 'live.btn.corner_favor', icon: '🚩', criterionId: 'corner' },
      { type: 'corner_against', labelKey: 'live.btn.corner_against', icon: '⛳', criterionId: 'corner' },
      { type: 'offside_own', labelKey: 'live.btn.offside_own', icon: '🏃', criterionId: 'offside' },
      { type: 'offside_rival', labelKey: 'live.btn.offside_rival', icon: '🏃‍♂️', criterionId: 'offside' },
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
  onAddCard,
  events: parentEvents,
  addLiveEvent: parentAddLiveEvent,
  resetLiveStats: parentResetLiveStats,
  onResetEvents,
  onFinishMatch,
  onNavigateToLineup,
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
  const displayHalf = isMatchFinished ? 2 : (matchSeconds < 2700 && (!currentMinute || currentMinute <= 45) ? 1 : 2);
  const displaySeconds = isMatchFinished && Number.isFinite(matchData?.finalSeconds) ? matchData.finalSeconds : matchSeconds;

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentHalf, setCurrentHalf] = useState(displayHalf);
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingPlayerSelection, setPendingPlayerSelection] = useState(null);
  const [showBenchPopover, setShowBenchPopover] = useState(false);
  const [pendingShotModal, setPendingShotModal] = useState({
    isOpen: false,
    origin: 'team',
    initialTeam: 'own',
    initialResult: null,
    initialDifficulty: null,
  });

  // Sincronizar automáticamente currentHalf si displayHalf avanza a la 2ª Parte
  useEffect(() => {
    if (displayHalf === 2 && currentHalf !== 2) {
      setCurrentHalf(2);
    }
  }, [displayHalf, currentHalf]);

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

  // ── JUGADOR ACTIVO (Captura Individual a Pie de Campo) ─────────────────────
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [showPostMatchModal, setShowPostMatchModal] = useState(false);
  const [postMatchCounters, setPostMatchCounters] = useState({});

  // Acciones rápidas individuales (≥56dp, táctil Android)
  const PLAYER_QUICK_ACTIONS = [
    { type: 'shot_on_target_own', label: isEn ? 'Shot\nOn Target' : 'Tiro\na Puerta',   icon: '🎯', color: '#4CAF7D' },
    { type: 'shot_off_target_own', label: isEn ? 'Shot\nMissed' : 'Tiro\nFuera',        icon: '⬜', color: '#94A3B8' },
    { type: 'duel_won',            label: isEn ? 'Key\nPass'    : 'Pase\nClave',         icon: '⭐', color: '#D4A843' },
    { type: 'recovery',            label: isEn ? 'Pass\nCompl.' : 'Pase\nComplet.',      icon: '✅', color: '#0D9488' },
    { type: 'duel_won',            label: isEn ? 'Recov.'       : 'Recuper.',             icon: '↑',  color: '#4CAF7D', subtype: 'recovery_ind' },
    { type: 'foul_against',        label: isEn ? 'Foul'         : 'Falta',                icon: '⚡', color: '#F97316' },
    { type: 'duel_won',            label: isEn ? 'Duel\nWon'   : 'Duelo\nGanado',        icon: '✊', color: '#0D9488', subtype: 'duel_ind' },
  ];

  // 7 acciones correctas por acción individual real
  const PLAYER_ACTIONS_REAL = [
    { type: 'shot_on_target_own',  label: isEn ? 'Shot\nOn Target' : 'Tiro a\nPuerta',  icon: '🎯', color: '#4CAF7D' },
    { type: 'shot_off_target_own', label: isEn ? 'Shot\nMissed'    : 'Tiro\nFuera',      icon: '⬜', color: '#94A3B8' },
    { type: 'recovery',            label: isEn ? 'Key\nPass'       : 'Pase\nClave',      icon: '⭐', color: '#D4A843' },
    { type: 'recovery',            label: isEn ? 'Pass\nCompl.'    : 'Pase\nComplet.',   icon: '✅', color: '#0D9488' },
    { type: 'recovery',            label: isEn ? 'Recov.'          : 'Recuper.',          icon: '↑',  color: '#3B82F6' },
    { type: 'foul_against',        label: isEn ? 'Foul'            : 'Falta',             icon: '⚡', color: '#F97316' },
    { type: 'duel_won',            label: isEn ? 'Duel\nWon'       : 'Duelo\nGanado',    icon: '✊', color: '#0D9488' },
  ];

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
  const [selectedSector2D, setSelectedSector2D] = useState('centro_att'); // 9 Zonas 2D tácticas
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showUnattributedModal, setShowUnattributedModal] = useState(false);
  const [showAdvancedHud, setShowAdvancedHud] = useState(false);
  const [pendingFoulModal, setPendingFoulModal] = useState(false);
  const [activeCriterionTooltip, setActiveCriterionTooltip] = useState(null);
  const longPressTimerRef = useRef(null);

  const handleTouchStartCriterion = (criterionId) => {
    if (!criterionId) return;
    longPressTimerRef.current = setTimeout(() => {
      setActiveCriterionTooltip(criterionId);
    }, 400);
  };

  const handleTouchEndCriterion = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSelectSector2D = (zKey) => {
    setSelectedSector2D(zKey);
    if (zKey.includes('izq')) setSelectedSector('left');
    else if (zKey.includes('der')) setSelectedSector('right');
    else setSelectedSector('center');
  };

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

  // ── Jugadores con minutos reales según minutesEngine (Titulares + Sustitutos entrados) ──
  const activePlayersWithMinutes = useMemo(() => {
    const duration = getEffectiveMatchDuration(matchData);
    const rawTitulares = Array.isArray(matchData?.titulares) && matchData.titulares.length > 0
      ? matchData.titulares
      : (Array.isArray(matchData?.alineacion?.titulares) && matchData.alineacion.titulares.length > 0
          ? matchData.alineacion.titulares
          : (calledPlayers || []).slice(0, 11));

    const rawSuplentes = Array.isArray(matchData?.suplentes) && matchData.suplentes.length > 0
      ? matchData.suplentes
      : (calledPlayers || []).slice(11, 18);

    const titIds = (rawTitulares || []).map(p => (typeof p === 'object' && p ? p.id : p)).filter(Boolean).map(String);
    const supIds = (rawSuplentes || []).map(p => (typeof p === 'object' && p ? p.id : p)).filter(Boolean).map(String);

    if (titIds.length === 0 && supIds.length === 0) {
      return [...playersList].sort((a, b) => Number(a.dorsal || a.number || 999) - Number(b.dorsal || b.number || 999));
    }

    const list = (playersList || []).filter(p => {
      const calc = calculateMinutesFromEvents(
        p.id,
        rawEvents,
        titIds,
        supIds,
        duration,
        matchData?.minutesOverrides?.[p.id],
        matchData?.attendanceStatus?.[p.id],
        matchData?.lateArrivals?.[p.id]
      );
      return (calc?.minutes || 0) > 0;
    });

    const result = list.length > 0 ? list : playersList;
    return [...result].sort((a, b) => Number(a.dorsal || a.number || 999) - Number(b.dorsal || b.number || 999));
  }, [matchData, calledPlayers, playersList, rawEvents]);

  // Jugadores del banquillo con 0 minutos (no debutaron aún)
  const benchPlayersZeroMinutes = useMemo(() => {
    const activeIds = new Set(activePlayersWithMinutes.map(p => String(p.id)));
    return (playersList || []).filter(p => !activeIds.has(String(p.id))).sort((a, b) => Number(a.dorsal || a.number || 999) - Number(b.dorsal || b.number || 999));
  }, [playersList, activePlayersWithMinutes]);

  const onPitchPlayersList = activePlayersWithMinutes;

  // Si el jugador activo sale de cambio o es expulsado, deseleccionarlo
  useEffect(() => {
    if (activePlayerId && onPitchPlayersList.length > 0) {
      const isStillOnPitch = onPitchPlayersList.some(p => String(p.id) === String(activePlayerId));
      if (!isStillOnPitch) {
        setActivePlayerId(null);
      }
    }
  }, [onPitchPlayersList, activePlayerId]);

  const filteredEvents = useMemo(() => {
    return (rawEvents || []).filter(e => {
      if (!e) return false;
      // 1. Filtro de Tiempo
      const m = Number(e.minute || e.time || 0);
      if (m < timeRange[0] || m > timeRange[1]) return false;
      const isEvT2 = Number(e.half) === 2 || (!e.half && m > 45);
      const isEvT1 = Number(e.half) === 1 || (!e.half && m <= 45);
      if (timeFilter === '1T' && !isEvT1) return false;
      if (timeFilter === '2T' && !isEvT2) return false;

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

  const unattributedCount = useMemo(() => {
    return (rawEvents || []).filter(isAttributableOwnEvent).length;
  }, [rawEvents]);

  const handleAttributeEvents = useCallback(async ({ eventIds = [], playerId, playerName }) => {
    if (!eventIds || eventIds.length === 0 || !playerId) return;
    const idSet = new Set(eventIds.map(String));

    setLocalEvents(prev => prev.map(e => idSet.has(String(e.id)) ? { ...e, playerId, playerName, attributed: true } : e));

    if (liveStatsHook.updateLiveEvents) {
      await liveStatsHook.updateLiveEvents(eventIds, { playerId, playerName, attributed: true });
    }
    showToast(isEn ? `Attributed ${eventIds.length} event(s) to ${playerName}` : `Atribuido(s) ${eventIds.length} evento(s) a ${playerName}`, 'success');
  }, [liveStatsHook, isEn]);

  const countByType = useCallback(
    (type) => {
      if (type === 'shot_own') {
        return filteredEvents.filter(e => e && (e.team === 'own' || !e.team || String(e.type || '').includes('own') || e.type === 'gol_local' || e.type === 'shot_favor')).length;
      }
      if (type === 'shot_rival') {
        return filteredEvents.filter(e => e && (e.team === 'rival' || String(e.type || '').includes('rival') || e.type === 'gol_rival')).length;
      }
      return filteredEvents.filter((e) => e && e.type === type).length;
    },
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
      e && ['pass', 'pase', 'pass_completed', 'pass_failed', 'key_pass'].includes(e.type)
    );
  }, [filteredEvents]);

  // ── Listener de eventos Fullscreen nativos ──────────────────────────────────
  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFS);
      if (isFS) {
        setActiveTab('capture');
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  const toggleFullscreen = () => {
    setActiveTab('capture');
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

  // ── Acción individual con playerId adjunto ────────────────────────────────
  const handlePlayerAction = useCallback(async (type) => {
    if (!activePlayerId) {
      showToast(t('livestats.select_player_first'), 'warning');
      return;
    }
    if (isMatchLocked(matchData)) {
      showToast(t('livestats.match_locked_use_reopen'), 'warning');
      return;
    }

    // Interceptar tiros individuales para captura rápida con contexto (<= 3 taps)
    if (type === 'shot_on_target_own' || type === 'shot_off_target_own') {
      setPendingShotModal({
        isOpen: true,
        initialTeam: 'own',
        initialResult: type === 'shot_on_target_own' ? null : 'fuera',
        initialDifficulty: null
      });
      return;
    }

    const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const safeMinute = currentHalf === 2
      ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46))
      : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1));
    const localDoc = {
      id: tempId,
      type,
      half: currentHalf,
      minute: safeMinute,
      sector: selectedSector,
      x: 50,
      y: currentHalf === 1 ? 30 : 70,
      playerId: activePlayerId,
      timestamp: new Date().toISOString()
    };
    setLocalEvents(prev => [...prev, localDoc]);
    setFlashType(`player_${type}`);
    setTimeout(() => setFlashType(null), 650);
    const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
    if (hook) {
      const realId = await hook(type, currentHalf, { sector: selectedSector, x: 50, y: currentHalf === 1 ? 30 : 70, playerId: activePlayerId });
      if (realId && realId !== tempId) {
        setLocalEvents(prev => prev.filter(e => e.id !== tempId));
      }
    }
  }, [activePlayerId, currentHalf, currentMinute, selectedSector, matchData, parentAddLiveEvent, liveStatsHook.addLiveEvent]);

  const innerAddLiveEvent = useCallback(async (type, explicitHalf = null, customCoords = {}) => {
    if (isMatchLocked(matchData)) {
      showToast(t('livestats.match_locked_use_reopen'), 'warning');
      return null;
    }
    const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const targetHalf = explicitHalf !== null ? explicitHalf : currentHalf;

    const yMap = { left: 16, center: 50, right: 84 };
    const effectiveSector = customCoords?.sector || selectedSector || 'center';
    const yCoord = customCoords?.y ?? (yMap[effectiveSector] || 50);

    // X según tipo de acción (Defensa: 25, Medio: 50, Ataque: 80)
    let defaultX = 50;
    if (type.includes('shot') || type.includes('goal') || type === 'corner_favor') defaultX = 85;
    else if (type.includes('foul') || type.includes('card') || type === 'corner_against') defaultX = 30;
    const xCoord = customCoords?.x ?? defaultX;

    const targetPlayerId = customCoords?.playerId || activePlayerId || null;

    const localDoc = {
      id: tempId,
      type,
      half: targetHalf,
      // Garantizar minuto coherente: 2T siempre >= 46
      minute: targetHalf === 2
        ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46))
        : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1)),
      sector: effectiveSector,
      x: xCoord,
      y: yCoord,
      playerId: targetPlayerId,
      timestamp: new Date().toISOString(),
      ...customCoords,
    };

    setLocalEvents(prev => [...prev, localDoc]);
    const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
    if (hook) {
      const realId = await hook(type, explicitHalf, { 
        sector: effectiveSector, 
        x: xCoord, 
        y: yCoord,
        playerId: targetPlayerId,
        ...customCoords
      });
      if (realId && realId !== tempId) {
        setLocalEvents(prev => prev.filter(e => e.id !== tempId));
      }
      return realId;
    }
    return tempId;
  }, [parentAddLiveEvent, liveStatsHook.addLiveEvent, currentHalf, currentMinute, selectedSector, activePlayerId, matchData]);

  const addLiveEvent = innerAddLiveEvent;
  const resetLiveStats = useCallback(async () => {
    if (isMatchLocked(matchData)) {
      showToast(t('livestats.match_locked_use_reopen'), 'warning');
      return;
    }
    setLocalEvents([]);
    const hook = parentResetLiveStats || liveStatsHook.resetLiveStats;
    if (hook) await hook();
  }, [parentResetLiveStats, liveStatsHook.resetLiveStats, matchData]);

  // ── Portero en Campo Activo (dinámico por alineación y sustituciones) ────────
  const activeGoalkeeper = useMemo(() => {
    return onPitchPlayersList.find(p => (p.posicion === 'POR' || p.position === 'POR' || p.posicion === 'GK')) || null;
  }, [onPitchPlayersList]);

  const [showGoalAgainstModal, setShowGoalAgainstModal] = useState(false);

  // ── Callback de confirmación del modal de tiro con contexto (<=3 taps) ─────────
  const handleConfirmShot = useCallback(async (shotPayload) => {
    const {
      team,
      result,
      saveDifficulty,
      shooterComfort,
      zone,
      playType,
      xG,
      playerId,
      playerName,
      sector
    } = shotPayload;

    let eventType = 'shot_off_target_own';
    if (team === 'own') {
      if (result === 'gol' || result === 'parada') eventType = 'shot_on_target_own';
      else eventType = 'shot_off_target_own';
    } else {
      if (result === 'gol' || result === 'parada') eventType = 'shot_on_target_rival';
      else eventType = 'shot_off_target_rival';
    }

    const effectivePlayerId = playerId || activePlayerId || null;
    let effectivePlayerName = playerName || '';
    if (effectivePlayerId && !effectivePlayerName) {
      const p = playersList.find(x => String(x.id) === String(effectivePlayerId));
      if (p) effectivePlayerName = p.nombre || p.name || '';
    }

    let xCoord = 85;
    let yCoord = 50;
    if (zone.includes('izq')) yCoord = 18;
    else if (zone.includes('der')) yCoord = 82;
    else yCoord = 50;
    if (zone.includes('fuera')) xCoord = 68;
    if (zone === 'penalti') xCoord = 88;

    // 1. Guardar evento de tiro con todo su contexto enriquecido
    await addLiveEvent(eventType, currentHalf, {
      team,
      result,
      saveDifficulty: result === 'parada' ? (saveDifficulty || 'normal') : null,
      shooterComfort,
      zone,
      playType,
      xG,
      playerId: effectivePlayerId,
      playerName: effectivePlayerName,
      sector: sector || selectedSector || 'center',
      x: xCoord,
      y: yCoord,
      outcome: result === 'gol' ? 'goal' : (result === 'parada' ? 'on_target' : 'off_target'),
      isGoal: result === 'gol',
      isDecisive: saveDifficulty === 'decisiva'
    });

    // 2. Si fue un remate rival detenido (parada del portero propio)
    // Genera tanto el tiro rival (xG/exposición) como el evento de portería con dificultad
    if (team === 'rival' && result === 'parada') {
      const portero = activeGoalkeeper || playersList.find(p => (p.posicion === 'POR' || p.position === 'POR' || p.posicion === 'GK'));
      if (portero) {
        await addLiveEvent('save_own', currentHalf, {
          playerId: portero.id,
          playerName: portero.nombre || portero.name || 'Portero',
          saveDifficulty: saveDifficulty || 'normal',
          isDecisive: saveDifficulty === 'decisiva',
          sector: sector || selectedSector || 'center',
          x: 10,
          y: yCoord
        });
      }
    }

    // 3. Notificar gol propio al partido si aplica
    if (team === 'own' && result === 'gol' && onAddGoalFor) {
      onAddGoalFor(effectivePlayerId, effectivePlayerName);
    }

    // 4. Notificar gol rival si aplica
    if (team === 'rival' && result === 'gol' && onAddGoalAgainst) {
      onAddGoalAgainst();
    }

    setFlashType(eventType);
    setTimeout(() => setFlashType(null), 650);
  }, [addLiveEvent, currentHalf, activePlayerId, selectedSector, activeGoalkeeper, playersList, onAddGoalFor, onAddGoalAgainst]);

  const handlePress = useCallback(
    async (type) => {
      if (isMatchLocked(matchData)) {
        showToast(t('livestats.match_locked_use_reopen'), 'warning');
        return;
      }
      if (type === 'card_yellow_own') {
        setPendingPlayerSelection({ action: 'card_yellow_own', title: tx('live.select.yellow') });
        return;
      }
      if (type === 'card_red_own') {
        setPendingPlayerSelection({ action: 'card_red_own', title: tx('live.select.red') });
        return;
      }

      // Interceptar acciones de tiro para modal rápido de contexto (<= 3 taps)
      const isShotAction = [
        'shot_own',
        'shot_rival',
        'shot_on_target_own',
        'shot_on_target_rival',
        'shot_off_target_own',
        'shot_off_target_rival',
        'save_own',
        'save_rival'
      ].includes(type);

      if (isShotAction) {
        let initialTeam = 'own';
        let initialResult = null;
        let initialDifficulty = null;

        if (type === 'shot_rival' || type.includes('rival') || type === 'save_own') {
          initialTeam = 'rival';
        }

        if (type === 'save_own' || type === 'save_rival') {
          initialResult = 'parada';
        } else if (type.includes('off_target')) {
          initialResult = 'fuera';
        }

        setPendingShotModal({
          isOpen: true,
          origin: activePlayerId ? 'individual' : 'team',
          initialTeam,
          initialResult,
          initialDifficulty
        });
        return;
      }

      let effectivePlayerId = activePlayerId || null;
      let effectivePlayerName = '';
      if (!effectivePlayerId && (type === 'save_own' || type === 'save')) {
        const portero = activeGoalkeeper || playersList.find(p => (p.posicion === 'POR' || p.position === 'POR' || p.posicion === 'GK'));
        if (portero) {
          effectivePlayerId = portero.id;
          effectivePlayerName = portero.nombre || portero.name || '';
        }
      }

      const id = await addLiveEvent(type, currentHalf, {
        sector: selectedSector,
        playerId: effectivePlayerId,
        playerName: effectivePlayerName
      });
      if (id) {
        setFlashType(type);
        setTimeout(() => setFlashType(null), 650);
      }
    },
    [addLiveEvent, currentHalf, matchData, selectedSector, activePlayerId, tx, playersList, activeGoalkeeper]
  );

  const handleConfirmPlayerSelection = useCallback(
    async (playerId, playerName) => {
      if (!pendingPlayerSelection) return;
      const { action } = pendingPlayerSelection;
      setPendingPlayerSelection(null);

      const targetMin = currentHalf === 2 
        ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46)) 
        : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1));

      if (action === 'goal') {
        if (onAddGoalFor) {
          onAddGoalFor(playerId, playerName);
        }
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const localDoc = {
          id: tempId,
          type: 'shot_on_target_own',
          half: currentHalf,
          minute: targetMin,
          sector: selectedSector || 'center',
          x: 85,
          y: 50,
          playerId: playerId !== 'unassigned' ? playerId : null,
          playerName: playerName || '',
          timestamp: new Date().toISOString()
        };
        setLocalEvents(prev => [...prev, localDoc]);
        const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
        if (hook) {
          const realId = await hook('shot_on_target_own', currentHalf, {
            playerId: playerId !== 'unassigned' ? playerId : null,
            playerName: playerName || '',
            sector: selectedSector || 'center',
            x: 85,
            y: 50
          });
          if (realId && realId !== tempId) {
            setLocalEvents(prev => prev.filter(e => e.id !== tempId));
          }
        }
        setFlashType('shot_on_target_own');
        setTimeout(() => setFlashType(null), 650);
      } else if (action === 'card_yellow_own' || action === 'card_red_own') {
        const cardType = action === 'card_yellow_own' ? 'amarilla' : 'roja';
        if (onAddCard) {
          onAddCard(cardType, playerId, playerName);
        }
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const localDoc = {
          id: tempId,
          type: action,
          half: currentHalf,
          minute: targetMin,
          sector: selectedSector || 'center',
          x: 30,
          y: 50,
          playerId: playerId || null,
          playerName: playerName || '',
          timestamp: new Date().toISOString()
        };
        setLocalEvents(prev => [...prev, localDoc]);
        const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
        if (hook) {
          const realId = await hook(action, currentHalf, {
            playerId: playerId || null,
            playerName: playerName || '',
            sector: selectedSector || 'center',
            x: 30,
            y: 50
          });
          if (realId && realId !== tempId) {
            setLocalEvents(prev => prev.filter(e => e.id !== tempId));
          }
        }
        setFlashType(action);
        setTimeout(() => setFlashType(null), 650);
      }
    },
    [pendingPlayerSelection, currentHalf, currentMinute, onAddGoalFor, onAddCard, selectedSector, parentAddLiveEvent, liveStatsHook.addLiveEvent]
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
      className={`livestats-container ${darkMode ? 'dark-theme dark theme-dark' : 'light-theme theme-light'} ${isFullscreen ? 'livestats-fullscreen fullscreen-mode' : ''}`}
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

      {/* ── 1. Barra de Navegación por Pestañas de LiveStats (oculta en pantalla completa) ────────────────── */}
      {!isFullscreen && (
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
      )}

      {/* ── 2. Barra de Herramientas Rápida (oculta en pantalla completa) ─────────────────────────────────── */}
      {!isFullscreen && (
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
      )}

      {/* ── 3. Panel Desplegable de Filtros Avanzados ───────────────────────── */}
      {activeTab !== 'capture' && !isFullscreen && (
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

              {onFinishMatch && (
                <button
                  type="button"
                  id="livestats-btn-finish-match"
                  onClick={onFinishMatch}
                  className="livestats-btn-timer"
                  style={{
                    backgroundColor: isMatchFinished ? '#1B3A2D' : '#4CAF7D',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '8px 12px',
                    minHeight: '48px',
                    borderRadius: '8px',
                    border: isMatchFinished ? '1.5px solid #4CAF7D' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(76, 175, 125, 0.3)'
                  }}
                  title={isMatchFinished ? (isEn ? 'Match finished' : 'Partido finalizado') : (isEn ? 'Finish match' : 'Finalizar partido')}
                >
                  {isMatchFinished ? (isEn ? '✓ Finished' : '✓ Terminado') : (isEn ? '🏁 Finish' : '🏁 Finalizar')}
                </button>
              )}
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
                    onClick={isLocked ? undefined : () => setPendingShotModal({ isOpen: true, origin: 'goal_own', initialTeam: 'own', initialResult: 'gol', initialDifficulty: null })}
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
                    onClick={isLocked ? undefined : () => setPendingShotModal({ isOpen: true, origin: 'goal_rival', initialTeam: 'rival', initialResult: 'gol', initialDifficulty: null })}
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
            <button
              type="button"
              className="livestats-criteria-btn"
              onClick={() => setShowCriteriaModal(true)}
              title={isEn ? 'Capture Criteria Manual (Definitions & PDF)' : 'Manual de Criterios de Captura (Definiciones y PDF)'}
              style={{
                minHeight: '48px',
                minWidth: '48px',
                borderRadius: '8px',
                padding: '0 12px',
                background: darkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
                border: '1.5px solid #3B82F6',
                color: darkMode ? '#93C5FD' : '#1D4ED8',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <span>📖</span>
              <span>{isEn ? 'Criteria' : 'Criterios'}</span>
            </button>

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
            {/* ── JUGADOR ACTIVO: Chip Selector Horizontal ─── */}
            <div className="jugador-activo-strip">
              <div className="jugador-activo-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span>
                  <span>{isEn ? 'ACTIVE PLAYER' : 'JUGADOR ACTIVO'}</span>
                  <span className="jugador-count-badge" style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', fontWeight: 800, color: 'var(--partidos-gold)' }}>
                    {activePlayersWithMinutes.length}
                  </span>
                </div>
                {activePlayerId && (
                  <button
                    type="button"
                    className="jugador-activo-clear"
                    onClick={() => setActivePlayerId(null)}
                  >✕ {isEn ? 'Deselect' : 'Deseleccionar'}</button>
                )}
                <button
                  type="button"
                  id="livestats-unattributed-counter-btn"
                  className="jugador-unattributed-btn"
                  onClick={() => setShowUnattributedModal(true)}
                  title={isEn ? 'Manage unattributed events' : 'Gestionar eventos sin atribuir'}
                  style={{
                    minHeight: '38px',
                    borderRadius: '8px',
                    padding: '0 10px',
                    background: unattributedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(100, 116, 139, 0.08)'),
                    border: `1.5px solid ${unattributedCount > 0 ? '#EF4444' : (darkMode ? 'rgba(255, 255, 255, 0.15)' : '#94A3B8')}`,
                    color: unattributedCount > 0 ? '#EF4444' : (darkMode ? '#94A3B8' : '#475569'),
                    fontWeight: 800,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <span>{unattributedCount > 0 ? '🔘' : '✅'}</span>
                  <span>{unattributedCount > 0 
                    ? (isEn ? `Unattributed (${unattributedCount})` : `Sin atribuir (${unattributedCount})`) 
                    : (isEn ? 'All attributed ✅' : 'Todo atribuido ✅')}</span>
                </button>
                <button
                  type="button"
                  className="jugador-postmatch-btn"
                  onClick={() => { setShowPostMatchModal(true); setPostMatchCounters({}); }}
                  title={isEn ? 'Post-match load: quick entry of +/- counters' : 'Carga post-partido: entrada rápida de contadores +/-'}
                >📋 {isEn ? 'Post-Match Entry' : 'Carga Post-Partido'}</button>
              </div>
              <div className="jugador-activo-chips">
                {activePlayersWithMinutes.map(p => {
                  const isActive = activePlayerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`jugador-chip ${isActive ? 'active' : ''}`}
                      onClick={() => setActivePlayerId(isActive ? null : p.id)}
                    >
                      <span className="jugador-chip-dorsal">{p.dorsal}</span>
                      <span className="jugador-chip-name">{(p.nombre || p.name || '').split(' ')[0]}</span>
                    </button>
                  );
                })}

                {/* Popover colapsable para suplentes sin minutos */}
                {benchPlayersZeroMinutes.length > 0 && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="button"
                      className="jugador-chip bench-trigger-btn"
                      onClick={() => setShowBenchPopover(prev => !prev)}
                      style={{
                        background: showBenchPopover ? 'rgba(212, 168, 67, 0.25)' : (darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                        border: '1px dashed #D4A843',
                        color: 'var(--partidos-gold, #D4A843)',
                        padding: '0 10px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title={isEn ? 'Bench players with 0 minutes' : 'Jugadores suplentes con 0 minutos'}
                    >
                      <span>🪑</span>
                      <span>+ {isEn ? 'Bench' : 'Banquillo'} ({benchPlayersZeroMinutes.length})</span>
                    </button>

                    {showBenchPopover && (
                      <div
                        className="jugador-bench-popover"
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          marginBottom: '8px',
                          background: darkMode ? '#1E293B' : '#FFFFFF',
                          border: '1px solid var(--partidos-border, #CBD5E1)',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                          padding: '8px',
                          zIndex: 60,
                          minWidth: '180px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--partidos-gold)', padding: '2px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                          🪑 {isEn ? 'BENCH (0 MIN)' : 'SUPLENTES (0 MIN)'}
                        </div>
                        {benchPlayersZeroMinutes.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="jugador-bench-popover-item"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--partidos-text-primary, #FFFFFF)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              textAlign: 'left'
                            }}
                            onClick={() => {
                              setActivePlayerId(p.id);
                              setShowBenchPopover(false);
                            }}
                          >
                            <span style={{ fontWeight: 800, color: 'var(--partidos-gold)' }}>#{p.dorsal}</span>
                            <span>{p.nombre || p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de Acción Individual Canónicos (5 controles + Avanzado desplegable) */}
              {activePlayerId && (
                <div className="jugador-acciones-grid">
                  {(() => {
                    const ap = playersList.find(p => p.id === activePlayerId);
                    const handleIndividualAction = async (actType) => {
                      if (isMatchLocked(matchData)) { showToast(t('livestats.match_locked_short'), 'warning'); return; }
                      setFlashType(`player_${actType}`);
                      setTimeout(() => setFlashType(null), 650);

                      const targetMin = currentHalf === 2 
                        ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46)) 
                        : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1));

                      const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                      const localDoc = {
                        id: tempId,
                        type: actType,
                        half: currentHalf,
                        minute: targetMin,
                        sector: selectedSector || 'center',
                        zone2D: selectedSector2D,
                        x: 60,
                        y: 50,
                        playerId: activePlayerId,
                        playerName: ap?.nombre || ap?.name || '',
                        timestamp: new Date().toISOString()
                      };
                      setLocalEvents(prev => [...prev, localDoc]);
                      const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
                      if (hook) {
                        const realId = await hook(actType, currentHalf, {
                          playerId: activePlayerId,
                          playerName: ap?.nombre || ap?.name || '',
                          sector: selectedSector || 'center',
                          zone2D: selectedSector2D,
                          x: 60,
                          y: 50
                        });
                        if (realId && realId !== tempId) setLocalEvents(prev => prev.filter(e => e.id !== tempId));
                      }
                    };

                    return (
                      <>
                        <div className="jugador-acciones-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>#{ap?.dorsal} <strong>{ap?.nombre || ap?.name}</strong> · {ap?.posicion}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📍 {selectedSector2D.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div className="jugador-acciones-btns" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                          {/* 1. TIRO */}
                          <button
                            type="button"
                            className={`jugador-accion-btn ${flashType === 'player_shot' ? 'flashing' : ''}`}
                            style={{ '--action-color': '#4CAF7D', minHeight: '48px' }}
                            onClick={() => {
                              setPendingShotModal({
                                isOpen: true,
                                origin: 'individual',
                                initialTeam: 'own',
                                initialResult: null,
                                initialDifficulty: null
                              });
                            }}
                          >
                            <span className="jugador-accion-icon" style={{ color: '#4CAF7D' }}>🎯</span>
                            <span className="jugador-accion-label">{isEn ? 'Shot' : 'Tiro'}</span>
                          </button>

                          {/* 2. RECUPERACIÓN */}
                          <button
                            type="button"
                            className={`jugador-accion-btn ${flashType === 'player_recovery' ? 'flashing' : ''}`}
                            style={{ '--action-color': '#3B82F6', minHeight: '48px' }}
                            onClick={() => handleIndividualAction('recovery')}
                          >
                            <span className="jugador-accion-icon" style={{ color: '#3B82F6' }}>🛡️</span>
                            <span className="jugador-accion-label">{isEn ? 'Recovery' : 'Recuper.'}</span>
                          </button>

                          {/* 3. DUELO GANADO */}
                          <button
                            type="button"
                            className={`jugador-accion-btn ${flashType === 'player_duel_won' ? 'flashing' : ''}`}
                            style={{ '--action-color': '#10B981', minHeight: '48px' }}
                            onClick={() => handleIndividualAction('duel_won')}
                          >
                            <span className="jugador-accion-icon" style={{ color: '#10B981' }}>✊</span>
                            <span className="jugador-accion-label">{isEn ? 'Duel Won' : 'Duelo Gan.'}</span>
                          </button>

                          {/* 4. FALTA (Abre menú rápido) */}
                          <button
                            type="button"
                            className="jugador-accion-btn"
                            style={{ '--action-color': '#F59E0B', minHeight: '48px' }}
                            onClick={() => setPendingFoulModal(prev => !prev)}
                          >
                            <span className="jugador-accion-icon" style={{ color: '#F59E0B' }}>⚡</span>
                            <span className="jugador-accion-label">{isEn ? 'Foul...' : 'Falta...'}</span>
                          </button>

                          {/* 5. AVANZADO (Toggle) */}
                          <button
                            type="button"
                            className={`jugador-accion-btn ${showAdvancedHud ? 'active' : ''}`}
                            style={{ '--action-color': '#8B5CF6', minHeight: '48px', borderStyle: 'dashed' }}
                            onClick={() => setShowAdvancedHud(prev => !prev)}
                          >
                            <span className="jugador-accion-icon" style={{ color: '#8B5CF6' }}>{showAdvancedHud ? '▲' : '▼'}</span>
                            <span className="jugador-accion-label">{isEn ? 'Advanced' : 'Avanzado'}</span>
                          </button>
                        </div>

                        {/* Submenú de Faltas y Tarjetas si está abierto */}
                        {pendingFoulModal && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', padding: '8px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              style={{ flex: 1, minHeight: '48px', borderRadius: '6px', background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => { handleIndividualAction('foul_against'); setPendingFoulModal(false); }}
                            >
                              ✋ {isEn ? 'Foul Conceded' : 'Falta Cometida'}
                            </button>
                            <button
                              type="button"
                              style={{ flex: 1, minHeight: '48px', borderRadius: '6px', background: '#CFFAFE', color: '#155E75', border: '1px solid #06B6D4', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => { handleIndividualAction('foul_favor'); setPendingFoulModal(false); }}
                            >
                              ⚡ {isEn ? 'Foul Won' : 'Falta Recibida'}
                            </button>
                            <button
                              type="button"
                              aria-label={isEn ? 'Yellow card' : 'Tarjeta amarilla'}
                              style={{
                                minHeight: '48px',
                                minWidth: '92px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                background: '#FEF08A',
                                color: '#854D0E',
                                border: '1px solid #EAB308',
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                              onClick={() => { handlePress('card_yellow_own'); setPendingFoulModal(false); }}
                              onTouchStart={() => handleTouchStartCriterion('card_yellow')}
                              onTouchEnd={handleTouchEndCriterion}
                              onMouseDown={() => handleTouchStartCriterion('card_yellow')}
                              onMouseUp={handleTouchEndCriterion}
                            >
                              <span>🟨</span>
                              <span>{isEn ? 'Yellow' : 'Tarjeta'}</span>
                            </button>
                            <button
                              type="button"
                              aria-label={isEn ? 'Red card' : 'Tarjeta roja'}
                              style={{
                                minHeight: '48px',
                                minWidth: '92px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                background: '#FEE2E2',
                                color: '#991B1B',
                                border: '1px solid #EF4444',
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                              onClick={() => { handlePress('card_red_own'); setPendingFoulModal(false); }}
                              onTouchStart={() => handleTouchStartCriterion('card_red')}
                              onTouchEnd={handleTouchEndCriterion}
                              onMouseDown={() => handleTouchStartCriterion('card_red')}
                              onMouseUp={handleTouchEndCriterion}
                            >
                              <span>🟥</span>
                              <span>{isEn ? 'Red' : 'Tarjeta'}</span>
                            </button>
                          </div>
                        )}

                        {/* Set Avanzado Desplegable */}
                        {showAdvancedHud && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                            <button
                              type="button"
                              className="jugador-accion-btn"
                              style={{ '--action-color': '#D4A843', minHeight: '48px' }}
                              onClick={() => handleIndividualAction('key_pass')}
                            >
                              <span className="jugador-accion-icon" style={{ color: '#D4A843' }}>⭐</span>
                              <span className="jugador-accion-label">{isEn ? 'Key Pass' : 'Pase Clave'}</span>
                            </button>
                            <button
                              type="button"
                              className="jugador-accion-btn"
                              style={{ '--action-color': '#EF4444', minHeight: '48px' }}
                              onClick={() => handleIndividualAction('ball_loss')}
                            >
                              <span className="jugador-accion-icon" style={{ color: '#EF4444' }}>🔴</span>
                              <span className="jugador-accion-label">{isEn ? 'Turnover' : 'Pérdida'}</span>
                            </button>
                            <button
                              type="button"
                              className="jugador-accion-btn"
                              style={{ '--action-color': '#F97316', minHeight: '48px' }}
                              onClick={() => handleIndividualAction('duel_lost')}
                            >
                              <span className="jugador-accion-icon" style={{ color: '#F97316' }}>✋</span>
                              <span className="jugador-accion-label">{isEn ? 'Duel Lost' : 'Duelo Perd.'}</span>
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Selector Táctico de Sector 2D (9 Zonas Canónicas) */}
            <SectorMiniPitch2D
              selectedZone={selectedSector2D}
              onSelectZone={handleSelectSector2D}
              isEn={isEn}
              disabled={isLocked}
            />

            {/* ── SECCIÓN DE PORTERO EN CAMPO (🧤) ── */}
            <section
              className="livestats-category-card livestats-gk-card"
              style={{
                backgroundColor: darkMode ? '#0F1E2E' : '#EFF6FF',
                borderColor: darkMode ? '#1E3A8A' : '#93C5FD',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <button
                type="button"
                id="livestats-gk-banner-btn"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToLineup && onNavigateToLineup()}
                title={activeGoalkeeper ? (isEn ? 'Tap to edit goalkeeper in lineup' : 'Tocar para editar portero en alineación') : (isEn ? 'Tap to assign goalkeeper in lineup' : 'Tocar para asignar portero en alineación')}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: activeGoalkeeper ? (darkMode ? '1px solid #1E3A8A' : '1px solid #BFDBFE') : '1.5px dashed #EF4444',
                  background: activeGoalkeeper ? (darkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF') : (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                  cursor: 'pointer',
                  minHeight: '48px',
                  boxSizing: 'border-box',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '20px' }}>{activeGoalkeeper ? '🧤' : '⚠️'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: '11px', color: darkMode ? '#93C5FD' : '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('gk.activeGoalkeeper')}
                    </span>
                    <strong style={{ fontSize: '13px', color: activeGoalkeeper ? (darkMode ? '#60A5FA' : '#1D4ED8') : '#EF4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeGoalkeeper 
                        ? `${activeGoalkeeper.nombre || activeGoalkeeper.name} #${activeGoalkeeper.dorsal || activeGoalkeeper.number || '1'}` 
                        : t('gk.noActiveGoalkeeper')}
                    </strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: activeGoalkeeper ? '#2563EB' : '#EF4444', whiteSpace: 'nowrap' }}>
                    {activeGoalkeeper ? (isEn ? 'Edit in Lineup →' : 'Editar alineación →') : (isEn ? 'Tap to assign →' : 'Tocar para asignar →')}
                  </span>
                </div>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { type: 'save', label: t('gk.btn.save'), icon: '🧤', color: '#22C55E' },
                  { type: 'conceded', label: t('gk.btn.conceded'), icon: '🥅', color: '#EF4444' },
                  { type: 'penaltySave', label: t('gk.btn.penaltySave'), icon: '🛡️', color: '#3B82F6' },
                  { type: 'claim', label: t('gk.btn.claim'), icon: '⬆️', color: '#0D9488' },
                  { type: 'errorGoal', label: t('gk.btn.errorGoal'), icon: '⚠️', color: '#F97316' },
                ].map(gkAction => {
                  const isFlashingGk = flashType === `gk_${gkAction.type}`;
                  const count = (filteredEvents || []).filter(e => e.type === gkAction.type && (activeGoalkeeper ? String(e.playerId) === String(activeGoalkeeper.id) : true)).length;
                  return (
                    <button
                      key={gkAction.type}
                      type="button"
                      id={`livestats-btn-gk-${gkAction.type}`}
                      disabled={isLocked || saving}
                      onClick={async () => {
                        if (isLocked) { showToast(t('livestats.match_locked_short'), 'warning'); return; }
                        setFlashType(`gk_${gkAction.type}`);
                        setTimeout(() => setFlashType(null), 650);

                        const safeMin = currentHalf === 2 
                          ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46))
                          : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1));

                        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        const localDoc = {
                          id: tempId,
                          type: gkAction.type,
                          half: currentHalf,
                          minute: safeMin,
                          sector: selectedSector || 'center',
                          x: 15,
                          y: 50,
                          playerId: activeGoalkeeper?.id || null,
                          playerName: activeGoalkeeper?.nombre || activeGoalkeeper?.name || '',
                          timestamp: new Date().toISOString()
                        };
                        setLocalEvents(prev => [...prev, localDoc]);
                        const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
                        if (hook) {
                          const realId = await hook(gkAction.type, currentHalf, {
                            playerId: activeGoalkeeper?.id || null,
                            playerName: activeGoalkeeper?.nombre || activeGoalkeeper?.name || '',
                            sector: selectedSector || 'center',
                            x: 15,
                            y: 50
                          });
                          if (realId && realId !== tempId) setLocalEvents(prev => prev.filter(e => e.id !== tempId));
                        }
                      }}
                      style={{
                        minHeight: '48px',
                        minWidth: '48px',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        border: `1.5px solid ${isFlashingGk ? gkAction.color : (darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1')}`,
                        background: isFlashingGk ? `${gkAction.color}33` : (darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
                        color: darkMode ? '#FFFFFF' : '#0F172A',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '12px',
                        boxShadow: isFlashingGk ? `0 0 12px ${gkAction.color}66` : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{gkAction.icon}</span>
                        <span>{gkAction.label}</span>
                      </span>
                      <span style={{ fontSize: '11px', background: `${gkAction.color}22`, color: gkAction.color, padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

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
                    {group.buttons.map(({ type, labelKey, icon, criterionId }) => {
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
                          onTouchStart={() => handleTouchStartCriterion(criterionId)}
                          onTouchEnd={handleTouchEndCriterion}
                          onMouseDown={() => handleTouchStartCriterion(criterionId)}
                          onMouseUp={handleTouchEndCriterion}
                          onMouseLeave={handleTouchEndCriterion}
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

            {/* Red de Pases Táctica (Condicional: solo si existen pases registrados) */}
            {passesList && passesList.length > 0 && (
              <PassNetwork
                passes={passesList}
                players={playersList}
                teamName={homeTeamName}
              />
            )}

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

          const goalsHome   = countByType('gol_local') + countByType('gol') + countByType('goal');
          const goalsAway   = countByType('gol_rival');
          const tirosPuertaHome = countByType('shot_on_target_own') + goalsHome;
          const tirosPuertaAway = countByType('shot_on_target_rival') + goalsAway;
          const tirosHome   = tirosPuertaHome + countByType('shot_off_target_own');
          const tirosAway   = tirosPuertaAway + countByType('shot_off_target_rival');
          const duelsWon    = countByType('duel_won');
          const duelsLost   = countByType('duel_lost');
          const cornHome    = countByType('corner_favor') + countByType('corner_own');
          const cornAway    = countByType('corner_against') + countByType('corner_rival');
          const faultsBy    = countByType('foul_against') + countByType('falta_contra');
          const faultsOpp   = countByType('foul_favor') + countByType('falta_favor');
          const yellHome    = countByType('card_yellow_own') + countByType('yellow_card') + countByType('amarilla');
          const yellAway    = countByType('card_yellow_rival');
          const redHome     = countByType('card_red_own') + countByType('red_card') + countByType('roja');
          const redAway     = countByType('card_red_rival');

          const pasesRealHome = countByType('pass_completed') + countByType('key_pass');
          const pasesRealFailHome = countByType('pass_failed');
          const hasRealPasses = (pasesRealHome + pasesRealFailHome) > 0;
          const pasesExHome = hasRealPasses ? pasesRealHome : (recHome + duelsWon);
          const pasesTotHome = hasRealPasses ? (pasesRealHome + pasesRealFailHome) : (pasesExHome + faultsBy);

          const pasesRealAway = countByType('pass_completed_rival');
          const pasesRealFailAway = countByType('pass_failed_rival');
          const hasRealPassesAway = (pasesRealAway + pasesRealFailAway) > 0;
          const pasesExAway = hasRealPassesAway ? pasesRealAway : (lossHome + duelsLost);
          const pasesTotAway = hasRealPassesAway ? (pasesRealAway + pasesRealFailAway) : (pasesExAway + faultsOpp);

          return (
          <div className="analytics-tab-content">
            <ComparativeStatsBars
              homeStats={{
                posesion: posHome,
                tiros: tirosHome,
                tirosPuerta: tirosPuertaHome,
                paradas: countByType('save_own'),
                pasesExitosos: pasesExHome,
                pasesTotales: pasesTotHome,
                recuperaciones: recHome,
                corners: cornHome,
                faltas: faultsBy,
                amarillas: yellHome
              }}
              awayStats={{
                posesion: posAway,
                tiros: tirosAway,
                tirosPuerta: tirosPuertaAway,
                paradas: countByType('save_rival'),
                pasesExitosos: pasesExAway,
                pasesTotales: pasesTotAway,
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
                events={filteredEvents}
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
                const pid = String(p.id);
                // Consolidar todos los eventos reales del jugador (LiveStats + Match events + guardados en matchData)
                const poolEvents = [
                  ...(rawEvents || []), 
                  ...(matchData?.events || []), 
                  ...(matchData?.liveStatsEvents || [])
                ];
                const evsByPlayer = poolEvents.filter(e => {
                  if (!e) return false;
                  const ePid = String(e.playerId || e.jugadorId || e.fromPlayerId || '');
                  return ePid === pid;
                });

                const countP = (t) => evsByPlayer.filter(e => e.type === t).length;
                const pStats = matchData?.playerStats?.[pid] || matchData?.playerStats?.[p.id] || {};
                const actaActual = matchData?.actaOficial?.actual?.[pid];

                // Goles reales: eventos + goleadoresList + acta + pStats
                const golesFromEvs = poolEvents.filter(e => (e.type === 'gol_local' || e.type === 'goal' || e.isGoal) && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length;
                const golesFromList = (matchData?.goleadoresList || []).filter(g => String(g.jugadorId) === pid).length;
                const golesFromActa = Number(actaActual?.goals || 0);
                const golesFromPStats = Number(pStats.goals || pStats.goles || 0);
                const goles = Math.max(golesFromEvs, golesFromList, golesFromActa, golesFromPStats);

                // Asistencias reales
                const astFromEvs = poolEvents.filter(e => (e.type === 'asistencia' || e.type === 'assist' || e.asistenciaId) && (String(e.asistenciaId || e.assistId || e.playerId) === pid)).length;
                const astFromList = (matchData?.goleadoresList || []).filter(g => String(g.asistenciaId) === pid).length;
                const astFromActa = Number(actaActual?.assists || 0);
                const astFromPStats = Number(pStats.assists || pStats.asistencias || 0);
                const asistencias = Math.max(astFromEvs, astFromList, astFromActa, astFromPStats);

                // Tarjetas
                const yFromEvs = poolEvents.filter(e => (e.type === 'card_yellow_own' || e.type === 'yellow_card' || e.type === 'amarilla') && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length;
                const yFromList = (matchData?.tarjetasList || []).filter(t => String(t.jugadorId) === pid && (t.tipo === 'amarilla' || t.tipo === 'yellow')).length;
                const yFromActa = Number(actaActual?.yellowCards || 0);
                const amarillas = Math.max(yFromEvs, yFromList, yFromActa, Number(pStats.yellowCards || 0));

                const rFromEvs = poolEvents.filter(e => (e.type === 'card_red_own' || e.type === 'red_card' || e.type === 'roja') && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length;
                const rFromList = (matchData?.tarjetasList || []).filter(t => String(t.jugadorId) === pid && (t.tipo === 'roja' || t.tipo === 'red')).length;
                const rFromActa = Number(actaActual?.redCards || 0);
                const rojas = Math.max(rFromEvs, rFromList, rFromActa, Number(pStats.redCards || 0));

                // Acciones de campo
                const paradas = Math.max(countP('save_own'), Number(pStats.paradas || pStats.saves || 0));
                const pasesC = Math.max(countP('pass_completed') + countP('key_pass'), Number(pStats.pasesExitosos || pStats.pasesC || 0));
                const pasesF = Math.max(countP('pass_failed'), Number(pStats.pasesFallidos || pStats.pasesF || 0));
                const duelosG = Math.max(countP('duel_won'), Number(pStats.duelosGanados || pStats.duelosG || 0));
                const duelosP = Math.max(countP('duel_lost'), Number(pStats.duelosPerdidos || pStats.duelosP || 0));
                const recup = Math.max(countP('recovery'), Number(pStats.recuperaciones || pStats.recup || 0));
                const perd = Math.max(countP('ball_loss') + countP('loss'), Number(pStats.perdidas || pStats.perd || 0));
                const tirosP = Math.max(countP('shot_on_target_own') + goles, Number(pStats.tirosPuerta || pStats.tirosP || (goles > 0 ? goles : 0)));
                const tirosF = Math.max(countP('shot_off_target_own'), Number(pStats.tirosFuera || pStats.tirosF || 0));
                const tirosTot = Math.max(tirosP + tirosF, Number(pStats.tiros || 0));
                const faltas = Math.max(countP('foul_against'), Number(pStats.faltas || 0));
                const pasesClave = Math.max(countP('key_pass'), Number(pStats.pasesClave || 0));

                // Minutos jugados
                let minutos = 0;
                if (actaActual && actaActual.minutes !== undefined && actaActual.minutes !== null) {
                  minutos = parseInt(actaActual.minutes, 10) || 0;
                } else if (p.minutos !== undefined && p.minutos !== null) {
                  minutos = parseInt(p.minutos, 10) || 0;
                } else {
                  const titulares = (matchData?.titulares || matchData?.alineacion?.titulares || []).map(String);
                  const suplentes = (matchData?.suplentes || matchData?.alineacion?.suplentes || []).map(String);
                  const isTit = titulares.includes(pid);
                  const isSup = suplentes.includes(pid);
                  const dur = parseInt(matchData?.duracion || matchData?.duration || 90, 10);
                  const curMin = (currentMinute && currentMinute > 0) ? currentMinute : dur;

                  if (isTit) {
                    const subOut = poolEvents.find(e => (e.type === 'cambio' || e.type === 'substitution') && String(e.playerOutId || e.jugadorSaleId) === pid);
                    minutos = subOut ? Math.max(1, parseInt(subOut.minute || subOut.minuto || curMin, 10)) : curMin;
                  } else if (isSup) {
                    const subIn = poolEvents.find(e => (e.type === 'cambio' || e.type === 'substitution') && String(e.playerInId || e.jugadorEntraId) === pid);
                    minutos = subIn ? Math.max(0, curMin - parseInt(subIn.minute || subIn.minuto || curMin, 10)) : 0;
                  } else {
                    const hasEv = evsByPlayer.length > 0;
                    minutos = hasEv ? curMin : 0;
                  }
                }

                // Nota (Rating)
                const manualRating = actaActual?.rating || matchData?.playerRatings?.[pid] || matchData?.ratings?.[pid] || matchData?.notas?.[pid];
                let rating = null;
                if (manualRating !== undefined && manualRating !== null && manualRating !== '' && !isNaN(Number(manualRating))) {
                  rating = parseFloat(Number(manualRating).toFixed(1));
                } else if (minutos > 0 || goles > 0 || asistencias > 0 || paradas > 0 || evsByPlayer.length > 0) {
                  const base = 6.0;
                  const bonus = (goles * 1.2) + (asistencias * 0.8) + (paradas * 0.4) + (pasesClave * 0.3) + (recup * 0.15) - (perd * 0.15) + (duelosG * 0.2) - (duelosP * 0.15) + (tirosP * 0.2) - (faltas * 0.2) - (amarillas * 0.5) - (rojas * 2.0);
                  rating = parseFloat(Math.min(10.0, Math.max(4.0, base + bonus)).toFixed(1));
                }

                const xG = parseFloat(((tirosP * 0.35) + (tirosF * 0.05) + (goles * 0.4)).toFixed(2));

                return {
                  ...p,
                  minutos,
                  rating,
                  goles,
                  asistencias,
                  paradas,
                  tiros: tirosTot,
                  tirosPuerta: tirosP,
                  pasesExitosos: pasesC,
                  pasesFallidos: pasesF,
                  duelosGanados: duelosG,
                  duelosPerdidos: duelosP,
                  recuperaciones: recup,
                  perdidas: perd,
                  pasesClave,
                  faltas,
                  amarillas,
                  rojas,
                  xG
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

        {/* ── Modal Carga Post-Partido (contadores +/- por jugador) ─────────── */}
        {showPostMatchModal && (
          <div className="event-selector-overlay" onClick={() => setShowPostMatchModal(false)} style={{ zIndex: 99998 }}>
            <div
              className="event-selector-modal"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '560px', width: '95vw', borderRadius: '18px', padding: '0', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1B3A2D 0%, #0F2419 100%)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF' }}>📋 Carga Post-Partido</div>
                  <div style={{ fontSize: '12px', color: '#9DC7AF', marginTop: '2px' }}>Entrada rápida de contadores +/− por jugador</div>
                </div>
                <button type="button" onClick={() => setShowPostMatchModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
              </div>

              {/* Body: jugadores con contador */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {playersList.map(p => {
                  const pid = p.id;
                  const counters = postMatchCounters[pid] || {};
                  const COUNTER_TYPES = [
                    { key: 'goles',             label: 'Goles',        color: '#10B981' },
                    { key: 'asistencias',       label: 'Asistencias',  color: '#8B5CF6' },
                    { key: 'tirosPuerta',       label: 'Tiros Puerta', color: '#4CAF7D' },
                    { key: 'tirosFuera',        label: 'Tiros Fuera',  color: '#94A3B8' },
                    { key: 'pasesCompletados',  label: 'Pases Compl.', color: '#0D9488' },
                    { key: 'pasesFallidos',     label: 'Pases Fall.',  color: '#EF4444' },
                    { key: 'pasesClave',        label: 'Pases Clave',  color: '#D4A843' },
                    { key: 'duelosGanados',     label: 'Duelos Gan.',  color: '#10B981' },
                    { key: 'duelosPerdidos',    label: 'Duelos Perd.', color: '#F43F5E' },
                    { key: 'recuperaciones',    label: 'Recuperac.',   color: '#3B82F6' },
                    { key: 'perdidas',          label: 'Pérdidas',     color: '#DC2626' },
                    { key: 'faltas',            label: 'Faltas',       color: '#F97316' },
                    { key: 'amarillas',         label: 'Amarilla 🟨',  color: '#EAB308' },
                    { key: 'rojas',             label: 'Roja 🟥',      color: '#EF4444' },
                  ];
                  return (
                    <div key={pid} style={{ background: 'var(--partidos-player-card-bg, rgba(255,255,255,0.05))', borderRadius: '12px', border: '1px solid var(--partidos-border, rgba(255,255,255,0.1))', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--partidos-text-primary)', marginBottom: '10px' }}>
                        <span style={{ color: '#4CAF7D', marginRight: '6px' }}>#{p.dorsal}</span>
                        {p.nombre || p.name}
                        <span style={{ color: '#94A3B8', fontSize: '11px', marginLeft: '6px' }}>{p.posicion}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                        {COUNTER_TYPES.map(ct => {
                          const val = counters[ct.key] || 0;
                          return (
                            <div key={ct.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '6px 4px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: ct.color, textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>{ct.label}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPostMatchCounters(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), [ct.key]: Math.max(0, (prev[pid]?.[ct.key] || 0) - 1) } }))}
                                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${ct.color}`, background: 'transparent', color: ct.color, fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                                >−</button>
                                <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: 'var(--partidos-text-primary)' }}>{val}</span>
                                <button
                                  type="button"
                                  onClick={() => setPostMatchCounters(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), [ct.key]: (prev[pid]?.[ct.key] || 0) + 1 } }))}
                                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${ct.color}`, background: ct.color, color: '#FFF', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--partidos-border, rgba(255,255,255,0.1))', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPostMatchModal(false)} style={{ minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'transparent', color: 'var(--partidos-text-primary)', fontWeight: 700, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Registrar todos los contadores como eventos reales por jugador
                    const TYPE_MAP = {
                      goles: 'gol_local',
                      asistencias: 'asistencia',
                      tirosPuerta: 'shot_on_target_own',
                      tirosFuera: 'shot_off_target_own',
                      pasesCompletados: 'pass_completed',
                      pasesFallidos: 'pass_failed',
                      pasesClave: 'key_pass',
                      duelosGanados: 'duel_won',
                      duelosPerdidos: 'duel_lost',
                      recuperaciones: 'recovery',
                      perdidas: 'ball_loss',
                      faltas: 'foul_against',
                      amarillas: 'card_yellow_own',
                      rojas: 'card_red_own',
                    };
                    const hook = parentAddLiveEvent || liveStatsHook.addLiveEvent;
                    for (const [pid, counters] of Object.entries(postMatchCounters)) {
                      for (const [key, count] of Object.entries(counters)) {
                        if (!count || count <= 0) continue;
                        const evType = TYPE_MAP[key] || key;
                        const extraPayload = { playerId: pid };
                        if (key === 'asistencias') {
                          extraPayload.asistenciaId = pid;
                        }
                        for (let i = 0; i < count; i++) {
                          const tempId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                          setLocalEvents(prev => [...prev, { id: tempId, type: evType, ...extraPayload, half: currentHalf, minute: 90, timestamp: new Date().toISOString() }]);
                          if (hook) {
                            const realId = await hook(evType, currentHalf, extraPayload);
                            if (realId && realId !== tempId) setLocalEvents(prev => prev.filter(e => e.id !== tempId));
                          }
                        }
                      }
                    }
                    showToast(t('livestats.post_match_saved'), 'success');
                    setShowPostMatchModal(false);
                  }}
                  style={{ minHeight: '44px', padding: '0 24px', borderRadius: '8px', border: 'none', background: '#4CAF7D', color: '#0B1317', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}
                >
                  ✓ Guardar Contadores
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para selección de jugador en Gol o Tarjetas (Android First, Touch Target >= 48dp) */}
        {pendingPlayerSelection && (
          <div
            className="event-selector-overlay"
            onClick={() => setPendingPlayerSelection(null)}
            style={{ zIndex: 99999 }}
          >
            <div
              className="event-selector-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '520px',
                width: '94vw',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                padding: '20px',
                backgroundColor: darkMode ? '#122415' : '#FFFFFF',
                border: darkMode ? '1.5px solid rgba(212, 168, 67, 0.4)' : '1.5px solid #CBD5E1',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: darkMode ? '#FFFFFF' : '#0F172A' }}>
                  {pendingPlayerSelection.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setPendingPlayerSelection(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    color: darkMode ? '#94A3B8' : '#64748B',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}
                >✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px', WebkitOverflowScrolling: 'touch' }}>
                {pendingPlayerSelection.action === 'goal' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmPlayerSelection('unassigned', tx('live.select.unassigned_goal'))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minHeight: '52px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px dashed #D4A843',
                      background: darkMode ? 'rgba(212, 168, 67, 0.12)' : '#FEF3C7',
                      color: darkMode ? '#FBBF24' : '#92400E',
                      fontWeight: 800,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '4px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>⚽</span>
                    <span>{tx('live.select.unassigned_goal')}</span>
                  </button>
                )}

                {(() => {
                  const starterIds = (calledPlayers || []).slice(0, 11).filter(Boolean);
                  const subIds = (calledPlayers || []).slice(11, 18).filter(Boolean);
                  const hasCalled = starterIds.length > 0 || subIds.length > 0;

                  const renderBtn = (p, roleLabel, roleColor) => {
                    const pNum = p.dorsal || p.number || '';
                    const pName = p.nombre || p.name || '';
                    const pPos = p.posicion || p.position || '';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleConfirmPlayerSelection(p.id, pName)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          minHeight: '50px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #E2E8F0',
                          background: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                          color: darkMode ? '#FFFFFF' : '#0F172A',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: darkMode ? '#1E3A2B' : '#E2E8F0',
                            color: darkMode ? '#4CAF7D' : '#15803D',
                            fontWeight: 900,
                            fontSize: '12px'
                          }}>
                            {pNum ? `#${pNum}` : '👤'}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '13.5px' }}>{pName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {pPos && (
                            <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 700 }}>{pPos}</span>
                          )}
                          {roleLabel && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: roleColor ? `${roleColor}25` : 'rgba(0,0,0,0.1)',
                              color: roleColor || 'inherit'
                            }}>
                              {roleLabel}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  };

                  if (hasCalled) {
                    const starters = starterIds.map(id => playersList.find(pl => String(pl.id) === String(id))).filter(Boolean);
                    const subs = subIds.map(id => playersList.find(pl => String(pl.id) === String(id))).filter(Boolean);
                    const others = playersList.filter(pl => !starterIds.map(String).includes(String(pl.id)) && !subIds.map(String).includes(String(pl.id)));

                    return (
                      <>
                        {starters.length > 0 && (
                          <div style={{ fontSize: '11px', fontWeight: 900, color: '#4CAF7D', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>
                            {tx('live.select.starters')}
                          </div>
                        )}
                        {starters.map(p => renderBtn(p, tx('live.select.starters'), '#4CAF7D'))}

                        {subs.length > 0 && (
                          <div style={{ fontSize: '11px', fontWeight: 900, color: '#D4A843', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '0.5px' }}>
                            {tx('live.select.substitutes')}
                          </div>
                        )}
                        {subs.map(p => renderBtn(p, tx('live.select.substitutes'), '#D4A843'))}

                        {others.length > 0 && (
                          <div style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '0.5px' }}>
                            {tx('live.select.squad')}
                          </div>
                        )}
                        {others.map(p => renderBtn(p, null, null))}
                      </>
                    );
                  }

                  return playersList.map(p => renderBtn(p, null, null));
                })()}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPendingPlayerSelection(null)}
                  style={{
                    minHeight: '48px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #CBD5E1',
                    background: 'transparent',
                    color: darkMode ? '#FFFFFF' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {tx('live.select.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal de Sugerencia de Gol Encajado a Portero Activo ── */}
        {showGoalAgainstModal && activeGoalkeeper && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '16px',
            }}
            onClick={() => setShowGoalAgainstModal(false)}
          >
            <div
              style={{
                backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>🥅</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: darkMode ? '#FFFFFF' : '#0F172A' }}>
                  {t('gk.suggest.title')}
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: darkMode ? '#CBD5E1' : '#475569' }}>
                {t('gk.suggest.message', { name: activeGoalkeeper.nombre || activeGoalkeeper.name || 'Portero' })}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  id="livestats-btn-confirm-gk-conceded"
                  style={{
                    minHeight: '48px',
                    backgroundColor: '#1E40AF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '0 16px'
                  }}
                  onClick={async () => {
                    setShowGoalAgainstModal(false);
                    if (onAddGoalAgainst) onAddGoalAgainst();
                    const safeMin = currentHalf === 2 
                      ? Math.max(46, (currentMinute && currentMinute > 0 ? currentMinute : 46))
                      : Math.max(1, (currentMinute && currentMinute > 0 ? currentMinute : 1));
                    await addLiveEvent('conceded', currentHalf, {
                      playerId: activeGoalkeeper.id,
                      playerName: activeGoalkeeper.nombre || activeGoalkeeper.name || '',
                      sector: selectedSector || 'center',
                      x: 15,
                      y: 50,
                      minute: safeMin
                    });
                  }}
                >
                  <span>🧤</span>
                  <span>{t('gk.suggest.confirm')}</span>
                </button>

                <button
                  type="button"
                  id="livestats-btn-ignore-gk-conceded"
                  style={{
                    minHeight: '48px',
                    backgroundColor: darkMode ? '#334155' : '#F1F5F9',
                    color: darkMode ? '#F1F5F9' : '#334155',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '0 16px'
                  }}
                  onClick={() => {
                    setShowGoalAgainstModal(false);
                    if (onAddGoalAgainst) onAddGoalAgainst();
                  }}
                >
                  {t('gk.suggest.ignore')}
                </button>

                <button
                  type="button"
                  style={{
                    minHeight: '48px',
                    backgroundColor: 'transparent',
                    color: darkMode ? '#94A3B8' : '#64748B',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowGoalAgainstModal(false)}
                >
                  {tx('live.select.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Captura Canónica de Tiro con Contexto (<= 3 taps) */}
        <ShotCaptureModal
          isOpen={pendingShotModal.isOpen}
          onClose={() => setPendingShotModal(prev => ({ ...prev, isOpen: false }))}
          onConfirmShot={handleConfirmShot}
          origin={pendingShotModal.origin || (activePlayerId ? 'individual' : 'team')}
          initialTeam={pendingShotModal.initialTeam}
          initialSector={selectedSector || 'center'}
          zone2D={selectedSector2D}
          initialResult={pendingShotModal.initialResult}
          initialDifficulty={pendingShotModal.initialDifficulty}
          activePlayerId={activePlayerId}
          activePlayerName={activePlayerId ? (playersList.find(p => String(p.id) === String(activePlayerId))?.nombre || '') : ''}
          playersList={onPitchPlayersList.length > 0 ? onPitchPlayersList : (activePlayersWithMinutes.length > 0 ? activePlayersWithMinutes : playersList)}
          activeGoalkeeper={activeGoalkeeper}
        />

        {/* Modal de Manual de Criterios de Captura y Descarga PDF */}
        <CaptureCriteriaModal
          isOpen={showCriteriaModal}
          onClose={() => setShowCriteriaModal(false)}
          isEn={isEn}
        />

        {/* Modal de Gestión de Eventos Sin Atribuir (Atribución Diferida) */}
        <UnattributedEventsManager
          isOpen={showUnattributedModal}
          onClose={() => setShowUnattributedModal(false)}
          events={rawEvents}
          players={playersList}
          onUpdateEvents={handleAttributeEvents}
          isEn={isEn}
        />

        {/* Tooltip Flotante de Criterio Activo por Long-Press */}
        {activeCriterionTooltip && CAPTURE_CRITERIA[activeCriterionTooltip] && (
          <div
            className="criterion-floating-tooltip"
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: '420px',
              width: '90%',
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              color: darkMode ? '#FFFFFF' : '#0F172A',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              border: '2px solid #3B82F6'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#3B82F6', fontSize: '14px' }}>
                📖 {isEn ? CAPTURE_CRITERIA[activeCriterionTooltip].nameEn : CAPTURE_CRITERIA[activeCriterionTooltip].nameEs}
              </strong>
              <button
                type="button"
                onClick={() => setActiveCriterionTooltip(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '12px', lineHeight: 1.4, margin: '0 0 10px 0' }}>
              {isEn ? CAPTURE_CRITERIA[activeCriterionTooltip].definitionEn : CAPTURE_CRITERIA[activeCriterionTooltip].definitionEs}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#10B981' }}>
                ✓ {isEn ? 'Counts when:' : 'Anota si:'} {isEn ? (CAPTURE_CRITERIA[activeCriterionTooltip].countsWhenEn || '').slice(0, 45) : (CAPTURE_CRITERIA[activeCriterionTooltip].countsWhenEs || '').slice(0, 45)}...
              </span>
              <button
                type="button"
                onClick={() => { setActiveCriterionTooltip(null); setShowCriteriaModal(true); }}
                style={{
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Full Manual →' : 'Ver Manual →'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default LiveStats;
