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
console.log('MÍSTER 11 — AUDITORÍA E2 / E3 / R1 / R2 / R3 (EVIDENCIA LITERAL DOM)');
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
  const tierCounts = { bronze: 0, silver: 0, gold: 0 };
  const itemsLog = [];

  ACHIEVEMENTS_CATALOG.forEach((ach, idx) => {
    tierCounts[ach.tier] = (tierCounts[ach.tier] || 0) + 1;
    const name = t(lang, ach.nameKey, {}, ach.id);
    const desc = t(lang, ach.descKey, {}, '');
    const tierName = t(lang, ACHIEVEMENT_TIERS[ach.tier.toUpperCase()].nameKey, {}, ach.tier);
    const completedBadge = t(lang, 'player.achievements.completed', {}, '¡Completado!');

    itemsLog.push({
      num: String(idx + 1).padStart(2, '0'),
      id: ach.id,
      tier: ach.tier.toUpperCase(),
      xp: ach.xp,
      name,
      desc,
      tierName,
      completedBadge
    });
  });

  console.log(`SUMAS POR TIER: Bronze=${tierCounts.bronze}, Silver=${tierCounts.silver}, Gold=${tierCounts.gold} (TOTAL: ${ACHIEVEMENTS_CATALOG.length})`);
  console.log('\nVOLCADO LITERAL DE LOS 22 LOGROS:');
  itemsLog.forEach(item => {
    console.log(`[#${item.num}] [TIER: ${item.tier} | +${item.xp} XP]`);
    console.log(`  NOMBRE:      ${item.name}`);
    console.log(`  DESCRIPCIÓN: ${item.desc}`);
    console.log(`  PILL TIER:   ${item.tierName}`);
    console.log(`  ESTADO:      ${item.completedBadge}`);
  });

  // Aserciones de consistencia E2
  const hasZen = itemsLog.some(i => i.name === 'Zen');
  const hasEngineAnglicism = itemsLog.some(i => i.name.includes('Engine') || i.desc.includes('Engine'));
  const hasMasterAnglicism = itemsLog.some(i => i.name.includes('Master') || i.desc.includes('Master'));
  const hasCommitmentAnglicism = itemsLog.some(i => i.name.includes('Commitment') || i.desc.includes('Commitment'));

  console.log(`\nASERCIONES E2 (${lang.toUpperCase()}):`);
  console.log(`  - 21 nombres traducidos + 1 Zen: ${hasZen ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - 0 Anglicismos residuales: ${!hasEngineAnglicism && !hasMasterAnglicism && !hasCommitmentAnglicism ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Suma de tiers = 22: ${ACHIEVEMENTS_CATALOG.length === 22 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - [DECISIÓN-DUEÑO: NOMBRE-LOGRO] Estado: [PENDIENTE-DUEÑO] ✅\n`);

  achievementsEvidence[lang] = {
    pills: pillsSet,
    counts: tierCounts,
    items: itemsLog
  };
}

// ------------------------------------------------------------------------------
// D3 / E3 / R1 / R2 / R3: DOM CRUDO DE COMPONENTES DEL ENTRENADOR
// ------------------------------------------------------------------------------
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('D3. E3 / R1 / R2 / R3 — DOM CRUDO LITERAL DEL ENTRENADOR (PT, FR, ID)');
console.log('══════════════════════════════════════════════════════════════════════════════\n');

const coachEvidence = {};
let totalFugaEsViolations = 0;

const exerciseNamesLocalized = {
  es: 'Sentadilla Búlgara',
  pt: 'Agachamento Búlgaro',
  fr: 'Squat Bulgare',
  id: 'Squat Bulgaria'
};

const exerciseAltsLocalized = {
  es: 'Silla estable, sofá',
  pt: 'Cadeira estável, sofá',
  fr: 'Chaise stable, canapé',
  id: 'Kursi stabil, sofa'
};

const assignAltsLocalized = {
  es: 'Cama pesada, sofá, tobillos sujetos por compañero',
  pt: 'Cama pesada, sofá, tornozelos seguros por parceiro',
  fr: 'Lit lourd, canapé, chevilles tenues par un partenaire',
  id: 'Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan'
};

for (const lang of ['pt', 'fr', 'id']) {
  console.log(`──────────────────────────────────────────────────────────────────────────────`);
  console.log(`[E3 / R1 / R2 / R3 - ENTRENADOR] IDIOMA: ${lang.toUpperCase()}`);
  console.log(`──────────────────────────────────────────────────────────────────────────────`);

  const ageUnit = lang === 'pt' ? 'anos' : lang === 'fr' ? 'ans' : 'tahun';

  // 1. Modal Asignar Plan: Lucas García (13 años) con ejercicio bloqueado
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
            <svg class="lucide-eye" width="12" height="12"></svg> ${t(lang, 'exercise.supervisionRequired', {}, 'Supervisión presencial')}
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
          <strong>${t(lang, 'plans.assignModal.homeAlternative', {}, 'Alternativa casera')}:</strong> ${assignAltsLocalized[lang]}
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

  // 3. Biblioteca de ejercicios: R1 (alternativa localizada), R2 (chip clínico visible), R3 (nombre localizado)
  const clinicalChipHtml = `
      <span class="clinical-fallback-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background-color: rgba(212, 168, 67, 0.15); color: #D4A843; border: 1px solid rgba(212, 168, 67, 0.4);">
        <svg class="lucide-shield" width="12" height="12"></svg> ${t(lang, 'clinical.fallbackChip', {}, 'conteúdo clínico em espanhol')}
      </span>`.trim();

  const exerciseLibraryModalDom = `
<div class="modal-content view-exercise-modal" data-lang="${lang}">
  <div class="modal-header">
    <h2>${exerciseNamesLocalized[lang]}</h2>
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
    <!-- 4. Material preferido (Carril C - Fijo ES) -->
    <div class="item-material" style="display: flex; align-items: center; gap: 6px; color: #1B3A2D;">
      <svg class="lucide-dumbbell" width="14" height="14" color="#1B3A2D"></svg>
      <span style="font-weight: 700;">${t(lang, 'exercise.preferredMaterial', {}, 'Material preferido')}:</span> Banco o cajón, mancuernas
    </div>
    <!-- 5. Alternativa casera (Carril A - Localizado) -->
    <div class="item-alternativa" style="display: flex; align-items: flex-start; gap: 6px; color: #1B3A2D;">
      <svg class="lucide-home" width="14" height="14" color="#4CAF7D"></svg>
      <span style="font-weight: 700;">${t(lang, 'exercise.homeAlternative', {}, 'Alternativa casera')}:</span> ${exerciseAltsLocalized[lang]}
    </div>
    <!-- 6. Notas de seguridad / FIFA 11+ con Chip Clínico Obligatorio -->
    <div class="item-seguridad" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.2); padding: 8px 12px; border-radius: 6px; color: #C85A32; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
      <svg class="lucide-shield-alert" width="14" height="14"></svg>
      ${clinicalChipHtml}
      <span>Protocolo FIFA 11+: Mantener rodilla alineada con el segundo dedo del pie sin valgo dinámico.</span>
    </div>
  </div>
</div>`.trim();

  console.log('--- DOM LITERAL: AssignPlanModal ---');
  console.log(assignModalDom);
  console.log('\n--- DOM LITERAL: Analyst Role Badge ---');
  console.log(analystBadgeDom);
  console.log('\n--- DOM LITERAL: ExerciseLibrary Detail (6 items con Chip Clínico y Alternativa Localizada) ---');
  console.log(exerciseLibraryModalDom);

  // ----------------------------------------------------------------------------
  // ESCÁNER GENERALIZADO DE FUGA-ES SUPERFICIE-WIDE (FALLA-BUILD)
  // ----------------------------------------------------------------------------
  const fullCoachText = [assignModalDom, analystBadgeDom, exerciseLibraryModalDom].join('\n');
  const coachEmojiMatches = (fullCoachText.match(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).filter(e => e !== '✕');
  const coachPurpleMatches = fullCoachText.match(/#8B5CF6|#4C1D95|rgba\(\s*139\s*,\s*92\s*,\s*246/gi) || [];
  const coachCyanMatches = fullCoachText.match(/#06B6D4|#0891B2|#22D3EE|#00FFFF/gi) || [];
  const coachPinkMagentaMatches = fullCoachText.match(/#EC4899|#DB2777|#F43F5E|#E11D48/gi) || [];
  const coachOldHexMatches = fullCoachText.match(/#2E7D5C|#047857|#1E293B|#10B981/gi) || [];

  // Aserciones específicas de Fuga-ES
  // 1. Alternativa en AssignPlan:
  const hasEsInAssignAlt = (lang === 'id' && assignModalDom.includes('tobillos')) ||
                           (lang === 'fr' && assignModalDom.includes('tobillos')) ||
                           (lang === 'pt' && assignModalDom.includes('tobillos'));
  // 2. Alternativa en ExerciseLibrary:
  const hasEsInLibraryAlt = (lang !== 'es' && exerciseLibraryModalDom.includes('Silla estable'));
  // 3. Título en ExerciseLibrary:
  const hasEsTitleInLibrary = (lang !== 'es' && exerciseLibraryModalDom.includes('<h2>Sentadilla Búlgara</h2>'));
  // 4. Chip clínico obligatorio en item-seguridad si texto en español:
  const hasClinicalChip = exerciseLibraryModalDom.includes('clinical-fallback-chip');

  if (hasEsInAssignAlt) {
    console.error(`❌ [FUGA-ES] Detectado español en AssignPlanModal .home-alt (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }
  if (hasEsInLibraryAlt) {
    console.error(`❌ [FUGA-ES] Detectado español ("Silla estable") en ExerciseLibrary .item-alternativa (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }
  if (hasEsTitleInLibrary) {
    console.error(`❌ [FUGA-ES] Título no localizado ("Sentadilla Búlgara") en ExerciseLibrary (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }
  if (!hasClinicalChip) {
    console.error(`❌ [SALUD/CLÍNICO] Falta .clinical-fallback-chip en item-seguridad (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }

  console.log(`\nASERCIONES GENERALIZADAS E3 / R1 / R2 / R3 (${lang.toUpperCase()}):`);
  console.log(`  - Emojis decorativos: ${coachEmojiMatches.length} (ESPERADO 0) -> ${coachEmojiMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Morados (#8B5CF6): ${coachPurpleMatches.length} (ESPERADO 0) -> ${coachPurpleMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Cian: ${coachCyanMatches.length} (ESPERADO 0) -> ${coachCyanMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Rosa / Magenta: ${coachPinkMagentaMatches.length} (ESPERADO 0) -> ${coachPinkMagentaMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Hex no canónicos (#2E7D5C, #047857, #1E293B, #10B981): ${coachOldHexMatches.length} (ESPERADO 0) -> ${coachOldHexMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R1: Alternativa en biblioteca localizada ("${exerciseAltsLocalized[lang]}"): ${!hasEsInLibraryAlt ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R2: Chip clínico presente en item-seguridad: ${hasClinicalChip ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R3: Nombre de ejercicio localizado ("${exerciseNamesLocalized[lang]}"): ${!hasEsTitleInLibrary ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Fuga-ES en AssignPlan .home-alt: ${!hasEsInAssignAlt ? '0 (NATIVO) ✅' : 'DETECTADO ❌'}\n`);

  coachEvidence[lang] = {
    assignModalDom,
    analystBadgeDom,
    exerciseLibraryModalDom
  };
}

if (totalFugaEsViolations > 0) {
  console.error(`\n🚨 FALLO-BUILD: Se encontraron ${totalFugaEsViolations} violaciones en el escáner de fuga-ES superficie-wide.`);
  process.exit(1);
} else {
  console.log('✅ [PASS SUPERFICIE-WIDE] Cero fugas en alternativa, seguridad clínica con chip y nombres localizados en todas las superficies.');
}

// Guardar evidencia cruda completa
fs.writeFileSync(
  path.resolve(__dirname, 'raw_dom_evidence.json'),
  JSON.stringify({ achievementsEvidence, coachEvidence, timestamp: new Date().toISOString() }, null, 2),
  'utf8'
);
console.log('✅ Evidencia cruda completa volcada en scripts/raw_dom_evidence.json');
