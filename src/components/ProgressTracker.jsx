import React from 'react';
import './ProgressTracker.css';

const ProgressTracker = ({ label, percentage, currentLevel, nextLevelStr }) => {
  return (
    <div className="progress-tracker-container">
      <div className="tracker-header">
        <span className="tracker-label">{label}</span>
        <span className="tracker-percentage">{percentage}%</span>
      </div>
      <div className="tracker-bar-bg">
        <div 
          className="tracker-bar-fill" 
          style={{ width: `${percentage}%` }}
        >
          <div className="tracker-glow"></div>
        </div>
      </div>
      <div className="tracker-footer">
        <div className="tracker-level">
          <span className="level-badge">{currentLevel}</span>
        </div>
        {nextLevelStr && (
          <div className="tracker-hint">
            <span className="sparkle">✨</span> {nextLevelStr}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
