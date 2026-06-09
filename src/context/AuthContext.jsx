import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { seedInitialData } from '../utils/seedData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [teams, setTeams] = useState([]);

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
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || user.uid === 'invitado-local') return;
    
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
        setLoading(false);
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
    });

    return () => unsubscribe();
  }, [user]);

  const changeActiveTeam = useCallback((id) => {
    setActiveTeamId(id);
    localStorage.setItem('mister11_active_team', id);
  }, []);

  const refreshTeam = useCallback(async () => {
    if (!user || user.uid === 'invitado-local') return;
    try {
      const q = query(collection(db, 'users', user.uid, 'teams'));
      const snapshot = await getDocs(q);
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamList);
    } catch (err) {
      console.error("Error refreshing teams:", err);
    }
  }, [user]);

  // Función centralizada para iniciar sesión en Modo Invitado de forma 100% a prueba de fallos
  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Intentamos inicio anónimo nativo en Firebase
      await signInAnonymously(auth);
    } catch (anonErr) {
      console.warn("Fallo Inicio Anónimo, intentando cuenta de invitado dedicada...", anonErr);
      try {
        // 2. Intentamos con cuenta de invitado pre-creada (Email/Password)
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, "invitado@mister11.app", "mister11guest");
      } catch (emailErr) {
        console.warn("Fallo cuenta dedicada, iniciando Modo Invitado Local Autónomo...", emailErr);
        // 3. Fallback absoluto local y 100% funcional sin conexión
        const mockUser = {
          uid: 'invitado-local',
          email: 'invitado@mister11.app',
          displayName: 'Entrenador Invitado',
          isAnonymous: true
        };
        localStorage.setItem('mister11_active_user_uid', 'invitado-local');
        setUser(mockUser);
        
        // Creamos un equipo mock de pruebas
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
    refreshTeam
  }), [user, loading, activeTeamId, changeActiveTeam, teams, loginAsGuest, logout, refreshTeam]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

