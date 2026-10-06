/**
 * src/i18n/translations.js
 * MÍSTER11 — Sistema de Traducción e Internacionalización Modular
 * 
 * Re-exporta los diccionarios de locales Tier 1 y provee el helper t()
 * con soporte para N-lenguas, interpolación de variables y fallback en cascada.
 */

import {
  DICTIONARIES,
  LOCALES_REGISTRY,
  getActiveLocales,
  normalizeLocaleCode,
  getLocaleMetadata,
  es,
  es419,
  en,
  pt,
  fr,
  id
} from './locales/index.js';

export const translations = DICTIONARIES;

export {
  LOCALES_REGISTRY,
  getActiveLocales,
  normalizeLocaleCode,
  getLocaleMetadata,
  es,
  es419,
  en,
  pt,
  fr,
  id
};

export const getEffectiveLanguage = (input) => {
  // 1. Si se pasa explícitamente un string directo de idioma
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === 'English (EN)' || trimmed === 'en' || trimmed.toLowerCase() === 'english' || trimmed.toLowerCase().startsWith('en-')) {
      return 'English (EN)';
    }
    if (trimmed === 'Español (Latinoamérica)' || trimmed === 'es-419' || trimmed === 'es-LA') {
      return 'Español (Latinoamérica)';
    }
    if (trimmed === 'Português (Brasil)' || trimmed === 'pt-BR' || trimmed === 'pt' || trimmed.toLowerCase().startsWith('pt')) {
      return 'Português (Brasil)';
    }
    if (trimmed === 'Français (FR)' || trimmed === 'fr-FR' || trimmed === 'fr' || trimmed.toLowerCase().startsWith('fr')) {
      return 'Français (FR)';
    }
    if (trimmed === 'Bahasa Indonesia (ID)' || trimmed === 'id-ID' || trimmed === 'id' || trimmed.toLowerCase().startsWith('id')) {
      return 'Bahasa Indonesia (ID)';
    }
    if (trimmed === 'Español (ES)' || trimmed === 'es' || trimmed.toLowerCase() === 'spanish' || trimmed.toLowerCase().startsWith('es-')) {
      return 'Español (ES)';
    }
  }

  // 2. Preferencia activa global del usuario en el navegador (LanguageContext / localStorage)
  try {
    const saved = localStorage.getItem('mister11_language') || localStorage.getItem('language');
    if (saved && typeof saved === 'string') {
      const sTrim = saved.trim();
      if (sTrim === 'English (EN)' || sTrim === 'en' || sTrim.toLowerCase().startsWith('en')) return 'English (EN)';
      if (sTrim === 'Español (Latinoamérica)' || sTrim === 'es-419') return 'Español (Latinoamérica)';
      if (sTrim === 'Português (Brasil)' || sTrim === 'pt-BR' || sTrim === 'pt') return 'Português (Brasil)';
      if (sTrim === 'Français (FR)' || sTrim === 'fr-FR' || sTrim === 'fr') return 'Français (FR)';
      if (sTrim === 'Bahasa Indonesia (ID)' || sTrim === 'id-ID' || sTrim === 'id') return 'Bahasa Indonesia (ID)';
      if (sTrim === 'Español (ES)' || sTrim === 'es' || sTrim.toLowerCase().startsWith('es')) return 'Español (ES)';
    }
  } catch (_) {}

  // 3. Si input es un objeto (settings, matchData, etc.) y no había selección en localStorage
  if (input && typeof input === 'object') {
    const val = input.language || input.lang;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === 'English (EN)' || trimmed === 'en' || trimmed.toLowerCase().startsWith('en')) {
        return 'English (EN)';
      }
      if (trimmed === 'Español (Latinoamérica)' || trimmed === 'es-419') return 'Español (Latinoamérica)';
      if (trimmed === 'Português (Brasil)' || trimmed === 'pt-BR' || trimmed === 'pt') return 'Português (Brasil)';
      if (trimmed === 'Français (FR)' || trimmed === 'fr-FR' || trimmed === 'fr') return 'Français (FR)';
      if (trimmed === 'Bahasa Indonesia (ID)' || trimmed === 'id-ID' || trimmed === 'id') return 'Bahasa Indonesia (ID)';
      if (trimmed === 'Español (ES)' || trimmed === 'es' || trimmed.toLowerCase().startsWith('es')) {
        return 'Español (ES)';
      }
    }
  }

  // 4. Por defecto en Míster11 es SIEMPRE Español (ES)
  return 'Español (ES)';
};

export const t = (key, language, replacements = {}, fallback = null) => {
  const effLang = getEffectiveLanguage(language);
  const targetDict = translations[effLang] || translations['Español (ES)'];
  let text = targetDict?.[key];

  if (text === undefined) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('m11-i18n-missing-key', { detail: { key, lang: effLang } }));
    }
    text = translations['English (EN)']?.[key] || translations['Español (ES)']?.[key] || fallback || key;
  }
  
  if (typeof text === 'string') {
    Object.keys(replacements).forEach(r => {
      text = text.replace(new RegExp(`\\{${r}\\}`, 'g'), replacements[r]);
    });
  }
  
  return text;
};

export default translations;
