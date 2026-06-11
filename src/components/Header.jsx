import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';
import { ChevronDown, Sun, Moon, Bell, Settings, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ModeSwitcher from './ModeSwitcher';

const Header = ({ onToggleNotif }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, activeTeam, selectTeam } = useTeams();
  const { darkMode, toggleTheme } = useTheme();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'DASHBOARD';
      case '/pizarra': return 'PIZARRA TÁCTICA';
      case '/equipo': return 'MI EQUIPO';
      case '/sesiones': return 'SESIONES';
      case '/planificacion': return 'PLANIFICACIÓN';
      case '/tests': return 'TESTS';
      case '/partidos': return 'PARTIDOS';
      case '/ia-generadora': return 'IA GENERADORA';
      case '/admin': return 'ADMINISTRACIÓN';
      default: return 'MISTER 11';
    }
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="header-central-shield-container" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>
        {activeTeam?.escudo ? (
          <img 
            src={activeTeam.escudo} 
            alt="Escudo" 
            style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '50%' }} 
          />
        ) : (
          <img 
            src="/logo_mister11.png" 
            alt="Míster11" 
            style={{ width: '45px', height: '45px', objectFit: 'contain' }} 
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: 0, letterSpacing: '1px' }}>{getPageTitle()}</h1>
        
        <ModeSwitcher />
        
        {teams.length > 0 && (
          <div className="team-switcher-header-v2">
            <Shield fill="#1B3A2D" color="#FFF" size={16} />
            <select 
              value={activeTeam?.id || ''} 
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                if (team) selectTeam(team);
              }}
              style={{ background: 'transparent', border: 'none', color: '#000', fontWeight: 'bold', outline: 'none', fontFamily: 'var(--font-heading)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '6px' }}
            >
              {teams.map(t => {
                if (!t) return null;
                const teamName = t.nombre || t.name || 'MI EQUIPO';
                return <option key={t.id} value={t.id}>{teamName.toUpperCase()}</option>
              })}
            </select>
            <ChevronDown size={14} />
          </div>
        )}
      </div>
      
      <div className="header-actions">
        <button className="icon-btn theme-toggle" title="Cambiar Tema" onClick={toggleTheme}>
          {darkMode ? <Sun size={20} color="var(--accent-gold)" /> : <Moon size={20} color="var(--accent-gold)" />}
        </button>
        <button className="icon-btn" title="Notificaciones" onClick={onToggleNotif}>
          <Bell size={20} color="var(--accent-gold)" />
        </button>
        <button className="icon-btn" title="Ajustes" onClick={() => navigate('/admin')}>
          <Settings size={20} color="var(--accent-gold)" />
        </button>
      </div>
    </header>
  );
};

export default Header;
