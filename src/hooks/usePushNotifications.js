/**
 * src/hooks/usePushNotifications.js
 * Míster11 — Hook Contextual de Notificaciones Push con Persistencia Robusta
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isNotificationPromptAllowed, registerPushNotifications } from '../utils/pushNotifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const LOCAL_STORAGE_KEY = 'm11_push_prompt_state';

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
    } else {
      setShowPrompt(false);
    }
  }, [user, isRegistered]);

  // Aceptar permiso
  const acceptNotifications = async () => {
    setShowPrompt(false);
    setIsRegistered(true);
    if (!user) return;

    // Guardar inmediatamente en localStorage
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${user.uid}`, JSON.stringify({
        status: 'granted',
        timestamp: Date.now()
      }));
    } catch (_) {}

    // Guardar en Firestore
    try {
      await setDoc(doc(db, `users/${user.uid}/prefs`, 'notifications'), {
        permission: 'granted',
        grantedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_) {}

    const teamIds = activeTeam?.id ? [activeTeam.id] : [];
    await registerPushNotifications(user.uid, teamIds, onNavigate);
  };

  // Rechazar permiso con cooldown de 30 días
  const dismissNotifications = async () => {
    setShowPrompt(false);
    if (!user) return;

    // Guardar inmediatamente en localStorage
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${user.uid}`, JSON.stringify({
        status: 'dismissed',
        timestamp: Date.now()
      }));
    } catch (_) {}

    // Guardar en Firestore
    try {
      await setDoc(doc(db, `users/${user.uid}/prefs`, 'notifications'), {
        permission: 'dismissed',
        dismissedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_) {}
  };

  // Inicializar listeners automáticos al montar
  useEffect(() => {
    if (!user || user.uid === 'invitado-local') return;
    
    // Si ya fue aceptado previamente en localStorage, no mostrar banner
    try {
      const localState = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${user.uid}`);
      if (localState) {
        const parsed = JSON.parse(localState);
        if (parsed.status === 'granted') {
          setIsRegistered(true);
        }
      }
    } catch (_) {}

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
