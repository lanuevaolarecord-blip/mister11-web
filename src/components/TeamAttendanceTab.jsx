import React, { useState, useEffect, useMemo } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { generateAttendancePdfReport } from '../utils/attendancePdfReport';
import { calculateAllPlayerMinutes } from '../utils/minutesEngine';
import { calculatePlayerMatchStats } from '../utils/playerMatchStats';
import { 
  calculateSquadAveragePct, 
  getMicrocycleDateRange, 
  determineCallupRecommendation, 
  isEventPast, 
  toDateKey 
} from '../utils/attendanceMath';
import { getPendingEvents, getUnclosedAttendanceEvents } from '../utils/attendanceStatsHelper';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const STATUS_CONFIG = {
  present:   { label: 'Presente',   labelEn: 'Present',   color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', border: '#22C55E', icon: '✅' },
  absent:    { label: 'Ausente',    labelEn: 'Absent',    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: '#EF4444', icon: '❌' },
  justified: { label: 'Justificada',labelEn: 'Justified', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: '#EAB308', icon: '📝' },
  late:      { label: 'Tarde',      labelEn: 'Late',      color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: '#F97316', icon: '⏱️' },
  injured:   { label: 'Lesionado',  labelEn: 'Injured',   color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: '#3B82F6', icon: '🚑' },
};

// ── RSVP Config (respuesta del jugador en su portal) ──────────────────────────
const RSVP_CONFIG = {
  going:      { label: 'Irá',         labelEn: 'Will come', color: '#10B981', icon: '✅' },
  not_going:  { label: 'No irá',      labelEn: 'Won\'t come', color: '#EF4444', icon: '❌' },
  late:       { label: 'Llegará tarde',labelEn: 'Coming late', color: '#F59E0B', icon: '🟡' },
  justified:  { label: 'Justificado', labelEn: 'Justified',  color: '#3B82F6', icon: '📄' },
};

// Mapa RSVP → estado del míster sugerido
const RSVP_TO_STATUS = {
  going:     'present',
  not_going: 'absent',
  late:      'late',
  justified: 'justified',
};

/** Badge compacto de la respuesta del jugador */
const RsvpBadge = ({ rsvpKey, isEn }) => {
  const actualKey = typeof rsvpKey === 'object' ? rsvpKey?.status : rsvpKey;
  if (!actualKey) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        padding: '2px 7px', borderRadius: '6px',
        background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)',
        fontSize: '10px', fontWeight: '700', color: '#94A3B8', whiteSpace: 'nowrap'
      }}>
        ⚪ {isEn ? 'No reply' : 'Sin respuesta'}
      </span>
    );
  }
  const cfg = RSVP_CONFIG[actualKey];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 7px', borderRadius: '6px',
      background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
      fontSize: '10px', fontWeight: '700', color: cfg.color, whiteSpace: 'nowrap'
    }}>
      {cfg.icon} {isEn ? cfg.labelEn : cfg.label}
    </span>
  );
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
    sessions: attendanceSessions,
    matches: attendanceMatches,
    loading: loadingAttendance,
    saveAttendance,
    getTeamSquadStats,
    getAttendanceTrend
  } = useAttendance(activeTeamId);

  const { sessions: hookSessions } = useSessions(activeTeamId);
  const { matches: hookMatches } = useMatches(activeTeamId);

  const sessions = hookSessions && hookSessions.length > 0 ? hookSessions : attendanceSessions;
  const matches = hookMatches && hookMatches.length > 0 ? hookMatches : attendanceMatches;

  const [activeSubView, setActiveSubView] = useState('register'); // 'register' | 'summary' | 'callup' | 'chart'
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSessionTitle, setSelectedSessionTitle] = useState('');
  const [selectedSessionDate, setSelectedSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionType, setSelectedSessionType] = useState('session'); // 'session' | 'match' | 'custom'
  const [isCurrentSessionSuspended, setIsCurrentSessionSuspended] = useState(false);

  // Selector de ventana para el asistente de convocatoria
  const [callupWindow, setCallupWindow] = useState('microcycle'); // 'microcycle' | 'week' | 'biweekly' | 'season'
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);

  // ── Estados de Series y Guía de la Gráfica de Evolución ──
  const [visibleSeries, setVisibleSeries] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_attendance_chart_series');
      if (saved) {
        return { attendance: true, absent: true, late: false, justified: false, ...JSON.parse(saved) };
      }
    } catch (_) {}
    return { attendance: true, absent: true, late: false, justified: false };
  });

  const [showChartGuide, setShowChartGuide] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_attendance_chart_guide');
      if (saved !== null) return JSON.parse(saved);
    } catch (_) {}
    return true; // Abierto por defecto para facilitar el aprendizaje
  });

  const toggleSeries = (seriesKey) => {
    setVisibleSeries(prev => {
      const next = { ...prev, [seriesKey]: !prev[seriesKey] };
      try {
        localStorage.setItem('mister11_attendance_chart_series', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleChartGuide = () => {
    setShowChartGuide(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mister11_attendance_chart_guide', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Map { playerId: { status: 'present'|'absent'|'justified'|'late'|'injured', lateMinutes: 0 } }
  const [recordsMap, setRecordsMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [sortOrder, setSortOrder] = useState('pct-desc');

  // Opciones combinadas para registrar asistencia (Sesiones + Partidos)
  const availableEvents = useMemo(() => {
    return [
      ...(sessions || []).map((s) => ({
        id: `session_${s.id}`,
        rawId: s.id,
        title: `⚽ [Sesión] ${s.title || 'Entrenamiento'}`,
        date: s.date || new Date().toISOString().split('T')[0],
        type: 'session',
        isSuspended: Boolean(s.isSuspended)
      })),
      ...(matches || []).map((m) => ({
        id: `match_${m.id}`,
        rawId: m.id,
        title: `🏆 [Partido] vs ${m.rival || m.opponent || 'Rival'}`,
        date: m.date || new Date().toISOString().split('T')[0],
        type: 'match',
        isSuspended: false
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, matches]);

  const selectedMatch = selectedSessionType === 'match'
    ? (matches || []).find((m) => `match_${m.id}` === selectedSessionId || m.id === selectedSessionId)
    : null;
  const isMatchActaClosed = selectedMatch?.actaOficial?.closed === true;

  // Eventos pasados sin registro o con acta abierta (Fase 3: Alerta permanente unificada)
  const unclosedEvents = useMemo(() => {
    return getUnclosedAttendanceEvents(sessions, matches, attendanceRecords);
  }, [sessions, matches, attendanceRecords]);

  // Inicializar selector con el evento más reciente si existe
  useEffect(() => {
    if (!selectedSessionId && availableEvents.length > 0) {
      const first = availableEvents[0];
      setSelectedSessionId(first.id);
      setSelectedSessionTitle(first.title);
      setSelectedSessionDate(first.date);
      setSelectedSessionType(first.type);
      setIsCurrentSessionSuspended(Boolean(first.isSuspended));
    }
  }, [availableEvents.length]);

  // Cargar registro existente de Firestore cuando cambia el evento seleccionado
  useEffect(() => {
    if (!selectedSessionId) return;

    const cleanId = String(selectedSessionId).replace(/^session_/, '').replace(/^match_/, '');

    const existingRecord = (attendanceRecords || []).find(
      (r) => r.sessionId === selectedSessionId || r.id === selectedSessionId || r.id === cleanId || r.sessionId === cleanId || r.sessionId === `session_${cleanId}`
    );

    const rawSessionObj = (sessions || []).find(
      (s) => s.id === selectedSessionId || s.id === cleanId || `session_${s.id}` === selectedSessionId
    );

    setIsCurrentSessionSuspended(Boolean(existingRecord?.isSuspended || rawSessionObj?.isSuspended));

    const STATUS_FROM_ACTA = {
      presente: 'present',
      tarde: 'late',
      justificado: 'justified',
      ausente: 'absent',
      lesionado: 'injured'
    };

    // Obtener RSVP del evento (prioridad: asistencia guardada -> sesión -> partido)
    const currentRsvpRaw = (existingRecord?.playerRsvp && typeof existingRecord.playerRsvp === 'object')
      ? existingRecord.playerRsvp
      : (rawSessionObj?.playerRsvp || null);

    const existingRecords = (existingRecord && existingRecord.records && typeof existingRecord.records === 'object')
      ? existingRecord.records
      : {};

    const matchActaActual = (selectedMatch && selectedMatch.actaOficial?.actual) || {};

    const nextMap = {};

    (players || []).forEach((p) => {
      // 1. Si el staff ya confirmó o guardó este jugador
      if (existingRecords[p.id]) {
        const staffRec = existingRecords[p.id];
        nextMap[p.id] = {
          ...staffRec,
          status: staffRec.status || 'unmarked',
          source: staffRec.source || 'staff',
          lateMinutes: staffRec.lateMinutes || 0
        };
        return;
      }

      // 2. Si es un partido con acta oficial
      if (matchActaActual[p.id]) {
        const d = matchActaActual[p.id];
        nextMap[p.id] = {
          status: STATUS_FROM_ACTA[d.status] || d.status || 'present',
          source: 'staff',
          lateMinutes: d.lateMin || 0
        };
        return;
      }

      // 3. FASE 1: Proyección en tiempo real del RSVP del jugador (Estado PROVISIONAL)
      const rawPPlayerRsvp = currentRsvpRaw?.[p.id];
      const pRsvpKey = typeof rawPPlayerRsvp === 'object' ? rawPPlayerRsvp?.status : rawPPlayerRsvp;

      if (pRsvpKey && RSVP_TO_STATUS[pRsvpKey]) {
        nextMap[p.id] = {
          status: RSVP_TO_STATUS[pRsvpKey],
          source: 'rsvp',
          lateMinutes: 0
        };
        return;
      }

      // 4. Si el jugador está marcado como lesionado en la plantilla
      if (p.currentStatus === 'injured') {
        nextMap[p.id] = {
          status: 'injured',
          source: 'staff',
          lateMinutes: 0
        };
        return;
      }

      // 5. FASE 2: Sesión sin datos ni respuesta -> 'unmarked' ("—" / Sin respuesta).
      // PROHIBIDO el "Presente" por defecto que oculte la realidad
      nextMap[p.id] = {
        status: 'unmarked',
        source: null,
        lateMinutes: 0
      };
    });

    setRecordsMap(nextMap);

    if (existingRecord?.date) setSelectedSessionDate(existingRecord.date);
    else if (selectedMatch?.date) setSelectedSessionDate(selectedMatch.date);
    else if (rawSessionObj?.fecha || rawSessionObj?.date) setSelectedSessionDate(rawSessionObj.fecha || rawSessionObj.date);

    if (existingRecord?.sessionTitle) setSelectedSessionTitle(existingRecord.sessionTitle);
    else if (selectedMatch?.rival) setSelectedSessionTitle(`🏆 [Partido] vs ${selectedMatch.rival}`);
    else if (rawSessionObj?.titulo || rawSessionObj?.title) setSelectedSessionTitle(rawSessionObj.titulo || rawSessionObj.title);
  }, [selectedSessionId, attendanceRecords, players, selectedMatch, sessions]);

  const handleSelectEvent = (eventId) => {
    if (!eventId) return;
    if (eventId === 'custom_new') {
      const newId = `custom_${Date.now()}`;
      setSelectedSessionId(newId);
      setSelectedSessionTitle(isEn ? 'Extra Session' : 'Sesión Extra');
      setSelectedSessionDate(new Date().toISOString().split('T')[0]);
      setSelectedSessionType('custom');
      setIsCurrentSessionSuspended(false);
      const defaultMap = {};
      (players || []).forEach((p) => {
        defaultMap[p.id] = { status: p.currentStatus === 'injured' ? 'injured' : 'present', lateMinutes: 0 };
      });
      setRecordsMap(defaultMap);
      return;
    }

    const evt = availableEvents.find((e) => e.id === eventId);
    if (evt) {
      setSelectedSessionId(evt.id);
      setSelectedSessionTitle(evt.title);
      setSelectedSessionDate(evt.date);
      setSelectedSessionType(evt.type);
      setIsCurrentSessionSuspended(Boolean(evt.isSuspended));
    }
  };

  const handleStatusChange = (playerId, status) => {
    setRecordsMap((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        status,
        source: 'staff',
        by: user?.uid || 'staff',
        lateMinutes: status === 'late' ? (prev[playerId]?.lateMinutes || 15) : 0
      }
    }));
  };

  const handleLateMinutesChange = (playerId, minutes) => {
    setRecordsMap((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        source: 'staff',
        by: user?.uid || 'staff',
        lateMinutes: Math.max(0, parseInt(minutes, 10) || 0)
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const newMap = {};
    (players || []).forEach((p) => {
      newMap[p.id] = { status: 'present', source: 'staff', by: user?.uid || 'staff', lateMinutes: 0 };
    });
    setRecordsMap(newMap);
    showToast(isEn ? 'All marked as present (Official)' : 'Todos marcados como presentes (Oficial)', 'info');
  };

  const handleSaveCurrentAttendance = async () => {
    if (!selectedSessionId) {
      showToast(isEn ? 'Select a session or match first' : 'Selecciona primero una sesión o partido', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      // Asegurar que TODOS los registros guardados queden oficialmente sellados por el staff
      const fullRecords = {};
      (players || []).forEach((p) => {
        const r = recordsMap[p.id];
        if (!r || r.status === 'unmarked') {
          fullRecords[p.id] = {
            status: p.currentStatus === 'injured' ? 'injured' : 'absent',
            source: 'staff',
            by: user?.uid || 'staff',
            lateMinutes: 0
          };
        } else {
          fullRecords[p.id] = {
            status: r.status,
            source: 'staff',
            by: r.by || user?.uid || 'staff',
            lateMinutes: r.lateMinutes || 0
          };
        }
      });

      await saveAttendance(selectedSessionId, {
        sessionTitle: selectedSessionTitle,
        date: selectedSessionDate,
        type: selectedSessionType,
        isSuspended: isCurrentSessionSuspended,
        isClosed: true,
        records: fullRecords
      });

      showToast(
        isCurrentSessionSuspended
          ? (isEn ? 'Session marked as suspended and saved' : 'Sesión marcada como suspendida y guardada')
          : (isEn ? 'Attendance saved successfully' : 'Asistencia guardada con éxito'),
        'success'
      );
    } catch (err) {
      console.error('Error guardando asistencia:', err);
      showToast(isEn ? 'Error saving attendance' : 'Error al guardar la asistencia', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar y Cerrar Acta Oficial para Partidos
  const handleSaveAndCloseMatchActa = async () => {
    if (!selectedMatch) return;
    setIsSaving(true);
    try {
      const path = getTeamPath(activeTeamId);
      const matchDocRef = doc(db, `${path}/matches`, selectedMatch.id);

      const calculatedMinutes = calculateAllPlayerMinutes(selectedMatch);
      const STATUS_MAP = {
        present: 'presente',
        late: 'tarde',
        justified: 'justificado',
        absent: 'ausente',
        injured: 'lesionado'
      };

      const finalActual = {};
      (players || []).forEach((p) => {
        const rec = recordsMap[p.id];
        const rawStatus = rec?.status || 'ausente';
        const status = STATUS_MAP[rawStatus] || rawStatus;
        const minutes = calculatedMinutes[p.id] || 0;
        finalActual[p.id] = {
          status,
          minutes,
          minuteSource: 'acta',
          at: new Date().toISOString(),
          by: user?.uid || 'staff',
          ...(rec?.lateMinutes ? { lateMin: rec.lateMinutes } : {})
        };
      });

      await updateDoc(matchDocRef, {
        'actaOficial.actual': finalActual,
        'actaOficial.closed': true,
        'actaOficial.closedAt': serverTimestamp(),
        'actaOficial.closedBy': user?.uid || 'staff'
      });

      await saveAttendance(selectedSessionId, {
        sessionTitle: selectedSessionTitle,
        date: selectedSessionDate,
        type: 'match',
        isSuspended: false,
        records: recordsMap
      });

      showToast(isEn ? 'Match sheet closed and minutes calculated' : 'Acta oficial cerrada y minutos calculados', 'success');

      // ── REC-8: Sincronizar notaMedia en la ficha de cada jugador ──
      (players || []).forEach((p) => {
        try {
          const stats = calculatePlayerMatchStats(p.id, matches);
          if (stats?.avgRating && stats.avgRating !== '-' && !isNaN(Number(stats.avgRating))) {
            const playerRef = doc(db, `${path}/players`, p.id);
            updateDoc(playerRef, { notaMedia: parseFloat(stats.avgRating) }).catch(() => {});
          }
        } catch (_) {}
      });
    } catch (err) {
      console.error('Error cerrando acta oficial:', err);
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
        'actaOficial.reopenedAt': serverTimestamp()
      });
      showToast(isEn ? 'Match sheet reopened for editing' : 'Acta reabierta para edición', 'info');
    } catch (err) {
      console.error('Error reabriendo acta:', err);
      showToast(isEn ? 'Error reopening match sheet' : 'Error al reabrir el acta', 'error');
    }
  };

  const handleExportPDF = () => {
    const squadStats = getTeamSquadStats(players);
    generateAttendancePdfReport({
      teamName: activeTeam?.name || 'Mi Equipo',
      squadStats,
      threshold,
      isEn
    });
  };

  // ── Cálculos de Asistente de Convocatoria (Microciclo / Ventana Inteligente) ──
  const microcycleInfo = useMemo(() => {
    return getMicrocycleDateRange({ matches, sessions });
  }, [matches, sessions]);

  const callupDateRange = useMemo(() => {
    if (callupWindow === 'microcycle') {
      return { startDate: microcycleInfo.startDate, endDate: microcycleInfo.endDate };
    }
    if (callupWindow === 'week') {
      const curr = new Date();
      const day = curr.getDay();
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toDateKey(monday), endDate: toDateKey(sunday) };
    }
    if (callupWindow === 'biweekly') {
      const curr = new Date();
      const past14 = new Date();
      past14.setDate(curr.getDate() - 14);
      return { startDate: toDateKey(past14), endDate: toDateKey(curr) };
    }
    return null; // Temporada completa
  }, [callupWindow, microcycleInfo]);

  const callupSquadStats = useMemo(() => {
    const thresholds = activeTeam?.settings?.achievementTargets || activeTeam?.achievementTargets || {};
    return getTeamSquadStats(players, { dateRange: callupDateRange, thresholds });
  }, [players, callupDateRange, activeTeam, getTeamSquadStats]);

  // Estadísticas globales de plantilla
  const squadStats = useMemo(() => {
    return getTeamSquadStats(players);
  }, [players, getTeamSquadStats]);

  const trendData = useMemo(() => {
    return getAttendanceTrend(players);
  }, [players, getAttendanceTrend]);

  const teamAveragePct = useMemo(() => {
    return calculateSquadAveragePct(squadStats);
  }, [squadStats]);

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

  const lowAttendersCount = squadStats.filter((s) => s.hasData && typeof s.pct === 'number' && s.pct < threshold).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const isSessionFuture = selectedSessionDate > todayStr;
  const currentEventRecord = attendanceRecords.find(
    (r) => r.sessionId === selectedSessionId || r.id === selectedSessionId
  );
  const hasStaffRecord = !!(currentEventRecord && currentEventRecord.records && Object.keys(currentEventRecord.records).length > 0);

  // ── RSVP: mapa de respuestas del jugador para el evento seleccionado ──────────
  // El jugador escribe en attendance/{eventId}.playerRsvp[playerId]
  // También puede vivir en el objeto de sesión directamente si el jugador usó PlayerScheduleTab
  const rsvpMap = useMemo(() => {
    // Prioridad 1: registro de asistencia ya guardado (tiene playerRsvp)
    if (currentEventRecord?.playerRsvp && typeof currentEventRecord.playerRsvp === 'object') {
      return currentEventRecord.playerRsvp;
    }
    // Prioridad 2: documento de sesión con playerRsvp embebido
    const cleanId = String(selectedSessionId).replace(/^session_/, '').replace(/^match_/, '');
    const sessionObj = (sessions || []).find(s => s.id === cleanId || s.id === selectedSessionId);
    if (sessionObj?.playerRsvp && typeof sessionObj.playerRsvp === 'object') {
      return sessionObj.playerRsvp;
    }
    // Prioridad 3: partido con playerRsvp
    const matchObj = (matches || []).find(m => m.id === cleanId || m.id === selectedSessionId);
    if (matchObj?.playerRsvp && typeof matchObj.playerRsvp === 'object') {
      return matchObj.playerRsvp;
    }
    return {};
  }, [currentEventRecord, selectedSessionId, sessions, matches]);

  // Contadores RSVP para el evento seleccionado
  const rsvpCounters = useMemo(() => {
    const counts = { going: 0, not_going: 0, late: 0, justified: 0, none: 0 };
    (players || []).forEach(p => {
      const raw = rsvpMap[p.id];
      const r = typeof raw === 'object' ? raw?.status : raw;
      if (!r) counts.none++;
      else if (counts[r] !== undefined) counts[r]++;
      else counts.none++;
    });
    return counts;
  }, [rsvpMap, players]);

  const hasAnyRsvp = (players || []).some(p => !!rsvpMap[p.id]);

  // Prellenar desde RSVP: sugiere estados sin pisar ediciones manuales del míster
  const handlePrefillFromRsvp = () => {
    if (!hasAnyRsvp) {
      showToast(isEn ? 'No player responses yet' : 'Ningún jugador ha respondido aún', 'warning');
      return;
    }
    let filled = 0;
    setRecordsMap(prev => {
      const next = { ...prev };
      (players || []).forEach(p => {
        const rsvp = rsvpMap[p.id];
        if (!rsvp) return;
        const suggested = RSVP_TO_STATUS[rsvp];
        if (!suggested) return;
        // Solo aplica si aún no hay edición manual o el estado es el default 'present'
        const current = prev[p.id]?.status;
        if (!current || current === 'present') {
          next[p.id] = { ...prev[p.id], status: suggested, lateMinutes: suggested === 'late' ? (prev[p.id]?.lateMinutes || 15) : 0 };
          filled++;
        }
      });
      return next;
    });
    showToast(
      isEn
        ? `✅ Pre-filled ${filled} player${filled !== 1 ? 's' : ''} from RSVP (manual edits preserved)`
        : `✅ Prellenados ${filled} jugador${filled !== 1 ? 'es' : ''} desde RSVP (ediciones manuales conservadas)`,
      'success'
    );
  };

  return (
    <div className="attendance-tab-wrapper" style={{ padding: '4px 0 24px 0' }}>
      
      {/* ⚠️ BANNER UNIFICADO DE SESIONES Y PARTIDOS PENDIENTES (Fase 3: Alertas Unificadas) */}
      {unclosedEvents.totalCount > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <strong style={{ color: '#F59E0B', fontSize: '13.5px', display: 'block' }}>
                {isEn
                  ? `You have ${unclosedEvents.pendingSessions.length} unrecorded session${unclosedEvents.pendingSessions.length !== 1 ? 's' : ''} and ${unclosedEvents.openMatches.length} match${unclosedEvents.openMatches.length !== 1 ? 'es' : ''} with open match sheet.`
                  : `Tienes ${unclosedEvents.pendingSessions.length} sesión${unclosedEvents.pendingSessions.length !== 1 ? 'es' : ''} sin registrar y ${unclosedEvents.openMatches.length} partido${unclosedEvents.openMatches.length !== 1 ? 's' : ''} con acta abierta.`}
              </strong>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {isEn
                  ? 'Complete attendance and close match sheets to finalize official attendance % and player minutes.'
                  : 'Completa y cierra para oficializar los % de asistencia y los minutos de los jugadores.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unclosedEvents.pendingSessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstPending = unclosedEvents.pendingSessions[0];
                  handleSelectEvent(`session_${firstPending.id}`);
                  setActiveSubView('register');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#F59E0B',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                📋 {isEn ? 'Complete Session' : 'Completar Sesión'}
              </button>
            )}
            {unclosedEvents.openMatches.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstMatch = unclosedEvents.openMatches[0];
                  handleSelectEvent(`match_${firstMatch.id}`);
                  setActiveSubView('register');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🏆 {isEn ? 'Close Match Sheet' : 'Cerrar Acta Partido'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sub-Navegación Control de Asistencia (4 Vistas) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
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
            onClick={() => setActiveSubView('callup')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              background: activeSubView === 'callup' ? 'var(--accent-green)' : 'transparent',
              color: activeSubView === 'callup' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            🎯 {isEn ? 'Call-up Assistant' : 'Asistente de Convocatoria'}
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
                      {e.title} ({e.date}) {e.isSuspended ? (isEn ? '🌧️ [Suspended]' : '🌧️ [Suspendida]') : ''}
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
              {selectedSessionType === 'match' ? (
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
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
                  {isCurrentSessionSuspended ? (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8', fontWeight: '800', fontSize: '12px' }}>
                      🌧️ {isEn ? 'Suspended Session' : 'Sesión Suspendida'}
                    </span>
                  ) : isSessionFuture ? (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: '800', fontSize: '12px' }}>
                      🕐 {isEn ? 'Future session' : 'Sesión futura'}
                    </span>
                  ) : hasStaffRecord ? (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: '800', fontSize: '12px' }}>
                      ✅ {isEn ? 'Official record saved' : 'Registro oficial guardado'}
                    </span>
                  ) : (
                    <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: '800', fontSize: '12px' }}>
                      ⏳ {isEn ? 'Pending registration' : 'Pendiente de registro'}
                    </span>
                  )}
                </div>
              )}

              {/* Botón para marcar como Suspendida (Lluvia / Fuerza Mayor) */}
              {selectedSessionType !== 'match' && (
                <button
                  type="button"
                  onClick={() => setIsCurrentSessionSuspended(!isCurrentSessionSuspended)}
                  style={{
                    minHeight: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: isCurrentSessionSuspended ? '1.5px solid #94A3B8' : '1px solid var(--border-color)',
                    background: isCurrentSessionSuspended ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
                    color: isCurrentSessionSuspended ? '#CBD5E1' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title={isEn ? 'Excludes this session from attendance calculation for the entire squad' : 'Excluye esta sesión del cómputo de asistencia de toda la plantilla'}
                >
                  🌧️ {isCurrentSessionSuspended ? (isEn ? 'Suspended (Active)' : 'Suspendida (Activo)') : (isEn ? 'Mark Suspended' : 'Marcar Suspendida')}
                </button>
              )}

              {/* ⚡ PRELLENAR DESDE RSVP */}
              {hasAnyRsvp && (
                <button
                  type="button"
                  onClick={handlePrefillFromRsvp}
                  title={isEn ? 'Pre-fill from player RSVP responses (manual edits preserved)' : 'Prellenar desde respuestas del jugador sin pisar ediciones manuales'}
                  style={{
                    minHeight: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #8B5CF6',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#8B5CF6',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  ⚡ {isEn ? 'Pre-fill from RSVP' : 'Prellenar desde RSVP'}
                </button>
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

            {selectedSessionType !== 'match' && (
              <div style={{ width: '100%', textAlign: 'right', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  ℹ️ {isEn ? 'You can update attendance anytime; updates instantly' : 'Puedes corregir el pase de lista; se refleja al instante'}
                </span>
              </div>
            )}
          </div>

          {/* ── CONTADORES RSVP (en vivo desde respuestas del jugador) ── */}
          {(hasAnyRsvp || rsvpCounters.none > 0) && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.06)',
              border: '1.5px solid rgba(139, 92, 246, 0.2)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#8B5CF6', width: '100%', marginBottom: '4px' }}>
                📲 {isEn ? 'Player RSVP Responses & Planning (live)' : 'Respuestas RSVP del Jugador y Planificación (en vivo)'}
              </span>
              {rsvpCounters.going > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
                  ✅ {rsvpCounters.going} {isEn ? 'Will come' : 'Irá'}
                </span>
              )}
              {rsvpCounters.not_going > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#EF4444', background: 'rgba(239,68,68,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
                  ❌ {rsvpCounters.not_going} {isEn ? "Won't come" : 'No irá'}
                </span>
              )}
              {rsvpCounters.late > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
                  🟡 {rsvpCounters.late} {isEn ? 'Coming late' : 'Llegará tarde'}
                </span>
              )}
              {rsvpCounters.justified > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
                  📄 {rsvpCounters.justified} {isEn ? 'Justified' : 'Justificado'}
                </span>
              )}
              {rsvpCounters.none > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', background: 'rgba(148,163,184,0.1)', padding: '3px 10px', borderRadius: '6px' }}>
                  ⚪ {rsvpCounters.none} {isEn ? 'No reply' : 'Sin respuesta'}
                </span>
              )}
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#10B981', background: 'rgba(16,185,129,0.16)', padding: '4px 12px', borderRadius: '8px', marginLeft: 'auto' }}>
                ⚽ {isEn 
                  ? `Expected: ${(players || []).filter(p => recordsMap[p.id]?.status === 'present' || recordsMap[p.id]?.status === 'late').length} / ${players.length}`
                  : `Se esperan: ${(players || []).filter(p => recordsMap[p.id]?.status === 'present' || recordsMap[p.id]?.status === 'late').length} de ${players.length}`}
              </span>
            </div>
          )}

          {/* Checklist de Jugadores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map((p) => {
              const currentRec = recordsMap[p.id] || { status: 'unmarked', source: null, lateMinutes: 0 };
              const currentStatus = currentRec.status;
              const isProvisional = currentRec.source === 'rsvp';
              const rawPlayerRsvp = rsvpMap[p.id] || null;
              const playerRsvp = typeof rawPlayerRsvp === 'object' ? rawPlayerRsvp?.status : rawPlayerRsvp;

              // Detección de discrepancia: el jugador dijo X pero el míster marca algo distinto
              const suggestedStatus = playerRsvp ? RSVP_TO_STATUS[playerRsvp] : null;
              const hasDiscrepancy = !!(suggestedStatus && currentStatus && currentStatus !== 'unmarked' && currentStatus !== suggestedStatus && currentRec.source === 'staff');

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-app)',
                    border: hasDiscrepancy
                      ? '1.5px solid rgba(245, 158, 11, 0.6)'
                      : (isProvisional ? '1.5px dashed rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)')
                  }}
                >
                  {/* Columna izquierda: Avatar + Nombre + RSVP badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--accent-green)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '13px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(p.name)
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        #{p.number || '-'} {p.name}
                        {/* ⚠️ Discrepancia: dijo que vendría pero el míster lo marca diferente */}
                        {hasDiscrepancy && (
                          <span
                            title={isEn
                              ? `Player said "${RSVP_CONFIG[playerRsvp]?.labelEn}" but marked as "${STATUS_CONFIG[currentStatus]?.labelEn}"`
                              : `Dijo "${RSVP_CONFIG[playerRsvp]?.label}" pero se marcó "${STATUS_CONFIG[currentStatus]?.label}"`
                            }
                            style={{ fontSize: '13px', cursor: 'help' }}
                          >⚠️</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>{p.position || (isEn ? 'Player' : 'Jugador')}</span>
                        {/* Badge RSVP en vivo del jugador */}
                        <RsvpBadge rsvpKey={playerRsvp} isEn={isEn} />
                      </div>
                    </div>
                  </div>

                  {/* Selector de Estado de Asistencia con diferenciación Provisional Ámbar vs Oficial Verde */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                        const isSelected = currentStatus === statusKey;
                        const isSelectedProvisional = isSelected && isProvisional;

                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => handleStatusChange(p.id, statusKey)}
                            title={isSelectedProvisional 
                              ? (isEn ? 'Provisional status per player response. Tap to confirm as official.' : 'Estado provisional derivado de la respuesta del jugador. Toca para confirmarlo como oficial.')
                              : (isSelected ? (isEn ? 'Official status confirmed by staff' : 'Estado oficial confirmado por el cuerpo técnico') : '')}
                            style={{
                              minHeight: '44px',
                              minWidth: '44px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: isSelected
                                ? (isSelectedProvisional ? '1.5px dashed #F59E0B' : `1.5px solid ${cfg.border}`)
                                : '1px solid var(--border-color)',
                              background: isSelected
                                ? (isSelectedProvisional ? 'rgba(245, 158, 11, 0.16)' : cfg.bg)
                                : 'transparent',
                              color: isSelected
                                ? (isSelectedProvisional ? '#F59E0B' : cfg.color)
                                : 'var(--text-secondary)',
                              fontWeight: isSelected ? '800' : '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{cfg.icon}</span>
                            <span>{isEn ? cfg.labelEn : cfg.label}</span>
                            {isSelectedProvisional && <span style={{ fontSize: '10px' }}>⏳</span>}
                          </button>
                        );
                      })}

                      {(!currentStatus || currentStatus === 'unmarked') && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#94A3B8',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(148,163,184,0.1)',
                          border: '1px dashed rgba(148,163,184,0.3)',
                          whiteSpace: 'nowrap'
                        }}>
                          — {isEn ? 'Unmarked' : 'Sin registrar'}
                        </span>
                      )}

                      {currentStatus === 'late' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={currentRec.lateMinutes || 15}
                            onChange={(e) => handleLateMinutesChange(p.id, e.target.value)}
                            style={{
                              width: '54px',
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #F97316',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#F97316', fontWeight: '700' }}>min</span>
                        </div>
                      )}
                    </div>

                    {/* Notas explicativas del estado */}
                    {isProvisional && currentStatus && currentStatus !== 'unmarked' && (
                      <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ⏳ {isEn ? 'Provisional · per player response (tap to confirm)' : 'Provisional · según respuesta del jugador (toca para confirmar)'}
                      </span>
                    )}

                    {currentRec.source === 'staff' && currentStatus && currentStatus !== 'unmarked' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ✅ {isEn ? 'Official · confirmed by staff' : 'Oficial · confirmado por el míster'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUB-VISTA 2: ASISTENTE DE CONVOCATORIA (FASE 2) ── */}
      {activeSubView === 'callup' && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Header del Asistente con Selector de Ventana */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎯 {isEn ? 'Call-up Attendance Assistant' : 'Asistente de Convocatoria por Asistencia'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isEn 
                  ? 'Real attendance metrics over scheduled sessions to guide your next match roster.'
                  : 'Métricas de asistencia real sobre sesiones programadas para orientar tu próxima convocatoria.'}
              </p>
            </div>

            {/* Selector de Ventana de Microciclo */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setCallupWindow('microcycle')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: callupWindow === 'microcycle' ? 'var(--accent-green)' : 'transparent',
                  color: callupWindow === 'microcycle' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                {isEn ? 'Microcycle' : 'Microciclo'}
              </button>
              <button
                type="button"
                onClick={() => setCallupWindow('week')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: callupWindow === 'week' ? 'var(--accent-green)' : 'transparent',
                  color: callupWindow === 'week' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                {isEn ? 'Current Week' : 'Semana'}
              </button>
              <button
                type="button"
                onClick={() => setCallupWindow('biweekly')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: callupWindow === 'biweekly' ? 'var(--accent-green)' : 'transparent',
                  color: callupWindow === 'biweekly' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                {isEn ? 'Last 14 Days' : 'Quincena'}
              </button>
              <button
                type="button"
                onClick={() => setCallupWindow('season')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: callupWindow === 'season' ? 'var(--accent-green)' : 'transparent',
                  color: callupWindow === 'season' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                {isEn ? 'Season' : 'Temporada'}
              </button>
            </div>
          </div>

          {/* Tarjeta de Información de la Ventana Activa */}
          <div style={{
            background: 'var(--bg-app)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-gold)', textTransform: 'uppercase', display: 'block' }}>
                {isEn ? 'Active Evaluation Window' : 'Ventana de Evaluación Activa'}
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {callupWindow === 'microcycle' 
                  ? (isEn ? microcycleInfo.titleEn : microcycleInfo.title)
                  : callupWindow === 'week'
                  ? (isEn ? `This Week (${callupDateRange?.startDate} to ${callupDateRange?.endDate})` : `Esta Semana (${callupDateRange?.startDate} al ${callupDateRange?.endDate})`)
                  : callupWindow === 'biweekly'
                  ? (isEn ? `Last 14 Days (${callupDateRange?.startDate} to ${callupDateRange?.endDate})` : `Últimos 14 Días (${callupDateRange?.startDate} al ${callupDateRange?.endDate})`)
                  : (isEn ? 'Full Season Attendance' : 'Asistencia de Toda la Temporada')}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: '800' }}>
                ≥80% {isEn ? 'Recommended' : 'Recomendado'}
              </span>
              <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: '800' }}>
                50-79% {isEn ? 'Consider' : 'Valorar'}
              </span>
              <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: '800' }}>
                &lt;50% {isEn ? 'Not recommended' : 'No recomendado'}
              </span>
            </div>
          </div>

          {/* Tabla de Asistente de Convocatoria */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Jugador</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>% Ventana</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Desglose (P / T / J / A / SR)</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--accent-gold)' }}>🔥 Racha</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-primary)' }}>Orientación</th>
                </tr>
              </thead>
              <tbody>
                {callupSquadStats.map((item) => {
                  const p = item.player;
                  const hasData = item.hasData && typeof item.pct === 'number';
                  const guidance = item.callupGuidance || determineCallupRecommendation(item.pct);

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-green)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden' }}>
                            {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>#{p.number || '-'} {p.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.position || 'Jugador'}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {hasData ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: '900',
                            fontSize: '13px',
                            color: guidance.color,
                            background: guidance.bg,
                            border: `1px solid ${guidance.border}`
                          }}>
                            {item.pct}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                          <span style={{ color: '#22C55E' }} title={isEn ? 'Present' : 'Presente'}>{item.present ?? 0}P</span>
                          <span style={{ color: '#F97316' }} title={isEn ? 'Late' : 'Tarde'}>{item.late ?? 0}T</span>
                          <span style={{ color: '#EAB308' }} title={isEn ? 'Justified' : 'Justificado'}>{item.justified ?? 0}J</span>
                          <span style={{ color: '#EF4444' }} title={isEn ? 'Absent' : 'Ausente'}>{item.absent ?? 0}A</span>
                          {(item.noRecord ?? 0) > 0 && (
                            <span style={{ color: '#94A3B8' }} title={isEn ? 'No staff record' : 'Sin registro del staff'}>{item.noRecord}SR</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '800', color: 'var(--accent-gold)' }}>
                        {item.streak > 0 ? `🔥 ${item.streak}` : '0'}
                      </td>

                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          background: guidance.bg,
                          color: guidance.color,
                          border: `1px solid ${guidance.border}`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{guidance.badge}</span>
                          <span>{isEn ? guidance.labelEn : guidance.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Nota de Metodología y Equidad Deportiva (Fase 4) */}
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {isEn
                ? 'Attendance % guides call-ups based on scheduled sessions; challenges and sporting achievements are computed exclusively from staff-verified records.'
                : 'El % orienta la convocatoria sobre sesiones programadas; los retos y logros se basan en registros verificados por el cuerpo técnico.'}
            </p>
          </div>
        </div>
      )}

      {/* ── SUB-VISTA 3: RESUMEN GENERAL DE PLANTILLA ── */}
      {activeSubView === 'summary' && (
        <div className="attendance-summary-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Header de la vista resumen */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
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
                  <th style={{ padding: '10px', textAlign: 'center', color: '#94A3B8' }} title={isEn ? 'Scheduled past events without staff record' : 'Eventos programados pasados sin registro del staff'}>SR</th>
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
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.present ?? 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: (item.absent || 0) > 0 ? '#EF4444' : 'inherit' }}>{item.absent ?? 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.justified ?? 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.late ?? 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.injured ?? 0}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: (item.noRecord || 0) > 0 ? '#94A3B8' : 'inherit' }} title={isEn ? 'Scheduled without staff record' : 'Programados sin registro del staff'}>{item.noRecord ?? 0}</td>
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

          {/* Nota de Metodología y Salvaguarda de Información (Fase 4) */}
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {isEn
                ? 'Coach rate guides call-ups based on scheduled events; player portal displays closed match reports only.'
                : 'El % del míster orienta la convocatoria sobre eventos programados; el portal del jugador muestra exclusivamente actas cerradas.'}
            </p>
          </div>
        </div>
      )}

      {/* ── SUB-VISTA 4: EVOLUCIÓN GRÁFICA SVG DE ASISTENCIA MULTILÍNEA (Fuente Única) ── */}
      {activeSubView === 'chart' && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          {/* Cabecera Principal con Botón de Guía */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
              📈 {t('attendance.chart.title') || (isEn ? 'Team Attendance Evolution' : 'Evolución de Asistencia General del Equipo')}
            </div>
            
            <button
              type="button"
              onClick={toggleChartGuide}
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22C55E',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              💡 {t('attendance.chart.guide.title') || (isEn ? 'How to read this chart?' : '¿Cómo interpretar esta gráfica?')} {showChartGuide ? '▲' : '▼'}
            </button>
          </div>

          {/* ── FASE 3: GUÍA "¿CÓMO INTERPRETAR ESTA GRÁFICA?" (COLAPSABLE) ── */}
          {showChartGuide && (
            <div style={{
              marginBottom: '20px',
              background: 'rgba(34, 197, 94, 0.04)',
              border: '1.5px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📖</span>
                <span>{isEn ? 'Guide for Coaches (Simple Terms)' : 'Guía de Interpretación para el Cuerpo Técnico'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '11.5px', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>📌 {isEn ? '1. Timeline & Events' : '1. Puntos y Cronología'}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('attendance.chart.guide.step1') || 'Cada punto es un entreno o partido: ordenados cronológicamente.'}</span>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '11.5px', lineHeight: '1.4' }}>
                  <strong style={{ color: '#22C55E', display: 'block', marginBottom: '2px' }}>🟢 {isEn ? '2. Green Line' : '2. Línea Verde'}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('attendance.chart.guide.step2') || 'La línea verde es tu asistencia: por encima del 70% vas bien.'}</span>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '11.5px', lineHeight: '1.4' }}>
                  <strong style={{ color: '#EF4444', display: 'block', marginBottom: '2px' }}>⚠️ {isEn ? '3. Warning Cross' : '3. Cruce de Alerta'}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('attendance.chart.guide.step3') || 'Si la roja sube mientras la verde baja: problema de compromiso a corregir.'}</span>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '11.5px', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '2px' }}>👆 {isEn ? '4. Interactive Detail' : '4. Toca para Detalle'}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('attendance.chart.guide.step4') || 'Toca cualquier punto para ver el desglose y abrir su registro.'}</span>
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: '#22C55E', fontStyle: 'italic', borderTop: '1px solid rgba(34, 197, 94, 0.15)', paddingTop: '8px' }}>
                💡 {t('attendance.chart.guide.example', { avg: teamAveragePct, count: trendData.length }) || `Actualmente tu equipo promedia un ${teamAveragePct}% de asistencia en los ${trendData.length} eventos disputados.`}
              </div>
            </div>
          )}

          {/* ── FASE 2: LEYENDA EXPLICATIVA CON TOGGLES INTERACTIVOS ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            padding: '16px',
            background: 'var(--bg-app)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isEn ? 'Series Filters & Explanations (Click to Show/Hide)' : 'Series de la Gráfica y Explicación (Pulsa para Mostrar/Ocultar)'}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
              {/* 1. Asistencia Real (Verde) */}
              <div
                onClick={() => toggleSeries('attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: visibleSeries.attendance ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                  border: `1.5px solid ${visibleSeries.attendance ? '#22C55E' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  opacity: visibleSeries.attendance ? 1 : 0.45
                }}
              >
                <input type="checkbox" checked={visibleSeries.attendance} onChange={() => {}} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#22C55E' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#22C55E' }}>
                    🟢 {t('attendance.chart.legend.attendance') || 'Asistencia Real (P+T)'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                    {t('attendance.chart.legend.attendance.desc') || 'Jugadores que estuvieron (presentes + tardes). Cuanto más alta, mejor.'}
                  </div>
                </div>
              </div>

              {/* 2. Ausentes (Rojo) */}
              <div
                onClick={() => toggleSeries('absent')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: visibleSeries.absent ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                  border: `1.5px solid ${visibleSeries.absent ? '#EF4444' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  opacity: visibleSeries.absent ? 1 : 0.45
                }}
              >
                <input type="checkbox" checked={visibleSeries.absent} onChange={() => {}} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#EF4444' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#EF4444' }}>
                    🔴 {t('attendance.chart.legend.absent') || 'Ausentes'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                    {t('attendance.chart.legend.absent.desc') || 'Faltas sin avisar. Debe tender a cero.'}
                  </div>
                </div>
              </div>

              {/* 3. Tardes (Naranja) */}
              <div
                onClick={() => toggleSeries('late')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: visibleSeries.late ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                  border: `1.5px solid ${visibleSeries.late ? '#F97316' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  opacity: visibleSeries.late ? 1 : 0.45
                }}
              >
                <input type="checkbox" checked={visibleSeries.late} onChange={() => {}} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#F97316' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#F97316' }}>
                    🟠 {t('attendance.chart.legend.late') || 'Tardes'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                    {t('attendance.chart.legend.late.desc') || 'Llegadas tarde. Vigila si sube varias semanas seguidas.'}
                  </div>
                </div>
              </div>

              {/* 4. Justificados (Azul) */}
              <div
                onClick={() => toggleSeries('justified')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: visibleSeries.justified ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  border: `1.5px solid ${visibleSeries.justified ? '#3B82F6' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  opacity: visibleSeries.justified ? 1 : 0.45
                }}
              >
                <input type="checkbox" checked={visibleSeries.justified} onChange={() => {}} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#3B82F6' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#3B82F6' }}>
                    🔵 {t('attendance.chart.legend.justified') || 'Justificados'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                    {t('attendance.chart.legend.justified.desc') || 'Avisos justificados. No castiga el % principal.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Umbrales y Estados de Puntos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', fontSize: '11.5px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: '700' }}>
                <span style={{ width: '16px', height: '0', borderTop: '2px dashed #EF4444' }}></span>
                {t('attendance.chart.legend.threshold70') || 'Umbral de alerta (70%): por debajo, riesgo de convocatoria.'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22C55E', fontWeight: '700', marginLeft: 'auto' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22C55E' }}></span>
                {t('attendance.chart.legend.official') || 'Oficial (Cerrado)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B', fontWeight: '700' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#F59E0B' }}></span>
                {t('attendance.chart.legend.provisional') || 'Provisional (Abierto)'}
              </span>
            </div>
          </div>

          {trendData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {t('attendance.chart.noData') || (isEn ? 'No attendance sessions recorded yet.' : 'Aún no hay sesiones ni partidos registrados.')}
            </div>
          ) : (
            <>
              {/* ── FASE 1: RENDERIZADO MULTILÍNEA SVG ── */}
              <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
                <div style={{ minWidth: '540px', height: '240px', position: 'relative' }}>
                  <svg viewBox="0 0 540 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Líneas horizontales de guía (50%, 70%, 100%) */}
                    <line x1="40" y1="20" x2="510" y2="20" stroke="var(--border-color)" strokeDasharray="4" opacity="0.6" />
                    <text x="8" y="24" fill="var(--text-secondary)" fontSize="10" fontWeight="700">100%</text>

                    <line x1="40" y1="65" x2="510" y2="65" stroke="rgba(239, 68, 68, 0.45)" strokeDasharray="4" strokeWidth="1.5" />
                    <text x="8" y="69" fill="#EF4444" fontSize="10" fontWeight="800">70% ⚠️</text>

                    <line x1="40" y1="110" x2="510" y2="110" stroke="var(--border-color)" strokeDasharray="4" opacity="0.6" />
                    <text x="8" y="114" fill="var(--text-secondary)" fontSize="10" fontWeight="700">50%</text>

                    {(() => {
                      const stepX = trendData.length > 1 ? 460 / (trendData.length - 1) : 0;
                      const getY = (pctVal) => 170 - (Math.max(0, Math.min(100, pctVal ?? 0)) / 100) * 150;

                      const points = trendData.map((d, i) => {
                        const x = trendData.length === 1 ? 270 : 45 + i * stepX;
                        return {
                          x,
                          yAtt: getY(d.pct),
                          yAbs: getY(d.pctAbsent),
                          yLate: getY(d.pctLate),
                          yJust: getY(d.pctJustified),
                          ...d
                        };
                      });

                      const pathAtt = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAtt}`, '');
                      const pathAbs = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAbs}`, '');
                      const pathLate = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLate}`, '');
                      const pathJust = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yJust}`, '');

                      return (
                        <g>
                          {/* Línea 4: Justificados (Azul) */}
                          {visibleSeries.justified && points.length > 1 && (
                            <path d={pathJust} fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeDasharray="3 2" opacity="0.85" />
                          )}

                          {/* Línea 3: Tardes (Naranja) */}
                          {visibleSeries.late && points.length > 1 && (
                            <path d={pathLate} fill="none" stroke="#F97316" strokeWidth="2.2" opacity="0.85" />
                          )}

                          {/* Línea 2: Ausentes (Rojo) */}
                          {visibleSeries.absent && points.length > 1 && (
                            <path d={pathAbs} fill="none" stroke="#EF4444" strokeWidth="2.4" strokeDasharray="4 2" opacity="0.9" />
                          )}

                          {/* Línea 1: Asistencia Real (Verde Principal) */}
                          {visibleSeries.attendance && points.length > 1 && (
                            <path d={pathAtt} fill="none" stroke="#22C55E" strokeWidth="3.2" />
                          )}

                          {/* Puntos y Nodos Interactivos */}
                          {points.map((p, i) => {
                            const isHovered = hoveredTrendPoint?.id === p.id;
                            const pointColor = p.isProvisional ? '#F59E0B' : '#22C55E';

                            return (
                              <g
                                key={i}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  handleSelectEvent(p.id);
                                  setActiveSubView('register');
                                }}
                                onMouseEnter={() => setHoveredTrendPoint(p)}
                                onMouseLeave={() => setHoveredTrendPoint(null)}
                              >
                                {/* Área de toque generosa (Android Touch Target 48x48) */}
                                <circle cx={p.x} cy={p.yAtt} r="22" fill="transparent" />

                                {/* Halo de selección */}
                                {isHovered && (
                                  <circle cx={p.x} cy={p.yAtt} r="14" fill={pointColor} opacity="0.25" />
                                )}

                                {/* Puntos de series secundarias si están activas */}
                                {visibleSeries.justified && (
                                  <circle cx={p.x} cy={p.yJust} r="4" fill="#3B82F6" stroke="var(--bg-card)" strokeWidth="1.5" />
                                )}
                                {visibleSeries.late && (
                                  <circle cx={p.x} cy={p.yLate} r="4" fill="#F97316" stroke="var(--bg-card)" strokeWidth="1.5" />
                                )}
                                {visibleSeries.absent && (
                                  <circle cx={p.x} cy={p.yAbs} r="4.5" fill="#EF4444" stroke="var(--bg-card)" strokeWidth="1.5" />
                                )}

                                {/* Punto Principal de Asistencia */}
                                {visibleSeries.attendance && (
                                  <>
                                    <circle
                                      cx={p.x}
                                      cy={p.yAtt}
                                      r={isHovered ? "8" : "6"}
                                      fill={pointColor}
                                      stroke="var(--bg-card)"
                                      strokeWidth="2.5"
                                      style={{ transition: 'r 0.2s ease' }}
                                    />
                                    <text
                                      x={p.x}
                                      y={p.yAtt - 12}
                                      fill={pointColor}
                                      fontSize="11.5"
                                      fontWeight="900"
                                      textAnchor="middle"
                                    >
                                      {p.pct}%{p.isProvisional ? '*' : ''}
                                    </text>
                                  </>
                                )}

                                {/* Etiqueta de Fecha en el Eje X */}
                                <text
                                  x={p.x}
                                  y="198"
                                  fill="var(--text-secondary)"
                                  fontSize="10"
                                  fontWeight="700"
                                  textAnchor="middle"
                                >
                                  {p.formattedDate}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* ── FASE 4: TARJETA DE DETALLE POR PUNTO AMPLIADA ── */}
              {(() => {
                const activePoint = hoveredTrendPoint || trendData[trendData.length - 1];
                if (!activePoint) return null;
                const b = activePoint.breakdown || {};

                return (
                  <div style={{
                    marginTop: '16px',
                    padding: '18px',
                    borderRadius: '14px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}>
                    {/* Cabecera del Evento Seleccionado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{activePoint.type === 'match' ? '🏆' : '⚽'}</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          {activePoint.title}
                        </strong>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '800',
                          background: activePoint.isProvisional ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: activePoint.isProvisional ? '#F59E0B' : '#22C55E'
                        }}>
                          {activePoint.isProvisional
                            ? (isEn ? '⏳ Provisional (Open)' : '⏳ Provisional (Acta / Registro abierto)')
                            : (isEn ? '✅ Official (Closed)' : '✅ Oficial (Cerrado)')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectEvent(activePoint.id);
                          setActiveSubView('register');
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: '#22C55E',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 10px rgba(34,197,94,0.25)'
                        }}
                      >
                        📋 {t('attendance.chart.openRegister') || (isEn ? 'Open Attendance Register' : 'Abrir Registro de Asistencia')}
                      </button>
                    </div>

                    {/* Resumen de las 4 Series para este Evento */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div style={{ fontSize: '10.5px', color: '#22C55E', fontWeight: '800' }}>🟢 {t('attendance.chart.legend.attendance') || 'ASISTENCIA REAL'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#22C55E' }}>{activePoint.pct}%</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{(b.present ?? 0) + (b.late ?? 0)} / {b.eligible ?? 0} jug.</div>
                      </div>

                      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontSize: '10.5px', color: '#EF4444', fontWeight: '800' }}>🔴 {t('attendance.chart.legend.absent') || 'AUSENTES'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#EF4444' }}>{activePoint.pctAbsent ?? 0}%</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{b.absent ?? 0} faltas</div>
                      </div>

                      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                        <div style={{ fontSize: '10.5px', color: '#F97316', fontWeight: '800' }}>🟠 {t('attendance.chart.legend.late') || 'TARDES'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#F97316' }}>{activePoint.pctLate ?? 0}%</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{b.late ?? 0} retrasos</div>
                      </div>

                      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ fontSize: '10.5px', color: '#3B82F6', fontWeight: '800' }}>🔵 {t('attendance.chart.legend.justified') || 'JUSTIFICADOS'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#3B82F6' }}>{activePoint.pctJustified ?? 0}%</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{b.justified ?? 0} avisos</div>
                      </div>
                    </div>

                    {/* Desglose Completo de Estados (P / T / J / A / L / SR) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
                        🟢 {isEn ? 'Present' : 'Presentes'}: <strong>{b.present ?? 0}</strong>
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        🟡 {isEn ? 'Late' : 'Tardes'}: <strong>{b.late ?? 0}</strong>
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        🔵 {isEn ? 'Justified' : 'Justificados'}: <strong>{b.justified ?? 0}</strong>
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                        🔴 {isEn ? 'Absent' : 'Ausentes'}: <strong>{b.absent ?? 0}</strong>
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>
                        🟣 {isEn ? 'Injured' : 'Lesionados'}: <strong>{b.injured ?? 0}</strong>
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-secondary)' }}>
                        ⚪ {isEn ? 'No Record' : 'Sin Registro'}: <strong>{b.noRecord ?? 0}</strong>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamAttendanceTab;
