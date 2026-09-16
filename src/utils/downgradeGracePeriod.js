/**
 * src/utils/downgradeGracePeriod.js
 * Caso Límite 2: Periodo de gracia de 5 días tras downgrade del Owner.
 * Permite advertir al equipo y bloquear funciones PRO si expira la gracia sin reactivación.
 */

export const GRACE_PERIOD_DAYS = 5;

/**
 * Calcula el estado del periodo de gracia a partir del campo downgradeDate del equipo.
 * @param {Date|string|Object|null} downgradeDate - Timestamp de Firestore, Date o ISO string.
 * @returns {{ isInGracePeriod: boolean, isBlocked: boolean, daysRemaining: number, hoursRemaining: number }}
 */
export const calculateGracePeriod = (downgradeDate) => {
  if (!downgradeDate) {
    return {
      isInGracePeriod: false,
      isBlocked: false,
      daysRemaining: GRACE_PERIOD_DAYS,
      hoursRemaining: GRACE_PERIOD_DAYS * 24
    };
  }

  const dDate = downgradeDate?.toDate ? downgradeDate.toDate() : new Date(downgradeDate);
  if (isNaN(dDate.getTime())) {
    return {
      isInGracePeriod: false,
      isBlocked: false,
      daysRemaining: GRACE_PERIOD_DAYS,
      hoursRemaining: GRACE_PERIOD_DAYS * 24
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - dDate.getTime();

  if (diffMs < 0) {
    return {
      isInGracePeriod: true,
      isBlocked: false,
      daysRemaining: GRACE_PERIOD_DAYS,
      hoursRemaining: GRACE_PERIOD_DAYS * 24
    };
  }

  const totalGraceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const remainingMs = totalGraceMs - diffMs;

  if (remainingMs <= 0) {
    return {
      isInGracePeriod: false,
      isBlocked: true,
      daysRemaining: 0,
      hoursRemaining: 0
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  return {
    isInGracePeriod: true,
    isBlocked: false,
    daysRemaining,
    hoursRemaining
  };
};

export default calculateGracePeriod;
