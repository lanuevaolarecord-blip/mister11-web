import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';
import { ChevronDown, Sun, Moon, Bell, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1>{getPageTitle()}</h1>
        
        {teams.length > 0 && (
          <div className="team-switcher-header">
            <span className="team-indicator" style={{background: activeTeam?.colorLocal || 'var(--accent)'}} />
            <select 
              value={activeTeam?.id || ''} 
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                if (team) selectTeam(team);
              }}
            >
              {teams.map(t => {
                if (!t) return null;
                return <option key={t.id} value={t.id}>{t.nombre}</option>
              })}
            </select>
            <ChevronDown size={14} className="switcher-arrow" />
          </div>
        )}
      </div>
      
      <div className="header-actions">
        <button className="icon-btn theme-toggle" title="Cambiar Tema" onClick={toggleTheme}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="icon-btn" title="Notificaciones" onClick={onToggleNotif}>
          <Bell size={20} />
        </button>
        <button className="icon-btn" title="Ajustes" onClick={() => navigate('/admin')}>
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
