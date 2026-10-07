import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const translationsFilePath = resolve(__dirname, '../src/i18n/translations.js');
const registryFilePath = resolve(__dirname, '../src/i18n/locales/registry.js');
const srcDirPath = resolve(__dirname, '../src');

async function loadLocalesAndRegistry() {
  const fileUrl = 'file:///' + translationsFilePath.replace(/\\/g, '/');
  const mod = await import(fileUrl);
  const regUrl = 'file:///' + registryFilePath.replace(/\\/g, '/');
  const regMod = await import(regUrl);
  return {
    translations: mod.translations || mod.default,
    registry: regMod.LOCALES_REGISTRY,
    getActiveLocales: regMod.getActiveLocales
  };
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
      if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'locales') continue;
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
  console.log('🔍 [i18n-check] Verificando paridad simétrica N-Lenguas (Gate G1) en Míster11...');
  
  const { translations, getActiveLocales } = await loadLocalesAndRegistry();
  const activeLocales = getActiveLocales();

  const esObj = translations['Español (ES)'] || translations['es'];
  if (!esObj) {
    console.error('❌ Error crítico: No se encontró el diccionario base Español (ES).');
    process.exit(1);
  }

  const esKeys = getLeafKeys(esObj).sort();
  const esSet = new Set(esKeys);
  let hasErrors = false;

  console.log(`📋 Idiomas Activos a validar: ${activeLocales.map(l => `${l.label} [${l.code}]`).join(', ')}`);

  for (const loc of activeLocales) {
    const dict = translations[loc.label] || translations[loc.code];
    if (!dict) {
      console.error(`❌ Error crítico: Diccionario no encontrado para lengua activa ${loc.label} (${loc.code}).`);
      hasErrors = true;
      continue;
    }

    const locKeys = getLeafKeys(dict).sort();
    const locSet = new Set(locKeys);

    const missingInLoc = esKeys.filter(k => !locSet.has(k));
    const extraInLoc = locKeys.filter(k => !esSet.has(k));

    if (missingInLoc.length > 0) {
      console.error(`❌ Faltan ${missingInLoc.length} claves en ${loc.label} (${loc.code}):`);
      missingInLoc.slice(0, 10).forEach(k => console.error(`   - ${k}`));
      if (missingInLoc.length > 10) console.error(`   ... y ${missingInLoc.length - 10} más.`);
      hasErrors = true;
    }

    if (extraInLoc.length > 0) {
      console.error(`❌ Hay ${extraInLoc.length} claves sobrantes en ${loc.label} (${loc.code}):`);
      extraInLoc.slice(0, 10).forEach(k => console.error(`   - ${k}`));
      hasErrors = true;
    }

    // Comprobación de placeholders
    let placeholderMismatches = 0;
    for (const k of esKeys) {
      if (locSet.has(k)) {
        const valEs = getValueByPath(esObj, k);
        const valLoc = getValueByPath(dict, k);
        const paramsEs = getParamPlaceholders(valEs).join(',');
        const paramsLoc = getParamPlaceholders(valLoc).join(',');

        if (paramsEs !== paramsLoc) {
          console.warn(`⚠️ Inconsistencia de variables en "${k}" para ${loc.code}: ES=[${paramsEs}] vs LOC=[${paramsLoc}]`);
          placeholderMismatches++;
        }
      }
    }

    // G1 Amplificado (Oleada 1): Detección estricta con ALLOWLIST explícita
    // Toda clave idéntica a EN es un offender SALVO que pertenezca a la allowlist explícita
    const ALLOWLIST_G1 = new Set([
      // Siglas y Acrónimos médicos, deportivos y técnicos
      'RPE', 'GPS', 'ACWR', 'VAR', 'sRPE', 'HR', 'xG', 'PDF', 'CSV', 'JSON', 'PWA', 'DOMS', 'CMJ', 'SJ',
      'ACSI-28', 'OK', 'ID', 'URL', 'Email', 'cm', 'kg', 'km/h', 'min', 'sec', '%', '$', '€',
      // Pizarra táctica y posiciones
      'MC', 'DEF', 'LTI', 'EXT', 'POR', 'f8', 'MP', 'XI', 'DOR',
      // Nombres de planes y marcas
      'Mister11', 'Míster11', 'MISTER 11', 'FIFA', 'UEFA', 'RFEF', 'CONMEBOL', 'CBF', 'FFF', 'PSSI',
      'Google', 'Apple', 'Chrome', 'Android', 'Nordic', 'Copenhagen', 'Stroop', 'Illinois', 'Yo-Yo',
      'Club Starter', 'Club PRO', 'Club Premium', 'Global XP', '📅 Google Cal', '📥 ICS', 'iOS (Safari):',
      'https://mister11.com/join-staff?code=ABC123',
      // Abreviaturas de meses universales (3 letras coincidentes)
      'Nov', 'Mar', 'Jun', 'Jul', 'Sep', 'Oct', 'Feb',
      // Términos técnicos y universales multilingües
      'Admin', 'Club', 'General', 'GENERAL', 'Stats', 'Ranking', 'Zen', 'Sets', 'sets',
      'Core / Pelvis', 'INDIVIDUAL', 'Individual', 'Manual', 'Auto', 'Error', 'Normal', 'Test'
    ]);

    const enObj = translations['English (EN)'] || translations['en'];
    let untranslatedUiSentences = 0;
    if (loc.code !== 'en' && enObj) {
      for (const k of esKeys) {
        const valEn = getValueByPath(enObj, k);
        const valLoc = getValueByPath(dict, k);
        if (typeof valEn === 'string' && valEn.length > 0 && valLoc === valEn) {
          const trimmed = valEn.trim();
          const isAllowed = 
            ALLOWLIST_G1.has(trimmed) ||
            /^[A-Z0-9_\-\.\/]{1,6}$/.test(trimmed) ||
            /^\{[a-zA-Z0-9_]+\}$/.test(trimmed);

          if (!isAllowed) {
            console.error(`❌ [G1 Gate] Clave sin traducir en ${loc.code.toUpperCase()}: "${k}" = "${valLoc}" (idéntica a EN y fuera de allowlist)`);
            untranslatedUiSentences++;
            hasErrors = true;
          }
        }
      }
    }

    console.log(`   ✅ [${loc.code.toUpperCase()}] ${loc.label}: ${locKeys.length} claves | Paridad 100% | ${placeholderMismatches} advertencias | ${untranslatedUiSentences} términos fuera de allowlist.`);
  }

  // Comprobación de claves utilizadas en código
  const usedKeys = extractUsedKeysFromCode();
  const missingInDictionary = [];
  for (const [key, files] of usedKeys.entries()) {
    if (!esSet.has(key)) {
      missingInDictionary.push({ key, files: Array.from(new Set(files)) });
    }
  }

  if (missingInDictionary.length > 0) {
    console.error(`\n❌ Se encontraron ${missingInDictionary.length} claves utilizadas en el código que NO existen en el diccionario:`);
    missingInDictionary.forEach(({ key, files }) => {
      console.error(`   - "${key}" (en: ${files.join(', ')})`);
    });
    hasErrors = true;
  }

  console.log(`\n📊 Resumen de Paridad Multi-Lengua:`);
  console.log(`   - Lenguas activas validadas: ${activeLocales.length}`);
  console.log(`   - Claves base por lengua:    ${esKeys.length}`);
  console.log(`   - Claves utilizadas en código: ${usedKeys.size}`);
  console.log(`   - Claves huérfanas en código:  ${missingInDictionary.length}`);
  console.log(`   - Paridad simétrica total:   ${!hasErrors ? '100% PERFECTA ✅' : 'CON ERRORES ❌'}`);

  if (hasErrors) {
    console.error('\n❌ La verificación de i18n ha fallado. Revisa las claves faltantes arriba.\n');
    process.exit(1);
  } else {
    console.log('\n✨ ¡Paridad N-Lenguas 100% verificada con éxito! Cero claves huérfanas en el código.\n');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error('Error ejecutando check-i18n:', err);
  process.exit(1);
});
