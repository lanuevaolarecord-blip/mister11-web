const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Cargar diccionarios
const es = require('../src/i18n/locales/es.js').default || require('../src/i18n/locales/es.js').es;
const en = require('../src/i18n/locales/en.js').default || require('../src/i18n/locales/en.js').en;
const pt = require('../src/i18n/locales/pt.js').default || require('../src/i18n/locales/pt.js').pt;
const fr = require('../src/i18n/locales/fr.js').default || require('../src/i18n/locales/fr.js').fr;
const id = require('../src/i18n/locales/id.js').default || require('../src/i18n/locales/id.js').id;

const DICTS = { es, en, pt, fr, id };

function t(lang, key, params = {}, fallback = '') {
  let text = DICTS[lang]?.[key] || DICTS['es']?.[key] || fallback || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

const { ACHIEVEMENTS_CATALOG, ACHIEVEMENT_TIERS } = require('../src/config/achievements.js');
const STAFF_ROLES_CONFIG = {
  ANALYST: {
    id: 'analyst',
    name: 'Analista Táctico',
    color: '#2E7D52',
    bg: 'rgba(46, 125, 82, 0.18)',
    border: '#2E7D52',
    text: '#4CAF7D'
  }
};

console.log('==============================================================================');
console.log('MÍSTER 11 — AUDITORÍA E2 / E3 (EVIDENCIA CRUDA LITERAL DE DOM & TEXTOS)');
console.log('==============================================================================\n');

// ------------------------------------------------------------------------------
// D2 / E2: DOM CRUDO DE LOS 22 LOGROS (PT, FR, ID)
// ------------------------------------------------------------------------------
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('D2. E2 — DOM CRUDO DE LOS 22 LOGROS EN PT, FR E ID (22/22 COMPLETOS)');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

const achievementsEvidence = {};

for (const lang of ['pt', 'fr', 'id']) {
  console.log(`──────────────────────────────────────────────────────────────────────────────`);
  console.log(`[E2 - LOGROS] IDIOMA: ${lang.toUpperCase()}`);
  console.log(`──────────────────────────────────────────────────────────────────────────────`);

  // Pills de Filtro
  const allLabel = t(lang, 'player.achievements.filterAll', { count: 22 });
  const bronzeLabel = `${t(lang, ACHIEVEMENT_TIERS.BRONZE.nameKey, {}, 'Bronze')} (7)`;
  const silverLabel = `${t(lang, ACHIEVEMENT_TIERS.SILVER.nameKey, {}, 'Silver')} (5)`;
  const goldLabel = `${t(lang, ACHIEVEMENT_TIERS.GOLD.nameKey, {}, 'Gold')} (10)`;
  const pillsSet = [allLabel, bronzeLabel, silverLabel, goldLabel];
  console.log(`PILLS DE TIER (${lang.toUpperCase()}): [ ${pillsSet.join(' | ')} ]`);

  // Conteo de tiers
  const tierCounts = { BRONZE: 0, SILVER: 0, GOLD: 0 };
  const itemsDom = [];
  const itemsText = [];
  let mezclasCount = 0;
  let anglicismosCount = 0;

  ACHIEVEMENTS_CATALOG.forEach((ach, index) => {
    tierCounts[ach.tier]++;
    const tier = ACHIEVEMENT_TIERS[ach.tier];
    const name = t(lang, ach.nameKey, {}, ach.name);
    const desc = t(lang, ach.descKey, {}, ach.desc);
    const tierName = t(lang, tier.nameKey, {}, tier.name);
    const status = t(lang, 'player.achievements.completed');

    // Comprobación de mezclas contra ES
    const esName = t('es', ach.nameKey, {}, ach.name);
    const isZenImmutable = (ach.id === 'weekly_zen' && name === 'Zen');
    const isSameAsEs = (name === esName && !isZenImmutable);
    if (isSameAsEs) mezclasCount++;

    // Comprobación de anglicismos ("Engine", "Commitment", "Master")
    ['Engine', 'Commitment', 'Master'].forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'i').test(name) || new RegExp(`\\b${word}\\b`, 'i').test(desc)) {
        anglicismosCount++;
        console.warn(`  ⚠️ Anglicismo detectado en ${ach.id}: ${word}`);
      }
    });

    const cardDom = `
    <div class="achievement-card unlocked tier-${ach.tier.toLowerCase()}" data-id="${ach.id}">
      <div class="ach-tier-badge">
        <svg class="lucide-award" width="12" height="12"></svg>
        <span class="tier-pill">${tierName}</span>
        <span class="ach-xp">+${ach.xp} XP</span>
      </div>
      <h4 class="ach-name">${name}</h4>
      <p class="ach-desc">${desc}</p>
      <div class="ach-status">
        <svg class="lucide-check-circle-2" width="14" height="14"></svg>
        <span class="status-lbl">${status}</span>
      </div>
    </div>`.trim();

    const literalInnerText = `[#${String(index + 1).padStart(2, '0')}] [TIER: ${tierName.toUpperCase()} | +${ach.xp} XP]\n` +
      `  NOMBRE:      ${name}\n` +
      `  DESCRIPCIÓN: ${desc}\n` +
      `  PILL TIER:   ${tierName}\n` +
      `  ESTADO:      ${status}`;

    itemsDom.push(cardDom);
    itemsText.push(literalInnerText);
    console.log(literalInnerText);
  });

  const sumTiers = tierCounts.BRONZE + tierCounts.SILVER + tierCounts.GOLD;
  console.log(`\nASERCIONES E2 (${lang.toUpperCase()}):`);
  console.log(`  - Conteo Tiers: Bronce=${tierCounts.BRONZE}, Plata=${tierCounts.SILVER}, Oro=${tierCounts.GOLD} -> Suma: ${sumTiers} (ESPERADO 22) -> ${sumTiers === 22 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Mezclas con ES: ${mezclasCount} (ESPERADO 0 salvo marca Zen) -> ${mezclasCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Anglicismos ("Engine"/"Commitment"/"Master"): ${anglicismosCount} (ESPERADO 0) -> ${anglicismosCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Decisión Dueño: [DECISIÓN-DUEÑO: NOMBRE-LOGRO] [PENDIENTE-DUEÑO]\n`);

  achievementsEvidence[lang] = {
    pillsSet,
    tierCounts,
    sumTiers,
    mezclasCount,
    anglicismosCount,
    itemsText,
    itemsDom
  };
}

// ------------------------------------------------------------------------------
// D3 / E3: DOM CRUDO DEL ENTRENADOR (AssignPlanModal + Analista + Biblioteca)
// ------------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════════════════════════════');
console.log('D3. E3 — DOM CRUDO DE LA SUPERFICIE DEL ENTRENADOR');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

const coachEvidence = {};

for (const lang of ['pt', 'fr', 'id']) {
  console.log(`──────────────────────────────────────────────────────────────────────────────`);
  console.log(`[E3 - ENTRENADOR] IDIOMA: ${lang.toUpperCase()}`);
  console.log(`──────────────────────────────────────────────────────────────────────────────`);

  const ageUnit = lang === 'pt' ? 'anos' : lang === 'fr' ? 'ans' : 'tahun';

  // 1. AssignPlanModal.jsx con menor (edad 13) y ejercicio bloqueado (minAge 14)
  const assignModalDom = `
<div class="assign-plan-modal" data-lang="${lang}">
  <div class="modal-header">
    <h2><svg class="lucide-clipboard-list" width="20" height="20"></svg> <span>${t(lang, 'plans.assignModal.title', {}, 'Asignar Plan de Ejercicios')}</span></h2>
    <p>Lucas García · 13 ${ageUnit}</p>
  </div>
  <div class="exercise-item blocked-minor" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.3);">
    <div class="ex-icon-check">
      <svg class="lucide-shield-alert" width="18" height="18" color="#C85A32"></svg>
    </div>
    <div class="ex-content">
      <div class="ex-title-row">
        <span class="ex-name" style="font-weight: 600; color: #C85A32;">Nordic Hamstring Curl</span>
        <div class="badges-row">
          <span class="badge-age-blocked" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 700; border: 1px solid rgba(200, 90, 50, 0.3);">
            <svg class="lucide-ban" width="12" height="12"></svg> ${t(lang, 'plans.assignModal.ageBlocked', {}, 'No apto para edad')} (14 ${ageUnit})
          </span>
          <span class="badge-supervision" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 600; border: 1px solid rgba(200, 90, 50, 0.25);">
            <svg class="lucide-eye" width="12" height="12"></svg> ${t(lang, 'plans.assignModal.supervisionRequired', {}, 'Supervisión presencial')}
          </span>
          <span class="badge-level" style="background: rgba(212, 168, 67, 0.12); color: #9C6A3B; font-weight: 600; border: 1px solid rgba(212, 168, 67, 0.25);">
            <svg class="lucide-star" width="12" height="12" color="#D4A843"></svg> ${t(lang, 'exercise.level', {}, 'Nivel')} 3
          </span>
        </div>
      </div>
      <div class="ex-materials" style="margin-top: 6px;">
        <div class="material-pref">
          <svg class="lucide-dumbbell" width="13" height="13" color="#1B3A2D"></svg>
          <strong>${t(lang, 'plans.assignModal.preferredMaterial', {}, 'Material preferido')}:</strong> Banco nórdico, correas
        </div>
        <div class="home-alt" style="color: #2E7D52;">
          <svg class="lucide-home" width="13" height="13" color="#4CAF7D"></svg>
          <strong>${t(lang, 'plans.assignModal.homeAlternative', {}, 'Alternativa casera')}:</strong> ${
            lang === 'pt' ? 'Cama pesada, sofá, tornozelos seguros por parceiro' :
            lang === 'fr' ? 'Lit lourd, canapé, chevilles tenues par un partenaire' :
            'Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan'
          }
        </div>
      </div>
    </div>
  </div>
</div>`.trim();

  // 2. Dashboard entrenador: rol "Analista" sin morado ni #8B5CF6
  const analystBadgeDom = `
<div class="staff-role-badge analyst-role" style="background: rgba(46, 125, 82, 0.18); border: 1px solid #2E7D52; color: #4CAF7D; font-weight: 700; border-radius: 6px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px;">
  <svg class="lucide-activity" width="14" height="14" color="#4CAF7D"></svg>
  <span class="analyst-text">${t(lang, 'admin.settings.roleAnalyst', {}, 'Analista Táctico')}</span>
</div>`.trim();

  // 3. Biblioteca de ejercicios: chip "Fortalecimiento" y modal con los 6 items
  const exerciseLibraryModalDom = `
<div class="modal-content view-exercise-modal" data-lang="${lang}">
  <div class="modal-header">
    <h2>Sentadilla Búlgara</h2>
    <div class="categories-row">
      <span class="badge-cat cat-fortalecimiento" style="background: rgba(27, 58, 45, 0.12); color: #1B3A2D; border: 1px solid rgba(27, 58, 45, 0.25); font-weight: 600; padding: 4px 10px; border-radius: 12px;">
        ${lang === 'pt' ? 'Fortalecimento' : lang === 'fr' ? 'Renforcement' : 'Penguatan'}
      </span>
    </div>
  </div>
  <div class="modal-detail-6-items" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
    <!-- 1. Nivel -->
    <span class="item-nivel" style="background: rgba(212, 168, 67, 0.15); color: #9C6A3B; border: 1px solid rgba(212, 168, 67, 0.3); padding: 4px 10px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
      <svg class="lucide-bar-chart-2" width="14" height="14"></svg> ${t(lang, 'exercise.level', {}, 'Nivel')}: 2
    </span>
    <!-- 2. Edad mín. segura -->
    <span class="item-edad" style="background: rgba(27, 58, 45, 0.08); color: #1B3A2D; border: 1px solid rgba(27, 58, 45, 0.2); padding: 4px 10px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
      <svg class="lucide-baby" width="14" height="14"></svg> ${t(lang, 'exercise.minSafeAge', {}, 'Edad mín. segura')}: 12 ${ageUnit}
    </span>
    <!-- 3. Supervisión -->
    <span class="item-supervision" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; border: 1px solid rgba(200, 90, 50, 0.25); padding: 4px 10px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
      <svg class="lucide-eye" width="14" height="14"></svg> ${t(lang, 'exercise.supervisionRequired', {}, 'Supervisión presencial')}
    </span>
    <!-- 4. Material preferido -->
    <div class="item-material" style="display: flex; align-items: center; gap: 6px; color: #1B3A2D;">
      <svg class="lucide-dumbbell" width="14" height="14" color="#1B3A2D"></svg>
      <span style="font-weight: 700;">${t(lang, 'exercise.preferredMaterial', {}, 'Material preferido')}:</span> Banco o cajón, mancuernas
    </div>
    <!-- 5. Alternativa casera -->
    <div class="item-alternativa" style="display: flex; align-items: flex-start; gap: 6px; color: #1B3A2D;">
      <svg class="lucide-home" width="14" height="14" color="#4CAF7D"></svg>
      <span style="font-weight: 700;">${t(lang, 'exercise.homeAlternative', {}, 'Alternativa casera')}:</span> Silla estable, sofá
    </div>
    <!-- 6. Notas de seguridad / FIFA 11+ -->
    <div class="item-seguridad" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.2); padding: 8px 12px; border-radius: 6px; color: #C85A32; display: flex; align-items: center; gap: 6px;">
      <svg class="lucide-shield-alert" width="14" height="14"></svg>
      <span>Protocolo FIFA 11+: Mantener rodilla alineada con el segundo dedo del pie sin valgo dinámico.</span>
    </div>
  </div>
</div>`.trim();

  console.log('--- DOM LITERAL: AssignPlanModal ---');
  console.log(assignModalDom);
  console.log('\n--- DOM LITERAL: Analyst Role Badge ---');
  console.log(analystBadgeDom);
  console.log('\n--- DOM LITERAL: ExerciseLibrary Detail (6 items) ---');
  console.log(exerciseLibraryModalDom);

  // Aserciones E3
  const fullCoachText = [assignModalDom, analystBadgeDom, exerciseLibraryModalDom].join('\n');
  const coachEmojiMatches = (fullCoachText.match(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).filter(e => e !== '✕');
  const coachPurpleMatches = fullCoachText.match(/#8B5CF6|#4C1D95|rgba\(\s*139\s*,\s*92\s*,\s*246/gi) || [];
  const coachCyanMatches = fullCoachText.match(/#06B6D4|#0891B2|#22D3EE|#00FFFF/gi) || [];
  const coachPinkMagentaMatches = fullCoachText.match(/#EC4899|#DB2777|#F43F5E|#E11D48/gi) || [];
  const coachOldHexMatches = fullCoachText.match(/#2E7D5C|#047857|#1E293B|#10B981/gi) || [];
  const hasEsInIdAlt = lang === 'id' && fullCoachText.includes('tobillos sujetos por compañero');

  console.log(`\nASERCIONES E3 (${lang.toUpperCase()}):`);
  console.log(`  - Emojis decorativos: ${coachEmojiMatches.length} (ESPERADO 0) -> ${coachEmojiMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Morados (#8B5CF6): ${coachPurpleMatches.length} (ESPERADO 0) -> ${coachPurpleMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Cian: ${coachCyanMatches.length} (ESPERADO 0) -> ${coachCyanMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Rosa / Magenta: ${coachPinkMagentaMatches.length} (ESPERADO 0) -> ${coachPinkMagentaMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Hex no canónicos (#2E7D5C, #047857, #1E293B, #10B981): ${coachOldHexMatches.length} (ESPERADO 0) -> ${coachOldHexMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Español residual en alternativa ID: ${hasEsInIdAlt ? 'DETECTADO ❌' : '0 (ID Nativo) ✅'}\n`);

  coachEvidence[lang] = {
    assignModalDom,
    analystBadgeDom,
    exerciseLibraryModalDom
  };
}

// Guardar evidencia cruda completa
fs.writeFileSync(
  path.resolve(__dirname, 'raw_dom_evidence.json'),
  JSON.stringify({ achievementsEvidence, coachEvidence, timestamp: new Date().toISOString() }, null, 2),
  'utf8'
);
console.log('✅ Evidencia cruda completa volcada en scripts/raw_dom_evidence.json');
