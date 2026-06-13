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
  const [personalTeams, setPersonalTeams] = useState([]);
  const [personalTeamsLoaded, setPersonalTeamsLoaded] = useState(false);
  const [clubTeams, setClubTeams] = useState([]);
  const [clubTeamsLoaded, setClubTeamsLoaded] = useState(false);

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
          setPersonalTeams([]);
          setPersonalTeamsLoaded(false);
          setClubTeams([]);
          setClubTeamsLoaded(false);
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

  // Escuchar los equipos personales en Firestore
  useEffect(() => {
    if (!user) {
      setPersonalTeams([]);
      setPersonalTeamsLoaded(false);
      return;
    }
    if (user.uid === 'invitado-local') {
      setPersonalTeamsLoaded(true);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'teams'));
    const unsubPersonal = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'personal'
      }));
      setPersonalTeams(list);
      setPersonalTeamsLoaded(true);
    }, (err) => {
      console.error("Error loading personal teams:", err);
      setPersonalTeamsLoaded(true);
    });

    return () => unsubPersonal();
  }, [user]);

  // Escuchar los equipos del club en Firestore (solo si el club está activo)
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') {
      setClubTeams([]);
      setClubTeamsLoaded(true);
      return;
    }

    const clubId = userProfile?.clubId;
    if (!clubId) {
      setClubTeams([]);
      setClubTeamsLoaded(true);
      return;
    }

    // Si el club existe pero no está activo, detenemos la suscripción y vaciamos
    if (club && club.status !== 'active') {
      setClubTeams([]);
      setClubTeamsLoaded(true);
      return;
    }

    // Esperar a que el club esté cargado para saber coaches/assignedTeams
    if (!club) {
      return;
    }

    const coaches = club.coaches || [];
    const coachInfo = coaches.find(c => c.uid === user.uid);
    const isOwner = userProfile?.clubRole === 'owner';
    const assignedTeams = coachInfo?.assignedTeams || [];

    const teamsRef = collection(db, 'clubs', clubId, 'teams');
    const unsubClub = onSnapshot(teamsRef, (snapshot) => {
      const allTeams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'club',
        clubName: club.name || 'Club'
      }));
      
      let filteredTeams;
      if (isOwner) {
        filteredTeams = allTeams;
      } else {
        filteredTeams = allTeams.filter(t => assignedTeams.includes(t.id));
      }
      setClubTeams(filteredTeams);
      setClubTeamsLoaded(true);
    }, (err) => {
      console.error("Error loading club teams:", err);
      setClubTeamsLoaded(true);
    });

    return () => unsubClub();
  }, [user, userProfile, club]);

  // Combinar ambas listas de equipos de forma reactiva
  const teams = useMemo(() => {
    if (user && user.uid === 'invitado-local') {
      return [{
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
      }];
    }
    return [...personalTeams, ...clubTeams];
  }, [user, personalTeams, clubTeams]);

  // Selección de equipo activo y creación de equipo por defecto
  useEffect(() => {
    if (!user) return;
    if (user.uid === 'invitado-local') {
      setActiveTeamId('team-invitado');
      setLoading(false);
      return;
    }

    // Esperar a que terminen de cargar ambos
    if (!personalTeamsLoaded || !clubTeamsLoaded) {
      return;
    }

    const combinedTeams = [...personalTeams, ...clubTeams];

    if (combinedTeams.length > 0) {
      const savedTeamId = localStorage.getItem('mister11_active_team');
      if (savedTeamId && combinedTeams.some(t => t.id === savedTeamId)) {
        setActiveTeamId(savedTeamId);
      } else {
        setActiveTeamId(combinedTeams[0].id);
        localStorage.setItem('mister11_active_team', combinedTeams[0].id);
      }
      setLoading(false);
    } else {
      // Si el usuario no tiene ningún equipo (ni personal ni de club), creamos uno por defecto
      const creatingKey = `mister11_creating_team_${user.uid}`;
      if (!localStorage.getItem(creatingKey)) {
        localStorage.setItem(creatingKey, 'true');
        
        const createDefaultTeam = async () => {
          try {
            const docRef = await addDoc(collection(db, 'users', user.uid, 'teams'), {
              nombre: 'Mi Equipo',
              categoria: 'General',
              temporada: '2025-26',
              source: 'personal',
              createdAt: serverTimestamp()
            });
            
            localStorage.setItem('mister11_active_team', docRef.id);
            setActiveTeamId(docRef.id);
            
            // Inyectar datos iniciales
            await seedInitialData(docRef.id, user.uid, `users/${user.uid}/teams/${docRef.id}`);
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
        setLoading(false);
      }
    }
  }, [user, personalTeamsLoaded, clubTeamsLoaded, personalTeams, clubTeams]);

  // Determinar de forma dinámica el modo actual (retrocompatibilidad)
  const currentMode = useMemo(() => {
    const activeTeam = teams.find(t => t.id === activeTeamId);
    return activeTeam?.source === 'club' ? 'club' : 'pro';
  }, [teams, activeTeamId]);

  const changeActiveTeam = useCallback((id) => {
    setActiveTeamId(id);
    localStorage.setItem('mister11_active_team', id);
  }, []);

  const toggleMode = useCallback(() => {
    // No-op (se eliminó el selector manual de modo)
  }, []);

  const refreshTeam = useCallback(async () => {
    // No-op (los listeners en tiempo real mantienen todo actualizado)
  }, []);

  const getTeamPath = useCallback((teamId = activeTeamId) => {
    if (!user || user.uid === 'invitado-local') return '';
    const tId = teamId || activeTeamId;
    if (!tId) return '';
    
    // Buscar el equipo en la lista unificada
    const team = [...personalTeams, ...clubTeams].find(t => t.id === tId);
    if (team?.source === 'club') {
      const cId = userProfile?.clubId || localStorage.getItem('mister11_club_id');
      return `clubs/${cId}/teams/${tId}`;
    }
    return `users/${user.uid}/teams/${tId}`;
  }, [user, userProfile, activeTeamId, personalTeams, clubTeams]);

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
        setPersonalTeams([mockTeam]);
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
        setPersonalTeams([]);
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

