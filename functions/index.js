/**
 * functions/index.js
 * Firebase Cloud Functions — Míster 11
 *
 * Función: syncStripeSubscriptionToTeam
 * Escucha cambios en las suscripciones de Stripe (extensión oficial de Firebase)
 * y sincroniza el plan del usuario en Firestore.
 *
 * Documento de origen: customers/{uid}/subscriptions/{subscriptionId}
 * Documentos afectados: users/{uid}/teams/{teamId} y users/{uid}
 */

const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

// Inicializa Firebase Admin si no está ya inicializado
initializeApp();
const db = getFirestore();

/**
 * Escucha cambios en las suscripciones creadas por la extensión de Stripe.
 * Se activa cuando se crea, actualiza o elimina un documento de suscripción.
 */
exports.syncStripeSubscriptionToTeam = onDocumentWritten(
  'customers/{uid}/subscriptions/{subscriptionId}',
  async (event) => {
    const { uid, subscriptionId } = event.params;
    const subscriptionData = event.data?.after?.exists
      ? event.data.after.data()
      : null;

    logger.info(`[Stripe Sync] Procesando suscripción para usuario ${uid}, SubID: ${subscriptionId}`);

    // ── CASO 1: Suscripción eliminada → degradar a free ───────────────────────
    if (!subscriptionData) {
      logger.info(`[Stripe Sync] Suscripción eliminada. Revirtiendo usuario ${uid} a plan free.`);
      await downgradeUserTeams(uid);
      await db.doc(`users/${uid}`).set(
        { plan: 'free', stripeSubscriptionId: null, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return null;
    }

    const status = subscriptionData.status; // 'active', 'trialing', 'canceled', 'unpaid', etc.
    const metadata = subscriptionData.metadata || {};
    const teamId = metadata.teamId || null;

    // ── Determinar el tipo de plan ────────────────────────────────────────────
    let planType = 'free';
    if (status === 'active' || status === 'trialing') {
      // Leer plan desde metadata, role de la extensión, o items del precio
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

    // ── Fecha de expiración del período actual ────────────────────────────────
    const proExpiration = subscriptionData.current_period_end || null;

    logger.info(`[Stripe Sync] Estado: ${status} → Plan: ${planType}, TeamID: ${teamId || 'todos'}`);

    // ── CASO 2: Actualizar equipo específico (si viene en metadata) ───────────
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
        logger.info(`[Stripe Sync] Equipo ${teamId} actualizado a plan ${planType}.`);
      } else {
        // El equipo no existe con ese ID, actualizar todos como fallback
        logger.warn(`[Stripe Sync] Equipo ${teamId} no encontrado. Actualizando todos.`);
        await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
      }
    } else {
      // ── CASO 3: Sin teamId → actualizar todos los equipos del usuario ─────
      await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
    }

    // ── Actualizar documento raíz del usuario ─────────────────────────────────
    await db.doc(`users/${uid}`).set(
      {
        plan: planType,
        stripeSubscriptionId: subscriptionId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info(`[Stripe Sync] Documento de usuario ${uid} actualizado.`);
    return null;
  }
);

/**
 * Degrada todos los equipos del usuario a plan free al cancelar suscripción.
 */
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
  logger.info(`[Stripe Sync] ${snapshot.size} equipos degradados a free para usuario ${uid}.`);
}

/**
 * Sincroniza el plan en TODOS los equipos del usuario.
 */
async function syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId) {
  const teamsRef = db.collection(`users/${uid}/teams`);
  const snapshot = await teamsRef.get();
  if (snapshot.empty) {
    logger.info(`[Stripe Sync] Usuario ${uid} no tiene equipos. Nada que actualizar.`);
    return;
  }

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
  logger.info(`[Stripe Sync] ${snapshot.size} equipos de ${uid} actualizados a plan ${planType}.`);
}
