import React from 'react';
import './LegendCard.css';

const RunningSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4 23l3-9 4-3 1-3M13 10V6M13 14l-4 8M17 23l-3-9 2-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const TrophySvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 1 4 4v5H8V6a4 4 0 0 1 4-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const BrainSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5M14.5 2A2.5 2.5 0 0 0 12 4.5M12 4.5V22M12 8a3 3 0 0 0-3-3M12 8a3 3 0 0 1 3-3M12 13a4 4 0 0 0-4-4M12 13a4 4 0 0 1 4-4M12 18a5 5 0 0 0-5-5M12 18a5 5 0 0 1 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const BallSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h2M12 6l3.5 3.5M12 6L8.5 9.5M12 18l3.5-3.5M12 18l-3.5-3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);



const CrownSvg = () => (
  <svg viewBox="0 0 24 16" style={{ position: 'absolute', width: '36px', height: '24px', top: '-26px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, pointerEvents: 'none' }}>
    <path d="M 2,14 L 4,4 L 9,9 L 12,2 L 15,9 L 20,4 L 22,14 Z" fill="#D4A843" stroke="#B8860B" strokeWidth="0.75" />
    <circle cx="2" cy="3.5" r="0.8" fill="#FFF" />
    <circle cx="12" cy="1.5" r="1" fill="#FFF" />
    <circle cx="22" cy="3.5" r="0.8" fill="#FFF" />
    <rect x="3" y="13" width="18" height="1.5" fill="#B8860B" rx="0.5" />
  </svg>
);

const ShieldSvg = () => (
  <svg width="14" height="16" viewBox="0 0 24 24" fill="#1B3A2D" stroke="#D4A843" strokeWidth="2" style={{ marginTop: 2 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LegendCard = ({ player, stats, overall, position, streak, type = "gold" }) => {
  const renderStats = () => {
    if (!stats || stats.length === 0) return null;
    return (
      <div className="card-stats-grid-new">
        {stats.map((s, idx) => (
          <div key={idx} className="stat-pill-btn">
            <span className="stat-pill-label">{s.label} {s.value}</span>
            <span className="stat-pill-icon">
              {s.label === 'FÍS' && <RunningSvg />}
              {s.label === 'TÉC' && <TrophySvg />}
              {s.label === 'PSI' && <BrainSvg />}
              {s.label === 'SOC' && <BallSvg />}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`legend-card-wrapper card-type-${type}`}>
      <div className="legend-card-inner">
        <div className="card-header-new">
          <div className="card-header-left">
            <span className="card-header-val">{overall || '-'}</span>
            <span className="card-header-label">{position || 'POS'}</span>
            <ShieldSvg />
          </div>
          
          <div className="card-avatar-wrapper">
            <CrownSvg />
            <div className="card-avatar-circle">
              {player?.avatarUrl || player?.imageUrl ? (
                <img src={player.avatarUrl || player.imageUrl} alt={player.name} className="card-avatar-img" />
              ) : (
                <span className="avatar-placeholder">{player?.name?.charAt(0).toUpperCase() || 'P'}</span>
              )}
            </div>
          </div>

          <div className="card-header-right">
            <span className="card-header-val">PE</span>
            <ShieldSvg />
            <span className="card-star">★</span>
          </div>
        </div>

        <div className="card-body">
          <h3 className="card-name">{player?.name || 'Player Name'}</h3>
          <div className="card-divider"></div>
          {renderStats()}
          <div className="card-divider"></div>
          
          <div className="card-footer">
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, (streak % 10) * 10)}%` }}></div>
              </div>
            </div>
            <div className="streak-info">
              <span>🔥 Racha: {streak || 0} tests</span>
              <span>✅</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendCard;
