import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePlan } from '../../hooks/usePlan';
import { GraficaEvolucion } from '../GraficasTest';
import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
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
  ShieldCheck
} from 'lucide-react';

import { PlayerLeaderboard } from './PlayerLeaderboard';

export const PlayerStatsTab = ({ player, team, teamPath, isParentView = false, onNavigateTests }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { isPro, isProActive } = usePlan();

  const [evaluations, setEvaluations] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [allTeamMatches, setAllTeamMatches] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
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

  // 1. Escuchar evaluaciones canónicas de Míster11 y test_results del jugador
  useEffect(() => {
    if (!cleanPath || !effectivePlayerId) return;

    const evalsRef = collection(db, `${cleanPath}/evaluaciones`);
    const unsubEvals = onSnapshot(evalsRef, (snap) => {
      const allEvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const playerEvals = allEvals.filter(e => e.playerId === effectivePlayerId || e.players?.[effectivePlayerId]);

      const grouped = {};
      playerEvals.forEach(e => {
        const testId = e.testId || e.testName || 'test_general';
        const testName = e.testName || e.name || 'Evaluación';
        const rawVal = e.val !== undefined ? e.val : (e.score || e.percentage || 0);
        const parsedVal = parseFloat(String(rawVal).replace(',', '.')) || 0;
        const dateStr = e.date || e.fecha || (e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split('T')[0] : 'Reciente');
        const unit = e.unit || 'pts';
        const category = e.category || 'General';

        if (!grouped[testId]) {
          grouped[testId] = {
            id: testId,
            name: testName,
            category,
            unit,
            isTime: unit.toLowerCase().includes('seg') || unit.toLowerCase().includes('s'),
            history: []
          };
        }

        grouped[testId].history.push({
          val: parsedVal,
          date: dateStr,
          raw: e
        });
      });

      Object.keys(grouped).forEach(k => {
        grouped[k].history.sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      setGroupedHistory(grouped);
      setEvaluations(playerEvals);
      setLoading(false);
    }, (err) => {
      console.warn('Error al cargar evaluaciones:', err);
      setLoading(false);
    });

    return () => unsubEvals();
  }, [cleanPath, effectivePlayerId]);

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

    const unsubPlayers = onSnapshot(collection(db, `${cleanPath}/players`), (snap) => {
      setAllPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMatches();
      unsubAtt();
      unsubPlayers();
    };
  }, [cleanPath, effectivePlayerId, player?.notaMedia]);

  // 4. Comparativa Privada con Promedios del Equipo (FASE 4)
  const teamComparison = useMemo(() => {
    if (allPlayers.length < 2) return null;

    let totalPresents = 0;
    let totalCalls = 0;
    let myPresents = 0;
    let myCalls = 0;

    allAttendance.forEach(att => {
      allPlayers.forEach(p => {
        totalCalls++;
        if (att.players?.[p.id] === true || att.presentes?.includes(p.id) || att.presentPlayers?.includes(p.id)) {
          totalPresents++;
        }
      });
      if (att.players?.[effectivePlayerId] === true || att.presentes?.includes(effectivePlayerId) || att.presentPlayers?.includes(effectivePlayerId)) {
        myPresents++;
      }
      myCalls++;
    });

    const avgAttendancePct = totalCalls > 0 ? Math.round((totalPresents / totalCalls) * 100) : 85;
    const myAttendancePct = myCalls > 0 ? Math.round((myPresents / myCalls) * 100) : (player?.asistenciaPct || 90);

    let totalMinutes = 0;
    allTeamMatches.forEach(m => {
      allPlayers.forEach(p => {
        const stats = m.playerStats?.[p.id];
        totalMinutes += (stats?.minutesPlayed || (m.titulares?.includes(p.id) ? 90 : 0));
      });
    });
    const avgMinutesPerPlayer = allPlayers.length > 0 ? Math.round(totalMinutes / allPlayers.length) : 0;

    let totalGoals = 0;
    allTeamMatches.forEach(m => {
      allPlayers.forEach(p => {
        const stats = m.playerStats?.[p.id];
        const gList = m.goleadoresList || [];
        const gCount = (stats?.goals || 0) + gList.filter(g => String(g.jugadorId) === String(p.id)).length;
        totalGoals += gCount;
      });
    });
    const avgGoalsPerPlayer = allPlayers.length > 0 ? (totalGoals / allPlayers.length).toFixed(1) : '0.0';

    return {
      myAttendancePct,
      avgAttendancePct,
      myMinutes: playerMatchStats.minutesPlayed,
      avgMinutes: avgMinutesPerPlayer,
      myGoals: playerMatchStats.goals,
      avgGoals: avgGoalsPerPlayer,
      sampleSize: allPlayers.length
    };
  }, [allPlayers, allAttendance, allTeamMatches, effectivePlayerId, playerMatchStats, player]);

  // 5. Radar de Habilidades dinámico
  const avgSleep = wellnessHistory.length > 0 
    ? (wellnessHistory.reduce((s, w) => s + (w.sleep || 4), 0) / wellnessHistory.length).toFixed(1)
    : '4.2';

  const avgMood = wellnessHistory.length > 0 
    ? (wellnessHistory.reduce((s, w) => s + (w.mood || 4), 0) / wellnessHistory.length).toFixed(1)
    : '4.5';

  const hasDiscomfortActive = wellnessHistory[0]?.hasDiscomfort;

  // Radar points
  const radarMetrics = [
    { label: 'FÍSICO', value: player?.statsFisico || 82 },
    { label: 'TÉCNICA', value: player?.statsTecnica || 85 },
    { label: 'TÁCTICA', value: player?.statsTactica || 78 },
    { label: 'MENTAL', value: player?.statsMental || 88 },
    { label: 'ASISTENCIA', value: teamComparison?.myAttendancePct || 92 }
  ];

  const overallTPI = Math.round(radarMetrics.reduce((s, m) => s + m.value, 0) / radarMetrics.length);

  const svgWidth = 340;
  const svgHeight = 290;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / radarMetrics.length;

  const polygonPoints = radarMetrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (m.value / 100) * radius;
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
            <span>ESTADÍSTICAS OFICIALES 2026-27</span>
          </div>
          <span className="summary-sync-tag">⚡ En tiempo real</span>
        </div>

        <div className="summary-metrics-grid">
          <div className="summary-metric-box">
            <span className="metric-label">PARTIDOS</span>
            <div className="metric-value white">{playerMatchStats.matchesPlayed}</div>
            <span className="metric-sub">{playerMatchStats.starts} tit. · {playerMatchStats.subAppearances} sup.</span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">GOLES</span>
            <div className="metric-value green">⚽ {playerMatchStats.goals}</div>
            <span className="metric-sub">en {playerMatchStats.matchesPlayed} partidos</span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">ASISTENCIAS</span>
            <div className="metric-value gold">👟 {playerMatchStats.assists}</div>
            <span className="metric-sub">pases de gol</span>
          </div>

          <div className="summary-metric-box">
            <span className="metric-label">MINUTOS</span>
            <div className="metric-value white">⏱️ {playerMatchStats.minutesPlayed}'</div>
            <span className="metric-sub">en competición</span>
          </div>
        </div>

        {/* Fila secundaria: Tarjetas y Nota Media */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
          <div style={{ background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>TARJETAS</span>
            <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '3px', color: 'var(--text-primary)' }}>
              🟨 {playerMatchStats.yellowCards} · 🟥 {playerMatchStats.redCards}
            </div>
          </div>

          <div style={{ background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>NOTA MEDIA</span>
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
            <Calendar size={14} /> HISTORIAL DE PARTIDOS DISPUTADOS ({playerMatchStats.matchHistory.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Sincronizado con actas del Míster
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
                    {mItem.result} ({mItem.type || 'Oficial'})
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <span>📅 {mItem.date} · {mItem.isTitular ? 'Titular' : 'Suplente'} ({mItem.minutesPlayed}')</span>
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
            <p style={{ margin: 0, fontWeight: '700' }}>Sin partidos registrados aún esta temporada</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
              Tus minutos, goles y convocatorias aparecerán aquí automáticamente tras cada jornada.
            </p>
          </div>
        )}
      </div>

      {/* 3. RANKING GAMING DE RENDIMIENTO (LEADERBOARD) */}
      <PlayerLeaderboard
        players={allPlayers}
        matches={allTeamMatches}
        attendance={allAttendance}
        currentPlayerId={effectivePlayerId}
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
          <div className="hud-header" style={{ marginBottom: '12px' }}>
            <span className="hud-badge" style={{ color: '#4CAF7D', borderColor: 'rgba(76, 175, 125, 0.3)' }}>
              <Users size={14} /> TÚ VS PROMEDIO DEL EQUIPO
            </span>
            <span style={{ fontSize: '0.75rem', color: darkMode ? '#CBD5E1' : '#475569', fontWeight: 600 }}>
              🔒 Datos agregados y anónimos (RGPD)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {/* Asistencia */}
            <div style={{ background: darkMode ? 'rgba(0,0,0,0.5)' : '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', marginBottom: '4px' }}>
                <span>Asistencia</span>
                <span style={{ color: '#4CAF7D' }}>{teamComparison.myAttendancePct}% vs {teamComparison.avgAttendancePct}%</span>
              </div>
              <div style={{ background: 'rgba(128,128,128,0.2)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${teamComparison.myAttendancePct}%`, height: '100%', background: '#4CAF7D', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: teamComparison.myAttendancePct >= teamComparison.avgAttendancePct ? '#4CAF7D' : '#C9A84C', marginTop: '4px', display: 'block', fontWeight: 800 }}>
                {teamComparison.myAttendancePct >= teamComparison.avgAttendancePct ? '▲ Por encima de la media' : '▼ En la media del grupo'}
              </span>
            </div>

            {/* Minutos */}
            <div style={{ background: darkMode ? 'rgba(0,0,0,0.5)' : '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: darkMode ? '#F8FAFC' : '#0F172A', marginBottom: '4px' }}>
                <span>Minutos</span>
                <span style={{ color: '#C9A84C' }}>{teamComparison.myMinutes}' vs {teamComparison.avgMinutes}'</span>
              </div>
              <div style={{ background: 'rgba(128,128,128,0.2)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${teamComparison.avgMinutes > 0 ? Math.min(100, (teamComparison.myMinutes / (teamComparison.avgMinutes * 1.5)) * 100) : 50}%`, 
                  height: '100%', 
                  background: '#C9A84C', 
                  borderRadius: '4px' 
                }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: darkMode ? '#CBD5E1' : '#64748B', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                Media de la plantilla: {teamComparison.avgMinutes}'
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. RADAR CHART DE COMPETENCIAS */}
      <div className="hud-card radar-stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
        <div className="hud-header" style={{ width: '100%' }}>
          <span className="hud-badge">
            <Sparkles size={14} /> RADAR DE HABILIDADES
          </span>
          <span className="hud-status-live" style={{ color: '#4CAF7D', background: 'rgba(76,175,125,0.12)' }}>
            Nivel Global: {overallTPI}
          </span>
        </div>

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
      </div>

      {/* TARJETA DE ESTADO DE BIENESTAR Y CARGA */}
      <div className="hud-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="hud-header">
          <span className="hud-badge" style={{ color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            <Heart size={14} /> BIENESTAR Y RECUPERACIÓN SEMANAL
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Últimos 7 días
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>CALIDAD SUEÑO</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>{avgSleep} / 5 ⭐</div>
          </div>

          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>ENERGÍA / ÁNIMO</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>{avgMood} / 5 ⚡</div>
          </div>

          <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(27,58,45,0.04)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>ESTADO MUSCULAR</span>
            <div style={{ fontSize: '14px', fontWeight: '800', color: hasDiscomfortActive ? '#EF4444' : '#10B981', marginTop: '6px' }}>
              {hasDiscomfortActive ? '⚠️ Molestia activa' : '✅ 100% Disponible'}
            </div>
          </div>
        </div>
      </div>

      {/* EVOLUCIÓN TEMPORAL DE TESTS */}
      <div className="player-tests-evolution-section">
        <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Evolución Temporal de Tests</h3>
          </div>
          {onNavigateTests && (
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={onNavigateTests}
            >
              Hacer test <ChevronRight size={14} />
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
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800' }}>Sin evaluaciones registradas aún</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Realiza los tests en la pestaña <strong>Tests</strong> o espera a que tu entrenador registre tus mediciones para ver tus gráficas de progresión.
            </p>
          </div>
        )}
      </div>

      {isUpgradeOpen && (
        <UpgradeModal
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
          message="El análisis avanzado de rendimiento está disponible para equipos con Plan PRO o CLUB."
        />
      )}
    </div>
  );
};

export default PlayerStatsTab;
