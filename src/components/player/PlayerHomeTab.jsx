import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, MapPin, Trophy, Flame, Bell, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

export const PlayerHomeTab = ({ player, team, teamPath, onNavigateTab }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();

  const [nextEvent, setNextEvent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ streak: 0, percentage: 100, total: 0, attended: 0 });
  const [seasonPerformance, setSeasonPerformance] = useState({ goals: 0, minutes: 0, matches: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Escuchar próxima sesión Y próximo partido
  useEffect(() => {
    if (!teamPath) return;

    const parseDateSafe = (dStr) => {
      if (!dStr) return null;
      if (typeof dStr === 'string') return new Date(dStr.split('T')[0]);
      if (dStr.toDate) return dStr.toDate();
      if (dStr instanceof Date) return dStr;
      return null;
    };

    // Escuchar sesiones
    const sessionsRef = collection(db, `${teamPath}/sessions`);
    const unsubSessions = onSnapshot(sessionsRef, (snapS) => {
      const sessions = snapS.docs.map(d => ({
        id: d.id,
        type: 'session',
        title: d.data().titulo || d.data().title || 'Entrenamiento Táctico',
        date: d.data().fecha || d.data().date,
        time: d.data().hora || d.data().time || '18:30',
        duration: d.data().duracion || 90,
        location: d.data().lugar || d.data().location || 'Campo de Entrenamiento',
        ...d.data()
      }));

      // Escuchar partidos
      const matchesRef = collection(db, `${teamPath}/matches`);
      const unsubMatches = onSnapshot(matchesRef, (snapM) => {
        const matches = snapM.docs.map(d => ({
          id: d.id,
          type: 'match',
          title: `🏆 Partido vs ${d.data().rival || d.data().opponent || 'Rival'}`,
          date: d.data().fecha || d.data().date,
          time: d.data().hora || d.data().time || '11:00',
          duration: 90,
          location: d.data().lugar || (d.data().isHome ? 'Campo Local' : 'Campo Visitante'),
          ...d.data()
        }));

        // Calcular estadísticas de rendimiento del jugador en partidos
        if (player?.id) {
          let goals = 0;
          let mins = 0;
          let pCount = 0;
          matches.forEach(m => {
            const goleadores = m.goleadoresList || [];
            const events = m.events || [];
            const pStats = m.playerStats?.[player.id];
            
            const gCount = goleadores.filter(g => String(g.jugadorId) === String(player.id)).length ||
                           events.filter(e => (e.type === 'gol_local' || e.type === 'gol') && (String(e.playerId) === String(player.id) || String(e.jugadorId) === String(player.id))).length ||
                           (pStats?.goals || 0);
            
            const isTitular = m.titulares?.includes(player.id) || m.alineacion?.titulares?.includes(player.id);
            const mPlayed = pStats?.minutesPlayed || (isTitular ? 90 : 0);
            
            if (isTitular || mPlayed > 0 || gCount > 0) {
              pCount++;
              goals += gCount;
              mins += mPlayed;
            }
          });

          setSeasonPerformance({ goals, minutes: mins, matches: pCount });
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const allUpcoming = [...sessions, ...matches].filter(evt => {
          const d = parseDateSafe(evt.date);
          return d && d >= now;
        });

        allUpcoming.sort((a, b) => (parseDateSafe(a.date) || 0) - (parseDateSafe(b.date) || 0));

        if (allUpcoming.length > 0) {
          setNextEvent(allUpcoming[0]);
        } else if (sessions.length > 0 || matches.length > 0) {
          setNextEvent(sessions[0] || matches[0]);
        }
        setLoading(false);
      }, (err) => {
        console.warn('Error cargando partidos en Home:', err);
        setLoading(false);
      });

      return () => unsubMatches();
    }, (err) => {
      console.warn('Error cargando sesiones en Home:', err);
      setLoading(false);
    });

    return () => unsubSessions();
  }, [teamPath, player?.id]);

  // 2. Escuchar anuncios del equipo
  useEffect(() => {
    if (!teamPath) return;

    const annRef = collection(db, `${teamPath}/announcements`);
    const q = query(annRef, limit(5));
    const unsubAnn = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAnnouncements(all);
    }, (err) => {
      console.warn('Error cargando anuncios:', err);
    });

    return () => unsubAnn();
  }, [teamPath]);

  // 3. Escuchar estadísticas de asistencia del jugador
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    const attRef = collection(db, `${teamPath}/attendance`);
    const unsubAtt = onSnapshot(attRef, (snap) => {
      let attended = 0;
      let total = 0;
      let streak = 0;
      let currentStreakCount = 0;

      const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      records.sort((a, b) => new Date(b.date || b.fecha || 0) - new Date(a.date || a.fecha || 0));

      records.forEach((rec, idx) => {
        const isPresent = rec.presentPlayers?.includes(player.id) || rec.players?.[player.id]?.present;
        if (rec.presentPlayers || rec.players) {
          total++;
          if (isPresent) {
            attended++;
            if (idx === streak) {
              streak++;
            }
          }
        }
      });

      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
      setAttendanceStats({
        streak: streak || (attended > 0 ? attended : 0),
        percentage,
        total,
        attended
      });
    }, (err) => {
      console.warn('Error cargando asistencia:', err);
    });

    return () => unsubAtt();
  }, [teamPath, player?.id]);

  return (
    <div className="player-tab-content player-home-tab">
      {/* Saludo y Cabecera del Jugador */}
      <div className="player-hero-header">
        <div className="player-avatar-badge">
          {player?.number ? `#${player.number}` : (player?.name || 'M11').substring(0,2).toUpperCase()}
        </div>
        <div className="player-header-text">
          <span className="player-team-pill">
            ⚽ {team?.nombre || team?.name || 'Mi Equipo'} · {player?.position || 'Jugador'}
          </span>
          <h2 className="player-greeting">
            ¡Hola, {player?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Crack'}! 👋
          </h2>
          <p className="player-status-sub">
            Todo listo para tu próximo entrenamiento.
          </p>
        </div>
      </div>

      {/* TARJETA PRÓXIMA SESIÓN / PARTIDO (GAMING / HUD STYLE) */}
      <div className="hud-card next-event-hud">
        <div className="hud-card-glow" />
        <div className="hud-header">
          <div className="hud-badge">
            <Activity size={14} /> PRÓXIMA CONVOCATORIA
          </div>
          <span className="hud-status-live">PROGRAMADO</span>
        </div>

        {nextEvent ? (
          <div className="hud-body">
            <h3 className="hud-event-title">
              {nextEvent.titulo || nextEvent.title || 'Entrenamiento Táctico'}
            </h3>

            <div className="hud-meta-grid">
              <div className="hud-meta-item">
                <Calendar size={16} className="hud-icon" />
                <span>{nextEvent.fecha ? new Date(nextEvent.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Próximamente'}</span>
              </div>
              <div className="hud-meta-item">
                <Clock size={16} className="hud-icon" />
                <span>{nextEvent.hora || nextEvent.time || '18:30'} ({nextEvent.duracion || 90} min)</span>
              </div>
              <div className="hud-meta-item full-width">
                <MapPin size={16} className="hud-icon" />
                <span>{nextEvent.lugar || nextEvent.location || 'Campo de Entrenamiento'}</span>
              </div>
            </div>

            <button 
              className="hud-action-btn"
              onClick={() => onNavigateTab('schedule')}
            >
              Confirmar Asistencia (RSVP) <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="hud-empty">
            <p>No hay entrenamientos programados para los próximos días.</p>
            <button className="hud-action-btn" onClick={() => onNavigateTab('schedule')}>
              Ver Calendario Completo <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* MÉTRICAS RÁPIDAS (ASISTENCIA, RACHA Y PARTIDOS) */}
      <div className="player-metrics-row">
        <div className="hud-stat-card">
          <div className="stat-icon-wrap gold">
            <Flame size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">RACHA DE ASISTENCIA</span>
            <span className="stat-number mono">{attendanceStats.streak}</span>
            <span className="stat-sub">sesiones consecutivas</span>
          </div>
        </div>

        <div className="hud-stat-card">
          <div className="stat-icon-wrap green">
            <Trophy size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">GOLES EN PARTIDOS</span>
            <span className="stat-number mono">{seasonPerformance.goals} ⚽</span>
            <span className="stat-sub">{seasonPerformance.matches} partidos disputados ({seasonPerformance.minutes}')</span>
          </div>
        </div>
      </div>

      {/* MURO DE ANUNCIOS DEL ENTRENADOR */}
      <div className="player-announcements-section">
        <div className="section-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Comunicados del Equipo</h3>
          </div>
        </div>

        {announcements.length > 0 ? (
          <div className="announcements-list">
            {announcements.map((ann) => (
              <div key={ann.id} className="announcement-item">
                <div className="ann-header">
                  <span className="ann-author">⚽ {ann.authorName || 'Cuerpo Técnico'}</span>
                  <span className="ann-date">
                    {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
                <h4 className="ann-title">{ann.title}</h4>
                <p className="ann-message">{ann.message || ann.contenido}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="announcements-empty">
            <p>No hay avisos recientes del entrenador.</p>
          </div>
        )}
      </div>
    </div>
  );
};
