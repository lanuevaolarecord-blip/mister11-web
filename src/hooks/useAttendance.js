import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, setDocument, deleteDocument, addDocument } from '../firebase/db';
import { sanitizeForFirestore } from './useSessions';
import { 
  calculatePlayerAttendanceStats,
  getPendingEvents,
  getTeamAttendanceTrend
} from '../utils/attendanceStatsHelper';
import { 
  calculateAttendanceMetrics, 
  calculateSquadAveragePct,
  getMicrocycleDateRange,
  determineCallupRecommendation,
  toDateKey
} from '../utils/attendanceMath';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useAttendance = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setAttendanceRecords([]);
      setSessions([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);

    // 1. Escuchar asistencia
    const unsubAttendance = subscribeToCollection(`${path}/attendance`, (data) => {
      const sorted = (data || []).sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
      });
      setAttendanceRecords(sorted);
      setLoading(false);
    });

    // 2. Escuchar sesiones
    const unsubSessions = subscribeToCollection(`${path}/sessions`, (data) => {
      setSessions(data || []);
    });

    // 3. Escuchar partidos
    const unsubMatches = subscribeToCollection(`${path}/matches`, (data) => {
      setMatches(data || []);
    });

    return () => {
      unsubAttendance();
      unsubSessions();
      unsubMatches();
    };
  }, [user?.uid, teamId, getTeamPath]);

  /**
   * Guarda o actualiza un registro de asistencia para una sesión o partido.
   * Si es un partido, actualiza también matches/{matchId}.actaOficial.actual para coherencia total.
   * @param {string} docId - ID de la sesión/partido o id personalizado
   * @param {Object} payload - { sessionTitle, date, type, isSuspended, records: { [playerId]: { status, lateMinutes } } }
   */
  const saveAttendance = async (docId, payload) => {
    if (!user || !teamId) throw new Error('No hay usuario o equipo activo.');
    const path = getTeamPath(teamId);
    const cleaned = sanitizeForFirestore({
      sessionId: docId,
      sessionTitle: payload.sessionTitle || 'Sesión / Partido',
      date: payload.date || new Date().toISOString().split('T')[0],
      type: payload.type || 'session',
      isSuspended: Boolean(payload.isSuspended),
      records: payload.records || {}
    });

    if (docId) {
      await setDocument(`${path}/attendance`, docId, cleaned);
    } else {
      await addDocument(`${path}/attendance`, cleaned);
    }

    // Si se marcó como suspendida y es una sesión, actualizar también el doc de sesiones
    if (payload.isSuspended && docId && !docId.startsWith('match_')) {
      try {
        const rawSessionId = docId.replace(/^session_/, '');
        const sessionRef = doc(db, `${path}/sessions`, rawSessionId);
        await updateDoc(sessionRef, { isSuspended: true, status: 'suspended' });
      } catch (err) {
        console.warn('[useAttendance] No se pudo actualizar isSuspended en sessions:', err);
      }
    }

    // Si el evento es un partido, sincronizar con matches/{id}.actaOficial.actual
    const isMatch = payload.type === 'match' || (typeof docId === 'string' && docId.startsWith('match_'));
    if (isMatch) {
      try {
        const cleanMatchId = docId.replace(/^match_/, '');
        const matchDocRef = doc(db, `${path}/matches`, cleanMatchId);
        const STATUS_MAP = {
          present: 'presente',
          late: 'tarde',
          justified: 'justificado',
          absent: 'ausente',
          injured: 'lesionado'
        };

        const actaActualUpdates = {};
        Object.entries(payload.records || {}).forEach(([pid, data]) => {
          const rawStatus = typeof data === 'object' ? data.status : data;
          const status = STATUS_MAP[rawStatus] || rawStatus || 'presente';
          const lateMin = typeof data === 'object' ? data.lateMinutes : null;
          actaActualUpdates[`actaOficial.actual.${pid}`] = {
            status,
            at: new Date().toISOString(),
            by: user.uid,
            ...(lateMin ? { lateMin } : {})
          };
        });

        if (Object.keys(actaActualUpdates).length > 0) {
          await updateDoc(matchDocRef, actaActualUpdates);
        }
      } catch (err) {
        console.warn('[useAttendance] No se pudo sincronizar automáticamente con match.actaOficial:', err);
      }
    }

    // ── REC-7: Sincronizar attendancePct en la ficha del jugador (players/{id}) ──
    if (!payload.isSuspended && payload.records) {
      try {
        const updatedAttendanceList = [
          ...(attendanceRecords || []).filter(r => r.id !== docId && r.sessionId !== docId),
          { id: docId, ...cleaned }
        ];
        Object.keys(payload.records).forEach((pid) => {
          try {
            const stats = calculatePlayerAttendanceStats(pid, updatedAttendanceList, matches, {}, sessions);
            if (stats && stats.percentage !== null && !isNaN(stats.percentage)) {
              const pRef = doc(db, `${path}/players`, pid);
              updateDoc(pRef, { attendancePct: Math.round(Number(stats.percentage)) }).catch(() => {});
            }
          } catch (_) {}
        });
      } catch (_) {}
    }
  };

  /**
   * Elimina un registro de asistencia por ID.
   */
  const removeAttendance = async (docId) => {
    if (!user || !teamId || !docId) return;
    const path = getTeamPath(teamId);
    await deleteDocument(`${path}/attendance`, docId);
  };

  /**
   * Calcula estadísticas individuales para un jugador específico con la fórmula oficial sobre programado.
   */
  const getPlayerStats = (playerId, { dateRange = null, thresholds = {} } = {}) => {
    if (!playerId) {
      return {
        pct: null,
        percentage: null,
        hasData: false,
        status: 'no_data',
        streak: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        injured: 0,
        noRecord: 0,
        suspended: 0,
        total: 0,
        scheduledPast: 0,
        history: [],
        timeline: [],
        eventDetails: [],
        callupGuidance: determineCallupRecommendation(null, thresholds)
      };
    }

    return calculatePlayerAttendanceStats(
      playerId,
      attendanceRecords,
      matches,
      thresholds,
      sessions,
      dateRange
    );
  };

  /**
   * Calcula estadísticas generales del equipo para todos los jugadores.
   */
  const getTeamSquadStats = (players = [], { dateRange = null, thresholds = {} } = {}) => {
    return (players || []).map((p) => {
      const stats = getPlayerStats(p.id, { dateRange, thresholds });
      return {
        player: p,
        ...stats
      };
    });
  };

  /**
   * Calcula la evolución porcentual media de asistencia del equipo por sesión/partido (Fuente Única).
   * Puntos de eventos con acta abierta / sin cerrar se marcan como provisionales (ámbar).
   */
  const getAttendanceTrend = (teamPlayers = []) => {
    return getTeamAttendanceTrend({
      sessions,
      matches,
      attendanceRecords,
      players: teamPlayers
    });
  };

  return {
    attendanceRecords,
    sessions,
    matches,
    loading,
    saveAttendance,
    removeAttendance,
    getPlayerStats,
    getTeamSquadStats,
    getAttendanceTrend,
    getPendingEvents: () => getPendingEvents(sessions, matches, attendanceRecords),
    getUnclosedAttendanceEvents: () => getUnclosedAttendanceEvents(sessions, matches, attendanceRecords)
  };
};

export default useAttendance;
