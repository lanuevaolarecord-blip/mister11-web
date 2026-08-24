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
import { Shield, Loader, Sun, Moon, LogOut, HeartHandshake, UserCheck, Users } from 'lucide-react';
import './PlayerDashboard.css';

const normalizeStr = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const PlayerDashboard = () => {
  const { user, activeTeam, getTeamPath, changeActiveTeam, teams, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'achievements' | 'chat' | 'tests' | 'stats' | 'profile'
  const [player, setPlayer] = useState(null);
  const [rosterPlayers, setRosterPlayers] = useState([]);
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

  // 1. Escuchar la plantilla y resolver la ficha real del jugador
  useEffect(() => {
    if (!user || !cleanPath) {
      setLoading(false);
      return;
    }

    const playersRef = collection(db, `${cleanPath}/players`);
    const q = query(playersRef);

    const unsub = onSnapshot(q, async (snap) => {
      const allPlayers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRosterPlayers(allPlayers);

      // Comprobar si en shared_teams del usuario hay un playerId específico asignado
      let linkedPlayerIdFromShared = null;
      try {
        if (activeTeam?.id) {
          const stSnap = await getDoc(doc(db, `users/${user.uid}/shared_teams`, activeTeam.id));
          if (stSnap.exists() && stSnap.data().playerId) {
            linkedPlayerIdFromShared = stSnap.data().playerId;
          }
        }
      } catch (_) {}

      // Buscar si el usuario es el propio jugador O es un padre vinculado
      const found = allPlayers.find(p => 
        (linkedPlayerIdFromShared && p.id === linkedPlayerIdFromShared) ||
        p.requesterUid === user.uid || 
        p.playerUid === user.uid || 
        p.userId === user.uid ||
        p.uid === user.uid ||
        (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
        p.linkedParents?.includes(user.uid) ||
        (user.displayName && p.name && normalizeStr(p.name) === normalizeStr(user.displayName))
      );

      if (found) {
        setPlayer(found);
      } else if (allPlayers.length > 0) {
        // Si no hay coincidencia exacta de cuenta pero hay jugadores reales en la plantilla,
        // usar el primer jugador de la plantilla real del equipo
        setPlayer(allPlayers[0]);
      } else {
        setPlayer({
          id: 'player-self',
          name: user.displayName || 'Jugador Míster11',
          position: 'MC',
          number: '11',
          category: activeTeam?.categoria || activeTeam?.category || 'General',
          consents: { basic: true, attendance: true, health: true, tests: true }
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn('[PlayerDashboard] Error cargando jugador:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, cleanPath, activeTeam?.id]);

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
        <p style={{ marginTop: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cargando tu portal de jugador...</p>
      </div>
    );
  }

  return (
    <div className={`player-dashboard-layout ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      
      {/* Banner de Vista de Padre */}
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
            {player?.position || 'MC'} #{player?.number || '11'}
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

          {/* Selector de Equipo */}
          <select
            value={activeTeam?.id || ''}
            onChange={(e) => changeActiveTeam(e.target.value)}
            className="player-team-select"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre || t.name || 'Mi Equipo'}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Si hay varios jugadores en la plantilla y el usuario desea cambiar la vista de ficha */}
      {rosterPlayers.length > 1 && (
        <div style={{
          padding: '6px 16px',
          background: darkMode ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.76rem'
        }}>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={13} /> Ficha activa:
          </span>
          <select
            value={player?.id || ''}
            onChange={(e) => {
              const selected = rosterPlayers.find(p => p.id === e.target.value);
              if (selected) setPlayer(selected);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-green, #10B981)',
              fontWeight: '700',
              fontSize: '0.78rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {rosterPlayers.map(p => (
              <option key={p.id} value={p.id} style={{ background: darkMode ? '#111B21' : '#FFFFFF', color: darkMode ? '#FFF' : '#000' }}>
                {p.name} ({p.position || 'MC'} #{p.number || '-'})
              </option>
            ))}
          </select>
        </div>
      )}

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

      {/* Barra de Navegación Inferior (Bottom Navigation) */}
      <PlayerBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isParentView={isParentView}
        hasUnreadMessages={hasUnreadMessages}
      />

    </div>
  );
};

export default PlayerDashboard;
