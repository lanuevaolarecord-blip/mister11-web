import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Presentation, 
  Sparkles, 
  Calendar, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Check,
  X,
  Layers,
  Trophy,
  BarChart2,
  Image,
  FileText,
  Brain,
  Zap,
  Building2,
  Shield
} from 'lucide-react';
import { PLANS, calcularDesgloseIVA } from '../config/plans';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('season'); // 'season' | 'monthly'

  const handleStart = () => navigate('/login');
  const handleLogin = () => navigate('/login');

  // ─── Plan comparison table data ──────────────────────────────────────────────
  const comparisonRows = [
    { category: 'Mi Equipo', feature: 'Equipos incluidos', free: '1 equipo', pro: '3 equipos', starter: '6 equipos', clubPro: '15 equipos', premium: 'Hasta 40 equipos' },
    { category: 'Mi Equipo', feature: 'Jugadores por equipo', free: '23 jugadores', pro: '23 jugadores', starter: '23 jugadores', clubPro: '23 jugadores', premium: '23 jugadores' },
    { category: 'Mi Equipo', feature: 'Staff por equipo', free: '1 entrenador', pro: '1 entrenador', starter: 'Hasta 4 staff', clubPro: 'Hasta 10 staff', premium: 'Staff Ilimitado' },
    { category: 'Mi Equipo', feature: 'Alertas de salud automáticas', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Sesiones', feature: 'Sesiones de entrenamiento', free: '10 sesiones', pro: 'Ilimitadas', starter: 'Ilimitadas', clubPro: 'Ilimitadas', premium: 'Ilimitadas' },
    { category: 'Sesiones', feature: 'Editor de bloques (drag & drop)', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Sesiones', feature: 'Biblioteca de ejercicios', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Sesiones', feature: 'Modo Campo (Live Session con crono)', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Sesiones', feature: 'Exportar sesión a PDF profesional', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Partidos', feature: 'Registro de partidos y eventos', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Partidos', feature: 'Live Stats en tiempo real', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Partidos', feature: 'Acta de partido en PDF', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Partidos', feature: 'Análisis multi-partido y tendencias', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Pizarra', feature: 'Pizarra táctica con formaciones', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Pizarra', feature: 'Animaciones y exportación MP4', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Pizarra', feature: 'Pizarra táctica en vivo colaborativa', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'IA', feature: 'Generaciones IA / mes', free: '5 generaciones', pro: 'Ilimitadas', starter: 'Ilimitadas', clubPro: 'Ilimitadas', premium: 'Ilimitadas' },
    { category: 'IA', feature: 'Modo prevención de lesiones con IA', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Jugador', feature: 'Portal autónomo del jugador', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Jugador', feature: 'Check-in diario de salud y wellness', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Jugador', feature: 'Tests psicológicos (ACSI-28 / MTQ-10)', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Tests', feature: 'Tests físicos y gráficas de radar', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Planificación', feature: 'Planificación anual (micro/meso/macro)', free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Legal', feature: 'Consentimientos RGPD con firma digital', free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: 'Club', feature: 'Panel de administración del club', free: false, false: false, starter: true, clubPro: true, premium: true },
    { category: 'Club', feature: 'Multi-entrenador con roles y permisos', free: false, false: false, starter: true, clubPro: true, premium: true },
    { category: 'Club', feature: 'Soporte prioritario dedicado', free: false, false: false, starter: true, clubPro: '24/7', premium: 'VIP' },
  ];

  const renderCell = (val) => {
    if (val === true) return <span className="cell-check"><Check size={16} /></span>;
    if (val === false) return <span className="cell-x"><X size={16} /></span>;
    return <span className="cell-text">{val}</span>;
  };

  const categories = [...new Set(comparisonRows.map(r => r.category))];

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo_mister11.png" alt="Míster11" className="landing-logo-img" />
          <span className="landing-brand">MÍSTER 11</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#features">Funciones</a>
          <a href="#pricing">Planes</a>
          <a href="#comparison">Comparativa</a>
        </nav>
        <button className="btn-azul-primario navbar-cta" onClick={handleLogin}>
          INICIAR SESIÓN
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="badge-promo">
            <span className="badge-icon">⚽</span>
            <span className="badge-text">EL CEREBRO DIGITAL DEL ENTRENADOR</span>
          </div>
          <h1 className="hero-title">
            Lleva tu metodología de entrenamiento al <span className="highlight-text">nivel profesional</span>
          </h1>
          <p className="hero-description">
            La herramienta definitiva para entrenadores de fútbol base y amateur. Pizarra táctica, periodización completa de microciclos, tests psicosociales validados y generación con Inteligencia Artificial.
          </p>
          <div className="hero-actions">
            <button className="btn-azul-primario hero-cta" onClick={handleStart}>
              EMPEZAR AHORA <ArrowRight size={16} />
            </button>
            <a href="#pricing" className="btn-outline-landing hero-secondary">
              VER CARACTERÍSTICAS
            </a>
          </div>
          <div className="hero-trust">
            <span className="trust-item"><Check size={14} /> 7 días de prueba total</span>
            <span className="trust-item"><Check size={14} /> Sin tarjeta de crédito</span>
            <span className="trust-item"><Check size={14} /> Multi-dispositivo</span>
          </div>
        </div>
        
        {/* Mockup / Canvas Preview de la Pizarra */}
        <div className="landing-hero-preview">
          <div className="preview-field-container">
            <div className="preview-field-header">
              <div className="preview-dot red"></div>
              <div className="preview-dot yellow"></div>
              <div className="preview-dot green"></div>
              <span className="preview-title">Pizarra Táctica Míster11 · Vista Previa</span>
            </div>
            <div className="preview-field-canvas">
              {/* Football Field Markings SVG */}
              <svg className="field-markings-svg" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent-gold)" />
                  </marker>
                </defs>
                {/* Boundary */}
                <rect x="5" y="5" width="110" height="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Halfway line */}
                <line x1="60" y1="5" x2="60" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Center circle */}
                <circle cx="60" cy="40" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Center spot */}
                <circle cx="60" cy="40" r="1" fill="rgba(255,255,255,0.8)" />
                
                {/* Left Penalty Area */}
                <rect x="5" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Left Goal Area */}
                <rect x="5" y="29" width="6" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Left Penalty Spot */}
                <circle cx="17" cy="40" r="0.8" fill="rgba(255,255,255,0.8)" />
                {/* Left Penalty Arc */}
                <path d="M 23 32 A 10 10 0 0 1 23 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Left Goal */}
                <rect x="1.5" y="33" width="3.5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

                {/* Right Penalty Area */}
                <rect x="97" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Right Goal Area */}
                <rect x="109" y="29" width="6" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Right Penalty Spot */}
                <circle cx="103" cy="40" r="0.8" fill="rgba(255,255,255,0.8)" />
                {/* Right Penalty Arc */}
                <path d="M 97 32 A 10 10 0 0 0 97 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Right Goal */}
                <rect x="115" y="33" width="3.5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                
                {/* Tactical Arrow */}
                <path d="M 54 28 Q 66 38 76 40" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeDasharray="3,3" markerEnd="url(#arrow)" />
              </svg>

              <div className="player-node p-blue p1" style={{ top: '35%', left: '45%' }}>10</div>
              <div className="player-node p-blue p2" style={{ top: '65%', left: '50%' }}>8</div>
              <div className="player-node p-red p3" style={{ top: '50%', left: '65%' }}>4</div>
              <div className="ball-node" style={{ top: '52%', left: '55%' }}>⚽</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─────────────────────────────────────────────────── */}
      <section id="pricing" className="landing-pricing">
        <div className="section-header">
          <div className="badge-seccion">PLANES & PRECIOS</div>
          <h2 className="section-title">Elige el plan adaptado a tu equipo o club</h2>
          <p className="section-subtitle">
            Todos los precios tienen el <strong>IVA (21%) incluido</strong>. Temporada de 10 meses de competición (Septiembre a Junio) con Julio y Agosto gratis.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="landing-billing-toggle">
            <button
              type="button"
              className={`toggle-option ${billingCycle === 'monthly' ? 'selected' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Facturación Mensual
            </button>
            <button
              type="button"
              className={`toggle-option ${billingCycle === 'season' ? 'selected' : ''}`}
              onClick={() => setBillingCycle('season')}
            >
              🏆 Plan Temporada (10 Meses)
              <span className="save-tag">🎁 Julio & Agosto GRATIS</span>
            </button>
          </div>
        </div>

        <div className="landing-pricing-cards-grid">

          {/* ── FREE ── */}
          <div className="pricing-card free-plan">
            <div className="pricing-plan-header">
              <span className="plan-tier-label free">GRATIS</span>
              <h3 className="pricing-plan-name">{PLANS.free.nombre}</h3>
              <div className="pricing-price-block">
                <span className="price-number">0 €</span>
                <span className="price-period">/ siempre</span>
              </div>
              <p className="pricing-tax-info">Sin tarjeta · 1 equipo y 23 jugadores</p>
            </div>
            <ul className="pricing-features-list">
              {PLANS.free.features.map((feat, i) => (
                <li key={i}><Check size={16} /> <span>{feat}</span></li>
              ))}
            </ul>
            <button className="btn-outline-landing pricing-cta" onClick={handleStart}>
              EMPEZAR GRATIS
            </button>
          </div>

          {/* ── PRO ── */}
          <div className="pricing-card pro-plan">
            <div className="pricing-plan-header">
              <span className="plan-tier-label pro">ENTRENADOR</span>
              <h3 className="pricing-plan-name">{PLANS.pro.nombre}</h3>
              <div className="pricing-price-block">
                <span className="price-number">
                  {billingCycle === 'season' ? `${PLANS.pro.precioTemporada} €` : `${PLANS.pro.precioMes} €`}
                </span>
                <span className="price-period">{billingCycle === 'season' ? '/temporada' : '/mes'}</span>
              </div>
              <p className="pricing-tax-info">
                IVA incl. · Base: {calcularDesgloseIVA(billingCycle === 'season' ? PLANS.pro.precioTemporada : PLANS.pro.precioMes).base.toFixed(2)} €
              </p>
            </div>
            <ul className="pricing-features-list">
              {PLANS.pro.features.map((feat, i) => (
                <li key={i}><Check size={16} /> <span>{feat}</span></li>
              ))}
            </ul>
            <button className="btn-azul-primario pricing-cta" onClick={() => navigate('/login?plan=pro')}>
              ELEGIR PLAN PRO
            </button>
          </div>

          {/* ── CLUB STARTER ── */}
          <div className="pricing-card club-starter-plan">
            <div className="pricing-plan-header">
              <span className="plan-tier-label club">HASTA 6 EQUIPOS</span>
              <h3 className="pricing-plan-name">{PLANS.club_starter.nombre}</h3>
              <div className="pricing-price-block">
                <span className="price-number">
                  {billingCycle === 'season' ? `${PLANS.club_starter.precioTemporada} €` : `${PLANS.club_starter.precioMes} €`}
                </span>
                <span className="price-period">{billingCycle === 'season' ? '/temporada' : '/mes'}</span>
              </div>
              <p className="pricing-tax-info">
                {billingCycle === 'season' ? `Solo ${PLANS.club_starter.costePorEntrenadorMesTemporada}/entrenador/mes` : 'IVA incluido · Multi-entrenador'}
              </p>
            </div>
            <ul className="pricing-features-list">
              {PLANS.club_starter.features.map((feat, i) => (
                <li key={i}><Check size={16} /> <span>{feat}</span></li>
              ))}
            </ul>
            <button className="btn-verde-exito pricing-cta" onClick={() => navigate('/login?plan=club_starter')}>
              ELEGIR CLUB STARTER
            </button>
          </div>

          {/* ── CLUB PRO (MÁS POPULAR) ── */}
          <div className="pricing-card popular-plan club-pro-plan">
            <div className="pricing-badge">⭐ MÁS POPULAR</div>
            <div className="pricing-plan-header">
              <span className="plan-tier-label club-pro">HASTA 15 EQUIPOS</span>
              <h3 className="pricing-plan-name">{PLANS.club_pro.nombre}</h3>
              <div className="pricing-price-block">
                <span className="price-number">
                  {billingCycle === 'season' ? `${PLANS.club_pro.precioTemporada} €` : `${PLANS.club_pro.precioMes} €`}
                </span>
                <span className="price-period">{billingCycle === 'season' ? '/temporada' : '/mes'}</span>
              </div>
              <p className="pricing-tax-info">
                {billingCycle === 'season' ? `Solo ${PLANS.club_pro.costePorEntrenadorMesTemporada}/entrenador/mes` : 'IVA incluido · Dirección deportiva'}
              </p>
            </div>
            <ul className="pricing-features-list">
              {PLANS.club_pro.features.map((feat, i) => (
                <li key={i}><Check size={16} /> <span>{feat}</span></li>
              ))}
            </ul>
            <button className="btn-verde-exito pricing-cta" onClick={() => navigate('/login?plan=club_pro')}>
              ELEGIR CLUB PRO
            </button>
          </div>

          {/* ── CLUB PREMIUM ── */}
          <div className="pricing-card club-premium-plan">
            <div className="pricing-badge gold">🏆 MÁXIMA CAPACIDAD</div>
            <div className="pricing-plan-header">
              <span className="plan-tier-label premium">HASTA 40 EQUIPOS</span>
              <h3 className="pricing-plan-name">{PLANS.club_premium.nombre}</h3>
              <div className="pricing-price-block">
                <span className="price-number">
                  {billingCycle === 'season' ? `${PLANS.club_premium.precioTemporada} €` : `${PLANS.club_premium.precioMes} €`}
                </span>
                <span className="price-period">{billingCycle === 'season' ? '/temporada' : '/mes'}</span>
              </div>
              <p className="pricing-tax-info">Staff ilimitado · Canteras grandes</p>
            </div>
            <ul className="pricing-features-list">
              {PLANS.club_premium.features.map((feat, i) => (
                <li key={i}><Check size={16} /> <span>{feat}</span></li>
              ))}
            </ul>
            <button className="btn-azul-primario pricing-cta" onClick={() => navigate('/login?plan=club_premium')}>
              ELEGIR CLUB PREMIUM
            </button>
          </div>

        </div>
      </section>

      {/* ─── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <section id="comparison" className="landing-comparison">
        <div className="section-header">
          <h2 className="section-title">Comparativa detallada de funcionalidades</h2>
          <p className="section-subtitle">Transparencia absoluta para tu cuerpo técnico o club.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-feature">Funcionalidad</th>
                <th className="col-free">FREE (0 €)</th>
                <th className="col-pro">PRO ({PLANS.pro.precioMes} €)</th>
                <th className="col-starter">STARTER ({PLANS.club_starter.precioMes} €)</th>
                <th className="col-clubpro popular-col">CLUB PRO ({PLANS.club_pro.precioMes} €)</th>
                <th className="col-premium">PREMIUM ({PLANS.club_premium.precioMes} €)</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <React.Fragment key={cat}>
                  <tr className="category-row">
                    <td colSpan={6} className="category-label">{cat}</td>
                  </tr>
                  {comparisonRows.filter(r => r.category === cat).map((row, i) => (
                    <tr key={i} className="feature-row">
                      <td className="feat-name">{row.feature}</td>
                      <td className="feat-cell">{renderCell(row.free)}</td>
                      <td className="feat-cell">{renderCell(row.pro)}</td>
                      <td className="feat-cell">{renderCell(row.starter)}</td>
                      <td className="feat-cell popular-col">{renderCell(row.clubPro)}</td>
                      <td className="feat-cell">{renderCell(row.premium)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="cta-banner">
        <div className="cta-banner-content">
          <h2>¿Listo para profesionalizar la gestión de tu equipo?</h2>
          <p>Comienza hoy mismo con la plataforma diseñada específicamente para el fútbol formativo y amateur.</p>
          <button className="btn-azul-primario footer-cta" onClick={handleStart}>
            EMPEZAR PRUEBA GRATIS
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-links">
          <a href="/legal/privacidad.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>
          <a href="/legal/terminos.html" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>
          <a href="/legal/consentimiento.html" target="_blank" rel="noopener noreferrer">Consentimiento Parental</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Míster11. Todos los derechos reservados. Precios con IVA incluido.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
