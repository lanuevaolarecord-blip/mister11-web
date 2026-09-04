import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from './GameShell';
import { useTranslation } from '../../hooks/useTranslation';

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export const SemaforoPro = ({ isOpen, onClose, onSessionFinished }) => {
  const { t } = useTranslation();

  const gameInfo = {
    id: 'g1',
    em: '🚦',
    t: t('games.g1.title', {}, 'Semáforo Pro'),
    sk: t('games.g1.skill', {}, 'Velocidad de reacción'),
    what: t('games.g1.what', {}, 'Reaccionar en milisegundos: salir al balón antes que el rival.'),
    steps: [
      t('games.g1.step1', {}, 'Espera en rojo.'),
      t('games.g1.step2', {}, 'Toca la pantalla al ponerse VERDE.'),
      t('games.g1.step3', {}, 'Tocar antes = salida en falso.')
    ],
    why: t('games.g1.why', {}, 'Llegar 0,2 s antes a un balón dividido cambia la jugada. La reacción se entrena y se transfiere a salidas e interceptaciones.')
  };

  const [status, setStatus] = useState('intro'); // 'intro' | 'playing' | 'finished'
  const [isPractice, setIsPractice] = useState(false);
  const [currentSet, setCurrentSet] = useState(0); // 0=practice, 1..3
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [totalStimuli, setTotalStimuli] = useState(2);
  const [activeBulb, setActiveBulb] = useState('red'); // 'red' | 'amber' | 'green'
  const [feedback, setFeedback] = useState({ text: 'Espera al verde…', type: '' });
  const [lastReaction, setLastReaction] = useState(null);
  const [summary, setSummary] = useState({ median: null, best: null, falses: 0 });
  const [xpResult, setXpResult] = useState(null);

  // Refs de estado para evitar condiciones de carrera y mantener token anti-bugs
  const tokRef = useRef(0);
  const lockRef = useRef(false);
  const greenAtRef = useRef(0);
  const reactionsRef = useRef([]);
  const falsesRef = useRef(0);
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
    tokRef.current++;
    const myTok = tokRef.current;
    lockRef.current = false;
    
    setStimulusIndex(prev => {
      const nextIdx = prev + 1;
      const tot = practiceMode ? 2 : 8;

      if (nextIdx > tot) {
        // Fin de bloque
        if (practiceMode) {
          // Pasar a sets oficiales
          currentSetRef.current = 1;
          setCurrentSet(1);
          isPracticeRef.current = false;
          setIsPractice(false);
          setTotalStimuli(8);
          setStimulusIndex(1);
          reactionsRef.current = [];
          falsesRef.current = 0;
          runStimulusCycle(myTok, false);
        } else if (currentSetRef.current < 3) {
          // Siguiente set oficial
          currentSetRef.current += 1;
          setCurrentSet(currentSetRef.current);
          setStimulusIndex(1);
          runStimulusCycle(myTok, false);
        } else {
          // Fin del juego oficial
          finishGame();
        }
        return nextIdx;
      }

      runStimulusCycle(myTok, practiceMode);
      return nextIdx;
    });
  }, []);

  const runStimulusCycle = (expectedTok, practiceMode) => {
    setActiveBulb('red');
    setFeedback({ text: t('games.g1.waitGreen', {}, 'Espera al verde…'), type: '' });

    addTimeout(() => {
      if (expectedTok !== tokRef.current) return;
      setActiveBulb('amber');

      const amberDelay = 800 + Math.random() * 2200;
      addTimeout(() => {
        if (expectedTok !== tokRef.current) return;
        setActiveBulb('green');
        greenAtRef.current = performance.now();

        // Si tarda más de 1500 ms = fallo por lentitud
        addTimeout(() => {
          if (expectedTok !== tokRef.current) return;
          lockRef.current = true;
          setFeedback({ text: t('games.g1.tooSlow', {}, '¡Muy lento! Fallo.'), type: 'warn' });
          addTimeout(() => {
            if (expectedTok === tokRef.current) {
              nextStimulus(isPracticeRef.current);
            }
          }, 900);
        }, 1500);

      }, amberDelay);
    }, 600);
  };

  const finishGame = async () => {
    clearAllTimeouts();
    const med = median(reactionsRef.current);
    const best = reactionsRef.current.length ? Math.min(...reactionsRef.current) : null;
    const finalSummary = {
      median: med ? `${med} ms` : '—',
      best: best ? `${best} ms` : '—',
      falses: falsesRef.current
    };
    setSummary(finalSummary);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g1',
        mode: 'cognitive',
        reactionMs: med,
        score: med,
        allSetsCompleted: true,
        sets: [{ set: 1 }, { set: 2 }, { set: 3 }]
      }, false); // lower is better for reaction time
      setXpResult(res);
    }

    setStatus('finished');
  };

  const startPractice = () => {
    clearAllTimeouts();
    tokRef.current++;
    isPracticeRef.current = true;
    setIsPractice(true);
    setCurrentSetRef.current = 0;
    setCurrentSet(0);
    setStimulusIndex(1);
    setTotalStimuli(2);
    reactionsRef.current = [];
    falsesRef.current = 0;
    setStatus('playing');
    runStimulusCycle(tokRef.current, true);
  };

  const startGameOfficial = () => {
    clearAllTimeouts();
    tokRef.current++;
    isPracticeRef.current = false;
    setIsPractice(false);
    currentSetRef.current = 1;
    setCurrentSet(1);
    setStimulusIndex(1);
    setTotalStimuli(8);
    reactionsRef.current = [];
    falsesRef.current = 0;
    setStatus('playing');
    runStimulusCycle(tokRef.current, false);
  };

  const handleTap = () => {
    if (status !== 'playing' || lockRef.current) return;
    lockRef.current = true;
    tokRef.current++;

    if (activeBulb === 'green') {
      const ms = Math.round(performance.now() - greenAtRef.current);
      if (!isPracticeRef.current) {
        reactionsRef.current.push(ms);
      }
      setLastReaction(ms);

      const msg = ms < 300 
        ? `⚡ ${ms} ms ¡Rapidísimo!` 
        : ms < 450 
          ? `✅ ${ms} ms ¡Bien!` 
          : `${ms} ms`;
      setFeedback({ text: msg, type: 'good' });
    } else {
      if (!isPracticeRef.current) {
        falsesRef.current++;
      }
      setFeedback({ text: t('games.g1.falseStart', {}, '🚫 Salida en falso.'), type: 'bad' });
    }

    addTimeout(() => {
      nextStimulus(isPracticeRef.current);
    }, 900);
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
        { label: t('games.g1.statMedian', {}, 'Mediana'), value: summary.median },
        { label: t('games.g1.statBest', {}, 'Mejor marca'), value: summary.best },
        { label: t('games.g1.statFalses', {}, 'Salidas falso'), value: summary.falses }
      ]}
    >
      <div className="semaforo-stage">
        {/* Cabecera del set */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: isPractice ? '#f59e0b' : '#1E3A8A' }}>
            {isPractice ? t('games.status.practice', {}, 'Práctica (no puntúa)') : `Set ${currentSet} de 3`}
          </span>
          <span style={{ color: '#64748b' }}>
            Estímulo {stimulusIndex} de {totalStimuli}
          </span>
        </div>

        {/* Semáforo */}
        <div className="semaforo-box">
          <div className={`semaforo-bulb ${activeBulb === 'red' ? 'on-red' : ''}`} />
          <div className={`semaforo-bulb ${activeBulb === 'amber' ? 'on-amber' : ''}`} />
          <div className={`semaforo-bulb ${activeBulb === 'green' ? 'on-green' : ''}`} />
        </div>

        {/* Feedback */}
        <div className={`game-fb-box ${feedback.type}`}>
          {feedback.text}
        </div>

        {/* Zona táctil grande (touch target para pulgar) */}
        <button
          type="button"
          className="semaforo-tap-area"
          onClick={handleTap}
        >
          {activeBulb === 'green' 
            ? t('games.g1.tapNow', {}, '¡PULSA AHORA!') 
            : t('games.g1.tapAreaPrompt', {}, 'Toca aquí al ponerse en VERDE')}
        </button>
      </div>
    </GameShell>
  );
};

export default SemaforoPro;
