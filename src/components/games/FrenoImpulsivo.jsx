import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from './GameShell';
import { useTranslation } from '../../hooks/useTranslation';

export const FrenoImpulsivo = ({ isOpen, onClose, onSessionFinished, adaptiveParams, currentLevel }) => {
  const { t } = useTranslation();

  const gameInfo = {
    id: 'g2',
    em: '🛑',
    t: t('games.g2.title', {}, 'Freno Impulsivo'),
    sk: t('games.g2.skill', {}, 'Autocontrol y decisión'),
    what: t('games.g2.what', {}, 'Frenar el impulso: decidir antes de actuar.'),
    steps: [
      t('games.g2.step1', {}, 'Aparece un cono en una de las casillas.'),
      t('games.g2.step2', {}, 'VERDE → tócalo rápido.'),
      t('games.g2.step3', {}, 'ROJO → NO lo toques, frena tu dedo.')
    ],
    why: t('games.g2.why', {}, 'La mayoría de errores vienen de actuar deprisa. El "freno" mejora el regate, evita faltas y ayuda a jugadores con TDAH.')
  };

  const [status, setStatus] = useState('intro'); // 'intro' | 'playing' | 'finished'
  const [isPractice, setIsPractice] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [totalStimuli, setTotalStimuli] = useState(4);
  const [activeCell, setActiveCell] = useState(null); // { cell: 0..8, red: bool }
  const [feedback, setFeedback] = useState({ text: 'Atento al cono…', type: '' });
  const [summary, setSummary] = useState({ acc: '0%', ms: '—', fa: 0 });
  const [xpResult, setXpResult] = useState(null);

  // Refs de estado interno
  const curTargetRef = useRef(null);
  const hitsRef = useRef(0);
  const faRef = useRef(0);
  const missRef = useRef(0);
  const crRef = useRef(0);
  const rtRef = useRef([]);
  const isPracticeRef = useRef(false);
  const currentSetRef = useRef(0);
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

  const nextStimulus = useCallback((practiceMode) => {
    curTargetRef.current = null;
    setActiveCell(null);

    setStimulusIndex(prev => {
      const nextIdx = prev + 1;
      const tot = practiceMode ? 4 : 10;

      if (nextIdx > tot) {
        if (practiceMode) {
          // Pasar a sets oficiales
          currentSetRef.current = 1;
          setCurrentSet(1);
          isPracticeRef.current = false;
          setIsPractice(false);
          setTotalStimuli(10);
          setStimulusIndex(1);
          hitsRef.current = 0;
          faRef.current = 0;
          missRef.current = 0;
          crRef.current = 0;
          rtRef.current = [];
          spawnStimulus(false);
        } else if (currentSetRef.current < 3) {
          currentSetRef.current += 1;
          setCurrentSet(currentSetRef.current);
          setStimulusIndex(1);
          spawnStimulus(false);
        } else {
          finishGame();
        }
        return nextIdx;
      }

      spawnStimulus(practiceMode);
      return nextIdx;
    });
  }, []);

  const spawnStimulus = (practiceMode) => {
    setFeedback({ text: t('games.g2.prepare', {}, 'Atento al cono…'), type: '' });

    addTimeout(() => {
      const cell = Math.floor(Math.random() * 9);
      const redRatio = adaptiveParams?.redPct ?? 0.30;
      const winTime = adaptiveParams?.window ?? 1400;
      const red = Math.random() < redRatio;
      curTargetRef.current = { cell, red, at: performance.now(), done: false };
      setActiveCell({ cell, red });

      // Ventana de tiempo adaptativa
      addTimeout(() => {
        resolveStimulus(null, isPracticeRef.current);
      }, winTime);

    }, 500 + Math.random() * 900);
  };

  const resolveStimulus = (tappedIndex, practiceMode) => {
    if (!curTargetRef.current || curTargetRef.current.done) return;
    curTargetRef.current.done = true;

    const rt = Math.round(performance.now() - curTargetRef.current.at);
    let msg = '';
    let cls = '';

    const isRed = curTargetRef.current.red;
    const wasTapped = tappedIndex !== null;

    if (!isRed && wasTapped) {
      if (!practiceMode) {
        hitsRef.current++;
        rtRef.current.push(rt);
      }
      msg = `✅ ¡Bien! ${rt} ms`;
      cls = 'good';
    } else if (isRed && wasTapped) {
      if (!practiceMode) faRef.current++;
      msg = t('games.g2.faMsg', {}, '🚫 Era rojo: había que frenar.');
      cls = 'bad';
    } else if (!isRed && !wasTapped) {
      if (!practiceMode) missRef.current++;
      msg = t('games.g2.missMsg', {}, '⏱️ Se te escapó el verde.');
      cls = 'warn';
    } else {
      // isRed && !wasTapped
      if (!practiceMode) crRef.current++;
      msg = t('games.g2.crMsg', {}, '🛑 ¡Freno perfecto!');
      cls = 'good';
    }

    setFeedback({ text: msg, type: cls });

    addTimeout(() => {
      nextStimulus(practiceMode);
    }, 800);
  };

  const handleCellTap = (index) => {
    if (!curTargetRef.current || curTargetRef.current.done) return;
    if (index !== curTargetRef.current.cell) return;
    resolveStimulus(index, isPracticeRef.current);
  };

  const finishGame = async () => {
    clearAllTimeouts();
    const total = hitsRef.current + faRef.current + missRef.current + crRef.current;
    const acc = total ? Math.round(((hitsRef.current + crRef.current) / total) * 100) : 0;
    const avgRt = rtRef.current.length ? Math.round(rtRef.current.reduce((a, b) => a + b, 0) / rtRef.current.length) : null;

    const finalSummary = {
      acc: `${acc}%`,
      ms: avgRt ? `${avgRt} ms` : '—',
      fa: faRef.current
    };
    setSummary(finalSummary);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g2',
        gameIdCode: 'freno',
        mode: 'cognitive',
        accuracy: acc,
        score: acc,
        allSetsCompleted: true,
        sets: [{ set: 1 }, { set: 2 }, { set: 3 }],
        metrics: { p: acc, ff: faRef.current }
      }, true);
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
    setTotalStimuli(4);
    hitsRef.current = 0;
    faRef.current = 0;
    missRef.current = 0;
    crRef.current = 0;
    rtRef.current = [];
    setStatus('playing');
    spawnStimulus(true);
  };

  const startGameOfficial = () => {
    clearAllTimeouts();
    isPracticeRef.current = false;
    setIsPractice(false);
    currentSetRef.current = 1;
    setCurrentSet(1);
    setStimulusIndex(1);
    setTotalStimuli(10);
    hitsRef.current = 0;
    faRef.current = 0;
    missRef.current = 0;
    crRef.current = 0;
    rtRef.current = [];
    setStatus('playing');
    spawnStimulus(false);
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
        { label: t('games.g2.statAcc', {}, 'Precisión'), value: summary.acc },
        { label: t('games.g2.statRt', {}, 'Tiempo medio'), value: summary.ms },
        { label: t('games.g2.statFa', {}, 'Frenadas fallidas'), value: summary.fa }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: isPractice ? '#f59e0b' : '#1E3A8A' }}>
            {isPractice ? t('games.status.practice', {}, 'Práctica (no puntúa)') : `Set ${currentSet} de 3`}
          </span>
          <span style={{ color: '#64748b' }}>
            Estímulo {stimulusIndex} de {totalStimuli}
          </span>
        </div>

        {/* Cuadrícula 3x3 */}
        <div className="freno-grid">
          {Array.from({ length: 9 }).map((_, i) => {
            const hasCone = activeCell && activeCell.cell === i;
            return (
              <button
                key={i}
                type="button"
                className="freno-cell"
                onClick={() => handleCellTap(i)}
                aria-label={`Casilla ${i + 1}`}
              >
                {hasCone && (
                  <span className="freno-cone">
                    {activeCell.red ? '🛑' : '🟢'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        <div className={`game-fb-box ${feedback.type}`}>
          {feedback.text}
        </div>
      </div>
    </GameShell>
  );
};

export default FrenoImpulsivo;
