/**
 * src/components/QRInviteModal.jsx
 * Míster11 — Modal Reutilizable de Generación y Compartición de Código QR
 *
 * PALETA OFICIAL: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). Cero azules. Cero emojis.
 */

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Share2, Download, X, Check, Shield, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';

export const QRInviteModal = ({
  isOpen,
  onClose,
  type = 'coach_invite', // 'coach_invite' | 'player_invite'
  code,
  teamId,
  teamName,
  role = 'assistant_coach',
  customUrl
}) => {
  const { t, isEn } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const defaultUrl = type === 'coach_invite'
    ? `${window.location.origin}/join-staff?code=${code || ''}&teamId=${teamId || ''}`
    : `${window.location.origin}/join/${code || ''}`;

  const finalUrl = customUrl || defaultUrl;

  useEffect(() => {
    if (!isOpen || !code) return;

    const payload = JSON.stringify({
      type,
      teamId,
      code,
      role: type === 'coach_invite' ? role : undefined,
      url: finalUrl
    });

    QRCode.toDataURL(finalUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1B3A2D',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('[QRInviteModal] Error generando QR:', err));
  }, [isOpen, code, finalUrl, type, teamId, role]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      showToast(isEn ? 'Link copied to clipboard.' : 'Enlace copiado al portapapeles.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      showToast(isEn ? 'Could not copy link.' : 'No se pudo copiar el enlace.', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: type === 'coach_invite'
            ? (isEn ? `Join ${teamName || 'Team'} Coaching Staff` : `Únete al Cuerpo Técnico de ${teamName || 'Equipo'}`)
            : (isEn ? `Join ${teamName || 'Team'}` : `Únete al Equipo ${teamName || ''}`),
          text: type === 'coach_invite'
            ? (isEn ? `Scan this QR or use code ${code} to join as staff:` : `Escanea este QR o usa el código ${code} para unirte al cuerpo técnico:`)
            : (isEn ? `Scan this QR or use code ${code} to join the squad:` : `Escanea este QR o usa el código ${code} para unirte a la plantilla:`),
          url: finalUrl
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `M11_QR_${type}_${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(isEn ? 'QR code downloaded.' : 'Código QR descargado.', 'success');
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
          maxWidth: '380px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
          textAlign: 'center',
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

        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 168, 67, 0.15)',
            border: '1px solid #D4A843',
            color: '#D4A843',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}
        >
          {type === 'coach_invite' ? <Shield size={24} /> : <Users size={24} />}
        </div>

        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF' }}>
          {type === 'coach_invite'
            ? (isEn ? 'Staff Invitation QR' : 'QR para Cuerpo Técnico')
            : (isEn ? 'Squad Invitation QR' : 'QR para Jugadores y Familias')}
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          {type === 'coach_invite'
            ? (isEn ? `Invite a coach or specialist to join ${teamName || 'the team'}.` : `Invita a otro entrenador o especialista a unirse a ${teamName || 'tu equipo'}.`)
            : (isEn ? `Share with players and parents to join ${teamName || 'the team'}.` : `Comparte con jugadores o padres para unirse a ${teamName || 'tu equipo'}.`)}
        </p>

        {/* Contenedor del QR */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            display: 'inline-block',
            margin: '0 auto 16px auto',
            border: '2px solid rgba(212, 168, 67, 0.4)'
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Mister11 Invite QR"
              style={{ width: '220px', height: '220px', display: 'block' }}
            />
          ) : (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B3A2D' }}>
              <QrCode size={48} />
            </div>
          )}
        </div>

        {/* Código destacado */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(212, 168, 67, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              {isEn ? 'Access Code' : 'Código de Acceso'}
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#D4A843', letterSpacing: '2px', fontWeight: 900 }}>
              {code}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              backgroundColor: '#4CAF7D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '44px'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy' : 'Copiar')}
          </button>
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '48px'
            }}
          >
            <Share2 size={16} />
            {isEn ? 'Share QR' : 'Compartir'}
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            style={{
              backgroundColor: '#4CAF7D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '48px'
            }}
          >
            <Download size={16} />
            {isEn ? 'Download' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  );
};
