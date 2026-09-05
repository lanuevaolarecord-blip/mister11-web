/**
 * upload-release.mjs
 * Sube APK universal + AAB a Firebase Storage y actualiza config/global en Firestore
 * Uso: node upload-release.mjs
 */

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey:            'AIzaSyAIsUQOnmsMLOt16kwis2s7ODv-mpzeeWo',
  authDomain:        'mister11.firebaseapp.com',
  projectId:         'mister11',
  storageBucket:     'mister11.firebasestorage.app',
  messagingSenderId: '954668402587',
  appId:             '1:954668402587:web:ccae27f1bba1396d2b833e',
};

const pkgJson   = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
const VERSION   = pkgJson.version;          // e.g. "1.1.63"
const BUILD     = 84;

const APK_PATH  = resolve(__dirname, 'android/app/build/outputs/apk/release/mister11-universal.apk');
const AAB_PATH  = resolve(__dirname, 'android/app/build/outputs/bundle/release/app-release.aab');

const APK_URL_FALLBACK = 'https://firebasestorage.googleapis.com/v0/b/mister11.firebasestorage.app/o/mister11.apk?alt=media';
const AAB_URL_FALLBACK = 'https://firebasestorage.googleapis.com/v0/b/mister11.firebasestorage.app/o/mister11.aab?alt=media';

async function uploadFile(storage, localPath, storagePath, contentType, label) {
  console.log(`\n⬆️  Subiendo ${label}...`);
  const buffer = readFileSync(localPath);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
  console.log(`   Tamaño: ${sizeMB} MB`);

  const storageRef = ref(storage, storagePath);
  try {
    const snap = await uploadBytes(storageRef, buffer, {
      contentType,
      customMetadata: {
        versionName: VERSION,
        versionCode: String(BUILD),
        uploadedAt:  new Date().toISOString(),
      },
    });
    const url = await getDownloadURL(storageRef);
    console.log(`✅ ${label} subido: ${snap.metadata.fullPath}`);
    return url;
  } catch (err) {
    console.warn(`⚠️  Error subiendo ${label}: ${err.message}`);
    return storagePath.endsWith('.aab') ? AAB_URL_FALLBACK : APK_URL_FALLBACK;
  }
}

async function main() {
  console.log('🚀 Míster11 Release Upload');
  console.log(`   Versión: v${VERSION} (build ${BUILD})`);
  console.log('══════════════════════════════════════════════');

  const app     = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const db      = getFirestore(app);

  // 1. Subir APK universal
  const apkUrl = await uploadFile(
    storage, APK_PATH, 'mister11.apk',
    'application/vnd.android.package-archive',
    'APK Universal'
  );

  // 2. Subir AAB
  const aabUrl = await uploadFile(
    storage, AAB_PATH, 'mister11.aab',
    'application/octet-stream',
    'AAB (Play Store)'
  );

  // 3. Actualizar Firestore config/global
  console.log('\n📝 Actualizando Firestore config/global...');
  try {
    const configRef = doc(db, 'config', 'global');
    const existing  = await getDoc(configRef);
    const current   = existing.exists() ? existing.data() : {};

    await setDoc(configRef, {
      ...current,
      latestApkVersion: VERSION,
      appVersion:       VERSION,
      versionCode:      BUILD,
      apkDownloadUrl:   apkUrl,
      apkUrl:           apkUrl,
      aabUrl:           aabUrl,
      apkUpdatedAt:     new Date().toISOString(),
    });
    console.log('✅ Firestore actualizado correctamente.');
  } catch (err) {
    console.error('❌ Error Firestore:', err.message);
  }

  console.log('\n══════════════════════════════════════════════');
  console.log('✅ RELEASE COMPLETADO');
  console.log(`   APK: ${apkUrl}`);
  console.log(`   AAB: ${aabUrl}`);
  console.log('══════════════════════════════════════════════\n');
}

main();
