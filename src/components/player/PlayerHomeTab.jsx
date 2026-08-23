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
  const [loading, setLoading] = useState(true);

  // 1. Escuchar próxima sesión / partido
  useEffect(() => {
    if (!teamPath) return;

    // Escuchar sesiones programadas
    const sessionsRef = collection(db, `${teamPath}/sessions`);
    const unsubSessions = onSnapshot(sessionsRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, type: 'training', ...d.data() }));
      const now = new Date();
      
      // Filtrar futuras
      const upcoming = all.filter(s => {
        if (!s.fecha) return true;
        const d = new Date(s.fecha);
        return d >= new Date(now.setHours(0,0,0,0));
      });

      // Ordenar por fecha más cercana
      upcoming.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
      if (upcoming.length > 0) {
        setNextEvent(upcoming[0]);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error cargando próxima sesión:', err);
      setLoading(false);
    });

    return () => unsubSessions();
  }, [teamPath]);

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

      {/* MÉTRICAS RÁPIDAS (ASISTENCIA & RACHA) */}
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
            <span className="stat-label">% DE ASISTENCIA</span>
            <span className="stat-number mono">{attendanceStats.percentage}%</span>
            <span className="stat-sub">{attendanceStats.attended} de {attendanceStats.total || attendanceStats.attended} convocatorias</span>
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
