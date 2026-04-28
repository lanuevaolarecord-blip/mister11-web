/**
 * ============================================================
 * MÍSTER11 — Librería de Material Deportivo
 * Archivo: mister11-materials.js
 * Versión: 1.0.0
 * ============================================================
 * Contiene todos los SVG y configuraciones de material
 * deportivo para usar en la Pizarra Táctica.
 *
 * USO:
 *   import { MATERIALS_LIBRARY, MATERIALS_BY_CATEGORY } from './mister11-materials.js';
 *
 * Cada elemento tiene:
 *   - id: identificador único
 *   - label: nombre visible al usuario
 *   - category: categoría del panel
 *   - defaultSize: tamaño inicial al colocar en canvas (px)
 *   - defaultColor: color principal
 *   - canRotate: si se puede rotar
 *   - canResize: si se puede escalar
 *   - svgPanel: SVG para el panel lateral (48x48)
 *   - fabricConfig: configuración para instanciar en Fabric.js
 * ============================================================
 */

// ─────────────────────────────────────────
// PALETA DE COLORES MÍSTER11
// ─────────────────────────────────────────
export const MISTER11_COLORS = {
  primary:    '#1B3A2D',  // Verde selva
  accent:     '#4CAF7D',  // Verde hierba
  gold:       '#D4A843',  // Dorado trigo
  sand:       '#F5F0E8',  // Arena clara
  carbon:     '#2D2D2D',  // Carbón
  white:      '#FFFFFF',
  fieldGreen: '#3D6B34',  // Verde campo
  fieldLight: '#4A7C3F',  // Verde campo claro
};

// ─────────────────────────────────────────
// LIBRERÍA PRINCIPAL DE MATERIALES
// ─────────────────────────────────────────
export const MATERIALS_LIBRARY = {

  // ═══════════════════════════════════════
  // CATEGORÍA: SEÑALIZACIÓN
  // ═══════════════════════════════════════

  cono: {
    id: 'cono',
    label: 'Cono',
    category: 'señalizacion',
    defaultSize: 18,
    defaultColor: '#FF6600',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <ellipse cx="24" cy="43" rx="14" ry="4" fill="#CC4400" opacity="0.55"/>
      <polygon points="24,5 9,43 39,43" fill="#FF6600" stroke="#CC4400" stroke-width="1"/>
      <line x1="13" y1="30" x2="35" y2="30" stroke="#FF8844" stroke-width="1.5" opacity="0.7"/>
      <line x1="16" y1="20" x2="32" y2="20" stroke="#FF8844" stroke-width="1.5" opacity="0.6"/>
      <line x1="19" y1="12" x2="29" y2="12" stroke="#FF8844" stroke-width="1" opacity="0.5"/>
    </svg>`,
    colors: ['#FF6600', '#FFCC00', '#FF0000', '#0066FF', '#FFFFFF'],
    fabricConfig: (x, y, color = '#FF6600') => ({
      type: 'triangle',
      left: x,
      top: y,
      width: 18,
      height: 20,
      fill: color,
      stroke: shadeColor(color, -30),
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      lockScalingFlip: true,
    }),
  },

  platillo: {
    id: 'platillo',
    label: 'Platillo',
    category: 'señalizacion',
    defaultSize: 20,
    defaultColor: '#FFD700',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <ellipse cx="24" cy="32" rx="20" ry="8" fill="#CCA800" opacity="0.4"/>
      <ellipse cx="24" cy="30" rx="20" ry="8" fill="#FFD700" stroke="#CCA800" stroke-width="1.5"/>
      <ellipse cx="24" cy="28" rx="16" ry="5.5" fill="#FFE566"/>
      <ellipse cx="24" cy="27" rx="10" ry="3" fill="#FFF4A0" opacity="0.8"/>
    </svg>`,
    colors: ['#FFD700', '#FF6600', '#FF0000', '#0066FF', '#4CAF7D'],
    fabricConfig: (x, y, color = '#FFD700') => ({
      type: 'ellipse',
      left: x,
      top: y,
      rx: 11,
      ry: 5,
      fill: color,
      stroke: shadeColor(color, -20),
      strokeWidth: 1.5,
      originX: 'center',
      originY: 'center',
    }),
  },

  pica: {
    id: 'pica',
    label: 'Pica / Estaca',
    category: 'señalizacion',
    defaultSize: 24,
    defaultColor: '#FF0000',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <circle cx="24" cy="6" r="4" fill="#FF4444"/>
      <rect x="20" y="8"  width="8" height="8"  fill="#FF0000" rx="1"/>
      <rect x="20" y="16" width="8" height="8"  fill="#FFFFFF" stroke="#DDD" stroke-width="0.5" rx="1"/>
      <rect x="20" y="24" width="8" height="8"  fill="#FF0000" rx="1"/>
      <rect x="20" y="32" width="8" height="8"  fill="#FFFFFF" stroke="#DDD" stroke-width="0.5" rx="1"/>
      <polygon points="20,40 28,40 24,46" fill="#888"/>
    </svg>`,
    colors: ['#FF0000', '#FFCC00', '#0066FF', '#4CAF7D', '#FF6600'],
    fabricConfig: (x, y, color = '#FF0000') => ({
      type: 'group',
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
    }),
  },

  banderin: {
    id: 'banderin',
    label: 'Banderín',
    category: 'señalizacion',
    defaultSize: 24,
    defaultColor: '#FF0000',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <line x1="14" y1="6" x2="14" y2="44" stroke="#888888" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="14,6 40,15 14,24" fill="#FF0000"/>
      <polygon points="14,6 40,15 14,24" fill="url(#flagGrad)" opacity="0.3"/>
      <circle cx="14" cy="44" r="3.5" fill="#666"/>
      <defs>
        <linearGradient id="flagGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFF" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#FFF" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>`,
    colors: ['#FF0000', '#FFCC00', '#0066FF', '#FFFFFF', '#4CAF7D'],
    fabricConfig: (x, y, color = '#FF0000') => ({ left: x, top: y }),
  },

  poste: {
    id: 'poste',
    label: 'Poste / Palo',
    category: 'señalizacion',
    defaultSize: 24,
    defaultColor: '#FFAA00',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <ellipse cx="24" cy="44" rx="10" ry="3.5" fill="#CC8800" opacity="0.6"/>
      <rect x="19" y="5" width="10" height="38" fill="#FFAA00" rx="4" stroke="#CC8800" stroke-width="0.5"/>
      <rect x="20" y="5" width="4" height="38" fill="#FFCC44" opacity="0.4" rx="2"/>
      <ellipse cx="24" cy="6" r="5" fill="#FFE077"/>
    </svg>`,
    colors: ['#FFAA00', '#FF0000', '#0066FF', '#FFFFFF', '#888888'],
    fabricConfig: (x, y, color = '#FFAA00') => ({ left: x, top: y }),
  },

  // ═══════════════════════════════════════
  // CATEGORÍA: PORTERÍA
  // ═══════════════════════════════════════

  porteria_pequena: {
    id: 'porteria_pequena',
    label: 'Port. Pequeña',
    category: 'porteria',
    defaultSize: 45,
    defaultColor: '#FFFFFF',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="7"  y="14" width="34" height="3.5" fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <rect x="7"  y="14" width="3.5" height="22" fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <rect x="37.5" y="14" width="3.5" height="22" fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <line x1="13" y1="17.5" x2="13" y2="36" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="19" y1="17.5" x2="19" y2="36" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="25" y1="17.5" x2="25" y2="36" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="31" y1="17.5" x2="31" y2="36" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="10.5" y1="22" x2="41" y2="22" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="10.5" y1="28" x2="41" y2="28" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <line x1="10.5" y1="34" x2="41" y2="34" stroke="#999" stroke-width="0.7" opacity="0.7"/>
      <rect x="4"  y="36" width="9"  height="2.5" fill="#BBB" rx="1"/>
      <rect x="35" y="36" width="9"  height="2.5" fill="#BBB" rx="1"/>
    </svg>`,
    colors: ['#FFFFFF', '#FFCC00', '#FF6600'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 45, height: 30 }),
  },

  porteria_grande: {
    id: 'porteria_grande',
    label: 'Port. Grande',
    category: 'porteria',
    defaultSize: 70,
    defaultColor: '#FFFFFF',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="2"  y="12" width="44" height="4"  fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <rect x="2"  y="12" width="4"  height="26" fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <rect x="42" y="12" width="4"  height="26" fill="white" stroke="#AAA" stroke-width="0.5" rx="1"/>
      <line x1="10" y1="16" x2="10" y2="38" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="18" y1="16" x2="18" y2="38" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="26" y1="16" x2="26" y2="38" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="34" y1="16" x2="34" y2="38" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="6"  y1="22" x2="46" y2="22" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="6"  y1="28" x2="46" y2="28" stroke="#999" stroke-width="0.6" opacity="0.7"/>
      <line x1="6"  y1="34" x2="46" y2="34" stroke="#999" stroke-width="0.6" opacity="0.7"/>
    </svg>`,
    colors: ['#FFFFFF', '#FFCC00'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 70, height: 42 }),
  },

  // ═══════════════════════════════════════
  // CATEGORÍA: BALÓN
  // ═══════════════════════════════════════

  balon: {
    id: 'balon',
    label: 'Balón',
    category: 'balon',
    defaultSize: 14,
    defaultColor: '#FFFFFF',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="white" stroke="#333" stroke-width="2"/>
      <polygon points="24,8 29,18 24,22 19,18" fill="#222"/>
      <polygon points="8,18 18,18 20,28 12,33" fill="#222"/>
      <polygon points="40,18 30,18 28,28 36,33" fill="#222"/>
      <polygon points="12,38 20,30 28,30 36,38 24,43" fill="#222"/>
      <line x1="24" y1="8"  x2="19" y2="18" stroke="#555" stroke-width="0.8"/>
      <line x1="24" y1="8"  x2="29" y2="18" stroke="#555" stroke-width="0.8"/>
      <line x1="8"  y1="18" x2="18" y2="18" stroke="#555" stroke-width="0.8"/>
      <line x1="40" y1="18" x2="30" y2="18" stroke="#555" stroke-width="0.8"/>
      <line x1="12" y1="38" x2="20" y2="30" stroke="#555" stroke-width="0.8"/>
      <line x1="36" y1="38" x2="28" y2="30" stroke="#555" stroke-width="0.8"/>
      <circle cx="21" cy="14" r="2" fill="#FFF" opacity="0.6"/>
    </svg>`,
    colors: ['#FFFFFF', '#FF6600', '#FFCC00'],
    fabricConfig: (x, y) => ({
      type: 'circle',
      left: x,
      top: y,
      radius: 7,
      fill: '#FFFFFF',
      stroke: '#333333',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
    }),
  },

  // ═══════════════════════════════════════
  // CATEGORÍA: COORDINACIÓN
  // ═══════════════════════════════════════

  aro: {
    id: 'aro',
    label: 'Aro',
    category: 'coordinacion',
    defaultSize: 22,
    defaultColor: '#0066FF',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <ellipse cx="24" cy="30" rx="20" ry="13" fill="none" stroke="#0044AA" stroke-width="3" opacity="0.35"/>
      <ellipse cx="24" cy="28" rx="20" ry="13" fill="none" stroke="#0066FF" stroke-width="5"/>
      <ellipse cx="24" cy="27" rx="20" ry="13" fill="none" stroke="#4499FF" stroke-width="1.5" opacity="0.5"/>
    </svg>`,
    colors: ['#0066FF', '#FF0000', '#FFCC00', '#4CAF7D', '#FF6600'],
    fabricConfig: (x, y, color = '#0066FF') => ({
      type: 'ellipse',
      left: x,
      top: y,
      rx: 12,
      ry: 8,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 5,
      originX: 'center',
      originY: 'center',
    }),
  },

  valla: {
    id: 'valla',
    label: 'Valla',
    category: 'coordinacion',
    defaultSize: 28,
    defaultColor: '#CC0000',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="5"  y="20" width="38" height="7" fill="#CC0000" rx="2.5" stroke="#AA0000" stroke-width="0.5"/>
      <rect x="5"  y="25" width="5"  height="16" fill="#CC0000" rx="1"/>
      <rect x="38" y="25" width="5"  height="16" fill="#CC0000" rx="1"/>
      <rect x="1"  y="39" width="13" height="3.5" fill="#888" rx="1.5"/>
      <rect x="34" y="39" width="13" height="3.5" fill="#888" rx="1.5"/>
      <rect x="6"  y="21" width="36" height="2" fill="#FF2222" opacity="0.3" rx="1"/>
    </svg>`,
    colors: ['#CC0000', '#FFCC00', '#0066FF', '#FF6600'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 28, height: 22 }),
  },

  escalera: {
    id: 'escalera',
    label: 'Escalera',
    category: 'coordinacion',
    defaultSize: 50,
    defaultColor: '#FFD700',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="7"  y="3" width="5" height="42" fill="#FFD700" rx="2.5" stroke="#CCA800" stroke-width="0.5"/>
      <rect x="36" y="3" width="5" height="42" fill="#FFD700" rx="2.5" stroke="#CCA800" stroke-width="0.5"/>
      <rect x="12" y="7"  width="24" height="3.5" fill="#FFD700" stroke="#CCA800" stroke-width="0.3" rx="1"/>
      <rect x="12" y="14" width="24" height="3.5" fill="#FFD700" stroke="#CCA800" stroke-width="0.3" rx="1"/>
      <rect x="12" y="21" width="24" height="3.5" fill="#FFD700" stroke="#CCA800" stroke-width="0.3" rx="1"/>
      <rect x="12" y="28" width="24" height="3.5" fill="#FFD700" stroke="#CCA800" stroke-width="0.3" rx="1"/>
      <rect x="12" y="35" width="24" height="3.5" fill="#FFD700" stroke="#CCA800" stroke-width="0.3" rx="1"/>
      <rect x="8"  y="4" width="3" height="40" fill="#FFE566" opacity="0.4" rx="1"/>
    </svg>`,
    colors: ['#FFD700', '#FF6600', '#FF0000', '#FFFFFF'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 38, height: 56 }),
  },

  pared_rebote: {
    id: 'pared_rebote',
    label: 'Pared rebote',
    category: 'coordinacion',
    defaultSize: 48,
    defaultColor: '#555555',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="18" y="4"  width="12" height="36" fill="#555" rx="2" stroke="#444" stroke-width="0.5"/>
      <rect x="18" y="10" width="12" height="2"  fill="#777"/>
      <rect x="18" y="17" width="12" height="2"  fill="#777"/>
      <rect x="18" y="24" width="12" height="2"  fill="#777"/>
      <rect x="18" y="31" width="12" height="2"  fill="#777"/>
      <rect x="18" y="4"  width="4"  height="36" fill="#777" opacity="0.3" rx="1"/>
      <rect x="10" y="40" width="10" height="4"  fill="#333" rx="1.5"/>
      <rect x="28" y="40" width="10" height="4"  fill="#333" rx="1.5"/>
      <path d="M 8 26 Q 14 18 18 24" stroke="#4CAF7D" stroke-width="1.8"
            fill="none" stroke-linecap="round"
            marker-end="url(#arrowGreen)"/>
      <defs>
        <marker id="arrowGreen" markerWidth="6" markerHeight="6"
                refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4CAF7D"/>
        </marker>
      </defs>
    </svg>`,
    colors: ['#555555', '#1B3A2D', '#2C3E50'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 32, height: 52 }),
  },

  // ═══════════════════════════════════════
  // CATEGORÍA: ZONAS
  // ═══════════════════════════════════════

  zona_circular: {
    id: 'zona_circular',
    label: 'Zona circular',
    category: 'zonas',
    defaultSize: 80,
    defaultColor: '#4CAF7D',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20"
              fill="rgba(76,175,125,0.15)"
              stroke="#4CAF7D"
              stroke-width="2"
              stroke-dasharray="5,3.5"/>
    </svg>`,
    colors: ['#4CAF7D', '#D4A843', '#FF6600', '#0066FF', '#FF0000'],
    fabricConfig: (x, y, color = '#4CAF7D') => ({
      type: 'circle',
      left: x,
      top: y,
      radius: 50,
      fill: hexToRgba(color, 0.15),
      stroke: color,
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      originX: 'center',
      originY: 'center',
    }),
  },

  zona_rectangular: {
    id: 'zona_rectangular',
    label: 'Zona rect.',
    category: 'zonas',
    defaultSize: 80,
    defaultColor: '#4CAF7D',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="4" y="10" width="40" height="28"
            fill="rgba(76,175,125,0.15)"
            stroke="#4CAF7D"
            stroke-width="2"
            stroke-dasharray="5,3.5"
            rx="2"/>
    </svg>`,
    colors: ['#4CAF7D', '#D4A843', '#FF6600', '#0066FF', '#FF0000'],
    fabricConfig: (x, y, color = '#4CAF7D') => ({
      type: 'rect',
      left: x,
      top: y,
      width: 100,
      height: 70,
      fill: hexToRgba(color, 0.15),
      stroke: color,
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      originX: 'center',
      originY: 'center',
    }),
  },

  // ═══════════════════════════════════════
  // CATEGORÍA: MATERIAL
  // ═══════════════════════════════════════

  peto: {
    id: 'peto',
    label: 'Peto / Chaleco',
    category: 'material',
    defaultSize: 40,
    defaultColor: '#7FFF00',
    canRotate: false,
    canResize: false,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path d="M10,8 L8,22 L16,22 L16,44 L32,44 L32,22 L40,22 L38,8 L30,6
               Q28,15 24,15 Q20,15 18,6 Z"
            fill="#7FFF00" stroke="#5FCC00" stroke-width="1.5"/>
      <rect x="20" y="20" width="8" height="6" fill="#5FCC00" rx="1" opacity="0.6"/>
      <path d="M10,8 L8,22 L16,22 L16,44" fill="none" stroke="#9FFF44" stroke-width="1" opacity="0.4"/>
    </svg>`,
    colors: ['#7FFF00', '#FF6600', '#FF0000', '#FFCC00', '#0066FF', '#FF00FF'],
    fabricConfig: (x, y, color = '#7FFF00') => ({ left: x, top: y }),
  },

};

// ─────────────────────────────────────────
// MATERIALES POR CATEGORÍA (para el panel)
// ─────────────────────────────────────────
export const MATERIALS_BY_CATEGORY = {
  señalizacion: {
    label: 'Señalización',
    icon: '🔴',
    items: ['cono', 'platillo', 'banderin', 'pica', 'poste'],
  },
  porteria: {
    label: 'Portería',
    icon: '🥅',
    items: ['porteria_pequena', 'porteria_grande'],
  },
  balon: {
    label: 'Balón',
    icon: '⚽',
    items: ['balon'],
  },
  coordinacion: {
    label: 'Coordinación',
    icon: '🔵',
    items: ['aro', 'valla', 'escalera', 'pared_rebote'],
  },
  zonas: {
    label: 'Zonas',
    icon: '▭',
    items: ['zona_circular', 'zona_rectangular'],
  },
  material: {
    label: 'Material',
    icon: '👕',
    items: ['peto'],
  },
};

// ─────────────────────────────────────────
// UTILIDADES DE COLOR
// ─────────────────────────────────────────
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(R << 16 | G << 8 | B).toString(16).padStart(6, '0')}`;
}

// ─────────────────────────────────────────
// FUNCIÓN PRINCIPAL: COLOCAR EN FABRIC.JS
// ─────────────────────────────────────────
/**
 * Coloca un elemento de material en el canvas Fabric.js
 * @param {fabric.Canvas} canvas - La instancia del canvas Fabric
 * @param {string} itemId - ID del elemento de MATERIALS_LIBRARY
 * @param {number} x - Coordenada X en el canvas
 * @param {number} y - Coordenada Y en el canvas
 * @param {string} color - Color opcional (overrides defaultColor)
 * @returns {Promise<fabric.Object>} El objeto Fabric creado
 */
export async function placeMaterialOnCanvas(canvas, itemId, x, y, color) {
  const item = MATERIALS_LIBRARY[itemId];
  if (!item) {
    console.error(`[Míster11] Material no encontrado: ${itemId}`);
    return null;
  }

  const svgString = item.svgPanel;
  const chosenColor = color || item.defaultColor;

  return new Promise((resolve) => {
    fabric.loadSVGFromString(svgString, (objects, options) => {
      const group = fabric.util.groupSVGElements(objects, options);

      const scale = item.defaultSize / Math.max(group.width, group.height);
      group.scale(scale);
      group.set({
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        hasControls: false,     // usar controles personalizados
        hasBorders: false,
        data: {
          type: 'material',
          itemId: itemId,
          color: chosenColor,
          label: item.label,
        },
      });

      // Controles personalizados Míster11
      applyMister11Controls(group, canvas);

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      resolve(group);
    });
  });
}

// ─────────────────────────────────────────
// CONTROLES PERSONALIZADOS FABRIC.JS
// ─────────────────────────────────────────
/**
 * Aplica controles visuales personalizados al estilo Míster11
 * a cualquier objeto Fabric (material, jugador, trazo)
 */
export function applyMister11Controls(obj) {
  // Configuración base de controles
  obj.set({
    hasControls: true,
    hasBorders: true,
    borderColor: '#4CAF7D',
    cornerColor: '#FFFFFF',
    cornerStrokeColor: '#4CAF7D',
    cornerSize: 10,
    transparentCorners: false,
    padding: 5
  });

  // Eliminar controles predeterminados de Fabric
  obj.setControlsVisibility({
    mt: false, mb: false, ml: false, mr: false,
    tl: false, tr: false, bl: false,
    mtr: false, br: false,
  });

  // Control ROTAR (círculo arriba)
  obj.controls.rotate = new fabric.Control({
    x: 0,
    y: -0.5,
    offsetY: -28,
    cursorStyle: 'crosshair',
    actionName: 'rotate',
    actionHandler: fabric.controlsUtils.rotationWithSnapping,
    render: (ctx, left, top) => {
      ctx.save();
      ctx.fillStyle = '#4CAF7D';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(left, top, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↺', left, top);
      ctx.restore();
    },
  });

  // Control ESCALAR (cuadrado esquina inferior derecha)
  obj.controls.scale = new fabric.Control({
    x: 0.5,
    y: 0.5,
    cursorStyle: 'nwse-resize',
    actionName: 'scale',
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: (ctx, left, top) => {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#4CAF7D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(left - 7, top - 7, 14, 14, 3);
      else ctx.rect(left - 7, top - 7, 14, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  });

  // Control ELIMINAR (X roja esquina superior derecha)
  obj.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetX: 8,
    offsetY: -8,
    cursorStyle: 'pointer',
    mouseUpHandler: (eventData, transform) => {
      const target = transform.target;
      const canvas = target.canvas;
      canvas.remove(target);
      canvas.requestRenderAll();
      return true;
    },
    render: (ctx, left, top) => {
      ctx.save();
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(left, top, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', left, top);
      ctx.restore();
    },
  });
}

export default MATERIALS_LIBRARY;
