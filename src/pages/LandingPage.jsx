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
  Building2
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  const handleStart = () => navigate('/login');
  const handleLogin = () => navigate('/login');

  // ─── Plan comparison table data ──────────────────────────────────────────────
  const comparisonRows = [
    { category: 'Mi Equipo', feature: 'Equipos', free: '1 equipo', pro: '3 equipos', club: 'Hasta 40 equipos' },
    { category: 'Mi Equipo', feature: 'Jugadores por equipo', free: '23 jugadores', pro: '23 jugadores', club: '23 jugadores' },
    { category: 'Mi Equipo', feature: 'Staff técnico (asistentes)', free: true, pro: true, club: true },
    { category: 'Mi Equipo', feature: 'Invitar co-entrenadores', free: false, pro: true, club: true },
    { category: 'Mi Equipo', feature: 'Alertas de salud automáticas', free: false, pro: true, club: true },
    { category: 'Sesiones', feature: 'Sesiones de entrenamiento', free: '10 sesiones', pro: 'Ilimitadas', club: 'Ilimitadas' },
    { category: 'Sesiones', feature: 'Editor de bloques (drag & drop)', free: true, pro: true, club: true },
    { category: 'Sesiones', feature: 'Biblioteca de ejercicios', free: true, pro: true, club: true },
    { category: 'Sesiones', feature: 'Visor profesional de imágenes', free: false, pro: true, club: true },
    { category: 'Sesiones', feature: 'Anotaciones y dibujo sobre imagen', free: false, pro: true, club: true },
    { category: 'Sesiones', feature: 'Modo presentación y vista dividida', free: false, pro: true, club: true },
    { category: 'Sesiones', feature: 'Ejecución en vivo en campo', free: false, pro: true, club: true },
    { category: 'Sesiones', feature: 'Exportar sesión a PDF', free: false, pro: true, club: true },
    { category: 'Partidos', feature: 'Registro de partidos y eventos', free: true, pro: true, club: true },
    { category: 'Partidos', feature: 'Estadísticas básicas', free: true, pro: true, club: true },
    { category: 'Partidos', feature: 'HeatMap y PassNetwork', free: false, pro: true, club: true },
    { category: 'Partidos', feature: 'xG ShotMap y Radar de partido', free: false, pro: true, club: true },
    { category: 'Partidos', feature: 'Exportar estadísticas (PDF / CSV)', free: false, pro: true, club: true },
    { category: 'Partidos', feature: 'Análisis multi-partido (temporada)', free: false, pro: true, club: true },
    { category: 'Pizarra', feature: 'Pizarra táctica con formaciones', free: true, pro: true, club: true },
    { category: 'Pizarra', feature: 'Herramientas de dibujo básicas', free: true, pro: true, club: true },
    { category: 'Pizarra', feature: 'Formaciones personalizadas guardadas', free: false, pro: true, club: true },
    { category: 'Pizarra', feature: 'Animaciones de jugadas', free: false, pro: true, club: true },
    { category: 'Pizarra', feature: 'Exportar pizarra PNG / PDF', free: false, pro: true, club: true },
    { category: 'IA', feature: 'Generaciones IA / mes', free: '5 generaciones', pro: 'Ilimitadas', club: 'Ilimitadas' },
    { category: 'IA', feature: 'Modo prevención de lesiones', free: false, pro: true, club: true },
    { category: 'IA', feature: 'Referencia visual para la IA', free: false, pro: true, club: true },
    { category: 'IA', feature: 'Input por voz', free: false, pro: true, club: true },
    { category: 'Tests', feature: 'Tests físicos predefinidos', free: true, pro: true, club: true },
    { category: 'Tests', feature: 'Historial y gráficas de evolución', free: false, pro: true, club: true },
    { category: 'Tests', feature: 'Test RPE y Wellness', free: false, pro: true, club: true },
    { category: 'Planificación', feature: 'Planificación de temporada', free: false, pro: true, club: true },
    { category: 'Planificación', feature: 'Planes individuales por jugador', free: false, pro: true, club: true },
    { category: 'Otros', feature: 'Consentimientos con firma digital', free: false, pro: true, club: true },
    { category: 'Otros', feature: 'Exportación general en PDF', free: false, pro: true, club: true },
    { category: 'Club', feature: 'Licencia multi-entrenador', free: false, pro: false, club: true },
    { category: 'Club', feature: 'Panel de administración del club', free: false, pro: false, club: true },
    { category: 'Club', feature: 'Hasta 40 equipos en el club', free: false, pro: false, club: true },
    { category: 'Club', feature: 'Soporte prioritario', free: false, pro: false, club: true },
  ];

  const renderCell = (val) => {
    if (val === true) return <span className="cell-check"><Check size={16} /></span>;
    if (val === false) return <span className="cell-x"><X size={16} /></span>;
    return <span className="cell-text">{val}</span>;
  };

  // Group rows by category
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
          <a href="#comparison">Comparar</a>
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
            <a href="#features" className="btn-outline-landing hero-secondary">
              VER CARACTERÍSTICAS
            </a>
          </div>
          <div className="hero-trust">
            <span className="trust-item"><Check size={14} /> 7 días de prueba total</span>
            <span className="trust-item"><Check size={14} /> Sin tarjeta de crédito</span>
            <span className="trust-item"><Check size={14} /> Multi-dispositivo</span>
          </div>
        </div>
        
        {/* Mockup / Canvas Preview */}
        <div className="landing-hero-preview">
          <div className="preview-field-container">
            <div className="preview-field-header">
              <div className="preview-dot red"></div>
              <div className="preview-dot yellow"></div>
              <div className="preview-dot green"></div>
              <span className="preview-title">Pizarra Táctica Míster11 · Vista Previa</span>
            </div>
            <div className="preview-field-canvas">
              <svg className="field-markings-svg" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent-gold)" />
                  </marker>
                </defs>
                <rect x="5" y="5" width="110" height="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <line x1="60" y1="5" x2="60" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="60" cy="40" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="60" cy="40" r="1" fill="rgba(255,255,255,0.8)" />
                <rect x="5" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="5" y="29" width="6" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="17" cy="40" r="0.8" fill="rgba(255,255,255,0.8)" />
                <path d="M 23 32 A 10 10 0 0 1 23 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="97" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="109" y="29" width="6" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <circle cx="103" cy="40" r="0.8" fill="rgba(255,255,255,0.8)" />
                <path d="M 97 32 A 10 10 0 0 0 97 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <path d="M 5 8 A 3 3 0 0 1 8 5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 8 75 A 3 3 0 0 1 5 72" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 112 5 A 3 3 0 0 1 115 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 115 72 A 3 3 0 0 1 112 75" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <rect x="1.5" y="33" width="3.5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                <rect x="115" y="33" width="3.5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
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

      {/* Stats Quick Ribbon */}
      <section className="stats-ribbon">
        <div className="stat-ribbon-item">
          <span className="stat-number">100%</span>
          <span className="stat-label">Adaptado a Móvil / PWA</span>
        </div>
        <div className="stat-ribbon-item">
          <span className="stat-number">6+</span>
          <span className="stat-label">Cuestionarios Psicosociales</span>
        </div>
        <div className="stat-ribbon-item">
          <span className="stat-number">40</span>
          <span className="stat-label">Microciclos Planificados</span>
        </div>
        <div className="stat-ribbon-item">
          <span className="stat-number">12</span>
          <span className="stat-label">Módulos Profesionales</span>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <h2 className="section-title">Todo lo que necesitas para liderar tu equipo</h2>
          <p className="section-subtitle">Funciones premium desarrolladas por metodólogos y entrenadores profesionales.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Presentation size={24} /></div>
            <h3 className="feature-card-title">Pizarra Táctica Interactiva</h3>
            <p className="feature-card-desc">Diseña jugadas a balón parado, presiones y ejercicios complejos en una pizarra digital fluida. Exporta capturas y animaciones directo a tus entrenamientos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Sparkles size={24} /></div>
            <h3 className="feature-card-title">IA Generadora de Sesiones</h3>
            <p className="feature-card-desc">¿Falta de tiempo? Deja que la Inteligencia Artificial de Míster11 diseñe una sesión de entrenamiento adaptada a tu categoría, intensidad y objetivos específicos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Layers size={24} /></div>
            <h3 className="feature-card-title">Planificación y Cargas</h3>
            <p className="feature-card-desc">Periodización completa de la temporada. Controla la fatiga, calcula el volumen de entrenamiento y obtén el índice de carga acumulada de tus jugadores.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Users size={24} /></div>
            <h3 className="feature-card-title">Tests Psicosociales y Físicos</h3>
            <p className="feature-card-desc">Mide la cohesión de grupo (GEQ), la fortaleza mental (MTQ-10) y la resiliencia en el deporte (IRES). Único software amateur con tests psicológicos validados.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><BarChart2 size={24} /></div>
            <h3 className="feature-card-title">Live Stats de Partido</h3>
            <p className="feature-card-desc">HeatMaps, redes de pases, xG ShotMap y Radar Charts en tiempo real. Analiza el rendimiento con datos de nivel profesional en cada partido.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Image size={24} /></div>
            <h3 className="feature-card-title">Visor de Imágenes Profesional</h3>
            <p className="feature-card-desc">Zoom, pan, anotaciones vectoriales, cuadrícula táctica superpuesta, modo presentación y vista dividida para analizar ejercicios y jugadas en detalle.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><FileText size={24} /></div>
            <h3 className="feature-card-title">Consentimientos Digitales</h3>
            <p className="feature-card-desc">Firma digital integrada para consentimientos informados de menores. Guarda y gestiona toda la documentación legal de tus jugadores.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Building2 size={24} /></div>
            <h3 className="feature-card-title">Gestión de Club</h3>
            <p className="feature-card-desc">Panel organizacional para academias y clubes. Gestiona hasta 40 equipos, múltiples entrenadores con roles y visualiza informes consolidados del club.</p>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ──────────────────────────────────────────────────── */}
      <section id="pricing" className="landing-pricing">
        <div className="section-header">
          <h2 className="section-title">Un plan adaptado a tu club</h2>
          <p className="section-subtitle">Acceso total a todas las herramientas metodológicas sin sorpresas.</p>
        </div>

        <div className="pricing-card-container three-plans">

          {/* ── PLAN GRATIS ── */}
          <div className="pricing-card free-plan">
            <div className="pricing-plan-header">
              <span className="plan-tier-label free">GRATIS</span>
              <h3 className="pricing-plan-name">Míster11 FREE</h3>
              <div className="pricing-price-block">
                <span className="price-number">0€</span>
                <span className="price-period">/ siempre</span>
              </div>
              <p className="pricing-tax-info">Sin tarjeta de crédito · Para siempre</p>
            </div>

            <ul className="pricing-features-list">
              <li><Check size={16} /> <strong>1 equipo</strong></li>
              <li><Check size={16} /> <strong>23 jugadores</strong> por equipo</li>
              <li><Check size={16} /> <strong>10 sesiones</strong> de entrenamiento</li>
              <li><Check size={16} /> <strong>5 generaciones IA</strong> / mes</li>
              <li><Check size={16} /> Pizarra táctica básica</li>
              <li><Check size={16} /> Registro de partidos</li>
              <li><Check size={16} /> Tests físicos predefinidos</li>
              <li><Check size={16} /> Estadísticas básicas de partido</li>
              <li className="feature-unavailable"><X size={16} /> Análisis avanzado (HeatMap, xG…)</li>
              <li className="feature-unavailable"><X size={16} /> Exportación en PDF / CSV</li>
              <li className="feature-unavailable"><X size={16} /> Planificación de temporada</li>
            </ul>

            <button className="btn-outline-landing pricing-cta" onClick={handleStart}>
              EMPEZAR GRATIS
            </button>
            <p className="pricing-trial-footer">Incluye 7 días de prueba PRO al registrarte</p>
          </div>

          {/* ── PLAN PRO ── */}
          <div className="pricing-card popular-plan">
            <div className="pricing-badge">MÁS POPULAR</div>
            <div className="pricing-plan-header">
              <span className="plan-tier-label pro">PRO</span>
              <h3 className="pricing-plan-name">Míster11 PRO</h3>
              <div className="pricing-price-block">
                <span className="price-number">7.99€</span>
                <span className="price-period">/ mes</span>
              </div>
              <p className="pricing-tax-info">IVA incluido · Cancela cuando quieras</p>
            </div>

            <ul className="pricing-features-list">
              <li><Check size={16} /> <strong>3 equipos</strong></li>
              <li><Check size={16} /> <strong>23 jugadores</strong> por equipo</li>
              <li><Check size={16} /> <strong>Sesiones ilimitadas</strong></li>
              <li><Check size={16} /> <strong>IA ilimitada</strong> + prevención lesiones</li>
              <li><Check size={16} /> Pizarra táctica avanzada + exportación</li>
              <li><Check size={16} /> HeatMap, PassNetwork, xG, Radar</li>
              <li><Check size={16} /> Visor profesional de imágenes</li>
              <li><Check size={16} /> Anotaciones y cuadrícula táctica</li>
              <li><Check size={16} /> Exportación PDF y CSV</li>
              <li><Check size={16} /> Planificación de temporada completa</li>
              <li><Check size={16} /> Tests RPE, Wellness y evolución</li>
              <li><Check size={16} /> Consentimientos con firma digital</li>
              <li><Check size={16} /> Invitar co-entrenadores</li>
              <li className="feature-unavailable"><X size={16} /> Panel de club multi-entrenador</li>
            </ul>

            <button className="btn-verde-exito pricing-cta" onClick={() => navigate('/login?plan=pro')}>
              REGISTRARME EN PRO
            </button>
            <p className="pricing-trial-footer">O inicia una prueba gratuita de 7 días sin compromiso</p>
          </div>

          {/* ── PLAN CLUB ── */}
          <div className="pricing-card club-plan">
            <div className="pricing-badge gold">MÁS COMPLETO</div>
            <div className="pricing-plan-header">
              <span className="plan-tier-label club">CLUB</span>
              <h3 className="pricing-plan-name">Míster11 CLUB</h3>
              <div className="pricing-price-block">
                <span className="price-number">39.99€</span>
                <span className="price-period">/ mes</span>
              </div>
              <p className="pricing-tax-info">IVA incluido · Facturación mensual</p>
            </div>

            <ul className="pricing-features-list">
              <li><Check size={16} /> <strong>Hasta 40 equipos</strong> en el club</li>
              <li><Check size={16} /> <strong>23 jugadores</strong> por equipo</li>
              <li><Check size={16} /> <strong>Sesiones ilimitadas</strong></li>
              <li><Check size={16} /> <strong>IA ilimitada</strong> + todos los modos</li>
              <li><Check size={16} /> <strong>Licencia multi-entrenador</strong></li>
              <li><Check size={16} /> Panel administrativo del club</li>
              <li><Check size={16} /> Informes consolidados del club</li>
              <li><Check size={16} /> Roles: administrador y entrenador</li>
              <li><Check size={16} /> Todo lo del plan PRO incluido</li>
              <li><Check size={16} /> Soporte prioritario</li>
              <li><Check size={16} /> Código de acceso para entrenadores</li>
              <li><Check size={16} /> Pizarra, Live Stats, Tests — todo</li>
              <li><Check size={16} /> Exportaciones PDF / CSV ilimitadas</li>
              <li><Check size={16} /> Consentimientos y firma digital</li>
            </ul>

            <button className="btn-azul-primario pricing-cta" onClick={() => navigate('/login?plan=club')}>
              EMPEZAR CON CLUB
            </button>
            <p className="pricing-trial-footer">Ideal para escuelas, academias y clubes deportivos</p>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <section id="comparison" className="landing-comparison">
        <div className="section-header">
          <h2 className="section-title">Comparativa completa de planes</h2>
          <p className="section-subtitle">Todos los detalles, sin letra pequeña.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-feature">Funcionalidad</th>
                <th className="col-free">
                  <span className="th-plan-label free">GRATIS</span>
                  <span className="th-plan-price">0€</span>
                </th>
                <th className="col-pro popular-col">
                  <span className="th-plan-label pro">PRO</span>
                  <span className="th-plan-price">7.99€/mes</span>
                </th>
                <th className="col-club">
                  <span className="th-plan-label club">CLUB</span>
                  <span className="th-plan-price">39.99€/mes</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <React.Fragment key={cat}>
                  <tr className="category-row">
                    <td colSpan={4} className="category-label">{cat}</td>
                  </tr>
                  {comparisonRows.filter(r => r.category === cat).map((row, i) => (
                    <tr key={i} className="feature-row">
                      <td className="feat-name">{row.feature}</td>
                      <td className="feat-cell">{renderCell(row.free)}</td>
                      <td className="feat-cell popular-col">{renderCell(row.pro)}</td>
                      <td className="feat-cell">{renderCell(row.club)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="cta-row">
                <td></td>
                <td>
                  <button className="btn-outline-landing table-cta" onClick={handleStart}>Empezar gratis</button>
                </td>
                <td className="popular-col">
                  <button className="btn-verde-exito table-cta" onClick={() => navigate('/login?plan=pro')}>Ir a PRO</button>
                </td>
                <td>
                  <button className="btn-azul-primario table-cta" onClick={() => navigate('/login?plan=club')}>Ir a CLUB</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="cta-banner">
        <div className="cta-banner-content">
          <h2>¿Listo para marcar la diferencia en el campo?</h2>
          <p>Únete a los entrenadores que ya planifican como profesionales.</p>
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
        <p className="footer-copy">© {new Date().getFullYear()} Míster11. Todos los derechos reservados. Diseñado para entrenadores de fútbol base.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
