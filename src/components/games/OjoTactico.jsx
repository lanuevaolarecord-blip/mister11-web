import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from './GameShell';
import { useTranslation } from '../../hooks/useTranslation';

const genField = () => {
  let out = null;
  for (let t = 0; t < 300 && !out; t++) {
    const mates = [];
    const rivals = [];
    let g = 0;
    while (mates.length < 6 && g++ < 300) {
      const x = 8 + Math.random() * 84;
      const y = 10 + Math.random() * 80;
      if ([...mates, ...rivals].every(d => Math.hypot(d.x - x, d.y - y) > 13)) {
        mates.push({ x, y });
      }
    }
    g = 0;
    while (rivals.length < 6 && g++ < 300) {
      const x = 8 + Math.random() * 84;
      const y = 10 + Math.random() * 80;
      if ([...mates, ...rivals].every(d => Math.hypot(d.x - x, d.y - y) > 13)) {
        rivals.push({ x, y });
      }
    }
    if (mates.length < 6 || rivals.length < 6) continue;

    const sc = mates.map((m, i) => ({
      i,
      min: Math.min(...rivals.map(r => Math.hypot(m.x - r.x, m.y - r.y)))
    })).sort((a, b) => b.min - a.min);

    if (sc[0].min >= 16 && (sc[0].min - sc[1].min >= 5)) {
      out = { mates, rivals, target: sc[0].i };
    }
  }

  return out || {
    mates: [
      { x: 20, y: 20 }, { x: 50, y: 30 }, { x: 80, y: 20 },
      { x: 20, y: 80 }, { x: 50, y: 70 }, { x: 85, y: 85 }
    ],
    rivals: [
      { x: 30, y: 25 }, { x: 60, y: 25 }, { x: 25, y: 70 },
      { x: 45, y: 80 }, { x: 70, y: 75 }, { x: 75, y: 30 }
    ],
    target: 5
  };
};

export const OjoTactico = ({ isOpen, onClose, onSessionFinished }) => {
  const { t } = useTranslation();

  const gameInfo = {
    id: 'g3',
    em: '👁️',
    t: t('games.g3.title', {}, 'Ojo Táctico'),
    sk: t('games.g3.skill', {}, 'Escaneo visual y percepción'),
    what: t('games.g3.what', {}, 'Ver el juego: encontrar al compañero libre antes de recibir.'),
    steps: [
      t('games.g3.step1', {}, '🟢 compañeros · 🔴 rivales.'),
      t('games.g3.step2', {}, 'Toca al compañero con MÁS espacio libre.'),
      t('games.g3.step3', {}, '5 segundos por ronda.')
    ],
    why: t('games.g3.why', {}, 'Los profesionales escanean 6-8 veces cada 10 s. Ver al libre antes de recibir convierte una buena decisión en un buen pase.')
  };

  const [status, setStatus] = useState('intro');
  const [isPractice, setIsPractice] = useState(false);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(1);
  const [fieldData, setFieldData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [feedback, setFeedback] = useState({ text: 'Busca con la mirada…', type: '' });
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState({ hits: '0/5', time: '—' });
  const [xpResult, setXpResult] = useState(null);

  const resolvedRef = useRef(false);
  const hitsRef = useRef(0);
  const timesRef = useRef([]);
  const roundStartTimeRef = useRef(0);
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

  const nextRound = useCallback((practiceMode) => {
    clearAllTimeouts();
    resolvedRef.current = false;
    setRevealed(false);

    setRound(prev => {
      const nextR = prev + 1;
      const maxR = practiceMode ? 1 : 5;

      if (nextR > maxR) {
        if (practiceMode) {
          // Iniciar rondas oficiales
          setIsPractice(false);
          setTotalRounds(5);
          hitsRef.current = 0;
          timesRef.current = [];
          setupRound(1, false);
          return 1;
        } else {
          finishGame();
          return nextR;
        }
      }

      setupRound(nextR, practiceMode);
      return nextR;
    });
  }, []);

  const setupRound = (rNum, practiceMode) => {
    const generated = genField();
    setFieldData(generated);
    setTimeLeft(5);
    roundStartTimeRef.current = performance.now();

    if (practiceMode) {
      setFeedback({
        text: t('games.g3.practiceGuide', {}, 'El compañero libre brilla en oro. ¡Tócalo!'),
        type: ''
      });
    } else {
      setFeedback({
        text: t('games.g3.scanPrompt', {}, 'Busca con la mirada…'),
        type: ''
      });
    }

    // Cronómetro de 5 segundos
    let currentSec = 5;
    timerIntervalRef.current = setInterval(() => {
      currentSec--;
      setTimeLeft(Math.max(0, currentSec));

      if (currentSec <= 0) {
        clearInterval(timerIntervalRef.current);
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          setRevealed(true);
          setFeedback({
            text: t('games.g3.timeOut', {}, '⏱️ Tiempo. El libre era el más despejado.'),
            type: 'warn'
          });
          addTimeout(() => {
            nextRound(practiceMode);
          }, 1200);
        }
      }
    }, 1000);
  };

  const handleTap = (index) => {
    if (resolvedRef.current || !fieldData) return;
    resolvedRef.current = true;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isTarget = index === fieldData.target;
    const elapsed = Math.round(performance.now() - roundStartTimeRef.current);

    if (isTarget) {
      if (!isPractice) {
        hitsRef.current++;
        timesRef.current.push(elapsed);
      }
      setFeedback({
        text: t('games.g3.hitMsg', {}, '✅ ¡Libre encontrado!'),
        type: 'good'
      });
    } else {
      setRevealed(true);
      if (index === -1) {
        setFeedback({
          text: t('games.g3.rivalMsg', {}, '😉 Ese es un rival. Busca al compañero.'),
          type: 'bad'
        });
      } else {
        setFeedback({
          text: t('games.g3.markedMsg', {}, '❌ Ese estaba marcado. Mira el despejado.'),
          type: 'bad'
        });
      }
    }

    addTimeout(() => {
      nextRound(isPractice);
    }, 1000);
  };

  const finishGame = async () => {
    clearAllTimeouts();
    const hits = hitsRef.current;
    const avgMs = timesRef.current.length 
      ? Math.round(timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length) 
      : null;

    const finalSummary = {
      hits: `${hits}/5`,
      time: avgMs ? `${(avgMs / 1000).toFixed(1)} s` : '—'
    };
    setSummary(finalSummary);

    if (onSessionFinished) {
      const res = await onSessionFinished({
        gameId: 'g3',
        mode: 'cognitive',
        score: hits,
        reactionMs: avgMs,
        accuracy: Math.round((hits / 5) * 100),
        allSetsCompleted: true,
        sets: [{ set: 1, value: hits }]
      }, true); // higher hits is better
      setXpResult(res);
    }

    setStatus('finished');
  };

  const startPractice = () => {
    clearAllTimeouts();
    setIsPractice(true);
    setTotalRounds(1);
    setRound(0);
    hitsRef.current = 0;
    timesRef.current = [];
    setStatus('playing');
    nextRound(true);
  };

  const startGameOfficial = () => {
    clearAllTimeouts();
    setIsPractice(false);
    setTotalRounds(5);
    setRound(0);
    hitsRef.current = 0;
    timesRef.current = [];
    setStatus('playing');
    nextRound(false);
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
        { label: t('games.g3.statHits', {}, 'Aciertos'), value: summary.hits },
        { label: t('games.g3.statTime', {}, 'Tiempo medio'), value: summary.time },
        { label: t('games.g3.statRounds', {}, 'Rondas'), value: '5' }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
          <span style={{ color: isPractice ? '#f59e0b' : '#1E3A8A' }}>
            {isPractice ? t('games.status.practice', {}, 'Práctica (el libre brilla en oro)') : `Ronda ${round} de ${totalRounds}`}
          </span>
          <span style={{ color: timeLeft <= 2 ? '#ef4444' : '#1E3A8A' }}>
            ⏱️ {timeLeft}s
          </span>
        </div>

        {/* Campo Táctico */}
        <div className="tactico-field">
          {fieldData && (
            <>
              {/* Rivales (rojos) */}
              {fieldData.rivals.map((r, i) => (
                <button
                  key={`riv-${i}`}
                  type="button"
                  className="tactico-dot rival"
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  onClick={() => handleTap(-1)}
                  aria-label="Rival"
                >
                  🔴
                </button>
              ))}

              {/* Compañeros (verdes) */}
              {fieldData.mates.map((m, i) => {
                const isTarget = i === fieldData.target;
                const isGold = isPractice && isTarget;
                const isRevealedTarget = revealed && isTarget;

                return (
                  <button
                    key={`mate-${i}`}
                    type="button"
                    className={`tactico-dot mate ${isGold ? 'gold' : ''} ${isRevealedTarget ? 'reveal' : ''}`}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    onClick={() => handleTap(i)}
                    aria-label="Compañero"
                  >
                    {isGold ? '⭐' : '🟢'}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Feedback */}
        <div className={`game-fb-box ${feedback.type}`}>
          {feedback.text}
        </div>
      </div>
    </GameShell>
  );
};

export default OjoTactico;
