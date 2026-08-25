import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const translationsFilePath = resolve(__dirname, '../src/i18n/translations.js');
const srcDirPath = resolve(__dirname, '../src');

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

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractUsedKeysFromCode() {
  const files = getAllFiles(srcDirPath);
  const usedKeys = new Map(); // key -> [files]
  
  // Regex para t('key'), tr('key'), labelKey: 'key', nameKey: 'key', descKey: 'key', periodKey: 'key'
  const regexes = [
    /\b(?:t|tr)\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g,
    /\b(?:labelKey|nameKey|descKey|periodKey)\s*:\s*['"]([a-zA-Z0-9_.-]+)['"]/g
  ];

  for (const file of files) {
    if (file === translationsFilePath) continue;
    const content = readFileSync(file, 'utf-8');
    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        // Filtrar strings que claramente no son claves i18n
        if (key.includes('.') || key.startsWith('nav.') || key.startsWith('btn.') || key.startsWith('common.')) {
          if (!usedKeys.has(key)) {
            usedKeys.set(key, []);
          }
          usedKeys.get(key).push(file.replace(srcDirPath, 'src'));
        }
      }
    }
  }
  return usedKeys;
}

async function runCheck() {
  console.log('🔍 [i18n-check] Verificando paridad simétrica y uso de claves en Míster11...');
  
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

  // Comprobación de claves utilizadas en código que faltan en el diccionario
  const usedKeys = extractUsedKeysFromCode();
  const missingInDictionary = [];
  for (const [key, files] of usedKeys.entries()) {
    if (!esSet.has(key)) {
      missingInDictionary.push({ key, files: Array.from(new Set(files)) });
    }
  }

  if (missingInDictionary.length > 0) {
    console.error(`\n❌ Se encontraron ${missingInDictionary.length} claves utilizadas en el código que NO existen en translations.js:`);
    missingInDictionary.forEach(({ key, files }) => {
      console.error(`   - "${key}" (en: ${files.join(', ')})`);
    });
    hasErrors = true;
  }

  console.log(`\n📊 Resumen de Auditoría i18n:`);
  console.log(`   - Claves en Español (ES): ${esKeys.length}`);
  console.log(`   - Claves en Inglés (EN):  ${enKeys.length}`);
  console.log(`   - Claves utilizadas en código: ${usedKeys.size}`);
  console.log(`   - Claves faltantes en código:  ${missingInDictionary.length}`);
  console.log(`   - Paridad simétrica:     ${esKeys.length === enKeys.length && !hasErrors ? '100% PERFECTA ✅' : 'CON ERRORES ❌'}`);
  console.log(`   - Variables interpoladas:${placeholderMismatches === 0 ? ' Consistentes ✅' : ` ${placeholderMismatches} advertencias ⚠️`}`);

  if (hasErrors) {
    console.error('\n❌ La verificación de i18n ha fallado. Revisa las claves faltantes arriba.\n');
    process.exit(1);
  } else {
    console.log('\n✨ ¡Paridad i18n 100% verificada con éxito! Cero claves huérfanas en el código.\n');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error('Error ejecutando check-i18n:', err);
  process.exit(1);
});

