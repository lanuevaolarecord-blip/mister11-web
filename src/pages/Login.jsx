import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect } from '../firebaseConfig';
import { usePWA } from '../hooks/usePWA';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Intentar primero con Popup
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error signing in with Google", err);
      
      // Fallback a Redirect si el popup fue bloqueado
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setError(`Error en redirección: ${redirectErr.message}`);
        }
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado en Firebase Console.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Error: ${err.message}`);
      }
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
          <h2>Bienvenido al banquillo</h2>
          <p className="login-subtitle">Inicia sesión para gestionar tu equipo, sesiones y rendimiento táctico.</p>
          
          {error && <div className="login-error">{error}</div>}
          
          <button 
            className="btn-google" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Conectando con Google...' : (
              <>
                {/* Google logo como SVG inline para evitar CORB */}
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

          {deferredPrompt && !isInstalled && (
            <button 
              className="btn-primary outline" 
              onClick={installApp}
              style={{ marginTop: '15px', width: '100%' }}
            >
              Instalar App
            </button>
          )}
          
          <div className="login-footer">
            <p>Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
