import React from 'react';
import './LegendCard.css';

const LegendCard = ({ player, stats, overall, position, streak, type = "gold" }) => {
  // type can be 'starter' (blue), 'pro' (purple), 'elite' (gold)
  const renderStats = () => {
    if (!stats || stats.length === 0) return null;
    return (
      <div className="card-stats-grid">
        {stats.map((s, idx) => (
          <div key={idx} className="stat-item">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`legend-card-wrapper card-type-${type}`}>
      <div className="legend-card-inner">
        <div className="card-header">
          <div className="card-rating">
            <span className="rating-num">{overall || 85}</span>
            <span className="rating-pos">{position || 'POS'}</span>
          </div>
          <div className="card-image-container">
            {player?.imageUrl ? (
              <img src={player.imageUrl} alt={player.name} className="card-image" />
            ) : (
              <div className="card-placeholder">
                {player?.name?.charAt(0).toUpperCase() || 'P'}
              </div>
            )}
          </div>
          <div className="card-badge"></div>
        </div>

        <div className="card-body">
          <h3 className="card-name">{player?.name || 'Player Name'}</h3>
          <div className="card-divider"></div>
          {renderStats()}
          <div className="card-divider"></div>
          
          <div className="card-footer">
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${(streak % 10) * 10}%` }}></div>
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
