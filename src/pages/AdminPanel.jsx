import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_VERSION } from '../constants/appVersion';
import { isDeveloperEmail } from '../config/admins';
import { normalizeText } from '../utils/normalizeInput';
import { useTeams } from '../hooks/useTeams';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { useExercises } from '../hooks/useExercises';
import { usePlayers } from '../hooks/usePlayers';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { usePlan } from '../hooks/usePlan';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { requestNotificationPermission } from '../hooks/useLocalNotifications';
import { 
  Users, 
  Dumbbell, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  Download,
  Calendar,
  Layers,
  CheckCircle,
  Search,
  Sparkles,
  Clipboard,
  Shield
} from 'lucide-react';
import { generateSeasonReport, generateMatchConvocation, generateSessionPDF, generateExercisesReport } from '../utils/pdfGenerator';
import { generateGlobalTeamReport } from '../utils/teamReportGenerator';
import { downloadJSON } from '../utils/download';
import { t } from '../i18n/translations';
import { usePWA } from '../hooks/usePWA';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { storage, db, auth } from '../firebaseConfig';
import { updateProfile, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import imageCompression from 'browser-image-compression';
import EscudoEquipo from '../components/EscudoEquipo';
import RedeemCode from '../components/RedeemCode';
import ClubManagement from '../components/ClubManagement';
import UpgradeModal from '../components/UpgradeModal';
import ExerciseLibrary from '../components/ExerciseLibrary';
import { normalizeEmail } from '../utils/normalizeEmail';
import { normalizeAttendanceDatabase, checkAttendanceConsistency } from '../utils/attendanceStatsHelper';
import { sanitizeAllMatchesDatabase } from '../utils/sanitizeMatchData';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t: tr, setLanguage: setGlobalLanguage, language: currentGlobalLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'equipos');
  const [backfilling, setBackfilling] = useState(false);
  const [normalizingAttendance, setNormalizingAttendance] = useState(false);
  const [sanitizingMatches, setSanitizingMatches] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const { user, getTeamPath, clubId, clubRole, isClubMember, club, userProfile, switchMode } = useAuth();
  const isAdmin = isDeveloperEmail(user?.email);
  const { teams, activeTeam, addTeam, deleteTeam, selectTeam, updateTeam } = useTeams();
  const { exercises, removeExercise, addExercise } = useExercises(activeTeam?.id);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
    difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
  });
  const { players } = usePlayers(activeTeam?.id);
  const { sessions } = useSessions(activeTeam?.id);
  const { matches } = useMatches(activeTeam?.id);
  const { isPro, toggleSimulatedPlan, simulatedPlan, isSimulatingFree, trialDaysRemaining, trialHoursRemaining, resetTrial, limits, isDeveloper, isProActive, isOnTrial, isTrialExpired, isRealPaidPro, dbPlan, isClubActive } = usePlan();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  const [newTeamSource, setNewTeamSource] = useState('personal');
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Estados para Eliminación de Cuenta de Entrenador (RGPD)
  const [isDeleteCoachModalOpen, setIsDeleteCoachModalOpen] = useState(false);
  const [deleteCoachConfirmText, setDeleteCoachConfirmText] = useState('');
  const [isDeletingCoach, setIsDeletingCoach] = useState(false);

  const handleDeleteCoachAccount = async () => {
    if (!user) return;
    setIsDeletingCoach(true);
    try {
      // 1. Limpiar datos y equipos del entrenador en Firestore
      try {
        const personalTeamsSnap = await getDocs(collection(db, 'users', user.uid, 'teams'));
        for (const tDoc of personalTeamsSnap.docs) {
          await deleteDoc(tDoc.ref);
        }
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (_) {}

      // 2. Eliminar cuenta de autenticación
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      showToast('Tu cuenta de entrenador y datos han sido eliminados correctamente.', 'info');
      window.location.href = '/';
    } catch (err) {
      console.error('Error al eliminar cuenta de entrenador:', err);
      if (err.code === 'auth/requires-recent-login') {
        alert('Por motivos de seguridad, debes cerrar sesión e iniciarla de nuevo antes de eliminar tu cuenta.');
      } else {
        alert('No se pudo eliminar la cuenta. Por favor contáctanos o reintenta tras reiniciar sesión.');
      }
    } finally {
      setIsDeletingCoach(false);
      setIsDeleteCoachModalOpen(false);
    }
  };



  const handleManageSubscription = async () => {
    const activeUid = localStorage.getItem('mister11_active_user_uid');
    if (activeUid === 'invitado-local') {
      if (window.confirm("Estás en Modo de Prueba con un plan simulado. ¿Deseas desactivar el plan simulado para volver al plan gratuito y probar las restricciones?")) {
        localStorage.removeItem('mister11_simulated_plan');
        window.location.reload();
      }
      return;
    }

    setLoadingPortal(true);
    try {
      // 1. Verificar si el usuario tiene una suscripción activa/cliente de Stripe
      let hasCustomerId = false;
      let stripeCustomerId = activeTeam?.stripeCustomerId || activeTeam?.customerId || activeTeam?.stripeId || user?.stripeCustomerId || user?.stripeId || user?.customerId;
      
      if (stripeCustomerId) {
        hasCustomerId = true;
      } else {
        try {
          if (activeTeam?.id) {
            const teamSnap = await getDoc(doc(db, getTeamPath(activeTeam.id)));
            if (teamSnap.exists()) {
              const teamData = teamSnap.data();
              stripeCustomerId = teamData.stripeCustomerId || teamData.customerId || teamData.stripeId;
            }
          }
          if (!stripeCustomerId) {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              stripeCustomerId = userData.stripeCustomerId || userData.customerId || userData.stripeId;
            }
          }
          if (!stripeCustomerId) {
            const custSnap = await getDoc(doc(db, 'customers', user.uid));
            if (custSnap.exists()) {
              const custData = custSnap.data();
              stripeCustomerId = custData.stripeId || custData.stripeCustomerId || custData.customerId;
            }
          }
          if (stripeCustomerId) {
            hasCustomerId = true;
          }
        } catch (err) {
          console.error("Error al buscar Stripe Customer ID en la base de datos:", err);
        }
      }

      if (!hasCustomerId) {
        alert("Aún no tienes una suscripción activa. Actualiza a Pro para gestionar tu suscripción.");
        setLoadingPortal(false);
        return;
      }

      // 2. Llamar a la Cloud Function para generar el enlace del Portal
      const functions = getFunctions();
      let createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      let result;
      try {
        result = await createPortalLink({
          returnUrl: window.location.origin + '/dashboard',
        });
      } catch (err) {
        if (err.message?.includes('not found') || err.message?.includes('NOT_FOUND') || err.code === 'not-found') {
          console.warn("Function ext-firestore-stripe-payments-createPortalLink not found, trying ext-firebase-stripe-createPortalLink...");
          createPortalLink = httpsCallable(functions, 'ext-firebase-stripe-createPortalLink');
          result = await createPortalLink({
            returnUrl: window.location.origin + '/dashboard',
          });
        } else {
          throw err;
        }
      }

      if (result && result.data && result.data.url) {
        window.location.assign(result.data.url);
      } else {
        throw new Error("No se devolvió la URL del Portal.");
      }
    } catch (error) {
      console.error('Error al abrir Customer Portal:', error);
      if (error.message?.includes('not found') || error.message?.includes('NOT_FOUND') || error.code === 'not-found') {
        alert('El portal de suscripción no está disponible. Asegúrate de que la extensión de Stripe está instalada y que tienes una suscripción activa.');
      } else {
        alert('No se pudo abrir el portal de suscripción. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoadingPortal(false);
    }
  };

  const [newTeam, setNewTeam] = useState({ nombre: '', categoria: '', temporada: '2025-26' });
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);
  const [teamTests, setTeamTests] = useState([]);
  const [teamEvaluaciones, setTeamEvaluaciones] = useState([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState('');
  // ── Configuración global en tiempo real (versión APK remota) ─────────────
  const [globalConfig, setGlobalConfig] = useState(null);

  useEffect(() => {
    const configRef = doc(db, 'config', 'global');
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) setGlobalConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Versión remota del APK (campo que escribe upload-apk.mjs) — actualización en tiempo real
  const remoteVersion = globalConfig?.latestApkVersion || globalConfig?.appVersion || APP_VERSION;
  const remoteApkUrl  = globalConfig?.apkDownloadUrl  || globalConfig?.apkUrl  || '/mister11.apk';

  // Cargar clave de Groq si el usuario es administrador
  useEffect(() => {
    if (!isAdmin) return;
    const fetchGroqKey = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'global'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.groqApiKey) {
            setGroqApiKey(data.groqApiKey);
          }
        }
      } catch (err) {
        console.error('Error fetching Groq key for admin:', err);
      }
    };
    fetchGroqKey();
  }, [user, isAdmin]);
  
  const { settings, saveSettings, loading: loadingSettings } = useSettings(activeTeam?.id);
  const { permissions, switchMyRole, STAFF_ROLES, inviteMember } = useTeamMembers(activeTeam?.id);
  const { darkMode, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState({ profileName: '', specialty: 'Primer Entrenador' });
  const [teamEditData, setTeamEditData] = useState({ nombre: '', categoria: '', temporada: '', colorLocal: '#1B3A2D', colorVisitante: '#4CAF7D' });
  const [prefData, setPrefData] = useState({ notifications: true, language: 'Español (ES)' });
  const [gamificationData, setGamificationData] = useState({
    xpPresente: 10,
    xpTarde: 5,
    xpJustificado: 2,
    xpAusente: 0,
    veteranPct: 80,
    seasonGoals: 10,
    seasonAssists: 10
  });
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  // Sync state when settings or user/team load
  useEffect(() => {
    const currentName = userProfile?.displayName || user?.displayName || settings?.profileName || '';
    const currentRoleLabel = permissions?.roleInfo?.label || settings?.specialty || 'Primer Entrenador';
    
    setProfileData({ 
      profileName: currentName, 
      specialty: currentRoleLabel 
    });
    
    if (settings) {
      setPrefData({ 
        notifications: settings.notifications ?? true, 
        language: settings.language || 'Español (ES)' 
      });
      const tg = settings.achievementTargets || {};
      setGamificationData({
        xpPresente: Number(tg.xpPresente ?? 10),
        xpTarde: Number(tg.xpTarde ?? 5),
        xpJustificado: Number(tg.xpJustificado ?? 2),
        xpAusente: Number(tg.xpAusente ?? 0),
        veteranPct: Number(tg.veteranPct ?? 80),
        seasonGoals: Number(tg.seasonGoals ?? 10),
        seasonAssists: Number(tg.seasonAssists ?? 10)
      });
    }
  }, [settings, user, userProfile, permissions?.roleInfo?.label]);

  // Cargar tests y evaluaciones del equipo activo
  useEffect(() => {
    if (!user || !activeTeam) return;
    const fetchTestsAndEvals = async () => {
      try {
        const testsSnap = await getDocs(collection(db, getTeamPath(activeTeam.id), 'tests'));
        const tests = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeamTests(tests);

        const evalsSnap = await getDocs(collection(db, getTeamPath(activeTeam.id), 'evaluaciones'));
        const evals = evalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeamEvaluaciones(evals);
      } catch (err) {
        console.error('Error cargando tests/evaluaciones para informe:', err);
      }
    };
    fetchTestsAndEvals();
  }, [user, activeTeam]);

  useEffect(() => {
    if (activeTeam) {
      setTeamEditData({
        nombre: activeTeam.nombre || '',
        categoria: activeTeam.categoria || '',
        temporada: activeTeam.temporada || '',
        colorLocal: activeTeam.colorLocal || '#1B3A2D',
        colorVisitante: activeTeam.colorVisitante || '#4CAF7D'
      });
    }
  }, [activeTeam]);

  const handleAddTeam = async () => {
    if (!newTeam.nombre) return;
    
    const personalTeamsCount = teams.filter(t => t.source === 'personal' || !t.source).length;
    const teamLimit = limits.TEAMS;
    
    if (personalTeamsCount >= teamLimit) {
      setUpgradeModal({ 
        open: true, 
        message: `Has alcanzado el límite de ${teamLimit} equipos de tu plan actual.` 
      });
      return;
    }
    
    await addTeam(newTeam, newTeamSource);
    setNewTeam({ nombre: '', categoria: '', temporada: '2025-26' });
    setNewTeamSource('personal');
  };

  const handleSaveExercise = async () => {
    if (!newExercise.name) return;
    await addExercise({
      ...newExercise,
      source: 'manual',
      createdBy: 'trainer'
    });
    setShowAddExerciseModal(false);
    setNewExercise({
      name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
      difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
    });
  };

  const [isUploadingShield, setIsUploadingShield] = useState(false);
  const handleUploadEscudo = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !activeTeam) return;
    
    setIsUploadingShield(true);
    try {
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
      const isPng = file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png');

      // 1. Si es SVG vectorial, guardar directamente como DataURL vectorial
      if (isSvg) {
        const svgBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        await updateTeam(activeTeam.id, { escudo: svgBase64 });
        showToast("¡Escudo vectorial SVG guardado con éxito!", "success");
        return;
      }

      // 2. Para PNG, JPEG, WebP y otros formatos de imagen
      const targetFileType = isPng ? 'image/png' : 'image/webp';
      let base64data = null;

      try {
        const options = {
          maxSizeMB: isPng ? 0.2 : 0.08,
          maxWidthOrHeight: 384,
          useWebWorker: true,
          fileType: targetFileType
        };
        const compressedFile = await imageCompression(file, options);
        base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
      } catch (compressionErr) {
        console.warn("Fallo compresión worker, usando Canvas nativo para escudo:", compressionErr);
        base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_DIM = 384;
              let w = img.width;
              let h = img.height;
              if (w > h && w > MAX_DIM) {
                h = Math.round((h * MAX_DIM) / w);
                w = MAX_DIM;
              } else if (h > MAX_DIM) {
                w = Math.round((w * MAX_DIM) / h);
                h = MAX_DIM;
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/webp', isPng ? 0.95 : 0.85));
            };
            img.onerror = () => resolve(ev.target.result);
            img.src = ev.target.result;
          };
          reader.onerror = reject;
        });
      }
      
      await updateTeam(activeTeam.id, { escudo: base64data });
      showToast("¡Escudo guardado y optimizado con éxito!", "success");
    } catch (error) {
      console.error("Error al subir el escudo:", error);
      showToast("No se pudo subir o procesar la imagen.", "error");
    } finally {
      setIsUploadingShield(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await saveSettings({ ...settings, ...profileData });
      
      const matched = Object.values(STAFF_ROLES || {}).find(
        r => r.label.toLowerCase() === (profileData.specialty || '').toLowerCase() || 
             r.id.toLowerCase() === (profileData.specialty || '').toLowerCase() ||
             r.aliases?.includes((profileData.specialty || '').toLowerCase())
      );
      const roleId = matched ? matched.id : 'admin';

      if (user?.uid) {
        // 1. Actualizar Auth Profile si hay cambio de nombre
        if (auth?.currentUser && profileData.profileName) {
          try {
            await updateProfile(auth.currentUser, { displayName: profileData.profileName });
          } catch (_) {}
        }

        // 2. Actualizar Documento users/{userId}
        try {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: profileData.profileName,
            nombre: profileData.profileName,
            specialty: profileData.specialty,
            role: roleId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (_) {}

        // 3. Sincronizar en el equipo activo (members subcolección y array)
        if (activeTeam?.id) {
          const teamPath = getTeamPath(activeTeam.id);
          try {
            await setDoc(doc(db, `${teamPath}/members`, user.uid), {
              uid: user.uid,
              displayName: profileData.profileName,
              email: user.email,
              role: roleId,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (_) {}
        }
      }

      if (switchMyRole && roleId) {
        await switchMyRole(roleId);
      }
      showToast("Perfil de entrenador sincronizado en todo el sistema.", "success");
    } catch (e) {
      console.error('[AdminPanel] Error al guardar perfil:', e);
      showToast("Error al guardar perfil.", "error");
    }
  };

  const handleUpdateTeamInfo = async () => {
    if (!activeTeam) return;
    try {
      await updateTeam(activeTeam.id, teamEditData);
      showToast("Identidad del equipo actualizada correctamente.", "success");
    } catch (e) {
      showToast("Error al actualizar identidad del equipo.", "error");
    }
  };

  const handleSaveGamification = async () => {
    try {
      await saveSettings({
        ...settings,
        achievementTargets: {
          ...settings?.achievementTargets,
          ...gamificationData
        }
      });
      showToast("Tabla de XP y objetivos de temporada guardados con éxito.", "success");
    } catch (e) {
      showToast("Error al guardar configuración de XP.", "error");
    }
  };

  const toggleSetting = async (key, val = null) => {
    const newValue = val !== null ? val : !prefData[key];
    const updatedPrefs = { ...prefData, [key]: newValue };
    setPrefData(updatedPrefs);
    if (key === 'language') {
      setGlobalLanguage(newValue);
    }
    await saveSettings({ ...settings, ...updatedPrefs });
  };

  const handleExportSeason = async () => {
    if (!isPro) {
      setUpgradeModal({ open: true, message: 'La exportación del Informe de Temporada a PDF es una función PRO.' });
      return;
    }
    if (!activeTeam) { showToast('Selecciona un equipo primero.', 'info'); return; }
    await generateSeasonReport(activeTeam, players, matches);
  };

  const handleExportGlobalReport = async () => {
    if (!isPro) {
      setUpgradeModal({ open: true, message: 'La generación del Informe Global del Equipo a PDF es una función PRO.' });
      return;
    }
    if (!activeTeam) { showToast('Selecciona un equipo primero.', 'info'); return; }
    if (players.length === 0) { showToast('No hay jugadores en el equipo activo.', 'info'); return; }
    try {
      await generateGlobalTeamReport(players, teamTests, teamEvaluaciones, activeTeam);
    } catch (err) {
      console.error('Error generando informe global:', err);
      showToast('Error al generar el informe global.', 'error');
    }
  };

  // ── Descarga el APK forzando Content-Disposition: attachment via fetch→blob ──
  // Esto evita que Chrome en Android abra la URL inline y elimine el archivo.
  const downloadApk = async (url, version) => {
    try {
      showToast('⬇️ Iniciando descarga del APK...', 'info');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(
        new Blob([blob], { type: 'application/vnd.android.package-archive' })
      );
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `mister11-v${version || APP_VERSION}.apk`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 5000);
      showToast('✅ Descarga completada. Busca el archivo en tu carpeta de Descargas e instálalo.', 'success');
    } catch (err) {
      console.error('Error en descarga APK:', err);
      // Fallback: abrir en _system para que el SO gestione la descarga
      showToast('⚠️ Descarga directa fallida. Abriendo enlace alternativo...', 'warning');
      window.open(url, '_system');
    }
  };

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const configRef = doc(db, 'config', 'global');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        // Unificado: usa appVersion (igual que App.jsx) con fallback a latestApkVersion
        const remoteVersion = data.appVersion || data.latestApkVersion;
        // Unificado: usa apkDownloadUrl con fallback a apkUrl y /mister11.apk
        const apkDownloadUrl = data.apkDownloadUrl || data.apkUrl || '/mister11.apk';
        
        // Helper function for comparing semantic versions correctly (e.g. 1.0.10 > 1.0.9)
        const isNewer = (latest, current) => {
          if (!latest || !current) return false;
          const lParts = latest.split('.').map(Number);
          const cParts = current.split('.').map(Number);
          for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
            const l = lParts[i] || 0;
            const c = cParts[i] || 0;
            if (l > c) return true;
            if (l < c) return false;
          }
          return false;
        };

        if (isNewer(remoteVersion, APP_VERSION)) {
          if (window.confirm(`🆕 Nueva versión ${remoteVersion} disponible (tu versión actual: ${APP_VERSION}).\n¿Descargar ahora?`)) {
            await downloadApk(apkDownloadUrl, remoteVersion);
          }
        } else {
          showToast(`✅ Ya tienes la última versión instalada (v${APP_VERSION}).`, 'success');
        }
      } else {
        showToast('No se pudo comprobar actualizaciones.', 'error');
      }
    } catch (err) {
      console.error('Error al comprobar actualizaciones:', err);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExportConvocatoria = async () => {
    if (!isPro) {
      setUpgradeModal({ open: true, message: 'La exportación de la lista de convocados a PDF es una función PRO.' });
      return;
    }
    if (!selectedMatchId) { showToast('Selecciona un partido primero.', 'info'); return; }
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) { showToast('Partido no encontrado.', 'error'); return; }
    await generateMatchConvocation(match, players, activeTeam);
  };

  const handleExportSession = async () => {
    if (!isPro) {
      setUpgradeModal({ open: true, message: 'La exportación de la ficha de sesión a PDF es una función PRO.' });
      return;
    }
    if (!selectedSessionId) { showToast('Selecciona una sesión primero.', 'info'); return; }
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) { showToast('Sesión no encontrada.', 'error'); return; }
    await generateSessionPDF(session, activeTeam);
  };

  const handleExportBackup = async () => {
    if (!user || !activeTeam) {
      showToast("No hay ningún equipo activo seleccionado.", "error");
      return;
    }
    
    try {
      const playersRef = collection(db, getTeamPath(activeTeam.id), 'players');
      const playersSnap = await getDocs(playersRef);
      const playersData = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sessionsRef = collection(db, getTeamPath(activeTeam.id), 'sessions');
      const sessionsSnap = await getDocs(sessionsRef);
      const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const matchesRef = collection(db, getTeamPath(activeTeam.id), 'matches');
      const matchesSnap = await getDocs(matchesRef);
      const matchesData = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const testsRef = collection(db, getTeamPath(activeTeam.id), 'tests');
      const testsSnap = await getDocs(testsRef);
      const testsData = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const evalsRef = collection(db, getTeamPath(activeTeam.id), 'evaluaciones');
      const evalsSnap = await getDocs(evalsRef);
      const evalsData = evalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        team: activeTeam,
        players: playersData,
        sessions: sessionsData,
        matches: matchesData,
        tests: testsData,
        evaluaciones: evalsData
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `mister11_backup_${activeTeam.nombre.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
      await downloadJSON(jsonString, filename);
    } catch (error) {
      console.error("Error al exportar backup:", error);
      showToast("Error al generar la copia de seguridad.", "error");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <button 
          className={`admin-nav-item ${activeTab === 'equipos' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipos')}
        >
          <Users size={20} /> <span>{tr('admin.tab.equipos')}</span>
        </button>
        {isClubMember && (
          <button 
            className={`admin-nav-item ${activeTab === 'club' ? 'active' : ''}`}
            onClick={() => setActiveTab('club')}
          >
            <Shield size={20} /> <span>{tr('admin.tab.club')}</span>
          </button>
        )}
        <button 
          className={`admin-nav-item ${activeTab === 'ejercicios' ? 'active' : ''}`}
          onClick={() => setActiveTab('ejercicios')}
        >
          <Dumbbell size={20} /> <span>{tr('admin.tab.ejercicios')}</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'exportar' ? 'active' : ''}`}
          onClick={() => setActiveTab('exportar')}
        >
          <FileText size={20} /> <span>{tr('admin.tab.exportar')}</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'ajustes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ajustes')}
        >
          <Settings size={20} /> <span>{tr('admin.tab.ajustes')}</span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'equipos' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>{tr('admin.section.equipos')}</h2>
              <p>Crea y gestiona tus plantillas para cada temporada.</p>
            </header>

            <div className="add-team-card">
              <h3>Nuevo Equipo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-row" style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre (ej. Infantil A)" 
                    value={newTeam.nombre}
                    onChange={e => setNewTeam({...newTeam, nombre: e.target.value})}
                    onBlur={e => setNewTeam(prev => ({...prev, nombre: normalizeText(e.target.value)}))}
                  />
                  <input 
                    type="text" 
                    placeholder="Categoría" 
                    value={newTeam.categoria}
                    onChange={e => setNewTeam({...newTeam, categoria: e.target.value})}
                    onBlur={e => setNewTeam(prev => ({...prev, categoria: normalizeText(e.target.value)}))}
                  />
                </div>
                
                {isClubActive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Destino del equipo:
                    </label>
                    <select
                      value={newTeamSource}
                      onChange={e => setNewTeamSource(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        minHeight: '48px',
                        fontWeight: '600'
                      }}
                    >
                      <option value="personal">👤 Personal (Tu Cuenta)</option>
                      <option value="club">🏢 Club (Organización)</option>
                    </select>
                  </div>
                )}
                
                <button 
                  className="btn-primary" 
                  onClick={handleAddTeam}
                  style={{ alignSelf: 'flex-end', minHeight: '48px', padding: '0 24px', fontWeight: 'bold' }}
                >
                  <Plus size={18}/> Crear
                </button>
              </div>
            </div>

            <div className="teams-grid">
              {teams.map(team => {
                if (!team) return null;
                return (
                  <div key={team.id} className={`team-admin-card ${activeTeam?.id === team.id ? 'active' : ''}`}>
                    <EscudoEquipo src={team.escudo} nombreEquipo={team.nombre} size="48px" borderRadius="12px" />
                  <div className="team-info">
                    <h4>{team.nombre}</h4>
                    <span>{team.categoria} | {team.temporada}</span>
                  </div>
                    <div className="team-actions">
                      <button className="btn-select" onClick={() => selectTeam(team)}>
                        {activeTeam?.id === team.id ? <CheckCircle size={18}/> : 'Seleccionar'}
                      </button>
                      <button className="btn-delete-icon" onClick={() => {
                        if (window.confirm(`⚠️ ¿Eliminar el equipo "${team.nombre}"?\n\nEsta acción eliminará PERMANENTEMENTE todos los jugadores, sesiones, partidos, tests y evaluaciones asociados. No se puede deshacer.`)) {
                          deleteTeam(team.id);
                        }
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ejercicios' && (
          <div className="admin-section">
            <ExerciseLibrary activeTeamId={activeTeam?.id} />
          </div>
        )}

        {activeTab === 'exportar' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Centro de Exportación</h2>
              <p>Genera informes profesionales en PDF para tu club o cuerpo técnico.</p>
            </header>

            <div className="export-grid">
              <div className="export-card">
                <FileText className="export-icon" size={32} />
                <h3>Informe de Temporada</h3>
                <p>Estadísticas completas, minutos de jugadores y resumen de tests.</p>
                <button className="btn-export" onClick={handleExportSeason}>
                  <Download size={18} /> Generar PDF
                </button>
              </div>

              <div className="export-card">
                <Users className="export-icon" size={32} />
                <h3>Lista de Convocados</h3>
                <p>Selecciona un partido próximo para generar la hoja de convocatoria.</p>
                <select
                  className="admin-select-export"
                  value={selectedMatchId}
                  onChange={e => setSelectedMatchId(e.target.value)}
                >
                  <option value="">Seleccionar Partido...</option>
                  {matches.map(m => {
                    if (!m) return null;
                    const fechaDisplay = m.date || m.fecha || 'Sin fecha';
                    return <option key={m.id} value={m.id}>{m.rival} ({fechaDisplay})</option>
                  })}
                </select>
                <button className="btn-export outline" onClick={handleExportConvocatoria}>
                  <Download size={18} /> Exportar
                </button>
              </div>

              <div className="export-card">
                <Calendar className="export-icon" size={32} />
                <h3>Ficha de Sesión</h3>
                <p>Exporta el detalle de una sesión de entrenamiento específica.</p>
                <select
                  className="admin-select-export"
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                >
                  <option value="">Seleccionar Sesión...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.title || s.name || s.titulo || 'Sesión sin título'} ({s.date || s.fecha || 'Sin fecha'})</option>
                  ))}
                </select>
                <button className="btn-export outline" onClick={handleExportSession}>
                  <Download size={18} /> Exportar
                </button>
              </div>

              <div className="export-card">
                <Layers className="export-icon" size={32} />
                <h3>Informe Global del Equipo</h3>
                <p>Análisis completo: rangos de rendimiento, mejores jugadores y áreas de mejora por área (Física, Técnica, Táctica).</p>
                <button className="btn-export" onClick={handleExportGlobalReport} style={{ marginTop: 'auto', background: '#1B3A2D', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FileText size={18} /> 📊 Informe Global
                </button>
              </div>

              <div className="export-card">
                <Layers className="export-icon" size={32} />
                <h3>Copia de Seguridad del Equipo</h3>
                <p>Exporta toda la información del equipo activo (jugadores, sesiones, partidos, tests y evaluaciones) en un archivo JSON.</p>
                <button className="btn-export" onClick={handleExportBackup} style={{ marginTop: 'auto', background: '#1B3A2D', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Download size={18} /> Copia de Seguridad
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ajustes' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Ajustes del Sistema</h2>
              <p>Personaliza tu experiencia y la identidad visual de tu club.</p>
            </header>

            <div className="settings-grid">
              {/* DOCUMENTOS LEGALES Y CONSENTIMIENTO */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Shield size={20} />
                  <h3>Centro Legal y Consentimientos</h3>
                </div>
                <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                    Descarga plantillas legales obligatorias y gestiona el consentimiento informado para los padres de tus jugadores menores de edad.
                  </p>
                  
                  <button
                    onClick={() => {
                      const consentUrl = `${window.location.origin}/legal/consentimiento.html`;
                      window.open(consentUrl, '_blank');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      minHeight: '40px',
                      background: 'var(--accent-green, #228B22)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 16px'
                    }}
                  >
                    ⬇️ Descargar Consentimiento Parental (Imprimible)
                  </button>

                  <button
                    onClick={() => {
                      if (!activeTeam) {
                        showToast("Selecciona un equipo primero.", "info");
                        return;
                      }
                      const baseUrl = window.location.origin;
                      const consentLink = `${baseUrl}/shared/consentimiento?coachId=${user.uid}&teamId=${activeTeam.id}&teamName=${encodeURIComponent(activeTeam.nombre || 'Míster11 Club')}&coachName=${encodeURIComponent(user.displayName || 'el Entrenador')}`;
                      navigator.clipboard.writeText(consentLink);
                      showToast("¡Enlace copiado al portapapeles! Envíalo por WhatsApp.", "success");
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      minHeight: '40px',
                      background: '#1B3A2D',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 16px'
                    }}
                  >
                    🔗 Copiar Link de Consentimiento Digital
                  </button>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <a href="/legal/privacidad.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Privacidad</a>
                    <a href="/legal/terminos.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Términos</a>
                    <a href="/legal/cookies.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Cookies</a>
                  </div>
                </div>
              </div>

              {/* CONFIGURACIÓN DE CUENTA Y CUERPO TÉCNICO */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Users size={20} />
                  <h3>Perfil del Entrenador</h3>
                </div>
                <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Tu nombre" 
                      value={profileData.profileName} 
                      onChange={(e) => setProfileData({...profileData, profileName: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Rol / Especialidad en el Equipo</label>
                    <select 
                      className="admin-select-input"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                    >
                      <option value="Primer Entrenador">👑 Primer Entrenador (Admin)</option>
                      <option value="Segundo Entrenador">🟢 Segundo Entrenador</option>
                      <option value="Preparador Físico">🏋️‍♂️ Preparador Físico</option>
                      <option value="Ayudante / 3er Entrenador">🔵 Ayudante / 3er Entrenador</option>
                      <option value="Fisioterapeuta / Médico">🔴 Fisioterapeuta / Médico</option>
                      <option value="Analista Táctico">🟣 Analista Táctico</option>
                      <option value="Jugador">⚪ Jugador</option>
                    </select>
                  </div>
                  <button className="btn-save-settings" onClick={handleSaveProfile}>{t('btn.save', settings.language)} Perfil y Rol</button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!activeTeam) {
                          showToast('Selecciona un equipo primero.', 'info');
                          return;
                        }
                        try {
                          const inv = await inviteMember('', 'second_coach');
                          if (inv?.inviteUrl) {
                            let copiedOk = false;
                            try {
                              if (navigator?.clipboard?.writeText) {
                                await navigator.clipboard.writeText(inv.inviteUrl);
                                copiedOk = true;
                              }
                            } catch (_) {}
                            if (!copiedOk) {
                              try {
                                const ta = document.createElement('textarea');
                                ta.value = inv.inviteUrl;
                                ta.style.position = 'fixed';
                                ta.style.opacity = '0';
                                document.body.appendChild(ta);
                                ta.select();
                                document.execCommand('copy');
                                document.body.removeChild(ta);
                                copiedOk = true;
                              } catch (_) {}
                            }

                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: `Únete al Cuerpo Técnico de ${activeTeam.nombre || 'Mi Equipo'} - Míster11`,
                                  text: `¡Hola! Únete al cuerpo técnico del equipo ${activeTeam.nombre || 'Mi Equipo'} en Míster11 con este enlace:\n${inv.inviteUrl}\nO usa el código: ${inv.inviteCode}`,
                                  url: inv.inviteUrl
                                });
                              } catch (_) {}
                            }

                            showToast(`¡Enlace copiado! Código: ${inv.inviteCode}`, 'success');
                          }
                        } catch (err) {
                          console.error(err);
                          showToast('Error al generar enlace de invitación.', 'error');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        minHeight: '38px',
                        background: '#1B3A2D',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--accent-green, #4CAF7D)',
                        cursor: 'pointer',
                        padding: '6px 12px'
                      }}
                    >
                      🔗 Copiar / Compartir Link para Invitar Entrenadores
                    </button>

                    <button
                      onClick={() => navigate('/equipo', { state: { initialTab: 'staff' } })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        minHeight: '38px',
                        background: 'transparent',
                        color: 'var(--accent-green, #4CAF7D)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        padding: '6px 12px'
                      }}
                    >
                      🛡️ Ver y Gestionar Todo el Cuerpo Técnico
                    </button>

                    {/* ZONA DE PELIGRO / ELIMINAR CUENTA (RGPD) */}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setIsDeleteCoachModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px'
                        }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                        <span>Eliminar mi Cuenta de Entrenador y Equipos</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* IDENTIDAD DEL EQUIPO */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Layers size={20} />
                  <h3>Identidad del Equipo ({activeTeam?.nombre || 'Ninguno'})</h3>
                </div>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Nombre del Equipo</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Real Madrid C.F." 
                      value={teamEditData.nombre} 
                      onChange={(e) => setTeamEditData({...teamEditData, nombre: e.target.value})}
                      onBlur={e => setTeamEditData(prev => ({...prev, nombre: normalizeText(e.target.value)}))}
                      disabled={!activeTeam}
                    />
                  </div>
                  <div className="form-row-dual">
                    <div className="form-group">
                      <label>Categoría</label>
                      <input 
                        type="text" 
                        value={teamEditData.categoria} 
                        onChange={(e) => setTeamEditData({...teamEditData, categoria: e.target.value})}
                        onBlur={e => setTeamEditData(prev => ({...prev, categoria: normalizeText(e.target.value)}))}
                        disabled={!activeTeam}
                      />
                    </div>
                    <div className="form-group">
                      <label>Temporada</label>
                      <input 
                        type="text" 
                        value={teamEditData.temporada} 
                        onChange={(e) => setTeamEditData({...teamEditData, temporada: e.target.value})}
                        onBlur={e => setTeamEditData(prev => ({...prev, temporada: normalizeText(e.target.value)}))}
                        disabled={!activeTeam}
                      />
                    </div>
                  </div>
                  <div className="form-row-dual">
                    <div className="form-group">
                      <label>Color Principal</label>
                      <input 
                        type="color" 
                        value={teamEditData.colorLocal} 
                        onChange={(e) => setTeamEditData({...teamEditData, colorLocal: e.target.value})}
                        disabled={!activeTeam}
                      />
                    </div>
                    <div className="form-group">
                      <label>Color Secundario</label>
                      <input 
                        type="color" 
                        value={teamEditData.colorVisitante} 
                        onChange={(e) => setTeamEditData({...teamEditData, colorVisitante: e.target.value})}
                        disabled={!activeTeam}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Escudo del Equipo</label>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <EscudoEquipo src={activeTeam?.escudo} nombreEquipo={activeTeam?.nombre} size="60px" />
                      <div className="upload-placeholder" style={{flex: 1, position: 'relative'}}>
                        <Download size={20} />
                        <span>{isUploadingShield ? 'Subiendo y optimizando...' : 'Subir Imagen'}</span>
                        <input 
                          type="file" 
                          accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .avif, .ico" 
                          onChange={handleUploadEscudo}
                          disabled={isUploadingShield || !activeTeam}
                          style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} 
                        />
                      </div>
                    </div>
                  </div>
                  <button className="btn-save-settings" onClick={handleUpdateTeamInfo} disabled={!activeTeam}>
                    {t('btn.save', settings.language)} Identidad
                  </button>
                </div>
              </div>

              {/* TEMPORADA Y OBJETIVOS DE GAMIFICACIÓN (XP) */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Trophy size={20} color="#C9A84C" />
                  <h3>Temporada y Tabla de XP Diferenciada</h3>
                </div>
                <div className="settings-form">
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    Configura los puntos de XP que suma cada jugador por estado de asistencia confirmado y los objetivos de temporada del equipo.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800 }}>✅ XP Presente</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={gamificationData.xpPresente} 
                        onChange={(e) => setGamificationData({...gamificationData, xpPresente: parseInt(e.target.value, 10) || 0})}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 800 }}>⚠️ XP Tarde</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={gamificationData.xpTarde} 
                        onChange={(e) => setGamificationData({...gamificationData, xpTarde: parseInt(e.target.value, 10) || 0})}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', color: '#3B82F6', fontWeight: 800 }}>📋 XP Justificado</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={gamificationData.xpJustificado} 
                        onChange={(e) => setGamificationData({...gamificationData, xpJustificado: parseInt(e.target.value, 10) || 0})}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 800 }}>❌ XP Ausente</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={gamificationData.xpAusente} 
                        onChange={(e) => setGamificationData({...gamificationData, xpAusente: parseInt(e.target.value, 10) || 0})}
                      />
                    </div>
                  </div>

                  <div className="form-row-dual" style={{ marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>🎯 % Partidos Veterano</label>
                      <input 
                        type="number" 
                        min="10"
                        max="100"
                        value={gamificationData.veteranPct} 
                        onChange={(e) => setGamificationData({...gamificationData, veteranPct: parseInt(e.target.value, 10) || 80})}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>⚽ Objetivo Goles Temporada</label>
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        value={gamificationData.seasonGoals} 
                        onChange={(e) => setGamificationData({...gamificationData, seasonGoals: parseInt(e.target.value, 10) || 10})}
                      />
                    </div>
                  </div>

                  <button className="btn-save-settings" onClick={handleSaveGamification}>
                    {t('btn.save', settings.language)} Configuración de XP
                  </button>
                </div>
              </div>

              {/* PREFERENCIAS DE LA APP */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Settings size={20} />
                  <h3>Preferencias</h3>
                </div>
                <div className="settings-form">
                  <div className="toggle-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>Recordatorios de Sesión</span>
                      <div 
                        className={`toggle-switch ${prefData.notifications ? 'active' : ''}`}
                        onClick={async () => {
                          const newVal = !prefData.notifications;
                          toggleSetting('notifications');
                          // Persistir en localStorage para el sistema de notificaciones locales
                          localStorage.setItem('mister11_notifications_enabled', String(newVal));
                          // Solicitar permisos de notificación en Android al activar
                          if (newVal && Capacitor.isNativePlatform()) {
                            const granted = await requestNotificationPermission();
                            if (!granted) {
                              showToast('No se concedieron permisos de notificación. Actívalos en Ajustes del sistema.', 'warning');
                            } else {
                              showToast('✅ Recordatorios activados. Se avisará 1h antes de cada sesión.', 'success');
                            }
                          }
                        }}
                      ></div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {Capacitor.isNativePlatform()
                        ? 'Recibirás una notificación 1 hora antes de cada sesión de entrenamiento.'
                        : 'Disponible en la aplicación Android (APK).'}
                    </p>
                  </div>
                  <div className="toggle-group">
                    <span>Modo Oscuro</span>
                    <div 
                      className={`toggle-switch ${darkMode ? 'active' : ''}`}
                      onClick={toggleTheme}
                    ></div>
                  </div>
                  <div className="form-group" style={{marginTop: '15px'}}>
                    <label>Idioma del Sistema</label>
                    <select 
                      className="admin-select-input"
                      value={prefData.language}
                      onChange={(e) => toggleSetting('language', e.target.value)}
                    >
                      <option>Español (ES)</option>
                      <option>English (EN)</option>
                    </select>
                  </div>

                  {deferredPrompt && !isInstalled && (
                    <button 
                      className="btn-primary" 
                      onClick={installApp}
                      style={{ marginTop: '20px', width: '100%' }}
                    >
                      Instalar App (PWA)
                    </button>
                  )}

                  {/* Actualización Manual */}
                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Versión actual de la app</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>v{APP_VERSION}</strong>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={checkForUpdates}
                      disabled={checkingUpdate}
                      style={{ width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: checkingUpdate ? 0.7 : 1 }}
                    >
                      {checkingUpdate ? '⏳ Comprobando...' : '🔍 Buscar actualizaciones'}
                    </button>

                    {/* ═══ BOTÓN DESCARGAR APK ═══ */}
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(76,175,125,0.12), rgba(33,150,243,0.08))',
                      borderRadius: '12px',
                      border: '1px solid rgba(76,175,125,0.25)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '24px' }}>📱</span>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            Aplicación Android (APK)
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Instala Mister 11 directamente en tu tablet Android
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadApk(remoteApkUrl)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          width: '100%',
                          minHeight: '48px',
                          background: 'linear-gradient(135deg, #4CAF7D, #2196F3)',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 16px',
                          boxShadow: '0 4px 16px rgba(76,175,125,0.3)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        ⬇️ DESCARGAR APK v{remoteVersion}
                      </button>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0, textAlign: 'center' }}>
                        Solo para Android · Habilita "Fuentes desconocidas" en Ajustes del sistema antes de instalar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONFIGURACIÓN DE IA (SOLO PARA ADMIN) */}
              {isAdmin && (
                <div className="settings-card">
                  <div className="card-header-icon">
                    <Sparkles size={20} />
                    <h3>Configuración de IA (Groq)</h3>
                  </div>
                  <div className="settings-form">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      Configura la clave API de Groq para que la IA Generadora funcione en todos los dispositivos (incluyendo el APK de la tablet sin necesidad de recompilar).
                    </p>
                    <div className="form-group">
                      <label>Clave API de Groq (gsk_...)</label>
                      <input 
                        type="password" 
                        placeholder="Pega tu clave gsk_..." 
                        value={groqApiKey} 
                        onChange={(e) => setGroqApiKey(e.target.value)} 
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          minHeight: '48px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button 
                      className="btn-primary" 
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, 'config', 'global'), { groqApiKey }, { merge: true });
                          showToast("¡Clave API de Groq guardada con éxito!", "success");
                        } catch (err) {
                          console.error("Error al guardar clave en Firestore:", err);
                          showToast("Error al guardar la clave API en Firestore.", "error");
                        }
                      }}
                      style={{ width: '100%', minHeight: '48px', fontWeight: 'bold' }}
                    >
                      Guardar Clave
                    </button>
                  </div>
                </div>
              )}

              {/* ESTADO DE SUSCRIPCIÓN Y SIMULACIÓN */}
              <div className="settings-card subscription-card">
                <div className="card-header-icon">
                  <span className="premium-icon" style={{ fontSize: '20px' }}>
                    {isAdmin ? (isSimulatingFree ? '🧪' : '🛡️') : '👑'}
                  </span>
                  <h3>
                    {isAdmin
                      ? (isSimulatingFree ? 'Modo Simulación — Vista Gratuita' : 'Licencia de Desarrollador Ilimitada')
                      : 'Suscripción y Prueba de 7 Días'}
                  </h3>
                </div>
                <div className="settings-form">
                  <div className="subscription-status" style={{ marginBottom: '15px' }}>
                    <div className="plan-badge-large" style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      backgroundColor: isAdmin
                        ? (isSimulatingFree ? 'rgba(255,165,0,0.12)' : 'rgba(76,175,125,0.15)')
                        : (isRealPaidPro ? 'rgba(212,168,67,0.18)' : (isOnTrial ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.05)')),
                      color: isAdmin
                        ? (isSimulatingFree ? '#FFA500' : '#4CAF7D')
                        : (isRealPaidPro || isOnTrial ? 'var(--gold)' : 'var(--text-secondary)'),
                      border: '1px solid',
                      borderColor: isAdmin
                        ? (isSimulatingFree ? 'rgba(255,165,0,0.35)' : 'rgba(76,175,125,0.3)')
                        : (isRealPaidPro || isOnTrial ? 'rgba(212,168,67,0.3)' : 'var(--border-color)'),
                      marginBottom: '10px'
                    }}>
                      {isAdmin
                        ? (isSimulatingFree ? '🧪 Simulación — Plan Gratuito' : '🛡️ Míster11 Desarrollador')
                        : isRealPaidPro
                          ? `👑 Míster11 ${dbPlan === 'club' ? 'CLUB' : 'PRO'} — Activo`
                          : isOnTrial
                            ? '⏱️ Míster11 PRO — Prueba'
                            : '⭐ Plan Gratuito'}
                    </div>

                    {/* Status message and countdown */}
                    {isAdmin ? (
                      isSimulatingFree ? (
                        <p className="trial-days-left" style={{ margin: 0, fontSize: '0.85rem', color: '#FFA500' }}>
                          🧪 Viendo la UI como usuario gratuito. <strong>Tu acceso real es ilimitado.</strong>
                        </p>
                      ) : (
                        <p className="trial-days-left" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Acceso permanente de por vida: <strong>Ilimitado ✅</strong>
                        </p>
                      )
                    ) : isRealPaidPro ? (
                      <p className="trial-days-left" style={{ margin: 0, fontSize: '0.9rem', color: '#4CAF7D', fontWeight: '600' }}>
                        ✅ Suscripción activa — acceso ilimitado garantizado
                      </p>
                    ) : isOnTrial ? (
                      <div>
                        {trialDaysRemaining <= 1 && (
                          <div style={{
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.82rem',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ⚠️ {trialDaysRemaining === 0 ? '¡Hoy es el último día de tu prueba!' : '¡Solo queda 1 día de prueba!'} Suscríbete ahora.
                          </div>
                        )}
                        <p className="trial-days-left" style={{ margin: 0, fontSize: '0.9rem', color: trialDaysRemaining <= 1 ? '#ef4444' : 'var(--text-secondary)' }}>
                          Periodo de prueba activo:{' '}
                          <strong>
                            {trialDaysRemaining > 1
                              ? `Quedan ${trialDaysRemaining} días (${trialHoursRemaining % 24}h exactas)`
                              : trialHoursRemaining > 0
                                ? `Quedan ${trialHoursRemaining} horas`
                                : 'Expira en breve'}
                          </strong>
                        </p>
                      </div>
                    ) : isTrialExpired ? (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold' }}>
                        🔒 Tu prueba de 7 días ha finalizado.
                      </p>
                    ) : (
                      <p className="trial-days-left" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Plan básico con funciones limitadas. Inicia una prueba gratuita de 7 días.
                      </p>
                    )}
                  </div>

                  <div className="limits-meters" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="limit-meter-item">
                      <div className="limit-meter-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Equipos Creados</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{teams.length} / {limits.TEAMS}</strong>
                      </div>
                      <div className="limit-progress-bar" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div 
                          className="limit-progress-fill" 
                          style={{
                            height: '100%',
                            backgroundColor: '#4CAF7D',
                            width: `${Math.min(100, (teams.length / limits.TEAMS) * 100)}%`,
                            transition: 'width 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="limit-meter-item">
                      <div className="limit-meter-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Jugadores ({activeTeam?.nombre || 'Equipo actual'})</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{players.length} / {limits.PLAYERS}</strong>
                      </div>
                      <div className="limit-progress-bar" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div 
                          className="limit-progress-fill" 
                          style={{
                            height: '100%',
                            backgroundColor: '#4CAF7D',
                            width: `${Math.min(100, (players.length / limits.PLAYERS) * 100)}%`,
                            transition: 'width 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="limit-meter-item">
                      <div className="limit-meter-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Sesiones ({activeTeam?.nombre || 'Equipo actual'})</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{sessions.length} / {limits.SESSIONS}</strong>
                      </div>
                      <div className="limit-progress-bar" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div 
                          className="limit-progress-fill" 
                          style={{
                            height: '100%',
                            backgroundColor: '#4CAF7D',
                            width: `${Math.min(100, (sessions.length / limits.SESSIONS) * 100)}%`,
                            transition: 'width 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="limit-meter-item flex-row-limit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Informes y Exportaciones PDF</span>
                      <strong style={{ color: limits.PDF_EXPORT ? '#4CAF7D' : 'var(--text-muted)' }}>
                        {limits.PDF_EXPORT ? 'Desbloqueado 🟢' : 'Bloqueado 🔴'}
                      </strong>
                    </div>
                  </div>

                  <div className="subscription-actions" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* ====== ADMIN CONTROLS (solo para administradores) ====== */}
                    {isAdmin && (
                      <>
                        {/* Banner de modo simulación */}
                        {isSimulatingFree ? (
                          <div style={{
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, rgba(255,165,0,0.15), rgba(255,140,0,0.08))',
                            border: '1px solid rgba(255,165,0,0.4)',
                            borderRadius: '10px',
                            color: '#FFA500',
                            fontSize: '0.82rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            lineHeight: '1.4'
                          }}>
                            🧪 MODO SIMULACIÓN ACTIVO — Viendo experiencia de usuario gratuito
                            <br />
                            <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 'normal' }}>
                              Tu acceso real sigue siendo ilimitado. Esto es solo para testing de UX.
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: 'rgba(76, 175, 125, 0.12)',
                            border: '1px solid rgba(76, 175, 125, 0.25)',
                            borderRadius: '8px',
                            color: '#4CAF7D',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}>
                            🛡️ Licencia de Desarrollador — Acceso Ilimitado de Por Vida
                          </div>
                        )}

                        {/* Botón para cambiar a modo jugador */}
                        <button
                          onClick={() => {
                            switchMode('player');
                            window.location.href = '/';
                          }}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid #10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Users size={16} /> Cambiar a Portal del Jugador (Modo Dev)
                        </button>

                        <button
                          onClick={async () => {
                            if (!window.confirm("¿Deseas reparar y normalizar los datos de asistencia de todos tus equipos hacia la fuente canónica?")) return;
                            setNormalizingAttendance(true);
                            try {
                              let totalUpdated = 0;
                              let totalRepairedKeys = 0;
                              for (const t of teams) {
                                const path = getTeamPath(t.id);
                                if (!path) continue;
                                const res = await normalizeAttendanceDatabase(path, {
                                  db,
                                  getDocs,
                                  updateDoc,
                                  setDoc,
                                  doc,
                                  collection,
                                  serverTimestamp
                                });
                                totalUpdated += (res.normalizedCount || 0);
                                totalRepairedKeys += (res.repairedKeysCount || 0);
                              }
                              showToast(`¡Normalización y reparación completadas! ${totalUpdated} eventos sincronizados y ${totalRepairedKeys} claves de jugadores reparadas.`, 'success');
                            } catch (err) {
                              console.error("Error al normalizar asistencia:", err);
                              showToast("Error al normalizar asistencia: " + err.message, "error");
                            } finally {
                              setNormalizingAttendance(false);
                            }
                          }}
                          disabled={normalizingAttendance}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid #10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <CheckCircle size={16} /> {normalizingAttendance ? 'Reparando datos...' : '⚡ Reparar y normalizar asistencia'}
                        </button>

                        {/* Botón de saneado defensivo y anti-crash de partidos */}
                        <button
                          onClick={async () => {
                            if (!window.confirm("¿Deseas sanear, validar y reparar todos los documentos de partidos (eliminando incompatibilidades legacy y aislando datos inválidos)?")) return;
                            setSanitizingMatches(true);
                            try {
                              let totalProcessed = 0;
                              let totalRepaired = 0;
                              for (const t of teams) {
                                const path = getTeamPath(t.id);
                                if (!path) continue;
                                const res = await sanitizeAllMatchesDatabase(path, {
                                  db,
                                  getDocs,
                                  updateDoc,
                                  doc,
                                  collection,
                                  serverTimestamp
                                }, players);
                                totalProcessed += (res.totalMatches || 0);
                                totalRepaired += (res.repairedMatches || 0);
                              }
                              showToast(`¡Saneado de partidos completado! ${totalProcessed} partidos analizados, ${totalRepaired} documentos legacy o inconsistentes reparados.`, 'success');
                            } catch (err) {
                              console.error("Error al sanear partidos:", err);
                              showToast("Error al sanear partidos: " + err.message, "error");
                            } finally {
                              setSanitizingMatches(false);
                            }
                          }}
                          disabled={sanitizingMatches}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid #F59E0B',
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Sparkles size={16} /> {sanitizingMatches ? 'Saneando partidos...' : '🧹 Sanear y reparar todos los partidos'}
                        </button>

                        {/* Botón de blindaje de identidades existentes */}
                        <button
                          onClick={async () => {
                            if (!window.confirm("¿Deseas blindar y generar los índices deterministas de identidad para todos los jugadores existentes?")) return;
                            setBackfilling(true);
                            try {
                              let count = 0;
                              for (const t of teams) {
                                const path = getTeamPath(t.id);
                                if (!path) continue;
                                const pSnap = await getDocs(collection(db, `${path}/players`));
                                for (const pDoc of pSnap.docs) {
                                  const p = pDoc.data();
                                  const rawEmail = p.email || p.requesterEmail;
                                  const emailNorm = normalizeEmail(rawEmail);
                                  const uid = p.requesterUid || p.playerUid || p.userId || p.uid || null;

                                  if (emailNorm) {
                                    await setDoc(doc(db, 'playerIdentityByEmail', emailNorm), {
                                      uid,
                                      playerId: pDoc.id,
                                      teamId: t.id,
                                      teamPath: path,
                                      createdAt: serverTimestamp(),
                                    }, { merge: true });
                                    count++;
                                  }

                                  if (uid) {
                                    try {
                                      await setDoc(doc(db, 'playerIdentity', uid), {
                                        email: rawEmail || '',
                                        emailNorm: emailNorm || '',
                                        teamId: t.id,
                                        playerId: pDoc.id,
                                        createdAt: serverTimestamp(),
                                      });
                                    } catch (_) {}
                                  }
                                }
                              }
                              showToast(`¡Blindaje completado! ${count} identidades indexadas exitosamente.`, 'success');
                            } catch (err) {
                              console.error("Error en backfill de identidades:", err);
                              showToast("Error al indexar identidades: " + err.message, "error");
                            } finally {
                              setBackfilling(false);
                            }
                          }}
                          disabled={backfilling}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid #3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3B82F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Shield size={16} /> {backfilling ? 'Blindando identidades...' : '🛡️ Blindar identidades existentes'}
                        </button>

                        {/* Botón de simulación */}
                        <button
                          onClick={toggleSimulatedPlan}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid',
                            backgroundColor: isSimulatingFree ? 'var(--accent)' : 'transparent',
                            borderColor: isSimulatingFree ? 'transparent' : 'rgba(255,165,0,0.5)',
                            color: isSimulatingFree ? '#ffffff' : '#FFA500'
                          }}
                        >
                          {isSimulatingFree
                            ? '✅ VOLVER A MODO DESARROLLADOR (PRO)'
                            : '🧪 SIMULAR EXPERIENCIA DE USUARIO GRATUITO'}
                        </button>

                        {/* Botón de reset — solo cuando está en simulación free */}
                        {isSimulatingFree && (
                          <button
                            onClick={resetTrial}
                            style={{
                              minHeight: '44px',
                              backgroundColor: 'rgba(255,165,0,0.08)',
                              border: '1px solid rgba(255,165,0,0.3)',
                              color: '#FFA500',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            🔄 SALIR DE SIMULACIÓN — RESTAURAR ACCESO PRO
                          </button>
                        )}
                      </>
                    )}


                    {/* ====== USUARIO NORMAL (no administrador) ====== */}
                    {!isAdmin && (
                      <>
                        {/* Banner de urgencia: aparece cuando queda 1 día o menos */}
                        {isOnTrial && trialDaysRemaining <= 1 && (
                          <div style={{
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))',
                            border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '0.83rem',
                            fontWeight: 'bold',
                            lineHeight: '1.4',
                            animation: 'urgencyPulseAdmin 2s ease-in-out infinite'
                          }}>
                            <style>{`@keyframes urgencyPulseAdmin { 0%,100%{opacity:1} 50%{opacity:0.75} }`}</style>
                            ⚠️ ¡{trialDaysRemaining === 0 ? 'Hoy vence' : 'Mañana vence'} tu prueba! Suscríbete ahora para no perder el acceso.
                          </div>
                        )}

                        {/* Aviso de prueba expirada */}
                        {isTrialExpired && !isRealPaidPro && (
                          <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '0.83rem',
                            fontWeight: '600'
                          }}>
                            🔒 Tu prueba de 7 días ha expirado. Suscríbete para recuperar el acceso PRO.
                          </div>
                        )}

                        {/* Botón de UPGRADE — visible siempre que no tenga plan real pagado */}
                        {!isRealPaidPro && (
                          <button
                            id="btn-ver-planes-pro"
                            onClick={() => setUpgradeModal({
                              open: true,
                              message: isTrialExpired
                                ? 'Tu prueba ha finalizado. Suscríbete para continuar usando Míster11 sin límites.'
                                : isOnTrial && trialDaysRemaining <= 1
                                  ? '¡Tu prueba vence pronto! Asegura tu acceso suscribiéndote ahora.'
                                  : 'Obtén acceso ilimitado a todas las funciones avanzadas de Míster11.'
                            })}
                            style={{
                              width: '100%',
                              minHeight: '52px',
                              background: isTrialExpired
                                ? 'linear-gradient(135deg, #c53030, #e53e3e)'
                                : 'linear-gradient(135deg, #1B3A2D, #2E7D5C)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              fontSize: '0.88rem',
                              letterSpacing: '0.6px',
                              boxShadow: isTrialExpired
                                ? '0 4px 16px rgba(197,48,48,0.4)'
                                : '0 4px 16px rgba(27,58,45,0.35)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isTrialExpired
                              ? '🔓 RENOVAR ACCESO — VER PLANES'
                              : '👑 VER PLANES MÍSTER11 PRO'}
                          </button>
                        )}

                        {/* Botón GESTIONAR SUSCRIPCIÓN — SOLO si hay plan real de Stripe */}
                        {isRealPaidPro && (
                          <button
                            className="btn-primary-blue-allcaps"
                            onClick={handleManageSubscription}
                            disabled={loadingPortal}
                            style={{
                              width: '100%',
                              minHeight: '48px',
                              background: '#1B3A2D',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            {loadingPortal ? '⏳ Cargando...' : '⚙️ GESTIONAR SUSCRIPCIÓN'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <RedeemCode />
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA MI CLUB */}
        {activeTab === 'club' && isClubMember && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Mi Club</h2>
              <p>Información y gestión de <strong>{club?.name || 'Cargando Club...'}</strong></p>
            </header>

            {clubRole === 'coach' ? (
              <div className="settings-card" style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Shield size={48} style={{ color: 'var(--primary-color)' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Cuenta de Entrenador</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  Eres entrenador en el club <strong>{club?.name || 'Cargando Club...'}</strong>. 
                  Los equipos que te han sido asignados aparecerán automáticamente en tu selector de equipos en el encabezado. 
                  Por favor, contacta con el administrador de tu organización para gestionar equipos, invitaciones o permisos.
                </p>
              </div>
            ) : (
              <ClubManagement />
            )}
          </div>
        )}
      </div>
      {/* Modal de Detalle de Ejercicio */}
      {selectedExerciseDetail && (
        <div className="modal-overlay" onClick={() => setSelectedExerciseDetail(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedExerciseDetail.title || selectedExerciseDetail.name || 'Detalle del Ejercicio'}</h2>
              <button className="btn-close" onClick={() => setSelectedExerciseDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {selectedExerciseDetail.content || selectedExerciseDetail.descripcion || 'Sin contenido detallado.'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setSelectedExerciseDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación de Cuenta de Entrenador (RGPD) */}
      {isDeleteCoachModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteCoachModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <Trash2 size={28} color="#EF4444" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#EF4444', fontWeight: 800 }}>¿Eliminar tu cuenta de Entrenador?</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Esta acción eliminará de forma <strong>permanente e irreversible</strong> tu usuario de entrenador, tus equipos personales, sesiones, partidos y datos en Míster11.
              </p>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              <span>Escribe <strong>ELIMINAR</strong> para confirmar:</span>
              <input
                type="text"
                value={deleteCoachConfirmText}
                onChange={e => setDeleteCoachConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontWeight: 700,
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDeleteCoachModalOpen(false)}
                disabled={isDeletingCoach}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteCoachConfirmText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingCoach}
                onClick={handleDeleteCoachAccount}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 800,
                  cursor: deleteCoachConfirmText.trim().toUpperCase() === 'ELIMINAR' ? 'pointer' : 'not-allowed',
                  opacity: deleteCoachConfirmText.trim().toUpperCase() === 'ELIMINAR' ? 1 : 0.5
                }}
              >
                {isDeletingCoach ? 'Eliminando...' : 'Sí, Eliminar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
    </div>
  );
};

export default AdminPanel;
