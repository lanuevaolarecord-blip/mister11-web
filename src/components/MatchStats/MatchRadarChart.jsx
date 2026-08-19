import React, { useState } from 'react';
import { Activity, Users, User } from 'lucide-react';

export const MatchRadarChart = ({
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Local',
  awayTeamName = 'Visitante',
  players = []
}) => {
  const [compareMode, setCompareMode] = useState('teams'); // 'teams' o 'players'
  const [playerAId, setPlayerAId] = useState(players[0]?.id || '');
  const [playerBId, setPlayerBId] = useState(players[1]?.id || '');

  // Ejes tácticos principales
  const axes = [
    { key: 'passes', label: 'Pases & Precisión', max: 100 },
    { key: 'shots', label: 'Tiros & Peligro', max: 100 },
    { key: 'defense', label: 'Duelos & Entradas', max: 100 },
    { key: 'dribbles', label: 'Regates & 1v1', max: 100 },
    { key: 'aerial', label: 'Juego Aéreo', max: 100 },
    { key: 'pressure', label: 'Presión & Recuperaciones', max: 100 }
  ];

  // Normalizar datos de equipos (0 a 100)
  const getTeamValues = (stats) => {
    const pases = Math.min(100, Math.round(((stats.pasesExitosos || 25) / Math.max(1, (stats.pasesTotales || 35))) * 100));
    const tiros = Math.min(100, (stats.tiros || 6) * 10);
    const defensa = Math.min(100, ((stats.recuperaciones || 12) + (stats.entradas || 8)) * 4);
    const regates = Math.min(100, (stats.regates || 5) * 15);
    const aereo = Math.min(100, (stats.aereos || 4) * 15);
    const presion = Math.min(100, ((stats.presiones || 14) + (stats.intercepciones || 6)) * 4);

    return [pases, tiros, defensa, regates, aereo, presion];
  };

  const dataA = getTeamValues(homeStats);
  const dataB = getTeamValues(awayStats);

  // Cálculos geométricos del Radar SVG
  const size = 300;
  const center = size / 2;
  const radius = center - 45;
  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Generar polígono SVG para un conjunto de datos
  const getPolygonPoints = (values) => {
    return values.map((val, i) => {
      const r = (val / 100) * radius;
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="radar-chart-container">
      <div className="radar-chart-header">
        <div className="radar-title">
          <Activity size={20} className="radar-icon" />
          <h3>Perfil Táctico Comparativo (Radar)</h3>
        </div>

        <div className="radar-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${compareMode === 'teams' ? 'active' : ''}`}
            onClick={() => setCompareMode('teams')}
          >
            <Users size={14} />
            <span>Equipos</span>
          </button>
        </div>
      </div>

      <div className="radar-chart-body">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-svg">
          {/* Círculos y telaraña concéntrica de fondo */}
          {[0.25, 0.5, 0.75, 1].map((level, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeDasharray={level === 1 ? 'none' : '2 2'}
              strokeWidth="0.8"
            />
          ))}

          {/* Ejes radiales */}
          {axes.map((axis, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const labelX = center + (radius + 20) * Math.cos(angle);
            const labelY = center + (radius + 14) * Math.sin(angle);

            return (
              <g key={axis.key}>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.18)"
                  strokeWidth="0.8"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="9.5"
                  fill="rgba(255, 255, 255, 0.75)"
                  fontWeight="600"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {/* Polígono Equipo / Sujeto A (Dorado Institucional) */}
          <polygon
            points={getPolygonPoints(dataA)}
            fill="rgba(212, 168, 67, 0.35)"
            stroke="#D4A843"
            strokeWidth="2"
          />

          {/* Polígono Equipo / Sujeto B (Verde Campo) */}
          <polygon
            points={getPolygonPoints(dataB)}
            fill="rgba(76, 175, 125, 0.35)"
            stroke="#4CAF7D"
            strokeWidth="2"
          />

          {/* Puntos de datos */}
          {dataA.map((val, i) => {
            const r = (val / 100) * radius;
            const angle = i * angleSlice - Math.PI / 2;
            return (
              <circle
                key={`a-${i}`}
                cx={center + r * Math.cos(angle)}
                cy={center + r * Math.sin(angle)}
                r="3.5"
                fill="#D4A843"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            );
          })}

          {dataB.map((val, i) => {
            const r = (val / 100) * radius;
            const angle = i * angleSlice - Math.PI / 2;
            return (
              <circle
                key={`b-${i}`}
                cx={center + r * Math.cos(angle)}
                cy={center + r * Math.sin(angle)}
                r="3.5"
                fill="#4CAF7D"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      {/* Leyenda comparativa */}
      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-box gold" />
          <span>{homeTeamName} (Local)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box green" />
          <span>{awayTeamName} (Visitante)</span>
        </div>
      </div>
    </div>
  );
};
