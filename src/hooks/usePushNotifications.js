/**
 * src/hooks/usePushNotifications.js
 * Míster11 — Hook Contextual de Notificaciones Push
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isNotificationPromptAllowed, registerPushNotifications } from '../utils/pushNotifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const usePushNotifications = (onNavigate) => {
  const { user, activeTeam } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Comprobar si debemos mostrar el banner contextual
  const checkPromptEligibility = useCallback(async () => {
    if (!user || user.uid === 'invitado-local') return;
    const allowed = await isNotificationPromptAllowed(user.uid);
    if (allowed && !isRegistered) {
      setShowPrompt(true);
    }
  }, [user, isRegistered]);

  // Aceptar permiso
  const acceptNotifications = async () => {
    setShowPrompt(false);
    if (!user) return;
    const teamIds = activeTeam?.id ? [activeTeam.id] : [];
    const ok = await registerPushNotifications(user.uid, teamIds, onNavigate);
    if (ok) {
      setIsRegistered(true);
      try {
        await setDoc(doc(db, `users/${user.uid}/prefs`, 'notifications'), {
          permission: 'granted',
          grantedAt: serverTimestamp(),
        }, { merge: true });
      } catch (_) {}
    }
  };

  // Rechazar permiso con cooldown de 30 días
  const dismissNotifications = async () => {
    setShowPrompt(false);
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/prefs`, 'notifications'), {
        permission: 'dismissed',
        deniedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_) {}
  };

  // Inicializar listeners automáticos si ya tenía permiso concedido
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') return;
    const teamIds = activeTeam?.id ? [activeTeam.id] : [];
    registerPushNotifications(user.uid, teamIds, onNavigate).then((ok) => {
      if (ok) setIsRegistered(true);
    });
  }, [user, activeTeam?.id, onNavigate]);

  return {
    showPrompt,
    checkPromptEligibility,
    acceptNotifications,
    dismissNotifications,
    isRegistered,
  };
};

export default usePushNotifications;
