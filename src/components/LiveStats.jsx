/**
 * LiveStats.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de captura de estadísticas en vivo durante el partido.
 *
 * FASE 2:
 *  • Integración de gráficas SVG en tiempo real en la sección "Resumen en Vivo"
 *    ubicada debajo de la matriz de botones de captura.
 *  • Donuts de Eficiencia (% Duelos ganados/perdidos, Remates puerta/fuera, Balón).
 *  • Comparativa Propio vs Rival (Barras comparativas de métricas).
 *  • Desglose por Mitades (1T vs 2T).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';
import { useTheme } from '../context/ThemeContext';
import { useMatch } from '../context/MatchContext';
import { SvgDonut, SvgComparisonBars, HalfBreakdown } from './LiveStatsCharts';
import { getEffectiveLanguage } from '../i18n/translations';
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
  'live.summary.title':        { es: 'Resumen en Vivo',                   en: 'Live Summary' },
  'live.summary.efficiency':   { es: 'Eficiencia Táctica (% Éxito)',      en: 'Tactical Efficiency (% Success)' },
  'live.summary.comparison':   { es: 'Comparativa Propio vs Rival',       en: 'Own vs Rival Comparison' },
  'live.summary.halves':       { es: 'Desglose por Mitades (1T vs 2T)',    en: 'Half Breakdown (1st vs 2nd)' },
  'live.donut.duels':          { es: 'Duelos',                            en: 'Duels' },
  'live.donut.shots':          { es: 'Remates',                           en: 'Shots' },
  'live.donut.possession':     { es: 'Balón',                             en: 'Possession' },
  'live.label.won':            { es: 'Gan',                               en: 'Won' },
  'live.label.lost':           { es: 'Perd',                              en: 'Lost' },
  'live.label.onTarget':       { es: 'Puerta',                            en: 'On' },
  'live.label.offTarget':      { es: 'Fuera',                             en: 'Off' },
  'live.label.recovery':       { es: 'Recup',                             en: 'Rec' },
  'live.label.loss':           { es: 'Pérd',                              en: 'Loss' },
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
  events: parentEvents,
  addLiveEvent: parentAddLiveEvent,
  resetLiveStats: parentResetLiveStats,
  onResetEvents,
  onFinishMatch,
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
  const [showResetModal, setShowResetModal] = useState(false);

  const liveStatsHook = useLiveStats(teamId, matchId, currentMinute, currentHalf);
  const events = parentEvents !== undefined ? parentEvents : liveStatsHook.events;
  const addLiveEvent = parentAddLiveEvent || liveStatsHook.addLiveEvent;
  const resetLiveStats = parentResetLiveStats || liveStatsHook.resetLiveStats;
  const saving = liveStatsHook.saving;

  const countByType = useCallback(
    (type) => (events || []).filter((e) => e.type === type).length,
    [events]
  );

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

  const handleExportPdf = useCallback(async () => {
    try {
      const { generateMatchPdfReport } = await import('../utils/matchPdfReport');
      await generateMatchPdfReport({
        mode: 'LIVE-STATS',
        teamName: 'Mi Equipo',
        matchData,
        events,
        language: getEffectiveLanguage(),
      });
    } catch (err) {
      console.error("Error al exportar informe PDF de Live Stats:", err);
    }
  }, [matchData, events]);

  const handlePress = useCallback(
    async (type) => {
      const id = await addLiveEvent(type, currentHalf);
      if (id) {
        setFlashType(type);
        setTimeout(() => setFlashType(null), 650);
      }
    },
    [addLiveEvent, currentHalf]
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

        {/* Contador total de eventos en tiempo real + Botón Pantalla Completa + Botón PDF */}
        <div className="livestats-header-actions">
          <span className="livestats-total-count">
            <strong>{events.length}</strong> {tx('live.totalEvents')}
          </span>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="livestats-fullscreen-btn"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800 }}
            title="Reiniciar Captura / Eventos"
          >
            <span>🔄 REINICIAR</span>
          </button>

          {onFinishMatch && (
            <button
              type="button"
              onClick={onFinishMatch}
              className="livestats-fullscreen-btn"
              style={{ background: matchData?.status === 'Terminado' ? '#15803D' : '#10B981', color: '#FFFFFF', border: 'none', fontWeight: 800 }}
              title="Finalizar Partido"
            >
              <span>{matchData?.status === 'Terminado' ? '✓ TERMINADO' : '🏁 FINALIZAR'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportPdf}
            className="livestats-fullscreen-btn"
            style={{ background: '#D4A843', color: '#0E1A14', border: 'none', fontWeight: 800 }}
            title={tx('live.exportPdf')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 18 15 15"/>
            </svg>
            <span>PDF</span>
          </button>

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

        {/* ── 3. Sección Resumen en Vivo (Gráficas SVG en tiempo real) ── */}
        <section style={{ marginTop: '28px', maxWidth: '1400px', margin: '28px auto 0' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 900,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: darkMode ? '#D4A843' : '#1B3A2D',
          }}>
            <span>📈</span>
            <span>{tx('live.summary.title')}</span>
          </div>

          <div className="livestats-summary-grid" id="livestats-charts-container-live">
            {/* Tarjeta 1: Gráficas de Eficiencia (Donuts SVG) */}
            <div className="livestats-category-card">
              <div className="livestats-category-title" style={{ color: C.green }}>
                <span>🎯 {tx('live.summary.efficiency')}</span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                gap: '12px',
                width: '100%',
              }}>
                <SvgDonut
                  title={tx('live.donut.duels')}
                  value1={countByType('duel_won')}
                  value2={countByType('duel_lost')}
                  label1={tx('live.label.won')}
                  label2={tx('live.label.lost')}
                  color1="#4CAF7D"
                  color2="#EF4444"
                  darkMode={darkMode}
                />
                <SvgDonut
                  title={tx('live.donut.shots')}
                  value1={countByType('shot_on_target_own')}
                  value2={countByType('shot_off_target_own')}
                  label1={tx('live.label.onTarget')}
                  label2={tx('live.label.offTarget')}
                  color1="#0D9488"
                  color2="#F97316"
                  darkMode={darkMode}
                />
                <SvgDonut
                  title={tx('live.donut.possession')}
                  value1={countByType('recovery')}
                  value2={countByType('loss')}
                  label1={tx('live.label.recovery')}
                  label2={tx('live.label.loss')}
                  color1="#3B82F6"
                  color2="#E11D48"
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Tarjeta 2: Comparativa Propio vs Rival (Barras comparativas) */}
            <div className="livestats-category-card">
              <div className="livestats-category-title" style={{ color: C.gold }}>
                <span>⚔️ {tx('live.summary.comparison')}</span>
              </div>
              <SvgComparisonBars events={events} darkMode={darkMode} />
            </div>
          </div>

          {/* Tarjeta 3: Desglose por Mitades (1T vs 2T) */}
          <div className="livestats-category-card" style={{ marginTop: '18px' }}>
            <div className="livestats-category-title" style={{ color: C.orange }}>
              <span>⏱️ {tx('live.summary.halves')}</span>
            </div>
            <HalfBreakdown events={events} darkMode={darkMode} />
          </div>
        </section>

        {/* Modal de confirmación para reiniciar captura/eventos */}
        {showResetModal && (
          <div className="event-selector-overlay" onClick={() => setShowResetModal(false)} style={{ zIndex: 99999 }}>
            <div className="event-selector-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '24px', borderRadius: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: darkMode ? '#F8FAFC' : '#0F172A', marginBottom: '12px' }}>
                ¿Reiniciar eventos de este partido?
              </h3>
              <p style={{ fontSize: '13px', color: darkMode ? '#94A3B8' : '#64748B', marginBottom: '20px', lineHeight: 1.5 }}>
                Se eliminarán permanentemente todas las estadísticas grabadas en vivo para este partido y todos los contadores volverán a 0.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{ minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowResetModal(false);
                    if (resetLiveStats) await resetLiveStats();
                    if (onResetEvents) onResetEvents();
                  }}
                  style={{ minHeight: '44px', padding: '0 20px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Sí, Reiniciar Conteo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveStats;
