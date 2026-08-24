import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAchievements } from '../hooks/useAchievements';
import { PlayerBottomNav } from '../components/player/PlayerBottomNav';
import { PlayerHomeTab } from '../components/player/PlayerHomeTab';
import { PlayerScheduleTab } from '../components/player/PlayerScheduleTab';
import { PlayerAchievementsTab } from '../components/player/PlayerAchievementsTab';
import { PlayerChatTab } from '../components/player/PlayerChatTab';
import { PlayerAutonomousTestsTab } from '../components/player/PlayerAutonomousTestsTab';
import { PlayerStatsTab } from '../components/player/PlayerStatsTab';
import { PlayerProfileTab } from '../components/player/PlayerProfileTab';
import { Shield, Loader, Sun, Moon, LogOut, HeartHandshake, UserCheck } from 'lucide-react';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
  const { user, activeTeam, getTeamPath, changeActiveTeam, teams, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'achievements' | 'chat' | 'tests' | 'stats' | 'profile'
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const teamPath = activeTeam?.teamPath || (activeTeam?.id ? getTeamPath(activeTeam.id) : null);
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

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

  // 1. Escuchar la ficha del jugador vinculada a este usuario (o a este padre)
  useEffect(() => {
    if (!user || !cleanPath) {
      setLoading(false);
      return;
    }

    const playersRef = collection(db, `${cleanPath}/players`);
    const q = query(playersRef);

    const unsub = onSnapshot(q, (snap) => {
      const allPlayers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Buscar si el usuario es el propio jugador O es un padre vinculado en linkedParents
      const found = allPlayers.find(p => 
        p.requesterUid === user.uid || 
        p.playerUid === user.uid || 
        p.email === user.email ||
        p.linkedParents?.includes(user.uid)
      );

      if (found) {
        setPlayer(found);
      } else {
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
  }, [user, cleanPath]);

  // 2. Determinar si es vista de padre
  const isParentView = (
    activeTeam?.memberRoles?.[user?.uid] === 'parent' || 
    player?.linkedParents?.includes(user?.uid) ||
    false
  );

  // 3. Hook de logros deportivos en tiempo real
  const { achievements, closestAchievement, loading: loadingAchievements } = useAchievements(cleanPath, player?.id, isParentView);

  // 4. Escuchar si hay mensajes no leídos en el hilo 1:1
  useEffect(() => {
    if (!cleanPath || !player?.id) return;

    const threadMetaRef = doc(db, `${cleanPath}/threads`, player.id);
    const unsub = onSnapshot(threadMetaRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const lastSenderUid = data.lastSenderUid;
        // Si el último mensaje no lo mandó el usuario y no está marcado como leído
        if (lastSenderUid && lastSenderUid !== user?.uid && !data.readBy?.includes(user?.uid)) {
          setHasUnreadMessages(true);
        } else {
          setHasUnreadMessages(false);
        }
      }
    });

    return () => unsub();
  }, [cleanPath, player?.id, user?.uid]);

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
      
      {/* BANNER FIJO: VISTA DE PADRE / TUTOR LEGAL (FASE 1) */}
      {isParentView && (
        <div style={{
          background: 'linear-gradient(90deg, #1B3A2D 0%, #2E7D5C 100%)',
          borderBottom: '1.5px solid #D4A843',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          fontWeight: 700,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#D4A843" />
            <span>
              👨 <strong>Vista de Padre / Tutor</strong> · Hijo: <span style={{ color: '#D4A843' }}>{player?.name || 'Jugador'}</span>
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', background: 'rgba(212, 168, 67, 0.2)', color: '#D4A843', padding: '2px 8px', borderRadius: '10px' }}>
            {player?.position} #{player?.number || '11'}
          </span>
        </div>
      )}

      {/* Barra superior ligera para móvil */}
      <header className="player-topbar">
        <div className="player-topbar-brand">
          <img src="/logo_mister11.png" alt="Míster11" className="player-brand-logo" />
          <span className="player-portal-badge">
            {isParentView ? 'PORTAL FAMILIA' : 'PORTAL JUGADOR'}
          </span>
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
            teamPath={cleanPath}
            onNavigateTab={setActiveTab}
            isParentView={isParentView}
            closestAchievement={closestAchievement}
          />
        )}

        {activeTab === 'schedule' && (
          <PlayerScheduleTab
            player={player}
            team={activeTeam}
            teamPath={cleanPath}
            isParentView={isParentView}
          />
        )}

        {activeTab === 'achievements' && (
          <PlayerAchievementsTab
            achievements={achievements}
            loading={loadingAchievements}
            isParentView={isParentView}
            playerName={player?.name}
          />
        )}

        {activeTab === 'chat' && (
          <PlayerChatTab
            player={player}
            team={activeTeam}
            teamPath={cleanPath}
            isParentView={isParentView}
          />
        )}

        {activeTab === 'tests' && (
          <PlayerAutonomousTestsTab
            player={player}
            team={activeTeam}
            teamPath={cleanPath}
            isParentView={isParentView}
          />
        )}

        {activeTab === 'stats' && (
          <PlayerStatsTab
            player={player}
            team={activeTeam}
            teamPath={cleanPath}
            isParentView={isParentView}
            onNavigateTests={() => setActiveTab('tests')}
          />
        )}

        {activeTab === 'profile' && (
          <PlayerProfileTab
            player={player}
            team={activeTeam}
            teamPath={cleanPath}
            isParentView={isParentView}
          />
        )}
      </main>

      {/* Navegación Inferior (Android First) */}
      <PlayerBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        hasUnreadMessages={hasUnreadMessages}
      />
    </div>
  );
};

export default PlayerDashboard;
