import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertTriangle, Upload } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import './QrScannerModal.css';

export function extractTeamCodeFromText(text) {
  if (!text) return '';
  const str = String(text).trim();
  try {
    const url = new URL(str);
    const code = url.searchParams.get('code') || url.pathname.split('/').filter(Boolean).pop();
    if (code) return code.toUpperCase();
  } catch (_) {}
  const match = str.match(/(?:code=)?([A-Za-z0-9\-_]{4,12})/);
  return match ? match[1].toUpperCase() : str.toUpperCase();
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { t, isEn } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setHasCameraError(false);
    setCameraErrorMessage('');
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraError(true);
      setCameraErrorMessage(t('qrScanner.unsupportedBrowser'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        startDetectionLoop();
      }
    } catch (err) {
      console.warn('[QrScannerModal] Camera access error:', err);
      setHasCameraError(true);
      setCameraErrorMessage(t('qrScanner.cameraPermissionError'));
    }
  };

  const startDetectionLoop = () => {
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            const extracted = extractTeamCodeFromText(rawValue);
            if (extracted) {
              stopCamera();
              onScanSuccess(extracted);
              onClose();
              return;
            }
          }
        } catch (_) {}

        animFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
        const barcodes = await barcodeDetector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const extracted = extractTeamCodeFromText(barcodes[0].rawValue);
          if (extracted) {
            stopCamera();
            onScanSuccess(extracted);
            onClose();
            return;
          }
        }
      } catch (err) {
        console.warn('[QrScannerModal] Image scan error:', err);
      }
    }

    setCameraErrorMessage(t('qrScanner.noQrInImage'));
  };

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-content" onClick={e => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <div className="qr-scanner-title-wrap">
            <Camera className="qr-scanner-icon" size={20} />
            <h3 className="qr-scanner-title">{t('qrScanner.title')}</h3>
          </div>
          <button type="button" className="qr-scanner-close-btn" onClick={onClose} aria-label={t('btn.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="qr-scanner-body">
          {hasCameraError ? (
            <div className="qr-scanner-error-card">
              <AlertTriangle size={32} className="qr-scanner-error-icon" />
              <p className="qr-scanner-error-text">{cameraErrorMessage}</p>
              
              <button
                type="button"
                className="qr-scanner-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                <span>{t('qrScanner.uploadQrPhoto')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="qr-scanner-viewfinder-container">
              <video ref={videoRef} className="qr-scanner-video" muted />
              <div className="qr-scanner-overlay-box">
                <div className="qr-scanner-target-box" />
              </div>
              <p className="qr-scanner-hint">{t('qrScanner.hint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
