/**
 * src/utils/pluralize.js
 * Helper para formateo de plurales y singulares con soporte internacional.
 */
export const pluralize = (count, singular, plural, includeCount = true) => {
  const num = typeof count === 'number' ? count : (parseInt(count, 10) || 0);
  const word = num === 1 ? singular : plural;
  return includeCount ? `${num} ${word}` : word;
};

export default pluralize;
