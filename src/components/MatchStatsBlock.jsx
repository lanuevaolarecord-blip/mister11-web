/**
 * MatchStatsBlock.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente unificado y reutilizable para la visualización de estadísticas
 * oficiales del partido (Suite en Vivo).
 * Reutilizado en:
 *  1. Pestaña ESTADÍSTICAS (LiveStats.jsx)
 *  2. Pestaña ACTA OFICIAL (ActaOficialPanel.jsx)
 *  3. Pestaña POST-PARTIDO (Partidos.jsx)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SvgDonut, SvgComparisonBars, HalfBreakdown } from './LiveStatsCharts';
import { getEffectiveLanguage } from '../i18n/translations';
import { getUnifiedMatchEvents } from '../utils/minutesEngine';

const C = {
  green: '#22C55E',
  gold: '#D4A843',
  red: '#EF4444',
  blue: '#3B82F6',
  teal: '#0D9488',
  orange: '#F97316',
  purple: '#A855F7',
};

const TEXTS = {
  title: { es: '📊 Estadísticas del Encuentro', en: '📊 Match Statistics' },
  efficiency: { es: '🎯 Eficiencia Táctica', en: '🎯 Tactical Efficiency' },
  comparison: { es: '⚔️ Comparativa Propio vs Rival', en: '⚔️ Own vs Opponent Comparison' },
  halves: { es: '⏱️ Desglose por Mitades', en: '⏱️ Halves Breakdown' },
  detailed: { es: '📋 Detalle por Categorías', en: '📋 Categorized Breakdown' },
  
  duels: { es: 'Duelos Ganados', en: 'Duels Won' },
  shotsAccuracy: { es: 'Precisión de Tiros', en: 'Shooting Accuracy' },
  possession: { es: 'Posesión Estimada', en: 'Estimated Possession' },
  finishing: { es: 'Eficacia de Gol', en: 'Finishing Efficiency' },

  won: { es: 'Ganados', en: 'Won' },
  lost: { es: 'Perdidos', en: 'Lost' },
  onTarget: { es: 'A Puerta', en: 'On Target' },
  offTarget: { es: 'Fuera', en: 'Off Target' },
  recovery: { es: 'Recuperaciones', en: 'Recoveries' },
  loss: { es: 'Pérdidas', en: 'Losses' },

  catShots: { es: '🎯 Remates y Finalización', en: '🎯 Shots & Finishing' },
  catDefense: { es: '🛡️ Defensa y Posesión', en: '🛡️ Defense & Possession' },
  catFouls: { es: '⚡ Faltas y Transiciones', en: '⚡ Fouls & Transitions' },
  catSetPieces: { es: '🟨 Disciplina y Balón Parado', en: '🟨 Discipline & Set Pieces' },
  catSectors: { es: '📍 Distribución por Sectores', en: '📍 Sector Distribution' },

  leftSector: { es: '⬅️ Banda Izquierda', en: '⬅️ Left Wing' },
  centerSector: { es: '⏺️ Pasillo Central', en: '⏺️ Center Corridor' },
  rightSector: { es: '➡️ Banda Derecha', en: '➡️ Right Wing' },

  ownTeam: { es: 'Mi Equipo', en: 'Our Team' },
  rivalTeam: { es: 'Rival', en: 'Opponent' },
  noEvents: { es: 'No se han registrado eventos estadísticos en este partido.', en: 'No statistical events recorded for this match.' }
};

export const MatchStatsBlock = ({
  matchData = {},
  events: propEvents = null,
  language = 'Español (ES)',
  showDonuts = true,
  showComparison = true,
  showHalves = true,
  showDetailedTables = true,
  containerStyle = {}
}) => {
  const { darkMode } = useTheme();
  const isEn = getEffectiveLanguage(language) === 'English (EN)';
  const t = (k) => (TEXTS[k] ? (isEn ? TEXTS[k].en : TEXTS[k].es) : k);

  const homeTeamName = matchData?.local || matchData?.equipoLocal || t('ownTeam');
  const awayTeamName = matchData?.visitante || matchData?.equipoVisitante || matchData?.rival || t('rivalTeam');

  const events = useMemo(() => {
    if (propEvents && Array.isArray(propEvents) && propEvents.length > 0) {
      return propEvents.filter(e => e && e.isValid !== false);
    }
    return getUnifiedMatchEvents(matchData);
  }, [propEvents, matchData]);

  const countOf = (type) => events.filter(e => e && e.type === type).length;
  const countOfSector = (sector) => events.filter(e => e && e.sector === sector).length;

  // ── Métricas Clave ──────────────────────────────────────────
  // 1. Remates
  const shotsOnOwn = countOf('shot_on_target_own');
  const shotsOffOwn = countOf('shot_off_target_own');
  const shotsTotalOwn = shotsOnOwn + shotsOffOwn;
  const shotsOnRival = countOf('shot_on_target_rival');
  const shotsOffRival = countOf('shot_off_target_rival');
  const shotsTotalRival = shotsOnRival + shotsOffRival;
  const goalsOwn = countOf('gol_local') + countOf('goal_own');
  const goalsRival = countOf('gol_rival') + countOf('goal_rival');

  // 2. Defensa & Posesión
  const recoveries = countOf('recovery');
  const losses = countOf('loss');
  const duelsWon = countOf('duel_won');
  const duelsLost = countOf('duel_lost');
  const totalPossEvents = recoveries + losses;
  const possPctOwn = totalPossEvents > 0 ? Math.round((recoveries / totalPossEvents) * 100) : 50;
  const possPctRival = 100 - possPctOwn;

  // 3. Faltas & Transiciones
  const foulsFavor = countOf('foul_favor');
  const foulsAgainst = countOf('foul_against');
  const counterNotCut = countOf('counter_not_cut');
  const playerNoFinish = countOf('player_no_finish');

  // 4. Balón Parado & Disciplina
  const cornersFavor = countOf('corner_favor');
  const cornersAgainst = countOf('corner_against');
  const offsidesOwn = countOf('offside_own');
  const offsidesRival = countOf('offside_rival');
  const yellowOwn = countOf('card_yellow_own') + countOf('amarilla');
  const yellowRival = countOf('card_yellow_rival');
  const redOwn = countOf('card_red_own') + countOf('roja');
  const redRival = countOf('card_red_rival');

  // 5. Sectores
  const sectorLeft = countOfSector('left');
  const sectorCenter = countOfSector('center');
  const sectorRight = countOfSector('right');
  const totalSectors = sectorLeft + sectorCenter + sectorRight;
  const pctLeft = totalSectors > 0 ? Math.round((sectorLeft / totalSectors) * 100) : 33;
  const pctCenter = totalSectors > 0 ? Math.round((sectorCenter / totalSectors) * 100) : 34;
  const pctRight = totalSectors > 0 ? Math.round((sectorRight / totalSectors) * 100) : 33;

  const cardBg = darkMode ? '#122415' : '#FFFFFF';
  const cardBorder = darkMode ? 'rgba(212, 168, 67, 0.35)' : '#CBD5E1';
  const textMain = darkMode ? '#FFFFFF' : '#0F172A';
  const textMuted = darkMode ? '#94A3B8' : '#64748B';

  if (events.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: '12px',
        color: textMuted,
        fontStyle: 'italic',
        fontSize: '14px',
        ...containerStyle
      }}>
        {t('noEvents')}
      </div>
    );
  }

  return (
    <div className="match-stats-block" style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...containerStyle }}>
      
      {/* ── 1. Resumen con Donas de Eficiencia ──────────────────── */}
      {showDonuts && (
        <section
          style={{
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: '1.5px',
            borderStyle: 'solid',
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '800', color: C.green, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('efficiency')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px', width: '100%' }}>
            <SvgDonut
              title={t('duels')}
              value1={duelsWon}
              value2={duelsLost}
              label1={t('won')}
              label2={t('lost')}
              color1={C.green}
              color2={C.red}
              darkMode={darkMode}
            />
            <SvgDonut
              title={t('shotsAccuracy')}
              value1={shotsOnOwn}
              value2={shotsOffOwn}
              label1={t('onTarget')}
              label2={t('offTarget')}
              color1={C.teal}
              color2={C.orange}
              darkMode={darkMode}
            />
            <SvgDonut
              title={t('possession')}
              value1={recoveries}
              value2={losses}
              label1={t('recovery')}
              label2={t('loss')}
              color1={C.blue}
              color2="#E11D48"
              darkMode={darkMode}
            />
            <SvgDonut
              title={t('finishing')}
              value1={goalsOwn}
              value2={Math.max(0, shotsTotalOwn - goalsOwn)}
              label1="Goles"
              label2="Remates"
              color1={C.gold}
              color2={darkMode ? 'rgba(212, 168, 67, 0.35)' : '#64748B'}
              darkMode={darkMode}
            />
          </div>
        </section>
      )}

      {/* ── 2. Comparativa Propio vs Rival & Desglose Mitades ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {showComparison && (
          <section
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: '1.5px',
              borderStyle: 'solid',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '800', color: C.gold, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('comparison')}
            </div>
            <SvgComparisonBars events={events} darkMode={darkMode} />
          </section>
        )}

        {showHalves && (
          <section
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: '1.5px',
              borderStyle: 'solid',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '800', color: C.orange, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('halves')}
            </div>
            <HalfBreakdown events={events} darkMode={darkMode} />
          </section>
        )}
      </div>

      {/* ── 3. Tablas Detalladas por Categorías ──────────────────── */}
      {showDetailedTables && (
        <section
          style={{
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: '1.5px',
            borderStyle: 'solid',
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '800', color: textMain, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('detailed')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Categoría 1: Remates */}
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '12px', borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: C.teal }}>{t('catShots')}</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Tiros a Puerta ({homeTeamName} / {awayTeamName}):</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{shotsOnOwn} - {shotsOnRival}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Tiros Fuera ({homeTeamName} / {awayTeamName}):</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{shotsOffOwn} - {shotsOffRival}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Total Remates:</span>
                  <span style={{ fontWeight: '800', color: C.green }}>{shotsTotalOwn} - {shotsTotalRival}</span>
                </div>
              </div>
            </div>

            {/* Categoría 2: Defensa & Posesión */}
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '12px', borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: C.blue }}>{t('catDefense')}</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Recuperaciones de balón:</span>
                  <span style={{ fontWeight: '700', color: C.green }}>{recoveries}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Pérdidas de balón:</span>
                  <span style={{ fontWeight: '700', color: C.red }}>{losses}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Duelos Ganados / Perdidos:</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{duelsWon} / {duelsLost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Posesión Estimada:</span>
                  <span style={{ fontWeight: '800', color: C.blue }}>{possPctOwn}% - {possPctRival}%</span>
                </div>
              </div>
            </div>

            {/* Categoría 3: Faltas & Transiciones */}
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '12px', borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: C.orange }}>{t('catFouls')}</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Faltas a Favor / En Contra:</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{foulsFavor} / {foulsAgainst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Contras no cortadas:</span>
                  <span style={{ fontWeight: '700', color: C.red }}>{counterNotCut}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Jugadas sin finalizar:</span>
                  <span style={{ fontWeight: '700', color: C.orange }}>{playerNoFinish}</span>
                </div>
              </div>
            </div>

            {/* Categoría 4: Balón Parado & Disciplina */}
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '12px', borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: C.gold }}>{t('catSetPieces')}</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Córners (Favor / Contra):</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{cornersFavor} / {cornersAgainst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Fueras de Juego (Propio / Rival):</span>
                  <span style={{ fontWeight: '700', color: textMain }}>{offsidesOwn} / {offsidesRival}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: textMuted }}>Tarjetas Amarillas / Rojas:</span>
                  <span style={{ fontWeight: '700', color: textMain }}>🟨 {yellowOwn + yellowRival} | 🟥 {redOwn + redRival}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sectores de la Jugada */}
          {totalSectors > 0 && (
            <div style={{ marginTop: '16px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '12px', borderRadius: '8px', border: `1px solid ${cardBorder}` }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: C.purple }}>{t('catSectors')}</h5>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '8px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#FFFFFF', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: textMuted }}>{t('leftSector')}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: C.purple, marginTop: '2px' }}>{sectorLeft} ({pctLeft}%)</div>
                </div>
                <div style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '8px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#FFFFFF', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: textMuted }}>{t('centerSector')}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: C.blue, marginTop: '2px' }}>{sectorCenter} ({pctCenter}%)</div>
                </div>
                <div style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '8px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#FFFFFF', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: textMuted }}>{t('rightSector')}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: C.teal, marginTop: '2px' }}>{sectorRight} ({pctRight}%)</div>
                </div>
              </div>
            </div>
          )}

        </section>
      )}

    </div>
  );
};

export default MatchStatsBlock;
