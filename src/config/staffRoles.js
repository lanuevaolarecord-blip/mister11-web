/**
 * src/config/staffRoles.js
 * Míster11 — Definición canónica de roles y permisos para Cuerpo Técnico (Staff)
 *
 * PALETA OFICIAL: Cero azules. Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843).
 */

export const STAFF_ROLES = {
  HEAD_COACH: {
    id: 'head_coach',
    name: 'Entrenador Principal',
    labelEn: 'Head Coach',
    permissions: ['all'],
    canInviteOthers: true,
    color: '#1B3A2D'
  },
  ASSISTANT_COACH: {
    id: 'assistant_coach',
    name: 'Segundo Entrenador',
    labelEn: 'Assistant Coach',
    permissions: ['read', 'write', 'edit_sessions', 'edit_matches'],
    canInviteOthers: false,
    color: '#4CAF7D'
  },
  FITNESS_COACH: {
    id: 'fitness_coach',
    name: 'Preparador Físico',
    labelEn: 'Fitness Coach',
    permissions: ['read', 'write', 'edit_sessions', 'edit_wellness'],
    canInviteOthers: false,
    color: '#D4A843'
  },
  GK_COACH: {
    id: 'gk_coach',
    name: 'Entrenador de Porteros',
    labelEn: 'Goalkeeper Coach',
    permissions: ['read', 'write', 'edit_sessions'],
    canInviteOthers: false,
    color: '#10B981'
  },
  ANALYST: {
    id: 'analyst',
    name: 'Analista Táctico',
    labelEn: 'Tactical Analyst',
    permissions: ['read', 'write', 'edit_stats'],
    canInviteOthers: false,
    color: '#2E7D5C'
  },
  DELEGATE: {
    id: 'delegate',
    name: 'Delegado',
    labelEn: 'Team Delegate',
    permissions: ['read', 'edit_attendance', 'edit_communications'],
    canInviteOthers: false,
    color: '#8B5CF6'
  }
};

export const getRoleById = (roleId) => {
  if (!roleId) return STAFF_ROLES.ASSISTANT_COACH;
  const match = Object.values(STAFF_ROLES).find(r => r.id === roleId);
  return match || STAFF_ROLES.ASSISTANT_COACH;
};

export const getStaffPermissions = (roleId) => {
  const role = getRoleById(roleId);
  const isHead = role.id === 'head_coach' || role.permissions.includes('all');
  const isAssistant = role.id === 'assistant_coach';
  return {
    canManageSquad: isHead || isAssistant,
    canManageMatches: isHead || role.permissions.includes('edit_matches'),
    canEditSessions: isHead || role.permissions.includes('edit_sessions'),
    canEditLiveStats: isHead || role.permissions.includes('edit_matches') || role.permissions.includes('edit_stats'),
    canViewAnalytics: true,
    canInviteStaff: Boolean(role.canInviteOthers)
  };
};

export const canAssignRole = (actorRole, targetRoleId) => {
  if (actorRole === 'owner' || actorRole === 'head_coach') return true;
  return false;
};

