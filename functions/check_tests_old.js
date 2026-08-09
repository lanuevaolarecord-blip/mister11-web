const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  projectId: 'mister11'
});

const db = getFirestore();

async function checkOldTestIds() {
  console.log('=== VERIFICANDO RESULTADOS DE TESTS CON SUFIJO _old ===');
  
  const oldIds = [
    'psi1_old', 'psi2_old', 'psi3_old', 'psi4_old', 'psi5_old',
    'soc1_old', 'soc2_old', 'soc3_old', 'soc4_old', 'soc5_old'
  ];

  const idMap = {
    'psi1_old': 'psi1',
    'psi2_old': 'psi2',
    'psi3_old': 'psi3',
    'psi4_old': 'psi4',
    'psi5_old': 'psi5',
    'soc1_old': 'soc1',
    'soc2_old': 'soc2',
    'soc3_old': 'soc3',
    'soc4_old': 'soc4',
    'soc5_old': 'soc5'
  };

  const snap = await db.collectionGroup('tests').get();
  console.log(`Total de documentos de test encontrados en la base de datos: ${snap.size}`);

  let foundOld = 0;
  let migrated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const testId = data.testId || data.id;

    if (oldIds.includes(testId)) {
      foundOld++;
      const newId = idMap[testId];
      console.log(`Documento ${docSnap.ref.path} tiene ID antiguo '${testId}'. Migrando a '${newId}'...`);
      await docSnap.ref.update({
        testId: newId,
        id: newId,
        migratedFromOld: true,
        migratedAt: new Date()
      });
      migrated++;
    }
  }

  console.log(`\n=== RESUMEN MIGRACIÓN TESTS _old ===`);
  console.log(`Encontrados con _old: ${foundOld}`);
  console.log(`Migrados a nuevos IDs: ${migrated}`);
}

checkOldTestIds().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
