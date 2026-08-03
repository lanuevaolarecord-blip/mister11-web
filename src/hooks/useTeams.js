import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { seedInitialData } from '../utils/seedData';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

export const useTeams = () => {
  const { user, teams, loading, activeTeamId, changeActiveTeam, getTeamPath, clubId, currentMode } = useAuth();

  const activeTeam = useMemo(() => teams.find(t => t.id === activeTeamId) || null, [teams, activeTeamId]);

  const getTeamsCollection = useCallback(() => {
    if (!user) return null;
    const cId = clubId || localStorage.getItem('mister11_club_id');
    if (currentMode === 'club' && cId) {
      return collection(db, 'clubs', cId, 'teams');
    }
    return collection(db, 'users', user.uid, 'teams');
  }, [user, clubId, currentMode]);

  const addTeam = useCallback(async (teamData, sourceType = 'personal') => {
    if (!user) return;
    
    let colRef;
    const cId = clubId || localStorage.getItem('mister11_club_id');
    
    if (sourceType === 'club' && cId) {
      colRef = collection(db, 'clubs', cId, 'teams');
    } else {
      colRef = collection(db, 'users', user.uid, 'teams');
    }
    
    const additionalFields = sourceType === 'club' 
      ? { assignedCoaches: [user.uid], source: 'club' } 
      : { source: 'personal' };

    const docRef = await addDoc(colRef, {
      ...teamData,
      ...additionalFields,
      createdAt: serverTimestamp()
    });

    if (sourceType === 'club' && cId) {
      try {
        const clubRef = doc(db, 'clubs', cId);
        const clubSnap = await getDoc(clubRef);
        if (clubSnap.exists()) {
          const clubData = clubSnap.data();
          const updatedCoaches = (clubData.coaches || []).map(c => {
            if (c.uid === user.uid) {
              const assigned = c.assignedTeams || [];
              if (!assigned.includes(docRef.id)) {
                return { ...c, assignedTeams: [...assigned, docRef.id] };
              }
            }
            return c;
          });
          await updateDoc(clubRef, { coaches: updatedCoaches });
        }
      } catch (err) {
        console.error("Error updating assignedTeams on coach in club:", err);
      }
    }

    // Cambiar el foco al nuevo equipo inmediatamente
    changeActiveTeam(docRef.id);

    // Insertar datos de muestra en background usando la ruta construida directamente
    const teamPath = sourceType === 'club' && cId
      ? `clubs/${cId}/teams/${docRef.id}`
      : `users/${user.uid}/teams/${docRef.id}`;
    seedInitialData(docRef.id, user.uid, teamPath);

    return docRef;
  }, [user, changeActiveTeam, clubId]);

  const updateTeam = useCallback(async (id, data) => {
    if (!user) return;
    const teamRef = doc(db, getTeamPath(id));
    return await updateDoc(teamRef, data);
  }, [user, getTeamPath]);

  const deleteTeam = useCallback(async (id) => {
    if (!user) return;
    const path = getTeamPath(id);
    const teamRef = doc(db, path);

    // Borrado en cascada en cliente (limpieza inmediata y resiliencia offline)
    const subcollections = [
      'players',
      'sessions',
      'planning',
      'matches',
      'exercises',
      'notifications',
      'evaluaciones',
      'formations',
      'plans',
      'pizarras',
      'iaUsage'
    ];

    try {
      const batch = writeBatch(db);
      for (const sub of subcollections) {
        const colRef = collection(db, `${path}/${sub}`);
        const snap = await getDocs(colRef);
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
      }
      await batch.commit();
    } catch (err) {
      console.error("Error al borrar subcolecciones del equipo en cliente:", err);
    }

    return await deleteDoc(teamRef);
  }, [user, getTeamPath]);

  const selectTeam = useCallback((team) => {
    changeActiveTeam(team.id);
  }, [changeActiveTeam]);

  const value = useMemo(() => ({
    teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam
  }), [teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam]);

  return value;
};
