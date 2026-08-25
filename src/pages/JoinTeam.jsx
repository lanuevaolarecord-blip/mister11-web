import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db, signInWithGoogle, signInWithEmail, registerWithEmail } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { getTeamByCode } from '../utils/teamCode';
import { showToast } from '../utils/toast';
import { Shield, CheckCircle, AlertCircle, Users, ArrowRight, Loader, KeyRound, Mail, Lock, User, Calendar, Shirt } from 'lucide-react';
import './Login.css';

const POSITIONS = ['POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

import { normalizeEmail } from '../utils/normalizeEmail';

const JoinTeam = () => {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('token') || '';
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados del flujo
  const [step, setStep] = useState(1); // 1: Auth (si no logueado), 2: Código, 3: Datos del Jugador, 4: Enviado / Pendiente
  const [inputCode, setInputCode] = useState(codeParam.toUpperCase());
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myExistingRequest, setMyExistingRequest] = useState(null);

  const [authTab, setAuthTab] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [requesterRole, setRequesterRole] = useState('player');
  const [playerName, setPlayerName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [position, setPosition] = useState('MC');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (codeParam) {
      handleVerifyCode(codeParam);
    }
  }, [codeParam]);

  useEffect(() => {
    if (!user || user.uid === 'invitado-local') return;

    const q = query(collection(db, 'users', user.uid, 'join_requests'));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const pending = reqs.find(r => r.status === 'pending');
        const approved = reqs.find(r => r.status === 'approved');
        if (approved) {
          showToast('¡Tu solicitud ha sido aprobada!', 'success');
          navigate(approved.requesterRole === 'parent' ? '/player-dashboard' : '/player-dashboard');
        } else if (pending) {
          setMyExistingRequest(pending);
        }
      }
    });

    return () => unsub();
  }, [user, navigate]);

  const handleVerifyCode = async (codeToVerify) => {
    const code = (codeToVerify || inputCode).trim().toUpperCase();
    if (!code) {
      setError('Por favor ingresa un código de equipo válido (ej. M11-ABC123).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getTeamByCode(code);
      if (!data) {
        setError('Código de equipo no encontrado. Verifica que esté bien escrito.');
        setTeamData(null);
      } else {
        setTeamData(data);
        setInputCode(code);

        if (user && user.uid !== 'invitado-local') {
          const emailNorm = normalizeEmail(user.email);
          try {
            if (emailNorm) {
              const identityDoc = await getDoc(doc(db, 'playerIdentityByEmail', emailNorm));
              if (identityDoc.exists()) {
                const idData = identityDoc.data();
                if (idData.teamId === data.teamId && idData.playerId) {
                  await setDoc(doc(db, `users/${user.uid}/shared_teams`, data.teamId), {
                    teamId: data.teamId,
                    teamPath: data.teamPath,
                    teamName: data.teamName || 'Mi Equipo',
                    role: 'player',
                    playerId: idData.playerId,
                    joinedAt: serverTimestamp(),
                  }, { merge: true });

                  localStorage.setItem('mister11_active_mode', 'player');
                  showToast('¡Ya formas parte de este equipo! Cargando tu portal...', 'success');
                  navigate('/player-dashboard');
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('[JoinTeam] Error comprobando jugador existente:', e);
          }
        }

        setStep(3);
      }
    } catch (err) {
      console.error('[JoinTeam] Error verificando código:', err);
      setError('Error al consultar el equipo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      showToast('Sesión iniciada con Google', 'success');
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setError('Completa el correo y la contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (authTab === 'register') {
        if (authPassword.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await registerWithEmail(authEmail.trim(), authPassword, authName.trim(), 'player');
        showToast('Cuenta creada exitosamente', 'success');
      } else {
        await signInWithEmail(authEmail.trim(), authPassword);
        showToast('Bienvenido a Míster11', 'success');
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Debes iniciar sesión primero.');
      return;
    }
    if (!teamData) {
      setError('No se ha seleccionado un equipo válido.');
      return;
    }

    if (requesterRole === 'player') {
      if (!playerName.trim() || !birthDate) {
        setError('Ingresa el nombre del jugador y su fecha de nacimiento.');
        return;
      }
    } else {
      if (!childName.trim() || !childBirthDate) {
        setError('Ingresa el nombre de tu hijo/a y su fecha de nacimiento.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const { teamId, teamPath, teamName } = teamData;
      const requestId = `${teamId}_${user.uid}`;

      const requestPayload = {
        id: requestId,
        teamId,
        teamPath,
        teamName: teamName || 'Mi Equipo',
        requesterRole,
        requesterUid: user.uid,
        requesterEmail: user.email || '',
        requesterName: (requesterRole === 'parent' ? (parentName.trim() || user.displayName || 'Padre/Tutor') : (user.displayName || playerName.trim())),
        ...(requesterRole === 'player' ? {
          playerName: playerName.trim(),
          birthDate,
          position,
          jerseyNumber: jerseyNumber.trim() || 'S/N',
        } : {
          childName: childName.trim(),
          childBirthDate,
          parentName: parentName.trim() || user.displayName || 'Padre/Tutor',
        }),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const teamReqRef = doc(db, `${teamPath}/joinRequests`, requestId);
      await setDoc(teamReqRef, requestPayload);
      const userReqRef = doc(db, `users/${user.uid}/join_requests`, requestId);
      await setDoc(userReqRef, requestPayload);

      localStorage.setItem('mister11_active_mode', 'player');
      try {
        await setDoc(doc(db, 'users', user.uid), { role: requesterRole === 'parent' ? 'parent' : 'player' }, { merge: true });
      } catch (_) {}

      setMyExistingRequest(requestPayload);
      setStep(4);
      showToast('¡Solicitud enviada al entrenador!', 'success');
    } catch (err) {
      console.error('[JoinTeam] Error enviando solicitud:', err);
      setError('Error al enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src="/logo_mister11.png" alt="Míster11" width="120"/>
        </div>

        <div className="login-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', color: '#4CAF7D' }}>
            <Users size={24} />
            <h2 style={{ margin: 0 }}>Portal del Jugador y Familia</h2>
          </div>
          <p className="login-subtitle">
            Únete al equipo para consultar entrenamientos, convocatorias de partidos, asistencia y progreso deportivo.
          </p>

          {error && <div className="login-error">{error}</div>}

          {myExistingRequest && myExistingRequest.status === 'pending' && (
            <div style={{
              background: 'rgba(76, 175, 125, 0.08)',
              border: '1px solid rgba(76, 175, 125, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(76, 175, 125, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#4CAF7D'
              }}>
                <Loader size={26} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
              <h3 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                Solicitud Pendiente de Aprobación
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Has solicitado ingresar a <strong>{myExistingRequest.teamName}</strong> como {myExistingRequest.requesterRole === 'parent' ? `Padre/Tutor de ${myExistingRequest.childName}` : `Jugador (${myExistingRequest.playerName})`}. Tu entrenador revisará la solicitud y te dará acceso muy pronto.
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div>• Tipo: <strong>{myExistingRequest.requesterRole === 'parent' ? '👨👦 Padre / Tutor' : '⚽ Jugador'}</strong></div>
                <div>• Solicitante: <strong>{myExistingRequest.requesterName}</strong></div>
                <div>• Estado: <span style={{ color: '#C9A84C', fontWeight: 'bold' }}>En espera de confirmación del míster</span></div>
              </div>
              <button 
                className="btn-guest" 
                onClick={() => window.location.reload()}
                style={{ width: '100%' }}
              >
                Comprobar Estado
              </button>
            </div>
          )}

          {!user && !myExistingRequest && (
            <div className="join-auth-step">
              <div className="auth-mode-tabs">
                <button type="button" className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Ya tengo cuenta</button>
                <button type="button" className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>Crear cuenta nueva</button>
              </div>

              <button className="btn-google" onClick={handleGoogleAuth} disabled={loading} style={{ marginBottom: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="divider-auth"><span>o con correo electrónico</span></div>

              <form onSubmit={handleEmailAuth} className="email-auth-form">
                {authTab === 'register' && (
                  <div className="input-group-auth">
                    <label>Tu Nombre y Apellidos (Padre / Tutor / Jugador)</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input type="text" placeholder="Ej. Roberto Gómez o Carlos Pérez" value={authName} onChange={(e) => setAuthName(e.target.value)} required />
                    </div>
                  </div>
                )}
                <div className="input-group-auth">
                  <label>Correo Electrónico</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input type="email" placeholder="tucorreo@ejemplo.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group-auth">
                  <label>Contraseña</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input type="password" placeholder="Mínimo 6 caracteres" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-submit-auth" disabled={loading}>
                  {loading ? 'Procesando...' : (authTab === 'register' ? 'Crear Cuenta y Continuar' : 'Iniciar Sesión')}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {user && !myExistingRequest && !teamData && (
            <div className="join-code-step">
              <div className="user-logged-badge">
                <User size={16} color="#4CAF7D" />
                <span>Sesión activa como: <strong>{user.email || user.displayName}</strong></span>
              </div>
              <div className="input-group-auth" style={{ marginTop: '16px' }}>
                <label>Ingresa el Código de Equipo (proporcionado por el entrenador)</label>
                <div className="input-with-icon">
                  <KeyRound size={18} />
                  <input type="text" placeholder="Ej. M11-ABC123" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', fontSize: '16px' }} />
                </div>
              </div>
              <button type="button" className="btn-submit-auth" onClick={() => handleVerifyCode(inputCode)} disabled={loading || !inputCode.trim()}>
                {loading ? 'Buscando equipo...' : 'BUSCAR EQUIPO'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {user && !myExistingRequest && teamData && (
            <form onSubmit={handleSubmitRequest} className="join-player-form">
              <div style={{ background: 'rgba(76, 175, 125, 0.12)', border: '1.5px solid rgba(76, 175, 125, 0.4)', borderRadius: '12px', padding: '14px', marginBottom: '18px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#4CAF7D', fontWeight: 'bold' }}>⚽ Equipo Encontrado</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>{teamData.teamName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Código: <strong style={{ color: '#C9A84C' }}>{inputCode}</strong></div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>¿Quién se une al equipo? *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="button" onClick={() => setRequesterRole('player')} style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', border: requesterRole === 'player' ? '2px solid #4CAF7D' : '1px solid var(--border-color)', background: requesterRole === 'player' ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255, 255, 255, 0.04)', color: requesterRole === 'player' ? '#4CAF7D' : '#CBD5E1', transition: 'all 0.2s ease', touchAction: 'manipulation' }}>⚽ Soy el jugador</button>
                  <button type="button" onClick={() => setRequesterRole('parent')} style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', border: requesterRole === 'parent' ? '2px solid #C9A84C' : '1px solid var(--border-color)', background: requesterRole === 'parent' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255, 255, 255, 0.04)', color: requesterRole === 'parent' ? '#C9A84C' : '#CBD5E1', transition: 'all 0.2s ease', touchAction: 'manipulation' }}>👨 Soy padre / tutor</button>
                </div>
              </div>

              {requesterRole === 'player' ? (
                <>
                  <div className="input-group-auth">
                    <label>Nombre Completo del Jugador *</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder="Ej. Mateo Caicedo" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>Fecha de Nacimiento *</label>
                    <div className="input-with-icon"><Calendar size={18} /><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>Posición Habitual</label>
                    <select value={position} onChange={(e) => setPosition(e.target.value)} style={{ width: '100%', minHeight: '48px', padding: '12px 14px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }}>
                      {POSITIONS.map(pos => <option key={pos} value={pos} style={{ background: '#121814', color: '#ffffff' }}>{pos}</option>)}
                    </select>
                  </div>
                  <div className="input-group-auth" style={{ marginBottom: '18px' }}>
                    <label>Dorsal Preferido (Opcional)</label>
                    <div className="input-with-icon"><Shirt size={18} /><input type="text" placeholder="Ej. 10" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group-auth">
                    <label>Tu Nombre y Apellidos (Padre / Madre / Tutor) *</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder="Ej. Juan Carlos Caicedo" value={parentName || user.displayName || ''} onChange={(e) => setParentName(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>Nombre Completo de tu Hijo / Hija *</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder="Ej. Mateo Caicedo" value={childName} onChange={(e) => setChildName(e.target.value)} required /></div>
                    <small style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>🔒 Por privacidad (RGPD), el entrenador vinculará la ficha al aprobar.</small>
                  </div>
                  <div className="input-group-auth" style={{ marginBottom: '18px' }}>
                    <label>Fecha de Nacimiento de tu Hijo / Hija *</label>
                    <div className="input-with-icon"><Calendar size={18} /><input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)} required /></div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-submit-auth" disabled={submitting}>
                {submitting ? 'Enviando solicitud...' : 'ENVIAR SOLICITUD AL ENTRENADOR'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div className="login-footer">
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>← Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;
