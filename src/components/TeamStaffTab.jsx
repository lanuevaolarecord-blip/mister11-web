import React, { useState, useEffect } from 'react';
import { useTeamMembers, STAFF_ROLES } from '../hooks/useTeamMembers';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from './UpgradeModal';
import { showToast } from '../utils/toast';
import { ensureTeamCode } from '../utils/teamCode';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, addDoc, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Shield, UserPlus, Trash2, Mail, Copy, Check, Clock, Users, Award, KeyRound, Share2, CheckCircle2, XCircle } from 'lucide-react';
import { normalizeEmail } from '../utils/normalizeEmail';

export const TeamStaffTab = ({ activeTeam }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { canInviteStaff, limits } = usePlan();
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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
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

  const { getTeamPath } = useAuth();
  const [teamCode, setTeamCode] = useState(activeTeam?.teamCode || '');
  const [joinRequests, setJoinRequests] = useState([]);
  const [copiedTeamCode, setCopiedTeamCode] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const teamPath = activeTeam?.teamPath || (activeTeam?.id ? getTeamPath(activeTeam.id) : null);

  useEffect(() => {
    if (!activeTeam?.id || !teamPath) return;
    ensureTeamCode(activeTeam.id, teamPath, activeTeam.nombre || activeTeam.name, user?.uid)
      .then(code => {
        if (code) setTeamCode(code);
      })
      .catch(console.error);
  }, [activeTeam?.id, teamPath, user?.uid]);

  // Escuchar solicitudes de jugadores pendientes en tiempo real
  useEffect(() => {
    if (!teamPath) return;
    const reqsRef = collection(db, `${teamPath}/joinRequests`);
    const unsub = onSnapshot(reqsRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pending = all.filter(r => r.status === 'pending');
      setJoinRequests(pending);
    }, (err) => {
      console.warn('[TeamStaffTab] Error cargando solicitudes:', err);
    });
    return () => unsub();
  }, [teamPath]);

  const handleApproveRequest = async (request) => {
    if (!request || !teamPath) return;
    setProcessingId(request.id);
    try {
      // 1. Comprobar si ya existe una ficha para este jugador o usuario en la plantilla
      const playersColRef = collection(db, `${teamPath}/players`);
      const pSnap = await getDocs(playersColRef);
      const existingPlayerDoc = pSnap.docs.find(d => {
        const pData = d.data();
        return (request.requesterUid && (pData.requesterUid === request.requesterUid || pData.playerUid === request.requesterUid || pData.userId === request.requesterUid)) ||
               (request.requesterEmail && pData.email && pData.email.toLowerCase() === request.requesterEmail.toLowerCase()) ||
               (request.playerName && pData.name && pData.name.trim().toLowerCase() === request.playerName.trim().toLowerCase());
      });

      let assignedPlayerId;
      if (existingPlayerDoc) {
        assignedPlayerId = existingPlayerDoc.id;
        await updateDoc(doc(db, `${teamPath}/players`, assignedPlayerId), {
          name: request.playerName,
          fechaNacimiento: request.birthDate || existingPlayerDoc.data().fechaNacimiento || '',
          position: request.position || existingPlayerDoc.data().position || 'MC',
          number: request.jerseyNumber || existingPlayerDoc.data().number || '',
          requesterUid: request.requesterUid,
          requesterEmail: request.requesterEmail || '',
          currentStatus: 'active',
          updatedAt: serverTimestamp(),
        });
      } else {
        const newPlayerRef = await addDoc(playersColRef, {
          name: request.playerName,
          fechaNacimiento: request.birthDate,
          position: request.position || 'MC',
          number: request.jerseyNumber || '',
          requesterUid: request.requesterUid,
          requesterEmail: request.requesterEmail || '',
          currentStatus: 'active',
          category: activeTeam?.categoria || activeTeam?.category || 'General',
          createdAt: serverTimestamp(),
        });
        assignedPlayerId = newPlayerRef.id;
      }

      // 2. Registrar el rol en memberRoles del equipo
      const teamDocRef = doc(db, teamPath);
      await setDoc(teamDocRef, {
        memberRoles: {
          [request.requesterUid]: 'player'
        }
      }, { merge: true });

      // 3. Crear puntero en shared_teams del usuario
      const userSharedTeamRef = doc(db, `users/${request.requesterUid}/shared_teams`, activeTeam.id);
      await setDoc(userSharedTeamRef, {
        teamId: activeTeam.id,
        teamPath,
        teamName: activeTeam.nombre || activeTeam.name || 'Mi Equipo',
        role: 'player',
        playerId: assignedPlayerId,
        joinedAt: serverTimestamp(),
      });

      // 4. Registrar índices deterministas de identidad única (Server-Side)
      const rawEmail = request.requesterEmail || request.email || '';
      const emailNorm = normalizeEmail(rawEmail);
      if (request.requesterUid) {
        try {
          await setDoc(doc(db, 'playerIdentity', request.requesterUid), {
            email: rawEmail,
            emailNorm,
            teamId: activeTeam.id,
            playerId: assignedPlayerId,
            createdAt: serverTimestamp(),
          }, { merge: true });
        } catch (_) {}
      }
      if (emailNorm) {
        try {
          await setDoc(doc(db, 'playerIdentityByEmail', emailNorm), {
            uid: request.requesterUid || null,
            playerId: assignedPlayerId,
            teamId: activeTeam.id,
            teamPath,
            createdAt: serverTimestamp(),
          }, { merge: true });
        } catch (_) {}
      }

      // 5. Actualizar estado de la solicitud a 'approved'
      const reqDocRef = doc(db, `${teamPath}/joinRequests`, request.id);
      await updateDoc(reqDocRef, { status: 'approved', approvedAt: serverTimestamp(), playerId: assignedPlayerId });

      // 6. Actualizar solicitud en el perfil del usuario
      try {
        const userReqRef = doc(db, `users/${request.requesterUid}/join_requests`, request.id);
        await updateDoc(userReqRef, { status: 'approved', approvedAt: serverTimestamp(), playerId: assignedPlayerId });
      } catch (_) {}

      showToast(`¡Jugador ${request.playerName} aprobado e incorporado a la plantilla!`, 'success');
    } catch (err) {
      console.error('Error al aprobar solicitud:', err);
      showToast('Error al aprobar solicitud: ' + (err.message || 'Desconocido'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!request || !teamPath) return;
    if (!window.confirm(`¿Rechazar la solicitud de ${request.playerName}?`)) return;
    setProcessingId(request.id);
    try {
      const reqDocRef = doc(db, `${teamPath}/joinRequests`, request.id);
      await updateDoc(reqDocRef, { status: 'rejected', rejectedAt: serverTimestamp() });

      try {
        const userReqRef = doc(db, `users/${request.requesterUid}/join_requests`, request.id);
        await updateDoc(userReqRef, { status: 'rejected', rejectedAt: serverTimestamp() });
      } catch (_) {}

      showToast('Solicitud rechazada.', 'info');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      showToast('Error al rechazar solicitud.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyTeamCode = async () => {
    if (!teamCode) return;
    const ok = await copyToClipboard(teamCode);
    if (ok) {
      setCopiedTeamCode(true);
      showToast('Código de equipo copiado al portapapeles.', 'success');
      setTimeout(() => setCopiedTeamCode(false), 2500);
    }
  };

  const handleShareTeamLink = async () => {
    if (!teamCode) return;
    const shareUrl = `${window.location.origin}/join-team?code=${teamCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${activeTeam?.nombre || 'nuestro equipo'} en Míster11`,
          text: `¡Hola! Únete al equipo ${activeTeam?.nombre || 'Mi Equipo'} en Míster11 con este código: ${teamCode}\nEnlace directo: ${shareUrl}`,
          url: shareUrl
        });
      } catch (_) {}
    } else {
      await copyToClipboard(shareUrl);
      showToast('Enlace de invitación de jugadores copiado.', 'success');
    }
  };

  const textColorPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textColorSecondary = darkMode ? '#CBD5E1' : '#475569';
  const cardBackgroundColor = darkMode ? '#1A2E26' : '#FFFFFF';
  const inputBgColor = darkMode ? '#0E1C14' : '#F8FAFC';
  const borderColorVal = darkMode ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';

  return (
    <div className="team-staff-tab" style={{ padding: '10px 0' }}>
      {/* TARJETA DE CÓDIGO DE EQUIPO Y PORTAL DE JUGADORES */}
      <div style={{
        background: darkMode ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(27, 58, 45, 0.6) 100%)' : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        border: `1.5px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`,
        borderRadius: '14px',
        padding: '18px 20px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <KeyRound size={18} /> Código Único para Jugadores y Familias
            </div>
            <h4 style={{ margin: '4px 0 2px 0', fontSize: '1.25rem', color: textColorPrimary, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px' }}>
              {teamCode || 'Generando código...'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: textColorSecondary }}>
              Comparte este código para que los jugadores o sus padres se unan desde el Portal del Jugador (/join-team).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-outline"
              onClick={handleCopyTeamCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                minHeight: '44px'
              }}
            >
              {copiedTeamCode ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              {copiedTeamCode ? 'Copiado' : 'Copiar Código'}
            </button>

            <button
              className="btn-primary"
              onClick={handleShareTeamLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                minHeight: '44px',
                background: '#10B981'
              }}
            >
              <Share2 size={16} /> Compartir Enlace
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE SOLICITUDES PENDIENTES DE JUGADORES */}
      {joinRequests.length > 0 && (
        <div style={{
          background: darkMode ? 'rgba(234, 179, 8, 0.08)' : '#FEFCE8',
          border: `1.5px solid ${darkMode ? 'rgba(234, 179, 8, 0.3)' : '#FDE047'}`,
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={20} color="#EAB308" />
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: textColorPrimary, fontWeight: 800 }}>
              Solicitudes de Ingreso de Jugadores ({joinRequests.length})
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {joinRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: cardBackgroundColor,
                  border: `1px solid ${borderColorVal}`,
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: textColorPrimary }}>
                      {req.playerName}
                    </span>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {req.position} {req.jerseyNumber ? `· #${req.jerseyNumber}` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: textColorSecondary, marginTop: '4px' }}>
                    📅 Nacimiento: <strong>{req.birthDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    👤 Solicitante: {req.requesterName} ({req.requesterEmail || 'Email'})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'}`, paddingTop: '10px' }}>
                  <button
                    onClick={() => handleApproveRequest(req)}
                    disabled={processingId === req.id}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      background: '#10B981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {processingId === req.id ? 'Aprobando...' : 'Aprobar'}
                  </button>

                  <button
                    onClick={() => handleRejectRequest(req)}
                    disabled={processingId === req.id}
                    style={{
                      minHeight: '44px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 14px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cabecera y botón invitar staff */}
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
              if (!canInviteStaff(members.length)) {
                setIsUpgradeModalOpen(true);
                return;
              }
              setGeneratedLink('');
              setIsInviteModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 'bold', minHeight: '44px' }}
          >
            <UserPlus size={18} />
            Invitar Staff ({members.length}/{limits.staffLimit === Infinity ? '∞' : limits.staffLimit})
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

      {/* Modal de Upgrade cuando se supera el límite de staff */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        message={`Has alcanzado el límite de ${limits.staffLimit === 1 ? '1 entrenador' : `${limits.staffLimit} miembros de staff`} de tu plan actual. Elige un Plan Club para colaborar con más entrenadores y especialistas.`}
      />
    </div>
  );
};
