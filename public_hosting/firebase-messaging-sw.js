/**
 * public/firebase-messaging-sw.js
 * Míster11 — Service Worker para Notificaciones Web Push (FCM)
 */

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuración básica de Firebase para el Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyD-mock-apiKey-sw",
  authDomain: "mister11.firebaseapp.com",
  projectId: "mister11",
  storageBucket: "mister11.appspot.com",
  messagingSenderId: "954668402587",
  appId: "1:954668402587:web:c8eb310f84a44fc76ee8a9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje push recibido en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Míster11';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nueva actualización en tu equipo',
    icon: '/logo_mister11.png',
    badge: '/logo_mister11.png',
    data: payload.data || {},
    tag: payload.data?.refId || 'mister11-notification',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let targetUrl = '/';

  if (data.tab) {
    if (data.tab === 'schedule') targetUrl = '/?tab=schedule';
    else if (data.tab === 'chat') targetUrl = '/?tab=chat';
    else if (data.tab === 'achievements') targetUrl = '/?tab=achievements';
    else if (data.tab === 'stats') targetUrl = '/?tab=stats';
  } else if (data.route) {
    targetUrl = data.route;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
