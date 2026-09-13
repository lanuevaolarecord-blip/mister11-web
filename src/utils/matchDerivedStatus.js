/**
 * Utilidad canónica para determinar el estado derivado de un partido:
 * - 'FINALIZADO': Si el acta oficial está cerrada, el partido está terminado o finalizado.
 * - 'EN_EDICION': Si está activamente reabierto y el acta NO está cerrada.
 * - 'PENDIENTE': Si la fecha es igual o posterior a hoy y no ha terminado.
 * - 'NO_DISPUTADO': Si la fecha ya pasó y no se disputó.
 */
export const getMatchDerivedStatus = (m) => {
  if (!m) return 'NO_DISPUTADO';

  // 1. Si el acta oficial está cerrada, el partido está FINALIZADO (prevalece sobre cualquier reopenedAt histórico)
  const isActaClosed = m.actaOficial?.closed === true;

  // 2. Está en edición ÚNICAMENTE si está reabierto activamente y el acta NO está cerrada
  const isActivelyReopened = Boolean(
    (m.actaReabierta === true || m.status === 'En Edicion' || m.status === 'En Edición') &&
    !isActaClosed
  );
  if (isActivelyReopened) {
    return 'EN_EDICION';
  }

  // 3. Finalizado: si el acta está cerrada, si tiene finishedAt, o si su status es Terminado/Finalizado
  const isFinished = Boolean(
    isActaClosed ||
    m.finishedAt ||
    m.actaOficial?.closedAt ||
    m.status === 'Terminado' ||
    m.status === 'Finalizado' ||
    m.status === 'finished'
  );
  if (isFinished) {
    return 'FINALIZADO';
  }

  // 4. Sin finalizar: evaluar fecha
  const rawDate = m.fecha || m.date;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      const matchDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      if (matchDay >= currentDay) {
        return 'PENDIENTE';
      } else {
        return 'NO_DISPUTADO';
      }
    }
  }

  return 'NO_DISPUTADO';
};
