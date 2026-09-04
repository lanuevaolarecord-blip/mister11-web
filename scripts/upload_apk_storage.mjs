/**
 * Sube el APK a Firebase Storage y actualiza config/global en Firestore
 * Usa las credenciales de Application Default Credentials (firebase login)
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Configuración ────────────────────────────────────────────────────────────
const APK_PATH = 'android/app/build/outputs/apk/release/mister11.apk';
const STORAGE_PATH = 'mister11.apk';
const BUCKET = 'mister11.firebasestorage.app';
const NEW_VERSION = '1.1.65';
const NEW_VERSION_CODE = 81;

process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

initializeApp({
  credential: applicationDefault(),
  storageBucket: BUCKET,
  projectId: 'mister11',
});

const storage = getStorage();
const db = getFirestore();

// ─── Subir APK ────────────────────────────────────────────────────────────────
console.log(`📤 Subiendo APK desde: ${APK_PATH}`);
console.log(`   → gs://${BUCKET}/${STORAGE_PATH}`);

const bucket = storage.bucket();
const [file, metadata] = await bucket.upload(APK_PATH, {
  destination: STORAGE_PATH,
  metadata: {
    contentType: 'application/vnd.android.package-archive',
    metadata: {
      version: NEW_VERSION,
      versionCode: String(NEW_VERSION_CODE),
    },
  },
});

// Hacer el archivo público y obtener URL de descarga firmada
await file.makePublic();
const apkUrl = `https://storage.googleapis.com/${BUCKET}/${STORAGE_PATH}`;

// URL de descarga con token (compatible con Firebase Console)
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: '2030-01-01',
});

console.log(`✅ APK subido correctamente`);
console.log(`   URL pública: ${apkUrl}`);
console.log(`   Tamaño: ${(metadata.size / 1024 / 1024).toFixed(1)} MB`);

// ─── Actualizar Firestore ──────────────────────────────────────────────────────
console.log(`\n📝 Actualizando config/global en Firestore...`);

const now = new Date().toISOString();
await db.collection('config').doc('global').set({
  apkUrl: apkUrl,
  apkDownloadUrl: signedUrl,
  apkVersion: NEW_VERSION,
  latestApkVersion: NEW_VERSION,
  versionCode: NEW_VERSION_CODE,
  apkUpdatedAt: now,
}, { merge: true });

console.log(`✅ Firestore actualizado:`);
console.log(`   apkVersion: ${NEW_VERSION}`);
console.log(`   versionCode: ${NEW_VERSION_CODE}`);
console.log(`   apkUpdatedAt: ${now}`);
console.log(`\n🎉 ¡Todo listo! APK v${NEW_VERSION} disponible en Firebase.`);
