import React, { useState, useEffect, useMemo } from 'react';
import { t } from '../i18n/translations';
import { db } from '../firebaseConfig';
import { collection, getDocs } from '../firebase/firestore-proxy';
import { useTheme } from '../context/ThemeContext';
import './MultiMatchAnalysis.css';

export const MultiMatchAnalysis = ({ matches = [], teamId, language = 'Español (ES)' }) => {
  const { darkMode } = useTheme();

  // Seleccionar por defecto los últimos 5 partidos (o los que existan)
  const defaultSelectedIds = useMemo(() => {
    return matches.slice(0, 5).map((m) => m.id);
  }, [matches]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('AVERAGES'); // 'AVERAGES' | 'TOTALS'
  const [eventsCache, setEventsCache] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Inicializar selección por defecto cuando se carguen partidos
  useEffect(() => {
    if (selectedIds.length === 0 && defaultSelectedIds.length > 0) {
      setSelectedIds(defaultSelectedIds);
    }
  }, [defaultSelectedIds, selectedIds.length]);

  // Cargar eventos de liveEvents desde Firestore para cada partido seleccionado
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      const missingIds = selectedIds.filter((id) => !eventsCache[id]);
      if (missingIds.length === 0) return;

      setLoadingEvents(true);
      const newCache = { ...eventsCache };

      for (const mId of missingIds) {
        if (!teamId || !mId) {
          const matchObj = matches.find((m) => m.id === mId);
          newCache[mId] = matchObj?.liveStatsEvents || matchObj?.events || [];
          continue;
        }

        try {
          const colRef = collection(db, 'teams', teamId, 'matches', mId, 'liveEvents');
          const snap = await getDocs(colRef);
          if (snap && snap.docs && snap.docs.length > 0) {
            newCache[mId] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            const matchObj = matches.find((m) => m.id === mId);
            newCache[mId] = matchObj?.liveStatsEvents || matchObj?.events || [];
          }
        } catch (err) {
          console.error('[MultiMatchAnalysis] Error cargando liveEvents de', mId, err);
          const matchObj = matches.find((m) => m.id === mId);
          newCache[mId] = matchObj?.liveStatsEvents || matchObj?.events || [];
        }
      }

      if (isMounted) {
        setEventsCache(newCache);
        setLoadingEvents(false);
      }
    };

    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, [selectedIds, teamId, matches, eventsCache]);

  // Lista de partidos seleccionados ordenados cronológicamente (antiguos a recientes)
  const selectedMatches = useMemo(() => {
    return matches
      .filter((m) => selectedIds.includes(m.id))
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      });
  }, [matches, selectedIds]);

  // Cálculo de métricas por partido individual
  const perMatchMetrics = useMemo(() => {
    return selectedMatches.map((match) => {
      const evs = eventsCache[match.id] || [];

      const countType = (type) => evs.filter((e) => e.type === type).length;

      const shotsOwn = countType('shot_on_target_own');
      const shotsRival = countType('shot_on_target_rival');
      const duelsWon = countType('duel_won');
      const duelsLost = countType('duel_lost');
      const duelsTotal = duelsWon + duelsLost;
      const duelPct = duelsTotal > 0 ? Math.round((duelsWon / duelsTotal) * 100) : 0;

      const recoveries = countType('recovery');
      const losses = countType('loss');

      const foulsFavor = countType('foul_favor');
      const foulsAgainst = countType('foul_against');

      const cardsOwn = countType('card_own');
      const cardsRival = countType('card_rival');

      const counterEff = recoveries > 0 ? Math.round((shotsOwn / recoveries) * 100) : 0;

      const goalsFor = match.goalsFor ?? match.golesLocal ?? 0;
      const goalsAgainst = match.goalsAgainst ?? match.golesVisita ?? 0;

      return {
        match,
        id: match.id,
        rival: match.rival || 'Rival',
        date: match.date || '',
        goalsFor,
        goalsAgainst,
        shotsOwn,
        shotsRival,
        duelsWon,
        duelsLost,
        duelPct,
        recoveries,
        losses,
        foulsFavor,
        foulsAgainst,
        cardsOwn,
        cardsRival,
        counterEff,
      };
    });
  }, [selectedMatches, eventsCache]);

  // Totales y promedios agregados
  const aggregates = useMemo(() => {
    const count = perMatchMetrics.length;
    if (count === 0) {
      return {
        matchCount: 0,
        avgShotsOwn: 0,
        avgShotsRival: 0,
        totalShotsOwn: 0,
        totalShotsRival: 0,
        avgDuelPct: 0,
        avgRecoveries: 0,
        avgLosses: 0,
        totalRecoveries: 0,
        totalLosses: 0,
        avgCounterEff: 0,
      };
    }

    const sumShotsOwn = perMatchMetrics.reduce((acc, m) => acc + m.shotsOwn, 0);
    const sumShotsRival = perMatchMetrics.reduce((acc, m) => acc + m.shotsRival, 0);
    const sumDuelPct = perMatchMetrics.reduce((acc, m) => acc + m.duelPct, 0);
    const sumRecoveries = perMatchMetrics.reduce((acc, m) => acc + m.recoveries, 0);
    const sumLosses = perMatchMetrics.reduce((acc, m) => acc + m.losses, 0);
    const sumCounterEff = perMatchMetrics.reduce((acc, m) => acc + m.counterEff, 0);

    return {
      matchCount: count,
      avgShotsOwn: (sumShotsOwn / count).toFixed(1),
      avgShotsRival: (sumShotsRival / count).toFixed(1),
      totalShotsOwn: sumShotsOwn,
      totalShotsRival: sumShotsRival,
      avgDuelPct: Math.round(sumDuelPct / count),
      avgRecoveries: (sumRecoveries / count).toFixed(1),
      avgLosses: (sumLosses / count).toFixed(1),
      totalRecoveries: sumRecoveries,
      totalLosses: sumLosses,
      avgCounterEff: Math.round(sumCounterEff / count),
    };
  }, [perMatchMetrics]);

  // Selección rápida
  const handleShortcutSelect = (shortcut) => {
    if (shortcut === 'LAST_3') {
      setSelectedIds(matches.slice(0, 3).map((m) => m.id));
    } else if (shortcut === 'LAST_5') {
      setSelectedIds(matches.slice(0, 5).map((m) => m.id));
    } else if (shortcut === 'ALL') {
      setSelectedIds(matches.map((m) => m.id));
    } else if (shortcut === 'CLEAR') {
      setSelectedIds([]);
    }
  };

  const toggleMatchSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const tx = (key, params) => t(key, language, params);

  return (
    <div className={`multi-match-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* ── BARRA SUPERIOR DE FILTROS & SELECCIÓN ── */}
      <div className="multi-match-filter-bar">
        <div className="filter-header-title">
          <h2>{tx('analisis.title')}</h2>
          <p>{tx('analisis.subtitle')}</p>
        </div>

        <div className="filter-actions-row">
          {/* Botón Abrir Modal de Selección */}
          <button
            type="button"
            className="btn-select-matches"
            onClick={() => setShowMatchModal(true)}
          >
            <span>⚽ {tx('analisis.selectMatches')}</span>
            <span className="badge-count">{selectedIds.length}</span>
          </button>

          {/* Atajos Rápidos */}
          <div className="shortcuts-group">
            <span className="shortcuts-label">{tx('analisis.shortcuts.title')}</span>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcutSelect('LAST_3')}
            >
              {tx('analisis.shortcuts.last3')}
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcutSelect('LAST_5')}
            >
              {tx('analisis.shortcuts.last5')}
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcutSelect('ALL')}
            >
              {tx('analisis.shortcuts.allSeason')}
            </button>
          </div>

          {/* Toggle Modo: Acumulados vs Promedio */}
          <div className="view-mode-toggle">
            <span className="mode-label">{tx('analisis.mode.title')}</span>
            <div className="toggle-pill-container">
              <button
                type="button"
                className={`toggle-pill ${viewMode === 'AVERAGES' ? 'active' : ''}`}
                onClick={() => setViewMode('AVERAGES')}
              >
                {tx('analisis.mode.averages')}
              </button>
              <button
                type="button"
                className={`toggle-pill ${viewMode === 'TOTALS' ? 'active' : ''}`}
                onClick={() => setViewMode('TOTALS')}
              >
                {tx('analisis.mode.totals')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loadingEvents && (
        <div className="multi-match-loading">
          <div className="spinner"></div>
          <span>{tx('analisis.loadingData')}</span>
        </div>
      )}

      {selectedIds.length < 2 ? (
        <div className="multi-match-empty">
          <span className="empty-icon">📊</span>
          <h3>{tx('analisis.noMatchesSelected')}</h3>
          <button
            type="button"
            className="btn-primary-dark"
            onClick={() => handleShortcutSelect('LAST_5')}
          >
            {tx('analisis.shortcuts.last5')}
          </button>
        </div>
      ) : (
        <>
          {/* ── TARJETAS KPI AGREGADAS ── */}
          <div className="multi-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">🎯</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.shots')}</span>
                <span className="kpi-value">
                  {viewMode === 'AVERAGES'
                    ? `${aggregates.avgShotsOwn} / ${aggregates.avgShotsRival}`
                    : `${aggregates.totalShotsOwn} / ${aggregates.totalShotsRival}`}
                </span>
                <span className="kpi-sub">
                  {viewMode === 'AVERAGES' ? 'Prom. Propio vs Rival' : 'Total Propio vs Rival'}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">✊</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.duels')}</span>
                <span className="kpi-value">{aggregates.avgDuelPct}%</span>
                <span className="kpi-sub">Efectividad global en duelos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">🔄</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.recoveries')}</span>
                <span className="kpi-value">
                  {viewMode === 'AVERAGES'
                    ? `${aggregates.avgRecoveries} / ${aggregates.avgLosses}`
                    : `${aggregates.totalRecoveries} / ${aggregates.totalLosses}`}
                </span>
                <span className="kpi-sub">
                  {viewMode === 'AVERAGES' ? 'Promedio Rec / Pérdidas' : 'Total Rec / Pérdidas'}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">⚡</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.counters')}</span>
                <span className="kpi-value">{aggregates.avgCounterEff}%</span>
                <span className="kpi-sub">Ratio de conversión de recuperaciones</span>
              </div>
            </div>
          </div>

          {/* ── DASHBOARD DE GRÁFICAS COMPARATIVAS ── */}
          <div className="multi-charts-grid">
            {/* 1. Gráfica de Líneas: Evolución de Tendencia */}
            <div className="chart-box full-width">
              <h3 className="chart-title">{tx('analisis.chart.trend')}</h3>
              <TrendLineChart
                data={perMatchMetrics}
                darkMode={darkMode}
                viewMode={viewMode}
              />
            </div>

            {/* 2. Gráfica de Barras Comparativas */}
            <div className="chart-box half-width">
              <h3 className="chart-title">{tx('analisis.chart.bars')}</h3>
              <ComparisonBarChart
                data={perMatchMetrics}
                darkMode={darkMode}
              />
            </div>

            {/* 3. Gráfica Radar de Perfil Táctico Promedio */}
            <div className="chart-box half-width">
              <h3 className="chart-title">{tx('analisis.chart.radar')}</h3>
              <RadarTacticalChart
                aggregates={aggregates}
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* ── TABLA DE DESGLOSE DETALLADO POR PARTIDO ── */}
          <div className="multi-table-box">
            <h3 className="chart-title">{tx('analisis.table.title')}</h3>
            <div className="table-wrapper">
              <table className="multi-match-table">
                <thead>
                  <tr>
                    <th>{tx('analisis.table.match')}</th>
                    <th>{tx('analisis.table.result')}</th>
                    <th>{tx('analisis.table.shots')}</th>
                    <th>{tx('analisis.table.duels')}</th>
                    <th>{tx('analisis.table.recLoss')}</th>
                    <th>{tx('analisis.table.fouls')}</th>
                    <th>{tx('analisis.table.cards')}</th>
                  </tr>
                </thead>
                <tbody>
                  {perMatchMetrics.map((pm) => (
                    <tr key={pm.id}>
                      <td className="font-bold">
                        vs {pm.rival}{' '}
                        <span className="text-muted text-xs">
                          ({pm.date ? pm.date.split('-').reverse().join('/') : '--/--'})
                        </span>
                      </td>
                      <td>
                        <span className="score-pill">
                          {pm.goalsFor} - {pm.goalsAgainst}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                          {pm.shotsOwn}
                        </span>{' '}
                        /{' '}
                        <span style={{ color: '#EF4444' }}>
                          {pm.shotsRival}
                        </span>
                      </td>
                      <td>
                        <span className="duel-badge">{pm.duelPct}%</span>
                      </td>
                      <td>
                        <span style={{ color: '#3B82F6' }}>{pm.recoveries}</span> /{' '}
                        <span style={{ color: '#F59E0B' }}>{pm.losses}</span>
                      </td>
                      <td>
                        {pm.foulsFavor} / {pm.foulsAgainst}
                      </td>
                      <td>
                        🟨 {pm.cardsOwn} | 🟥 {pm.cardsRival}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL SELECCIONADOR DE PARTIDOS ── */}
      {showMatchModal && (
        <div className="multi-modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="multi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚽ Seleccionar Partidos para Comparar</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowMatchModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-shortcuts">
              <button
                type="button"
                className="modal-chip"
                onClick={() => handleShortcutSelect('LAST_3')}
              >
                Últimos 3
              </button>
              <button
                type="button"
                className="modal-chip"
                onClick={() => handleShortcutSelect('LAST_5')}
              >
                Últimos 5
              </button>
              <button
                type="button"
                className="modal-chip"
                onClick={() => handleShortcutSelect('ALL')}
              >
                Todos ({matches.length})
              </button>
              <button
                type="button"
                className="modal-chip danger"
                onClick={() => handleShortcutSelect('CLEAR')}
              >
                Limpiar
              </button>
            </div>

            <div className="modal-matches-list">
              {matches.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <label key={m.id} className={`modal-match-item ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMatchSelection(m.id)}
                    />
                    <div className="match-item-info">
                      <span className="match-rival">vs {m.rival || 'Rival'}</span>
                      <span className="match-meta">
                        {m.date ? m.date.split('-').reverse().join('/') : 'Sin fecha'} |{' '}
                        {m.type || 'Local'}
                      </span>
                    </div>
                    <div className="match-item-score">
                      {m.status === 'Terminado' ? (
                        <span>
                          {m.goalsFor ?? 0} - {m.goalsAgainst ?? 0}
                        </span>
                      ) : (
                        <span className="badge-pending">{m.status || 'Pendiente'}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="modal-footer">
              <span>{selectedIds.length} partidos seleccionados</span>
              <button
                type="button"
                className="btn-primary-dark"
                onClick={() => setShowMatchModal(false)}
              >
                ACEPTAR Y COMPARAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── COMPONENTE SVG 1: GRÁFICA DE LÍNEAS DE EVOLUCIÓN Y TENDENCIA ──
const TrendLineChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return null;

  const width = 700;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value for scaling (Recuperaciones vs Pérdidas)
  const maxVal = Math.max(
    10,
    ...data.map((d) => Math.max(d.recoveries, d.losses, d.shotsOwn))
  );

  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Construcción de paths de SVG
  const recPoints = data.map((d, i) => `${getX(i)},${getY(d.recoveries)}`).join(' ');
  const lossPoints = data.map((d, i) => `${getX(i)},${getY(d.losses)}`).join(' ');
  const shotPoints = data.map((d, i) => `${getX(i)},${getY(d.shotsOwn)}`).join(' ');

  const strokeColorGrid = darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const textColor = darkMode ? '#94A3B8' : '#64748B';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '550px' }}
      >
        {/* Grid Horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingTop + chartHeight * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={strokeColorGrid}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={textColor}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Línea 1: Recuperaciones (Verde) */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={recPoints}
        />

        {/* Línea 2: Pérdidas (Naranja/Rojo) */}
        <polyline
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={lossPoints}
        />

        {/* Línea 3: Tiros Propios (Azul) */}
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeDasharray="5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={shotPoints}
        />

        {/* Puntos y etiquetas X */}
        {data.map((d, i) => {
          const x = getX(i);
          const yRec = getY(d.recoveries);
          const yLoss = getY(d.losses);
          const yShot = getY(d.shotsOwn);

          return (
            <g key={i}>
              {/* Punto Recuperaciones */}
              <circle cx={x} cy={yRec} r="5" fill="#10B981" />
              {/* Punto Pérdidas */}
              <circle cx={x} cy={yLoss} r="5" fill="#F59E0B" />
              {/* Punto Tiros */}
              <circle cx={x} cy={yShot} r="4" fill="#3B82F6" />

              {/* Etiqueta Eje X */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={textColor}
              >
                vs {d.rival}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="chart-legend">
        <span className="legend-item">
          <span className="dot" style={{ background: '#10B981' }}></span> Recuperaciones
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#F59E0B' }}></span> Pérdidas
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#3B82F6' }}></span> Tiros a Puerta
        </span>
      </div>
    </div>
  );
};

// ── COMPONENTE SVG 2: GRÁFICA DE BARRAS COMPARATIVAS ──
const ComparisonBarChart = ({ data, darkMode }) => {
  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const groupWidth = chartWidth / data.length;
  const barWidth = Math.max(8, Math.min(18, groupWidth / 3.5));

  const maxVal = Math.max(8, ...data.map((d) => Math.max(d.shotsOwn, d.shotsRival)));

  const textColor = darkMode ? '#94A3B8' : '#64748B';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '400px' }}
      >
        {/* Grid horizontal */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = paddingTop + chartHeight * (1 - pct);
          return (
            <line
              key={idx}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke={darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Barras agrupadas por partido */}
        {data.map((d, i) => {
          const groupCenter = paddingLeft + i * groupWidth + groupWidth / 2;
          const hOwn = (d.shotsOwn / maxVal) * chartHeight;
          const hRival = (d.shotsRival / maxVal) * chartHeight;

          const yOwn = paddingTop + chartHeight - hOwn;
          const yRival = paddingTop + chartHeight - hRival;

          const xOwn = groupCenter - barWidth - 2;
          const xRival = groupCenter + 2;

          return (
            <g key={i}>
              {/* Barra Tiros Propios */}
              <rect
                x={xOwn}
                y={yOwn}
                width={barWidth}
                height={hOwn}
                fill="#10B981"
                rx="3"
              />
              <text
                x={xOwn + barWidth / 2}
                y={yOwn - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={darkMode ? '#FFFFFF' : '#0F172A'}
              >
                {d.shotsOwn}
              </text>

              {/* Barra Tiros Rival */}
              <rect
                x={xRival}
                y={yRival}
                width={barWidth}
                height={hRival}
                fill="#EF4444"
                rx="3"
              />
              <text
                x={xRival + barWidth / 2}
                y={yRival - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={darkMode ? '#FFFFFF' : '#0F172A'}
              >
                {d.shotsRival}
              </text>

              {/* Etiqueta Nombre Rival */}
              <text
                x={groupCenter}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={textColor}
              >
                {d.rival.substring(0, 7)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="dot" style={{ background: '#10B981' }}></span> Tiros a Puerta Propios
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#EF4444' }}></span> Tiros Rival
        </span>
      </div>
    </div>
  );
};

// ── COMPONENTE SVG 3: GRÁFICA RADAR DE PERFIL TÁCTICO PROMEDIO ──
const RadarTacticalChart = ({ aggregates, darkMode }) => {
  const size = 280;
  const center = size / 2;
  const radius = 95;

  // 5 Ejes Tácticos
  const axes = [
    { label: 'Tiros a Puerta', val: Math.min(100, parseFloat(aggregates.avgShotsOwn) * 15) },
    { label: '% Duelos', val: aggregates.avgDuelPct },
    { label: 'Recuperaciones', val: Math.min(100, parseFloat(aggregates.avgRecoveries) * 10) },
    { label: 'Control Pérdidas', val: Math.max(10, 100 - parseFloat(aggregates.avgLosses) * 8) },
    { label: 'Eficacia Contras', val: aggregates.avgCounterEff },
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Genera coordenadas (x,y) para un punto dado un valor % (0-100) y un índice de eje
  const getCoords = (index, pct) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (pct / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Coordenadas para el polígono de datos
  const polygonPoints = axes
    .map((a, i) => {
      const { x, y } = getCoords(i, a.val);
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColorGrid = darkMode ? 'rgba(255,255,255,0.15)' : '#CBD5E1';
  const textColor = darkMode ? '#E2E8F0' : '#1E293B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: '280px', height: 'auto' }}>
        {/* Anillos concéntricos pentagonales */}
        {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const points = axes
            .map((_, i) => {
              const { x, y } = getCoords(i, pct * 100);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke={strokeColorGrid}
              strokeWidth="1"
            />
          );
        })}

        {/* Ejes desde el centro */}
        {axes.map((_, i) => {
          const { x, y } = getCoords(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={strokeColorGrid}
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono de Rendimiento Táctico */}
        <polygon
          points={polygonPoints}
          fill="rgba(16, 185, 129, 0.35)"
          stroke="#10B981"
          strokeWidth="2.5"
        />

        {/* Puntos y etiquetas en vértices */}
        {axes.map((a, i) => {
          const { x, y } = getCoords(i, a.val);
          const labelCoords = getCoords(i, 118);

          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#10B981" />
              <text
                x={labelCoords.x}
                y={labelCoords.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="800"
                fill={textColor}
              >
                {a.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
