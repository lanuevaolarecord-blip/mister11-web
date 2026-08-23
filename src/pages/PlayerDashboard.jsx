import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PlayerBottomNav } from '../components/player/PlayerBottomNav';
import { PlayerHomeTab } from '../components/player/PlayerHomeTab';
import { PlayerScheduleTab } from '../components/player/PlayerScheduleTab';
import { PlayerStatsTab } from '../components/player/PlayerStatsTab';
import { PlayerProfileTab } from '../components/player/PlayerProfileTab';
import { Shield, Loader, AlertCircle } from 'lucide-react';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
  const { user, activeTeam, getTeamPath, changeActiveTeam, teams } = useAuth();
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'stats' | 'profile'
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const teamPath = activeTeam?.teamPath || (activeTeam?.id ? getTeamPath(activeTeam.id) : null);

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
    <div className="player-dashboard-root">
      {/* Barra superior ligera para móvil */}
      <header className="player-topbar">
        <div className="player-topbar-brand">
          <img src="/logo_mister11.png" alt="Míster11" className="player-brand-logo" />
          <span className="player-portal-badge">PORTAL JUGADOR</span>
        </div>

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

        {activeTab === 'stats' && (
          <PlayerStatsTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
          />
        )}

        {activeTab === 'profile' && (
          <PlayerProfileTab
            player={player}
            team={activeTeam}
            teamPath={teamPath}
          />
        )}
      </main>

      {/* Navegación Inferior (Android First) */}
      <PlayerBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default PlayerDashboard;
