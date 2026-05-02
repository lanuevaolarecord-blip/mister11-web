/**
 * ============================================================
 * MÍSTER11 — Librería de Campo de Fútbol
 * Archivo: mister11-field.js
 * Versión: 1.0.0
 * ============================================================
 * Dibuja el campo de fútbol en Canvas2D con proporciones FIFA.
 * Soporta: Campo completo y Medio campo (ataque/defensa).
 *
 * USO:
 *   import { FieldRenderer } from './mister11-field.js';
 *   const field = new FieldRenderer(canvas2dElement);
 *   field.draw('full');
 *   field.draw('half_attack');
 *   field.draw('half_defense');
 * ============================================================
 */

// ─────────────────────────────────────────
// CONSTANTES REGLAMENTARIAS FIFA (en metros)
// ─────────────────────────────────────────
export const FIFA = {
  // Campo completo
  LENGTH:            105,    // Largo del campo
  WIDTH:              68,    // Ancho del campo

  // Portería
  GOAL_WIDTH:        7.32,   // Ancho interior portería
  GOAL_DEPTH:        2.44,   // Profundidad portería

  // Área de meta (área pequeña)
  SMALL_AREA_WIDTH:  18.32,  // 7.32 + 5.5*2
  SMALL_AREA_DEPTH:   5.5,

  // Área de penalti (área grande)
  PENALTY_AREA_WIDTH: 40.32, // 7.32 + 16.5*2
  PENALTY_AREA_DEPTH: 16.5,

  // Penalti y círculo
  PENALTY_SPOT:       11,    // Desde línea de fondo
  CENTER_RADIUS:       9.15, // Radio del círculo central
  CORNER_RADIUS:       1,    // Radio del cuarto de círculo de córner

  // Fútbol 7
  F7_LENGTH:          65,
  F7_WIDTH:           45,
  F7_GOAL_WIDTH:       6,
  F7_GOAL_DEPTH:       2,
  F7_PENALTY_DEPTH:   11,
  F7_PENALTY_WIDTH:   26,
  F7_PENALTY_SPOT:     9,

  // Fútbol 8 (Proporciones TacticalPad)
  F8_LENGTH:          62,
  F8_WIDTH:           46,
  F8_GOAL_WIDTH:       6,
  F8_GOAL_DEPTH:       2.1,
  F8_PENALTY_DEPTH:   11,
  F8_PENALTY_WIDTH:   22,

  // Fútbol Sala
  FUTSAL_LENGTH:      40,
  FUTSAL_WIDTH:       20,
  FUTSAL_GOAL_WIDTH:   3,
  FUTSAL_GOAL_DEPTH:   1,
  FUTSAL_PENALTY_SPOT: 6,
  FUTSAL_SECOND_PENALTY: 10,
  FUTSAL_AREA_RADIUS:  6,
};

// ─────────────────────────────────────────
// COLORES DEL CAMPO
// ─────────────────────────────────────────
export const FIELD_COLORS = {
  outerBg:      '#2D5A27',   // Fondo exterior al campo
  stripeDark:   '#3D6B34',   // Franja oscura de hierba
  stripeLight:  '#4A7C3F',   // Franja clara de hierba
  lines:        '#FFFFFF',   // Líneas reglamentarias
  linesSoft:    '#ffffff18', // Líneas de cuadrícula reducida
  goalNet:      'rgba(200,200,200,0.35)', // Red de portería
  cornerArc:    '#FFFFFF',
};

// ─────────────────────────────────────────
// TIPOS DE CAMPO DISPONIBLES
// ─────────────────────────────────────────
export const FIELD_TYPES = {
  full:         { label: 'Campo Completo',       id: 'full'         },
  half_attack:  { label: 'Medio Campo Ataque',   id: 'half_attack'  },
  half_defense: { label: 'Medio Campo Defensa',  id: 'half_defense' },
  third_def:    { label: '1/3 Defensivo',        id: 'third_def'    },
  third_mid:    { label: '1/3 Medio',            id: 'third_mid'    },
  third_off:    { label: '1/3 Ofensivo',         id: 'third_off'    },
  penalty_zoom: { label: 'Área de Penalti',      id: 'penalty_zoom' },
  f7:           { label: 'Fútbol 7 (65×45m)',    id: 'f7'           },
  f8:           { label: 'Fútbol 8 (62×46m)',    id: 'f8'           },
  futsal:       { label: 'Fútbol Sala (40×20m)', id: 'futsal'       },
  reduced:      { label: 'Campo Reducido',       id: 'reduced'      },
  blank:        { label: 'Campo en Blanco',      id: 'blank'        },
};

// ─────────────────────────────────────────
// CLASE PRINCIPAL: FieldRenderer
// ─────────────────────────────────────────
export class FieldRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - El canvas HTML2D (NO Fabric)
   * @param {Object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentType = 'full';
    this.padding = options.padding ?? { v: 20, h: 20 };
    this.lineWeight = 1.8; // Grosor de línea estándar
    
    this.reducedDim = { w: 40, h: 30 }; 
    this.field = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
    this._bindResize();
  }

  draw(type = 'full') {
    this.currentType = type;
    this._resize();
    this._clear();
    
    if (type === 'blank') {
      this.ctx.fillStyle = '#2D5A27';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return; 
    }
    
    this._drawBackground();

    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.lineWidth = this.lineWeight;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (type) {
      case 'full':         this._drawFull();        break;
      case 'half_attack':  this._drawHalfAttack();  break;
      case 'half_defense': this._drawHalfDefense(); break;
      case 'third_def':    this._drawThirdDef();    break;
      case 'third_mid':    this._drawThirdMid();    break;
      case 'third_off':    this._drawThirdOff();    break;
      case 'penalty_zoom': this._drawPenaltyZoom(); break;
      case 'f7':           this._drawF7();          break;
      case 'f8':           this._drawF8();          break;
      case 'futsal':       this._drawFutsal();      break;
      case 'reduced':      this._drawReduced();     break;
      default:             this._drawFull();
    }
  }

  redraw() {
    this.draw(this.currentType);
  }

  setReducedDimensions(w, h) {
    this.reducedDim = { w, h };
    if (this.currentType === 'reduced') {
      this._resize();
      this.redraw();
    }
  }

  getFieldBounds() {
    return { ...this.field };
  }

  relToCanvas(relX, relY) {
    return this.getCanvasPoint(relX, relY);
  }

  // rx, ry: coordenadas relativas al CAMPO COMPLETO (0 a 1)
  getCanvasPoint(rx, ry) {
    const { x, y, w, h } = this.field;
    const type = this.currentType;

    let finalX = rx;
    let finalY = ry;

    // Lógica de Zoom/Recorte según el modo
    if (type === 'half_attack') {
      finalX = (rx - 0.5) * 2;
    } else if (type === 'half_defense') {
      finalX = rx * 2;
    } else if (type === 'third_def') {
      finalX = rx * 3;
    } else if (type === 'third_mid') {
      finalX = (rx - 0.333) * 3;
    } else if (type === 'third_off') {
      finalX = (rx - 0.666) * 3;
    } else if (type === 'penalty_zoom') {
      finalX = (rx - 0.75) * 4;
      finalY = (ry - 0.25) * 2; 
    }

    return {
      x: x + finalX * w,
      y: y + finalY * h
    };
  }

  // Convierte x, y del canvas a rx, ry del CAMPO COMPLETO (0 a 1)
  getRelativePoint(cx, cy) {
    const { x, y, w, h } = this.field;
    const type = this.currentType;

    let rx = (cx - x) / w;
    let ry = (cy - y) / h;

    if (type === 'half_attack') {
      rx = rx / 2 + 0.5;
    } else if (type === 'half_defense') {
      rx = rx / 2;
    } else if (type === 'third_def') {
      rx = rx / 3;
    } else if (type === 'third_mid') {
      rx = rx / 3 + 0.333;
    } else if (type === 'third_off') {
      rx = rx / 3 + 0.666;
    } else if (type === 'penalty_zoom') {
      rx = rx / 4 + 0.75;
      ry = ry / 2 + 0.25;
    }

    return { rx, ry };
  }

  _resize() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (W === 0 || H === 0) return;

    const pH = this.padding.h;
    const pV = this.padding.v;

    // Proporciones objetivo (Largo / Ancho)
    let ratio = FIFA.LENGTH / FIFA.WIDTH;
    if (this.currentType === 'futsal') ratio = 2.0; // 40x20 exacto
    if (this.currentType === 'f7') ratio = 65 / 45;
    if (this.currentType === 'f8') ratio = 62 / 46;
    if (this.currentType === 'reduced') ratio = this.reducedDim.w / this.reducedDim.h;
    if (this.currentType === 'penalty_zoom') ratio = 1.0;

    // Recalcular dimensiones visibles según el modo
    let fw, fh;
    if (W / H > ratio) {
      fh = H - pV * 2;
      fw = fh * ratio;
    } else {
      fw = W - pH * 2;
      fh = fw / ratio;
    }

    this.field = {
      x: (W - fw) / 2,
      y: (H - fh) / 2,
      w: fw,
      h: fh,
      scale: fw / FIFA.LENGTH
    };
  }

  // ───────────────────────────────────────
  // FONDO Y FRANJAS DE HIERBA
  // ───────────────────────────────────────
  _clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = FIELD_COLORS.outerBg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const { x, y, w, h } = this.field;
    const stripeCount = 10;
    const stripeW = w / stripeCount;

    ctx.save();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? FIELD_COLORS.stripeDark : FIELD_COLORS.stripeLight;
      ctx.fillRect(x + i * stripeW, y, stripeW, h);
    }
    ctx.restore();
  }

  _drawFull() {
    this._drawOuterLines();
    this._drawMidLine();
    this._drawGoalAndAreas(0, 'left');
    this._drawGoalAndAreas(1, 'right');
    this._drawCenterCircle();
  }

  _drawHalfAttack() {
    this._drawOuterLines();
    this._drawGoalAndAreas(1, 'right');
    const p1 = this.getCanvasPoint(0.5, 0);
    const p2 = this.getCanvasPoint(0.5, 1);
    this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
  }

  _drawHalfDefense() {
    this._drawOuterLines();
    this._drawGoalAndAreas(0, 'left');
    const p1 = this.getCanvasPoint(0.5, 0);
    const p2 = this.getCanvasPoint(0.5, 1);
    this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
  }

  _drawThirdDef() {
    this._drawOuterLines();
    this._drawGoalAndAreas(0, 'left');
    // Línea de 1/3
    const p1 = this.getCanvasPoint(0.333, 0);
    const p2 = this.getCanvasPoint(0.333, 1);
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  _drawThirdMid() {
    this._drawOuterLines();
    this._drawCenterCircle();
    // Líneas de 1/3
    const l1 = this.getCanvasPoint(0.333, 0); const l2 = this.getCanvasPoint(0.333, 1);
    const r1 = this.getCanvasPoint(0.666, 0); const r2 = this.getCanvasPoint(0.666, 1);
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath(); this.ctx.moveTo(l1.x, l1.y); this.ctx.lineTo(l2.x, l2.y); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(r1.x, r1.y); this.ctx.lineTo(r2.x, r2.y); this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  _drawThirdOff() {
    this._drawOuterLines();
    this._drawGoalAndAreas(1, 'right');
    // Línea de 1/3
    const p1 = this.getCanvasPoint(0.666, 0);
    const p2 = this.getCanvasPoint(0.666, 1);
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  _drawPenaltyZoom() {
    this._drawOuterLines();
    this._drawGoalAndAreas(1, 'right', true);
  }

  _drawFutsal() {
    this._drawOuterLines();
    const ctx = this.ctx;
    // Línea central
    const mid1 = this.getCanvasPoint(0.5, 0); const mid2 = this.getCanvasPoint(0.5, 1);
    ctx.beginPath(); ctx.moveTo(mid1.x, mid1.y); ctx.lineTo(mid2.x, mid2.y); ctx.stroke();
    // Círculo central (3m radio en Futsal)
    const cp = this.getCanvasPoint(0.5, 0.5);
    const cr = (3 / 40) * this.field.w;
    ctx.beginPath(); ctx.arc(cp.x, cp.y, cr, 0, Math.PI*2); ctx.stroke();
    
    this._drawFutsalArea(0, 'left');
    this._drawFutsalArea(1, 'right');

    // Córners (25cm = 0.25m)
    const corR = (0.25 / 40) * this.field.w;
    const corners = [ [0,0,0,Math.PI/2], [0,1,-Math.PI/2,0], [1,0,Math.PI/2,Math.PI], [1,1,Math.PI,Math.PI*1.5] ];
    corners.forEach(c => {
      const p = this.getCanvasPoint(c[0], c[1]);
      ctx.beginPath(); ctx.arc(p.x, p.y, corR, c[2], c[3]); ctx.stroke();
    });
  }

  _drawFutsalArea(rx, side) {
    const ctx = this.ctx;
    const p = this.getCanvasPoint(rx, 0.5);
    const r = (6 / 20) * this.field.h; // 6m de radio
    const dir = side === 'left' ? 1 : -1;

    // Área semicircular (Futsal)
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, -Math.PI/2, Math.PI/2, side !== 'left');
    ctx.stroke();

    // Punto penalti 6m
    const sp1Rel = side === 'left' ? (6/40) : (1 - 6/40);
    const sp1 = this.getCanvasPoint(sp1Rel, 0.5);
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(sp1.x, sp1.y, 2.5, 0, Math.PI*2); ctx.fill();

    // Segundo punto penalti 10m
    const sp2Rel = side === 'left' ? (10/40) : (1 - 10/40);
    const sp2 = this.getCanvasPoint(sp2Rel, 0.5);
    ctx.beginPath(); ctx.arc(sp2.x, sp2.y, 2.5, 0, Math.PI*2); ctx.fill();
  }

  _drawF7() {
    this._drawOuterLines();
    this._drawMidLine();
    this._drawGoalAndAreas(0, 'left', false, 'f7');
    this._drawGoalAndAreas(1, 'right', false, 'f7');
    this._drawCenterCircle();
  }

  _drawF8() {
    this._drawOuterLines();
    this._drawMidLine();
    this._drawGoalAndAreas(0, 'left', false, 'f8');
    this._drawGoalAndAreas(1, 'right', false, 'f8');
    this._drawCenterCircle();
  }

  _drawReduced() {
    const ctx = this.ctx;
    this._drawOuterLines();
    ctx.strokeStyle = FIELD_COLORS.linesSoft;
    ctx.lineWidth = 1;
    // Cuadrícula cada 10m basada en dimensiones reducidas
    const stepX = 10 / this.reducedDim.w;
    const stepY = 10 / this.reducedDim.h;
    
    for(let i=stepX; i<1; i+=stepX) {
      const p1 = this.getCanvasPoint(i, 0); const p2 = this.getCanvasPoint(i, 1);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for(let i=stepY; i<1; i+=stepY) {
      const h1 = this.getCanvasPoint(0, i); const h2 = this.getCanvasPoint(1, i);
      ctx.beginPath(); ctx.moveTo(h1.x, h1.y); ctx.lineTo(h2.x, h2.y); ctx.stroke();
    }
  }

  _drawBlank() {
    // Solo fondo verde (ya dibujado por _drawBackground)
  }

  _drawOuterLines() {
    const p1 = this.getCanvasPoint(0,0);
    const p2 = this.getCanvasPoint(1,1);
    this.ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
  }

  _drawMidLine() {
    const p1 = this.getCanvasPoint(0.5, 0);
    const p2 = this.getCanvasPoint(0.5, 1);
    this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y); this.ctx.stroke();
  }

  _drawCenterCircle() {
    const ctx = this.ctx;
    const p = this.getCanvasPoint(0.5, 0.5);
    const r = (FIFA.CENTER_RADIUS / FIFA.LENGTH) * this.field.w;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
  }

  _drawGoalAndAreas(rx, side, isZoom = false, mode = 'f11') {
    const ctx = this.ctx;
    const dir = side === 'left' ? 1 : -1;
    
    let aw, ad, sw, sd, spX, gw, gd;
    
    if (mode === 'f7') {
      aw = 20 / 45; ad = (11 / 65) * dir;
      sw = 0; sd = 0; // F7 suele no tener área pequeña explícita en TacticalPad
      spX = side === 'left' ? (9/65) : (1 - 9/65);
      gw = 6 / 45; gd = (2 / 65) * dir;
    } else if (mode === 'f8') {
      aw = 22 / 46; ad = (11 / 62) * dir;
      sw = 0; sd = 0;
      spX = side === 'left' ? (9/62) : (1 - 9/62);
      gw = 6 / 46; gd = (2.1 / 62) * dir;
    } else {
      aw = FIFA.PENALTY_AREA_WIDTH / FIFA.WIDTH; ad = (FIFA.PENALTY_AREA_DEPTH / FIFA.LENGTH) * dir;
      sw = FIFA.SMALL_AREA_WIDTH / FIFA.WIDTH; sd = (FIFA.SMALL_AREA_DEPTH / FIFA.LENGTH) * dir;
      spX = side === 'left' ? (FIFA.PENALTY_SPOT / FIFA.LENGTH) : (1 - FIFA.PENALTY_SPOT/FIFA.LENGTH);
      gw = FIFA.GOAL_WIDTH / FIFA.WIDTH; gd = (FIFA.GOAL_DEPTH / FIFA.LENGTH) * dir;
    }

    // Área grande
    const pAreaTop = this.getCanvasPoint(rx, 0.5 - aw/2);
    const pAreaBottom = this.getCanvasPoint(rx + ad, 0.5 + aw/2);
    ctx.strokeRect(pAreaTop.x, pAreaTop.y, pAreaBottom.x - pAreaTop.x, pAreaBottom.y - pAreaTop.y);

    // Área pequeña
    if (sw > 0) {
      const pSmallTop = this.getCanvasPoint(rx, 0.5 - sw/2);
      const pSmallBottom = this.getCanvasPoint(rx + sd, 0.5 + sw/2);
      ctx.strokeRect(pSmallTop.x, pSmallTop.y, pSmallBottom.x - pSmallTop.x, pSmallBottom.y - pSmallTop.y);
    }

    // Punto penalti
    const sp = this.getCanvasPoint(spX, 0.5);
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 3, 0, Math.PI*2); ctx.fill();

    // Semicírculo del área (solo F11)
    if (mode === 'f11') {
      const arcR = (9.15 / FIFA.LENGTH) * this.field.w;
      const arcP = this.getCanvasPoint(spX, 0.5);
      ctx.beginPath();
      ctx.arc(arcP.x, arcP.y, arcR, side === 'left' ? -Math.PI*0.3 : Math.PI*0.7, side === 'left' ? Math.PI*0.3 : Math.PI*1.3);
      ctx.stroke();
    }

    // Portería
    const gTop = this.getCanvasPoint(rx, 0.5 - gw/2);
    const gBottom = this.getCanvasPoint(rx - gd, 0.5 + gw/2);
    ctx.strokeRect(gTop.x, gTop.y, gBottom.x - gTop.x, gBottom.y - gTop.y);
    this._drawGoalNet(gTop.x, gTop.y, gBottom.x - gTop.x, gBottom.y - gTop.y);
  }

  _drawGoalNet(gx, gy, gd, gw) {
    const ctx = this.ctx; ctx.strokeStyle = FIELD_COLORS.goalNet; ctx.lineWidth = 0.8;
    const cols = 5; const rows = 4;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath(); ctx.moveTo(gx + (gd / cols) * i, gy); ctx.lineTo(gx + (gd / cols) * i, gy + gw); ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      ctx.beginPath(); ctx.moveTo(gx, gy + (gw / rows) * i); ctx.lineTo(gx + gd, gy + (gw / rows) * i); ctx.stroke();
    }
    ctx.lineWidth = Math.max(1.5, this.field.scale * 0.12);
  }

  _drawCornerArcs(fx, fy, fw, fh, scale) {
    const ctx = this.ctx; const r = scale; ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx, fy + fh, r, -Math.PI / 2, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx + fw, fy, r, Math.PI / 2, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx + fw, fy + fh, r, Math.PI, Math.PI * 3 / 2); ctx.stroke();
  }

  // ───────────────────────────────────────
  // RESIZE AUTOMÁTICO
  // ───────────────────────────────────────
  _bindResize() {
    const ro = new ResizeObserver(() => this.redraw());
    ro.observe(this.canvas.parentElement || this.canvas);
  }
}

// ─────────────────────────────────────────
// POSICIONES DE FORMACIONES (relativas al campo)
// relX: 0 = línea de fondo izquierda, 1 = derecha
// relY: 0 = banda superior, 1 = inferior
// ─────────────────────────────────────────
export const FORMATIONS = {
  '4-3-3': [
    { pos: 'PO', relX: 0.05, relY: 0.50 },
    { pos: 'DF', relX: 0.20, relY: 0.20 },
    { pos: 'DF', relX: 0.20, relY: 0.38 },
    { pos: 'DF', relX: 0.20, relY: 0.62 },
    { pos: 'DF', relX: 0.20, relY: 0.80 },
    { pos: 'MC', relX: 0.50, relY: 0.25 },
    { pos: 'MC', relX: 0.50, relY: 0.50 },
    { pos: 'MC', relX: 0.50, relY: 0.75 },
    { pos: 'DL', relX: 0.80, relY: 0.20 },
    { pos: 'DL', relX: 0.80, relY: 0.50 },
    { pos: 'DL', relX: 0.80, relY: 0.80 },
  ],
  '4-4-2': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'LD', relX: 0.18, relY: 0.15 },
    { pos: 'DC', relX: 0.18, relY: 0.38 },
    { pos: 'DC', relX: 0.18, relY: 0.62 },
    { pos: 'LI', relX: 0.18, relY: 0.85 },
    { pos: 'EX', relX: 0.42, relY: 0.12 },
    { pos: 'MC', relX: 0.42, relY: 0.38 },
    { pos: 'MC', relX: 0.42, relY: 0.62 },
    { pos: 'EX', relX: 0.42, relY: 0.88 },
    { pos: 'SD', relX: 0.72, relY: 0.35 },
    { pos: 'SD', relX: 0.72, relY: 0.65 },
  ],
  '4-2-3-1': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'LD', relX: 0.18, relY: 0.15 },
    { pos: 'DC', relX: 0.18, relY: 0.38 },
    { pos: 'DC', relX: 0.18, relY: 0.62 },
    { pos: 'LI', relX: 0.18, relY: 0.85 },
    { pos: 'MCD',relX: 0.36, relY: 0.38 },
    { pos: 'MCD',relX: 0.36, relY: 0.62 },
    { pos: 'EX', relX: 0.58, relY: 0.15 },
    { pos: 'MCO',relX: 0.60, relY: 0.50 },
    { pos: 'EX', relX: 0.58, relY: 0.85 },
    { pos: 'SD', relX: 0.76, relY: 0.50 },
  ],
  '3-5-2': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'DC', relX: 0.18, relY: 0.25 },
    { pos: 'DC', relX: 0.18, relY: 0.50 },
    { pos: 'DC', relX: 0.18, relY: 0.75 },
    { pos: 'EX', relX: 0.42, relY: 0.10 },
    { pos: 'MC', relX: 0.42, relY: 0.32 },
    { pos: 'MCD',relX: 0.40, relY: 0.50 },
    { pos: 'MC', relX: 0.42, relY: 0.68 },
    { pos: 'EX', relX: 0.42, relY: 0.90 },
    { pos: 'SD', relX: 0.74, relY: 0.35 },
    { pos: 'SD', relX: 0.74, relY: 0.65 },
  ],
  '5-3-2': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'LD', relX: 0.20, relY: 0.10 },
    { pos: 'DC', relX: 0.20, relY: 0.30 },
    { pos: 'DC', relX: 0.20, relY: 0.50 },
    { pos: 'DC', relX: 0.20, relY: 0.70 },
    { pos: 'LI', relX: 0.20, relY: 0.90 },
    { pos: 'MC', relX: 0.45, relY: 0.25 },
    { pos: 'MCD',relX: 0.43, relY: 0.50 },
    { pos: 'MC', relX: 0.45, relY: 0.75 },
    { pos: 'SD', relX: 0.74, relY: 0.35 },
    { pos: 'SD', relX: 0.74, relY: 0.65 },
  ],
  '4-3-2-1': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'LD', relX: 0.18, relY: 0.15 },
    { pos: 'DC', relX: 0.18, relY: 0.38 },
    { pos: 'DC', relX: 0.18, relY: 0.62 },
    { pos: 'LI', relX: 0.18, relY: 0.85 },
    { pos: 'MC', relX: 0.38, relY: 0.25 },
    { pos: 'MCD',relX: 0.36, relY: 0.50 },
    { pos: 'MC', relX: 0.38, relY: 0.75 },
    { pos: 'MCO',relX: 0.58, relY: 0.36 },
    { pos: 'MCO',relX: 0.58, relY: 0.64 },
    { pos: 'SD', relX: 0.76, relY: 0.50 },
  ],
  '3-4-3': [
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'DC', relX: 0.18, relY: 0.25 },
    { pos: 'DC', relX: 0.18, relY: 0.50 },
    { pos: 'DC', relX: 0.18, relY: 0.75 },
    { pos: 'EX', relX: 0.40, relY: 0.10 },
    { pos: 'MC', relX: 0.40, relY: 0.38 },
    { pos: 'MC', relX: 0.40, relY: 0.62 },
    { pos: 'EX', relX: 0.40, relY: 0.90 },
    { pos: 'EX', relX: 0.70, relY: 0.15 },
    { pos: 'SD', relX: 0.74, relY: 0.50 },
    { pos: 'EX', relX: 0.70, relY: 0.85 },
  ],
};

export default { FieldRenderer, FIFA, FIELD_COLORS, FIELD_TYPES, FORMATIONS };
