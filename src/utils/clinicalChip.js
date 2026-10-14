/**
 * src/utils/clinicalChip.js
 * Míster 11 — Plantilla Canónica Única del Chip Clínico de Fallback
 * 
 * Consumida por portal-E1, PDF y Library para garantizar
 * paridad exacta de markup y cadena en todas las lenguas.
 */

export const CLINICAL_FALLBACK_TEXTS = {
  es: 'contenido clínico en español',
  'es-419': 'contenido clínico en español',
  en: 'clinical content in Spanish',
  pt: 'conteúdo clínico em espanhol',
  fr: 'contenu clinique en espagnol',
  id: 'konten klinis dalam bahasa Spanyol'
};

export const CLINICAL_CHIP_STYLE = 'display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background-color: rgba(212, 168, 67, 0.15); color: #1B3A2D; border: 1px solid #9C6A3B;';

export function getClinicalChipText(lang = 'es') {
  const norm = (lang || 'es').toLowerCase();
  if (norm.startsWith('pt')) return CLINICAL_FALLBACK_TEXTS.pt;
  if (norm.startsWith('fr')) return CLINICAL_FALLBACK_TEXTS.fr;
  if (norm.startsWith('id')) return CLINICAL_FALLBACK_TEXTS.id;
  if (norm.startsWith('en')) return CLINICAL_FALLBACK_TEXTS.en;
  if (norm === 'es-419') return CLINICAL_FALLBACK_TEXTS['es-419'];
  return CLINICAL_FALLBACK_TEXTS.es;
}

export function getCanonicalClinicalChipHtml(lang = 'es', withStyle = true) {
  const text = getClinicalChipText(lang);
  const styleAttr = withStyle ? ` style="${CLINICAL_CHIP_STYLE}"` : '';
  return `<span class="clinical-fallback-chip"${styleAttr}><svg class="lucide-shield" width="12" height="12" color="#9C6A3B"></svg> ${text}</span>`;
}

export default {
  CLINICAL_FALLBACK_TEXTS,
  CLINICAL_CHIP_STYLE,
  getClinicalChipText,
  getCanonicalClinicalChipHtml
};
