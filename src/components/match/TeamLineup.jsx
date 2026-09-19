import React from 'react';
import { PlayerAvatar } from '../PlayerAvatar';
import { PREDEFINED_FORMATIONS } from '../../utils/formaciones';

/**
 * TeamLineup - Componente visual para renderizar la alineación en campo táctico
 * y las listas laterales de titulares y suplentes con fotos y fallback universal.
 * Cumple con FIX 2: avatar 32x32 sobre cada punto de posición + dorsal; nombre en listas laterales.
 */
export const TeamLineup = ({
  formation = '4-3-3',
  titulares = [], // array of player objects (up to 11)
  suplentes = [], // array of player objects (up to 7)
  onPlayerClick = null,
  isEn = false
}) => {
  const formationPositions = PREDEFINED_FORMATIONS[formation] || PREDEFINED_FORMATIONS['4-3-3'] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '20px' }}>
        
        {/* Listas laterales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Titulares */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #1B3A2D)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border-color, rgba(76, 175, 125, 0.25))'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: 'var(--accent-gold, #D4A843)' }}>
              {isEn ? 'STARTING XI' : 'ONCE TITULAR'} ({titulares.filter(Boolean).length}/11)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Array.from({ length: 11 }).map((_, idx) => {
                const player = titulares[idx];
                const pos = formationPositions[idx]?.pos || 'JUG';
                return (
                  <div
                    key={`titular-${idx}`}
                    onClick={() => onPlayerClick && onPlayerClick(player, idx, true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      backgroundColor: player ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                      cursor: onPlayerClick ? 'pointer' : 'default'
                    }}
                  >
                    <PlayerAvatar player={player} size={32} />
                    <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-gold, #D4A843)', minWidth: '18px' }}>
                      {player?.number !== undefined && player?.number !== null ? `#${player.number}` : `-${idx + 1}`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player?.name || (isEn ? 'Empty Slot' : 'Hueco Vacío')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
                      {player?.position || pos}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suplentes */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #1B3A2D)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid var(--border-color, rgba(76, 175, 125, 0.25))'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: 'var(--accent-gold, #D4A843)' }}>
              {isEn ? 'SUBSTITUTES' : 'SUPLENTES'} ({suplentes.filter(Boolean).length}/7)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suplentes.map((player, sIdx) => (
                <div
                  key={`sub-${sIdx}`}
                  onClick={() => onPlayerClick && onPlayerClick(player, sIdx, false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: player ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    cursor: onPlayerClick ? 'pointer' : 'default'
                  }}
                >
                  <PlayerAvatar player={player} size={32} />
                  <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent-gold, #D4A843)', minWidth: '18px' }}>
                    {player?.number !== undefined && player?.number !== null ? `#${player.number}` : '-'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player?.name || (isEn ? 'Substitute' : 'Suplente')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
                    {player?.position || 'SUB'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terreno de Juego con Avatares 32x32 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '520px',
            backgroundColor: '#17402B',
            borderRadius: '16px',
            border: '2px solid #D4A843',
            overflow: 'hidden',
            boxShadow: '0 12px 28px rgba(0,0,0,0.4)'
          }}
        >
          {/* Líneas tácticas */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '90px', height: '90px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', transform: 'translate(-50%, -50%)' }} />
          <div style={{ position: 'absolute', top: '22%', left: 0, width: '15%', bottom: '22%', border: '2px solid rgba(255,255,255,0.4)', borderLeft: 'none' }} />
          <div style={{ position: 'absolute', top: '22%', right: 0, width: '15%', bottom: '22%', border: '2px solid rgba(255,255,255,0.4)', borderRight: 'none' }} />

          {/* Fichas de jugadores sobre el punto de posición con avatar 32x32 */}
          {formationPositions.map((pos, idx) => {
            const player = titulares[idx];
            const isGk = pos.pos === 'POR' || (player && (player.position === 'POR' || player.posicion === 'POR'));

            return (
              <div
                key={`pitch-point-${idx}`}
                onClick={() => onPlayerClick && onPlayerClick(player, idx, true)}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: onPlayerClick ? 'pointer' : 'default',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '50%',
                    padding: '2px',
                    backgroundColor: isGk ? '#D4A843' : '#1B3A2D',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  <PlayerAvatar player={player} size={32} showNumber={true} />
                </div>
                <span
                  style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(13, 33, 24, 0.85)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(212, 168, 67, 0.3)',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {player?.name ? player.name.split(' ')[0] : (pos.pos || `P${idx+1}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamLineup;
