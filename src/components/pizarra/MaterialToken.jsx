import React from 'react';
import { WHITEBOARD_CONFIG, getMaterialCircleRadius, getMaterialFontSize } from '../../config/whiteboardConfig';

/**
 * MaterialToken
 * Token visual para materiales deportivos en la pizarra táctica.
 * Consume WHITEBOARD_CONFIG con escala reducida (-30%) y touch target mínimo de 48dp.
 */
const MaterialToken = ({
  material,
  id,
  label = '',
  icon = null,
  color = WHITEBOARD_CONFIG.palette.coneDefault,
  size = WHITEBOARD_CONFIG.material.defaultSize,
  onClick = null,
  selected = false,
  className = '',
  style = {}
}) => {
  const scaledSize = getMaterialCircleRadius(size);
  const fontSize = getMaterialFontSize(WHITEBOARD_CONFIG.material.fontSize);
  const touchPadding = Math.max(8, Math.round((WHITEBOARD_CONFIG.touchTarget.minTargetSize - scaledSize) / 2));

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
      className={`material-token-container ${selected ? 'selected' : ''} ${className}`}
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
      aria-label={label || id || 'Material deportivo'}
    >
      <div
        className="material-token-visual"
        style={{
          width: `${scaledSize}px`,
          height: `${scaledSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color,
          borderRadius: '4px',
          boxShadow: selected ? `0 0 0 2px ${WHITEBOARD_CONFIG.palette.selectionBorder}` : '0 1px 2px rgba(0,0,0,0.2)',
          color: '#FFFFFF',
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          overflow: 'hidden'
        }}
      >
        {icon ? (
          typeof icon === 'string' && icon.startsWith('<svg') ? (
            <div
              style={{ width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: icon }}
            />
          ) : (
            icon
          )
        ) : (
          <span>{label.slice(0, 2).toUpperCase() || '•'}</span>
        )}
      </div>
    </div>
  );
};

export default MaterialToken;
