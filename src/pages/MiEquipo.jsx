import React, { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import { usePlayerSeasonStats } from '../hooks/usePlayerSeasonStats';
import { calculatePlayerMatchStats } from '../utils/playerMatchStats';
import UpgradeModal from '../components/UpgradeModal';
import { calcularEdad } from '../utils/calcularEdad';
import { generateExpediente } from '../utils/pdfGenerator';
import { normalizeText } from '../utils/normalizeInput';
import { normalizeEmail } from '../utils/normalizeEmail';
import { storage, db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { showToast } from '../utils/toast';
import { savePlayerIdentity, deletePlayerIdentity } from '../utils/playerIdentity';
import { sendChatNotification } from '../hooks/useLocalNotifications';
import PlayerHealthTab from '../components/PlayerHealthTab';
import PlayerPlansTab from '../components/PlayerPlansTab';
import { TeamAttendanceTab } from '../components/TeamAttendanceTab';
import { PlayerAttendanceSubTab } from '../components/PlayerAttendanceSubTab';
import { TeamStaffTab } from '../components/TeamStaffTab';
import { PlayerTabs } from '../components/player/PlayerTabs';
import { PlayerChatTab } from '../components/player/PlayerChatTab';
import { MessageSquare, FileText, Pencil, Edit, X, UserPlus, Share2, Mail, Trash2, Bell, Megaphone, Flag, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { SpellCheckedTextarea } from '../components/ui/SpellCheckedTextarea';
import './MiEquipo.css';

const POSITIONS = ['TODOS', 'POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

const formatPosition = (pos, isEn) => {
  if (!pos) return '';
  if (pos === 'TODOS') return isEn ? 'ALL' : 'TODOS';
  const map = {
    'POR': isEn ? 'GK' : 'POR',
    'DEF': isEn ? 'DEF' : 'DEF',
    'LTD': isEn ? 'RB' : 'LTD',
    'LTI': isEn ? 'LB' : 'LTI',
    'MCD': isEn ? 'CDM' : 'MCD',
    'MC':  isEn ? 'CM' : 'MC',
    'MCO': isEn ? 'CAM' : 'MCO',
    'EXT': isEn ? 'W' : 'EXT',
    'DEL': isEn ? 'ST' : 'DEL',
  };
  return map[pos] || pos;
};

const stringToColor = (str) => {
  if (!str) return '#1B3A2D';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 40%)`;
};

const emptyPlayer = {
  name: '', 
  number: '', 
  position: 'MC', 
  age: '', 
  category: 'Alevín A', 
  weight: '', 
  height: '', 
  foot: 'Derecho', 
  currentStatus: 'active',
  medicalObservations: '',
  injuryHistory: [],
  fechaNacimiento: '',
  avatarUrl: ''
};

const MiEquipo = () => {
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro, limits, isProActive } = usePlan();
  const { players, loading, addPlayer, updatePlayer, removePlayer } = usePlayers(activeTeamId);
  const { matches, allPlayersStats } = usePlayerSeasonStats(activeTeamId);
  const { t, isEn, fmtPlural } = useTranslation();
  const [mainTeamTab, setMainTeamTab] = useState('squad'); // 'squad' | 'attendance'
  const [filter, setFilter] = useState('TODOS');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });

  const teamPath = activeTeam?.teamPath || (activeTeamId && getTeamPath ? getTeamPath(activeTeamId) : (user?.uid && activeTeamId ? `users/${user.uid}/teams/${activeTeamId}` : ''));

  // Estadísticas sincronizadas con el módulo de Partidos
  const playersStatsMap = useMemo(() => allPlayersStats(players), [players, allPlayersStats]);
  const playerSeasonStats = useMemo(() => calculatePlayerMatchStats(selectedPlayer?.id, matches), [selectedPlayer?.id, matches]);
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(emptyPlayer);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── REC-5: Estado del Publicador de Comunicados Oficiales ──
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('normal');
  const [isPublishingAnn, setIsPublishingAnn] = useState(false);

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) {
      showToast(isEn ? 'Please enter a title and message for the announcement.' : 'Escribe un título y el mensaje del comunicado.', 'warning');
      return;
    }
    const cleanTeamPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
    if (!cleanTeamPath) {
      showToast(isEn ? 'Active team not found.' : 'No se encontró el equipo activo.', 'error');
      return;
    }

    setIsPublishingAnn(true);
    try {
      const annCollectionRef = collection(db, `${cleanTeamPath}/announcements`);
      await addDoc(annCollectionRef, {
        title: announcementTitle.trim(),
        message: announcementMsg.trim(),
        authorName: user?.displayName || 'Cuerpo Técnico',
        authorUid: user?.uid || 'staff',
        priority: announcementPriority,
        createdAt: serverTimestamp()
      });
      showToast(isEn ? '📢 Announcement published successfully to the whole squad!' : '📢 ¡Comunicado publicado con éxito para toda la plantilla!', 'success');
      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setIsAnnouncementModalOpen(false);
    } catch (err) {
      console.error('Error publicando comunicado:', err);
      showToast(isEn ? 'Error publishing the announcement.' : 'Error al publicar el comunicado.', 'error');
    } finally {
      setIsPublishingAnn(false);
    }
  };
  const [formError, setFormError] = useState('');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);


  // Sincronizar deterministamente los índices de identidad por email para jugadores existentes
  useEffect(() => {
    if (!players || players.length === 0 || !activeTeam?.id || typeof getTeamPath !== 'function') return;
    const teamPathStr = getTeamPath(activeTeam.id);
    const tName = activeTeam.nombre || activeTeam.name || 'Mi Equipo';

    players.forEach(async (p) => {
      const rawEmail = p.email || p.requesterEmail;
      if (rawEmail && p.id) {
        try {
          await savePlayerIdentity({
            email: rawEmail,
            teamId: activeTeam.id,
            teamPath: teamPathStr,
            playerId: p.id,
            teamName: tName,
            role: 'player',
            uid: p.requesterUid || p.playerUid || p.userId || null
          });
        } catch (_) {}
      }
    });
  }, [players, activeTeam?.id, getTeamPath]);

  // Escuchar mensajes no leídos del chat de todos los jugadores para el entrenador
  const [unreadThreads, setUnreadThreads] = useState({});
  const lastCoachNotifiedMsgRef = React.useRef({});

  useEffect(() => {
    if (!activeTeam?.id || typeof getTeamPath !== 'function' || !user) return;
    const teamPathStr = getTeamPath(activeTeam.id);
    if (!teamPathStr) return;

    const cleanP = teamPathStr.replace(/^\/+|\/+$/g, '');
    const threadsCol = collection(db, `${cleanP}/threads`);
    const unsub = onSnapshot(threadsCol, (snap) => {
      const unreadMap = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const pId = d.id;
        const isUnread = data.unreadByCoach === true && data.lastSenderUid !== user.uid;
        if (isUnread) {
          unreadMap[pId] = true;
          // Si es un mensaje nuevo, notificar al míster
          if (data.lastMessage && lastCoachNotifiedMsgRef.current[pId] !== data.lastMessage) {
            lastCoachNotifiedMsgRef.current[pId] = data.lastMessage;
            sendChatNotification({
              title: `💬 ${isEn ? 'Message from' : 'Mensaje de'} ${data.playerName || (isEn ? 'Player' : 'Jugador')}`,  
              body: data.lastMessage,
              senderName: data.playerName || (isEn ? 'Player' : 'Jugador'),
              extra: { playerId: pId }
            });
            showToast(`💬 ${isEn ? 'Message from' : 'Mensaje de'} ${data.playerName || (isEn ? 'Player' : 'Jugador')}: "${data.lastMessage}"`, 'info');
          }
        }
      });
      setUnreadThreads(unreadMap);
    }, (err) => {
      console.warn('[MiEquipo] Error escuchando hilos de chat:', err);
    });

    return () => unsub();
  }, [activeTeam?.id, getTeamPath, user]);

  // Escuchar denuncias y moderación UGC del equipo
  const [teamReports, setTeamReports] = useState([]);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [deletingReportMsgId, setDeletingReportMsgId] = useState(null);
  const lastNotifiedReportIdRef = React.useRef(new Set());

  useEffect(() => {
    if (!activeTeam?.id || typeof getTeamPath !== 'function' || !user) return;
    const teamPathStr = getTeamPath(activeTeam.id);
    if (!teamPathStr) return;

    const cleanP = teamPathStr.replace(/^\/+|\/+$/g, '');
    const reportsCol = collection(db, `${cleanP}/teamReports`);
    const q = query(reportsCol, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const reps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamReports(reps);

      reps.filter(r => r.status === 'open').forEach(r => {
        if (!lastNotifiedReportIdRef.current.has(r.id)) {
          lastNotifiedReportIdRef.current.add(r.id);
          showToast(`🚩 ${isEn ? 'New chat report' : 'Nueva denuncia en chat'}: "${(r.msgText || '').substring(0, 30)}..."`, 'error');
        }
      });
    }, (err) => {
      console.warn('[MiEquipo] Error escuchando denuncias:', err);
    });

    return () => unsub();
  }, [activeTeam?.id, getTeamPath, user]);

  const openReportsCount = useMemo(() => {
    return teamReports.filter(r => r.status === 'open').length;
  }, [teamReports]);

  const handleResolveReport = async (report) => {
    if (!report?.id || !activeTeam?.id) return;
    setResolvingReportId(report.id);
    try {
      const cleanP = getTeamPath(activeTeam.id).replace(/^\/+|\/+$/g, '');
      const repRef = doc(db, `${cleanP}/teamReports`, report.id);
      await updateDoc(repRef, { status: 'resolved', resolvedAt: serverTimestamp(), resolvedBy: user.uid });
      showToast(t('player.chat.moderation.resolved'), 'success');
    } catch (err) {
      console.error('Error resolving report:', err);
      showToast(isEn ? 'Error resolving report.' : 'Error al resolver reporte.', 'error');
    } finally {
      setResolvingReportId(null);
    }
  };

  const handleDeleteReportedMessage = async (report) => {
    if (!report?.id || !report?.msgId || !report?.playerId || !activeTeam?.id) return;
    if (!window.confirm(t('player.chat.moderation.deleteConfirm'))) return;
    setDeletingReportMsgId(report.id);
    try {
      const cleanP = getTeamPath(activeTeam.id).replace(/^\/+|\/+$/g, '');
      const msgRef = doc(db, `${cleanP}/threads/${report.playerId}/messages`, report.msgId);
      await deleteDoc(msgRef);

      const repRef = doc(db, `${cleanP}/teamReports`, report.id);
      await updateDoc(repRef, { 
        status: 'resolved', 
        deletedMessage: true, 
        resolvedAt: serverTimestamp(), 
        resolvedBy: user.uid 
      });

      showToast(t('player.chat.moderation.msgDeleted'), 'success');
    } catch (err) {
      console.error('Error deleting reported message:', err);
      showToast(isEn ? 'Error deleting message.' : 'Error al eliminar mensaje.', 'error');
    } finally {
      setDeletingReportMsgId(null);
    }
  };

  const filteredPlayers = filter === 'TODOS' 
    ? players 
    : players.filter(p => p.position === filter);

  const toggleInjuries = async (player) => {
    try {
      await updatePlayer(player.id, { injuries: !player.injuries });
    } catch (error) {
      alert(isEn ? 'Error updating medical status.' : 'Error al actualizar estado médico.');
    }
  };

  const getInitials = (name) => {
    if(!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
      const isPng = file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png');

      // 1. Si es SVG vectorial, leer directamente con FileReader sin compresión raster
      if (isSvg) {
        const svgBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        setEditData(prev => ({ ...prev, photoFile: file, photoPreview: svgBase64 }));
        return;
      }

      // 2. Para PNG, JPEG, WebP y otros formatos (GIF, AVIF, HEIC, etc.)
      const targetFileType = isPng ? 'image/png' : (file.type || 'image/jpeg');
      let base64data = null;
      let finalFile = file;

      try {
        const options = {
          maxSizeMB: isPng ? 0.4 : 0.25,
          maxWidthOrHeight: 512,
          useWebWorker: true,
          fileType: targetFileType
        };
        finalFile = await imageCompression(file, options);
        base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(finalFile);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
      } catch (compressionErr) {
        console.warn("Compresión no disponible para este formato, procesando con Canvas nativo:", compressionErr);
        base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_DIM = 512;
              let w = img.width;
              let h = img.height;
              if (w > h && w > MAX_DIM) {
                h = Math.round((h * MAX_DIM) / w);
                w = MAX_DIM;
              } else if (h > MAX_DIM) {
                w = Math.round((w * MAX_DIM) / h);
                h = MAX_DIM;
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? 0.92 : 0.8));
            };
            img.onerror = () => resolve(ev.target.result);
            img.src = ev.target.result;
          };
          reader.onerror = reject;
        });
      }

      setEditData(prev => ({ ...prev, photoFile: finalFile, photoPreview: base64data }));
    } catch (error) {
      console.error("Error al procesar foto del jugador:", error);
      alert(isEn ? 'Could not process the image. Please check it is a valid image file (PNG, JPG, WebP, SVG, etc.).' : 'No se pudo procesar la imagen. Verifica que sea un archivo de imagen válido (PNG, JPG, WebP, SVG, etc.).');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // calcularEdad importada desde src/utils/calcularEdad.js

  // -- CRUD Actions --
  const handleOpenForm = (player = null) => {
    if (!player && players.length >= limits.PLAYERS) {
      setUpgradeModal({ open: true, message: isEn ? `Squad full: maximum ${limits.PLAYERS} players.` : `Plantilla completa: máximo ${limits.PLAYERS} jugadores.` });
      return;
    }
    if (player) {
      setEditData({ ...player });
    } else {
      setEditData({ ...emptyPlayer });
    }
    setConsentChecked(false);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSavePlayer = async () => {
    if(!editData.name || !editData.number || (!editData.fechaNacimiento && !editData.birthDate)) {
      setFormError(isEn ? 'Name, shirt number and date of birth are required.' : 'El nombre, el dorsal y la fecha de nacimiento son obligatorios.');
      return;
    }
    if (!consentChecked) {
      setFormError(isEn ? 'You must confirm that you will obtain parental consent.' : 'Debes confirmar que te responsabilizas de obtener el consentimiento parental.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const playerDataToSave = { ...editData };
      delete playerDataToSave.photoFile;
      delete playerDataToSave.photoPreview;

      let savedPlayerId = editData.id;

      if (editData.id) {
        await updatePlayer(editData.id, playerDataToSave);
      } else {
        savedPlayerId = await addPlayer(playerDataToSave);
      }

      // If there is a new photo to upload
      if (editData.photoFile && savedPlayerId) {
        const teamPathClean = getTeamPath(activeTeam?.id).replace(/^\/+|\/+$/g, '');
        const fileRef = ref(storage, `${teamPathClean}/players/${savedPlayerId}/avatar.webp`);
        await uploadBytes(fileRef, editData.photoFile);
        const avatarUrl = await getDownloadURL(fileRef);
        await updatePlayer(savedPlayerId, { avatarUrl });
        playerDataToSave.avatarUrl = avatarUrl;
      } else if (editData.avatarUrl === '') {
        // If photo was explicitly removed
        await updatePlayer(savedPlayerId, { avatarUrl: '' });
        playerDataToSave.avatarUrl = '';
      }

      if (selectedPlayer && selectedPlayer.id === savedPlayerId) {
        setSelectedPlayer({ ...selectedPlayer, ...playerDataToSave });
      }

      // ─── VINCULACIÓN DETERMINISTA AUTOMÁTICA POR EMAIL MULTI-EQUIPO ─────
      const rawEmail = editData.email || editData.requesterEmail || '';
      if (rawEmail && savedPlayerId && activeTeam?.id) {
        try {
          await savePlayerIdentity({
            email: rawEmail,
            teamId: activeTeam.id,
            teamPath: getTeamPath(activeTeam.id),
            playerId: savedPlayerId,
            teamName: activeTeam.nombre || activeTeam.name || 'Mi Equipo',
            role: 'player',
            uid: editData.requesterUid || editData.playerUid || editData.userId || null
          });
        } catch (err) {
          console.warn('[MiEquipo] Error guardando playerIdentityByEmail:', err);
        }
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error('Error al guardar jugador:', error);
      setFormError(isEn ? 'Could not save. Check your connection and try again.' : 'No se pudo guardar. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    const playerToDelete = players.find(p => p.id === id) || (selectedPlayer?.id === id ? selectedPlayer : null);
    const pName = playerToDelete?.name || (isEn ? 'this player' : 'este jugador');
    if (window.confirm(isEn ? `Are you sure you want to remove ${pName} from the team? Their linked access will be revoked.` : `¿Seguro que deseas eliminar a ${pName} del equipo? Se cancelará su acceso vinculado.`)) {
      try {
        await removePlayer(id);
        
        // Limpiar índices deterministas y accesos compartidos
        const rawEmail = playerToDelete?.email || playerToDelete?.requesterEmail;
        const playerUid = playerToDelete?.requesterUid || playerToDelete?.playerUid || playerToDelete?.userId;
        
        if (rawEmail && activeTeam?.id) {
          try {
            await deletePlayerIdentity(rawEmail, activeTeam.id);
          } catch (_) {}
        }
        if (playerUid) {
          try {
            if (activeTeam?.id) {
              await deleteDoc(doc(db, `users/${playerUid}/shared_teams`, activeTeam.id));
            }
            await deleteDoc(doc(db, 'playerIdentity', playerUid));
          } catch (_) {}
        }

        if (selectedPlayer?.id === id) {
          setSelectedPlayer(null);
        }
        setIsFormOpen(false);
        showToast(isEn ? `Player ${pName} removed from the team` : `Jugador ${pName} eliminado del equipo`, 'success');
      } catch (error) {
        console.error('Error al eliminar jugador:', error);
        alert(isEn ? 'Error deleting player.' : 'Error al eliminar jugador.');
      }
    }
  };

  if (loading) {
    return <div className="loading-state">{t('equipo.loadingSquad')}</div>;
  }

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">{t('equipo.title')}</h1>
            <p className="page-subtitle">{fmtPlural(players.length, 'team.squadCount')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAnnouncementModalOpen(true)}
            style={{
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '10px',
              border: '1.5px solid #10B981',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Megaphone size={16} />
            <span>📢 {t('equipo.publishAnnouncement')}</span>
          </button>
        </div>

        {/* Selector de Pestañas a Nivel de Equipo */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto' }}>
          <button 
            type="button"
            className={`chip ${mainTeamTab === 'squad' ? 'active' : ''}`}
            style={{ fontWeight: '800', minHeight: '44px', padding: '0 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setMainTeamTab('squad')}
          >
            <span>👥</span>
            <span>{t('equipo.tab.squad') || 'Plantilla'}</span>
          </button>
          <button 
            type="button"
            className={`chip ${mainTeamTab === 'attendance' ? 'active' : ''}`}
            style={{ fontWeight: '800', minHeight: '44px', padding: '0 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setMainTeamTab('attendance')}
          >
            <span>📋</span>
            <span>{t('equipo.tab.attendance') || 'Control de Asistencia'}</span>
          </button>
          <button 
            type="button"
            className={`chip ${mainTeamTab === 'staff' ? 'active' : ''}`}
            style={{ fontWeight: '800', minHeight: '44px', padding: '0 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setMainTeamTab('staff')}
          >
            <span>🛡️</span>
            <span>{t('equipo.tab.staff') || 'Cuerpo Técnico'}</span>
          </button>

          {teamReports.length > 0 && (
            <button 
              type="button"
              className={`chip ${isModerationModalOpen ? 'active' : ''}`}
              style={{ 
                fontWeight: '800', 
                minHeight: '44px', 
                padding: '0 18px', 
                fontSize: '13px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: openReportsCount > 0 ? 'rgba(239, 68, 68, 0.15)' : undefined,
                color: openReportsCount > 0 ? '#EF4444' : undefined,
                borderColor: openReportsCount > 0 ? '#EF4444' : undefined
              }}
              onClick={() => setIsModerationModalOpen(true)}
            >
              <Flag size={15} color={openReportsCount > 0 ? '#EF4444' : 'currentColor'} />
              <span>{t('player.chat.moderation.badge') || 'Reportes'} {openReportsCount > 0 && `(${openReportsCount})`}</span>
            </button>
          )}
        </div>

        {mainTeamTab === 'squad' && (
          <div className="filter-chips" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {POSITIONS.map(pos => (
              <button 
                key={pos} 
                className={`chip ${filter === pos ? 'active' : ''}`}
                onClick={() => setFilter(pos)}
              >
                {formatPosition(pos, isEn)}
              </button>
            ))}
          </div>
        )}
      </header>

      {mainTeamTab === 'staff' ? (
        <TeamStaffTab activeTeam={activeTeam} />
      ) : mainTeamTab === 'attendance' ? (
        <TeamAttendanceTab players={players} activeTeam={activeTeam} />
      ) : players.length === 0 ? (
        <div className="empty-team-state">
          <div className="empty-icon">⚽</div>
          <h2>{isEn ? 'Your squad is empty' : 'Tu plantilla está vacía'}</h2>
          <p>{isEn ? 'Add your first players to start managing your team.' : 'Añade a tus primeros jugadores para empezar a gestionar tu equipo.'}</p>
          <button className="btn-primary-new" onClick={() => handleOpenForm(null)}>{t('player.addPlayer')}</button>
        </div>
      ) : (
        <div className="grid-8-cols">
          {filteredPlayers.map(player => {
            const pStats = playersStatsMap[player.id] || { goals: 0, matchesPlayed: 0 };
            return (
              <div key={player.id} className="card-base" style={{ padding: '0', cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden' }} onClick={() => setSelectedPlayer(player)}>
                <div style={{ background: 'var(--accent-green-light)', height: '60px', width: '100%' }}></div>
                <div style={{ position: 'relative', marginTop: '-30px', marginBottom: '12px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: !player.avatarUrl ? stringToColor(player.id || player.name) : '#FFF', margin: '0 auto', border: '3px solid var(--bg-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#FFF', fontSize: '20px', fontWeight: 'bold' }}>{getInitials(player.name)}</span>}
                  </div>
                  <div style={{ position: 'absolute', bottom: '0', right: 'calc(50% - 30px)', background: 'var(--accent-gold)', color: '#FFF', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid var(--bg-card)' }}>
                    {player.number}
                  </div>
                </div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{player.name}</h3>
                
                {/* Badges de Rendimiento en Partidos */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  {pStats.goals > 0 && (
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '2px 8px', fontSize: '10.5px', fontWeight: '800' }}>
                      ⚽ {pStats.goals}
                    </span>
                  )}
                  {pStats.matchesPlayed > 0 && (
                    <span style={{ background: 'rgba(212, 168, 67, 0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(212, 168, 67, 0.3)', borderRadius: '12px', padding: '2px 8px', fontSize: '10.5px', fontWeight: '800' }}>
                      🏟️ {pStats.matchesPlayed} {t('player.matchesAbbr')}
                    </span>
                  )}
                </div>

                <div style={{ background: 'var(--bg-app)', margin: '0 12px 6px 12px', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Pos</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{formatPosition(player.position, isEn)}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{t('player.age')}</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{calcularEdad(player.fechaNacimiento || player.birthDate || player.age, isEn).text}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isEn ? 'Ht' : 'Alt'}</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{player.height || '--'}</strong>
                  </div>
                </div>


                {/* Email / Estado de Vinculación con Alto Contraste */}
                <div style={{
                  margin: '0 12px 10px 12px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: (player.email || player.requesterEmail) ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.12)',
                  border: (player.email || player.requesterEmail) ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  overflow: 'hidden'
                }}>
                  <Mail size={12} color={(player.email || player.requesterEmail) ? '#059669' : '#475569'} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: (player.email || player.requesterEmail) ? '#047857' : '#475569',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {player.email || player.requesterEmail || (isEn ? 'No linked account' : 'Sin cuenta vinculada')}
                  </span>
                </div>

                {unreadThreads[player.id] && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    animation: 'pulse 2s infinite'
                  }}>
                    💬 {isEn ? 'Message' : 'Mensaje'}
                  </div>
                )}

                {(player.currentStatus === 'injured' || player.currentStatus === 'recovery') && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--bg-card)', borderRadius: '50%', padding: '4px', boxShadow: 'var(--shadow-card)' }} title={player.currentStatus === 'injured' ? (isEn ? 'Injured' : 'Lesionado') : (isEn ? 'In recovery' : 'En recuperación')}>🚑</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* FAB - Añadir Jugador (Oculto cuando la ficha del jugador o formulario está abierto) */}
      {!selectedPlayer && !isFormOpen && (
        <button className="fab" onClick={() => handleOpenForm(null)} aria-label="Añadir jugador">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}

      {/* MODAL FORMULARIO JUGADOR */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editData.id ? (isEn ? 'Edit Player' : 'Editar Jugador') : (isEn ? 'New Player' : 'Nuevo Jugador')}</h2>
              <button className="btn-close" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group-team full">
                <label>{isEn ? 'Player Name *' : 'Nombre del Jugador *'}</label>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} onBlur={e => setEditData(prev => ({...prev, name: normalizeText(e.target.value)}))} placeholder={isEn ? "e.g. Lamine Yamal" : "Ej. Lamine Yamal"} />
              </div>
              <div className="form-group-team full" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <label>{isEn ? 'Player Photo' : 'Foto del Jugador'}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: (editData.photoPreview || editData.avatarUrl) ? 'transparent' : stringToColor(editData.id || editData.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--border-color)',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '20px'
                  }}>
                    {(editData.photoPreview || editData.avatarUrl) ? <img src={editData.photoPreview || editData.avatarUrl} alt={isEn ? 'Preview' : 'Vista previa'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(editData.name)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="file"
                      accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .avif, .heic, .bmp"
                      id="player-photo-upload"
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                    <label htmlFor="player-photo-upload" style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>📷</span>
                      {isUploadingPhoto ? (isEn ? 'Processing...' : 'Procesando...') : (isEn ? 'Upload photo' : 'Subir foto')}
                    </label>
                    {(editData.photoPreview || editData.avatarUrl) && (
                      <button
                        type="button"
                        onClick={() => setEditData({ ...editData, avatarUrl: '', photoPreview: null, photoFile: null })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '0'
                        }}
                      >
                        {isEn ? 'Remove Photo' : 'Eliminar Foto'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row-team">
                <div className="form-group-team">
                  <label>{isEn ? 'Shirt Number *' : 'Dorsal *'}</label>
                  <input type="number" value={editData.number} onChange={e => setEditData({...editData, number: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>{isEn ? 'Position' : 'Posición'}</label>
                  <select value={editData.position} onChange={e => setEditData({...editData, position: e.target.value})}>
                    {POSITIONS.filter(p=>p!=='TODOS').map(pos => <option key={pos} value={pos}>{formatPosition(pos, isEn)}</option>)}
                  </select>
                </div>
                <div className="form-group-team">
                  <label>{isEn ? 'Date of Birth' : 'Fecha de Nacimiento'}</label>
                  <input
                    type="date"
                    value={editData.fechaNacimiento || editData.birthDate || ''}
                    onChange={e => setEditData({ ...editData, fechaNacimiento: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row-team">
                <div className="form-group-team">
                  <label>{isEn ? 'Height (cm)' : 'Altura (cm)'}</label>
                  <input type="number" value={editData.height} onChange={e => setEditData({...editData, height: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>{isEn ? 'Weight (kg)' : 'Peso (kg)'}</label>
                  <input type="number" value={editData.weight} onChange={e => setEditData({...editData, weight: e.target.value})} />
                </div>
                <div className="form-group-team">
                  <label>{isEn ? 'Dominant Foot' : 'Pie Dominante'}</label>
                  <select value={editData.foot} onChange={e => setEditData({...editData, foot: e.target.value})}>
                    <option value="Derecho">{isEn ? 'Right' : 'Derecho'}</option>
                    <option value="Izquierdo">{isEn ? 'Left' : 'Izquierdo'}</option>
                    <option value="Ambidiestro">{isEn ? 'Both' : 'Ambidiestro'}</option>
                  </select>
                </div>
              </div>

              <div className="form-row-team" style={{ marginTop: '8px' }}>
                <div className="form-group-team" style={{ width: '100%' }}>
                  <label>{isEn ? 'Player / Family Access Email (Optional)' : 'Email de Acceso del Jugador / Familia (Opcional)'}</label>
                  <input 
                    type="email" 
                    placeholder={isEn ? 'example@email.com (to link their portal automatically)' : 'ejemplo@correo.com (para vincular su portal automáticamente)'}
                    value={editData.email || editData.requesterEmail || ''} 
                    onChange={e => setEditData({ ...editData, email: e.target.value })} 
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', marginTop: '2px', display: 'block' }}>
                    {isEn ? 'By entering this email, the player will automatically access this profile when they log in.' : 'Al ingresar este correo, el jugador accederá automáticamente a esta ficha al iniciar sesión.'}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#f8fafc', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#555', lineHeight: '1.4' }}>
                  {isEn ? <><strong>Legal Notice:</strong> The coach is responsible for obtaining informed consent from parents/guardians of underage players in accordance with data protection regulations.</> : <><strong>Aviso de Gobernanza Legal:</strong> El entrenador es responsable de obtener el consentimiento informado de los padres/tutores de los jugadores menores de edad conforme a la normativa de protección de datos (RGPD/LOPDGDD).</>}
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={consentChecked} 
                    onChange={e => setConsentChecked(e.target.checked)} 
                    style={{ marginTop: '2px', width: '16px', height: '16px' }}
                  />
                  <span>{isEn ? 'I confirm I have been informed and will obtain the necessary consents. *' : 'Confirmo que he sido informado y que obtendré los consentimientos necesarios. *'}</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              {formError && (
                <div style={{
                  background: '#FDEDEC', color: '#C0392B', border: '1px solid #E74C3C',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 4, fontSize: 13,
                  width: '100%', textAlign: 'left'
                }}>
                  ⚠️ {formError}
                </div>
              )}
              {editData.id && (
                <button type="button" className="btn-text-error" onClick={() => handleDeletePlayer(editData.id)}>{t('common.delete')}</button>
              )}
              <div className="footer-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</button>
                <button type="button" className="btn-primary" onClick={handleSavePlayer} disabled={isSaving}>
                  {isSaving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKDROP DETALLE JUGADOR */}
      {selectedPlayer && (
        <div 
          className="player-sidebar-backdrop" 
          onClick={() => setSelectedPlayer(null)} 
          aria-hidden="true" 
        />
      )}

      {/* SIDEBAR DETALLE JUGADOR */}
      {selectedPlayer && (
        <div 
          className={`player-sidebar ${selectedPlayer ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Ficha de ${selectedPlayer.name}`}
        >
          {/* BARRA SUPERIOR STICKY CON ACCIONES (ANDROID FIRST) */}
          <div className="player-sidebar-topbar">
            <button 
              type="button"
              className="player-sidebar-btn btn-close-fiche"
              onClick={() => setSelectedPlayer(null)}
              aria-label={t('player.closeProfile')}
              title={t('player.closeProfile')}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', padding: '2px 0' }}>
              {/* 1. EDITAR FICHA */}
              <button 
                type="button"
                className="player-sidebar-btn btn-edit-fiche"
                onClick={() => handleOpenForm(selectedPlayer)}
                title={t('player.editProfile')}
                aria-label={t('player.editProfile')}
              >
                <Edit size={20} />
              </button>

              {/* 2. PUBLICAR COMUNICADO / NOTIFICACIÓN */}
              <button 
                type="button"
                className="player-sidebar-btn btn-notif-fiche"
                onClick={() => {
                  setAnnouncementTitle(isEn ? `Notice for ${selectedPlayer.name}` : `Aviso para ${selectedPlayer.name}`);
                  setIsAnnouncementModalOpen(true);
                }}
                title={isEn ? 'Publish Announcement / Notification' : 'Publicar Comunicado / Notificación'}
                aria-label={isEn ? 'Publish announcement or notification' : 'Publicar comunicado o notificación'}
              >
                <Bell size={20} />
              </button>

              {/* 3. CHAT DIRECTO 1:1 */}
              <button 
                type="button"
                className={`player-sidebar-btn btn-chat-fiche ${activeTab === 'CHAT' ? 'active' : ''}`}
                onClick={() => setActiveTab('CHAT')}
                title={t('player.openChat')}
                aria-label={t('player.openChat')}
              >
                <MessageSquare size={20} />
              </button>


              {/* 4. COMPARTIR CONSENTIMIENTO POR WHATSAPP */}
              <button 
                type="button"
                className="player-sidebar-btn btn-share-fiche"
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const playerLocale = selectedPlayer?.locale || selectedPlayer?.lang || (isEn ? 'en' : 'es');
                  const consentLink = `${baseUrl}/shared/consentimiento?coachId=${user.uid}&teamId=${activeTeamId}&teamName=${encodeURIComponent(activeTeam?.nombre || 'Míster11 Club')}&coachName=${encodeURIComponent(user.displayName || 'el Entrenador')}&lang=${playerLocale}`;
                  const whatsappMsg = isEn ? `Hi, I need you to sign the digital consent form to register ${selectedPlayer.name} on the Míster11 sports platform. You can fill it out and sign it with your finger in 1 minute at this link: ${consentLink}` : `Hola, necesito que firmes el consentimiento digital para registrar a ${selectedPlayer.name} en la plataforma deportiva Míster11. Puedes rellenarlo y firmarlo con tu dedo en 1 minuto desde este enlace: ${consentLink}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
                }}
                title={isEn ? 'Share Digital Consent link via WhatsApp' : 'Compartir link de Consentimiento Digital por WhatsApp'}
                aria-label={isEn ? 'Share digital consent link via WhatsApp' : 'Compartir link de consentimiento digital por WhatsApp'}
              >
                <Share2 size={20} />
              </button>

              {/* 5. EXPORTAR EXPEDIENTE PDF */}
              <button 
                type="button"
                className="player-sidebar-btn btn-export-fiche"
                onClick={() => {
                  if (!isProActive) {
                    setUpgradeModal({ 
                      open: true, 
                      message: isEn ? 'Player record export is a PRO feature. Upgrade to use it.' : 'La exportación del expediente del jugador es una función PRO. Sube de nivel para usarla.' 
                    });
                  } else {
                    generateExpediente({
                      ...selectedPlayer,
                      ...playerSeasonStats,
                      goles: playerSeasonStats.goals,
                      asistencias: playerSeasonStats.assists,
                      partidosJugados: playerSeasonStats.matchesPlayed,
                      minutosTemporada: playerSeasonStats.minutesPlayed,
                      tarjetasAmarillas: playerSeasonStats.yellowCards,
                      tarjetasRojas: playerSeasonStats.redCards,
                      matchHistory: playerSeasonStats.matchHistory
                    }, activeTeam);
                  }
                }} 
                title={isEn ? "Export File" : "Exportar Expediente"}
                aria-label={isEn ? "Export player file to PDF" : "Exportar expediente en PDF"}
              >
                <FileText size={20} />
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', padding: '16px 16px 0 16px', textAlign: 'center' }}>
            <div style={{ width: '90px', height: '90px', margin: '8px auto 10px auto', borderRadius: '50%', background: !selectedPlayer.avatarUrl ? stringToColor(selectedPlayer.id || selectedPlayer.name) : '#FFF', border: '3px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--accent-gold)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedPlayer.avatarUrl ? <img src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#FFF', fontSize: '30px', fontWeight: 'bold' }}>{getInitials(selectedPlayer.name)}</span>}
            </div>
            
            <h2 style={{ margin: '0 0 4px 0', fontSize: '19px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontWeight: 800 }}>{selectedPlayer.name}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent-gold)' }}>#{selectedPlayer.number || '11'}</span>
              <span className="capitalize" style={{ fontSize: '13px', fontWeight: 'bold', background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '12px' }}>{formatPosition(selectedPlayer.position, isEn)}</span>
            </div>
          </div>

          <div style={{ padding: '0 16px' }}>
            <PlayerTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="sidebar-body" style={{ padding: '0 24px 24px 24px' }}>
            {activeTab === 'GENERAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Resumen Rápido de Temporada Sincronizado */}
                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.goals')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-green)' }}>⚽ {playerSeasonStats.goals}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.minutes')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>{playerSeasonStats.minutesPlayed}'</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.matches')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-gold)' }}>{playerSeasonStats.matchesPlayed} {t('player.matchesAbbr')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.category')}</span>
                  <strong className="capitalize" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{activeTeam?.categoria || selectedPlayer.category}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.foot')}</span>
                  <strong className="capitalize" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {selectedPlayer.foot === 'Derecho' ? (isEn ? 'Right' : 'Derecho') :
                     selectedPlayer.foot === 'Izquierdo' ? (isEn ? 'Left' : 'Izquierdo') :
                     selectedPlayer.foot === 'Ambidiestro' ? (isEn ? 'Both' : 'Ambidiestro') :
                     selectedPlayer.foot}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.primaryPosition')}</span>
                  <span className="capitalize" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>{formatPosition(selectedPlayer.position, isEn)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.age')}</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{calcularEdad(selectedPlayer.fechaNacimiento || selectedPlayer.birthDate || selectedPlayer.age, isEn).text}</strong>
                </div>

                {/* Cuenta de Acceso / Email Vinculado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('player.linkedAccount')}</span>
                  <div style={{ textAlign: 'right' }}>
                    {(selectedPlayer.email || selectedPlayer.requesterEmail) ? (
                      <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} /> {selectedPlayer.email || selectedPlayer.requesterEmail}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                        {t('player.noAccount')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsConsentModalOpen(true)}
                  style={{
                    background: 'var(--accent-green)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: 'var(--shadow-card)',
                    minHeight: '48px',
                    width: '100%'
                  }}
                >
                  <span>📄</span> {t('player.shareConsent')}
                </button>

                <button
                  onClick={() => handleDeletePlayer(selectedPlayer.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    width: '100%',
                    minHeight: '44px'
                  }}
                >
                  <Trash2 size={16} />
                  <span>{t('player.deleteFromTeam', { name: selectedPlayer.name })}</span>
                </button>
                
                {/* Fake Radial Chart matching the image */}
                <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: 'conic-gradient(var(--accent-green) 70%, var(--accent-gold) 70% 90%, var(--bg-card) 90% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>{selectedPlayer.number}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'CHAT' && (
              <div style={{ marginTop: '8px' }}>
                <PlayerChatTab 
                  teamPath={teamPath} 
                  player={selectedPlayer} 
                  team={activeTeam} 
                  isCoachView={true} 
                />
              </div>
            )}

            {activeTab === 'FÍSICO' && (
              <div className="tab-pane">
                <div className="physical-stats">
                  <div className="stat-item">
                    <div className="stat-val">{selectedPlayer.height || '--'}<span>cm</span></div>
                    <label>{t('player.height')}</label>
                  </div>
                  <div className="stat-item">
                    <div className="stat-val">{selectedPlayer.weight || '--'}<span>kg</span></div>
                    <label>{t('player.weight')}</label>
                  </div>
                  <div className="stat-item">
                    <div className="stat-val">{(selectedPlayer.weight && selectedPlayer.height) ? (selectedPlayer.weight / Math.pow(selectedPlayer.height/100, 2)).toFixed(1) : '--'}</div>
                    <label>{t('player.bmi')}</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SALUD' && (
              <PlayerHealthTab player={selectedPlayer} teamId={activeTeamId} />
            )}

            {activeTab === 'PLANES' && (
              <PlayerPlansTab player={selectedPlayer} activeTeamId={activeTeamId} />
            )}

            {activeTab === 'ESTS.' && (
              <div className="tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 4 Tarjetas HUD Principales Sincronizadas */}
                <div className="stats-grid">
                  <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.matches')}</span>
                    <strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{playerSeasonStats.matchesPlayed}</strong>
                    <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {playerSeasonStats.starts} {isEn ? 'starts' : 'tit.'} · {playerSeasonStats.subAppearances} {isEn ? 'sub' : 'sup.'}
                    </small>
                  </div>

                  <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.goals')}</span>
                    <strong style={{ fontSize: '20px', color: '#10B981' }}>⚽ {playerSeasonStats.goals}</strong>
                    <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isEn ? 'Season' : 'Temporada'}</small>
                  </div>

                  <div className="stat-card" style={{ borderLeft: '4px solid #3B82F6' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.assists')}</span>
                    <strong style={{ fontSize: '20px', color: '#3B82F6' }}>👟 {playerSeasonStats.assists}</strong>
                    <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isEn ? 'Goal passes' : 'Pases de gol'}</small>
                  </div>

                  <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('player.minutes')}</span>
                    <strong style={{ fontSize: '20px', color: '#F59E0B' }}>⏱️ {playerSeasonStats.minutesPlayed}'</strong>
                    <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isEn ? 'On pitch' : 'En campo'}</small>
                  </div>
                </div>

                {/* Disciplina y Nota Media */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('player.cards')}</span>
                    <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
                      🟨 {playerSeasonStats.yellowCards} · 🟥 {playerSeasonStats.redCards}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('player.avgRating')}</span>
                    <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '4px', color: '#D4A843' }}>
                      ⭐ {playerSeasonStats.avgRating}
                    </div>
                  </div>
                </div>

                {/* Historial Detallado de Partidos Disputados */}
                <div style={{ marginTop: '4px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📋</span> {t('player.matchHistory')} ({playerSeasonStats.matchHistory.length})
                  </h4>

                  {playerSeasonStats.matchHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {playerSeasonStats.matchHistory.map((mItem, idx) => (
                        <div key={idx} style={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-light)', 
                          borderRadius: '10px', 
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                              vs {mItem.rival}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              background: 'rgba(27, 58, 45, 0.08)', 
                              color: 'var(--text-primary)'
                            }}>
                              {mItem.result} ({mItem.type})
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span>📅 {mItem.date} · {mItem.isTitular ? t('player.starter') : t('player.substitute')} ({mItem.minutesPlayed}')</span>
                            <div style={{ display: 'flex', gap: '6px', fontWeight: '800' }}>
                              {mItem.goals > 0 && <span style={{ color: '#10B981' }}>⚽ {mItem.goals}</span>}
                              {mItem.assists > 0 && <span style={{ color: '#3B82F6' }}>👟 {mItem.assists}</span>}
                              {mItem.yellowCards > 0 && <span>🟨</span>}
                              {mItem.redCards > 0 && <span>🟥</span>}
                              {mItem.rating !== '-' && <span style={{ color: '#D4A843' }}>⭐ {mItem.rating}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px dashed var(--border-light)', 
                      borderRadius: '10px', 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: 'var(--text-secondary)',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: 0, fontWeight: '700' }}>{t('player.matchHistoryEmpty')}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
                        {t('player.syncNotice')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'ASISTENCIA' && (
              <PlayerAttendanceSubTab playerId={selectedPlayer.id} teamId={activeTeam?.id} />
            )}
          </div>
        </div>
      )}
      {/* MODAL COMPARTIR CONSENTIMIENTO PARENTAL */}
      {isConsentModalOpen && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setIsConsentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>📄 {isEn ? 'Parental Consent' : 'Consentimiento Parental'}</h2>
              <button className="btn-close" onClick={() => setIsConsentModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#e8f5ee', 
                color: '#1B3A2D', 
                borderRadius: '8px', 
                fontSize: '13px', 
                lineHeight: '1.5',
                borderLeft: '4px solid #1B3A2D'
              }}>
                {isEn ? <>This link lets parents fill out the consent form and sign it digitally on their phone. <strong>They will receive the signed PDF to download. You can also download it from the same link.</strong><br /><br />⚠️ Míster11 does not store copies of signatures or signed PDFs. It is solely your responsibility to download and save a copy of the signed PDF.</> : <>Este enlace permite a los padres rellenar el formulario de consentimiento y firmarlo digitalmente en su móvil. <strong>Ellos recibirán el PDF firmado para descargar. Tú también puedes descargarlo desde el mismo enlace.</strong><br /><br />⚠️ Míster11 no almacena copias de las firmas ni de los PDF firmados. Es tu responsabilidad exclusiva descargar y guardar una copia del PDF firmado.</>}
              </div>

              <div className="form-group-team full">
                <label>{isEn ? 'Public consent link' : 'Enlace público de consentimiento'}</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/consentimiento?playerName=${encodeURIComponent(selectedPlayer.name)}&teamName=${encodeURIComponent(activeTeam?.nombre || '')}&coachName=${encodeURIComponent(user.displayName || '')}`}
                    style={{ flex: 1, padding: '10px', fontSize: '12px', background: '#f4f6f9', border: '1px solid #d1d9e0', borderRadius: '6px' }}
                    onClick={e => e.target.select()}
                  />
                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/consentimiento?playerName=${encodeURIComponent(selectedPlayer.name)}&teamName=${encodeURIComponent(activeTeam?.nombre || '')}&coachName=${encodeURIComponent(user.displayName || '')}`;
                      navigator.clipboard.writeText(link);
                      alert(isEn ? 'Link copied to clipboard!' : '¡Enlace copiado al portapapeles!');
                    }}
                    style={{
                      background: '#1B3A2D',
                      color: '#FFF',
                      border: 'none',
                      padding: '0 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {isEn ? 'Copy' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/consentimiento?playerName=${encodeURIComponent(selectedPlayer.name)}&teamName=${encodeURIComponent(activeTeam?.nombre || '')}&coachName=${encodeURIComponent(user.displayName || '')}`;
                    const whatsappMsg = isEn ? `Hi, I need you to sign the digital consent form to register ${selectedPlayer.name} on the Míster11 sports platform. You can fill it out and sign it with your finger in 1 minute at this link: ${link}` : `Hola, necesito que firmes el consentimiento digital para registrar a ${selectedPlayer.name} en la plataforma deportiva Míster11. Puedes rellenarlo y firmarlo con tu dedo en 1 minuto desde este enlace: ${link}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
                  }}
                  style={{
                    background: '#25D366',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '48px'
                  }}
                >
                  💬 {isEn ? 'Share via WhatsApp' : 'Compartir por WhatsApp'}
                </button>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px', textAlign: 'center' }}>
                  <a 
                    href="/legal/consentimiento.html" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ fontSize: '13px', color: '#1B3A2D', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    {isEn ? 'Download blank consent form to print (Paper)' : 'Descargar consentimiento en blanco para imprimir (Papel)'}
                  </a>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsConsentModalOpen(false)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PUBLICAR COMUNICADO OFICIAL PARA LA PLANTILLA (REC-5) ── */}
      {isAnnouncementModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAnnouncementModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ background: '#1B3A2D', color: '#FFFFFF', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="#D4A843" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
                  {isEn ? 'Publish Official Announcement' : 'Publicar Comunicado Oficial'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAnnouncementModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {isEn ? 'Announcement Title *' : 'Título del Comunicado *'}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'E.g: Tournament trip call-up / Next week schedule' : 'Ej: Convocatoria viaje a torneo / Horarios semana próxima'}
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {isEn ? 'Message for Squad and Families *' : 'Mensaje para la Plantilla y Familias *'}
                </label>
                <SpellCheckedTextarea
                  rows={4}
                  placeholder={isEn ? 'Write the official announcement here. All players and parents will see it on their home screen...' : 'Escribe el mensaje oficial aquí. Todos los jugadores y padres lo verán en su pantalla de inicio...'}
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {isEn ? 'Priority' : 'Prioridad'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAnnouncementPriority('normal')}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      borderRadius: '8px',
                      border: `1.5px solid ${announcementPriority === 'normal' ? '#10B981' : 'var(--border-color)'}`,
                      background: announcementPriority === 'normal' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: announcementPriority === 'normal' ? '#10B981' : 'var(--text-secondary)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🟢 {isEn ? 'Normal' : 'Normal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementPriority('alta')}
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      borderRadius: '8px',
                      border: `1.5px solid ${announcementPriority === 'alta' ? '#EF4444' : 'var(--border-color)'}`,
                      background: announcementPriority === 'alta' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: announcementPriority === 'alta' ? '#EF4444' : 'var(--text-secondary)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🔴 {isEn ? 'Important / Urgent' : 'Importante / Urgente'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  style={{
                    minHeight: '44px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPublishingAnn}
                  style={{
                    minHeight: '44px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isPublishingAnn ? (isEn ? 'Publishing...' : 'Publicando...') : (isEn ? '📢 Send to Whole Squad' : '📢 Enviar a Toda la Plantilla')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PANEL DE MODERACIÓN DE REPORTES (UGC GOOGLE PLAY) */}
      {isModerationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModerationModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '640px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flag size={22} color="#EF4444" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {t('player.chat.moderation.title') || 'Moderación de Mensajes'}
                </h2>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsModerationModalOpen(false)}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
              {teamReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={40} color="#10B981" style={{ marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {t('player.chat.moderation.empty') || 'No hay mensajes denunciados pendientes de revisión.'}
                  </p>
                </div>
              ) : (
                teamReports.map(rep => {
                  const isOpen = rep.status === 'open';
                  const dateStr = rep.createdAt?.toDate 
                    ? rep.createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                    : (rep.createdAt ? new Date(rep.createdAt).toLocaleString(isEn ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' }) : (isEn ? 'Recent' : 'Reciente'));

                  const reasonLabel = {
                    inappropriate: t('player.chat.report.reason.inappropriate') || 'Contenido inapropiado',
                    harassment: t('player.chat.report.reason.harassment') || 'Acoso o intimidación',
                    spam: t('player.chat.report.reason.spam') || 'Spam',
                    other: t('player.chat.report.reason.other') || 'Otro'
                  }[rep.reason] || rep.reason;

                  return (
                    <div 
                      key={rep.id} 
                      style={{
                        background: 'var(--bg-card, #FFFFFF)',
                        border: `1.5px solid ${isOpen ? '#FCA5A5' : 'var(--border-color, #E2E8F0)'}`,
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            background: isOpen ? '#FEF2F2' : 'var(--bg-app, #F1F5F9)', 
                            color: isOpen ? '#DC2626' : 'var(--text-secondary, #64748B)',
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: 800 
                          }}>
                            {isOpen ? (isEn ? '🚩 PENDING' : '🚩 PENDIENTE') : (isEn ? '✅ RESOLVED' : '✅ RESUELTO')}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{dateStr}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isEn ? 'By:' : 'Por:'} <strong>{rep.byName || (isEn ? 'User' : 'Usuario')}</strong> ({rep.byRole || (isEn ? 'user' : 'usuario')})
                        </span>
                      </div>

                      <div style={{ background: 'var(--bg-app, #F8FAFC)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #EF4444' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#EF4444', marginBottom: '2px' }}>
                          {isEn ? 'Reason:' : 'Motivo:'} {reasonLabel}
                        </div>
                        <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          "{rep.msgText}"
                        </p>
                        {rep.details && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong>{isEn ? 'Details:' : 'Detalles:'}</strong> {rep.details}
                          </p>
                        )}
                      </div>

                      {isOpen && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            disabled={resolvingReportId === rep.id || deletingReportMsgId === rep.id}
                            style={{
                              background: '#E2E8F0',
                              color: '#334155',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleResolveReport(rep)}
                          >
                            {resolvingReportId === rep.id ? (isEn ? 'Marking...' : 'Marcando...') : (t('player.chat.moderation.resolve') || (isEn ? 'Mark as resolved' : 'Marcar como resuelto'))}
                          </button>
                          <button
                            type="button"
                            disabled={resolvingReportId === rep.id || deletingReportMsgId === rep.id}
                            style={{
                              background: '#DC2626',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleDeleteReportedMessage(rep)}
                          >
                            {deletingReportMsgId === rep.id ? (isEn ? 'Deleting...' : 'Eliminando...') : (t('player.chat.moderation.deleteMsg') || (isEn ? 'Delete message' : 'Eliminar mensaje'))}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        message={upgradeModal.message}
      />
    </div>
  );
};

export default MiEquipo;
