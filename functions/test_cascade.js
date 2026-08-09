const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'mister11'
});

const db = getFirestore();

async function runTest() {
  console.log('=== TEST BORRADO EN CASCADA CLOUD FUNCTION ===');
  const uid = 'test-audit-user-' + Date.now();
  const deleteTeamId = 'team-to-delete-' + Date.now();
  const keepTeamId = 'team-to-keep-' + Date.now();

  console.log(`1. Creando usuario de prueba: ${uid}`);
  await db.doc(`users/${uid}`).set({ name: 'Test Cascade User', createdAt: new Date() });

  console.log(`2. Creando equipo a borrar: ${deleteTeamId} con 4 subcolecciones`);
  await db.doc(`users/${uid}/teams/${deleteTeamId}`).set({ nombre: 'Equipo a Borrar', plan: 'free' });
  await db.doc(`users/${uid}/teams/${deleteTeamId}/players/player-1`).set({ nombre: 'Jugador 1' });
  await db.doc(`users/${uid}/teams/${deleteTeamId}/sessions/session-1`).set({ title: 'Sesión 1' });
  await db.doc(`users/${uid}/teams/${deleteTeamId}/matches/match-1`).set({ rival: 'Rival 1' });
  await db.doc(`users/${uid}/teams/${deleteTeamId}/exercises/exercise-1`).set({ name: 'Ejercicio 1' });

  console.log(`3. Creando equipo de control a mantener: ${keepTeamId}`);
  await db.doc(`users/${uid}/teams/${keepTeamId}`).set({ nombre: 'Equipo Seguro', plan: 'free' });
  await db.doc(`users/${uid}/teams/${keepTeamId}/players/player-safe`).set({ nombre: 'Jugador Seguro' });

  console.log('4. Eliminando únicamente el documento raíz del equipo...');
  await db.doc(`users/${uid}/teams/${deleteTeamId}`).delete();

  console.log('5. Esperando 6 segundos para dar tiempo a que la Cloud Function (cascadeDeleteUserTeam) procese el borrado...');
  await new Promise(res => setTimeout(res, 6000));

  console.log('6. Verificando subcolecciones del equipo eliminado:');
  const playersSnap = await db.collection(`users/${uid}/teams/${deleteTeamId}/players`).get();
  const sessionsSnap = await db.collection(`users/${uid}/teams/${deleteTeamId}/sessions`).get();
  const matchesSnap = await db.collection(`users/${uid}/teams/${deleteTeamId}/matches`).get();
  const exercisesSnap = await db.collection(`users/${uid}/teams/${deleteTeamId}/exercises`).get();

  console.log(`   - Documentos en players/  : ${playersSnap.size}`);
  console.log(`   - Documentos en sessions/ : ${sessionsSnap.size}`);
  console.log(`   - Documentos en matches/  : ${matchesSnap.size}`);
  console.log(`   - Documentos en exercises/: ${exercisesSnap.size}`);

  console.log('7. Verificando que el otro equipo del mismo usuario NO fue afectado:');
  const keepTeamSnap = await db.doc(`users/${uid}/teams/${keepTeamId}`).get();
  const keepPlayersSnap = await db.collection(`users/${uid}/teams/${keepTeamId}/players`).get();
  console.log(`   - Equipo seguro existe    : ${keepTeamSnap.exists}`);
  console.log(`   - Jugador en equipo seguro: ${keepPlayersSnap.size}`);

  const isClean = playersSnap.size === 0 && sessionsSnap.size === 0 && matchesSnap.size === 0 && exercisesSnap.size === 0 && keepTeamSnap.exists && keepPlayersSnap.size === 1;

  console.log(`\n>>> RESULTADO PRUEBA: ${isClean ? 'SUCCESS (Limpio y Aislado)' : 'FAILED'}`);

  // Limpieza final de datos de prueba
  await db.recursiveDelete(db.doc(`users/${uid}`));
  console.log('=== TEST FINALIZADO ===');
}

runTest().catch(console.error);
