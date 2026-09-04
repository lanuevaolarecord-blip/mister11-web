import React from 'react';
import { X, Trophy, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import './Games.css';

export const GameShell = ({
  isOpen,
  onClose,
  game,
  status = 'intro', // 'intro' | 'playing' | 'finished'
  onStartPractice,
  onStartGame,
  xpResult = null,
  summaryStats = [],
  children,
  safetyNote = null,
  honestyPact = false
}) => {
  const { t } = useTranslation();

  if (!isOpen || !game) return null;

  return (
    <div className="game-shell-modal" role="dialog" aria-modal="true">
      <div className="game-shell-card">
        
        {/* Cabecera Azul Institucional */}
        <div className="game-shell-header">
          <div className="game-shell-title-wrap">
            <span style={{ fontSize: '22px' }}>{game.em}</span>
            <div>
              <h3 className="game-shell-title">{game.t}</h3>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {game.sk}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="game-shell-close-btn" 
            onClick={onClose}
            aria-label={t('common.close', {}, 'Cerrar')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="game-shell-body">

          {/* FASE 1: INTRODUCCIÓN (Qué / Cómo / Por qué) */}
          {status === 'intro' && (
            <>
              {/* QUÉ ENTRENAMOS */}
              <div className="game-intro-block">
                <h4 className="game-intro-heading">
                  <span>🎯</span> {t('games.intro.whatTitle', {}, 'Qué entrenamos')}
                </h4>
                <p className="game-intro-text">{game.what}</p>
              </div>

              {/* CÓMO SE JUEGA (Instrucciones paso a paso) */}
              <div className="game-intro-block">
                <h4 className="game-intro-heading">
                  <span>🎮</span> {t('games.intro.howTitle', {}, 'Cómo se juega')}
                </h4>
                <ol className="game-steps-list">
                  {game.steps && game.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* POR QUÉ TE AYUDA */}
              <div className="game-intro-block">
                <h4 className="game-intro-heading">
                  <span>⚽</span> {t('games.intro.whyTitle', {}, 'Por qué te ayuda en el campo')}
                </h4>
                <p className="game-intro-text">{game.why}</p>
              </div>

              {/* NOTA DE SEGURIDAD (Para retos físicos) */}
              {safetyNote && (
                <div className="game-intro-block" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
                  <h4 className="game-intro-heading" style={{ color: '#c2410c' }}>
                    <ShieldCheck size={14} /> {t('games.safety.title', {}, 'Seguridad en casa')}
                  </h4>
                  <p className="game-intro-text" style={{ color: '#9a3412', fontSize: '12px' }}>
                    {safetyNote}
                  </p>
                </div>
              )}

              {/* PACTO DE HONESTIDAD */}
              {honestyPact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span>🤝</span>
                  <span>{t('games.honesty.pact', {}, 'Pacto de honestidad: anota tus repeticiones reales. ¡El esfuerzo es tuyo!')}</span>
                </div>
              )}

              {/* Botones de Inicio: Práctica previa recomendada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {onStartPractice && (
                  <button
                    type="button"
                    className="game-play-btn"
                    style={{ background: '#f1f5f9', color: '#1E3A8A', border: '1px solid #cbd5e1' }}
                    onClick={onStartPractice}
                  >
                    {t('games.btn.practiceFirst', {}, 'Probar en Modo Práctica')}
                  </button>
                )}
                <button
                  type="button"
                  className="game-play-btn success"
                  onClick={onStartGame}
                >
                  {t('games.btn.startOfficial', {}, 'Comenzar Sesión')}
                </button>
              </div>

              {/* Disclaimer ético y de salud */}
              <div className="game-disclaimer-note">
                {t('games.disclaimer', {}, 'Entrenamiento cognitivo de apoyo, no es terapia; en TDAH seguir pautas de especialistas.')}
              </div>
            </>
          )}

          {/* FASE 2: EN JUEGO / PRÁCTICA */}
          {status === 'playing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              {children}
            </div>
          )}

          {/* FASE 3: CIERRE POSITIVO (SIN BOTÓN OTRA PARTIDA) */}
          {status === 'finished' && (
            <div className="game-finish-card">
              <div className="game-finish-trophy">🏆</div>
              <h3 className="game-finish-title">
                {t('games.finish.title', {}, '¡Excelente esfuerzo!')}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                {t('games.finish.subtitle', {}, 'Has completado la sesión con dedicación.')}
              </p>

              {/* Métricas obtenidas */}
              {summaryStats.length > 0 && (
                <div className="game-finish-stats">
                  {summaryStats.map((st, i) => (
                    <div key={i} className="finish-stat-box">
                      <div className="finish-stat-val">{st.value ?? '—'}</div>
                      <div className="finish-stat-lbl">{st.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Línea de XP ganado */}
              {xpResult && (
                <div className="game-xp-line">
                  ⭐ +{xpResult.xpEarned || 10} XP acumulados
                  {xpResult.isPersonalBest && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                      ✨ ¡Nuevo récord personal!
                    </span>
                  )}
                </div>
              )}

              {/* Anti-adicción: Cierre amable y retorno directo al catálogo */}
              <p style={{ fontSize: '12px', color: '#047857', background: '#ecfdf5', padding: '8px 12px', borderRadius: '8px', margin: '4px 0 0 0', width: '100%', boxSizing: 'border-box' }}>
                {t('games.finish.healthyClosing', {}, '¡Gran trabajo mental! Descansa la vista y el cuerpo.')}
              </p>

              {/* BOTÓN ÚNICO: VOLVER AL CATÁLOGO (PROHIBIDO "OTRA PARTIDA") */}
              <button
                type="button"
                className="game-play-btn"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={onClose}
              >
                {t('games.btn.backToCatalog', {}, 'Volver al Catálogo')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GameShell;
