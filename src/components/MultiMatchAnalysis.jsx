import React, { useState, useEffect, useMemo } from 'react';
import { FileDown, CheckCircle2, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { getUnifiedMatchEvents } from '../utils/minutesEngine';
import { calculateCanonicalStats } from './canonical/calculateCanonicalStats';
import { exportMultiMatchAnalysisPDF } from '../utils/analysisPdfReport';
import './MultiMatchAnalysis.css';

export const MultiMatchAnalysis = ({ matches = [], teamId, activeTeam = null, language = 'Español (ES)' }) => {
  const { isEn } = useTranslation();
  const { darkMode } = useTheme();

  // Obtiene los últimos N partidos dando prioridad a los jugados y rellenando hasta count
  const getRecentMatches = (count) => {
    if (!matches || matches.length === 0) return [];
    const sorted = [...matches].sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : 0;
      const tB = b.date ? new Date(b.date).getTime() : 0;
      return tB - tA;
    });

    const played = sorted.filter((m) => {
      const hasEvents = (Array.isArray(m.events) && m.events.length > 0) ||
        (Array.isArray(m.liveStatsEvents) && m.liveStatsEvents.length > 0);
      const isFinished = m.status === 'Terminado' || m.status === 'Finalizado' || m.actaOficial?.closed;
      return isFinished || hasEvents;
    });

    const notPlayed = sorted.filter((m) => !played.includes(m));
    const prioritized = [...played, ...notPlayed];
    return prioritized.slice(0, count);
  };

  // Seleccionar por defecto los últimos 5 partidos
  const defaultSelectedIds = useMemo(() => {
    return getRecentMatches(5).map((m) => m.id);
  }, [matches]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('AVERAGES'); // 'AVERAGES' | 'TOTALS'
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Inicializar selección por defecto cuando se carguen partidos
  useEffect(() => {
    if (selectedIds.length === 0 && defaultSelectedIds.length > 0) {
      setSelectedIds(defaultSelectedIds);
    }
  }, [defaultSelectedIds, selectedIds.length]);

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

  // Cálculo canónico y verificable de métricas por partido
  const perMatchMetrics = useMemo(() => {
    return selectedMatches.map((match) => {
      const evs = getUnifiedMatchEvents(match);
      const { homeStats, awayStats } = calculateCanonicalStats(match, evs);

      const countOf = (types) => {
        const typeArr = Array.isArray(types) ? types : [types];
        return evs.filter((e) => typeArr.includes(e.type)).length;
      };

      const duelsWon = countOf(['duel_won', 'duelo_ganado']);
      const duelsLost = countOf(['duel_lost', 'duelo_perdido']);
      const duelsTotal = duelsWon + duelsLost;
      const totalPossEvents = (homeStats?.recuperaciones || 0) + (awayStats?.recuperaciones || 0);
      const duelPct = duelsTotal > 0
        ? Math.round((duelsWon / duelsTotal) * 100)
        : (totalPossEvents > 0 ? (homeStats?.posesion || 50) : 0);

      const shotsOwn = Math.max(
        homeStats?.tirosPuerta || 0,
        countOf(['shot_on_target_own', 'shot_on_target', 'gol_local', 'goal_own', 'goal', 'gol'])
      );
      const shotsRival = Math.max(
        awayStats?.tirosPuerta || 0,
        countOf(['shot_on_target_rival', 'gol_rival', 'goal_rival'])
      );

      const recoveries = countOf(['recovery', 'recuperacion']) || (homeStats?.recuperaciones || 0);
      const losses = countOf(['loss', 'perdida', 'ball_loss', 'turnover']) || (awayStats?.recuperaciones || 0);

      const foulsFavor = countOf(['foul_favor', 'falta_favor']) || (awayStats?.faltas || 0);
      const foulsAgainst = countOf(['foul_against', 'foul', 'falta_contra', 'falta']) || (homeStats?.faltas || 0);

      const cardsOwn = countOf(['card_own', 'card_yellow_own', 'card_red_own', 'amarilla', 'roja']) || (homeStats?.amarillas || 0);
      const cardsRival = countOf(['card_rival', 'card_yellow_rival', 'card_red_rival', 'amarilla_rival', 'roja_rival']) || (awayStats?.amarillas || 0);

      const counterEff = recoveries > 0
        ? Math.min(100, Math.round((shotsOwn / recoveries) * 100))
        : (shotsOwn > 0 ? 50 : 0);

      const goalsFor = Number.isFinite(match.goalsFor)
        ? match.goalsFor
        : (Number.isFinite(match.golesLocal) ? match.golesLocal : (Number.isFinite(match.golesFavor) ? match.golesFavor : 0));
      const goalsAgainst = Number.isFinite(match.goalsAgainst)
        ? match.goalsAgainst
        : (Number.isFinite(match.golesVisita) ? match.golesVisita : (Number.isFinite(match.golesContra) ? match.golesContra : 0));

      return {
        match,
        id: match.id,
        rival: match.rival || (isEn ? 'Opponent' : 'Rival'),
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
  }, [selectedMatches, isEn]);

  // Totales y promedios agregados
  const aggregates = useMemo(() => {
    const count = perMatchMetrics.length;
    if (count === 0) {
      return {
        matchCount: 0,
        avgShotsOwn: '0.0',
        avgShotsRival: '0.0',
        totalShotsOwn: 0,
        totalShotsRival: 0,
        avgDuelPct: 0,
        avgRecoveries: '0.0',
        avgLosses: '0.0',
        totalRecoveries: 0,
        totalLosses: 0,
        avgCounterEff: 0,
        totalGoalsFor: 0,
        totalGoalsAgainst: 0,
      };
    }

    const sumShotsOwn = perMatchMetrics.reduce((acc, m) => acc + m.shotsOwn, 0);
    const sumShotsRival = perMatchMetrics.reduce((acc, m) => acc + m.shotsRival, 0);
    const sumDuelPct = perMatchMetrics.reduce((acc, m) => acc + m.duelPct, 0);
    const sumRecoveries = perMatchMetrics.reduce((acc, m) => acc + m.recoveries, 0);
    const sumLosses = perMatchMetrics.reduce((acc, m) => acc + m.losses, 0);
    const sumCounterEff = perMatchMetrics.reduce((acc, m) => acc + m.counterEff, 0);
    const sumGoalsFor = perMatchMetrics.reduce((acc, m) => acc + m.goalsFor, 0);
    const sumGoalsAgainst = perMatchMetrics.reduce((acc, m) => acc + m.goalsAgainst, 0);

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
      totalGoalsFor: sumGoalsFor,
      totalGoalsAgainst: sumGoalsAgainst,
    };
  }, [perMatchMetrics]);

  // Selección rápida de partidos
  const handleShortcutSelect = (shortcut) => {
    if (shortcut === 'LAST_3') {
      setSelectedIds(getRecentMatches(3).map((m) => m.id));
    } else if (shortcut === 'LAST_5') {
      setSelectedIds(getRecentMatches(5).map((m) => m.id));
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

  const activeShortcut = useMemo(() => {
    if (selectedIds.length === 0) return 'NONE';
    if (matches.length > 0 && selectedIds.length === matches.length && matches.every((m) => selectedIds.includes(m.id))) {
      return 'ALL';
    }
    const last3Ids = getRecentMatches(3).map((m) => m.id);
    if (last3Ids.length > 0 && selectedIds.length === last3Ids.length && last3Ids.every((id) => selectedIds.includes(id))) {
      return 'LAST_3';
    }
    const last5Ids = getRecentMatches(5).map((m) => m.id);
    if (last5Ids.length > 0 && selectedIds.length === last5Ids.length && last5Ids.every((id) => selectedIds.includes(id))) {
      return 'LAST_5';
    }
    return 'CUSTOM';
  }, [selectedIds, matches]);

  const tx = (key, params) => {
    return t(key, language, params);
  };

  const handleExportPDF = async () => {
    if (selectedMatches.length === 0) return;
    setIsExportingPdf(true);
    try {
      await exportMultiMatchAnalysisPDF({
        selectedMatches,
        perMatchMetrics,
        aggregates,
        viewMode,
        activeTeam,
        language,
      });
    } catch (err) {
      console.error('[MultiMatchAnalysis] Error al exportar PDF:', err);
      alert(isEn ? 'There was an error generating the analysis PDF.' : 'Hubo un error al generar el PDF de análisis.');
    } finally {
      setIsExportingPdf(false);
    }
  };

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
              className={`shortcut-chip ${activeShortcut === 'LAST_3' ? 'active' : ''}`}
              onClick={() => handleShortcutSelect('LAST_3')}
            >
              {tx('analisis.shortcuts.last3')}
            </button>
            <button
              type="button"
              className={`shortcut-chip ${activeShortcut === 'LAST_5' ? 'active' : ''}`}
              onClick={() => handleShortcutSelect('LAST_5')}
            >
              {tx('analisis.shortcuts.last5')}
            </button>
            <button
              type="button"
              className={`shortcut-chip ${activeShortcut === 'ALL' ? 'active' : ''}`}
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

          {/* Botón Descargar PDF de Análisis */}
          <button
            type="button"
            className="btn-export-analysis-pdf"
            onClick={handleExportPDF}
            disabled={isExportingPdf || selectedMatches.length < 1}
            title={tx('analisis.exportPdf')}
          >
            <FileDown size={18} />
            <span>{isExportingPdf ? tx('analisis.exportingPdf') : tx('analisis.exportPdf')}</span>
          </button>
        </div>
      </div>

      {selectedIds.length === 0 ? (
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
                  {viewMode === 'AVERAGES' ? tx('analisis.kpi.shotsSubAvg') : tx('analisis.kpi.shotsSubTot')}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">✊</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.duels')}</span>
                <span className="kpi-value">{aggregates.avgDuelPct}%</span>
                <span className="kpi-sub">{tx('analisis.kpi.duelsSub')}</span>
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
                  {viewMode === 'AVERAGES' ? tx('analisis.kpi.recLossSubAvg') : tx('analisis.kpi.recLossSubTot')}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">⚡</div>
              <div className="kpi-info">
                <span className="kpi-title">{tx('analisis.kpi.counters')}</span>
                <span className="kpi-value">{aggregates.avgCounterEff}%</span>
                <span className="kpi-sub">{tx('analisis.kpi.countersSub')}</span>
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
                tx={tx}
              />
            </div>

            {/* 2. Gráfica de Barras Comparativas */}
            <div className="chart-box half-width">
              <h3 className="chart-title">{tx('analisis.chart.bars')}</h3>
              <ComparisonBarChart
                data={perMatchMetrics}
                darkMode={darkMode}
                tx={tx}
              />
            </div>

            {/* 3. Gráfica Radar de Perfil Táctico Promedio */}
            <div className="chart-box half-width">
              <h3 className="chart-title">{tx('analisis.chart.radar')}</h3>
              <RadarTacticalChart
                aggregates={aggregates}
                darkMode={darkMode}
                tx={tx}
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
                        <span style={{ color: '#4CAF7D', fontWeight: 'bold' }}>
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
                        <span style={{ color: '#D4A843', fontWeight: 'bold' }}>{pm.recoveries}</span> /{' '}
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
              <h3>⚽ {tx('analisis.modal.title')}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowMatchModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-shortcuts">
              <button
                type="button"
                className={`modal-chip ${activeShortcut === 'LAST_3' ? 'active' : ''}`}
                onClick={() => handleShortcutSelect('LAST_3')}
              >
                {tx('analisis.shortcuts.last3')}
              </button>
              <button
                type="button"
                className={`modal-chip ${activeShortcut === 'LAST_5' ? 'active' : ''}`}
                onClick={() => handleShortcutSelect('LAST_5')}
              >
                {tx('analisis.shortcuts.last5')}
              </button>
              <button
                type="button"
                className={`modal-chip ${activeShortcut === 'ALL' ? 'active' : ''}`}
                onClick={() => handleShortcutSelect('ALL')}
              >
                {tx('analisis.modal.all')} ({matches.length})
              </button>
              <button
                type="button"
                className="modal-chip danger"
                onClick={() => handleShortcutSelect('CLEAR')}
              >
                {tx('analisis.modal.clear')}
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
                      <span className="match-rival">vs {m.rival || (isEn ? 'Opponent' : 'Rival')}</span>
                      <span className="match-meta">
                        {m.date ? m.date.split('-').reverse().join('/') : tx('analisis.modal.noDate')} |{' '}
                        {m.type || (isEn ? 'Home' : 'Local')}
                      </span>
                    </div>
                    <div className="match-item-score">
                      {m.status === 'Terminado' || m.status === 'Finalizado' ? (
                        <span>
                          {m.goalsFor ?? 0} - {m.goalsAgainst ?? 0}
                        </span>
                      ) : (
                        <span className="badge-pending">{m.status || tx('analisis.modal.pending')}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="modal-footer">
              <span>{tx('analisis.modal.selectedCount', { count: selectedIds.length })}</span>
              <button
                type="button"
                className="btn-primary-dark btn-confirm-modal"
                onClick={() => setShowMatchModal(false)}
              >
                <CheckCircle2 size={18} />
                <span>{tx('analisis.modal.confirm')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── COMPONENTE SVG 1: GRÁFICA DE LÍNEAS DE EVOLUCIÓN Y TENDENCIA ──
const TrendLineChart = ({ data, darkMode, tx }) => {
  if (!data || data.length === 0) return null;

  const width = 700;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value for scaling (Recuperaciones vs Pérdidas vs Tiros)
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

  const strokeColorGrid = darkMode ? 'rgba(212, 168, 67, 0.25)' : '#E2E8F0';
  const textColor = darkMode ? '#D2E6DC' : '#152C22';

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

        {/* Línea 1: Recuperaciones (Verde Campo #4CAF7D) */}
        <polyline
          fill="none"
          stroke="#4CAF7D"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={recPoints}
        />

        {/* Línea 2: Pérdidas (Ámbar #F59E0B) */}
        <polyline
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={lossPoints}
        />

        {/* Línea 3: Tiros Propios (Oro Institucional #D4A843) */}
        <polyline
          fill="none"
          stroke="#D4A843"
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
              <circle cx={x} cy={yRec} r="5" fill="#4CAF7D" />
              {/* Punto Pérdidas */}
              <circle cx={x} cy={yLoss} r="5" fill="#F59E0B" />
              {/* Punto Tiros */}
              <circle cx={x} cy={yShot} r="4" fill="#D4A843" />

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

      {/* Leyenda Canónica */}
      <div className="chart-legend">
        <span className="legend-item">
          <span className="dot" style={{ background: '#4CAF7D' }}></span> {tx('analisis.chart.recoveries')}
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#F59E0B' }}></span> {tx('analisis.chart.losses')}
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#D4A843' }}></span> {tx('analisis.chart.shotsOwn')}
        </span>
      </div>
    </div>
  );
};

// ── COMPONENTE SVG 2: GRÁFICA DE BARRAS COMPARATIVAS ──
const ComparisonBarChart = ({ data, darkMode, tx }) => {
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

  const textColor = darkMode ? '#D2E6DC' : '#152C22';

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
              stroke={darkMode ? 'rgba(212, 168, 67, 0.25)' : '#E2E8F0'}
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
                fill="#4CAF7D"
                rx="3"
              />
              <text
                x={xOwn + barWidth / 2}
                y={yOwn - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={darkMode ? '#FFFFFF' : '#152C22'}
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
                fill={darkMode ? '#FFFFFF' : '#152C22'}
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
          <span className="dot" style={{ background: '#4CAF7D' }}></span> {tx('analisis.chart.shotsOwnTitle')}
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#EF4444' }}></span> {tx('analisis.chart.shotsRival')}
        </span>
      </div>
    </div>
  );
};

// ── COMPONENTE SVG 3: GRÁFICA RADAR DE PERFIL TÁCTICO PROMEDIO ──
const RadarTacticalChart = ({ aggregates, darkMode, tx }) => {
  const size = 280;
  const center = size / 2;
  const radius = 95;

  // 5 Ejes Tácticos Canónicos
  const axes = [
    { label: tx('analisis.chart.axisShots'), val: Math.min(100, parseFloat(aggregates.avgShotsOwn) * 15) },
    { label: tx('analisis.chart.axisDuels'), val: aggregates.avgDuelPct },
    { label: tx('analisis.chart.axisRecoveries'), val: Math.min(100, parseFloat(aggregates.avgRecoveries) * 10) },
    { label: tx('analisis.chart.axisLossControl'), val: Math.max(10, 100 - parseFloat(aggregates.avgLosses) * 8) },
    { label: tx('analisis.chart.axisCounterEff'), val: aggregates.avgCounterEff },
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

  const strokeColorGrid = darkMode ? 'rgba(212, 168, 67, 0.25)' : '#CBD5E1';
  const textColor = darkMode ? '#D2E6DC' : '#152C22';

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

        {/* Polígono de Rendimiento Táctico (Tierra y Campo) */}
        <polygon
          points={polygonPoints}
          fill="rgba(76, 175, 125, 0.35)"
          stroke="#4CAF7D"
          strokeWidth="2.5"
        />

        {/* Puntos y etiquetas en vértices */}
        {axes.map((a, i) => {
          const { x, y } = getCoords(i, a.val);
          const labelCoords = getCoords(i, 118);

          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#4CAF7D" />
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
