/**
 * src/components/player/PlayerChatTab.jsx
 * Míster11 — Canal Directo y Chat 1:1 en Tiempo Real (Míster ↔ Jugador/Padre)
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
  setDoc 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Shield, 
  User
} from 'lucide-react';
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
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

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

  // Auto-scroll al fondo al recibir o enviar mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
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
    handleSendMessage(reply);
  };

  return (
    <div className="player-tab-content player-chat-tab">
      
      {/* Cabecera del Chat */}
      <div className="player-chat-header">
        <div className="chat-coach-avatar">
          {isCoachView ? <User size={22} color="#10B981" /> : <Shield size={22} color="#D4A843" />}
        </div>
        <div className="chat-header-info">
          <h3 className="chat-title">
            {isCoachView ? `Canal con ${player?.name || 'Jugador'}` : 'Canal Directo con el Cuerpo Técnico'}
          </h3>
          <p className="chat-subtitle">
            {team?.nombre || 'Mi Equipo'} · Mensajes privados y confidenciales
          </p>
        </div>
      </div>

      {/* Píldoras de Respuestas Rápidas */}
      <div className="quick-replies-section">
        <span className="quick-replies-title">⚡ Mensajes rápidos:</span>
        <div className="quick-replies-list">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              className="quick-reply-pill"
              disabled={sending}
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
            // En vista de entrenador: mis mensajes son los enviados como coach; en vista de jugador: mis mensajes son los enviados como player/parent
            const isMine = isCoachView ? isCoachSender : !isCoachSender;
            const timeStr = msg.createdAt?.toDate 
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Ahora';

            return (
              <div 
                key={msg.id} 
                className={`chat-bubble-wrapper ${isMine ? 'mine' : isCoachSender ? 'coach' : 'theirs'}`}
              >
                {!isMine && (
                  <span className="chat-sender-tag">
                    {isCoachSender ? '👑 Cuerpo Técnico' : (msg.senderName || '👤 Jugador')}
                  </span>
                )}
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

      {/* Formulario Inferior Fijo de Envío */}
      <form 
        className="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          className="chat-text-input"
          placeholder={isCoachView ? `Escribe una respuesta a ${player?.name || 'este jugador'}...` : "Escribe un mensaje al míster..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={sending || !inputText.trim()}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
};

export default PlayerChatTab;
