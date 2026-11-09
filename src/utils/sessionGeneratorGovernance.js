/**
 * src/utils/sessionGeneratorGovernance.js
 * Míster 11 — D7 (Oleada 9.3): Gobernanza Clínica y Técnica para el Generador Automático de Sesiones
 *
 * DECISIÓN DEL DUEÑO: CON PREPARADOR FÍSICO.
 *
 * 1. Prohibido auto-firmar heurísticas de carga, fatiga o riesgo clínico mediante IA o algoritmos sin firma colegiada.
 * 2. Todo generador automático de sesiones exige el flag `requiresPhysioApproval: true`.
 * 3. Queda terminantemente bloqueada la prescripción automática de ejercicios de alto riesgo (Nordic, Copenhague, Drop Jump, Cuello GK)
 *    sin verificación física colegiada (rigVerifiedBy) y supervisión presencial.
 * 4. Matriz de dosificación, umbrales de fatiga (ACWR / RPE) y edad mínima deben ser validados por preparador físico antes de su activación.
 */

export const SESSION_GENERATOR_GOVERNANCE = Object.freeze({
  implemented: false,
  phase: 'Fase 6 (Planificada)',
  requiresPhysioApproval: true,
  requiresPhysicalTrainerValidation: true,
  autoPrescribeHighRiskAllowed: false,
  ownerDecision: 'CON PREPARADOR FÍSICO',
  debtTag: '[DEUDA FINITA CON DUEÑO: PREPARADOR FÍSICO]',
  debtDetails: {
    owner: 'DUEÑO / PREPARADOR FÍSICO',
    action: 'Validar matriz de dosificación, umbrales de fatiga, exclusión de alto riesgo sin supervisión/fisio y edad mínima antes de activar generador.',
    deadline: 'Previo a lanzamiento de Fase 6 / Beta Abierta'
  }
});

/**
 * Validador de prescripción automática fail-closed contra gobernanza D7
 */
export function canAutoPrescribeSession(sessionPlan = {}, context = {}) {
  // Fail-closed por gobernanza clínica
  if (SESSION_GENERATOR_GOVERNANCE.requiresPhysioApproval && !context.physioApproved) {
    return {
      allowed: false,
      reason: 'physio_approval_required',
      message: 'La generación automática de sesiones exige aprobación previa por preparador físico colegiado.'
    };
  }

  // Si incluye alto riesgo sin verificación
  const exercises = sessionPlan.exercises || [];
  const hasUnverifiedHighRisk = exercises.some(ex => ex.tier_riesgo === 'PENDIENTE-FISIO' || (ex.tier_riesgo === 'alto' && !ex.rigVerifiedBy));
  if (hasUnverifiedHighRisk) {
    return {
      allowed: false,
      reason: 'unverified_high_risk_exercise',
      message: 'Bloqueado: no se permite prescribir ejercicios de alto riesgo o PENDIENTE-FISIO sin rigVerifiedBy.'
    };
  }

  return { allowed: true, reason: 'approved' };
}
