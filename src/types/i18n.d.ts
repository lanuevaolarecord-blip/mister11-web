/**
 * src/types/i18n.d.ts
 * Míster 11 — Tipado Estricto de Internacionalización (P9 / B8)
 *
 * Convierte el slug-fallback de B10 en un error de compilación estático.
 * Claves tipadas como Record<SupportedLocale, string> estricto.
 * 100% libre de 'any'.
 */

export type SupportedLocale = 'es' | 'es-419' | 'en' | 'pt' | 'fr' | 'id';

/**
 * Claves canónicas críticas del Portal y Navegación (Sello estricto de paridad)
 */
export type CanonicalCoreKey =
  | 'player.nav.profile'
  | 'player.nav.stats'
  | 'player.nav.chat'
  | 'player.nav.physical'
  | 'player.nav.schedule'
  | 'player.nav.tests'
  | 'nav.schedule'
  | 'nav.dashboard'
  | 'nav.tests'
  | 'player.tab.plans'
  | 'player.tab.general'
  | 'player.tab.physical'
  | 'player.tab.technical'
  | 'player.tab.tactical'
  | 'player.tab.chat'
  | 'player.plans.title'
  | 'player.plans.subtitle'
  | 'player.profile.position'
  | 'player.profile.category'
  | 'plan.type.prevencion'
  | 'plan.type.recuperacion'
  | 'plan.type.fortalecimiento';

/**
 * Diccionario estricto para cada lengua activa:
 * Cada clave canónica declarada debe existir obligatoriamente como string (sin optional ?).
 * Si falta una sola clave en una lengua -> TS2741 Error de compilación en build.
 */
export type ExactCoreDictionary = Record<CanonicalCoreKey, string>;

/**
 * Registro simétrico de las 6 lenguas oficiales para el Wordlist determinista
 */
export type CanonicalWordlistRecord = Record<SupportedLocale, ExactCoreDictionary>;

/**
 * Clave canónica de traducción admitida por el motor
 */
export type I18nKey = CanonicalCoreKey | (string & {});

export interface I18nContextValue {
  language: SupportedLocale;
  isEn: boolean;
  t: <K extends CanonicalCoreKey>(key: K, defaultVal?: string, params?: Record<string, string | number>) => string;
  changeLanguage: (lang: SupportedLocale) => void;
}

export declare function t<K extends CanonicalCoreKey>(
  key: K,
  lang?: SupportedLocale | string,
  params?: Record<string, string | number>
): string;
