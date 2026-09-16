import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Award, Loader2, Calendar, User } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getSessionRatings, calculatePlayerAverageRating } from '../../utils/sessionRatings';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * TrainingPerformanceTable
 * Muestra el rendimiento de los jugadores en las últimas 5 sesiones de entrenamiento calificadas
 * y su media acumulada.
 */
export const TrainingPerformanceTable = ({ players = [], activeTeam, teamPath = '' }) => {
  const { t, isEn } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);
  const [ratingsBySession, setRatingsBySession] = useState({}); // { [sessionId]: { [playerId]: ratingData } }

  const cleanPath = (teamPath || (activeTeam?.id ? `equipos/${activeTeam.id}` : '')).replace(/^\/+|\/+$/g, '');

  useEffect(() => {
    if (!cleanPath) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        // Obtener las últimas sesiones
        const sessionsRef = collection(db, `${cleanPath}/sessions`);
        const q = query(sessionsRef, orderBy('createdAt', 'desc'), limit(10));
        let snap;
        try {
          snap = await getDocs(q);
        } catch {
          // Fallback sin orderBy por si falta índice compuesto
          snap = await getDocs(sessionsRef);
        }

        const sessionDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Cargar calificaciones para cada sesión en paralelo
        const ratingsMap = {};
        const ratedSessions = [];

        await Promise.all(
          sessionDocs.map(async (sess) => {
            try {
              const ratings = await getSessionRatings(cleanPath, sess.id);
              if (Object.keys(ratings).length > 0) {
                ratingsMap[sess.id] = ratings;
                ratedSessions.push(sess);
              }
            } catch (e) {
              console.warn(`Error al cargar calificaciones de sesión ${sess.id}:`, e);
            }
          })
        );

        // Ordenar las sesiones que tienen calificaciones por fecha descendente y tomar hasta 5
        ratedSessions.sort((a, b) => {
          const dateA = a.date || a.fecha || '';
          const dateB = b.date || b.fecha || '';
          return dateB.localeCompare(dateA);
        });

        const top5Sessions = ratedSessions.slice(0, 5);

        if (isMounted) {
          setRecentSessions(top5Sessions);
          setRatingsBySession(ratingsMap);
        }
      } catch (err) {
        console.error('Error al cargar datos de rendimiento de entrenamiento:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPerformanceData();

    return () => {
      isMounted = false;
    };
  }, [cleanPath]);

  // Si está cargando
  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ margin: 0, fontSize: '14px' }}>{t('attendance.saving')}</p>
      </div>
    );
  }

  // Si no hay sesiones calificadas
  if (recentSessions.length === 0) {
    return (
      <div
        style={{
          padding: '36px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(212, 168, 67, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Star size={24} color="#D4A843" strokeWidth={2} />
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
          {t('sessionRating.performanceTableTitle')}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
          {t('sessionRating.noRatings')}
        </p>
      </div>
    );
  }

  // Helper para determinar el color según la nota (regla de paleta: Verde Selva, Verde Campo, Oro)
  const getRatingBadgeStyle = (rating) => {
    if (rating == null || isNaN(rating)) {
      return {
        bg: 'var(--bg-card)',
        border: 'var(--border-color)',
        color: 'var(--text-muted)'
      };
    }
    if (rating >= 8.5) {
      return {
        bg: 'rgba(212, 168, 67, 0.18)',
        border: 'rgba(212, 168, 67, 0.5)',
        color: '#D4A843'
      };
    }
    if (rating >= 6.0) {
      return {
        bg: 'rgba(76, 175, 125, 0.18)',
        border: 'rgba(76, 175, 125, 0.5)',
        color: '#4CAF7D'
      };
    }
    return {
      bg: 'rgba(27, 58, 45, 0.18)',
      border: 'rgba(27, 58, 45, 0.5)',
      color: '#1B3A2D'
    };
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(76, 175, 125, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={22} color="#4CAF7D" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {t('sessionRating.performanceTableTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              {t('sessionRating.performanceTableSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Calendar size={12} />
            {recentSessions.length} {isEn ? 'sessions' : 'sesiones'}
          </span>
        </div>
      </div>

      {/* Tabla Responsive */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 6px',
            fontSize: '13px'
          }}
        >
          <thead>
            <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontWeight: '700', minWidth: '160px' }}>
                {isEn ? 'Player' : 'Jugador'}
              </th>
              {recentSessions.map((s, idx) => (
                <th
                  key={s.id}
                  style={{
                    padding: '8px 8px',
                    fontWeight: '700',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}
                  title={s.title || s.titulo || (isEn ? 'Session' : 'Sesión')}
                >
                  S{idx + 1}
                </th>
              ))}
              <th
                style={{
                  padding: '8px 12px',
                  fontWeight: '800',
                  textAlign: 'center',
                  minWidth: '70px',
                  color: 'var(--text-primary)'
                }}
              >
                {t('sessionRating.averageRating')}
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const ratingsList = [];
              const sessionScores = recentSessions.map((sess) => {
                const r = ratingsBySession[sess.id]?.[player.id];
                if (r && typeof r.rating === 'number') {
                  ratingsList.push(r);
                  return r.rating;
                }
                return null;
              });

              const average = calculatePlayerAverageRating(ratingsList);
              const avgStyle = ratingsList.length > 0 ? getRatingBadgeStyle(average) : null;

              return (
                <tr
                  key={player.id}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Nombre y Dorsal del Jugador */}
                  <td
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px 0 0 8px',
                      borderLeft: '1px solid var(--border-color)',
                      borderTop: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        #{player.number || '11'}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{player.name}</strong>
                    </div>
                  </td>

                  {/* Columnas de las 5 sesiones */}
                  {sessionScores.map((score, sIdx) => {
                    const badge = getRatingBadgeStyle(score);
                    return (
                      <td
                        key={sIdx}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          borderTop: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                      >
                        {score != null ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                              fontWeight: '800',
                              fontSize: '12px'
                            }}
                          >
                            {score.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Columna de Media */}
                  <td
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      borderRadius: '0 8px 8px 0',
                      borderRight: '1px solid var(--border-color)',
                      borderTop: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    {ratingsList.length > 0 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: avgStyle.bg,
                          border: `1px solid ${avgStyle.border}`,
                          color: avgStyle.color,
                          fontWeight: '900',
                          fontSize: '12px'
                        }}
                      >
                        <Star size={11} fill={avgStyle.color} color={avgStyle.color} />
                        {average.toFixed(1)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingPerformanceTable;
