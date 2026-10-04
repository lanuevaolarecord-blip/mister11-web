/**
 * src/utils/nextUpcomingOpponent.js
 * MÍSTER 11 — Selector Canónico Direccional de Próximo Partido / Rival
 * 
 * Reglas:
 * 1. Consulta DIRECCIONAL: partidos con fecha >= hoy (en zona horaria local).
 * 2. Estado: filtra partidos que NO estén finalizados ni con acta cerrada.
 * 3. Orden: ASCENDENTE por fecha y hora más cercana.
 * 4. Nombres canónicos de campos:
 *    - Fecha: m.date || m.fecha (YYYY-MM-DD)
 *    - Hora:  m.time || m.hour || m.hora || '12:00' (HH:mm)
 * 5. Caso vacío: devuelve null de forma segura (fallback a noRival sin crash).
 */

import { getMatchDerivedStatus } from './matchDerivedStatus.js';

/**
 * Obtiene la fecha local en formato YYYY-MM-DD
 * @param {Date} [d=new Date()]
 * @returns {string} Fecha local YYYY-MM-DD
 */
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte un partido a timestamp absoluto para ordenación precisa
 * @param {Object} m 
 * @returns {number} Timestamp en milisegundos
 */
export const getMatchDateTimeTimestamp = (m) => {
  if (!m) return Infinity;
  const rawDate = String(m.date || m.fecha || '').trim();
  if (!rawDate) return Infinity;
  const rawTime = String(m.time || m.hour || m.hora || '12:00').trim();
  const parsed = new Date(`${rawDate}T${rawTime.length === 5 ? rawTime + ':00' : rawTime}`);
  return isNaN(parsed.getTime()) ? Infinity : parsed.getTime();
};

/**
 * Devuelve el próximo partido real en el calendario (direccional >= hoy)
 * @param {Array<Object>} matches - Lista de partidos del equipo
 * @param {Date|string} [referenceDate=new Date()] - Fecha base de comparación
 * @returns {Object|null} El próximo partido más cercano o null si no hay futuros
 */
export const getNextUpcomingMatch = (matches = [], referenceDate = new Date()) => {
  if (!Array.isArray(matches) || matches.length === 0) return null;

  const todayStr = typeof referenceDate === 'string' 
    ? referenceDate.slice(0, 10) 
    : getLocalDateString(referenceDate);

  const upcoming = matches.filter((m) => {
    if (!m) return false;

    // 1. VERIF-1: Descartar partidos finalizados o con acta cerrada (!== Terminado && !== Finalizado && !acta.closed)
    const isExplicitlyFinished = Boolean(
      m.status === 'Terminado' ||
      m.status === 'Finalizado' ||
      m.status === 'finished' ||
      m.actaOficial?.closed === true ||
      m.finishedAt
    );
    if (isExplicitlyFinished) return false;

    // Comprobación con utilidad canónica
    const derivedStatus = getMatchDerivedStatus(m);
    if (derivedStatus === 'FINALIZADO') return false;

    // 2. Validación Direccional de Fecha (>= hoy)
    const matchDateStr = String(m.date || m.fecha || '').trim();
    if (!matchDateStr) return false;

    // Comparación lexicográfica YYYY-MM-DD
    return matchDateStr >= todayStr;
  });

  if (upcoming.length === 0) return null;

  // 3. Ordenación ASCENDENTE (el más próximo primero)
  upcoming.sort((a, b) => getMatchDateTimeTimestamp(a) - getMatchDateTimeTimestamp(b));

  return upcoming[0] || null;
};

export default getNextUpcomingMatch;
