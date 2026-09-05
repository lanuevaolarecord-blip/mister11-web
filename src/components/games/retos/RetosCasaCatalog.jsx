import React, { useState } from 'react';
import { RETOS_CATALOG } from './retosConfig';
import { RetoEngine } from './RetoEngine';
import { useTranslation } from '../../../hooks/useTranslation';
import { Lock, CheckCircle } from 'lucide-react';

export const RetosCasaCatalog = ({
  canPlay = true,
  canPlayChallenge,
  getChallengeAttempts,
  isChallengeCompletedToday,
  onSessionFinished,
  assignments = []
}) => {
  const { t } = useTranslation();
  const [activeReto, setActiveReto] = useState(null);

  return (
    <div className="games-grid">
      {RETOS_CATALOG.map((reto) => {
        const isAssigned = assignments.some(a => a.gameId === reto.id);
        const attempts = getChallengeAttempts ? getChallengeAttempts(reto.id) : 0;
        const check = canPlayChallenge ? canPlayChallenge(reto.id) : { allowed: canPlay, reason: 'ok' };
        const isCompleted = isChallengeCompletedToday ? isChallengeCompletedToday(reto.id) : false;
        const isAllowed = check.allowed;

        return (
          <div 
            key={reto.id} 
            className={`game-card ${!isAllowed ? 'disabled' : ''}`}
          >
            <div className="game-card-top">
              <div className="game-card-icon">
                {reto.em}
              </div>
              <div className="game-card-meta">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <h4 className="game-card-title">{reto.t}</h4>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: attempts >= 2 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)',
                    color: attempts >= 2 ? '#EF4444' : '#2563EB'
                  }}>
                    {attempts} / 2 {t('games.retos.attemptsToday', {}, 'intentos hoy')}
                  </span>
                </div>
                <span className="game-card-skill">{reto.sk}</span>
              </div>
            </div>

            <p className="game-card-desc">{reto.what}</p>

            {isCompleted && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: 'rgba(16,185,129,0.12)',
                padding: '2px 8px',
                borderRadius: '6px',
                marginBottom: '6px'
              }}>
                <CheckCircle size={12} /> {t('games.retos.completedBadge', {}, 'Superado hoy (+1 logro)')}
              </div>
            )}

            {isAssigned && (
              <div className="recommended-badge" style={{ margin: '4px 0' }}>
                ⭐ {t('games.badge.recommended', {}, 'Recomendado por tu míster')}
              </div>
            )}

            {!isAllowed && (
              <div style={{
                fontSize: '11px',
                color: '#64748B',
                fontStyle: 'italic',
                margin: '4px 0 8px 0',
                lineHeight: 1.3
              }}>
                {check.reason === 'attempts_limit'
                  ? t('games.retos.attemptsExhausted', {}, 'Has completado los 2 intentos de hoy para este reto. ¡A descansar!')
                  : t('games.retos.timeExhausted', {}, 'Cuerpo trabajado. El descanso también entrena. Mañana, más.')}
              </div>
            )}

            <div className="game-card-footer">
              <span className="game-card-best">
                {reto.sets} sets · {reto.metric}
              </span>
              <button
                type="button"
                className="game-play-btn"
                disabled={!isAllowed}
                onClick={() => setActiveReto(reto)}
              >
                {!isAllowed ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} /> {t('games.retos.lockedBtn', {}, 'Descanso')}
                  </span>
                ) : (
                  t('games.btn.startReto', {}, 'Entrenar')
                )}
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
