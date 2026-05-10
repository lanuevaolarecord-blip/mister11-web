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
    this.lineWeight = 2.0; // Grosor de línea estándar (actualizado para alta legibilidad)
    
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
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = FIELD_COLORS.lines;
    ctx.lineWidth = this.lineWeight;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

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

    // Metros reales visibles por modo (largo × ancho del área mostrada)
    const METERS = {
      full:         { w: FIFA.LENGTH,              h: FIFA.WIDTH },
      half_attack:  { w: FIFA.LENGTH / 2,          h: FIFA.WIDTH },
      half_defense: { w: FIFA.LENGTH / 2,          h: FIFA.WIDTH },
      third_def:    { w: FIFA.LENGTH / 3,          h: FIFA.WIDTH },
      third_mid:    { w: FIFA.LENGTH / 3,          h: FIFA.WIDTH },
      third_off:    { w: FIFA.LENGTH / 3,          h: FIFA.WIDTH },
      penalty_zoom: { w: FIFA.PENALTY_AREA_DEPTH + 4, h: FIFA.PENALTY_AREA_WIDTH + 6 },
      f7:           { w: FIFA.F7_LENGTH,           h: FIFA.F7_WIDTH },
      f8:           { w: FIFA.F8_LENGTH,           h: FIFA.F8_WIDTH },
      futsal:       { w: FIFA.FUTSAL_LENGTH,       h: FIFA.FUTSAL_WIDTH },
    };

    const meters = METERS[this.currentType]
      ?? (this.currentType === 'reduced'
          ? { w: this.reducedDim.w, h: this.reducedDim.h }
          : { w: FIFA.LENGTH, h: FIFA.WIDTH });

    // Ratio de aspecto del área visible (letterbox/pillarbox exacto)
    const ratio = meters.w / meters.h;

    const availW = W - pH * 2;
    const availH = H - pV * 2;

    let fw, fh;
    if (availW / availH > ratio) {
      fh = availH;
      fw = fh * ratio;
    } else {
      fw = availW;
      fh = fw / ratio;
    }

    // pxPerMeter: escala real del área visible
    const pxPerMeter = fw / meters.w;
    // zoomFactor: cuántas veces se amplía respecto al campo completo
    const zoomFactor = FIFA.LENGTH / meters.w;

    this.field = {
      x: (W - fw) / 2,
      y: (H - fh) / 2,
      w: fw,
      h: fh,
      scale:     pxPerMeter,   // píxeles por metro real visible
      fullScale: fw / FIFA.LENGTH, // referencia al campo completo
      zoom:      zoomFactor,   // factor de zoom (1 = campo completo)
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
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde del área visible: Superior, Derecho, Inferior (sólido)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.stroke();

    // Portería y áreas en el lado derecho
    // rx=1 → lineX = x+w (borde derecho del canvas)
    this._drawGoalAndAreas(1, 'right');

    // Línea de medio campo = borde izquierdo (punteada)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Semicírculo del círculo central
    // El centro del campo completo está en el borde izq de este canvas
    const cr = (FIFA.CENTER_RADIUS / FIFA.LENGTH) * w;
    ctx.beginPath();
    ctx.arc(x, y + h / 2, cr, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHalfDefense() {
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde del área visible: Superior, Izquierdo, Inferior (sólido)
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();

    // Portería y áreas en el lado izquierdo
    // rx=0 → lineX = x (borde izquierdo del canvas)
    this._drawGoalAndAreas(0, 'left');

    // Línea de medio campo = borde derecho (punteada)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Semicírculo del círculo central
    const cr = (FIFA.CENTER_RADIUS / FIFA.LENGTH) * w;
    ctx.beginPath();
    ctx.arc(x + w, y + h / 2, cr, Math.PI / 2, Math.PI * 3 / 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + w, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawThirdDef() {
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde: Superior, Izquierdo, Inferior
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    
    this._drawGoalAndAreas(0, 'left');

    // Línea límite del tercio = borde derecho (punteada)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawThirdMid() {
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde: Superior, Inferior
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();

    // Línea de medio campo real en el centro del tercio medio
    // El campo completo: 0 a 105m. El tercio medio: 35 a 70m.
    // El centro (52.5m) está a (52.5-35)/(70-35) = 0.5 del tercio
    const midX = x + w / 2;
    ctx.beginPath();
    ctx.moveTo(midX, y);
    ctx.lineTo(midX, y + h);
    ctx.stroke();

    // Círculo central completo (ocupa parte del tercio medio)
    const cr = (FIFA.CENTER_RADIUS / (FIFA.LENGTH / 3)) * w;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, cr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Límites del tercio (punteados)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawThirdOff() {
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde: Superior, Derecho, Inferior
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.stroke();

    this._drawGoalAndAreas(1, 'right');

    // Línea límite del tercio = borde izquierdo (punteada)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawPenaltyZoom() {
    const { x, y, w, h } = this.field;
    const ctx = this.ctx;

    // Borde: Superior, Derecho, Inferior
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.stroke();

    this._drawGoalAndAreas(1, 'right');

    // Línea de fondo izquierda (borde del área de penalti)
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
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
    // Siempre dibuja el borde del área visible del canvas
    // independientemente del modo de campo
    const { x, y, w, h } = this.field;
    this.ctx.strokeRect(x, y, w, h);
  }

  _drawMidLine() {
    const { x, y, w, h } = this.field;
    const midX = x + w / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(midX, y);
    this.ctx.lineTo(midX, y + h);
    this.ctx.stroke();
  }

  _drawCenterCircle() {
    const ctx = this.ctx;
    const { x, y, w, h } = this.field;
    // El centro del campo completo se proyecta al centro del canvas
    // en modo 'full'. En otros modos se calcula via getCanvasPoint.
    const cp = this.getCanvasPoint(0.5, 0.5);
    const r = (FIFA.CENTER_RADIUS / FIFA.LENGTH) * w;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawGoalAndAreas(rx, side, isZoom = false, mode = 'f11') {
    const ctx = this.ctx;
    const { x: fx, y: fy, w: fw, h: fh } = this.field;

    // Longitud real visible en metros según el modo actual
    const VISIBLE_LENGTH = {
      full:         FIFA.LENGTH,
      half_attack:  FIFA.LENGTH / 2,
      half_defense: FIFA.LENGTH / 2,
      third_def:    FIFA.LENGTH / 3,
      third_mid:    FIFA.LENGTH / 3,
      third_off:    FIFA.LENGTH / 3,
      penalty_zoom: FIFA.PENALTY_AREA_DEPTH + 4,
      f7:           FIFA.F7_LENGTH,
      f8:           FIFA.F8_LENGTH,
      futsal:       FIFA.FUTSAL_LENGTH,
    };
    const VISIBLE_WIDTH = {
      full:         FIFA.WIDTH,
      half_attack:  FIFA.WIDTH,
      half_defense: FIFA.WIDTH,
      third_def:    FIFA.WIDTH,
      third_mid:    FIFA.WIDTH,
      third_off:    FIFA.WIDTH,
      penalty_zoom: FIFA.PENALTY_AREA_WIDTH + 6,
      f7:           FIFA.F7_WIDTH,
      f8:           FIFA.F8_WIDTH,
      futsal:       FIFA.FUTSAL_WIDTH,
    };

    const visLen = VISIBLE_LENGTH[this.currentType] ?? FIFA.LENGTH;
    const visWid = VISIBLE_WIDTH[this.currentType] ?? FIFA.WIDTH;

    // lineX = posición X de la línea de fondo en el canvas
    const lineX = fx + rx * fw;

    let penaltyDepth, penaltyWidth, smallDepth, smallWidth,
        goalWidth, goalDepth, penaltySpot;

    if (mode === 'f7') {
      penaltyDepth = (FIFA.F7_PENALTY_DEPTH / visLen) * fw;
      penaltyWidth = (FIFA.F7_PENALTY_WIDTH / visWid) * fh;
      smallDepth   = 0;
      smallWidth   = 0;
      goalWidth    = (FIFA.F7_GOAL_WIDTH / visWid) * fh;
      goalDepth    = (FIFA.F7_GOAL_DEPTH / visLen) * fw;
      penaltySpot  = (FIFA.F7_PENALTY_SPOT / visLen) * fw;
    } else if (mode === 'f8') {
      penaltyDepth = (FIFA.F8_PENALTY_DEPTH / visLen) * fw;
      penaltyWidth = (FIFA.F8_PENALTY_WIDTH / visWid) * fh;
      smallDepth   = 0;
      smallWidth   = 0;
      goalWidth    = (FIFA.F8_GOAL_WIDTH / visWid) * fh;
      goalDepth    = (FIFA.F8_GOAL_DEPTH / visLen) * fw;
      penaltySpot  = (11 / visLen) * fw;
    } else {
      // F11 — proporciones FIFA reales respecto al área visible
      penaltyDepth = (FIFA.PENALTY_AREA_DEPTH / visLen) * fw;
      penaltyWidth = (FIFA.PENALTY_AREA_WIDTH / visWid) * fh;
      smallDepth   = (FIFA.SMALL_AREA_DEPTH / visLen) * fw;
      smallWidth   = (FIFA.SMALL_AREA_WIDTH / visWid) * fh;
      goalWidth    = (FIFA.GOAL_WIDTH / visWid) * fh;
      goalDepth    = (FIFA.GOAL_DEPTH / visLen) * fw;
      penaltySpot  = (FIFA.PENALTY_SPOT / visLen) * fw;
    }

    const centerY = fy + fh / 2;

    // ── Área grande ──
    ctx.beginPath();
    const paY1 = centerY - penaltyWidth / 2;
    const paY2 = centerY + penaltyWidth / 2;
    if (side === 'left') {
      ctx.moveTo(lineX, paY1);
      ctx.lineTo(lineX + penaltyDepth, paY1);
      ctx.lineTo(lineX + penaltyDepth, paY2);
      ctx.lineTo(lineX, paY2);
    } else {
      ctx.moveTo(lineX, paY1);
      ctx.lineTo(lineX - penaltyDepth, paY1);
      ctx.lineTo(lineX - penaltyDepth, paY2);
      ctx.lineTo(lineX, paY2);
    }
    ctx.stroke();

    // ── Área pequeña ──
    if (smallDepth > 0 && smallWidth > 0) {
      ctx.beginPath();
      const saY1 = centerY - smallWidth / 2;
      const saY2 = centerY + smallWidth / 2;
      if (side === 'left') {
        ctx.moveTo(lineX, saY1);
        ctx.lineTo(lineX + smallDepth, saY1);
        ctx.lineTo(lineX + smallDepth, saY2);
        ctx.lineTo(lineX, saY2);
      } else {
        ctx.moveTo(lineX, saY1);
        ctx.lineTo(lineX - smallDepth, saY1);
        ctx.lineTo(lineX - smallDepth, saY2);
        ctx.lineTo(lineX, saY2);
      }
      ctx.stroke();
    }

    // ── Punto de penalti ──
    const spX = side === 'left'
      ? lineX + penaltySpot
      : lineX - penaltySpot;
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(spX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // ── Semicírculo del área (solo F11) ──
    if (mode === 'f11') {
      const arcR = (FIFA.CENTER_RADIUS / visLen) * fw;
      // Distancia entre el punto de penalti (11m) y la línea frontal del área (16.5m)
      const distSpotToLine = 16.5 - 11; 
      // Calculamos el ángulo exacto donde la circunferencia cruza la línea recta
      const intersectionAngle = Math.acos(distSpotToLine / FIFA.CENTER_RADIUS);
      
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(spX, centerY, arcR, -intersectionAngle, intersectionAngle);
      } else {
        ctx.arc(spX, centerY, arcR, Math.PI - intersectionAngle, Math.PI + intersectionAngle);
      }
      ctx.stroke();
    }

    // ── Portería ──
    ctx.beginPath();
    const goY1 = centerY - goalWidth / 2;
    const goY2 = centerY + goalWidth / 2;
    if (side === 'left') {
      ctx.moveTo(lineX, goY1);
      ctx.lineTo(lineX - goalDepth, goY1);
      ctx.lineTo(lineX - goalDepth, goY2);
      ctx.lineTo(lineX, goY2);
    } else {
      ctx.moveTo(lineX, goY1);
      ctx.lineTo(lineX + goalDepth, goY1);
      ctx.lineTo(lineX + goalDepth, goY2);
      ctx.lineTo(lineX, goY2);
    }
    ctx.stroke();

    const gX = side === 'left' ? lineX - goalDepth : lineX;
    this._drawGoalNet(
      gX,
      centerY - goalWidth / 2,
      goalDepth,
      goalWidth
    );
  }

  _drawGoalNet(gx, gy, gd, gw) {
    const ctx = this.ctx; 
    ctx.save();
    ctx.strokeStyle = FIELD_COLORS.goalNet; 
    ctx.lineWidth = 0.8;
    const cols = 5; const rows = 4;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath(); ctx.moveTo(gx + (gd / cols) * i, gy); ctx.lineTo(gx + (gd / cols) * i, gy + gw); ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      ctx.beginPath(); ctx.moveTo(gx, gy + (gw / rows) * i); ctx.lineTo(gx + gd, gy + (gw / rows) * i); ctx.stroke();
    }
    ctx.restore();
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
