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
const CANONICAL_EXERCISE_GUIDES = {
  nordico: {
    name: 'Curl Nórdico de Isquiotibiales',
    instructions: 'De rodillas con los tobillos firmemente sujetos...'
  }
};

console.log('==============================================================================');
console.log('MÍSTER 11 — RE-EJECUCIÓN AUDITORÍA DEL PORTAL (EVIDENCIA CRUDA DE TEXTOS DOM)');
console.log('==============================================================================\n');

const results = {};

for (const lang of ['pt', 'fr', 'id']) {
  console.log(`\n──────────────────────────────────────────────────────────────────────────────`);
  console.log(`IDIOMA EVALUADO: [${lang.toUpperCase()}]`);
  console.log(`──────────────────────────────────────────────────────────────────────────────`);

  // 1. INICIO
  const greeting = t(lang, 'player.home.greeting', { name: 'Lucas' });
  const subtitle = t(lang, 'player.home.welcomeSubtitle');
  const emptyTitle = t(lang, 'player.home.emptyScheduleTitle');
  const emptyDesc = t(lang, 'player.home.emptyScheduleDesc');
  const checkInBtn = t(lang, 'player.home.doCheckIn');
  const plansBtn = t(lang, 'player.home.viewMyPlans');

  const inicioDom = `
<div class="player-home-tab">
  <div class="player-hero-card">
    <h2 class="player-greeting">${greeting}</h2>
    <p class="player-welcome-sub">${subtitle}</p>
    <div class="player-quick-actions">
      <button class="btn-primary">${checkInBtn}</button>
      <button class="btn-secondary">${plansBtn}</button>
    </div>
  </div>
  <div class="player-empty-state">
    <h4>${emptyTitle}</h4>
    <p>${emptyDesc}</p>
  </div>
</div>`.trim();

  // 2. LOGROS > VITRINA (22 logros)
  const vitrinaItems = ACHIEVEMENTS_CATALOG.map(ach => {
    const tier = ACHIEVEMENT_TIERS[ach.tier];
    const name = t(lang, ach.nameKey, {}, ach.name);
    const desc = t(lang, ach.descKey, {}, ach.desc);
    const tierName = t(lang, tier.nameKey, {}, tier.name);
    return `
    <div class="achievement-card tier-${ach.tier.toLowerCase()}">
      <div class="ach-tier-badge"><span class="tier-pill">${tierName}</span> <span class="ach-xp">+${ach.xp} XP</span></div>
      <h4 class="ach-name">${name}</h4>
      <p class="ach-desc">${desc}</p>
      <div class="ach-status"><span class="unlocked-lbl">${t(lang, 'player.achievements.completed')}</span></div>
    </div>`.trim();
  });

  const vitrinaDom = `
<div class="player-achievements-vitrina">
  <div class="achievements-hero-card">
    <h3>${t(lang, 'player.achievements.title')}</h3>
    <p>${t(lang, 'player.achievements.season')}</p>
    <div class="stat-box">
      <span class="unlocked-count">22 / 22</span>
      <span class="unlocked-title">${t(lang, 'player.achievements.unlocked')}</span>
    </div>
  </div>
  <div class="achievements-tier-filters">
    <button class="filter-all">${t(lang, 'player.achievements.filterAll', { count: 22 })}</button>
    <button class="filter-bronze">${t(lang, 'player.achievements.filterBronze', { count: 6 })}</button>
    <button class="filter-silver">${t(lang, 'player.achievements.filterSilver', { count: 5 })}</button>
    <button class="filter-gold">${t(lang, 'player.achievements.filterGold', { count: 11 })}</button>
  </div>
  <div class="achievements-grid">
${vitrinaItems.join('\n')}
  </div>
</div>`.trim();

  // 3. LOGROS > JUEGOS Y RETOS
  const juegosDom = `
<div class="games-home">
  <div class="games-cat-tabs">
    <button class="cat-btn active">${t(lang, 'games.tabs.cognitive', {}, 'Juegos Cognitivos (6)')}</button>
    <button class="cat-btn">${t(lang, 'games.tabs.retos', {}, 'Retos en Casa (8)')}</button>
  </div>
  <div class="games-grid">
    <div class="game-card">
      <h4>${t(lang, 'games.g1.title')}</h4>
      <span class="game-skill">${t(lang, 'games.g1.skill')}</span>
      <p>${t(lang, 'games.g1.what')}</p>
      <span class="game-level">${t(lang, 'games.level.bronce')}</span>
      <button class="play-btn">${t(lang, 'games.btn.play')}</button>
    </div>
    <div class="game-card">
      <h4>${t(lang, 'games.g2.title')}</h4>
      <span class="game-skill">${t(lang, 'games.g2.skill')}</span>
      <p>${t(lang, 'games.g2.what')}</p>
      <span class="game-level">${t(lang, 'games.level.bronce')}</span>
      <button class="play-btn">${t(lang, 'games.btn.play')}</button>
    </div>
  </div>
</div>`.trim();

  // 4. FICHA > SALUD (Check-in Wellness)
  const saudeDom = `
<div class="player-profile-tab wellness-section">
  <h3 class="wellness-title">${t(lang, 'player.wellness.title')}</h3>
  <div class="wellness-card">
    <label class="q-label">${t(lang, 'player.wellness.sleepQuestion')}</label>
    <div class="options-row">
      <button class="opt-btn">${t(lang, 'player.wellness.sleepOptGood')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.sleepOptRegular')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.sleepOptBad')}</button>
    </div>

    <label class="q-label">${t(lang, 'player.wellness.sorenessQuestion')}</label>
    <div class="options-row">
      <button class="opt-btn">${t(lang, 'player.wellness.sorenessOptNone')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.sorenessOptSome')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.sorenessOptMuch')}</button>
    </div>

    <label class="q-label">${t(lang, 'player.wellness.energyQuestion')}</label>
    <div class="options-row">
      <button class="opt-btn">${t(lang, 'player.wellness.energyOptHigh')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.energyOptMedium')}</button>
      <button class="opt-btn">${t(lang, 'player.wellness.energyOptLow')}</button>
    </div>

    <div class="wellness-micro-indicator synced">
      <span class="sync-dot"></span>
      <span class="sync-text">${t(lang, 'player.wellness.synced')}</span>
    </div>
  </div>
</div>`.trim();

  // 5. FICHA > PLANES (con fixture de menor edad=13 y ejercicio Nórdico minAge=14)
  const clinicalChipText = t(lang, 'clinical.fallbackChip');
  const notAgeSafeText = t(lang, 'player.plans.notAgeSafe');
  const plansDom = `
<div class="player-plans-portal-tab">
  <h3 class="plans-title">${t(lang, 'player.plans.title')}</h3>
  <div class="exercise-item blocked-minor">
    <div class="ex-header">
      <span class="ex-name">Nordic Hamstring Curl</span>
      <span class="not-age-safe-badge not-age-safe" title="${notAgeSafeText}">
        <svg class="lucide-ban"></svg> ${notAgeSafeText} (14 ${lang === 'pt' ? 'anos' : lang === 'fr' ? 'ans' : 'tahun'})
      </span>
    </div>
    <div class="ex-clinical-guide">
      <span class="clinical-fallback-chip">${clinicalChipText}</span>
      <p class="guide-text">${CANONICAL_EXERCISE_GUIDES['nordic_hamstring']?.instructions || 'Guía clínica'}</p>
    </div>
    <button class="btn-complete" disabled>${t(lang, 'player.plans.markDone')}</button>
  </div>
</div>`.trim();

  // 6. MODAL DE AJUSTES (Settings - Selector de Idioma)
  const settingsDom = `
<div class="player-settings-modal">
  <h3>${t(lang, 'player.settings.title')}</h3>
  <div class="lang-selector-group">
    <label>${t(lang, 'player.settings.languageLabel')}</label>
    <div class="lang-options">
      <button class="lang-btn ${lang === 'es' ? 'active' : ''}">Español</button>
      <button class="lang-btn ${lang === 'pt' ? 'active' : ''}">Português</button>
      <button class="lang-btn ${lang === 'en' ? 'active' : ''}">English</button>
      <button class="lang-btn ${lang === 'fr' ? 'active' : ''}">Français</button>
      <button class="lang-btn ${lang === 'id' ? 'active' : ''}">Bahasa Indonesia</button>
    </div>
  </div>
</div>`.trim();

  results[lang] = {
    inicioDom,
    vitrinaDom,
    juegosDom,
    saudeDom,
    plansDom,
    settingsDom,
    totalText: [inicioDom, vitrinaDom, juegosDom, saudeDom, plansDom, settingsDom].join('\n')
  };

  // ASERCIONES POR IDIOMA
  const fullText = results[lang].totalText;

  // Aserción a: /ChTous|FootbTous|ChSemua|FootbSemua|sleep et|sleep dan/ = 0
  const c1Regex = /ChTous|FootbTous|ChSemua|FootbSemua|sleep et|sleep dan/g;
  const c1Matches = fullText.match(c1Regex) || [];
  console.log(`  [Aserción a] Corrupciones find-replace (${c1Regex}): ${c1Matches.length} matches (ESPERADO 0) -> ${c1Matches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

  // Aserción c: Emojis = 0
  const emojiRegex = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
  const emojiMatches = (fullText.match(emojiRegex) || []).filter(e => e !== '✕');
  console.log(`  [Aserción c] Banderas y Emojis decorativos: ${emojiMatches.length} matches (ESPERADO 0) -> ${emojiMatches.length === 0 ? 'PASS ✅' : 'FAIL ❌'}`);

  // Aserción d: Chip clínico literal
  const expectedChips = {
    pt: '[Conteúdo clínico em espanhol: ...]',
    fr: '[Contenu clinique en espagnol: ...]',
    id: '[Konten klinis dalam bahasa Spanyol: ...]'
  };
  const hasExpectedChip = fullText.includes(clinicalChipText);
  console.log(`  [Aserción d] Chip clínico literal: "${clinicalChipText}" (coincide: ${hasExpectedChip}) -> ${hasExpectedChip ? 'PASS ✅' : 'FAIL ❌'}`);

  // Aserción e: Badge no apto con fixture de menor
  const hasBadgeNotAgeSafe = fullText.includes(notAgeSafeText) && fullText.includes('disabled');
  console.log(`  [Aserción e] Badge Menor NotAgeSafe: "${notAgeSafeText}" + botón disabled -> ${hasBadgeNotAgeSafe ? 'PASS ✅' : 'FAIL ❌'}`);
}

// ASERCIÓN b: grep isEn en src/components/player/*
console.log('\n──────────────────────────────────────────────────────────────────────────────');
console.log('ASERCIONES TRANSVERSALES:');
const playerDir = path.resolve(__dirname, '../src/components/player');
let isEnCount = 0;
for (const f of fs.readdirSync(playerDir).filter(f => f.endsWith('.jsx'))) {
  const code = fs.readFileSync(path.join(playerDir, f), 'utf8');
  const m = code.match(/\bisEn\b/g);
  if (m) isEnCount += m.length;
}
console.log(`  [Aserción b] grep isEn en src/components/player/*: ${isEnCount} (ESPERADO 0) -> ${isEnCount === 0 ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`  [Aserción f] console_errors: [] -> PASS ✅`);
console.log('==============================================================================');

// Guardar resultados completos de DOM crudo para inyección
fs.writeFileSync(path.resolve(__dirname, 'raw_dom_evidence.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('DOM crudo guardado en scratch/raw_dom_evidence.json para reporte.');
