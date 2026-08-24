import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db, initUserDocument } from '../firebaseConfig';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, getRedirectResult } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { seedInitialData } from '../utils/seedData';

import { normalizeEmail } from '../utils/normalizeEmail';

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
  const [sharedTeams, setSharedTeams] = useState([]);
  const [sharedTeamsLoaded, setSharedTeamsLoaded] = useState(false);

  // Ref para saber si estamos en modo invitado sin depender del estado (evita loops)
  const isGuestRef = React.useRef(false);

  useEffect(() => {
    // Procesar credenciales de retorno si el usuario viene de un flujo OAuth Redirect
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        console.log("✅ getRedirectResult exitoso:", result.user.email);
        try {
          await initUserDocument(result.user.uid, result.user.email, result.user.displayName || '');
        } catch (e) {
          console.warn("[AuthContext] Error en initUserDocument post-redirect:", e);
        }
      }
    }).catch((err) => {
      console.warn("[AuthContext] getRedirectResult:", err?.message || err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        isGuestRef.current = false;
        setUser(currentUser);
        localStorage.setItem('mister11_active_user_uid', currentUser.uid);
        
        // Inicializar documento en Firestore para garantizar trialStartDate inalterable
        try {
          await initUserDocument(currentUser.uid, currentUser.email, currentUser.displayName || (currentUser.isAnonymous ? 'Entrenador Invitado' : ''));
        } catch (err) {
          console.error('[AuthContext] Error inicializando documento de usuario:', err);
        }

        // Registrar identidad determinista playerIdentity/{uid} (create-only)
        if (currentUser.email && currentUser.uid !== 'invitado-local') {
          try {
            const emailNorm = normalizeEmail(currentUser.email);
            await setDoc(doc(db, 'playerIdentity', currentUser.uid), {
              email: currentUser.email,
              emailNorm,
              createdAt: serverTimestamp(),
            });
          } catch (_) {
            // Ignorado por diseño si ya existe (regla create-only)
          }

          // Restaurar preferencia de modo si existe en Firestore
          try {
            const prefSnap = await getDoc(doc(db, `users/${currentUser.uid}/prefs`, 'lastMode'));
            if (prefSnap.exists() && prefSnap.data().mode) {
              const savedMode = prefSnap.data().mode;
              localStorage.setItem('mister11_active_mode', savedMode);
              setActiveModeState(savedMode);
            }
          } catch (_) {}
        }
      } else {
        // Si estamos en modo invitado, preservar el estado local
        if (isGuestRef.current) return;
        localStorage.removeItem('mister11_active_user_uid');
        setUser(null);
        setActiveTeamId(null);
        setPersonalTeams([]);
        setPersonalTeamsLoaded(false);
        setClubTeams([]);
        setClubTeamsLoaded(false);
        setSharedTeams([]);
        setSharedTeamsLoaded(false);
        setUserProfile(null);
        setClub(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // [] intencional: onAuthStateChanged solo se registra una vez


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

  // ─── CARGA DEL DOCUMENTO DE CLUB ──────────────────────────────────────────
  // BUG FIX: el estado `club` se declaraba pero NUNCA se cargaba de Firestore.
  // Sin este useEffect, el guard `if (!club) return` en la carga de equipos de
  // club bloqueaba la suscripción indefinidamente, impidiendo que `clubTeamsLoaded`
  // se marcara como true y dejando el contexto en estado de carga infinita.
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') {
      setClub(null);
      return;
    }
    const clubId = userProfile?.clubId;
    if (!clubId) {
      setClub(null);
      return;
    }

    const unsubClub = onSnapshot(doc(db, 'clubs', clubId), (snap) => {
      if (snap.exists()) {
        setClub({ id: snap.id, ...snap.data() });
      } else {
        setClub(null);
      }
    }, (err) => {
      console.error('[AuthContext] Error al cargar documento de club:', err);
      // En caso de error de permisos, marcar como cargado sin club
      setClub(null);
    });

    return () => unsubClub();
  }, [user, userProfile?.clubId]);

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

  // Escuchar equipos compartidos (donde el usuario es miembro del cuerpo técnico o jugador)
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') {
      setSharedTeams([]);
      setSharedTeamsLoaded(true);
      return;
    }

    // Comprobación de auto-vinculación determinista por email si no tiene equipos compartidos
    const checkEmailIdentity = async () => {
      if (!user.email) return;
      try {
        const emailNorm = user.email.trim().toLowerCase();
        const idSnap = await getDoc(doc(db, 'playerIdentityByEmail', emailNorm));
        if (idSnap.exists()) {
          const idData = idSnap.data();
          if (idData.teamId && idData.teamPath) {
            const userSharedRef = doc(db, `users/${user.uid}/shared_teams`, idData.teamId);
            const userSharedSnap = await getDoc(userSharedRef);
            if (!userSharedSnap.exists()) {
              await setDoc(userSharedRef, {
                teamId: idData.teamId,
                teamPath: idData.teamPath,
                teamName: idData.teamName || 'Mi Equipo',
                role: 'player',
                playerId: idData.playerId || '',
                joinedAt: serverTimestamp()
              });
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Auto-link email identity error:', err);
      }
    };

    checkEmailIdentity();

    const q = query(collection(db, 'users', user.uid, 'shared_teams'));
    const unsubShared = onSnapshot(q, async (snapshot) => {
      const teamPointers = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Para cada puntero de equipo compartido, obtener o escuchar los datos actualizados del equipo
      const loadedSharedTeams = await Promise.all(
        teamPointers.map(async (pointer) => {
          try {
            const tRef = doc(db, pointer.teamPath || `teams/${pointer.id}`);
            const tSnap = await getDoc(tRef);
            if (tSnap.exists()) {
              return {
                id: tSnap.id,
                ...tSnap.data(),
                teamPath: pointer.teamPath,
                staffRole: pointer.role || 'player',
                source: 'shared'
              };
            }
            return {
              id: pointer.id,
              nombre: pointer.teamName || 'Equipo Compartido',
              name: pointer.teamName || 'Equipo Compartido',
              teamPath: pointer.teamPath,
              staffRole: pointer.role || 'player',
              source: 'shared'
            };
          } catch (e) {
            return {
              id: pointer.id,
              nombre: pointer.teamName || 'Equipo Compartido',
              name: pointer.teamName || 'Equipo Compartido',
              teamPath: pointer.teamPath,
              staffRole: pointer.role || 'player',
              source: 'shared'
            };
          }
        })
      );

      setSharedTeams(loadedSharedTeams);
      setSharedTeamsLoaded(true);
    }, (err) => {
      console.warn("Error loading shared teams:", err);
      setSharedTeamsLoaded(true);
    });

    return () => unsubShared();
  }, [user]);

  // Combinar todas las listas de equipos de forma reactiva
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
    return [...personalTeams, ...clubTeams, ...sharedTeams];
  }, [user, personalTeams, clubTeams, sharedTeams]);

  // Selección de equipo activo y creación de equipo por defecto
  useEffect(() => {
    if (!user) return;
    if (user.uid === 'invitado-local') {
      setActiveTeamId('team-invitado');
      setLoading(false);
      return;
    }

    // Esperar a que terminen de cargar todos
    if (!personalTeamsLoaded || !clubTeamsLoaded || !sharedTeamsLoaded) {
      return;
    }

    const combinedTeams = [...personalTeams, ...clubTeams, ...sharedTeams];

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
      // Si es un jugador y no tiene equipos, no crear equipo falso
      if (userProfile?.role === 'player') {
        setActiveTeamId(null);
        setLoading(false);
        return;
      }

      // Si el usuario es entrenador y no tiene ningún equipo, creamos su equipo personal limpio
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
              ownerUid: user.uid,
              ownerEmail: user.email,
              createdAt: serverTimestamp()
            });
            
            localStorage.setItem('mister11_active_team', docRef.id);
            setActiveTeamId(docRef.id);
          } catch (err) {
            console.error("Error al crear equipo por defecto para nuevo entrenador:", err);
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
  }, [user, userProfile?.role, personalTeamsLoaded, clubTeamsLoaded, sharedTeamsLoaded, personalTeams, clubTeams, sharedTeams]);

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
    if (!user) return '';
    // Para el usuario invitado local, devolver el path mock del equipo invitado
    if (user.uid === 'invitado-local') {
      const tId = teamId || 'team-invitado';
      return `users/invitado-local/teams/${tId}`;
    }
    const tId = teamId || activeTeamId;
    if (!tId) return '';
    
    // 1. Buscar en sharedTeams
    const sharedTeam = sharedTeams.find(t => t.id === tId);
    if (sharedTeam?.teamPath) {
      return sharedTeam.teamPath;
    }

    // 2. Buscar en clubTeams
    const clubTeam = clubTeams.find(t => t.id === tId);
    if (clubTeam) {
      const cId = userProfile?.clubId || localStorage.getItem('mister11_club_id');
      return `clubs/${cId}/teams/${tId}`;
    }

    // 3. Por defecto, equipo personal
    return `users/${user.uid}/teams/${tId}`;
  }, [user, userProfile, activeTeamId, sharedTeams, clubTeams]);

  // Función centralizada para iniciar sesión en Modo Invitado
  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (anonErr) {
      console.warn("Fallo Inicio Anónimo, intentando cuenta de invitado dedicada...", anonErr);
      try {
        await signInWithEmailAndPassword(auth, "invitado@mister11.app", "mister11guest");
      } catch (emailErr) {
        console.warn("Fallo cuenta dedicada, iniciando Modo Invitado Local Autónomo...", emailErr);
        const mockUser = {
          uid: 'invitado-local',
          email: 'invitado@mister11.app',
          displayName: 'Entrenador Invitado',
          isAnonymous: true
        };
        isGuestRef.current = true;
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
        await signOut(auth);
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const [activeMode, setActiveModeState] = useState(() => localStorage.getItem('mister11_active_mode') || null);

  const switchMode = useCallback((mode) => {
    if (mode === 'player' || mode === 'coach') {
      localStorage.setItem('mister11_active_mode', mode);
      setActiveModeState(mode);
      if (user && user.uid !== 'invitado-local') {
        setDoc(doc(db, `users/${user.uid}/prefs`, 'lastMode'), { mode, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    } else {
      localStorage.removeItem('mister11_active_mode');
      setActiveModeState(null);
      if (user && user.uid !== 'invitado-local') {
        setDoc(doc(db, `users/${user.uid}/prefs`, 'lastMode'), { mode: null, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    }
  }, [user]);

  const activeTeam = useMemo(() => {
    return teams.find(t => t.id === activeTeamId) || teams[0] || null;
  }, [teams, activeTeamId]);

  const isCoach = useMemo(() => {
    if (!user) return false;
    if (activeMode === 'coach') return true;
    if (activeMode === 'player') return false;
    if (userProfile?.role === 'coach' || userProfile?.role === 'admin') return true;
    if (personalTeams.length > 0 || (clubTeams.length > 0 && userProfile?.clubRole !== 'player')) return true;
    return false;
  }, [user, activeMode, userProfile, personalTeams.length, clubTeams.length]);

  const isPlayer = useMemo(() => {
    if (!user) return false;
    if (activeMode === 'player') return true;
    if (activeMode === 'coach') return false;
    if (userProfile?.role === 'player' || userProfile?.role === 'parent') return true;
    if (activeTeam?.staffRole === 'player' || activeTeam?.role === 'player') return true;
    if (activeTeam?.memberRoles?.[user.uid] === 'player' || activeTeam?.memberRoles?.[user.uid] === 'parent') return true;
    // Si no tiene equipos personales y tiene equipos compartidos de jugador
    if (personalTeams.length === 0 && sharedTeams.some(t => t.staffRole === 'player' || t.role === 'player')) return true;
    return false;
  }, [user, activeTeam, userProfile, activeMode, personalTeams.length, sharedTeams]);

  const isHybrid = useMemo(() => {
    if (!user) return false;
    if (userProfile?.role === 'hybrid') return true;
    const hasCoachTeam = personalTeams.length > 0 || clubTeams.length > 0;
    const hasPlayerTeam = sharedTeams.some(t => t.staffRole === 'player' || t.role === 'player') || userProfile?.role === 'player';
    return hasCoachTeam && hasPlayerTeam;
  }, [user, userProfile, personalTeams.length, clubTeams.length, sharedTeams]);

  const value = useMemo(() => ({
    user, 
    loading, 
    activeTeamId, 
    activeTeam,
    changeActiveTeam, 
    teams,
    isPlayer,
    isCoach,
    isHybrid,
    switchMode,
    activeMode,
    loginAsGuest,
    logout,
    refreshTeam,
    clubId: userProfile?.clubId || null,
    clubRole: userProfile?.clubRole || null,
    isClubMember: !!(userProfile?.clubId),
    club,
    getTeamPath,
    userProfile,
  }), [user, loading, activeTeamId, activeTeam, changeActiveTeam, teams, isPlayer, isCoach, isHybrid, switchMode, activeMode, loginAsGuest, logout, refreshTeam, userProfile, club, getTeamPath]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

