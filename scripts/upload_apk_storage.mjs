/**
 * Sube el APK a Firebase Storage y actualiza config/global en Firestore
 * Usa las credenciales activas de Firebase CLI (~/.config/configstore/firebase-tools.json)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const APK_PATH = 'android/app/build/outputs/apk/release/mister11.apk';
const STORAGE_PATH = 'mister11.apk';
const BUCKET = 'mister11.firebasestorage.app';
const NEW_VERSION = '1.1.65';
const NEW_VERSION_CODE = 81;

// 1. Obtener token de Firebase CLI
const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = configData.tokens?.access_token;

if (!accessToken) {
  throw new Error('No access token found in firebase-tools.json. Ejecuta "firebase login".');
}

const apkBuffer = fs.readFileSync(APK_PATH);
const fileSize = apkBuffer.length;
const downloadToken = crypto.randomUUID();

console.log(`📤 Subiendo APK (${(fileSize / (1024 * 1024)).toFixed(2)} MB) a Firebase Storage...`);
console.log(`   → gs://${BUCKET}/${STORAGE_PATH}`);

// Iniciar sesión resumable upload de GCS
const initRes = await fetch(
  `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=resumable&name=${encodeURIComponent(STORAGE_PATH)}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/vnd.android.package-archive',
      'X-Upload-Content-Length': String(fileSize),
    },
    body: JSON.stringify({
      contentType: 'application/vnd.android.package-archive',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        version: NEW_VERSION,
        versionCode: String(NEW_VERSION_CODE),
      },
    }),
  }
);

if (!initRes.ok) {
  const errText = await initRes.text();
  throw new Error(`Error al iniciar upload resumable (${initRes.status}): ${errText}`);
}

const uploadUrl = initRes.headers.get('location');

// Subir los bytes del archivo
const uploadRes = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Length': String(fileSize),
    'Content-Type': 'application/vnd.android.package-archive',
  },
  body: apkBuffer,
});

if (!uploadRes.ok) {
  const errText = await uploadRes.text();
  throw new Error(`Error al subir archivo (${uploadRes.status}): ${errText}`);
}

const uploadedMeta = await uploadRes.json();
console.log(`✅ APK subido exitosamente a Firebase Storage!`);

const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(STORAGE_PATH)}?alt=media&token=${downloadToken}`;
console.log(`   URL pública / descarga: ${publicUrl}`);
console.log(`   Tamaño confirmado: ${(uploadedMeta.size / (1024 * 1024)).toFixed(2)} MB`);

// 2. Actualizar Firestore config/global
console.log(`\n📝 Actualizando config/global en Firestore...`);
const now = new Date().toISOString();

const firestoreRes = await fetch(
  `https://firestore.googleapis.com/v1/projects/mister11/databases/(default)/documents/config/global?updateMask.fieldPaths=apkUrl&updateMask.fieldPaths=apkDownloadUrl&updateMask.fieldPaths=apkVersion&updateMask.fieldPaths=latestApkVersion&updateMask.fieldPaths=appVersion&updateMask.fieldPaths=versionCode&updateMask.fieldPaths=apkUpdatedAt`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        apkUrl: { stringValue: publicUrl },
        apkDownloadUrl: { stringValue: publicUrl },
        apkVersion: { stringValue: NEW_VERSION },
        latestApkVersion: { stringValue: NEW_VERSION },
        appVersion: { stringValue: NEW_VERSION },
        versionCode: { integerValue: String(NEW_VERSION_CODE) },
        apkUpdatedAt: { stringValue: now },
      },
    }),
  }
);

if (!firestoreRes.ok) {
  const errText = await firestoreRes.text();
  throw new Error(`Error al actualizar Firestore (${firestoreRes.status}): ${errText}`);
}

console.log(`✅ Firestore config/global actualizado con éxito:`);
console.log(`   version: ${NEW_VERSION}`);
console.log(`   versionCode: ${NEW_VERSION_CODE}`);
console.log(`   apkUpdatedAt: ${now}`);
console.log(`\n🎉 ¡Despliegue de APK completado con éxito!`);
