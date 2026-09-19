import React from 'react';
import { WHITEBOARD_CONFIG, getPlayerBorderWidth, getPlayerFontSize } from '../../config/whiteboardConfig';

/**
 * PlayerToken
 * Token visual de jugador para listas, canvas y modales de pizarra.
 * Consume WHITEBOARD_CONFIG con radio reducido (-30%) y touch target mínimo de 48dp.
 */
const PlayerToken = ({
  player,
  number = '1',
  name = '',
  color = WHITEBOARD_CONFIG.palette.localDefault,
  radius = WHITEBOARD_CONFIG.player.maxRadius,
  photoUrl = null,
  onClick = null,
  selected = false,
  className = '',
  style = {}
}) => {
  const borderWidth = getPlayerBorderWidth(radius);
  const fontSize = getPlayerFontSize(radius);
  const touchPadding = WHITEBOARD_CONFIG.touchTarget.getPadding(radius);
  const diameter = radius * 2;

  const resolvedPhoto = photoUrl || player?.photoURL || player?.avatar || null;
  const displayNumber = player?.number || number || '1';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick(e);
        }
      }}
      className={`player-token-container ${selected ? 'selected' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: `${WHITEBOARD_CONFIG.touchTarget.minTargetSize}px`,
        minHeight: `${WHITEBOARD_CONFIG.touchTarget.minTargetSize}px`,
        padding: `${touchPadding}px`,
        cursor: onClick ? 'pointer' : 'default',
        touchAction: 'manipulation',
        userSelect: 'none',
        ...style
      }}
      aria-label={name || `Jugador ${displayNumber}`}
    >
      <div
        className="player-token-circle"
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          borderRadius: '50%',
          backgroundColor: color,
          border: `${borderWidth}px solid ${WHITEBOARD_CONFIG.palette.stroke}`,
          boxShadow: selected ? `0 0 0 2px ${WHITEBOARD_CONFIG.palette.selectionBorder}` : '0 1px 3px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {resolvedPhoto ? (
          <img
            src={resolvedPhoto}
            alt={name || String(displayNumber)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span
            style={{
              color: '#FFFFFF',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              lineHeight: 1,
              textAlign: 'center'
            }}
          >
            {displayNumber}
          </span>
        )}
      </div>
    </div>
  );
};

export default PlayerToken;
