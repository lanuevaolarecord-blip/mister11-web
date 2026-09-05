import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useAuth } from '../context/AuthContext';
import { isDeveloperEmail } from '../config/admins';
import { ChevronDown, Sun, Moon, Bell, Settings, Shield, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useMatch } from '../context/MatchContext';
import { useTranslation } from '../hooks/useTranslation';

const Header = ({ onToggleNotif }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchMode, isHybrid, playerTeams } = useAuth();
  const isDev = isDeveloperEmail(user?.email);
  const { teams, activeTeam, selectTeam } = useTeams();
  const { permissions, switchMyRole, STAFF_ROLES } = useTeamMembers(activeTeam?.id);
  const { darkMode, toggleTheme } = useTheme();
  const { isRunning, matchSeconds, formatMatchTime } = useMatch();
  const { t } = useTranslation();

  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar sesión o cambiar de cuenta?')) {
      try {
        await logout();
        navigate('/');
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
      }
    }
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return t('page.dashboard');
      case '/pizarra': return t('page.pizarra');
      case '/equipo': return t('page.equipo');
      case '/sesiones': return t('page.sesiones');
      case '/planificacion': return t('page.planificacion');
      case '/tests': return t('page.tests');
      case '/partidos': return t('page.partidos');
      case '/ia-generadora': return t('page.ia');
      case '/admin': return t('page.admin');
      default: return t('page.default');
    }
  };

  return (
    <header className="header">
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

      <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1 className="header-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: 0, letterSpacing: '1px' }}>{getPageTitle()}</h1>
        
        {teams && teams.length > 0 && (
          <div className="team-switcher-header-v2" style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <Shield fill="#1B3A2D" color="#FFF" size={16} style={{ pointerEvents: 'none', marginRight: '6px' }} />
            <span className="team-name-span" style={{ pointerEvents: 'none', marginRight: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {(activeTeam?.nombre || activeTeam?.name || 'MI EQUIPO').toUpperCase()}
            </span>
            <ChevronDown size={14} style={{ pointerEvents: 'none' }} />
            
            <select 
              value={activeTeam?.id || ''} 
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                if (team) selectTeam(team);
              }}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                opacity: 0, 
                cursor: 'pointer',
                zIndex: 2,
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              {teams.map(t => {
                if (!t) return null;
                const teamName = t.nombre || t.name || 'MI EQUIPO';
                const prefix = t.source === 'club' ? `🏢 ${t.clubName || 'Club'} - ` : '👤 ';
                const label = `${prefix}${teamName}`;
                return (
                  <option key={t.id} value={t.id} style={{ color: '#000', background: '#fff' }}>
                    {label.toUpperCase()}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Selector interactivo de Rol en el Cuerpo Técnico (Basado en Icono) */}
        {permissions?.roleInfo && (
          <div 
            className="header-staff-role-switcher"
            title={`Rol en el Cuerpo Técnico: ${permissions.roleInfo.label}. Toca para cambiar.`}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              minWidth: '34px',
              minHeight: '34px',
              borderRadius: '10px',
              background: `${permissions.roleInfo.color}22`,
              border: `1.5px solid ${permissions.roleInfo.color}`,
              cursor: 'pointer',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              {permissions.role === 'admin' || permissions.role === 'first_coach' || permissions.role === 'owner' ? '👑' :
               permissions.role === 'coach' || permissions.role === 'second_coach' ? '🥈' :
               permissions.role === 'fitness_coach' || permissions.role === 'pf' ? '🏋️' :
               permissions.role === 'assistant' ? '⏱️' :
               permissions.role === 'physio' ? '🩺' : '👑'}
            </span>
            <select
              value={permissions.role}
              onChange={(e) => switchMyRole(e.target.value)}
              aria-label={`Rol activo: ${permissions.roleInfo.label}. Cambiar mi rol.`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                zIndex: 3
              }}
            >
              {STAFF_ROLES && Object.values(STAFF_ROLES).map(r => (
                <option 
                  key={r.id} 
                  value={r.id} 
                  style={{ background: '#121C16', color: '#FFFFFF', fontSize: '0.85rem', padding: '6px' }}
                >
                  {r.id === 'admin' ? '👑 Primer Entrenador' :
                   r.id === 'coach' ? '🥈 Segundo Entrenador' :
                   r.id === 'fitness_coach' ? '🏋️ Preparador Físico' :
                   r.id === 'assistant' ? '⏱️ Ayudante' :
                   r.id === 'physio' ? '🩺 Fisioterapeuta' : r.badge}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="header-actions">
        {/* Badge partido en vivo (solo visible fuera de /partidos) */}
        {isRunning && location.pathname !== '/partidos' && (
          <button
            onClick={() => navigate('/partidos')}
            title="Partido en curso · Ir al Match Day"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'Outfit, Inter, sans-serif',
              cursor: 'pointer',
              letterSpacing: '0.3px',
              boxShadow: '0 0 0 2px rgba(22,163,74,0.35), 0 4px 12px rgba(0,0,0,0.25)',
              animation: 'matchBadgePulse 2s ease-in-out infinite',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>⚽</span>
            {formatMatchTime(matchSeconds)}
          </button>
        )}

        {/* Conmutador a Portal Jugador (Icono Solo) */}
        {(isDev || isHybrid || (playerTeams && playerTeams.length > 0)) && (
          <button
            type="button"
            className="icon-btn header-mode-toggle"
            onClick={() => {
              switchMode('player');
              navigate('/player-dashboard');
            }}
            title="Cambiar a Portal Jugador"
            aria-label="Cambiar a Portal Jugador"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              minWidth: '34px',
              minHeight: '34px',
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#10B981',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0
            }}
          >
            <User size={18} strokeWidth={2.4} />
          </button>
        )}

        <button className="icon-btn theme-toggle" title="Cambiar Tema" onClick={toggleTheme}>
          {darkMode ? <Sun size={19} color="var(--accent-gold)" /> : <Moon size={19} color="var(--accent-gold)" />}
        </button>
        <button className="icon-btn" title="Notificaciones" onClick={onToggleNotif}>
          <Bell size={19} color="var(--accent-gold)" />
        </button>
        <button className="icon-btn" title="Ajustes y Configuración" onClick={() => navigate('/admin')}>
          <Settings size={19} color="var(--accent-gold)" />
        </button>
        <button 
          className="icon-btn" 
          title="Cerrar Sesión / Cambiar Cuenta" 
          onClick={handleLogout}
          style={{ color: '#EF4444' }}
        >
          <LogOut size={19} color="#EF4444" />
        </button>
      </div>
    </header>
  );
};

export default Header;
