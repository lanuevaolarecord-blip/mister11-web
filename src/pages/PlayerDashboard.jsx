import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Shield, Loader, Sun, Moon, LogOut, HeartHandshake, UserCheck, Users, Bell, KeyRound, ArrowRight } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import './PlayerDashboard.css';

const normalizeStr = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const PlayerDashboard = () => {
  const navigate = useNavigate();
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

      // Buscar si el usuario ya tenía una ficha activa, o buscar por coincidencia de cuenta/padre
      setPlayer((prevPlayer) => {
        if (prevPlayer?.id && prevPlayer.id !== 'player-self') {
          const updated = allPlayers.find(p => p.id === prevPlayer.id);
          if (updated) return updated;
        }

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

        if (found) return found;

        // Si no hay ficha exacta asignada aún, construir con los datos reales del usuario logueado (NUNCA Marc García)
        return {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Jugador Míster11',
          email: user.email || '',
          position: 'MC',
          number: '-',
          category: activeTeam?.categoria || activeTeam?.category || 'General',
          consents: { basic: true, attendance: true, health: true, tests: true }
        };
      });
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

  // Hook de notificaciones push con deep links
  const { showPrompt, checkPromptEligibility, acceptNotifications, dismissNotifications } = usePushNotifications(setActiveTab);

  useEffect(() => {
    if (activeTab === 'schedule' || activeTab === 'achievements') {
      checkPromptEligibility();
    }
  }, [activeTab, checkPromptEligibility]);

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
      
      {/* Banner Contextual de Permiso de Notificaciones */}
      {showPrompt && (
        <div style={{
          background: 'linear-gradient(135deg, #1B3A2D 0%, #0F172A 100%)',
          borderBottom: '2px solid #10B981',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          zIndex: 1200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#10B981" />
            <span style={{ fontWeight: 700 }}>
              ¿Deseas activar avisos de convocatorias y partidos?
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
            Recibe al instante las convocatorias oficiales del míster y recordatorios 2h antes de cada entreno.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={acceptNotifications}
              style={{
                flex: 1,
                minHeight: '36px',
                background: '#10B981',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              ACTIVAR AVISOS
            </button>
            <button
              onClick={dismissNotifications}
              style={{
                padding: '0 12px',
                minHeight: '36px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#94A3B8',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

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
        {!activeTeam && (
          <div style={{
            margin: '16px',
            padding: '24px 18px',
            background: darkMode ? 'rgba(27, 58, 45, 0.45)' : '#FFFFFF',
            border: '1.5px dashed #10B981',
            borderRadius: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '36px' }}>⚽</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ¡Hola, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Crack'}! 👋
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', maxWidth: '340px' }}>
              Aún no estás vinculado a ningún equipo. Pídele el código de acceso a tu entrenador o pulsa a continuación para unirte a tu plantilla.
            </p>
            <button
              type="button"
              onClick={() => navigate('/join')}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <KeyRound size={18} />
              <span>Unirme a un Equipo con Código</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

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
