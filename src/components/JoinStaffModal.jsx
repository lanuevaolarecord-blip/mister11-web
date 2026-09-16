/**
 * src/components/JoinStaffModal.jsx
 * Míster11 — Modal de Unión al Cuerpo Técnico para Entrenadores y Especialistas
 *
 * PALETA OFICIAL: Verde Selva (#1B3A2D), Verde Campo (#4CAF7D), Oro (#D4A843). Cero azules. Cero emojis.
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn, Search, Check, AlertCircle, X, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { validateStaffInviteCode, joinTeamAsStaff } from '../utils/staffInviteManager';
import { STAFF_ROLES } from '../config/staffRoles';
import { showToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';

export const JoinStaffModal = ({ isOpen, onClose, initialCode = '' }) => {
  const { user } = useAuth();
  const { t, isEn } = useTranslation();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(initialCode);
  const [pastedLink, setPastedLink] = useState('');
  const [selectedRole, setSelectedRole] = useState('assistant_coach');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode.toUpperCase());
      handleValidate(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Debounce automático al teclear
  useEffect(() => {
    const clean = inputCode.trim().replace(/^STAFF-/, '').toUpperCase();
    if (clean.length === 6) {
      const timer = setTimeout(() => {
        handleValidate(clean);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTeamInfo(null);
      if (clean.length > 0 && clean.length < 6) {
        setErrorMsg(isEn ? 'Code must have 6 characters.' : 'El código debe tener 6 caracteres.');
      } else {
        setErrorMsg('');
      }
    }
  }, [inputCode, isEn]);

  if (!isOpen) return null;

  const handleValidate = async (codeToTest) => {
    const code = (codeToTest || inputCode).trim().toUpperCase();
    if (!code) return;

    setIsValidating(true);
    setErrorMsg('');
    try {
      const res = await validateStaffInviteCode(code);
      if (res.valid) {
        setTeamInfo(res);
        setErrorMsg('');
      } else {
        setTeamInfo(null);
        if (res.error === 'length') {
          setErrorMsg(isEn ? 'The code must be 6 characters.' : 'El código debe tener 6 caracteres.');
        } else if (res.error === 'expired') {
          setErrorMsg(isEn ? 'This invitation has expired.' : 'Esta invitación ha expirado.');
        } else {
          setErrorMsg(isEn ? 'Team code not found. Verify or ask the head coach.' : 'Código de equipo no encontrado. Verifica los caracteres o contacta al míster.');
        }
      }
    } catch (err) {
      setErrorMsg(isEn ? 'Error verifying code.' : 'Error al verificar el código.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLinkPaste = (e) => {
    const val = e.target.value;
    setPastedLink(val);
    try {
      if (val.includes('code=')) {
        const url = new URL(val);
        const codeParam = url.searchParams.get('code');
        if (codeParam) {
          setInputCode(codeParam.toUpperCase());
        }
      } else if (val.includes('/join-staff/')) {
        const code = val.split('/join-staff/')[1]?.split('?')[0];
        if (code) setInputCode(code.toUpperCase());
      }
    } catch (_) {}
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast(isEn ? 'Please sign in first.' : 'Por favor inicia sesión primero.', 'warning');
      navigate(`/login?returnUrl=/join-staff?code=${inputCode}`);
      onClose();
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinTeamAsStaff(inputCode, user, selectedRole);
      if (res.success) {
        if (res.alreadyMember) {
          showToast(isEn ? 'You are already a staff member of this team!' : '¡Ya eres miembro del cuerpo técnico de este equipo!', 'info');
        } else {
          showToast(
            isEn
              ? `Joined ${res.teamName || 'team'} coaching staff successfully!`
              : `¡Te has unido al cuerpo técnico de ${res.teamName || 'tu equipo'} con éxito!`,
            'success'
          );
        }
        onClose();
        window.location.reload();
      } else {
        if (res.error === 'already_owner') {
          showToast(isEn ? 'You are already the owner of this team.' : 'Ya eres el creador de este equipo.', 'info');
        } else {
          setErrorMsg(isEn ? 'Could not join the team. Check permissions.' : 'No se pudo unir al equipo. Verifica tus permisos.');
        }
      }
    } catch (err) {
      setErrorMsg(isEn ? 'Unexpected error joining staff.' : 'Error inesperado al unirse.');
    } finally {
      setIsJoining(false);
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
          maxWidth: '440px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 168, 67, 0.15)',
              border: '1px solid #D4A843',
              color: '#D4A843',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              {isEn ? 'Join Coaching Staff' : 'Unirse al Cuerpo Técnico'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              {isEn ? 'Collaborate with your team' : 'Colabora en un equipo existente'}
            </span>
          </div>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
              {isEn ? 'Enter 6-Character Staff Code *' : 'Código de Staff (6 caracteres) *'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder={isEn ? "e.g. ABC123" : "Ej. ABC123"}
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(212, 168, 67, 0.5)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#D4A843',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>
              {isEn ? 'Or paste full invitation link here:' : '¿Tienes un enlace de invitación? Pégalo aquí:'}
            </label>
            <input
              type="text"
              value={pastedLink}
              onChange={handleLinkPaste}
              placeholder={isEn ? "https://mister11.app/join-staff?code=..." : "https://mister11.app/join-staff?code=..."}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {isValidating && (
            <div style={{ fontSize: '0.85rem', color: '#D4A843', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={14} className="spin" /> {isEn ? 'Checking staff code...' : 'Verificando código de staff...'}
            </div>
          )}

          {errorMsg && !teamInfo && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FCA5A5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {teamInfo && (
            <div
              style={{
                backgroundColor: 'rgba(76, 175, 125, 0.15)',
                border: '1.5px solid #4CAF7D',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#FFFFFF'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#4CAF7D', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                {isEn ? 'Team Found' : 'Equipo Encontrado'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{teamInfo.teamName}</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                {isEn ? 'Staff Code Verified' : 'Código de Cuerpo Técnico Verificado'}
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '4px' }}>
                  {isEn ? 'Confirm Your Role' : 'Confirma tu Rol'}
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: '#1B3A2D',
                    color: '#FFFFFF',
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

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: '48px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>

            <button
              type="submit"
              disabled={isJoining || (!teamInfo && !inputCode.trim())}
              style={{
                flex: 2,
                minHeight: '48px',
                backgroundColor: teamInfo ? '#4CAF7D' : 'rgba(76, 175, 125, 0.6)',
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogIn size={18} />
              {isJoining
                ? (isEn ? 'Joining...' : 'Uniéndose...')
                : teamInfo
                ? (isEn ? 'CONFIRM JOIN' : 'CONFIRMAR UNIÓN')
                : (isEn ? 'SEARCH AND JOIN' : 'BUSCAR Y UNIRME')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
