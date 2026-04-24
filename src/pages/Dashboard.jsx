import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { label: 'Jugadores', value: '16', icon: '👥', color: '#4CAF7D' },
    { label: 'Sesiones/Semana', value: '4', icon: '📋', color: '#D4A843' },
    { label: 'Próximo Partido', value: 'Sáb', icon: '⚽', color: '#1B3A2D' },
    { label: 'Tests Pendientes', value: '2', icon: '⏱', color: '#EF4444' },
  ];

  const upcomingSessions = [
    { id: 1, title: 'Técnica Individual', date: 'Hoy, 17:30', cat: 'Técnica', intensity: 'Media' },
    { id: 2, title: 'Presión tras pérdida', date: 'Mañana, 18:00', cat: 'Táctica', intensity: 'Alta' },
    { id: 3, title: 'Recuperación Activa', date: 'Jueves, 17:00', cat: 'Física', intensity: 'Baja' },
  ];

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
          <h1>Hola, Míster</h1>
          <p>Esta es la actividad de tu equipo para esta semana.</p>
        </div>
        <div className="current-date">
          <span>Abril 2026</span>
          <strong>Semana 17</strong>
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
            <div className="stat-trend-dash">↑ 12%</div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Weekly Load Chart */}
        <div className="dash-section chart-section">
          <div className="section-header">
            <h2>Carga de Trabajo Semanal</h2>
            <select className="dash-select">
              <option>Esta semana</option>
              <option>Semana pasada</option>
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
            <button className="btn-text">Ver todas</button>
          </div>
          <div className="sessions-list-dash">
            {upcomingSessions.map(s => (
              <div key={s.id} className="session-item-dash">
                <div className={`session-indicator ${s.cat.toLowerCase()}`} />
                <div className="session-info-dash">
                  <strong>{s.title}</strong>
                  <span>{s.date}</span>
                </div>
                <div className="session-badges">
                  <span className="badge-dash">{s.cat}</span>
                  <span className={`badge-dash intensity ${s.intensity.toLowerCase()}`}>{s.intensity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-dash">
        <h2>Acceso Rápido</h2>
        <div className="actions-grid-dash">
          <button className="action-btn-dash">
            <span>⚽</span>
            Nueva Jugada
          </button>
          <button className="action-btn-dash">
            <span>📋</span>
            Crear Sesión
          </button>
          <button className="action-btn-dash">
            <span>👥</span>
            Ficha Médica
          </button>
          <button className="action-btn-dash">
            <span>✨</span>
            IA Generator
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
