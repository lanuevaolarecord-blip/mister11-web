import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Share2, Maximize2, Minimize2, Users } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // 1. Calcular posición promedio (centroide) y volumen de toques de cada jugador
  const playerNodes = useMemo(() => {
    const map = {};

    // Posiciones tácticas de respaldo si no hay suficientes eventos registrados
    const defaultPositions = [
      { x: 10, y: 50 }, // Portero
      { x: 28, y: 20 }, { x: 25, y: 40 }, { x: 25, y: 60 }, { x: 28, y: 80 }, // Defensas
      { x: 48, y: 30 }, { x: 45, y: 50 }, { x: 48, y: 70 }, // Medios
      { x: 70, y: 25 }, { x: 75, y: 50 }, { x: 70, y: 75 }  // Delanteros
    ];

    players.forEach((p, idx) => {
      const def = defaultPositions[idx % defaultPositions.length];
      map[p.id] = {
        id: p.id,
        name: p.nombre || p.name || `J#${p.dorsal || idx + 1}`,
        dorsal: p.dorsal || p.number || (idx + 1),
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
        const fallback = ZONE_MAP[pass.type] || { x: 50, y: 50 };
        const px = typeof pass.x === 'number' ? pass.x : fallback.x;
        const py = typeof pass.y === 'number' ? pass.y : fallback.y;
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
  const passEdges = useMemo(() => {
    const edgesMap = {};

    passes.forEach(pass => {
      const from = pass.fromPlayerId || pass.playerId;
      const to = pass.toPlayerId || pass.receiverId;
      const successful = pass.successful !== false && pass.outcome !== 'incomplete';

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

    return Object.values(edgesMap);
  }, [passes]);

  // Máximo volumen de pases entre dos jugadores para normalizar grosor
  const maxPassCount = useMemo(() => {
    return passEdges.reduce((max, e) => Math.max(max, e.count), 1);
  }, [passEdges]);

  return (
    <div
      ref={wrapperRef}
      className="pass-network-container"
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        background: '#0b1712',
        padding: '12px 16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999999,
        boxSizing: 'border-box'
      } : {}}
    >
      {/* Header de la red de pases */}
      <div className="pass-network-header" style={{ flexShrink: 0, marginBottom: isFullscreen ? '8px' : '16px' }}>
        <div className="pass-network-title">
          <Share2 size={20} className="network-icon" />
          <h3>Red de Pases Táctica ({teamName})</h3>
        </div>
        <div className="pass-network-summary" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>Pases: <strong>{passes.length}</strong></span>
          <span>Conexiones: <strong>{passEdges.length}</strong></span>
          <button
            type="button"
            className="btn-fullscreen-match-card"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* Campo SVG con Nodos y Aristas (Zero-scroll) */}
      <div
        className="field-network-canvas"
        style={isFullscreen ? {
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
        <button
          type="button"
          className="btn-floating-pitch-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ver en Pantalla Completa'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <svg
          viewBox="0 0 105 68"
          className="network-svg"
          preserveAspectRatio="none"
          style={isFullscreen ? { maxHeight: 'calc(100vh - 120px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
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
              <div>Toques / Participaciones: <strong>{selectedNode.touchCount}</strong></div>
              <div>Posición media en campo: <strong>X: {Math.round(selectedNode.x)}% | Y: {Math.round(selectedNode.y)}%</strong></div>
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="network-info-card">
            <div className="info-card-header">
              <strong>Conexión de Pase</strong>
            </div>
            <div className="info-card-body">
              <div>Pases totales entre jugadores: <strong>{selectedEdge.count}</strong></div>
              <div>Pases completados: <strong>{selectedEdge.successfulCount}</strong> ({Math.round((selectedEdge.successfulCount / selectedEdge.count) * 100)}% acierto)</div>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de la Red */}
      <div className="pass-network-legend">
        <div className="legend-item">
          <span className="legend-dot green" />
          <span>Alta precisión (≥80%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot gold" />
          <span>Precisión media (60-79%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot red" />
          <span>Pérdidas frecuentes (&lt;60%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line thick" />
          <span>Grosor = Mayor frecuencia</span>
        </div>
      </div>
    </div>
  );
};

