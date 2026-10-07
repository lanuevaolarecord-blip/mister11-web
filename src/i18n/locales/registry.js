/**
 * src/i18n/locales/registry.js
 * MÍSTER11 — Registro Central de Idiomas y Verificación Federativa
 * 
 * Reglas de Veracidad Lingüística:
 * - Carril A (UI): status = 'activo' | 'pending' | 'draft'
 * - Carril B (Clínico): clinicalStatus = 'activo' | 'pendiente' | 'fallback_es' | 'fallback_en'
 * - sourceOficial: Documentación oficial verificada con navegación / federación
 */

export const LOCALES_REGISTRY = {
  // ─── TIER 1 (Lanzados y Verificados) ───────────────────────────────────────
  'es': {
    code: 'es',
    label: 'Español (ES)',
    nativeName: 'Español',
    intl: 'es-ES',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'activo',
    tier: 1,
    sourceDoc: {
      oficial: true,
      federacion: 'RFEF / FIFA Medical (F-MARC)',
      titulo: 'FIFA 11+ Manual del Programa de Prevención de Lesiones',
      url: 'https://www.fifa.com/technical/medical/injury-prevention',
      idiomaDetectado: 'es',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'es-419': {
    code: 'es-419',
    label: 'Español (Latinoamérica)',
    nativeName: 'Español (Latam)',
    intl: 'es-419',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'activo',
    tier: 1,
    sourceDoc: {
      oficial: true,
      federacion: 'CONMEBOL / FIFA Medical',
      titulo: 'FIFA 11+ Programa Completo de Calentamiento para Prevenir Lesiones',
      url: 'https://www.fifa.com/technical/medical/injury-prevention',
      idiomaDetectado: 'es',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'en': {
    code: 'en',
    label: 'English (EN)',
    nativeName: 'English',
    intl: 'en-GB',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'activo',
    tier: 1,
    sourceDoc: {
      oficial: true,
      federacion: 'The FA / FIFA Medical (F-MARC)',
      titulo: 'FIFA 11+ A Complete Warm-Up Programme to Prevent Injuries - Manual',
      url: 'https://www.thefa.com/learning/coaching-resources/fifa-11-plus',
      idiomaDetectado: 'en',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'pt': {
    code: 'pt',
    label: 'Português (Brasil)',
    nativeName: 'Português',
    intl: 'pt-BR',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'activo',
    tier: 1,
    sourceDoc: {
      oficial: true,
      federacion: 'CBF / FIFA Medical',
      titulo: 'FIFA 11+ Manual do Programa Completo de Aquecimento para Prevenção de Lesões',
      url: 'https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11',
      idiomaDetectado: 'pt',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'fr': {
    code: 'fr',
    label: 'Français (FR)',
    nativeName: 'Français',
    intl: 'fr-FR',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'activo',
    tier: 1,
    sourceDoc: {
      oficial: true,
      federacion: 'FFF / FIFA Medical',
      titulo: 'Le 11+ Manuel du Programme d\'échauffement complet pour la prévention des blessures (FFF ESVP)',
      url: 'https://www.fff.fr/articles/direction-technique-nationale/details-articles/1879-echauffement-structure-a-visee-preventive-esvp.html',
      idiomaDetectado: 'fr',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'id': {
    code: 'id',
    label: 'Bahasa Indonesia (ID)',
    nativeName: 'Bahasa Indonesia',
    intl: 'id-ID',
    dir: 'ltr',
    status: 'activo',
    clinicalStatus: 'pendiente', // Doc en imagen/escaneado en PSSI; se preserva UI activa con fallback clínico informado
    tier: 1,
    sourceDoc: {
      oficial: 'pendiente_transcripcion',
      federacion: 'PSSI / FIFA Medical',
      titulo: 'FIFA 11+ Panduan Program Pemanasan Lengkap untuk Pencegahan Cedera (Dokumen PSSI)',
      url: 'https://www.pssi.org/development/medical/fifa-11-plus',
      idiomaDetectado: 'id',
      fechaConsulta: '2026-10-06',
      machineReadable: false
    }
  },

  // ─── TIER 2 (Declarados como 'pending' — Infraestructura lista, no lanzados) ─
  'it': {
    code: 'it',
    label: 'Italiano (IT)',
    nativeName: 'Italiano',
    intl: 'it-IT',
    dir: 'ltr',
    status: 'pending',
    clinicalStatus: 'pendiente',
    tier: 2,
    sourceDoc: {
      oficial: 'pending_verification',
      federacion: 'FIGC / Settore Tecnico',
      titulo: 'Programma 11+ di Prevenzione degli Infortuni FIFA',
      url: 'https://www.figc.it/it/tecnici/commissioni-mediche/programma-11-plus/',
      idiomaDetectado: 'it',
      fechaConsulta: '2026-10-06',
      machineReadable: false
    }
  },
  'de': {
    code: 'de',
    label: 'Deutsch (DE)',
    nativeName: 'Deutsch',
    intl: 'de-DE',
    dir: 'ltr',
    status: 'pending',
    clinicalStatus: 'pendiente',
    tier: 2,
    sourceDoc: {
      oficial: 'pending_verification',
      federacion: 'DFB / FIFA Medical',
      titulo: 'Die 11+ Ein komplettes Aufwärmprogramm zur Verletzungsprävention',
      url: 'https://www.dfb.de/medizin/verletzungspraevention/das-elf-plus-programm/',
      idiomaDetectado: 'de',
      fechaConsulta: '2026-10-06',
      machineReadable: false
    }
  },
  'nl': {
    code: 'nl',
    label: 'Nederlands (NL)',
    nativeName: 'Nederlands',
    intl: 'nl-NL',
    dir: 'ltr',
    status: 'pending',
    clinicalStatus: 'pendiente',
    tier: 2,
    sourceDoc: {
      oficial: false,
      federacion: 'KNVB',
      titulo: 'Blessurepreventie en Voetbalmedische Richtlijnen',
      url: 'https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie',
      idiomaDetectado: 'nl',
      fechaConsulta: '2026-10-06',
      machineReadable: true
    }
  },
  'tr': {
    code: 'tr',
    label: 'Türkçe (TR)',
    nativeName: 'Türkçe',
    intl: 'tr-TR',
    dir: 'ltr',
    status: 'pending',
    clinicalStatus: 'pendiente',
    tier: 2,
    sourceDoc: {
      oficial: false,
      federacion: 'TFF',
      titulo: 'Futbolda Sakatlık Önleme Protokolü',
      url: 'https://www.tff.org/default.aspx?pageID=350',
      idiomaDetectado: 'tr',
      fechaConsulta: '2026-10-06',
      machineReadable: false
    }
  },
  'ko': {
    code: 'ko',
    label: '한국어 (KO)',
    nativeName: '한국어',
    intl: 'ko-KR',
    dir: 'ltr',
    status: 'pending',
    clinicalStatus: 'pendiente',
    tier: 2,
    sourceDoc: {
      oficial: false,
      federacion: 'KFA',
      titulo: 'FIFA 11+ 축구 부상 예방 프로그램',
      url: 'https://www.kfa.or.kr/medical/injury_prevention',
      idiomaDetectado: 'ko',
      fechaConsulta: '2026-10-06',
      machineReadable: false
    }
  }
};

/**
 * Obtiene la lista de idiomas activos disponibles para el selector de UI
 */
export function getActiveLocales() {
  return Object.values(LOCALES_REGISTRY).filter(loc => loc.status === 'activo');
}

/**
 * Normaliza un código de idioma (es, en, es-419, Español (ES), English (EN)...)
 */
export function normalizeLocaleCode(langCode) {
  if (!langCode) return 'es';
  const str = String(langCode).trim();
  if (str === 'Español (ES)' || str === 'es-ES' || str === 'es') return 'es';
  if (str === 'Español (Latinoamérica)' || str === 'es-419' || str === 'es-LA') return 'es-419';
  if (str === 'English (EN)' || str === 'en-US' || str === 'en-GB' || str === 'en') return 'en';
  if (str === 'Português (Brasil)' || str === 'pt-BR' || str === 'pt') return 'pt';
  if (str === 'Français (FR)' || str === 'fr-FR' || str === 'fr') return 'fr';
  if (str === 'Bahasa Indonesia (ID)' || str === 'id-ID' || str === 'id') return 'id';
  return LOCALES_REGISTRY[str] ? str : 'es';
}

/**
 * Obtiene el objeto de locale para un código dado con fallback a Español
 */
export function getLocaleMetadata(langCode) {
  const norm = normalizeLocaleCode(langCode);
  return LOCALES_REGISTRY[norm] || LOCALES_REGISTRY['es'];
}

export default LOCALES_REGISTRY;
