import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAchievements } from '../../hooks/useAchievements';
import { Calendar, Clock, MapPin, Trophy, Flame, Bell, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
import { calculatePlayerAttendanceStats } from '../../utils/attendanceStatsHelper';
import { pluralize } from '../../utils/pluralize';

export const PlayerHomeTab = ({ player, team, teamPath, onNavigateTab, isParentView = false, closestAchievement = null }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { t, locale, isEn, formatDate } = useTranslation();

  const [nextEvent, setNextEvent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ streak: 0, percentage: null, hasData: false, total: 0, attended: 0 });
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
        const rawMatches = snapM.docs.map(d => ({ id: d.id, ...d.data() }));

        const matches = rawMatches.map(d => ({
          id: d.id,
          type: 'match',
          title: `🏆 Partido vs ${d.rival || d.opponent || 'Rival'}`,
          date: d.fecha || d.date,
          time: d.hora || d.time || '11:00',
          duration: 90,
          location: d.lugar || (d.isHome ? 'Campo Local' : 'Campo Visitante'),
          ...d
        }));

        // Calcular estadísticas canónicas sincronizadas con PlayerStatsTab
        if (player?.id) {
          const stats = calculatePlayerMatchStats(player.id, rawMatches);
          setSeasonPerformance({
            goals: stats.goals || 0,
            minutes: stats.minutesPlayed || 0,
            matches: stats.matchesPlayed || 0
          });
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

  // 3. Escuchar estadísticas de asistencia del jugador (fuente de verdad oficial)
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    let attendanceDocs = [];
    let matchDocs = [];

    const recalculateAttendance = () => {
      const customXpTable = team?.settings?.achievementTargets || team?.achievementTargets || {};
      const stats = calculatePlayerAttendanceStats(player.id, attendanceDocs, matchDocs, customXpTable);
      setAttendanceStats({
        streak: stats.streak,
        maxStreak: stats.maxStreak,
        percentage: stats.percentage,
        pct: stats.pct,
        hasData: stats.hasData,
        status: stats.status,
        total: stats.totalVerified,
        attended: stats.attended,
        attendanceXP: stats.attendanceXP,
        hasPendingEvents: stats.hasPendingEvents
      });
    };

    const attRef = collection(db, `${teamPath}/attendance`);
    const unsubAtt = onSnapshot(attRef, (snap) => {
      attendanceDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recalculateAttendance();
    }, (err) => {
      console.warn('Error cargando asistencia:', err);
    });

    const matchRef = collection(db, `${teamPath}/matches`);
    const unsubMatches = onSnapshot(matchRef, (snap) => {
      matchDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      recalculateAttendance();
    }, (err) => {
      console.warn('Error cargando partidos para asistencia:', err);
    });

    return () => {
      unsubAtt();
      unsubMatches();
    };
  }, [teamPath, player?.id, team]);

  return (
    <div className="player-tab-content player-home-tab">
      {/* Saludo y Cabecera del Jugador */}
      <div className="player-hero-header">
        <div className="player-avatar-badge">
          {player?.number ? `#${player.number}` : (player?.name || 'M11').substring(0,2).toUpperCase()}
        </div>
        <div className="player-header-text">
          <span className="player-team-pill">
            ⚽ {team?.nombre || team?.name || t('nav.equipo')} · {player?.position || (isEn ? 'Player' : 'Jugador')}
          </span>
          <h2 className="player-greeting">
            {t('player.home.greeting', { name: player?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || (isEn ? 'Star' : 'Crack') })}
          </h2>
          <p className="player-status-sub">
            {t('player.home.subtitle')}
          </p>
        </div>
      </div>

      {/* TARJETA PRÓXIMA SESIÓN / PARTIDO (GAMING / HUD STYLE) */}
      <div className="hud-card next-event-hud">
        <div className="hud-card-glow" />
        <div className="hud-header">
          <div className="hud-badge">
            <Activity size={14} /> {t('player.home.nextEventBadge')}
          </div>
          <span className="hud-status-live">{t('player.home.scheduled')}</span>
        </div>

        {nextEvent ? (
          <div className="hud-body">
            <h3 className="hud-event-title">
              {nextEvent.titulo || nextEvent.title || (nextEvent.type === 'match' ? t('player.schedule.match') : t('player.schedule.training'))}
            </h3>

            <div className="hud-meta-grid">
              <div className="hud-meta-item">
                <Calendar size={16} className="hud-icon" />
                <span>{nextEvent.fecha ? formatDate(nextEvent.fecha, { weekday: 'short', day: 'numeric', month: 'short' }) : t('player.home.soon')}</span>
              </div>
              <div className="hud-meta-item">
                <Clock size={16} className="hud-icon" />
                <span>{nextEvent.hora || nextEvent.time || '18:30'} ({nextEvent.duracion || 90} min)</span>
              </div>
              <div className="hud-meta-item full-width">
                <MapPin size={16} className="hud-icon" />
                <span>{nextEvent.lugar || nextEvent.location || (isEn ? 'Training Ground' : 'Campo de Entrenamiento')}</span>
              </div>
            </div>

            <button 
              className="hud-action-btn"
              onClick={() => onNavigateTab('schedule')}
            >
              {t('player.home.rsvpBtn')} <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="hud-empty">
            <p>{t('player.home.noUpcoming')}</p>
            <button className="hud-action-btn" onClick={() => onNavigateTab('schedule')}>
              {t('player.home.viewSchedule')} <ChevronRight size={16} />
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
            <span className="stat-label">{t('player.home.streak')}</span>
            <span className="stat-number mono">{attendanceStats.streak}</span>
            <span className="stat-sub">
              {attendanceStats.streak === 1 
                ? t('player.home.streakSession', { count: attendanceStats.streak }) 
                : t('player.home.streakSessions', { count: attendanceStats.streak })}
            </span>
          </div>
        </div>

        <div className="hud-stat-card">
          <div className="stat-icon-wrap green">
            <Trophy size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('player.home.goals')}</span>
            <span className="stat-number mono">{seasonPerformance.goals} ⚽</span>
            <span className="stat-sub">
              {t('player.home.goalsSummary', {
                goals: seasonPerformance.goals,
                matches: seasonPerformance.matches === 1 
                  ? (isEn ? '1 match' : '1 partido') 
                  : (isEn ? `${seasonPerformance.matches} matches` : `${seasonPerformance.matches} partidos`),
                minutes: seasonPerformance.minutes
              })}
            </span>
          </div>
        </div>
      </div>

      {/* WIDGET LOGRO MÁS CERCANO (≥ 60% PROGRESO) */}
      {closestAchievement && (
        <div 
          className="hud-card closest-achievement-card"
          style={{
            background: 'linear-gradient(135deg, rgba(27, 58, 45, 0.6) 0%, rgba(201, 168, 76, 0.1) 100%)',
            border: '1.5px solid rgba(201, 168, 76, 0.4)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '16px',
            cursor: 'pointer'
          }}
          onClick={() => onNavigateTab('achievements')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>{closestAchievement.tierInfo?.icon || '🏆'}</span>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#D4A843', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {closestAchievement.tier === 'GOLD' 
                    ? t('player.home.almostGold') 
                    : (closestAchievement.tier === 'SILVER' 
                        ? t('player.home.almostSilver') 
                        : (closestAchievement.tier === 'BRONZE' 
                            ? t('player.home.almostBronze') 
                            : t('player.home.nextChallenge')))}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 800 }}>
                  {closestAchievement.nameKey ? t(closestAchievement.nameKey, {}, closestAchievement.name) : closestAchievement.name}
                </h4>
              </div>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#D4A843' }}>
              {closestAchievement.progress} / {closestAchievement.target}
            </span>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${closestAchievement.percent}%`, height: '100%', background: '#D4A843', borderRadius: '4px' }} />
          </div>
        </div>
      )}

      {/* MURO DE ANUNCIOS DEL ENTRENADOR */}
      <div className="player-announcements-section">
        <div className="section-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('player.home.announcements')}</h3>
          </div>
        </div>

        {announcements.length > 0 ? (
          <div className="announcements-list">
            {announcements.map((ann) => (
              <div key={ann.id} className="announcement-item">
                <div className="ann-header">
                  <span className="ann-author">⚽ {ann.authorName || (isEn ? 'Coaching Staff' : 'Cuerpo Técnico')}</span>
                  <span className="ann-date">
                    {ann.createdAt?.seconds ? formatDate(ann.createdAt.seconds * 1000) : (isEn ? 'Recent' : 'Reciente')}
                  </span>
                </div>
                <h4 className="ann-title">{ann.title}</h4>
                <p className="ann-message">{ann.message || ann.contenido}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="announcements-empty">
            <p>{t('player.home.noAnnouncements')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHomeTab;
