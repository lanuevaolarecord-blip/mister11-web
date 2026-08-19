import React from 'react';
import { BarChart3 } from 'lucide-react';

export const ComparativeStatsBars = ({
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Local',
  awayTeamName = 'Visitante'
}) => {
  const metrics = [
    { label: 'Posesión', homeVal: homeStats.posesion || 50, awayVal: awayStats.posesion || 50, isPercent: true },
    { label: 'Tiros Totales', homeVal: homeStats.tiros || 0, awayVal: awayStats.tiros || 0 },
    { label: 'Tiros a Puerta', homeVal: homeStats.tirosPuerta || 0, awayVal: awayStats.tirosPuerta || 0 },
    { label: 'Pases Completados', homeVal: homeStats.pasesExitosos || 0, awayVal: awayStats.pasesExitosos || 0 },
    { label: 'Precisión de Pase', homeVal: homeStats.pasesTotales > 0 ? Math.round(((homeStats.pasesExitosos || 0) / homeStats.pasesTotales) * 100) : 0, awayVal: awayStats.pasesTotales > 0 ? Math.round(((awayStats.pasesExitosos || 0) / awayStats.pasesTotales) * 100) : 0, isPercent: true },
    { label: 'Recuperaciones', homeVal: homeStats.recuperaciones || 0, awayVal: awayStats.recuperaciones || 0 },
    { label: 'Córners (ABP)', homeVal: homeStats.corners || 0, awayVal: awayStats.corners || 0 },
    { label: 'Faltas Cometidas', homeVal: homeStats.faltas || 0, awayVal: awayStats.faltas || 0 },
    { label: 'Tarjetas Amarillas', homeVal: homeStats.amarillas || 0, awayVal: awayStats.amarillas || 0 },
  ];

  return (
    <div className="comparative-bars-container">
      <div className="comparative-header">
        <div className="comparative-title">
          <BarChart3 size={20} className="comp-icon" />
          <h3>Estadísticas Comparativas de Partido</h3>
        </div>
        <div className="teams-header-labels">
          <div className="team-badge-tag home">{homeTeamName}</div>
          <div className="team-badge-tag away">{awayTeamName}</div>
        </div>
      </div>

      <div className="bars-list">
        {metrics.map((m, idx) => {
          const total = (m.homeVal + m.awayVal) || 1;
          const homePct = m.isPercent ? m.homeVal : Math.round((m.homeVal / total) * 100);
          const awayPct = m.isPercent ? m.awayVal : 100 - homePct;

          return (
            <div key={idx} className="metric-bar-row">
              <div className="metric-info-top">
                <span className="val-home">{m.homeVal}{m.isPercent ? '%' : ''}</span>
                <span className="metric-name">{m.label}</span>
                <span className="val-away">{m.awayVal}{m.isPercent ? '%' : ''}</span>
              </div>

              <div className="split-progress-track">
                {/* Barra izquierda (Local) */}
                <div className="side-track left">
                  <div 
                    className="side-fill home"
                    style={{ width: `${Math.min(100, homePct)}%` }}
                  />
                </div>

                {/* Divisor central */}
                <div className="center-divider" />

                {/* Barra derecha (Visitante) */}
                <div className="side-track right">
                  <div 
                    className="side-fill away"
                    style={{ width: `${Math.min(100, awayPct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
