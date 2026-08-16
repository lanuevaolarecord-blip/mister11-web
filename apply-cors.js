/**
 * apply-cors.js
 * Script para aplicar las reglas de CORS al bucket de Firebase Storage usando la librería de Google Cloud Storage.
 *
 * Instrucciones:
 * 1. Si tienes gsutil instalado en Google Cloud Shell o en tu terminal:
 *    gsutil cors set cors.json gs://mister11.firebasestorage.app
 *    (O alternativamente: gsutil cors set cors.json gs://mister11.appspot.com)
 *
 * 2. Para ejecutar este script con Node.js (requiere credenciales de servicio o `gcloud auth application-default login`):
 *    node apply-cors.js
 */

import fs from 'fs';
import { Storage } from '@google-cloud/storage';

async function setCorsConfiguration() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'mister11.firebasestorage.app';
  console.log(`[CORS] Aplicando reglas de cors.json al bucket: ${bucketName}...`);

  try {
    const corsConfig = JSON.parse(fs.readFileSync('./cors.json', 'utf8'));
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);

    await bucket.setCorsConfiguration(corsConfig);
    console.log(`✅ [CORS] Reglas aplicadas con éxito al bucket ${bucketName}!`);

    const [metadata] = await bucket.getMetadata();
    console.log('[CORS] Configuración actual de CORS en el bucket:', JSON.stringify(metadata.cors, null, 2));
  } catch (error) {
    console.error('❌ [CORS] Error aplicando configuración:', error.message);
    console.log('\n💡 Alternativa recomendada usando Google Cloud Shell:');
    console.log('1. Abre https://console.cloud.google.com/');
    console.log('2. Abre el botón de Cloud Shell (>_) arriba a la derecha');
    console.log('3. Sube el archivo cors.json y ejecuta:');
    console.log('   gcloud storage buckets update gs://' + bucketName + ' --cors-file=cors.json');
    console.log('   ó');
    console.log('   gsutil cors set cors.json gs://' + bucketName);
  }
}

setCorsConfiguration();
