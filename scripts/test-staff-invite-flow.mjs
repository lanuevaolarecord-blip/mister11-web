/**
 * scripts/test-staff-invite-flow.mjs
 * Míster11 — Unit and Flow Validation for Role Invitations & Staff Heredado
 */

import { validateTeamCode } from '../src/utils/teamCodeManager.js';
import { STAFF_ROLES, getStaffPermissions, canAssignRole } from '../src/config/staffRoles.js';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🧪 [TEST] VALIDACIÓN DE CÓDIGOS, ROLES DE STAFF Y PERMISOS HEREDADOS');
console.log('══════════════════════════════════════════════════════════════════════\n');

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    failed = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

// 1. Validaciones de formato de códigos
console.log('▶ [1/4] Verificando validación de formato de códigos de equipo y staff...');
assert(validateTeamCode('ABC123').valid === true, 'Código simple de 6 caracteres válido');
assert(validateTeamCode('M11-ABC123').valid === true, 'Código de jugador con prefijo M11- válido');
assert(validateTeamCode('STAFF-XYZ789').isStaffCode === true, 'Código de staff con prefijo STAFF- detecta rol de staff');
assert(validateTeamCode('123').valid === false, 'Código de 3 caracteres inválido');
assert(validateTeamCode('ABC12345678').valid === false, 'Código demasiado largo inválido');
assert(validateTeamCode('').valid === false, 'Código vacío inválido');

// 2. Roles canónicos de Staff
console.log('\n▶ [2/4] Verificando roles canónicos de Staff definidos...');
assert(STAFF_ROLES.HEAD_COACH.id === 'head_coach', 'Primer entrenador presente');
assert(STAFF_ROLES.ASSISTANT_COACH.id === 'assistant_coach', 'Segundo entrenador presente');
assert(STAFF_ROLES.FITNESS_COACH.id === 'fitness_coach', 'Preparador físico presente');
assert(STAFF_ROLES.GK_COACH.id === 'gk_coach', 'Entrenador de porteros presente');
assert(STAFF_ROLES.ANALYST.id === 'analyst', 'Analista táctico presente');
assert(STAFF_ROLES.DELEGATE.id === 'delegate', 'Delegado presente');

// 3. Matriz de permisos de Staff
console.log('\n▶ [3/4] Verificando permisos por rol de Staff...');
const headPerms = getStaffPermissions('head_coach');
const assistantPerms = getStaffPermissions('assistant_coach');
const analystPerms = getStaffPermissions('analyst');

assert(headPerms.canManageMatches === true, 'Head coach tiene permiso para gestionar partidos');
assert(headPerms.canManageSquad === true, 'Head coach tiene permiso para gestionar plantilla');
assert(assistantPerms.canEditLiveStats === true, 'Assistant coach puede editar live stats');
assert(analystPerms.canManageSquad === false, 'Analista no puede eliminar jugadores de la plantilla');
assert(analystPerms.canViewAnalytics === true, 'Analista puede ver analíticas avanzadas');

// 4. Jerarquía de asignación de roles
console.log('\n▶ [4/4] Verificando permisos de asignación de roles...');
assert(canAssignRole('owner', 'assistant_coach') === true, 'Owner puede asignar segundo entrenador');
assert(canAssignRole('owner', 'head_coach') === true, 'Owner puede transferir primer entrenador');
assert(canAssignRole('assistant_coach', 'head_coach') === false, 'Segundo entrenador no puede reasignar primer entrenador');

if (failed) {
  console.error('\n❌ ERROR: Alguna prueba unitaria ha fallado.');
  process.exit(1);
} else {
  console.log('\n🎉 [PASS] 100% DE PRUEBAS DE INVITACIONES Y STAFF HEREDADO SUPERADAS CON ÉXITO');
}
