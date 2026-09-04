import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useGameLimits } from '../../hooks/useGameLimits';
import { useCognitiveSync } from '../../hooks/useCognitiveSync';
import { useGameLevels } from '../../hooks/useGameLevels';
import { NIVEL_LABELS } from '../../utils/cognitiveLevels';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../utils/toast';
import { SemaforoPro } from './SemaforoPro';
import { FrenoImpulsivo } from './FrenoImpulsivo';
import { OjoTactico } from './OjoTactico';
import { MemoriaConos } from './MemoriaConos';
import { Respiracion44 } from './Respiracion44';
import { DecisionSegundo } from './DecisionSegundo';
import { RetosCasaCatalog } from './retos/RetosCasaCatalog';
import { Lock, Sparkles, Brain, ShieldAlert, Award } from 'lucide-react';
import './Games.css';

export const GamesHome = ({ player, team, teamPath, isParentView = false }) => {
  const { t } = useTranslation();
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const playerId = player?.id;

  const {
    limits,
    canPlay,
    remainingSessions,
    remainingMinutes,
    maxSessions,
    maxMinutes,
    registerSession
  } = useGameLimits(cleanPath, playerId);

  const { bestScores, saveSession } = useCognitiveSync(cleanPath, playerId);

  const {
    levels,
    categoria,
    getGameLevel,
    getAdjustedParams,
    processSessionProgression
  } = useGameLevels(cleanPath, player);

  const [activeCategory, setActiveCategory] = useState('cognitive'); // 'cognitive' | 'retos'
  const [activeGameModal, setActiveGameModal] = useState(null); // 'g1'..'g6' | null
  const [assignments, setAssignments] = useState([]);

  // Escuchar recomendaciones/asignaciones del entrenador
  useEffect(() => {
    if (!cleanPath || !playerId) return;

    const assignCol = collection(db, `${cleanPath}/gameAssignments`);
    const unsub = onSnapshot(assignCol, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const forMe = all.filter(a => a.target === 'team' || a.target === playerId || a.playerId === playerId);
      setAssignments(forMe);
    }, (err) => {
      console.warn('[GamesHome] Error escuchando asignaciones:', err);
    });

    return () => unsub();
  }, [cleanPath, playerId]);

  // Manejar finalización de cualquier juego o reto
  const handleSessionFinished = async (sessionData, higherBetter = true) => {
    const duration = sessionData.durationSec || 60;
    // 1. Actualizar límites diarios anti-adicción
    await registerSession(duration);
    // 2. Guardar sesión y actualizar XP y mejores marcas
    const xpRes = await saveSession(sessionData, higherBetter);

    // 3. Evaluar progresión adaptativa de nivel (solo para juegos competitivos con métricas)
    const code = sessionData.gameIdCode || (
      sessionData.gameId === 'g1' ? 'semaforo' :
      sessionData.gameId === 'g2' ? 'freno' :
      sessionData.gameId === 'g3' ? 'ojo' :
      sessionData.gameId === 'g4' ? 'memoria' :
      sessionData.gameId === 'g6' ? 'decision' : sessionData.gameId
    );

    if (sessionData.metrics && code && code !== 'respiracion' && code !== 'respiracion44' && !code.startsWith('reto_')) {
      const levelRes = await processSessionProgression(code, sessionData.metrics);
      if (levelRes.subio) {
        const lvlInfo = NIVEL_LABELS[levelRes.nivel] || NIVEL_LABELS.bronce;
        showToast(`🎉 ¡Subiste a nivel ${lvlInfo.es}! ${lvlInfo.badge} (+10 XP)`, 'success');
        if (levelRes.techo) {
          showToast('👑 ¡Alcanzaste el techo de Leyenda! ¡Eres un crack!', 'success');
        }
      }
    }

    return xpRes;
  };

  const recommendedAssignment = assignments.length > 0 ? assignments[0] : null;

  return (
    <div className="games-container">

      {/* ── BANNER ANTI-ADICCIÓN Y LÍMITES DIARIOS ── */}
      <div className="games-limits-card">
        <div className="limits-header">
          <div className="limits-title-wrap">
            <Brain size={18} className="limits-brain-icon" />
            <h4 className="limits-title">
              {t('games.limits.title', {}, 'Entrenamiento Saludable')}
            </h4>
          </div>
          <span className="limits-pill">
            {canPlay 
              ? t('games.limits.available', {}, 'Disponible') 
              : t('games.limits.completedToday', {}, 'Completado por hoy')}
          </span>
        </div>

        <div className="limits-stats-row">
          {/* Sesiones hoy */}
          <div className="limit-stat-box">
            <span className="limit-stat-lbl">
              {t('games.limits.sessionsLbl', {}, 'Sesiones hoy')}
            </span>
            <span className="limit-stat-val">
              {limits.sessionsToday} / {maxSessions}
            </span>
            <div className="limits-bar-bg">
              <div 
                className="limits-bar-fill" 
                style={{ width: `${Math.min(100, (limits.sessionsToday / maxSessions) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Minutos hoy */}
          <div className="limit-stat-box">
            <span className="limit-stat-lbl">
              {t('games.limits.minutesLbl', {}, 'Tiempo jugado')}
            </span>
            <span className="limit-stat-val">
              {limits.minutesToday} / {maxMinutes} min
            </span>
            <div className="limits-bar-bg">
              <div 
                className="limits-bar-fill" 
                style={{ width: `${Math.min(100, (limits.minutesToday / maxMinutes) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Candado Amigable si se alcanza el límite */}
        {!canPlay && (
          <div className="limits-locked-banner">
            <Lock size={24} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <h4>{t('games.limits.lockedTitle', {}, '¡Bien hecho por hoy!')}</h4>
              <p>
                {t('games.limits.lockedDesc', {}, 'Has alcanzado el límite saludable de entrenamiento diario (2 sesiones o 10 min). Vuelve mañana para seguir mejorando tu mente y coordinación.')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── HOY TE TOCA (Recomendaciones del Míster) ── */}
      {recommendedAssignment && canPlay && (
        <div className="games-recommended-section">
          <div className="recommended-badge">
            ⭐ {t('games.badge.recommended', {}, 'Recomendado por tu míster')}
          </div>
          <div className="recommended-assignment-card">
            <div>
              <div className="recommended-assignment-title">
                {t('games.assignment.todayPrompt', {}, 'El cuerpo técnico te ha asignado un reto especial')}
              </div>
              <div className="recommended-assignment-subtitle">
                {recommendedAssignment.gameName || recommendedAssignment.gameId}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTOR DE CATEGORÍA: COGNITIVOS VS RETOS ── */}
      <div className="games-cat-tabs">
        <button
          type="button"
          className={`games-cat-btn ${activeCategory === 'cognitive' ? 'active' : ''}`}
          onClick={() => setActiveCategory('cognitive')}
        >
          <span>🧠</span> {t('games.tabs.cognitive', {}, 'Juegos Cognitivos (6)')}
        </button>
        <button
          type="button"
          className={`games-cat-btn ${activeCategory === 'retos' ? 'active' : ''}`}
          onClick={() => setActiveCategory('retos')}
        >
          <span>⚽</span> {t('games.tabs.retos', {}, 'Retos en Casa (8)')}
        </button>
      </div>

      {/* ── CATÁLOGO DE JUEGOS COGNITIVOS ── */}
      {activeCategory === 'cognitive' && (
        <div className="games-grid">
          {/* G1: Semáforo Pro */}
          {(() => {
            const lvl = getGameLevel('semaforo') || 'bronce';
            const info = NIVEL_LABELS[lvl] || NIVEL_LABELS.bronce;
            return (
              <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
                <div className="game-card-top">
                  <div className="game-card-icon">🚦</div>
                  <div className="game-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 className="game-card-title">{t('games.g1.title', {}, 'Semáforo Pro')}</h4>
                      <span className="game-level-badge" style={{ color: info.color }}>
                        {info.badge} {info.es}
                      </span>
                    </div>
                    <span className="game-card-skill">{t('games.g1.skill', {}, 'Velocidad de reacción')}</span>
                  </div>
                </div>
                <p className="game-card-desc">
                  {t('games.g1.what', {}, 'Reaccionar en milisegundos: salir al balón antes que el rival.')}
                </p>
                <div className="game-card-footer">
                  <span className="game-card-best">
                    {bestScores.g1 ? `Récord: ${bestScores.g1} ms` : t('games.status.notPlayed', {}, 'Sin registro')}
                  </span>
                  <button
                    type="button"
                    className="game-play-btn"
                    disabled={!canPlay}
                    onClick={() => setActiveGameModal('g1')}
                  >
                    {t('games.btn.play', {}, 'Jugar')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* G2: Freno Impulsivo */}
          {(() => {
            const lvl = getGameLevel('freno') || 'bronce';
            const info = NIVEL_LABELS[lvl] || NIVEL_LABELS.bronce;
            return (
              <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
                <div className="game-card-top">
                  <div className="game-card-icon">🛑</div>
                  <div className="game-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 className="game-card-title">{t('games.g2.title', {}, 'Freno Impulsivo')}</h4>
                      <span className="game-level-badge" style={{ color: info.color }}>
                        {info.badge} {info.es}
                      </span>
                    </div>
                    <span className="game-card-skill">{t('games.g2.skill', {}, 'Autocontrol y decisión')}</span>
                  </div>
                </div>
                <p className="game-card-desc">
                  {t('games.g2.what', {}, 'Frenar el impulso: decidir antes de actuar.')}
                </p>
                <div className="game-card-footer">
                  <span className="game-card-best">
                    {bestScores.g2 ? `Precisión: ${bestScores.g2}%` : t('games.status.notPlayed', {}, 'Sin registro')}
                  </span>
                  <button
                    type="button"
                    className="game-play-btn"
                    disabled={!canPlay}
                    onClick={() => setActiveGameModal('g2')}
                  >
                    {t('games.btn.play', {}, 'Jugar')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* G3: Ojo Táctico */}
          {(() => {
            const lvl = getGameLevel('ojo') || 'bronce';
            const info = NIVEL_LABELS[lvl] || NIVEL_LABELS.bronce;
            return (
              <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
                <div className="game-card-top">
                  <div className="game-card-icon">👁️</div>
                  <div className="game-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 className="game-card-title">{t('games.g3.title', {}, 'Ojo Táctico')}</h4>
                      <span className="game-level-badge" style={{ color: info.color }}>
                        {info.badge} {info.es}
                      </span>
                    </div>
                    <span className="game-card-skill">{t('games.g3.skill', {}, 'Escaneo visual y percepción')}</span>
                  </div>
                </div>
                <p className="game-card-desc">
                  {t('games.g3.what', {}, 'Ver el juego: encontrar al compañero libre antes de recibir.')}
                </p>
                <div className="game-card-footer">
                  <span className="game-card-best">
                    {bestScores.g3 ? `Aciertos: ${bestScores.g3}/5` : t('games.status.notPlayed', {}, 'Sin registro')}
                  </span>
                  <button
                    type="button"
                    className="game-play-btn"
                    disabled={!canPlay}
                    onClick={() => setActiveGameModal('g3')}
                  >
                    {t('games.btn.play', {}, 'Jugar')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* G4: Memoria de Conos */}
          {(() => {
            const lvl = getGameLevel('memoria') || 'bronce';
            const info = NIVEL_LABELS[lvl] || NIVEL_LABELS.bronce;
            return (
              <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
                <div className="game-card-top">
                  <div className="game-card-icon">🔺</div>
                  <div className="game-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 className="game-card-title">{t('games.g4.title', {}, 'Memoria de Conos')}</h4>
                      <span className="game-level-badge" style={{ color: info.color }}>
                        {info.badge} {info.es}
                      </span>
                    </div>
                    <span className="game-card-skill">{t('games.g4.skill', {}, 'Memoria de trabajo')}</span>
                  </div>
                </div>
                <p className="game-card-desc">
                  {t('games.g4.what', {}, 'Recordar información táctica bajo presión.')}
                </p>
                <div className="game-card-footer">
                  <span className="game-card-best">
                    {bestScores.g4 ? `Máx: ${bestScores.g4} conos` : t('games.status.notPlayed', {}, 'Sin registro')}
                  </span>
                  <button
                    type="button"
                    className="game-play-btn"
                    disabled={!canPlay}
                    onClick={() => setActiveGameModal('g4')}
                  >
                    {t('games.btn.play', {}, 'Jugar')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* G5: Respiración 4-4 (SIN NIVELES) */}
          <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
            <div className="game-card-top">
              <div className="game-card-icon">🌬️</div>
              <div className="game-card-meta">
                <h4 className="game-card-title">{t('games.g5.title', {}, 'Respiración 4-4')}</h4>
                <span className="game-card-skill">{t('games.g5.skill', {}, 'Calma y autocontrol')}</span>
              </div>
            </div>
            <p className="game-card-desc">
              {t('games.g5.what', {}, 'Calmar los nervios y enfocar la mente antes de jugar.')}
            </p>
            <div className="game-card-footer">
              <span className="game-card-best" style={{ color: '#0284c7' }}>
                🧘 {t('games.g5.zenBadge', {}, '6 ciclos de calma')}
              </span>
              <button
                type="button"
                className="game-play-btn"
                disabled={!canPlay}
                onClick={() => setActiveGameModal('g5')}
              >
                {t('games.btn.play', {}, 'Respirar')}
              </button>
            </div>
          </div>

          {/* G6: Decisión 1 Segundo */}
          {(() => {
            const lvl = getGameLevel('decision') || 'bronce';
            const info = NIVEL_LABELS[lvl] || NIVEL_LABELS.bronce;
            return (
              <div className={`game-card ${!canPlay ? 'disabled' : ''}`}>
                <div className="game-card-top">
                  <div className="game-card-icon">⚡</div>
                  <div className="game-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 className="game-card-title">{t('games.g6.title', {}, 'Decisión 1 Segundo')}</h4>
                      <span className="game-level-badge" style={{ color: info.color }}>
                        {info.badge} {info.es}
                      </span>
                    </div>
                    <span className="game-card-skill">{t('games.g6.skill', {}, 'Lectura táctica')}</span>
                  </div>
                </div>
                <p className="game-card-desc">
                  {t('games.g6.what', {}, 'Elegir la mejor acción en un vistazo: pase, tiro o conducción.')}
                </p>
                <div className="game-card-footer">
                  <span className="game-card-best">
                    {bestScores.g6 ? `Precisión: ${bestScores.g6}%` : t('games.status.notPlayed', {}, 'Sin registro')}
                  </span>
                  <button
                    type="button"
                    className="game-play-btn"
                    disabled={!canPlay}
                    onClick={() => setActiveGameModal('g6')}
                  >
                    {t('games.btn.play', {}, 'Jugar')}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── CATÁLOGO DE RETOS EN CASA (8) (SIN NIVELES) ── */}
      {activeCategory === 'retos' && (
        <RetosCasaCatalog
          canPlay={canPlay}
          onSessionFinished={handleSessionFinished}
          assignments={assignments}
        />
      )}

      {/* MODALES DE JUEGOS COGNITIVOS CON PARÁMETROS ADAPTATIVOS */}
      {activeGameModal === 'g1' && (
        <SemaforoPro
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
          adaptiveParams={getAdjustedParams('semaforo')}
          currentLevel={getGameLevel('semaforo')}
        />
      )}
      {activeGameModal === 'g2' && (
        <FrenoImpulsivo
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
          adaptiveParams={getAdjustedParams('freno')}
          currentLevel={getGameLevel('freno')}
        />
      )}
      {activeGameModal === 'g3' && (
        <OjoTactico
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
          adaptiveParams={getAdjustedParams('ojo')}
          currentLevel={getGameLevel('ojo')}
        />
      )}
      {activeGameModal === 'g4' && (
        <MemoriaConos
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
          adaptiveParams={getAdjustedParams('memoria')}
          currentLevel={getGameLevel('memoria')}
        />
      )}
      {activeGameModal === 'g5' && (
        <Respiracion44
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
        />
      )}
      {activeGameModal === 'g6' && (
        <DecisionSegundo
          isOpen={true}
          onClose={() => setActiveGameModal(null)}
          onSessionFinished={handleSessionFinished}
          adaptiveParams={getAdjustedParams('decision')}
          currentLevel={getGameLevel('decision')}
        />
      )}

    </div>
  );
};

export default GamesHome;
