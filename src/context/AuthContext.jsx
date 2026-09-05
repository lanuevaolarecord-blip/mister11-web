import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db, initUserDocument } from '../firebaseConfig';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, getRedirectResult } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { seedInitialData } from '../utils/seedData';
import { normalizeEmail } from '../utils/normalizeEmail';
import { getPlayerIdentitiesByEmail } from '../utils/playerIdentity';
import { showToast } from '../utils/toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // FASE 1: Estados Duales por Rol (Coach vs Player)
  const [activeCoachTeamId, setActiveCoachTeamId] = useState(() => localStorage.getItem('mister11_active_coach_team') || null);
  const [activePlayerTeamId, setActivePlayerTeamId] = useState(() => localStorage.getItem('mister11_active_player_team') || null);
  const [showRoleSelectorModal, setShowRoleSelectorModal] = useState({ isOpen: false, role: null });

  const [personalTeams, setPersonalTeams] = useState([]);
  const [personalTeamsLoaded, setPersonalTeamsLoaded] = useState(false);
  const [clubTeams, setClubTeams] = useState([]);
  const [clubTeamsLoaded, setClubTeamsLoaded] = useState(false);
  const [sharedTeams, setSharedTeams] = useState([]);
  const [sharedTeamsLoaded, setSharedTeamsLoaded] = useState(false);
  const [activeMode, setActiveModeState] = useState(() => localStorage.getItem('mister11_active_mode') || null);

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
        setActiveCoachTeamId(null);
        setActivePlayerTeamId(null);
        setPersonalTeams([]);
        setPersonalTeamsLoaded(true);
        setClubTeams([]);
        setClubTeamsLoaded(true);
        setSharedTeams([]);
        setSharedTeamsLoaded(true);
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
      // Fail-safe: Si el club tarda más de 2500ms o no existe, liberar clubTeamsLoaded para no bloquear el boot
      const clubFallbackTimer = setTimeout(() => {
        console.warn('[AuthContext] Timeout esperando doc de club. Desbloqueando clubTeamsLoaded.');
        setClubTeamsLoaded(true);
      }, 2500);
      return () => clearTimeout(clubFallbackTimer);
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

    // Comprobación de auto-vinculación determinista por email si tiene identidades multi-equipo
    const checkEmailIdentity = async () => {
      if (!user.email) return;
      try {
        const identities = await getPlayerIdentitiesByEmail(user.email);
        for (const idData of identities) {
          if (idData.teamId && idData.teamPath && (idData.role === 'player' || idData.role === 'parent')) {
            const userSharedRef = doc(db, `users/${user.uid}/shared_teams`, idData.teamId);
            const userSharedSnap = await getDoc(userSharedRef);
            if (!userSharedSnap.exists()) {
              await setDoc(userSharedRef, {
                teamId: idData.teamId,
                teamPath: idData.teamPath,
                teamName: idData.teamName || 'Mi Equipo',
                role: idData.role || 'player',
                playerId: idData.playerId || '',
                joinedAt: serverTimestamp()
              });
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Auto-link email identities error:', err);
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
            const fetchPromise = getDoc(tRef);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout shared team')), 2500)
            );
            const tSnap = await Promise.race([fetchPromise, timeoutPromise]);
            if (tSnap.exists()) {
              return {
                id: tSnap.id,
                ...tSnap.data(),
                teamPath: pointer.teamPath,
                staffRole: pointer.role || 'player',
                role: pointer.role || 'player',
                playerId: pointer.playerId || '',
                source: 'shared'
              };
            }
            return {
              id: pointer.id,
              nombre: pointer.teamName || 'Equipo Compartido',
              name: pointer.teamName || 'Equipo Compartido',
              teamPath: pointer.teamPath,
              staffRole: pointer.role || 'player',
              role: pointer.role || 'player',
              playerId: pointer.playerId || '',
              source: 'shared'
            };
          } catch (e) {
            return {
              id: pointer.id,
              nombre: pointer.teamName || 'Equipo Compartido',
              name: pointer.teamName || 'Equipo Compartido',
              teamPath: pointer.teamPath,
              staffRole: pointer.role || 'player',
              role: pointer.role || 'player',
              playerId: pointer.playerId || '',
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

  // FASE 1: Separación Estricta de Equipos por Rol
  const coachTeams = useMemo(() => {
    if (user && user.uid === 'invitado-local') {
      return [{
        id: 'team-invitado',
        nombre: 'FC Invitado',
        name: 'FC Invitado',
        categoria: 'Juvenil',
        temporada: '2025-26',
        colorLocal: '#10B981',
        colorVisitante: '#059669',
        source: 'personal'
      }];
    }
    // Solo equipos donde el usuario es dueño, entrenador o staff técnico
    const cClub = clubTeams.filter(t => t.clubRole !== 'player');
    const cShared = sharedTeams.filter(t => 
      t.staffRole !== 'player' && 
      t.role !== 'player' && 
      t.staffRole !== 'parent' && 
      t.role !== 'parent'
    );
    return [...personalTeams, ...cClub, ...cShared];
  }, [user, personalTeams, clubTeams, sharedTeams]);

  const playerTeams = useMemo(() => {
    if (user && user.uid === 'invitado-local') return [];
    // Solo equipos donde el usuario es jugador o familia
    return sharedTeams.filter(t => 
      t.staffRole === 'player' || 
      t.role === 'player' || 
      t.staffRole === 'parent' || 
      t.role === 'parent' ||
      Boolean(t.playerId)
    );
  }, [user, sharedTeams]);

  // Selección automática de equipo activo por rol
  useEffect(() => {
    if (!user) return;
    if (user.uid === 'invitado-local') {
      setActiveCoachTeamId('team-invitado');
      setLoading(false);
      return;
    }

    if (!personalTeamsLoaded || !clubTeamsLoaded || !sharedTeamsLoaded) {
      return;
    }

    // 1. Resolver activeCoachTeamId
    if (coachTeams.length > 0) {
      const savedCoachTeam = localStorage.getItem(`lastCoachTeam_${user.uid}`) || localStorage.getItem('mister11_active_coach_team');
      if (savedCoachTeam && coachTeams.some(t => t.id === savedCoachTeam)) {
        setActiveCoachTeamId(savedCoachTeam);
      } else {
        setActiveCoachTeamId(coachTeams[0].id);
        localStorage.setItem(`lastCoachTeam_${user.uid}`, coachTeams[0].id);
      }
    } else {
      setActiveCoachTeamId(null);
    }

    // 2. Resolver activePlayerTeamId
    if (playerTeams.length > 0) {
      const savedPlayerTeam = localStorage.getItem(`lastPlayerTeam_${user.uid}`) || localStorage.getItem('mister11_active_player_team');
      if (savedPlayerTeam && playerTeams.some(t => t.id === savedPlayerTeam)) {
        setActivePlayerTeamId(savedPlayerTeam);
      } else {
        setActivePlayerTeamId(playerTeams[0].id);
        localStorage.setItem(`lastPlayerTeam_${user.uid}`, playerTeams[0].id);
      }
    } else {
      setActivePlayerTeamId(null);
    }

    setLoading(false);
  }, [user, personalTeamsLoaded, clubTeamsLoaded, sharedTeamsLoaded, coachTeams, playerTeams]);

  // ─── WATCHDOG DE BOOT (4.5s) ────────────────────────────────────────────────
  // Garantiza que bajo NINGUNA circunstancia (red lenta, offline, promesas colgadas)
  // la app se quede en loading infinito. A los 4.5s fuerza la resolución de carga.
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setPersonalTeamsLoaded(true);
      setClubTeamsLoaded(true);
      setSharedTeamsLoaded(true);
      setLoading((currLoading) => {
        if (currLoading) {
          console.warn('[BOOT-WATCHDOG] ⏱️ Tiempo límite de arranque alcanzado (4.5s). Desbloqueando UI de forma segura.');
          return false;
        }
        return false;
      });
    }, 4500);

    return () => clearTimeout(bootTimer);
  }, []);

  const activeCoachTeam = useMemo(() => {
    return coachTeams.find(t => t.id === activeCoachTeamId) || coachTeams[0] || null;
  }, [coachTeams, activeCoachTeamId]);

  const activePlayerTeam = useMemo(() => {
    return playerTeams.find(t => t.id === activePlayerTeamId) || playerTeams[0] || null;
  }, [playerTeams, activePlayerTeamId]);

  // Retrocompatibilidad dinámica: apunta al contexto activo sin mezclar estados
  const activeTeamId = activeMode === 'player' ? activePlayerTeamId : activeCoachTeamId;
  const activeTeam = activeMode === 'player' ? activePlayerTeam : activeCoachTeam;
  const teams = activeMode === 'player' ? playerTeams : coachTeams;

  const changeActiveCoachTeam = useCallback((id) => {
    setActiveCoachTeamId(id);
    localStorage.setItem('mister11_active_coach_team', id);
    if (user?.uid) localStorage.setItem(`lastCoachTeam_${user.uid}`, id);
  }, [user]);

  const changeActivePlayerTeam = useCallback((id) => {
    setActivePlayerTeamId(id);
    localStorage.setItem('mister11_active_player_team', id);
    if (user?.uid) localStorage.setItem(`lastPlayerTeam_${user.uid}`, id);
  }, [user]);

  const changeActiveTeam = useCallback((id) => {
    if (activeMode === 'player') {
      changeActivePlayerTeam(id);
    } else {
      changeActiveCoachTeam(id);
    }
  }, [activeMode, changeActivePlayerTeam, changeActiveCoachTeam]);

  const currentMode = useMemo(() => {
    const at = activeMode === 'player' ? activePlayerTeam : activeCoachTeam;
    return at?.source === 'club' ? 'club' : 'pro';
  }, [activeMode, activePlayerTeam, activeCoachTeam]);

  const getTeamPath = useCallback((teamId = null, role = null) => {
    if (!user) return '';
    if (user.uid === 'invitado-local') {
      const tId = teamId || 'team-invitado';
      return `users/invitado-local/teams/${tId}`;
    }
    const effectiveRole = role || (activeMode === 'player' ? 'player' : 'coach');
    const targetTeamId = teamId || (effectiveRole === 'player' ? activePlayerTeamId : activeCoachTeamId);
    if (!targetTeamId) return '';

    // 1. Si es de jugador, buscar primero en playerTeams
    if (effectiveRole === 'player') {
      const pTeam = playerTeams.find(t => t.id === targetTeamId);
      if (pTeam?.teamPath) return pTeam.teamPath;
    }

    // 2. Buscar en sharedTeams
    const sharedTeam = sharedTeams.find(t => t.id === targetTeamId);
    if (sharedTeam?.teamPath) {
      return sharedTeam.teamPath;
    }

    // 3. Buscar en clubTeams
    const clubTeam = clubTeams.find(t => t.id === targetTeamId);
    if (clubTeam) {
      const cId = userProfile?.clubId || localStorage.getItem('mister11_club_id');
      return `clubs/${cId}/teams/${targetTeamId}`;
    }

    // 4. Por defecto, equipo personal
    return `users/${user.uid}/teams/${targetTeamId}`;
  }, [user, userProfile, activeMode, activePlayerTeamId, activeCoachTeamId, playerTeams, sharedTeams, clubTeams]);

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
          escudo: '',
          source: 'personal'
        };
        setPersonalTeams([mockTeam]);
        setActiveCoachTeamId('team-invitado');
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
        setActiveCoachTeamId(null);
        setActivePlayerTeamId(null);
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

  // FASE 2: Conmutación Inteligente por Rol sin Sobrescribir el Rol Opuesto
  const switchMode = useCallback((mode, targetTeamId = null) => {
    if (mode === 'player') {
      localStorage.setItem('mister11_active_mode', 'player');
      setActiveModeState('player');
      if (user && user.uid !== 'invitado-local') {
        setDoc(doc(db, `users/${user.uid}/prefs`, 'lastMode'), { mode: 'player', updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }

      if (targetTeamId) {
        changeActivePlayerTeam(targetTeamId);
      } else {
        const savedPlayerTeam = user?.uid ? localStorage.getItem(`lastPlayerTeam_${user.uid}`) : null;
        if (savedPlayerTeam && playerTeams.some(t => t.id === savedPlayerTeam)) {
          changeActivePlayerTeam(savedPlayerTeam);
        } else if (playerTeams.length === 1) {
          changeActivePlayerTeam(playerTeams[0].id);
        } else if (playerTeams.length > 1) {
          setShowRoleSelectorModal({ isOpen: true, role: 'player' });
        }
      }
      showToast('Cambiado a Portal de Jugador', 'info');
    } else if (mode === 'coach') {
      localStorage.setItem('mister11_active_mode', 'coach');
      setActiveModeState('coach');
      if (user && user.uid !== 'invitado-local') {
        setDoc(doc(db, `users/${user.uid}/prefs`, 'lastMode'), { mode: 'coach', updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }

      if (targetTeamId) {
        changeActiveCoachTeam(targetTeamId);
      } else {
        const savedCoachTeam = user?.uid ? localStorage.getItem(`lastCoachTeam_${user.uid}`) : null;
        if (savedCoachTeam && coachTeams.some(t => t.id === savedCoachTeam)) {
          changeActiveCoachTeam(savedCoachTeam);
        } else if (coachTeams.length === 1) {
          changeActiveCoachTeam(coachTeams[0].id);
        } else if (coachTeams.length > 1) {
          setShowRoleSelectorModal({ isOpen: true, role: 'coach' });
        }
      }
      showToast('Cambiado a Modo Entrenador', 'info');
    } else {
      localStorage.removeItem('mister11_active_mode');
      setActiveModeState(null);
      if (user && user.uid !== 'invitado-local') {
        setDoc(doc(db, `users/${user.uid}/prefs`, 'lastMode'), { mode: null, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    }
  }, [user, playerTeams, coachTeams, changeActivePlayerTeam, changeActiveCoachTeam]);

  const isCoach = useMemo(() => {
    if (!user) return false;
    if (activeMode === 'coach') return true;
    if (activeMode === 'player') return false;
    if (userProfile?.role === 'coach' || userProfile?.role === 'admin') return true;
    if (coachTeams.length > 0) return true;
    return false;
  }, [user, activeMode, userProfile, coachTeams.length]);

  const isPlayer = useMemo(() => {
    if (!user) return false;
    if (activeMode === 'player') return true;
    if (activeMode === 'coach') return false;
    if (userProfile?.role === 'player' || userProfile?.role === 'parent') return true;
    if (playerTeams.length > 0 && coachTeams.length === 0) return true;
    return false;
  }, [user, activeMode, userProfile, playerTeams.length, coachTeams.length]);

  const isHybrid = useMemo(() => {
    if (!user) return false;
    if (userProfile?.role === 'hybrid') return true;
    return coachTeams.length > 0 && playerTeams.length > 0;
  }, [user, userProfile, coachTeams.length, playerTeams.length]);

  const value = useMemo(() => ({
    user, 
    loading, 
    activeTeamId, 
    activeTeam,
    changeActiveTeam, 
    teams,
    activeCoachTeamId,
    activeCoachTeam,
    changeActiveCoachTeam,
    coachTeams,
    activePlayerTeamId,
    activePlayerTeam,
    changeActivePlayerTeam,
    playerTeams,
    showRoleSelectorModal,
    setShowRoleSelectorModal,
    isPlayer,
    isCoach,
    isHybrid,
    switchMode,
    activeMode,
    loginAsGuest,
    logout,
    refreshTeam: async () => {},
    clubId: userProfile?.clubId || null,
    clubRole: userProfile?.clubRole || null,
    isClubMember: !!(userProfile?.clubId),
    club,
    getTeamPath,
    userProfile,
  }), [
    user, 
    loading, 
    activeTeamId, 
    activeTeam, 
    changeActiveTeam, 
    teams,
    activeCoachTeamId,
    activeCoachTeam,
    changeActiveCoachTeam,
    coachTeams,
    activePlayerTeamId,
    activePlayerTeam,
    changeActivePlayerTeam,
    playerTeams,
    showRoleSelectorModal,
    isPlayer, 
    isCoach, 
    isHybrid, 
    switchMode, 
    activeMode, 
    loginAsGuest, 
    logout, 
    userProfile, 
    club, 
    getTeamPath
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


