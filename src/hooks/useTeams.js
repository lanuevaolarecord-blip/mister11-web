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
  const { user, teams, loading, activeTeamId, changeActiveTeam } = useAuth();

  const activeTeam = useMemo(() => teams.find(t => t.id === activeTeamId) || null, [teams, activeTeamId]);

  const addTeam = useCallback(async (teamData) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'users', user.uid, 'teams'), {
      ...teamData,
      createdAt: serverTimestamp()
    });
    // Cambiar el foco al nuevo equipo inmediatamente
    changeActiveTeam(docRef.id);
    // Insertar datos de muestra en background (no bloquea el flujo)
    seedInitialData(docRef.id, user.uid);
    return docRef;
  }, [user, changeActiveTeam]);

  const updateTeam = useCallback(async (id, data) => {
    if (!user) return;
    const teamRef = doc(db, 'users', user.uid, 'teams', id);
    return await updateDoc(teamRef, data);
  }, [user]);

  const deleteTeam = useCallback(async (id) => {
    if (!user) return;
    const teamRef = doc(db, 'users', user.uid, 'teams', id);
    return await deleteDoc(teamRef);
  }, [user]);

  const selectTeam = useCallback((team) => {
    changeActiveTeam(team.id);
  }, [changeActiveTeam]);

  const value = useMemo(() => ({
    teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam
  }), [teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam]);

  return value;
};
