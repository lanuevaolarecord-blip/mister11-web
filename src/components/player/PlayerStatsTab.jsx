import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePlan } from '../../hooks/usePlan';
import { GraficaEvolucion } from '../GraficasTest';
import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
import { calculatePlayerAttendanceStats } from '../../utils/attendanceStatsHelper';
import { calculateSquadAveragePct } from '../../utils/attendanceMath';
import { DEFAULT_SEASON_SETTINGS } from '../../config/achievements';
import { calculatePlayerPerformanceScores } from '../../utils/testScoreEngine';
import UpgradeModal from '../UpgradeModal';
import './PlayerStatsTab.css';
import { 
  Trophy, 
  Zap, 
  Activity, 
  Award, 
  Star, 
  Lock, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  Heart, 
  Flame, 
  Brain, 
  Clock, 
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  HelpCircle,
  Info
} from 'lucide-react';

import { PlayerLeaderboard } from './PlayerLeaderboard';
import { useTranslation } from '../../hooks/useTranslation';

export const PlayerStatsTab = ({ player, team, teamPath, isParentView = false, achievements = [], onNavigateTests }) => {
  const { t, isEn } = useTranslation();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { isPro, isProActive } = usePlan();

  const [evaluations, setEvaluations] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [allTeamMatches, setAllTeamMatches] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerMatchStats, setPlayerMatchStats] = useState({
    matchesPlayed: 0,
    starts: 0,
    subAppearances: 0,
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    avgRating: '8.2',
    matchHistory: []
  });
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const effectivePlayerId = player?.id || 'player-self';

  const [showComparisonHelp, setShowComparisonHelp] = useState(false);
  const [showRadarHelp, setShowRadarHelp] = useState(false);

  // Catálogo canónico de pruebas físicas y cuestionarios para enriquecer datos de Firestore
  const CANONICAL_TESTS_MAP = useMemo(() => ({
    't1': { name: isEn ? 'Cooper Test' : 'Test de Cooper', category: isEn ? 'Physical · Endurance' : 'Físico · Resistencia', unit: 'm', isTime: false },
    't2': { name: isEn ? 'Beep Test (Course Navette)' : 'Course Navette', category: isEn ? 'Physical · Endurance' : 'Físico · Resistencia', unit: 'nivel', isTime: false },
    't3': { name: isEn ? '10m Sprint' : 'Sprint 10m', category: isEn ? 'Physical · Speed' : 'Físico · Velocidad', unit: 'seg', isTime: true },
    't4': { name: isEn ? '30m Sprint' : 'Sprint 30m', category: isEn ? 'Physical · Speed' : 'Físico · Velocidad', unit: 'seg', isTime: true },
    't5': { name: isEn ? 'T-Test Agility' : 'T-Test (Agilidad)', category: isEn ? 'Physical · Agility' : 'Físico · Agilidad', unit: 'seg', isTime: true },
    't6': { name: isEn ? 'CMJ Jump' : 'Salto CMJ', category: isEn ? 'Physical · Power' : 'Físico · Fuerza', unit: 'cm', isTime: false },
    't7': { name: isEn ? 'Cone Dribbling' : 'Conducción conos', category: isEn ? 'Technical · Ball Control' : 'Técnica · Control', unit: 'seg', isTime: true },
    't8': { name: isEn ? 'Goal Shooting' : 'Pase a portería', category: isEn ? 'Technical · Accuracy' : 'Técnica · Precisión', unit: 'pts', isTime: false },
    'psi1': { name: isEn ? 'ACSI-28 Coping Skills' : 'ACSI-28 (Afrontamiento)', category: isEn ? 'Mental · Pressure' : 'Mental · Presión', unit: 'pts', isTime: false },
    'psi2': { name: isEn ? 'MTQ-10 Mental Toughness' : 'MTQ-10 (Fortaleza Mental)', category: isEn ? 'Mental · Resilience' : 'Mental · Resiliencia', unit: 'pts', isTime: false },
    'psi3': { name: isEn ? 'Goal Setting Scale' : 'Establecimiento de Metas', category: isEn ? 'Mental · Goals' : 'Mental · Objetivos', unit: 'pts', isTime: false },
    'psi4': { name: isEn ? 'Leadership & Communication' : 'Liderazgo y Comunicación', category: isEn ? 'Mental · Leadership' : 'Mental · Liderazgo', unit: 'pts', isTime: false },
    'soc1': { name: isEn ? 'GEQ Team Cohesion' : 'GEQ (Cohesión de Equipo)', category: isEn ? 'Social · Cohesion' : 'Social · Cohesión', unit: 'pts', isTime: false },
    'soc2': { name: isEn ? 'MHC-SF Mental Well-being' : 'Escala Bienestar Mental', category: isEn ? 'Mental · Well-being' : 'Mental · Bienestar', unit: 'pts', isTime: false },
    'soc3': { name: isEn ? 'Emotional Awareness' : 'Autoconciencia Emocional', category: isEn ? 'Mental · Emotions' : 'Mental · Emociones', unit: 'pts', isTime: false },
    'psi_acsi28_auto': { name: isEn ? 'ACSI-28 Coping Skills' : 'ACSI-28 (Afrontamiento)', category: isEn ? 'Mental · Pressure' : 'Mental · Presión', unit: 'pts', isTime: false },
    'psi_mtq10_auto': { name: isEn ? 'MTQ-10 Mental Toughness' : 'MTQ-10 (Fortaleza Mental)', category: isEn ? 'Mental · Resilience' : 'Mental · Resiliencia', unit: 'pts', isTime: false },
    'soc_geq_auto': { name: isEn ? 'GEQ Team Cohesion' : 'GEQ (Cohesión de Equipo)', category: isEn ? 'Social · Cohesion' : 'Social · Cohesión', unit: 'pts', isTime: false },
    'psi_metas_auto': { name: isEn ? 'Goal Setting Scale' : 'Establecimiento de Metas', category: isEn ? 'Mental · Goals' : 'Mental · Objetivos', unit: 'pts', isTime: false },
  }), [isEn]);

  // Función segura para parsear y normalizar fechas y timestamps
  const parseSafeDate = (d, rawItem) => {
    let ts = 0;
    let isoDate = '';

    if (rawItem?.timestamp?.toDate) {
      const dt = rawItem.timestamp.toDate();
      ts = dt.getTime();
      isoDate = dt.toISOString().split('T')[0];
    } else if (rawItem?.createdAt?.toDate) {
      const dt = rawItem.createdAt.toDate();
      ts = dt.getTime();
      isoDate = dt.toISOString().split('T')[0];
    } else if (typeof d === 'string' && d.trim()) {
      const cleanStr = d.trim();
      if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
          const y = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
          const m = parts[1].padStart(2, '0');
          const day = parts[0].padStart(2, '0');
          isoDate = `${y}-${m}-${day}`;
          const dt = new Date(`${isoDate}T12:00:00Z`);
          ts = isNaN(dt.getTime()) ? Date.now() : dt.getTime();
        } else {
          isoDate = cleanStr;
          ts = Date.now();
        }
      } else {
        isoDate = cleanStr.split('T')[0];
        const dt = new Date(cleanStr);
        ts = isNaN(dt.getTime()) ? Date.now() : dt.getTime();
      }
    } else if (d instanceof Date) {
      ts = d.getTime();
      isoDate = d.toISOString().split('T')[0];
    } else {
      ts = Date.now();
      isoDate = new Date().toISOString().split('T')[0];
    }

    const parts = isoDate.split('-');
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : isoDate;

    return { ts, isoDate, displayDate };
  };

  // 1. Escuchar evaluaciones canónicas de Míster11 y test_results de múltiples fuentes
  useEffect(() => {
    if (!cleanPath || !effectivePlayerId) return;

    let evalsList = [];
    let testResultsList = [];
    let playerDirectTests = [];

    const rebuildEvaluations = () => {
      const allCombined = [...evalsList, ...testResultsList, ...playerDirectTests];
      const seen = new Set();
      const uniqueEvals = [];

      allCombined.forEach(e => {
        // Clave unívoca considerando playerId, testId, fecha y valor
        const pId = String(e.playerId || e.jugadorId || e.player?.id || '');
        const key = e.id ? `${e.id}_${pId}` : `${pId}_${e.testId}_${e.date}_${e.val || e.score}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvals.push(e);
        }
      });

      // Filtrar únicamente los tests que pertenezcan a este jugador (soporta playerId y jugadorId)
      const playerEvals = uniqueEvals.filter(e => {
        const pId = String(e.playerId || e.jugadorId || e.player?.id || '');
        return pId === String(effectivePlayerId) || e.players?.[effectivePlayerId];
      });

      const enrichedEvals = [];
      const grouped = {};
      playerEvals.forEach(e => {
        const testId = String(e.testId || e.testName || 'test_general');
        const canonical = CANONICAL_TESTS_MAP[testId] || {};
        const testName = e.testName || canonical.name || e.name || (isEn ? 'Evaluation' : 'Evaluación');
        const unit = e.unit || canonical.unit || 'pts';
        const rawCat = String(e.category || canonical.category || (isEn ? 'General' : 'General'));
        const category = rawCat;
        const type = e.type || canonical.type || (
          rawCat.toLowerCase().includes('físic') || rawCat.toLowerCase().includes('resistencia') || rawCat.toLowerCase().includes('velocidad') || rawCat.toLowerCase().includes('fuerza') || rawCat.toLowerCase().includes('agilidad') || testId.startsWith('t1') || testId.startsWith('t2') || testId.startsWith('t3') || testId.startsWith('t4') || testId.startsWith('t5') || testId.startsWith('t6') ? 'fisico' :
          rawCat.toLowerCase().includes('técnic') || rawCat.toLowerCase().includes('pase') || rawCat.toLowerCase().includes('control') || rawCat.toLowerCase().includes('regate') || testId.startsWith('t7') || testId.startsWith('t8') ? 'tecnico' :
          rawCat.toLowerCase().includes('táctic') || rawCat.toLowerCase().includes('posicion') || rawCat.toLowerCase().includes('decision') ? 'tactico' :
          rawCat.toLowerCase().includes('psico') || rawCat.toLowerCase().includes('mental') || rawCat.toLowerCase().includes('socio') || rawCat.toLowerCase().includes('bienestar') || rawCat.toLowerCase().includes('cohesión') || testId.startsWith('psi') || testId.startsWith('soc') ? 'psicosocial' : 'general'
        );
        const isTime = canonical.isTime !== undefined 
          ? canonical.isTime 
          : (unit.toLowerCase().includes('seg') || unit.toLowerCase().includes('s'));

        const rawVal = e.val !== undefined ? e.val : (e.score !== undefined ? e.score : (e.percentage || 0));
        const parsedVal = parseFloat(String(rawVal).replace(',', '.')) || 0;
        const rawDate = e.date || e.fecha;
        const { ts, isoDate, displayDate } = parseSafeDate(rawDate, e);

        const enrichedItem = {
          ...e,
          testId,
          testName,
          category,
          type,
          unit,
          isTime,
          val: parsedVal,
          score: e.score !== undefined ? Number(e.score) : parsedVal,
          percentage: e.percentage !== undefined ? Number(e.percentage) : undefined,
          date: isoDate,
          displayDate,
          ts
        };

        enrichedEvals.push(enrichedItem);

        if (!grouped[testId]) {
          grouped[testId] = {
            id: testId,
            name: testName,
            category,
            type,
            unit,
            isTime,
            history: []
          };
        }

        grouped[testId].history.push({
          val: parsedVal,
          date: isoDate,
          displayDate,
          ts,
          raw: enrichedItem
        });
      });

      // Ordenación cronológica y consolidación por fecha evaluada (1 punto real por día)
      Object.keys(grouped).forEach(k => {
        const sorted = grouped[k].history.sort((a, b) => a.ts - b.ts);
        
        // Agrupar por fecha para que no aparezcan puntos duplicados del mismo día
        const dateMap = new Map();
        sorted.forEach(entry => {
          dateMap.set(entry.date, entry);
        });

        grouped[k].history = Array.from(dateMap.values());
      });

      setGroupedHistory(grouped);
      setEvaluations(enrichedEvals);
      setLoading(false);
    };

    const unsubEvals = onSnapshot(collection(db, `${cleanPath}/evaluaciones`), (snap) => {
      evalsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildEvaluations();
    }, () => setLoading(false));

    const unsubTestResults = onSnapshot(collection(db, `${cleanPath}/test_results`), (snap) => {
      testResultsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildEvaluations();
    }, () => {});

    const unsubPlayerDirect = onSnapshot(collection(db, `${cleanPath}/players/${effectivePlayerId}/test_results`), (snap) => {
      playerDirectTests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildEvaluations();
    }, () => {});

    return () => {
      unsubEvals();
      unsubTestResults();
      unsubPlayerDirect();
    };
  }, [cleanPath, effectivePlayerId, CANONICAL_TESTS_MAP, isEn]);

  // 2. Escuchar histórico de Wellness / Bienestar
  useEffect(() => {
    if (!cleanPath || !effectivePlayerId) return;

    const wellnessRef = collection(db, `${cleanPath}/players/${effectivePlayerId}/wellness`);
    const unsubWellness = onSnapshot(wellnessRef, (snap) => {
      const wList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      wList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setWellnessHistory(wList.slice(0, 7));
    }, (err) => {
      console.warn('Error cargando wellness history:', err);
    });

    return () => unsubWellness();
  }, [cleanPath, effectivePlayerId]);

  // 3. Escuchar partidos y asistencia de todo el equipo de forma reactiva (onSnapshot)
  useEffect(() => {
    if (!cleanPath) return;

    const unsubMatches = onSnapshot(collection(db, `${cleanPath}/matches`), (snap) => {
      const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTeamMatches(matches);
      const pStats = calculatePlayerMatchStats(effectivePlayerId, matches);
      setPlayerMatchStats({
        matchesPlayed: pStats.matchesPlayed,
        starts: pStats.starts,
        subAppearances: pStats.subAppearances,
        minutesPlayed: pStats.minutesPlayed,
        goals: pStats.goals,
        assists: pStats.assists,
        yellowCards: pStats.yellowCards,
        redCards: pStats.redCards,
        avgRating: pStats.avgRating !== '-' && pStats.avgRating !== null ? pStats.avgRating : (player?.notaMedia || '8.2'),
        matchHistory: pStats.matchHistory || []
      });
    });

    const unsubAtt = onSnapshot(collection(db, `${cleanPath}/attendance`), (snap) => {
      setAllAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSessions = onSnapshot(collection(db, `${cleanPath}/sessions`), (snap) => {
      setAllSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPlayers = onSnapshot(collection(db, `${cleanPath}/players`), (snap) => {
      setAllPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMatches();
      unsubAtt();
      unsubSessions();
      unsubPlayers();
    };
  }, [cleanPath, effectivePlayerId, player?.notaMedia]);

  // 4. Comparativa Privada con Promedios del Equipo (FASE 4)
  const teamComparison = useMemo(() => {
    if (allPlayers.length === 0) return null;

    const customXpTable = team?.settings?.achievementTargets || team?.achievementTargets || {};
    const hasAttendanceData = allAttendance.length > 0;
    const hasMatchData = allTeamMatches.length > 0;

    // Calcular estadísticas de asistencia reales para todos los compañeros
    const squadAttList = allPlayers.map(p => calculatePlayerAttendanceStats(p.id, allAttendance, allTeamMatches, customXpTable, allSessions));
    const avgAttendancePct = calculateSquadAveragePct(squadAttList.map(s => ({ pct: s.percentage, hasData: s.hasData })));

    const validSquadXP = squadAttList.filter(s => s.hasData);
    const avgAttendanceXP = validSquadXP.length > 0
      ? Math.round(validSquadXP.reduce((acc, s) => acc + s.attendanceXP, 0) / validSquadXP.length)
      : 0;

    const myAtt = calculatePlayerAttendanceStats(effectivePlayerId, allAttendance, allTeamMatches, customXpTable, allSessions);
    const myAttendancePct = myAtt.hasData ? myAtt.percentage : null;
    const myAttendanceXP = myAtt.attendanceXP;

    // Minutos calculados con el motor unificado calculatePlayerMatchStats para cada jugador
    let totalMinutesSquad = 0;
    let maxMinutesSquad = 0;
    allPlayers.forEach(p => {
      const pStats = calculatePlayerMatchStats(p.id, allTeamMatches);
      totalMinutesSquad += pStats.minutesPlayed;
      if (pStats.minutesPlayed > maxMinutesSquad) {
        maxMinutesSquad = pStats.minutesPlayed;
      }
    });

    const avgMinutesPerPlayer = allPlayers.length > 0 
      ? Math.round(totalMinutesSquad / allPlayers.length) 
      : 0;

    // Base de minutos posibles: partidos disputados * 90 o el máximo jugador
    const basePossibleMinutes = Math.max(allTeamMatches.length * 90, maxMinutesSquad, 1);

    const myMatchPct = allTeamMatches.length > 0
      ? Math.min(100, Math.round((playerMatchStats.minutesPlayed / basePossibleMinutes) * 100))
      : 0;
    const myMatchXP = Math.round(playerMatchStats.minutesPlayed * 0.2) + (playerMatchStats.goals * 10) + (playerMatchStats.assists * 5);

    const avgMatchPct = allTeamMatches.length > 0
      ? Math.min(100, Math.round((avgMinutesPerPlayer / basePossibleMinutes) * 100))
      : 0;
    const avgMatchXP = Math.round(avgMinutesPerPlayer * 0.2);

    return {
      hasAttendanceData,
      hasMatchData,
      myAttendancePct,
      avgAttendancePct,
      myAttendanceXP,
      avgAttendanceXP,
      myMinutes: playerMatchStats.minutesPlayed,
      avgMinutes: avgMinutesPerPlayer,
      myMatchPct,
      avgMatchPct,
      myMatchXP,
      avgMatchXP,
      sampleSize: allPlayers.length
    };
  }, [allPlayers, allAttendance, allTeamMatches, effectivePlayerId, playerMatchStats, team]);

  // 5. Radar de Habilidades 100% Real (Evaluado por el Míster o Asistencia)
  const avgSleep = wellnessHistory.length > 0 
    ? (wellnessHistory.reduce((s, w) => s + (Number(w.sleep) || 0), 0) / wellnessHistory.length).toFixed(1)
    : '--';

  const avgMood = wellnessHistory.length > 0 
    ? (wellnessHistory.reduce((s, w) => s + (Number(w.mood) || 0), 0) / wellnessHistory.length).toFixed(1)
    : '--';

  const hasDiscomfortActive = wellnessHistory[0]?.hasDiscomfort;

  // Cálculo canónico unificado de radar y baremos deportivos
  const scores = calculatePlayerPerformanceScores(evaluations, player, {
    attendancePct: teamComparison?.myAttendancePct !== null && teamComparison?.myAttendancePct !== undefined
      ? teamComparison.myAttendancePct
      : (player?.attendancePct ? Number(player.attendancePct) : (allAttendance.length > 0 ? 80 : (playerMatchStats.matchesPlayed > 0 ? 100 : 0))),
    matchRating: playerMatchStats?.avgRating
  });

  const rawFisico = scores.fis;
  const rawTecnica = scores.tec;
  const rawTactica = scores.tactica;
  const rawMental = scores.psi;
  const rawAsistencia = scores.asistencia;

  const radarMetrics = scores.radarData5;
  const zeroMetrics = radarMetrics.filter(m => m.value === 0);
  const overallTPI = scores.overall;

  const svgWidth = 340;
  const svgHeight = 290;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / radarMetrics.length;

  const polygonPoints = radarMetrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (Math.max(m.value, 5) / 100) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const historyKeys = Object.keys(groupedHistory);

  return (
    <div className="player-tab-content player-stats-tab">
      
      {/* 1. TARJETA DE RENDIMIENTO EN PARTIDOS UNIFICADA */}
      <div className="player-season-summary-card">
        <div className="summary-header">
          <div className="summary-title-badge">
            <Trophy size={16} color="#C9A84C" />
            <span>{t('player.stats.officialSummaryTitle')}</span>
          </div>
          <span className="summary-sync-tag">{t('player.stats.realTime')}</span>
        </div>

        <div className="summary-metrics-grid">
          <div className="summary-metric-box">
            <span className="metric-label">{t('player.stats.officialMatches')}</span>
            <div className="metric-value white">{playerMatchStats.matchesPlayed}</div>
            <span className="metric-sub">
              {t('player.stats.startsAndSubs', { starts: playerMatchStats.starts, subs: playerMatchStats.subAppearances })}
            </span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">{t('player.stats.goals')}</span>
            <div className="metric-value green">⚽ {playerMatchStats.goals}</div>
            <span className="metric-sub">
              {playerMatchStats.matchesPlayed === 1 
                ? t('player.stats.inMatch', { count: playerMatchStats.matchesPlayed }) 
                : t('player.stats.inMatches', { count: playerMatchStats.matchesPlayed })}
            </span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">{t('player.stats.assists')}</span>
            <div className="metric-value gold">👟 {playerMatchStats.assists}</div>
            <span className="metric-sub">{t('player.stats.keyPasses')}</span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">{t('player.stats.minutesPlayed')}</span>
            <div className="metric-value white">⏱️ {playerMatchStats.minutesPlayed}'</div>
            <span className="metric-sub">{t('player.stats.inCompetition')}</span>
          </div>
        </div>

        {/* Fila secundaria: Tarjetas y Nota Media */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
          <div style={{ background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('player.stats.cards')}</span>
            <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '3px', color: 'var(--text-primary)' }}>
              🟨 {playerMatchStats.yellowCards} · 🟥 {playerMatchStats.redCards}
            </div>
          </div>

          <div style={{ background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('player.stats.avgRating')}</span>
            <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '3px', color: '#C9A84C' }}>
              ⭐ {playerMatchStats.avgRating}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HISTORIAL DETALLADO DE PARTIDOS DISPUTADOS (UNIFICADO DESDE EL PERFIL) */}
      <div className="hud-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div className="hud-header" style={{ marginBottom: '12px' }}>
          <span className="hud-badge" style={{ color: '#4CAF7D', borderColor: 'rgba(76, 175, 125, 0.3)' }}>
            <Calendar size={14} /> {t('player.stats.matchHistory')} ({playerMatchStats.matchHistory.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {t('player.stats.matchHistorySync')}
          </span>
        </div>

        {playerMatchStats.matchHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {playerMatchStats.matchHistory.map((mItem, idx) => (
              <div key={idx} style={{ 
                background: darkMode ? 'rgba(0,0,0,0.3)' : '#F8FAFC', 
                border: '1px solid var(--border-light)', 
                borderRadius: '10px', 
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    vs {mItem.rival}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    background: 'rgba(76, 175, 125, 0.15)',
                    color: '#4CAF7D'
                  }}>
                    {mItem.result} ({mItem.type || t('player.stats.officialMatch')})
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅 {mItem.date}</span>
                    <span>&middot;</span>
                    {mItem.actaClosed ? (
                      <span style={{ color: '#10B981', fontWeight: '700' }}>
                        📋 {mItem.isTitular ? t('common.starter') : t('common.substitute')} ({mItem.minutesPlayed}')
                      </span>
                    ) : (
                      <span style={{ color: '#F59E0B', fontWeight: '700' }}>
                        ⏳ {t('player.stats.pendingActaShort')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontWeight: '800' }}>
                    {mItem.goals > 0 && <span style={{ color: '#4CAF7D' }}>⚽ {mItem.goals}</span>}
                    {mItem.assists > 0 && <span style={{ color: '#3B82F6' }}>👟 {mItem.assists}</span>}
                    {mItem.yellowCards > 0 && <span>🟨</span>}
                    {mItem.redCards > 0 && <span>🟥</span>}
                    {mItem.rating && mItem.rating !== '-' && <span style={{ color: '#C9A84C' }}>⭐ {mItem.rating}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
            <p style={{ margin: 0, fontWeight: '700' }}>{t('player.stats.noMatchesYet')}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
              {t('player.stats.noMatchesDesc')}
            </p>
          </div>
        )}
      </div>

      {/* 3. RANKING GAMING DE RENDIMIENTO (LEADERBOARD) */}
      <PlayerLeaderboard
        players={allPlayers}
        matches={allTeamMatches}
        attendance={allAttendance}
        sessions={allSessions}
        currentPlayerId={effectivePlayerId}
        myAchievements={achievements}
        team={team}
        darkMode={darkMode}
      />

      {/* 4. COMPARATIVA PRIVADA TÚ VS PROMEDIO DEL EQUIPO (ALTO CONTRASTE WCAG) */}
      {teamComparison && (
        <div className="hud-card" style={{
          background: darkMode ? 'linear-gradient(135deg, rgba(27, 58, 45, 0.9) 0%, rgba(17, 27, 33, 0.98) 100%)' : '#FFFFFF',
          border: '1.5px solid rgba(76, 175, 125, 0.4)',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '20px'
        }}>
          <div className="hud-header" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="hud-badge" style={{ color: '#4CAF7D', borderColor: 'rgba(76, 175, 125, 0.3)' }}>
                <Users size={14} /> {t('player.stats.vsTeamTitle')}
              </span>
              <span style={{ fontSize: '0.75rem', color: darkMode ? '#94A3B8' : '#475569', fontWeight: 600 }}>
                {t('player.stats.anonymousRgpd')}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowComparisonHelp(!showComparisonHelp)}
              style={{
                background: showComparisonHelp ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(76, 175, 125, 0.35)',
                color: '#4CAF7D',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <HelpCircle size={13} /> {showComparisonHelp ? t('player.stats.hideInfo') : t('player.stats.howIsMeasured')}
            </button>
          </div>

          {/* Guía explicativa desplegable */}
          {showComparisonHelp && (
            <div style={{
              background: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(76, 175, 125, 0.08)',
              border: '1px solid rgba(76, 175, 125, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px',
              fontSize: '0.76rem',
              color: darkMode ? '#cbd5e1' : '#1e293b',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#4CAF7D', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Info size={14} /> {t('player.stats.sourceInfoTitle')}
              </strong>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>{t('player.stats.sourceAttendance', { xp: teamComparison.myAttendanceXP })}</li>
                <li>{t('player.stats.sourceMatches', { xp: teamComparison.myMatchXP })}</li>
                <li>{t('player.stats.sourceAverage')}</li>
              </ul>
            </div>
          )}

          {(teamComparison.sampleSize < 3 || (!teamComparison.hasAttendanceData && !teamComparison.hasMatchData) || (teamComparison.avgAttendancePct === 0 && teamComparison.avgMinutes === 0 && teamComparison.myAttendancePct === 0 && teamComparison.myMinutes === 0)) ? (
            <div style={{
              background: darkMode ? 'rgba(0,0,0,0.4)' : '#F8FAFC',
              border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: darkMode ? '#FFFFFF' : '#0F172A' }}>
                {t('player.stats.noTeamDataYet')}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: darkMode ? '#94A3B8' : '#64748B' }}>
                {t('player.stats.noTeamDataDesc')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {/* Asistencia con XP */}
              <div style={{ background: darkMode ? 'rgba(0,0,0,0.5)' : '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: '6px' }}>
                  <span>{t('player.leaderboard.tabAttendance')}</span>
                  <span style={{ color: '#C9A84C', fontSize: '0.72rem', background: 'rgba(201,168,76,0.15)', padding: '2px 6px', borderRadius: '6px' }}>
                    +{teamComparison.myAttendanceXP} XP
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, marginBottom: '4px' }}>
                  <span style={{ color: '#4CAF7D' }}>{t('player.stats.you')} {teamComparison.myAttendancePct !== null ? `${teamComparison.myAttendancePct}%` : '—'}</span>
                  <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{t('player.stats.average')} <span style={{ color: '#C9A84C' }}>{teamComparison.avgAttendancePct}%</span></span>
                </div>
                <div style={{ background: 'rgba(128,128,128,0.2)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(teamComparison.myAttendancePct !== null && teamComparison.myAttendancePct > 0 ? teamComparison.myAttendancePct : 0, 0)}%`, height: '100%', background: '#4CAF7D', borderRadius: '4px' }} />
                </div>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: !teamComparison.hasAttendanceData || teamComparison.myAttendancePct === null ? (darkMode ? '#94A3B8' : '#64748B') : (teamComparison.myAttendancePct > teamComparison.avgAttendancePct ? '#4CAF7D' : (teamComparison.myAttendancePct === teamComparison.avgAttendancePct ? (darkMode ? '#94A3B8' : '#475569') : '#C9A84C')), 
                  marginTop: '6px', 
                  display: 'block', 
                  fontWeight: 800 
                }}>
                  {!teamComparison.hasAttendanceData || teamComparison.myAttendancePct === null
                    ? t('player.stats.noAttRecorded') 
                    : (teamComparison.myAttendancePct > teamComparison.avgAttendancePct 
                        ? t('player.stats.aboveAvg', { xp: teamComparison.myAttendanceXP }) 
                        : (teamComparison.myAttendancePct === teamComparison.avgAttendancePct 
                            ? t('player.stats.onAvg', { xp: teamComparison.myAttendanceXP }) 
                            : t('player.stats.belowAvg', { xp: teamComparison.myAttendanceXP })))}
                </span>
              </div>

              {/* Minutos y Partidos con XP */}
              <div style={{ background: darkMode ? 'rgba(0,0,0,0.5)' : '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: '6px' }}>
                  <span>{t('player.leaderboard.tabMatches')}</span>
                  <span style={{ color: '#C9A84C', fontSize: '0.72rem', background: 'rgba(201,168,76,0.15)', padding: '2px 6px', borderRadius: '6px' }}>
                    +{teamComparison.myMatchXP} XP
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, marginBottom: '4px' }}>
                  <span style={{ color: '#4CAF7D' }}>{t('player.stats.you')} {teamComparison.myMinutes}' ({teamComparison.myMatchPct}%)</span>
                  <span style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{t('player.stats.average')} <span style={{ color: '#C9A84C' }}>{teamComparison.avgMinutes}' ({teamComparison.avgMatchPct}%)</span></span>
                </div>
                <div style={{ background: 'rgba(128,128,128,0.2)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, Math.max(0, teamComparison.myMatchPct))}%`, 
                    height: '100%', 
                    background: '#C9A84C', 
                    borderRadius: '4px' 
                  }} />
                </div>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: !teamComparison.hasMatchData ? (darkMode ? '#94A3B8' : '#64748B') : (teamComparison.myMatchXP > teamComparison.avgMatchXP ? '#4CAF7D' : (teamComparison.myMatchXP === teamComparison.avgMatchXP ? (darkMode ? '#94A3B8' : '#475569') : '#C9A84C')), 
                  marginTop: '6px', 
                  display: 'block', 
                  fontWeight: 800 
                }}>
                  {!teamComparison.hasMatchData
                    ? t('player.stats.noMatchesRecorded')
                    : t('player.stats.xpByParticipation', { xp: teamComparison.myMatchXP, pct: teamComparison.myMatchPct })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. RADAR CHART DE COMPETENCIAS */}
      <div className="hud-card radar-stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
        <div className="hud-header" style={{ width: '100%', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="hud-badge">
              <Sparkles size={14} /> {t('player.stats.radarTitle')}
            </span>
            <span className="hud-status-live" style={{ color: '#4CAF7D', background: 'rgba(76,175,125,0.12)' }}>
              {t('player.stats.radarLevel', { level: overallTPI })}
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowRadarHelp(!showRadarHelp)}
            style={{
              background: showRadarHelp ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(201, 168, 76, 0.35)',
              color: '#C9A84C',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <HelpCircle size={13} /> {showRadarHelp ? t('player.stats.hideGuide') : t('player.stats.howAxesMeasured')}
          </button>
        </div>

        {/* Guía explicativa del Radar */}
        {showRadarHelp && (
          <div style={{
            width: '100%',
            background: darkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(201, 168, 76, 0.08)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            margin: '10px 0',
            fontSize: '0.76rem',
            color: darkMode ? '#cbd5e1' : '#1e293b',
            textAlign: 'left',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Info size={14} /> {t('player.stats.radarGuideTitle')}
            </strong>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li><strong>{t('player.leaderboard.tabAttendance')} ({rawAsistencia}):</strong> {t('player.stats.radarAtt')}</li>
              <li><strong>Mental ({rawMental}):</strong> {t('player.stats.radarMental')}</li>
              <li><strong>{t('player.tab.physical')} ({rawFisico}):</strong> {t('player.stats.radarPhys')}</li>
              <li><strong>{isEn ? 'Technical' : 'Técnica'} ({rawTecnica}):</strong> {t('player.stats.radarTech')}</li>
              <li><strong>{isEn ? 'Tactical' : 'Táctica'} ({rawTactica}):</strong> {t('player.stats.radarTact')}</li>
            </ul>
          </div>
        )}

        <div style={{ position: 'relative', width: '100%', maxWidth: `${svgWidth}px`, height: `${svgHeight}px`, margin: '10px auto' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
            {gridLevels.map((lvl, idx) => (
              <circle
                key={idx}
                cx={centerX}
                cy={centerY}
                r={radius * lvl}
                fill="none"
                stroke={darkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(27, 58, 45, 0.15)"}
                strokeDasharray={idx === 3 ? 'none' : '3,3'}
              />
            ))}

            {radarMetrics.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke={darkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(27, 58, 45, 0.18)"}
                />
              );
            })}

            <polygon
              points={polygonPoints}
              fill={darkMode ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)"}
              stroke="#10B981"
              strokeWidth="2.5"
            />

            {radarMetrics.map((m, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = (m.value / 100) * radius;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#10B981"
                  stroke={darkMode ? "#ffffff" : "#1B3A2D"}
                  strokeWidth="1.5"
                />
              );
            })}

            {radarMetrics.map((m, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const cosVal = Math.cos(angle);
              const anchor = cosVal > 0.25 ? 'start' : (cosVal < -0.25 ? 'end' : 'middle');
              const labelRadius = radius + (anchor === 'middle' ? 20 : 12);
              const x = centerX + labelRadius * cosVal;
              const y = centerY + labelRadius * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fill={darkMode ? "#cbd5e1" : "#1B3A2D"}
                  fontSize="11"
                  fontWeight="800"
                >
                  {m.label} ({m.value})
                </text>
              );
            })}
          </svg>
        </div>

        {/* Banner motivacional cuando hay áreas en 0 */}
        {zeroMetrics.length > 0 && (
          <div style={{
            width: '100%',
            background: darkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            textAlign: 'left'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#F59E0B' }}>
                💡 {isEn ? 'Areas pending measurement' : 'Áreas pendientes de medición'} ({zeroMetrics.map(z => z.label).join(', ')})
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: darkMode ? '#94A3B8' : '#64748B' }}>
                {t('player.stats.areasInZeroDesc')}
              </p>
            </div>
            {onNavigateTests && (
              <button
                type="button"
                onClick={onNavigateTests}
                style={{
                  background: '#F59E0B',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('player.stats.goToTests')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* TARJETA DE ESTADO DE BIENESTAR Y CARGA */}
      <div className="hud-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="hud-header">
          <span className="hud-badge" style={{ color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            <Heart size={14} /> {isEn ? 'WEEKLY WELLNESS & RECOVERY' : 'BIENESTAR Y RECUPERACIÓN SEMANAL'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isEn ? 'Last 7 days' : 'Últimos 7 días'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{isEn ? 'SLEEP QUALITY' : 'CALIDAD SUEÑO'}</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>{avgSleep} / 5 ⭐</div>
          </div>

          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{isEn ? 'ENERGY / MOOD' : 'ENERGÍA / ÁNIMO'}</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>{avgMood} / 5 ⚡</div>
          </div>

          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{isEn ? 'MUSCLE STATUS' : 'ESTADO MUSCULAR'}</span>
            <div style={{ fontSize: '14px', fontWeight: '800', color: hasDiscomfortActive ? '#EF4444' : '#10B981', marginTop: '6px' }}>
              {hasDiscomfortActive ? (isEn ? '⚠️ Active discomfort' : '⚠️ Molestia activa') : (isEn ? '✅ 100% Available' : '✅ 100% Disponible')}
            </div>
          </div>
        </div>
      </div>

      {/* EVOLUCIÓN TEMPORAL DE TESTS */}
      <div className="player-tests-evolution-section">
        <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('player.stats.evolutionTitle')}</h3>
          </div>
          {onNavigateTests && (
            <button
              type="button"
              onClick={onNavigateTests}
              className="btn-link-action"
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 800, color: '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {t('player.stats.makeTest')} <ChevronRight size={14} />
            </button>
          )}
        </div>

        {historyKeys.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {historyKeys.map(k => {
              const testItem = groupedHistory[k];
              const historyData = testItem.history;
              const firstVal = historyData[0]?.val || 0;
              const lastVal = historyData[historyData.length - 1]?.val || 0;
              const diff = lastVal - firstVal;
              const isTime = testItem.isTime;
              const improved = isTime ? diff < 0 : diff > 0;
              const pctDiff = firstVal > 0 ? Math.abs((diff / firstVal) * 100).toFixed(1) : '0';

              return (
                <div key={k} className="hud-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--accent-green, #10B981)' }}>
                        {testItem.category}
                      </span>
                      <h4 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {testItem.name} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({testItem.unit})</span>
                      </h4>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {lastVal} {testItem.unit}
                      </div>
                      {historyData.length > 1 && diff !== 0 && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          color: improved ? '#10B981' : '#EF4444' 
                        }}>
                          {improved ? '▲' : '▼'} {pctDiff}%
                        </span>
                      )}
                    </div>
                  </div>

                  <GraficaEvolucion data={historyData} isTime={isTime} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hud-card" style={{ padding: '24px', textAlign: 'center' }}>
            <Activity size={36} color="#10B981" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800' }}>{t('player.stats.noEvalsYet')}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('player.stats.noEvalsDesc')}
            </p>
          </div>
        )}
      </div>

      {isUpgradeOpen && (
        <UpgradeModal
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
          message={t('paywall.freeLimitMsg')}
        />
      )}
    </div>
  );
};

export default PlayerStatsTab;
