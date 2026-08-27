import React, { useState } from 'react';

/**
 * PlayerAvatar - Componente único y uniforme para renderizar la foto o iniciales de un jugador.
 * Valida imágenes y muestra fallback a iniciales con dorsal y posición.
 *
 * @param {Object} player - Objeto del jugador { name, number, position, avatarUrl, photoUrl, photo }
 * @param {number} size - Tamaño en px (default: 36)
 * @param {boolean} showNumber - Si se muestra el badge del dorsal (default: false)
 * @param {string} className - Clases CSS adicionales
 * @param {Object} style - Estilos inline adicionales
 */
export const PlayerAvatar = ({
  player = null,
  size = 36,
  showNumber = false,
  className = '',
  style = {}
}) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const photoUrl = player && !imgError
    ? (player.avatarUrl || player.photoUrl || player.photo || player.photoPreview || null)
    : null;

  // Filtrar si la URL no es válida o es un placeholder roto
  const isValidPhoto = Boolean(
    photoUrl &&
    typeof photoUrl === 'string' &&
    (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:image/') || photoUrl.startsWith('blob:'))
  );

  return (
    <div
      className={`player-avatar-unified ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B3A2D, #2E7D5C)',
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: `${Math.max(10, Math.round(size * 0.38))}px`,
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        userSelect: 'none',
        overflow: 'hidden',
        ...style
      }}
      title={player ? `#${player.number ?? '-'} ${player.name || ''}` : ''}
    >
      {isValidPhoto ? (
        <img
          src={photoUrl}
          alt={player?.name || 'Jugador'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      ) : (
        <span>{player ? getInitials(player.name) : '?'}</span>
      )}

      {showNumber && player?.number !== undefined && player?.number !== null && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            background: '#D4A843',
            color: '#000000',
            fontSize: `${Math.max(8, Math.round(size * 0.28))}px`,
            fontWeight: '900',
            padding: '1px 3px',
            borderRadius: '4px',
            lineHeight: 1,
            border: '1px solid #000'
          }}
        >
          {player.number}
        </span>
      )}
    </div>
  );
};

export default PlayerAvatar;
