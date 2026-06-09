import React from 'react';
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
  Layers
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo_mister11.png" alt="Míster11" className="landing-logo-img" />
          <span className="landing-brand">MÍSTER 11</span>
        </div>
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
                
                {/* Right Penalty Area */}
                <rect x="97" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Right Goal Area */}
                <rect x="109" y="29" width="6" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                {/* Right Penalty Spot */}
                <circle cx="103" cy="40" r="0.8" fill="rgba(255,255,255,0.8)" />
                {/* Right Penalty Arc */}
                <path d="M 97 32 A 10 10 0 0 0 97 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                
                {/* Corner Arcs */}
                <path d="M 5 8 A 3 3 0 0 1 8 5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 8 75 A 3 3 0 0 1 5 72" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 112 5 A 3 3 0 0 1 115 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                <path d="M 115 72 A 3 3 0 0 1 112 75" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
                
                {/* Goals */}
                <rect x="1.5" y="33" width="3.5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
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
      </section>

      {/* Features Grid Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <h2 className="section-title">Todo lo que necesitas para liderar tu equipo</h2>
          <p className="section-subtitle">Funciones premium desarrolladas por metodólogos y entrenadores profesionales.</p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Presentation size={24} />
            </div>
            <h3 className="feature-card-title">Pizarra Táctica Interactiva</h3>
            <p className="feature-card-desc">
              Diseña jugadas a balón parado, presiones y ejercicios complejos en una pizarra digital fluida. Exporta capturas y animaciones directo a tus entrenamientos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Sparkles size={24} />
            </div>
            <h3 className="feature-card-title">IA Generadora de Sesiones</h3>
            <p className="feature-card-desc">
              ¿Falta de tiempo? Deja que la Inteligencia Artificial de Míster11 diseñe una sesión de entrenamiento adaptada a tu categoría, intensidad y objetivos específicos.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Layers size={24} />
            </div>
            <h3 className="feature-card-title">Planificación y Cargas</h3>
            <p className="feature-card-desc">
              Periodización completa de la temporada. Controla la fatiga, calcula el volumen de entrenamiento y obtén el índice de carga acumulada de tus jugadores.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} />
            </div>
            <h3 className="feature-card-title">Tests Psicosociales y Físicos</h3>
            <p className="feature-card-desc">
              Mide la cohesión de grupo (GEQ), la fortaleza mental (MTQ-10) y la resiliencia en el deporte (IRES). Único software amateur con tests psicológicos validados.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="landing-pricing">
        <div className="section-header">
          <h2 className="section-title">Un plan adaptado a tu club</h2>
          <p className="section-subtitle">Acceso total a todas las herramientas metodológicas sin sorpresas.</p>
        </div>

        <div className="pricing-card-container">
          {/* PLAN PRO */}
          <div className="pricing-card">
            <h3 className="pricing-plan-name">Míster11 PRO</h3>
            <div className="pricing-price-block">
              <span className="price-number">7.99€</span>
              <span className="price-period">/ mes</span>
            </div>
            <p className="pricing-tax-info">IVA incluido · Cancela cuando quieras</p>
            
            <ul className="pricing-features-list">
              <li><Check size={18} /> <strong>3 Equipos</strong> (limitado)</li>
              <li><Check size={18} /> <strong>Hasta 30 Jugadores</strong> (limitado)</li>
              <li><Check size={18} /> Planificación completa de Macrociclos</li>
              <li><Check size={18} /> Todos los Tests Físicos y Psicosociales</li>
              <li><Check size={18} /> Exportación en PDF para informes</li>
              <li><Check size={18} /> Generación con IA</li>
              <li><Check size={18} /> Pizarra táctica interactiva</li>
            </ul>

            <button className="btn-verde-exito pricing-cta" onClick={handleStart}>
              REGISTRARME EN PRO
            </button>
            <p className="pricing-trial-footer">O inicia una prueba gratuita de 7 días sin compromiso</p>
          </div>

          {/* PLAN CLUB */}
          <div className="pricing-card premium">
            <div className="pricing-badge">MÁS COMPLETO</div>
            <h3 className="pricing-plan-name">Míster11 CLUB</h3>
            <div className="pricing-price-block">
              <span className="price-number">39.99€</span>
              <span className="price-period">/ mes</span>
            </div>
            <p className="pricing-tax-info">IVA incluido · Facturación mensual</p>
            
            <ul className="pricing-features-list">
              <li><Check size={18} /> <strong>Equipos ilimitados</strong></li>
              <li><Check size={18} /> <strong>Jugadores ilimitados</strong></li>
              <li><Check size={18} /> Licencia multi-entrenador</li>
              <li><Check size={18} /> Panel administrativo del club</li>
              <li><Check size={18} /> Informes consolidados de todo el club</li>
              <li><Check size={18} /> Soporte prioritario 24/7</li>
              <li><Check size={18} /> Todo lo del Plan PRO incluido</li>
            </ul>

            <button className="btn-azul-primario pricing-cta" onClick={handleStart}>
              EMPEZAR CON CLUB
            </button>
            <p className="pricing-trial-footer">Ideal para escuelas, academias y clubes deportivos</p>
          </div>
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
