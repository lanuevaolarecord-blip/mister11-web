import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from './GameShell';
import { GameLiveTimerChip } from './GameLiveTimerChip';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useTranslation } from '../../hooks/useTranslation';

export const Respiracion44 = ({ 
  isOpen, 
  onClose, 
  onSessionFinished,
  recordTimeDelta = null,
  startSession = null,
  remainingCognitiveSeconds = 900
}) => {
  const { t } = useTranslation();

  const timer = useGameTimer({
    category: 'cognitive',
    initialRemainingSeconds: remainingCognitiveSeconds,
    recordTimeDelta,
    startSession
  });

  const gameInfo = {
    id: 'g5',
    em: '🌬️',
    t: t('games.g5.title', {}, 'Respiración 4-4'),
    sk: t('games.g5.skill', {}, 'Calma y autocontrol'),
    what: t('games.g5.what', {}, 'Calmar los nervios antes de jugar.'),
    steps: [
      t('games.g5.step1', {}, 'El círculo crece → inhala suavemente por la nariz (4 s).'),
      t('games.g5.step2', {}, 'El círculo encoge → exhala despacio por la boca (4 s).'),
      t('games.g5.step3', {}, '6 ciclos completos, sin prisas ni puntuación.')
    ],
    why: t('games.g5.why', {}, 'La respiración cuadrada 4-4 activa el sistema parasimpático: baja pulso y ansiedad en ~1 min. La usan deportistas de élite; es simple y se hace en cualquier sitio. Por eso la elegimos.')
  };

  const [status, setStatus] = useState('intro');
  const [cycle, setCycle] = useState(1);
  const [phaseText, setPhaseText] = useState('Inhala');
  const [countdown, setCountdown] = useState(4);
  const [isInhaling, setIsInhaling] = useState(true);
  const [xpResult, setXpResult] = useState(null);

  const cycleRef = useRef(1);
  const timeoutsRef = useRef([]);

  const addTimeout = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const runPhase = (phaseName, isInhale) => {
    setPhaseText(phaseName);
    setIsInhaling(isInhale);

    let n = 4;
    setCountdown(n);

    const stepCountdown = () => {
      addTimeout(() => {
        n--;
        if (n > 0) {
          setCountdown(n);
          stepCountdown();
        } else {
          // Cambio de fase
          if (isInhale) {
            runPhase(t('games.g5.exhale', {}, 'Exhala'), false);
          } else {
            // Siguiente ciclo
            cycleRef.current++;
            timer.flushDelta();
            if (cycleRef.current > 6 || timer.isTimeExpired) {
              finishBreathing();
            } else {
              setCycle(cycleRef.current);
              runPhase(t('games.g5.inhale', {}, 'Inhala'), true);
            }
          }
        }
      }, 1000);
    };

    stepCountdown();
  };

  const finishBreathing = async () => {
    clearAllTimeouts();
    const elapsed = timer.stopTimer();

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g5',
        mode: 'cognitive',
        durationSec: Math.max(1, elapsed),
        score: cycleRef.current,
        allSetsCompleted: true,
        sets: [{ set: 1, value: cycleRef.current }]
      }, true);
      setXpResult(res);
    }

    setStatus('finished');
  };

  const startBreathing = () => {
    clearAllTimeouts();
    timer.startTimer();
    cycleRef.current = 1;
    setCycle(1);
    setStatus('playing');
    runPhase(t('games.g5.inhale', {}, 'Inhala'), true);
  };

  return (
    <GameShell
      isOpen={isOpen}
      onClose={onClose}
      game={gameInfo}
      status={status}
      onStartGame={startBreathing}
      xpResult={xpResult}
      headerExtra={status === 'playing' ? (
        <GameLiveTimerChip
          formattedElapsed={timer.formattedElapsed}
          formattedRemaining={timer.formattedRemaining}
          isPaused={timer.isPaused}
          isTimeExpired={timer.isTimeExpired}
          category="cognitive"
        />
      ) : null}
      summaryStats={[
        { label: t('games.g5.statCycles', {}, 'Ciclos'), value: `${Math.min(6, cycle)} / 6` },
        { label: t('games.g5.statTempo', {}, 'Compás'), value: '4 s / 4 s' },
        { label: t('games.g5.statBenefit', {}, 'Beneficio'), value: 'Calma' }
      ]}
    >
      <div className="breath-stage">
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E3A8A' }}>
          {t('games.g5.cycleHeader', { current: cycle, total: 6 }, `Ciclo ${cycle} de 6`)}
        </div>

        {/* Anillo de respiración con transición suave de 4 segundos */}
        <div 
          className="breath-circle"
          style={{
            transform: isInhaling ? 'scale(1.22)' : 'scale(0.92)'
          }}
        >
          <span>{countdown}</span>
        </div>

        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          {phaseText}… {countdown}
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          {isInhaling 
            ? t('games.g5.inhaleTip', {}, 'Inhala despacio por la nariz llenando el abdomen') 
            : t('games.g5.exhaleTip', {}, 'Suelta el aire suavemente por la boca')}
        </p>
      </div>
    </GameShell>
  );
};

export default Respiracion44;
