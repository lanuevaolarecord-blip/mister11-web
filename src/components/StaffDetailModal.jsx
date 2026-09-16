/**
 * src/components/StaffDetailModal.jsx
 * Míster11 — Modal de Inspección y Detalles de Entrenador (Invitado o Activo)
 * 
 * Permite seleccionar a un entrenador invitado para ver su código de 6 caracteres,
 * enlace de invitación, código QR interactivo y opciones de gestión.
 *
 * PALETA OFICIAL: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). Cero azules. Cero emojis.
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, User, Mail, Copy, Check, QrCode, Trash2, Share2, X, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import { STAFF_ROLES, getStaffPermissions } from '../config/staffRoles';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';

export const StaffDetailModal = ({
  isOpen,
  onClose,
  invitation,
  member,
  teamId,
  teamName,
  onCancelInvitation,
  onUpdateMemberRole,
  onRemoveMember,
  canManage = true
}) => {
  const { t, isEn } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteCode = invitation?.inviteCode || 
    (invitation?.code ? invitation.code.replace(/^STAFF-/, '') : '') || 
    (invitation?.token ? invitation.token.split('_').pop()?.toUpperCase() : '') || 
    '';

  const fullCode = inviteCode ? `STAFF-${inviteCode}` : '';
  const directLink = inviteCode 
    ? `${window.location.origin}/join-staff?code=${inviteCode}&teamId=${teamId || ''}`
    : (invitation?.token ? `${window.location.origin}/join-team/${invitation.token}` : '');

  // Generar QR cuando haya una invitación activa
  useEffect(() => {
    if (!isOpen || !directLink) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(directLink, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1B3A2D',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('[StaffDetailModal] Error generando QR:', err));
  }, [isOpen, directLink]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      showToast(isEn ? '6-character code copied.' : 'Código de 6 caracteres copiado.', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_) {
      showToast(isEn ? 'Could not copy code.' : 'No se pudo copiar el código.', 'error');
    }
  };

  const handleCopyLink = async () => {
    if (!directLink) return;
    try {
      await navigator.clipboard.writeText(directLink);
      setCopiedLink(true);
      showToast(isEn ? 'Invitation link copied.' : 'Enlace de invitación copiado.', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {
      showToast(isEn ? 'Could not copy link.' : 'No se pudo copiar el enlace.', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    if (!directLink) return;
    const msg = isEn
      ? `Hello! You have been invited to join the coaching staff of ${teamName || 'the team'} on Míster11.\nYour 6-character access code is: *${inviteCode}*\nJoin here: ${directLink}`
      : `¡Hola! Has sido invitado a unirte al cuerpo técnico de ${teamName || 'el equipo'} en Míster11.\nTu código de acceso de 6 caracteres es: *${inviteCode}*\nÚnete directamente aquí: ${directLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const roleRaw = invitation?.role || member?.role || 'assistant_coach';
  const roleInfo = Object.values(STAFF_ROLES).find(r => r.id === roleRaw || r.aliases?.includes(roleRaw)) || STAFF_ROLES.ASSISTANT_COACH;
  const permissions = getStaffPermissions(roleInfo.id);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1B3A2D',
          border: '1.5px solid #D4A843',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          color: '#FFFFFF',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
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
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(212, 168, 67, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D4A843',
              border: '1px solid rgba(212, 168, 67, 0.3)'
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              {invitation 
                ? (isEn ? 'Staff Invitation Details' : 'Detalles de Invitación de Staff')
                : (isEn ? 'Staff Member Details' : 'Ficha del Miembro del Staff')}
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              {teamName || (isEn ? 'My Team' : 'Mi Equipo')}
            </span>
          </div>
        </div>

        {/* MODO: INVITACIÓN PENDIENTE */}
        {invitation && (
          <div>
            {/* Tarjeta de Información Principal */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  {isEn ? 'Invited Email / Contact:' : 'Email / Contacto invitado:'}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(212, 168, 67, 0.15)',
                    color: '#D4A843',
                    border: '1px solid rgba(212, 168, 67, 0.4)',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  ⏳ {isEn ? 'Pending Acceptance' : 'Pendiente de aceptación'}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', wordBreak: 'break-all' }}>
                {invitation.email || (isEn ? 'Open invitation (link / code)' : 'Invitación abierta (enlace o código)')}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '6px' }}>
                {isEn ? 'Assigned Role:' : 'Rol asignado:'}{' '}
                <strong style={{ color: '#4CAF7D' }}>{isEn ? roleInfo.labelEn : roleInfo.name}</strong>
              </div>
            </div>

            {/* CÓDIGO DE ACCESO DESTACADO */}
            {inviteCode && (
              <div
                style={{
                  backgroundColor: 'rgba(212, 168, 67, 0.12)',
                  border: '1.5px solid #D4A843',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#D4A843', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {isEn ? '6-CHARACTER ACCESS CODE' : 'CÓDIGO DE ACCESO DE 6 CARACTERES'}
                </span>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    letterSpacing: '6px',
                    color: '#FFFFFF',
                    margin: '8px 0 12px 0',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  {inviteCode}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: copiedCode ? '#4CAF7D' : '#D4A843',
                      color: copiedCode ? '#FFFFFF' : '#000000',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      minHeight: '48px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedCode ? (isEn ? 'Code Copied!' : '¡Código Copiado!') : (isEn ? 'Copy Code' : 'Copiar Código')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      minHeight: '48px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedLink ? <Check size={18} color="#4CAF7D" /> : <Share2 size={18} />}
                    <span>{copiedLink ? (isEn ? 'Link Copied!' : '¡Enlace Copiado!') : (isEn ? 'Copy Link' : 'Copiar Enlace')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* CÓDIGO QR ESCANEABLE */}
            {qrDataUrl && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700 }}>
                  {isEn ? 'Scan QR with phone camera or Míster11 app:' : 'Escanear QR con la cámara o con la app:'}
                </span>
                <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: '12px', display: 'inline-block' }}>
                  <img src={qrDataUrl} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                </div>
              </div>
            )}

            {/* ACCIONES RÁPIDAS: WHATSAPP Y CANCELAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={20} />
                <span>{isEn ? 'Send via WhatsApp' : 'Compartir invitación por WhatsApp'}</span>
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(isEn ? 'Cancel and delete this invitation?' : '¿Cancelar y eliminar esta invitación?')) {
                      onCancelInvitation(invitation.token || invitation.id);
                      onClose();
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Trash2 size={18} />
                  <span>{isEn ? 'Cancel Invitation' : 'Cancelar y Eliminar Invitación'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODO: MIEMBRO ACTIVO DEL STAFF */}
        {member && (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(76, 175, 125, 0.2)',
                    color: '#4CAF7D',
                    border: '2px solid #4CAF7D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 900
                  }}
                >
                  {(member.displayName || member.email || 'ST').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 800 }}>
                    {member.displayName || member.name || member.email?.split('@')[0] || 'Entrenador'}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{member.email}</span>
                </div>
              </div>

              {/* Rol y Permisos */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                  {isEn ? 'Current Role:' : 'Rol actual:'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#D4A843', marginBottom: '10px' }}>
                  {isEn ? roleInfo.labelEn : roleInfo.name}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '8px', fontWeight: 700 }}>
                  {isEn ? 'Active Permissions:' : 'Permisos activos en el equipo:'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {permissions.canManageMatches && (
                    <span style={{ fontSize: '11px', background: 'rgba(76, 175, 125, 0.15)', color: '#4CAF7D', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.3)' }}>
                      ✓ {isEn ? 'Matches & Lineups' : 'Partidos y Alineaciones'}
                    </span>
                  )}
                  {permissions.canEditSessions && (
                    <span style={{ fontSize: '11px', background: 'rgba(76, 175, 125, 0.15)', color: '#4CAF7D', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.3)' }}>
                      ✓ {isEn ? 'Sessions & Exercises' : 'Sesiones y Ejercicios'}
                    </span>
                  )}
                  {permissions.canEditLiveStats && (
                    <span style={{ fontSize: '11px', background: 'rgba(212, 168, 67, 0.15)', color: '#D4A843', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(212, 168, 67, 0.3)' }}>
                      ✓ {isEn ? 'Live Stats & Minutes' : 'Live Stats y Minutaje'}
                    </span>
                  )}
                  {permissions.canManageSquad && (
                    <span style={{ fontSize: '11px', background: 'rgba(76, 175, 125, 0.15)', color: '#4CAF7D', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(76, 175, 125, 0.3)' }}>
                      ✓ {isEn ? 'Squad Management' : 'Gestión de Plantilla'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Selector para cambiar rol */}
            {canManage && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  {isEn ? 'Change Staff Role:' : 'Cambiar rol en el cuerpo técnico:'}
                </label>
                <select
                  value={member.role || 'assistant_coach'}
                  onChange={e => {
                    onUpdateMemberRole(member.uid || member.id, e.target.value);
                    showToast(isEn ? 'Role updated' : 'Rol actualizado', 'success');
                  }}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  {Object.values(STAFF_ROLES).map(r => (
                    <option key={r.id} value={r.id} style={{ background: '#1B3A2D', color: '#FFFFFF' }}>
                      {isEn ? r.labelEn : r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Eliminar miembro */}
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isEn ? `Remove ${member.displayName || member.email} from the staff?` : `¿Eliminar a ${member.displayName || member.email} del cuerpo técnico?`)) {
                    onRemoveMember(member.uid || member.id);
                    onClose();
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={18} />
                <span>{isEn ? 'Remove from Staff' : 'Revocar y Eliminar del Staff'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
