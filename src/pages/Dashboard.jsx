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
    <div className="page-wrapper">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Hola, {settings.profileName?.split(' ')[0] || 'jhojan'}</h1>
          <p className="page-subtitle">Esta es la actividad de tu equipo ({settings.clubName || 'burriana e.d.'}) para esta semana.</p>
        </div>
        <div className="card-base" style={{ padding: '8px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)' }}>Hoy</strong>
        </div>
      </header>

      {/* Top Banner (Desarrollador) */}
      <div className="card-base" style={{ background: 'var(--accent-green-light)', borderColor: 'var(--accent-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Shield size={28} strokeWidth={1.5} color="var(--accent-green)" />
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontFamily: 'var(--font-heading)' }}>Acceso de Desarrollador - Mister11 PRO</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Tu cuenta tiene acceso permanente de por vida con todos los limites removidos.</p>
          </div>
        </div>
        <div className="btn-outline-green" style={{ fontSize: '12px' }}>
          ✔ DESARROLLADOR ILIMITADO
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4-cols" style={{ marginBottom: '24px' }}>
        {stats.map((s, idx) => (
          <div key={idx} className="card-base" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '20px' }} onClick={() => navigate(s.route)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</div>
            </div>
            <div style={{ color: 'var(--accent-gold)' }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-3-cols">
        {/* Weekly Load Chart (3D) */}
        <div className="card-base" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--font-heading)' }}>Carga de Trabajo Estimada</h2>
            <select 
              className="chip"
              value={workloadPeriod}
              onChange={(e) => setWorkloadPeriod(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0', color: 'var(--text-secondary)' }}
            >
              <option value="Esta sesión">Esta sesión</option>
              <option value="Esta semana">Esta semana</option>
              <option value="Este microciclo">Este microciclo</option>
              <option value="Este mesociclo">Este mesociclo</option>
            </select>
          </div>
          
          <div className="chart-container-3d" style={{ border: 'none', marginTop: '40px', height: '180px' }}>
            <div className="workload-mini-chart" style={{ background: 'transparent', border: 'none', boxShadow: 'none', left: '0', top: '-40px' }}>
              <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                <polyline points="0,20 20,10 40,25 60,5 80,15 100,2" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="20" cy="10" r="2" fill="var(--accent-green)" />
                <circle cx="60" cy="5" r="2" fill="var(--accent-green)" />
                <circle cx="100" cy="2" r="2" fill="var(--accent-green)" />
              </svg>
            </div>

            <div className="workload-center-text" style={{ top: '-40px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Team Workload Index</div>
              <div className="wl-number" style={{ color: 'var(--accent-gold)', fontSize: '32px' }}>
                {Math.round(workloadData.reduce((acc, curr) => acc + curr.val, 0) / Math.max(1, workloadData.length))}
              </div>
            </div>

            {workloadData.map((d, i) => {
              if (!d) return null;
              let barColor = 'var(--accent-green)';
              if (d.val >= 70) barColor = 'var(--accent-gold)';
              if (d.val >= 90) barColor = '#E53E3E'; // Red for high workload
              
              if (d.val === 0) barColor = 'transparent';

              return (
                <div key={i} className="neon-bar-wrapper">
                  <div className="neon-bar-tooltip" style={{ color: 'var(--text-primary)' }}>{d.val}%</div>
                  <div 
                    style={{ 
                      height: `${Math.max(5, d.val)}%`, 
                      width: '100%', 
                      background: d.val === 0 ? 'transparent' : `linear-gradient(to right, ${barColor} 0%, rgba(255,255,255,0.4) 20%, ${barColor} 50%, rgba(0,0,0,0.2) 100%)`, 
                      borderRadius: '16px 16px 4px 4px',
                      border: d.val === 0 ? '1px dashed var(--border-light)' : 'none',
                      borderTop: d.val !== 0 ? `4px solid ${barColor}` : 'none'
                    }}
                  >
                  </div>
                  <div className="neon-bar-label" style={{ color: 'var(--text-primary)', bottom: '-25px' }}>
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="card-base">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--font-heading)' }}>Próximas Sesiones</h2>
            <span style={{ fontSize: '12px', color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => navigate('/sesiones')}>Ver todas</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingSessions.length === 0 ? (
              <div style={{color: 'var(--text-secondary)'}}>No hay sesiones próximas.</div>
            ) : (
              upcomingSessions.map((s, idx) => {
                if (!s) return null;
                const time = idx === 0 ? '15:30' : '16:45';
                const title = idx === 0 ? 'Calentamiento Técnico' : 'Táctica de Juego';
                const IconComponent = idx === 0 ? Presentation : ClipboardList;

                return (
                  <div key={s.id || idx} className="card-base" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: 'none' }} onClick={() => navigate('/sesiones')}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                      <Calendar size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mayo de 2026 | {time}</div>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{title} | {time}</strong>
                    </div>
                    <div style={{ color: 'var(--accent-green)' }}>
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
      <div style={{ marginTop: '40px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-heading)', marginBottom: '24px' }}>Acceso Rápido</h2>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {[
            { label: 'Pizarra Táctica', icon: <Presentation size={24} />, route: '/pizarra' },
            { label: 'Crear Sesión', icon: <FilePlus size={24} />, route: '/sesiones' },
            { label: 'GUARDAR DASHBOARD', isMain: true },
            { label: 'Mi Equipo', icon: <Users size={24} />, route: '/equipo' },
            { label: 'IA Generator', icon: <Sparkles size={24} />, route: '/ia-generadora' }
          ].map((action, idx) => (
             action.isMain ? (
               <button key={idx} style={{ padding: '10px 24px', borderRadius: 'var(--radius-chip)', background: 'var(--bg-app)', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', margin: '0 auto', boxShadow: 'var(--shadow-card)' }}>
                 {action.label}
               </button>
             ) : (
               <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(action.route)}>
                 <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', boxShadow: 'inset 0 0 0 2px var(--accent-gold-light), var(--shadow-card)' }}>
                   {action.icon}
                 </div>
                 <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{action.label}</span>
               </div>
             )
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
