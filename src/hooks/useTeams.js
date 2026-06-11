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

  const addTeam = useCallback(async (teamData) => {
    if (!user) return;
    const colRef = getTeamsCollection();
    const cId = clubId || localStorage.getItem('mister11_club_id');
    const additionalFields = cId ? { assignedCoaches: [user.uid] } : {};

    const docRef = await addDoc(colRef, {
      ...teamData,
      ...additionalFields,
      createdAt: serverTimestamp()
    });
    // Cambiar el foco al nuevo equipo inmediatamente
    changeActiveTeam(docRef.id);
    // Insertar datos de muestra en background (no bloquea el flujo)
    seedInitialData(docRef.id, user.uid);
    return docRef;
  }, [user, changeActiveTeam, getTeamsCollection, clubId]);

  const updateTeam = useCallback(async (id, data) => {
    if (!user) return;
    const teamRef = doc(db, getTeamPath(id));
    return await updateDoc(teamRef, data);
  }, [user, getTeamPath]);

  const deleteTeam = useCallback(async (id) => {
    if (!user) return;
    const teamRef = doc(db, getTeamPath(id));
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
