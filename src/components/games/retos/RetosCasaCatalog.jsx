import React, { useState } from 'react';
import { RETOS_CATALOG } from './retosConfig';
import { RetoEngine } from './RetoEngine';
import { useTranslation } from '../../../hooks/useTranslation';

export const RetosCasaCatalog = ({ canPlay, onSessionFinished, assignments = [] }) => {
  const { t } = useTranslation();
  const [activeReto, setActiveReto] = useState(null);

  return (
    <div className="games-grid">
      {RETOS_CATALOG.map((reto) => {
        const isAssigned = assignments.some(a => a.gameId === reto.id);

        return (
          <div 
            key={reto.id} 
            className={`game-card ${!canPlay ? 'disabled' : ''}`}
          >
            <div className="game-card-top">
              <div className="game-card-icon">
                {reto.em}
              </div>
              <div className="game-card-meta">
                <h4 className="game-card-title">{reto.t}</h4>
                <span className="game-card-skill">{reto.sk}</span>
              </div>
            </div>

            <p className="game-card-desc">{reto.what}</p>

            {isAssigned && (
              <div className="recommended-badge" style={{ margin: '4px 0' }}>
                ⭐ {t('games.badge.recommended', {}, 'Recomendado por tu míster')}
              </div>
            )}

            <div className="game-card-footer">
              <span className="game-card-best">
                {reto.sets} sets · {reto.metric}
              </span>
              <button
                type="button"
                className="game-play-btn"
                disabled={!canPlay}
                onClick={() => setActiveReto(reto)}
              >
                {t('games.btn.startReto', {}, 'Entrenar')}
              </button>
            </div>
          </div>
        );
      })}

      {activeReto && (
        <RetoEngine
          isOpen={Boolean(activeReto)}
          onClose={() => setActiveReto(null)}
          reto={activeReto}
          onSessionFinished={onSessionFinished}
        />
      )}
    </div>
  );
};

export default RetosCasaCatalog;
