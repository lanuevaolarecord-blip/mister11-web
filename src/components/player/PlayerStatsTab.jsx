import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePlan } from '../../hooks/usePlan';
import { GraficaEvolucion } from '../GraficasTest';
import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
import UpgradeModal from '../UpgradeModal';
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
  CheckCircle2
} from 'lucide-react';

export const PlayerStatsTab = ({ player, team, teamPath }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { isPro, isProActive } = usePlan();

  const [evaluations, setEvaluations] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [matchStats, setMatchStats] = useState({ minutes: 0, goals: 0, assists: 0, avgRating: '8.5', matchesCount: 0 });
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Escuchar evaluaciones canónicas de Míster11 y test_results del jugador
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    const evalsRef = collection(db, `${teamPath}/evaluaciones`);
    const unsubEvals = onSnapshot(evalsRef, (snap) => {
      const allEvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const playerEvals = allEvals.filter(e => e.playerId === player.id || e.players?.[player.id]);

      // Agrupar por test para las gráficas de evolución
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

      // Ordenar historial cronológicamente
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
  }, [teamPath, player?.id]);

  // 2. Escuchar histórico de Wellness / Bienestar
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    const wellnessRef = collection(db, `${teamPath}/players/${player.id}/wellness`);
    const unsubWellness = onSnapshot(wellnessRef, (snap) => {
      const wList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      wList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setWellnessHistory(wList.slice(0, 7)); // Últimos 7 check-ins
    }, (err) => {
      console.warn('Error cargando wellness history:', err);
    });

    return () => unsubWellness();
  }, [teamPath, player?.id]);

  // 3. Escuchar estadísticas en partidos reales sincronizadas
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    const matchesRef = collection(db, `${teamPath}/matches`);
    const unsubMatches = onSnapshot(matchesRef, (snap) => {
      const allMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pStats = calculatePlayerMatchStats(player.id, allMatches);

      setMatchStats({
        minutes: pStats.minutesPlayed,
        goals: pStats.goals,
        assists: pStats.assists,
        matchesCount: pStats.matchesPlayed,
        avgRating: pStats.avgRating !== '-' ? pStats.avgRating : (player?.notaMedia || '8.2')
      });
    }, (err) => {
      console.warn('Error al cargar partidos en PlayerStatsTab:', err);
    });

    return () => unsubMatches();
  }, [teamPath, player?.id]);

  const isTeamPro = isPro || isProActive || team?.plan === 'pro' || team?.plan === 'club';

  // 4. Calcular métricas del Radar de Habilidades (Dinámicas según evaluaciones reales)
  let avgFisico = player?.statsFisico || 82;
  let avgTecnica = player?.statsTecnica || 85;
  let avgTactica = player?.statsTactica || 78;
  let avgMental = player?.statsMental || 88;
  let avgAsistencia = Math.min(100, (player?.asistenciaPct || 92));

  // Si hay evaluaciones en el historial, recalcular dinámicamente
  const historyKeys = Object.keys(groupedHistory);
  if (historyKeys.length > 0) {
    let sumMental = 0;
    let countMental = 0;
    let sumFisico = 0;
    let countFisico = 0;

    historyKeys.forEach(k => {
      const item = groupedHistory[k];
      const lastVal = item.history[item.history.length - 1]?.val || 0;
      if (item.category?.toLowerCase().includes('mental') || item.category?.toLowerCase().includes('afrontamiento') || item.category?.toLowerCase().includes('cohesión') || item.category?.toLowerCase().includes('psico')) {
        sumMental += lastVal;
        countMental++;
      } else {
        sumFisico += lastVal;
        countFisico++;
      }
    });

    if (countMental > 0) avgMental = Math.min(99, Math.round(sumMental / countMental * 3));
    if (countFisico > 0) avgFisico = Math.min(99, Math.max(60, Math.round(sumFisico / countFisico)));
  }

  const radarMetrics = [
    { label: 'Físico', value: avgFisico },
    { label: 'Técnica', value: avgTecnica },
    { label: 'Táctica', value: avgTactica },
    { label: 'Mentalidad', value: avgMental },
    { label: 'Asistencia', value: avgAsistencia }
  ];

  const overallTPI = Math.round(radarMetrics.reduce((acc, m) => acc + m.value, 0) / radarMetrics.length);

  // SVG Radar setup
  const size = 260;
  const center = size / 2;
  const radius = center - 38;
  const angleStep = (Math.PI * 2) / radarMetrics.length;

  const polygonPoints = radarMetrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (m.value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Cálculo de promedio de bienestar semanal
  const avgSleep = wellnessHistory.length > 0
    ? (wellnessHistory.reduce((a, b) => a + (Number(b.sleep) || 3), 0) / wellnessHistory.length).toFixed(1)
    : '4.2';
  const avgMood = wellnessHistory.length > 0
    ? (wellnessHistory.reduce((a, b) => a + (Number(b.mood) || 3), 0) / wellnessHistory.length).toFixed(1)
    : '4.5';
  const hasDiscomfortActive = wellnessHistory.length > 0 && wellnessHistory[0]?.hasDiscomfort;

  return (
    <div className="player-tab-content player-stats-tab">
      <div className="tab-header-box">
        <h2 className="tab-title">Rendimiento y Estadísticas</h2>
        <p className="tab-subtitle">Seguimiento de tu progresión física, minutos, valoraciones y evolución en tests.</p>
      </div>

      {/* MÉTRICAS GAMING / HUD DE PARTIDOS */}
      <div className="player-hud-grid">
        <div className="hud-metric-box">
          <div className="metric-icon-circle green">
            <Zap size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-number mono">{matchStats.minutes}'</span>
            <span className="metric-label">MINUTOS JUGADOS</span>
          </div>
        </div>

        <div className="hud-metric-box">
          <div className="metric-icon-circle gold">
            <Trophy size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-number mono">{matchStats.goals}</span>
            <span className="metric-label">GOLES</span>
          </div>
        </div>

        <div className="hud-metric-box">
          <div className="metric-icon-circle blue">
            <Activity size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-number mono">{matchStats.assists}</span>
            <span className="metric-label">ASISTENCIAS</span>
          </div>
        </div>

        <div className="hud-metric-box">
          <div className="metric-icon-circle gold">
            <Star size={18} />
          </div>
          <div className="metric-data">
            <span className="metric-number mono">{matchStats.avgRating}</span>
            <span className="metric-label">NOTA MEDIA</span>
          </div>
        </div>
      </div>

      {/* RADAR CHART DE COMPETENCIAS */}
      <div className="hud-card radar-stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
        <div className="hud-header" style={{ width: '100%' }}>
          <span className="hud-badge">
            <Sparkles size={14} /> RADAR DE HABILIDADES
          </span>
          <span className="hud-status-live" style={{ color: '#10B981', background: 'rgba(16,185,129,0.12)' }}>
            Nivel Global: {overallTPI}
          </span>
        </div>

        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '10px auto' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Círculos concéntricos de fondo */}
            {gridLevels.map((lvl, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius * lvl}
                fill="none"
                stroke={darkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(27, 58, 45, 0.15)"}
                strokeDasharray={idx === 3 ? 'none' : '3,3'}
              />
            ))}

            {/* Ejes radiales */}
            {radarMetrics.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={darkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(27, 58, 45, 0.18)"}
                />
              );
            })}

            {/* Polígono de datos */}
            <polygon
              points={polygonPoints}
              fill={darkMode ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)"}
              stroke="#10B981"
              strokeWidth="2.5"
            />

            {/* Puntos de valor */}
            {radarMetrics.map((m, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = (m.value / 100) * radius;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
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

            {/* Etiquetas de los vértices */}
            {radarMetrics.map((m, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const labelRadius = radius + 20;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
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

      {/* SECCIÓN DE GRÁFICAS DE EVOLUCIÓN POR TEST */}
      <div className="player-tests-section">
        <div className="section-title-row" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Evolución Temporal de Tests</h3>
          </div>
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

                  {/* Curva gráfica SVG de evolución en el tiempo */}
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

