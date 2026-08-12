import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, setDocument, deleteDocument, addDocument } from '../firebase/db';
import { sanitizeForFirestore } from './useSessions';

export const useAttendance = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !teamId) {
      setAttendanceRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/attendance`, (data) => {
      // Ordenar cronológicamente por fecha ascendente
      const sorted = (data || []).sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
      });
      setAttendanceRecords(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, teamId, getTeamPath]);

  /**
   * Guarda o actualiza un registro de asistencia para una sesión o partido.
   * @param {string} docId - ID de la sesión/partido o id personalizado
   * @param {Object} payload - { sessionTitle, date, type, records: { [playerId]: { status, lateMinutes } } }
   */
  const saveAttendance = async (docId, payload) => {
    if (!user || !teamId) throw new Error('No hay usuario o equipo activo.');
    const path = getTeamPath(teamId);
    const cleaned = sanitizeForFirestore({
      sessionId: docId,
      sessionTitle: payload.sessionTitle || 'Sesión / Partido',
      date: payload.date || new Date().toISOString().split('T')[0],
      type: payload.type || 'session',
      records: payload.records || {}
    });

    if (docId) {
      await setDocument(`${path}/attendance`, docId, cleaned);
    } else {
      await addDocument(`${path}/attendance`, cleaned);
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
   * Calcula estadísticas individuales para un jugador específico.
   */
  const getPlayerStats = (playerId) => {
    if (!playerId || attendanceRecords.length === 0) {
      return {
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
    }

    let present = 0;
    let absent = 0;
    let justified = 0;
    let late = 0;
    let injured = 0;

    const history = [];

    attendanceRecords.forEach((record) => {
      const rec = record.records && record.records[playerId];
      if (rec) {
        const status = rec.status || 'present';
        const item = {
          id: record.id,
          sessionTitle: record.sessionTitle,
          date: record.date,
          type: record.type,
          status,
          lateMinutes: rec.lateMinutes || 0
        };
        history.push(item);

        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'justified') justified++;
        else if (status === 'late') late++;
        else if (status === 'injured') injured++;
      }
    });

    const attendedCount = present + late;
    const eligibleTotal = present + late + absent + justified;
    const pct = eligibleTotal > 0 ? Math.round((attendedCount / eligibleTotal) * 100) : 100;

    // Racha de asistencias consecutivas (ordenando por fecha descendente)
    const reversedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    for (const h of reversedHistory) {
      if (h.status === 'present' || h.status === 'late' || h.status === 'justified') {
        streak++;
      } else if (h.status === 'absent') {
        break;
      }
    }

    return {
      pct,
      streak,
      present,
      absent,
      justified,
      late,
      injured,
      total: history.length,
      history: reversedHistory
    };
  };

  /**
   * Calcula estadísticas generales del equipo para todos los jugadores.
   */
  const getTeamSquadStats = (players = []) => {
    return (players || []).map((p) => {
      const stats = getPlayerStats(p.id);
      return {
        player: p,
        ...stats
      };
    });
  };

  /**
   * Calcula la evolución porcentual media de asistencia del equipo por sesión/semana.
   */
  const getAttendanceTrend = () => {
    if (attendanceRecords.length === 0) return [];

    return attendanceRecords.map((rec, idx) => {
      const recs = rec.records || {};
      const entries = Object.values(recs);
      let attended = 0;
      let eligible = 0;

      entries.forEach((r) => {
        if (r.status === 'present' || r.status === 'late') {
          attended++;
          eligible++;
        } else if (r.status === 'absent' || r.status === 'justified') {
          eligible++;
        }
      });

      const pct = eligible > 0 ? Math.round((attended / eligible) * 100) : 100;
      const formattedDate = rec.date ? new Date(rec.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : `S${idx + 1}`;

      return {
        id: rec.id,
        title: rec.sessionTitle || `Sesión ${idx + 1}`,
        date: rec.date,
        formattedDate,
        pct
      };
    });
  };

  return {
    attendanceRecords,
    loading,
    saveAttendance,
    removeAttendance,
    getPlayerStats,
    getTeamSquadStats,
    getAttendanceTrend
  };
};
