import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, ClipboardCopy, Share2, Download, CheckCircle, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import './TeamQrModal.css';

export default function TeamQrModal({ isOpen, onClose, teamCode, teamName }) {
  const { t, isEn } = useTranslation();
  const canvasRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinUrl = `https://mister11.app/join?code=${encodeURIComponent(teamCode || '')}`;

  useEffect(() => {
    if (isOpen && teamCode && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1B3A2D',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error('[TeamQrModal] Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, teamCode, joinUrl]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(teamCode || '');
      setCopiedCode(true);
      showToast(t('teamQr.codeCopiedToast'), 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('[TeamQrModal] Clipboard error:', err);
    }
  };

  const handleShareLink = async () => {
    const shareData = {
      title: teamName ? `Míster11 - ${teamName}` : 'Míster11',
      text: isEn
        ? `Join our team on Míster11 using code ${teamCode} or open this link:`
        : `Únete a nuestro equipo en Míster11 con el código ${teamCode} o accede directamente:`,
      url: joinUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[TeamQrModal] Share error:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      showToast(t('teamQr.linkCopiedToast'), 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('[TeamQrModal] Clipboard link error:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qr_${teamCode || 'equipo'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="team-qr-modal-overlay" onClick={onClose}>
      <div className="team-qr-modal-content" onClick={e => e.stopPropagation()}>
        <div className="team-qr-modal-header">
          <div className="team-qr-title-wrap">
            <QrCode className="team-qr-header-icon" size={22} />
            <h2 className="team-qr-title">{t('teamQr.modalTitle')}</h2>
          </div>
          <button type="button" className="team-qr-close-btn" onClick={onClose} aria-label={t('btn.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="team-qr-modal-body">
          <p className="team-qr-subtitle">
            {t('teamQr.scanInstructions')}
          </p>

          <div className="team-qr-canvas-container">
            <canvas ref={canvasRef} className="team-qr-canvas" />
          </div>

          <div className="team-qr-code-display">
            <span className="team-qr-code-label">{t('teamQr.teamCodeLabel')}</span>
            <span className="team-qr-code-value">{teamCode || '------'}</span>
          </div>

          <div className="team-qr-actions-grid">
            <button
              type="button"
              className="team-qr-action-btn"
              onClick={handleCopyCode}
            >
              {copiedCode ? <CheckCircle size={18} /> : <ClipboardCopy size={18} />}
              <span>{copiedCode ? t('teamQr.copied') : t('teamQr.copyCode')}</span>
            </button>

            <button
              type="button"
              className="team-qr-action-btn"
              onClick={handleShareLink}
            >
              {copiedLink ? <CheckCircle size={18} /> : <Share2 size={18} />}
              <span>{copiedLink ? t('teamQr.copied') : t('teamQr.shareLink')}</span>
            </button>

            <button
              type="button"
              className="team-qr-action-btn"
              onClick={handleDownloadQr}
            >
              <Download size={18} />
              <span>{t('teamQr.downloadImage')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
