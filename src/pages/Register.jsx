import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { registerWithEmail, signInWithGoogle } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { useTranslation } from '../hooks/useTranslation';
import { User, Users, Shield, ArrowRight, Lock, Mail, Eye, EyeOff, UserPlus, LogIn, QrCode } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

const Register = () => {
  const { t, isEn } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'coach';

  const [role, setRole] = useState(initialRole); // 'coach' | 'player' | 'parent'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.uid !== 'invitado-local') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleRegisterCoach = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError(isEn ? 'Please fill in all fields.' : 'Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError(isEn ? 'Password must be at least 6 characters.' : 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await registerWithEmail(email.trim(), password, name.trim(), 'coach');
      showToast(isEn ? 'Coach account created successfully!' : '¡Cuenta de entrenador creada con éxito!', 'success');
      navigate('/');
    } catch (err) {
      console.error('[Register] Error:', err);
      let msg = isEn ? 'Registration error' : 'Error en el registro';
      if (err.code === 'auth/email-already-in-use') {
        msg = isEn ? 'This email is already registered. Please sign in.' : 'Este correo ya está registrado. Por favor inicia sesión.';
      } else if (err.code === 'auth/weak-password') {
        msg = isEn ? 'Password is too weak.' : 'La contraseña es demasiado débil.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCoachRegister = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      showToast(isEn ? 'Signed in with Google' : 'Sesión iniciada con Google', 'success');
      navigate('/');
    } catch (err) {
      console.error('[Register] Google error:', err);
      setError(err?.message || 'Error con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src="/logo_mister11.png" alt="Míster11" width="120" />
        </div>

        <div className="login-card">
          <h2>{isEn ? 'Create Your Account' : 'Crea tu Cuenta'}</h2>
          <p className="login-subtitle">
            {isEn 
              ? 'Select your role to start with Míster11.' 
              : 'Selecciona tu perfil para comenzar en Míster11.'}
          </p>

          {/* Mandatory Role Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left' }}>
              {isEn ? 'SELECT YOUR ROLE *' : 'SELECCIONA TU ROL *'}
            </label>
            <div className="register-role-grid">
              <button
                type="button"
                onClick={() => { setRole('coach'); setError(''); }}
                className={`register-role-btn coach ${role === 'coach' ? 'active coach' : ''}`}
              >
                <User size={18} />
                <span>{isEn ? 'Coach / Mister' : 'Entrenador'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('player'); setError(''); }}
                className={`register-role-btn player ${role === 'player' ? 'active player' : ''}`}
              >
                <Users size={18} />
                <span>{isEn ? 'Player' : 'Jugador'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('parent'); setError(''); }}
                className={`register-role-btn parent ${role === 'parent' ? 'active parent' : ''}`}
              >
                <Shield size={18} />
                <span>{isEn ? 'Parent / Guardian' : 'Padre / Tutor'}</span>
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          {/* Coach Flow: Create Account & Team */}
          {role === 'coach' && (
            <div>
              <button 
                className="btn-google" 
                onClick={handleGoogleCoachRegister}
                disabled={isLoading}
                style={{ marginBottom: '14px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {isEn ? 'Sign up with Google' : 'Registrarme con Google'}
              </button>

              <div className="divider-auth">
                <span>{isEn ? 'or with email' : 'o con correo'}</span>
              </div>

              <form onSubmit={handleRegisterCoach} className="email-auth-form">
                <div className="input-group-auth">
                  <label>{isEn ? 'Full Name' : 'Nombre y Apellidos'}</label>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input 
                      type="text" 
                      placeholder={isEn ? 'e.g. Coach David Miller' : 'Ej. Entrenador David García'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group-auth">
                  <label>{isEn ? 'Email Address' : 'Correo Electrónico'}</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      placeholder={isEn ? 'coach@example.com' : 'entrenador@ejemplo.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group-auth">
                  <label>{isEn ? 'Password' : 'Contraseña'}</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEn ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="btn-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit-auth" disabled={isLoading}>
                  {isLoading ? (isEn ? 'Creating account...' : 'Creando cuenta...') : (isEn ? 'CREATE COACH ACCOUNT' : 'CREAR CUENTA DE ENTRENADOR')}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Player Flow: Join Team */}
          {role === 'player' && (
            <div style={{
              background: darkMode ? 'rgba(76, 175, 125, 0.08)' : '#ECFDF5',
              border: `1.5px solid ${darkMode ? 'rgba(76, 175, 125, 0.35)' : '#A7F3D0'}`,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: darkMode ? 'rgba(76, 175, 125, 0.2)' : 'rgba(76, 175, 125, 0.15)',
                color: '#4CAF7D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Users size={24} />
              </div>
              <h3 style={{ color: darkMode ? '#ffffff' : '#1B3A2D', margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 700 }}>
                {isEn ? 'Join as Player' : 'Unirse como Jugador'}
              </h3>
              <p style={{ fontSize: '13px', color: darkMode ? '#CBD5E1' : '#334155', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {isEn 
                  ? 'Players join their team through the Team Code (6 letters) provided by the coach or by scanning the team QR code.' 
                  : 'Los jugadores se unen a su equipo mediante el Código de 6 letras facilitado por su míster o escaneando el código QR del equipo.'}
              </p>
              <button
                type="button"
                className="btn-guest"
                onClick={() => navigate('/join-team')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>{isEn ? 'ENTER TEAM CODE OR SCAN QR' : 'INGRESAR CÓDIGO O ESCANEAR QR'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Parent Flow: Join Team */}
          {role === 'parent' && (
            <div style={{
              background: darkMode ? 'rgba(212, 168, 67, 0.08)' : '#FFFBEB',
              border: `1.5px solid ${darkMode ? 'rgba(212, 168, 67, 0.35)' : '#FDE68A'}`,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: darkMode ? 'rgba(212, 168, 67, 0.2)' : 'rgba(212, 168, 67, 0.15)',
                color: '#D4A843',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ color: darkMode ? '#ffffff' : '#1B3A2D', margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 700 }}>
                {isEn ? 'Join as Parent / Legal Guardian' : 'Unirse como Padre / Tutor Legal'}
              </h3>
              <p style={{ fontSize: '13px', color: darkMode ? '#CBD5E1' : '#334155', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                {isEn 
                  ? 'Follow your child’s call-ups, attendance, and sports progress with the team code and RGPD consent validation.' 
                  : 'Sigue las convocatorias, asistencia y progreso deportivo de tu hijo/a introduciendo el código del equipo del entrenador.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/join-team')}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '12px',
                  background: '#D4A843',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span>{isEn ? 'JOIN AS PARENT / GUARDIAN' : 'UNIRME COMO PADRE / TUTOR'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Invited Technical Staff Callout */}
          <Link to="/join-staff" className="staff-invite-link-banner" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} />
              <span>{isEn ? 'Invited to Technical Staff? Join here' : '¿Invitado al cuerpo técnico? Únete aquí como Staff'}</span>
            </div>
            <ArrowRight size={14} />
          </Link>

          {/* Link to Login */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}` }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isEn ? 'Already have an account? ' : '¿Ya tienes cuenta? '}
            </span>
            <Link to="/login" style={{ color: '#4CAF7D', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' }}>
              {isEn ? 'Sign In' : 'Inicia sesión'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
