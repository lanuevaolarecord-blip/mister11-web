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
  FIRST_COACH: {
    id: 'first_coach',
    label: 'Primer Entrenador',
    badge: '👑 Primer Entrenador',
    color: '#D4A843',
    description: 'Control total: gestión del equipo, miembros, partidos, sesiones y táctica.'
  },
  SECOND_COACH: {
    id: 'second_coach',
    label: 'Segundo Entrenador',
    badge: '🥈 Segundo Entrenador',
    color: '#3B82F6',
    description: 'Edición de partidos, alineaciones, sesiones, pizarra, planning y asistencia.'
  },
  ASSISTANT_COACH: {
    id: 'assistant_coach',
    label: 'Ayudante / 3er Entrenador',
    badge: '📋 Ayudante',
    color: '#10B981',
    description: 'Registro de Live Stats, control de asistencia y apoyo en sesiones.'
  },
  PHYSIO: {
    id: 'physio',
    label: 'Fisioterapeuta / Médico',
    badge: '🩺 Fisioterapeuta',
    color: '#EF4444',
    description: 'Acceso y edición de salud, lesiones, tests físicos/wellness y asistencia.'
  },
  ANALYST: {
    id: 'analyst',
    label: 'Analista Táctico',
    badge: '📊 Analista',
    color: '#8B5CF6',
    description: 'Registro y análisis de Live Stats en tiempo real, informes y analíticas.'
  }
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
        ...d.data()
      }));

      // Si la subcolección está vacía pero el equipo tiene ownerUid o members array en el doc principal
      if (list.length === 0 && currentTeam) {
        const fallbackOwner = {
          id: currentTeam.ownerUid || user.uid,
          uid: currentTeam.ownerUid || user.uid,
          email: currentTeam.ownerEmail || user.email || '',
          displayName: currentTeam.ownerName || user.displayName || 'Primer Entrenador',
          role: 'first_coach',
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
          role: 'first_coach'
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
    if (!user) return null;
    const member = members.find(m => m.uid === user.uid || m.id === user.uid);
    if (member) return member.role || 'first_coach';
    if (currentTeam?.ownerUid === user.uid) return 'first_coach';
    return 'first_coach'; // default si es el creador
  }, [user, members, currentTeam]);

  // Permisos según el rol
  const permissions = useMemo(() => {
    const role = currentUserRole;
    return {
      isFirstCoach: role === 'first_coach',
      canManageStaff: role === 'first_coach',
      canEditMatches: ['first_coach', 'second_coach', 'analyst', 'assistant_coach'].includes(role),
      canLiveRecord: ['first_coach', 'second_coach', 'analyst', 'assistant_coach'].includes(role),
      canEditSessions: ['first_coach', 'second_coach'].includes(role),
      canEditTacticBoard: ['first_coach', 'second_coach', 'analyst'].includes(role),
      canEditPlayers: ['first_coach', 'second_coach'].includes(role),
      canEditHealth: ['first_coach', 'physio', 'second_coach'].includes(role),
      canTakeAttendance: ['first_coach', 'second_coach', 'assistant_coach', 'physio'].includes(role),
      canExportReports: ['first_coach', 'second_coach', 'analyst'].includes(role)
    };
  }, [currentUserRole]);

  // 4. Crear invitación para un nuevo miembro del cuerpo técnico
  const inviteMember = useCallback(async (email, role = 'assistant_coach') => {
    if (!user || !targetTeamId) return null;
    const emailClean = email.trim().toLowerCase();

    // Comprobar si ya es miembro
    if (members.some(m => m.email?.toLowerCase() === emailClean)) {
      showToast('Este usuario ya es miembro del cuerpo técnico.', 'warning');
      return null;
    }

    const token = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const teamPath = getTeamPath(targetTeamId);

    const inviteData = {
      id: token,
      token,
      teamId: targetTeamId,
      teamPath,
      teamName: currentTeam?.nombre || currentTeam?.name || 'Mi Equipo',
      teamCategory: currentTeam?.categoria || currentTeam?.category || 'General',
      invitedByUid: user.uid,
      invitedByName: user.displayName || user.email,
      email: emailClean,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    };

    // Guardar en subcolección del equipo y en colección global de invitaciones de staff
    await setDoc(doc(db, `${teamPath}/staff_invitations`, token), inviteData);
    await setDoc(doc(db, 'staff_invitations', token), inviteData);

    const inviteUrl = `${window.location.origin}/join-team/${token}`;
    showToast('Enlace de invitación generado con éxito.', 'success');
    return { ...inviteData, inviteUrl };
  }, [user, targetTeamId, getTeamPath, currentTeam, members]);

  // 5. Actualizar rol de un miembro
  const updateMemberRole = useCallback(async (memberUid, newRole) => {
    if (!user || !targetTeamId) return;
    if (!permissions.isFirstCoach) {
      showToast('Solo el Primer Entrenador puede modificar los roles del cuerpo técnico.', 'error');
      return;
    }

    const teamPath = getTeamPath(targetTeamId);
    const memberRef = doc(db, `${teamPath}/members`, memberUid);
    await updateDoc(memberRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    // Actualizar también en el array `members` del documento del equipo para consultas rápidas
    const teamRef = doc(db, teamPath);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const currentList = teamSnap.data().members || [];
      const updatedList = currentList.map(m => m.uid === memberUid ? { ...m, role: newRole } : m);
      await updateDoc(teamRef, { members: updatedList }).catch(() => {});
    }

    showToast('Rol actualizado correctamente.', 'success');
  }, [user, targetTeamId, getTeamPath, permissions.isFirstCoach]);

  // 6. Eliminar a un miembro del cuerpo técnico
  const removeMember = useCallback(async (memberUid) => {
    if (!user || !targetTeamId) return;
    if (!permissions.isFirstCoach && memberUid !== user.uid) {
      showToast('Solo el Primer Entrenador puede eliminar miembros del equipo.', 'error');
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
    STAFF_ROLES
  };
};
