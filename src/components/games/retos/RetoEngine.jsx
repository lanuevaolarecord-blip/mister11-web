import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../GameShell';
import { GameLiveTimerChip } from '../GameLiveTimerChip';
import { useGameTimer } from '../../../hooks/useGameTimer';
import { useTranslation } from '../../../hooks/useTranslation';

export const RetoEngine = ({ 
  isOpen, 
  onClose, 
  reto, 
  onSessionFinished,
  recordTimeDelta = null,
  startSession = null,
  remainingChallengeSeconds = 1200
}) => {
  const { t } = useTranslation();

  const timer = useGameTimer({
    category: 'retos',
    initialRemainingSeconds: remainingChallengeSeconds,
    recordTimeDelta,
    startSession
  });

  const [status, setStatus] = useState('intro'); // 'intro' | 'playing' | 'finished'
  const [currentSet, setCurrentSet] = useState(0);
  const [setCount, setSetCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [summary, setSummary] = useState({ metricVal: '—', metricName: '' });
  const [xpResult, setXpResult] = useState(null);

  const valsRef = useRef([]);
  const countRef = useRef(0);
  const timeoutsRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const addTimeout = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  if (!reto) return null;

  const currentRoundData = reto.rounds ? reto.rounds[currentSet] : null;

  const startReto = () => {
    clearAllTimeouts();
    timer.startTimer();
    valsRef.current = [];
    setCurrentSet(0);
    setStatus('playing');
    prepareSet(0);
  };

  const prepareSet = (setIdx) => {
    countRef.current = 0;
    setSetCount(0);
    setTimerSeconds(null);
    setTimerRunning(false);
    setShowQuestion(false);

    if (reto.mode === 'timer') {
      setTimerSeconds(reto.seg);
    }
  };

  const startTimer = () => {
    setTimerRunning(true);
    let sec = reto.seg;
    setTimerSeconds(sec);

    timerIntervalRef.current = setInterval(() => {
      sec--;
      setTimerSeconds(Math.max(0, sec));

      if (sec <= 0) {
        clearInterval(timerIntervalRef.current);
        setTimerRunning(false);
        setShowQuestion(true);
      }
    }, 1000);
  };

  const handleIncrement = () => {
    countRef.current += 1;
    setSetCount(countRef.current);
  };

  const handleFinishCountOrStreak = () => {
    valsRef.current.push(countRef.current);
    advanceSet();
  };

  const handleAnswerQuestion = (success) => {
    valsRef.current.push(success ? 1 : 0);
    setShowQuestion(false);
    advanceSet();
  };

  const advanceSet = () => {
    // Flush delta acumulado al terminar el set
    timer.flushDelta();

    // Si se agotó el tiempo diario, nunca cortar el set a mitad; permitir concluir positivamente
    if (timer.isTimeExpired) {
      finishReto();
      return;
    }

    const nextS = currentSet + 1;
    if (nextS < reto.sets) {
      setCurrentSet(nextS);
      prepareSet(nextS);
    } else {
      finishReto();
    }
  };

  const finishReto = async () => {
    clearAllTimeouts();
    const elapsed = timer.stopTimer();

    const vals = valsRef.current;
    let finalVal = 0;
    let formattedVal = '';

    if (reto.mode === 'timer') {
      const sum = vals.reduce((a, b) => a + b, 0);
      finalVal = sum;
      formattedVal = `${sum} / ${reto.sets} sets`;
    } else if (reto.mode === 'count') {
      const sum = vals.reduce((a, b) => a + b, 0);
      finalVal = sum;
      formattedVal = `${sum} repeticiones`;
    } else {
      // streak
      const maxStreak = vals.length ? Math.max(...vals) : 0;
      finalVal = maxStreak;
      formattedVal = `${maxStreak} toques seguidos`;
    }

    setSummary({
      metricVal: formattedVal,
      metricName: reto.metric
    });

    const doneCount = vals.filter(v => v > 0).length;
    const allSetsDone = doneCount === reto.sets;
    const durationSec = Math.max(1, elapsed);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: reto.id,
        mode: 'challenge',
        durationSec,
        score: finalVal,
        allSetsCompleted: allSetsDone,
        sets: vals.map((v, i) => ({ set: i + 1, value: v }))
      }, true);
      setXpResult(res);
    }

    setStatus('finished');
  };

  return (
    <GameShell
      isOpen={isOpen}
      onClose={onClose}
      game={reto}
      status={status}
      onStartGame={startReto}
      xpResult={xpResult}
      safetyNote={reto.safetyNote}
      honestyPact={true}
      headerExtra={status === 'playing' ? (
        <GameLiveTimerChip
          formattedElapsed={timer.formattedElapsed}
          formattedRemaining={timer.formattedRemaining}
          isPaused={timer.isPaused}
          isTimeExpired={timer.isTimeExpired}
          category="retos"
        />
      ) : null}
      summaryStats={[
        { label: reto.metric, value: summary.metricVal },
        { label: t('games.retos.statSets', {}, 'Sets'), value: `${currentSet + 1} / ${reto.sets}` },
        { label: t('games.retos.statStatus', {}, 'Resultado'), value: 'Completado' }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {/* Cabecera del set */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: '#1E3A8A' }}>
            Set {currentSet + 1} de {reto.sets}
          </span>
          <span style={{ color: '#64748b' }}>
            {reto.mode === 'count' ? `Objetivo: ${reto.target} reps` : (reto.mode === 'timer' ? `${reto.seg}s por set` : 'Racha')}
          </span>
        </div>

        {/* TARJETA DE CONSIGNA DE LA RONDA */}
        <div className="reto-round-card">
          <div className="reto-round-icon">
            {currentRoundData ? currentRoundData.e : reto.em}
          </div>
          <p className="reto-round-desc">
            {currentRoundData ? currentRoundData.d : reto.what}
          </p>
        </div>

        {/* MODO TIMER */}
        {reto.mode === 'timer' && (
          <div className="reto-timer-wrapper">
            {!timerRunning && !showQuestion && (
              <button
                type="button"
                className="game-session-launch-btn"
                onClick={startTimer}
              >
                ⏱️ {t('games.retos.startTimer', {}, 'Comenzar Tiempo')}
              </button>
            )}

            {timerRunning && (
              <div className="reto-counter-val">
                {timerSeconds}s
              </div>
            )}

            {showQuestion && (
              <div className="reto-question-box">
                <p className="reto-question-text">
                  {t('games.retos.questionTimer', {}, '¿Lograste mantener el ejercicio durante todo el tiempo?')}
                </p>
                <div className="reto-question-actions">
                  <button
                    type="button"
                    className="game-session-launch-btn"
                    onClick={() => handleAnswerQuestion(true)}
                  >
                    ✅ {t('common.yes', {}, 'Sí, superado')}
                  </button>
                  <button
                    type="button"
                    className="game-practice-launch-btn"
                    onClick={() => handleAnswerQuestion(false)}
                  >
                    ❌ {t('common.no', {}, 'No esta vez')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO COUNT O STREAK */}
        {(reto.mode === 'count' || reto.mode === 'streak') && (
          <div className="reto-count-wrapper">
            <div className="reto-counter-val">
              {setCount} {reto.target ? `/ ${reto.target}` : ''}
            </div>

            {/* Botón táctil grande +1 */}
            <button
              type="button"
              className="reto-tap-btn"
              onClick={handleIncrement}
            >
              ➕ {t('games.retos.addRep', {}, '+1 Repetición')}
            </button>

            {/* Botón de fin de set o caída de racha */}
            <button
              type="button"
              className={`reto-finish-btn ${reto.mode === 'streak' ? 'streak' : 'count'}`}
              onClick={handleFinishCountOrStreak}
            >
              {reto.mode === 'streak' 
                ? t('games.retos.streakEnd', {}, 'Se cayó / Fin de racha') 
                : t('games.retos.finishSet', {}, 'Terminar Set ✔')}
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default RetoEngine;
