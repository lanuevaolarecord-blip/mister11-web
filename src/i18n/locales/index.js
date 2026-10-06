/**
 * src/i18n/locales/index.js
 * MÍSTER11 — Índice unificado de locales y diccionarios Tier 1
 */

import { LOCALES_REGISTRY, getActiveLocales, normalizeLocaleCode, getLocaleMetadata } from './registry.js';
import { es } from './es.js';
import { es419 } from './es-419.js';
import { en } from './en.js';
import { pt } from './pt.js';
import { fr } from './fr.js';
import { id } from './id.js';

export const DICTIONARIES = {
  'es': es,
  'Español (ES)': es,
  'es-419': es419,
  'Español (Latinoamérica)': es419,
  'en': en,
  'English (EN)': en,
  'pt': pt,
  'Português (Brasil)': pt,
  'fr': fr,
  'Français (FR)': fr,
  'id': id,
  'Bahasa Indonesia (ID)': id
};

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

export default DICTIONARIES;
