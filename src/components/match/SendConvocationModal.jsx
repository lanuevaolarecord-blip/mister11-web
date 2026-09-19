import React, { useState } from 'react';
import { X, Send, Check, Users, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { t } from '../../i18n/translations';
import { PlayerAvatar } from '../PlayerAvatar';

export const SendConvocationModal = ({
  isOpen,
  onClose,
  teamId,
  teamPath,
  matchData,
  selectedPlayers = [],
  pngBlob,
  pngUrl,
  lang = 'es',
  currentUserId = null
}) => {
  const opponentName = matchData?.rival || matchData?.opponent || 'Rival';
  const defaultMsg = t('convocation.defaultMessage', lang, { opponent: opponentName });

  const [message, setMessage] = useState(defaultMsg);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState(() => 
    selectedPlayers.map(p => p.id || p.uid || p.docId).filter(Boolean)
  );
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text }

  if (!isOpen) return null;

  const toggleRecipient = (id) => {
    if (selectedRecipientIds.includes(id)) {
      setSelectedRecipientIds(selectedRecipientIds.filter(x => x !== id));
    } else {
      setSelectedRecipientIds([...selectedRecipientIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRecipientIds.length === selectedPlayers.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(selectedPlayers.map(p => p.id || p.uid || p.docId).filter(Boolean));
    }
  };

  const handleSend = async () => {
    if (selectedRecipientIds.length === 0) {
      setFeedback({ type: 'error', text: t('convocation.noPlayersSelected', lang) });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      // 1. Ruta canónica del equipo para comunicaciones
      const effectivePath = teamPath || (teamId ? `teams/${teamId}` : null);
      if (effectivePath) {
        const commsRef = collection(db, `${effectivePath}/communications`);
        await addDoc(commsRef, {
          type: 'CONVOCATION',
          matchId: matchData?.id || matchData?.matchId || 'unknown_match',
          rival: opponentName,
          matchDate: matchData?.date || matchData?.fecha || null,
          matchTime: matchData?.time || matchData?.hora || null,
          message: message.trim(),
          convocationImageURL: pngUrl || null,
          recipients: selectedRecipientIds,
          recipientCount: selectedRecipientIds.length,
          sentBy: currentUserId || 'coach',
          sentAt: serverTimestamp(),
          channel: 'PUSH_AND_INAPP'
        });
      }

      setFeedback({ type: 'success', text: t('convocation.sendSuccess', lang) });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[SendConvocationModal] Error sending convocation:', err);
      setFeedback({ type: 'error', text: t('convocation.sendError', lang) });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(13, 33, 24, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#1B3A2D',
          border: '1.5px solid #D4A843',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(212, 168, 67, 0.25)',
            backgroundColor: '#132B21'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(76, 175, 125, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4CAF7D'
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
                {t('convocation.sendModalTitle', lang)}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                vs {opponentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '8px',
              minWidth: '48px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {feedback && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 125, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${feedback.type === 'success' ? '#4CAF7D' : '#EF4444'}`,
                color: feedback.type === 'success' ? '#68C494' : '#FCA5A5',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Mensaje */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#D4A843',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}
            >
              <MessageSquare size={15} />
              {t('convocation.message', lang)}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0D2118',
                border: '1px solid rgba(76, 175, 125, 0.3)',
                color: '#FFFFFF',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Destinatarios */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#D4A843',
                  textTransform: 'uppercase'
                }}
              >
                <Users size={15} />
                {t('convocation.selectPlayers', lang)} ({selectedRecipientIds.length}/{selectedPlayers.length})
              </label>
              <button
                type="button"
                onClick={toggleAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4CAF7D',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                {t('convocation.allRecipientsSelected', lang)}
              </button>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: '#0D2118',
                borderRadius: '8px',
                border: '1px solid rgba(76, 175, 125, 0.2)',
                padding: '8px'
              }}
            >
              {selectedPlayers.map((player) => {
                const pid = player.id || player.uid || player.docId;
                const isChecked = selectedRecipientIds.includes(pid);
                return (
                  <div
                    key={pid}
                    onClick={() => toggleRecipient(pid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isChecked ? 'rgba(76, 175, 125, 0.12)' : 'transparent',
                      marginBottom: '4px',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `1.5px solid ${isChecked ? '#4CAF7D' : '#64748B'}`,
                        backgroundColor: isChecked ? '#4CAF7D' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isChecked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <PlayerAvatar player={player} size={30} />
                    <span style={{ fontSize: '13px', fontWeight: '600', flex: 1, color: '#FFFFFF' }}>
                      {player.number ? `#${player.number} ` : ''}{player.name || player.nombre}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>
                      {player.position || player.posicion || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(212, 168, 67, 0.25)',
            backgroundColor: '#132B21',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #4B5563',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              minHeight: '48px',
              minWidth: '48px'
            }}
          >
            {t('btn.cancel', lang)}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || selectedRecipientIds.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4CAF7D',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '13px',
              cursor: isSending || selectedRecipientIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isSending || selectedRecipientIds.length === 0 ? 0.6 : 1,
              minHeight: '48px',
              minWidth: '48px',
              boxShadow: '0 4px 12px rgba(76, 175, 125, 0.3)'
            }}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('convocation.sending', lang)}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{t('convocation.send', lang)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConvocationModal;
