/**
 * LiveStats.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de captura de estadísticas en vivo durante el partido.
 *
 * MEJORAS:
 *  1. Botón de reinicio del cronómetro en dorado circular (#D4A843).
 *  2. Botones de gol "+1" a cada lado del marcador, sincronizados con Match Day.
 *  3. Verificación de alcance de reglas Firestore recursivas {allPaths=**}.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';
import { useTheme } from '../context/ThemeContext';
import { useMatch } from '../context/MatchContext';
import './LiveStats.css';

// ── Paleta de acentos por categoría ──────────────────────────────────────────
const C = {
  green:  '#4CAF7D',
  gold:   '#D4A843',
  orange: '#F97316',
  teal:   '#0D9488',
};

// ── Textos bilingüe ───────────────────────────────────────────────────────────
const TEXTS = {
  'live.title':                { es: 'Live Stats',                       en: 'Live Stats' },
  'live.noMatch':              { es: 'Inicia un partido en Match Day para capturar estadísticas en vivo', en: 'Start a match in Match Day to capture live statistics' },
  'live.half':                 { es: 'Mitad',                            en: 'Half' },
  'live.minute':               { es: 'Min',                              en: 'Min' },
  'live.totalEvents':          { es: 'eventos capturados',               en: 'events captured' },
  'live.fullscreen.enter':     { es: 'Pantalla completa',                en: 'Fullscreen' },
  'live.fullscreen.exit':      { es: 'Salir',                            en: 'Exit' },
  'live.timer.start':          { es: '▶ INICIAR',                        en: '▶ START' },
  'live.timer.pause':          { es: '❚❚ PAUSAR',                        en: '❚❚ PAUSE' },
  'live.timer.reset':          { es: 'Reiniciar cronómetro',             en: 'Reset timer' },
  'live.goal.for':             { es: '+1 Gol propio',                    en: '+1 Own Goal' },
  'live.goal.against':         { es: '+1 Gol rival',                     en: '+1 Rival Goal' },
  'live.cat.shots':            { es: '⚽ Remates',                       en: '⚽ Shots' },
  'live.cat.possession':       { es: '🔄 Defensa / Posesión',           en: '🔄 Defense / Possession' },
  'live.cat.fouls':            { es: '⚡ Faltas / Transiciones',         en: '⚡ Fouls / Transitions' },
  'live.cat.discipline':       { es: '🟨 Disciplina / Balón parado',    en: '🟨 Discipline / Set Pieces' },
  'live.btn.shot_on_own':      { es: 'Tiro a puerta\n(Propio)',          en: 'Shot on Target\n(Own)' },
  'live.btn.shot_on_rival':    { es: 'Tiro a puerta\n(Rival)',           en: 'Shot on Target\n(Rival)' },
  'live.btn.shot_off_own':     { es: 'Tiro fuera\n(Propio)',             en: 'Shot off Target\n(Own)' },
  'live.btn.shot_off_rival':   { es: 'Tiro fuera\n(Rival)',              en: 'Shot off Target\n(Rival)' },
  'live.btn.recovery':         { es: 'Recuperación',                     en: 'Recovery' },
  'live.btn.loss':             { es: 'Pérdida',                          en: 'Ball Loss' },
  'live.btn.duel_won':         { es: 'Duelo ganado',                     en: 'Duel Won' },
  'live.btn.duel_lost':        { es: 'Duelo perdido',                    en: 'Duel Lost' },
  'live.btn.foul_favor':       { es: 'Falta a favor',                    en: 'Foul in Favor' },
  'live.btn.foul_against':     { es: 'Falta en contra',                  en: 'Foul Against' },
  'live.btn.counter_not_cut':  { es: 'Contra no\ncortada',               en: 'Counter Not\nCut' },
  'live.btn.player_no_finish': { es: 'Jugador no\nfinaliza',             en: 'Player No\nFinish' },
  'live.btn.card_own':         { es: 'Tarjeta\n(Propia)',                en: 'Card\n(Own)' },
  'live.btn.card_rival':       { es: 'Tarjeta\n(Rival)',                 en: 'Card\n(Rival)' },
  'live.btn.corner_favor':     { es: 'Córner\na favor',                  en: 'Corner\nIn Favor' },
  'live.btn.corner_against':   { es: 'Córner\nen contra',                en: 'Corner\nAgainst' },
  'live.btn.offside_own':      { es: 'Fuera de juego\n(Propio)',         en: 'Offside\n(Own)' },
  'live.btn.offside_rival':    { es: 'Fuera de juego\n(Rival)',          en: 'Offside\n(Rival)' },
  'live.half.select':          { es: 'Mitad:',                           en: 'Half:' },
  'live.half.1':               { es: '1ª Mitad',                         en: '1st Half' },
  'live.half.2':               { es: '2ª Mitad',                         en: '2nd Half' },
  'live.feedback.saved':       { es: '¡Guardado!',                       en: 'Saved!' },
};

// ── Grupos de botones ────────────────────────────────────────────────────────
const BUTTON_GROUPS = [
  {
    catKey: 'live.cat.shots',
    color: C.green,
    colsClass: 'cols-4',
    buttons: [
      { type: 'shot_on_target_own',   labelKey: 'live.btn.shot_on_own',      icon: '🟢' },
      { type: 'shot_on_target_rival', labelKey: 'live.btn.shot_on_rival',     icon: '🔴' },
      { type: 'shot_off_target_own',  labelKey: 'live.btn.shot_off_own',      icon: '⬜' },
      { type: 'shot_off_target_rival',labelKey: 'live.btn.shot_off_rival',    icon: '🔲' },
    ],
  },
  {
    catKey: 'live.cat.possession',
    color: C.teal,
    colsClass: 'cols-4',
    buttons: [
      { type: 'recovery',   labelKey: 'live.btn.recovery',   icon: '↑' },
      { type: 'loss',       labelKey: 'live.btn.loss',        icon: '↓' },
      { type: 'duel_won',   labelKey: 'live.btn.duel_won',   icon: '✊' },
      { type: 'duel_lost',  labelKey: 'live.btn.duel_lost',  icon: '🤜' },
    ],
  },
  {
    catKey: 'live.cat.fouls',
    color: C.orange,
    colsClass: 'cols-4',
    buttons: [
      { type: 'foul_favor',        labelKey: 'live.btn.foul_favor',        icon: '✅' },
      { type: 'foul_against',      labelKey: 'live.btn.foul_against',      icon: '❌' },
      { type: 'counter_not_cut',   labelKey: 'live.btn.counter_not_cut',   icon: '⚡' },
      { type: 'player_no_finish',  labelKey: 'live.btn.player_no_finish',  icon: '😤' },
    ],
  },
  {
    catKey: 'live.cat.discipline',
    color: C.gold,
    colsClass: 'cols-6',
    buttons: [
      { type: 'card_own',        labelKey: 'live.btn.card_own',        icon: '🟨' },
      { type: 'card_rival',      labelKey: 'live.btn.card_rival',      icon: '🟥' },
      { type: 'corner_favor',    labelKey: 'live.btn.corner_favor',    icon: '🚩' },
      { type: 'corner_against',  labelKey: 'live.btn.corner_against',  icon: '⛳' },
      { type: 'offside_own',     labelKey: 'live.btn.offside_own',     icon: '🏃' },
      { type: 'offside_rival',   labelKey: 'live.btn.offside_rival',   icon: '🏃‍♂️' },
    ],
  },
];

const LiveStats = ({
  teamId,
  matchId,
  matchData,
  language,
  onAddGoalFor,
  onAddGoalAgainst,
}) => {
  const isEn = language === 'English (EN)';
  const tx = useCallback(
    (key) => (TEXTS[key] ? (isEn ? TEXTS[key].en : TEXTS[key].es) : key),
    [isEn]
  );

  const { darkMode } = useTheme();
  const {
    matchSeconds,
    isRunning,
    toggleTimer,
    resetTimer,
    currentMinute,
    formatMatchTime,
  } = useMatch();

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentHalf, setCurrentHalf] = useState(1);

  const { events, saving, addLiveEvent, countByType } =
    useLiveStats(teamId, matchId, currentMinute, currentHalf);

  const [flashType, setFlashType] = useState(null);

  // ── Listener de eventos Fullscreen nativos ──────────────────────────────
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => console.error(err));
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  const handlePress = useCallback(
    async (type) => {
      const id = await addLiveEvent(type);
      if (id) {
        setFlashType(type);
        setTimeout(() => setFlashType(null), 650);
      }
    },
    [addLiveEvent]
  );

  if (!matchId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '48px' }}>📊</span>
        <p style={{ color: darkMode ? '#94A3B8' : '#64748B', fontSize: '15px', maxWidth: '340px', lineHeight: 1.6 }}>
          {tx('live.noMatch')}
        </p>
      </div>
    );
  }

  const goalsFor     = matchData?.goalsFor     ?? matchData?.golesLocal  ?? matchData?.golesPropio ?? 0;
  const goalsAgainst = matchData?.goalsAgainst ?? matchData?.golesVisita ?? matchData?.golesRival  ?? 0;

  return (
    <div
      ref={containerRef}
      className={`livestats-container ${darkMode ? 'theme-dark' : 'theme-light'} ${isFullscreen ? 'livestats-fullscreen' : ''}`}
    >
      {/* ── 1. Cabecera fija con cronómetro, play/pausa, reset y marcador ────── */}
      <header className="livestats-header">
        {/* Cronómetro y control de Play/Pausa/Reset */}
        <div className="livestats-timer-block">
          <span className={`livestats-timer-digits ${isRunning ? 'running' : 'paused'}`}>
            {formatMatchTime(matchSeconds)}
          </span>

          <div className="livestats-timer-meta">
            <span className="livestats-minute-label">
              {tx('live.minute')} {currentMinute}'
            </span>
          </div>

          {/* Botón de Play / Pausa */}
          <button
            type="button"
            onClick={toggleTimer}
            className={`livestats-toggle-timer-btn ${isRunning ? 'btn-pause' : 'btn-play'}`}
          >
            {isRunning ? tx('live.timer.pause') : tx('live.timer.start')}
          </button>

          {/* Botón de Reinicio del Cronómetro (Dorado #D4A843 circular) */}
          <button
            type="button"
            onClick={resetTimer}
            className="livestats-reset-timer-btn"
            title={tx('live.timer.reset')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M2.5 22v-6h6"/>
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16"/>
            </svg>
          </button>
        </div>

        {/* Marcador con botones de Gol +1 */}
        <div className="livestats-score-box">
          {onAddGoalFor && (
            <button
              type="button"
              onClick={onAddGoalFor}
              className="livestats-goal-btn"
              title={tx('live.goal.for')}
            >
              +1
            </button>
          )}

          <div className="livestats-score-display">
            <span className="livestats-score-num">{goalsFor}</span>
            <span className="livestats-score-dash">-</span>
            <span className="livestats-score-num">{goalsAgainst}</span>
          </div>

          {onAddGoalAgainst && (
            <button
              type="button"
              onClick={onAddGoalAgainst}
              className="livestats-goal-btn"
              title={tx('live.goal.against')}
            >
              +1
            </button>
          )}
        </div>

        {/* Selector de Mitad */}
        <div className="livestats-half-selector">
          <span className="livestats-half-label">{tx('live.half.select')}</span>
          {[1, 2].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setCurrentHalf(h)}
              className={`livestats-half-btn ${currentHalf === h ? 'active' : 'inactive'}`}
            >
              {h === 1 ? tx('live.half.1') : tx('live.half.2')}
            </button>
          ))}
        </div>

        {/* Contador total de eventos en tiempo real + Botón Pantalla Completa */}
        <div className="livestats-header-actions">
          <span className="livestats-total-count">
            <strong>{events.length}</strong> {tx('live.totalEvents')}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="livestats-fullscreen-btn"
            title={isFullscreen ? tx('live.fullscreen.exit') : tx('live.fullscreen.enter')}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="10" y1="14" x2="3" y2="21" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
            <span>{isFullscreen ? tx('live.fullscreen.exit') : tx('live.fullscreen.enter')}</span>
          </button>
        </div>
      </header>

      {/* ── 2. Cuerpo desplazable (Cuadrícula organizada de categorías) ── */}
      <main className="livestats-body">
        <div className="livestats-categories-grid">
          {BUTTON_GROUPS.map((group) => (
            <section key={group.catKey} className="livestats-category-card">
              {/* Título de categoría */}
              <div
                className="livestats-category-title"
                style={{ color: group.color }}
              >
                <span>{tx(group.catKey)}</span>
              </div>

              {/* Cuadrícula de botones de esta categoría (Swipe en móvil) */}
              <div className={`livestats-buttons-grid ${group.colsClass}`}>
                {group.buttons.map(({ type, labelKey, icon }) => {
                  const count = countByType(type);
                  const isFlashing = flashType === type;
                  const label = tx(labelKey);
                  const lines = label.split('\n');

                  return (
                    <button
                      key={type}
                      type="button"
                      id={`livestats-btn-${type}`}
                      onClick={() => handlePress(type)}
                      disabled={saving}
                      className={`livestats-btn ${isFlashing ? 'flashing' : ''}`}
                      style={{
                        borderColor: isFlashing
                          ? group.color
                          : undefined,
                        background: isFlashing
                          ? `${group.color}25`
                          : undefined,
                        boxShadow: isFlashing
                          ? `0 0 14px ${group.color}55`
                          : undefined,
                      }}
                    >
                      {/* Ícono */}
                      <span className="livestats-btn-icon">{icon}</span>

                      {/* Etiqueta multilínea */}
                      <span className="livestats-btn-label">
                        {lines[0]}
                        {lines[1] && (
                          <span className="livestats-btn-label-sub">{lines[1]}</span>
                        )}
                      </span>

                      {/* Contador +1 */}
                      {count > 0 && (
                        <span
                          className="livestats-btn-count"
                          style={{ color: group.color }}
                        >
                          {count}
                        </span>
                      )}

                      {/* Flash feedback */}
                      {isFlashing && (
                        <span
                          className="livestats-flash-msg"
                          style={{ color: group.color }}
                        >
                          {tx('live.feedback.saved')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LiveStats;
