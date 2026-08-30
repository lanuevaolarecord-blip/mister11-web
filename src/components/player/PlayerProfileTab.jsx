import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { isDeveloperEmail } from '../../config/admins';
import { showToast } from '../../utils/toast';
import { usePlayerSeasonStats } from '../../hooks/usePlayerSeasonStats';
import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
import { calculatePlayerPerformanceScores, consolidatePlayerEvaluations } from '../../utils/testScoreEngine';
import { calcularEdad } from '../../utils/calcularEdad';
import PlayerHealthTab from '../PlayerHealthTab';
import { PlayerPlansPortalTab } from './PlayerPlansPortalTab';
import { PlayerAttendanceSubTab } from '../PlayerAttendanceSubTab';
import { PlayerTabs } from './PlayerTabs';
import LegendCard from '../LegendCard';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  User, 
  Heart, 
  Shield, 
  Lock, 
  CheckCircle, 
  FileSignature, 
  Activity, 
  Sparkles, 
  Trophy,
  Flame,
  Calendar,
  Clock,
  Target,
  Mail,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const BODY_ZONES = ['Ninguna', 'Gemelo Izquierdo', 'Gemelo Derecho', 'Cuádriceps', 'Isquiotibiales', 'Rodilla', 'Tobillo', 'Espalda / Lumbar', 'Aductor', 'Hombro'];

const stringToColor = (str) => {
  if (!str) return '#1B3A2D';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 40%)`;
};

const getInitials = (name) => {
  if (!name) return 'M11';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export const PlayerProfileTab = ({ player, team, teamPath, onNavigateTab }) => {
  const { user, logout, switchMode, userProfile, activeTeamId } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('GENERAL'); // 'GENERAL' | 'FÍSICO' | 'SALUD' | 'PLANES' | 'ESTS.' | 'ASISTENCIA'

  const { t, isEn } = useTranslation();

  // Estadísticas sincronizadas de partidos
  const effectiveTeamId = team?.id || activeTeamId;
  const { matches } = usePlayerSeasonStats(effectiveTeamId);
  const playerSeasonStats = useMemo(() => calculatePlayerMatchStats(player?.id, matches), [player?.id, matches]);

  // Evaluaciones y tests en tiempo real 100% sincronizados con Míster11
  const [evaluations, setEvaluations] = useState([]);
  const effectivePlayerId = player?.id || 'player-self';
  const cleanTeamPath = (teamPath || (effectiveTeamId ? `equipos/${effectiveTeamId}` : '')).replace(/^\/+|\/+$/g, '');

  useEffect(() => {
    if (!cleanTeamPath || !effectivePlayerId) return;

    let evalsList = [];
    let testResultsList = [];
    let playerDirectList = [];

    const rebuildData = () => {
      const allCombined = [...evalsList, ...testResultsList, ...playerDirectList];
      const consolidated = consolidatePlayerEvaluations(allCombined, effectivePlayerId);
      setEvaluations(consolidated);
    };

    const unsubEvals = onSnapshot(collection(db, `${cleanTeamPath}/evaluaciones`), (snap) => {
      evalsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildData();
    }, () => {});

    const unsubResults = onSnapshot(collection(db, `${cleanTeamPath}/test_results`), (snap) => {
      testResultsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildData();
    }, () => {});

    const unsubPlayerDirect = onSnapshot(collection(db, `${cleanTeamPath}/players/${effectivePlayerId}/test_results`), (snap) => {
      playerDirectList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildData();
    }, () => {});

    return () => {
      unsubEvals();
      unsubResults();
      unsubPlayerDirect();
    };
  }, [cleanTeamPath, effectivePlayerId]);

  const performanceScores = useMemo(() => {
    const effectiveRating = (playerSeasonStats?.avgRating && playerSeasonStats.avgRating !== '-' && !isNaN(Number(playerSeasonStats.avgRating)))
      ? Number(playerSeasonStats.avgRating)
      : (player?.notaMedia && !isNaN(Number(player.notaMedia)) ? Number(player.notaMedia) : null);

    return calculatePlayerPerformanceScores(evaluations, player, {
      attendancePct: player?.attendancePct ? Number(player.attendancePct) : 0,
      matchRating: effectiveRating
    });
  }, [evaluations, player, playerSeasonStats]);

  // Estados de Wellness
  const todayStr = new Date().toISOString().split('T')[0];
  const [wellnessData, setWellnessData] = useState({
    sleep: 4,
    hasDiscomfort: false,
    discomfortZone: 'Ninguna',
    mood: 4,
  });
  const [wellnessSubmitted, setWellnessSubmitted] = useState(false);
  const [savingWellness, setSavingWellness] = useState(false);

  // Estados de Consentimiento Parental
  const [consents, setConsents] = useState(player?.consents || {
    basic: true,
    attendance: true,
    health: false,
    tests: false
  });
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [parentName, setParentName] = useState(player?.consents?.signedBy || user?.displayName || '');
  const [signConsentHealth, setSignConsentHealth] = useState(consents.health || false);
  const [signConsentTests, setSignConsentTests] = useState(consents.tests || false);
  const [savingConsent, setSavingConsent] = useState(false);

  // Estados de Eliminación de Cuenta (RGPD)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteMyAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      // 1. Limpiar datos del usuario en Firestore
      const rawEmail = user.email;
      if (rawEmail) {
        try {
          await deleteDoc(doc(db, 'playerIdentityByEmail', rawEmail.trim().toLowerCase()));
        } catch (_) {}
      }
      try {
        await deleteDoc(doc(db, 'playerIdentity', user.uid));
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (_) {}

      // 2. Eliminar cuenta de autenticación
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      showToast('Tu cuenta ha sido eliminada correctamente.', 'info');
      window.location.href = '/';
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      if (err.code === 'auth/requires-recent-login') {
        alert('Por motivos de seguridad, debes cerrar sesión e iniciarla de nuevo antes de eliminar tu cuenta.');
      } else {
        alert('No se pudo eliminar la cuenta. Por favor contáctanos o reintenta tras reiniciar sesión.');
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Canvas de Firma
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 1. Cargar Wellness del día si ya se envió
  useEffect(() => {
    const effectivePlayerId = (player?.id && player.id !== 'player-self') ? player.id : (user?.uid || 'player-self');
    
    // Check local storage first for instant load
    try {
      const localSaved = localStorage.getItem(`m11_wellness_${effectivePlayerId}_${todayStr}`);
      if (localSaved) {
        setWellnessData(JSON.parse(localSaved));
        setWellnessSubmitted(true);
      }
    } catch (_) {}

    if (!cleanTeamPath) return;

    const checkWellness = async () => {
      try {
        const wDocRef = doc(db, `${cleanTeamPath}/players/${effectivePlayerId}/wellness`, todayStr);
        const wSnap = await getDoc(wDocRef);
        if (wSnap.exists()) {
          setWellnessData(wSnap.data());
          setWellnessSubmitted(true);
        }
      } catch (err) {
        console.warn('Error al consultar wellness:', err);
      }
    };
    checkWellness();
  }, [cleanTeamPath, player?.id, todayStr, user?.uid]);

  // Inicializar Canvas táctil cuando se abre el modal de consentimiento
  useEffect(() => {
    if (!isConsentModalOpen) return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setHasDrawn(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [isConsentModalOpen]);

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    isDrawing.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Enviar Check-in de Bienestar
  const handleSubmitWellness = async (e) => {
    e.preventDefault();
    const effectivePlayerId = (player?.id && player.id !== 'player-self') ? player.id : (user?.uid || 'player-self');

    setSavingWellness(true);
    try {
      const wellnessPayload = {
        ...wellnessData,
        date: todayStr,
        playerName: player?.name || user?.displayName || 'Jugador',
        playerId: effectivePlayerId,
        playerNumber: player?.number || '',
        updatedAt: serverTimestamp(),
      };

      // Guardar en local storage para respaldo instantáneo
      try {
        localStorage.setItem(`m11_wellness_${effectivePlayerId}_${todayStr}`, JSON.stringify(wellnessPayload));
      } catch (_) {}

      if (cleanTeamPath) {
        // 1. Guardar en subcolección del jugador
        const wDocRef = doc(db, `${cleanTeamPath}/players/${effectivePlayerId}/wellness`, todayStr);
        await setDoc(wDocRef, wellnessPayload, { merge: true });

        // 2. Guardar en colección de wellness general del equipo (para que el cuerpo técnico lo vea)
        try {
          const teamWellnessRef = doc(db, `${cleanTeamPath}/wellness`, `${effectivePlayerId}_${todayStr}`);
          await setDoc(teamWellnessRef, wellnessPayload, { merge: true });
        } catch (teamErr) {
          console.warn('Advertencia guardando en team wellness:', teamErr);
        }
      }

      setWellnessSubmitted(true);
      showToast('¡Check-in de bienestar guardado correctamente!', 'success');
    } catch (err) {
      console.warn('Error guardando wellness en nube, guardado localmente:', err);
      setWellnessSubmitted(true);
      showToast('¡Check-in de bienestar guardado correctamente!', 'success');
    } finally {
      setSavingWellness(false);
    }
  };

  // Guardar Consentimiento Parental Granular
  const handleSaveConsent = async () => {
    if (!teamPath) return;
    if (!parentName.trim()) {
      showToast('Escribe el nombre del padre/tutor.', 'error');
      return;
    }

    const effectivePlayerId = (player?.id && player.id !== 'player-self') ? player.id : (user?.uid || 'player-self');

    let signatureUrl = consents.signatureUrl || '';
    if (canvasRef.current && hasDrawn) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    setSavingConsent(true);
    try {
      const updatedConsents = {
        basic: true,
        attendance: true,
        health: signConsentHealth,
        tests: signConsentTests,
        signedBy: parentName.trim(),
        signedAt: new Date().toISOString(),
        signatureUrl,
      };

      const playerDocRef = doc(db, `${teamPath}/players`, effectivePlayerId);
      await setDoc(playerDocRef, { consents: updatedConsents }, { merge: true });

      setConsents(updatedConsents);
      setIsConsentModalOpen(false);
      showToast('Consentimiento parental actualizado exitosamente.', 'success');
    } catch (err) {
      console.error('Error guardando consentimientos:', err);
      showToast('Error al guardar consentimiento.', 'error');
    } finally {
      setSavingConsent(false);
    }
  };

  const playerName = player?.name || user?.displayName || 'Jugador';
  const playerNumber = player?.number || '11';
  const playerPosition = player?.position || 'MC';

  return (
    <div className="player-tab-content player-profile-tab" style={{ paddingBottom: '30px' }}>
      
      {/* 1. TARJETA LEGEND CARD EXCLUSIVA (SIN BANNER TÁCTICO) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', width: '100%' }}>
        <LegendCard
          player={player}
          overall={performanceScores.overall || '-'}
          position={player?.position || player?.posicion || 'MC'}
          streak={performanceScores.testCount}
          type="elite"
          stats={performanceScores.stats4}
        />
      </div>

      {/* 2. BARRA DE SUB-PESTAÑAS RESPONSIVE HÍBRIDA */}
      <PlayerTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* 3. CONTENIDO DE LAS SUB-PESTAÑAS */}
      
      {/* ── SUB-PESTAÑA: GENERAL ── */}
      {activeSubTab === 'GENERAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Resumen Rápido Sincronizado */}
          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.goals')}</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)' }}>⚽ {playerSeasonStats.goals}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.minutes')}</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' }}>{playerSeasonStats.minutesPlayed}'</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.matches')}</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-gold)' }}>{playerSeasonStats.matchesPlayed} {isEn ? 'MP' : 'PJ'}</div>
            </div>
          </div>

          {/* Tabla de Atributos del Jugador */}
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.profile.category')}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{team?.categoria || team?.category || player?.category || (isEn ? 'Youth' : 'Juvenil')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.profile.foot')}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {player?.foot === 'Derecho' || player?.foot === 'Right' ? (isEn ? 'Right' : 'Derecho') :
                 player?.foot === 'Izquierdo' || player?.foot === 'Left' ? (isEn ? 'Left' : 'Izquierdo') :
                 player?.foot === 'Ambidiestro' || player?.foot === 'Both' ? (isEn ? 'Both' : 'Ambidiestro') : (player?.foot || (isEn ? 'Right' : 'Derecho'))}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.profile.position')}</span>
              <span style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '3px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }}>
                {playerPosition}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.profile.age')}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {(() => {
                  const calc = calcularEdad(player?.fechaNacimiento || player?.birthDate || player?.age);
                  return calc.years ? `${calc.years} ${isEn ? 'years old' : 'años'}` : calc.text;
                })()}
              </strong>
            </div>

            {/* Cuenta Vinculada */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.profile.account')}</span>
              <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {user?.email || player?.email || (isEn ? 'Player Account' : 'Cuenta de Jugador')}
              </span>
            </div>
          </div>

          {/* Dorsal Radial Chart con Leyenda Visible */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', background: 'conic-gradient(var(--accent-green) 70%, var(--accent-gold) 70% 90%, var(--border-color) 90% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}
              title={`#${playerNumber}`}
            >
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', lineHeight: 1 }}>{playerNumber}</span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{t('player.profile.dorsal')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-PESTAÑA: FÍSICO ── */}
      {activeSubTab === 'FÍSICO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px 8px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
                {player?.height || '--'} <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>cm</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.height')}</span>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 8px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
                {player?.weight || '--'} <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>kg</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.weight')}</span>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 8px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-green)' }}>
                {(player?.weight && player?.height) ? (player.weight / Math.pow(player.height/100, 2)).toFixed(1) : '--'}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.profile.bmi')}</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{t('player.profile.bodyComp')}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {t('player.profile.bodyCompDesc')}
            </p>
          </div>
        </div>
      )}

      {/* ── SUB-PESTAÑA: SALUD & BIENESTAR ── */}
      {activeSubTab === 'SALUD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* CHECK-IN DE BIENESTAR DIARIO (WELLNESS) */}
          <div className="hud-card wellness-card">
            <div className="hud-header">
              <div className="hud-badge">
                <Heart size={15} color="#EF4444" /> {t('player.profile.wellnessCheckin')}
              </div>
              <span className="hud-status-live" style={{ color: '#34D399' }}>{todayStr}</span>
            </div>

            <form onSubmit={handleSubmitWellness} className="wellness-form">
              {wellnessSubmitted && (
                <div className="wellness-success-banner">
                  <CheckCircle size={18} color="#10B981" />
                  <span>{t('player.profile.wellnessSent')}</span>
                </div>
              )}

              {/* Pregunta 1: Sueño / Descanso */}
              <div className="wellness-question-group">
                <label>{t('player.profile.sleepQuestion')}</label>
                <div className="scale-selector-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`scale-btn ${wellnessData.sleep === val ? 'selected' : ''}`}
                      onClick={() => setWellnessData(prev => ({ ...prev, sleep: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pregunta 2: Molestias Físicas */}
              <div className="wellness-question-group">
                <label>{t('player.profile.discomfortQuestion')}</label>
                <div className="discomfort-toggle-row">
                  <button
                    type="button"
                    className={`discomfort-pill ${!wellnessData.hasDiscomfort ? 'active no-pain' : ''}`}
                    onClick={() => setWellnessData(prev => ({ ...prev, hasDiscomfort: false, discomfortZone: 'Ninguna' }))}
                  >
                    {t('player.profile.noDiscomfort')}
                  </button>
                  <button
                    type="button"
                    className={`discomfort-pill ${wellnessData.hasDiscomfort ? 'active with-pain' : ''}`}
                    onClick={() => setWellnessData(prev => ({ ...prev, hasDiscomfort: true }))}
                  >
                    {t('player.profile.hasDiscomfort')}
                  </button>
                </div>

                {wellnessData.hasDiscomfort && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('player.profile.discomfortZone')}</label>
                    <select
                      value={wellnessData.discomfortZone}
                      onChange={(e) => setWellnessData(prev => ({ ...prev, discomfortZone: e.target.value }))}
                      className="zone-select"
                    >
                      {BODY_ZONES.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Pregunta 3: Ánimo / Energía */}
              <div className="wellness-question-group">
                <label>{t('player.profile.moodQuestion')}</label>
                <div className="scale-selector-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`scale-btn ${wellnessData.mood === val ? 'selected' : ''}`}
                      onClick={() => setWellnessData(prev => ({ ...prev, mood: val }))}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-auth"
                disabled={savingWellness}
                style={{ background: '#10B981', minHeight: '48px', fontWeight: 800 }}
              >
                {savingWellness ? (isEn ? 'Saving...' : 'Guardando...') : (wellnessSubmitted ? (isEn ? 'UPDATE CHECK-IN' : 'ACTUALIZAR CHECK-IN') : (isEn ? 'SAVE HEALTH CHECK-IN' : 'ENVIAR CHECK-IN DIARIO'))}
              </button>
            </form>
          </div>

          {/* Historial Médico & Lesiones */}
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <PlayerHealthTab player={player} teamId={effectiveTeamId} teamPath={teamPath} />
          </div>
        </div>
      )}

      {/* ── SUB-PESTAÑA: PLANES ── */}
      {activeSubTab === 'PLANES' && (
        <div>
          <PlayerPlansPortalTab player={player} team={team} teamPath={teamPath} />
        </div>
      )}

      {/* ── SUB-PESTAÑA: ASISTENCIA ── */}
      {activeSubTab === 'ASISTENCIA' && (
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <PlayerAttendanceSubTab playerId={player?.id} teamId={effectiveTeamId} />
        </div>
      )}

      {/* 4. GESTIÓN DE CONSENTIMIENTOS RGPD (ACCESIBLE) */}
      <div style={{ marginTop: '20px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#10B981" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{t('player.profile.consentStatus')}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConsentModalOpen(true)}
            style={{
              background: 'none',
              border: '1px solid var(--accent-green)',
              color: 'var(--accent-green)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileSignature size={14} /> {t('player.profile.signConsent')}
          </button>
        </div>
      </div>

      {/* 5. ACCIONES Y CAMBIO DE MODO */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(isDeveloperEmail(user?.email) || userProfile?.role === 'coach' || userProfile?.role === 'admin' || user?.email === 'lanuevaolarecord@gmail.com' || user?.email === 'jhocatv@gmail.com') && (
          <button
            type="button"
            onClick={() => {
              switchMode('coach');
              window.location.href = '/';
            }}
            className="btn-outline"
            style={{
              width: '100%',
              minHeight: '48px',
              borderColor: '#3B82F6',
              color: '#60A5FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.08)'
            }}
          >
            <User size={18} /> {t('player.profile.switchToCoach')}
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className="btn-outline"
          style={{
            width: '100%',
            minHeight: '48px',
            borderColor: 'var(--border-color, #CBD5E1)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700
          }}
        >
          {t('player.profile.logout')}
        </button>

        {/* ZONA DE PRIVACIDAD / ELIMINAR CUENTA (RGPD) */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', width: '100%', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px',
              minHeight: '44px'
            }}
          >
            <Trash2 size={15} color="#EF4444" />
            <span>{t('player.profile.deleteAccount')}</span>
          </button>
        </div>
      </div>

      {/* MODAL DE ELIMINACIÓN DE CUENTA (RGPD) */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <AlertTriangle size={28} color="#EF4444" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#EF4444', fontWeight: 800 }}>¿Eliminar tu cuenta?</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Esta acción es <strong>permanente e irreversible</strong>. Se eliminará tu acceso de usuario, tu historial deportivo, consentimientos y perfil en Míster11.
              </p>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              <span>Escribe <strong>ELIMINAR</strong> para confirmar:</span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
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
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingAccount}
                onClick={handleDeleteMyAccount}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: 800,
                  cursor: deleteConfirmText.trim().toUpperCase() === 'ELIMINAR' ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText.trim().toUpperCase() === 'ELIMINAR' ? 1 : 0.5
                }}
              >
                {isDeletingAccount ? 'Eliminando...' : 'Sí, Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FIRMA DE CONSENTIMIENTO PARENTAL RGPD */}
      {isConsentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConsentModalOpen(false)}>
          <div className="modal-content consent-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Consentimiento Parental Digital</h3>
              </div>
              <button className="btn-close" onClick={() => setIsConsentModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD, el padre, madre o tutor legal puede autorizar o denegar los siguientes tratamientos de datos del menor:
              </p>

              {/* Nombre del padre/tutor */}
              <div className="form-group-team full" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre y Apellidos del Padre / Tutor *</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ej. Carlos Caicedo Pérez"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              {/* Checkboxes granulares */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    checked={signConsentHealth}
                    onChange={(e) => setSignConsentHealth(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10B981' }}
                  />
                  <span>
                    <strong>Datos de Salud y Molestias:</strong> Autorizo el registro del check-in diario de bienestar y reporte de fatiga muscular con fines exclusivos de prevención de lesiones.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    checked={signConsentTests}
                    onChange={(e) => setSignConsentTests(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10B981' }}
                  />
                  <span>
                    <strong>Tests y Rendimiento:</strong> Autorizo la realización de evaluaciones autónomas de velocidad, salto y resistencia para seguimiento técnico.
                  </span>
                </label>
              </div>

              {/* Pad de firma digital */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Firma del Padre / Tutor (con el dedo o ratón):</label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Borrar firma
                  </button>
                </div>
                <div style={{ border: '2px dashed var(--accent-green)', borderRadius: '8px', background: '#FFF', height: '120px', touchAction: 'none' }}>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleEndDraw}
                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '6px' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsConsentModalOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveConsent}
                disabled={savingConsent}
                style={{ background: '#10B981', fontWeight: 'bold' }}
              >
                {savingConsent ? 'Guardando...' : 'Confirmar y Guardar Firma'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
