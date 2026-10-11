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
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { PLANS, calcularDesgloseIVA } from '../config/plans';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';
import { BRAND_NAME, BRAND_NAME_UPPER } from '../utils/brand';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { darkMode, toggleTheme } = useTheme();
  const [billingCycle, setBillingCycle] = useState('season'); // 'season' | 'monthly'

  const handleStart = (planId = 'pro') => {
    navigate(`/login?plan=${planId}&cycle=${billingCycle}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const langKey = (language?.startsWith('pt') ? 'pt'
    : language?.startsWith('fr') ? 'fr'
    : language?.startsWith('id') ? 'id'
    : language?.startsWith('en') ? 'en'
    : 'es');

  const loc = (esText, enText, ptText, frText, idText) => {
    if (langKey === 'en') return enText;
    if (langKey === 'pt') return ptText || esText;
    if (langKey === 'fr') return frText || enText;
    if (langKey === 'id') return idText || enText;
    return esText;
  };

  // Comparativa completa para auditoría detallada
  const comparisonRows = [
    { category: loc('Mi Equipo', 'Squad & Staff', 'Meu Time', 'Mon Équipe', 'Tim Saya'), feature: loc('Equipos incluidos', 'Teams Included', 'Times incluídos', 'Équipes incluses', 'Tim termasuk'), free: loc('1 equipo', '1 team', '1 time', '1 équipe', '1 tim'), pro: loc('3 equipos', '3 teams', '3 times', '3 équipes', '3 tim'), starter: loc('6 equipos', '6 teams', '6 times', '6 équipes', '6 tim'), clubPro: loc('15 equipos', '15 teams', '15 times', '15 équipes', '15 tim'), premium: loc('Hasta 40 equipos', 'Up to 40 teams', 'Até 40 times', 'Jusqu\'à 40 équipes', 'Hingga 40 tim') },
    { category: loc('Mi Equipo', 'Squad & Staff', 'Meu Time', 'Mon Équipe', 'Tim Saya'), feature: loc('Jugadores por equipo', 'Players per Team', 'Jogadores por time', 'Joueurs par équipe', 'Pemain per tim'), free: '23', pro: '23', starter: '23', clubPro: '23', premium: '23' },
    { category: loc('Mi Equipo', 'Squad & Staff', 'Meu Time', 'Mon Équipe', 'Tim Saya'), feature: loc('Staff por equipo', 'Staff per Team', 'Comissão por time', 'Staff par équipe', 'Staf per tim'), free: loc('1 entrenador', '1 coach', '1 treinador', '1 entraîneur', '1 pelatih'), pro: loc('1 entrenador', '1 coach', '1 treinador', '1 entraîneur', '1 pelatih'), starter: loc('Hasta 4 staff', 'Up to 4 staff', 'Até 4 na comissão', 'Jusqu\'à 4 membres', 'Hingga 4 staf'), clubPro: loc('Hasta 10 staff', 'Up to 10 staff', 'Até 10 na comissão', 'Jusqu\'à 10 membres', 'Hingga 10 staf'), premium: loc('Ilimitado', 'Unlimited', 'Ilimitado', 'Illimité', 'Tak terbatas') },
    { category: loc('Mi Equipo', 'Squad & Staff', 'Meu Time', 'Mon Équipe', 'Tim Saya'), feature: loc('Consentimientos RGPD con firma digital', 'Digital GDPR Signatures', 'Termos LGPD com assinatura digital', 'Consentements RGPD avec signature digitale', 'Tanda tangan digital GDPR'), free: true, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Sesiones', 'Training', 'Treinos', 'Séances', 'Sesi Latihan'), feature: loc('Sesiones de entrenamiento', 'Training Sessions', 'Sessões de treino', 'Séances d\'entraînement', 'Sesi latihan'), free: '10', pro: loc('Ilimitadas', 'Unlimited', 'Ilimitadas', 'Illimitées', 'Tak terbatas'), starter: loc('Ilimitadas', 'Unlimited', 'Ilimitadas', 'Illimitées', 'Tak terbatas'), clubPro: loc('Ilimitadas', 'Unlimited', 'Ilimitadas', 'Illimitées', 'Tak terbatas'), premium: loc('Ilimitadas', 'Unlimited', 'Ilimitadas', 'Illimitées', 'Tak terbatas') },
    { category: loc('Sesiones', 'Training', 'Treinos', 'Séances', 'Sesi Latihan'), feature: loc('Exportar sesión a PDF profesional', 'Professional PDF Session Exports', 'Exportar treino para PDF profissional', 'Exportation de séance en PDF professionnel', 'Ekspor sesi PDF profesional'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Sesiones', 'Training', 'Treinos', 'Séances', 'Sesi Latihan'), feature: loc('Modo Campo con cronómetro real', 'Pitch Mode (Live Timer)', 'Modo Campo com cronômetro real', 'Mode Terrain avec chronomètre réel', 'Mode Lapangan dengan stopwatch nyata'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Partidos', 'Matches', 'Jogos', 'Matchs', 'Pertandingan'), feature: loc('Live Stats y minutajes en directo', 'Live Match Tracker & Minutes', 'Live Stats e minutagem ao vivo', 'Live Stats et temps de jeu en direct', 'Live Stats & menit langsung'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Partidos', 'Matches', 'Jogos', 'Matchs', 'Pertandingan'), feature: loc('Acta oficial de 7 páginas en PDF', '7-Page Official PDF Match Report', 'Súmula oficial de 7 páginas em PDF', 'Rapport officiel de match en 7 pages PDF', 'Laporan pertandingan resmi 7 halaman PDF'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Partidos', 'Matches', 'Jogos', 'Matchs', 'Pertandingan'), feature: loc('Modelo xG-Lite y Mapa de Tiros Canónico', 'xG-Lite Model (FIFA 105:68)', 'Modelo xG-Lite e Mapa de Finalizações', 'Modèle xG-Lite et Carte de Tirs Canonique', 'Model xG-Lite & Peta Tembakan Kanonik'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Partidos', 'Matches', 'Jogos', 'Matchs', 'Pertandingan'), feature: loc('Métricas exclusivas de portería (GK)', 'Goalkeeping Exertion Metrics', 'Métricas exclusivas de goleiro (GK)', 'Métriques exclusives de gardien (GK)', 'Metrik khusus penjaga gawang (GK)'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Pizarra Táctica', 'Tactics', 'Prancheta Tática', 'Tableau Tactique', 'Papan Taktik'), feature: loc('Animaciones tácticas y exportar MP4/PNG', 'Keyframe Animations & MP4', 'Animações táticas e exportar MP4/PNG', 'Animations tactiques et export MP4/PNG', 'Animasi taktik dan ekspor MP4/PNG'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('IA Generadora', 'AI', 'IA Geradora', 'Générateur IA', 'Generator AI'), feature: loc('IA táctica y prevención de lesiones', 'AI Drills & Tactical Generator', 'IA tática e prevenção de lesões', 'IA tactique et prévention des blessures', 'AI taktik & pencegahan cedera'), free: loc('5/mes', '5/mo', '5/mês', '5/mois', '5/bln'), pro: loc('Ilimitada', 'Unlimited', 'Ilimitada', 'Illimitée', 'Tak terbatas'), starter: loc('Ilimitada', 'Unlimited', 'Ilimitada', 'Illimitée', 'Tak terbatas'), clubPro: loc('Ilimitada', 'Unlimited', 'Ilimitada', 'Illimitée', 'Tak terbatas'), premium: loc('Ilimitada', 'Unlimited', 'Ilimitada', 'Illimitée', 'Tak terbatas') },
    { category: loc('Portal Jugador', 'Player', 'Portal Atleta', 'Portail Joueur', 'Portal Pemain'), feature: loc('Portal autónomo del jugador', 'Autonomous Player Portal', 'Portal autônomo do jogador', 'Portail autonome du joueur', 'Portal otonom pemain'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Portal Jugador', 'Player', 'Portal Atleta', 'Portail Joueur', 'Portal Pemain'), feature: loc('Wellness diario y tests ACSI-28 / MTQ-10', 'Daily Wellness & Psychological Tests', 'Wellness diário e testes ACSI-28 / MTQ-10', 'Wellness quotidien et tests ACSI-28 / MTQ-10', 'Wellness harian & tes ACSI-28 / MTQ-10'), free: false, pro: true, starter: true, clubPro: true, premium: true },
    { category: loc('Club & Dirección', 'Club', 'Clube e Direção', 'Club et Direction', 'Klub & Akademi'), feature: loc('Panel de dirección deportiva multi-equipo', 'Multi-Team Academy Dashboard', 'Painel de direção esportiva multi-times', 'Panneau de direction sportive multi-équipes', 'Dasbor manajemen multi-tim'), free: false, pro: false, starter: true, clubPro: true, premium: true },
    { category: loc('Club & Dirección', 'Club', 'Clube e Direção', 'Club et Direction', 'Klub & Akademi'), feature: loc('Informes consolidados de cantera', 'Consolidated PDF/CSV Reports', 'Relatórios consolidados de base', 'Rapports consolidés de formation', 'Laporan gabungan akademi'), free: false, pro: false, starter: false, clubPro: true, premium: true },
    { category: loc('Soporte', 'Support', 'Suporte', 'Support', 'Dukungan'), feature: loc('Nivel de soporte técnico', 'Technical Support Level', 'Nível de suporte técnico', 'Niveau de support technique', 'Tingkat dukungan teknis'), free: loc('Comunitario', 'Community', 'Comunitário', 'Communautaire', 'Komunitas'), pro: loc('Estándar', 'Standard', 'Padrão', 'Standard', 'Standar'), starter: loc('Prioritario', 'Priority', 'Prioritário', 'Prioritaire', 'Prioritas'), clubPro: loc('Prioritario 24/7', '24/7 Priority', 'Prioritário 24/7', 'Prioritaire 24/7', 'Prioritas 24/7'), premium: loc('VIP Dedicado', 'VIP Dedicated', 'VIP Dedicado', 'VIP Dédié', 'VIP Khusus') }
  ];

  const renderCell = (val) => {
    if (val === true) return <span className="cell-check" aria-hidden="true"><Check size={16} /></span>;
    if (val === false) return <span className="cell-x" aria-hidden="true"><X size={16} /></span>;
    return <span className="cell-text">{val}</span>;
  };

  return (
    <div className="landing-wrapper">
      {/* ── 1. NAVBAR COMPACTA (VISIBLE SIN SCROLL EN 360PX) ─────────────── */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo_mister11.png" alt={BRAND_NAME} className="landing-logo-img" />
          <span className="landing-brand">{BRAND_NAME_UPPER}</span>
        </div>

        <div className="landing-header-actions">
          {/* Selector de idioma accesible con los 6 idiomas Tier 1 y touch target >=48dp */}
          <div className="landing-lang-selector" title={t('landing.nav.selectLang')}>
            <Globe size={16} className="landing-lang-globe" aria-hidden="true" />
            <select
              className="landing-lang-dropdown"
              value={
                (language === 'es' || language === 'Español (ES)') ? 'Español (ES)'
                : (language === 'en' || language === 'English (EN)') ? 'English (EN)'
                : (language === 'es-419' || language === 'Español (Latinoamérica)') ? 'Español (Latinoamérica)'
                : (language === 'pt' || language === 'pt-BR' || language === 'Português (Brasil)') ? 'Português (Brasil)'
                : (language === 'fr' || language === 'fr-FR' || language === 'Français (FR)') ? 'Français (FR)'
                : (language === 'id' || language === 'id-ID' || language === 'Bahasa Indonesia (ID)') ? 'Bahasa Indonesia (ID)'
                : language
              }
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t('landing.nav.selectLang')}
            >
              <option value="Español (ES)">Español (ES)</option>
              <option value="Español (Latinoamérica)">Español (Latam)</option>
              <option value="English (EN)">English (EN)</option>
              <option value="Português (Brasil)">Português (BR)</option>
              <option value="Français (FR)">Français (FR)</option>
              <option value="Bahasa Indonesia (ID)">Bahasa (ID)</option>
            </select>
          </div>

          {/* Conmutador de tema Claro / Oscuro (Touch target >=48dp) */}
          <button 
            type="button" 
            className="landing-theme-toggle" 
            onClick={toggleTheme}
            title={t('landing.nav.themeToggle')}
            aria-label={t('landing.nav.themeToggle')}
          >
            {darkMode ? <Sun size={19} color="#D4A843" /> : <Moon size={19} color="#1B3A2D" />}
          </button>

          <button 
            type="button" 
            className="btn-m11-nav-login" 
            onClick={handleLogin}
            aria-label={t('landing.nav.login')}
          >
            {t('landing.nav.login')}
          </button>
        </div>
      </header>

      {/* ── 2. HERO SECTION FIRST-FOLD ────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Fondo de Campo de Fútbol como Pizarra Táctica Profesional */}
        <div className="landing-tactical-bg" aria-hidden="true">
          <svg className="tactical-pitch-svg" viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="tactical-arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#D4A843" />
              </marker>
              <marker id="tactical-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#4CAF7D" />
              </marker>
              <radialGradient id="pitch-glow" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#4CAF7D" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#1B3A2D" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#111B21" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Resplandor central del campo */}
            <rect width="1400" height="900" fill="url(#pitch-glow)" />

            {/* Franjas de corte de césped estilo pizarra */}
            <g opacity="0.06">
              <rect x="70" y="50" width="140" height="800" fill="#F2EDE4" />
              <rect x="350" y="50" width="140" height="800" fill="#F2EDE4" />
              <rect x="630" y="50" width="140" height="800" fill="#F2EDE4" />
              <rect x="910" y="50" width="140" height="800" fill="#F2EDE4" />
              <rect x="1190" y="50" width="140" height="800" fill="#F2EDE4" />
            </g>

            {/* Líneas reglamentarias de fútbol FIFA */}
            <g stroke="rgba(242, 237, 228, 0.28)" strokeWidth="2.2">
              <rect x="70" y="50" width="1260" height="800" rx="8" />
              <line x1="700" y1="50" x2="700" y2="850" />
              <circle cx="700" cy="450" r="130" fill="none" />
              <circle cx="700" cy="450" r="4.5" fill="rgba(242, 237, 228, 0.6)" stroke="none" />

              {/* Área grande y pequeña izquierda */}
              <rect x="70" y="235" width="210" height="430" fill="none" />
              <rect x="70" y="335" width="70" height="230" fill="none" />
              <circle cx="210" cy="450" r="4" fill="rgba(242, 237, 228, 0.6)" stroke="none" />
              <path d="M 280 370 A 130 130 0 0 1 280 530" fill="none" />
              <rect x="30" y="375" width="40" height="150" fill="none" strokeDasharray="4,4" />

              {/* Área grande y pequeña derecha */}
              <rect x="1120" y="235" width="210" height="430" fill="none" />
              <rect x="1260" y="335" width="70" height="230" fill="none" />
              <circle cx="1190" cy="450" r="4" fill="rgba(242, 237, 228, 0.6)" stroke="none" />
              <path d="M 1120 370 A 130 130 0 0 0 1120 530" fill="none" />
              <rect x="1330" y="375" width="40" height="150" fill="none" strokeDasharray="4,4" />

              {/* Córners */}
              <path d="M 70 75 A 25 25 0 0 0 95 50" fill="none" />
              <path d="M 1305 50 A 25 25 0 0 0 1330 75" fill="none" />
              <path d="M 70 825 A 25 25 0 0 1 95 850" fill="none" />
              <path d="M 1305 850 A 25 25 0 0 1 1330 825" fill="none" />
            </g>

            {/* Carriles tácticos (5 pasillos y 3 tercios de pizarra del entrenador) */}
            <g stroke="rgba(212, 168, 67, 0.16)" strokeWidth="1.2" strokeDasharray="8,8">
              <line x1="280" y1="50" x2="280" y2="850" />
              <line x1="530" y1="50" x2="530" y2="850" />
              <line x1="870" y1="50" x2="870" y2="850" />
              <line x1="1120" y1="50" x2="1120" y2="850" />
              <line x1="70" y1="316" x2="1330" y2="316" />
              <line x1="70" y1="584" x2="1330" y2="584" />
            </g>

            {/* Trazos de pizarra táctica (Chalkboard Coach Routes) */}
            <g opacity="0.9">
              <polygon points="580,480 670,360 780,440" fill="rgba(212, 168, 67, 0.05)" stroke="rgba(212, 168, 67, 0.45)" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d="M 580 480 Q 710 390 840 290" fill="none" stroke="#D4A843" strokeWidth="2.2" strokeDasharray="6,4" markerEnd="url(#tactical-arrow-gold)" />
              <path d="M 670 360 C 720 320 800 320 850 350" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#tactical-arrow-green)" />
              <path d="M 940 370 L 860 380" fill="none" stroke="rgba(224, 82, 82, 0.5)" strokeWidth="1.6" strokeDasharray="4,3" />
            </g>

            {/* Fichas y balón sobre la pizarra táctica */}
            <g>
              <circle cx="580" cy="480" r="16" fill="#1B3A2D" stroke="#D4A843" strokeWidth="2.5" />
              <text x="580" y="485" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">10</text>

              <circle cx="670" cy="360" r="15" fill="#1B3A2D" stroke="#4CAF7D" strokeWidth="2.2" />
              <text x="670" y="365" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">8</text>

              <circle cx="850" cy="285" r="15" fill="#1B3A2D" stroke="#D4A843" strokeWidth="2" />
              <text x="850" y="290" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">9</text>

              <circle cx="470" cy="560" r="15" fill="#1B3A2D" stroke="#4CAF7D" strokeWidth="2" />
              <text x="470" y="565" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">6</text>

              <circle cx="760" cy="410" r="13" fill="#8C1D1D" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
              <text x="760" y="414" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">4</text>

              <circle cx="830" cy="460" r="13" fill="#8C1D1D" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
              <text x="830" y="464" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">5</text>

              <circle cx="605" cy="455" r="8" fill="#F2EDE4" stroke="#111B21" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        <div className="landing-hero-content">
          <div className="badge-promo">
            <span className="badge-icon">⚽</span>
            <span className="badge-text">
              {t('landing.hero.badge')}
            </span>
          </div>

          <h1 className="hero-title">
            {t('landing.hero.title_part1')} <span className="highlight-text">{t('landing.hero.title_highlight')}</span>
          </h1>

          <p className="hero-description">
            {t('landing.hero.desc')}
          </p>

          <div className="hero-actions">
            <button 
              type="button" 
              className="btn-m11-primary hero-cta" 
              onClick={() => handleStart('pro')}
            >
              {t('landing.hero.btnPrimary')} <ArrowRight size={18} />
            </button>
            <a href="#pricing" className="btn-m11-secondary hero-secondary">
              {t('landing.hero.btnSecondary')}
            </a>
          </div>

          <div className="hero-trust">
            <span className="trust-item"><Check size={16} /> {t('landing.trust.trial')}</span>
            <span className="trust-item"><Check size={16} /> {t('landing.trust.noCard')}</span>
            <span className="trust-item"><Check size={16} /> {t('landing.trust.platforms')}</span>
          </div>
        </div>

        {/* Mockup / Preview de la Pizarra Táctica con campo y fichas */}
        <div className="landing-hero-preview">
          <div className="preview-field-container">
            <div className="preview-field-header">
              <div className="preview-dot red"></div>
              <div className="preview-dot yellow"></div>
              <div className="preview-dot green"></div>
              <span className="preview-title">
                {t('landing.preview.title')}
              </span>
            </div>
            <div className="preview-field-canvas">
              {/* Football Field Markings SVG reglamentario FIFA 105:68 */}
              <svg className="field-markings-svg" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="m11-tactical-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="#D4A843" />
                  </marker>
                </defs>
                {/* Perímetro del campo */}
                <rect x="5" y="5" width="110" height="70" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Línea central */}
                <line x1="60" y1="5" x2="60" y2="75" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Círculo central */}
                <circle cx="60" cy="40" r="12" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Punto central */}
                <circle cx="60" cy="40" r="1" fill="rgba(242,237,228,0.85)" />
                
                {/* Área grande izquierda */}
                <rect x="5" y="20" width="18" height="40" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Área pequeña izquierda */}
                <rect x="5" y="29" width="6" height="22" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Punto de penalti izquierdo */}
                <circle cx="17" cy="40" r="0.8" fill="rgba(242,237,228,0.85)" />
                {/* Semicírculo área izquierda */}
                <path d="M 23 32 A 10 10 0 0 1 23 48" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Portería izquierda */}
                <rect x="1.5" y="33" width="3.5" height="14" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />

                {/* Área grande derecha */}
                <rect x="97" y="20" width="18" height="40" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Área pequeña derecha */}
                <rect x="109" y="29" width="6" height="22" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Punto de penalti derecho */}
                <circle cx="103" cy="40" r="0.8" fill="rgba(242,237,228,0.85)" />
                {/* Semicírculo área derecha */}
                <path d="M 97 32 A 10 10 0 0 0 97 48" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                {/* Portería derecha */}
                <rect x="115" y="33" width="3.5" height="14" fill="none" stroke="rgba(242,237,228,0.45)" strokeWidth="0.8" />
                
                {/* Flecha táctica de pase al hueco */}
                <path d="M 54 28 Q 68 38 78 40" fill="none" stroke="#D4A843" strokeWidth="1.4" strokeDasharray="3,3" markerEnd="url(#m11-tactical-arrow)" />
              </svg>

              {/* Fichas de jugadores sobre el campo */}
              <div className="player-node p-team p1" style={{ top: '35%', left: '45%' }}>10</div>
              <div className="player-node p-team p2" style={{ top: '65%', left: '48%' }}>8</div>
              <div className="player-node p-rival p3" style={{ top: '48%', left: '68%' }}>4</div>
              <div className="ball-node" style={{ top: '50%', left: '55%' }}>⚽</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MATRIZ DE PLANES CONDENSADA (DECISIÓN EN <= 10 SEGUNDOS) ────── */}
      <section id="pricing" className="landing-pricing-section">
        <div className="pricing-tactical-watermark" aria-hidden="true">
          <svg className="pricing-pitch-svg" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="600" cy="200" r="160" stroke="rgba(212, 168, 67, 0.12)" strokeWidth="1.8" />
            <circle cx="600" cy="200" r="4" fill="rgba(212, 168, 67, 0.3)" />
            <line x1="600" y1="0" x2="600" y2="400" stroke="rgba(212, 168, 67, 0.12)" strokeWidth="1.8" />
            <path d="M 420 200 Q 600 120 780 200" stroke="rgba(76, 175, 125, 0.16)" strokeWidth="1.5" strokeDasharray="6,6" fill="none" />
          </svg>
        </div>
        <div className="pricing-container">
          <div className="pricing-header-block">
            <h2 className="pricing-title">
              {t('pricing.header.title')}
            </h2>
            <p className="pricing-subtitle">
              {t('pricing.header.subtitle')}
            </p>

            {/* Selector de Ciclo de Facturación */}
            <div className="billing-switch-container">
              <button
                type="button"
                className={`billing-switch-btn ${billingCycle === 'season' ? 'active' : ''}`}
                onClick={() => setBillingCycle('season')}
              >
                {t('pricing.toggle.season')}
              </button>
              <button
                type="button"
                className={`billing-switch-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('pricing.toggle.monthly')}
              </button>
            </div>
          </div>

          {/* Grid de las 5 Tarjetas de Planes */}
          <div className="pricing-cards-grid">
            {/* PLAN GRATUITO */}
            <div className="pricing-card card-free">
              <div className="card-header">
                <span className="plan-name">{t('pricing.plan.free.name')}</span>
                <p className="plan-tagline">{t('pricing.plan.free.tagline')}</p>
                <div className="price-display">
                  <span className="price-amount">0 €</span>
                  <span className="price-freq">{t('pricing.freq.forever')}</span>
                </div>
                <span className="vat-notice">{t('pricing.vat.included')}</span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{t('pricing.free.attr1_strong')}</strong> {t('pricing.free.attr1_text')}</span>
                </li>
                <li>
                  <Activity size={16} className="attr-icon" />
                  <span><strong>{t('pricing.free.attr2_strong')}</strong> · {t('pricing.free.attr2_text')}</span>
                </li>
                <li>
                  <ShieldCheck size={16} className="attr-icon" />
                  <span><strong>{t('pricing.free.attr3_strong')}</strong> {t('pricing.free.attr3_text')}</span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-free"
                onClick={() => handleStart('free')}
              >
                {t('pricing.btn.startFree')}
              </button>
            </div>

            {/* PLAN PRO (RECOMENDADO MÍSTER) */}
            <div className="pricing-card card-pro featured">
              <div className="badge-card-corner">{t('pricing.badge.mostPopularCoach')}</div>
              <div className="card-header">
                <span className="plan-name">{t('pricing.plan.pro.name')}</span>
                <p className="plan-tagline">{t('pricing.plan.pro.tagline')}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.pro.precioTemporada} €` : `${PLANS.pro.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? t('pricing.freq.season') : t('pricing.freq.month')}
                  </span>
                </div>
                <span className="vat-notice">
                  {billingCycle === 'season' ? t('pricing.pro.vatSeason') : t('pricing.pro.vatMonthly')}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{t('pricing.pro.attr1_strong')}</strong> · {t('pricing.pro.attr1_text')}</span>
                </li>
                <li>
                  <FileText size={16} className="attr-icon" />
                  <span><strong>{t('pricing.pro.attr2_strong')}</strong> · {t('pricing.pro.attr2_text')}</span>
                </li>
                <li>
                  <Sparkles size={16} className="attr-icon" />
                  <span><strong>{t('pricing.pro.attr3_strong')}</strong> · {t('pricing.pro.attr3_text')}</span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-pro"
                onClick={() => handleStart('pro')}
              >
                {t('pricing.btn.tryPro')}
              </button>
            </div>

            {/* CLUB STARTER */}
            <div className="pricing-card card-club">
              <div className="card-header">
                <span className="plan-name">{t('pricing.plan.clubStarter.name')}</span>
                <p className="plan-tagline">{t('pricing.plan.clubStarter.tagline')}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_starter.precioTemporada} €` : `${PLANS.club_starter.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? t('pricing.freq.seasonShort') : t('pricing.freq.month')}
                  </span>
                </div>
                <span className="vat-notice">
                  {t('pricing.starter.vat')}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{t('pricing.starter.attr1_strong')}</strong> · {t('pricing.starter.attr1_text')}</span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{t('pricing.starter.attr2_strong')}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{t('pricing.starter.attr3_strong')}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_starter')}
              >
                {t('pricing.btn.selectStarter')}
              </button>
            </div>

            {/* CLUB PRO */}
            <div className="pricing-card card-club featured-club">
              <div className="badge-card-corner">{t('pricing.badge.bestValueAcademies')}</div>
              <div className="card-header">
                <span className="plan-name">{t('pricing.plan.clubPro.name')}</span>
                <p className="plan-tagline">{t('pricing.plan.clubPro.tagline')}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_pro.precioTemporada} €` : `${PLANS.club_pro.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? t('pricing.freq.seasonShort') : t('pricing.freq.month')}
                  </span>
                </div>
                <span className="vat-notice">
                  {t('pricing.clubPro.vat')}
                </span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{t('pricing.clubPro.attr1_strong')}</strong> · {t('pricing.clubPro.attr1_text')}</span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{t('pricing.clubPro.attr2_strong')}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{t('pricing.clubPro.attr3_strong')}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_pro')}
              >
                {t('pricing.btn.selectClubPro')}
              </button>
            </div>

            {/* CLUB PREMIUM */}
            <div className="pricing-card card-club">
              <div className="card-header">
                <span className="plan-name">{t('pricing.plan.clubPremium.name')}</span>
                <p className="plan-tagline">{t('pricing.plan.clubPremium.tagline')}</p>
                <div className="price-display">
                  <span className="price-amount">
                    {billingCycle === 'season' ? `${PLANS.club_premium.precioTemporada} €` : `${PLANS.club_premium.precioMes} €`}
                  </span>
                  <span className="price-freq">
                    {billingCycle === 'season' ? t('pricing.freq.seasonShort') : t('pricing.freq.month')}
                  </span>
                </div>
                <span className="vat-notice">{t('pricing.premium.vat')}</span>
              </div>

              {/* 3 Atributos Decisivos */}
              <ul className="decisive-attributes-list">
                <li>
                  <Users size={16} className="attr-icon" />
                  <span><strong>{t('pricing.premium.attr1_strong')}</strong> · <strong>{t('pricing.premium.attr1_text')}</strong></span>
                </li>
                <li>
                  <Layers size={16} className="attr-icon" />
                  <span><strong>{t('pricing.premium.attr2_strong')}</strong></span>
                </li>
                <li>
                  <Trophy size={16} className="attr-icon" />
                  <span><strong>{t('pricing.premium.attr3_strong')}</strong></span>
                </li>
              </ul>

              <button 
                type="button"
                className="btn-plan-cta btn-plan-club"
                onClick={() => handleStart('club_premium')}
              >
                {t('pricing.btn.selectPremium')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TABLA COMPARATIVA COMPLETA ──────────────────────────────────── */}
      <section id="comparison" className="landing-comparison-section">
        <div className="comparison-container">
          <h3 className="comparison-title">
            {t('pricing.comparison.title')}
          </h3>
          <p className="comparison-subtitle">
            {t('pricing.comparison.subtitle')}
          </p>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="th-feature">{t('pricing.comparison.thModule')}</th>
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
              <img src="/logo_mister11.png" alt={BRAND_NAME} className="footer-logo-img" />
              <span className="footer-brand-name">{BRAND_NAME_UPPER}</span>
            </div>
            <p className="footer-tagline">
              {t('pricing.footer.tagline')}
            </p>
          </div>

          <div className="footer-links-block">
            <a href="/legal/consentimiento.html" target="_blank" rel="noopener noreferrer">
              {t('pricing.footer.rgpd')}
            </a>
            <span className="footer-dot">·</span>
            <a href="/login">
              {t('pricing.footer.login')}
            </a>
            <span className="footer-dot">·</span>
            <a href="/instalar">
              {t('pricing.footer.install')}
            </a>
          </div>

          {/* Selector Completo de 6 Idiomas Oficiales Tier 1 */}
          <div className="footer-lang-selector-block" aria-label={t('landing.nav.selectLang')}>
            <div className="footer-lang-label">
              <Globe size={14} color="#D4A843" />
              <span>{t('landing.footer.languages')}:</span>
            </div>
            <div className="footer-lang-grid">
              {[
                { code: 'Español (ES)', label: 'Español' },
                { code: 'Español (Latinoamérica)', label: 'Español (Latam)' },
                { code: 'English (EN)', label: 'English' },
                { code: 'Português (Brasil)', label: 'Português' },
                { code: 'Français (FR)', label: 'Français' },
                { code: 'Bahasa Indonesia (ID)', label: 'Bahasa' },
              ].map(item => {
                const isSelected = language === item.code || 
                  (language === 'es' && item.code.startsWith('Español (ES)')) || 
                  (language === 'en' && item.code.startsWith('English')) ||
                  (language === 'es-419' && item.code.startsWith('Español (Latinoamérica)')) ||
                  (language === 'pt' && item.code.startsWith('Português')) ||
                  (language === 'fr' && item.code.startsWith('Français')) ||
                  (language === 'id' && item.code.startsWith('Bahasa'));
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={`footer-lang-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setLanguage(item.code)}
                    aria-label={`Cambiar idioma a ${item.label}`}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <span className="footer-lang-name">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {BRAND_NAME}. {t('landing.footer.rights') || t('pricing.footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
