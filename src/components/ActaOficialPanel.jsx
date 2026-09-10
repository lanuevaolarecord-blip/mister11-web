/**
 * src/components/ActaOficialPanel.jsx
 * Míster11 — Panel del Acta Oficial de Partido
 *
 * Uso:
 *   <ActaOficialPanel matchId={id} matchData={matchData} players={players} calledPlayers={calledPlayers} />
 *
 * Muestra:
 *   - Columna izquierda: RSVP en tiempo real del jugador
 *   - Columna derecha: Pase de lista del míster (estado y minutos)
 *   - Botón "CERRAR ACTA" y resumen final
 */
import React, { useMemo, useState } from 'react';
import { useMatchSheet } from '../hooks/useMatchSheet';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import {
  calculateMinutesFromEvents,
  isMatchStartedOrFinished,
  detectMatchEventDivergences,
  getUnifiedMatchEvents,
  getEffectiveMatchDuration,
  getStartingXI
} from '../utils/minutesEngine';
import { useTranslation } from '../hooks/useTranslation';
import { calcMixedRating, deriveStatsFromEvents } from '../utils/ratingFormula';
import PlayerAvatar from './PlayerAvatar';
import MatchStatsBlock from './MatchStatsBlock';
import { MatchRadarChart } from './MatchStats/MatchRadarChart';

const getRsvpLabels = (isEn) => ({
  going:       { label: isEn ? 'Going' : 'Irá',            emoji: '✅', color: '#10B981' },
  not_going:   { label: isEn ? 'Not going' : 'No irá',     emoji: '❌', color: '#EF4444' },
  late:        { label: isEn ? 'Late' : 'Llegará tarde',   emoji: '⚠️', color: '#F59E0B' },
  justified:   { label: isEn ? 'Justified' : 'Justificado', emoji: '📋', color: '#3B82F6' },
});

const getStatusOptions = (isEn) => [
  { id: 'presente',     label: isEn ? 'Present' : 'Presente',         emoji: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  { id: 'ausente',      label: isEn ? 'Absent' : 'Ausente',           emoji: '❌', color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  { id: 'tarde',        label: isEn ? 'Late' : 'Tarde',               emoji: '⚠️', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  { id: 'justificado',  label: isEn ? 'Justified' : 'Justificado',     emoji: '📋', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'lesionado',    label: isEn ? 'Injured' : 'Lesionado',         emoji: '🩺', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
  { id: 'sin_registro', label: isEn ? 'Unregistered' : 'Sin registro', emoji: '🔘', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
];

const getMinuteSourceLabel = (isEn) => ({
  override:       isEn ? '✏️ Manual' : '✏️ Manual',
  titular_full:   isEn ? '⚽ Full starter' : '⚽ Titular completo',
  titular_subout: isEn ? '🔄 Subbed out' : '🔄 Sustituido',
  sub_in:         isEn ? '🔄 Subbed in' : '🔄 Entró',
  dnp:            isEn ? '🪑 Did not play' : '🪑 No entró',
  absent:         isEn ? '❌ Absent' : '❌ Ausente',
  justified:      isEn ? '📋 Justified' : '📋 Justificado',
  injured:        isEn ? '🩺 Injured (0\')' : '🩺 Lesionado (0\')',
  injured_played: isEn ? '🩺 Injured (played)' : '🩺 Lesionado (jugó)',
  late_adjusted:  isEn ? '⚠️ Late (adjusted)' : '⚠️ Tarde (ajustado)',
  not_called:     '—',
});

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const ActaOficialPanel = ({
  matchId,
  matchData,
  players = [],
  calledPlayers = [],
  onNavigateTab,
  onUpdateMatchData,
  events: propEvents = null
}) => {
  const { user, getTeamPath } = useAuth();
  const { activeTeam } = useTeams();
  const { t, language } = useTranslation();
  const isEn = language === 'English (EN)';
  const activeTeamId = activeTeam?.id || null;

  const RSVP_LABELS = useMemo(() => getRsvpLabels(isEn), [isEn]);
  const STATUS_OPTIONS = useMemo(() => getStatusOptions(isEn), [isEn]);
  const MINUTE_SOURCE_LABEL = useMemo(() => getMinuteSourceLabel(isEn), [isEn]);

  const teamPath = activeTeamId ? getTeamPath(activeTeamId) : '';

  const {
    sheet,
    loading,
    isClosed,
    getPlayerActual,
    getPlayerRsvp,
    getDiscrepancies,
    smartPrefill,
    prefillFromRsvp,
    updatePlayerStatus,
    updateMinutesOverride,
    updatePlayerRating,
    closeMatchSheet,
    reopenMatchSheet,
    cleanseEvents,
  } = useMatchSheet(teamPath, matchId, matchData, players);

  const [closingInProgress, setClosingInProgress] = useState(false);
  const [cleansingInProgress, setCleansingInProgress] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [warningsList, setWarningsList] = useState([]);
  // Mapa local pid → minutos para input controlado (permite editar acta cerrada)
  const [localMinutes, setLocalMinutes] = useState({});

  // Estado de colapso persistido para la alerta de anomalías
  const [isWarningsCollapsed, setIsWarningsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(`mister11_warnings_collapsed_${matchId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch (_) {}
    return true; // Colapsado a modo compacto por defecto
  });

  const [showAuditDetail, setShowAuditDetail] = useState(false);
  const [subTab, setSubTab] = useState('roster'); // 'roster' | 'stats'

  const toggleWarningsCollapse = () => {
    setIsWarningsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(`mister11_warnings_collapsed_${matchId}`, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const isStartedOrDone = useMemo(() => isMatchStartedOrFinished(matchData), [matchData]);

  // Jugadores del acta: convocados (titulares + suplentes)
  const convocadosIds = useMemo(() => {
    const titulares = Array.isArray(matchData?.titulares) ? matchData.titulares : [];
    const suplentes = Array.isArray(matchData?.suplentes) ? matchData.suplentes : [];
    const allCalled = [...new Set([...calledPlayers, ...titulares, ...suplentes])].filter(Boolean);
    return allCalled;
  }, [calledPlayers, matchData?.titulares, matchData?.suplentes]);

  const convocadosPlayers = useMemo(() =>
    convocadosIds
      .map(id => (players || []).find(p => p && String(p.id) === String(id)))
      .filter(Boolean),
    [convocadosIds, players]
  );

  const rawTitulares = useMemo(() =>
    (Array.isArray(matchData?.titulares) ? matchData.titulares : []).filter(Boolean).map(String),
    [matchData?.titulares]
  );

  const rawSuplentes = useMemo(() =>
    (Array.isArray(matchData?.suplentes) ? matchData.suplentes : []).filter(Boolean).map(String),
    [matchData?.suplentes]
  );

  const effectiveEvents = useMemo(() => {
    if (propEvents && Array.isArray(propEvents) && propEvents.length > 0) {
      return propEvents.filter(e => e && e.isValid !== false);
    }
    return getUnifiedMatchEvents(matchData);
  }, [propEvents, matchData]);

  const statsOverview = useMemo(() => {
    const evts = effectiveEvents || [];
    const gf = evts.filter(e => e.type === 'goal_own' || e.type === 'gol_local').length;
    const ga = evts.filter(e => e.type === 'goal_rival' || e.type === 'gol_rival').length;
    const sOn = evts.filter(e => e.type === 'shot_on_target_own').length;
    const sOff = evts.filter(e => e.type === 'shot_off_target_own').length;
    const rec = evts.filter(e => e.type === 'recovery').length;
    const fls = evts.filter(e => e.type === 'foul_against').length;
    return {
      goalsFor: gf,
      goalsAgainst: ga,
      shotsTotal: sOn + sOff,
      shotsOnTarget: sOn,
      recoveries: rec,
      fouls: fls,
      totalEvents: evts.length
    };
  }, [effectiveEvents]);

  const { initialTitulares, initialSuplentes } = useMemo(() => {
    return getStartingXI(rawTitulares, rawSuplentes, effectiveEvents);
  }, [rawTitulares, rawSuplentes, effectiveEvents]);

  const initialTitularesSet = useMemo(() => new Set(initialTitulares), [initialTitulares]);
  const initialSuplentesSet = useMemo(() => new Set(initialSuplentes), [initialSuplentes]);

  const duration = getEffectiveMatchDuration(matchData);

  // Contadores RSVP (para partidos futuros)
  const rsvpCounts = useMemo(() => {
    const rsvp = sheet?.rsvp || {};
    const counts = { going: 0, not_going: 0, late: 0, justified: 0, noReply: 0 };
    convocadosIds.forEach(pid => {
      const r = rsvp[String(pid)];
      if (!r) counts.noReply++;
      else if (r.status === 'going') counts.going++;
      else if (r.status === 'not_going') counts.not_going++;
      else if (r.status === 'late') counts.late++;
      else if (r.status === 'justified') counts.justified++;
      else counts.noReply++;
    });
    return counts;
  }, [sheet?.rsvp, convocadosIds]);

  // Contadores de Asistencia / Verificación (para partidos iniciados o terminados)
  const attendanceCounts = useMemo(() => {
    const counts = {
      presente: 0,
      ausente: 0,
      tarde: 0,
      justificado: 0,
      lesionado: 0,
      sin_registro: 0,
    };
    convocadosIds.forEach(pid => {
      const idStr = String(pid);
      const actual = sheet?.actual?.[idStr];
      const isStarter = initialTitularesSet.has(idStr);
      const isSub = initialSuplentesSet.has(idStr);
      const hasSubIn = effectiveEvents.some(e =>
        (e.type === 'cambio' || e.type === 'sustitucion') &&
        String(e.subInId || e.jugadorEntraId || e.playerInId || '') === idStr
      );
      const hasPlayerEvents = effectiveEvents.some(e =>
        String(e.playerId || e.jugadorId || e.fromPlayerId || '') === idStr
      );
      const isActuallyOnField = isStarter || hasSubIn || hasPlayerEvents;

      let status = actual?.status;
      if (isActuallyOnField && (!status || status === 'ausente' || status === 'sin_registro')) {
        status = (actual?.lateMin && actual.lateMin > 0) ? 'tarde' : 'presente';
      } else if (!status) {
        if (isStarter || isSub) {
          status = 'presente';
        } else {
          status = 'sin_registro';
        }
      }

      if (status && counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.sin_registro++;
      }
    });
    return counts;
  }, [sheet?.actual, convocadosIds, initialTitularesSet, initialSuplentesSet, effectiveEvents]);

  const discrepancies = useMemo(() => getDiscrepancies(), [sheet]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSmartPrefill = async () => {
    try { await smartPrefill(); }
    catch { /* toast handled in hook */ }
  };

  const handlePrefill = async () => {
    try { await prefillFromRsvp(); }
    catch { /* toast handled in hook */ }
  };

  const handleCleanse = async () => {
    if (!window.confirm(isEn
      ? 'Cleanse match log? Duplicate or impossible substitutions will be invalidated and match sheet, minutes, and scores recalculated.'
      : '¿Depurar la bitácora? Se invalidarán sustituciones duplicadas o imposibles y se recalcularán acta, minutos y marcadores.')) return;
    setCleansingInProgress(true);
    try {
      await cleanseEvents();
    } finally {
      setCleansingInProgress(false);
    }
  };

  const handleStatusChange = async (pid, status) => {
    try { await updatePlayerStatus(pid, status); }
    catch { /* toast handled in hook */ }
  };

  const handleMinutesChange = async (pid, val) => {
    const parsed = val === '' ? null : parseInt(val, 10);
    if (val !== '' && isNaN(parsed)) return;
    try {
      await updateMinutesOverride(pid, val === '' ? null : parsed);
      // Notificar al padre (Partidos.jsx) para mantener estado sincronizado
      if (onUpdateMatchData && parsed !== null) {
        onUpdateMatchData({
          actaOficial: {
            ...(matchData?.actaOficial || {}),
            actual: {
              ...(matchData?.actaOficial?.actual || {}),
              [pid]: {
                ...(matchData?.actaOficial?.actual?.[pid] || {}),
                minutesOverride: parsed,
                minuteSource: 'override',
              }
            }
          }
        });
      }
    }
    catch { /* toast handled in hook */ }
  };

  const handleRatingChange = async (pid, val) => {
    try { await updatePlayerRating(pid, val); }
    catch { /* toast handled in hook */ }
  };

  const performDivergenceCheck = () => {
    return detectMatchEventDivergences(matchData, sheet?.actual || {}, players);
  };

  const executeCloseActa = async (withWarnings = false) => {
    setClosingInProgress(true);
    try {
      const result = await closeMatchSheet(withWarnings, warningsList);
      setShowWarningsModal(false);
      // Notificar a Partidos.jsx con el acta actualizada
      if (onUpdateMatchData && result?.finalActual) {
        onUpdateMatchData({
          actaOficial: {
            ...(matchData?.actaOficial || {}),
            actual: result.finalActual,
            closed: true,
            totalDuration: result.duration,
          }
        });
      }
    } finally {
      setClosingInProgress(false);
    }
  };

  const handleClose = async () => {
    const warnings = performDivergenceCheck();
    if (warnings.length > 0) {
      setWarningsList(warnings);
      setShowWarningsModal(true);
      return;
    }

    if (!window.confirm(isEn
      ? 'Close official match sheet? Minutes and statuses will be officially recorded.'
      : '¿Cerrar el acta oficial? Los minutos y estados quedarán registrados de forma oficial.')) return;
    await executeCloseActa(false);
  };

  const handleReopen = async () => {
    const reason = window.prompt(
      isEn ? 'Reason for reopening match sheet? (optional):' : '¿Motivo de reapertura del acta? (opcional):',
      isEn ? 'Correction requested by coaching staff' : 'Corrección solicitada por el cuerpo técnico'
    );
    if (reason === null) return; // cancelado por el usuario
    try {
      await reopenMatchSheet(reason);
    } catch { /* handled in hook */ }
  };

  const handleExportActaPDF = async () => {
    try {
      const { generateMatchPdfReport } = await import('../utils/matchPdfReport');
      await generateMatchPdfReport({
        mode: 'ACTA',
        teamName: activeTeam?.nombre || activeTeam?.name || 'Mi Equipo',
        matchData: {
          ...matchData,
          actaOficial: {
            ...(matchData?.actaOficial || {}),
            actual: sheet?.actual || matchData?.actaOficial?.actual || {},
            closed: isClosed,
            closedAt: sheet?.closedAt || matchData?.actaOficial?.closedAt,
            closedBy: sheet?.closedBy || matchData?.actaOficial?.closedBy,
            warnings: sheet?.warnings || matchData?.actaOficial?.warnings || warningsList || [],
            totalDuration: duration
          }
        },
        events: effectiveEvents || [],
        players: players || [],
        calledPlayers: calledPlayers || [],
        language: isEn ? 'English (EN)' : 'Español (ES)',
      });
    } catch (e) {
      console.error('Error exportando PDF del acta:', e);
      alert(isEn ? 'Error exporting official match sheet PDF' : 'Error al exportar el PDF del acta oficial.');
    }
  };

  if (!matchId) {
    return (
      <div style={styles.emptyState}>
        <p style={{ color: 'var(--partidos-text-muted)' }}>
          💾 {isEn ? 'Save the match first to manage the official sheet.' : 'Guarda el partido primero para gestionar el acta oficial.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.emptyState}><p>{isEn ? 'Loading sheet...' : 'Cargando acta...'}</p></div>;
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            📋 {isEn ? 'Official Match Sheet' : 'Acta Oficial'}
            {isClosed && (
              sheet?.closedWithWarnings
                ? <span style={{ ...styles.closedBadge, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderColor: '#F59E0B' }}>⚠️ {isEn ? 'CLOSED WITH WARNINGS' : 'CERRADA CON AVISOS'}</span>
                : <span style={styles.closedBadge}>✅ {isEn ? 'CLOSED' : 'CERRADA'}</span>
            )}
          </h3>
          <p style={styles.subtitle}>
            {isClosed
              ? (isEn ? `Closed by ${sheet?.closedBy ? 'Staff' : '—'}. Official minutes registered.` : `Cerrada por ${sheet?.closedBy ? 'Staff' : '—'}. Minutos oficiales registrados.`)
              : isStartedOrDone
                ? (isEn ? 'Verify actual attendance and player minutes before closing the match sheet.' : 'Verifica la asistencia real y minutos de los jugadores antes de cerrar el acta.')
                : (isEn ? 'Squad planning and pre-match attendance confirmation (RSVP).' : 'Planificación de convocatoria y confirmación de asistencia previa (RSVP).')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            style={{ ...styles.btnSecondary, background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportActaPDF}
            title={isEn ? 'Download official match sheet and complete stats in PDF' : 'Descarga el acta oficial y estadísticas completas en PDF'}
          >
            📄 {isEn ? 'Export PDF' : 'Exportar PDF'}
          </button>
          {!isClosed && (
            <>
              <button style={styles.btnPrimary} onClick={handleSmartPrefill} title={isEn ? 'Calculates real minutes based on substitutions and events' : 'Calcula minutos reales según sustituciones y eventos'}>
                ⚡ {isEn ? 'Smart Autofill' : 'Prellenado inteligente'}
              </button>
              <button
                style={{ ...styles.btnSecondary, background: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B', color: '#F59E0B' }}
                onClick={handleCleanse}
                disabled={cleansingInProgress}
                title={isEn ? 'Cleans duplicate or invalid substitutions from the log' : 'Depura sustituciones duplicadas o imposibles de la bitácora'}
              >
                {cleansingInProgress ? (isEn ? 'Cleaning...' : 'Depurando...') : (isEn ? '🧹 Clean Log' : '🧹 Depurar bitácora')}
              </button>
              <button style={styles.btnSecondary} onClick={handlePrefill}>
                📅 {isEn ? 'Autofill from RSVP' : 'Prellenar desde RSVP'}
              </button>
              <button
                style={{ ...styles.btnClose, opacity: closingInProgress ? 0.7 : 1 }}
                onClick={handleClose}
                disabled={closingInProgress}
              >
                {closingInProgress ? (isEn ? 'Closing...' : 'Cerrando...') : (isEn ? '🔒 CLOSE MATCH SHEET' : '🔒 CERRAR ACTA')}
              </button>
            </>
          )}
          {/* ── CONFIRMAR Y GUARDAR ACTA: siempre visible si hay cambios manuales (acta cerrada) ── */}
          {isClosed && (
            <>
              <button
                style={{
                  minHeight: '48px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4CAF7D, #2E7D52)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '13px',
                  letterSpacing: '0.04em',
                  cursor: closingInProgress ? 'not-allowed' : 'pointer',
                  opacity: closingInProgress ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(76,175,125,0.35)',
                }}
                onClick={() => executeCloseActa(false)}
                disabled={closingInProgress}
                title={t('matchSheet.confirm_save_tooltip')}
              >
                {closingInProgress
                  ? t('matchSheet.saving')
                  : t('matchSheet.confirm_save_btn')}
              </button>
              <button style={styles.btnReopen} onClick={handleReopen}>
                🔓 {isEn ? 'Reopen Match Sheet' : 'Reabrir Acta'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Selector de Vista: Asistencia vs Estadísticas y Gráficas Oficiales ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        margin: '12px 0 16px',
        borderBottom: '1.5px solid var(--partidos-border)',
        paddingBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setSubTab('roster')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: subTab === 'roster' ? '1.5px solid var(--partidos-accent)' : '1px solid var(--partidos-border)',
            background: subTab === 'roster' ? 'rgba(76, 175, 125, 0.18)' : 'transparent',
            color: subTab === 'roster' ? 'var(--partidos-accent)' : 'var(--partidos-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📋 {isEn ? 'Attendance & Minutes' : 'Asistencia & Minutos'} ({convocadosPlayers.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('stats')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            border: subTab === 'stats' ? '1.5px solid var(--partidos-accent)' : '1px solid var(--partidos-border)',
            background: subTab === 'stats' ? 'rgba(76, 175, 125, 0.18)' : 'transparent',
            color: subTab === 'stats' ? 'var(--partidos-accent)' : 'var(--partidos-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📊 {isEn ? 'Official Stats & Charts' : 'Estadísticas & Gráficas Oficiales'} ({effectiveEvents.length})
        </button>
      </div>

      {/* ── Vista 1: Gráficas y Estadísticas Oficiales en Tiempo Real ── */}
      {subTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* Radar Táctico Oficial */}
          <div style={{
            background: 'var(--partidos-card-bg, #FFFFFF)',
            border: '1.5px solid var(--partidos-border, #CBD5E1)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: 'var(--partidos-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🕸️ {isEn ? 'Official Tactical Radar (6 Axes)' : 'Radar Táctico Oficial (6 Ejes Comparativos)'}
            </h4>
            <MatchRadarChart
              events={effectiveEvents}
              homeTeamName={matchData?.local || matchData?.equipoLocal || 'Mi Equipo'}
              awayTeamName={matchData?.visitante || matchData?.equipoVisitante || matchData?.rival || 'Rival'}
            />
          </div>

          {/* Suite Completa de Estadísticas Oficiales (Donas, Comparativa, Mitades, Tablas) */}
          <MatchStatsBlock
            matchData={matchData}
            events={effectiveEvents}
            language={language || 'Español (ES)'}
            showDonuts={true}
            showComparison={true}
            showHalves={true}
            showDetailedTables={true}
          />
        </div>
      )}

      {/* ── Vista 2: Pase de Lista y Asistencia Oficial ── */}
      {subTab === 'roster' && (
        <>
          {/* Mini-strip en vivo con estadísticas clave del partido */}
          {effectiveEvents.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(76, 175, 125, 0.08)',
              border: '1px solid rgba(76, 175, 125, 0.25)',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 800, flexWrap: 'wrap' }}>
                <span>⚽ {isEn ? 'Score:' : 'Marcador:'} <strong style={{ color: '#4CAF7D' }}>{statsOverview.goalsFor}</strong> - <strong style={{ color: '#EF4444' }}>{statsOverview.goalsAgainst}</strong></span>
                <span style={{ color: 'var(--partidos-text-muted)' }}>•</span>
                <span>🎯 {isEn ? 'Shots:' : 'Remates:'} <strong>{statsOverview.shotsTotal}</strong> ({statsOverview.shotsOnTarget} {isEn ? 'on target' : 'a puerta'})</span>
                <span style={{ color: 'var(--partidos-text-muted)' }}>•</span>
                <span>🛡️ {isEn ? 'Recoveries:' : 'Recuperaciones:'} <strong>{statsOverview.recoveries}</strong></span>
                <span style={{ color: 'var(--partidos-text-muted)' }}>•</span>
                <span>⚡ {isEn ? 'Fouls:' : 'Faltas:'} <strong>{statsOverview.fouls}</strong></span>
                <span style={{ color: 'var(--partidos-text-muted)' }}>•</span>
                <span>📊 {isEn ? 'Events:' : 'Eventos:'} <strong style={{ color: '#D4A843' }}>{statsOverview.totalEvents}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('stats')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--partidos-accent)',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isEn ? 'View official charts & radar →' : 'Ver gráficas y radar oficial →'}
              </button>
            </div>
          )}

          {/* ── Resumen de Asistencia / RSVP Bar ─────────────── */}
          {isStartedOrDone ? (
            /* Modo Verificación de Asistencia Real */
            <div style={styles.rsvpBar}>
          <div style={{ ...styles.rsvpBadge, borderColor: '#10B981' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ fontWeight: '700', color: '#10B981' }}>{attendanceCounts.presente}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Present' : 'Presentes'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#EF4444' }}>
            <span style={{ fontSize: '18px' }}>❌</span>
            <span style={{ fontWeight: '700', color: '#EF4444' }}>{attendanceCounts.ausente}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Absent' : 'Ausentes'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#F59E0B' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontWeight: '700', color: '#F59E0B' }}>{attendanceCounts.tarde}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Late' : 'Tarde'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#3B82F6' }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <span style={{ fontWeight: '700', color: '#3B82F6' }}>{attendanceCounts.justificado}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Excused' : 'Justificados'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#A855F7' }}>
            <span style={{ fontSize: '18px' }}>🩺</span>
            <span style={{ fontWeight: '700', color: '#A855F7' }}>{attendanceCounts.lesionado}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Injured' : 'Lesionados'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#6B7280' }}>
            <span style={{ fontSize: '18px' }}>🔘</span>
            <span style={{ fontWeight: '700', color: '#6B7280' }}>{attendanceCounts.sin_registro}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Unregistered' : 'Sin registro'}</span>
          </div>
          {discrepancies.length > 0 && (
            <div style={{ ...styles.rsvpBadge, borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontWeight: '700', color: '#F59E0B' }}>{discrepancies.length}</span>
              <span style={{ fontSize: '11px', color: '#F59E0B' }}>{isEn ? 'Discrepancies' : 'Discrepancias'}</span>
            </div>
          )}
        </div>
      ) : (
        /* Modo Pre-partido RSVP */
        <div style={styles.rsvpBar}>
          <div style={{ ...styles.rsvpBadge, borderColor: '#10B981' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ fontWeight: '700', color: '#10B981' }}>{rsvpCounts.going}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Confirmed' : 'Confirmados'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#EF4444' }}>
            <span style={{ fontSize: '18px' }}>❌</span>
            <span style={{ fontWeight: '700', color: '#EF4444' }}>{rsvpCounts.not_going}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? "Won't attend" : 'No irán'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#F59E0B' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontWeight: '700', color: '#F59E0B' }}>{rsvpCounts.late}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Late' : 'Tarde'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#3B82F6' }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <span style={{ fontWeight: '700', color: '#3B82F6' }}>{rsvpCounts.justificado}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'Excused' : 'Justificados'}</span>
          </div>
          <div style={{ ...styles.rsvpBadge, borderColor: '#6B7280' }}>
            <span style={{ fontSize: '18px' }}>🔘</span>
            <span style={{ fontWeight: '700', color: '#6B7280' }}>{rsvpCounts.noReply}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{isEn ? 'No reply' : 'Sin respuesta'}</span>
          </div>
          {discrepancies.length > 0 && (
            <div style={{ ...styles.rsvpBadge, borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontWeight: '700', color: '#F59E0B' }}>{discrepancies.length}</span>
              <span style={{ fontSize: '11px', color: '#F59E0B' }}>{isEn ? 'Discrepancies' : 'Discrepancias'}</span>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 2fr) 90px 70px minmax(150px, 1.2fr) minmax(130px, 1fr) 30px',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 18px',
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: 'var(--partidos-text-muted)',
          letterSpacing: '0.05em',
          borderBottom: '1.5px solid var(--partidos-border)',
          marginBottom: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div>{isEn ? 'Player' : 'Jugador'}</div>
        <div style={{ textAlign: 'center' }}>{isEn ? 'Role' : 'Rol'}</div>
        <div style={{ textAlign: 'center' }}>RSVP</div>
        <div style={{ textAlign: 'center' }}>{isEn ? 'Official Status' : 'Asistencia Oficial'}</div>
        <div style={{ textAlign: 'right' }}>{isEn ? 'Played Mins' : 'Minutos Reales'}</div>
        <div></div>
      </div>

      {/* ── Player List ───────────────────────────────── */}
      <div style={styles.playerList}>
        {convocadosPlayers.map((player) => {
          const pid = String(player.id);
          const rsvp  = getPlayerRsvp(pid);
          const actual = getPlayerActual(pid);
          const isStarter = initialTitularesSet.has(pid);
          const isSub = initialSuplentesSet.has(pid);
          const hasSubIn = effectiveEvents.some(e =>
            (e.type === 'cambio' || e.type === 'sustitucion') &&
            String(e.subInId || e.jugadorEntraId || e.playerInId || '') === pid
          );
          const hasPlayerEvents = effectiveEvents.some(e =>
            String(e.playerId || e.jugadorId || e.fromPlayerId || '') === pid
          );
          const isActuallyOnField = isStarter || hasSubIn || hasPlayerEvents;

          // Determinación del estado efectivo: si jugó o es titular, NUNCA es ausente
          let status = actual?.status;
          if (isActuallyOnField && (!status || status === 'ausente' || status === 'sin_registro')) {
            status = (actual?.lateMin && actual.lateMin > 0) ? 'tarde' : 'presente';
          } else if (!status) {
            if (isStartedOrDone) {
              if (isStarter || isSub) status = 'presente';
              else if (rsvp?.status) {
                const MAP = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
                status = MAP[rsvp.status] || 'sin_registro';
              } else {
                status = 'sin_registro';
              }
            } else {
              if (rsvp?.status) {
                const MAP = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
                status = MAP[rsvp.status] || 'sin_registro';
              } else if (isStarter || isSub) {
                status = 'presente';
              } else {
                status = 'sin_registro';
              }
            }
          }

          // Cálculo en vivo del motor de minutos con estado y retraso
          const computedMin = calculateMinutesFromEvents(
            pid,
            effectiveEvents,
            initialTitulares,
            initialSuplentes,
            duration,
            actual?.minutesOverride ?? null,
            status,
            actual?.lateMin ?? null,
            matchData?.tarjetasList || []
          );

          const currentStatus = STATUS_OPTIONS.find(s => s.id === status);
          const displayMinutes = (actual?.minutesOverride !== undefined && actual?.minutesOverride !== null)
            ? actual.minutesOverride
            : (computedMin?.minutes !== undefined && computedMin?.minutes !== null
                ? computedMin.minutes
                : (typeof actual?.minutes === 'number' ? actual.minutes : 0));

          const minuteSource = actual?.minuteSource || computedMin.source;
          const isExpanded = expandedPlayer === pid;
          const rsvpInfo = rsvp ? RSVP_LABELS[rsvp.status] : null;

          return (
            <div key={pid} className="acta-player-card" style={{ ...styles.playerCard, ...(isClosed ? styles.playerCardClosed : {}) }}>
              {/* Row principal */}
              <div
                className="acta-player-row"
                style={{ ...styles.playerRow, cursor: 'pointer' }}
                onClick={() => setExpandedPlayer(isExpanded ? null : pid)}
              >
                {/* Avatar + nombre */}
                <div style={styles.playerInfo}>
                  <PlayerAvatar player={player} size={36} />
                  <div>
                    <div style={styles.playerName}>{player.name}</div>
                    <div style={styles.playerMeta}>
                      {isStarter ? (isEn ? '⚽ Starter' : '⚽ Titular') : (isEn ? '🪑 Substitute' : '🪑 Suplente')}
                      {player.number ? ` · #${player.number}` : ''}
                      {(player.position === 'POR' || player.posicion === 'POR') ? ` · 🧤 ${isEn ? 'Goalkeeper' : 'Portero'}` : ''}
                    </div>
                  </div>
                </div>

                {/* Rol */}
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: (player.position === 'POR' || player.posicion === 'POR') ? '#3B82F6' : (isStarter ? 'var(--partidos-accent)' : 'var(--partidos-text-muted)') }}>
                  {(player.position === 'POR' || player.posicion === 'POR')
                    ? (isEn ? '🧤 GK' : '🧤 POR')
                    : (isStarter ? (isEn ? 'Starter' : 'Titular') : (isEn ? 'Sub' : 'Suplente'))}
                </div>

                {/* RSVP previo / Respuesta del jugador */}
                <div style={styles.rsvpCell}>
                  {isStartedOrDone ? (
                    <span
                      title={`RSVP: ${rsvpInfo ? rsvpInfo.label : (isEn ? 'No reply' : 'Sin respuesta')}`}
                      style={{ fontSize: '11px', color: 'var(--partidos-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <span style={{ fontSize: '14px' }}>{rsvpInfo ? rsvpInfo.emoji : '🔘'}</span>
                    </span>
                  ) : (
                    rsvpInfo ? (
                      <span title={`RSVP: ${rsvpInfo.label}`} style={{ fontSize: '18px' }}>{rsvpInfo.emoji}</span>
                    ) : (
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>🔘</span>
                    )
                  )}
                </div>

                {/* Status actual de asistencia */}
                <div style={styles.statusCell}>
                  {currentStatus && currentStatus.id !== 'sin_registro' ? (
                    <span style={{ ...styles.statusChip, background: currentStatus.bg, color: currentStatus.color, border: `1px solid ${currentStatus.color}` }}>
                      {currentStatus.emoji} {currentStatus.label}
                    </span>
                  ) : (
                    <span style={styles.statusChipEmpty}>{isEn ? 'Unregistered' : 'Sin registro'}</span>
                  )}
                </div>

                {/* Minutos jugados — input inline siempre editable */}
                <div style={{ ...styles.minutesCell, flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      max={duration}
                      value={localMinutes[pid] !== undefined
                        ? localMinutes[pid]
                        : (actual?.minutesOverride !== null && actual?.minutesOverride !== undefined
                            ? actual.minutesOverride
                            : (displayMinutes ?? ''))}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setLocalMinutes(prev => ({ ...prev, [pid]: e.target.value }));
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        handleMinutesChange(pid, val);
                        setLocalMinutes(prev => { const n = { ...prev }; delete n[pid]; return n; });
                      }}
                      style={{
                        width: '56px',
                        height: '44px',
                        minHeight: '44px',
                        borderRadius: '6px',
                        border: (actual?.minutesOverride !== null && actual?.minutesOverride !== undefined)
                          ? '2px solid #4CAF7D'
                          : '1.5px solid var(--partidos-border)',
                        background: 'var(--partidos-bg)',
                        color: 'var(--partidos-text)',
                        fontSize: '15px',
                        fontWeight: '700',
                        textAlign: 'center',
                        padding: '0 4px',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--partidos-text-muted)' }}>'</span>
                  </div>
                  <span style={{ fontSize: '10px', color: (actual?.minutesOverride !== null && actual?.minutesOverride !== undefined) ? '#4CAF7D' : 'var(--partidos-text-muted)' }}>
                    {(actual?.minutesOverride !== null && actual?.minutesOverride !== undefined) ? `✏️ ${t('matchSheet.manual_badge')}` : t('matchSheet.auto_badge')}
                  </span>
                </div>

                {/* Expand chevron — siempre visible */}
                <span style={{ fontSize: '16px', color: 'var(--partidos-text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none', textAlign: 'center' }}>›</span>
              </div>

              {/* ── Expanded editor ────────────────────── */}
              {isExpanded && (
                <div style={styles.expandedEditor}>
                  {/* Status buttons */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.editorLabel}>{isEn ? 'Attendance Status' : 'Estado de asistencia'}</div>
                    <div style={styles.statusGrid}>
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleStatusChange(pid, opt.id)}
                          style={{
                            ...styles.statusBtn,
                            background: status === opt.id ? opt.bg : 'transparent',
                            border: `2px solid ${status === opt.id ? opt.color : 'var(--partidos-border)'}`,
                            color: status === opt.id ? opt.color : 'var(--partidos-text-muted)',
                          }}
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minutes override — editable aunque acta esté cerrada */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={styles.editorLabel}>
                        ✏️ {t('matchSheet.manual_override_title')}
                        {isClosed && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#4CAF7D', fontWeight: '700' }}>({t('matchSheet.manual_allowed_closed')})</span>}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        placeholder={`Auto (${computedMin.minutes}')`}
                        value={localMinutes[pid] !== undefined
                          ? localMinutes[pid]
                          : (actual?.minutesOverride !== null && actual?.minutesOverride !== undefined
                              ? actual.minutesOverride
                              : '')}
                        onChange={(e) => setLocalMinutes(prev => ({ ...prev, [pid]: e.target.value }))}
                        onBlur={(e) => {
                          handleMinutesChange(pid, e.target.value);
                          setLocalMinutes(prev => { const n = { ...prev }; delete n[pid]; return n; });
                        }}
                        style={{ ...styles.minutesInput, border: (actual?.minutesOverride !== null && actual?.minutesOverride !== undefined) ? '2px solid #4CAF7D' : undefined }}
                      />
                    </div>
                    <div>
                      <div style={styles.editorLabel}>⭐ {isEn ? 'Tactical Rating (1 - 10)' : 'Calificación Táctica (1 - 10)'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          placeholder="-"
                          defaultValue={actual?.rating ?? matchData?.playerRatings?.[pid] ?? matchData?.ratings?.[pid] ?? ''}
                          onBlur={(e) => handleRatingChange(pid, e.target.value)}
                          style={{ ...styles.minutesInput, width: '70px', textAlign: 'center', fontWeight: '800' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--partidos-text-muted)' }}>/ 10</span>
                      </div>
                    </div>
                    {(actual?.detail || minuteSource) && (
                      <div style={{ fontSize: '12px', color: '#93C5FD', marginTop: '14px', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                        💡 <strong>{isEn ? 'Engine calculation:' : 'Cálculo del motor:'}</strong> {actual?.detail || `${MINUTE_SOURCE_LABEL[minuteSource] || minuteSource} (${computedMin.minutes}')`}
                      </div>
                    )}
                    {/* Discrepancia */}
                    {rsvp && status && (() => {
                      const MAP = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
                      const expected = MAP[rsvp.status];
                      if (expected && status !== expected) {
                        return (
                          <div style={styles.discrepancyChip}>
                            ⚠️ {isEn
                              ? `Discrepancy: Prior RSVP said "${RSVP_LABELS[rsvp.status]?.label}" but you verified "${currentStatus?.label}"`
                              : `Discrepancia: RSVP previo dijo "${RSVP_LABELS[rsvp.status]?.label}" pero verificaste "${currentStatus?.label}"`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {/* Nota Mix FASE 3: Actitud 1-5★ + Nota sugerida */}
                  <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: 'rgba(212, 168, 67, 0.08)', border: '1px solid rgba(212, 168, 67, 0.3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      ★ {isEn ? 'Effort / Attitude (1-5★) — Mixed Formula 60/40' : 'Esfuerzo / Actitud (1-5★) — Fórmula Mixta 60/40'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5].map(star => {
                        const currentAttitude = actual?.attitude || 3;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={async () => {
                              const matchDocRef = (await import('firebase/firestore')).doc;
                              const { db } = await import('../firebaseConfig');
                              const { doc, updateDoc } = await import('firebase/firestore');
                              await updateDoc(doc(db, `${teamPath}/matches`, matchId), {
                                [`actaOficial.actual.${pid}.attitude`]: star,
                              });
                            }}
                            style={{
                              width: '44px', height: '44px', borderRadius: '8px', border: `2px solid ${(actual?.attitude || 3) >= star ? '#D4A843' : 'rgba(212,168,67,0.3)'}`,
                              background: (actual?.attitude || 3) >= star ? 'rgba(212,168,67,0.2)' : 'transparent',
                              fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            {(actual?.attitude || 3) >= star ? '★' : '☆'}
                          </button>
                        );
                      })}
                      <span style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', marginLeft: '4px' }}>
                        ({actual?.attitude || 3}/5)
                      </span>
                    </div>
                    {/* Nota sugerida derivada de eventos */}
                    {(() => {
                      const evts = effectiveEvents || [];
                      const playerRole = player.position || player.posicion || null;
                      const stats = deriveStatsFromEvents(pid, evts, playerRole);
                      const { mixedRating, performanceScore, attitudeScore, suggested } = calcMixedRating(stats, actual?.attitude || 3, actual?.rating);
                      const ratingColor = mixedRating >= 8 ? '#4CAF7D' : mixedRating >= 6.5 ? '#D4A843' : '#EF4444';
                      const isGk = playerRole === 'POR' || stats.isGoalkeeper;
                      return (
                        <>
                          {isGk && (
                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              padding: '8px 12px',
                              marginBottom: '8px',
                              borderRadius: '8px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              fontSize: '11px',
                              color: '#93C5FD'
                            }}>
                              <span>🧤 <strong>{isEn ? 'Saves:' : 'Paradas:'}</strong> {stats.saves || 0}</span>
                              <span>🥅 <strong>{isEn ? 'Conceded:' : 'Encajados:'}</strong> {stats.conceded || 0}</span>
                              <span>🧼 <strong>{isEn ? 'Clean Sheet:' : 'Imbatibilidad:'}</strong> {stats.cleanSheet ? (isEn ? 'Yes' : 'Sí') : 'No'}</span>
                              {(stats.penaltySaves || 0) > 0 && <span>🛡️ <strong>{isEn ? 'Penalties Saved:' : 'Penaltis:'}</strong> {stats.penaltySaves}</span>}
                              {(stats.claims || 0) > 0 && <span>⬆️ <strong>{isEn ? 'Claims:' : 'Salidas:'}</strong> {stats.claims}</span>}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>
                              📊 {isEn ? (isGk ? 'GK Performance:' : 'Performance:') : (isGk ? 'Rendimiento Portero:' : 'Rendimiento:')} <strong style={{ color: '#4CAF7D' }}>{performanceScore}</strong>
                              &nbsp;&nbsp;★ {isEn ? 'Attitude:' : 'Actitud:'} <strong style={{ color: '#D4A843' }}>{attitudeScore}</strong>
                              &nbsp;&nbsp;→ {isEn ? 'Suggested:' : 'Sugerida:'} <strong style={{ color: ratingColor, fontSize: '14px' }}>{suggested}</strong>
                            </div>
                            {actual?.rating && (
                              <div style={{ fontSize: '11px', color: '#93C5FD' }}>
                                ✏️ {isEn ? "Coach's Rating:" : 'Nota Míster:'} <strong>{parseFloat(actual.rating).toFixed(1)}</strong> (override)
                              </div>
                            )}
                            <div style={{ fontSize: '10px', color: 'var(--partidos-text-muted)', width: '100%', marginTop: '4px' }}>
                              {isEn
                                ? `Formula: 60% performance (${performanceScore}) + 40% attitude (${attitudeScore}) = `
                                : `Fórmula: 60% rendimiento (${performanceScore}) + 40% actitud (${attitudeScore}) = `}<strong style={{ color: ratingColor }}>{mixedRating}</strong>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Resumen del acta cerrada ──────────────────── */}
      {isClosed && (
        <div style={styles.summaryBox}>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase' }}>
            ✅ {isEn ? 'Official Match Sheet Summary' : 'Resumen Oficial del Acta'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', width: '100%' }}>
            {convocadosPlayers.map(player => {
              const pid = String(player.id);
              const actual = getPlayerActual(pid);
              if (!actual) return null;
              const status = actual.status || 'sin_registro';
              const statusInfo = STATUS_OPTIONS.find(s => s.id === status);

              const computedMin = calculateMinutesFromEvents(
                pid,
                effectiveEvents,
                initialTitulares,
                initialSuplentes,
                duration,
                actual?.minutesOverride ?? null,
                status,
                actual?.lateMin ?? null,
                matchData?.tarjetasList || []
              );

              const minVal = (actual?.minutesOverride !== undefined && actual?.minutesOverride !== null)
                ? actual.minutesOverride
                : (computedMin?.minutes !== undefined && computedMin?.minutes !== null
                    ? computedMin.minutes
                    : (typeof actual?.minutes === 'number' ? actual.minutes : 0));

              return (
                <div key={pid} style={styles.summaryCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <PlayerAvatar player={player} size={28} />
                    <div style={{ fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: statusInfo?.color || 'var(--partidos-text-muted)' }}>
                      {statusInfo?.emoji} {statusInfo?.label || actual.status}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--partidos-accent)' }}>
                      {minVal}'
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Estadísticas Oficiales del Encuentro (Suite en Vivo) ── */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800', color: 'var(--partidos-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 {isEn ? 'Official Match Statistics' : 'Estadísticas Oficiales del Encuentro'}
        </h4>
        <MatchStatsBlock
          matchData={matchData}
          events={effectiveEvents}
          language={language || (isEn ? 'English (EN)' : 'Español (ES)')}
          showDonuts={true}
          showComparison={true}
          showHalves={true}
          showDetailedTables={true}
        />
      </div>
      </>
      )}

      {/* ── Modal de Advertencias de Coherencia al Cerrar ── */}
      {showWarningsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--partidos-card-bg, #1B3A2D)',
            border: '2px solid #F59E0B',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '17px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ {isEn ? 'Divergences Detected before Closing' : 'Divergencias Detectadas antes de Cerrar'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--partidos-text-primary)', marginBottom: '16px', lineHeight: 1.4 }}>
              {isEn
                ? 'The following discrepancies were detected in the official match sheet or log:'
                : 'Se han detectado las siguientes incongruencias en el acta oficial o en la bitácora del partido:'}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {warningsList.map((warn, i) => {
                const msg = typeof warn === 'string' ? warn : warn.message;
                const tab = typeof warn === 'object' ? warn.tabTarget : null;

                return (
                  <div key={i} style={{ fontSize: '12px', color: '#FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                      <span>⚠️</span>
                      <span style={{ lineHeight: 1.35 }}>{msg}</span>
                    </div>
                    {tab && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowWarningsModal(false);
                          onNavigateTab(tab);
                        }}
                        style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid #F59E0B',
                          color: '#FCD34D',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🔍 {isEn ? `Fix in ${tab}` : `Corregir en ${tab}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  await handleSmartPrefill();
                  setShowWarningsModal(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #3B82F6',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#93C5FD',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ⚡ {isEn ? 'Recalculate with events' : 'Recalcular con eventos'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowWarningsModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--partidos-border)',
                    background: 'transparent',
                    color: 'var(--partidos-text-primary)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                >
                  {isEn ? 'Review' : 'Revisar'}
                </button>
                <button
                  type="button"
                  onClick={() => executeCloseActa(true)}
                  disabled={closingInProgress}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#F59E0B',
                    color: '#000000',
                    fontWeight: '800',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                >
                  {closingInProgress ? (isEn ? 'Closing...' : 'Cerrando...') : (isEn ? '⚠️ Close with warnings' : '⚠️ Cerrar con avisos')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles (inline para evitar dependencias de CSS extra)
// ─────────────────────────────────────────────────────────────
const styles = {
  container: {
    width: '100%',
    maxWidth: 'none',
    padding: '0 0 20px',
    margin: '0',
    fontFamily: 'var(--font-body, system-ui)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    width: '100%',
    padding: '0 2px',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 4px',
    color: 'var(--partidos-text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closedBadge: {
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '20px',
    background: 'rgba(16,185,129,0.15)',
    color: '#10B981',
    border: '1px solid #10B981',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--partidos-text-muted)',
    margin: 0,
  },
  btnPrimary: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#1565C0',
    color: '#FFFFFF',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '44px',
    boxShadow: '0 4px 10px rgba(21, 101, 192, 0.3)',
    transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid var(--partidos-border)',
    background: 'transparent',
    color: 'var(--partidos-text-primary)',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '44px',
    transition: 'all 0.2s',
  },
  btnClose: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#2E7D5C',
    color: '#FFFFFF',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '44px',
    textTransform: 'uppercase',
    boxShadow: '0 4px 10px rgba(46,125,92,0.3)',
    transition: 'all 0.2s',
  },
  btnReopen: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #EF4444',
    background: 'rgba(239,68,68,0.08)',
    color: '#EF4444',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '44px',
    transition: 'all 0.2s',
  },
  rsvpBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
    width: '100%',
    marginBottom: '20px',
  },
  rsvpBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid',
    background: 'var(--partidos-player-card-bg)',
    minWidth: '0',
    textAlign: 'center',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    marginBottom: '24px',
    boxSizing: 'border-box',
  },
  playerCard: {
    background: 'var(--partidos-player-card-bg)',
    borderRadius: '12px',
    border: '1px solid var(--partidos-border)',
    overflow: 'hidden',
    transition: 'all 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  playerCardClosed: {
    opacity: 0.95,
    cursor: 'default',
  },
  playerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 2fr) 90px 70px minmax(150px, 1.2fr) minmax(130px, 1fr) 30px',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  playerName: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--partidos-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  playerMeta: {
    fontSize: '11px',
    color: 'var(--partidos-text-muted)',
    marginTop: '2px',
  },
  rsvpCell: {
    textAlign: 'center',
  },
  statusCell: {
    textAlign: 'center',
  },
  statusChip: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  },
  statusChipEmpty: {
    fontSize: '11px',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  minutesCell: {
    textAlign: 'right',
    lineHeight: '1.2',
  },
  minutesValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--partidos-accent)',
    display: 'block',
  },
  minuteSourceLabel: {
    fontSize: '10px',
    color: 'var(--partidos-text-muted)',
    display: 'block',
    marginTop: '2px',
  },
  expandedEditor: {
    padding: '16px 20px',
    borderTop: '1px solid var(--partidos-border)',
    background: 'rgba(0,0,0,0.04)',
    width: '100%',
    boxSizing: 'border-box',
  },
  editorLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--partidos-text-muted)',
    marginBottom: '8px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '8px',
    width: '100%',
  },
  statusBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s',
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  minutesInput: {
    width: '120px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--partidos-border)',
    background: 'var(--partidos-input-bg, #1B3A2D)',
    color: 'var(--partidos-text-primary)',
    fontSize: '14px',
    fontWeight: '700',
    outline: 'none',
  },
  discrepancyChip: {
    fontSize: '11px',
    color: '#F59E0B',
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    padding: '6px 12px',
    borderRadius: '6px',
    marginTop: '12px',
  },
  summaryBox: {
    background: 'rgba(16,185,129,0.07)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  summaryCard: {
    background: 'var(--partidos-player-card-bg)',
    borderRadius: '8px',
    padding: '12px 14px',
    border: '1px solid var(--partidos-border)',
    boxSizing: 'border-box',
  },
  emptyState: {
    padding: '40px 24px',
    textAlign: 'center',
    width: '100%',
  },
};

export default ActaOficialPanel;
