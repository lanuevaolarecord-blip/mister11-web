import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, signInWithGoogle } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { STAFF_ROLES } from '../hooks/useTeamMembers';
import { Shield, CheckCircle, AlertCircle, Users, ArrowRight, Loader } from 'lucide-react';
import './Login.css';

const JoinTeam = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token');
  
  const navigate = useNavigate();
  const { user, changeActiveTeam, loginAsGuest } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación no válido o incompleto.');
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const invRef = doc(db, 'staff_invitations', token);
        const invSnap = await getDoc(invRef);

        if (!invSnap.exists()) {
          setError('Esta invitación no existe, ha expirado o ya fue utilizada.');
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
        console.error('[JoinTeam] Error al cargar invitación:', err);
        setError('Error al consultar la invitación. Verifica tu conexión de red.');
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
      console.error('[JoinTeam] Error login Google:', err);
      setError('Fallo al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setAccepting(true);
    setError(null);

    try {
      const { teamId, teamPath, teamName, role } = invitation;

      // 1. Guardar miembro en la subcolección members del equipo
      const memberRef = doc(db, `${teamPath}/members`, user.uid);
      await setDoc(memberRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Entrenador Colaborador',
        role: role || 'assistant_coach',
        joinedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Registrar en array members del doc del equipo para queries
      try {
        const teamRef = doc(db, teamPath);
        await updateDoc(teamRef, {
          members: arrayUnion({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Entrenador Colaborador',
            role: role || 'assistant_coach',
            joinedAt: new Date().toISOString()
          })
        });
      } catch (e) {
        console.warn('[JoinTeam] No se pudo actualizar array en doc raíz de equipo:', e);
      }

      // 3. Guardar puntero en el perfil del usuario para que aparezca en su lista de equipos
      const sharedTeamRef = doc(db, 'users', user.uid, 'shared_teams', teamId);
      await setDoc(sharedTeamRef, {
        id: teamId,
        teamId,
        teamPath,
        teamName: teamName || 'Equipo',
        role: role || 'assistant_coach',
        joinedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Marcar invitación como aceptada
      await updateDoc(doc(db, 'staff_invitations', token), {
        status: 'accepted',
        acceptedByUid: user.uid,
        acceptedByEmail: user.email || '',
        acceptedAt: new Date().toISOString()
      }).catch(() => {});

      // 5. Cambiar equipo activo y redirigir
      changeActiveTeam(teamId);
      setSuccess(true);
      setTimeout(() => {
        navigate('/equipo');
      }, 1500);

    } catch (err) {
      console.error('[JoinTeam] Error al aceptar invitación:', err);
      setError('Error al unirse al equipo. Inténtalo de nuevo.');
      setAccepting(false);
    }
  };

  const roleInfo = invitation?.role ? STAFF_ROLES[invitation.role.toUpperCase()] || { label: invitation.role, badge: 'Cuerpo Técnico', color: '#10B981' } : null;

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '440px' }}>
        <div className="login-logo">
          <img src="/logo_mister11.png" alt="Míster 11" width="120" />
        </div>

        <div className="login-card" style={{ textAlign: 'center' }}>
          {loading ? (
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <Loader className="spinner" size={36} color="var(--primary-color)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verificando invitación de equipo...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <AlertCircle size={32} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.2rem' }}>Invitación no disponible</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>{error}</p>
              <button className="btn-primary full-width" onClick={() => navigate('/login')}>
                Ir al Inicio
              </button>
            </div>
          ) : success ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.2rem' }}>¡Te has unido al equipo!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '15px' }}>
                Cargando tu panel técnico de <strong>{invitation.teamName}</strong>...
              </p>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Shield size={30} />
              </div>

              <h2 style={{ fontSize: '1.3rem', marginBottom: '6px', color: 'var(--text-primary)' }}>Invitación al Cuerpo Técnico</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                Has sido invitado a colaborar en el equipo:
              </p>

              {/* Tarjeta del equipo */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Users size={20} color="#10B981" />
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {invitation.teamName}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rol asignado:</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: `${roleInfo?.color || '#10B981'}20`,
                    color: roleInfo?.color || '#10B981',
                    border: `1px solid ${roleInfo?.color || '#10B981'}50`
                  }}>
                    {roleInfo?.badge || roleInfo?.label || invitation.role}
                  </span>
                </div>
              </div>

              {user ? (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Conectado como: <strong>{user.email}</strong>
                  </p>
                  <button
                    className="btn-primary full-width"
                    onClick={handleAccept}
                    disabled={accepting}
                    style={{ minHeight: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
                  >
                    {accepting ? 'Uniendo al equipo...' : (
                      <>
                        Aceptar y Entrar al Equipo <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Inicia sesión para aceptar la invitación y acceder:
                  </p>
                  <button
                    className="btn-google full-width"
                    onClick={handleGoogleLogin}
                    style={{ minHeight: '46px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    Continuar con Google
                  </button>
                  <button
                    className="btn-outline full-width"
                    onClick={() => navigate(`/login?returnUrl=/join-team/${token}`)}
                    style={{ minHeight: '42px', fontSize: '0.85rem' }}
                  >
                    Entrar con Email / Contraseña
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;
