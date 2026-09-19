import React, { useState } from 'react';

/**
 * PlayerAvatar - Componente único y uniforme para renderizar la foto o inicial de un jugador.
 * Cumple la regla de fallback obligatoria: círculo Verde Campo (#4CAF7D) + inicial en blanco (#FFFFFF).
 *
 * @param {Object} player - Objeto del jugador { name, number, position, avatarUrl, photoUrl, photo }
 * @param {string} url - URL directa de la foto (alternativa a player.photoUrl)
 * @param {string} name - Nombre directo (alternativa a player.name)
 * @param {number|string} number - Dorsal directo (alternativa a player.number)
 * @param {number} size - Tamaño en px (default: 36)
 * @param {boolean} showNumber - Si se muestra el badge del dorsal (default: false)
 * @param {string} className - Clases CSS adicionales
 * @param {Object} style - Estilos inline adicionales
 */
export const PlayerAvatar = ({
  player = null,
  url = null,
  photoUrl: directPhotoUrl = null,
  name: directName = null,
  number: directNumber = null,
  size = 36,
  showNumber = false,
  className = '',
  style = {}
}) => {
  const [imgError, setImgError] = useState(false);

  const effectiveName = directName || player?.name || player?.nombre || '';
  const effectiveNumber = directNumber !== null && directNumber !== undefined
    ? directNumber
    : (player?.number !== undefined ? player?.number : player?.dorsal);

  const rawUrl = directPhotoUrl || url || player?.avatarUrl || player?.photoUrl || player?.photo || player?.photoPreview || null;

  const getInitial = (nameStr) => {
    if (!nameStr) return '?';
    const trimmed = String(nameStr).trim();
    return trimmed.charAt(0).toUpperCase() || '?';
  };

  const isValidPhoto = Boolean(
    rawUrl &&
    !imgError &&
    typeof rawUrl === 'string' &&
    (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:image/') || rawUrl.startsWith('blob:'))
  );

  return (
    <div
      className={`player-avatar-unified ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF7D', // Regla universal: Verde Campo #4CAF7D
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: `${Math.max(11, Math.round(size * 0.44))}px`,
        border: '1.5px solid rgba(255, 255, 255, 0.35)',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        userSelect: 'none',
        overflow: 'hidden',
        ...style
      }}
      title={effectiveName ? `#${effectiveNumber ?? '-'} ${effectiveName}` : ''}
    >
      {isValidPhoto ? (
        <img
          src={rawUrl}
          alt={effectiveName || 'Jugador'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      ) : (
        <span style={{ lineHeight: 1, letterSpacing: 0 }}>{getInitial(effectiveName)}</span>
      )}

      {showNumber && effectiveNumber !== undefined && effectiveNumber !== null && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            backgroundColor: '#D4A843',
            color: '#000000',
            fontSize: `${Math.max(8, Math.round(size * 0.28))}px`,
            fontWeight: '900',
            padding: '1px 3px',
            borderRadius: '4px',
            lineHeight: 1,
            border: '1px solid #000'
          }}
        >
          {effectiveNumber}
        </span>
      )}
    </div>
  );
};

export default PlayerAvatar;
