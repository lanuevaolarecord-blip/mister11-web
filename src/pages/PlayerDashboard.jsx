import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PlayerBottomNav } from '../components/player/PlayerBottomNav';
import { PlayerHomeTab } from '../components/player/PlayerHomeTab';
import { PlayerScheduleTab } from '../components/player/PlayerScheduleTab';
import { PlayerAutonomousTestsTab } from '../components/player/PlayerAutonomousTestsTab';
import { PlayerStatsTab } from '../components/player/PlayerStatsTab';
import { PlayerPlansPortalTab } from '../components/player/PlayerPlansPortalTab';
import { PlayerProfileTab } from '../components/player/PlayerProfileTab';
import { Shield, Loader, AlertCircle, Sun, Moon, Target, User, LogOut } from 'lucide-react';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
  const { user, activeTeam, getTeamPath, changeActiveTeam, teams, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'tests' | 'stats' | 'profile'
  const [profileSubTab, setProfileSubTab] = useState('profile'); // 'profile' | 'plans'
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const teamPath = activeTeam?.teamPath || (activeTeam?.id ? getTeamPath(activeTeam.id) : null);

  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar sesión o cambiar de cuenta?')) {
      try {
        await logout();
        window.location.href = '/';
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
      }
    }
  };

  // Escuchar la ficha del jugador vinculada a este usuario
  useEffect(() => {
    if (!user || !teamPath) {
      setLoading(false);
      return;
    }

    // 1. Intentar cargar por subcolección de players
    const playersRef = collection(db, `${teamPath}/players`);
    const q = query(playersRef);

    const unsub = onSnapshot(q, (snap) => {
      const allPlayers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const found = allPlayers.find(p => p.requesterUid === user.uid || p.playerUid === user.uid || p.email === user.email);

      if (found) {
        setPlayer(found);
      } else {
        // Mock fallback si aún no se ha creado el doc
        setPlayer({
          id: 'player-self',
          name: user.displayName || 'Jugador Míster11',
          position: 'MC',
          number: '11',
          category: activeTeam?.categoria || 'Juvenil',
          consents: { basic: true, attendance: true, health: true, tests: true }
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn('[PlayerDashboard] Error cargando jugador:', err);
      setPlayer({
        id: 'player-self',
        name: user.displayName || 'Jugador',
        position: 'MC',
        number: '11',
        category: activeTeam?.categoria || 'Juvenil',
        consents: { basic: true, attendance: true, health: false, tests: false }
      });
      setLoading(false);
    });

    return () => unsub();
  }, [user, teamPath]);

  if (loading) {
    return (
      <div className="player-loading-screen">
        <Loader size={36} className="spin" style={{ color: '#10B981', animation: 'spin 1.5s linear infinite' }} />
        <p>Cargando tu portal de jugador...</p>
      </div>
    );
  }

  return (
    <div className={`player-dashboard-root ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      {/* Barra superior ligera para móvil */}
      <header className="player-topbar">
        <div className="player-topbar-brand">
          <img src="/logo_mister11.png" alt="Míster11" className="player-brand-logo" />
          <span className="player-portal-badge">PORTAL JUGADOR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón de Modo Claro / Modo Oscuro */}
          <button 
            type="button" 
            className="player-theme-btn" 
            onClick={toggleTheme}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {darkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#1B3A2D" />}
          </button>

          {/* Botón de Cerrar Sesión / Cambiar Cuenta */}
          <button 
            type="button" 
            className="player-theme-btn" 
            onClick={handleLogout}
            aria-label="Cerrar Sesión o Cambiar Cuenta"
            title="Cerrar Sesión o Cambiar Cuenta"
            style={{ color: '#EF4444' }}
          >
            <LogOut size={18} color="#EF4444" />
          </button>

          {teams.length > 1 && (
            <select
              value={activeTeam?.id || ''}
              onChange={(e) => changeActiveTeam(e.target.value)}
              className="player-team-select"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre || t.name || 'Equipo'}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Contenido principal según pestaña activa */}
      <main className="player-main-viewport">
        {activeTab === 'home' && (
          <PlayerHomeTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'schedule' && (
          <PlayerScheduleTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
          />
        )}

        {activeTab === 'tests' && (
          <PlayerAutonomousTestsTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
          />
        )}

        {activeTab === 'stats' && (
          <PlayerStatsTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
          />
        )}

        {activeTab === 'profile' && (
          <div>
            {/* Sub-selector de Perfil vs Plan de Mejora */}
            <div className="player-subnav-pills">
              <button
                type="button"
                className={`player-subnav-pill ${profileSubTab === 'profile' ? 'active' : ''}`}
                onClick={() => setProfileSubTab('profile')}
              >
                <User size={15} /> Ficha & Bienestar
              </button>
              <button
                type="button"
                className={`player-subnav-pill ${profileSubTab === 'plans' ? 'active' : ''}`}
                onClick={() => setProfileSubTab('plans')}
              >
                <Target size={15} /> Plan de Mejora
              </button>
            </div>

            {profileSubTab === 'profile' ? (
              <PlayerProfileTab
                player={player}
                team={activeTeam}
                teamPath={teamPath}
              />
            ) : (
              <PlayerPlansPortalTab
                player={player}
                team={activeTeam}
                teamPath={teamPath}
              />
            )}
          </div>
        )}
      </main>

      {/* Navegación Inferior (Android First con 5 pestañas) */}
      <PlayerBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default PlayerDashboard;
