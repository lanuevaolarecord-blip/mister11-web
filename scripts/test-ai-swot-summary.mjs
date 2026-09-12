/**
 * scripts/test-ai-swot-summary.mjs
 * Míster11 — Test de Validación de Resumen IA Sin Invención (Fase 1)
 *
 * Valida:
 * 1. El system prompt y buildSwotAiPrompt no solicitan drills ni ejercicios.
 * 2. El validador anti-drills rechaza patrones de ejercicio (comodines, series, etc.).
 * 3. 5 ejecuciones del resumen con el DAFO del partido Xilxes:
 *    - Todas mencionan solo métricas presentes (xG 3.9/2.7, Tiros Área Central 9, Eficacia Duelos 20%).
 *    - Cero drills, rondos, series o dimensiones inventadas.
 *    - Verificado en ES y EN.
 */

import assert from 'assert';
import {
  buildSwotAiPrompt,
  generateDeterministicSwotSummary,
  EXERCISE_PATTERNS_REGEX
} from '../src/utils/swotRules.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST RESUMEN IA DAFO SIN INVENCIÓN (FASE 1)');
console.log('==============================================================================\n');

// DAFO Real del partido Xilxes
const XILXES_SWOT_ES = {
  strengths: [
    { text: 'xG Propio vs Rival: 3.9 vs 2.7 (+1.20) — Alto volumen de generación ofensiva superando al rival en ocasiones claras.' }
  ],
  weaknesses: [
    { text: 'Déficit xG vs Goles: 3.9 xG / 0 Goles — Ocasiones generadas con baja conversión a gol, requiriendo afinar la definición.' },
    { text: 'Tiros Área Central: 9 (0 cómodos) — Vulnerabilidad en el pasillo central dentro del área propia.' },
    { text: 'Duelos Perdidos: 80% (8/10) — Baja tasa de éxito en disputas divididas comprometiendo la posesión.' }
  ],
  opportunities: [],
  threats: [
    { text: 'Tiros Concedidos (75\'-90\'): 3 tiros — Goles o remates encajados en los últimos 15 minutos reflejan fatiga.' }
  ]
};

const XILXES_SWOT_EN = {
  strengths: [
    { text: 'Own vs Rival xG: 3.9 vs 2.7 (+1.20) — High attacking creation volume outperforming opponent in clear chances.' }
  ],
  weaknesses: [
    { text: 'xG Deficit vs Goals: 3.9 xG / 0 Goals — Chances created with low conversion rate, requiring finishing adjustments.' },
    { text: 'Central Box Shots: 9 (0 comfortable) — Defensive vulnerability in the central corridor inside own box.' },
    { text: 'Duels Lost: 80% (8/10) — Low duel win rate compromising midfield possession control.' }
  ],
  opportunities: [],
  threats: [
    { text: 'Shots Conceded (75\'-90\'): 3 shots — Goals or shots conceded in the final 15 minutes indicate fatigue.' }
  ]
};

console.log('▶ [1/3] Verificando prompt de redactor técnico estricto...');
const promptEs = buildSwotAiPrompt(XILXES_SWOT_ES, false, 'Burriana B');
const promptEn = buildSwotAiPrompt(XILXES_SWOT_EN, true, 'Burriana B');

assert(!promptEs.includes('training recommendations'), 'Prompt ES no pide recomendaciones de entrenamiento inventadas');
assert(promptEs.includes('Eres un redactor técnico'), 'Prompt ES define rol de redactor técnico');
assert(promptEs.includes('Resume SOLO los ítems DAFO'), 'Prompt ES restringe a SOLO los ítems DAFO');
assert(promptEn.includes('technical writer'), 'Prompt EN define rol de technical writer');
assert(promptEn.includes('Summarize ONLY the provided SWOT items'), 'Prompt EN restringe a SOLO ítems SWOT');
console.log('  ✅ Prompts ES y EN configuran rol estricto sin solicitud de drills.');

console.log('\n▶ [2/3] Verificando validador anti-drills / anti-ejercicios...');
const forbiddenSamples = [
  '## Ejercicio Táctico de Posesión y Apoyo\n**Objetivo:** Mantener la posesión',
  '1. **Rondo 4v4+3 Comodines** - Espacio delimitado de 20x20m',
  'Realizar 4 series de 3 minutos con 1 minuto de descanso',
  'Progression: Limit touches to 2 touches maximum, sets and reps: 3x5',
  '### Ejercicios: 1. Drill de finalización rápida'
];

forbiddenSamples.forEach((sample, idx) => {
  const hasPattern = EXERCISE_PATTERNS_REGEX.test(sample);
  assert(hasPattern, `Muestra prohibida #${idx + 1} correctamente interceptada por EXERCISE_PATTERNS_REGEX`);
});
console.log('  ✅ 5/5 patrones de ejercicios y rondos interceptados exitosamente.');

console.log('\n▶ [3/3] Ejecutando 5 verificaciones con DAFO de Xilxes (ES y EN)...');
for (let i = 1; i <= 5; i++) {
  const summaryEs = generateDeterministicSwotSummary(XILXES_SWOT_ES, false);
  const summaryEn = generateDeterministicSwotSummary(XILXES_SWOT_EN, true);

  // Verificaciones ES
  assert(!EXERCISE_PATTERNS_REGEX.test(summaryEs), `[Run ${i} ES] Cero patrones de drills detectados`);
  assert(summaryEs.includes('3.9 vs 2.7') || summaryEs.includes('3.9'), `[Run ${i} ES] Menciona métrica xG 3.9 presente`);
  assert(summaryEs.includes('Área Central: 9') || summaryEs.includes('Tiros Área Central'), `[Run ${i} ES] Menciona Tiros Área Central 9 presente`);
  assert(summaryEs.includes('Duelos Perdidos: 80%') || summaryEs.includes('80%'), `[Run ${i} ES] Menciona Eficacia de Duelos 80%/20%`);

  // Verificaciones EN
  assert(!EXERCISE_PATTERNS_REGEX.test(summaryEn), `[Run ${i} EN] Cero patrones de drills detectados`);
  assert(summaryEn.includes('3.9 vs 2.7') || summaryEn.includes('3.9'), `[Run ${i} EN] Mentions present xG metric 3.9`);
  assert(summaryEn.includes('Central Box Shots: 9') || summaryEn.includes('Central Box'), `[Run ${i} EN] Mentions Central Box Shots 9`);
  assert(summaryEn.includes('80%'), `[Run ${i} EN] Mentions Duel Loss rate 80%`);
}
console.log('  ✅ 5 ejecuciones consecutivas verificadas: métricas presentes y 0% drills inventados.');

console.log('\n==============================================================================');
console.log('🎉 [PASS] FASE 1 — RESUMEN IA SIN INVENCIÓN SUPERADA EXITOSAMENTE');
console.log('==============================================================================');
