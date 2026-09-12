import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './SectorMiniPitch2D.css';

/**
 * SectorMiniPitch2D
 * Mini-campo táctil 3x3 (9 zonas) con celdas ≥44dp.
 * Columnas: Izquierda (izq), Centro (centro), Derecha (der)
 * Alturas: Ataque (att), Medio (med), Defensa (def)
 */
export const SectorMiniPitch2D = ({
  selectedZone = 'centro_att',
  onSelectZone,
  readOnly = false,
  compact = false,
  showLabel = true,
}) => {
  const { t, isEn } = useTranslation();

  const ROWS = [
    { id: 'att', labelEs: 'Ataque', labelEn: 'Attack' },
    { id: 'med', labelEs: 'Medio', labelEn: 'Midfield' },
    { id: 'def', labelEs: 'Defensa', labelEn: 'Defense' },
  ];

  const COLS = [
    { id: 'izq', labelEs: 'Izq', labelEn: 'Left', fullEs: 'Banda Izquierda', fullEn: 'Left Flank' },
    { id: 'centro', labelEs: 'Centro', labelEn: 'Center', fullEs: 'Pasillo Central', fullEn: 'Center Channel' },
    { id: 'der', labelEs: 'Der', labelEn: 'Right', fullEs: 'Banda Derecha', fullEn: 'Right Flank' },
  ];

  // Extraer nombres descriptivos de la zona activa
  const getActiveZoneLabel = (zoneKey) => {
    if (!zoneKey) return isEn ? 'Center · Attack' : 'Centro · Ataque';
    if (zoneKey === 'penalti') return isEn ? 'Penalty Spot' : 'Punto de Penalti';

    const parts = zoneKey.split('_');
    const colId = parts[0] || 'centro';
    const rowId = parts[1] || 'att';

    const colObj = COLS.find(c => c.id === colId) || COLS[1];
    const rowObj = ROWS.find(r => r.id === rowId) || ROWS[0];

    const colName = isEn ? colObj.labelEn : colObj.labelEs;
    const rowName = isEn ? rowObj.labelEn : rowObj.labelEs;

    return `${colName} · ${rowName}`;
  };

  const handleCellClick = (colId, rowId) => {
    if (readOnly || !onSelectZone) return;
    const zoneKey = `${colId}_${rowId}`;
    onSelectZone(zoneKey);
  };

  return (
    <div className={`mini-pitch-2d-container ${compact ? 'compact' : ''}`}>
      {showLabel && (
        <div className="mini-pitch-2d-header">
          <span className="mini-pitch-2d-icon">📍</span>
          <span className="mini-pitch-2d-title">
            {t('sector.activeZone', { zone: getActiveZoneLabel(selectedZone) })}
          </span>
        </div>
      )}

      <div className="mini-pitch-2d-board" role="grid" aria-label={isEn ? 'Tactical 3x3 pitch' : 'Campo táctico 3x3'}>
        {/* Marcado de campo en vectores CSS */}
        <div className="mini-pitch-mark-box top-box" />
        <div className="mini-pitch-mark-circle" />
        <div className="mini-pitch-mark-box bottom-box" />

        {/* 9 Celdas Táctiles (3 filas x 3 columnas) */}
        {ROWS.map(row => (
          <div key={row.id} className="mini-pitch-row" role="row">
            {COLS.map(col => {
              const cellKey = `${col.id}_${row.id}`;
              const isSelected = selectedZone === cellKey;
              return (
                <button
                  key={cellKey}
                  type="button"
                  role="gridcell"
                  className={`mini-pitch-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCellClick(col.id, row.id)}
                  disabled={readOnly}
                  aria-selected={isSelected}
                  title={`${isEn ? col.fullEn : col.fullEs} - ${isEn ? row.labelEn : row.labelEs}`}
                >
                  <span className="cell-col-label">{isEn ? col.labelEn : col.labelEs}</span>
                  <span className="cell-row-label">{isEn ? row.labelEn : row.labelEs}</span>
                  {isSelected && <span className="cell-check">●</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorMiniPitch2D;
