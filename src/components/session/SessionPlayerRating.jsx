import React, { useState, useEffect } from 'react';
import { Star, Save, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { saveSessionRatings, getSessionRatings } from '../../utils/sessionRatings';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../utils/toast';

/**
 * SessionPlayerRating
 * Panel modal para evaluar el desempeño individual de los jugadores en una sesión de entrenamiento.
 */
export const SessionPlayerRating = ({
  isOpen = false,
  onClose,
  session,
  players = [],
  teamPath = ''
}) => {
  const { user } = useAuth();
  const { t, isEn } = useTranslation();

  const [ratingsMap, setRatingsMap] = useState({});
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lista de jugadores a calificar: convocados a la sesión o toda la plantilla si no hay lista cerrada
  const eligiblePlayers = React.useMemo(() => {
    if (!players || players.length === 0) return [];
    if (session?.attendance && typeof session.attendance === 'object') {
      // Filtrar a los que asistieron (presentes o tarde)
      const attendedIds = Object.entries(session.attendance)
        .filter(([_, att]) => att.status === 'present' || att.status === 'late' || att.status === 'presente' || att.status === 'tarde')
        .map(([id]) => id);
      if (attendedIds.length > 0) {
        return players.filter(p => attendedIds.includes(p.id));
      }
    }
    return players;
  }, [players, session]);

  // Cargar calificaciones previas si ya existen
  useEffect(() => {
    if (!isOpen || !session?.id || !teamPath) return;

    let isMounted = true;
    setIsLoadingExisting(true);

    getSessionRatings(teamPath, session.id)
      .then((existing) => {
        if (isMounted) {
          const initialMap = {};
          eligiblePlayers.forEach((p) => {
            if (existing[p.id]) {
              initialMap[p.id] = {
                rating: existing[p.id].rating ?? 7,
                comment: existing[p.id].comment ?? ''
              };
            } else {
              initialMap[p.id] = {
                rating: 7, // Nota neutra inicial recomendada
                comment: ''
              };
            }
          });
          setRatingsMap(initialMap);
        }
      })
      .catch((err) => {
        console.warn('Error al cargar calificaciones existentes:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session?.id, teamPath, eligiblePlayers]);

  if (!isOpen) return null;

  const handleRatingChange = (playerId, newRating) => {
    setRatingsMap(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        rating: Number(newRating)
      }
    }));
  };

  const handleCommentChange = (playerId, comment) => {
    const cleanComment = comment.slice(0, 200);
    setRatingsMap(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        comment: cleanComment
      }
    }));
  };

  const handleSaveAll = async () => {
    if (!session?.id || !teamPath) return;

    setIsSaving(true);
    try {
      await saveSessionRatings(teamPath, session.id, ratingsMap, user?.uid || 'staff');
      showToast(t('sessionRating.savedSuccess'), 'success');
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error('Error al guardar calificaciones de sesión:', err);
      showToast(t('sessionRating.saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sessionTitle = session?.title || session?.name || (isEn ? 'Training Session' : 'Sesión de Entrenamiento');

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10050,
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 168, 67, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Star size={20} color="#D4A843" strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {t('sessionRating.title')}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {sessionTitle} {session?.date ? `· ${session.date}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal: Lista de Jugadores */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('sessionRating.subtitle')}
          </p>

          {isLoadingExisting ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              <span>{t('attendance.saving')}</span>
            </div>
          ) : eligiblePlayers.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('sessionRating.noRatings')}
            </div>
          ) : (
            eligiblePlayers.map((player) => {
              const currentRating = ratingsMap[player.id]?.rating ?? 7;
              const currentComment = ratingsMap[player.id]?.comment ?? '';

              // Color dinámico según calificación: Oro para 9-10, Verde Campo para 7-8, Verde Selva para 5-6
              const scoreBadgeColor = currentRating >= 8.5 ? '#D4A843' : (currentRating >= 6 ? '#4CAF7D' : '#1B3A2D');

              return (
                <div
                  key={player.id}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Fila superior: Jugador y Nota Actual */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '900',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        #{player.number || '11'}
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {player.name}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: `${scoreBadgeColor}1A`,
                        border: `1px solid ${scoreBadgeColor}50`,
                        color: scoreBadgeColor,
                        fontWeight: '900',
                        fontSize: '13px'
                      }}
                    >
                      <Star size={13} fill={scoreBadgeColor} color={scoreBadgeColor} />
                      <span>{currentRating.toFixed(1)} / 10</span>
                    </div>
                  </div>

                  {/* Slider de Calificación (0 - 10) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentRating}
                      onChange={(e) => handleRatingChange(player.id, e.target.value)}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        accentColor: '#4CAF7D',
                        height: '6px'
                      }}
                    />
                  </div>

                  {/* Comentario Opcional */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      maxLength={200}
                      value={currentComment}
                      onChange={(e) => handleCommentChange(player.id, e.target.value)}
                      placeholder={t('sessionRating.commentPlaceholder')}
                      style={{
                        width: '100%',
                        fontSize: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{currentComment.length} / 200</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con Acciones */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            {t('btn.cancel')}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || eligiblePlayers.length === 0}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)', // Verde Selva (#1B3A2D)
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px',
              boxShadow: '0 4px 12px rgba(27, 58, 45, 0.25)'
            }}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? t('attendance.saving') : t('sessionRating.saveRatings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionPlayerRating;
