/**
 * src/pages/InviteCoach.jsx
 * Míster11 — Página Completa de Invitación y Unión para Entrenadores y Staff
 *
 * PALETA OFICIAL: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). Cero azules. Cero emojis.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, QrCode, Search, AlertCircle, CheckCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';
import { validateStaffInviteCode, joinTeamAsStaff } from '../utils/staffInviteManager';
import { STAFF_ROLES } from '../config/staffRoles';
import { showToast } from '../utils/toast';

const InviteCoach = () => {
  const { user } = useAuth();
  const { t, isEn } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCode = searchParams.get('code') || '';
  const initialTeamId = searchParams.get('teamId') || '';

  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'qr'
  const [inputCode, setInputCode] = useState(initialCode.toUpperCase());
  const [selectedRole, setSelectedRole] = useState('assistant_coach');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Validación debounce en tiempo real
  useEffect(() => {
    const raw = inputCode.trim().replace(/^STAFF-/, '').toUpperCase();
    if (raw.length === 6) {
      const timer = setTimeout(() => {
        handleValidateCode(raw);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTeamData(null);
      if (raw.length > 0 && raw.length < 6) {
        setErrorMessage(isEn ? 'Code must have 6 characters.' : 'El código debe tener 6 caracteres.');
      } else {
        setErrorMessage('');
      }
    }
  }, [inputCode, isEn]);

  const handleValidateCode = async (codeToTest) => {
    const clean = (codeToTest || inputCode).trim().toUpperCase();
    if (!clean) return;

    setIsValidating(true);
    setErrorMessage('');
    try {
      const res = await validateStaffInviteCode(clean);
      if (res.valid) {
        setTeamData(res);
        setErrorMessage('');
      } else {
        setTeamData(null);
        if (res.error === 'expired') {
          setErrorMessage(isEn ? 'This staff invitation has expired.' : 'Esta invitación ha expirado.');
        } else {
          setErrorMessage(
            isEn
              ? 'Invalid code. Verify characters or contact the head coach.'
              : 'Código no válido. Verifica los caracteres o contacta al entrenador.'
          );
        }
      }
    } catch (_) {
      setErrorMessage(isEn ? 'Error verifying code.' : 'Error al consultar el equipo.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!user) {
      navigate(`/login?returnUrl=/join-staff?code=${inputCode}`);
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinTeamAsStaff(inputCode, user, selectedRole);
      if (res.success) {
        showToast(
          isEn
            ? `Joined ${res.teamName || 'team'} coaching staff!`
            : `¡Te has unido al cuerpo técnico de ${res.teamName || 'tu equipo'}!`,
          'success'
        );
        navigate('/');
      } else {
        if (res.error === 'already_owner') {
          showToast(isEn ? 'You are already the owner of this team.' : 'Ya eres el creador de este equipo.', 'info');
        } else {
          setErrorMessage(isEn ? 'Could not complete union to team staff.' : 'No se pudo completar la unión al cuerpo técnico.');
        }
      }
    } catch (_) {
      setErrorMessage(isEn ? 'Unexpected error joining.' : 'Error inesperado al unirse.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0F1E17' : '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: darkMode ? '#FFFFFF' : '#0F172A'
      }}
    >
      {/* Tarjeta Principal */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: darkMode ? '#1B3A2D' : '#FFFFFF',
          border: darkMode ? '1.5px solid #D4A843' : '1px solid #CBD5E1',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: darkMode ? '0 16px 40px rgba(0, 0, 0, 0.6)' : '0 10px 30px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}
      >
        {/* Header con icono y logo */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: darkMode ? 'rgba(212, 168, 67, 0.15)' : 'rgba(212, 168, 67, 0.12)',
            border: '2px solid #D4A843',
            color: '#D4A843',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto'
          }}
        >
          <Shield size={28} />
        </div>

        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 900, color: darkMode ? '#FFFFFF' : '#1B3A2D' }}>
          {isEn ? 'Join Coaching Staff' : 'Unirse al Cuerpo Técnico'}
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: darkMode ? '#94A3B8' : '#475569', lineHeight: 1.4 }}>
          {isEn
            ? 'Collaborate as coach, fitness trainer or specialist in your team.'
            : 'Colabora como segundo entrenador, preparador físico o especialista.'}
        </p>

        {/* Tabs de Selección: Código o QR */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.25)' : '#F1F5F9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            style={{
              minHeight: '44px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeTab === 'code' ? '#4CAF7D' : 'transparent',
              color: activeTab === 'code' ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#64748B'),
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={16} />
            {isEn ? 'Enter Code' : 'Introducir Código'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            style={{
              minHeight: '44px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeTab === 'qr' ? '#4CAF7D' : 'transparent',
              color: activeTab === 'qr' ? '#FFFFFF' : (darkMode ? '#CBD5E1' : '#64748B'),
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <QrCode size={16} />
            {isEn ? 'Scan QR' : 'Escanear QR'}
          </button>
        </div>

        {activeTab === 'code' && (
          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#E2E8F0' : '#334155', marginBottom: '6px' }}>
              {isEn ? '6-Character Staff Code *' : 'Código de Staff (6 caracteres) *'}
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder={isEn ? "e.g. ABC123" : "Ej. ABC123"}
              maxLength={12}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '12px',
                borderRadius: '10px',
                border: darkMode ? '1.5px solid rgba(212, 168, 67, 0.5)' : '1.5px solid #CBD5E1',
                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.25)' : '#FFFFFF',
                color: darkMode ? '#D4A843' : '#1B3A2D',
                fontSize: '1.15rem',
                fontWeight: 900,
                letterSpacing: '3px',
                textAlign: 'center',
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />

            {isValidating && (
              <div style={{ fontSize: '0.85rem', color: darkMode ? '#D4A843' : '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
                <Search size={14} className="spin" /> {isEn ? 'Searching team...' : 'Buscando equipo...'}
              </div>
            )}

            {errorMessage && !teamData && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#DC2626',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {teamData && (
              <div
                style={{
                  backgroundColor: darkMode ? 'rgba(76, 175, 125, 0.12)' : '#ECFDF5',
                  border: `1.5px solid ${darkMode ? '#4CAF7D' : '#10B981'}`,
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '18px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: darkMode ? '#4CAF7D' : '#047857', fontWeight: 800, textTransform: 'uppercase' }}>
                  {isEn ? 'Team Found' : 'Equipo Encontrado'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '2px', color: darkMode ? '#FFFFFF' : '#1B3A2D' }}>
                  {teamData.teamName}
                </div>
                <div style={{ fontSize: '0.8rem', color: darkMode ? '#94A3B8' : '#475569', marginTop: '2px' }}>
                  {isEn ? 'Verified Coaching Staff Code' : 'Código de Cuerpo Técnico Verificado'}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: darkMode ? '#E2E8F0' : '#334155', marginBottom: '4px' }}>
                    {isEn ? 'Assigned Staff Role' : 'Rol en el Cuerpo Técnico'}
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #CBD5E1',
                      backgroundColor: darkMode ? '#1B3A2D' : '#FFFFFF',
                      color: darkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {Object.values(STAFF_ROLES).filter(r => r.id !== 'head_coach').map(r => (
                      <option key={r.id} value={r.id}>
                        {isEn ? r.labelEn : r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!user ? (
              <button
                type="button"
                onClick={() => navigate(`/login?returnUrl=/join-staff?code=${inputCode}`)}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: '#4CAF7D',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogIn size={18} />
                {isEn ? 'Sign in to Join Team' : 'Iniciar Sesión para Unirme'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={isJoining || !teamData}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: teamData ? '#4CAF7D' : 'rgba(76, 175, 125, 0.5)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: teamData ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={18} />
                {isJoining
                  ? (isEn ? 'Joining...' : 'Confirmando...')
                  : (isEn ? 'CONFIRM JOIN AS STAFF' : 'CONFIRMAR UNIÓN AL EQUIPO')}
              </button>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(76, 175, 125, 0.15)',
                color: '#4CAF7D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <QrCode size={36} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800 }}>
              {isEn ? 'Scan Invitation QR' : 'Escanear QR de Invitación'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              {isEn
                ? 'Scan the QR code displayed by the team owner or provided in your invitation message.'
                : 'Apunta tu cámara al código QR proporcionado por el entrenador principal.'}
            </p>
            <button
              type="button"
              onClick={() => {
                showToast(
                  isEn
                    ? 'To scan from web, use your mobile camera or enter the 6-character code directly.'
                    : 'Abre la cámara de tu móvil para escanear el enlace o introduce el código de 6 caracteres.',
                  'info'
                );
                setActiveTab('code');
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '10px 16px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px'
              }}
            >
              {isEn ? 'Back to Code Input' : 'Volver a Introducir Código'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px', borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'}`, paddingTop: '14px' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.85rem',
              color: darkMode ? '#D4A843' : '#15803D',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            ← {isEn ? 'Back to sign in' : 'Volver al inicio de sesión'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InviteCoach;
