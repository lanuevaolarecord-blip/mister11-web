import React, { useState, useEffect } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { generateAttendancePdfReport } from '../utils/attendancePdfReport';
import { calculateAllPlayerMinutes } from '../utils/minutesEngine';
import { calculateSquadAveragePct } from '../utils/attendanceMath';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const STATUS_CONFIG = {
  present:   { label: 'Presente',   labelEn: 'Present',   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', border: '#22C55E', icon: '✅' },
  absent:    { label: 'Ausente',    labelEn: 'Absent',    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: '#EF4444', icon: '❌' },
  justified: { label: 'Justificada',labelEn: 'Justified', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: '#EAB308', icon: '📝' },
  late:      { label: 'Tarde',      labelEn: 'Late',      color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: '#F97316', icon: '⏱️' },
  injured:   { label: 'Lesionado',  labelEn: 'Injured',   color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: '#3B82F6', icon: '🚑' },
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
};

export const TeamAttendanceTab = ({ players = [], activeTeam = null }) => {
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { t, language } = useTranslation();
  const isEn = language === 'en' || language === 'English (EN)';

  const {
    attendanceRecords,
    loading: loadingAttendance,
    saveAttendance,
    getTeamSquadStats,
    getAttendanceTrend
  } = useAttendance(activeTeamId);

  const { sessions } = useSessions(activeTeamId);
  const { matches } = useMatches(activeTeamId);

  const [activeSubView, setActiveSubView] = useState('register'); // 'register' | 'summary' | 'chart'
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSessionTitle, setSelectedSessionTitle] = useState('');
  const [selectedSessionDate, setSelectedSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionType, setSelectedSessionType] = useState('session'); // 'session' | 'match' | 'custom'

  // Map { playerId: { status: 'present'|'absent'|'justified'|'late'|'injured', lateMinutes: 0 } }
  const [recordsMap, setRecordsMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [sortOrder, setSortOrder] = useState('pct-desc');

  // Opciones combinadas para registrar asistencia (Sesiones + Partidos)
  const availableEvents = [
    ...(sessions || []).map((s) => ({
      id: `session_${s.id}`,
      rawId: s.id,
      title: `⚽ [Sesión] ${s.title || 'Entrenamiento'}`,
      date: s.date || new Date().toISOString().split('T')[0],
      type: 'session'
    })),
    ...(matches || []).map((m) => ({
      id: `match_${m.id}`,
      rawId: m.id,
      title: `🏆 [Partido] vs ${m.rival || m.opponent || 'Rival'}`,
      date: m.date || new Date().toISOString().split('T')[0],
      type: 'match'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedMatch = selectedSessionType === 'match'
    ? (matches || []).find((m) => `match_${m.id}` === selectedSessionId || m.id === selectedSessionId || `match_${m.id}` === selectedSessionId)
    : null;
  const isMatchActaClosed = selectedMatch?.actaOficial?.closed === true;

  // Inicializar selector con el evento más reciente si existe
  useEffect(() => {
    if (!selectedSessionId && availableEvents.length > 0) {
      const first = availableEvents[0];
      setSelectedSessionId(first.id);
      setSelectedSessionTitle(first.title);
      setSelectedSessionDate(first.date);
      setSelectedSessionType(first.type);
    }
  }, [availableEvents.length]);

  // Cargar registro existente de Firestore cuando cambia el evento seleccionado
  useEffect(() => {
    if (!selectedSessionId) return;

    const existingRecord = attendanceRecords.find(
      (r) => r.sessionId === selectedSessionId || r.id === selectedSessionId
    );

    if (existingRecord && existingRecord.records && Object.keys(existingRecord.records).length > 0) {
      setRecordsMap(existingRecord.records);
      if (existingRecord.date) setSelectedSessionDate(existingRecord.date);
      if (existingRecord.sessionTitle) setSelectedSessionTitle(existingRecord.sessionTitle);
    } else if (selectedMatch && selectedMatch.actaOficial?.actual && Object.keys(selectedMatch.actaOficial.actual).length > 0) {
      // Cargar desde acta oficial del partido
      const STATUS_FROM_ACTA = {
        presente: 'present',
        tarde: 'late',
        justificado: 'justified',
        ausente: 'absent',
        lesionado: 'injured'
      };
      const mapFromActa = {};
      Object.entries(selectedMatch.actaOficial.actual).forEach(([pid, d]) => {
        mapFromActa[pid] = {
          status: STATUS_FROM_ACTA[d.status] || d.status || 'present',
          lateMinutes: d.lateMin || 0
        };
      });
      setRecordsMap(mapFromActa);
      if (selectedMatch.date) setSelectedSessionDate(selectedMatch.date);
      if (selectedMatch.rival) setSelectedSessionTitle(`🏆 [Partido] vs ${selectedMatch.rival}`);
    } else {
      // Default: todos presentes si no hay registro previo
      const defaultMap = {};
      (players || []).forEach((p) => {
        defaultMap[p.id] = {
          status: p.currentStatus === 'injured' ? 'injured' : 'present',
          lateMinutes: 0
        };
      });
      setRecordsMap(defaultMap);
    }
  }, [selectedSessionId, attendanceRecords, players, selectedMatch]);

  const handleSelectEvent = (eventId) => {
    if (!eventId) return;
    if (eventId === 'custom_new') {
      const newId = `custom_${Date.now()}`;
      setSelectedSessionId(newId);
      setSelectedSessionTitle(isEn ? 'Extra Session' : 'Sesión Extra');
      setSelectedSessionDate(new Date().toISOString().split('T')[0]);
      setSelectedSessionType('custom');
      return;
    }

    const found = availableEvents.find((e) => e.id === eventId);
    if (found) {
      setSelectedSessionId(found.id);
      setSelectedSessionTitle(found.title);
      setSelectedSessionDate(found.date);
      setSelectedSessionType(found.type);
    }
  };

  const setPlayerStatus = (playerId, status) => {
    setRecordsMap((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        status
      }
    }));
  };

  const setPlayerLateMinutes = (playerId, minutes) => {
    setRecordsMap((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        lateMinutes: Number(minutes) || 0
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const newMap = {};
    (players || []).forEach((p) => {
      newMap[p.id] = {
        status: p.currentStatus === 'injured' ? 'injured' : 'present',
        lateMinutes: 0
      };
    });
    setRecordsMap(newMap);
    showToast(isEn ? 'All players marked as Present' : 'Todos los jugadores marcados como Presentes', 'info');
  };

  const handleSaveCurrentAttendance = async () => {
    if (!selectedSessionId) {
      showToast(isEn ? 'Select a session first' : 'Selecciona una sesión primero', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await saveAttendance(selectedSessionId, {
        sessionTitle: selectedSessionTitle,
        date: selectedSessionDate,
        type: selectedSessionType,
        records: recordsMap
      });
      showToast(isEn ? 'Attendance recorded successfully' : 'Asistencia registrada con éxito', 'success');
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast(err.message || (isEn ? 'Error saving attendance' : 'Error al guardar asistencia'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndCloseMatchActa = async () => {
    if (!selectedMatch) return;
    setIsSaving(true);
    try {
      // 1. Guardar asistencia
      await saveAttendance(selectedSessionId, {
        sessionTitle: selectedSessionTitle,
        date: selectedSessionDate,
        type: 'match',
        records: recordsMap
      });

      // 2. Calcular minutos reales con el motor de minutos
      const duration = parseInt(selectedMatch.duration || selectedMatch.duracion || 90, 10);
      const overrides = {};
      Object.entries(selectedMatch.actaOficial?.actual || {}).forEach(([pid, d]) => {
        if (d.minutesOverride !== undefined && d.minutesOverride !== null) {
          overrides[pid] = d.minutesOverride;
        }
      });

      const minutesMap = calculateAllPlayerMinutes(selectedMatch, overrides);

      const STATUS_TO_ACTA = {
        present: 'presente',
        late: 'tarde',
        justified: 'justificado',
        absent: 'ausente',
        injured: 'lesionado'
      };

      const finalActual = { ...(selectedMatch.actaOficial?.actual || {}) };

      // Aplicar estados actuales de recordsMap
      Object.entries(recordsMap).forEach(([pid, r]) => {
        const existing = finalActual[pid] || {};
        const minData = minutesMap[pid] || { minutes: 0, source: 'dnp' };
        finalActual[pid] = {
          ...existing,
          status: STATUS_TO_ACTA[r.status] || r.status || 'presente',
          lateMin: r.lateMinutes || null,
          minutes: minData.minutes,
          minuteSource: minData.source,
          at: new Date().toISOString(),
          by: user.uid
        };
      });

      // Asegurar todos los convocados
      Object.entries(minutesMap).forEach(([pid, { minutes, source }]) => {
        if (!finalActual[pid]) {
          finalActual[pid] = {
            status: source === 'not_called' ? 'ausente' : (source === 'dnp' ? 'convocado_no_jugó' : 'presente'),
            minutes,
            minuteSource: source,
            at: new Date().toISOString(),
            by: user.uid
          };
        }
      });

      const path = getTeamPath(activeTeamId);
      const matchDocRef = doc(db, `${path}/matches`, selectedMatch.id);
      await updateDoc(matchDocRef, {
        'actaOficial.actual': finalActual,
        'actaOficial.closed': true,
        'actaOficial.closedAt': serverTimestamp(),
        'actaOficial.closedBy': user.uid,
        'actaOficial.closedByName': user.displayName || 'Staff',
        'actaOficial.totalDuration': duration
      });

      showToast(isEn ? 'Match sheet closed and minutes saved' : 'Acta oficial cerrada y minutos reales guardados', 'success');
    } catch (err) {
      console.error('Error cerrando acta:', err);
      showToast(isEn ? 'Error closing match sheet' : 'Error al cerrar el acta oficial', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenMatchActa = async () => {
    if (!selectedMatch) return;
    try {
      const path = getTeamPath(activeTeamId);
      const matchDocRef = doc(db, `${path}/matches`, selectedMatch.id);
      await updateDoc(matchDocRef, {
        'actaOficial.closed': false,
        'actaOficial.reopenedAt': serverTimestamp(),
        'actaOficial.reopenedBy': user.uid
      });
      showToast(isEn ? 'Match sheet reopened for editing' : 'Acta oficial reabierta para edición', 'info');
    } catch (err) {
      console.error('Error reabriendo acta:', err);
      showToast(isEn ? 'Error reopening match sheet' : 'Error al reabrir el acta', 'error');
    }
  };

  const handleExportPDF = async () => {
    const squadStats = getTeamSquadStats(players);
    const teamName = activeTeam?.nombre || activeTeam?.name || 'Mi Equipo';
    await generateAttendancePdfReport({
      teamName,
      squadStats,
      threshold,
      language
    });
  };

  const squadStats = getTeamSquadStats(players);
  const trendData = getAttendanceTrend();
  const squadAvgPct = calculateSquadAveragePct(squadStats);

  // Ordenar tabla de resumen
  const sortedSquadStats = [...squadStats].sort((a, b) => {
    if (sortOrder === 'pct-desc') {
      if (!a.hasData && !b.hasData) return 0;
      if (!a.hasData) return 1;
      if (!b.hasData) return -1;
      return (b.pct ?? 0) - (a.pct ?? 0);
    }
    if (sortOrder === 'pct-asc') {
      if (!a.hasData && !b.hasData) return 0;
      if (!a.hasData) return 1;
      if (!b.hasData) return -1;
      return (a.pct ?? 0) - (b.pct ?? 0);
    }
    if (sortOrder === 'name') return (a.player?.name || '').localeCompare(b.player?.name || '');
    if (sortOrder === 'number') return (Number(a.player?.number) || 0) - (Number(b.player?.number) || 0);
    return 0;
  });

  // Excluir jugadores sin datos de la alerta de riesgo
  const lowAttendersCount = squadStats.filter((s) => s.hasData && typeof s.pct === 'number' && s.pct < threshold).length;

  return (
    <div className="attendance-tab-wrapper" style={{ padding: '4px 0 24px 0' }}>
      {/* Sub-Navegación Control de Asistencia */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveSubView('register')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              background: activeSubView === 'register' ? 'var(--accent-green)' : 'transparent',
              color: activeSubView === 'register' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            📋 {isEn ? 'Register Session' : 'Registro por Sesión'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('summary')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              background: activeSubView === 'summary' ? 'var(--accent-green)' : 'transparent',
              color: activeSubView === 'summary' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            📊 {isEn ? 'Squad Summary' : 'Resumen de Plantilla'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('chart')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              background: activeSubView === 'chart' ? 'var(--accent-green)' : 'transparent',
              color: activeSubView === 'chart' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            📈 {isEn ? 'Attendance Trend' : 'Evolución / Gráfica'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportPDF}
            style={{
              minHeight: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1.5px solid var(--accent-gold)',
              background: 'transparent',
              color: 'var(--accent-gold)',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📄 {isEn ? 'Export PDF' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* ── SUB-VISTA 1: REGISTRO DE ASISTENCIA POR SESIÓN ── */}
      {activeSubView === 'register' && (
        <div className="attendance-register-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Header del selector de sesión */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ flex: '1', minWidth: '260px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Select Training Session or Match:' : 'Selecciona Sesión de Entrenamiento o Partido:'}
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                <optgroup label={isEn ? 'Sessions and Matches' : 'Sesiones y Partidos'}>
                  {availableEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.date})
                    </option>
                  ))}
                </optgroup>
                <option value="custom_new">+ {isEn ? 'New Custom Attendance Date' : 'Nueva Fecha de Asistencia Personalizada'}</option>
              </select>
            </div>

            {selectedSessionType === 'custom' && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Título</label>
                  <input
                    type="text"
                    value={selectedSessionTitle}
                    onChange={(e) => setSelectedSessionTitle(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Fecha</label>
                  <input
                    type="date"
                    value={selectedSessionDate}
                    onChange={(e) => setSelectedSessionDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {selectedSessionType === 'match' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
                  {isMatchActaClosed ? (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: '800', fontSize: '12px' }}>
                      📋 {isEn ? 'Official Match Sheet Closed' : 'Acta Oficial Cerrada'}
                    </span>
                  ) : (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: '800', fontSize: '12px' }}>
                      ⏳ {isEn ? 'Match Sheet Open' : 'Acta Abierta'}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleMarkAllPresent}
                style={{
                  minHeight: '44px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid #22C55E',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22C55E',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✅ {isEn ? 'Mark All Present' : 'Marcar Todos Presentes'}
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentAttendance}
                disabled={isSaving}
                style={{
                  minHeight: '44px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-green)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}
              >
                {isSaving ? (isEn ? 'Saving...' : 'Guardando...') : `💾 ${isEn ? 'Save Attendance' : 'Guardar Asistencia'}`}
              </button>

              {selectedSessionType === 'match' && (
                !isMatchActaClosed ? (
                  <button
                    type="button"
                    onClick={handleSaveAndCloseMatchActa}
                    disabled={isSaving}
                    style={{
                      minHeight: '44px',
                      padding: '0 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#3B82F6',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🔒 {isEn ? 'Save & Close Match Sheet' : 'Guardar y Cerrar Acta'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReopenMatchActa}
                    style={{
                      minHeight: '44px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #F59E0B',
                      background: 'transparent',
                      color: '#F59E0B',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🔓 {isEn ? 'Reopen Match Sheet' : 'Reabrir Acta'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Checklist de Jugadores */}
          <div className="attendance-player-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {players.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                {isEn ? 'No players in squad.' : 'No hay jugadores registrados en la plantilla.'}
              </div>
            ) : (
              players.map((player) => {
                const pRec = recordsMap[player.id] || { status: 'present', lateMinutes: 0 };
                const currentStatus = pRec.status || 'present';

                return (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {/* Info del jugador */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: player.avatarUrl ? 'transparent' : 'var(--accent-green)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '14px',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)'
                        }}
                      >
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(player.name)
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          #{player.number} {player.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{player.position}</div>
                      </div>
                    </div>

                    {/* Selector de estados */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                        const isSelected = currentStatus === stKey;
                        return (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => setPlayerStatus(player.id, stKey)}
                            style={{
                              minHeight: '40px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: `1.5px solid ${isSelected ? cfg.border : 'var(--border-color)'}`,
                              background: isSelected ? cfg.bg : 'var(--bg-card)',
                              color: isSelected ? cfg.color : 'var(--text-secondary)',
                              fontWeight: isSelected ? '800' : '600',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{cfg.icon}</span>
                            <span>{isEn ? cfg.labelEn : cfg.label}</span>
                          </button>
                        );
                      })}

                      {/* Input de minutos si es Tarde */}
                      {currentStatus === 'late' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={pRec.lateMinutes || ''}
                            onChange={(e) => setPlayerLateMinutes(player.id, e.target.value)}
                            placeholder="Min."
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>min</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── SUB-VISTA 2: TABLA DE RESUMEN DE LA PLANTILLA ── */}
      {activeSubView === 'summary' && (
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Alertas superiores de riesgo */}
          {lowAttendersCount > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid #EF4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>
                {isEn
                  ? `Attention: ${lowAttendersCount} player(s) below ${threshold}% attendance threshold.`
                  : `Atención: ${lowAttendersCount} jugador(es) están por debajo del umbral del ${threshold}% de asistencia.`}
              </span>
            </div>
          )}

          {/* Opciones de orden y umbral */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
              👥 {isEn ? 'Squad Attendance Summary' : 'Resumen de Asistencia de la Plantilla'} ({players.length} {isEn ? 'players' : 'jugadores'})
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '6px' }}>{isEn ? 'Alert Threshold:' : 'Umbral Alerta:'}</label>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '700' }}
                >
                  <option value={50}>&lt; 50%</option>
                  <option value={60}>&lt; 60%</option>
                  <option value={70}>&lt; 70% (Estándar)</option>
                  <option value={80}>&lt; 80%</option>
                  <option value={90}>&lt; 90%</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '6px' }}>{isEn ? 'Sort by:' : 'Ordenar por:'}</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '700' }}
                >
                  <option value="pct-desc">% Asistencia (Mayor a Menor)</option>
                  <option value="pct-asc">% Asistencia (Menor a Mayor)</option>
                  <option value="number">Dorsal</option>
                  <option value="name">Nombre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Resumen */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Jugador</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#22C55E' }}>Presente</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#EF4444' }}>Ausente</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#EAB308' }}>Justif.</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#F97316' }}>Tarde</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#3B82F6' }}>Lesion.</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>% Asistencia</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sortedSquadStats.map((item) => {
                  const p = item.player;
                  const hasData = item.hasData && typeof item.pct === 'number';
                  const isBelowThreshold = hasData && item.pct < threshold;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isBelowThreshold ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-green)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden' }}>
                            {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>#{p.number} {p.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.position}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.present}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: item.absent > 0 ? '#EF4444' : 'inherit' }}>{item.absent}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.justified}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.late}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.injured}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {hasData ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <div style={{ width: '60px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${item.pct}%`, height: '100%', background: isBelowThreshold ? '#EF4444' : '#22C55E' }}></div>
                            </div>
                            <span style={{ fontWeight: '800', color: isBelowThreshold ? '#EF4444' : 'var(--text-primary)' }}>{item.pct}%</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {!hasData ? (
                          <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            ⚪ {isEn ? 'No data' : 'Sin datos'}
                          </span>
                        ) : isBelowThreshold ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            ⚠️ {isEn ? 'Risk' : 'Riesgo'}
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            ✓ {isEn ? 'Optimal' : 'Óptimo'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUB-VISTA 3: EVOLUCIÓN GRÁFICA SVG DE ASISTENCIA ── */}
      {activeSubView === 'chart' && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
            📈 {isEn ? 'Team Attendance Evolution' : 'Evolución de Asistencia General del Equipo'}
          </div>

          {trendData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {isEn ? 'No attendance sessions recorded yet.' : 'Aún no hay sesiones de asistencia registradas.'}
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: '500px', height: '240px', position: 'relative' }}>
                <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                  {/* Líneas horizontales de guía (50%, 75%, 100%) */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeDasharray="4" />
                  <text x="10" y="24" fill="var(--text-secondary)" fontSize="10">100%</text>

                  <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="4" />
                  <text x="10" y="74" fill="#EF4444" fontSize="10">70%</text>

                  <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeDasharray="4" />
                  <text x="10" y="124" fill="var(--text-secondary)" fontSize="10">50%</text>

                  {/* Puntos y línea de tendencia */}
                  {(() => {
                    const stepX = trendData.length > 1 ? 440 / (trendData.length - 1) : 0;
                    const points = trendData.map((d, i) => {
                      const x = 40 + i * stepX;
                      // Mapeo: 100% -> y=20, 0% -> y=170
                      const y = 170 - (d.pct / 100) * 150;
                      return { x, y, ...d };
                    });

                    const pathStr = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                    return (
                      <g>
                        <path d={pathStr} fill="none" stroke="#22C55E" strokeWidth="3" />
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="6" fill="#22C55E" stroke="var(--bg-card)" strokeWidth="2" />
                            <text x={p.x} y={p.y - 10} fill="var(--text-primary)" fontSize="11" fontWeight="bold" textAnchor="middle">
                              {p.pct}%
                            </text>
                            <text x={p.x} y="190" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                              {p.formattedDate}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
