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
};

// ─────────────────────────────────────────
// COLORES DEL CAMPO
// ─────────────────────────────────────────
export const FIELD_COLORS = {
  outerBg:      '#2D5A27',   // Fondo exterior al campo
  stripeDark:   '#3D6B34',   // Franja oscura de hierba
  stripeLight:  '#4A7C3F',   // Franja clara de hierba
  lines:        '#FFFFFF',   // Líneas reglamentarias
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
    this.padding = options.padding ?? 24; // px de margen alrededor del campo

    // Dimensiones calculadas (se actualizan en draw)
    this.field = {
      x: 0, y: 0,
      w: 0, h: 0,
      scale: 1,
    };

    this._bindResize();
  }

  // ───────────────────────────────────────
  // API PÚBLICA
  // ───────────────────────────────────────

  /**
   * Dibuja el campo del tipo indicado
   * @param {'full'|'half_attack'|'half_defense'} type
   */
  draw(type = 'full') {
    this.currentType = type;
    this._resize();
    this._clear();
    this._drawBackground();

    switch (type) {
      case 'full':         this._drawFull();        break;
      case 'half_attack':  this._drawHalfAttack();  break;
      case 'half_defense': this._drawHalfDefense(); break;
      default:
        console.warn(`[Míster11] Tipo de campo desconocido: ${type}`);
        this._drawFull();
    }
  }

  /**
   * Redibuja el campo actual (útil al redimensionar la ventana)
   */
  redraw() {
    this.draw(this.currentType);
  }

  /**
   * Retorna las coordenadas (px) del campo en el canvas
   * Útil para Fabric.js: saber dónde colocar jugadores dentro del campo
   */
  getFieldBounds() {
    return { ...this.field };
  }

  /**
   * Convierte metros reales a píxeles en el canvas
   */
  mToPx(meters) {
    return meters * this.field.scale;
  }

  /**
   * Convierte posición relativa (0-1, 0-1) del campo a píxeles del canvas
   * @param {number} relX - 0 = línea de fondo izquierda, 1 = línea derecha
   * @param {number} relY - 0 = línea de banda superior, 1 = inferior
   */
  relToCanvas(relX, relY) {
    return {
      x: this.field.x + relX * this.field.w,
      y: this.field.y + relY * this.field.h,
    };
  }

  // ───────────────────────────────────────
  // LAYOUT Y CÁLCULOS
  // ───────────────────────────────────────
  _resize() {
    const W = this.canvas.width  = this.canvas.offsetWidth;
    const H = this.canvas.height = this.canvas.offsetHeight;
    const p = this.padding;

    // Campo SIEMPRE en landscape (105 > 68)
    // Calcular escala para que quepa con padding
    const scaleByW = (W - p * 2) / FIFA.LENGTH;
    const scaleByH = (H - p * 2) / FIFA.WIDTH;
    const scale = Math.min(scaleByW, scaleByH);

    const fieldW = FIFA.LENGTH * scale;
    const fieldH = FIFA.WIDTH  * scale;

    // VERIFICACIÓN: fieldW siempre mayor que fieldH
    if (fieldW < fieldH) {
      console.error('[Míster11] ERROR: el campo está en vertical. Revisa las dimensiones del canvas.');
    }

    this.field = {
      x: (W - fieldW) / 2,
      y: (H - fieldH) / 2,
      w: fieldW,
      h: fieldH,
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

    // ── Rectángulo exterior ──
    ctx.strokeRect(x, y, w, h);

    // ── Línea de medio campo (vertical) ──
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();

    // ── Círculo central ──
    const cr = FIFA.CENTER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, cr, 0, Math.PI * 2);
    ctx.stroke();

    // ── Punto central ──
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.max(3, scale * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // ── Porterías y áreas IZQUIERDA ──
    this._drawGoalAndAreas(x, y, h, scale, 'left');

    // ── Porterías y áreas DERECHA ──
    this._drawGoalAndAreas(x + w, y, h, scale, 'right');

    // ── Banderines de córner ──
    this._drawCornerArcs(x, y, w, h, scale);
  }

  // ───────────────────────────────────────
  // PORTERÍA + ÁREAS + PENALTI (un lado)
  // ───────────────────────────────────────
  _drawGoalAndAreas(lineX, fieldY, fieldH, scale, side) {
    const ctx = this.ctx;
    const dir = side === 'left' ? 1 : -1; // profundidad hacia adentro del campo

    // ── Portería ──
    const gw  = FIFA.GOAL_WIDTH * scale;
    const gd  = FIFA.GOAL_DEPTH * scale;
    const gyStart = fieldY + (fieldH - gw) / 2;

    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    if (side === 'left') {
      ctx.rect(lineX - gd, gyStart, gd, gw);
    } else {
      ctx.rect(lineX, gyStart, gd, gw);
    }
    ctx.stroke();

    // Red de portería (opcional, semi-transparente)
    const netX = side === 'left' ? lineX - gd : lineX;
    this._drawGoalNet(netX, gyStart, gd, gw);

    // ── Área pequeña ──
    const saw = FIFA.SMALL_AREA_WIDTH * scale;
    const sad = FIFA.SMALL_AREA_DEPTH * scale;
    const say = fieldY + (fieldH - saw) / 2;

    ctx.beginPath();
    if (side === 'left') {
      ctx.rect(lineX, say, sad, saw);
    } else {
      ctx.rect(lineX - sad, say, sad, saw);
    }
    ctx.stroke();

    // ── Área grande ──
    const paw = FIFA.PENALTY_AREA_WIDTH * scale;
    const pad = FIFA.PENALTY_AREA_DEPTH * scale;
    const pay = fieldY + (fieldH - paw) / 2;

    ctx.beginPath();
    if (side === 'left') {
      ctx.rect(lineX, pay, pad, paw);
    } else {
      ctx.rect(lineX - pad, pay, pad, paw);
    }
    ctx.stroke();

    // ── Punto de penalti ──
    const penX = side === 'left'
      ? lineX + FIFA.PENALTY_SPOT * scale
      : lineX - FIFA.PENALTY_SPOT * scale;
    const penY = fieldY + fieldH / 2;

    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    ctx.arc(penX, penY, Math.max(3, scale * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // ── Semicírculo del área ──
    const sr = FIFA.CENTER_RADIUS * scale;
    const areaEdgeX = side === 'left'
      ? lineX + pad
      : lineX - pad;

    ctx.beginPath();
    ctx.arc(penX, penY, sr, 0, Math.PI * 2);
    ctx.save();
    // Clip para mostrar solo la parte exterior al área grande
    ctx.beginPath();
    if (side === 'left') {
      ctx.rect(areaEdgeX, fieldY - 10, 200, fieldH + 20);
    } else {
      ctx.rect(areaEdgeX - 200, fieldY - 10, 200, fieldH + 20);
    }
    ctx.clip();
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    ctx.arc(penX, penY, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ───────────────────────────────────────
  // RED DE LA PORTERÍA
  // ───────────────────────────────────────
  _drawGoalNet(gx, gy, gd, gw) {
    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.goalNet;
    ctx.lineWidth = 0.8;

    const cols = 5;
    const rows = 4;

    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + (gd / cols) * i, gy);
      ctx.lineTo(gx + (gd / cols) * i, gy + gw);
      ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(gx, gy + (gw / rows) * i);
      ctx.lineTo(gx + gd, gy + (gw / rows) * i);
      ctx.stroke();
    }

    // Restaurar grosor
    ctx.lineWidth = Math.max(1.5, this.field.scale * 0.12);
  }

  // ───────────────────────────────────────
  // BANDERINES DE CÓRNER
  // ───────────────────────────────────────
  _drawCornerArcs(fx, fy, fw, fh, scale) {
    const ctx = this.ctx;
    const r = FIFA.CORNER_RADIUS * scale;
    ctx.strokeStyle = FIELD_COLORS.lines;

    // Esquina superior izquierda
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI / 2);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.arc(fx, fy + fh, r, -Math.PI / 2, 0);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.arc(fx + fw, fy, r, Math.PI / 2, Math.PI);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.arc(fx + fw, fy + fh, r, Math.PI, Math.PI * 3 / 2);
    ctx.stroke();
  }

  // ───────────────────────────────────────
  // MEDIO CAMPO — ATAQUE (mitad derecha)
  // ───────────────────────────────────────
  _drawHalfAttack() {
    // Calcular como si fuera campo completo pero escalar al doble de ancho
    const canvas = this.canvas;
    const p = this.padding;

    // La mitad del campo mide 52.5m x 68m
    const scaleByW = (canvas.width  - p * 2) / (FIFA.LENGTH / 2);
    const scaleByH = (canvas.height - p * 2) / FIFA.WIDTH;
    const scale = Math.min(scaleByW, scaleByH);

    const halfW = (FIFA.LENGTH / 2) * scale;
    const fieldH = FIFA.WIDTH * scale;
    const fx = (canvas.width  - halfW) / 2;
    const fy = (canvas.height - fieldH) / 2;

    // Actualizar field para referencias externas
    this.field = { x: fx, y: fy, w: halfW, h: fieldH, scale };

    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.lineWidth = Math.max(1.5, scale * 0.12);

    // Rectángulo de la mitad (3 lados + línea de medio campo)
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + halfW, fy);
    ctx.lineTo(fx + halfW, fy + fieldH);
    ctx.lineTo(fx, fy + fieldH);
    ctx.stroke();

    // Línea de medio campo (borde izquierdo con semicírculo)
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy + fieldH);
    ctx.stroke();

    // Semicírculo del círculo central (solo la mitad derecha)
    const cr = FIFA.CENTER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(fx, fy + fieldH / 2, cr, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    ctx.arc(fx, fy + fieldH / 2, Math.max(3, scale * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // Portería y áreas del lado derecho (ataque)
    this._drawGoalAndAreas(fx + halfW, fy, fieldH, scale, 'right');

    // Córners derecha
    const r = FIFA.CORNER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(fx + halfW, fy, r, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx + halfW, fy + fieldH, r, Math.PI, Math.PI * 3 / 2);
    ctx.stroke();
  }

  // ───────────────────────────────────────
  // MEDIO CAMPO — DEFENSA (mitad izquierda)
  // ───────────────────────────────────────
  _drawHalfDefense() {
    const canvas = this.canvas;
    const p = this.padding;

    const scaleByW = (canvas.width  - p * 2) / (FIFA.LENGTH / 2);
    const scaleByH = (canvas.height - p * 2) / FIFA.WIDTH;
    const scale = Math.min(scaleByW, scaleByH);

    const halfW = (FIFA.LENGTH / 2) * scale;
    const fieldH = FIFA.WIDTH * scale;
    const fx = (canvas.width  - halfW) / 2;
    const fy = (canvas.height - fieldH) / 2;

    this.field = { x: fx, y: fy, w: halfW, h: fieldH, scale };

    const ctx = this.ctx;
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.lineWidth = Math.max(1.5, scale * 0.12);

    // 3 lados del rectángulo
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + halfW, fy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy + fieldH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fx, fy + fieldH);
    ctx.lineTo(fx + halfW, fy + fieldH);
    ctx.stroke();

    // Línea de medio campo (borde derecho)
    ctx.beginPath();
    ctx.moveTo(fx + halfW, fy);
    ctx.lineTo(fx + halfW, fy + fieldH);
    ctx.stroke();

    // Semicírculo izquierdo del círculo central
    const cr = FIFA.CENTER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(fx + halfW, fy + fieldH / 2, cr, Math.PI / 2, Math.PI * 3 / 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = FIELD_COLORS.lines;
    ctx.beginPath();
    ctx.arc(fx + halfW, fy + fieldH / 2, Math.max(3, scale * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // Portería y áreas del lado izquierdo (defensa)
    this._drawGoalAndAreas(fx, fy, fieldH, scale, 'left');

    // Córners izquierda
    const r = FIFA.CORNER_RADIUS * scale;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx, fy + fieldH, r, -Math.PI / 2, 0);
    ctx.stroke();
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
    { pos: 'PO', relX: 0.04, relY: 0.50 },
    { pos: 'LD', relX: 0.18, relY: 0.15 },
    { pos: 'DC', relX: 0.18, relY: 0.38 },
    { pos: 'DC', relX: 0.18, relY: 0.62 },
    { pos: 'LI', relX: 0.18, relY: 0.85 },
    { pos: 'MC', relX: 0.40, relY: 0.25 },
    { pos: 'MCD',relX: 0.38, relY: 0.50 },
    { pos: 'MC', relX: 0.40, relY: 0.75 },
    { pos: 'EX', relX: 0.70, relY: 0.15 },
    { pos: 'SD', relX: 0.74, relY: 0.50 },
    { pos: 'EX', relX: 0.70, relY: 0.85 },
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
