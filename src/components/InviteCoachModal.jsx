import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { showToast } from '../utils/toast';
import { X, Mail, Shield } from 'lucide-react';

const InviteCoachModal = ({ isOpen, onClose, clubId, clubName, currentCoaches, onInviteSuccess }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  if (!isOpen) return null;

  const handleInviteCoach = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !clubId) return;

    setLoading(true);
    try {
      const emailLower = inviteEmail.trim().toLowerCase();

      // Check if already exists
      const alreadyExists = (currentCoaches || []).some(
        c => c.email.toLowerCase() === emailLower
      );

      if (alreadyExists) {
        showToast("Este correo ya está registrado o invitado en el club.", "warning");
        setLoading(false);
        return;
      }

      const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newCoach = {
        email: emailLower,
        role: 'coach',
        status: 'pending_invite',
        inviteToken: token,
        assignedTeams: []
      };

      const updatedCoaches = [...(currentCoaches || []), newCoach];
      await updateDoc(doc(db, 'clubs', clubId), {
        coaches: updatedCoaches
      });

      const invRef = doc(db, 'invitations', token);
      await setDoc(invRef, {
        id: token,
        clubId: clubId,
        clubName: clubName || 'Club',
        email: emailLower,
        role: 'coach',
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      const link = `${window.location.origin}/accept-invitation?token=${token}`;
      setGeneratedLink(link);
      setInviteEmail('');
      showToast("Invitación generada con éxito.", "success");
      if (onInviteSuccess) onInviteSuccess(updatedCoaches);
    } catch (err) {
      console.error("Error inviting coach:", err);
      showToast("Error al generar la invitación.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '12px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Invitar Entrenador</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
            <X size={20} color="var(--text-secondary)" />
          </button>
        </header>

        {!generatedLink ? (
          <form onSubmit={handleInviteCoach} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Introduce el correo electrónico del entrenador. Le generaremos un enlace de invitación único para registrarse y acceder al club.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    minHeight: '48px'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', minHeight: '48px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '10px' }}
            >
              {loading ? 'Generando...' : 'Generar Invitación'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: '8px', padding: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                ¡Enlace de invitación listo! Cópialo y envíaselo al entrenador para que pueda unirse:
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink}
                  onClick={(e) => e.target.select()}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: 'var(--bg-card-secondary)',
                    color: 'var(--text-primary)',
                    minHeight: '40px'
                  }}
                />
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    showToast("¡Enlace copiado!", "success");
                  }}
                  style={{ padding: '10px 16px', fontSize: '0.85rem', minHeight: '40px', fontWeight: 'bold' }}
                >
                  Copiar
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                setGeneratedLink('');
                onClose();
              }} 
              className="btn-primary outline"
              style={{ width: '100%', minHeight: '48px', fontWeight: 'bold' }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteCoachModal;
