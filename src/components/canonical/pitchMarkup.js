/**
 * src/components/canonical/pitchMarkup.js
 * Míster11 — Definición reglamentaria de dimensiones y marcado SVG 105:68
 *
 * Módulo JavaScript puro (sin JSX) compatible con Node.js y navegadores.
 */

export const PITCH_DIMENSIONS = {
  viewBoxWidth: 1050,
  viewBoxHeight: 680,
  aspectRatio: 1050 / 680, // 1.5441
  margin: 25,
  pitchWidth: 1000,
  pitchHeight: 630,
  pitchX: 25,
  pitchY: 25,
  goalWidth: 73.2,
  goalDepth: 18,
  centerX: 525,
  centerY: 340,
  centerRadius: 91.5,
  penBoxWidth: 165,
  penBoxHeight: 403,
  penBoxY: 138.5,
  smallBoxWidth: 55,
  smallBoxHeight: 183,
  smallBoxY: 248.5,
  penaltySpotDist: 110,
};

export const getPitchFrameSvgMarkup = ({
  isDark = true,
  showTacticalCorridors = false,
  showGoals = true,
  showStripes = true,
  corridorsLabel = false,
  isEn = false
} = {}) => {
  const lineStroke = isDark ? 'rgba(242, 237, 228, 0.55)' : 'rgba(27, 58, 45, 0.45)';
  const bgGrass = isDark ? '#152C22' : '#22543D';
  const goldColor = '#D4A843';

  // 10 franjas de corte de césped
  const stripeW = 1000 / 10;
  const stripes = showStripes
    ? Array.from({ length: 10 }).map((_, i) => {
        const fill = i % 2 === 0 ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
        return `<rect x="${25 + i * stripeW}" y="25" width="${stripeW}" height="630" fill="${fill}" />`;
      }).join('')
    : '';

  // Pasillos tácticos verticales (33% y 66% del campo)
  const corrX1 = 25 + 1000 * 0.33;
  const corrX2 = 25 + 1000 * 0.66;
  const tacticalCorridors = showTacticalCorridors
    ? `
      <line x1="${corrX1}" y1="25" x2="${corrX1}" y2="655" stroke="rgba(212, 168, 67, 0.25)" stroke-width="1.5" stroke-dasharray="6,4" />
      <line x1="${corrX2}" y1="25" x2="${corrX2}" y2="655" stroke="rgba(212, 168, 67, 0.25)" stroke-width="1.5" stroke-dasharray="6,4" />
      ${corridorsLabel ? `
        <text x="${25 + (corrX1 - 25) / 2}" y="45" fill="rgba(212,168,67,0.6)" font-size="11" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">${isEn ? 'LEFT CHANNEL' : 'CARRIL IZQ'}</text>
        <text x="${corrX1 + (corrX2 - corrX1) / 2}" y="45" fill="rgba(212,168,67,0.6)" font-size="11" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">${isEn ? 'CENTRAL CHANNEL' : 'CARRIL CENTRAL'}</text>
        <text x="${corrX2 + (1025 - corrX2) / 2}" y="45" fill="rgba(212,168,67,0.6)" font-size="11" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">${isEn ? 'RIGHT CHANNEL' : 'CARRIL DCHO'}</text>
      ` : ''}
    `
    : '';

  // Porterías reglamentarias (ubicadas FUERA del campo, en x=7 a 25 y x=1025 a 1043)
  const goals = showGoals
    ? `
      <!-- Portería Izquierda (Local / Defendida o Atacada) -->
      <rect x="7" y="303.4" width="18" height="73.2" fill="none" stroke="${goldColor}" stroke-width="2.5" />
      <line x1="7" y1="303.4" x2="25" y2="303.4" stroke="${goldColor}" stroke-width="2.5" />
      <line x1="7" y1="376.6" x2="25" y2="376.6" stroke="${goldColor}" stroke-width="2.5" />
      <rect x="7" y="303.4" width="18" height="73.2" fill="rgba(212, 168, 67, 0.12)" />

      <!-- Portería Derecha (Rival) -->
      <rect x="1025" y="303.4" width="18" height="73.2" fill="none" stroke="${goldColor}" stroke-width="2.5" />
      <line x1="1025" y1="303.4" x2="1043" y2="303.4" stroke="${goldColor}" stroke-width="2.5" />
      <line x1="1025" y1="376.6" x2="1043" y2="376.6" stroke="${goldColor}" stroke-width="2.5" />
      <rect x="1025" y="303.4" width="18" height="73.2" fill="rgba(212, 168, 67, 0.12)" />
    `
    : '';

  return `
    <!-- Césped y Franjas -->
    <rect id="pitch-bg" x="0" y="0" width="1050" height="680" fill="${bgGrass}" rx="8" />
    ${stripes}
    ${tacticalCorridors}

    <!-- Líneas Perimetrales Oficiales (1000 x 630 con margen 25) -->
    <rect id="pitch-boundary" x="25" y="25" width="1000" height="630" fill="none" stroke="${lineStroke}" stroke-width="2.2" rx="4" />

    <!-- Línea Central y Círculo Central (Radio 91.5 = 9.15m) -->
    <line id="half-way-line" x1="525" y1="25" x2="525" y2="655" stroke="${lineStroke}" stroke-width="2" />
    <circle id="center-circle" cx="525" cy="340" r="91.5" fill="none" stroke="${lineStroke}" stroke-width="2" />
    <circle id="center-spot" cx="525" cy="340" r="3.5" fill="${lineStroke}" />

    <!-- Área de Penalti Izquierda (165m x 403m) -->
    <rect id="penalty-area-left" x="25" y="138.5" width="165" height="403" fill="none" stroke="${lineStroke}" stroke-width="2" />
    <rect id="goal-area-left" x="25" y="248.5" width="55" height="183" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
    <circle id="penalty-spot-left" cx="135" cy="340" r="3" fill="${lineStroke}" />
    <!-- Arco del área de penalti izquierda -->
    <path d="M 190 274.5 A 91.5 91.5 0 0 1 190 405.5" fill="none" stroke="${lineStroke}" stroke-width="1.8" />

    <!-- Área de Penalti Derecha -->
    <rect id="penalty-area-right" x="860" y="138.5" width="165" height="403" fill="none" stroke="${lineStroke}" stroke-width="2" />
    <rect id="goal-area-right" x="970" y="248.5" width="55" height="183" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
    <circle id="penalty-spot-right" cx="915" cy="340" r="3" fill="${lineStroke}" />
    <!-- Arco del área de penalti derecha -->
    <path d="M 860 274.5 A 91.5 91.5 0 0 0 860 405.5" fill="none" stroke="${lineStroke}" stroke-width="1.8" />

    <!-- Arcos de Esquina (Radio 10m = 10px) -->
    <path d="M 25 35 A 10 10 0 0 0 35 25" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
    <path d="M 25 645 A 10 10 0 0 1 35 655" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
    <path d="M 1025 35 A 10 10 0 0 1 1015 25" fill="none" stroke="${lineStroke}" stroke-width="1.8" />
    <path d="M 1025 645 A 10 10 0 0 0 1015 655" fill="none" stroke="${lineStroke}" stroke-width="1.8" />

    <!-- Porterías Físicas -->
    ${goals}
  `;
};
