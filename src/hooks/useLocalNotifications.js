import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * useLocalNotifications
 * Hook para gestionar notificaciones locales en Android (APK nativo).
 * Usa @capacitor/local-notifications.
 *
 * En entorno web devuelve stubs vacíos (no disponible en PWA sin service worker dedicado).
 */

const getPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  return LocalNotifications;
};

/**
 * Reproduce un tono de notificación armónico audible en el dispositivo.
 * Usa Web Audio API (compatible con todos los móviles Android, iOS y navegadores).
 */
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Tono doble agradable estilo mensajería (D5: 587.33Hz -> A5: 880Hz)
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);

    // Vibración háptica en dispositivos móviles compatibles protegida por try/catch
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (_) {}
  } catch (_) {
    // Silenciar restricciones de interacción del navegador
  }
};

/**
 * Solicita permisos de notificación al usuario (solo la primera vez).
 * Registra también el canal de notificaciones con sonido en Android.
 * @returns {boolean} true si se concedieron
 */
export const requestNotificationPermission = async () => {
  const plugin = await getPlugin();
  if (plugin) {
    try {
      // Crear canal de alta prioridad con sonido en Android
      await plugin.createChannel({
        id: 'mister11_chat_channel',
        name: 'Mensajes y Avisos Míster11',
        description: 'Notificaciones con sonido de mensajes de chat y convocatorias',
        importance: 5, // MAX importance (pantalla y sonido)
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#10B981'
      });

      const { display } = await plugin.requestPermissions();
      return display === 'granted';
    } catch (e) {
      console.warn('[LocalNotifications] Error al solicitar permisos:', e);
      return false;
    }
  }

  // Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (_) {
      return false;
    }
  }
  return false;
};

/**
 * Programa una notificación local para recordar una sesión de entrenamiento.
 * Se lanza 1 hora antes de la hora indicada.
 *
 * @param {Object} session - Objeto sesión con { id, title, date, time }
 */
export const scheduleSessionReminder = async (session) => {
  const plugin = await getPlugin();
  if (!plugin) return;

  // ¿Están habilitadas las notificaciones en preferencias?
  const enabled = localStorage.getItem('mister11_notifications_enabled');
  if (enabled === 'false') return;

  try {
    const { date, time, title, id } = session;
    if (!date || !time) return;

    // Calcular fecha/hora de la sesión y restar 1 hora
    const [year, month, day]   = date.split('-').map(Number);
    const [hour, minute]       = time.split(':').map(Number);
    const sessionDate          = new Date(year, month - 1, day, hour, minute, 0);
    const notifDate            = new Date(sessionDate.getTime() - 60 * 60 * 1000);

    if (notifDate <= new Date()) return; // Ya pasó

    // ID numérico único basado en el hash del id de la sesión
    const numericId = Math.abs(
      id.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)
    ) % 2147483647;

    await plugin.schedule({
      notifications: [
        {
          id: numericId,
          title: '⚽ Sesión en 1 hora — Míster11',
          body: title || 'Tienes una sesión de entrenamiento próxima.',
          schedule: { at: notifDate },
          channelId: 'mister11_chat_channel',
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#4CAF7D',
          extra: { sessionId: id },
        },
      ],
    });

    console.log(`[LocalNotifications] Recordatorio programado para: ${notifDate.toLocaleString('es-ES')}`);
  } catch (e) {
    console.warn('[LocalNotifications] Error al programar recordatorio:', e);
  }
};

/**
 * Envía una notificación inmediata de nuevo mensaje de chat con sonido y vibración.
 * Compatible con Android nativo (Capacitor) y navegadores web (Notification API).
 *
 * @param {Object} params - { title, body, senderName, extra }
 */
export const sendChatNotification = async ({ title, body, senderName, extra = {} }) => {
  const finalTitle = title || (senderName ? `💬 Mensaje de ${senderName}` : '💬 Nuevo mensaje en Míster11');
  const finalBody = body || 'Tienes un nuevo mensaje sin leer.';

  // 1. Reproducir siempre tono audible en el móvil
  playNotificationSound();

  // 2. Android Nativo (Capacitor Local Notifications)
  const plugin = await getPlugin();
  if (plugin) {
    try {
      const numericId = Math.floor(Math.random() * 1000000) + 1;
      await plugin.schedule({
        notifications: [
          {
            id: numericId,
            title: finalTitle,
            body: finalBody,
            schedule: { at: new Date(Date.now() + 100) },
            channelId: 'mister11_chat_channel',
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#10B981',
            extra
          }
        ]
      });
      return;
    } catch (err) {
      console.warn('[LocalNotifications] Error enviando notificación de chat en Android:', err);
    }
  }

  // 3. Navegador Web (Notification API)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(finalTitle, {
          body: finalBody,
          icon: '/logo_mister11.png',
          badge: '/logo_mister11.png',
          tag: 'mister11-chat',
          data: extra
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(finalTitle, {
              body: finalBody,
              icon: '/logo_mister11.png',
              tag: 'mister11-chat',
              data: extra
            });
          }
        });
      }
    } catch (webErr) {
      console.warn('[LocalNotifications] Error enviando notificación web:', webErr);
    }
  }
};

/**
 * Cancela el recordatorio de una sesión (p.ej. si se elimina).
 * @param {string} sessionId
 */
export const cancelSessionReminder = async (sessionId) => {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const numericId = Math.abs(
      sessionId.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)
    ) % 2147483647;
    await plugin.cancel({ notifications: [{ id: numericId }] });
  } catch (e) {
    console.warn('[LocalNotifications] Error al cancelar recordatorio:', e);
  }
};


