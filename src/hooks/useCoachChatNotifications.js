import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { sendChatNotification, requestNotificationPermission } from './useLocalNotifications';
import { showToast } from '../utils/toast';

/**
 * useCoachChatNotifications
 * Escucha en tiempo real todos los hilos de conversación del equipo activo para el Entrenador.
 * Emite notificaciones locales en Android/Web y reproduce el sonido de alerta al recibir mensajes.
 */
export const useCoachChatNotifications = () => {
  const { user, activeTeam, getTeamPath } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadThreads, setUnreadThreads] = useState([]);
  const lastProcessedMsgRef = useRef({});

  const teamPath = activeTeam?.teamPath || (activeTeam?.id ? getTeamPath(activeTeam.id) : null);
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';

  // Solicitar permisos de notificación al inicializar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!cleanPath || !user) {
      setUnreadCount(0);
      setUnreadThreads([]);
      return;
    }

    const threadsCol = collection(db, `${cleanPath}/threads`);
    const unsub = onSnapshot(threadsCol, (snap) => {
      const allThreads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtrar hilos con mensajes no leídos por el entrenador (enviados por jugador o padre)
      const unreadList = allThreads.filter(t => 
        t.unreadByCoach === true && 
        t.lastSenderUid && 
        t.lastSenderUid !== user.uid
      );

      setUnreadCount(unreadList.length);
      setUnreadThreads(unreadList);

      // Verificar si hay nuevos mensajes entrantes para alertar con sonido y notificación
      unreadList.forEach(t => {
        const lastMsgId = `${t.id}_${t.lastMessage}_${t.updatedAt?.seconds || Date.now()}`;
        if (!lastProcessedMsgRef.current[t.id] || lastProcessedMsgRef.current[t.id] !== lastMsgId) {
          lastProcessedMsgRef.current[t.id] = lastMsgId;

          const playerName = t.playerName || 'Jugador';
          const msgText = t.lastMessage || 'Tienes un nuevo mensaje.';

          sendChatNotification({
            title: `💬 Mensaje de ${playerName}`,
            body: msgText,
            senderName: playerName,
            extra: { tab: 'CHAT', playerId: t.playerId || t.id }
          });

          showToast(`💬 Mensaje de ${playerName}: "${msgText}"`, 'info');
        }
      });

      // Limpiar de la memoria de notificaciones los hilos que ya fueron leídos
      allThreads.forEach(t => {
        if (!t.unreadByCoach && lastProcessedMsgRef.current[t.id]) {
          delete lastProcessedMsgRef.current[t.id];
        }
      });
    }, (err) => {
      console.warn('[CoachChatNotifications] Error escuchando hilos:', err);
    });

    return () => unsub();
  }, [cleanPath, user]);

  return { unreadCount, unreadThreads };
};
