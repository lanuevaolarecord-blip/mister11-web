/**
 * src/components/player/PlayerChatTab.jsx
 * Míster11 — Canal Directo y Chat 1:1 en Tiempo Real (Míster ↔ Jugador/Padre)
 * Cumplimiento Política UGC Google Play: Denunciar y Bloquear usuarios
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { clearDeliveredChatNotifications } from '../../hooks/useLocalNotifications';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../utils/toast';
import { 
  MessageSquare, 
  Send, 
  Shield, 
  User,
  MoreVertical,
  Flag,
  Ban,
  Copy,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { SpellCheckedInput } from '../ui/SpellCheckedInput';
import './PlayerChatTab.css';

const PLAYER_QUICK_REPLIES = [
  '🏃 Llego 10 min tarde',
  '🩺 Tengo molestia muscular',
  '❓ Míster, ¿puedo hablar contigo?',
  '✅ Todo listo para el partido',
  '🚗 Necesito transporte para el desplazamiento'
];

const COACH_QUICK_REPLIES = [
  '👍 Recibido, nos vemos en el campo',
  '⏰ Acuérdate de llegar 15 min antes',
  '🩺 Descansa y avísame si persiste el dolor',
  '📋 Convocatoria confirmada, ¡a por todas!'
];

export const PlayerChatTab = ({ teamPath, player, team, isParentView = false, isCoachView = false }) => {
  const { user, getTeamPath } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [threadMeta, setThreadMeta] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Estados de Moderación / UGC
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [reportModalMsg, setReportModalMsg] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [targetToBlock, setTargetToBlock] = useState(null);
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const effectivePlayerId = player?.id || 'player-self';
  
  // Resolver una ruta segura de colección para Firestore
  const resolvedPath = teamPath || (team?.id && getTeamPath ? getTeamPath(team.id) : (user?.uid && team?.id ? `users/${user.uid}/teams/${team.id}` : ''));
  const cleanPath = resolvedPath ? resolvedPath.replace(/^\/+|\/+$/g, '') : '';
  const isValidPath = cleanPath.length > 0 && cleanPath.split('/').length % 2 === 0;

  const quickReplies = isCoachView ? COACH_QUICK_REPLIES : PLAYER_QUICK_REPLIES;

  // 1. Escuchar mensajes del hilo 1:1 en tiempo real
  useEffect(() => {
    if (!isValidPath || !effectivePlayerId) {
      setLoading(false);
      return;
    }

    try {
      const threadRef = collection(db, `${cleanPath}/threads/${effectivePlayerId}/messages`);
      const q = query(threadRef, orderBy('createdAt', 'asc'));

      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setMessages(msgs);
        setLoading(false);
      }, (err) => {
        console.warn('[PlayerChatTab] Error escuchando mensajes:', err);
        setLoading(false);
      });

      return () => unsub();
    } catch (e) {
      console.warn('[PlayerChatTab] Error iniciando listener de Firestore:', e);
      setLoading(false);
    }
  }, [cleanPath, isValidPath, effectivePlayerId]);

  // 2. Escuchar metadatos del hilo (bloqueos y reportes)
  useEffect(() => {
    if (!isValidPath || !effectivePlayerId) return;

    try {
      const metaRef = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      const unsubMeta = onSnapshot(metaRef, (snap) => {
        if (snap.exists()) {
          setThreadMeta(snap.data());
        } else {
          setThreadMeta(null);
        }
      }, (err) => {
        console.warn('[PlayerChatTab] Error escuchando metadatos del hilo:', err);
      });

      return () => unsubMeta();
    } catch (e) {
      console.warn('[PlayerChatTab] Error listener metadatos:', e);
    }
  }, [cleanPath, isValidPath, effectivePlayerId]);

  // 3. Marcar automáticamente como leídos los mensajes al entrar o recibir nuevos
  useEffect(() => {
    if (!isValidPath || !effectivePlayerId || !user?.uid) return;

    const markAsRead = async () => {
      try {
        const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
        const updatePayload = {
          readBy: arrayUnion(user.uid)
        };
        if (isCoachView) {
          updatePayload.unreadByCoach = false;
        } else {
          updatePayload.unreadByPlayer = false;
        }
        await updateDoc(threadMetaDoc, updatePayload).catch(() => {});
        clearDeliveredChatNotifications();
      } catch (err) {
        console.warn('[PlayerChatTab] Error marcando mensajes como leídos:', err);
      }
    };

    markAsRead();
  }, [cleanPath, isValidPath, effectivePlayerId, isCoachView, user?.uid, messages.length]);

  // Auto-scroll al fondo al recibir o enviar mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Cerrar menús contextuales al hacer click fuera
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeMenuMsgId) setActiveMenuMsgId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeMenuMsgId]);

  // Calcular si hay un bloqueo activo en este chat
  const blocks = Array.isArray(threadMeta?.blocks) ? threadMeta.blocks : [];
  const activeBlock = blocks.find(b => 
    b.by === user?.uid || 
    b.target === user?.uid || 
    (isCoachView ? b.targetRole === 'coach' || b.byRole === 'coach' : b.targetRole === 'player' || b.byRole === 'player')
  );
  const isBlocked = !!activeBlock;
  const isBlockedByMe = activeBlock?.by === user?.uid;

  const handleSendMessage = async (textToSend) => {
    if (isBlocked) return;
    const text = (textToSend || inputText).trim();
    if (!text || !isValidPath || !effectivePlayerId || !user) return;

    setSending(true);
    try {
      const isCoachSender = isCoachView;
      const senderRole = isCoachSender ? 'coach' : isParentView ? 'parent' : 'player';
      const senderName = isCoachSender
        ? (user.displayName || 'Cuerpo Técnico')
        : isParentView 
          ? `${user.displayName || 'Padre'} (Tutor)`
          : (user.displayName || player?.name || 'Jugador');

      const threadCol = collection(db, `${cleanPath}/threads/${effectivePlayerId}/messages`);
      await addDoc(threadCol, {
        senderUid: user.uid,
        senderRole,
        senderName,
        text,
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      });

      // Actualizar resumen del hilo para notificaciones e historial
      const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      await setDoc(threadMetaDoc, {
        playerId: effectivePlayerId,
        playerName: player?.name || 'Jugador',
        lastMessage: text,
        lastSender: senderName,
        lastSenderUid: user.uid,
        lastSenderRole: senderRole,
        updatedAt: serverTimestamp(),
        unreadByCoach: !isCoachSender,
        unreadByPlayer: isCoachSender,
        readBy: [user.uid]
      }, { merge: true });

      setInputText('');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (reply) => {
    if (isBlocked) return;
    handleSendMessage(reply);
  };

  // Copiar texto del mensaje
  const handleCopyText = (text) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(t('player.chat.menu.copied'), 'success');
    } catch (e) {
      console.warn('Error al copiar texto:', e);
    }
    setActiveMenuMsgId(null);
  };

  // Abrir modal de denuncia
  const handleOpenReport = (msg) => {
    setReportModalMsg(msg);
    setReportReason('inappropriate');
    setReportDetails('');
    setActiveMenuMsgId(null);
  };

  // Enviar denuncia a Firestore
  const handleSubmitReport = async () => {
    if (!reportModalMsg || !isValidPath || !effectivePlayerId || !user) return;
    setSubmittingReport(true);
    try {
      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newReport = {
        id: reportId,
        msgId: reportModalMsg.id,
        msgText: reportModalMsg.text,
        msgCreatedAt: reportModalMsg.createdAt || null,
        byUid: user.uid,
        byName: user.displayName || (isCoachView ? 'Cuerpo Técnico' : (player?.name || 'Jugador')),
        byRole: isCoachView ? 'coach' : isParentView ? 'parent' : 'player',
        targetUid: reportModalMsg.senderUid || '',
        targetName: reportModalMsg.senderName || '',
        targetRole: reportModalMsg.senderRole || '',
        playerId: effectivePlayerId,
        playerName: player?.name || 'Jugador',
        teamId: team?.id || '',
        reason: reportReason,
        details: reportDetails.trim(),
        createdAt: new Date().toISOString(),
        status: 'open'
      };

      // 1. Guardar en el hilo
      const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      await updateDoc(threadMetaDoc, {
        reports: arrayUnion(newReport)
      }).catch(async () => {
        await setDoc(threadMetaDoc, { reports: [newReport] }, { merge: true });
      });

      // 2. Guardar en la colección agregada del equipo para el panel de moderación del entrenador
      const reportsCol = collection(db, `${cleanPath}/teamReports`);
      await addDoc(reportsCol, newReport);

      showToast(t('player.chat.report.success'), 'success');
      setReportModalMsg(null);
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast('Error al enviar la denuncia.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Abrir modal de bloqueo
  const handleOpenBlock = (msg) => {
    const isOtherCoach = msg.senderRole === 'coach' || msg.senderRole === 'admin';
    const target = {
      uid: msg.senderUid || '',
      name: msg.senderName || (isOtherCoach ? 'Cuerpo Técnico' : (player?.name || 'Usuario')),
      role: msg.senderRole || (isOtherCoach ? 'coach' : 'player')
    };
    setTargetToBlock(target);
    setBlockModalOpen(true);
    setActiveMenuMsgId(null);
  };

  // Confirmar bloqueo de usuario
  const handleSubmitBlock = async () => {
    if (!isValidPath || !effectivePlayerId || !user) return;
    setSubmittingBlock(true);
    try {
      const blockId = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newBlock = {
        id: blockId,
        by: user.uid,
        byName: user.displayName || (isCoachView ? 'Cuerpo Técnico' : (player?.name || 'Jugador')),
        byRole: isCoachView ? 'coach' : isParentView ? 'parent' : 'player',
        target: targetToBlock?.uid || (isCoachView ? effectivePlayerId : 'coach'),
        targetName: targetToBlock?.name || (isCoachView ? (player?.name || 'Jugador') : 'Cuerpo Técnico'),
        targetRole: targetToBlock?.role || (isCoachView ? 'player' : 'coach'),
        playerId: effectivePlayerId,
        playerName: player?.name || 'Jugador',
        teamId: team?.id || '',
        createdAt: new Date().toISOString()
      };

      // 1. Guardar en el hilo
      const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      await updateDoc(threadMetaDoc, {
        blocks: arrayUnion(newBlock)
      }).catch(async () => {
        await setDoc(threadMetaDoc, { blocks: [newBlock] }, { merge: true });
      });

      // 2. Guardar en el perfil del usuario para gestión en Privacidad
      const userBlockDoc = doc(db, `users/${user.uid}/blockedUsers`, effectivePlayerId);
      await setDoc(userBlockDoc, {
        ...newBlock,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showToast(t('player.chat.block.success'), 'success');
      setBlockModalOpen(false);
    } catch (err) {
      console.error('Error submitting block:', err);
      showToast('Error al bloquear usuario.', 'error');
    } finally {
      setSubmittingBlock(false);
    }
  };

  // Desbloquear usuario
  const handleUnblock = async () => {
    if (!isValidPath || !effectivePlayerId) return;
    try {
      const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      const updatedBlocks = (threadMeta?.blocks || []).filter(b => b.by !== user?.uid && b.target !== user?.uid);
      await updateDoc(threadMetaDoc, { blocks: updatedBlocks });

      if (user?.uid) {
        const userBlockDoc = doc(db, `users/${user.uid}/blockedUsers`, effectivePlayerId);
        await updateDoc(userBlockDoc, { active: false, unblockedAt: serverTimestamp() }).catch(() => {});
      }

      showToast(t('player.chat.unblock.success'), 'success');
    } catch (err) {
      console.error('Error unblocking user:', err);
    }
  };

  return (
    <div className="player-tab-content player-chat-tab">
      
      {/* Cabecera del Chat (solo en portal jugador/familia) */}
      {!isCoachView && (
        <div className="player-chat-header">
          <div className="chat-coach-avatar">
            <Shield size={22} color="#D4A843" />
          </div>
          <div className="chat-header-info">
            <h3 className="chat-title">
              Canal Directo con el Cuerpo Técnico
            </h3>
            <p className="chat-subtitle">
              {team?.nombre || 'Mi Equipo'} · Mensajes privados y confidenciales
            </p>
          </div>
        </div>
      )}

      {/* Píldoras de Respuestas Rápidas */}
      <div className="quick-replies-section">
        <span className="quick-replies-title">⚡ Mensajes rápidos:</span>
        <div className="quick-replies-list">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              className="quick-reply-pill"
              disabled={sending || isBlocked}
              onClick={() => handleQuickReply(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Ventana de Mensajes con Scroll */}
      <div className="chat-messages-container">
        {loading ? (
          <div className="chat-empty-state">
            <p>Cargando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <MessageSquare size={38} className="chat-empty-icon" style={{ color: 'var(--accent-green, #10B981)' }} />
            <p>Aún no hay mensajes en este canal.</p>
            <span>Escribe un mensaje o pulsa una de las opciones rápidas arriba.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isCoachSender = msg.senderRole === 'coach' || msg.senderRole === 'admin';
            const isMine = isCoachView ? isCoachSender : !isCoachSender;
            const timeStr = msg.createdAt?.toDate 
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Ahora';

            return (
              <div 
                key={msg.id} 
                className={`chat-bubble-wrapper ${isMine ? 'mine' : isCoachSender ? 'coach' : 'theirs'}`}
              >
                <div className="chat-bubble-header-row">
                  {!isMine && (
                    <span className="chat-sender-tag">
                      {isCoachSender ? '👑 Cuerpo Técnico' : (msg.senderName || '👤 Jugador')}
                    </span>
                  )}
                  
                  {/* Menú de 3 Puntos (Touch target ≥48dp) */}
                  <div className="chat-bubble-actions">
                    <button
                      type="button"
                      className="chat-msg-options-btn"
                      aria-label="Opciones del mensaje"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuMsgId === msg.id && (
                      <div className="chat-msg-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="chat-msg-menu-item"
                          onClick={() => handleCopyText(msg.text)}
                        >
                          <Copy size={15} />
                          <span>{t('player.chat.menu.copy')}</span>
                        </button>
                        {!isMine && (
                          <>
                            <button
                              type="button"
                              className="chat-msg-menu-item report"
                              onClick={() => handleOpenReport(msg)}
                            >
                              <Flag size={15} />
                              <span>{t('player.chat.menu.report')}</span>
                            </button>
                            <button
                              type="button"
                              className="chat-msg-menu-item block"
                              onClick={() => handleOpenBlock(msg)}
                            >
                              <Ban size={15} />
                              <span>{t('player.chat.menu.block')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="chat-bubble">
                  <p className="chat-bubble-text">{msg.text}</p>
                  <span className="chat-bubble-time">{timeStr}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Banner Informativo de Bloqueo */}
      {isBlocked && (
        <div className="chat-blocked-banner">
          <div className="chat-blocked-banner-content">
            <AlertTriangle size={20} className="chat-blocked-icon" />
            <div className="chat-blocked-text-col">
              <strong>{t('player.chat.blocked.banner')}</strong>
              <span>{t('player.chat.blocked.unblockHint')}</span>
            </div>
          </div>
          {isBlockedByMe && (
            <button
              type="button"
              className="chat-btn-unblock"
              onClick={handleUnblock}
            >
              {t('player.chat.unblock.btn')}
            </button>
          )}
        </div>
      )}

      {/* Formulario Inferior Fijo de Envío */}
      <form 
        className="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <SpellCheckedInput
          type="text"
          className="chat-text-input"
          placeholder={isBlocked 
            ? t('player.chat.blocked.banner') 
            : isCoachView 
              ? `Escribe una respuesta a ${player?.name || 'este jugador'}...` 
              : "Escribe un mensaje al míster..."
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending || isBlocked}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={sending || !inputText.trim() || isBlocked}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </form>

      {/* MODAL: DENUNCIAR MENSAJE (UGC) */}
      {reportModalMsg && (
        <div className="chat-modal-overlay" onClick={() => !submittingReport && setReportModalMsg(null)}>
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <div className="chat-modal-title-row">
                <Flag size={20} color="#EF4444" />
                <h3>{t('player.chat.report.title')}</h3>
              </div>
              <button 
                type="button" 
                className="chat-modal-close-btn"
                disabled={submittingReport}
                onClick={() => setReportModalMsg(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="chat-modal-subtitle">{t('player.chat.report.subtitle')}</p>

            <div className="chat-modal-quote">
              <span className="chat-modal-quote-label">{t('player.chat.report.quotedMessage')}</span>
              <p className="chat-modal-quote-text">"{reportModalMsg.text}"</p>
            </div>

            <div className="chat-report-reasons-group">
              <label className="chat-report-label">{t('player.chat.report.selectReason')}</label>
              
              <label className={`chat-reason-option ${reportReason === 'inappropriate' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="reportReason"
                  value="inappropriate"
                  checked={reportReason === 'inappropriate'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>{t('player.chat.report.reason.inappropriate')}</span>
              </label>

              <label className={`chat-reason-option ${reportReason === 'harassment' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="reportReason"
                  value="harassment"
                  checked={reportReason === 'harassment'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>{t('player.chat.report.reason.harassment')}</span>
              </label>

              <label className={`chat-reason-option ${reportReason === 'spam' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="reportReason"
                  value="spam"
                  checked={reportReason === 'spam'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>{t('player.chat.report.reason.spam')}</span>
              </label>

              <label className={`chat-reason-option ${reportReason === 'other' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="reportReason"
                  value="other"
                  checked={reportReason === 'other'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span>{t('player.chat.report.reason.other')}</span>
              </label>
            </div>

            <div className="chat-report-details-box">
              <textarea
                className="chat-report-textarea"
                rows={3}
                placeholder={t('player.chat.report.detailsPlaceholder')}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="chat-modal-actions">
              <button
                type="button"
                className="chat-modal-btn cancel"
                disabled={submittingReport}
                onClick={() => setReportModalMsg(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="chat-modal-btn submit-report"
                disabled={submittingReport}
                onClick={handleSubmitReport}
              >
                {submittingReport ? t('player.chat.report.submitting') : t('player.chat.report.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOQUEAR USUARIO (UGC) */}
      {blockModalOpen && (
        <div className="chat-modal-overlay" onClick={() => !submittingBlock && setBlockModalOpen(false)}>
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <div className="chat-modal-title-row">
                <Ban size={20} color="#EF4444" />
                <h3>{t('player.chat.block.title')}</h3>
              </div>
              <button 
                type="button" 
                className="chat-modal-close-btn"
                disabled={submittingBlock}
                onClick={() => setBlockModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="chat-modal-block-desc">
              {t('player.chat.block.confirm', { name: targetToBlock?.name || 'este usuario' })}
            </p>

            <div className="chat-modal-actions">
              <button
                type="button"
                className="chat-modal-btn cancel"
                disabled={submittingBlock}
                onClick={() => setBlockModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="chat-modal-btn submit-block"
                disabled={submittingBlock}
                onClick={handleSubmitBlock}
              >
                {submittingBlock ? 'Bloqueando...' : t('player.chat.block.btn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlayerChatTab;
