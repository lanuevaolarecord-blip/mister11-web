/**
 * Helper utilitario para pluralización coherente en ES y EN
 * @param {number} count 
 * @param {string} singular 
 * @param {string} plural 
 * @param {boolean} includeCount 
 * @returns {string}
 */
export const pluralize = (count, singular, plural, includeCount = true) => {
  const n = Number(count) || 0;
  const word = n === 1 ? singular : plural;
  return includeCount ? `${n} ${word}` : word;
};
