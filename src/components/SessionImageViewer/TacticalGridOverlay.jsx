import React from 'react';

export const TacticalGridOverlay = ({
  gridType = 'none', // 'none' | 'pitch' | 'grid10x15' | 'thirds' | 'channels'
  lineColor = '#FFFFFF',
  opacity = 0.5,
  lineWidth = 1.5,
  referencePoints = [],
  onAddPoint,
  onMovePoint,
  onRemovePoint,
  isEditPointMode = false
}) => {
  if (gridType === 'none' && referencePoints.length === 0) return null;

  const strokeProps = {
    stroke: lineColor,
    strokeWidth: lineWidth,
    strokeOpacity: opacity,
    fill: 'none'
  };

  const handleSvgClick = (e) => {
    if (!isEditPointMode || !onAddPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddPoint({ x: Math.round(x), y: Math.round(y), label: referencePoints.length + 1 });
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className="tactical-grid-overlay-svg"
      preserveAspectRatio="none"
      onClick={handleSvgClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isEditPointMode ? 'auto' : 'none',
        zIndex: 10
      }}
    >
      {/* ── 1. Cuadrícula 10x15 con Coordenadas ──────────────────────────── */}
      {gridType === 'grid10x15' && (
        <g className="grid-10x15">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = (i + 1) * (100 / 15);
            return (
              <line
                key={`vx-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={100}
                {...strokeProps}
                strokeDasharray="2 2"
              />
            );
          })}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = (i + 1) * (100 / 10);
            return (
              <line
                key={`hy-${i}`}
                x1={0}
                y1={y}
                x2={100}
                y2={y}
                {...strokeProps}
                strokeDasharray="2 2"
              />
            );
          })}
        </g>
      )}

      {/* ── 2. Tercios Tácticos (Defensivo, Medular, Ofensivo) ──────────── */}
      {gridType === 'thirds' && (
        <g className="grid-thirds">
          <line x1={33.33} y1={0} x2={33.33} y2={100} {...strokeProps} strokeWidth={lineWidth * 1.5} />
          <line x1={66.66} y1={0} x2={66.66} y2={100} {...strokeProps} strokeWidth={lineWidth * 1.5} />
          <text x={16.6} y={8} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="3.5" fontWeight="bold" textAnchor="middle">
            TERCIO DEFENSIVO
          </text>
          <text x={50} y={8} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="3.5" fontWeight="bold" textAnchor="middle">
            TERCIO MEDULAR
          </text>
          <text x={83.3} y={8} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="3.5" fontWeight="bold" textAnchor="middle">
            TERCIO OFENSIVO
          </text>
        </g>
      )}

      {/* ── 3. Carriles Longitudinales (5 Pasillos Tácticos) ────────────── */}
      {gridType === 'channels' && (
        <g className="grid-channels">
          {[20, 40, 60, 80].map((x, idx) => (
            <line key={`ch-${idx}`} x1={x} y1={0} x2={x} y2={100} {...strokeProps} strokeDasharray="3 2" />
          ))}
          <text x={10} y={96} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="2.8" fontWeight="bold" textAnchor="middle">Banda Izq.</text>
          <text x={30} y={96} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="2.8" fontWeight="bold" textAnchor="middle">Pasillo Int. Izq.</text>
          <text x={50} y={96} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="2.8" fontWeight="bold" textAnchor="middle">Carril Central</text>
          <text x={70} y={96} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="2.8" fontWeight="bold" textAnchor="middle">Pasillo Int. Der.</text>
          <text x={90} y={96} fill={lineColor} fillOpacity={opacity + 0.2} fontSize="2.8" fontWeight="bold" textAnchor="middle">Banda Der.</text>
        </g>
      )}

      {/* ── 4. Campo de Fútbol Reglamentario Completo ────────────────────── */}
      {gridType === 'pitch' && (
        <g className="grid-pitch-lines">
          {/* Perímetro */}
          <rect x={2} y={3} width={96} height={94} {...strokeProps} />
          {/* Línea Central y Círculo */}
          <line x1={50} y1={3} x2={50} y2={97} {...strokeProps} />
          <circle cx={50} cy={50} r={14} {...strokeProps} />
          <circle cx={50} cy={50} r={1} fill={lineColor} fillOpacity={opacity} />

          {/* Área Izquierda */}
          <rect x={2} y={22} width={16} height={56} {...strokeProps} />
          <rect x={2} y={34} width={6} height={32} {...strokeProps} />
          <circle cx={12} cy={50} r={1} fill={lineColor} fillOpacity={opacity} />

          {/* Área Derecha */}
          <rect x={82} y={22} width={16} height={56} {...strokeProps} />
          <rect x={92} y={34} width={6} height={32} {...strokeProps} />
          <circle cx={88} cy={50} r={1} fill={lineColor} fillOpacity={opacity} />
        </g>
      )}

      {/* ── 5. Puntos de Referencia Numerados ────────────────────────────── */}
      {referencePoints.map((pt, idx) => (
        <g
          key={`ref-pt-${idx}`}
          transform={`translate(${pt.x}, ${pt.y})`}
          style={{ cursor: isEditPointMode ? 'pointer' : 'default', pointerEvents: 'auto' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onRemovePoint) onRemovePoint(idx);
          }}
        >
          <circle r={3.2} fill="#D4A843" stroke="#FFFFFF" strokeWidth={1} />
          <text
            textAnchor="middle"
            dy="0.35em"
            fill="#000000"
            fontSize="3"
            fontWeight="bold"
          >
            {pt.label || idx + 1}
          </text>
        </g>
      ))}
    </svg>
  );
};
