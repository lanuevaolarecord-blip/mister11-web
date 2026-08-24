import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { User, Heart, Shield, Lock, CheckCircle, AlertCircle, LogOut, FileSignature, Sparkles, Smile, Frown, Meh, Activity } from 'lucide-react';

const BODY_ZONES = ['Ninguna', 'Gemelo Izquierdo', 'Gemelo Derecho', 'Cuádriceps', 'Isquiotibiales', 'Rodilla', 'Tobillo', 'Espalda / Lumbar', 'Aductor', 'Hombro'];

export const PlayerProfileTab = ({ player, team, teamPath }) => {
  const { user, logout, switchMode } = useAuth();

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

  // 1. Cargar Wellness del día si ya se envió
  useEffect(() => {
    if (!teamPath || !player?.id) return;

    const checkWellness = async () => {
      try {
        const wDocRef = doc(db, `${teamPath}/players/${player.id}/wellness`, todayStr);
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
  }, [teamPath, player?.id, todayStr]);

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
    if (!teamPath || !player?.id) return;
    if (!consents.health) {
      showToast('Se requiere consentimiento de salud para registrar el bienestar.', 'error');
      return;
    }

    setSavingWellness(true);
    try {
      const wDocRef = doc(db, `${teamPath}/players/${player.id}/wellness`, todayStr);
      await setDoc(wDocRef, {
        ...wellnessData,
        date: todayStr,
        playerName: player.name || 'Jugador',
        playerId: player.id,
        createdAt: serverTimestamp(),
      });
      setWellnessSubmitted(true);
      showToast('¡Check-in de bienestar guardado!', 'success');
    } catch (err) {
      console.error('Error guardando wellness:', err);
      showToast('Error al guardar bienestar.', 'error');
    } finally {
      setSavingWellness(false);
    }
  };

  // Guardar Consentimiento Parental Granular
  const handleSaveConsent = async () => {
    if (!teamPath || !player?.id) return;
    if (!parentName.trim()) {
      showToast('Escribe el nombre del padre/tutor.', 'error');
      return;
    }

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

      const playerDocRef = doc(db, `${teamPath}/players`, player.id);
      await updateDoc(playerDocRef, { consents: updatedConsents });

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

  return (
    <div className="player-tab-content player-profile-tab">
      {/* TARJETA DE PERFIL BÁSICO */}
      <div className="player-card-profile">
        <div className="profile-top-row">
          <div className="player-avatar-large">
            {player?.number ? `#${player.number}` : (player?.name || 'M11').substring(0, 2).toUpperCase()}
          </div>
          <div className="profile-info-main">
            <h2 className="profile-name">{player?.name || user?.displayName || 'Jugador'}</h2>
            <span className="profile-role-tag">⚽ {team?.nombre || team?.name || 'Equipo'}</span>
            <div className="profile-meta-tags">
              <span className="meta-tag">Posición: <strong>{player?.position || 'MC'}</strong></span>
              <span className="meta-tag">Dorsal: <strong>{player?.number ? `#${player.number}` : 'S/N'}</strong></span>
              <span className="meta-tag">Categoría: <strong>{team?.categoria || team?.category || 'General'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* CHECK-IN DE BIENESTAR DIARIO (WELLNESS) */}
      <div className="hud-card wellness-card">
        <div className="hud-header">
          <div className="hud-badge">
            <Heart size={15} color="#EF4444" /> CHECK-IN DIARIO DE BIENESTAR
          </div>
          <span className="hud-status-live" style={{ color: '#34D399' }}>{todayStr}</span>
        </div>

        {/* SI NO TIENE CONSENTIMIENTO DE SALUD -> CANDADO RGPD */}
        {!consents.health ? (
          <div className="locked-wellness-box">
            <div className="lock-icon-wrap">
              <Lock size={28} color="#F59E0B" />
            </div>
            <h4>Requiere Consentimiento Parental</h4>
            <p>
              Para registrar datos de salud, fatiga y molestias físicas conforme al RGPD / LOPDGDD, el padre, madre o tutor debe autorizar el módulo de salud.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => setIsConsentModalOpen(true)}
              style={{ background: '#10B981', minHeight: '44px', fontWeight: 800 }}
            >
              <FileSignature size={16} /> Firmar Consentimiento Parental
            </button>
          </div>
        ) : (
          /* FORMULARIO DE BIENESTAR (3 PREGUNTAS) */
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
        )}
      </div>

      {/* GESTIÓN DE CONSENTIMIENTOS RGPD */}
      <div className="hud-card consents-management-card">
        <div className="hud-header">
          <div className="hud-badge">
            <Shield size={15} color="#10B981" /> CONSENTIMIENTOS PARENTALES (RGPD)
          </div>
        </div>

        <div className="consents-status-list">
          <div className="consent-status-item">
            <div>
              <span className="consent-title">Datos Básicos y Contacto</span>
              <span className="consent-desc">Nombre, fecha de nacimiento y dorsal.</span>
            </div>
            <span className="consent-badge mandatory">OBLIGATORIO</span>
          </div>

          <div className="consent-status-item">
            <div>
              <span className="consent-title">Asistencia y Calendario</span>
              <span className="consent-desc">Convocatorias de partidos y entrenamientos.</span>
            </div>
            <span className="consent-badge mandatory">OBLIGATORIO</span>
          </div>

          <div className="consent-status-item">
            <div>
              <span className="consent-title">Datos de Salud y Bienestar</span>
              <span className="consent-desc">Check-in diario de fatiga y molestias.</span>
            </div>
            <span className={`consent-badge ${consents.health ? 'granted' : 'pending'}`}>
              {consents.health ? 'AUTORIZADO' : 'NO AUTORIZADO'}
            </span>
          </div>

          <div className="consent-status-item">
            <div>
              <span className="consent-title">Tests Físicos y Rendimiento</span>
              <span className="consent-desc">Evolución de fuerza, velocidad y resistencia.</span>
            </div>
            <span className={`consent-badge ${consents.tests ? 'granted' : 'pending'}`}>
              {consents.tests ? 'AUTORIZADO' : 'NO AUTORIZADO'}
            </span>
          </div>
        </div>

        <button
          className="btn-outline"
          onClick={() => setIsConsentModalOpen(true)}
          style={{ width: '100%', minHeight: '44px', marginTop: '14px', fontWeight: 700 }}
        >
          <FileSignature size={16} /> Gestionar o Revocar Consentimientos
        </button>
      </div>

      {/* ACCIONES Y CAMBIO DE MODO */}
      <div style={{ marginTop: '24px', paddingBottom: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
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
          <User size={18} /> Cambiar a Modo Entrenador
        </button>

        <button
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
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>

      {/* MODAL DE CONSENTIMIENTO PARENTAL DIGITAL */}
      {isConsentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConsentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#10B981' }}>
              <Shield size={22} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Consentimiento Parental Digital</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
              De conformidad con el RGPD y la LOPDGDD, selecciona los permisos que autorizas para el jugador <strong>{player?.name || 'Menor'}</strong> en Míster11.
            </p>

            <div className="input-group-auth" style={{ marginBottom: '14px' }}>
              <label>Nombre Completo del Padre / Madre / Tutor *</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Ej. María Gómez"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Checkboxes Granulares */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ marginTop: '2px', accentColor: '#10B981' }}
                />
                <span><strong>[Obligatorio]</strong> Datos básicos y asistencia deportiva.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={signConsentHealth}
                  onChange={(e) => setSignConsentHealth(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#10B981' }}
                />
                <span><strong>[Opcional]</strong> Registro de salud, bienestar diario y prevención de molestias musculares.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={signConsentTests}
                  onChange={(e) => setSignConsentTests(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#10B981' }}
                />
                <span><strong>[Opcional]</strong> Evaluaciones físicas y tests de rendimiento deportivo.</span>
              </label>
            </div>

            {/* Canvas de Firma Digital */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firma digital del Padre / Tutor:</label>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer' }}
                >
                  Borrar firma
                </button>
              </div>

              <div style={{
                background: '#0B120E',
                border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                height: '110px',
                touchAction: 'none'
              }}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleEndDraw}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsConsentModalOpen(false)}
                style={{ flex: 1, minHeight: '44px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveConsent}
                disabled={savingConsent || !parentName.trim()}
                style={{ flex: 1, background: '#10B981', minHeight: '44px', fontWeight: 800 }}
              >
                {savingConsent ? 'Guardando...' : 'GUARDAR FIRMA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
