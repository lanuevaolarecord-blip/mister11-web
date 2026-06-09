const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa Firebase Admin si no está ya inicializado
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function que escucha cambios en las suscripciones creadas por la extensión de Stripe
 * Ruta del documento: customers/{uid}/subscriptions/{subscriptionId}
 */
exports.syncStripeSubscriptionToTeam = functions.firestore
  .document('customers/{uid}/subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const { uid, subscriptionId } = context.params;
    const subscriptionData = change.after.exists ? change.after.data() : null;

    console.log(`[Stripe Sync] Procesando actualización de suscripción para usuario ${uid}, SubID: ${subscriptionId}`);

    // Si la suscripción fue eliminada, cambiamos los planes a "free"
    if (!subscriptionData) {
      console.log(`[Stripe Sync] Suscripción ${subscriptionId} eliminada. Revirtiendo equipos de usuario ${uid} a plan free.`);
      await downgradeUserTeams(uid);
      return null;
    }

    const status = subscriptionData.status; // 'active', 'trialing', 'canceled', 'unpaid', etc.
    const metadata = subscriptionData.metadata || {};
    const teamId = metadata.teamId;

    // Determinar el nivel de plan basado en el rol de la extensión o id del precio/producto
    // El plan por defecto si la suscripción está activa es 'pro'.
    // Si tienes roles específicos en la extensión, se puede leer de subscriptionData.role.
    let planType = 'free';
    if (status === 'active' || status === 'trialing') {
      // Si en los metadata se especificó un plan, lo usamos. Si no, por defecto es 'pro'.
      planType = metadata.plan || (subscriptionData.role || 'pro');
    }

    // Convertir el Timestamp del fin del período para la fecha de expiración
    const currentPeriodEnd = subscriptionData.current_period_end;
    let proExpiration = null;
    if (currentPeriodEnd) {
      // stripe-payments almacena current_period_end como Firestore Timestamp
      proExpiration = currentPeriodEnd;
    }

    console.log(`[Stripe Sync] Suscripción Estado: ${status}, Plan determinado: ${planType}, TeamID: ${teamId || 'No provisto (se actualizarán todos)'}`);

    if (teamId) {
      // 1. Caso ideal: Tenemos el ID del equipo en los metadatos de la sesión
      const teamRef = db.doc(`users/${uid}/teams/${teamId}`);
      const teamSnap = await teamRef.get();

      if (teamSnap.exists) {
        await teamRef.update({
          plan: planType,
          proExpiration: proExpiration,
          stripeSubscriptionId: subscriptionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Stripe Sync] Equipo ${teamId} actualizado exitosamente al plan ${planType}.`);
      } else {
        console.warn(`[Stripe Sync] El equipo ${teamId} especificado en los metadatos no existe. Buscando otros equipos.`);
        await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
      }
    } else {
      // 2. Fallback: No hay teamId en los metadatos, actualizamos todos los equipos del usuario
      await syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId);
    }

    // Opcional: Actualizar el documento raíz del usuario para sincronización
    await db.doc(`users/${uid}`).set({
      plan: planType,
      stripeSubscriptionId: subscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return null;
  });

/**
 * Auxiliar para degradar todos los equipos del usuario a plan free
 */
async function downgradeUserTeams(uid) {
  const teamsRef = db.collection(`users/${uid}/teams`);
  const snapshot = await teamsRef.get();
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      plan: 'free',
      proExpiration: null,
      stripeSubscriptionId: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  console.log(`[Stripe Sync] Se degradaron ${snapshot.size} equipos a plan free para el usuario ${uid}.`);
}

/**
 * Auxiliar para sincronizar el plan en todos los equipos del usuario
 */
async function syncAllTeamsForUser(uid, planType, proExpiration, subscriptionId) {
  const teamsRef = db.collection(`users/${uid}/teams`);
  const snapshot = await teamsRef.get();
  
  if (snapshot.empty) {
    console.log(`[Stripe Sync] El usuario ${uid} no tiene equipos registrados.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      plan: planType,
      proExpiration: proExpiration,
      stripeSubscriptionId: subscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  console.log(`[Stripe Sync] Sincronizados ${snapshot.size} equipos al plan ${planType} para el usuario ${uid}.`);
}
