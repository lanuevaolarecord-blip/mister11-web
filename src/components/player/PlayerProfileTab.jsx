import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { isDeveloperEmail } from '../../config/admins';
import { showToast } from '../../utils/toast';
import { usePlayerSeasonStats } from '../../hooks/usePlayerSeasonStats';
import { calculatePlayerMatchStats } from '../../utils/playerMatchStats';
import { calcularEdad } from '../../utils/calcularEdad';
import PlayerHealthTab from '../PlayerHealthTab';
import { PlayerPlansPortalTab } from './PlayerPlansPortalTab';
import { PlayerAttendanceSubTab } from '../PlayerAttendanceSubTab';
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
  Target
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

export const PlayerProfileTab = ({ player, team, teamPath }) => {
  const { user, logout, switchMode, userProfile, activeTeamId } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('GENERAL'); // 'GENERAL' | 'FÍSICO' | 'SALUD' | 'PLANES' | 'ESTS.' | 'ASISTENCIA'

  // Estadísticas sincronizadas de partidos
  const effectiveTeamId = team?.id || activeTeamId;
  const { matches } = usePlayerSeasonStats(effectiveTeamId);
  const playerSeasonStats = useMemo(() => calculatePlayerMatchStats(player?.id, matches), [player?.id, matches]);

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

  // Canvas de Firma
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const cleanTeamPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

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
      
      {/* 1. CABECERA FICHA DEL JUGADOR (IDÉNTICA A MI EQUIPO) */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '24px 20px 16px 20px',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        position: 'relative',
        marginBottom: '16px'
      }}>
        {/* Avatar / Foto */}
        <div style={{
          width: '90px',
          height: '90px',
          margin: '0 auto 12px auto',
          borderRadius: '50%',
          background: !player?.avatarUrl ? stringToColor(player?.id || playerName) : '#FFF',
          border: '3px solid var(--accent-gold)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          {player?.avatarUrl ? (
            <img src={player.avatarUrl} alt={playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#FFF', fontSize: '28px', fontWeight: 'bold' }}>{getInitials(playerName)}</span>
          )}
        </div>

        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
          {playerName}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span style={{ color: 'var(--accent-gold)' }}>#{playerNumber}</span>
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{playerPosition}</span>
          <span style={{ fontSize: '12px', background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            ⚽ {team?.nombre || team?.name || 'Equipo'}
          </span>
        </div>
      </div>

      {/* 2. BARRA DE SUB-PESTAÑAS (GENERAL | FÍSICO | SALUD | PLANES | ESTS. | ASISTENCIA) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {[
          { key: 'GENERAL',    label: 'GENERAL',    icon: '👤' },
          { key: 'FÍSICO',     label: 'FÍSICO',     icon: '⚡' },
          { key: 'SALUD',      label: 'SALUD',      icon: '❤️' },
          { key: 'PLANES',     label: 'PLANES',     icon: '🎯' },
          { key: 'ESTS.',      label: 'ESTS.',      icon: '📊' },
          { key: 'ASISTENCIA', label: 'ASISTENCIA', icon: '📅' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === tab.key ? '3px solid var(--accent-green)' : '3px solid transparent',
              padding: '12px 10px',
              fontSize: '11.5px',
              fontWeight: '800',
              color: activeSubTab === tab.key ? 'var(--accent-green)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => setActiveSubTab(tab.key)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* 3. CONTENIDO DE LAS SUB-PESTAÑAS */}
      
      {/* ── SUB-PESTAÑA: GENERAL ── */}
      {activeSubTab === 'GENERAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Resumen Rápido Sincronizado */}
          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Goles</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)' }}>⚽ {playerSeasonStats.goals}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Minutos</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' }}>{playerSeasonStats.minutesPlayed}'</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Partidos</span>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-gold)' }}>{playerSeasonStats.matchesPlayed} PJ</div>
            </div>
          </div>

          {/* Tabla de Atributos del Jugador */}
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Categoría</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{team?.categoria || team?.category || player?.category || 'Juvenil'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pie dominante</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{player?.foot || 'Derecho'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Posición Principal</span>
              <span style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '3px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }}>
                {playerPosition}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Edad</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {calcularEdad(player?.fechaNacimiento || player?.birthDate || player?.age).text}
              </strong>
            </div>
          </div>

          {/* Dorsal Radial Chart */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', background: 'conic-gradient(var(--accent-green) 70%, var(--accent-gold) 70% 90%, var(--border-color) 90% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: '900', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{playerNumber}</span>
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
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Altura</span>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 8px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
                {player?.weight || '--'} <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>kg</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Peso</span>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px 8px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-green)' }}>
                {(player?.weight && player?.height) ? (player.weight / Math.pow(player.height/100, 2)).toFixed(1) : '--'}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>IMC</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>📊 Composición Corporal</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Los parámetros antropométricos son supervisados periódicamente por el cuerpo técnico para optimizar tu rendimiento y plan de preparación física.
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
                <Heart size={15} color="#EF4444" /> CHECK-IN DIARIO DE BIENESTAR
              </div>
              <span className="hud-status-live" style={{ color: '#34D399' }}>{todayStr}</span>
            </div>

            <form onSubmit={handleSubmitWellness} className="wellness-form">
              {wellnessSubmitted && (
                <div className="wellness-success-banner">
                  <CheckCircle size={18} color="#10B981" />
                  <span>¡Ya has enviado tu check-in de hoy! Puedes actualizarlo si cambian tus sensaciones.</span>
                </div>
              )}

              {/* Pregunta 1: Sueño / Descanso */}
              <div className="wellness-question-group">
                <label>1. ¿Cómo dormiste y qué tal descansaste? (1 = Muy mal, 5 = Excelente)</label>
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
                <label>2. ¿Tienes alguna molestia o dolor muscular?</label>
                <div className="discomfort-toggle-row">
                  <button
                    type="button"
                    className={`discomfort-pill ${!wellnessData.hasDiscomfort ? 'active no-pain' : ''}`}
                    onClick={() => setWellnessData(prev => ({ ...prev, hasDiscomfort: false, discomfortZone: 'Ninguna' }))}
                  >
                    🟢 Sin molestias
                  </button>
                  <button
                    type="button"
                    className={`discomfort-pill ${wellnessData.hasDiscomfort ? 'active with-pain' : ''}`}
                    onClick={() => setWellnessData(prev => ({ ...prev, hasDiscomfort: true }))}
                  >
                    🟡 Tengo molestias
                  </button>
                </div>

                {wellnessData.hasDiscomfort && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Zona de la molestia:</label>
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
                <label>3. ¿Nivel de ánimo y energía hoy? (1 = Bajo, 5 = A tope)</label>
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
                {savingWellness ? 'Guardando...' : (wellnessSubmitted ? 'ACTUALIZAR CHECK-IN' : 'ENVIAR CHECK-IN DIARIO')}
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

      {/* ── SUB-PESTAÑA: ESTS. (PARTIDOS & RENDIMIENTO) ── */}
      {activeSubTab === 'ESTS.' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4 Tarjetas HUD Principales Sincronizadas */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', borderLeft: '4px solid var(--accent-green)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Partidos</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: '2px 0' }}>{playerSeasonStats.matchesPlayed}</div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {playerSeasonStats.starts} tit. · {playerSeasonStats.subAppearances} sup.
              </small>
            </div>

            <div style={{ background: 'var(--bg-card)', borderLeft: '4px solid #10B981', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Goles</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#10B981', margin: '2px 0' }}>⚽ {playerSeasonStats.goals}</div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Temporada</small>
            </div>

            <div style={{ background: 'var(--bg-card)', borderLeft: '4px solid #3B82F6', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Asistencias</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#3B82F6', margin: '2px 0' }}>👟 {playerSeasonStats.assists}</div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Pases de gol</small>
            </div>

            <div style={{ background: 'var(--bg-card)', borderLeft: '4px solid #F59E0B', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Minutos</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#F59E0B', margin: '2px 0' }}>⏱️ {playerSeasonStats.minutesPlayed}'</div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>En campo</small>
            </div>
          </div>

          {/* Tarjetas Disciplina y Nota Media */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>TARJETAS</span>
              <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
                🟨 {playerSeasonStats.yellowCards} · 🟥 {playerSeasonStats.redCards}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>NOTA MEDIA</span>
              <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: '#D4A843' }}>
                ⭐ {playerSeasonStats.avgRating}
              </div>
            </div>
          </div>

          {/* Historial Detallado de Partidos */}
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📋</span> Historial de Partidos Disputados ({playerSeasonStats.matchHistory.length})
            </h4>

            {playerSeasonStats.matchHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playerSeasonStats.matchHistory.map((mItem, idx) => (
                  <div key={idx} style={{ 
                    background: 'var(--bg-app)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '10px', 
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        vs {mItem.rival}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        background: 'rgba(27, 58, 45, 0.08)',
                        color: 'var(--text-primary)'
                      }}>
                        {mItem.result} ({mItem.type})
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>📅 {mItem.date} · {mItem.isTitular ? 'Titular' : 'Suplente'} ({mItem.minutesPlayed}')</span>
                      <div style={{ display: 'flex', gap: '6px', fontWeight: '800' }}>
                        {mItem.goals > 0 && <span style={{ color: '#10B981' }}>⚽ {mItem.goals}</span>}
                        {mItem.assists > 0 && <span style={{ color: '#3B82F6' }}>👟 {mItem.assists}</span>}
                        {mItem.yellowCards > 0 && <span>🟨</span>}
                        {mItem.redCards > 0 && <span>🟥</span>}
                        {mItem.rating !== '-' && <span style={{ color: '#D4A843' }}>⭐ {mItem.rating}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '12px'
              }}>
                <p style={{ margin: 0, fontWeight: '700' }}>Sin partidos registrados con tu ficha</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
                  Tus goles y minutos jugados se actualizarán aquí automáticamente tras cada partido oficial.
                </p>
              </div>
            )}
          </div>
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
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Consentimientos Parentales (RGPD)</span>
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
            <FileSignature size={14} /> Firmar / Editar
          </button>
        </div>
      </div>

      {/* 5. ACCIONES Y CAMBIO DE MODO (DEV/COACH ONLY) */}
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
            <User size={18} /> Cambiar a Modo Entrenador (Dev / Coach)
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className="btn-outline"
          style={{
            width: '100%',
            minHeight: '48px',
            borderColor: '#EF4444',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700
          }}
        >
          Cerrar Sesión
        </button>
      </div>

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
