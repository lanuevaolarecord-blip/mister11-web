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

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-pill">⚽ LA PLATAFORMA INTEGRAL PARA EL FÚTBOL BASE Y AMATEUR</div>
          <h1 className="hero-title">
            Planifica, dirige y analiza como un <span className="hero-highlight">cuerpo técnico profesional</span>.
          </h1>
          <p className="hero-desc">
            Pizarra táctica animada con video MP4, diseñador de sesiones con PDF, IA generativa para entrenamientos y prevención de lesiones, Live Stats en directo y portal del jugador con firma RGPD.
          </p>
          <div className="hero-actions">
            <button className="btn-azul-primario hero-cta-btn" onClick={handleStart}>
              EMPEZAR GRATIS AHORA
            </button>
            <a href="#pricing" className="hero-secondary-btn">
              Ver Planes y Precios
            </a>
          </div>
          <div className="hero-guarantees">
            <span>🛡️ Precios con IVA incluido</span>
            <span>🏆 Temporada 10 Meses (Julio y Agosto gratis)</span>
            <span>📱 100% Optimizado para Smartphone</span>
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
