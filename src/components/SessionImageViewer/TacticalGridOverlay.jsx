import React from 'react';

/**
 * TacticalGridOverlay
 * Superposición vectorial profesional para análisis táctico (estilo Wyscout / TacticalPad)
 * Trazo vectorial nítido de 1px garantizado mediante vectorEffect: 'non-scaling-stroke'
 */
export const TacticalGridOverlay = ({
  gridType = 'none', // 'none' | 'grid10x15' | 'channels' | 'thirds' | 'zones18' | 'pitch'
  lineColor = '#FFFFFF',
  opacity = 0.45,
  lineWidth = 1,
  referencePoints = [],
  onAddPoint,
  onMovePoint,
  onRemovePoint,
  isEditPointMode = false
}) => {
  if (gridType === 'none' && referencePoints.length === 0) return null;

  // Trazo nítido de 1px independente del zoom o tamaño de pantalla
  const baseStroke = {
    stroke: lineColor,
    strokeWidth: lineWidth,
    strokeOpacity: opacity,
    vectorEffect: 'non-scaling-stroke',
    fill: 'none'
  };

  const handleSvgClick = (e) => {
    if (!isEditPointMode || !onAddPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 667;
    onAddPoint({ x: Math.round(x), y: Math.round(y), label: referencePoints.length + 1 });
  };

  const W = 1000;
  const H = 667;

  // Coordenadas del campo táctico estándar con margen exterior sutil
  const fieldLeft = 35;
  const fieldRight = 965;
  const fieldTop = 25;
  const fieldBottom = 642;
  const fieldW = fieldRight - fieldLeft; // 930
  const fieldH = fieldBottom - fieldTop; // 617

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
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
        zIndex: 15
      }}
    >
      <defs>
        {/* Filtro sutil para etiquetas flotantes */}
        <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── 1. CUADRÍCULA 10×15 DE PRECISIÓN TÁCTICA ─────────────────────── */}
      {gridType === 'grid10x15' && (
        <g className="grid-10x15">
          {/* Líneas Verticales (15 columnas) */}
          {Array.from({ length: 14 }).map((_, i) => {
            const x = fieldLeft + (i + 1) * (fieldW / 15);
            return (
              <line
                key={`vx-${i}`}
                x1={x}
                y1={fieldTop}
                x2={x}
                y2={fieldBottom}
                {...baseStroke}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Líneas Horizontales (10 filas) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = fieldTop + (i + 1) * (fieldH / 10);
            return (
              <line
                key={`hy-${i}`}
                x1={fieldLeft}
                y1={y}
                x2={fieldRight}
                y2={y}
                {...baseStroke}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Cruces sutiles de intersección '+' (Tactical Crosshairs) */}
          {Array.from({ length: 14 }).map((_, col) => {
            const cx = fieldLeft + (col + 1) * (fieldW / 15);
            return Array.from({ length: 9 }).map((_, row) => {
              const cy = fieldTop + (row + 1) * (fieldH / 10);
              return (
                <g key={`cross-${col}-${row}`} stroke={lineColor} strokeOpacity={opacity * 1.2} strokeWidth={1} vectorEffect="non-scaling-stroke">
                  <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} />
                  <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} />
                </g>
              );
            });
          })}

          {/* Coordenadas en los bordes (Letras A-O horizontal, Números 1-10 vertical) */}
          {'ABCDEFGHIJKLMNO'.split('').map((letter, i) => {
            const x = fieldLeft + (i + 0.5) * (fieldW / 15);
            return (
              <text
                key={`col-lbl-${letter}`}
                x={x}
                y={fieldTop - 8}
                fill={lineColor}
                fillOpacity={Math.min(opacity + 0.3, 0.9)}
                fontSize="11"
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
                textAnchor="middle"
              >
                {letter}
              </text>
            );
          })}

          {Array.from({ length: 10 }).map((_, i) => {
            const y = fieldTop + (i + 0.5) * (fieldH / 10);
            return (
              <text
                key={`row-lbl-${i}`}
                x={fieldLeft - 12}
                y={y + 4}
                fill={lineColor}
                fillOpacity={Math.min(opacity + 0.3, 0.9)}
                fontSize="10"
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
                textAnchor="middle"
              >
                {i + 1}
              </text>
            );
          })}
        </g>
      )}

      {/* ── 2. 5 CARRILES (JUEGO DE POSICIÓN / PEP GUARDIOLA) ────────────── */}
      {gridType === 'channels' && (
        <g className="grid-channels">
          {/* Proporciones tácticas: Banda Izq (18%), Pasillo Int Izq (19%), Carril Central (26%), Pasillo Int Der (19%), Banda Der (18%) */}
          {(() => {
            const c1 = fieldLeft + fieldH * 0;
            const c2 = fieldTop + fieldH * 0.18; // Pasillo Int Izq
            const c3 = fieldTop + fieldH * 0.37; // Carril Central
            const c4 = fieldTop + fieldH * 0.63; // Pasillo Int Der
            const c5 = fieldTop + fieldH * 0.82; // Banda Der

            return (
              <>
                {/* Sombreado translúcido alterno de corredores */}
                <rect x={fieldLeft} y={fieldTop} width={fieldW} height={fieldH * 0.18} fill="rgba(255, 255, 255, 0.03)" />
                <rect x={fieldLeft} y={c3} width={fieldW} height={fieldH * 0.26} fill="rgba(212, 168, 67, 0.04)" />
                <rect x={fieldLeft} y={c5} width={fieldW} height={fieldH * 0.18} fill="rgba(255, 255, 255, 0.03)" />

                {/* Líneas divisorias de carriles */}
                <line x1={fieldLeft} y1={c2} x2={fieldRight} y2={c2} {...baseStroke} strokeDasharray="6 4" strokeWidth={1.5} />
                <line x1={fieldLeft} y1={c3} x2={fieldRight} y2={c3} {...baseStroke} strokeDasharray="6 4" strokeWidth={1.5} />
                <line x1={fieldLeft} y1={c4} x2={fieldRight} y2={c4} {...baseStroke} strokeDasharray="6 4" strokeWidth={1.5} />
                <line x1={fieldLeft} y1={c5} x2={fieldRight} y2={c5} {...baseStroke} strokeDasharray="6 4" strokeWidth={1.5} />

                {/* Etiquetas de los 5 Carriles */}
                {[
                  { y: fieldTop + fieldH * 0.09, label: 'BANDA IZQUIERDA' },
                  { y: fieldTop + fieldH * 0.275, label: 'MEDIO ESPACIO IZQUIERDO (HALF-SPACE)' },
                  { y: fieldTop + fieldH * 0.50, label: 'CARRIL CENTRAL' },
                  { y: fieldTop + fieldH * 0.725, label: 'MEDIO ESPACIO DERECHO (HALF-SPACE)' },
                  { y: fieldTop + fieldH * 0.91, label: 'BANDA DERECHA' }
                ].map((lane, idx) => (
                  <g key={`channel-badge-${idx}`}>
                    <rect
                      x={W / 2 - 130}
                      y={lane.y - 10}
                      width={260}
                      height={20}
                      rx={6}
                      fill="rgba(15, 23, 42, 0.65)"
                      stroke={lineColor}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={W / 2}
                      y={lane.y + 4}
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontWeight="800"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      letterSpacing="0.8px"
                    >
                      {lane.label}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </g>
      )}

      {/* ── 3. TERCIOS DEL CAMPO (DEFENSIVO, MEDULAR, OFENSIVO) ─────────── */}
      {gridType === 'thirds' && (
        <g className="grid-thirds">
          {(() => {
            const thirdW = fieldW / 3;
            const t1 = fieldLeft + thirdW;
            const t2 = fieldLeft + thirdW * 2;

            return (
              <>
                {/* Sombreados sutiles por tercio */}
                <rect x={fieldLeft} y={fieldTop} width={thirdW} height={fieldH} fill="rgba(59, 130, 246, 0.04)" />
                <rect x={t1} y={fieldTop} width={thirdW} height={fieldH} fill="rgba(212, 168, 67, 0.04)" />
                <rect x={t2} y={fieldTop} width={thirdW} height={fieldH} fill="rgba(239, 68, 68, 0.04)" />

                {/* Líneas divisorias */}
                <line x1={t1} y1={fieldTop} x2={t1} y2={fieldBottom} {...baseStroke} strokeWidth={1.5} strokeDasharray="6 4" />
                <line x1={t2} y1={fieldTop} x2={t2} y2={fieldBottom} {...baseStroke} strokeWidth={1.5} strokeDasharray="6 4" />

                {/* Badges de Tercios */}
                {[
                  { x: fieldLeft + thirdW * 0.5, name: 'TERCIO DEFENSIVO', sub: 'Zona de Iniciación' },
                  { x: fieldLeft + thirdW * 1.5, name: 'TERCIO MEDULAR', sub: 'Zona de Creación' },
                  { x: fieldLeft + thirdW * 2.5, name: 'TERCIO OFENSIVO', sub: 'Zona de Finalización' }
                ].map((th, idx) => (
                  <g key={`third-badge-${idx}`}>
                    <rect
                      x={th.x - 85}
                      y={fieldTop + 14}
                      width={170}
                      height={32}
                      rx={8}
                      fill="rgba(15, 23, 42, 0.75)"
                      stroke={lineColor}
                      strokeOpacity={0.4}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={th.x}
                      y={fieldTop + 27}
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="900"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                    >
                      {th.name}
                    </text>
                    <text
                      x={th.x}
                      y={fieldTop + 39}
                      fill="#D4A843"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                    >
                      {th.sub}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </g>
      )}

      {/* ── 4. 18 ZONAS TÁCTICAS UEFA (CON RESALTE DE ZONA 14) ───────────── */}
      {gridType === 'zones18' && (
        <g className="grid-zones-18">
          {(() => {
            const colW = fieldW / 6;
            const rowH = fieldH / 3;

            return (
              <>
                {/* Cuadrícula 3 filas × 6 columnas */}
                {Array.from({ length: 5 }).map((_, c) => {
                  const x = fieldLeft + (c + 1) * colW;
                  return <line key={`z18-vx-${c}`} x1={x} y1={fieldTop} x2={x} y2={fieldBottom} {...baseStroke} strokeDasharray="4 4" />;
                })}
                {Array.from({ length: 2 }).map((_, r) => {
                  const y = fieldTop + (r + 1) * rowH;
                  return <line key={`z18-hy-${r}`} x1={fieldLeft} y1={y} x2={fieldRight} y2={y} {...baseStroke} strokeDasharray="4 4" />;
                })}

                {/* Zona 14 Resaltada (Fila central, columna 4/5 en ataque derecho) */}
                <rect
                  x={fieldLeft + colW * 3}
                  y={fieldTop + rowH}
                  width={colW}
                  height={rowH}
                  fill="rgba(212, 168, 67, 0.12)"
                  stroke="#D4A843"
                  strokeWidth={1.8}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="5 3"
                />

                {/* Numeración Oficial 1 a 18 */}
                {Array.from({ length: 18 }).map((_, idx) => {
                  const r = Math.floor(idx / 6);
                  const c = idx % 6;
                  const zX = fieldLeft + (c + 0.5) * colW;
                  const zY = fieldTop + (r + 0.5) * rowH;
                  const isZone14 = idx === 10; // Zona 14 en esquema UEFA estándar

                  return (
                    <g key={`zone-num-${idx}`}>
                      <circle
                        cx={zX}
                        cy={zY}
                        r={14}
                        fill={isZone14 ? '#D4A843' : 'rgba(15, 23, 42, 0.65)'}
                        stroke={isZone14 ? '#FFFFFF' : lineColor}
                        strokeWidth={1}
                        strokeOpacity={isZone14 ? 1 : 0.4}
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={zX}
                        y={zY + 4}
                        textAnchor="middle"
                        fill={isZone14 ? '#000000' : '#FFFFFF'}
                        fontSize="10"
                        fontWeight="900"
                        fontFamily="system-ui, sans-serif"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </g>
      )}

      {/* ── 5. CAMPO DE FÚTBOL REGLAMENTARIO COMPLETO ─────────────────────── */}
      {gridType === 'pitch' && (
        <g className="grid-pitch-lines">
          {/* Perímetro reglamentario */}
          <rect x={fieldLeft} y={fieldTop} width={fieldW} height={fieldH} {...baseStroke} strokeWidth={1.5} />

          {/* Línea Central y Círculo */}
          <line x1={W / 2} y1={fieldTop} x2={W / 2} y2={fieldBottom} {...baseStroke} strokeWidth={1.5} />
          <circle cx={W / 2} cy={H / 2} r={80} {...baseStroke} strokeWidth={1.2} />
          <circle cx={W / 2} cy={H / 2} r={3} fill={lineColor} fillOpacity={opacity * 1.5} />

          {/* Área Grande y Pequeña Izquierda */}
          <rect x={fieldLeft} y={fieldTop + fieldH * 0.22} width={fieldW * 0.16} height={fieldH * 0.56} {...baseStroke} />
          <rect x={fieldLeft} y={fieldTop + fieldH * 0.35} width={fieldW * 0.055} height={fieldH * 0.3} {...baseStroke} />
          <circle cx={fieldLeft + fieldW * 0.105} cy={H / 2} r={2.5} fill={lineColor} fillOpacity={opacity * 1.5} />
          <path d={`M ${fieldLeft + fieldW * 0.16} ${H / 2 - 38} A 42 42 0 0 1 ${fieldLeft + fieldW * 0.16} ${H / 2 + 38}`} {...baseStroke} />

          {/* Área Grande y Pequeña Derecha */}
          <rect x={fieldRight - fieldW * 0.16} y={fieldTop + fieldH * 0.22} width={fieldW * 0.16} height={fieldH * 0.56} {...baseStroke} />
          <rect x={fieldRight - fieldW * 0.055} y={fieldTop + fieldH * 0.35} width={fieldW * 0.055} height={fieldH * 0.3} {...baseStroke} />
          <circle cx={fieldRight - fieldW * 0.105} cy={H / 2} r={2.5} fill={lineColor} fillOpacity={opacity * 1.5} />
          <path d={`M ${fieldRight - fieldW * 0.16} ${H / 2 - 38} A 42 42 0 0 0 ${fieldRight - fieldW * 0.16} ${H / 2 + 38}`} {...baseStroke} />

          {/* Córners */}
          <path d={`M ${fieldLeft} ${fieldTop + 14} A 14 14 0 0 0 ${fieldLeft + 14} ${fieldTop}`} {...baseStroke} />
          <path d={`M ${fieldLeft} ${fieldBottom - 14} A 14 14 0 0 1 ${fieldLeft + 14} ${fieldBottom}`} {...baseStroke} />
          <path d={`M ${fieldRight} ${fieldTop + 14} A 14 14 0 0 1 ${fieldRight - 14} ${fieldTop}`} {...baseStroke} />
          <path d={`M ${fieldRight} ${fieldBottom - 14} A 14 14 0 0 0 ${fieldRight - 14} ${fieldBottom}`} {...baseStroke} />
        </g>
      )}

      {/* ── 6. PUNTOS DE REFERENCIA TÁCTICOS NUMERADOS ─────────────────────── */}
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
          <circle r={14} fill="#D4A843" stroke="#FFFFFF" strokeWidth={2} vectorEffect="non-scaling-stroke" filter="url(#badge-shadow)" />
          <text
            textAnchor="middle"
            dy="0.35em"
            fill="#000000"
            fontSize="12"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            {pt.label || idx + 1}
          </text>
        </g>
      ))}
    </svg>
  );
};
