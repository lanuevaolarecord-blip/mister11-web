import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Share2, Maximize2, Minimize2, Users } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheaterFullscreen } from '../../hooks/useTheaterFullscreen';
import { TheaterOverlay } from '../common/TheaterOverlay';

const ZONE_MAP = {
  shot_on_target_own:    { x: 88, y: 50 },
  shot_off_target_own:   { x: 80, y: 45 },
  shot_on_target_rival:  { x: 12, y: 50 },
  shot_off_target_rival: { x: 20, y: 55 },
  recovery:              { x: 55, y: 48 },
  loss:                  { x: 45, y: 52 },
  duel_won:              { x: 58, y: 45 },
  duel_lost:             { x: 42, y: 55 },
  foul_favor:            { x: 62, y: 50 },
  foul_against:          { x: 38, y: 50 },
  corner_favor:          { x: 99, y: 5  },
  corner_against:        { x: 1,  y: 95 },
  pass:                  { x: 50, y: 50 }
};

export const PassNetwork = ({
  passes = [],
  players = [],
  teamName = 'Local'
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showTacticalGuide, setShowTacticalGuide] = useState(false);
  const wrapperRef = useRef(null);
  const { t, isEn } = useTranslation();
  const { isFullscreen, isTheater, toggle: toggleFullscreen, exit } = useTheaterFullscreen(wrapperRef);
  const isExpanded = isFullscreen || isTheater;

  // Función para determinar coordenadas base reglamentarias según posición real
  const getBasePosition = (pos, idx) => {
    const p = String(pos || '').toUpperCase().trim();
    if (p === 'POR' || p === 'PT' || p === 'GK') return { x: 10, y: 50 };
    if (p === 'LI' || p === 'LB' || p === 'LTI') return { x: 28, y: 18 };
    if (p === 'LD' || p === 'RB' || p === 'LTD') return { x: 28, y: 82 };
    if (p === 'DFC' || p === 'CB' || p === 'DEF') {
      const isLeft = idx % 2 === 0;
      return { x: 25, y: isLeft ? 36 : 64 };
    }
    if (p === 'MCD' || p === 'DM' || p === 'PIV') return { x: 42, y: 50 };
    if (p === 'MC' || p === 'CM' || p === 'MED') {
      const isLeft = idx % 2 === 0;
      return { x: 50, y: isLeft ? 34 : 66 };
    }
    if (p === 'MCO' || p === 'AM' || p === 'MP') return { x: 58, y: 50 };
    if (p === 'EI' || p === 'LW' || p === 'MI') return { x: 68, y: 18 };
    if (p === 'ED' || p === 'RW' || p === 'MD') return { x: 68, y: 82 };
    if (p === 'DC' || p === 'CF' || p === 'ST' || p === 'DEL') return { x: 75, y: 50 };
    
    const defaultGrid = [
      { x: 10, y: 50 }, { x: 28, y: 20 }, { x: 25, y: 40 }, { x: 25, y: 60 }, { x: 28, y: 80 },
      { x: 48, y: 30 }, { x: 45, y: 50 }, { x: 48, y: 70 },
      { x: 70, y: 22 }, { x: 75, y: 50 }, { x: 70, y: 78 }
    ];
    return defaultGrid[idx % defaultGrid.length];
  };

  // 1. Calcular posición promedio (centroide) y volumen de toques de cada jugador
  const playerNodes = useMemo(() => {
    const map = {};

    players.forEach((p, idx) => {
      const def = getBasePosition(p.posicion || p.position, idx);
      map[p.id] = {
        id: p.id,
        name: p.nombre || p.name || `J#${p.dorsal || idx + 1}`,
        dorsal: p.dorsal || p.number || (idx + 1),
        posicion: p.posicion || p.position || 'JUG',
        xSum: 0,
        ySum: 0,
        touchCount: 0,
        defaultX: def.x,
        defaultY: def.y
      };
    });

    passes.forEach(pass => {
      const pId = pass.playerId || pass.fromPlayerId;
      if (pId && map[pId]) {
        let fallback = ZONE_MAP[pass.type] || { x: 50, y: 50 };
        const sec = String(pass.sector || '').toLowerCase();
        let py = (typeof pass.y === 'number' && pass.y >= 0 && pass.y <= 100) ? pass.y : fallback.y;
        if (sec === 'left' || sec.includes('izq')) py = 18;
        else if (sec === 'right' || sec.includes('der')) py = 82;
        else if (sec === 'center' || sec.includes('cent')) py = 50;

        const px = typeof pass.x === 'number' ? pass.x : fallback.x;
        map[pId].xSum += px;
        map[pId].ySum += py;
        map[pId].touchCount += 1;
      }
    });

    return Object.values(map).map(node => {
      const avgX = node.touchCount > 0 ? node.xSum / node.touchCount : node.defaultX;
      const avgY = node.touchCount > 0 ? node.ySum / node.touchCount : node.defaultY;
      return {
        ...node,
        x: Math.max(8, Math.min(92, avgX)),
        y: Math.max(12, Math.min(88, avgY))
      };
    });
  }, [passes, players]);

  // 2. Calcular enlaces (aristas) entre pares de jugadores
  // Soporta tanto pases con emisor/receptor explícito como secuencias cronológicas de posesión
  const passEdges = useMemo(() => {
    const edgesMap = {};

    // A) Enlaces explícitos
    passes.forEach(pass => {
      const from = pass.fromPlayerId || pass.playerId;
      const to = pass.toPlayerId || pass.receiverId;
      const successful = pass.successful !== false && pass.outcome !== 'incomplete' && pass.type !== 'pass_failed';

      if (from && to && from !== to) {
        const edgeKey = `${from}->${to}`;
        if (!edgesMap[edgeKey]) {
          edgesMap[edgeKey] = {
            id: edgeKey,
            from,
            to,
            count: 0,
            successfulCount: 0
          };
        }
        edgesMap[edgeKey].count += 1;
        if (successful) edgesMap[edgeKey].successfulCount += 1;
      }
    });

    // B) Reconstrucción de secuencias continuas de posesión si no hay receptores explícitos
    if (Object.keys(edgesMap).length === 0 && passes.length > 1) {
      // Ordenar cronológicamente por minuto y timestamp
      const sorted = [...passes].sort((a, b) => {
        const minA = Number(a.minute || a.time || 0);
        const minB = Number(b.minute || b.time || 0);
        if (minA !== minB) return minA - minB;
        return (new Date(a.timestamp || 0).getTime()) - (new Date(b.timestamp || 0).getTime());
      });

      for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i];
        const p2 = sorted[i + 1];
        const from = p1.playerId;
        const to = p2.playerId;
        const min1 = Number(p1.minute || p1.time || 0);
        const min2 = Number(p2.minute || p2.time || 0);

        // Si ocurren dentro del mismo minuto o minuto consecutivo (cadena de posesión del mismo equipo)
        if (from && to && from !== to && Math.abs(min2 - min1) <= 2) {
          const successful = p1.type !== 'pass_failed' && p1.outcome !== 'incomplete';
          const edgeKey = `${from}->${to}`;
          if (!edgesMap[edgeKey]) {
            edgesMap[edgeKey] = {
              id: edgeKey,
              from,
              to,
              count: 0,
              successfulCount: 0
            };
          }
          edgesMap[edgeKey].count += 1;
          if (successful) edgesMap[edgeKey].successfulCount += 1;
        }
      }
    }

    return Object.values(edgesMap);
  }, [passes]);

  // Máximo volumen de pases entre dos jugadores para normalizar grosor
  const maxPassCount = useMemo(() => {
    return passEdges.reduce((max, e) => Math.max(max, e.count), 1);
  }, [passEdges]);

  const renderNetworkContent = (inModal = false) => (
    <div className="pass-network-inner" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header de la red de pases */}
      <div className="pass-network-header" style={{ flexShrink: 0, marginBottom: inModal ? '8px' : '12px' }}>
        <div className="pass-network-title">
          <Share2 size={20} className="network-icon" />
          <h3>{isEn ? `Tactical Pass Network (${teamName})` : `Red de Pases Táctica (${teamName})`}</h3>
        </div>
        <div className="pass-network-summary" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>{isEn ? 'Passes:' : 'Pases:'} <strong>{passes.length}</strong></span>
          <span>{isEn ? 'Connections:' : 'Conexiones:'} <strong>{passEdges.length}</strong></span>
          {!inModal && (
            <button
              type="button"
              className="btn-fullscreen-match-card"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isExpanded ? (isEn ? 'Exit' : 'Salir') : (isEn ? 'Fullscreen' : 'Pantalla Completa')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Guía metodológica visible en 2 líneas */}
      <div
        className="pass-network-guide"
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary, #94A3B8)',
          lineHeight: '1.45',
          background: 'rgba(255, 255, 255, 0.03)',
          borderLeft: '3px solid #D4A843',
          padding: '8px 12px',
          borderRadius: '0 6px 6px 0',
          marginBottom: '12px',
          flexShrink: 0
        }}
      >
        <strong style={{ color: 'var(--text-primary, #FFFFFF)' }}>{isEn ? 'Methodological guide: ' : 'Guía metodológica: '}</strong>
        {t('stats.passNetwork.guide')}
      </div>

      {/* Campo SVG con Nodos y Aristas */}
      <div
        className="field-network-canvas"
        style={inModal ? {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        } : { position: 'relative' }}
      >
        {/* Botón flotante directo en la esquina del campo */}
        {!inModal && (
          <button
            type="button"
            className="btn-floating-pitch-fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            style={{ minWidth: '48px', minHeight: '48px' }}
            title={isExpanded ? (isEn ? 'Exit Fullscreen' : 'Salir de Pantalla Completa') : (isEn ? 'View Fullscreen' : 'Ver en Pantalla Completa')}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}

        <svg
          viewBox="0 0 105 68"
          className="network-svg"
          preserveAspectRatio="none"
          style={isFullscreen ? { maxHeight: 'calc(100dvh - 120px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
        >
          {/* Fondo del campo con césped estadio */}
          <rect x="0" y="0" width="105" height="68" fill="#153e24" />

          {/* Franjas de corte de césped profesional */}
          {Array.from({ length: 9 }).map((_, i) => (
            <rect
              key={i}
              x={i * (105 / 9)}
              y="0"
              width={105 / 9}
              height="68"
              fill={i % 2 === 0 ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.02)'}
            />
          ))}

          {/* Líneas de fútbol reglamentarias */}
          {/* Línea perimetral */}
          <rect x="3" y="3" width="99" height="62" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          
          {/* Línea divisoria central */}
          <line x1="52.5" y1="3" x2="52.5" y2="65" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          
          {/* Círculo central y punto de saque */}
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <circle cx="52.5" cy="34" r="0.8" fill="rgba(255, 255, 255, 0.85)" />

          {/* Porterías */}
          <rect x="0.5" y="30.34" width="2.5" height="7.32" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
          <rect x="102" y="30.34" width="2.5" height="7.32" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />

          {/* Áreas Grandes (16.5m x 40m) */}
          <rect x="3" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <rect x="85.5" y="14" width="16.5" height="40" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />

          {/* Áreas Pequeñas (5.5m x 19m) */}
          <rect x="3" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <rect x="96.5" y="24.5" width="5.5" height="19" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />

          {/* Puntos de penalti a 11m */}
          <circle cx="14" cy="34" r="0.8" fill="rgba(255, 255, 255, 0.85)" />
          <circle cx="91" cy="34" r="0.8" fill="rgba(255, 255, 255, 0.85)" />

          {/* Semicírculos de área (arcos de penalti) */}
          <path d="M 19.5 27.5 A 9.15 9.15 0 0 1 19.5 40.5" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <path d="M 85.5 27.5 A 9.15 9.15 0 0 0 85.5 40.5" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />

          {/* Arcos de Córner */}
          <path d="M 3 5 A 2 2 0 0 0 5 3" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <path d="M 3 63 A 2 2 0 0 1 5 65" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <path d="M 99 3 A 2 2 0 0 0 102 5" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />
          <path d="M 99 65 A 2 2 0 0 1 102 63" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.8" />

          {/* Pasillos Tácticos Horizontales (Bandas y Centro) */}
          <line x1="3" y1="22.6" x2="102" y2="22.6" stroke="rgba(212, 168, 67, 0.35)" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="3" y1="45.3" x2="102" y2="45.3" stroke="rgba(212, 168, 67, 0.35)" strokeWidth="0.6" strokeDasharray="2 2" />

          {/* 1. Dibujar Aristas (Líneas de Pase) escaladas a 105x68 */}
          {passEdges.map(edge => {
            const nodeFrom = playerNodes.find(n => n.id === edge.from);
            const nodeTo = playerNodes.find(n => n.id === edge.to);
            if (!nodeFrom || !nodeTo) return null;

            const isSelected = selectedEdge?.id === edge.id;
            const strokeWidth = Math.max(0.8, (edge.count / maxPassCount) * 3.5);
            const accuracy = edge.count > 0 ? Math.round((edge.successfulCount / edge.count) * 100) : 100;
            const strokeColor = accuracy >= 80 ? '#4CAF7D' : accuracy >= 60 ? '#D4A843' : '#EF4444';

            const fromX = 3 + (nodeFrom.x / 100) * 99;
            const fromY = 3 + (nodeFrom.y / 100) * 62;
            const toX = 3 + (nodeTo.x / 100) * 99;
            const toY = 3 + (nodeTo.y / 100) * 62;

            return (
              <g 
                key={edge.id}
                onClick={() => {
                  setSelectedEdge(edge);
                  setSelectedNode(null);
                }}
                style={{ cursor: 'pointer' }}
              >
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? strokeWidth + 1.5 : strokeWidth}
                  strokeOpacity={isSelected ? 1 : 0.8}
                  strokeDasharray={accuracy < 60 ? '2.5 1.5' : 'none'}
                />
              </g>
            );
          })}

          {/* 2. Dibujar Nodos (Jugadores) escalados a 105x68 */}
          {playerNodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const nodeRadius = Math.max(2.4, Math.min(4.2, 2.4 + (node.touchCount / (passes.length || 1)) * 6));
            const posX = 3 + (node.x / 100) * 99;
            const posY = 3 + (node.y / 100) * 62;

            return (
              <g
                key={node.id}
                transform={`translate(${posX}, ${posY})`}
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                style={{ cursor: 'pointer' }}
                className="player-node-group"
              >
                {/* Sombra de selección */}
                {isSelected && (
                  <circle r={nodeRadius + 1.8} fill="none" stroke="#D4A843" strokeWidth="1.2" />
                )}
                
                {/* Círculo base del jugador con alto contraste */}
                <circle
                  r={nodeRadius}
                  fill={isSelected ? '#D4A843' : '#0E1C14'}
                  stroke={isSelected ? '#FFFFFF' : '#D4A843'}
                  strokeWidth="0.9"
                />

                {/* Dorsal */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill={isSelected ? '#000000' : '#FFFFFF'}
                  fontSize="2.4"
                  fontWeight="900"
                >
                  {node.dorsal}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Panel de detalles al hacer click en nodo o arista */}
        {selectedNode && (
          <div className="network-info-card">
            <div className="info-card-header">
              <span className="player-badge">#{selectedNode.dorsal}</span>
              <strong>{selectedNode.name}</strong>
            </div>
            <div className="info-card-body">
              <div>{isEn ? 'Touches / Involvements:' : 'Toques / Participaciones:'} <strong>{selectedNode.touchCount}</strong></div>
              <div>{isEn ? 'Average field position:' : 'Posición media en campo:'} <strong>X: {Math.round(selectedNode.x)}% | Y: {Math.round(selectedNode.y)}%</strong></div>
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="network-info-card">
            <div className="info-card-header">
              <strong>{isEn ? 'Pass Connection' : 'Conexión de Pase'}</strong>
            </div>
            <div className="info-card-body">
              <div>{isEn ? 'Total passes between players:' : 'Pases totales entre jugadores:'} <strong>{selectedEdge.count}</strong></div>
              <div>{isEn ? 'Completed passes:' : 'Pases completados:'} <strong>{selectedEdge.successfulCount}</strong> ({Math.round((selectedEdge.successfulCount / selectedEdge.count) * 100)}% {isEn ? 'accuracy' : 'acierto'})</div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de la Red */}
      <div className="pass-network-legend">
        <div className="legend-item">
          <span className="legend-dot green" />
          <span>{isEn ? 'High accuracy (≥80%)' : 'Alta precisión (≥80%)'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot gold" />
          <span>{isEn ? 'Medium accuracy (60-79%)' : 'Precisión media (60-79%)'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot red" />
          <span>{isEn ? 'Frequent losses (<60%)' : 'Pérdidas frecuentes (<60%)'}</span>
        </div>
        <div className="legend-item">
          <span className="legend-line thick" />
          <span>{isEn ? 'Thickness = Higher frequency' : 'Grosor = Mayor frecuencia'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className="pass-network-container"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {renderNetworkContent(false)}

      {/* Fallback de Pantalla Completa / Modo Teatro mediante Portal */}
      <TheaterOverlay
        isOpen={isTheater}
        onClose={exit}
        title={isEn ? `Tactical Pass Network (${teamName})` : `Red de Pases Táctica (${teamName})`}
      >
        {renderNetworkContent(true)}
      </TheaterOverlay>

      {/* Panel pedagógico y táctico (oculto en fullscreen para evitar scroll) */}
      {!isExpanded && (
        <div className="tactical-guide-panel" style={{ marginTop: '16px' }}>
          <div className="tactical-guide-header" onClick={() => setShowTacticalGuide(prev => !prev)}>
            <div className="tactical-guide-title">
              <span className="guide-icon">💡</span>
              <strong>{isEn ? 'Tactical Guide: How to interpret and use the Pass Network?' : 'Guía Táctica: ¿Cómo interpretar y usar la Red de Pases?'}</strong>
            </div>
            <button type="button" className="tactical-guide-toggle-btn">
              {showTacticalGuide ? (isEn ? 'Hide Guide ▲' : 'Ocultar Explicación ▲') : (isEn ? 'View Methodology ▼' : 'Ver Metodología Completa ▼')}
            </button>
          </div>

          <div className="tactical-guide-summary">
            <span>⚽ {isEn ? 'Nodes: Size = Touch/pass volume' : 'Nodos: Tamaño = Volumen de toques/pases'}</span>
            <span>🔗 {isEn ? 'Lines: Thickness = Associative frequency · Color = % Accuracy' : 'Líneas: Grosor = Frecuencia asociativa · Color = % Acierto'}</span>
          </div>

          {showTacticalGuide && (
            <div className="tactical-guide-body">
              <div className="guide-card">
                <h4>📖 ¿Qué es este mapa?</h4>
                <p>
                  Es un <strong>grafo táctico relacional</strong> que proyecta el sistema de juego real de tu equipo en el campo. Cada círculo (nodo) representa a un jugador en su <strong>centroide de posición promedio</strong> (dónde interviene habitualmente), mientras que las líneas (aristas) reflejan las conexiones de pase entre compañeros.
                </p>
              </div>

              <div className="guide-card">
                <h4>📲 ¿Cómo se toman los datos?</h4>
                <p>
                  El motor táctico calcula las conexiones a partir de dos fuentes verificadas:
                </p>
                <ul>
                  <li><strong>Pases individuales y colectivos:</strong> Registro de pases completados, pases fallidos, pases clave y recuperaciones asociados a cada jugador.</li>
                  <li><strong>Cadenas de posesión:</strong> Secuencia temporal cronológica de intervenciones consecutivas entre compañeros, reconstruyendo el circuito de circulación del balón.</li>
                </ul>
              </div>

              <div className="guide-card">
                <h4>🎯 ¿Cómo se debe usar táctica y operativamente?</h4>
                <ul>
                  <li><strong>Identificar al eje del juego:</strong> El nodo más grande y con más conexiones gruesas es el catalizador de tu juego (suele ser el mediocentro o el central organizador). Si el rival lo presiona, necesitas activar vías alternativas.</li>
                  <li><strong>Detectar jugadores aislados:</strong> Si tu delantero centro o extremos no tienen líneas de pase hacia ellos, significa que están desabastecidos o que el equipo juega en bloques inconexos.</li>
                  <li><strong>Verificar la salida limpia de balón:</strong> Observa si los centrales (#4 y #5) conectan con el pivote (#6) e interiores (#8 y #10) con líneas verdes (alta precisión), o si se recurre al pelotazo largo directo hacia arriba.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

