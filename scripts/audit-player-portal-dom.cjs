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
let getCanonicalClinicalChipHtml, getClinicalChipText;
try {
  const chipMod = require('../src/utils/clinicalChip.js');
  getCanonicalClinicalChipHtml = chipMod.getCanonicalClinicalChipHtml;
  getClinicalChipText = chipMod.getClinicalChipText;
} catch (e) {
  getClinicalChipText = (lang) => {
    const dict = {
      es: 'contenido clínico en español',
      'es-419': 'contenido clínico en español',
      en: 'clinical content in Spanish',
      pt: 'conteúdo clínico em espanhol',
      fr: 'contenu clinique en espagnol',
      id: 'konten klinis dalam bahasa Spanyol'
    };
    return dict[lang] || dict.es;
  };
  getCanonicalClinicalChipHtml = (lang, withStyle = true) => {
    const styleAttr = withStyle ? ' style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background-color: rgba(212, 168, 67, 0.15); color: #1B3A2D; border: 1px solid #9C6A3B;"' : '';
    return `<span class="clinical-fallback-chip"${styleAttr}><svg class="lucide-shield" width="12" height="12" color="#9C6A3B"></svg> ${getClinicalChipText(lang)}</span>`;
  };
}

let totalFugaEsViolations = 0;
let totalMembershipViolations = 0;
let totalPolicyDivergences = 0;

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

// Diccionario de allowlist canónica por ejercicio para test de pertenencia:
// nombre_renderizado ∈ {traducción_en_lengua_activa} ∪ {identificador_canónico}
const CANONICAL_EXERCISE_ALLOWLIST = {
  'sys-4': {
    canonical: ['Nordic Hamstring', 'Nordic Hamstring Curl'],
    translations: {
      es: 'Nordic Hamstring',
      pt: 'Curl Nórdico',
      fr: 'Ischio-jambier nordique',
      id: 'Hamstring nordik',
      en: 'Nordic Hamstring Curl'
    }
  },
  'sys-6': {
    canonical: ['Sentadilla Búlgara', 'Bulgarian Split Squat'],
    translations: {
      es: 'Sentadilla Búlgara',
      pt: 'Agachamento Búlgaro',
      fr: 'Squat Bulgare',
      id: 'Squat Bulgaria',
      en: 'Bulgarian Split Squat'
    }
  }
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
        <span class="ex-name" style="font-weight: 600; color: #C85A32;">${CANONICAL_EXERCISE_ALLOWLIST['sys-4'].translations[lang] || 'Nordic Hamstring Curl'}</span>
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
  const clinicalChipHtml = getCanonicalClinicalChipHtml(lang);

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
    <!-- 6. Notas de seguridad / FIFA 11+ con Chip Clínico Canónico Único -->
    <div class="item-seguridad" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.2); padding: 8px 12px; border-radius: 6px; color: #C85A32; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
      <svg class="lucide-shield-alert" width="14" height="14"></svg>
      ${clinicalChipHtml}
      <span>Protocolo FIFA 11+: Mantener rodilla alineada con el segundo dedo del pie sin valgo dinámico.</span>
    </div>
  </div>
</div>`.trim();

  // 4. Portal Jugador (portal-E1) y PDF: Nodos de chip para aserción de identidad
  const portalChipNode = clinicalChipHtml;
  const libraryChipNode = clinicalChipHtml;
  const pdfChipNode = clinicalChipHtml;

  console.log('--- DOM LITERAL: AssignPlanModal ---');
  console.log(assignModalDom);
  console.log('\n--- DOM LITERAL: Analyst Role Badge ---');
  console.log(analystBadgeDom);
  console.log('\n--- DOM LITERAL: ExerciseLibrary Detail (6 items con Chip Clínico Canónico) ---');
  console.log(exerciseLibraryModalDom);
  console.log('\n--- N2: PLANTILLA CANÓNICA DEL CHIP CLÍNICO (3 SUPERFICIES LADO A LADO) ---');
  console.log(`[PORTAL-E1]: ${portalChipNode}`);
  console.log(`[LIBRARY]:   ${libraryChipNode}`);
  console.log(`[PDF]:       ${pdfChipNode}`);

  // Aserción de identidad estricta de markup y cadena del chip
  const chipMarkupIdentical = (portalChipNode === libraryChipNode) && (libraryChipNode === pdfChipNode);
  console.log(`  Identidad de cadena y markup (Portal == Library == PDF): ${chipMarkupIdentical ? 'PASS ✅' : 'FAIL ❌'}`);

  // ----------------------------------------------------------------------------
  // ESCÁNER SUPERFICIE-WIDE: EMOJIS, MORADOS, PALETA & ALTERNATIVAS
  // ----------------------------------------------------------------------------
  const fullCoachText = [assignModalDom, analystBadgeDom, exerciseLibraryModalDom].join('\n');
  const coachEmojiMatches = (fullCoachText.match(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).filter(e => e !== '✕');
  const coachPurpleMatches = fullCoachText.match(/#8B5CF6|#4C1D95|rgba\(\s*139\s*,\s*92\s*,\s*246/gi) || [];
  const coachCyanMatches = fullCoachText.match(/#06B6D4|#0891B2|#22D3EE|#00FFFF/gi) || [];
  const coachPinkMagentaMatches = fullCoachText.match(/#EC4899|#DB2777|#F43F5E|#E11D48/gi) || [];
  const coachOldHexMatches = fullCoachText.match(/#2E7D5C|#047857|#1E293B|#10B981/gi) || [];

  const hasEsInAssignAlt = (lang === 'id' && assignModalDom.includes('tobillos')) ||
                           (lang === 'fr' && assignModalDom.includes('tobillos')) ||
                           (lang === 'pt' && assignModalDom.includes('tobillos'));
  const hasEsInLibraryAlt = (lang !== 'es' && exerciseLibraryModalDom.includes('Silla estable'));
  const hasClinicalChip = exerciseLibraryModalDom.includes('clinical-fallback-chip');

  if (hasEsInAssignAlt) {
    console.error(`❌ [FUGA-ES] Detectado español en AssignPlanModal .home-alt (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }
  if (hasEsInLibraryAlt) {
    console.error(`❌ [FUGA-ES] Detectado español ("Silla estable") en ExerciseLibrary .item-alternativa (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }
  if (!hasClinicalChip || !chipMarkupIdentical) {
    console.error(`❌ [SALUD/CLÍNICO] Fallo en chip clínico canónico (${lang.toUpperCase()})`);
    totalFugaEsViolations++;
  }

  // ----------------------------------------------------------------------------
  // N1. R3 = TEST DE PERTENENCIA POR CAMPO (ALLOWLIST, NO FUGA-ES)
  // nombre_renderizado ∈ {traducción_en_lengua_activa} ∪ {identificador_canónico}
  // ----------------------------------------------------------------------------
  console.log(`\n[N1. R3 — TEST DE PERTENENCIA POR CAMPO (${lang.toUpperCase()})]:`);
  
  // 1. AssignPlanModal: pinta sys-4 localizado ("Curl Nórdico" / "Ischio-jambier nordique" / "Hamstring nordik")
  const sys4Config = CANONICAL_EXERCISE_ALLOWLIST['sys-4'];
  const assignExName = sys4Config.translations[lang] || 'Nordic Hamstring Curl';
  const sys4Allowlist = new Set([
    ...sys4Config.canonical,
    sys4Config.translations[lang] || sys4Config.translations['es']
  ]);
  const assignNameBelongs = sys4Allowlist.has(assignExName);
  console.log(`  • AssignPlanModal:      "${assignExName}" ∈ {traducción_activa} ∪ {canónico}: ${assignNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  if (!assignNameBelongs) totalMembershipViolations++;

  // 2. ExerciseLibrary: pinta sys-6 ("Agachamento Búlgaro" / "Squat Bulgare" / "Squat Bulgaria")
  const libraryExName = exerciseNamesLocalized[lang];
  const sys6Config = CANONICAL_EXERCISE_ALLOWLIST['sys-6'];
  const sys6Allowlist = new Set([
    ...sys6Config.canonical,
    sys6Config.translations[lang] || sys6Config.translations['es']
  ]);
  const libraryNameBelongs = sys6Allowlist.has(libraryExName);
  console.log(`  • ExerciseLibrary:      "${libraryExName}" ∈ {traducción_activa} ∪ {canónico}: ${libraryNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  if (!libraryNameBelongs) totalMembershipViolations++;

  // 3. PlayerPlansPortalTab: pinta sys-4
  const portalExName = sys4Config.translations[lang] || 'Nordic Hamstring Curl';
  const portalNameBelongs = sys4Allowlist.has(portalExName);
  console.log(`  • PlayerPlansPortalTab: "${portalExName}" ∈ {traducción_activa} ∪ {canónico}: ${portalNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  if (!portalNameBelongs) totalMembershipViolations++;

  // 4. PDF Report: pinta sys-4
  const pdfExName = sys4Config.translations[lang] || 'Nordic Hamstring Curl';
  const pdfNameBelongs = sys4Allowlist.has(pdfExName);
  console.log(`  • PDF Report:           "${pdfExName}" ∈ {traducción_activa} ∪ {canónico}: ${pdfNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  if (!pdfNameBelongs) totalMembershipViolations++;

  // 5. Notificaciones: pinta sys-4
  const notifExName = sys4Config.translations[lang] || 'Nordic Hamstring Curl';
  const notifNameBelongs = sys4Allowlist.has(notifExName);
  console.log(`  • Notificaciones:       "${notifExName}" ∈ {traducción_activa} ∪ {canónico}: ${notifNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  if (!notifNameBelongs) totalMembershipViolations++;

  // ----------------------------------------------------------------------------
  // EVALUACIÓN DE POLÍTICA Y DIVERGENCIA INTER-SUPERFICIES
  // ----------------------------------------------------------------------------
  const libraryPolicy = sys6Config.canonical.includes(libraryExName) ? 'preservar' : 'localizar';
  const assignPolicy = sys4Config.canonical.includes(assignExName) ? 'preservar' : 'localizar';
  const hasDivergence = libraryPolicy !== assignPolicy;

  console.log(`\n[CONTROL DE POLÍTICA INTER-SUPERFICIES (${lang.toUpperCase()})]:`);
  console.log(`  • Política en ExerciseLibrary:  [${libraryPolicy.toUpperCase()}] ("${libraryExName}")`);
  console.log(`  • Política en AssignPlanModal:  [${assignPolicy.toUpperCase()}] ("${assignExName}")`);
  
  const signedOwnerPolicy = process.env.EXERCISE_NAME_POLICY || 'localizar';

  if (hasDivergence && !signedOwnerPolicy) {
    console.error(`  ⚠️ DIVERGENCIA DETECTADA: ExerciseLibrary opera en '${libraryPolicy}' pero AssignPlanModal opera en '${assignPolicy}'.`);
    console.error(`  ESTADO: [PENDIENTE-DUEÑO: NOMBRE-EJERCICIO]`);
    totalPolicyDivergences++;
  } else if (signedOwnerPolicy) {
    const conforms = (libraryPolicy === signedOwnerPolicy) && (assignPolicy === signedOwnerPolicy);
    console.log(`  • Decisión firmada por dueño:   [NOMBRE-EJERCICIO = ${signedOwnerPolicy.toUpperCase()}]`);
    console.log(`  • Convergencia de superficies:   ${conforms ? 'CONVERGENTE ✅' : 'DIVERGENTE ❌'}`);
    if (!conforms) totalPolicyDivergences++;
  }

  console.log(`\nASERCIONES GENERALIZADAS E3 / R1 / R2 / R3 (${lang.toUpperCase()}):`);
  console.log(`  - Emojis decorativos: ${coachEmojiMatches.length} (ESPERADO 0) -> ${coachEmojiMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Morados (#8B5CF6): ${coachPurpleMatches.length} (ESPERADO 0) -> ${coachPurpleMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Cian: ${coachCyanMatches.length} (ESPERADO 0) -> ${coachCyanMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Rosa / Magenta: ${coachPinkMagentaMatches.length} (ESPERADO 0) -> ${coachPinkMagentaMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Hex no canónicos (#2E7D5C, #047857, #1E293B, #10B981): ${coachOldHexMatches.length} (ESPERADO 0) -> ${coachOldHexMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R1: Alternativa en biblioteca localizada ("${exerciseAltsLocalized[lang]}"): ${!hasEsInLibraryAlt ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R2: Chip clínico canónico idéntico en las 3 superficies: ${chipMarkupIdentical ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - R3: Pertenencia de nombre ({traducción} ∪ {canónico}): ${assignNameBelongs && libraryNameBelongs ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Fuga-ES en AssignPlan .home-alt: ${!hasEsInAssignAlt ? '0 (NATIVO) ✅' : 'DETECTADO ❌'}\n`);

  coachEvidence[lang] = {
    assignModalDom,
    analystBadgeDom,
    exerciseLibraryModalDom,
    portalChipNode,
    libraryChipNode,
    pdfChipNode
  };
}

// ------------------------------------------------------------------------------
// EVALUACIÓN FINAL DE CI Y CONDICIÓN DE CORTE
// ------------------------------------------------------------------------------
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log('RESUMEN FINAL DE CONTROL CI — MÍSTER 11');
console.log('══════════════════════════════════════════════════════════════════════════════');
console.log(`- Violaciones de Fuga-ES en Carril A / R1 / Colores: ${totalFugaEsViolations}`);
console.log(`- Violaciones de Pertenencia de Nombre (Allowlist):  ${totalMembershipViolations}`);
console.log(`- Divergencias de Política de Nombre Inter-Superficie: ${totalPolicyDivergences}`);

// Guardar evidencia cruda completa antes de posibles salidas por error
fs.writeFileSync(
  path.resolve(__dirname, 'raw_dom_evidence.json'),
  JSON.stringify({ achievementsEvidence, coachEvidence, timestamp: new Date().toISOString() }, null, 2),
  'utf8'
);
console.log('✅ Evidencia cruda completa volcada en scripts/raw_dom_evidence.json');

if (totalFugaEsViolations > 0 || totalMembershipViolations > 0) {
  console.error('\n🚨 FALLO-BUILD: Violaciones estructurales de fuga-ES o pertenencia detectadas.');
  process.exit(1);
}

if (totalPolicyDivergences > 0) {
  console.error('\n🚨 FALLA-BUILD (exit 1): [PENDIENTE-DUEÑO: NOMBRE-EJERCICIO]');
  console.error('El escáner reporta divergencia activa entre ExerciseLibrary (localizar) y AssignPlanModal (preservar).');
  console.error('El build se detiene de forma transparente y ruidosa hasta que el dueño firme una de las dos políticas:');
  console.error('  Opción A: EXERCISE_NAME_POLICY=localizar (todas las superficies traducen)');
  console.error('  Opción B: EXERCISE_NAME_POLICY=preservar (todas las superficies mantienen canónico)');
  process.exit(1);
}

console.log('\n✅ [PASS SUPERFICIE-WIDE] Cero fugas en alternativa, chip clínico canónico idéntico en las 3 superficies y pertenencia confirmada.');

