import React from 'react';
import { PlayerAvatar } from './PlayerAvatar';

/**
 * PlayerCard - Componente unificado para tarjetas de jugador con avatar 40x40, nombre y dorsal.
 * Cumple con la regla universal de fotos y fallback obligatorio a Verde Campo #4CAF7D + inicial.
 */
export const PlayerCard = ({
  player,
  onClick = null,
  size = 40,
  className = '',
  style = {}
}) => {
  if (!player) return null;
  const dorsal = player.number !== undefined && player.number !== null ? String(player.number) : (player.dorsal || '-');
  const name = player.name || player.nombre || 'Jugador';

  return (
    <div
      className={`player-card-unified ${className}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-card, #1B3A2D)',
        border: '1px solid var(--border-color, rgba(76, 175, 125, 0.25))',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
    >
      <PlayerAvatar player={player} size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary, #FFFFFF)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-gold, #D4A843)' }}>
          #{dorsal} {player.position ? `· ${player.position}` : ''}
        </span>
      </div>
    </div>
  );
};

export default PlayerCard;
