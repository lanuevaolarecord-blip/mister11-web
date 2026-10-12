const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/jhojan/.gemini/antigravity-ide/brain/37d97120-7a78-4697-84f6-89987d46d509');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'scratch/screenshots_player');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ── 1. ASERCIÓN ESTÁTICA Y DE INTEGRIDAD DE ARCHIVOS ─────────────────────────
console.log('==============================================================================');
console.log('MÍSTER 11 — TEST SUITE AUDITORÍA PORTAL DEL JUGADOR (OLEADA 6.3b)');
console.log('==============================================================================\n');

console.log('▶ [Paso 1/5] Verificando erradicación de find-replace corrupto en diccionarios...');
const locales = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];
const corruptTokens = ['ChTousenges', 'ChSemuaenges', 'FootbTous', 'FootbSemua', 'sleep et', 'sleep dan'];
let corruptionFound = false;

for (const loc of locales) {
  const content = fs.readFileSync(path.resolve(`src/i18n/locales/${loc}.js`), 'utf8');
  for (const token of corruptTokens) {
    if (content.includes(token)) {
      console.error(`❌ Corrupción encontrada en ${loc}.js: "${token}"`);
      corruptionFound = true;
    }
  }
}
if (corruptionFound) {
  throw new Error('Fallo de aserción: Se detectaron subcadenas corrompidas en los diccionarios.');
}
console.log('   ✅ Cero corrupciones de find-replace detectadas en los 6 diccionarios.\n');

console.log('▶ [Paso 2/5] Verificando 0 isEn binarios en componentes de src/components/player/ ...');
const playerDir = path.resolve('src/components/player');
const playerFiles = fs.readdirSync(playerDir).filter(f => f.endsWith('.jsx'));
let isEnCount = 0;

for (const f of playerFiles) {
  const code = fs.readFileSync(path.join(playerDir, f), 'utf8');
  const matches = code.match(/\bisEn\b/g);
  if (matches) {
    console.error(`❌ Variable isEn encontrada en ${f}: ${matches.length}`);
    isEnCount += matches.length;
  }
}
if (isEnCount > 0) {
  throw new Error(`Fallo de aserción: Se detectaron ${isEnCount} usos de isEn en src/components/player/`);
}
console.log('   ✅ Cero variables isEn activas en src/components/player/ (0 encontradas).\n');

console.log('▶ [Paso 3/5] Verificando 0 banderas emojis y emojis decorativos en el portal...');
const flagRegex = /[\u{1F1E6}-\u{1F1FF}]/gu;
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
let flagViolations = 0;
let emojiViolations = 0;

for (const f of playerFiles) {
  const code = fs.readFileSync(path.join(playerDir, f), 'utf8');
  const flags = code.match(flagRegex) || [];
  const emojis = (code.match(emojiRegex) || []).filter(e => e !== '✕'); // permitir solo ✕ de cierre
  if (flags.length > 0) {
    console.error(`❌ Banderas emoji encontradas en ${f}:`, flags);
    flagViolations += flags.length;
  }
  if (emojis.length > 0) {
    console.error(`❌ Emojis decorativos encontrados en ${f}:`, emojis);
    emojiViolations += emojis.length;
  }
}
if (flagViolations > 0 || emojiViolations > 0) {
  throw new Error(`Fallo de aserción: banderas=${flagViolations}, emojis=${emojiViolations}`);
}
console.log('   ✅ Cero banderas emojis y cero emojis decorativos en el portal (reemplazados por Lucide).\n');

console.log('▶ [Paso 4/5] Verificando soporte de defensa en profundidad (assertAgeSafe + Ban) y chip clínico...');
const plansCode = fs.readFileSync(path.join(playerDir, 'PlayerPlansPortalTab.jsx'), 'utf8');

if (!plansCode.includes('assertAgeSafe') || !plansCode.includes('not-age-safe-badge') || !plansCode.includes('disabled={isAgeBlocked}')) {
  throw new Error('Fallo de aserción: PlayerPlansPortalTab debe integrar assertAgeSafe, not-age-safe-badge y disabled={isAgeBlocked}');
}
if (!plansCode.includes('clinical-fallback-chip') || !plansCode.includes("t('clinical.fallbackChip')")) {
  throw new Error('Fallo de aserción: PlayerPlansPortalTab debe integrar clinical-fallback-chip con t("clinical.fallbackChip")');
}
console.log('   ✅ assertAgeSafe, badge no apto y chip clínico verificados en PlayerPlansPortalTab.\n');

console.log('▶ [Paso 5/5] Verificando auto-guardado B con cola y micro-indicador en PlayerProfileTab...');
const profileCode = fs.readFileSync(path.join(playerDir, 'PlayerProfileTab.jsx'), 'utf8');

if (!profileCode.includes('m11_wellness_queue') || !profileCode.includes('syncStatus') || !profileCode.includes('wellness-micro-indicator')) {
  throw new Error('Fallo de aserción: PlayerProfileTab debe integrar m11_wellness_queue, syncStatus y wellness-micro-indicator');
}
if (!profileCode.includes("window.addEventListener('online', handleOnline)")) {
  throw new Error('Fallo de aserción: PlayerProfileTab debe escuchar el evento online para reintento automático');
}
console.log('   ✅ Auto-guardado B con cola local, micro-indicador y evento online verificado.\n');

console.log('==============================================================================');
console.log('🎉 [PASS] TODAS LAS 5 ASERCIONES DE AUDITORÍA SUPERADAS AL 100%');
console.log('==============================================================================');
