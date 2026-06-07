import React, { useState, useEffect, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { activeTeamId } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const { players } = usePlayers(activeTeamId);
  const { sessions } = useSessions(activeTeamId);
  const { matches } = useMatches(activeTeamId);
  const { alerts, loading: alertsLoading } = useHealthAlerts();
  const { playerPlans, teamPlans } = usePlayerPlans(activeTeamId);
  const [workloadPeriod, setWorkloadPeriod] = useState('Esta semana');
  const [planningConfig, setPlanningConfig] = useState(null);

  // Load planning config from Firestore
  useEffect(() => {
    const loadPlanning = async () => {
      if (!activeTeamId || !auth.currentUser) return;
      try {
        const ref = doc(db, 'users', auth.currentUser.uid, 'teams', activeTeamId, 'planificacion', 'config');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPlanningConfig(snap.data());
        }
      } catch (e) {
        console.error("Error loading planning config in dashboard:", e);
      }
    };
    loadPlanning();
  }, [activeTeamId]);

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
    { label: t('dashboard.stats.players', settings.language), value: players.length, icon: <Users size={24} />, color: '#4CAF7D', route: '/equipo' },
    { label: t('dashboard.stats.sessions', settings.language), value: sessions.length, icon: <ClipboardList size={24} />, color: '#4CAF7D', route: '/sesiones' },
    { label: t('dashboard.stats.rival', settings.language), value: nextMatch ? (nextMatch.rival || '').split(' ')[0] || t('dashboard.stats.noRival', settings.language) : t('dashboard.stats.noRival', settings.language), icon: <Trophy size={24} />, color: '#4CAF7D', route: '/partidos' },
    { label: t('dashboard.stats.matches', settings.language), value: matches.length, icon: <Calendar size={24} />, color: '#4CAF7D', route: '/partidos' },
  ];

  const upcomingSessions = sessions
    .filter(s => new Date(s.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Helper to resolve microcycle load value
  const getCargaVal = (carga) => {
    switch (carga) {
      case 'Choque': return 95;
      case 'Comp': return 90;
      case 'Carga': return 80;
      case 'Ajuste': return 60;
      case 'Recup': return 45;
      default: return 70;
    }
  };

  // Helper to generate default microcycles if planning isn't set up yet
  const getFallbackMicrocycles = () => {
    const months = ['Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];
    return Array.from({ length: 40 }, (_, i) => {
      const monthIdx = Math.min(Math.floor(i / 4), months.length - 1);
      const isPrep = i < 8;
      const isTrans = i > 36;
      return {
        id: i + 1,
        month: months[monthIdx],
        periodo: isPrep ? 'Prep' : (isTrans ? 'Trans' : 'Comp'),
        carga: isPrep ? 'Carga' : 'Comp',
        microciclo: i + 1,
        sessions: 3,
        volume: 270,
        physical: isPrep ? 40 : 20,
        technical: 40,
        tactical: isPrep ? 20 : 40,
      };
    });
  };

  const getFallbackMacroInfo = () => ({
    startDate: '2025-09-01',
    endDate: '2026-06-15',
    category: 'Infantil A',
    objective: '',
    trainer: '',
    sessionDuration: 90,
    trainingDays: [0, 2, 4], // Lun, Mié, Vie
  });

  const macroInfo = planningConfig?.macroInfo || getFallbackMacroInfo();
  const microcycles = planningConfig?.microcycles || getFallbackMicrocycles();

  const activeMicrocycle = useMemo(() => {
    if (!macroInfo.startDate || !microcycles.length) return microcycles[0];
    const start = new Date(macroInfo.startDate);
    const today = new Date();
    const diffTime = Math.max(0, today - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentIndex = Math.min(microcycles.length - 1, Math.floor(diffDays / 7));
    return microcycles[currentIndex];
  }, [macroInfo.startDate, microcycles]);

  const getWorkloadData = () => {
    const lang = settings.language || 'Español (ES)';
    const dayLabelsShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    switch (workloadPeriod) {
      case 'Esta sesión': {
        const nextSession = upcomingSessions[0];
        if (nextSession && nextSession.blocks && nextSession.blocks.length > 0) {
          return nextSession.blocks.map((b, idx) => {
            const blockType = b.type || b.tipo || 'General';
            let displayDay = t(`block.${blockType.toLowerCase()}`, lang);
            if (displayDay === `block.${blockType.toLowerCase()}`) {
              displayDay = blockType;
            }
            let val = 50;
            const typeLower = blockType.toLowerCase();
            if (typeLower.includes('calent')) val = 30;
            else if (typeLower.includes('tecn')) val = 60;
            else if (typeLower.includes('tact')) val = 80;
            else if (typeLower.includes('abp')) val = 50;
            else if (typeLower.includes('fisic') || typeLower.includes('phys')) val = 90;
            else if (typeLower.includes('mixt')) val = 70;

            return {
              day: displayDay.length > 10 ? displayDay.slice(0, 8) + '..' : displayDay,
              val
            };
          });
        }
        return [
          { day: t('block.warmup', lang), val: 20 },
          { day: t('block.technical', lang), val: 50 },
          { day: t('block.tactical', lang), val: 80 },
          { day: t('block.abp', lang), val: 30 },
          { day: t('block.physical', lang), val: 60 },
        ];
      }
      case 'Esta semana': {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const startOfWeek = new Date(today.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        return dayLabelsShort.map((dayLabel, idx) => {
          const checkDate = new Date(startOfWeek);
          checkDate.setDate(startOfWeek.getDate() + idx);
          const dateStr = checkDate.toISOString().slice(0, 10);

          const matchToday = matches.find(m => m.date === dateStr);
          if (matchToday) {
            return { day: t(`day.${dayLabel}`, lang), val: 100 };
          }

          const sessionToday = sessions.find(s => s.date === dateStr);
          if (sessionToday) {
            const intensity = sessionToday.intensity || sessionToday.intensidad || 'Media';
            let val = 70;
            if (intensity === 'Baja') val = 40;
            if (intensity === 'Media') val = 70;
            if (intensity === 'Alta') val = 90;
            if (intensity === 'Máxima') val = 100;
            return { day: t(`day.${dayLabel}`, lang), val };
          }

          const isTrainingDay = macroInfo.trainingDays.includes(idx);
          if (isTrainingDay) {
            const loadVal = activeMicrocycle ? getCargaVal(activeMicrocycle.carga) : 70;
            return { day: t(`day.${dayLabel}`, lang), val: loadVal };
          }

          return { day: t(`day.${dayLabel}`, lang), val: 0 };
        });
      }
      case 'Este microciclo': {
        return dayLabelsShort.map((dayLabel, idx) => {
          const isTrainingDay = macroInfo.trainingDays.includes(idx);
          const isMatchDay = idx === 6;
          let val = 0;
          if (isMatchDay) {
            val = 90;
          } else if (isTrainingDay) {
            val = activeMicrocycle ? getCargaVal(activeMicrocycle.carga) : 70;
          }
          return { day: t(`day.${dayLabel}`, lang), val };
        });
      }
      case 'Este mesociclo': {
        const currentMonth = activeMicrocycle ? activeMicrocycle.month : 'Sep';
        const mesomicrocycles = microcycles.filter(mc => mc.month === currentMonth);
        
        return mesomicrocycles.map((mc, idx) => {
          const loadVal = getCargaVal(mc.carga);
          const label = `${t('dashboard.workload.week', lang)} ${idx + 1}`;
          return { day: label, val: loadVal };
        });
      }
      case 'Este macrociclo': {
        const monthsList = ['Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];
        
        return monthsList.map(m => {
          const mMicros = microcycles.filter(mc => mc.month === m);
          let avgVal = 50;
          if (mMicros.length > 0) {
            const total = mMicros.reduce((acc, mc) => acc + getCargaVal(mc.carga), 0);
            avgVal = Math.round(total / mMicros.length);
          }
          return { day: t(`month.${m}`, lang), val: avgVal };
        });
      }
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
          <h1 className="page-title">{t('dashboard.welcome', settings.language, { name: settings.profileName?.split(' ')[0] || 'jhojan' })}</h1>
          <p className="page-subtitle">{t('dashboard.activity', settings.language, { club: settings.clubName || 'burriana e.d.' })}</p>
        </div>
        <div className="card-base" style={{ padding: '8px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString(settings.language === 'English (EN)' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)' }}>{t('dashboard.today', settings.language)}</strong>
        </div>
      </header>

      {/* Top Banner (Desarrollador) */}
      <div className="card-base" style={{ background: 'var(--accent-green-light)', borderColor: 'var(--accent-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Shield size={28} strokeWidth={1.5} color="var(--accent-green)" />
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontFamily: 'var(--font-heading)' }}>{t('dashboard.devAccess', settings.language)}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{t('dashboard.devDesc', settings.language)}</p>
          </div>
        </div>
        <div className="btn-outline-green" style={{ fontSize: '12px' }}>
          {t('dashboard.devUnlimited', settings.language)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4-cols" style={{ marginBottom: '24px' }}>
        {stats.map((s, idx) => {
          return (
            <div key={idx} className="dashboard-stat-card-v2" onClick={() => navigate(s.route)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {s.icon}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ width: '40px', height: '2px', background: 'var(--accent-gold)' }}></div>
                  <div style={{ width: '20px', height: '2px', background: 'var(--accent-green)' }}></div>
                </div>
              </div>
              
              {idx === 0 && (
                <div className="golden-ring-stat">
                  <span>{s.value}</span>
                </div>
              )}
              {idx === 1 && (
                <div className="dashboard-stat-icon-floating" style={{ right: '-5px', bottom: '-5px' }}>
                  <div style={{ fontSize: '60px', textShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>📋</div>
                </div>
              )}
              {idx === 2 && (
                <div className="dashboard-stat-icon-floating" style={{ right: '-5px', bottom: '-15px' }}>
                  <div style={{ fontSize: '60px', textShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>🛡️</div>
                </div>
              )}
              {idx === 3 && (
                <div className="dashboard-stat-icon-floating" style={{ right: '-5px', bottom: '-10px' }}>
                  <div style={{ fontSize: '60px', textShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>📅</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid-3-cols">
        {/* Weekly Load Chart (3D) */}
        <div className="card-base" style={{ gridColumn: 'span 2', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'var(--font-heading)' }}>{t('dashboard.estimatedWorkload', settings.language)}</h2>
              <div style={{ border: '1px solid var(--accent-gold)', borderRadius: '8px', padding: '4px 8px', background: 'var(--bg-card)' }}>
                <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px' }} preserveAspectRatio="none">
                  <polyline points="0,20 20,10 40,25 60,5 80,15 100,2" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="20" cy="10" r="2" fill="var(--accent-green)" />
                  <circle cx="60" cy="5" r="2" fill="var(--accent-green)" />
                  <circle cx="100" cy="2" r="2" fill="var(--accent-green)" />
                </svg>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('dashboard.teamWorkloadIndex', settings.language)}</div>
              <div className="twi-number-v2">
                {Math.round(workloadData.reduce((acc, curr) => acc + curr.val, 0) / Math.max(1, workloadData.length))}
              </div>
            </div>

            <select 
              className="chip"
              value={workloadPeriod}
              onChange={(e) => setWorkloadPeriod(e.target.value)}
              style={{ border: '1px solid var(--accent-gold)', background: 'var(--bg-card)', padding: '4px 12px', color: 'var(--text-primary)', fontWeight: 'bold' }}
            >
              <option value="Esta sesión">{t('dashboard.period.session', settings.language)}</option>
              <option value="Esta semana">{t('dashboard.period.week', settings.language)}</option>
              <option value="Este microciclo">{t('dashboard.period.micro', settings.language)}</option>
              <option value="Este mesociclo">{t('dashboard.period.meso', settings.language)}</option>
              <option value="Este macrociclo">{t('dashboard.period.macro', settings.language)}</option>
            </select>
          </div>
          
          <div className="chart-container-3d-v2">
            <div className="chart-grid-lines">
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
              <div className="chart-grid-line"></div>
            </div>

            {workloadData.map((d, i) => {
              if (!d) return null;
              const barLevel = getBarLevelClass(d.val);

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>{d.val}%</div>
                  <div className={`workload-bar-3d-v2 ${barLevel}`} style={{ height: `${Math.max(5, d.val * 1.5)}px` }}></div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', marginTop: '12px' }}>{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="card-base">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--font-heading)' }}>{t('dashboard.upcomingSessions', settings.language)}</h2>
            <span style={{ fontSize: '12px', color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => navigate('/sesiones')}>{t('dashboard.viewAll', settings.language)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingSessions.length === 0 ? (
              <div style={{color: 'var(--text-secondary)'}}>{t('dashboard.noUpcomingSessions', settings.language)}</div>
            ) : (
              upcomingSessions.map((s, idx) => {
                if (!s) return null;
                const time = s.time || s.hora || '--:--';
                const title = s.title || s.titulo || t('session.untitled', settings.language);
                
                const dateObj = new Date(s.date);
                const formattedDate = isNaN(dateObj.getTime())
                  ? (s.date || '')
                  : dateObj.toLocaleDateString(settings.language === 'English (EN)' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' });

                return (
                  <div key={s.id || idx} className="card-base" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: 'none' }} onClick={() => navigate('/sesiones')}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                      <Calendar size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{formattedDate} | {time}</div>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{title} | {time}</strong>
                    </div>
                    <div style={{ color: 'var(--accent-green)' }}>
                      <ClipboardList size={32} strokeWidth={1} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-bar">
        <h2 className="quick-actions-title">{t('dashboard.quickAccess', settings.language)}</h2>
        
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
          {[
            { label: t('nav.pizarra', settings.language), icon: <Presentation size={24} />, route: '/pizarra' },
            { label: t('nav.sesiones', settings.language), icon: <FilePlus size={24} />, route: '/sesiones' }
          ].map((action, idx) => (
            <div key={idx} className="quick-access-wrapper" onClick={() => navigate(action.route)}>
              <div className="quick-access-ring-outer">
                <div className="quick-access-ring-inner">
                  <div className="quick-access-btn-core">
                    {action.icon}
                  </div>
                </div>
              </div>
              <span className="quick-access-label">{action.label}</span>
            </div>
          ))}

          <button className="btn-guardar-dashboard">
            {t('dashboard.saveDashboard', settings.language)}
          </button>

          {[
            { label: t('nav.equipo', settings.language), icon: <Users size={24} />, route: '/equipo' },
            { label: t('nav.ia', settings.language), icon: <Sparkles size={24} />, route: '/ia-generadora' }
          ].map((action, idx) => (
            <div key={idx} className="quick-access-wrapper" onClick={() => navigate(action.route)}>
              <div className="quick-access-ring-outer">
                <div className="quick-access-ring-inner">
                  <div className="quick-access-btn-core">
                    {action.icon}
                  </div>
                </div>
              </div>
              <span className="quick-access-label">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
