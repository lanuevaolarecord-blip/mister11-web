/**
 * src/components/InviteStaffModal.jsx
 * Míster11 — Modal de Invitación por Correo Electrónico y Rol para Cuerpo Técnico
 *
 * PALETA OFICIAL: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). Cero azules. Cero emojis.
 */

import React, { useState } from 'react';
import { UserPlus, Mail, Copy, QrCode, X, Check, Shield } from 'lucide-react';
import { STAFF_ROLES } from '../config/staffRoles';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';

export const InviteStaffModal = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  staffInviteCode,
  onOpenQR
}) => {
  const { t, isEn } = useTranslation();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('assistant_coach');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const rawCode = (staffInviteCode || '').replace(/^STAFF-/, '');
  const directLink = `${window.location.origin}/join-staff?code=${rawCode}&teamId=${teamId || ''}`;

  const defaultMsg = isEn
    ? `You are invited to join the coaching staff of ${teamName || 'the team'} on Míster11.\nAccess code: ${staffInviteCode || rawCode}\nDirect link: ${directLink}`
    : `Te invito a unirte al cuerpo técnico de ${teamName || 'nuestro equipo'} en Míster11.\nCódigo de acceso: ${staffInviteCode || rawCode}\nEnlace directo: ${directLink}`;

  const [message, setMessage] = useState(defaultMsg);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directLink);
      setCopied(true);
      showToast(isEn ? 'Direct link copied.' : 'Enlace directo copiado.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      showToast(isEn ? 'Could not copy link.' : 'No se pudo copiar el enlace.', 'error');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast(isEn ? 'Please enter a valid email address.' : 'Introduce un correo válido.', 'warning');
      return;
    }

    setIsSending(true);
    try {
      // Intenta compartir por mailto o navigator
      const subject = encodeURIComponent(
        isEn
          ? `Invitation to join ${teamName || 'the team'} coaching staff on Míster11`
          : `Invitación para unirte al cuerpo técnico de ${teamName || 'el equipo'} en Míster11`
      );
      const body = encodeURIComponent(message);
      window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`, '_blank');

      showToast(isEn ? 'Invitation email prepared.' : 'Invitación por correo preparada.', 'success');
      setEmail('');
      onClose();
    } catch (err) {
      console.error('[InviteStaffModal] Error preparando invitación:', err);
      showToast(isEn ? 'Could not launch email client.' : 'No se pudo abrir el cliente de correo.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1B3A2D',
          border: '1.5px solid #D4A843',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '8px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label={isEn ? 'Close' : 'Cerrar'}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 168, 67, 0.15)',
              border: '1px solid #D4A843',
              color: '#D4A843',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UserPlus size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              {isEn ? 'Invite Coaching Staff' : 'Invitar al Cuerpo Técnico'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              {teamName || 'Míster11'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
              {isEn ? 'Coach Email Address *' : 'Correo Electrónico del Entrenador *'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isEn ? "coach@club.com" : "entrenador@club.com"}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
              {isEn ? 'Role to Assign *' : 'Rol a Asignar *'}
            </label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#1B3A2D',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              {Object.values(STAFF_ROLES).filter(r => r.id !== 'head_coach').map(r => (
                <option key={r.id} value={r.id} style={{ background: '#1B3A2D', color: '#FFFFFF' }}>
                  {isEn ? r.labelEn : r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
              {isEn ? 'Custom Message' : 'Mensaje Personalizado'}
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                flex: 1,
                minHeight: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy Link' : 'Copiar Enlace')}
            </button>

            {onOpenQR && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQR();
                }}
                style={{
                  minHeight: '48px',
                  backgroundColor: 'rgba(212, 168, 67, 0.15)',
                  border: '1px solid #D4A843',
                  borderRadius: '10px',
                  color: '#D4A843',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <QrCode size={18} />
                {isEn ? 'View QR' : 'Ver QR'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSending}
              style={{
                flex: 1,
                minHeight: '48px',
                backgroundColor: '#4CAF7D',
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Mail size={16} />
              {isSending ? (isEn ? 'Sending...' : 'Enviando...') : (isEn ? 'Send Invitation' : 'Enviar Invitación')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
