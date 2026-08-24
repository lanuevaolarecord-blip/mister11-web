/**
 * functions/index.js
 * Firebase Cloud Functions (v2) — Míster 11
 *
 * Módulos:
 * 1. Sincronización Stripe → Firestore (syncStripeSubscriptionToTeam)
 * 2. Borrado en Cascada (cascadeDeleteUserTeam, cascadeDeleteClubTeam)
 * 3. Notificaciones Push FCM (Fase B):
 *    - onAnnouncementCreated (Avisos del club/equipo)
 *    - onChatMessageCreated (Chat 1:1 míster-jugador/padre)
 *    - onAchievementCreated (Logros deportivos desbloqueados)
 *    - onMatchConvocationPublished (Convocatorias oficiales)
 *    - scheduledEventReminder (Recordatorio automático ~2h antes)
 */

const { onDocumentWritten, onDocumentDeleted, onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { logger } = require('firebase-functions');

// Inicialización de Firebase Admin
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// ══════════════════════════════════════════════════════════════════════════════
// 1. HELPERS DE NOTIFICACIONES PUSH & ANTI-SPAM
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Comprueba si la hora actual está dentro del horario de silencio (22:30 a 08:00 hora España/Madrid)
 */
function isQuietHours() {
  const now = new Date();
  // Formatear en zona horaria de España
  const options = { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false };
  const formatter = new Intl.DateTimeFormat([], options);
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

  // 22:30 a 23:59 ó 00:00 a 07:59
  if ((hour === 22 && minute >= 30) || hour > 22 || hour < 8) {
    return true;
  }
  return false;
}

/**
 * Obtiene los tokens activos de una lista de UIDs y envía la notificación multicast
 */
async function sendPushToUsers({ userIds, title, body, data = {}, isUrgent = false, refId = '' }) {
  if (!userIds || userIds.length === 0) return { sentCount: 0 };

  // Anti-spam: Verificar horario de silencio si no es urgente
  if (!isUrgent && isQuietHours()) {
    logger.info(`[Push Anti-Spam] Horario de silencio activo (22:30-08:00). Notificación pospuesta para refId: ${refId}`);
    // Opcional: Encolar en collection('scheduled_push') si se desea
    return { postponed: true };
  }

  const uniqueUids = [...new Set(userIds.filter(Boolean))];
  const tokens = [];

  for (const uid of uniqueUids) {
    try {
      // 1. Verificar límite diario (máx 5 push/día)
      const userRef = db.doc(`users/${uid}`);
      const pushHistoryRef = userRef.collection('push_history');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCountSnap = await pushHistoryRef.where('date', '==', todayStr).get();
      if (todayCountSnap.size >= 5 && !isUrgent) {
        logger.info(`[Push Anti-Spam] Límite diario de 5 pushes alcanzado para usuario ${uid}`);
        continue;
      }

      // 2. Obtener tokens de FCM del usuario
      const tokensSnap = await userRef.collection('pushTokens').get();
      tokensSnap.forEach(tDoc => {
        const tokenVal = tDoc.data().token;
        if (tokenVal && !tokens.includes(tokenVal)) {
          tokens.push(tokenVal);
        }
      });

      // 3. Registrar en historial para control de cuota e idempotencia
      if (refId) {
        await pushHistoryRef.doc(`${todayStr}_${refId}`).set({
          date: todayStr,
          refId,
          title,
          sentAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      logger.warn(`[Push] Error obteniendo tokens para ${uid}:`, err);
    }
  }

  if (tokens.length === 0) {
    logger.info(`[Push] No se encontraron tokens activos para los UIDs destinatarios.`);
    return { sentCount: 0 };
  }

  const payload = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        color: '#10B981',
        icon: 'ic_stat_notification',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(payload);
    logger.info(`[Push FCM] Enviados: ${response.successCount}, Fallos: ${response.failureCount}`);
    return { sentCount: response.successCount };
  } catch (err) {
    logger.error('[Push FCM] Error enviando multicast:', err);
    return { error: err.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. TRIGGERS DE FIRESTORE PARA EVENTOS DEPORTIVOS (FCM)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 1. 📣 Anuncio creado en el tablón del equipo -> Push a todos los jugadores + padres
 */
exports.onAnnouncementCreated = onDocumentCreated(
  '{teamParentCol}/{teamParentId}/teams/{teamId}/announcements/{announcementId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return null;

    const { teamParentCol, teamParentId, teamId, announcementId } = event.params;
    const teamPath = `${teamParentCol}/${teamParentId}/teams/${teamId}`;

    logger.info(`[Push] Nuevo anuncio en ${teamPath}: ${data.title}`);

    // Obtener todos los miembros (jugadores y padres) del equipo
    const targetUids = [];
    try {
      const playersSnap = await db.collection(`${teamPath}/players`).get();
      playersSnap.forEach(docSnap => {
        const p = docSnap.data();
        if (p.requesterUid) targetUids.push(p.requesterUid);
        if (p.playerUid) targetUids.push(p.playerUid);
        if (p.userId) targetUids.push(p.userId);
        if (Array.isArray(p.linkedParents)) {
          targetUids.push(...p.linkedParents);
        }
      });
    } catch (err) {
      logger.error('[Push] Error obteniendo miembros para anuncio:', err);
    }

    const title = data.title || '📣 Comunicado del Cuerpo Técnico';
    const body = data.message ? (data.message.length > 90 ? data.message.slice(0, 87) + '...' : data.message) : 'Hay un nuevo anuncio en el tablón de tu equipo.';

    await sendPushToUsers({
      userIds: targetUids,
      title,
      body,
      data: { tab: 'home', teamId, refId: announcementId },
      refId: `announcement_${announcementId}`,
    });

    return null;
  }
);

/**
 * 2. 💬 Mensaje 1:1 en el hilo de chat -> Push al destinatario
 */
exports.onChatMessageCreated = onDocumentCreated(
  '{teamParentCol}/{teamParentId}/teams/{teamId}/threads/{playerId}/messages/{messageId}',
  async (event) => {
    const msg = event.data?.data();
    if (!msg) return null;

    const { teamParentCol, teamParentId, teamId, playerId, messageId } = event.params;
    const teamPath = `${teamParentCol}/${teamParentId}/teams/${teamId}`;

    logger.info(`[Push Chat] Mensaje en ${teamPath}/threads/${playerId}`);

    const targetUids = [];
    const senderRole = msg.senderRole; // 'coach', 'player', 'parent'

    if (senderRole === 'coach') {
      // Push al jugador y sus padres
      try {
        const pSnap = await db.doc(`${teamPath}/players/${playerId}`).get();
        if (pSnap.exists) {
          const p = pSnap.data();
          if (p.requesterUid) targetUids.push(p.requesterUid);
          if (p.playerUid) targetUids.push(p.playerUid);
          if (Array.isArray(p.linkedParents)) targetUids.push(...p.linkedParents);
        }
      } catch (e) {}
    } else {
      // Push al míster/entrenador (propietario del equipo)
      if (teamParentCol === 'users') {
        targetUids.push(teamParentId);
      }
    }

    const title = senderRole === 'coach' ? '💬 Mensaje de tu Entrenador' : `💬 Mensaje de ${msg.senderName || 'Jugador'}`;
    const body = msg.text ? (msg.text.length > 80 ? msg.text.slice(0, 77) + '...' : msg.text) : 'Has recibido un nuevo mensaje.';

    await sendPushToUsers({
      userIds: targetUids,
      title,
      body,
      data: { tab: 'chat', teamId, playerId, refId: messageId },
      refId: `msg_${messageId}`,
      isUrgent: false,
    });

    return null;
  }
);

/**
 * 3. 🏆 Logro deportivo desbloqueado -> Push al jugador y padres
 */
exports.onAchievementCreated = onDocumentCreated(
  '{teamParentCol}/{teamParentId}/teams/{teamId}/players/{playerId}/achievements/{achievementId}',
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.unlocked) return null;

    const { teamParentCol, teamParentId, teamId, playerId, achievementId } = event.params;
    const teamPath = `${teamParentCol}/${teamParentId}/teams/${teamId}`;

    const targetUids = [];
    try {
      const pSnap = await db.doc(`${teamPath}/players/${playerId}`).get();
      if (pSnap.exists) {
        const p = pSnap.data();
        if (p.requesterUid) targetUids.push(p.requesterUid);
        if (p.playerUid) targetUids.push(p.playerUid);
        if (Array.isArray(p.linkedParents)) targetUids.push(...p.linkedParents);
      }
    } catch (e) {}

    const title = '🏆 ¡Nuevo Logro Desbloqueado!';
    const body = data.title ? `Has conseguido: "${data.title}"` : '¡Enhorabuena por tu progreso en el equipo!';

    await sendPushToUsers({
      userIds: targetUids,
      title,
      body,
      data: { tab: 'achievements', teamId, playerId, refId: achievementId },
      refId: `ach_${achievementId}`,
    });

    return null;
  }
);

/**
 * 4. 📋 Convocatoria de Partido Publicada -> Push a convocados y no convocados
 */
exports.onMatchConvocationUpdated = onDocumentUpdated(
  '{teamParentCol}/{teamParentId}/teams/{teamId}/matches/{matchId}',
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};

    // Solo disparar cuando convocatoriaPublicada pasa de false/undefined a true
    if (!before.convocatoriaPublicada && after.convocatoriaPublicada) {
      const { teamParentCol, teamParentId, teamId, matchId } = event.params;
      const teamPath = `${teamParentCol}/${teamParentId}/teams/${teamId}`;

      const convocadosMap = after.convocados || {}; // { playerId: true }
      const rival = after.rival || after.opponent || 'el rival';
      const fecha = after.fecha || after.date || 'próximamente';

      try {
        const playersSnap = await db.collection(`${teamPath}/players`).get();
        const convocadosUids = [];
        const noConvocadosUids = [];

        playersSnap.forEach(pDoc => {
          const p = pDoc.data();
          const pUids = [p.requesterUid, p.playerUid, p.userId, ...(p.linkedParents || [])].filter(Boolean);
          if (convocadosMap[pDoc.id]) {
            convocadosUids.push(...pUids);
          } else {
            noConvocadosUids.push(...pUids);
          }
        });

        // 1. Enviar a convocados
        if (convocadosUids.length > 0) {
          await sendPushToUsers({
            userIds: convocadosUids,
            title: `📋 Convocatoria: vs ${rival}`,
            body: `Estás convocado para el partido del ${fecha}. Confirma tu asistencia en el portal.`,
            data: { tab: 'schedule', teamId, matchId },
            refId: `conv_yes_${matchId}`,
          });
        }

        // 2. Enviar a no convocados (Mensaje motivador neutro, sin rol táctico)
        if (noConvocadosUids.length > 0) {
          await sendPushToUsers({
            userIds: noConvocadosUids,
            title: `📋 Convocatoria Publicada: vs ${rival}`,
            body: `Se ha publicado la lista para el partido. ¡Sigue entrenando fuerte con el equipo! 💪`,
            data: { tab: 'schedule', teamId, matchId },
            refId: `conv_no_${matchId}`,
          });
        }
      } catch (err) {
        logger.error('[Push Convocatoria] Error:', err);
      }
    }

    return null;
  }
);

/**
 * 5. ⏰ Recordatorio Automático ~2 horas antes de Sesiones o Partidos (Cron Horario)
 */
exports.scheduledEventReminder = onSchedule(
  {
    schedule: '0 * * * *', // Cada hora en punto
    timeZone: 'Europe/Madrid',
  },
  async () => {
    logger.info('[Push Schedule] Ejecutando revisión horaria de eventos próximos...');
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];

    // Buscar equipos activos
    try {
      const usersSnap = await db.collection('users').get();
      for (const uDoc of usersSnap.docs) {
        const teamsSnap = await db.collection(`users/${uDoc.id}/teams`).get();
        for (const tDoc of teamsSnap.docs) {
          const teamPath = `users/${uDoc.id}/teams/${tDoc.id}`;

          // Revisar sesiones de hoy
          const sessSnap = await db.collection(`${teamPath}/sessions`).where('fecha', '==', todayStr).get();
          for (const sDoc of sessSnap.docs) {
            const s = sDoc.data();
            const hora = s.hora || '18:00';
            // Notificar recordatorio neutro
            const refId = `remind_sess_${sDoc.id}`;
            // Obtener jugadores y padres del equipo
            const pSnap = await db.collection(`${teamPath}/players`).get();
            const uids = [];
            pSnap.forEach(p => {
              const data = p.data();
              if (data.requesterUid) uids.push(data.requesterUid);
              if (data.playerUid) uids.push(data.playerUid);
              if (Array.isArray(data.linkedParents)) uids.push(...data.linkedParents);
            });

            await sendPushToUsers({
              userIds: uids,
              title: `⚽ Recordatorio de Entrenamiento`,
              body: `Hoy entrenamiento a las ${hora} en ${s.lugar || 'el campo habitual'}.`,
              data: { tab: 'schedule', teamId: tDoc.id, refId: sDoc.id },
              refId,
              isUrgent: true, // Recordatorio del mismo día se envía sin silenciar
            });
          }
        }
      }
    } catch (err) {
      logger.error('[Push Schedule] Error procesando recordatorios:', err);
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// 3. SINCRONIZACIÓN STRIPE & CASCADA (EXISTENTES)
// ══════════════════════════════════════════════════════════════════════════════

exports.syncStripeSubscriptionToTeam = onDocumentWritten(
  'customers/{uid}/subscriptions/{subscriptionId}',
  async (event) => {
    const { uid, subscriptionId } = event.params;
    const subscriptionData = event.data?.after?.exists
      ? event.data.after.data()
      : null;

    logger.info(`[Stripe Sync] Procesando suscripción para usuario ${uid}, SubID: ${subscriptionId}`);

    if (!subscriptionData) {
      logger.info(`[Stripe Sync] Suscripción eliminada. Revirtiendo usuario ${uid} a plan free.`);
      await downgradeUserTeams(uid);
      await db.doc(`users/${uid}`).set(
        { plan: 'free', stripeSubscriptionId: null, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return null;
    }

    const status = subscriptionData.status;
    const metadata = subscriptionData.metadata || {};
    const teamId = metadata.teamId || null;

    let planType = 'free';
    if (status === 'active' || status === 'trialing') {
      if (metadata.plan) {
        planType = metadata.plan;
      } else if (subscriptionData.role) {
        planType = subscriptionData.role;
      } else if (subscriptionData.items?.[0]?.price?.id?.includes('club')) {
        planType = 'club';
      } else {
        planType = 'pro';
      }
    }

    const proExpiration = subscriptionData.current_period_end || null;

    if (teamId) {
      const teamRef = db.doc(`users/${uid}/teams/${teamId}`);
      const teamSnap = await teamRef.get();

      if (teamSnap.exists) {
        await teamRef.update({
          plan: planType,
          proExpiration,
          stripeSubscriptionId: subscriptionId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
      }
    } else {
      await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
    }

    await db.doc(`users/${uid}`).set(
      {
        plan: planType,
        stripeSubscriptionId: subscriptionId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return null;
  }
);

async function downgradeUserTeams(uid) {
  const teamsRef = db.collection(`users/${uid}/teams`);
  const snapshot = await teamsRef.get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      plan: 'free',
      proExpiration: null,
      stripeSubscriptionId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

async function syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId) {
  const teamsRef = db.collection(`users/${uid}/teams`);
  const snapshot = await teamsRef.get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      plan: planType,
      proExpiration,
      stripeSubscriptionId: subscriptionId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

exports.cascadeDeleteUserTeam = onDocumentDeleted(
  'users/{uid}/teams/{teamId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    try {
      await db.recursiveDelete(snapshot.ref);
    } catch (err) {
      logger.error(`[Cascade Delete] Error:`, err);
    }
    return null;
  }
);

exports.cascadeDeleteClubTeam = onDocumentDeleted(
  'clubs/{clubId}/teams/{teamId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    try {
      await db.recursiveDelete(snapshot.ref);
    } catch (err) {
      logger.error(`[Cascade Delete] Error:`, err);
    }
    return null;
  }
);
