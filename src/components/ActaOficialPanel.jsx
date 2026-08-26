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

const RSVP_LABELS = {
  going:       { label: 'Irá',            emoji: '✅', color: '#10B981' },
  not_going:   { label: 'No irá',         emoji: '❌', color: '#EF4444' },
  late:        { label: 'Llegará tarde',  emoji: '⚠️', color: '#F59E0B' },
  justified:   { label: 'Justificado',    emoji: '📋', color: '#3B82F6' },
};

const STATUS_OPTIONS = [
  { id: 'presente',           label: 'Presente',   emoji: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  { id: 'ausente',            label: 'Ausente',    emoji: '❌', color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  { id: 'tarde',              label: 'Tarde',      emoji: '⚠️', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  { id: 'justificado',        label: 'Justificado',emoji: '📋', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'lesionado',          label: 'Lesionado',  emoji: '🤕', color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
];

const MINUTE_SOURCE_LABEL = {
  override:       '✏️ Manual',
  titular_full:   '⚽ Titular completo',
  titular_subout: '🔄 Sustituido',
  sub_in:         '🔄 Entró',
  dnp:            '🪑 No entró',
  not_called:     '—',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const ActaOficialPanel = ({ matchId, matchData, players = [], calledPlayers = [] }) => {
  const { user, getTeamPath } = useAuth();
  const { activeTeam } = useTeams();
  const activeTeamId = activeTeam?.id || null;

  const teamPath = activeTeamId ? getTeamPath(activeTeamId) : '';

  const {
    sheet,
    loading,
    isClosed,
    getPlayerActual,
    getPlayerRsvp,
    getDiscrepancies,
    prefillFromRsvp,
    updatePlayerStatus,
    updateMinutesOverride,
    closeMatchSheet,
    reopenMatchSheet,
  } = useMatchSheet(teamPath, matchId, matchData, players);

  const [closingInProgress, setClosingInProgress] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  // Jugadores del acta: convocados (titulares + suplentes)
  const convocadosIds = useMemo(() => {
    const titulares = Array.isArray(matchData?.titulares) ? matchData.titulares : [];
    const suplentes = Array.isArray(matchData?.suplentes) ? matchData.suplentes : [];
    const allCalled = [...new Set([...calledPlayers, ...titulares, ...suplentes])].filter(Boolean);
    return allCalled;
  }, [calledPlayers, matchData?.titulares, matchData?.suplentes]);

  const convocadosPlayers = useMemo(() =>
    convocadosIds
      .map(id => players.find(p => String(p.id) === String(id)))
      .filter(Boolean),
    [convocadosIds, players]
  );

  const titularesSet = useMemo(() => new Set(
    (Array.isArray(matchData?.titulares) ? matchData.titulares : []).map(String)
  ), [matchData?.titulares]);

  // Contadores RSVP
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

  const discrepancies = useMemo(() => getDiscrepancies(), [sheet]);
  const duration = parseInt(matchData?.duration || 90, 10);

  // ── Handlers ─────────────────────────────────────────────
  const handlePrefill = async () => {
    try { await prefillFromRsvp(); }
    catch { /* toast handled in hook */ }
  };

  const handleStatusChange = async (pid, status) => {
    try { await updatePlayerStatus(pid, status); }
    catch { /* toast handled in hook */ }
  };

  const handleMinutesChange = async (pid, val) => {
    const parsed = val === '' ? null : parseInt(val, 10);
    if (val !== '' && isNaN(parsed)) return;
    try { await updateMinutesOverride(pid, val === '' ? null : parsed); }
    catch { /* toast handled in hook */ }
  };

  const handleClose = async () => {
    if (!window.confirm('¿Cerrar el acta? Los minutos quedarán registrados de forma oficial y no podrán modificarse sin reabrirla.')) return;
    setClosingInProgress(true);
    try { await closeMatchSheet(); }
    finally { setClosingInProgress(false); }
  };

  const handleReopen = async () => {
    if (!window.confirm('¿Reabrir el acta? El acta volverá a ser editable. Los minutos quedarán en estado "borrador".')) return;
    try { await reopenMatchSheet(); }
    catch { /* handled in hook */ }
  };

  if (!matchId) {
    return (
      <div style={styles.emptyState}>
        <p style={{ color: 'var(--partidos-text-muted)' }}>
          💾 Guarda el partido primero para gestionar el acta oficial.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.emptyState}><p>Cargando acta...</p></div>;
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            📋 Acta Oficial
            {isClosed && <span style={styles.closedBadge}>✅ CERRADA</span>}
          </h3>
          <p style={styles.subtitle}>
            {isClosed
              ? `Cerrada por ${sheet?.closedBy ? 'Staff' : '—'}. Minutos oficiales registrados.`
              : 'Verifica la asistencia y los minutos antes de cerrar el acta.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isClosed && (
            <>
              <button style={styles.btnSecondary} onClick={handlePrefill}>
                ⚡ Prellenar desde RSVP
              </button>
              <button
                style={{ ...styles.btnClose, opacity: closingInProgress ? 0.7 : 1 }}
                onClick={handleClose}
                disabled={closingInProgress}
              >
                {closingInProgress ? 'Cerrando...' : '🔒 CERRAR ACTA'}
              </button>
            </>
          )}
          {isClosed && (
            <button style={styles.btnReopen} onClick={handleReopen}>
              🔓 Reabrir Acta
            </button>
          )}
        </div>
      </div>

      {/* ── RSVP Summary bar ─────────────────────────── */}
      <div style={styles.rsvpBar}>
        {Object.entries(RSVP_LABELS).map(([key, info]) => (
          <div key={key} style={{ ...styles.rsvpBadge, borderColor: info.color }}>
            <span style={{ fontSize: '18px' }}>{info.emoji}</span>
            <span style={{ fontWeight: '700', color: info.color }}>{rsvpCounts[key]}</span>
            <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>{info.label}</span>
          </div>
        ))}
        <div style={{ ...styles.rsvpBadge, borderColor: '#6B7280' }}>
          <span style={{ fontSize: '18px' }}>🔘</span>
          <span style={{ fontWeight: '700', color: '#6B7280' }}>{rsvpCounts.noReply}</span>
          <span style={{ fontSize: '11px', color: 'var(--partidos-text-muted)' }}>Sin respuesta</span>
        </div>
        {discrepancies.length > 0 && (
          <div style={{ ...styles.rsvpBadge, borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontWeight: '700', color: '#F59E0B' }}>{discrepancies.length}</span>
            <span style={{ fontSize: '11px', color: '#F59E0B' }}>Discrepancias</span>
          </div>
        )}
      </div>

      {/* ── Player List ───────────────────────────────── */}
      <div style={styles.playerList}>
        {convocadosPlayers.map((player) => {
          const pid = String(player.id);
          const rsvp  = getPlayerRsvp(pid);
          const actual = getPlayerActual(pid);
          const isStarter = titularesSet.has(pid);
          const status = actual?.status || null;
          const currentStatus = STATUS_OPTIONS.find(s => s.id === status);
          const minuteSource = actual?.minuteSource;
          const minutesDisplay = actual?.minutes ?? '—';
          const isExpanded = expandedPlayer === pid;
          const rsvpInfo = rsvp ? RSVP_LABELS[rsvp.status] : null;

          return (
            <div key={pid} style={{ ...styles.playerCard, ...(isClosed ? styles.playerCardClosed : {}) }}>
              {/* Row principal */}
              <div
                style={styles.playerRow}
                onClick={() => !isClosed && setExpandedPlayer(isExpanded ? null : pid)}
              >
                {/* Avatar + nombre */}
                <div style={styles.playerInfo}>
                  <div style={{ ...styles.avatarCircle, background: isStarter ? '#2E7D5C' : '#1B3A2D' }}>
                    {player.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={styles.playerName}>{player.name}</div>
                    <div style={styles.playerMeta}>
                      {isStarter ? '⚽ Titular' : '🪑 Suplente'}
                      {player.number ? ` · #${player.number}` : ''}
                    </div>
                  </div>
                </div>

                {/* RSVP del jugador */}
                <div style={styles.rsvpCell}>
                  {rsvpInfo ? (
                    <span title={`RSVP: ${rsvpInfo.label}`} style={{ fontSize: '18px' }}>{rsvpInfo.emoji}</span>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>🔘</span>
                  )}
                </div>

                {/* Status actual (míster) */}
                <div style={styles.statusCell}>
                  {currentStatus ? (
                    <span style={{ ...styles.statusChip, background: currentStatus.bg, color: currentStatus.color, border: `1px solid ${currentStatus.color}` }}>
                      {currentStatus.emoji} {currentStatus.label}
                    </span>
                  ) : (
                    <span style={styles.statusChipEmpty}>Sin asignar</span>
                  )}
                </div>

                {/* Minutos */}
                <div style={styles.minutesCell}>
                  <span style={styles.minutesValue}>
                    {isClosed && minutesDisplay !== '—' ? `${minutesDisplay}'` : (actual ? `${minutesDisplay}'` : '—')}
                  </span>
                  {minuteSource && (
                    <span style={styles.minuteSourceLabel}>
                      {MINUTE_SOURCE_LABEL[minuteSource] || minuteSource}
                    </span>
                  )}
                </div>

                {/* Expand chevron */}
                {!isClosed && (
                  <span style={{ fontSize: '16px', color: 'var(--partidos-text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>›</span>
                )}
              </div>

              {/* ── Expanded editor ────────────────────── */}
              {isExpanded && !isClosed && (
                <div style={styles.expandedEditor}>
                  {/* Status buttons */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.editorLabel}>Estado de asistencia</div>
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

                  {/* Minutes override */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={styles.editorLabel}>Override de minutos (opcional)</div>
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        placeholder={`Auto (max ${duration})`}
                        defaultValue={actual?.minutesOverride ?? ''}
                        onBlur={(e) => handleMinutesChange(pid, e.target.value)}
                        style={styles.minutesInput}
                      />
                    </div>
                    {minuteSource && (
                      <div style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', marginTop: '18px' }}>
                        Motor: {MINUTE_SOURCE_LABEL[minuteSource] || minuteSource}
                      </div>
                    )}
                    {/* Discrepancia */}
                    {rsvp && actual?.status && (() => {
                      const MAP = { going: 'presente', not_going: 'ausente', late: 'tarde', justified: 'justificado' };
                      const expected = MAP[rsvp.status];
                      if (expected && actual.status !== expected) {
                        return (
                          <div style={styles.discrepancyChip}>
                            ⚠️ Discrepancia: RSVP dijo "{RSVP_LABELS[rsvp.status]?.label}" pero marcaste "{currentStatus?.label}"
                          </div>
                        );
                      }
                      return null;
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
            ✅ Resumen Oficial del Acta
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {convocadosPlayers.map(player => {
              const pid = String(player.id);
              const actual = getPlayerActual(pid);
              if (!actual) return null;
              const statusInfo = STATUS_OPTIONS.find(s => s.id === actual.status);
              return (
                <div key={pid} style={styles.summaryCard}>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{player.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: statusInfo?.color || 'var(--partidos-text-muted)' }}>
                      {statusInfo?.emoji} {statusInfo?.label || actual.status}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--partidos-accent)' }}>
                      {actual.minutes ?? '—'}'
                    </span>
                  </div>
                </div>
              );
            })}
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
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'var(--font-body, system-ui)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
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
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  rsvpBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid',
    background: 'var(--partidos-player-card-bg)',
    minWidth: '64px',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  playerCard: {
    background: 'var(--partidos-player-card-bg)',
    borderRadius: '12px',
    border: '1px solid var(--partidos-border)',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  playerCardClosed: {
    opacity: 0.85,
    cursor: 'default',
  },
  playerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 40px minmax(110px,auto) 80px 20px',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '14px',
    flexShrink: 0,
  },
  playerName: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--partidos-text-primary)',
  },
  playerMeta: {
    fontSize: '11px',
    color: 'var(--partidos-text-muted)',
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
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block',
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
  },
  expandedEditor: {
    padding: '12px 16px',
    borderTop: '1px solid var(--partidos-border)',
    background: 'rgba(0,0,0,0.06)',
  },
  editorLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--partidos-text-muted)',
    marginBottom: '6px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))',
    gap: '6px',
  },
  statusBtn: {
    padding: '8px 10px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s',
    minHeight: '40px',
  },
  minutesInput: {
    width: '100px',
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
    padding: '4px 10px',
    borderRadius: '6px',
    marginTop: '18px',
  },
  summaryBox: {
    background: 'rgba(16,185,129,0.07)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '8px',
  },
  summaryCard: {
    background: 'var(--partidos-player-card-bg)',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid var(--partidos-border)',
  },
  emptyState: {
    padding: '40px 24px',
    textAlign: 'center',
  },
};

export default ActaOficialPanel;
