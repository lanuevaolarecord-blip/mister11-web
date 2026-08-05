/**
 * LiveStats.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de captura de estadísticas en vivo durante el partido.
 *
 * ARQUITECTURA:
 *  • Reutiliza el MatchContext (cronómetro, minuto, matchId) — no duplica lógica.
 *  • Cada pulsación de botón llama a addLiveEvent(), que guarda un documento
 *    individual en matches/{matchId}/liveStats/{eventId}.
 *  • Los contadores junto a cada botón se actualizan en tiempo real vía
 *    onSnapshot del hook useLiveStats.
 *  • Traducciones ES/EN con el patrón getLangText() del módulo Partidos.
 *
 * CONCURRENCIA:
 *  • addDoc (no setDoc/updateDoc) garantiza que múltiples pestañas/analistas
 *    no sobrescriban datos entre sí.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';

// ── Paleta institucional ──────────────────────────────────────────────────────
const C = {
  green:       '#4CAF7D',
  greenDark:   '#1B3A2D',
  gold:        '#D4A843',
  red:         '#E53935',
  blue:        '#1976D2',
  orange:      '#F57C00',
  purple:      '#7B1FA2',
  teal:        '#00796B',
  surface:     'var(--bg-card, #1e2a22)',
  border:      'var(--border-light, rgba(255,255,255,0.08))',
  textPrimary: 'var(--text-primary, #F5F0E8)',
  textMuted:   'var(--text-secondary, #9CA3AF)',
};

// ── Textos bilingüe ───────────────────────────────────────────────────────────
const TEXTS = {
  'live.title':                { es: 'Live Stats',                       en: 'Live Stats' },
  'live.noMatch':              { es: 'Inicia un partido en Match Day para capturar estadísticas en vivo', en: 'Start a match in Match Day to capture live statistics' },
  'live.half':                 { es: 'Mitad',                            en: 'Half' },
  'live.minute':               { es: 'Min',                              en: 'Min' },
  'live.totalEvents':          { es: 'eventos capturados',               en: 'events captured' },
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
  'live.half.select':          { es: 'Mitad actual:',                    en: 'Current Half:' },
  'live.half.1':               { es: '1ª Mitad',                         en: '1st Half' },
  'live.half.2':               { es: '2ª Mitad',                         en: '2nd Half' },
  'live.feedback.saved':       { es: '¡Guardado!',                       en: 'Saved!' },
};

// ── Definición de grupos de botones ──────────────────────────────────────────
const BUTTON_GROUPS = [
  {
    catKey: 'live.cat.shots',
    color: C.green,
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

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * @param {string|null} matchId        - ID del partido activo en Firestore
 * @param {number}      matchSeconds   - Segundos del cronómetro (de MatchContext)
 * @param {boolean}     isRunning      - ¿Está corriendo el cronómetro?
 * @param {number}      currentMinute  - Minuto actual (de MatchContext)
 * @param {Function}    formatMatchTime - Formatea mm:ss
 * @param {Object}      matchData      - Datos del partido (para mostrar marcador)
 * @param {string}      language       - 'Español (ES)' | 'English (EN)'
 */
const LiveStats = ({
  matchId,
  matchSeconds,
  isRunning,
  currentMinute,
  formatMatchTime,
  matchData,
  language,
}) => {
  const isEn = language === 'English (EN)';
  const tx = (key) => (TEXTS[key] ? (isEn ? TEXTS[key].en : TEXTS[key].es) : key);

  // ── Mitad actual (el entrenador la selecciona manualmente) ────────────────
  const [currentHalf, setCurrentHalf] = useState(1);

  // ── Hook de datos ─────────────────────────────────────────────────────────
  const { events, loading, saving, addLiveEvent, countByType } =
    useLiveStats(matchId, currentMinute, currentHalf);

  // ── Feedback visual por botón (flash de confirmación) ────────────────────
  const [flashType, setFlashType] = useState(null);

  const handlePress = useCallback(
    async (type) => {
      const id = await addLiveEvent(type);
      if (id) {
        setFlashType(type);
        setTimeout(() => setFlashType(null), 600);
      }
    },
    [addLiveEvent]
  );

  // ── Pantalla si no hay partido activo ────────────────────────────────────
  if (!matchId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', gap: '16px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '48px' }}>📊</span>
        <p style={{ color: C.textMuted, fontSize: '15px', maxWidth: '320px', lineHeight: 1.6 }}>
          {tx('live.noMatch')}
        </p>
      </div>
    );
  }

  const goalsFor     = matchData?.golesLocal  ?? matchData?.golesPropio ?? 0;
  const goalsAgainst = matchData?.golesVisita ?? matchData?.golesRival  ?? 0;

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* ── Cabecera fija: cronómetro + marcador ───────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: C.greenDark,
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        {/* Cronómetro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '28px', fontWeight: 900, fontFamily: 'monospace',
            color: isRunning ? C.green : C.textMuted,
            letterSpacing: '2px',
            textShadow: isRunning ? `0 0 12px ${C.green}55` : 'none',
            transition: 'color 0.3s, text-shadow 0.3s',
          }}>
            {formatMatchTime(matchSeconds)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>
              {tx('live.minute')} {currentMinute}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: isRunning ? C.green : '#888',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span style={{
                display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                background: isRunning ? C.green : '#555',
                boxShadow: isRunning ? `0 0 6px ${C.green}` : 'none',
                animation: isRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }} />
              {isRunning ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Marcador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '6px 14px',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 900, color: C.textPrimary }}>{goalsFor}</span>
          <span style={{ fontSize: '14px', color: C.textMuted, fontWeight: 700 }}>-</span>
          <span style={{ fontSize: '22px', fontWeight: 900, color: C.textPrimary }}>{goalsAgainst}</span>
        </div>

        {/* Selector de mitad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: C.textMuted }}>{tx('live.half.select')}</span>
          {[1, 2].map((h) => (
            <button
              key={h}
              onClick={() => setCurrentHalf(h)}
              style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer', border: '2px solid',
                borderColor: currentHalf === h ? C.gold : C.border,
                background: currentHalf === h ? C.gold : 'transparent',
                color: currentHalf === h ? C.greenDark : C.textMuted,
                transition: 'all 0.2s',
              }}
            >
              {h === 1 ? tx('live.half.1') : tx('live.half.2')}
            </button>
          ))}
        </div>

        {/* Total eventos */}
        <span style={{ fontSize: '12px', color: C.textMuted }}>
          <strong style={{ color: C.green }}>{events.length}</strong> {tx('live.totalEvents')}
        </span>
      </div>

      {/* ── Grupos de botones ───────────────────────────────────────────── */}
      <div style={{ padding: '16px 12px' }}>
        {BUTTON_GROUPS.map((group) => (
          <div key={group.catKey} style={{ marginBottom: '20px' }}>
            {/* Título de categoría */}
            <div style={{
              fontSize: '12px', fontWeight: 800, letterSpacing: '1px',
              color: group.color, textTransform: 'uppercase',
              marginBottom: '10px', paddingLeft: '4px',
              borderLeft: `3px solid ${group.color}`,
              paddingLeft: '8px',
            }}>
              {tx(group.catKey)}
            </div>

            {/* Grid de botones */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '8px',
            }}>
              {group.buttons.map(({ type, labelKey, icon }) => {
                const count = countByType(type);
                const isFlashing = flashType === type;
                const label = tx(labelKey);
                const lines = label.split('\n');

                return (
                  <button
                    key={type}
                    id={`livestats-btn-${type}`}
                    onClick={() => handlePress(type)}
                    disabled={saving}
                    style={{
                      position: 'relative',
                      minHeight: '72px',
                      borderRadius: '12px',
                      border: `2px solid ${isFlashing ? group.color : C.border}`,
                      background: isFlashing
                        ? `${group.color}22`
                        : 'var(--bg-card, rgba(255,255,255,0.04))',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '4px', padding: '8px 4px',
                      transition: 'all 0.15s ease',
                      transform: isFlashing ? 'scale(0.97)' : 'scale(1)',
                      boxShadow: isFlashing ? `0 0 12px ${group.color}44` : 'none',
                      // Touch target: min 48x48dp per Android design rules
                    }}
                  >
                    {/* Ícono */}
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>

                    {/* Etiqueta (acepta saltos de línea) */}
                    <span style={{
                      fontSize: '11px', fontWeight: 600, textAlign: 'center',
                      color: C.textPrimary, lineHeight: 1.3, whiteSpace: 'pre-line',
                    }}>
                      {lines[0]}
                      {lines[1] && (
                        <span style={{ fontSize: '10px', opacity: 0.7, display: 'block' }}>
                          {lines[1]}
                        </span>
                      )}
                    </span>

                    {/* Contador */}
                    <span style={{
                      position: 'absolute', top: '6px', right: '8px',
                      fontSize: '14px', fontWeight: 900,
                      color: count > 0 ? group.color : C.textMuted,
                      transition: 'color 0.2s, transform 0.15s',
                      transform: isFlashing ? 'scale(1.3)' : 'scale(1)',
                    }}>
                      {count > 0 ? count : ''}
                    </span>

                    {/* Flash de guardado */}
                    {isFlashing && (
                      <span style={{
                        position: 'absolute', bottom: '4px', right: '6px',
                        fontSize: '9px', color: group.color, fontWeight: 700,
                        letterSpacing: '0.3px',
                      }}>
                        {tx('live.feedback.saved')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── CSS animations inline ────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default LiveStats;
