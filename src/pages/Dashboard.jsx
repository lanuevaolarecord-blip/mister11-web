import React, { useState } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useSettings } from '../hooks/useSettings';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { useAuth } from '../context/AuthContext';
import { useHealthAlerts } from '../hooks/useHealthAlerts';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { 
  Users, 
  ClipboardList, 
  Trophy, 
  Calendar, 
  Presentation, 
  FilePlus, 
  Sparkles,
  Crown,
  Info,
  Shield
} from 'lucide-react';
import { t } from '../i18n/translations';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeTeamId } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const { players } = usePlayers(activeTeamId);
  const { sessions } = useSessions(activeTeamId);
  const { matches } = useMatches(activeTeamId);
  const { alerts, loading: alertsLoading } = useHealthAlerts();
  const { playerPlans, teamPlans } = usePlayerPlans(activeTeamId);
  const [workloadPeriod, setWorkloadPeriod] = useState('Esta semana');

  // Calcular jugadores con ejercicios pendientes hoy
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay(); // 0=Dom,1=Lun,...,6=Sáb

  const checkFrequencyMatchesToday = (frequency) => {
    if (!frequency || frequency === 'daily') return true;
    if (frequency === 'weekly') return dayOfWeek === 1; // Lunes
    if (frequency === 'mon-wed-fri') return [1, 3, 5].includes(dayOfWeek);
    if (frequency === 'pre-match') return false; // Solo el entrenador decide
    return true;
  };

  const pendingExercisePlayers = players
    .map(player => {
      const myPlans = playerPlans.filter(p => p.playerId === player.id && p.active);
      const myTeamPlans = teamPlans.filter(p => p.active && p.assignedToAll);
      const allActivePlans = [...myPlans, ...myTeamPlans];

      const pendingToday = allActivePlans.some(plan =>
        plan.exercises && plan.exercises.some(ex => {
          if (!checkFrequencyMatchesToday(ex.frequency)) return false;
          const completedDates = ex.completedDates || [];
          return !completedDates.includes(today);
        })
      );

      return pendingToday ? player : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  const nextMatch = matches.find(m => m.status === 'Pendiente') || null;
  const lastMatches = matches.filter(m => m.status === 'Terminado').slice(-3);

  const stats = [
    { label: 'Jugadores', value: players.length, icon: <Users size={24} />, color: '#4CAF7D', route: '/equipo' },
    { label: 'Sesiones', value: sessions.length, icon: <ClipboardList size={24} />, color: '#4CAF7D', route: '/sesiones' },
    { label: 'Próximo Rival', value: nextMatch ? (nextMatch.rival || '').split(' ')[0] || 'Sin rival' : 'Sin rival', icon: <Trophy size={24} />, color: '#4CAF7D', route: '/partidos' },
    { label: 'Partidos', value: matches.length, icon: <Calendar size={24} />, color: '#4CAF7D', route: '/partidos' },
  ];

  const upcomingSessions = sessions
    .filter(s => new Date(s.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const getWorkloadData = () => {
    switch (workloadPeriod) {
      case 'Esta sesión':
        return [
          { day: 'Calent.', val: 20 },
          { day: 'Técnica', val: 50 },
          { day: 'Táctica', val: 80 },
          { day: 'ABP', val: 30 },
          { day: 'Físico', val: 60 },
        ];
      case 'Esta semana':
        return [
          { day: 'Lun', val: 40 }, { day: 'Mar', val: 85 }, { day: 'Mié', val: 20 },
          { day: 'Jue', val: 70 }, { day: 'Vie', val: 95 }, { day: 'Sáb', val: 100 },
          { day: 'Dom', val: 0 },
        ];
      case 'Este microciclo':
        return [
          { day: 'S1', val: 70 }, { day: 'S2', val: 85 }, { day: 'S3', val: 60 },
          { day: 'S4', val: 90 }, { day: 'S5', val: 100 }, { day: 'S6', val: 40 },
          { day: 'S7', val: 20 },
        ];
      case 'Este mesociclo':
        return [
          { day: 'Sem 1', val: 80 }, { day: 'Sem 2', val: 90 },
          { day: 'Sem 3', val: 100 }, { day: 'Sem 4', val: 60 },
        ];
      case 'Este macrociclo':
        return [
          { day: 'Sep', val: 40 }, { day: 'Oct', val: 60 }, { day: 'Nov', val: 80 },
          { day: 'Dic', val: 50 }, { day: 'Ene', val: 70 }, { day: 'Feb', val: 90 },
          { day: 'Mar', val: 100 }, { day: 'Abr', val: 85 }, { day: 'May', val: 75 },
          { day: 'Jun', val: 30 },
        ];
      default:
        return [];
    }
  };

  const workloadData = getWorkloadData();

  const getBarLevelClass = (val) => {
    if (val === 0) return 'empty';
    if (val < 50) return 'low';
    if (val < 80) return 'medium';
    return 'high';
  };

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

      {/* Top Banner (Desarrollador) */}
      <div className="trial-banner-dash">
        <div className="trial-banner-content">
          <div className="crown-badge">
            <Shield size={20} strokeWidth={2} color="var(--dash-cyan)" />
          </div>
          <div className="trial-text-info">
            <h3>Acceso de Desarrollador - Mister11 PRO</h3>
            <p>Tu cuenta tiene acceso permanente de por vida con todos los limites removidos.</p>
          </div>
        </div>
        <div className="btn-toggle-plan">
          <span style={{marginRight: '8px', fontSize: '14px'}}>✔</span> DESARROLLADOR ILIMITADO
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-dash">
        {/* Jugadores Radial Gauge */}
        <div className="stat-card-dash" onClick={() => navigate('/equipo')}>
          <div className="stat-header">JUGADORES</div>
          <div className="players-card-inner">
            <div className="players-card-left">
              <div className="players-minis">
                <div className="p-mini">
                  <Users size={14} className="p-mini-icon" />
                  {players.length}
                </div>
                <div className="p-mini">
                  <div className="p-mini-icon gold" style={{fontSize:'12px', fontWeight:'bold', border:'1px solid var(--dash-gold)', padding:'0 2px', borderRadius:'2px', lineHeight:1}}>{"📋"}</div>
                  {players.length}
                </div>
              </div>
              <div className="mi-equipo-link">MI EQUIPO {'>'}</div>
            </div>
            
            <div className="dash-gauge">
              <svg viewBox="0 0 100 100" className="dash-gauge-svg">
                <defs>
                  <linearGradient id="cyanGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00FF66" />
                    <stop offset="50%" stopColor="#FFC000" />
                    <stop offset="100%" stopColor="#00F0FF" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="40" className="dash-gauge-bg" />
                <circle cx="50" cy="50" r="40" className="dash-gauge-fill" style={{ strokeDashoffset: Math.max(0, 251 - (251 * (Math.min(players.length, 30) / 30))) }} />
              </svg>
              <div className="dash-gauge-val">{players.length}</div>
            </div>

            <div className="stat-extras">
              <div className="stat-extra-item"><span style={{color: 'var(--dash-cyan)'}}>✖</span> DEL</div>
              <div className="stat-extra-item"><span style={{color: 'var(--dash-green)'}}>■</span> POR</div>
              <div className="stat-extra-item"><span style={{color: '#F56565'}}>🛡</span> DEF</div>
              <div className="stat-extra-item" style={{color: 'var(--dash-text-muted)'}}>••• ETC.</div>
            </div>
          </div>
        </div>

        {/* Sesiones Radial Gauge */}
        <div className="stat-card-dash" onClick={() => navigate('/sesiones')}>
          <div className="stat-header">SESIONES</div>
          <div className="players-card-inner">
            <div className="stat-large-num" style={{width:'40px'}}>{sessions.length}</div>
            <div className="dash-gauge">
              <svg viewBox="0 0 100 100" className="dash-gauge-svg">
                <defs>
                  <linearGradient id="cyanGreenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="100%" stopColor="#00FF66" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="40" className="dash-gauge-bg" />
                <circle cx="50" cy="50" r="40" className="dash-gauge-fill green-grad" style={{ strokeDashoffset: Math.max(0, 251 - (251 * (Math.min(sessions.length, 30) / 30))) }} />
              </svg>
              <div className="dash-gauge-val">{sessions.length}</div>
            </div>
            <div className="stat-extras">
              <div className="stat-extra-item"><span style={{color: 'var(--dash-cyan)'}}>●</span> Sesi.</div>
              <div className="stat-extra-item"><span style={{color: 'var(--dash-green)'}}>💼</span> Trabajo</div>
              <div className="stat-extra-item"><span style={{color: '#E53E3E'}}>⚙</span> Compet.</div>
            </div>
          </div>
        </div>

        {/* Próximo Rival */}
        <div className="stat-card-dash" onClick={() => navigate('/partidos')}>
          <div className="stat-header">PRÓXIMO RIVAL</div>
          <div className="players-card-inner">
            <div className="rival-box">
              <Trophy size={16} color="var(--dash-green)" />
              {nextMatch ? (nextMatch.rival || '').split(' ')[0] || 'fomento' : 'fomento'}
            </div>
            <div className="rival-icon-3d">🏆</div>
          </div>
        </div>

        {/* Partidos */}
        <div className="stat-card-dash" onClick={() => navigate('/partidos')}>
          <div className="stat-header">PARTIDOS</div>
          <div className="players-card-inner" style={{marginTop:'auto'}}>
            <div className="stat-large-num">{matches.length || 1}</div>
            <Calendar size={64} color="var(--dash-text-muted)" opacity={0.2} style={{marginRight:'10px'}} />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Weekly Load Chart (3D) */}
        <div className="dash-section">
          <div className="section-header">
            <h2>CARGA DE TRABAJO ESTIMADA</h2>
            <select 
              className="dash-select" 
              value={workloadPeriod}
              onChange={(e) => setWorkloadPeriod(e.target.value)}
              style={{background: 'transparent', color: 'var(--dash-text-muted)', border: 'none', fontWeight: 'bold'}}
            >
              <option value="Esta sesión">Esta sesión</option>
              <option value="Esta semana">Esta semana</option>
              <option value="Este microciclo">Este microciclo</option>
              <option value="Este mesociclo">Este mesociclo</option>
            </select>
          </div>
          
          <div className="chart-container-3d">
            <div className="workload-mini-chart">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                <polyline points="0,20 20,10 40,25 60,5 80,15 100,2" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="20" cy="10" r="2" fill="var(--accent)" />
                <circle cx="60" cy="5" r="2" fill="var(--accent)" />
                <circle cx="100" cy="2" r="2" fill="var(--accent)" />
              </svg>
            </div>

            <div className="workload-center-text">
              <div className="wl-number">
                {Math.round(workloadData.reduce((acc, curr) => acc + curr.val, 0) / Math.max(1, workloadData.length))}
              </div>
              <div className="wl-label">Team Workload Index</div>
            </div>

            {workloadData.map((d, i) => {
              if (!d) return null;
              let barColorClass = 'cyan';
              if (d.val >= 90) barColorClass = 'purple';
              else if (d.val >= 50) barColorClass = 'gold';
              
              if (d.val === 0) barColorClass = 'empty';

              return (
                <div key={i} className="neon-bar-wrapper">
                  <div className="neon-bar-tooltip">{d.val}%</div>
                  <div className={`neon-pillar ${barColorClass}`} style={{ height: `${Math.max(5, d.val)}%` }}>
                    <div className="neon-pillar-inner"></div>
                  </div>
                  <div className="neon-bar-label">
                    <div className={`bar-pill-dots ${barColorClass}`}>
                      <span className={d.val > 0 ? 'active' : ''}></span>
                      <span className={d.val > 30 ? 'active' : ''}></span>
                      <span className={d.val > 60 ? 'active' : ''}></span>
                    </div>
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="dash-section">
          <div className="section-header">
            <h2>PRÓXIMAS SESIONES</h2>
            <button className="btn-text" onClick={() => navigate('/sesiones')}>Ver todas</button>
          </div>
          <div className="sessions-list-dash">
            {upcomingSessions.length === 0 ? (
              <div style={{color: 'var(--dash-text-muted)'}}>No hay sesiones próximas.</div>
            ) : (
              upcomingSessions.map((s, idx) => {
                if (!s) return null;
                // Dummy logic to match the image explicitly if there are standard sessions
                const time = idx === 0 ? '15:45' : '07:15';
                const duration = '90 min';
                const title = idx === 0 ? 'Presión' : 'Recuperación y Finalización';
                const IconComponent = idx === 0 ? ClipboardList : Presentation;

                return (
                  <div key={s.id || idx} className="session-item-dash" onClick={() => navigate('/sesiones')}>
                    <div className="session-time-col">
                      <div className="session-time">{time}</div>
                      {idx === 0 && <div className="session-icons">▲ ▲ ▲</div>}
                      {idx === 1 && <div className="session-icons" style={{color:'#A0AEC0'}}>⏳</div>}
                    </div>
                    <div className="session-info-dash">
                      <strong>{title}</strong>
                      <span>{duration}</span>
                    </div>
                    <div className="session-card-icon-box">
                      <IconComponent size={32} strokeWidth={1} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-dash">
        <h2>ACCESO RÁPIDO</h2>
        <div className="actions-grid-dash">
          <button className="action-btn-dash" onClick={() => navigate('/pizarra')}>
            <div className="action-icon-circle">
              <Presentation size={24} />
            </div>
            PIZARRA TÁCTICA
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/sesiones')}>
            <div className="action-icon-circle">
              <FilePlus size={24} />
            </div>
            CREAR SESIÓN
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/equipo')}>
            <div className="action-icon-circle">
              <Users size={24} />
            </div>
            MI EQUIPO
          </button>
          <button className="action-btn-dash" onClick={() => navigate('/ia-generadora')}>
            <div className="action-icon-circle">
              <Sparkles size={24} />
            </div>
            IA GENERATOR
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
