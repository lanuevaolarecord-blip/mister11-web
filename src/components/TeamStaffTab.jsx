import React, { useState } from 'react';
import { useTeamMembers, STAFF_ROLES } from '../hooks/useTeamMembers';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showToast } from '../utils/toast';
import { Shield, UserPlus, Trash2, Mail, Copy, Check, Clock, Users, Award } from 'lucide-react';

export const TeamStaffTab = ({ activeTeam }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const {
    members,
    loading,
    invitations,
    currentUserRole,
    permissions,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation
  } = useTeamMembers(activeTeam?.id);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('second_coach');
  const [isInviting, setIsInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSendInvite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    setIsInviting(true);
    try {
      const res = await inviteMember(inviteEmail, selectedRole);
      if (res?.inviteUrl) {
        setGeneratedLink(res.inviteUrl);
        setGeneratedCode(res.inviteCode || '');
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Error enviando invitación:', err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    const ok = await copyToClipboard(generatedLink);
    if (ok) {
      setCopied(true);
      showToast('Enlace copiado al portapapeles.', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareNative = async () => {
    if (!generatedLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al Cuerpo Técnico de ${activeTeam?.nombre || 'Mi Equipo'} - Míster11`,
          text: `¡Hola! Únete al cuerpo técnico de ${activeTeam?.nombre || 'Mi Equipo'} en Míster11 con este enlace:\n${generatedLink}\nCódigo de acceso: ${generatedCode}`,
          url: generatedLink
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    const ok = await copyToClipboard(generatedCode);
    if (ok) {
      setCopiedCode(true);
      showToast('Código de 6 dígitos copiado.', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const textColorPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textColorSecondary = darkMode ? '#CBD5E1' : '#475569';
  const cardBackgroundColor = darkMode ? '#1A2E26' : '#FFFFFF';
  const inputBgColor = darkMode ? '#0E1C14' : '#F8FAFC';
  const borderColorVal = darkMode ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';

  return (
    <div className="team-staff-tab" style={{ padding: '10px 0' }}>
      {/* Cabecera y botón invitar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: textColorPrimary, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--accent-gold, #D4A843)" />
            Cuerpo Técnico y Colaboradores
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: textColorSecondary, fontWeight: 600 }}>
            Equipo: <strong style={{ color: '#D4A843' }}>{activeTeam?.nombre || activeTeam?.name || 'Mi Equipo'}</strong> · Sincronización en tiempo real
          </p>
        </div>

        {permissions.canManageStaff && (
          <button
            className="btn-primary"
            onClick={() => {
              setGeneratedLink('');
              setIsInviteModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 'bold' }}
          >
            <UserPlus size={18} />
            Invitar Miembro
          </button>
        )}
      </div>

      {/* Lista de Miembros Actuales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {members.map((member) => {
          const roleData = STAFF_ROLES[member.role?.toUpperCase()] || {
            label: member.role || 'Cuerpo Técnico',
            badge: member.role || 'Miembro',
            color: '#10B981',
            description: 'Colaborador del cuerpo técnico.'
          };

          const isSelf = member.uid === user?.uid || member.id === user?.uid;
          const isOwner = member.role === 'first_coach';

          return (
            <div
              key={member.id || member.uid}
              style={{
                backgroundColor: cardBackgroundColor,
                border: `1.5px solid ${darkMode ? `${roleData.color}50` : '#E2E8F0'}`,
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.06)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: `${roleData.color}20`,
                      color: roleData.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      border: `2px solid ${roleData.color}`
                    }}>
                      {(member.displayName || member.email || 'ET').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: textColorPrimary, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {member.displayName || member.email?.split('@')[0] || 'Entrenador'}
                        {isSelf && <span style={{ fontSize: '0.75rem', color: darkMode ? '#D4A843' : '#1B3A2D', fontWeight: 700 }}>(Tú)</span>}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: textColorSecondary, fontWeight: 600 }}>
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: `${roleData.color}20`,
                    color: roleData.color,
                    border: `1px solid ${roleData.color}50`
                  }}>
                    {roleData.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: textColorSecondary, margin: '8px 0 12px', lineHeight: '1.4', fontWeight: 500 }}>
                  {roleData.description}
                </p>
              </div>

              {/* Acciones de administración de rol */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, paddingTop: '12px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: textColorSecondary, fontWeight: 700 }}>Cambiar Rol:</span>
                  <select
                    value={member.role || (isOwner ? 'admin' : 'assistant')}
                    onChange={(e) => updateMemberRole(member.uid || member.id, e.target.value)}
                    style={{
                      backgroundColor: inputBgColor,
                      border: `1.5px solid ${borderColorVal}`,
                      color: textColorPrimary,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {Object.values(STAFF_ROLES).map(r => (
                      <option key={r.id} value={r.id} style={{ background: inputBgColor, color: textColorPrimary }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isSelf && permissions.canManageStaff && (
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de eliminar a ${member.displayName || member.email} del cuerpo técnico?`)) {
                        removeMember(member.uid || member.id);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: 'none',
                      color: '#EF4444',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={14} /> Quitar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ fontSize: '1rem', color: textColorPrimary, fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#EAB308" />
            Invitaciones Pendientes ({invitations.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {invitations.map((inv) => {
              const roleData = STAFF_ROLES[inv.role?.toUpperCase()] || { label: inv.role };
              const link = `${window.location.origin}/join-team/${inv.token || inv.id}`;

              return (
                <div
                  key={inv.id}
                  style={{
                    backgroundColor: cardBackgroundColor,
                    border: `1.5px dashed ${darkMode ? 'rgba(212, 168, 67, 0.5)' : '#D4A843'}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: textColorPrimary }}>
                      {inv.email}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: textColorSecondary, fontWeight: 600 }}>
                      Rol: <strong style={{ color: '#D4A843' }}>{roleData.label}</strong> · Creada: {new Date(inv.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        navigator.clipboard.writeText(link);
                        showToast('Enlace de invitación copiado.', 'success');
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Copy size={14} /> Copiar Enlace
                    </button>

                    {permissions.canManageStaff && (
                      <button
                        onClick={() => cancelInvitation(inv.token || inv.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '6px'
                        }}
                        title="Cancelar invitación"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Invitar Miembro */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: cardBackgroundColor,
              border: `1.5px solid ${borderColorVal}`
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', color: textColorPrimary, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="var(--accent-gold, #D4A843)" />
              Invitar Miembro al Cuerpo Técnico
            </h3>

            {!generatedLink ? (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: textColorSecondary, margin: 0, fontWeight: 500 }}>
                  Introduce el correo electrónico y selecciona el rol. El usuario podrá acceder y colaborar en tiempo real.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: textColorPrimary }}>
                    Correo Electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color={textColorSecondary} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="entrenador@ejemplo.com"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 38px',
                        borderRadius: '8px',
                        border: `1.5px solid ${borderColorVal}`,
                        backgroundColor: inputBgColor,
                        color: textColorPrimary,
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: textColorPrimary }}>
                    Rol en el Cuerpo Técnico
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${borderColorVal}`,
                      backgroundColor: inputBgColor,
                      color: textColorPrimary,
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    {Object.values(STAFF_ROLES).filter(r => r.id !== 'first_coach').map(r => (
                      <option key={r.id} value={r.id} style={{ background: inputBgColor, color: textColorPrimary }}>
                        {r.label} — {r.description.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={() => setIsInviteModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={isInviting}>
                    {isInviting ? 'Generando...' : (inviteEmail ? 'Enviar Invitación' : '⚡ Generar Enlace / Código')}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Check size={28} />
                </div>
                <h4 style={{ color: textColorPrimary, fontWeight: 800, marginBottom: '8px' }}>¡Invitación Generada!</h4>
                <p style={{ fontSize: '0.85rem', color: textColorSecondary, marginBottom: '16px', fontWeight: 500 }}>
                  Copia y envía este enlace al miembro del cuerpo técnico para que se una al equipo:
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${borderColorVal}`,
                      backgroundColor: inputBgColor,
                      color: textColorPrimary,
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                  <button className="btn-primary" onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    className="btn-primary full-width"
                    onClick={handleShareNative}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#2E7D5C', fontWeight: 'bold' }}
                  >
                    📲 Compartir Enlace (WhatsApp / Apps)
                  </button>
                </div>

                {generatedCode && (
                  <div style={{
                    background: 'rgba(212, 168, 67, 0.1)',
                    border: '1px solid rgba(212, 168, 67, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: textColorSecondary, display: 'block', fontWeight: 600 }}>Código de 6 dígitos:</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--accent-gold, #D4A843)', letterSpacing: '2px' }}>{generatedCode}</strong>
                    </div>
                    <button className="btn-outline" onClick={handleCopyCode} style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                )}

                <button className="btn-outline full-width" onClick={() => setIsInviteModalOpen(false)}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
