/**
 * upload-apk.mjs
 * Sube el APK debug a Firebase Storage y actualiza config/global en Firestore
 * Uso: node upload-apk.mjs
 */

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuración Firebase (desde .env) ────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyAIsUQOnmsMLOt16kwis2s7ODv-mpzeeWo',
  authDomain:        'mister11.firebaseapp.com',
  projectId:         'mister11',
  storageBucket:     'mister11.firebasestorage.app',
  messagingSenderId: '954668402587',
  appId:             '1:954668402587:web:ccae27f1bba1396d2b833e',
};

// ─── Datos de la versión (Leída de package.json) ─────────────────────────────
const pkgJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = pkgJson.version;
const APK_LOCAL_PATH = resolve(
  __dirname,
  'android/app/build/outputs/apk/release/mister11.apk'
);
const APK_STORAGE_PATH = 'mister11.apk'; // Ruta en Firebase Storage

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando subida del APK a Firebase Storage...');
  console.log(`   Versión: v${APP_VERSION}`);
  console.log(`   Archivo: ${APK_LOCAL_PATH}\n`);

  // 1. Inicializar Firebase
  const app     = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const db      = getFirestore(app);

  // 2. Leer el archivo APK
  let apkBuffer;
  try {
    apkBuffer = readFileSync(APK_LOCAL_PATH);
    const sizeMB = (apkBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`✅ APK leído correctamente (${sizeMB} MB)`);
  } catch (err) {
    console.error('❌ No se encontró el APK en:', APK_LOCAL_PATH);
    console.error('   Asegúrate de haber compilado el proyecto Android primero.');
    process.exit(1);
  }

  // 3. Subir a Firebase Storage
  console.log('\n⬆️  Subiendo a Firebase Storage...');
  const storageRef = ref(storage, APK_STORAGE_PATH);
  
  try {
    const snapshot = await uploadBytes(storageRef, apkBuffer, {
      contentType: 'application/vnd.android.package-archive',
      contentDisposition: 'attachment; filename="mister11.apk"',
      customMetadata: {
        versionName: APP_VERSION,
        uploadedAt:  new Date().toISOString(),
        description: 'Mister11 Android App - Release Build',
      },
    });
    console.log(`✅ APK subido correctamente: ${snapshot.metadata.fullPath}`);

    // 4. Obtener URL de descarga pública
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`\n🔗 URL de descarga:\n   ${downloadURL}`);

    // 5. Actualizar Firestore config/global
    console.log('\n📝 Actualizando Firestore config/global...');
    const configRef = doc(db, 'config', 'global');
    
    // Leer datos existentes para no sobreescribir otros campos
    const existing = await getDoc(configRef);
    const currentData = existing.exists() ? existing.data() : {};

    await setDoc(configRef, {
      ...currentData,
      latestApkVersion: APP_VERSION,
      appVersion:       APP_VERSION,
      apkDownloadUrl:   downloadURL,
      apkUrl:           downloadURL,
      apkUpdatedAt:     new Date().toISOString(),
    });

    console.log('✅ Firestore actualizado correctamente.\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log(`   Versión en Firestore: v${APP_VERSION}`);
    console.log(`   URL guardada:         ${downloadURL}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\nLos usuarios verán la actualización disponible la próxima');
    console.log('vez que pulsen "Buscar actualizaciones" en la app. ✨\n');

  } catch (err) {
    console.error('\n❌ Error durante la subida:', err.message);
    if (err.code === 'storage/unauthorized') {
      console.error('   → Las reglas de Firebase Storage no permiten escritura.');
      console.error('   → Ve a Firebase Console → Storage → Rules y permite escritura temporalmente.');
    }
    process.exit(1);
  }
}

main();
