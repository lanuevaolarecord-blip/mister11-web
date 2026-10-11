import fs from 'fs';
import path from 'path';

const locales = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];

// Cargar diccionarios
const dicts = {};
for (const loc of locales) {
  const mod = await import(`../src/i18n/locales/${loc}.js`);
  dicts[loc] = mod.default || mod[loc] || mod;
}

console.log('=== AUDITORÍA REGEX PRICING (6 IDIOMAS) ===\n');

// Expresión regular para detectar banderas / emojis
const flagRegex = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

// Detectores de mezclas cruzadas
const crossLeakageChecks = {
  id: [
    { pattern: /\bHasta\b/i, name: 'Español "Hasta"' },
    { pattern: /\bIVA incluido\b/i, name: 'Español "IVA incluido"' },
    { pattern: /\bseason\b/i, name: 'Inglés "season"' },
    { pattern: /\btemp\.\b/i, name: 'Español "temp."' },
    { pattern: /\bFor\b/i, name: 'Inglés "For"' },
    { pattern: /\bseeking\b/i, name: 'Inglés "seeking"' },
    { pattern: /\bFeatures\b/i, name: 'Inglés "Features"' },
    { pattern: /\bSoporte VIP\b/i, name: 'Español "Soporte VIP"' },
    { pattern: /\bIlimitado\b/i, name: 'Español "Ilimitado"' },
    { pattern: /\btims\b/i, name: 'Plural roto "tims" con -s' }
  ],
  pt: [
    { pattern: /\bHasta\b/i, name: 'Español "Hasta"' },
    { pattern: /\bIVA incluido\b/i, name: 'Español "IVA incluido"' },
    { pattern: /\bseason\b/i, name: 'Inglés "season"' },
    { pattern: /\bFeatures\b/i, name: 'Inglés "Features"' }
  ],
  fr: [
    { pattern: /\bHasta\b/i, name: 'Español "Hasta"' },
    { pattern: /\bIVA incluido\b/i, name: 'Español "IVA incluido"' },
    { pattern: /\bseason\b/i, name: 'Inglés "season"' },
    { pattern: /\bFeatures\b/i, name: 'Inglés "Features"' }
  ],
  en: [
    { pattern: /\bHasta\b/i, name: 'Español "Hasta"' },
    { pattern: /\bIVA incluido\b/i, name: 'Español "IVA incluido"' },
    { pattern: /\btemp\.\b/i, name: 'Español "temp."' }
  ]
};

let errorCount = 0;

for (const loc of locales) {
  const dict = dicts[loc];
  const pricingKeys = Object.keys(dict).filter(k => k.startsWith('pricing.'));
  console.log(`[${loc.toUpperCase()}] Total claves pricing.*: ${pricingKeys.length}`);

  for (const k of pricingKeys) {
    const val = String(dict[k] || '');

    // 1. Emoji / Banderas check
    if (flagRegex.test(val)) {
      console.error(`  ❌ [${loc}] Clave "${k}" contiene emoji/bandera: "${val}"`);
      errorCount++;
    }

    // 2. Mezclas cruzadas
    const checks = crossLeakageChecks[loc] || [];
    for (const check of checks) {
      if (check.pattern.test(val)) {
        console.error(`  ❌ [${loc}] Clave "${k}" contiene ${check.name}: "${val}"`);
        errorCount++;
      }
    }
  }
}

if (errorCount === 0) {
  console.log('\n✅ 0 ERRORES DE MEZCLA O BANDERAS EN LAS 6 LENGUAS (PASS: 100%)');
} else {
  console.error(`\n❌ ${errorCount} ERRORES DETECTADOS EN PRICING`);
  process.exit(1);
}

// Generar representación simulada del DOM de la tabla de precios y tarjetas en los 6 idiomas
console.log('\n=== DOM CRUDO DE LA SECCIÓN DE PRECIOS POR IDIOMA ===');
const sampleKeys = [
  'pricing.badge',
  'pricing.title',
  'pricing.subtitle',
  'pricing.period.monthly',
  'pricing.period.annual',
  'pricing.plan.club_base.name',
  'pricing.plan.club_base.price_monthly',
  'pricing.plan.club_base.period_monthly',
  'pricing.plan.club_base.description',
  'pricing.plan.club_pro.name',
  'pricing.plan.club_pro.price_monthly',
  'pricing.plan.club_pro.period_monthly',
  'pricing.plan.club_pro.description',
  'pricing.plan.club_elite.name',
  'pricing.plan.club_elite.price_monthly',
  'pricing.plan.club_elite.period_monthly',
  'pricing.plan.club_elite.description',
  'pricing.tax_included',
  'pricing.cta.start_trial'
];

for (const loc of locales) {
  const dict = dicts[loc];
  console.log(`\n---------------- [DOM TEXTS: ${loc.toUpperCase()}] ----------------`);
  for (const k of sampleKeys) {
    console.log(`  <div data-testid="${k}">${dict[k] || 'MISSING'}</div>`);
  }
}
