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

  // Formulario Auth rápido si no está logueado
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // Formulario del jugador
  const [playerName, setPlayerName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [position, setPosition] = useState('MC');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-verificar código si viene por URL
  useEffect(() => {
    if (codeParam) {
      handleVerifyCode(codeParam);
    }
  }, [codeParam]);

  // Escuchar si el usuario ya tiene solicitudes pendientes
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
          navigate('/');
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
        setError('Código de equipo no encontrado. Verifica que esté bien escrito o solicita el código actualizado a tu entrenador.');
        setTeamData(null);
      } else {
        setTeamData(data);
        setInputCode(code);

        // Comprobación de identidad server-side por email determinista
        if (user && user.uid !== 'invitado-local') {
          const emailNorm = normalizeEmail(user.email);
          try {
            // 1. Consultar índice determinista global
            if (emailNorm) {
              const identityDoc = await getDoc(doc(db, 'playerIdentityByEmail', emailNorm));
              if (identityDoc.exists()) {
                const idData = identityDoc.data();
                if (idData.teamId === data.teamId && idData.playerId) {
                  // Ya tiene ficha en este equipo -> asociar shared_teams y entrar al portal
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

            // 2. Fallback: consultar plantilla de este equipo
            const playersColRef = collection(db, `${data.teamPath}/players`);
            const pSnap = await getDocs(playersColRef);
            const existingPlayer = pSnap.docs.find(d => {
              const pData = d.data();
              const pEmailNorm = normalizeEmail(pData.email);
              return pData.requesterUid === user.uid ||
                     pData.playerUid === user.uid ||
                     pData.userId === user.uid ||
                     pData.uid === user.uid ||
                     (emailNorm && pEmailNorm && pEmailNorm === emailNorm) ||
                     pData.linkedParents?.includes(user.uid);
            });

            if (existingPlayer) {
              // Ya existe en la plantilla -> Vincular puntero e índice determinista
              const userSharedTeamRef = doc(db, `users/${user.uid}/shared_teams`, data.teamId);
              await setDoc(userSharedTeamRef, {
                teamId: data.teamId,
                teamPath: data.teamPath,
                teamName: data.teamName || 'Mi Equipo',
                role: 'player',
                playerId: existingPlayer.id,
                joinedAt: serverTimestamp(),
              }, { merge: true });

              if (emailNorm) {
                try {
                  await setDoc(doc(db, 'playerIdentityByEmail', emailNorm), {
                    uid: user.uid,
                    playerId: existingPlayer.id,
                    teamId: data.teamId,
                    teamPath: data.teamPath,
                    createdAt: serverTimestamp(),
                  }, { merge: true });
                } catch (_) {}
              }

              localStorage.setItem('mister11_active_mode', 'player');
              try {
                await setDoc(doc(db, 'users', user.uid), { role: 'player' }, { merge: true });
              } catch (_) {}

              showToast(`¡Ya formas parte de este equipo como ${existingPlayer.data().name}!`, 'success');
              navigate('/player-dashboard');
              return;
            }
          } catch (e) {
            console.warn('[JoinTeam] Error comprobando jugador existente:', e);
          }
        }

        setStep(3); // Avanzar a datos del jugador solo si no existe
      }
    } catch (err) {
      console.error('[JoinTeam] Error verificando código:', err);
      setError('Error al consultar el equipo. Verifica tu conexión.');
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
      setError(err?.message || 'Error al iniciar sesión con Google.');
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
      console.error('[JoinTeam] Error Auth:', err);
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlayerRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Debes iniciar sesión primero para enviar la solicitud.');
      return;
    }
    if (!teamData) {
      setError('No se ha seleccionado un equipo válido.');
      return;
    }
    if (!playerName.trim() || !birthDate) {
      setError('Ingresa el nombre del jugador y su fecha de nacimiento.');
      return;
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
        playerName: playerName.trim(),
        birthDate,
        position,
        jerseyNumber: jerseyNumber.trim() || 'S/N',
        requesterUid: user.uid,
        requesterEmail: user.email || '',
        requesterName: user.displayName || playerName.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // 1. Guardar en subcolección del equipo
      const teamReqRef = doc(db, `${teamPath}/joinRequests`, requestId);
      await setDoc(teamReqRef, requestPayload);

      // 2. Guardar en el perfil del usuario para seguimiento
      const userReqRef = doc(db, `users/${user.uid}/join_requests`, requestId);
      await setDoc(userReqRef, requestPayload);

      // 3. Activar Modo Jugador permanentemente
      localStorage.setItem('mister11_active_mode', 'player');
      try {
        await setDoc(doc(db, 'users', user.uid), { role: 'player' }, { merge: true });
      } catch (_) {}

      setMyExistingRequest(requestPayload);
      setStep(4);
      showToast('¡Solicitud enviada al entrenador!', 'success');
    } catch (err) {
      console.error('[JoinTeam] Error enviando solicitud:', err);
      setError('Error al enviar la solicitud: ' + (err.message || 'Error desconocido'));
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', color: '#10B981' }}>
            <Users size={24} />
            <h2 style={{ margin: 0 }}>Portal del Jugador</h2>
          </div>
          <p className="login-subtitle">
            Únete al equipo de tu entrenador para consultar tus entrenamientos, partidos, asistencia y estadísticas.
          </p>

          {error && <div className="login-error">{error}</div>}

          {/* ESTADO: SOLICITUD YA ENVIADA (PENDIENTE DE APROBACIÓN) */}
          {myExistingRequest && myExistingRequest.status === 'pending' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#10B981'
              }}>
                <Loader size={26} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
              <h3 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                Solicitud Pendiente de Aprobación
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Has solicitado ingresar a <strong>{myExistingRequest.teamName}</strong> para el jugador <strong>{myExistingRequest.playerName}</strong>. Tu entrenador revisará la solicitud y te dará acceso muy pronto.
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
                <div>• Posición: <strong>{myExistingRequest.position}</strong></div>
                <div>• Dorsal: <strong>{myExistingRequest.jerseyNumber}</strong></div>
                <div>• Estado: <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>En espera del entrenador</span></div>
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

          {/* PASO 1: NO AUTENTICADO -> INICIAR SESIÓN O REGISTRO */}
          {!user && !myExistingRequest && (
            <div className="join-auth-step">
              <div className="auth-mode-tabs">
                <button
                  type="button"
                  className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthTab('login')}
                >
                  Ya tengo cuenta
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthTab('register')}
                >
                  Crear cuenta nueva
                </button>
              </div>

              <button 
                className="btn-google" 
                onClick={handleGoogleAuth}
                disabled={loading}
                style={{ marginBottom: '14px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="divider-auth">
                <span>o con correo electrónico</span>
              </div>

              <form onSubmit={handleEmailAuth} className="email-auth-form">
                {authTab === 'register' && (
                  <div className="input-group-auth">
                    <label>Tu Nombre y Apellidos (Padre / Tutor / Jugador)</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        placeholder="Ej. Juan Pérez"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="input-group-auth">
                  <label>Correo Electrónico</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      placeholder="padre@email.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group-auth">
                  <label>Contraseña</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit-auth" disabled={loading}>
                  {loading ? 'Procesando...' : (authTab === 'register' ? 'CREAR CUENTA Y CONTINUAR' : 'INICIAR SESIÓN Y CONTINUAR')}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* PASO 2: LOGUEADO -> INTRODUCIR O VALIDAR CÓDIGO */}
          {user && !myExistingRequest && !teamData && (
            <div className="join-code-step">
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '13px',
                textAlign: 'left'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Sesión activa:</span>{' '}
                <strong style={{ color: '#ffffff' }}>{user.displayName || user.email}</strong>
              </div>

              <div className="input-group-auth" style={{ marginBottom: '16px' }}>
                <label>Código del Equipo</label>
                <div className="input-with-icon">
                  <KeyRound size={18} />
                  <input 
                    type="text" 
                    placeholder="M11-XXXXXX"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', fontSize: '16px' }}
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="btn-submit-auth"
                onClick={() => handleVerifyCode(inputCode)}
                disabled={loading || !inputCode.trim()}
              >
                {loading ? 'Buscando equipo...' : 'BUSCAR EQUIPO'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* PASO 3: EQUIPO ENCONTRADO -> COMPLETAR DATOS DEL JUGADOR */}
          {user && !myExistingRequest && teamData && (
            <form onSubmit={handleSubmitPlayerRequest} className="join-player-form">
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10B981', fontWeight: 'bold' }}>
                  ⚽ Equipo Encontrado
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                  {teamData.teamName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Código: <strong style={{ color: '#ffffff' }}>{inputCode}</strong>
                </div>
              </div>

              <div className="input-group-auth">
                <label>Nombre Completo del Jugador / Jugadora *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input 
                    type="text" 
                    placeholder="Ej. Mateo Caicedo"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group-auth">
                <label>Fecha de Nacimiento *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input 
                    type="date" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group-auth">
                <label>Posición Habitual</label>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    borderRadius: '8px',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos} style={{ background: '#121814', color: '#ffffff' }}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group-auth" style={{ marginBottom: '18px' }}>
                <label>Dorsal Preferido (Opcional)</label>
                <div className="input-with-icon">
                  <Shirt size={18} />
                  <input 
                    type="text" 
                    placeholder="Ej. 10"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-submit-auth"
                disabled={submitting}
              >
                {submitting ? 'Enviando solicitud...' : 'ENVIAR SOLICITUD AL ENTRENADOR'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setTeamData(null)}
                style={{
                  marginTop: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Elegir otro código de equipo
              </button>
            </form>
          )}

          <div className="login-footer">
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;
