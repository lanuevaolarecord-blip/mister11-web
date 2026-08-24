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

/**
 * Comprueba si estamos dentro del período de enfriamiento de 30 días tras rechazo
 */
export const isNotificationPromptAllowed = async (userId) => {
  if (!userId || userId === 'invitado-local') return false;
  try {
    const prefSnap = await getDoc(doc(db, `users/${userId}/prefs`, 'notifications'));
    if (prefSnap.exists()) {
      const data = prefSnap.data();
      if (data.deniedAt) {
        const deniedDate = data.deniedAt.toDate ? data.deniedAt.toDate() : new Date(data.deniedAt);
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
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((reg) => {
            console.log('[Push Web] Service Worker listo');
          });
          return true;
        }
      } catch (err) {
        console.warn('[Push Web] Error:', err);
      }
    }
  }

  return false;
};
