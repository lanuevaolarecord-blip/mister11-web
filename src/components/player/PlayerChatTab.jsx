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
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Shield, 
  User, 
  Clock, 
  Sparkles, 
  CheckCheck,
  Flame,
  AlertCircle
} from 'lucide-react';
import './PlayerChatTab.css';

const QUICK_REPLIES = [
  '🏃 Llego 10 min tarde',
  '🩺 Tengo molestia muscular',
  '❓ Míster, ¿puedo hablar contigo?',
  '✅ Todo listo para el partido',
  '🚗 Necesito transporte para el desplazamiento'
];

export const PlayerChatTab = ({ teamPath, player, team, isParentView = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const effectivePlayerId = player?.id || 'player-self';
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

  // 1. Escuchar mensajes del hilo 1:1 en tiempo real
  useEffect(() => {
    if (!cleanPath || !effectivePlayerId) {
      setLoading(false);
      return;
    }

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
  }, [cleanPath, effectivePlayerId]);

  // Auto-scroll al final al recibir mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !cleanPath || !effectivePlayerId || !user) return;

    setSending(true);
    try {
      const senderRole = isParentView ? 'parent' : 'player';
      const senderName = isParentView 
        ? `${user.displayName || 'Padre'} (Padre de ${player?.name || 'Jugador'})`
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

      // Actualizar resumen del hilo para el panel del entrenador
      const threadMetaDoc = doc(db, `${cleanPath}/threads`, effectivePlayerId);
      await setDoc(threadMetaDoc, {
        playerId: effectivePlayerId,
        playerName: player?.name || 'Jugador',
        lastMessage: text,
        lastSender: senderName,
        lastSenderRole: senderRole,
        updatedAt: serverTimestamp(),
        unreadByCoach: true
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
          <Shield size={24} color="#D4A843" />
        </div>
        <div className="chat-header-info">
          <h3 className="chat-title">Canal Directo con el Cuerpo Técnico</h3>
          <p className="chat-subtitle">
            {team?.nombre || 'Mi Equipo'} · Mensajes privados y confidenciales
          </p>
        </div>
      </div>

      {/* Caja de Respuestas Rápidas */}
      <div className="quick-replies-section">
        <span className="quick-replies-title">⚡ Mensajes rápidos:</span>
        <div className="quick-replies-list">
          {QUICK_REPLIES.map((reply, i) => (
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

      {/* Ventana de Conversación */}
      <div className="chat-messages-container">
        {loading ? (
          <div className="chat-loading">Cargando conversación...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <MessageSquare size={36} color="var(--text-secondary)" />
            <p>Aún no hay mensajes en este canal.</p>
            <span>Escribe al entrenador o usa uno de los mensajes rápidos.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            const isCoach = msg.senderRole === 'coach' || msg.senderRole === 'admin';
            const timeStr = msg.createdAt?.toDate 
              ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Ahora';

            return (
              <div 
                key={msg.id} 
                className={`chat-bubble-wrapper ${isMe ? 'mine' : isCoach ? 'coach' : 'theirs'}`}
              >
                {!isMe && (
                  <span className="chat-sender-tag">
                    {isCoach ? '👑 Cuerpo Técnico' : msg.senderName}
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

      {/* Input de Mensaje */}
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
          placeholder="Escribe un mensaje al míster..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
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
