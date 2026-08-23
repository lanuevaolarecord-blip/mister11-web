import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import { showToast } from '../utils/toast';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, UserPlus, LogIn, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [authMode, setAuthMode] = useState('google'); // 'google' | 'email_login' | 'email_register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('coach'); // 'coach' | 'player'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { deferredPrompt, isInstalled, installApp } = usePWA();
  const { loginAsGuest } = useAuth();
  
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('[Login] Iniciando flujo Google Sign-In...');
      await signInWithGoogle();
    } catch (err) {
      console.error('=== ERROR GOOGLE SIGN-IN ===', err);
      const isCanceled = err?.message?.toLowerCase().includes('cancel') || err?.code === 'auth/popup-closed-by-user';
      if (isCanceled) {
        showToast('Inicio de sesión cancelado por el usuario', 'info');
        return;
      }

      const errorMessage = err?.code === 'auth/invalid-credential' 
        ? 'Credenciales inválidas. Verifica tu cuenta.'
        : err?.code === 'auth/network-request-failed'
        ? 'Error de red. Verifica tu conexión.'
        : err?.code === 'auth/unauthorized-domain'
        ? 'Dominio no autorizado en Firebase Console.'
        : err?.message || 'Error al iniciar sesión con Google';

      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (authMode === 'email_register') {
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setIsLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, displayName.trim(), selectedRole);
        showToast('¡Cuenta creada exitosamente!', 'success');
      } else {
        await signInWithEmail(email.trim(), password);
        showToast('¡Bienvenido a Míster11!', 'success');
      }
    } catch (err) {
      console.error('[Login] Error Email Auth:', err);
      let msg = 'Error en la autenticación';
      if (err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado. Intenta iniciar sesión.';
      else if (err.code === 'auth/invalid-email') msg = 'El formato del correo es inválido.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña es muy débil (mínimo 6 caracteres).';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Escribe tu correo electrónico para enviarte el enlace de recuperación.');
      showToast('Escribe tu correo primero', 'info');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      showToast('Enlace de recuperación enviado a tu correo', 'success');
    } catch (err) {
      console.error('[Login] Error reset password:', err);
      setError('No se pudo enviar el correo de recuperación. Verifica el email.');
      showToast('Error al enviar correo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginAsGuest();
    } catch (err) {
      console.error('Error signing in as guest', err);
      setError(`Error Invitado: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src="/logo_mister11.png" alt="Míster11" width="120"/>
        </div>
        
        <div className="login-card">
          {selectedPlan && (
            <div className="login-plan-banner">
              ⭐ Estás a un paso de activar tu plan {selectedPlan.toUpperCase()} de Míster11. Inicia sesión o crea una cuenta para continuar.
            </div>
          )}
          <h2>Bienvenido al banquillo</h2>
          <p className="login-subtitle">
            {authMode === 'email_register'
              ? 'Crea tu cuenta como entrenador, padre/tutor o jugador.'
              : 'Inicia sesión para gestionar tu equipo o acceder al Portal del Jugador.'}
          </p>

          <div className="auth-mode-tabs">
            <button 
              type="button"
              className={`auth-tab-btn ${authMode === 'google' ? 'active' : ''}`}
              onClick={() => { setAuthMode('google'); setError(''); }}
            >
              Google
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${authMode === 'email_login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('email_login'); setError(''); }}
            >
              <LogIn size={15} /> Entrar
            </button>
            <button 
              type="button"
              className={`auth-tab-btn ${authMode === 'email_register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('email_register'); setError(''); }}
            >
              <UserPlus size={15} /> Registro
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}
          {resetSent && (
            <div className="login-success-banner">
              ✉️ Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.
            </div>
          )}

          {authMode === 'google' && (
            <div className="auth-google-section">
              <button 
                className="btn-google" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Conectando con Google...' : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>
            </div>
          )}

          {(authMode === 'email_login' || authMode === 'email_register') && (
            <form onSubmit={handleEmailSubmit} className="email-auth-form">
              {authMode === 'email_register' && (
                <>
                  <div className="input-group-auth">
                    <label>Nombre y Apellidos</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        placeholder="Ej. Carlos Martínez"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group-auth">
                    <label>Tipo de Cuenta</label>
                    <div className="role-selector-pills">
                      <button
                        type="button"
                        className={`role-pill ${selectedRole === 'coach' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('coach')}
                      >
                        ⚽ Entrenador / Staff
                      </button>
                      <button
                        type="button"
                        className={`role-pill ${selectedRole === 'player' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('player')}
                      >
                        🏃 Jugador / Padre
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="input-group-auth">
                <label>Correo Electrónico</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group-auth">
                <label>Contraseña</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={authMode === 'email_register' ? 'new-password' : 'current-password'}
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {authMode === 'email_login' && (
                <div className="forgot-password-link">
                  <button type="button" onClick={handleForgotPassword}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-submit-auth"
                disabled={isLoading}
              >
                {isLoading 
                  ? 'Procesando...' 
                  : (authMode === 'email_register' ? 'CREAR CUENTA' : 'INICIAR SESIÓN')}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div className="player-code-callout">
            <Users size={18} />
            <span>¿Tienes un código de equipo?</span>
            <Link to="/join-team" className="player-code-link">
              Unirme a un equipo <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divider-auth">
            <span>o también</span>
          </div>

          <button
            className="btn-guest"
            onClick={handleGuestLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando como Invitado...' : 'Entrar Modo Invitado/Prueba'}
          </button>

          {deferredPrompt && !isInstalled && (
            <button 
              className="btn-primary outline" 
              onClick={installApp}
              style={{ marginTop: '15px', width: '100%', minHeight: '48px' }}
            >
              📲 Instalar Míster11 en Inicio
            </button>
          )}

          <div className="login-footer">
            <p>
              Al iniciar sesión, aceptas nuestros{' '}
              <a href="/legal/terminos.html" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>{' '}
              y nuestra{' '}
              <a href="/legal/privacidad.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.
            </p>
            <p style={{ marginTop: '10px' }}>
              📄{' '}
              <a href="/legal/modelo-consentimiento-mister11.pdf" target="_blank" rel="noopener noreferrer">Modelo de consentimiento para padres</a>{' '}
              (descargar e imprimir)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
