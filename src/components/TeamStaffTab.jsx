import React, { useState } from 'react';
import { useTeamMembers, STAFF_ROLES } from '../hooks/useTeamMembers';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { Shield, UserPlus, Trash2, Mail, Copy, Check, Clock, Users, Award } from 'lucide-react';

export const TeamStaffTab = ({ activeTeam }) => {
  const { user } = useAuth();
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
  } = useTeamMembers();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('second_coach');
  const [isInviting, setIsInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const res = await inviteMember(inviteEmail, selectedRole);
      if (res?.inviteUrl) {
        setGeneratedLink(res.inviteUrl);
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Error enviando invitación:', err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast('Enlace copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

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
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--accent-gold, #D4A843)" />
            Cuerpo Técnico y Colaboradores
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Equipo: <strong>{activeTeam?.nombre || activeTeam?.name || 'Mi Equipo'}</strong> · Sincronización en tiempo real
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
                background: 'var(--card-bg, #1A2E26)',
                border: `1px solid ${roleData.color}40`,
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {member.displayName || member.email?.split('@')[0] || 'Entrenador'}
                        {isSelf && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(Tú)</span>}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 12px', lineHeight: '1.4' }}>
                  {roleData.description}
                </p>
              </div>

              {/* Acciones de administración de rol */}
              {permissions.canManageStaff && !isOwner && !isSelf && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '10px' }}>
                  <select
                    value={member.role || 'assistant_coach'}
                    onChange={(e) => updateMemberRole(member.uid || member.id, e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}
                  >
                    {Object.values(STAFF_ROLES).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>

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
                      fontSize: '0.75rem'
                    }}
                  >
                    <Trash2 size={14} /> Quitar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(212, 168, 67, 0.4)',
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
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {inv.email}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
          <div className="modal-content" style={{ maxWidth: '460px', padding: '24px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="var(--accent-gold, #D4A843)" />
              Invitar Miembro al Cuerpo Técnico
            </h3>

            {!generatedLink ? (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Introduce el correo electrónico y selecciona el rol. El usuario podrá acceder y colaborar en tiempo real.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Correo Electrónico
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="entrenador@ejemplo.com"
                      required
                      style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Rol en el Cuerpo Técnico
                  </label>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}
                  >
                    {Object.values(STAFF_ROLES).filter(r => r.id !== 'first_coach').map(r => (
                      <option key={r.id} value={r.id}>
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
                    {isInviting ? 'Generando...' : 'Generar Invitación'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Check size={28} />
                </div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>¡Invitación Generada!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Copia y envía este enlace al miembro del cuerpo técnico para que se una al equipo:
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                  />
                  <button className="btn-primary" onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

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
