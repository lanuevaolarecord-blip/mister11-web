import React, { memo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './PlayerChipRow.css';

/**
 * PlayerChipRow
 * Componente canónico y compartido para filas de selección de jugadores.
 * - Flexbox horizontal sin solapes ni posiciones absolutas (gap: 8px).
 * - Touch targets Android First (≥48px min-height).
 * - Badge de dorsal + truncado de nombre corto (max-width: 120px) + tooltip/aria-label con nombre completo.
 * - Chip "Sin atribuir" fijo primero, visualmente separado (si showUnassigned = true).
 * - Estado seleccionado con outline dorado y fondo institucional (cero saltos de layout).
 * - Scrollbar institucional fina de 4px (sin barras grises nativas).
 */
export const PlayerChipRow = memo(({
  players = [],
  selectedId = null,
  onSelect,
  showUnassigned = false,
  unassignedId = null,
  unassignedLabel = null,
  unassignedIcon = '🔘',
  allowDeselect = true,
  extraAfter = null,
  id = null,
  className = '',
  ariaLabel = 'Fila de selección de jugadores',
}) => {
  const { t, isEn } = useTranslation();

  const resolvedUnassignedLabel = unassignedLabel || t('capture.hud.unattributed') || (isEn ? 'Unattributed' : 'Sin atribuir');

  const handlePlayerClick = (p) => {
    if (!onSelect) return;
    const pid = p.id;
    if (allowDeselect && String(selectedId) === String(pid)) {
      onSelect(null, null);
    } else {
      onSelect(pid, p);
    }
  };

  const handleUnassignedClick = () => {
    if (!onSelect) return;
    if (allowDeselect && (selectedId === unassignedId || selectedId === null)) {
      onSelect(unassignedId, null);
    } else {
      onSelect(unassignedId, null);
    }
  };

  const isUnassignedSelected = selectedId === unassignedId || (unassignedId === null && !selectedId);

  return (
    <div
      id={id}
      className={`player-chip-row-scroll ${className}`}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {/* Chip 'Sin atribuir' fijo de primero */}
      {showUnassigned && (
        <button
          type="button"
          className={`player-chip-item chip-unassigned ${isUnassignedSelected ? 'is-selected' : ''}`}
          onClick={handleUnassignedClick}
          aria-pressed={isUnassignedSelected}
          aria-label={resolvedUnassignedLabel}
          title={resolvedUnassignedLabel}
        >
          {unassignedIcon && <span className="chip-icon">{unassignedIcon}</span>}
          <span className="player-chip-name-text">{resolvedUnassignedLabel}</span>
        </button>
      )}

      {/* Chips de jugadores */}
      {players.map((p) => {
        if (!p) return null;
        const pid = p.id;
        const isSelected = String(selectedId) === String(pid);
        const dorsal = p.dorsal || p.number || '';
        const fullName = p.nombre || p.name || (isEn ? 'Player' : 'Jugador');
        const shortName = fullName.split(' ')[0];
        const accessibleLabel = dorsal ? `#${dorsal} ${fullName}` : fullName;

        return (
          <button
            key={pid}
            type="button"
            className={`player-chip-item ${isSelected ? 'is-selected' : ''}`}
            onClick={() => handlePlayerClick(p)}
            aria-pressed={isSelected}
            aria-label={accessibleLabel}
            title={accessibleLabel}
          >
            {dorsal ? (
              <span className="player-chip-dorsal-badge">#{dorsal}</span>
            ) : (
              <span className="player-chip-dorsal-badge">👤</span>
            )}
            <span className="player-chip-name-text">{shortName}</span>
          </button>
        );
      })}

      {/* Contenido extra al final (ej. botón popover de banquillo) */}
      {extraAfter && (
        <div className="player-chip-extra-wrapper">
          {extraAfter}
        </div>
      )}
    </div>
  );
});

PlayerChipRow.displayName = 'PlayerChipRow';
export default PlayerChipRow;
