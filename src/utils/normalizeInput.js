/**
 * Normaliza el texto utilizando NFC para evitar problemas con acentos en inputs de Android
 * (como la duplicación de caracteres al escribir á, é, í, ó, ú).
 * 
 * @param {string} text - El texto a normalizar.
 * @returns {string} El texto normalizado en formato NFC.
 */
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.normalize('NFC');
}
