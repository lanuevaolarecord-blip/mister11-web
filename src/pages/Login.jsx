import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebaseConfig';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // App.jsx will automatically redirect due to onAuthStateChanged
    } catch (err) {
      console.error("Error signing in with Google", err);
      // Temporary workaround since we have placeholder credentials
      if (err.code === 'auth/invalid-api-key') {
         setError('Configuración de Firebase no válida. Por favor, actualiza firebaseConfig.js con tus credenciales reales.');
      } else {
         setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1>MÍSTER<span>11</span></h1>
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
            {isLoading ? 'Conectando...' : (
              <>
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" className="google-icon" />
                Continuar con Google
              </>
            )}
          </button>
          
          <div className="login-footer">
            <p>Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
