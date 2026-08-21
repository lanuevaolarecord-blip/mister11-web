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
        <div className="pass-network-summary" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Pases: <strong>{passes.length}</strong></span>
          <span>Conexiones: <strong>{passEdges.length}</strong></span>
          <button
            type="button"
            className="mode-pill"
            onClick={toggleFullscreen}
            style={{
              gap: '6px',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFF',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Salir' : '⛶ Pantalla completa'}
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
          overflow: 'hidden'
        } : {}}
      >
        <svg
          viewBox="0 0 100 100"
          className="network-svg"
          preserveAspectRatio="none"
          style={isFullscreen ? { maxHeight: 'calc(100vh - 120px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' } : {}}
        >
          {/* Fondo del campo */}
          <rect x="0" y="0" width="100" height="100" fill="#153e24" />

          {/* Líneas de fútbol base */}
          <rect x="3" y="4" width="94" height="92" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.7)" />

          {/* Pasillos Tácticos Horizontales (Bandas y Centro) */}
          <line x1="3" y1="33" x2="97" y2="33" stroke="rgba(212,168,67,0.25)" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="3" y1="67" x2="97" y2="67" stroke="rgba(212,168,67,0.25)" strokeWidth="0.6" strokeDasharray="2 2" />

          {/* Áreas penales */}
          <rect x="3" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <rect x="81" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* 1. Dibujar Aristas (Líneas de Pase) */}
          {passEdges.map(edge => {
            const nodeFrom = playerNodes.find(n => n.id === edge.from);
            const nodeTo = playerNodes.find(n => n.id === edge.to);
            if (!nodeFrom || !nodeTo) return null;

            const isSelected = selectedEdge?.id === edge.id;
            const strokeWidth = Math.max(1.2, (edge.count / maxPassCount) * 5);
            const accuracy = edge.count > 0 ? Math.round((edge.successfulCount / edge.count) * 100) : 100;
            const strokeColor = accuracy >= 80 ? '#4CAF7D' : accuracy >= 60 ? '#D4A843' : '#EF4444';

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
                  x1={nodeFrom.x}
                  y1={nodeFrom.y}
                  x2={nodeTo.x}
                  y2={nodeTo.y}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                  strokeOpacity={isSelected ? 1 : 0.75}
                  strokeDasharray={accuracy < 60 ? '3 2' : 'none'}
                />
              </g>
            );
          })}

          {/* 2. Dibujar Nodos (Jugadores) */}
          {playerNodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const nodeRadius = Math.max(3.5, Math.min(6.5, 3.5 + (node.touchCount / (passes.length || 1)) * 12));

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                style={{ cursor: 'pointer' }}
                className="player-node-group"
              >
                {/* Sombra de selección */}
                {isSelected && (
                  <circle r={nodeRadius + 2.5} fill="none" stroke="#D4A843" strokeWidth="1.5" />
                )}
                
                {/* Círculo base del jugador */}
                <circle
                  r={nodeRadius}
                  fill="#1B3A2D"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />

                {/* Dorsal */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="#FFFFFF"
                  fontSize="3.2"
                  fontWeight="bold"
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

