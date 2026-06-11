import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { seedInitialData } from '../utils/seedData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [currentMode, setCurrentMode] = useState(() => {
    return localStorage.getItem('mister11_current_mode') || 'pro';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Si entra un usuario real por Firebase, limpiamos cualquier estado local mock
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('mister11_active_user_uid', currentUser.uid);
      } else {
        // Solo limpiamos si no estamos en modo invitado local
        setUser((prev) => {
          if (prev && prev.uid === 'invitado-local') {
            return prev;
          }
          localStorage.removeItem('mister11_active_user_uid');
          return null;
        });
        if (!user || user.uid !== 'invitado-local') {
          setActiveTeamId(null);
          setTeams([]);
          setUserProfile(null);
          setClub(null);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Escuchar el perfil del usuario en Firestore
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setClub(null);
      localStorage.removeItem('mister11_club_id');
      return;
    }
    if (user.uid === 'invitado-local') {
      setUserProfile({
        displayName: 'Entrenador Invitado',
        email: 'invitado@mister11.app',
      });
      setClub(null);
      localStorage.removeItem('mister11_club_id');
      return;
    }

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.clubId) {
          localStorage.setItem('mister11_club_id', data.clubId);
        } else {
          localStorage.removeItem('mister11_club_id');
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem('mister11_club_id');
      }
    });

    return () => unsubUser();
  }, [user]);

  // Si el usuario no tiene clubId, forzar modo 'pro'
  useEffect(() => {
    if (userProfile && !userProfile.clubId && currentMode !== 'pro') {
      setCurrentMode('pro');
      localStorage.setItem('mister11_current_mode', 'pro');
    }
  }, [userProfile, currentMode]);

  // Escuchar el club del usuario en Firestore
  useEffect(() => {
    if (!user || !userProfile || !userProfile.clubId) {
      setClub(null);
      return;
    }

    const unsubClub = onSnapshot(doc(db, 'clubs', userProfile.clubId), (docSnap) => {
      if (docSnap.exists()) {
        setClub(docSnap.data());
      } else {
        setClub(null);
      }
    });

    return () => unsubClub();
  }, [user, userProfile]);

  // Escuchar los equipos (usuario o club) en Firestore
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') return;

    let unsubTeams = () => {};

    const handleActiveTeamSelection = (teamList) => {
      const storageKey = currentMode === 'club' ? 'mister11_active_team_club' : 'mister11_active_team_pro';
      const savedTeamId = localStorage.getItem(storageKey);
      if (teamList.length > 0) {
        if (savedTeamId && teamList.find(t => t.id === savedTeamId)) {
          setActiveTeamId(savedTeamId);
          localStorage.setItem('mister11_active_team', savedTeamId);
        } else {
          setActiveTeamId(teamList[0].id);
          localStorage.setItem(storageKey, teamList[0].id);
          localStorage.setItem('mister11_active_team', teamList[0].id);
        }
      } else {
        setActiveTeamId(null);
      }
      setLoading(false);
    };

    const isClub = currentMode === 'club' && userProfile && userProfile.clubId;

    if (isClub) {
      const clubId = userProfile.clubId;
      const coaches = club?.coaches || [];
      const coachInfo = coaches.find(c => c.uid === user.uid);
      const isOwner = userProfile.clubRole === 'owner';
      const assignedTeams = coachInfo?.assignedTeams || [];

      const teamsRef = collection(db, 'clubs', clubId, 'teams');
      unsubTeams = onSnapshot(teamsRef, (snapshot) => {
        const allTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let filteredTeams;
        if (isOwner) {
          filteredTeams = allTeams;
        } else {
          filteredTeams = allTeams.filter(t => assignedTeams.includes(t.id));
        }
        setTeams(filteredTeams);
        handleActiveTeamSelection(filteredTeams);
      }, (err) => {
        console.error("Error loading club teams:", err);
        setLoading(false);
      });
    } else {
      // Entrenador individual
      const q = query(collection(db, 'users', user.uid, 'teams'));
      unsubTeams = onSnapshot(q, (snapshot) => {
        const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamList);
        
        if (teamList.length > 0) {
          handleActiveTeamSelection(teamList);
        } else {
          // Si el usuario real no tiene ningún equipo, creamos uno por defecto automáticamente
          const creatingKey = `mister11_creating_team_${user.uid}`;
          if (!localStorage.getItem(creatingKey)) {
            localStorage.setItem(creatingKey, 'true');
            
            const createDefaultTeam = async () => {
              try {
                const docRef = await addDoc(collection(db, 'users', user.uid, 'teams'), {
                  nombre: 'Mi Equipo',
                  categoria: 'General',
                  temporada: '2025-26',
                  createdAt: serverTimestamp()
                });
                
                const storageKey = currentMode === 'club' ? 'mister11_active_team_club' : 'mister11_active_team_pro';
                localStorage.setItem(storageKey, docRef.id);
                localStorage.setItem('mister11_active_team', docRef.id);
                setActiveTeamId(docRef.id);
                
                // Inyectar datos iniciales
                await seedInitialData(docRef.id, user.uid);
              } catch (err) {
                console.error("Error al crear equipo por defecto para nuevo usuario:", err);
              } finally {
                localStorage.removeItem(creatingKey);
                setLoading(false);
              }
            };
            createDefaultTeam();
          } else {
            setActiveTeamId(null);
            localStorage.removeItem('mister11_active_team');
            setLoading(false);
          }
        }
      }, (err) => {
        console.error("Error loading user teams:", err);
        setLoading(false);
      });
    }

    return () => unsubTeams();
  }, [user, userProfile, club, currentMode]);

  const changeActiveTeam = useCallback((id) => {
    setActiveTeamId(id);
    const storageKey = currentMode === 'club' ? 'mister11_active_team_club' : 'mister11_active_team_pro';
    localStorage.setItem(storageKey, id);
    localStorage.setItem('mister11_active_team', id);
  }, [currentMode]);

  const toggleMode = useCallback(() => {
    if (!userProfile?.clubId) return;
    setCurrentMode(prev => {
      const next = prev === 'club' ? 'pro' : 'club';
      localStorage.setItem('mister11_current_mode', next);
      return next;
    });
  }, [userProfile]);

  const refreshTeam = useCallback(async () => {
    if (!user || user.uid === 'invitado-local') return;
    try {
      const cId = userProfile?.clubId || localStorage.getItem('mister11_club_id');
      if (currentMode === 'club' && cId) {
        const coaches = club?.coaches || [];
        const coachInfo = coaches.find(c => c.uid === user.uid);
        const isOwner = userProfile?.clubRole === 'owner';
        const assignedTeams = coachInfo?.assignedTeams || [];

        const snapshot = await getDocs(collection(db, 'clubs', cId, 'teams'));
        const allTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let filteredTeams;
        if (isOwner) {
          filteredTeams = allTeams;
        } else {
          filteredTeams = allTeams.filter(t => assignedTeams.includes(t.id));
        }
        setTeams(filteredTeams);
      } else {
        const q = query(collection(db, 'users', user.uid, 'teams'));
        const snapshot = await getDocs(q);
        const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamList);
      }
    } catch (err) {
      console.error("Error refreshing teams:", err);
    }
  }, [user, userProfile, club, currentMode]);

  const getTeamPath = useCallback((teamId = activeTeamId) => {
    if (!user || user.uid === 'invitado-local') return '';
    const tId = teamId || activeTeamId;
    if (!tId) return '';
    const cId = userProfile?.clubId || localStorage.getItem('mister11_club_id');
    if (currentMode === 'club' && cId) {
      return `clubs/${cId}/teams/${tId}`;
    }
    return `users/${user.uid}/teams/${tId}`;
  }, [user, userProfile, activeTeamId, currentMode]);

  // Función centralizada para iniciar sesión en Modo Invitado
  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (anonErr) {
      console.warn("Fallo Inicio Anónimo, intentando cuenta de invitado dedicada...", anonErr);
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, "invitado@mister11.app", "mister11guest");
      } catch (emailErr) {
        console.warn("Fallo cuenta dedicada, iniciando Modo Invitado Local Autónomo...", emailErr);
        const mockUser = {
          uid: 'invitado-local',
          email: 'invitado@mister11.app',
          displayName: 'Entrenador Invitado',
          isAnonymous: true
        };
        localStorage.setItem('mister11_active_user_uid', 'invitado-local');
        setUser(mockUser);
        
        const mockTeam = {
          id: 'team-invitado',
          nombre: 'FC Invitado',
          name: 'FC Invitado',
          categoria: 'Juvenil',
          category: 'Juvenil',
          temporada: '2025-26',
          colorLocal: '#10B981',
          colorVisitante: '#059669',
          color: '#10B981',
          escudo: ''
        };
        setTeams([mockTeam]);
        setActiveTeamId('team-invitado');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem('mister11_active_user_uid');
      if (user && user.uid === 'invitado-local') {
        setUser(null);
        setActiveTeamId(null);
        setTeams([]);
      } else {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = useMemo(() => ({
    user, 
    loading, 
    activeTeamId, 
    changeActiveTeam, 
    teams,
    loginAsGuest,
    logout,
    refreshTeam,
    clubId: userProfile?.clubId || null,
    clubRole: userProfile?.clubRole || null,
    isClubMember: !!(userProfile?.clubId),
    club,
    getTeamPath,
    userProfile,
    currentMode,
    toggleMode
  }), [user, loading, activeTeamId, changeActiveTeam, teams, loginAsGuest, logout, refreshTeam, userProfile, club, getTeamPath, currentMode, toggleMode]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

