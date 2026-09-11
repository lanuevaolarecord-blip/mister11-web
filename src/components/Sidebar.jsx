import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Presentation, 
  Users, 
  CalendarDays, 
  TrendingUp, 
  Activity, 
  Trophy, 
  Sparkles,
  ShieldCheck,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { auth, signOut } from '../firebaseConfig';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

const Sidebar = ({ isOpen, onClose }) => {
  const { teams, activeTeamId, changeActiveTeam, logout, switchMode } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const { darkMode, toggleTheme } = useTheme();
  const { t, isEn } = useTranslation();

  const getRoleLabel = () => {
    const raw = settings.specialty || 'Primer Entrenador';
    if (raw === 'Primer Entrenador' || raw === 'admin') {
      return isEn ? 'Head Coach' : 'Primer Entrenador';
    }
    if (raw === 'Entrenador' || raw === 'Coach') {
      return isEn ? 'Coach' : 'Entrenador';
    }
    if (raw === 'Segundo Entrenador' || raw === 'assistantCoach') {
      return isEn ? 'Assistant Coach' : 'Segundo Entrenador';
    }
    if (raw === 'Preparador Físico' || raw === 'physicalTrainer') {
      return isEn ? 'Fitness Coach' : 'Preparador Físico';
    }
    if (raw === 'Entrenador de Porteros' || raw === 'goalkeeperCoach') {
      return isEn ? 'Goalkeeper Coach' : 'Entrenador de Porteros';
    }
    if (raw === 'Analista Táctico' || raw === 'analyst') {
      return isEn ? 'Tactical Analyst' : 'Analista Táctico';
    }
    if (raw === 'Fisioterapeuta' || raw === 'physio') {
      return isEn ? 'Physiotherapist' : 'Fisioterapeuta';
    }
    return raw;
  };

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/pizarra', label: t('nav.pizarra'), icon: Presentation },
    { path: '/equipo', label: t('nav.equipo'), icon: Users },
    { path: '/sesiones', label: t('nav.sesiones'), icon: CalendarDays },
    { path: '/planificacion', label: t('nav.planificacion'), icon: TrendingUp },
    { path: '/tests', label: t('nav.tests'), icon: Activity },
    { path: '/partidos', label: t('nav.partidos'), icon: Trophy },
    { path: '/ia-generadora', label: t('nav.ia'), icon: Sparkles },
    { path: '/admin', label: t('nav.admin'), icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo-container" style={{ position: 'relative', justifyContent: 'space-between' }}>
        <img src="/logo_mister11.png" alt="Míster11" height="40"/>
        <button 
          className="sidebar-close-btn" 
          onClick={onClose}
          aria-label={t('common.closeMenu')}
        >
          ✕
        </button>
      </div>
      
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="user-profile" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div className="user-avatar" style={{background: '#4CAF7D', color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', width:'36px', height:'36px', flexShrink:0}}>
            {auth.currentUser?.displayName?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="user-info">
            <span className="user-name">{settings.profileName || auth.currentUser?.displayName?.split(' ')[0] || (isEn ? 'Coach' : 'Míster')}</span>
            <span className="user-role">{getRoleLabel()}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            switchMode('player');
            if (onClose) onClose();
            window.location.href = '/';
          }} 
          className="btn-logout-sidebar"
          style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          <Users size={14} /> {isEn ? 'Player Portal / Mode' : 'Modo / Portal Jugador'}
        </button>

        <button 
          onClick={toggleTheme} 
          className="btn-logout-sidebar"
          style={{ background: 'rgba(212, 168, 67, 0.12)', color: 'var(--accent-gold, #D4A843)', borderColor: 'rgba(212, 168, 67, 0.35)' }}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? (isEn ? 'Light Theme' : 'Tema Claro') : (isEn ? 'Dark Theme' : 'Tema Oscuro')}
        </button>

        <button 
          onClick={handleLogout} 
          className="btn-logout-sidebar"
        >
          <LogOut size={14} /> {t('auth.logout')}
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;
