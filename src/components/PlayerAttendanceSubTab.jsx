import React from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const STATUS_TAGS = {
  present:   { label: 'Presente',   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', icon: '✅' },
  absent:    { label: 'Ausente',    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '❌' },
  justified: { label: 'Justificada',color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', icon: '📝' },
  late:      { label: 'Tarde',      color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '⏱️' },
  injured:   { label: 'Lesionado',  color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: '🚑' },
};

export const PlayerAttendanceSubTab = ({ playerId, teamId }) => {
  const { activeTeam, currentTeamId } = useAuth();
  const effectiveTeamId = teamId || activeTeam?.id || currentTeamId;
  const { t, isEn, formatDate } = useTranslation();

  const STATUS_TAGS = {
    present:   { label: t('common.present'),   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', icon: '✅' },
    absent:    { label: t('common.absent'),    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '❌' },
    justified: { label: t('common.excused'),   color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', icon: '📝' },
    late:      { label: isEn ? 'Late' : 'Tarde', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '⏱️' },
    injured:   { label: t('common.injured'),   color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: '🚑' },
  };

  const { getPlayerStats, loading } = useAttendance(effectiveTeamId);
  const stats = (typeof getPlayerStats === 'function' ? getPlayerStats(playerId) : null) || {
    pct: 100,
    streak: 0,
    present: 0,
    absent: 0,
    justified: 0,
    late: 0,
    injured: 0,
    total: 0,
    history: []
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>{isEn ? 'Loading attendance...' : 'Cargando asistencia...'}</div>;
  }

  const isAtRisk = stats.pct < 70;

  return (
    <div className="player-attendance-subtab" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tarjeta Resumen % y Racha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          style={{
            background: isAtRisk ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-app)',
            border: `1.5px solid ${isAtRisk ? '#EF4444' : 'var(--border-color)'}`,
            padding: '14px',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {t('player.attendance.rate')}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: isAtRisk ? '#EF4444' : '#22C55E', margin: '4px 0' }}>
            {stats.pct}%
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {isAtRisk ? (isEn ? '⚠️ Below 70%' : '⚠️ Bajo el 70%') : (isEn ? '✓ Optimal' : '✓ Óptimo')}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-app)',
            border: '1.5px solid var(--border-color)',
            padding: '14px',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            🔥 {t('player.home.streak')}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-gold)', margin: '4px 0' }}>
            {stats.streak}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {stats.streak === 1 ? t('player.home.streakSession', { count: stats.streak }) : t('player.home.streakSessions', { count: stats.streak })}
          </div>
        </div>
      </div>

      {/* Desglose de Contadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid #22C55E' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#22C55E' }}>{stats.present}</div>
          <div style={{ fontSize: '9px', color: '#22C55E', fontWeight: '700' }}>{isEn ? 'Pres.' : 'Pres.'}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid #EF4444' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#EF4444' }}>{stats.absent}</div>
          <div style={{ fontSize: '9px', color: '#EF4444', fontWeight: '700' }}>{isEn ? 'Abs.' : 'Aus.'}</div>
        </div>
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid #EAB308' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#EAB308' }}>{stats.justified}</div>
          <div style={{ fontSize: '9px', color: '#EAB308', fontWeight: '700' }}>{isEn ? 'Exc.' : 'Just.'}</div>
        </div>
        <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid #F97316' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#F97316' }}>{stats.late}</div>
          <div style={{ fontSize: '9px', color: '#F97316', fontWeight: '700' }}>{isEn ? 'Late' : 'Tard.'}</div>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px 4px', borderRadius: '8px', border: '1px solid #3B82F6' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#3B82F6' }}>{stats.injured}</div>
          <div style={{ fontSize: '9px', color: '#3B82F6', fontWeight: '700' }}>{isEn ? 'Inj.' : 'Les.'}</div>
        </div>
      </div>

      {/* Historial Cronológico de Sesiones */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
          📜 {t('player.attendance.monthlyTitle')}
        </div>

        {stats.history.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px' }}>
            {isEn ? 'No attendance records logged for this player yet.' : 'No hay asistencias registradas aún para este jugador.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {stats.history.map((h, i) => {
              const tag = STATUS_TAGS[h.status] || STATUS_TAGS.present;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{h.sessionTitle}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{h.date ? formatDate(h.date) : ''}</div>
                  </div>

                  <span
                    style={{
                      background: tag.bg,
                      color: tag.color,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '800',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}{h.status === 'late' && h.lateMinutes ? ` (${h.lateMinutes}m)` : ''}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
