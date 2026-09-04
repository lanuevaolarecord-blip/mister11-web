import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from './GameShell';
import { useTranslation } from '../../hooks/useTranslation';

const OPTIONS = ['TIRO', 'PASE', 'CONDUCCIÓN'];

export const DecisionSegundo = ({ isOpen, onClose, onSessionFinished }) => {
  const { t } = useTranslation();

  const gameInfo = {
    id: 'g6',
    em: '⚡',
    t: t('games.g6.title', {}, 'Decisión 1 Segundo'),
    sk: t('games.g6.skill', {}, 'Lectura táctica'),
    what: t('games.g6.what', {}, 'Elegir la mejor acción en un vistazo: pase, tiro o conducción.'),
    steps: [
      t('games.g6.step1', {}, 'Lee las 3 pistas en pantalla.'),
      t('games.g6.step2', {}, 'Portería LIBRE → TIRO.'),
      t('games.g6.step3', {}, 'Si no, compañero LIBRE → PASE. Si no → CONDUCCIÓN (4 s por turno).')
    ],
    why: t('games.g6.why', {}, 'El fútbol se juega con la cabeza: decidir rápido y bien marca la diferencia entre un jugador bueno y uno excelente.')
  };

  const [status, setStatus] = useState('intro');
  const [isPractice, setIsPractice] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [totalStimuli, setTotalStimuli] = useState(2);
  const [clues, setClues] = useState({ goal: 'LIBRE', mate: 'MARCADO', space: 'CERRADO' });
  const [timeLeft, setTimeLeft] = useState(4);
  const [feedback, setFeedback] = useState({ text: '¡Decide rápido!', type: '' });
  const [summary, setSummary] = useState({ acc: '0%', ms: '—' });
  const [xpResult, setXpResult] = useState(null);

  const curRef = useRef(null); // { correct, at, done }
  const okRef = useRef(0);
  const rtRef = useRef([]);
  const isPracticeRef = useRef(false);
  const currentSetRef = useRef(0);
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

  const nextScenario = useCallback((practiceMode) => {
    clearAllTimeouts();

    setStimulusIndex(prev => {
      const nextIdx = prev + 1;
      const tot = practiceMode ? 2 : 6;

      if (nextIdx > tot) {
        if (practiceMode) {
          currentSetRef.current = 1;
          setCurrentSet(1);
          isPracticeRef.current = false;
          setIsPractice(false);
          setTotalStimuli(6);
          setStimulusIndex(1);
          okRef.current = 0;
          rtRef.current = [];
          spawnScenario(false);
        } else if (currentSetRef.current < 3) {
          currentSetRef.current += 1;
          setCurrentSet(currentSetRef.current);
          setStimulusIndex(1);
          spawnScenario(false);
        } else {
          finishGame();
        }
        return nextIdx;
      }

      spawnScenario(practiceMode);
      return nextIdx;
    });
  }, []);

  const spawnScenario = (practiceMode) => {
    const correct = OPTIONS[Math.floor(Math.random() * 3)];
    curRef.current = { correct, at: performance.now(), done: false };

    const keeper = correct !== 'TIRO';
    const mate = correct === 'PASE' ? 'LIBRE' : (correct === 'TIRO' ? (Math.random() < 0.5 ? 'LIBRE' : 'MARCADO') : 'MARCADO');
    const space = correct === 'CONDUCCIÓN' ? 'LIBRE' : 'CERRADO';

    setClues({
      goal: keeper ? 'CON PORTERO' : 'LIBRE',
      mate,
      space
    });

    setTimeLeft(4);
    setFeedback({ text: t('games.g6.prompt', {}, '¡Decide rápido!'), type: '' });

    // Temporizador de 4 segundos
    let currentSec = 4;
    timerIntervalRef.current = setInterval(() => {
      currentSec--;
      setTimeLeft(Math.max(0, currentSec));

      if (currentSec <= 0) {
        clearInterval(timerIntervalRef.current);
        if (curRef.current && !curRef.current.done) {
          curRef.current.done = true;
          setFeedback({
            text: t('games.g6.timeOutMsg', { option: correct }, `⏱️ Tiempo. La mejor opción era ${correct}.`),
            type: 'warn'
          });

          addTimeout(() => {
            nextScenario(practiceMode);
          }, 1200);
        }
      }
    }, 1000);
  };

  const handlePick = (option) => {
    if (!curRef.current || curRef.current.done) return;
    curRef.current.done = true;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const rt = Math.round(performance.now() - curRef.current.at);
    const isOk = option === curRef.current.correct;

    if (isOk) {
      if (!isPracticeRef.current) {
        okRef.current++;
        rtRef.current.push(rt);
      }
      setFeedback({
        text: `✅ ¡Decisión correcta! ${rt} ms`,
        type: 'good'
      });
    } else {
      setFeedback({
        text: `❌ La mejor opción era ${curRef.current.correct}.`,
        type: 'bad'
      });
    }

    addTimeout(() => {
      nextScenario(isPracticeRef.current);
    }, 1100);
  };

  const finishGame = async () => {
    clearAllTimeouts();
    const acc = Math.round((okRef.current / 18) * 100);
    const avgRt = rtRef.current.length
      ? Math.round(rtRef.current.reduce((a, b) => a + b, 0) / rtRef.current.length)
      : null;

    const finalSummary = {
      acc: `${acc}%`,
      ms: avgRt ? `${(avgRt / 1000).toFixed(1)} s` : '—'
    };
    setSummary(finalSummary);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g6',
        mode: 'cognitive',
        accuracy: acc,
        reactionMs: avgRt,
        score: acc,
        allSetsCompleted: true,
        sets: [{ set: 1 }, { set: 2 }, { set: 3 }]
      }, true); // higher accuracy is better
      setXpResult(res);
    }

    setStatus('finished');
  };

  const startPractice = () => {
    clearAllTimeouts();
    isPracticeRef.current = true;
    setIsPractice(true);
    currentSetRef.current = 0;
    setCurrentSet(0);
    setStimulusIndex(1);
    setTotalStimuli(2);
    okRef.current = 0;
    rtRef.current = [];
    setStatus('playing');
    spawnScenario(true);
  };

  const startGameOfficial = () => {
    clearAllTimeouts();
    isPracticeRef.current = false;
    setIsPractice(false);
    currentSetRef.current = 1;
    setCurrentSet(1);
    setStimulusIndex(1);
    setTotalStimuli(6);
    okRef.current = 0;
    rtRef.current = [];
    setStatus('playing');
    spawnScenario(false);
  };

  return (
    <GameShell
      isOpen={isOpen}
      onClose={onClose}
      game={gameInfo}
      status={status}
      onStartPractice={startPractice}
      onStartGame={startGameOfficial}
      xpResult={xpResult}
      summaryStats={[
        { label: t('games.g6.statAcc', {}, 'Aciertos'), value: `${okRef.current} / 18` },
        { label: t('games.g6.statPct', {}, 'Precisión'), value: summary.acc },
        { label: t('games.g6.statTime', {}, 'Tiempo medio'), value: summary.ms }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: isPractice ? '#f59e0b' : '#1E3A8A' }}>
            {isPractice ? t('games.status.practice', {}, 'Práctica (no puntúa)') : `Set ${currentSet} de 3`}
          </span>
          <span style={{ color: timeLeft <= 1 ? '#ef4444' : '#1E3A8A' }}>
            ⏱️ {timeLeft}s (Escenario {stimulusIndex} de {totalStimuli})
          </span>
        </div>

        {/* Pistas Tácticas */}
        <div className="decision-clues">
          <div className="decision-clue-item">
            <span>🥅 {t('games.g6.clueGoal', {}, 'Portería:')}</span>
            <span style={{ color: clues.goal === 'LIBRE' ? '#16a34a' : '#ef4444' }}>
              {clues.goal}
            </span>
          </div>
          <div className="decision-clue-item">
            <span>🟢 {t('games.g6.clueMate', {}, 'Compañero:')}</span>
            <span style={{ color: clues.mate === 'LIBRE' ? '#16a34a' : '#ef4444' }}>
              {clues.mate}
            </span>
          </div>
          <div className="decision-clue-item">
            <span>🏃 {t('games.g6.clueSpace', {}, 'Espacio libre:')}</span>
            <span style={{ color: clues.space === 'LIBRE' ? '#16a34a' : '#ef4444' }}>
              {clues.space}
            </span>
          </div>
        </div>

        {/* Feedback */}
        <div className={`game-fb-box ${feedback.type}`}>
          {feedback.text}
        </div>

        {/* Botones de Decisión (TIRO / PASE / CONDUCCIÓN) */}
        <div className="decision-buttons-row">
          <button
            type="button"
            className="decision-btn"
            onClick={() => handlePick('TIRO')}
          >
            ⚽ {t('games.g6.optShoot', {}, 'TIRO')}
          </button>
          <button
            type="button"
            className="decision-btn"
            onClick={() => handlePick('PASE')}
          >
            👟 {t('games.g6.optPass', {}, 'PASE')}
          </button>
          <button
            type="button"
            className="decision-btn"
            onClick={() => handlePick('CONDUCCIÓN')}
          >
            ⚡ {t('games.g6.optDribble', {}, 'CONDUCCIÓN')}
          </button>
        </div>
      </div>
    </GameShell>
  );
};

export default DecisionSegundo;
