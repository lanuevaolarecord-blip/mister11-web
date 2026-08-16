import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

export const STAFF_ROLES = {
  ADMIN: {
    id: 'admin',
    aliases: ['first_coach', 'owner', 'admin'],
    label: 'Primer Entrenador (Admin)',
    badge: '👑 Primer Entrenador',
    color: '#D4A843',
    textColor: '#FFFFFF',
    description: 'Control total: gestión del equipo, miembros, partidos, sesiones, salud y táctica.'
  },
  COACH: {
    id: 'coach',
    aliases: ['second_coach', 'coach'],
    label: 'Segundo Entrenador',
    badge: '🟢 Segundo Entrenador',
    color: '#10B981',
    textColor: '#FFFFFF',
    description: 'Edición de partidos, alineaciones, sesiones, pizarra, planning y asistencia.'
  },
  ASSISTANT: {
    id: 'assistant',
    aliases: ['assistant_coach', 'assistant'],
    label: 'Ayudante / 3er Entrenador',
    badge: '🔵 Ayudante',
    color: '#3B82F6',
    textColor: '#FFFFFF',
    description: 'Registro de Live Stats, control de asistencia y apoyo en sesiones.'
  },
  PHYSIO: {
    id: 'physio',
    aliases: ['medical', 'physio'],
    label: 'Fisioterapeuta / Médico',
    badge: '🔴 Fisioterapeuta',
    color: '#EF4444',
    textColor: '#FFFFFF',
    description: 'Acceso y edición de historial médico, lesiones, tests físicos/wellness y asistencia.'
  },
  ANALYST: {
    id: 'analyst',
    aliases: ['scout', 'analyst'],
    label: 'Analista Táctico',
    badge: '🟣 Analista',
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    description: 'Registro y análisis de Live Stats en tiempo real, informes y analíticas.'
  },
  PLAYER: {
    id: 'player',
    aliases: ['jugador', 'player'],
    label: 'Jugador',
    badge: '⚪ Jugador',
    color: '#94A3B8',
    textColor: '#FFFFFF',
    description: 'Acceso de solo lectura a su ficha individual, sesiones y calendario.'
  }
};

export const normalizeRole = (role) => {
  if (!role) return 'admin';
  const r = role.toLowerCase().trim();
  for (const roleKey of Object.keys(STAFF_ROLES)) {
    const info = STAFF_ROLES[roleKey];
    if (info.id === r || info.aliases.includes(r)) {
      return info.id;
    }
  }
  return 'coach';
};

export const getRoleInfo = (role) => {
  const norm = normalizeRole(role);
  const found = Object.values(STAFF_ROLES).find(r => r.id === norm);
  return found || STAFF_ROLES.ADMIN;
};

export const useTeamMembers = (teamIdOverride = null) => {
  const { user, activeTeamId, getTeamPath, teams } = useAuth();
  const targetTeamId = teamIdOverride || activeTeamId;
  const currentTeam = useMemo(() => teams.find(t => t.id === targetTeamId) || null, [teams, targetTeamId]);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);

  // 1. Escuchar en tiempo real los miembros del equipo
  useEffect(() => {
    if (!user || !targetTeamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const teamPath = getTeamPath(targetTeamId);
    if (!teamPath) {
      setLoading(false);
      return;
    }

    // Escuchar subcolección 'members' dentro del equipo
    const membersRef = collection(db, `${teamPath}/members`);
    const unsub = onSnapshot(membersRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        uid: d.id,
        ...d.data(),
        normalizedRole: normalizeRole(d.data().role)
      }));

      // Si la subcolección está vacía pero el equipo tiene ownerUid en el doc principal
      if (list.length === 0 && currentTeam) {
        const fallbackOwner = {
          id: currentTeam.ownerUid || user.uid,
          uid: currentTeam.ownerUid || user.uid,
          email: currentTeam.ownerEmail || user.email || '',
          displayName: currentTeam.ownerName || user.displayName || 'Primer Entrenador',
          role: 'admin',
          normalizedRole: 'admin',
          joinedAt: currentTeam.createdAt || new Date().toISOString()
        };
        setMembers([fallbackOwner]);
      } else {
        setMembers(list);
      }
      setLoading(false);
    }, (err) => {
      console.warn('[useTeamMembers] Error al escuchar miembros:', err);
      // Fallback con el usuario actual si hay error de permisos
      if (user) {
        setMembers([{
          id: user.uid,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Entrenador',
          role: 'admin',
          normalizedRole: 'admin'
        }]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, targetTeamId, getTeamPath, currentTeam]);

  // 2. Escuchar invitaciones pendientes del equipo
  useEffect(() => {
    if (!user || !targetTeamId) {
      setInvitations([]);
      return;
    }

    const teamPath = getTeamPath(targetTeamId);
    if (!teamPath) return;

    const invRef = collection(db, `${teamPath}/staff_invitations`);
    const unsubInv = onSnapshot(invRef, (snapshot) => {
      const invList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setInvitations(invList);
    }, (err) => {
      console.warn('[useTeamMembers] Error escuchando invitaciones:', err);
    });

    return () => unsubInv();
  }, [user, targetTeamId, getTeamPath]);

  // 3. Determinar el rol del usuario actual en el equipo
  const currentUserRole = useMemo(() => {
    if (!user) return 'admin';
    const member = members.find(m => m.uid === user.uid || m.id === user.uid);
    if (member) return normalizeRole(member.role);
    if (currentTeam?.ownerUid === user.uid) return 'admin';
    return 'admin'; // default si es el creador
  }, [user, members, currentTeam]);

  // Permisos granulares según el rol
  const permissions = useMemo(() => {
    const role = currentUserRole;
    const isOwnerOrAdmin = ['admin', 'first_coach', 'owner'].includes(role);
    const isSeniorCoach = isOwnerOrAdmin || ['coach', 'second_coach'].includes(role);

    return {
      role,
      roleInfo: getRoleInfo(role),
      isAdmin: isOwnerOrAdmin,
      isFirstCoach: isOwnerOrAdmin,
      isCoach: isSeniorCoach,
      canManageStaff: isOwnerOrAdmin,
      canDeleteTeam: isOwnerOrAdmin,
      canEditMatches: isSeniorCoach || ['analyst', 'assistant', 'assistant_coach'].includes(role),
      canEditLineups: isSeniorCoach,
      canLiveRecord: isSeniorCoach || ['analyst', 'assistant', 'assistant_coach'].includes(role),
      canEditSessions: isSeniorCoach,
      canEditTacticBoard: isSeniorCoach || role === 'analyst',
      canEditPlayers: isSeniorCoach,
      canEditHealth: isOwnerOrAdmin || role === 'physio',
      canViewHealth: isSeniorCoach || role === 'physio',
      canTakeAttendance: isSeniorCoach || ['assistant', 'assistant_coach', 'physio'].includes(role),
      canExportReports: isSeniorCoach || role === 'analyst',
      isPhysioOnly: role === 'physio',
      isPlayer: role === 'player',
      isReadOnly: role === 'player'
    };
  }, [currentUserRole]);

  // 4. Crear invitación para un nuevo miembro del cuerpo técnico
  const inviteMember = useCallback(async (email, role = 'coach') => {
    if (!user || !targetTeamId) return null;
    const emailClean = email.trim().toLowerCase();

    // Comprobar si ya es miembro
    if (members.some(m => m.email?.toLowerCase() === emailClean)) {
      showToast('Este usuario ya es miembro del cuerpo técnico.', 'warning');
      return null;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = randomSuffix;
    const token = `staff_${Date.now()}_${inviteCode.toLowerCase()}`;
    const teamPath = getTeamPath(targetTeamId);

    const inviteData = {
      id: token,
      token,
      inviteCode,
      teamId: targetTeamId,
      teamPath,
      teamName: currentTeam?.nombre || currentTeam?.name || 'Mi Equipo',
      teamCategory: currentTeam?.categoria || currentTeam?.category || 'General',
      invitedByUid: user.uid,
      invitedByName: user.displayName || user.email,
      email: emailClean,
      role: normalizeRole(role),
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    };

    // Guardar en subcolección del equipo y en colección global de invitaciones de staff
    await setDoc(doc(db, `${teamPath}/staff_invitations`, token), inviteData);
    await setDoc(doc(db, 'staff_invitations', token), inviteData);
    await setDoc(doc(db, 'staff_invitations', inviteCode), inviteData);

    const inviteUrl = `${window.location.origin}/join-team/${token}`;
    showToast('Enlace y código de invitación generados con éxito.', 'success');
    return { ...inviteData, inviteUrl, inviteCode };
  }, [user, targetTeamId, getTeamPath, currentTeam, members]);

  // 5. Actualizar rol de un miembro
  const updateMemberRole = useCallback(async (memberUid, newRole) => {
    if (!user || !targetTeamId) return;
    if (!permissions.isFirstCoach) {
      showToast('Solo el Primer Entrenador (Admin) puede modificar los roles del cuerpo técnico.', 'error');
      return;
    }

    const normRole = normalizeRole(newRole);
    const teamPath = getTeamPath(targetTeamId);
    const memberRef = doc(db, `${teamPath}/members`, memberUid);
    await updateDoc(memberRef, {
      role: normRole,
      updatedAt: serverTimestamp()
    });

    // Actualizar también en el array `members` del documento del equipo para consultas rápidas
    const teamRef = doc(db, teamPath);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const currentList = teamSnap.data().members || [];
      const updatedList = currentList.map(m => m.uid === memberUid ? { ...m, role: normRole } : m);
      await updateDoc(teamRef, { members: updatedList }).catch(() => {});
    }

    // Actualizar puntero en el documento shared_teams del usuario
    try {
      const sharedRef = doc(db, 'users', memberUid, 'shared_teams', targetTeamId);
      await updateDoc(sharedRef, { role: normRole, updatedAt: serverTimestamp() }).catch(() => {});
    } catch (e) {}

    showToast('Rol actualizado correctamente.', 'success');
  }, [user, targetTeamId, getTeamPath, permissions.isFirstCoach]);

  // 6. Eliminar a un miembro del cuerpo técnico
  const removeMember = useCallback(async (memberUid) => {
    if (!user || !targetTeamId) return;
    if (!permissions.isFirstCoach && memberUid !== user.uid) {
      showToast('Solo el Primer Entrenador (Admin) puede eliminar miembros del equipo.', 'error');
      return;
    }

    const teamPath = getTeamPath(targetTeamId);
    await deleteDoc(doc(db, `${teamPath}/members`, memberUid));

    // Eliminar del array `members` del documento del equipo
    const teamRef = doc(db, teamPath);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const currentList = teamSnap.data().members || [];
      const updatedList = currentList.filter(m => m.uid !== memberUid);
      await updateDoc(teamRef, { members: updatedList }).catch(() => {});
    }

    // Eliminar de shared_teams del usuario
    try {
      await deleteDoc(doc(db, 'users', memberUid, 'shared_teams', targetTeamId)).catch(() => {});
    } catch (e) {}

    showToast('Miembro eliminado del cuerpo técnico.', 'info');
  }, [user, targetTeamId, getTeamPath, permissions.isFirstCoach]);

  // 7. Cancelar invitación pendiente
  const cancelInvitation = useCallback(async (token) => {
    if (!targetTeamId) return;
    const teamPath = getTeamPath(targetTeamId);
    await deleteDoc(doc(db, `${teamPath}/staff_invitations`, token)).catch(() => {});
    await deleteDoc(doc(db, 'staff_invitations', token)).catch(() => {});
    showToast('Invitación cancelada.', 'info');
  }, [targetTeamId, getTeamPath]);

  return {
    members,
    loading,
    invitations,
    currentUserRole,
    permissions,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    STAFF_ROLES,
    getRoleInfo,
    normalizeRole
  };
};
