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
    this.padding = options.padding ?? { v: 12, h: 16 };
    
    // Para campo reducido
    this.reducedDim = { w: 40, h: 30 }; 

    this.field = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
    this._bindResize();
  }

  setReducedDimensions(w, h) {
    this.reducedDim = { w, h };
    this.redraw();
  }

  draw(type = 'full') {
    this.currentType = type;
    this._resize();
    this._clear();
    
    if (type === 'reduced') {
      this.ctx.fillStyle = '#4A7C3F';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (type === 'blank') {
      this.ctx.fillStyle = '#3D6B34';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return; 
    } else {
      this._drawBackground();
    }

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
      default:
        this._drawFull();
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

  mToPx(meters) {
    return meters * this.field.scale;
  }

  relToCanvas(relX, relY) {
    return {
      x: this.field.x + relX * this.field.w,
      y: this.field.y + relY * this.field.h,
    };
  }

  _resize() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (W === 0 || H === 0) return;

    const pH = (this.padding.h ?? 16);
    const pV = (this.padding.v ?? 12);

    let targetLength, targetWidth;
    const type = this.currentType;

    if (type === 'full' || type === 'blank') {
      targetLength = FIFA.LENGTH + FIFA.GOAL_DEPTH * 2;
      targetWidth  = FIFA.WIDTH;
    } else if (type.startsWith('half_')) {
      targetLength = FIFA.LENGTH / 2 + FIFA.GOAL_DEPTH;
      targetWidth  = FIFA.WIDTH;
    } else if (type.startsWith('third_')) {
      targetLength = FIFA.LENGTH / 3;
      targetWidth  = FIFA.WIDTH;
    } else if (type === 'penalty_zoom') {
      targetLength = FIFA.PENALTY_AREA_DEPTH * 1.5;
      targetWidth  = FIFA.PENALTY_AREA_WIDTH * 1.2;
    } else if (type === 'f7') {
      targetLength = FIFA.F7_LENGTH + FIFA.F7_GOAL_DEPTH * 2;
      targetWidth  = FIFA.F7_WIDTH;
    } else if (type === 'f8') {
      targetLength = FIFA.F8_LENGTH + FIFA.F8_GOAL_DEPTH * 2;
      targetWidth  = FIFA.F8_WIDTH;
    } else if (type === 'futsal') {
      targetLength = FIFA.FUTSAL_LENGTH + FIFA.FUTSAL_GOAL_DEPTH * 2;
      targetWidth  = FIFA.FUTSAL_WIDTH;
    } else if (type === 'reduced') {
      targetLength = this.reducedDim.w;
      targetWidth  = this.reducedDim.h;
    } else {
      targetLength = FIFA.LENGTH;
      targetWidth  = FIFA.WIDTH;
    }

    const scale = Math.min((W - pH * 2) / targetLength, (H - pV * 2) / targetWidth);

    let fw, fh;
    if (type === 'full' || type === 'blank') { fw = FIFA.LENGTH * scale; fh = FIFA.WIDTH * scale; }
    else if (type.startsWith('half_')) { fw = (FIFA.LENGTH / 2) * scale; fh = FIFA.WIDTH * scale; }
    else if (type.startsWith('third_')) { fw = (FIFA.LENGTH / 3) * scale; fh = FIFA.WIDTH * scale; }
    else if (type === 'penalty_zoom') { fw = FIFA.PENALTY_AREA_DEPTH * 1.5 * scale; fh = FIFA.PENALTY_AREA_WIDTH * 1.2 * scale; }
    else if (type === 'f7') { fw = FIFA.F7_LENGTH * scale; fh = FIFA.F7_WIDTH * scale; }
    else if (type === 'f8') { fw = FIFA.F8_LENGTH * scale; fh = FIFA.F8_WIDTH * scale; }
    else if (type === 'futsal') { fw = FIFA.FUTSAL_LENGTH * scale; fh = FIFA.FUTSAL_WIDTH * scale; }
    else if (type === 'reduced') { fw = this.reducedDim.w * scale; fh = this.reducedDim.h * scale; }
    else { fw = FIFA.LENGTH * scale; fh = FIFA.WIDTH * scale; }

    this.field = {
      x: (W - fw) / 2,
      y: (H - fh) / 2,
      w: fw,
      h: fh,
      scale,
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
    const { x, y, w, h } = this.field;

    // Fondo exterior
    ctx.fillStyle = FIELD_COLORS.outerBg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Franjas de hierba (12 franjas verticales alternas)
    const stripeCount = 12;
    const stripeW = w / stripeCount;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0
        ? FIELD_COLORS.stripeDark
        : FIELD_COLORS.stripeLight;
      ctx.fillRect(x + i * stripeW, y, stripeW, h);
    }
    ctx.restore();
  }

  // ───────────────────────────────────────
  // CAMPO COMPLETO
  // ───────────────────────────────────────
  _drawFull() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    const cr = FIFA.CENTER_RADIUS * scale;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, cr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.max(3, scale * 0.18), 0, Math.PI * 2); ctx.fill();
    this._drawGoalAndAreas(x, y, h, scale, 'left');
    this._drawGoalAndAreas(x + w, y, h, scale, 'right');
    this._drawCornerArcs(x, y, w, h, scale);
  }

  _drawHalfAttack() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + h / 2, FIFA.CENTER_RADIUS * scale, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    this._drawGoalAndAreas(x + w, y, h, scale, 'right');
  }

  _drawHalfDefense() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + w, y + h / 2, FIFA.CENTER_RADIUS * scale, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    this._drawGoalAndAreas(x, y, h, scale, 'left');
  }

  _drawThirdDef() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    this._drawGoalAndAreas(x, y, h, scale, 'left');
  }

  _drawThirdMid() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    // Draw full center circle relative to this view
    // The center of the field is at some offset. 
    // In third_mid, the center is actually at the horizontal middle of this view.
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, FIFA.CENTER_RADIUS * scale, 0, Math.PI * 2); ctx.stroke();
  }

  _drawThirdOff() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    this._drawGoalAndAreas(x + w, y, h, scale, 'right');
  }

  _drawPenaltyZoom() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(2, scale * 0.15);
    const areaW = FIFA.PENALTY_AREA_WIDTH * scale;
    const areaD = FIFA.PENALTY_AREA_DEPTH * scale;
    const lineX = x + w; 
    ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(lineX, y+h); ctx.stroke();
    ctx.strokeRect(lineX - areaD, y + (h - areaW)/2, areaD, areaW);
    const gw = FIFA.GOAL_WIDTH * scale; const gy = y + (h - gw)/2;
    ctx.strokeRect(lineX, gy, FIFA.GOAL_DEPTH * scale, gw);
    const spotX = lineX - FIFA.PENALTY_SPOT * scale;
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath(); ctx.arc(spotX, y + h/2, 3*scale, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(spotX, y + h/2, FIFA.CENTER_RADIUS * scale, Math.PI - 0.925, Math.PI + 0.925, true); ctx.stroke();
  }

  _drawF7() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    this._drawGoalAndAreasF7(x, y, h, scale, 'left');
    this._drawGoalAndAreasF7(x + w, y, h, scale, 'right');
  }

  _drawGoalAndAreasF7(lineX, fieldY, fieldH, scale, side) {
    const ctx = this.ctx;
    const dir = side === 'left' ? 1 : -1;
    const gw = FIFA.F7_GOAL_WIDTH * scale; const gy = fieldY + (fieldH - gw)/2;
    ctx.strokeRect(side === 'left' ? lineX - 2*scale : lineX, gy, 2*scale, gw);
    const paw = FIFA.F7_PENALTY_WIDTH * scale; const pad = FIFA.F7_PENALTY_DEPTH * scale;
    const pay = fieldY + (fieldH - paw)/2;
    ctx.strokeRect(side === 'left' ? lineX : lineX - pad, pay, pad, paw);
    const spotX = side === 'left' ? lineX + FIFA.F7_PENALTY_SPOT*scale : lineX - FIFA.F7_PENALTY_SPOT*scale;
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath(); ctx.arc(spotX, fieldY + fieldH/2, 2*scale, 0, Math.PI*2); ctx.fill();
  }

  _drawF8() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    this._drawGoalAndAreasF8(x, y, h, scale, 'left');
    this._drawGoalAndAreasF8(x + w, y, h, scale, 'right');
  }

  _drawGoalAndAreasF8(lineX, fieldY, fieldH, scale, side) {
    const ctx = this.ctx;
    const gw = FIFA.F8_GOAL_WIDTH * scale; const gy = fieldY + (fieldH - gw)/2;
    ctx.strokeRect(side === 'left' ? lineX - 2*scale : lineX, gy, 2*scale, gw);
    const paw = FIFA.F8_PENALTY_WIDTH * scale; const pad = FIFA.F8_PENALTY_DEPTH * scale;
    const pay = fieldY + (fieldH - paw)/2;
    ctx.strokeRect(side === 'left' ? lineX : lineX - pad, pay, pad, paw);
  }

  _drawFutsal() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = Math.max(1.5, scale * 0.12);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    this._drawFutsalAreas(x, y, h, scale, 'left');
    this._drawFutsalAreas(x + w, y, h, scale, 'right');
  }

  _drawFutsalAreas(lineX, fieldY, fieldH, scale, side) {
    const ctx = this.ctx;
    const dir = side === 'left' ? 1 : -1;
    const r = FIFA.FUTSAL_AREA_RADIUS * scale;
    const gw = FIFA.FUTSAL_GOAL_WIDTH * scale;
    const gy1 = fieldY + (fieldH/2 - gw/2);
    const gy2 = fieldY + (fieldH/2 + gw/2);
    ctx.beginPath();
    ctx.arc(lineX, gy1, r, side === 'left' ? 0 : Math.PI, side === 'left' ? Math.PI*1.5 : Math.PI*0.5, side !== 'left');
    ctx.lineTo(lineX + dir*r, gy2);
    ctx.arc(lineX, gy2, r, side === 'left' ? Math.PI*0.5 : Math.PI*1.5, 0, side !== 'left');
    ctx.stroke();
    const spot6 = lineX + dir * FIFA.FUTSAL_PENALTY_SPOT * scale;
    ctx.beginPath(); ctx.arc(spot6, fieldY + fieldH/2, 1.5*scale, 0, Math.PI*2); ctx.fill();
    const spot10 = lineX + dir * FIFA.FUTSAL_SECOND_PENALTY * scale;
    ctx.beginPath(); ctx.arc(spot10, fieldY + fieldH/2, 1.5*scale, 0, Math.PI*2); ctx.fill();
  }

  _drawReduced() {
    const { x, y, w, h, scale } = this.field;
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = FIELD_COLORS.linesSoft;
    for (let m = 10; m < this.reducedDim.w; m += 10) {
      ctx.beginPath(); ctx.moveTo(x + m * scale, y); ctx.lineTo(x + m * scale, y + h); ctx.stroke();
    }
    for (let m = 10; m < this.reducedDim.h; m += 10) {
      ctx.beginPath(); ctx.moveTo(x, y + m * scale); ctx.lineTo(x + w, y + m * scale); ctx.stroke();
    }
  }

  _drawGoalAndAreas(lineX, fieldY, fieldH, scale, side) {
    const ctx = this.ctx;
    const gw = FIFA.GOAL_WIDTH * scale; const gd = FIFA.GOAL_DEPTH * scale;
    const gy = fieldY + (fieldH - gw) / 2;
    ctx.strokeRect(side === 'left' ? lineX - gd : lineX, gy, gd, gw);
    const saw = FIFA.SMALL_AREA_WIDTH * scale; const sad = FIFA.SMALL_AREA_DEPTH * scale;
    const say = fieldY + (fieldH - saw) / 2;
    ctx.strokeRect(side === 'left' ? lineX : lineX - sad, say, sad, saw);
    const paw = FIFA.PENALTY_AREA_WIDTH * scale; const pad = FIFA.PENALTY_AREA_DEPTH * scale;
    const pay = fieldY + (fieldH - paw) / 2;
    ctx.strokeRect(side === 'left' ? lineX : lineX - pad, pay, pad, paw);
    const penX = side === 'left' ? lineX + FIFA.PENALTY_SPOT * scale : lineX - FIFA.PENALTY_SPOT * scale;
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath(); ctx.arc(penX, fieldY + fieldH / 2, 2 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(penX, fieldY + fieldH / 2, FIFA.CENTER_RADIUS * scale, side === 'left' ? -0.925 : Math.PI - 0.925, side === 'left' ? 0.925 : Math.PI + 0.925); ctx.stroke();
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
