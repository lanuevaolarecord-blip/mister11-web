/**
 * src/types/i18n.d.ts
 * Míster11 — Definición de Tipos de Internacionalización e Idioma (B8)
 */

export type SupportedLocale = 'es' | 'es-419' | 'en' | 'pt' | 'fr' | 'id';

export type TranslationDictionary = Record<string, string>;

/**
 * Claves canónicas críticas de navegación y portal (sello de tipos)
 */
export type CanonicalCoreKey =
  | 'player.nav.profile'
  | 'player.nav.stats'
  | 'player.nav.chat'
  | 'player.nav.physical'
  | 'nav.schedule'
  | 'player.tab.plans';

export type ExactCoreDictionary = Record<CanonicalCoreKey, string>;

export interface I18nContextValue {
  language: SupportedLocale;
  isEn: boolean;
  t: (key: string, defaultVal?: string, params?: Record<string, string | number>) => string;
  changeLanguage: (lang: SupportedLocale) => void;
}
