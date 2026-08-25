#!/usr/bin/env node
/**
 * scripts/check-i18n.js
 * Puerta de calidad permanente de Internacionalización (i18n) para Míster11.
 * Valida paridad exacta al 100% entre traducciones 'Español (ES)' y 'English (EN)'.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const translationsFilePath = resolve(__dirname, '../src/i18n/translations.js');
const translationsFileContent = readFileSync(translationsFilePath, 'utf-8');

// Extraer dinámicamente el objeto de traducciones
async function loadTranslations() {
  const fileUrl = 'file:///' + translationsFilePath.replace(/\\/g, '/');
  const mod = await import(fileUrl);
  return mod.translations || mod.default;
}

function getLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getParamPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{[a-zA-Z0-9_]+\}/g);
  return matches ? matches.sort() : [];
}

function getValueByPath(obj, path) {
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (!curr || typeof curr !== 'object') return undefined;
    curr = curr[p];
  }
  return curr;
}

async function runCheck() {
  console.log('🔍 [i18n-check] Verificando paridad simétrica de traducciones en Míster11...');
  
  const translations = await loadTranslations();
  
  const esObj = translations['Español (ES)'] || translations['es'];
  const enObj = translations['English (EN)'] || translations['en'];

  if (!esObj || !enObj) {
    console.error('❌ Error crítico: No se encontraron los diccionarios principales de Español e Inglés.');
    process.exit(1);
  }

  const esKeys = getLeafKeys(esObj).sort();
  const enKeys = getLeafKeys(enObj).sort();

  const esSet = new Set(esKeys);
  const enSet = new Set(enKeys);

  const missingInEn = esKeys.filter(k => !enSet.has(k));
  const missingInEs = enKeys.filter(k => !esSet.has(k));

  let hasErrors = false;

  if (missingInEn.length > 0) {
    console.error(`❌ Faltan ${missingInEn.length} claves en Inglés (EN):`);
    missingInEn.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }

  if (missingInEs.length > 0) {
    console.error(`❌ Faltan ${missingInEs.length} claves en Español (ES):`);
    missingInEs.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }

  // Comprobación de placeholders / variables interpoladas
  let placeholderMismatches = 0;
  for (const k of esKeys) {
    if (enSet.has(k)) {
      const valEs = getValueByPath(esObj, k);
      const valEn = getValueByPath(enObj, k);
      const paramsEs = getParamPlaceholders(valEs).join(',');
      const paramsEn = getParamPlaceholders(valEn).join(',');

      if (paramsEs !== paramsEn) {
        console.warn(`⚠️ Inconsistencia de variables en clave "${k}": ES=[${paramsEs}] vs EN=[${paramsEn}]`);
        placeholderMismatches++;
      }
    }
  }

  console.log(`\n📊 Resumen de Auditoría i18n:`);
  console.log(`   - Claves en Español (ES): ${esKeys.length}`);
  console.log(`   - Claves en Inglés (EN):  ${enKeys.length}`);
  console.log(`   - Paridad simétrica:     ${esKeys.length === enKeys.length && !hasErrors ? '100% PERFECTA ✅' : 'DESIGUAL ❌'}`);
  console.log(`   - Variables interpoladas:${placeholderMismatches === 0 ? ' Consistentes ✅' : ` ${placeholderMismatches} advertencias ⚠️`}`);

  if (hasErrors) {
    console.error('\n❌ La verificación de i18n ha fallado. Revisa las claves faltantes arriba.\n');
    process.exit(1);
  } else {
    console.log('\n✨ ¡Paridad i18n 100% verificada con éxito! Ninguna clave huérfana.\n');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error('Error ejecutando check-i18n:', err);
  process.exit(1);
});
