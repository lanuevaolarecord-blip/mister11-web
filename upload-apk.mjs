/**
 * upload-apk.mjs
 * Sube el APK debug a Firebase Storage y actualiza config/global en Firestore
 * Uso: node upload-apk.mjs
 */

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

// ─── Datos de la versión (Leída de package.json y build.gradle) ──────────────
const pkgJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = pkgJson.version;
const buildGradle = readFileSync(resolve(__dirname, 'android/app/build.gradle'), 'utf8');
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
const APP_VERSION_CODE = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 85;
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
  const auth    = getAuth(app);
  const storage = getStorage(app);
  const db      = getFirestore(app);

  // Intentar iniciar sesión para pasar las reglas de Storage
  try {
    const email = process.env.FIREBASE_DEV_EMAIL || 'jhocao111294@gmail.com';
    const pass  = process.env.FIREBASE_DEV_PASS || 'Mister112026';
    await signInWithEmailAndPassword(auth, email, pass);
    console.log(`🔐 Autenticado correctamente como ${email}`);
  } catch (authErr) {
    console.warn('⚠️ No se pudo autenticar automáticamente:', authErr.message);
  }

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

  // 3. Subir a Firebase Storage o utilizar URL pública directa
  console.log('\n⬆️  Procesando subida a Firebase Storage y actualización Firestore...');
  const storageRef = ref(storage, APK_STORAGE_PATH);
  let downloadURL = 'https://firebasestorage.googleapis.com/v0/b/mister11.firebasestorage.app/o/mister11.apk?alt=media';
  
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
    downloadURL = await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('⚠️ Nota sobre Storage rules:', err.message);
    console.log('📌 Usando URL de descarga del bundle:', downloadURL);
  }

  try {
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
      versionCode:      APP_VERSION_CODE,
      apkDownloadUrl:   downloadURL,
      apkUrl:           downloadURL,
      apkUpdatedAt:     new Date().toISOString(),
    });

    console.log('✅ Firestore actualizado correctamente.\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log(`   Versión en Firestore: v${APP_VERSION}`);
    console.log(`   URL guardada:         ${downloadURL}`);
    console.log('═══════════════════════════════════════════════════\n');
  } catch (fsErr) {
    console.error('❌ Error actualizando Firestore:', fsErr.message);
  }
}

main();
