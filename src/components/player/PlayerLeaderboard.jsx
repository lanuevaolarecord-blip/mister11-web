import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Award, 
  CalendarCheck, 
  Timer, 
  Zap, 
  ChevronUp, 
  Sparkles, 
  Crown,
  Medal,
  TrendingUp,
  Shield
} from 'lucide-react';
import './PlayerLeaderboard.css';

/**
 * PlayerLeaderboard.jsx
 * Sistema de Clasificación y Rendimiento Gaming para jugadores de Míster11.
 * Gamificación positiva (XP, Rango, Podio) respetando privacidad y RGPD.
 */
export const PlayerLeaderboard = ({ 
  players = [], 
  matches = [], 
  attendance = [], 
  currentPlayerId = null,
  team = null,
  darkMode = true 
}) => {
  const [activeFilter, setActiveFilter] = useState('GLOBAL'); // 'GLOBAL' | 'ATTENDANCE' | 'MATCHES' | 'ACHIEVEMENTS'

  // Si el míster ha desactivado el ranking para su equipo
  const isLeaderboardDisabled = team?.hideLeaderboard === true || team?.settings?.hideLeaderboard === true;
  const isAnonymous = team?.leaderboardAnonymous === true || team?.settings?.leaderboardAnonymous === true;

  // 1. Cálculo de Puntuaciones y XP de cada jugador de la plantilla
  const rankedPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];

    return players.map((p) => {
      const pId = String(p.id);
      const isCurrent = String(pId) === String(currentPlayerId);

      // Nombre de pila + Dorsal (RGPD: sin apellidos completos; anonimizado si el míster lo configuró)
      const firstName = isAnonymous && !isCurrent 
        ? 'Compañero' 
        : (p.name || p.nombre || 'Jugador').trim().split(' ')[0];
      const dorsal = p.dorsal || p.number || p.numero || '11';
      const displayName = `#${dorsal} ${firstName}`;

      // A) Asistencia real
      let myPresents = 0;
      let myTotalCalls = 0;
      attendance.forEach(att => {
        myTotalCalls++;
        if (att.players?.[pId] === true || att.presentes?.includes(pId) || att.presentPlayers?.includes(pId)) {
          myPresents++;
        }
      });
      const attendancePct = myTotalCalls > 0 
        ? Math.round((myPresents / myTotalCalls) * 100) 
        : (p.asistenciaPct || 85);

      // B) Partidos, minutos, goles y asistencias
      let totalMatches = 0;
      let totalMinutes = 0;
      let totalGoals = 0;
      let totalAssists = 0;

      matches.forEach(m => {
        const isTitular = (m.titulares || m.alineacion?.titulares || []).some(id => String(id) === pId);
        const isSuplente = (m.suplentes || m.alineacion?.suplentes || []).some(id => String(id) === pId);
        const isConvocado = (m.convocados || m.convocatoria || []).some(id => String(id) === pId);

        if (isTitular || isSuplente || isConvocado) {
          totalMatches++;
        }

        const pStats = m.playerStats?.[pId];
        if (pStats) {
          totalMinutes += (pStats.minutesPlayed || 0);
          totalGoals += (pStats.goals || 0);
          totalAssists += (pStats.assists || 0);
        } else if (isTitular) {
          totalMinutes += parseInt(m.duration || 90, 10);
        }

        const gList = m.goleadoresList || [];
        totalGoals += gList.filter(g => String(g.jugadorId) === pId).length;
      });

      // C) Logros
      const achievementsCount = (p.achievements || p.logros || []).length || Math.min(6, Math.floor(totalMatches * 1.2) + 1);

      // D) Cálculo de XP por pilares
      const attendanceXP = Math.round(attendancePct * 10); // Hasta 1000 XP
      const matchesXP = Math.round((totalMatches * 30) + (totalMinutes * 0.5) + (totalGoals * 35) + (totalAssists * 20));
      const achievementsXP = Math.round(achievementsCount * 50);

      // Puntuación Total Power Score
      const totalXP = attendanceXP + matchesXP + achievementsXP;

      // Determinación de Rango / Nivel Gaming
      let tier = { name: 'BRONCE', color: '#CD7F32', icon: '🥉', minXP: 0 };
      if (totalXP >= 1500) {
        tier = { name: 'DIAMANTE', color: '#60A5FA', icon: '💎', minXP: 1500 };
      } else if (totalXP >= 1000) {
        tier = { name: 'ORO', color: '#C9A84C', icon: '🥇', minXP: 1000 };
      } else if (totalXP >= 500) {
        tier = { name: 'PLATA', color: '#94A3B8', icon: '🥈', minXP: 500 };
      }

      return {
        id: pId,
        displayName,
        firstName,
        dorsal,
        photoUrl: p.photoUrl || p.foto || null,
        position: p.position || p.posicion || 'MC',
        attendancePct,
        totalMatches,
        totalMinutes,
        totalGoals,
        totalAssists,
        achievementsCount,
        attendanceXP,
        matchesXP,
        achievementsXP,
        totalXP,
        tier,
        isCurrent: String(pId) === String(currentPlayerId)
      };
    });
  }, [players, matches, attendance, currentPlayerId]);

  // 2. Ordenar según el filtro activo
  const sortedPlayers = useMemo(() => {
    const list = [...rankedPlayers];
    if (activeFilter === 'ATTENDANCE') {
      list.sort((a, b) => b.attendancePct - a.attendancePct || b.totalXP - a.totalXP);
    } else if (activeFilter === 'MATCHES') {
      list.sort((a, b) => b.totalMinutes - a.totalMinutes || b.totalMatches - a.totalMatches || b.totalXP - a.totalXP);
    } else if (activeFilter === 'ACHIEVEMENTS') {
      list.sort((a, b) => b.achievementsCount - a.achievementsCount || b.totalXP - a.totalXP);
    } else {
      list.sort((a, b) => b.totalXP - a.totalXP);
    }
    return list.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }, [rankedPlayers, activeFilter]);

  // Jugador actual y datos de su posición
  const currentRankInfo = sortedPlayers.find(p => p.isCurrent) || sortedPlayers[0] || null;
  const currentRankIndex = sortedPlayers.findIndex(p => p.isCurrent);
  const playerAbove = currentRankIndex > 0 ? sortedPlayers[currentRankIndex - 1] : null;
  const xpToNextRank = playerAbove && currentRankInfo ? Math.max(10, playerAbove.totalXP - currentRankInfo.totalXP + 15) : 0;

  // Podio Top 3
  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];

  if (players.length === 0 || isLeaderboardDisabled) return null;

  return (
    <div className="player-leaderboard-container">
      
      {/* CABECERA GAMING */}
      <div className="leaderboard-header-hud">
        <div className="leaderboard-title-group">
          <div className="leaderboard-badge">
            <Trophy size={16} color="#C9A84C" />
            <span>TABLA DE RENDIMIENTO DEL EQUIPO</span>
          </div>
          <span className="leaderboard-rgpd-tag">
            <Shield size={12} /> Datos de equipo protegidos
          </span>
        </div>
        <p className="leaderboard-subtitle">
          Suma puntos XP con tu asistencia a entrenamientos, minutos jugados y retos completados.
        </p>
      </div>

      {/* TARJETA PERSONAL FLOTANTE DE MI POSICIÓN */}
      {currentRankInfo && (
        <div className="my-rank-banner">
          <div className="my-rank-left">
            <div className="my-rank-badge">
              #{currentRankInfo.rank}
            </div>
            <div className="my-rank-details">
              <div className="my-rank-name">
                <span>Tu Posición: <strong>{currentRankInfo.displayName}</strong></span>
                <span className="tier-tag" style={{ color: currentRankInfo.tier.color, borderColor: `${currentRankInfo.tier.color}40` }}>
                  {currentRankInfo.tier.icon} Rango {currentRankInfo.tier.name}
                </span>
              </div>
              <div className="my-rank-xp-bar-wrap">
                <div className="my-rank-xp-info">
                  <span><strong>{currentRankInfo.totalXP} XP</strong> acumulados</span>
                  {playerAbove ? (
                    <span className="xp-diff-text">¡A solo <strong>{xpToNextRank} XP</strong> del Top #{currentRankInfo.rank - 1}!</span>
                  ) : (
                    <span className="xp-diff-text gold">👑 ¡Liderando la clasificación del equipo!</span>
                  )}
                </div>
                <div className="xp-bar-track">
                  <div 
                    className="xp-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.max(15, (currentRankInfo.totalXP / (top1?.totalXP || 1000)) * 100))}%`,
                      background: 'linear-gradient(90deg, #4CAF7D 0%, #C9A84C 100%)'
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS INTERACTIVOS ESTILO ESPORTS (TOUCH TARGET >= 48DP) */}
      <div className="leaderboard-filter-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'GLOBAL'}
          className={`filter-btn ${activeFilter === 'GLOBAL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('GLOBAL')}
        >
          <Sparkles size={16} /> Global XP
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'ATTENDANCE'}
          className={`filter-btn ${activeFilter === 'ATTENDANCE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ATTENDANCE')}
        >
          <CalendarCheck size={16} /> Asistencia
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'MATCHES'}
          className={`filter-btn ${activeFilter === 'MATCHES' ? 'active' : ''}`}
          onClick={() => setActiveFilter('MATCHES')}
        >
          <Timer size={16} /> Partidos y Minutos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'ACHIEVEMENTS'}
          className={`filter-btn ${activeFilter === 'ACHIEVEMENTS' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ACHIEVEMENTS')}
        >
          <Award size={16} /> Logros
        </button>
      </div>

      {/* PODIO TOP 3 VISUAL */}
      <div className="podium-section">
        {/* TOP 2 (PLATA) */}
        {top2 && (
          <div className={`podium-column silver ${top2.isCurrent ? 'is-me' : ''}`}>
            <div className="podium-avatar-wrap">
              <div className="podium-medal-badge silver">🥈 2º</div>
              <div className="podium-dorsal">#{top2.dorsal}</div>
            </div>
            <span className="podium-player-name">{top2.firstName}</span>
            <span className="podium-stat-val">
              {activeFilter === 'ATTENDANCE' ? `${top2.attendancePct}%` : 
               activeFilter === 'MATCHES' ? `${top2.totalMinutes}'` : 
               activeFilter === 'ACHIEVEMENTS' ? `${top2.achievementsCount} 🎖️` : 
               `${top2.totalXP} XP`}
            </span>
            <div className="podium-pedestal p-2">
              <span>2</span>
            </div>
          </div>
        )}

        {/* TOP 1 (ORO) */}
        {top1 && (
          <div className={`podium-column gold ${top1.isCurrent ? 'is-me' : ''}`}>
            <div className="podium-avatar-wrap">
              <div className="crown-icon">👑</div>
              <div className="podium-medal-badge gold">🥇 1º</div>
              <div className="podium-dorsal gold-ring">#{top1.dorsal}</div>
            </div>
            <span className="podium-player-name gold-name">{top1.firstName}</span>
            <span className="podium-stat-val gold-stat">
              {activeFilter === 'ATTENDANCE' ? `${top1.attendancePct}%` : 
               activeFilter === 'MATCHES' ? `${top1.totalMinutes}'` : 
               activeFilter === 'ACHIEVEMENTS' ? `${top1.achievementsCount} 🎖️` : 
               `${top1.totalXP} XP`}
            </span>
            <div className="podium-pedestal p-1">
              <span>1</span>
            </div>
          </div>
        )}

        {/* TOP 3 (BRONCE) */}
        {top3 && (
          <div className={`podium-column bronze ${top3.isCurrent ? 'is-me' : ''}`}>
            <div className="podium-avatar-wrap">
              <div className="podium-medal-badge bronze">🥉 3º</div>
              <div className="podium-dorsal">#{top3.dorsal}</div>
            </div>
            <span className="podium-player-name">{top3.firstName}</span>
            <span className="podium-stat-val">
              {activeFilter === 'ATTENDANCE' ? `${top3.attendancePct}%` : 
               activeFilter === 'MATCHES' ? `${top3.totalMinutes}'` : 
               activeFilter === 'ACHIEVEMENTS' ? `${top3.achievementsCount} 🎖️` : 
               `${top3.totalXP} XP`}
            </span>
            <div className="podium-pedestal p-3">
              <span>3</span>
            </div>
          </div>
        )}
      </div>

      {/* LISTA COMPLETA DE CLASIFICACIÓN */}
      <div className="leaderboard-full-list">
        <div className="list-table-header">
          <span className="col-pos">PUESTO</span>
          <span className="col-player">COMPAÑERO</span>
          <span className="col-metric">
            {activeFilter === 'ATTENDANCE' ? 'ASISTENCIA' : 
             activeFilter === 'MATCHES' ? 'MINUTOS' : 
             activeFilter === 'ACHIEVEMENTS' ? 'LOGROS' : 
             'XP TOTAL'}
          </span>
        </div>

        {sortedPlayers.map((p) => {
          const isTop3 = p.rank <= 3;
          let rankBadge = `#${p.rank}`;
          if (p.rank === 1) rankBadge = '🥇';
          if (p.rank === 2) rankBadge = '🥈';
          if (p.rank === 3) rankBadge = '🥉';

          return (
            <div 
              key={p.id} 
              className={`leaderboard-row ${p.isCurrent ? 'current-player-row' : ''} ${isTop3 ? 'top-row' : ''}`}
            >
              <div className="col-pos">
                <span className={`rank-pill rank-${p.rank}`}>
                  {rankBadge}
                </span>
              </div>

              <div className="col-player player-cell">
                <div className="player-avatar-chip">
                  #{p.dorsal}
                </div>
                <div className="player-meta-info">
                  <div className="name-row">
                    <span className="player-name-txt">{p.displayName}</span>
                    {p.isCurrent && <span className="is-you-chip">TÚ</span>}
                  </div>
                  <span className="position-txt">{p.position} · {p.tier.name}</span>
                </div>
              </div>

              <div className="col-metric metric-cell">
                {activeFilter === 'ATTENDANCE' && (
                  <span className="main-metric-val green">{p.attendancePct}%</span>
                )}
                {activeFilter === 'MATCHES' && (
                  <span className="main-metric-val">{p.totalMinutes}' <small>({p.totalMatches} PJ)</small></span>
                )}
                {activeFilter === 'ACHIEVEMENTS' && (
                  <span className="main-metric-val gold">{p.achievementsCount} <small>retos</small></span>
                )}
                {activeFilter === 'GLOBAL' && (
                  <div className="xp-metric-box">
                    <span className="main-metric-val gold">{p.totalXP}</span>
                    <span className="xp-label">XP</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER MOTIVACIONAL SIN CASTIGO */}
      <div className="leaderboard-footer-card">
        <div className="footer-icon-wrap">
          <Flame size={20} color="#4CAF7D" />
        </div>
        <div className="footer-text-wrap">
          <h4>¡Cada sesión suma para el equipo!</h4>
          <p>
            El compromiso en los entrenamientos y el juego en equipo son el camino para subir de rango en Míster11.
          </p>
        </div>
      </div>

    </div>
  );
};

export default PlayerLeaderboard;
