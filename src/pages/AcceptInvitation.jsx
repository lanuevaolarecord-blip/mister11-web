import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db, signInWithGoogle, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Login.css';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, loginAsGuest } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación no válido. Falta el token de acceso.');
      setLoading(false);
      return;
    }

    // Guardar token en localStorage por si el usuario necesita iniciar sesión primero
    localStorage.setItem('mister11_pending_invite_token', token);

    const fetchInvitation = async () => {
      try {
        const invRef = doc(db, 'invitations', token);
        const invSnap = await getDoc(invRef);

        if (!invSnap.exists()) {
          setError('Esta invitación no existe, ha expirado o ya ha sido utilizada.');
          setLoading(false);
          return;
        }

        const data = invSnap.data();
        if (data.status !== 'pending') {
          setError('Esta invitación ya ha sido aceptada o cancelada.');
          setLoading(false);
          return;
        }

        setInvitation(data);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Error al cargar la invitación. Revisa tu conexión de red.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Error in Google Login:', err);
      setError('Fallo al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      await loginAsGuest();
    } catch (err) {
      console.error('Error in Guest Login:', err);
      setError('Fallo al iniciar sesión en modo invitado.');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setAccepting(true);
    setError(null);

    try {
      const { clubId, role, email } = invitation;

      // 1. Obtener documento del club
      const clubRef = doc(db, 'clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (!clubSnap.exists()) {
        throw new Error('El club especificado ya no existe.');
      }

      const clubData = clubSnap.data();
      const coaches = clubData.coaches || [];

      // Buscar si el coach ya está listado por email o token
      const coachIndex = coaches.findIndex(c => c.inviteToken === token || c.email.toLowerCase() === user.email?.toLowerCase());

      if (coachIndex === -1) {
        throw new Error('No estás registrado como miembro invitado en este club.');
      }

      const coachInfo = coaches[coachIndex];
      const assignedTeams = coachInfo.assignedTeams || [];

      // Actualizar el array coaches localmente para subirlo
      const updatedCoaches = [...coaches];
      updatedCoaches[coachIndex] = {
        ...coachInfo,
        uid: user.uid,
        status: 'active'
      };

      // 2. Preparar el lote de escritura (Batch) para operaciones atómicas
      const batch = writeBatch(db);

      // A. Actualizar el club con el nuevo miembro activo
      batch.update(clubRef, { coaches: updatedCoaches });

      // B. Actualizar el perfil del usuario
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        clubId: clubId,
        clubRole: role || 'coach',
        email: user.email,
        nombre: user.displayName || user.email?.split('@')[0] || 'Entrenador',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // C. Marcar invitación como aceptada
      const invRef = doc(db, 'invitations', token);
      batch.update(invRef, {
        status: 'accepted',
        acceptedBy: user.uid,
        acceptedAt: new Date().toISOString()
      });

      // D. Asignar el UID del entrenador en cada uno de los equipos correspondientes
      for (const teamId of assignedTeams) {
        const teamRef = doc(db, 'clubs', clubId, 'teams', teamId);
        batch.update(teamRef, {
          assignedCoaches: arrayUnion(user.uid)
        });
      }

      // Guardar clubId de forma persistente en local
      localStorage.setItem('mister11_club_id', clubId);

      // Ejecutar lote
      await batch.commit();

      // Limpiar token pendiente
      localStorage.removeItem('mister11_pending_invite_token');

      setSuccess(true);
      setTimeout(() => {
        // Recargar página para refrescar AuthContext y re-enrutar
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Ocurrió un error al aceptar la invitación.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container" style={{ textAlign: 'center', padding: '40px' }}>
          <Loader className="spinner" size={40} style={{ color: 'var(--primary-color)', margin: '0 auto 20px' }} />
          <h3>Cargando invitación...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card" style={{ textAlign: 'center', borderColor: 'var(--danger-color)' }}>
            <AlertCircle size={48} style={{ color: '#EA4335', margin: '0 auto 16px' }} />
            <h2 style={{ color: 'var(--text-primary)' }}>¡Vaya! Algo salió mal</h2>
            <p className="login-subtitle" style={{ marginTop: '10px' }}>{error}</p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/')} 
              style={{ marginTop: '20px', width: '100%', minHeight: '48px' }}
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card" style={{ textAlign: 'center', borderColor: '#4CAF7D' }}>
            <CheckCircle size={48} style={{ color: '#4CAF7D', margin: '0 auto 16px' }} />
            <h2>¡Invitación Aceptada!</h2>
            <p className="login-subtitle" style={{ marginTop: '10px' }}>
              Te has unido correctamente a <strong>{invitation?.clubName}</strong>. Redirigiéndote a tu pizarra de mandos...
            </p>
            <div style={{ marginTop: '20px' }}>
              <Loader className="spinner" size={24} style={{ color: '#4CAF7D', margin: '0 auto' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, obligar a iniciar sesión
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img src="/logo_mister11.png" alt="Míster11" width="120"/>
          </div>
          <div className="login-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <Shield size={40} style={{ color: 'var(--primary-color)' }} />
            </div>
            <h2 style={{ textAlign: 'center' }}>Invitación al Club</h2>
            <p className="login-subtitle" style={{ textAlign: 'center', marginTop: '8px' }}>
              Has sido invitado a unirte como Entrenador al club <strong>{invitation?.clubName}</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
              Para aceptar la invitación y vincular tu cuenta, por favor inicia sesión a continuación:
            </p>

            <button 
              className="btn-google" 
              onClick={handleGoogleLogin}
              style={{
                padding: '12px',
                borderRadius: '8px',
                width: '100%',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                minHeight: '48px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Iniciar sesión con Google
            </button>

            <button
              className="btn-guest"
              onClick={handleGuestLogin}
              style={{
                marginTop: '12px',
                padding: '12px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '100%',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px'
              }}
            >
              Entrar en Modo Invitado
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar detalles y botón de aceptación
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card" style={{ borderColor: 'var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Shield size={48} style={{ color: 'var(--primary-color)' }} />
          </div>
          <h2 style={{ textAlign: 'center' }}>Invitación al Club</h2>
          <p className="login-subtitle" style={{ textAlign: 'center', marginTop: '10px' }}>
            Hola <strong>{user.displayName || user.email}</strong>, has sido invitado a unirte a:
          </p>
          
          <div style={{ 
            background: 'var(--bg-card-secondary, rgba(0,0,0,0.03))', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '20px', 
            margin: '20px 0', 
            textAlign: 'center' 
          }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {invitation?.clubName}
            </h3>
            <span style={{ 
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(33,150,243,0.15)',
              color: '#2196F3',
              fontSize: '0.8rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Rol: {invitation?.role === 'owner' ? 'Propietario' : 'Entrenador'}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4' }}>
            Al aceptar esta invitación, tu cuenta se asociará a este club y podrás ver y gestionar los equipos asignados por el administrador.
          </p>

          <button
            className="btn-accept-invitation"
            onClick={handleAccept}
            disabled={accepting}
            style={{
              width: '100%',
              minHeight: '48px',
              background: '#4CAF7D', // Verde Campo
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(76,175,125,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {accepting ? 'Aceptando...' : 'ACEPTAR INVITACIÓN Y COMENZAR'}
          </button>

          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '12px',
              width: '100%',
              minHeight: '40px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textDecoration: 'underline'
            }}
          >
            Rechazar e ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
