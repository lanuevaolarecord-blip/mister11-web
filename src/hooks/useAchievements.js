import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ACHIEVEMENTS_CATALOG, ACHIEVEMENT_TIERS, DEFAULT_SEASON_SETTINGS } from '../config/achievements';
import { showToast } from '../utils/toast';

export const useAchievements = (teamPath, playerId, isParentView = false) => {
  const [unlockedState, setUnlockedState] = useState({});
  const [seasonSettings, setSeasonSettings] = useState(DEFAULT_SEASON_SETTINGS);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [wellnessRecords, setWellnessRecords] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registro en memoria de logros ya notificados en esta sesión para evitar bucles de toasts
  const notifiedAchievementsRef = useRef(new Set());
  const initialLoadCompletedRef = useRef(false);

  // 1. Escuchar logros desbloqueados guardados en Firestore
  useEffect(() => {
    if (!teamPath || !playerId) {
      setLoading(false);
      return;
    }

    const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
    const achColRef = collection(db, `${cleanPath}/players/${playerId}/achievements`);
    const unsub = onSnapshot(achColRef, (snap) => {
      const stateMap = {};
      snap.docs.forEach(d => {
        stateMap[d.id] = { id: d.id, ...d.data() };
        if (d.data().unlocked) {
          notifiedAchievementsRef.current.add(d.id);
        }
      });
      setUnlockedState(stateMap);
      initialLoadCompletedRef.current = true;
      setLoading(false);
    }, (err) => {
      console.warn('[useAchievements] Error escuchando logros:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [teamPath, playerId]);

  // 2. Escuchar sesiones y partidos del equipo
  useEffect(() => {
    if (!teamPath) return;
    const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');

    const unsubSessions = onSnapshot(collection(db, `${cleanPath}/sessions`), (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMatches = onSnapshot(collection(db, `${cleanPath}/matches`), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAttendance = onSnapshot(collection(db, `${cleanPath}/attendance`), (snap) => {
      setAttendanceRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSessions();
      unsubMatches();
      unsubAttendance();
    };
  }, [teamPath]);

  // 3. Escuchar tests y wellness del jugador
  useEffect(() => {
    if (!teamPath || !playerId) return;
    const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');

    const unsubWellness = onSnapshot(collection(db, `${cleanPath}/players/${playerId}/wellness`), (snap) => {
      setWellnessRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTests = onSnapshot(collection(db, `${cleanPath}/test_results`), (snap) => {
      const myTests = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.playerId === playerId);
      setTestResults(myTests);
    });

    return () => {
      unsubWellness();
      unsubTests();
    };
  }, [teamPath, playerId]);

  // 4. Calcular el progreso dinámico de cada logro
  const computedAchievements = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    const day = currentWeekStart.getDay();
    const diffToMonday = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diffToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const weekStartStr = currentWeekStart.toISOString().split('T')[0];

    // Sesiones programadas en la semana actual
    const sessionsThisWeek = sessions.filter(s => {
      const sDate = s.fecha || s.date;
      return sDate && sDate >= weekStartStr;
    });

    // Detectar si hay eventos con RSVP del jugador pero pendientes de verificación por el míster
    const pendingSessionsThisWeek = sessionsThisWeek.filter(s => {
      const hasRsvp = Boolean(s.playerRsvp?.[String(playerId)]);
      const hasStaff = Boolean(s.records?.[String(playerId)]);
      return hasRsvp && !hasStaff;
    });

    const pendingMatches = matches.filter(m => {
      const isCalledOrRsvp = (m.convocados || []).includes(playerId) || Boolean(m.playerRsvp?.[String(playerId)]);
      const isClosed = m.actaOficial?.closed === true;
      return isCalledOrRsvp && !isClosed;
    });

    // Asistencias del jugador en la semana — SOLO desde registros del míster (records[])
    // NUNCA desde playerRsvp para evitar auto-aprobar sin verificación del staff.
    const attendedThisWeek = attendanceRecords.filter(a => {
      const aDate = a.fecha || a.date;
      if (!aDate || aDate < weekStartStr) return false;
      // Leer SOLO el campo `records` escrito por el staff
      const staffRecord = a.records?.[String(playerId)];
      if (!staffRecord) return false; // sin registro del míster → pendiente
      return staffRecord.status === 'present' ||
             staffRecord.status === 'presente' ||
             staffRecord.status === 'late' ||
             staffRecord.status === 'tarde';
    });

    // Check-ins de wellness en la semana
    const wellnessThisWeek = wellnessRecords.filter(w => w.id >= weekStartStr);

    // ── FUENTE DE VERDAD: goles/assists/partidos SOLO desde actas cerradas ──
    let totalGoals = 0;
    let totalAssists = 0;
    let matchesWithMinutesOrCalled = 0; // solo actas cerradas con minutos > 0

    matches.forEach(m => {
      const pid = String(playerId);
      const acta = m.actaOficial;
      const actaClosed = acta?.closed === true;
      const actaActual = acta?.actual?.[pid];

      // Goles y asistencias (desde listas o eventos, independiente del acta)
      const goleadores = Array.isArray(m.goleadoresList) ? m.goleadoresList : [];
      const events = Array.isArray(m.events) ? m.events : [];
      const pStats = m.playerStats?.[pid];

      const gCount = goleadores.length > 0
        ? goleadores.filter(g => String(g.jugadorId) === pid).length
        : events.filter(e => (e.type === 'gol' || e.type === 'gol_local') && (String(e.playerId) === pid || String(e.jugadorId) === pid)).length
          + (pStats?.goals || 0);

      const aCount = goleadores.length > 0
        ? goleadores.filter(g => String(g.asistenciaId) === pid).length
        : events.filter(e => String(e.asistenciaId) === pid).length
          + (pStats?.assists || 0);

      totalGoals += gCount;
      totalAssists += aCount;

      // Partidos jugados: SOLO si acta cerrada con minutos > 0
      if (actaClosed && actaActual && (actaActual.minutes || 0) > 0) {
        matchesWithMinutesOrCalled++;
      }
      // Si acta NO cerrada: el jugador aparece como convocado/participante pero
      // NO se cuenta como partido jugado hasta que el staff cierre el acta.
    });

    return ACHIEVEMENTS_CATALOG.map(ach => {
      let progress = 0;
      let target = ach.defaultTarget;
      let isActive = true;
      let isPendingActa = false;

      if (ach.id === 'weekly_perfect_week') {
        target = Math.max(1, sessionsThisWeek.length || ach.defaultTarget);
        progress = attendedThisWeek.length;
        if (sessionsThisWeek.length === 0) isActive = false;
        if (pendingSessionsThisWeek.length > 0 && progress < target) {
          isPendingActa = true;
        }
      } else if (ach.id === 'weekly_wellness') {
        target = Math.max(1, sessionsThisWeek.length || ach.defaultTarget);
        progress = wellnessThisWeek.length;
        if (sessionsThisWeek.length === 0) isActive = false;
      } else if (ach.id === 'weekly_scholar') {
        progress = testResults.filter(t => (t.createdAt?.toDate ? t.createdAt.toDate().toISOString().split('T')[0] : t.date) >= weekStartStr).length;
      } else if (ach.id === 'weekly_committed') {
        progress = Math.min(target, wellnessThisWeek.length > 0 ? 1 : 0);
      } else if (ach.id === 'weekly_attentive') {
        // Consultar próximas convocatorias
        progress = (sessions.length > 0 || matches.length > 0) ? 1 : 0;
      } else if (ach.id === 'biweekly_iron') {
        // SOLO registros verificados por el míster (records[playerId]), nunca playerRsvp
        progress = attendanceRecords.filter(a => {
          const staffRecord = a.records?.[String(playerId)];
          if (!staffRecord) return false;
          return staffRecord.status === 'present' ||
                 staffRecord.status === 'presente' ||
                 staffRecord.status === 'late' ||
                 staffRecord.status === 'tarde';
        }).length;
        if (pendingSessionsThisWeek.length > 0 && progress < target) {
          isPendingActa = true;
        }
      } else if (ach.id === 'biweekly_self_care') {
        progress = wellnessRecords.length;
      } else if (ach.id === 'biweekly_strong_mind') {
        progress = testResults.length;
      } else if (ach.id === 'biweekly_fit') {
        progress = testResults.length > 0 ? 1 : 0;
      } else if (ach.id === 'biweekly_teammate') {
        // Único reto basado en intención/RSVP previo a eventos
        const rsvpInSessions = attendanceRecords.filter(a => Boolean(a.playerRsvp?.[String(playerId)])).length;
        const rsvpInMatches = matches.filter(m => Boolean(m.playerRsvp?.[String(playerId)])).length;
        progress = rsvpInSessions + rsvpInMatches;
      } else if (ach.id === 'season_veteran') {
        target = Math.max(5, Math.round((matches.length || 20) * ((seasonSettings.veteranPct || 80) / 100)));
        progress = matchesWithMinutesOrCalled;
        if (pendingMatches.length > 0 && progress < target) {
          isPendingActa = true;
        }
      } else if (ach.id === 'season_scorer') {
        target = seasonSettings.seasonGoals || 10;
        progress = totalGoals;
      } else if (ach.id === 'season_assist') {
        target = seasonSettings.seasonAssists || 10;
        progress = totalAssists;
      } else if (ach.id === 'season_unstoppable') {
        progress = Math.min(21, wellnessRecords.length);
      } else if (ach.id === 'season_analyst') {
        progress = Math.min(target, testResults.length);
      } else if (ach.id === 'season_captain') {
        // Solo sesiones con registro verificado del míster
        progress = Math.min(target, attendanceRecords.filter(a => {
          const staffRecord = a.records?.[String(playerId)];
          return staffRecord && (staffRecord.status === 'present' || staffRecord.status === 'presente' ||
                                 staffRecord.status === 'late' || staffRecord.status === 'tarde');
        }).length);
        if (pendingSessionsThisWeek.length > 0 && progress < target) {
          isPendingActa = true;
        }
      }

      const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
      const isEligible = progress >= target && isActive;
      // Si se reabre un acta y progress baja del objetivo, no se mantiene desbloqueado
      const isUnlocked = isEligible;

      return {
        ...ach,
        progress,
        target,
        percent,
        isActive,
        isPendingActa,
        isUnlocked,
        tierInfo: ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.BRONZE
      };
    });
  }, [sessions, matches, attendanceRecords, wellnessRecords, testResults, unlockedState, playerId, seasonSettings]);

  // 5. Guardar logros recién desbloqueados con control estricto de notificación única
  useEffect(() => {
    if (!teamPath || !playerId || isParentView || !initialLoadCompletedRef.current) return;

    computedAchievements.forEach(async (ach) => {
      const alreadyStored = unlockedState[ach.id]?.unlocked === true;
      const alreadyNotified = notifiedAchievementsRef.current.has(ach.id);

      if (ach.isUnlocked && !alreadyStored && !alreadyNotified) {
        // Bloquear notificación inmediata en memoria
        notifiedAchievementsRef.current.add(ach.id);

        try {
          const cleanPath = teamPath.replace(/^\/+|\/+$/g, '');
          const achRef = doc(db, `${cleanPath}/players/${playerId}/achievements`, ach.id);
          await setDoc(achRef, {
            unlocked: true,
            unlockedAt: serverTimestamp(),
            timesUnlocked: increment(1),
            lastProgress: ach.progress
          }, { merge: true });

          // Notificación única
          showToast(`🏆 ¡Logro desbloqueado: ${ach.name}! (+${ach.xp} XP)`, 'success');
          if (ach.tier === 'GOLD' && navigator?.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        } catch (err) {
          console.warn('Error guardando logro desbloqueado:', err);
        }
      }
    });
  }, [computedAchievements, unlockedState, teamPath, playerId, isParentView]);

  // Logro más cercano a completarse (≥ 60% y < 100%)
  const closestAchievement = useMemo(() => {
    const pending = computedAchievements.filter(a => !a.isUnlocked && a.isActive && a.percent >= 60);
    pending.sort((a, b) => b.percent - a.percent);
    return pending[0] || null;
  }, [computedAchievements]);

  return {
    achievements: computedAchievements,
    closestAchievement,
    loading
  };
};
