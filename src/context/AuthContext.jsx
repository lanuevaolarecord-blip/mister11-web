import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setActiveTeamId(null);
        setTeams([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'users', user.uid, 'teams'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamList);
      
      const savedTeamId = localStorage.getItem('mister11_active_team');
      if (teamList.length > 0) {
        if (savedTeamId && teamList.find(t => t.id === savedTeamId)) {
          setActiveTeamId(savedTeamId);
        } else {
          setActiveTeamId(teamList[0].id);
          localStorage.setItem('mister11_active_team', teamList[0].id);
        }
      } else {
        setActiveTeamId(null);
        localStorage.removeItem('mister11_active_team');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const changeActiveTeam = useCallback((id) => {
    setActiveTeamId(id);
    localStorage.setItem('mister11_active_team', id);
  }, []);

  const value = useMemo(() => ({
    user, 
    loading, 
    activeTeamId, 
    changeActiveTeam, 
    teams
  }), [user, loading, activeTeamId, changeActiveTeam, teams]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
