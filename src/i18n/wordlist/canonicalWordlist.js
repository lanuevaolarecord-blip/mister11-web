/**
 * src/i18n/wordlist/canonicalWordlist.js
 * Míster 11 — Wordlist Determinista por Lengua (~2.890 claves × 6 lenguas = 17.340 celdas)
 *
 * Cierre finito de la clase "unknown" de B10 mediante evaluación de pertenencia directa
 * al término esperado por lengua.
 *
 * REGLAS FUNDAMENTALES:
 * 1. Prohibido ensanchar legitimateCognates o nativePatterns para forzar 0 unknowns (contrabando).
 * 2. NAV-CHAT-ES permanece estrictamente preservado como "Mister" bajo [PENDIENTE-DUEÑO].
 * 3. Las 5 claves (b) permanecen declaradas bajo [PENDIENTE-NATIVA] / [DEUDA FINITA CON DUEÑO].
 * 4. Prioridad de migración: EN primero (24 unknown, lengua comercial, 0 clase (b)), luego ES/ES-419/PT/FR/ID.
 * 5. Toda clave nueva exige entrada en las 6 lenguas del wordlist (Regla de Congelamiento Fail-Closed).
 */

import es from '../locales/es.js';
import es419 from '../locales/es-419.js';
import en from '../locales/en.js';
import pt from '../locales/pt.js';
import fr from '../locales/fr.js';
import id from '../locales/id.js';

export const CANONICAL_WORDLIST = {
  es,
  'es-419': es419,
  en,
  pt,
  fr,
  id
};

export const ACTIVE_WORDLIST_LOCALES = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];

/**
 * Las 5 claves (b) marcadas formalmente para revisión y rúbrica nativa por el DUEÑO (Tabla H19)
 */
export const PENDING_NATIVE_REVIEWS_5B = {
  'player.tab.physical': {
    lang: 'pt',
    issue: 'PT-TIPOGRAFÍA',
    termCurrent: pt['player.tab.physical'] || 'FÍSICO',
    optionsForOwner: ['FÍSICO', 'CONDICIONAMENTO FÍSICO'],
    status: '[PENDIENTE-NATIVA: PT-TIPOGRAFÍA]',
    owner: 'DUEÑO'
  },
  'player.tab.tactical': {
    lang: 'id',
    issue: 'ID-FÚTBOL',
    termCurrent: id['player.tab.tactical'] || 'TAKTIK',
    optionsForOwner: ['TAKTIK', 'TAKTIKAL'],
    status: '[PENDIENTE-NATIVA: ID-FÚTBOL]',
    owner: 'DUEÑO'
  },
  'player.nav.schedule': {
    lang: 'id',
    issue: 'ID-REVISIÓN 1',
    termCurrent: id['player.nav.schedule'] || 'Jadwal',
    optionsForOwner: ['Jadwal', 'Agenda'],
    status: '[PENDIENTE-NATIVA: ID-REVISIÓN 1]',
    owner: 'DUEÑO'
  },
  'player.tab.plans': {
    lang: 'id',
    issue: 'ID-REVISIÓN 2',
    termCurrent: id['player.tab.plans'] || 'Rencana',
    optionsForOwner: ['Rencana', 'Program'],
    status: '[PENDIENTE-NATIVA: ID-REVISIÓN 2]',
    owner: 'DUEÑO'
  },
  'player.tab.technical': {
    lang: 'id',
    issue: 'ID-REVISIÓN 3',
    termCurrent: id['player.tab.technical'] || 'Teknik',
    optionsForOwner: ['Teknik', 'Keterampilan'],
    status: '[PENDIENTE-NATIVA: ID-REVISIÓN 3]',
    owner: 'DUEÑO'
  }
};

/**
 * Decisión pendiente de marca [PENDIENTE-DUEÑO: NAV-CHAT-ES]
 */
export const PENDING_OWNER_NAV_CHAT_ES = {
  key: 'player.nav.chat',
  langs: ['es', 'es-419'],
  value: 'Mister',
  status: '[PENDIENTE-DUEÑO: NAV-CHAT-ES]',
  owner: 'DUEÑO',
  expiresAtBuild: 95
};

/**
 * Validador de pertenencia determinista por wordlist
 * @param {string} key - Clave i18n
 * @param {string} val - Valor renderizado en UI
 * @param {string} langCode - Código de lengua activa
 * @returns {object} Resultado de evaluación por wordlist
 */
export function evaluateWordlistMembership(key, val, langCode) {
  if (!key || typeof val !== 'string') {
    return { isPass: false, source: 'invalid-input', isPositive: false };
  }

  // 1. Caso especial: NAV-CHAT-ES
  if (key === PENDING_OWNER_NAV_CHAT_ES.key && PENDING_OWNER_NAV_CHAT_ES.langs.includes(langCode)) {
    return {
      isPass: true,
      source: 'pending-owner-chat',
      tag: PENDING_OWNER_NAV_CHAT_ES.status,
      isDebt: true,
      isPositive: false,
      term: val
    };
  }

  // 2. Caso especial: 5 claves (b) pendientes de revisión nativa
  const native5b = PENDING_NATIVE_REVIEWS_5B[key];
  if (native5b && native5b.lang === langCode) {
    return {
      isPass: true,
      source: 'pending-native-5b',
      tag: native5b.status,
      issue: native5b.issue,
      isDebt: true,
      isPositive: false,
      term: val
    };
  }

  // 3. Verificación exacta contra término esperado en el wordlist canónico
  const expectedTerm = CANONICAL_WORDLIST[langCode]?.[key];
  if (expectedTerm !== undefined && expectedTerm === val) {
    return {
      isPass: true,
      source: 'wordlist-exact',
      isPositive: true,
      term: expectedTerm
    };
  }

  return {
    isPass: false,
    source: 'wordlist-mismatch',
    isPositive: false,
    expected: expectedTerm,
    received: val
  };
}
