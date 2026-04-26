import React from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useSettings } from '../hooks/useSettings';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n/translations';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { players } = usePlayers();
  const { sessions } = useSessions();
  const { matches } = useMatches();

  const nextMatch = matches.find(m => m.status === 'Pendiente') || null;
  const lastMatches = matches.filter(m => m.status === 'Terminado').slice(-3);

  const stats = [
    { label: 'Jugadores', value: players.length, icon: '👥', color: '#4CAF7D' },
    { label: 'Sesiones', value: sessions.length, icon: '📋', color: '#D4A843' },
    { label: 'Próximo Rival', value: nextMatch ? nextMatch.rival.split(' ')[0] : 'None', icon: '⚽', color: '#1B3A2D' },
    { label: 'Partidos', value: matches.length, icon: '🏟️', color: '#3B82F6' },
  ];

  const upcomingSessions = sessions
    .filter(s => new Date(s.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const weeklyLoad = [
    { day: 'Lun', val: 40 },
    { day: 'Mar', val: 85 },
    { day: 'Mié', val: 20 },
    { day: 'Jue', val: 70 },
    { day: 'Vie', val: 95 },
    { day: 'Sáb', val: 100 },
    { day: 'Dom', val: 0 },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="welcome">
          <h1>{t('dashboard.welcome', settings.language, { name: settings.profileName?.split(' ')[0] || 'Míster' })}</h1>
          <p>{t('dashboard.activity', settings.language, { club: settings.clubName || 'Mi Equipo' })}</p>
        </div>
        <div className="current-date">
          <span>{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          <strong>Hoy</strong>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid-dash">
        {stats.map((s, i) => (
          <div key={i} className="stat-card-dash">
            <div className="stat-icon-dash" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-content-dash">
              <span className="stat-label-dash">{s.label}</span>
              <span className="stat-value-dash">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Weekly Load Chart */}
        <div className="dash-section chart-section">
          <div className="section-header">
            <h2>Carga de Trabajo Estimada</h2>
            <select className="dash-select">
              <option>Esta semana</option>
            </select>
          </div>
          <div className="bar-chart">
            {weeklyLoad.map((d, i) => (
              <div key={i} className="bar-wrapper">
                <div className="bar-container">
                  <div className="bar-fill" style={{ height: `${d.val}%` }}>
                    <div className="bar-tooltip">{d.val}%</div>
                  </div>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="dash-section sessions-section">
          <div className="section-header">
            <h2>Próximas Sesiones</h2>
            <button className="btn-text" onClick={() => navigate('/sesiones')}>Ver todas</button>
          </div>
          <div className="sessions-list-dash">
            {upcomingSessions.length === 0 ? (
              <div className="empty-dash-list">No hay sesiones próximas.</div>
            ) : (
              upcomingSessions.map(s => (
                <div key={s.id} className="session-item-dash" onClick={() => navigate('/sesiones')}>
                  <div className={`session-indicator ${s.category.toLowerCase()}`} />
                  <div className="session-info-dash">
                    <strong>{s.title}</strong>
                    <span>{s.date} · {s.time}</span>
                  </div>
                  <div className="session-badges">
                    <span className="badge-dash">{s.category}</span>
                    <span className={`badge-dash intensity ${s.intensity.toLowerCase()}`}>{s.intensity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-dash">
        <h2>Acceso Rápido</h2>
        <div className="actions-grid-dash">
          <button className="action-btn-dash" onClick={() => navigate('/pizarra')}>
            <span>⚽</span>
            Pizarra Táctica
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/sesiones')}>
            <span>📋</span>
            Crear Sesión
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/equipo')}>
            <span>👥</span>
            Mi Equipo
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/ia-generadora')}>
            <span>✨</span>
            IA Generator
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
