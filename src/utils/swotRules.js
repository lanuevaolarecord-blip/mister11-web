/**
 * src/utils/swotRules.js
 * Míster11 — Motor DAFO Trazable (Fase 4)
 *
 * Sistema determinista de >= 12 reglas tácticas que evalúan métricas reales
 * del partido (xG, exposición, exigencia de portería, duelos, etc.) para
 * construir la matriz DAFO trazable y posibilitar la redacción con IA
 * con estricto LANGUAGE LOCK sin inventar datos.
 */

import { calculateMatchDerivedIndices } from '../config/xgWeights';

export const SWOT_RULES = [
  // ── FORTALEZAS (Strengths) ────────────────────────────────────────────────
  {
    id: 'high_xg_diff',
    quadrant: 'strengths',
    textKey: 'swot.rule.high_xg_diff',
    metricRefs: (m) => [
      { label: 'xG Propio', value: `${m.ownXg} vs ${m.rivalXg}`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.ownXg >= m.rivalXg + 0.4) || (m.ownXg >= 1.5 && m.ownGoals >= 2)
  },
  {
    id: 'gk_decisive_hero',
    quadrant: 'strengths',
    textKey: 'swot.rule.gk_decisive_hero',
    metricRefs: (m) => [
      { label: 'Paradas Decisivas', value: `${m.decisiveSaves} (Total: ${m.totalSaves})`, targetRef: 'sec_gk' }
    ],
    condition: (m) => m.decisiveSaves >= 2 || (m.decisiveSaves >= 1 && m.totalSavePct >= 75)
  },
  {
    id: 'wing_defense_solid',
    quadrant: 'strengths',
    textKey: 'swot.rule.wing_defense_solid',
    metricRefs: (m) => [
      { label: 'Tiros Cómodos en Banda', value: `${m.defensiveExposureMap?.dentro_lateral?.comodo ?? 0}`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.defensiveExposureMap?.dentro_lateral?.comodo === 0) && (m.rivalShotsCount >= 2)
  },
  {
    id: 'duels_superiority',
    quadrant: 'strengths',
    textKey: 'swot.rule.duels_superiority',
    metricRefs: (m) => [
      { label: 'Duelos Ganados', value: `${m.duelsWonPct}% (${m.duelsWon}/${m.totalDuels})`, targetRef: 'sec_radar' }
    ],
    condition: (m) => m.duelsWonPct >= 55 || (m.duelsWon >= 8 && m.duelsWonPct >= 50)
  },

  // ── DEBILIDADES (Weaknesses) ──────────────────────────────────────────────
  {
    id: 'low_xg_conv',
    quadrant: 'weaknesses',
    textKey: 'swot.rule.low_xg_conv',
    metricRefs: (m) => [
      { label: 'xG vs Goles', value: `${m.ownXg} xG / ${m.ownGoals} Goles`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.ownXg >= 1.2 && m.ownGoals < m.ownXg * 0.6) || (m.ownShotsCount >= 8 && m.ownGoals === 0)
  },
  {
    id: 'central_box_leak',
    quadrant: 'weaknesses',
    textKey: 'swot.rule.central_box_leak',
    metricRefs: (m) => [
      { label: 'Tiros Área Central', value: `${m.defensiveExposureMap?.dentro_centro?.total ?? 0} (${m.defensiveExposureMap?.dentro_centro?.comodo ?? 0} cómodos)`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.defensiveExposureMap?.dentro_centro?.total >= 3) || (m.defensiveExposureMap?.dentro_centro?.comodo >= 2)
  },
  {
    id: 'set_piece_threat',
    quadrant: 'weaknesses',
    textKey: 'swot.rule.set_piece_threat',
    metricRefs: (m) => [
      { label: 'Balón Parado Rival', value: `${m.rivalSetPieceShots ?? 0} tiros`, targetRef: 'sec_timeline' }
    ],
    condition: (m) => (m.rivalSetPieceShots >= 2) || (m.concededFromSetPiece >= 1)
  },
  {
    id: 'duels_fragility',
    quadrant: 'weaknesses',
    textKey: 'swot.rule.duels_fragility',
    metricRefs: (m) => [
      { label: 'Eficacia Duelos', value: `${m.duelsWonPct}%`, targetRef: 'sec_radar' }
    ],
    condition: (m) => (m.duelsWonPct > 0 && m.duelsWonPct < 45 && m.totalDuels >= 6)
  },

  // ── OPORTUNIDADES (Opportunities) ─────────────────────────────────────────
  {
    id: 'counter_efficiency',
    quadrant: 'opportunities',
    textKey: 'swot.rule.counter_efficiency',
    metricRefs: (m) => [
      { label: 'Transiciones de Contra', value: `${m.ownCounterShots ?? 0} tiros`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.ownCounterShots >= 2) || (m.ownCounterGoals >= 1)
  },
  {
    id: 'high_attendance_cohesion',
    quadrant: 'opportunities',
    textKey: 'swot.rule.high_attendance_cohesion',
    metricRefs: (m) => [
      { label: 'Asistencia Plantilla', value: `${m.attendancePct}%`, targetRef: 'sec_lineup' }
    ],
    condition: (m) => m.attendancePct >= 80
  },

  // ── AMENAZAS (Threats) ───────────────────────────────────────────────────
  {
    id: 'rival_high_comfort',
    quadrant: 'threats',
    textKey: 'swot.rule.rival_high_comfort',
    metricRefs: (m) => [
      { label: 'Comodidad Rival', value: `${m.rivalComfortPct}% tiros cómodos`, targetRef: 'sec_shots' }
    ],
    condition: (m) => (m.rivalComfortPct >= 40 && m.rivalShotsCount >= 3)
  },
  {
    id: 'gk_high_exertion',
    quadrant: 'threats',
    textKey: 'swot.rule.gk_high_exertion',
    metricRefs: (m) => [
      { label: 'Índice de Exigencia', value: `${m.gkExertionIndex} (Tarde Exigente)`, targetRef: 'sec_gk' }
    ],
    condition: (m) => m.isDemandingMatch || m.gkExertionIndex >= 6
  },
  {
    id: 'late_fatigue',
    quadrant: 'threats',
    textKey: 'swot.rule.late_fatigue',
    metricRefs: (m) => [
      { label: 'Goles Últimos 15\'', value: `${m.concededLateGoals ?? 0}`, targetRef: 'sec_timeline' }
    ],
    condition: (m) => (m.concededLateGoals >= 1) || (m.rivalLateShots >= 3)
  }
];

/**
 * Extrae métricas cuantitativas globales para alimentar las reglas DAFO.
 */
export function extractSwotMetrics(matchData = {}, events = [], calledPlayers = []) {
  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
  const derived = calculateMatchDerivedIndices(safeEvents);

  let ownGoals = 0;
  let concededGoals = derived.concededGoals || 0;
  let duelsWon = 0;
  let duelsLost = 0;
  let ownCounterShots = 0;
  let ownCounterGoals = 0;
  let rivalSetPieceShots = 0;
  let concededFromSetPiece = 0;
  let concededLateGoals = 0;
  let rivalLateShots = 0;

  safeEvents.forEach(e => {
    const type = String(e.type || '').toLowerCase();
    const min = Number(e.minute || e.time || 0);
    const isLate = min >= 75;

    if (type === 'gol_local' || (type.includes('own') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol'))) {
      ownGoals++;
      if (e.playType === 'contra') ownCounterGoals++;
    }

    if (type === 'gol_rival' || (type.includes('rival') && (e.outcome === 'goal' || e.isGoal || e.result === 'gol'))) {
      if (isLate) concededLateGoals++;
      if (e.playType === 'balon_parado' || e.playType === 'balon parado' || e.playType === 'penalti') {
        concededFromSetPiece++;
      }
    }

    if (type === 'duel_won') duelsWon++;
    if (type === 'duel_lost') duelsLost++;

    if (type.includes('own') && e.playType === 'contra') {
      ownCounterShots++;
    }

    if (type.includes('rival')) {
      if (e.playType === 'balon_parado' || e.playType === 'balon parado' || e.playType === 'penalti') {
        rivalSetPieceShots++;
      }
      if (isLate && (type.includes('shot') || type.includes('goal'))) {
        rivalLateShots++;
      }
    }
  });

  const totalDuels = duelsWon + duelsLost;
  const duelsWonPct = totalDuels > 0 ? Math.round((duelsWon / totalDuels) * 100) : 50;

  // Asistencia calculada
  const totalSquad = Array.isArray(matchData.players) ? matchData.players.length : (calledPlayers.length || 15);
  const calledCount = Array.isArray(calledPlayers) ? calledPlayers.length : (matchData.convocados?.length || 11);
  const attendancePct = totalSquad > 0 ? Math.min(100, Math.round((calledCount / totalSquad) * 100)) : 80;

  return {
    ...derived,
    ownGoals,
    concededGoals,
    duelsWon,
    duelsLost,
    totalDuels,
    duelsWonPct,
    ownCounterShots,
    ownCounterGoals,
    rivalSetPieceShots,
    concededFromSetPiece,
    concededLateGoals,
    rivalLateShots,
    attendancePct,
  };
}

/**
 * Evalúa las reglas deterministas DAFO generando los ítems por cuadrante.
 */
export function evaluateSwotRules(matchData = {}, events = [], calledPlayers = []) {
  const metrics = extractSwotMetrics(matchData, events, calledPlayers);

  const quadrants = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  };

  SWOT_RULES.forEach(rule => {
    try {
      if (rule.condition(metrics)) {
        quadrants[rule.quadrant].push({
          id: rule.id,
          quadrant: rule.quadrant,
          textKey: rule.textKey,
          isRule: true,
          metricRefs: typeof rule.metricRefs === 'function' ? rule.metricRefs(metrics) : []
        });
      }
    } catch (err) {
      console.warn(`[evaluateSwotRules] Error evaluando regla ${rule.id}:`, err);
    }
  });

  return {
    metrics,
    quadrants
  };
}

/**
 * Genera el resumen táctico mediante IA (Groq vía /api/ia-generate) con LANGUAGE LOCK estricto.
 * Recibe EXCLUSIVAMENTE los ítems derivados y textos de reglas.
 */
export function buildSwotAiPrompt(swotQuadrants = {}, isEn = false, teamName = 'Mi Equipo') {
  const langDirective = isEn
    ? 'CRITICAL INSTRUCTION: You MUST write 100% in English. Never use Spanish words. Strictly produce a professional tactical post-match summary based ONLY on the provided derived items.'
    : 'INSTRUCCIÓN CRÍTICA: Debes escribir 100% en español profesional. No inventes métricas. Redacta una síntesis táctica basada EXCLUSIVAMENTE en los ítems DAFO derivados.';

  const sList = (swotQuadrants.strengths || []).map(i => `- ${i.text}`).join('\n');
  const wList = (swotQuadrants.weaknesses || []).map(i => `- ${i.text}`).join('\n');
  const oList = (swotQuadrants.opportunities || []).map(i => `- ${i.text}`).join('\n');
  const tList = (swotQuadrants.threats || []).map(i => `- ${i.text}`).join('\n');

  return `${langDirective}

Team: ${teamName}
Derived SWOT Analysis:
[STRENGTHS]:
${sList || (isEn ? 'None recorded' : 'Ninguna registrada')}

[WEAKNESSES]:
${wList || (isEn ? 'None recorded' : 'Ninguna registrada')}

[OPPORTUNITIES]:
${oList || (isEn ? 'None recorded' : 'Ninguna registrada')}

[THREATS]:
${tList || (isEn ? 'None recorded' : 'Ninguna registrada')}

Write exactly two concise, coherent tactical paragraphs:
1. Match diagnostics summarizing the key strengths and vulnerabilities.
2. Immediate training recommendations for the upcoming weekly sessions.
Do not output markdown headings like # or ##. Do not output reasoning or analysis steps.`;
}

/**
 * Invoca la IA para redactar el resumen táctico con fallback determinista.
 */
export async function generateSwotAiSummary({
  swotQuadrants = {},
  isEn = false,
  teamName = 'Mi Equipo',
  t = (k) => k
}) {
  // Traducir los textos de los ítems para el prompt y fallback
  const translatedQuadrants = {
    strengths: (swotQuadrants.strengths || []).map(i => ({ ...i, text: t(i.textKey) || i.textKey })),
    weaknesses: (swotQuadrants.weaknesses || []).map(i => ({ ...i, text: t(i.textKey) || i.textKey })),
    opportunities: (swotQuadrants.opportunities || []).map(i => ({ ...i, text: t(i.textKey) || i.textKey })),
    threats: (swotQuadrants.threats || []).map(i => ({ ...i, text: t(i.textKey) || i.textKey })),
  };

  // Fallback determinista limpio
  const fallbackText = isEn
    ? `TACTICAL DIAGNOSTIC: The team demonstrated clear strengths (${translatedQuadrants.strengths.map(s => s.text).join(' ')}), while needing to address key tactical points (${translatedQuadrants.weaknesses.map(w => w.text).join(' ')}).\n\nTARGER PRIORITIES: Focus weekly training on proactive defensive organization and refining attacking execution.`
    : `DIAGNÓSTICO TÁCTICO: El equipo mostró fortalezas determinantes (${translatedQuadrants.strengths.map(s => s.text).join(' ')}), requiriendo corrección en aspectos clave (${translatedQuadrants.weaknesses.map(w => w.text).join(' ')}).\n\nPRIORIDADES DE TRABAJO: Enfatizar en los entrenamientos semanales la contención defensiva y la toma de decisiones en el último tercio.`;

  try {
    const prompt = buildSwotAiPrompt(translatedQuadrants, isEn, teamName);
    const endpoint = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
      ? 'https://www.mister11.app/api/ia-generate'
      : '/api/ia-generate';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        lang: isEn ? 'en' : 'es'
      })
    });

    if (!res.ok) {
      return fallbackText;
    }

    const data = await res.json();
    let text = data?.result;
    if (!text || typeof text !== 'string') {
      return fallbackText;
    }

    // Limpieza de etiquetas think y preámbulos
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
    return text || fallbackText;
  } catch (err) {
    console.warn('[generateSwotAiSummary] Error invocando IA, usando fallback determinista:', err);
    return fallbackText;
  }
}
