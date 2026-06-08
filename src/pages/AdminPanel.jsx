import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_VERSION } from '../constants/appVersion';
import { useTeams } from '../hooks/useTeams';
import { useSettings } from '../hooks/useSettings';
import { useExercises } from '../hooks/useExercises';
import { usePlayers } from '../hooks/usePlayers';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { usePlan } from '../hooks/usePlan';
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
  Clipboard
} from 'lucide-react';
import { generateSeasonReport, generateMatchConvocation, generateSessionPDF, generateExercisesReport } from '../utils/pdfGenerator';
import { generateGlobalTeamReport } from '../utils/teamReportGenerator';
import { downloadJSON } from '../utils/download';
import { t } from '../i18n/translations';
import { usePWA } from '../hooks/usePWA';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { storage, db } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import imageCompression from 'browser-image-compression';
import EscudoEquipo from '../components/EscudoEquipo';
import RedeemCode from '../components/RedeemCode';
import ExerciseLibrary from '../components/ExerciseLibrary';
import UpgradeModal from '../components/UpgradeModal';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'equipos');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  const { user } = useAuth();
  const adminEmails = ['lanuevaolarecord@gmail.com', 'lavozdelformador@gmail.com', 'jhocao111294@gmail.com'];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());
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
  const { isPro, toggleSimulatedPlan, simulatedPlan, trialDaysRemaining, trialHoursRemaining, resetTrial, limits, isDeveloper, isProActive, isOnTrial, isTrialExpired, isRealPaidPro, dbPlan } = usePlan();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  const [loadingPortal, setLoadingPortal] = useState(false);

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
            const teamSnap = await getDoc(doc(db, 'users', user.uid, 'teams', activeTeam.id));
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
  
  const { settings, saveSettings, loading: loadingSettings } = useSettings(activeTeam?.id);
  const { darkMode, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState({ profileName: '', specialty: 'Primer Entrenador' });
  const [teamEditData, setTeamEditData] = useState({ nombre: '', categoria: '', temporada: '', colorLocal: '#1B3A2D', colorVisitante: '#4CAF7D' });
  const [prefData, setPrefData] = useState({ notifications: true, language: 'Español (ES)' });
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setProfileData({ 
        profileName: settings.profileName || '', 
        specialty: settings.specialty || 'Primer Entrenador' 
      });
      setPrefData({ 
        notifications: settings.notifications ?? true, 
        language: settings.language || 'Español (ES)' 
      });
    }
  }, [settings]);

  // Cargar tests y evaluaciones del equipo activo
  useEffect(() => {
    if (!user || !activeTeam) return;
    const fetchTestsAndEvals = async () => {
      try {
        const testsSnap = await getDocs(collection(db, `users/${user.uid}/teams/${activeTeam.id}/tests`));
        const tests = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeamTests(tests);

        const evalsSnap = await getDocs(collection(db, `users/${user.uid}/teams/${activeTeam.id}/evaluaciones`));
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
    if (!isPro && teams.length >= limits.TEAMS) {
      setUpgradeModal({ open: true, message: `Has alcanzado el límite de ${limits.TEAMS} equipo(s) del plan gratuito. Pásate a PRO para crear más.` });
      return;
    }
    await addTeam(newTeam);
    setNewTeam({ nombre: '', categoria: '', temporada: '2025-26' });
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
      const options = {
        maxSizeMB: 0.04,        // 40KB máximo
        maxWidthOrHeight: 256,  // 256x256 px
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const compressedFile = await imageCompression(file, options);
      
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });
      
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
      showToast("Perfil guardado correctamente.", "success");
    } catch (e) {
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

  const toggleSetting = async (key, val = null) => {
    const newValue = val !== null ? val : !prefData[key];
    const updatedPrefs = { ...prefData, [key]: newValue };
    setPrefData(updatedPrefs);
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

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const configRef = doc(db, 'config', 'global');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const { latestApkVersion, apkDownloadUrl } = configSnap.data();
        
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

        if (isNewer(latestApkVersion, APP_VERSION)) {
          if (window.confirm(`🆕 Nueva versión ${latestApkVersion} disponible (tu versión actual: ${APP_VERSION}).\n¿Descargar ahora?`)) {
            if (Capacitor.isNativePlatform()) {
              await Browser.open({ url: apkDownloadUrl, presentationStyle: 'popover' });
            } else {
              window.open(apkDownloadUrl, '_blank');
            }
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
      const playersRef = collection(db, `users/${user.uid}/teams/${activeTeam.id}/players`);
      const playersSnap = await getDocs(playersRef);
      const playersData = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sessionsRef = collection(db, `users/${user.uid}/teams/${activeTeam.id}/sessions`);
      const sessionsSnap = await getDocs(sessionsRef);
      const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const matchesRef = collection(db, `users/${user.uid}/teams/${activeTeam.id}/matches`);
      const matchesSnap = await getDocs(matchesRef);
      const matchesData = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const testsRef = collection(db, `users/${user.uid}/teams/${activeTeam.id}/tests`);
      const testsSnap = await getDocs(testsRef);
      const testsData = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const evalsRef = collection(db, `users/${user.uid}/teams/${activeTeam.id}/evaluaciones`);
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
          <Users size={20} /> <span>Equipos</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'ejercicios' ? 'active' : ''}`}
          onClick={() => setActiveTab('ejercicios')}
        >
          <Dumbbell size={20} /> <span>Ejercicios</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'exportar' ? 'active' : ''}`}
          onClick={() => setActiveTab('exportar')}
        >
          <FileText size={20} /> <span>Informes PDF</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'ajustes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ajustes')}
        >
          <Settings size={20} /> <span>Ajustes</span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'equipos' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Gestión de Equipos</h2>
              <p>Crea y gestiona tus plantillas para cada temporada.</p>
            </header>

            <div className="add-team-card">
              <h3>Nuevo Equipo</h3>
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Nombre (ej. Infantil A)" 
                  value={newTeam.nombre}
                  onChange={e => setNewTeam({...newTeam, nombre: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Categoría" 
                  value={newTeam.categoria}
                  onChange={e => setNewTeam({...newTeam, categoria: e.target.value})}
                />
                <button className="btn-primary" onClick={handleAddTeam}><Plus size={18}/> Crear</button>
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
                <button className="btn-export" onClick={handleExportGlobalReport} style={{ marginTop: 'auto', background: '#004B87', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FileText size={18} /> 📊 Informe Global
                </button>
              </div>

              <div className="export-card">
                <Layers className="export-icon" size={32} />
                <h3>Copia de Seguridad del Equipo</h3>
                <p>Exporta toda la información del equipo activo (jugadores, sesiones, partidos, tests y evaluaciones) en un archivo JSON.</p>
                <button className="btn-export" onClick={handleExportBackup} style={{ marginTop: 'auto', background: '#004B87', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
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
              {/* CONFIGURACIÓN DE CUENTA */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Users size={20} />
                  <h3>Perfil del Entrenador</h3>
                </div>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Tu nombre" 
                      value={profileData.profileName} 
                      onChange={(e) => setProfileData({...profileData, profileName: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Especialidad / Cargo</label>
                    <select 
                      className="admin-select-input"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                    >
                      <option>Primer Entrenador</option>
                      <option>Asistente Técnico</option>
                      <option>Preparador Físico</option>
                      <option>Analista</option>
                    </select>
                  </div>
                  <button className="btn-save-settings" onClick={handleSaveProfile}>{t('btn.save', settings.language)} Perfil</button>
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
                        disabled={!activeTeam}
                      />
                    </div>
                    <div className="form-group">
                      <label>Temporada</label>
                      <input 
                        type="text" 
                        value={teamEditData.temporada} 
                        onChange={(e) => setTeamEditData({...teamEditData, temporada: e.target.value})}
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
                          accept="image/*" 
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

              {/* PREFERENCIAS DE LA APP */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Settings size={20} />
                  <h3>Preferencias</h3>
                </div>
                <div className="settings-form">
                  <div className="toggle-group">
                    <span>Notificaciones de Sesión</span>
                    <div 
                      className={`toggle-switch ${prefData.notifications ? 'active' : ''}`}
                      onClick={() => toggleSetting('notifications')}
                    ></div>
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
                        onClick={async () => {
                          try {
                            const configRef = doc(db, 'config', 'global');
                            const configSnap = await getDoc(configRef);
                            const url = configSnap.exists() ? configSnap.data().apkDownloadUrl : null;
                            if (url) {
                              if (Capacitor.isNativePlatform()) {
                                await Browser.open({ url, presentationStyle: 'popover' });
                              } else {
                                window.open(url, '_blank');
                              }
                            } else {
                              showToast('URL de descarga no configurada. Contacta al administrador.', 'error');
                            }
                          } catch (err) {
                            console.error('Error al obtener URL de APK:', err);
                            showToast('Error al obtener el enlace de descarga.', 'error');
                          }
                        }}
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
                        ⬇️ DESCARGAR APK v{APP_VERSION}
                      </button>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0, textAlign: 'center' }}>
                        Solo para Android · Habilita "Fuentes desconocidas" en Ajustes del sistema antes de instalar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ESTADO DE SUSCRIPCIÓN Y SIMULACIÓN */}
              <div className="settings-card subscription-card">
                <div className="card-header-icon">
                  <span className="premium-icon" style={{ fontSize: '20px' }}>
                    {isDeveloper ? '🛡️' : '👑'}
                  </span>
                  <h3>
                    {isDeveloper ? 'Acceso de Desarrollador PRO' : 'Suscripción y Prueba de 7 Días'}
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
                      backgroundColor: isAdmin ? 'rgba(76,175,125,0.15)' : (isRealPaidPro ? 'rgba(212,168,67,0.18)' : (isOnTrial ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.05)')),
                      color: isAdmin ? '#4CAF7D' : (isRealPaidPro || isOnTrial ? 'var(--gold)' : 'var(--text-secondary)'),
                      border: '1px solid',
                      borderColor: isAdmin ? 'rgba(76,175,125,0.3)' : (isRealPaidPro || isOnTrial ? 'rgba(212,168,67,0.3)' : 'var(--border-color)'),
                      marginBottom: '10px'
                    }}>
                      {isAdmin
                        ? '🛡️ Míster11 Desarrollador'
                        : isRealPaidPro
                          ? `👑 Míster11 ${dbPlan === 'club' ? 'CLUB' : 'PRO'} — Activo`
                          : isOnTrial
                            ? '⏱️ Míster11 PRO — Prueba'
                            : '⭐ Plan Gratuito'}
                    </div>

                    {/* Status message and countdown */}
                    {isAdmin ? (
                      <p className="trial-days-left" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Acceso permanente de por vida: <strong>Ilimitado</strong>
                      </p>
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
                        <div style={{
                          padding: '12px 16px',
                          backgroundColor: 'rgba(76, 175, 125, 0.12)',
                          border: '1px solid rgba(76, 175, 125, 0.25)',
                          borderRadius: '8px',
                          color: '#4CAF7D',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          marginBottom: '4px'
                        }}>
                          ✓ Cuenta de Desarrollador Autorizada
                        </div>
                        <button
                          className={`btn-save-settings ${isPro ? 'outline-sub' : 'solid-sub'}`}
                          onClick={toggleSimulatedPlan}
                          style={{
                            minHeight: '48px',
                            textTransform: 'uppercase',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1.5px solid',
                            backgroundColor: isPro ? 'transparent' : 'var(--accent)',
                            borderColor: isPro ? 'var(--gold)' : 'transparent',
                            color: isPro ? 'var(--gold)' : '#ffffff'
                          }}
                        >
                          {isPro ? 'Probar Plan Gratuito' : 'Activar Prueba PRO de 7 Días'}
                        </button>
                        {isPro && (
                          <button
                            className="btn-reset-trial-admin"
                            onClick={resetTrial}
                            style={{
                              minHeight: '48px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s ease',
                              marginTop: '4px'
                            }}
                          >
                            🔄 Reiniciar Prueba de 7 Días
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
                                : 'linear-gradient(135deg, #004B87, #2E7D5C)',
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
                                : '0 4px 16px rgba(0,75,135,0.35)',
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
                              background: '#004B87',
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

              {/* CANJE DE CÓDIGOS PROMOCIONALES */}
              <RedeemCode />
            </div>
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
      <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
    </div>
  );
};

export default AdminPanel;
