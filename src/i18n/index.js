// src/i18n/index.js
// Singleton i18n sin React hooks + exportaciones centralizadas
// Compatible con Node (scripts/tests) y Navegador (React/Capacitor)

import { translations, getEffectiveLanguage, t as tFunction } from './translations.js';

export const LOCALES = {
  es: { code: 'es', label: 'Español (ES)', intl: 'es-ES', dir: 'ltr', name: 'Spanish' },
  en: { code: 'en', label: 'English (EN)', intl: 'en-GB', dir: 'ltr', name: 'English' }
};

// Estado singleton
let currentLanguage = getEffectiveLanguage();

/**
 * Obtiene el idioma efectivo actual (singleton sin hooks)
 */
export function getLanguage() {
  try {
    const saved = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('mister11_language') || localStorage.getItem('language'))
      : null;
    if (saved) {
      currentLanguage = getEffectiveLanguage(saved);
    }
  } catch (_) {}
  return currentLanguage;
}

/**
 * Cambia el idioma en caliente (singleton sin hooks)
 */
export function setLanguage(newLang) {
  const valid = (newLang === 'English (EN)' || newLang === 'en' || newLang === 'en-GB' || newLang === 'en-US')
    ? 'English (EN)'
    : 'Español (ES)';
  currentLanguage = valid;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mister11_language', valid);
      localStorage.setItem('language', valid);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('m11-language-changed', { detail: valid }));
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = valid === 'English (EN)' ? 'en' : 'es';
      document.documentElement.dir = 'ltr';
    }
  } catch (_) {}

  return valid;
}

/**
 * Devuelve true si el idioma activo es inglés
 */
export function isEn(lang = null) {
  const eff = lang ? getEffectiveLanguage(lang) : getLanguage();
  return eff === 'English (EN)';
}

/**
 * Devuelve el tag locale BCP47 ('es-ES' o 'en-GB')
 */
export function getLocale(lang = null) {
  return isEn(lang) ? LOCALES.en.intl : LOCALES.es.intl;
}

/**
 * Función singleton t() utilizable fuera de React (PDFs, scripts, websockets, etc.)
 */
export function t(key, replacements = {}, fallback = null) {
  return tFunction(key, getLanguage(), replacements, fallback);
}

/**
 * Formateo de fechas vía Intl con el locale activo
 */
export function fmtDate(date, options = {}) {
  if (!date) return '';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat(getLocale(), options).format(d);
  } catch (_) {
    return String(date);
  }
}

/**
 * Formateo de números vía Intl con el locale activo
 */
export function fmtNumber(number, options = {}) {
  if (number === null || number === undefined || isNaN(number)) return '';
  try {
    return new Intl.NumberFormat(getLocale(), options).format(number);
  } catch (_) {
    return String(number);
  }
}

/**
 * Selector de plurales según Intl.PluralRules (ej: keyBase.one / keyBase.other)
 */
export function fmtPlural(count, keyBase, params = {}) {
  const num = Number(count) || 0;
  const lang = getLanguage();
  const loc = getLocale(lang);
  try {
    const pr = new Intl.PluralRules(loc);
    const category = pr.select(num); // 'one', 'other'
    const candidateKey = `${keyBase}.${category}`;
    const translated = tFunction(candidateKey, lang, { count: num, n: num, ...params }, null);
    if (translated && translated !== candidateKey) {
      return translated;
    }
  } catch (_) {}
  return tFunction(keyBase, lang, { count: num, n: num, ...params });
}

/**
 * Nombres o iniciales de los días de la semana según Intl
 */
export function getWeekdays(style = 'narrow', startMonday = true) {
  const loc = getLocale();
  try {
    const days = [];
    const dtf = new Intl.DateTimeFormat(loc, { weekday: style });
    // 2026-01-05 es lunes
    const baseDay = startMonday ? 5 : 4;
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 0, baseDay + i);
      let s = dtf.format(d);
      if (style === 'narrow') s = s.charAt(0).toUpperCase();
      days.push(s);
    }
    return days;
  } catch (_) {
    return isEn() ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  }
}

// Re-exportar translations
export { translations, getEffectiveLanguage };
export default t;
