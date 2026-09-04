import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTranslation } from '../../hooks/useTranslation';
import { getWeekKey } from '../../hooks/useCognitiveSync';
import { Trophy, TrendingUp, Award, Shield, User } from 'lucide-react';
import './Games.css';

export const HealthyWeeklyRanking = ({ teamPath, currentPlayerId, isAnonymous = false }) => {
  const { t } = useTranslation();
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const currentWeek = getWeekKey();

  const [activePodium, setActivePodium] = useState('points'); // 'points' | 'improved'
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cleanPath) {
      setLoading(false);
      return;
    }

    // Escuchar jugadores del equipo
    const playersCol = collection(db, `${cleanPath}/players`);
    const unsub = onSnapshot(playersCol, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        const cog = data.cognitive || {};
        const weekly = cog.weekly || {};
        const isCurrentWeek = weekly.weekKey === currentWeek;

        // Puntos semanales acumulados
        const weeklyPoints = isCurrentWeek ? (Number(weekly.points) || 0) : 0;
        const improvement = isCurrentWeek ? (Number(weekly.improvement) || 0) : 0;

        return {
          id: d.id,
          name: data.nombre || data.name || 'Jugador',
          dorsal: data.dorsal || null,
          photoUrl: data.photoUrl || null,
          points: weeklyPoints,
          improvement: improvement
        };
      });

      setRankingData(list);
      setLoading(false);
    }, (err) => {
      console.warn('[HealthyWeeklyRanking] Error cargando jugadores:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [cleanPath, currentWeek]);

  // Ordenar según el podio seleccionado
  const sortedList = [...rankingData].sort((a, b) => {
    if (activePodium === 'points') {
      return b.points - a.points;
    }
    return b.improvement - a.improvement;
  });

  return (
    <div className="games-container">

      {/* Header del Ranking Semanal Sano */}
      <div className="games-limits-card" style={{ borderTop: '4px solid #10B981' }}>
        <div className="limits-header">
          <div className="limits-title-wrap">
            <Trophy size={20} color="#10B981" />
            <h4 className="limits-title">
              {t('games.ranking.title', {}, 'Ranking Semanal Saludable')}
            </h4>
          </div>
          <span className="limits-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
            {t('games.ranking.resetInfo', {}, 'Reset cada lunes')}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          {t('games.ranking.subtitle', {}, 'Un espacio de superación sana donde premiamos la constancia y el progreso personal, no la rivalidad.')}
        </p>
      </div>

      {/* Selector de Podio Doble: Puntos vs Más Mejorado */}
      <div className="games-cat-tabs">
        <button
          type="button"
          className={`games-cat-btn ${activePodium === 'points' ? 'active' : ''}`}
          onClick={() => setActivePodium('points')}
        >
          <Award size={16} /> {t('games.ranking.tabPoints', {}, 'Puntos Semanales')}
        </button>
        <button
          type="button"
          className={`games-cat-btn ${activePodium === 'improved' ? 'active' : ''}`}
          onClick={() => setActivePodium('improved')}
        >
          <TrendingUp size={16} /> {t('games.ranking.tabImproved', {}, 'Más Mejorado')}
        </button>
      </div>

      {/* Lista del Ranking */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
            {t('games.ranking.empty', {}, 'Comienza tus entrenamientos para inaugurar el podio de la semana.')}
          </div>
        ) : (
          sortedList.map((item, index) => {
            const isMe = item.id === currentPlayerId;
            const rank = index + 1;
            const displayName = (isAnonymous && !isMe)
              ? `Compañero #${item.dorsal || rank}`
              : item.name;

            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const valueDisplay = activePodium === 'points'
              ? `${item.points} pts`
              : `+${item.improvement}%`;

            return (
              <div
                key={item.id}
                className={`ranking-item ${isMe ? 'is-me' : ''}`}
              >
                <div className="ranking-item-left">
                  <span className="ranking-medal">
                    {medal}
                  </span>
                  <div>
                    <div className="ranking-name-row">
                      <span className="ranking-name">
                        {displayName}
                      </span>
                      {isMe && (
                        <span className="ranking-you-badge">
                          TÚ
                        </span>
                      )}
                    </div>
                    {item.dorsal && !isAnonymous && (
                      <span className="ranking-dorsal">
                        Dorsal #{item.dorsal}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ranking-score-val">
                  {valueDisplay}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default HealthyWeeklyRanking;
