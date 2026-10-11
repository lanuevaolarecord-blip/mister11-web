import fs from 'fs';

const locales = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];
const dicts = {};
for (const loc of locales) {
  const mod = await import(`../src/i18n/locales/${loc}.js`);
  dicts[loc] = mod.default || mod[loc] || mod;
}

const PLANS = {
  free: { precioMes: 0, precioTemporada: 0 },
  pro: { precioMes: 9.99, precioTemporada: 79 },
  club_starter: { precioMes: 29, precioTemporada: 230 },
  club_pro: { precioMes: 59, precioTemporada: 470 }
};

function renderLandingPricingDOM(dict, billingCycle = 'season') {
  const t = (k) => dict[k] !== undefined ? dict[k] : `[MISSING: ${k}]`;
  
  return `
  <!-- HEADER PRICING -->
  <div class="pricing-header-block">
    <h2 class="pricing-title">${t('pricing.header.title')}</h2>
    <p class="pricing-subtitle">${t('pricing.header.subtitle')}</p>
    
    <div class="billing-switch-container">
      <button class="billing-switch-btn ${billingCycle === 'season' ? 'active' : ''}">${t('pricing.toggle.season')}</button>
      <button class="billing-switch-btn ${billingCycle === 'monthly' ? 'active' : ''}">${t('pricing.toggle.monthly')}</button>
    </div>
  </div>

  <!-- GRID DE PLANES -->
  <div class="pricing-cards-grid">
    <!-- PLAN FREE -->
    <div class="pricing-card card-free">
      <div class="card-header">
        <span class="plan-name">${t('pricing.plan.free.name')}</span>
        <p class="plan-tagline">${t('pricing.plan.free.tagline')}</p>
        <div class="price-display">
          <span class="price-amount">0 €</span>
          <span class="price-freq">${t('pricing.freq.forever')}</span>
        </div>
        <span class="vat-notice">${t('pricing.vat.included')}</span>
      </div>
      <ul class="decisive-attributes-list">
        <li><strong>${t('pricing.free.attr1_strong')}</strong> ${t('pricing.free.attr1_text')}</li>
        <li><strong>${t('pricing.free.attr2_strong')}</strong> · ${t('pricing.free.attr2_text')}</li>
        <li><strong>${t('pricing.free.attr3_strong')}</strong> ${t('pricing.free.attr3_text')}</li>
      </ul>
      <button class="btn-plan-cta btn-plan-free">${t('pricing.btn.startFree')}</button>
    </div>

    <!-- PLAN PRO (FEATURED) -->
    <div class="pricing-card card-pro featured">
      <div class="badge-card-corner">${t('pricing.badge.mostPopularCoach')}</div>
      <div class="card-header">
        <span class="plan-name">${t('pricing.plan.pro.name')}</span>
        <p class="plan-tagline">${t('pricing.plan.pro.tagline')}</p>
        <div class="price-display">
          <span class="price-amount">${billingCycle === 'season' ? `${PLANS.pro.precioTemporada} €` : `${PLANS.pro.precioMes} €`}</span>
          <span class="price-freq">${billingCycle === 'season' ? t('pricing.freq.season') : t('pricing.freq.month')}</span>
        </div>
        <span class="vat-notice">${billingCycle === 'season' ? t('pricing.pro.vatSeason') : t('pricing.pro.vatMonthly')}</span>
      </div>
      <ul class="decisive-attributes-list">
        <li><strong>${t('pricing.pro.attr1_strong')}</strong> · ${t('pricing.pro.attr1_text')}</li>
        <li><strong>${t('pricing.pro.attr2_strong')}</strong> · ${t('pricing.pro.attr2_text')}</li>
        <li><strong>${t('pricing.pro.attr3_strong')}</strong> · ${t('pricing.pro.attr3_text')}</li>
      </ul>
      <button class="btn-plan-cta btn-plan-pro">${t('pricing.btn.tryPro')}</button>
    </div>

    <!-- CLUB STARTER -->
    <div class="pricing-card card-club">
      <div class="card-header">
        <span class="plan-name">${t('pricing.plan.clubStarter.name')}</span>
        <p class="plan-tagline">${t('pricing.plan.clubStarter.tagline')}</p>
        <div class="price-display">
          <span class="price-amount">${billingCycle === 'season' ? `${PLANS.club_starter.precioTemporada} €` : `${PLANS.club_starter.precioMes} €`}</span>
          <span class="price-freq">${billingCycle === 'season' ? t('pricing.freq.seasonShort') : t('pricing.freq.month')}</span>
        </div>
        <span class="vat-notice">${t('pricing.starter.vat')}</span>
      </div>
      <ul class="decisive-attributes-list">
        <li><strong>${t('pricing.starter.attr1_strong')}</strong> · ${t('pricing.starter.attr1_text')}</li>
        <li><strong>${t('pricing.starter.attr2_strong')}</strong></li>
        <li><strong>${t('pricing.starter.attr3_strong')}</strong></li>
      </ul>
      <button class="btn-plan-cta btn-plan-club">${t('pricing.btn.selectStarter')}</button>
    </div>

    <!-- CLUB PRO (FEATURED CLUB) -->
    <div class="pricing-card card-club featured-club">
      <div class="badge-card-corner">${t('pricing.badge.bestValueAcademies')}</div>
      <div class="card-header">
        <span class="plan-name">${t('pricing.plan.clubPro.name')}</span>
        <p class="plan-tagline">${t('pricing.plan.clubPro.tagline')}</p>
        <div class="price-display">
          <span class="price-amount">${billingCycle === 'season' ? `${PLANS.club_pro.precioTemporada} €` : `${PLANS.club_pro.precioMes} €`}</span>
          <span class="price-freq">${billingCycle === 'season' ? t('pricing.freq.seasonShort') : t('pricing.freq.month')}</span>
        </div>
        <span class="vat-notice">${t('pricing.clubPro.vat')}</span>
      </div>
      <ul class="decisive-attributes-list">
        <li><strong>${t('pricing.clubPro.attr1_strong')}</strong> · ${t('pricing.clubPro.attr1_text')}</li>
        <li><strong>${t('pricing.clubPro.attr2_strong')}</strong></li>
        <li><strong>${t('pricing.clubPro.attr3_strong')}</strong></li>
      </ul>
      <button class="btn-plan-cta btn-plan-club">${t('pricing.btn.selectClubPro')}</button>
    </div>
  </div>`;
}

for (const loc of locales) {
  console.log(`\n=================== [DOM CRUDO PRICING: ${loc.toUpperCase()}] ===================`);
  console.log(renderLandingPricingDOM(dicts[loc], 'season').trim());
  console.log(`=================== [FIN DOM ${loc.toUpperCase()}] ===================\n`);
}
