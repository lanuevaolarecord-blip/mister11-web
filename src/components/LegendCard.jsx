import React, { useState, useEffect } from 'react';
import './LegendCard.css';

const CrownSvg = () => (
  <svg viewBox="0 0 24 16" className="card-crown-svg">
    <path d="M 2,14 L 4,4 L 9,9 L 12,2 L 15,9 L 20,4 L 22,14 Z" fill="url(#crownGoldGrad)" stroke="#8A6414" strokeWidth="0.75" />
    <circle cx="2" cy="3.5" r="0.8" fill="#FFF" />
    <circle cx="12" cy="1.5" r="1" fill="#FFF" />
    <circle cx="22" cy="3.5" r="0.8" fill="#FFF" />
    <rect x="3" y="13" width="18" height="1.5" fill="#8A6414" rx="0.5" />
    <defs>
      <linearGradient id="crownGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2A3" />
        <stop offset="50%" stopColor="#D4A843" />
        <stop offset="100%" stopColor="#966B12" />
      </linearGradient>
    </defs>
  </svg>
);

const ShieldMiniSvg = () => (
  <svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.85">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
  </svg>
);

const LegendCard = ({ 
  player, 
  stats = [], 
  overall = 88, 
  position, 
  streak = 0, 
  type = "elite",
  forceDarkMode = null 
}) => {
  const [isDark, setIsDark] = useState(() => {
    if (forceDarkMode !== null) return forceDarkMode;
    return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  });

  useEffect(() => {
    if (forceDarkMode !== null) {
      setIsDark(forceDarkMode);
      return;
    }
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark') || document.body.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [forceDarkMode]);

  const playerName = player?.name || player?.nombre || 'JUGADOR';
  const playerPosition = position || player?.position || player?.posicion || (player?.number ? `#${player.number}` : 'DC');
  const playerDorsal = player?.number || player?.dorsal || null;
  const avatarUrl = player?.avatarUrl || player?.imageUrl || player?.photoURL;
  const displayOverall = overall && overall !== '-' ? overall : '85';

  // Normalizar estadísticas (garantizar 5 o 6 stats para la fila inferior)
  const defaultStats = [
    { label: 'FÍS', value: 85 },
    { label: 'TÉC', value: 82 },
    { label: 'TÁC', value: 80 },
    { label: 'MEN', value: 84 },
    { label: 'ASI', value: 90 }
  ];

  const displayStats = stats && stats.length > 0 ? stats.map(s => ({
    label: s.label === 'PSI' ? 'MEN' : (s.label === 'SOC' ? 'ASI' : s.label),
    value: s.value !== '-' && s.value !== undefined ? s.value : '75'
  })) : defaultStats;

  return (
    <div className={`fut-legend-card-container ${isDark ? 'mode-dark' : 'mode-light'}`}>
      <div className="fut-card-shield">
        
        {/* FONDO GEOMÉTRICO 3D (LIGHT O DARK SEGÚN TEMA) */}
        <div className="fut-card-bg-layer">
          {isDark ? (
            /* FONDO OSCURO: Carbón, obsidian y pirámides 3D oro/dark */
            <div className="fut-dark-bg">
              <div className="carbon-texture"></div>
              {/* Prisma geométrico 3D oro y diamante negro */}
              <div className="prism-cluster-dark">
                <div className="prism-gold-facet"></div>
                <div className="prism-carbon-facet"></div>
                <div className="prism-dark-facet"></div>
                <div className="prism-wireframe"></div>
              </div>
              <div className="dark-silk-gradient"></div>
            </div>
          ) : (
            /* FONDO CLARO: Mármol blanco, prisma facetado dorado y drapeado de seda */
            <div className="fut-light-bg">
              <div className="marble-texture"></div>
              {/* Joya facetada dorada 3D */}
              <div className="prism-cluster-light">
                <div className="gold-gem-facet facet-1"></div>
                <div className="gold-gem-facet facet-2"></div>
                <div className="gold-gem-facet facet-3"></div>
                <div className="gold-gem-facet facet-4"></div>
                <div className="gold-gem-shine"></div>
              </div>
              <div className="white-silk-drape"></div>
            </div>
          )}
        </div>

        {/* MARCO DORADO METÁLICO CON BORDE DOBLE */}
        <div className="fut-card-border-gold"></div>

        {/* SECCIÓN SUPERIOR: RATING, POSICIÓN Y DORSAL */}
        <div className="fut-card-top-info">
          <div className="fut-rating-stack">
            <span className="fut-overall-number">{displayOverall}</span>
            <span className="fut-position-text">{playerPosition}</span>
            {playerDorsal && (
              <span className="fut-dorsal-pill">#{playerDorsal}</span>
            )}
            <div className="fut-shield-icon">
              <ShieldMiniSvg />
            </div>
          </div>
        </div>

        {/* FOTO / AVATAR CENTRAL DEL JUGADOR */}
        <div className="fut-player-avatar-stage">
          <CrownSvg />
          <div className="fut-avatar-glow"></div>
          <div className="fut-avatar-frame">
            {avatarUrl ? (
              <img src={avatarUrl} alt={playerName} className="fut-player-img" />
            ) : (
              <div className="fut-player-fallback">
                <span>{playerName.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN INFERIOR: NOMBRE, LÍNEA DIVISORIA, STATS Y LOGO */}
        <div className="fut-card-bottom-info">
          {/* Nombre del Jugador en Cinta Central */}
          <div className="fut-name-ribbon">
            <h2 className="fut-player-name">{playerName}</h2>
          </div>

          <div className="fut-card-divider"></div>

          {/* Fila de Estadísticas Oficiales */}
          <div className="fut-stats-row">
            {displayStats.slice(0, 5).map((st, idx) => (
              <div key={idx} className="fut-stat-col">
                <span className="fut-stat-label">{st.label}</span>
                <span className="fut-stat-val">{st.value}</span>
              </div>
            ))}
          </div>

          <div className="fut-card-divider subtle"></div>

          {/* Pie de Tarjeta: MÍSTER 11 & Racha */}
          <div className="fut-card-footer">
            <div className="fut-brand-tag">
              <span className="brand-m11">MÍSTER 11</span>
              <span className="brand-sub">LEGEND CARD</span>
            </div>
            {streak > 0 && (
              <div className="fut-streak-badge">
                🔥 {streak} {streak === 1 ? 'test' : 'tests'}
              </div>
            )}
          </div>
        </div>

        {/* BRILLO REFRACTIVO HOLOGRÁFICO */}
        <div className="fut-card-sheen"></div>

      </div>
    </div>
  );
};

export default LegendCard;
