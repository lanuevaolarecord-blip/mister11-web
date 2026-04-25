import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
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
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'teams'),
      where('entrenadorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamList);
      
      // Auto-select first team if none active
      if (teamList.length > 0 && !activeTeam) {
        const savedTeamId = localStorage.getItem('mister11_active_team');
        const found = teamList.find(t => t.id === savedTeamId) || teamList[0];
        setActiveTeam(found);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTeam]);

  const addTeam = async (teamData) => {
    return await addDoc(collection(db, 'teams'), {
      ...teamData,
      entrenadorId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  };

  const updateTeam = async (id, data) => {
    const teamRef = doc(db, 'teams', id);
    return await updateDoc(teamRef, data);
  };

  const deleteTeam = async (id) => {
    const teamRef = doc(db, 'teams', id);
    return await deleteDoc(teamRef);
  };

  const selectTeam = (team) => {
    setActiveTeam(team);
    localStorage.setItem('mister11_active_team', team.id);
  };

  return { teams, loading, activeTeam, addTeam, updateTeam, deleteTeam, selectTeam };
};
