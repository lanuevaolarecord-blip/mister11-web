import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from './GameShell';
import { useTranslation } from '../../hooks/useTranslation';

const CONE_COLORS = ['blue', 'pink', 'sage'];

export const MemoriaConos = ({ isOpen, onClose, onSessionFinished }) => {
  const { t } = useTranslation();

  const gameInfo = {
    id: 'g4',
    em: '🔺',
    t: t('games.g4.title', {}, 'Memoria de Conos'),
    sk: t('games.g4.skill', {}, 'Memoria de trabajo'),
    what: t('games.g4.what', {}, 'Recordar información bajo presión.'),
    steps: [
      t('games.g4.step1', {}, 'Observa el orden en que se iluminan los conos.'),
      t('games.g4.step2', {}, 'Repite la secuencia tocando los mismos conos.'),
      t('games.g4.step3', {}, 'Cada ronda la secuencia es más larga.')
    ],
    why: t('games.g4.why', {}, 'Recordar consignas y movimientos mejora la atención y la comprensión táctica: la "pizarra mental" del jugador.')
  };

  const [status, setStatus] = useState('intro');
  const [isPractice, setIsPractice] = useState(false);
  const [currentLength, setCurrentLength] = useState(2);
  const [litIndex, setLitIndex] = useState(null);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [feedback, setFeedback] = useState({ text: 'Observa…', type: '' });
  const [summary, setSummary] = useState({ maxLen: '—', okCount: 0 });
  const [xpResult, setXpResult] = useState(null);

  const seqRef = useRef([]);
  const userIdxRef = useRef(0);
  const maxOkRef = useRef(0);
  const okCountRef = useRef(0);
  const isPracticeRef = useRef(false);
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

  const playSequence = (length) => {
    clearAllTimeouts();
    setInputEnabled(false);
    userIdxRef.current = 0;
    setCurrentLength(length);

    // Generar secuencia aleatoria de longitud `length`
    const sequence = Array.from({ length }, () => Math.floor(Math.random() * 9));
    seqRef.current = sequence;

    setFeedback({
      text: t('games.g4.watch', {}, 'Observa con atención…'),
      type: ''
    });

    // Reproducción de la secuencia con tiempos escalonados
    sequence.forEach((coneIdx, i) => {
      addTimeout(() => {
        setLitIndex(coneIdx);
        addTimeout(() => {
          setLitIndex(null);
        }, 450);
      }, 600 + i * 750);
    });

    // Habilitar entrada del usuario al terminar la animación
    addTimeout(() => {
      setInputEnabled(true);
      userIdxRef.current = 0;
      setFeedback({
        text: t('games.g4.repeat', {}, '¡Repite la secuencia!'),
        type: 'good'
      });
    }, 600 + sequence.length * 750 + 200);
  };

  const handleConeTap = (index) => {
    if (!inputEnabled) return;

    // Destello de toque rápido
    setLitIndex(index);
    addTimeout(() => setLitIndex(null), 300);

    const expected = seqRef.current[userIdxRef.current];
    const isCorrect = index === expected;

    if (isCorrect) {
      userIdxRef.current++;

      if (userIdxRef.current === seqRef.current.length) {
        // Secuencia completada con éxito
        setInputEnabled(false);
        if (!isPracticeRef.current) {
          okCountRef.current++;
          maxOkRef.current = Math.max(maxOkRef.current, seqRef.current.length);
        }
        setFeedback({
          text: t('games.g4.correctMsg', {}, '✅ ¡Secuencia perfecta!'),
          type: 'good'
        });

        addTimeout(() => {
          advanceGame();
        }, 900);
      }
    } else {
      // Fallo
      setInputEnabled(false);
      setFeedback({
        text: t('games.g4.missMsg', {}, '❌ Casi. Sigue intentando.'),
        type: 'bad'
      });

      addTimeout(() => {
        advanceGame();
      }, 900);
    }
  };

  const advanceGame = () => {
    if (isPracticeRef.current) {
      isPracticeRef.current = false;
      setIsPractice(false);
      playSequence(3);
    } else if (seqRef.current.length < 8) {
      playSequence(seqRef.current.length + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    clearAllTimeouts();
    const max = maxOkRef.current;
    const okTotal = okCountRef.current;

    const finalSummary = {
      maxLen: max > 0 ? `${max} conos` : '—',
      okCount: okTotal
    };
    setSummary(finalSummary);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g4',
        mode: 'cognitive',
        score: max,
        allSetsCompleted: true,
        sets: [{ set: 1, value: max }]
      }, true); // higher length is better
      setXpResult(res);
    }

    setStatus('finished');
  };

  const startPractice = () => {
    clearAllTimeouts();
    isPracticeRef.current = true;
    setIsPractice(true);
    maxOkRef.current = 0;
    okCountRef.current = 0;
    setStatus('playing');
    playSequence(2);
  };

  const startGameOfficial = () => {
    clearAllTimeouts();
    isPracticeRef.current = false;
    setIsPractice(false);
    maxOkRef.current = 0;
    okCountRef.current = 0;
    setStatus('playing');
    playSequence(3);
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
        { label: t('games.g4.statMax', {}, 'Máx. secuencia'), value: summary.maxLen },
        { label: t('games.g4.statOk', {}, 'Rondas acertadas'), value: summary.okCount },
        { label: t('games.g4.statRange', {}, 'Rango'), value: '3 a 8' }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: isPractice ? '#f59e0b' : '#1E3A8A' }}>
            {isPractice ? t('games.status.practice', {}, 'Práctica') : `Secuencia de ${currentLength}`}
          </span>
          <span style={{ color: '#64748b' }}>
            Progreso: {userIdxRef.current} / {currentLength}
          </span>
        </div>

        {/* Cuadrícula de 9 conos */}
        <div className="memoria-grid">
          {Array.from({ length: 9 }).map((_, i) => {
            const isLit = litIndex === i;
            const col = CONE_COLORS[i % 3];
            return (
              <button
                key={i}
                type="button"
                className={`memoria-cone-btn ${isLit ? 'lit' : ''}`}
                onClick={() => handleConeTap(i)}
                disabled={!inputEnabled}
                aria-label={`Cono ${i + 1}`}
              >
                <span>{isLit ? '✨' : (col === 'blue' ? '🔷' : col === 'pink' ? '🔶' : '🔺')}</span>
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

export default MemoriaConos;
