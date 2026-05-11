/**
 * ============================================================
 * MÍSTER11 — Librería de Herramientas de Dibujo
 * Archivo: mister11-tools.js
 * Versión: 1.0.0
 * ============================================================
 * Define todas las herramientas de dibujo de la pizarra táctica.
 * Cada herramienta gestiona su propio estado y eventos Fabric.js.
 *
 * USO:
 *   import { TOOLS, ToolManager } from './mister11-tools.js';
 *   const tm = new ToolManager(fabricCanvas);
 *   tm.activateTool('arrow');
 * ============================================================
 */

import { fabric } from 'fabric';
import { applyMister11Controls } from './mister11-materials.js';

// ─────────────────────────────────────────
// DEFINICIÓN DE HERRAMIENTAS
// ─────────────────────────────────────────
export const TOOLS = {

  select: {
    id: 'select',
    label: 'Selección',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 3l14 9-7 1-4 7L5 3z"/>
    </svg>`,
    cursor: 'default',
    group: 'select',
  },

  pencil: {
    id: 'pencil',
    label: 'Lápiz libre',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  arrow: {
    id: 'arrow',
    label: 'Flecha recta',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="19" x2="19" y2="5"/>
      <polyline points="9,5 19,5 19,15"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  arrow_curve: {
    id: 'arrow_curve',
    label: 'Flecha curva',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 20 Q12 4 20 20"/>
      <polyline points="16,17 20,20 17,16"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  dashed: {
    id: 'dashed',
    label: 'Línea punteada',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-dasharray="3,2">
      <line x1="4" y1="20" x2="20" y2="4"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  dashed_curve: {
    id: 'dashed_curve',
    label: 'Curva punteada',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-dasharray="3,2">
      <path d="M4 20 Q12 4 20 20"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  zone_circle: {
    id: 'zone_circle',
    label: 'Zona circular',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-dasharray="4,2">
      <circle cx="12" cy="12" r="9"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'shape',
  },

  zone_rect: {
    id: 'zone_rect',
    label: 'Zona rectangular',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-dasharray="4,2">
      <rect x="3" y="6" width="18" height="12" rx="1"/>
    </svg>`,
    cursor: 'crosshair',
    group: 'shape',
  },

  text: {
    id: 'text',
    label: 'Texto',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
    cursor: 'text',
    group: 'shape',
  },

  shot: {
    id: 'shot',
    label: 'Tiro (Doble flecha)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><line x1="4" y1="16" x2="16" y2="4"/><line x1="8" y1="20" x2="20" y2="8"/><polyline points="12,4 16,4 16,8"/><polyline points="16,8 20,8 20,12"/></svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  sprint: {
    id: 'sprint',
    label: 'Sprint (Puntos gruesa)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="1,4"><line x1="4" y1="20" x2="20" y2="4"/></svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  dribble: {
    id: 'dribble',
    label: 'Conducción / Zigzag',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,16 8,8 12,16 16,8 20,16"/></svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  pressure: {
    id: 'pressure',
    label: 'Presión (Ondulada)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12 Q7 8 10 12 T16 12 T20 12"/></svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

  sprint_pro: {
    id: 'sprint_pro',
    label: 'Sprint Mejorado',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="8,4"><line x1="4" y1="20" x2="20" y2="4"/><polyline points="15,4 20,4 20,9"/></svg>`,
    cursor: 'crosshair',
    group: 'draw',
  },

};

// ─────────────────────────────────────────
// CONFIGURACIÓN DE TRAZOS
// ─────────────────────────────────────────
export const STROKE_COLORS = [
  { id: 'white',   hex: '#FFFFFF', label: 'Blanco'   },
  { id: 'yellow',  hex: '#FFD700', label: 'Amarillo' },
  { id: 'red',     hex: '#EF4444', label: 'Rojo'     },
  { id: 'blue',    hex: '#3B82F6', label: 'Azul'     },
  { id: 'green',   hex: '#4CAF7D', label: 'Verde'    },
  { id: 'orange',  hex: '#FF6600', label: 'Naranja'  },
  { id: 'black',   hex: '#1A1A1A', label: 'Negro'    },
  { id: 'gold',    hex: '#D4A843', label: 'Dorado'   },
];

export const STROKE_WIDTHS = {
  thin:   { label: 'Fino',   value: 2  },
  medium: { label: 'Medio',  value: 4  },
  thick:  { label: 'Grueso', value: 7  },
};

export const ARROW_TIPS = {
  none:   { label: 'Sin punta',      dashArray: null },
  filled: { label: 'Flecha rellena', dashArray: null },
  open:   { label: 'Flecha abierta', dashArray: null },
};

// ─────────────────────────────────────────
// GESTOR DE HERRAMIENTAS (ToolManager)
// ─────────────────────────────────────────
export class ToolManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeTool = 'select';
    this.strokeColor = '#FFFFFF';
    this.strokeWidth = 4;
    this.strokeDash = null;
    this.arrowTip = 'filled';

    // Estado interno para herramientas de 2 clics (flecha, curva)
    this._drawState = {
      phase: 'idle',   // idle | started | control
      startX: 0,
      startY: 0,
      controlX: 0,
      controlY: 0,
      tempLine: null,
      tempObj: null,  // para rect y circle
    };

    this._bindEvents();
  }

  // ───────────────────────────────────────
  // ACTIVAR HERRAMIENTA
  // ───────────────────────────────────────
  activateTool(toolId) {
    this.activeTool = toolId;
    this._drawState.phase = 'idle';
    this._removeTempLine();

    const tool = TOOLS[toolId];
    if (!tool) return;

    // Limpiar modo de dibujo de Fabric
    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;
    this.canvas.defaultCursor = tool.cursor;

    switch (toolId) {
      case 'select':
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.canvas.defaultCursor = 'default';
        this.canvas.forEachObject(o => { o.selectable = true; });
        break;

      case 'pencil':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.color = this.strokeColor;
        this.canvas.freeDrawingBrush.width = this.strokeWidth;
        break;

      case 'sprint':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.color = this.strokeColor;
        this.canvas.freeDrawingBrush.width = this.strokeWidth * 1.5;
        this.canvas.freeDrawingBrush.strokeDashArray = [5, 10];
        break;

      case 'dribble':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.color = this.strokeColor;
        this.canvas.freeDrawingBrush.width = this.strokeWidth;
        // Simulación de zigzag con dash corto y shadow
        this.canvas.freeDrawingBrush.strokeDashArray = [4, 4];
        this.canvas.freeDrawingBrush.shadow = new fabric.Shadow({ blur: 2, color: 'rgba(0,0,0,0.3)', offsetX: 1, offsetY: 1 });
        break;

      case 'pressure':
        this.canvas.isDrawingMode = true;
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.color = this.strokeColor;
        this.canvas.freeDrawingBrush.width = this.strokeWidth;
        // Efecto ondulado usando un patrón de dash asimétrico que simula vibración
        this.canvas.freeDrawingBrush.strokeDashArray = [12, 4, 2, 4];
        break;

      default:
        // Herramientas de clic manual
        this.canvas.forEachObject(o => { o.selectable = false; });
        break;
    }

    this.canvas.renderAll();
  }

  // ───────────────────────────────────────
  // BIND DE EVENTOS DEL CANVAS
  // ───────────────────────────────────────
  _bindEvents() {
    this.canvas.on('mouse:down', (e) => this._onMouseDown(e));
    this.canvas.on('mouse:move', (e) => this._onMouseMove(e));
    this.canvas.on('mouse:up',   (e) => this._onMouseUp(e));

    // Al terminar trazo libre: aplicar controles personalizados
    this.canvas.on('path:created', (e) => {
      const path = e.path;
      applyMister11Controls(path);
      path.data = { type: 'stroke', tool: 'pencil' };
    });
  }

  _getPointer(e) {
    return this.canvas.getPointer(e.e);
  }

  // ───────────────────────────────────────
  // EVENTOS DE RATÓN / TÁCTIL
  // ───────────────────────────────────────
  _onMouseDown(e) {
    const { x, y } = this._getPointer(e);

    switch (this.activeTool) {

      case 'arrow':
      case 'dashed':
      case 'shot':
      case 'pressure':
      case 'sprint_pro':
        if (this._drawState.phase === 'idle') {
          this._drawState.phase = 'started';
          this._drawState.startX = x;
          this._drawState.startY = y;
        } else if (this._drawState.phase === 'started') {
          if (this.activeTool === 'shot') {
            this._createShotArrow(this._drawState.startX, this._drawState.startY, x, y);
          } else {
            this._createArrow(
              this._drawState.startX, this._drawState.startY,
              x, y,
              this.activeTool === 'dashed'
            );
          }
          this._drawState.phase = 'idle';
          this._removeTempLine();
        }
        break;

      case 'arrow_curve':
      case 'dashed_curve':
        if (this._drawState.phase === 'idle') {
          this._drawState.phase = 'started';
          this._drawState.startX = x;
          this._drawState.startY = y;
        } else if (this._drawState.phase === 'started') {
          this._drawState.phase = 'control';
          this._drawState.controlX = x;
          this._drawState.controlY = y;
        } else if (this._drawState.phase === 'control') {
          this._createCurvedArrow(
            this._drawState.startX, this._drawState.startY,
            this._drawState.controlX, this._drawState.controlY,
            x, y,
            this.activeTool === 'dashed_curve'
          );
          this._drawState.phase = 'idle';
          this._removeTempLine();
        }
        break;

      case 'zone_circle':
      case 'zone_rect':
        if (this._drawState.phase === 'idle') {
          this._drawState.phase = 'started';
          this._drawState.startX = x;
          this._drawState.startY = y;
          
          if (this.activeTool === 'zone_circle') {
            this._drawState.tempObj = new fabric.Circle({
              left: x, top: y, radius: 1,
              fill: hexToRgba('#D4A843', 0.15),
              stroke: '#D4A843', strokeWidth: 2,
              strokeDashArray: [6, 4],
              originX: 'center', originY: 'center',
              selectable: false, evented: false
            });
          } else {
            this._drawState.tempObj = new fabric.Rect({
              left: x, top: y, width: 1, height: 1,
              fill: hexToRgba('#D4A843', 0.12),
              stroke: '#D4A843', strokeWidth: 2,
              strokeDashArray: [6, 4],
              selectable: false, evented: false
            });
          }
          this.canvas.add(this._drawState.tempObj);
        }
        break;

      case 'text':
        this._createText(x, y);
        break;
    }
  }

  _onMouseMove(e) {
    const { x, y } = this._getPointer(e);

    if (this._drawState.phase === 'started') {
      this._removeTempLine();
      const sx = this._drawState.startX;
      const sy = this._drawState.startY;

      if (this.activeTool === 'arrow' || this.activeTool === 'dashed' || this.activeTool === 'shot') {
        const line = new fabric.Line([sx, sy, x, y], {
          stroke: this.activeTool === 'shot' ? '#EF4444' : this.strokeColor,
          strokeWidth: this.strokeWidth,
          strokeDashArray: this.activeTool === 'dashed' ? [8, 6] : null,
          selectable: false, evented: false, opacity: 0.6, data: { type: 'temp' }
        });
        this._drawState.tempLine = line;
        this.canvas.add(line);
      } else if (this.activeTool === 'arrow_curve' || this.activeTool === 'dashed_curve') {
        if (this._drawState.phase === 'started') {
          // Vista previa de línea recta hasta elegir punto de control
          const line = new fabric.Line([sx, sy, x, y], {
            stroke: this.strokeColor, strokeWidth: this.strokeWidth,
            strokeDashArray: this.activeTool === 'dashed_curve' ? [8, 6] : null,
            selectable: false, evented: false, opacity: 0.6
          });
          this._drawState.tempLine = line;
          this.canvas.add(line);
        } else if (this._drawState.phase === 'control') {
          // Vista previa de curva Bézier
          const pathData = `M ${sx} ${sy} Q ${this._drawState.controlX} ${this._drawState.controlY} ${x} ${y}`;
          const curve = new fabric.Path(pathData, {
            fill: 'transparent', stroke: this.strokeColor, strokeWidth: this.strokeWidth,
            strokeDashArray: this.activeTool === 'dashed_curve' ? [8, 6] : null,
            selectable: false, evented: false, opacity: 0.6
          });
          this._drawState.tempLine = curve;
          this.canvas.add(curve);
        }
      } else if (this.activeTool === 'zone_circle' && this._drawState.tempObj) {
        const radius = Math.sqrt(Math.pow(x - sx, 2) + Math.pow(y - sy, 2));
        this._drawState.tempObj.set({ radius: radius });
      } else if (this.activeTool === 'zone_rect' && this._drawState.tempObj) {
        this._drawState.tempObj.set({
          width: Math.abs(x - sx),
          height: Math.abs(y - sy),
          left: x < sx ? x : sx,
          top: y < sy ? y : sy
        });
      } else if (this.activeTool === 'pressure') {
        const wavy = this._createWavyLine(sx, sy, x, y, { opacity: 0.6, data: { type: 'temp' } });
        this._drawState.tempLine = wavy;
        this.canvas.add(wavy);
      } else if (this.activeTool === 'sprint_pro') {
        const sprint = this._createSprintLinePro(sx, sy, x, y, { opacity: 0.6, data: { type: 'temp' } });
        this._drawState.tempLine = sprint;
        this.canvas.add(sprint);
      }
      this.canvas.renderAll();
    }
  }

  _onMouseUp(e) {
    const { x, y } = this._getPointer(e);

    if (this._drawState.phase === 'started') {
      const sx = this._drawState.startX;
      const sy = this._drawState.startY;

      if (this.activeTool === 'arrow' || this.activeTool === 'dashed' || this.activeTool === 'shot') {
        this._removeTempLine();
        const obj = (this.activeTool === 'shot')
          ? this._createShotArrow(sx, sy, x, y)
          : this._createArrow(sx, sy, x, y, this.activeTool === 'dashed');
        this.canvas.add(obj);
        this.canvas.setActiveObject(obj);
        this._drawState.phase = 'idle';
      } else if (this.activeTool === 'zone_circle') {
        const radius = Math.sqrt(Math.pow(x - sx, 2) + Math.pow(y - sy, 2));
        if (radius > 5) {
          this._removeTempLine();
          const obj = this._createZoneCircle(sx, sy, radius);
          this.canvas.setActiveObject(obj);
        } else {
          this._removeTempLine();
        }
        this._drawState.phase = 'idle';
      } else if (this.activeTool === 'zone_rect') {
        const w = Math.abs(x - sx);
        const h = Math.abs(y - sy);
        if (w > 5 && h > 5) {
          this._removeTempLine();
          const obj = this._createZoneRect(x < sx ? x : sx, y < sy ? y : sy, w, h);
          this.canvas.setActiveObject(obj);
        } else {
          this._removeTempLine();
        }
        this._drawState.phase = 'idle';
      } else if (this.activeTool === 'pressure') {
        this._removeTempLine();
        const obj = this._createWavyLine(sx, sy, x, y);
        this.canvas.add(obj);
        this.canvas.setActiveObject(obj);
        this._drawState.phase = 'idle';
      } else if (this.activeTool === 'sprint_pro') {
        this._removeTempLine();
        const obj = this._createSprintLinePro(sx, sy, x, y);
        this.canvas.add(obj);
        this.canvas.setActiveObject(obj);
        this._drawState.phase = 'idle';
      }
      
      this.canvas.renderAll();
    }
  }

  // ───────────────────────────────────────
  // CREAR FLECHA RECTA CON PUNTA
  // ───────────────────────────────────────
  _createArrow(x1, y1, x2, y2, dashed = false) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 16;
    const headAngle = Math.PI / 6;

    // Línea principal
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      strokeDashArray: dashed ? [10, 6] : null,
      selectable: false,
      evented: false,
    });

    // Punta de la flecha
    const tip1x = x2 - headLen * Math.cos(angle - headAngle);
    const tip1y = y2 - headLen * Math.sin(angle - headAngle);
    const tip2x = x2 - headLen * Math.cos(angle + headAngle);
    const tip2y = y2 - headLen * Math.sin(angle + headAngle);

    const arrowHead = new fabric.Polygon(
      [
        { x: x2, y: y2 },
        { x: tip1x, y: tip1y },
        { x: tip2x, y: tip2y },
      ],
      {
        fill: dashed ? 'transparent' : this.strokeColor,
        stroke: this.strokeColor,
        strokeWidth: dashed ? this.strokeWidth : 1,
        selectable: false,
        evented: false,
      }
    );

    const group = new fabric.Group([line, arrowHead], {
      selectable: true,
      hasControls: false,
      hasBorders: false,
      data: { type: 'stroke', tool: this.activeTool },
    });

    applyMister11Controls(group);
    this.canvas.add(group);
    this.canvas.renderAll();
    return group;
  }

  // ───────────────────────────────────────
  // CREAR DOBLE FLECHA (TIRO)
  // ───────────────────────────────────────
  _createShotArrow(x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 16;
    const offset = 4;
    const dx = offset * Math.cos(angle + Math.PI/2);
    const dy = offset * Math.sin(angle + Math.PI/2);
    
    const line1 = new fabric.Line([x1+dx, y1+dy, x2+dx, y2+dy], { stroke: '#EF4444', strokeWidth: 2 });
    const line2 = new fabric.Line([x1-dx, y1-dy, x2-dx, y2-dy], { stroke: '#EF4444', strokeWidth: 2 });
    
    const tip1 = { x: x2 - headLen * Math.cos(angle - Math.PI/6), y: y2 - headLen * Math.sin(angle - Math.PI/6) };
    const tip2 = { x: x2 - headLen * Math.cos(angle + Math.PI/6), y: y2 - headLen * Math.sin(angle + Math.PI/6) };
    const head = new fabric.Polyline([{x:x2,y:y2}, tip1, tip2, {x:x2,y:y2}], { fill: '#EF4444', stroke: '#EF4444', strokeWidth: 1 });
    
    const group = new fabric.Group([line1, line2, head], { selectable: true, data: { type: 'stroke', tool: 'shot' } });
    applyMister11Controls(group);
    this.canvas.add(group);
    this.canvas.renderAll();
  }

  // ───────────────────────────────────────
  // CREAR FLECHA CURVA (BÉZIER)
  // ───────────────────────────────────────
  _createCurvedArrow(x1, y1, cx, cy, x2, y2, dashed = false) {
    const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

    const path = new fabric.Path(pathData, {
      fill: 'transparent',
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      strokeDashArray: dashed ? [10, 6] : null,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      data: { type: 'stroke', tool: this.activeTool },
    });

    // Calcular ángulo para la punta de flecha en el punto final
    const dx = x2 - cx;
    const dy = y2 - cy;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;
    const headAngle = Math.PI / 6;

    const tip1x = x2 - headLen * Math.cos(angle - headAngle);
    const tip1y = y2 - headLen * Math.sin(angle - headAngle);
    const tip2x = x2 - headLen * Math.cos(angle + headAngle);
    const tip2y = y2 - headLen * Math.sin(angle + headAngle);

    const arrowHead = new fabric.Polygon(
      [{ x: x2, y: y2 }, { x: tip1x, y: tip1y }, { x: tip2x, y: tip2y }],
      {
        fill: dashed ? 'transparent' : this.strokeColor,
        stroke: this.strokeColor,
        strokeWidth: dashed ? 2 : 1,
        selectable: false,
        evented: false,
      }
    );

    const group = new fabric.Group([path, arrowHead], {
      selectable: true,
      hasControls: false,
      hasBorders: false,
      data: { type: 'stroke', tool: this.activeTool },
    });

    applyMister11Controls(group);
    this.canvas.add(group);
    this.canvas.renderAll();
    return group;
  }

  // ───────────────────────────────────────
  // CREAR ZONA CIRCULAR
  // ───────────────────────────────────────
  _createZoneCircle(cx, cy, radius) {
    const circle = new fabric.Circle({
      left: cx,
      top: cy,
      radius: radius,
      fill: hexToRgba('#D4A843', 0.15),
      stroke: '#D4A843',
      strokeWidth: 2,
      strokeDashArray: [7, 5],
      originX: 'center',
      originY: 'center',
      selectable: true,
      hasControls: true,
      hasBorders: true,
      data: { type: 'zone', shape: 'circle' },
    });
    applyMister11Controls(circle);
    this.canvas.add(circle);
    this.canvas.renderAll();
    return circle;
  }

  // ───────────────────────────────────────
  // CREAR ZONA RECTANGULAR
  // ───────────────────────────────────────
  _createZoneRect(left, top, width, height) {
    const rect = new fabric.Rect({
      left, top, width, height,
      fill: hexToRgba('#D4A843', 0.12),
      stroke: '#D4A843',
      strokeWidth: 2,
      strokeDashArray: [7, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      data: { type: 'zone', shape: 'rect' },
    });
    applyMister11Controls(rect);
    this.canvas.add(rect);
    this.canvas.renderAll();
    return rect;
  }

  // ───────────────────────────────────────
  // CREAR TEXTO
  // ───────────────────────────────────────
  _createText(x, y) {
    const text = new fabric.IText('Texto', {
      left: x,
      top: y,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 18,
      fontWeight: '500',
      fill: this.strokeColor,
      originX: 'center',
      originY: 'center',
      selectable: true,
      hasControls: false,
      hasBorders: false,
      padding: 6,
      data: { type: 'text' },
    });

    applyMister11Controls(text);
    this.canvas.add(text);
    text.enterEditing();
    text.selectAll();
    this.canvas.setActiveObject(text);
    this.canvas.renderAll();

    // Al salir de edición, activar herramienta de selección
    text.on('editing:exited', () => {
      if (text.text.trim() === '' || text.text === 'Texto') {
        this.canvas.remove(text);
      }
      this.activateTool('select');
    });

    return text;
  }

  // ───────────────────────────────────────
  // UTILIDADES
  // ───────────────────────────────────────
  _removeTempLine() {
    if (this._drawState.tempLine) {
      this.canvas.remove(this._drawState.tempLine);
      this._drawState.tempLine = null;
    }
    if (this._drawState.tempObj) {
      this.canvas.remove(this._drawState.tempObj);
      this._drawState.tempObj = null;
    }
    // Eliminar cualquier objeto temporal remanente
    const temps = this.canvas.getObjects().filter(o => o.data?.type === 'temp');
    temps.forEach(o => this.canvas.remove(o));
    this.canvas.renderAll();
  }

  setStrokeColor(hex) {
    this.strokeColor = hex;
    if (this.canvas.isDrawingMode) {
      this.canvas.freeDrawingBrush.color = hex;
    }
  }

  setStrokeWidth(px) {
    this.strokeWidth = px;
    if (this.canvas.isDrawingMode) {
      this.canvas.freeDrawingBrush.width = px;
    }
  }

  // ───────────────────────────────────────
  // DESHACER / REHACER (historial simple)
  // ───────────────────────────────────────
  setupHistory(maxSteps = 30) {
    this._history = [];
    this._historyIndex = -1;
    this._maxSteps = maxSteps;
    this._saveSnapshot();

    this.canvas.on('object:added',   () => this._saveSnapshot());
    this.canvas.on('object:removed', () => this._saveSnapshot());
    this.canvas.on('object:modified',() => this._saveSnapshot());
  }

  _saveSnapshot() {
    const json = JSON.stringify(this.canvas.toJSON(['data']));
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(json);
    if (this._history.length > this._maxSteps) {
      this._history.shift();
    }
    this._historyIndex = this._history.length - 1;
  }

  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._loadSnapshot(this._history[this._historyIndex]);
    }
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._loadSnapshot(this._history[this._historyIndex]);
    }
  }

  _loadSnapshot(json) {
    this.canvas.loadFromJSON(JSON.parse(json), () => {
      this.canvas.renderAll();
    });
  }
}

// ─────────────────────────────────────────
// UTILIDAD INTERNA
// ─────────────────────────────────────────
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default { TOOLS, STROKE_COLORS, STROKE_WIDTHS, ToolManager };
