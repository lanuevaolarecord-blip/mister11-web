import { Capacitor } from '@capacitor/core';

/**
 * useLocalNotifications
 * Hook para gestionar notificaciones locales en Android (APK nativo).
 * Usa @capacitor/local-notifications.
 *
 * En entorno web devuelve stubs vacíos (no disponible en PWA sin service worker dedicado).
 */

let LocalNotifications = null;

// Carga dinámica solo en contexto nativo
const getPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  if (!LocalNotifications) {
    try {
      const mod = await import('@capacitor/local-notifications');
      LocalNotifications = mod.LocalNotifications;
    } catch (e) {
      console.warn('[LocalNotifications] Plugin no disponible:', e.message);
    }
  }
  return LocalNotifications;
};

/**
 * Solicita permisos de notificación al usuario (solo la primera vez).
 * @returns {boolean} true si se concedieron
 */
export const requestNotificationPermission = async () => {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const { display } = await plugin.requestPermissions();
    return display === 'granted';
  } catch (e) {
    console.warn('[LocalNotifications] Error al solicitar permisos:', e);
    return false;
  }
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
