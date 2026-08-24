/**
 * src/utils/normalizeEmail.js
 * Míster11 — Normalización de Email para Unicidad Server-Side
 *
 * Elimina discrepancias por mayúsculas, espacios, puntos en local-part
 * y alias de etiquetas '+' en dominios de Google (Gmail/Googlemail).
 */

export const normalizeEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') return '';

  const trimmed = rawEmail.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return trimmed;

  let [localPart, domainPart] = parts;

  // Normalización de dominios Google
  if (domainPart === 'googlemail.com' || domainPart === 'gmail.com') {
    domainPart = 'gmail.com';
    // 1. Quitar todo lo posterior al signo '+' (alias de Gmail)
    localPart = localPart.split('+')[0];
    // 2. Quitar todos los puntos en el localPart
    localPart = localPart.replace(/\./g, '');
  }

  return `${localPart}@${domainPart}`;
};

export default normalizeEmail;
