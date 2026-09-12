import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Trophy, 
  Layers, 
  FileText, 
  Activity, 
  Globe
} from 'lucide-react';
import { PLANS, calcularDesgloseIVA } from '../config/plans';
import { useTranslation } from '../hooks/useTranslation';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, isEn, setLanguage } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('season'); // 'season' | 'monthly'

  const handleStart = (planId = 'pro') => {
    navigate(`/login?plan=${planId}&cycle=${billingCycle}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Comparativa completa para auditoría detallada
  const comparisonRows = [
    { category: isEn ? 'Squad & Staff' : 'Mi Equipo', feature: isEn ? 'Teams Included' : 'Equipos incluidos', free: '1 equipo', pro: '3 equipos', starter: '6 equipos', clubPro: '15 equipos', premium: isEn ? 'Up to 40 teams' : 'Hasta 40 equipos' },
    { category: isEn ? 'Squad & Staff' : 'Mi Equipo', feature: isEn ? 'Players per Team' : 'Jugadores por equipo', free: '23', pro: '23', starter: '23', clubPro: '23', premium: '23' },
    { category: isEn ? 'Squad & Staff' : 'Mi Equipo', feature: isEn ? 'Staff per Team' : 'Staff por equipo', free: '1', pro: '1', starter: isEn ? 'Up to 4' : 'Hasta 4 staff', clubPro: isEn ? 'Up to 10' : 'Hasta 10 staff', premium: isEn ? 'Unlimited' : 'Ilimitado' },
    { category: isEn ? 'Squad & Staff' : 'Mi Equipo', feature: isEn ? 'Digital GDPR Signatures' : 'Consentimientos RGPD con firma digital', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Training' : 'Sesiones', feature: isEn ? 'Training Sessions' : 'Sesiones de entrenamiento', free: '10', pro: isEn ? 'Unlimited' : 'Ilimitadas', starter: isEn ? 'Unlimited' : 'Ilimitadas', clubPro: isEn ? 'Unlimited' : 'Ilimitadas', premium: isEn ? 'Unlimited' : 'Ilimitadas' },
    { category: isEn ? 'Training' : 'Sesiones', feature: isEn ? 'Professional PDF Session Exports' : 'Exportar sesión a PDF profesional', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Training' : 'Sesiones', feature: isEn ? 'Pitch Mode (Live Timer)' : 'Modo Campo con cronómetro real', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Matches' : 'Partidos', feature: isEn ? 'Live Match Tracker & Minutes' : 'Live Stats y minutajes en directo', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Matches' : 'Partidos', feature: isEn ? '7-Page Official PDF Match Report' : 'Acta oficial de 7 páginas en PDF', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Matches' : 'Partidos', feature: isEn ? 'xG-Lite Model (FIFA 105:68)' : 'Modelo xG-Lite y Mapa de Tiros Canónico', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Matches' : 'Partidos', feature: isEn ? 'Goalkeeping Exertion Metrics' : 'Métricas exclusivas de portería (GK)', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Tactics' : 'Pizarra Táctica', feature: isEn ? 'Keyframe Animations & MP4' : 'Animaciones tácticas y exportar MP4/PNG', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'AI' : 'IA Generadora', feature: isEn ? 'AI Drills & Tactical Generator' : 'IA táctica y prevención de lesiones', free: isEn ? '5/mo' : '5/mes', pro: isEn ? 'Unlimited' : 'Ilimitada', starter: isEn ? 'Unlimited' : 'Ilimitada', clubPro: isEn ? 'Unlimited' : 'Ilimitada', premium: isEn ? 'Unlimited' : 'Ilimitada' },
    { category: isEn ? 'Player' : 'Portal Jugador', feature: isEn ? 'Autonomous Player Portal' : 'Portal autónomo del jugador', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Player' : 'Portal Jugador', feature: isEn ? 'Daily Wellness & Psychological Tests' : 'Wellness diario y tests ACSI-28 / MTQ-10', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Club' : 'Club & Dirección', feature: isEn ? 'Multi-Team Academy Dashboard' : 'Panel de dirección deportiva multi-equipo', free: false, pro: false, starter: true, clubPro: true, premium: true },
    { category: isEn ? 'Club' : 'Club & Dirección', feature: isEn ? 'Consolidated PDF/CSV Reports' : 'Informes consolidados de cantera', free: false, pro: false, starter: false, clubPro: true, premium: true },
    { category: isEn ? 'Support' : 'Soporte', feature: isEn ? 'Technical Support Level' : 'Nivel de soporte técnico', free: isEn ? 'Community' : 'Comunitario', pro: isEn ? 'Standard' : 'Estándar', starter: isEn ? 'Priority' : 'Prioritario', clubPro: '24/7 Priority', premium: 'VIP Dedicated' }
  ];

  const renderCell = (val) => {
    if (val === true) return <span className="cell-check" aria-label={isEn ? 'Included' : 'Incluido'}><Check size={16} /></span>;
    if (val === false) return <span className="cell-x" aria-label={isEn ? 'Not Included' : 'No incluido'}><X size={16} /></span>;
    return <span className="cell-text">{val}</span>;
  };

  return (
    <div className="landing-wrapper">
      {/* ── 1. NAVBAR COMPACTA (VISIBLE SIN SCROLL EN 360PX) ─────────────── */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo_mister11.png" alt="Míster 11" className="landing-logo-img" />
          <span className="landing-brand">MÍSTER 11</span>
        </div>

        <div className="landing-header-actions">
          {/* Selector de idioma accesible con touch target >=48dp */}
          <div className="landing-lang-toggle" role="group" aria-label={isEn ? 'Language selector' : 'Selector de idioma'}>
            <button
              type="button"
              className={`lang-btn ${!isEn ? 'active' : ''}`}
              onClick={() => setLanguage('es')}
              aria-label={isEn ? 'Switch to Spanish' : 'Cambiar a Español'}
            >
              ES
            </button>
            <span className="lang-divider">|</span>
            <button
              type="button"
              className={`lang-btn ${isEn ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              aria-label={isEn ? 'Switch to English' : 'Cambiar a Inglés'}
            >
              EN
            </button>
          </div>

          <button 
            type="button" 
            className="btn-m11-nav-login" 
            onClick={handleLogin}
            aria-label={isEn ? 'Log in to your account' : 'Iniciar sesión en tu cuenta'}
          >
            {isEn ? 'LOG IN' : 'INICIAR SESIÓN'}
          </button>
        </div>
      </header>

      {/* ── 2. HERO SECTION FIRST-FOLD ────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="badge-promo">
            <span className="badge-icon">⚽</span>
            <span className="badge-text">
              {isEn ? "THE COACH'S DIGITAL BRAIN" : "EL CEREBRO DIGITAL DEL ENTRENADOR"}
            </span>
          </div>

          <h1 className="hero-title">
            {isEn ? (
              <>Elevate your football methodology to a <span className="highlight-text">professional standard</span></>
            ) : (
              <>Lleva tu metodología de entrenamiento al <span className="highlight-text">nivel profesional</span></>
            )}
          </h1>

          <p className="hero-description">
            {isEn
              ? "All-in-one tactical whiteboard, live match capture with FIFA 105:68 pitch frame, injury prevention AI, validated psychometrics, and automated bilingual 7-page PDF reports."
              : "Pizarra táctica interactiva, registro en vivo con proporción reglamentaria FIFA 105:68, prevención de lesiones con IA, tests psicométricos validados y actas oficiales en PDF."}
          </p>

          <div className="hero-actions">
            <button 
              type="button" 
              className="btn-m11-primary hero-cta" 
              onClick={() => handleStart('pro')}
            >
              {isEn ? 'START 7-DAY FREE TRIAL' : 'PROBAR 7 DÍAS GRATIS'} <ArrowRight size={18} />
            </button>
            <a href="#pricing" className="btn-m11-secondary hero-secondary">
              {isEn ? 'COMPARE PLANS' : 'VER PLANES Y TARIFAS'}
            </a>
          </div>

          <div className="hero-trust">
            <span className="trust-item"><Check size={16} /> {isEn ? '7 days full trial' : '7 días de prueba total'}</span>
            <span className="trust-item"><Check size={16} /> {isEn ? 'No credit card needed' : 'Sin tarjeta de crédito'}</span>
            <span className="trust-item"><Check size={16} /> {isEn ? 'Web, PWA & Android' : 'Web, PWA y Android'}</span>
          </div>
        </div>
      </section>

      {/* ── 3. MATRIZ DE PLANES CONDENSADA (DECISIÓN EN <= 10 SEGUNDOS) ────── */}
      <section id="pricing" className="landing-pricing-section">
        <div className="pricing-container">
          <div className="pricing-header-block">
            <h2 className="pricing-title">
              {isEn ? 'Transparent Pricing for Coaches & Academies' : 'Planes Transparentes para Entrenadores y Clubes'}
            </h2>
            <p className="pricing-subtitle">
              {isEn 
                ? 'All prices include VAT. Annual season pass grants 10 full months of competition with July & August completely free.' 
                : 'Precios con IVA incluido. El pase de temporada cubre los 10 meses de competición oficial con Julio y Agosto gratis.'}
            </p>

            {/* Selector de Ciclo de Facturación */}
            <div className="billing-switch-container">
              <button
                type="button"
                className={`billing-switch-btn ${billingCycle === 'season' ? 'active' : ''}`}
                onClick={() => setBillingCycle('season')}
              >
                {isEn ? 'Full Season Pass (10 Months)' : 'Pase Temporada (10 Meses)'}
                <span className="badge-discount">{isEn ? '2 MONTHS FREE' : '2 MESES GRATIS'}</span>
              </button>
              <button
                type="button"
                className={`billing-switch-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {isEn ? 'Monthly' : 'Mensual'}
              </button>
            </div>
          </div>

          {/* Grid de las 5 Tarjetas de Planes */}
          <div className="pricing-cards-grid">
            {/* PLAN GRATUITO */}
            <div className="pricing-card card-free">
              <div className="card-header">
                <span className="plan-name">{PLANS.free.nombre}</span>
                <p className="plan-tagline">{PLANS.free.tagline}</p>
                <div className="price-display">
                  <span className="price-amount">0 €</span>
                  <span className="price-freq">{isEn ? '/ forever' : '/ para siempre'}</span>
                </div>
                <span className="vat-notice">{isEn ? 'VAT Included' : 'IVA incluido'}</span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>1 {isEn ? 'Team' : 'Equipo'}</strong> (23 {isEn ? 'players' : 'jugadores'}) · 1 {isEn ? 'Staff' : 'Entrenador'}</span>
                </li>
                <li>
                  <Activity size={16} className="attr-icon" />
                  <span><strong>10 {isEn ? 'Sessions' : 'Sesiones'}</strong> · {isEn ? 'Basic Tactics Board' : 'Pizarra básica'} · 5 IA/{isEn ? 'mo' : 'mes'}</span>
                </li>
                <li>
                  <ShieldCheck size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Digital Signatures' : 'Firma Digital RGPD'}</strong> {isEn ? 'included' : 'incluida'}</span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-free"
                onClick={() => handleStart('free')}
              >
                {isEn ? 'START FREE' : 'COMENZAR GRATIS'}
              </button>
            </div>

            {/* PLAN PRO (RECOMENDADO MÍSTER) */}
            <div className="pricing-card card-pro featured">
              <div className="badge-card-corner">{isEn ? 'MOST POPULAR COACH' : 'MÁS ELEGIDO ENTRENADORES'}</div>
              <div className="card-header">
                <span className="plan-name">{PLANS.pro.nombre}</span>
                <p className="plan-tagline">{PLANS.pro.tagline}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.pro.precioTemporada} €` : `${PLANS.pro.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? (isEn ? '/ season' : '/ temporada') : (isEn ? '/ month' : '/ mes')}
                  </span>
                </div>
                <span className="vat-notice">
                  {billingCycle === 'season' 
                    ? (isEn ? 'Equivalent to 6.90 €/mo (2 months free)' : 'Equivale a 6,90 €/mes · IVA incluido')
                    : (isEn ? 'Billed monthly · Cancel anytime' : 'Facturado mensual · Cancela cuando quieras')}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Up to 3 Teams' : 'Hasta 3 Equipos'}</strong> · {isEn ? 'Unlimited Sessions & Live Stats' : 'Sesiones ilimitadas y Live Stats'}</span>
                </li>
                <li>
                  <FileText size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Official 7-Page PDF Report' : 'Acta Oficial PDF 7 Páginas'}</strong> · xG-Lite (105:68) &amp; {isEn ? 'GK Metrics' : 'Portería'}</span>
                </li>
                <li>
                  <Sparkles size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Player Portal' : 'Portal del Jugador'}</strong> · {isEn ? 'Daily Wellness, Tests & Unlimited AI' : 'Wellness diario, Tests e IA ilimitada'}</span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-pro"
                onClick={() => handleStart('pro')}
              >
                {isEn ? 'TRY 7 DAYS FREE' : 'PROBAR 7 DÍAS GRATIS'}
              </button>
            </div>

            {/* CLUB STARTER */}
            <div className="pricing-card card-club">
              <div className="card-header">
                <span className="plan-name">{PLANS.club_starter.nombre}</span>
                <p className="plan-tagline">{PLANS.club_starter.tagline}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_starter.precioTemporada} €` : `${PLANS.club_starter.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? (isEn ? '/ season' : '/ temp.') : (isEn ? '/ mes' : '/ mes')}
                  </span>
                </div>
                <span className="vat-notice">
                  {isEn ? `~5.50 €/coach/mo · VAT included` : `~5,50 €/entrenador/mes · IVA incluido`}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Up to 6 Teams' : 'Hasta 6 Equipos'}</strong> · {isEn ? 'Up to 4 Staff per team' : 'Hasta 4 staff por equipo'}</span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'All PRO Features Included' : 'Todo lo incluido en el Plan PRO'}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Academy Multi-Coach Panel' : 'Panel Multi-Entrenador con Roles'}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_starter')}
              >
                {isEn ? 'SELECT STARTER' : 'SELECCIONAR STARTER'}
              </button>
            </div>

            {/* CLUB PRO */}
            <div className="pricing-card card-club featured-club">
              <div className="badge-card-corner">{isEn ? 'BEST VALUE FOR ACADEMIES' : 'MÁS POPULAR CLUBES'}</div>
              <div className="card-header">
                <span className="plan-name">{PLANS.club_pro.nombre}</span>
                <p className="plan-tagline">{PLANS.club_pro.tagline}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_pro.precioTemporada} €` : `${PLANS.club_pro.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? (isEn ? '/ season' : '/ temp.') : (isEn ? '/ mes' : '/ mes')}
                  </span>
                </div>
                <span className="vat-notice">
                  {isEn ? `~3.00 €/coach/mo · VAT included` : `~3,00 €/entrenador/mes · IVA incluido`}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Up to 15 Teams' : 'Hasta 15 Equipos'}</strong> · {isEn ? 'Up to 10 Staff per team' : 'Hasta 10 staff por equipo'}</span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Consolidated PDF/CSV Reports' : 'Informes Consolidados de Club'}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Youth Academy Historical Hub' : 'Histórico Global de Cantera y 24/7'}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_pro')}
              >
                {isEn ? 'SELECT CLUB PRO' : 'SELECCIONAR CLUB PRO'}
              </button>
            </div>

            {/* CLUB PREMIUM */}
            <div className="pricing-card card-club">
              <div className="card-header">
                <span className="plan-name">{PLANS.club_premium.nombre}</span>
                <p className="plan-tagline">{PLANS.club_premium.tagline}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_premium.precioTemporada} €` : `${PLANS.club_premium.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? (isEn ? '/ season' : '/ temp.') : (isEn ? '/ mes' : '/ mes')}
                  </span>
                </div>
                <span className="vat-notice">{isEn ? 'VAT Included · VIP Dedicated' : 'IVA incluido · Soporte VIP'}</span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Up to 40 Teams' : 'Hasta 40 Equipos'}</strong> · <strong>{isEn ? 'Unlimited Staff' : 'Staff Ilimitado'}</strong></span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Multi-Site Academy Licenses' : 'Licencias Multi-Sede y Códigos'}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{isEn ? 'Dedicated VIP Onboarding' : 'Onboarding Personalizado y VIP'}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_premium')}
              >
                {isEn ? 'SELECT PREMIUM' : 'SELECCIONAR PREMIUM'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TABLA COMPARATIVA COMPLETA ──────────────────────────────────── */}
      <section id="comparison" className="landing-comparison-section">
        <div className="comparison-container">
          <h3 className="comparison-title">
            {isEn ? 'Detailed Feature Comparison Matrix' : 'Matriz Comparativa Detallada de Características'}
          </h3>
          <p className="comparison-subtitle">
            {isEn 
              ? 'Examine every single feature across individual and academy tiers with code-verified entitlements.' 
              : 'Analiza cada característica en detalle entre planes individuales y de club con entitlements verificados.'}
          </p>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="th-feature">{isEn ? 'Module & Feature' : 'Módulo y Función'}</th>
                  <th className="th-plan">{PLANS.free.nombre}</th>
                  <th className="th-plan featured-col">{PLANS.pro.nombre}</th>
                  <th className="th-plan">{PLANS.club_starter.nombre}</th>
                  <th className="th-plan">{PLANS.club_pro.nombre}</th>
                  <th className="th-plan">{PLANS.club_premium.nombre}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="td-feature">
                      <span className="feature-category">{row.category}</span>
                      <span className="feature-name">{row.feature}</span>
                    </td>
                    <td className="td-val">{renderCell(row.free)}</td>
                    <td className="td-val featured-col">{renderCell(row.pro)}</td>
                    <td className="td-val">{renderCell(row.starter)}</td>
                    <td className="td-val">{renderCell(row.clubPro)}</td>
                    <td className="td-val">{renderCell(row.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. FOOTER INSTITUCIONAL ───────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand-block">
            <div className="footer-logo">
              <img src="/logo_mister11.png" alt="Míster 11" className="footer-logo-img" />
              <span className="footer-brand-name">MÍSTER 11</span>
            </div>
            <p className="footer-tagline">
              {isEn 
                ? 'The professional intelligence platform for grassroots and amateur football.' 
                : 'La plataforma de inteligencia técnica para el fútbol base y amateur.'}
            </p>
          </div>

          <div className="footer-links-block">
            <a href="/legal/consentimiento.html" target="_blank" rel="noopener noreferrer">
              {isEn ? 'RGPD & Privacy' : 'RGPD y Privacidad'}
            </a>
            <span className="footer-dot">·</span>
            <a href="/login">
              {isEn ? 'Coach Login' : 'Acceso Entrenadores'}
            </a>
            <span className="footer-dot">·</span>
            <a href="/instalar">
              {isEn ? 'Install App / PWA' : 'Instalar App / PWA'}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Míster 11. {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'} Paleta Oficial Tierra y Campo.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
