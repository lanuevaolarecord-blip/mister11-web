/**
 * src/utils/pushNotifications.js
 * Míster11 — Manejador Integral de Notificaciones Push (FCM + Capacitor)
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { showToast } from './toast';

const COOLDOWN_DAYS = 30;
const LOCAL_STORAGE_KEY = 'm11_push_prompt_state';

/**
 * Comprueba si debemos mostrar el banner contextual al usuario
 */
export const isNotificationPromptAllowed = async (userId) => {
  if (!userId || userId === 'invitado-local') return false;

  // 1. Verificación rápida síncrona en localStorage
  try {
    const localState = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (localState) {
      const parsed = JSON.parse(localState);
      if (parsed.status === 'granted') return false;
      if (parsed.timestamp) {
        const daysPassed = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
        if (daysPassed < COOLDOWN_DAYS) return false;
      }
    }
  } catch (_) {}

  // 2. Si el navegador web nativo ya tiene permiso 'granted' o 'denied'
  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return false;
    }
  }

  // 3. Verificación en Firestore (users/{userId}/prefs/notifications)
  try {
    const prefSnap = await getDoc(doc(db, `users/${userId}/prefs`, 'notifications'));
    if (prefSnap.exists()) {
      const data = prefSnap.data();
      if (data.permission === 'granted') {
        return false;
      }
      if (data.deniedAt || data.dismissedAt) {
        const d = data.deniedAt || data.dismissedAt;
        const deniedDate = d.toDate ? d.toDate() : new Date(d);
        const daysPassed = (new Date() - deniedDate) / (1000 * 60 * 60 * 24);
        if (daysPassed < COOLDOWN_DAYS) {
          return false;
        }
      }
    }
  } catch (_) {}

  return true;
};

/**
 * Guarda el token de notificación en Firestore bajo users/{uid}/pushTokens/{tokenId}
 */
export const savePushToken = async (userId, token, platform = 'android', teamIds = []) => {
  if (!userId || !token || userId === 'invitado-local') return;

  try {
    const tokenId = token.slice(-24).replace(/[^a-zA-Z0-9]/g, '_');
    const tokenRef = doc(db, `users/${userId}/pushTokens`, tokenId);

    await setDoc(tokenRef, {
      token,
      platform,
      teamIds: Array.isArray(teamIds) ? teamIds : [teamIds].filter(Boolean),
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log(`[Push] Token guardado exitosamente para usuario ${userId} (${platform})`);
  } catch (err) {
    console.warn('[Push] Error guardando pushToken:', err);
  }
};

/**
 * Registra y activa listeners de notificaciones push en Capacitor (Android) y Web
 */
export const registerPushNotifications = async (userId, teamIds = [], onNavigate = null) => {
  if (!userId || userId === 'invitado-local') return false;

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('[Push] Permiso denegado por el usuario en Android');
        try {
          await setDoc(doc(db, `users/${userId}/prefs`, 'notifications'), {
            permission: 'denied',
            deniedAt: serverTimestamp(),
          }, { merge: true });
        } catch (_) {}
        return false;
      }

      // Registrarse con FCM en Android
      await PushNotifications.register();

      // Listener de token registrado
      PushNotifications.addListener('registration', async (tokenData) => {
        const token = tokenData.value;
        await savePushToken(userId, token, 'android', teamIds);
      });

      // Listener de error de registro
      PushNotifications.addListener('registrationError', (err) => {
        console.warn('[Push] Error al registrar notificaciones:', err);
      });

      // Listener cuando llega la notificación con app en primer plano
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Notificación recibida en foreground:', notification);
        const title = notification.title || 'Míster11';
        const body = notification.body || '';
        showToast(`🔔 ${title}: ${body}`, 'info');
      });

      // Listener cuando el usuario pulsa en la notificación (Deep Link)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Acción de notificación pulsada:', action);
        const data = action.notification?.data || {};
        const targetTab = data.tab || 'home';
        if (typeof onNavigate === 'function') {
          onNavigate(targetTab, data);
        } else if (data.route) {
          window.location.href = data.route;
        }
      });

      return true;
    } catch (err) {
      console.warn('[Push] Error inicializando Capacitor PushNotifications:', err);
      return false;
    }
  } else {
    // Entorno Web (PWA / Browser)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        let perm = Notification.permission;
        if (perm === 'default') {
          perm = await Notification.requestPermission();
        }
        if (perm === 'granted') {
          return true;
        }
      } catch (err) {
        console.warn('[Push Web] Error solicitando permiso web:', err);
      }
    }
  }

  return false;
};
