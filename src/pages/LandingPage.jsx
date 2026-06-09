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
              <div className="preview-field-lines">
                <div className="preview-center-circle"></div>
                <div className="preview-penalty-area left"></div>
                <div className="preview-penalty-area right"></div>
              </div>
              <div className="player-node p-blue p1" style={{ top: '30%', left: '40%' }}>10</div>
              <div className="player-node p-blue p2" style={{ top: '60%', left: '45%' }}>8</div>
              <div className="player-node p-red p3" style={{ top: '45%', left: '60%' }}>4</div>
              <div className="ball-node" style={{ top: '48%', left: '48%' }}>⚽</div>
              <svg className="preview-tactical-arrows">
                <path d="M 45 35 Q 48 48 60 48" fill="none" stroke="var(--accent-gold)" strokeWidth="3" strokeDasharray="5" />
              </svg>
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
          <div className="pricing-card premium">
            <div className="pricing-badge">MÁS POPULAR</div>
            <h3 className="pricing-plan-name">Míster11 PRO</h3>
            <div className="pricing-price-block">
              <span className="price-number">7.99€</span>
              <span className="price-period">/ mes</span>
            </div>
            <p className="pricing-tax-info">IVA incluido · Cancela cuando quieras</p>
            
            <ul className="pricing-features-list">
              <li><Check size={18} /> Equipos ilimitados (hasta 100)</li>
              <li><Check size={18} /> Jugadores ilimitados (hasta 1000)</li>
              <li><Check size={18} /> Planificación completa de Macrociclos</li>
              <li><Check size={18} /> Todos los Tests Físicos y Psicosociales</li>
              <li><Check size={18} /> Exportación en PDF Institucional para informes</li>
              <li><Check size={18} /> Generación con IA Ilimitada</li>
              <li><Check size={18} /> Pizarra táctica de Fabric.js con exportaciones</li>
            </ul>

            <button className="btn-verde-exito pricing-cta" onClick={handleStart}>
              REGISTRARME EN PRO
            </button>
            <p className="pricing-trial-footer">O inicia una prueba gratuita de 7 días sin compromiso</p>
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
