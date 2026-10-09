/**
 * src/utils/brand.js
 * MISTER11 — Única Fuente de Verdad Canónica para la Marca del Sistema (Oleada 6.2)
 *
 * Reglas de Canonización:
 * - BRAND_NAME_UPPER: 'MISTER11' (mayúsculas, logos, badges, títulos institucionales)
 * - BRAND_NAME: 'Mister11' (frase, texto continuo, diálogos)
 * - BRAND_DOMAIN: 'mister11.app' (dominio, enlaces, emails)
 * - PROHIBIDO: 'Mister 11' (con espacio), 'Míster11' (con tilde), 'MÍSTER11' (con tilde en sistema).
 */

export const BRAND_NAME = 'Mister11';
export const BRAND_NAME_UPPER = 'MISTER11';
export const BRAND_DOMAIN = 'mister11.app';

export const BRAND_TAGLINE = {
  es: 'Plataforma de Alto Rendimiento para Fútbol Base',
  en: 'High Performance Platform for Grassroots Football',
  pt: 'Plataforma de Alto Rendimento para Futebol de Base',
  fr: 'Plateforme de Haute Performance pour le Football de Base',
  id: 'Platform Performa Tinggi untuk Sepak Bola Pembinaan'
};

/**
 * Normaliza cualquier texto que contenga variantes espurias de la marca
 * eliminando tildes y espacios no canónicos.
 */
export function normalizeBrandText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/M[íi]ster\s+11/gi, 'Mister11')
    .replace(/MÍSTER11/g, 'MISTER11')
    .replace(/Míster11/g, 'Mister11');
}

export default {
  BRAND_NAME,
  BRAND_NAME_UPPER,
  BRAND_DOMAIN,
  BRAND_TAGLINE,
  normalizeBrandText
};
