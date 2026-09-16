import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db, signInWithGoogle, signInWithEmail, registerWithEmail } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { getTeamByCode } from '../utils/teamCode';
import { searchTeamByCode, validateTeamCode } from '../utils/teamCodeManager';
import { showToast } from '../utils/toast';
import { Shield, CheckCircle, AlertCircle, Users, ArrowRight, Loader, KeyRound, Mail, Lock, User, Calendar, Shirt, QrCode, MessageCircle, ExternalLink } from 'lucide-react';
import './Login.css';

const POSITIONS = ['POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

import { normalizeEmail } from '../utils/normalizeEmail';
import { getPlayerIdentitiesByEmail } from '../utils/playerIdentity';
import { calcularEdad } from '../utils/calcularEdad';

const JoinTeam = () => {
  const { t, isEn } = useTranslation();
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
  const [isStaffCodeDetected, setIsStaffCodeDetected] = useState(false);
  const [isRealtimeSearching, setIsRealtimeSearching] = useState(false);

  // Validación debounce en tiempo real (300ms)
  useEffect(() => {
    if (!inputCode) {
      setIsStaffCodeDetected(false);
      setError('');
      return;
    }
    const clean = inputCode.trim().replace(/^M11-/, '').toUpperCase();
    if (clean.length === 6 || inputCode.toUpperCase().startsWith('STAFF-')) {
      const timer = setTimeout(async () => {
        setIsRealtimeSearching(true);
        const res = await searchTeamByCode(inputCode);
        setIsRealtimeSearching(false);
        if (res.found) {
          setError('');
          setIsStaffCodeDetected(false);
        } else if (res.isStaffCode) {
          setIsStaffCodeDetected(true);
          setError('is_staff_code');
        } else {
          setIsStaffCodeDetected(false);
          setError(res.error || 'not_found');
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsStaffCodeDetected(false);
      if (clean.length > 0 && clean.length < 6) {
        setError('length');
      } else {
        setError('');
      }
    }
  }, [inputCode]);

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
  const [tutorEmail, setTutorEmail] = useState('');
  const [tutorConfirmed, setTutorConfirmed] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleResize = () => {
      const active = document.activeElement;
      if (active && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(active.tagName)) {
        setTimeout(() => {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }, []);

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
          showToast(t('joinTeam.request_approved'), 'success');
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
      setError('format');
      return;
    }

    setLoading(true);
    setError('');
    setIsStaffCodeDetected(false);
    try {
      const res = await searchTeamByCode(code);
      if (res.isStaffCode) {
        setIsStaffCodeDetected(true);
        setError('is_staff_code');
        setTeamData(null);
      } else if (!res.found || !res.team) {
        setError(res.error || 'not_found');
        setTeamData(null);
      } else {
        const data = res.team;
        setTeamData(data);
        setInputCode(code);

        if (user && user.uid !== 'invitado-local' && user.email) {
          try {
            const identities = await getPlayerIdentitiesByEmail(user.email);
            const matchingId = identities.find(i => i.teamId === data.teamId && i.playerId);
            if (matchingId) {
              await setDoc(doc(db, `users/${user.uid}/shared_teams`, data.teamId), {
                teamId: data.teamId,
                teamPath: data.teamPath,
                teamName: data.teamName || 'Mi Equipo',
                role: matchingId.role || 'player',
                playerId: matchingId.playerId,
                joinedAt: serverTimestamp(),
              }, { merge: true });

              localStorage.setItem('mister11_active_mode', 'player');
              localStorage.setItem(`lastPlayerTeam_${user.uid}`, data.teamId);
              showToast(t('joinTeam.already_member') || 'Ya eres miembro de este equipo', 'success');
              navigate('/player-dashboard');
              return;
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
      showToast(t('joinTeam.google_sign_in'), 'success');
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
        showToast(t('joinTeam.account_created'), 'success');
      } else {
        await signInWithEmail(authEmail.trim(), authPassword);
        showToast(t('joinTeam.welcome'), 'success');
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
      // DEF-M01-01: Paso 2 del registro de menor bloqueado hasta email de tutor confirmado
      const calcAge = calcularEdad(birthDate);
      if (calcAge.years < 14) {
        if (!tutorEmail.trim() || !tutorConfirmed) {
          setError(isEn
            ? 'RGPD / LOPDGDD: Players under 14 require a verified parent/guardian email before activation.'
            : 'RGPD / LOPDGDD: Los menores de 14 años requieren el correo de su tutor confirmado antes de la activación.');
          return;
        }
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
          tutorEmail: calcularEdad(birthDate).years < 14 ? tutorEmail.trim() : null,
          tutorConfirmed: calcularEdad(birthDate).years < 14 ? tutorConfirmed : null,
          isMinor: calcularEdad(birthDate).years < 14,
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
      showToast(t('joinTeam.request_sent'), 'success');
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
            <h2 style={{ margin: 0 }}>{isEn ? 'Join Your Team' : 'Únete a tu Equipo'}</h2>
          </div>
          <p className="login-subtitle">
            {isEn 
              ? 'Join your team to view training sessions, match call-ups, attendance, and progress.' 
              : 'Únete al equipo para consultar entrenamientos, convocatorias de partidos, asistencia y progreso deportivo.'}
          </p>

          {error && error !== 'length' && error !== 'not_found' && error !== 'is_staff_code' && error !== 'expired' && error !== 'already_used' && (
            <div className="login-error">{error}</div>
          )}

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
                {isEn ? 'Request Pending Approval' : 'Solicitud Pendiente de Aprobación'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {isEn ? (
                  <>You have requested to join <strong>{myExistingRequest.teamName}</strong> as {myExistingRequest.requesterRole === 'parent' ? `Parent/Guardian of ${myExistingRequest.childName}` : `Player (${myExistingRequest.playerName})`}. Your coach will review your request and grant access soon.</>
                ) : (
                  <>Has solicitado ingresar a <strong>{myExistingRequest.teamName}</strong> como {myExistingRequest.requesterRole === 'parent' ? `Padre/Tutor de ${myExistingRequest.childName}` : `Jugador (${myExistingRequest.playerName})`}. Tu entrenador revisará la solicitud y te dará acceso muy pronto.</>
                )}
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
                <div>• {isEn ? 'Type:' : 'Tipo:'} <strong>{myExistingRequest.requesterRole === 'parent' ? (isEn ? '👨👦 Parent / Guardian' : '👨👦 Padre / Tutor') : (isEn ? '⚽ Player' : '⚽ Jugador')}</strong></div>
                <div>• {isEn ? 'Requester:' : 'Solicitante:'} <strong>{myExistingRequest.requesterName}</strong></div>
                <div>• {isEn ? 'Status:' : 'Estado:'} <span style={{ color: '#C9A84C', fontWeight: 'bold' }}>{isEn ? 'Awaiting coach confirmation' : 'En espera de confirmación del míster'}</span></div>
              </div>
              <button 
                className="btn-guest" 
                onClick={() => window.location.reload()}
                style={{ width: '100%' }}
              >
                {isEn ? 'Check Status' : 'Comprobar Estado'}
              </button>
            </div>
          )}

          {!user && !myExistingRequest && (
            <div className="join-auth-step">
              <div className="auth-mode-tabs">
                <button type="button" className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>{isEn ? 'I already have an account' : 'Ya tengo cuenta'}</button>
                <button type="button" className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>{isEn ? 'Create new account' : 'Crear cuenta nueva'}</button>
              </div>

              <button className="btn-google" onClick={handleGoogleAuth} disabled={loading} style={{ marginBottom: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {isEn ? 'Continue with Google' : 'Continuar con Google'}
              </button>

              <div className="divider-auth"><span>{isEn ? 'or with email' : 'o con correo electrónico'}</span></div>

              <form onSubmit={handleEmailAuth} className="email-auth-form">
                {authTab === 'register' && (
                  <div className="input-group-auth">
                    <label>{isEn ? 'Your Full Name (Parent / Guardian / Player)' : 'Tu Nombre y Apellidos (Padre / Tutor / Jugador)'}</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input type="text" placeholder={isEn ? 'e.g. Robert Smith or John Doe' : 'Ej. Roberto Gómez o Carlos Pérez'} value={authName} onChange={(e) => setAuthName(e.target.value)} required />
                    </div>
                  </div>
                )}
                <div className="input-group-auth">
                  <label>{isEn ? 'Email Address' : 'Correo Electrónico'}</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input type="email" placeholder={isEn ? "youremail@example.com" : "tucorreo@ejemplo.com"} value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group-auth">
                  <label>{isEn ? 'Password' : 'Contraseña'}</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input type="password" placeholder={isEn ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-submit-auth" disabled={loading}>
                  {loading ? (isEn ? 'Processing...' : 'Procesando...') : (authTab === 'register' ? (isEn ? 'Create Account and Continue' : 'Crear Cuenta y Continuar') : (isEn ? 'Sign In' : 'Iniciar Sesión'))}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {user && !myExistingRequest && !teamData && (
            <div className="join-code-step">
              <div className="user-logged-badge">
                <User size={16} color="#4CAF7D" />
                <span>{isEn ? 'Logged in as: ' : 'Sesión activa como: '}<strong>{user.email || user.displayName}</strong></span>
              </div>

              <div className="input-group-auth" style={{ marginTop: '16px' }}>
                <label>{isEn ? 'Enter Team Code (provided by your coach)' : 'Ingresa el Código de Equipo (proporcionado por el entrenador)'}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="input-with-icon" style={{ flex: 1 }}>
                    <KeyRound size={18} />
                    <input 
                      type="text" 
                      placeholder={isEn ? 'e.g. M11-ABC123' : 'Ej. M11-ABC123'} 
                      value={inputCode} 
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())} 
                      style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', fontSize: '16px' }} 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/invite-coach')}
                    title={isEn ? 'Scan QR' : 'Escanear QR'}
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(76, 175, 125, 0.4)',
                      background: 'rgba(76, 175, 125, 0.1)',
                      color: '#4CAF7D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <QrCode size={22} />
                  </button>
                </div>
              </div>

              {/* Real-time Status Banner */}
              {isRealtimeSearching && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4CAF7D', fontSize: '12px', margin: '8px 0' }}>
                  <Loader size={14} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span>{isEn ? 'Searching team in real time...' : 'Buscando equipo en tiempo real...'}</span>
                </div>
              )}

              {isStaffCodeDetected && (
                <div style={{
                  background: 'rgba(212, 168, 67, 0.12)',
                  border: '1px solid #D4A843',
                  borderRadius: '10px',
                  padding: '12px',
                  margin: '10px 0',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D4A843', fontWeight: 'bold', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>{isEn ? 'Staff Invite Code Detected' : 'Código de Cuerpo Técnico Detectado'}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '6px 0 8px 0', lineHeight: '1.4' }}>
                    {isEn 
                      ? 'This code is for Coaches, Fitness Trainers, or Staff members to join a team.' 
                      : 'Este código es para Entrenadores, Preparadores o Staff que se unen al cuerpo técnico.'}
                  </p>
                  <Link
                    to={`/join-staff?code=${inputCode}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#1B3A2D',
                      color: '#4CAF7D',
                      border: '1px solid #4CAF7D',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textDecoration: 'none'
                    }}
                  >
                    <Users size={14} />
                    {isEn ? 'Join as Staff Member →' : 'Unirme como Entrenador / Staff →'}
                  </Link>
                </div>
              )}

              {error === 'length' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '12px', margin: '8px 0' }}>
                  <AlertCircle size={14} />
                  <span>{isEn ? 'The team code must have 6 alphanumeric characters.' : 'El código de equipo debe tener 6 caracteres.'}</span>
                </div>
              )}

              {error === 'not_found' && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '12px',
                  margin: '10px 0',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 'bold', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>{isEn ? 'Team not found' : 'Equipo no encontrado'}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                    {isEn 
                      ? 'Verify the code with your coach or choose one of the alternative options below.' 
                      : 'Verifica el código o contacta a tu entrenador. También puedes usar las alternativas siguientes.'}
                  </p>
                </div>
              )}

              {error === 'already_used' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '12px', margin: '8px 0' }}>
                  <AlertCircle size={14} />
                  <span>{isEn ? 'This code has already been used.' : 'Este código ya fue utilizado.'}</span>
                </div>
              )}

              {error === 'expired' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '12px', margin: '8px 0' }}>
                  <AlertCircle size={14} />
                  <span>{isEn ? 'This invitation has expired.' : 'Esta invitación ha expirado.'}</span>
                </div>
              )}

              <button 
                type="button" 
                className="btn-submit-auth" 
                onClick={() => handleVerifyCode(inputCode)} 
                disabled={loading || isRealtimeSearching || inputCode.trim().replace(/^M11-/, '').length < 6}
                style={{ marginTop: '8px' }}
              >
                {loading ? (isEn ? 'Searching team...' : 'Buscando equipo...') : (isEn ? 'SEARCH TEAM' : 'BUSCAR EQUIPO')}
                <ArrowRight size={18} />
              </button>

              {/* Alternative Options Section */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px' }}>
                  {isEn ? 'Don\'t have a code or having issues?' : '¿No tienes código o tienes problemas?'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href="https://wa.me/?text=Hola%20M%C3%ADster%2C%20necesito%20el%20c%C3%B3digo%20de%206%20caracteres%20de%20M%C3%ADster11%20para%20unirme%20al%20equipo."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      textDecoration: 'none',
                      minHeight: '48px'
                    }}
                  >
                    <MessageCircle size={16} color="#4CAF7D" />
                    <span>{isEn ? 'Request code from coach via WhatsApp' : 'Solicitar código al entrenador por WhatsApp'}</span>
                  </a>

                  <Link
                    to="/invite-coach"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      textDecoration: 'none',
                      minHeight: '48px'
                    }}
                  >
                    <QrCode size={16} color="#D4A843" />
                    <span>{isEn ? 'Scan invitation QR Code' : 'Escanear QR de invitación'}</span>
                  </Link>

                  <Link
                    to="/register?role=coach"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#CBD5E1',
                      fontSize: '12px',
                      textDecoration: 'none',
                      minHeight: '48px'
                    }}
                  >
                    <User size={16} color="#4CAF7D" />
                    <span>{isEn ? 'I am a Coach: Create my own team' : 'Soy Entrenador: Crear mi propio equipo'}</span>
                  </Link>

                  <Link
                    to="/join-staff"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(212, 168, 67, 0.06)',
                      border: '1px solid rgba(212, 168, 67, 0.2)',
                      color: '#D4A843',
                      fontSize: '12px',
                      textDecoration: 'none',
                      minHeight: '48px'
                    }}
                  >
                    <Users size={16} color="#D4A843" />
                    <span>{isEn ? 'Invited Coach/Staff: Join Technical Staff here' : '¿Entrenador invitado? Únete al Cuerpo Técnico aquí'}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {user && !myExistingRequest && teamData && (
            <form onSubmit={handleSubmitRequest} className="join-player-form">
              <div style={{ background: 'rgba(76, 175, 125, 0.12)', border: '1.5px solid rgba(76, 175, 125, 0.4)', borderRadius: '12px', padding: '14px', marginBottom: '18px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#4CAF7D', fontWeight: 'bold' }}>⚽ {isEn ? 'Team Found' : 'Equipo Encontrado'}</div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>{teamData.teamName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{isEn ? 'Code: ' : 'Código: '}<strong style={{ color: '#C9A84C' }}>{inputCode}</strong></div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>{isEn ? 'Who is joining the team? *' : '¿Quién se une al equipo? *'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="button" onClick={() => setRequesterRole('player')} style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', border: requesterRole === 'player' ? '2px solid #4CAF7D' : '1px solid var(--border-color)', background: requesterRole === 'player' ? 'rgba(76, 175, 125, 0.2)' : 'rgba(255, 255, 255, 0.04)', color: requesterRole === 'player' ? '#4CAF7D' : '#CBD5E1', transition: 'all 0.2s ease', touchAction: 'manipulation' }}>⚽ {isEn ? "I'm the player" : 'Soy el jugador'}</button>
                  <button type="button" onClick={() => setRequesterRole('parent')} style={{ minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', border: requesterRole === 'parent' ? '2px solid #C9A84C' : '1px solid var(--border-color)', background: requesterRole === 'parent' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255, 255, 255, 0.04)', color: requesterRole === 'parent' ? '#C9A84C' : '#CBD5E1', transition: 'all 0.2s ease', touchAction: 'manipulation' }}>👨 {isEn ? "I'm a parent / guardian" : 'Soy padre / tutor'}</button>
                </div>
              </div>

              {requesterRole === 'player' ? (
                <>
                  <div className="input-group-auth">
                    <label>{isEn ? 'Player Full Name *' : 'Nombre Completo del Jugador *'}</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder={isEn ? 'e.g. Mateo Johnson' : 'Ej. Mateo Caicedo'} value={playerName} onChange={(e) => setPlayerName(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>{isEn ? 'Date of Birth *' : 'Fecha de Nacimiento *'}</label>
                    <div className="input-with-icon"><Calendar size={18} /><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>{isEn ? 'Primary Position' : 'Posición Habitual'}</label>
                    <select value={position} onChange={(e) => setPosition(e.target.value)} style={{ width: '100%', minHeight: '48px', padding: '12px 14px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }}>
                      {POSITIONS.map(pos => <option key={pos} value={pos} style={{ background: '#121814', color: '#ffffff' }}>{pos}</option>)}
                    </select>
                  </div>
                  <div className="input-group-auth" style={{ marginBottom: '18px' }}>
                    <label>{isEn ? 'Preferred Jersey Number (Optional)' : 'Dorsal Preferido (Opcional)'}</label>
                    <div className="input-with-icon"><Shirt size={18} /><input type="text" placeholder={isEn ? 'e.g. 10' : 'Ej. 10'} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} /></div>
                  </div>

                  {birthDate && calcularEdad(birthDate).years < 14 && (
                    <div className="minor-protection-card" style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1.5px solid #EF4444',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                        <span>🔒</span>
                        <span>{isEn ? 'Minor Protection (<14 years old - RGPD / LOPDGDD)' : 'Protección de Menores (<14 años - RGPD / LOPDGDD)'}</span>
                      </div>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#CBD5E1', lineHeight: '1.45' }}>
                        {isEn
                          ? 'Per data protection regulations, players under 14 require legal guardian authorization. You can save your draft, but full activation is locked until your guardian email is confirmed.'
                          : 'Conforme a la normativa RGPD/LOPDGDD, los menores de 14 años requieren autorización del tutor legal. Puedes guardar un borrador, pero la activación está bloqueada hasta confirmar el email de tu tutor/a.'}
                      </p>
                      <div className="input-group-auth" style={{ marginBottom: '12px' }}>
                        <label>{isEn ? 'Parent / Guardian Email *' : 'Email del Padre / Madre / Tutor *'}</label>
                        <div className="input-with-icon">
                          <Mail size={18} />
                          <input
                            type="email"
                            placeholder={isEn ? "guardian@email.com" : "tutor@email.com"}
                            value={tutorEmail}
                            onChange={(e) => setTutorEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#CBD5E1' }}>
                        <input
                          type="checkbox"
                          checked={tutorConfirmed}
                          onChange={(e) => setTutorConfirmed(e.target.checked)}
                          style={{ marginTop: '2px', width: '16px', height: '16px' }}
                        />
                        <span>{isEn ? 'I confirm this is my legal guardian email and consent is requested. *' : 'Confirmo que este es el email de mi tutor/a legal y autoriza esta solicitud. *'}</span>
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="input-group-auth">
                    <label>{isEn ? 'Your Full Name (Parent / Guardian) *' : 'Tu Nombre y Apellidos (Padre / Madre / Tutor) *'}</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder={isEn ? 'e.g. John Johnson' : 'Ej. Juan Carlos Caicedo'} value={parentName || user.displayName || ''} onChange={(e) => setParentName(e.target.value)} required /></div>
                  </div>
                  <div className="input-group-auth">
                    <label>{isEn ? "Child's Full Name *" : 'Nombre Completo de tu Hijo / Hija *'}</label>
                    <div className="input-with-icon"><User size={18} /><input type="text" placeholder={isEn ? 'e.g. Mateo Johnson' : 'Ej. Mateo Caicedo'} value={childName} onChange={(e) => setChildName(e.target.value)} required /></div>
                    <small style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>{isEn ? '🔒 For privacy (GDPR), the coach will link the profile upon approval.' : '🔒 Por privacidad (RGPD), el entrenador vinculará la ficha al aprobar.'}</small>
                  </div>
                  <div className="input-group-auth" style={{ marginBottom: '18px' }}>
                    <label>{isEn ? "Child's Date of Birth *" : 'Fecha de Nacimiento de tu Hijo / Hija *'}</label>
                    <div className="input-with-icon"><Calendar size={18} /><input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)} required /></div>
                  </div>
                </>
              )}

              {requesterRole === 'player' && birthDate && calcularEdad(birthDate).years < 14 && (!tutorEmail.trim() || !tutorConfirmed) && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: '100%', minHeight: '48px', marginBottom: '10px', borderColor: '#C9A84C', color: '#C9A84C', fontWeight: 800 }}
                  onClick={() => {
                    localStorage.setItem('mister11_join_draft', JSON.stringify({ playerName, birthDate, position, jerseyNumber, tutorEmail }));
                    setIsDraftSaved(true);
                    showToast(isEn ? 'Draft saved. Activation requires guardian email confirmation.' : 'Borrador guardado. La activación requiere confirmar el email del tutor.', 'info');
                  }}
                >
                  💾 {isDraftSaved ? (isEn ? 'Draft Saved ✓' : 'Borrador Guardado ✓') : (isEn ? 'Save Draft (Activation Locked)' : 'Guardar Borrador (Activación Bloqueada)')}
                </button>
              )}

              <button
                type="submit"
                className="btn-submit-auth"
                disabled={submitting || (requesterRole === 'player' && birthDate && calcularEdad(birthDate).years < 14 && (!tutorEmail.trim() || !tutorConfirmed))}
                style={(requesterRole === 'player' && birthDate && calcularEdad(birthDate).years < 14 && (!tutorEmail.trim() || !tutorConfirmed)) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {submitting
                  ? (isEn ? 'Sending request...' : 'Enviando solicitud...')
                  : (requesterRole === 'player' && birthDate && calcularEdad(birthDate).years < 14 && (!tutorEmail.trim() || !tutorConfirmed))
                    ? (isEn ? '🔒 ACTIVATION BLOCKED (GUARDIAN REQUIRED)' : '🔒 ACTIVACIÓN BLOQUEADA (TUTOR OBLIGATORIO)')
                    : (isEn ? 'SUBMIT REQUEST TO COACH' : 'ENVIAR SOLICITUD AL ENTRENADOR')}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div className="login-footer">
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{isEn ? '← Back to login' : '← Volver al inicio de sesión'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;
