import { useState, useEffect } from 'react';
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

  const activeTeam = teams.find(t => t.id === activeTeamId) || null;

  const addTeam = async (teamData) => {
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
  };

  const updateTeam = async (id, data) => {
    if (!user) return;
    const teamRef = doc(db, 'users', user.uid, 'teams', id);
    return await updateDoc(teamRef, data);
  };

  const deleteTeam = async (id) => {
    if (!user) return;
    const teamRef = doc(db, 'users', user.uid, 'teams', id);
    return await deleteDoc(teamRef);
  };

  const selectTeam = (team) => {
    changeActiveTeam(team.id);
  };

  return { teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam };
};
