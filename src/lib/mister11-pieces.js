/**
 * src/lib/mister11-pieces.js
 * MÍSTER11 — Modelo Unificado de Pieza Táctica (Taxonomía Cerrada & 4 Puertas)
 * 
 * Taxonomía cerrada de entidades en la pizarra táctica:
 *  - player      (isPlayerPiece, data.type='player')
 *  - material    (isMaterial: platillo, cono, mini-cono, grupo conos, linea 5 conos, arco 5 conos, pica/estaca, poste/palo, banderin)
 *  - ball        (isBall: balon futbol, balon negro, balon en movimiento, grupo balones)
 *  - comodin     (isComodin: jugador comodín/joker)
 *  - zone        (isZone: rectangulo, circulo, pentagono, hexagono)
 *  - tool        (isTool: flecha, curva, dashed_curve, linea recta punteada sin flecha)
 *  - trajectory  (isTrajectory: recorrido entre frames)
 *  - thumbnail   (no es pieza en canvas; snapshot del timeline)
 * 
 * Las 4 Puertas:
 *  P1 REMOCIÓN POR CATEGORÍA: removeAllPiecesPreservingField(fc)
 *  P2 INTERPOLACIÓN EN EL LOOP MAESTRO: animatableObjs / targetsByKey determinista
 *  P3 SERIALIZACIÓN POR FRAME: guardar y restaurar todas las propiedades por frame
 *  P4 EXPORT COMPUESTO A RESOLUCIÓN NATIVA: fieldCanvasRef + fcRef compuestos en un lienzo
 */

export const TACTICAL_CATEGORIES = Object.freeze({
  PLAYER: 'player',
  MATERIAL: 'material',
  BALL: 'ball',
  COMODIN: 'comodin',
  ZONE: 'zone',
  TOOL: 'tool',
  TRAJECTORY: 'trajectory',
  THUMBNAIL: 'thumbnail',
});

/**
 * P1: Identifica si un objeto pertenece a la capa del campo (intocable)
 */
export function isFieldLayer(obj) {
  if (!obj) return false;
  return Boolean(
    obj.isFieldLayer ||
    obj.id === 'campo' ||
    obj.id === 'field' ||
    obj.data?.type === 'field' ||
    obj.data?.type === 'campo' ||
    obj.data?.type === 'background' ||
    obj.type === 'field' ||
    (obj.fill && (obj.fill === '#1b3a2d' || obj.fill === '#132a14' || obj.fill === '#224422'))
  );
}

/**
 * Determina la categoría canónica de una pieza táctica
 */
export function getTacticalCategory(obj) {
  if (!obj || isFieldLayer(obj)) return null;
  const d = obj.data || {};

  // 1. Balón
  if (
    obj.isBall ||
    d.type === 'ball' ||
    d.tipo === 'balon' ||
    d.itemId === 'balon' ||
    d.itemId === 'balon_negro' ||
    d.itemId === 'balon_movimiento' ||
    d.itemId?.startsWith('balon') ||
    d.matType === 'balon' ||
    obj.id === 'ball' ||
    obj.id === 'balon'
  ) {
    return TACTICAL_CATEGORIES.BALL;
  }

  // 2. Comodín
  if (
    obj.isComodin ||
    d.playerType === 'joker' ||
    d.playerType === 'comodin' ||
    d.tipo === 'joker' ||
    d.tipo === 'comodin'
  ) {
    return TACTICAL_CATEGORIES.COMODIN;
  }

  // 3. Jugador
  if (
    obj.isPlayerPiece ||
    d.type === 'player' ||
    d.tipo === 'jugador' ||
    (obj.type === 'group' && (d.playerType || d.tipo === 'jugador'))
  ) {
    return TACTICAL_CATEGORIES.PLAYER;
  }

  // 4. Zona
  if (
    obj.isZone ||
    d.type === 'zone' ||
    d.shape === 'circle' ||
    d.shape === 'rect' ||
    d.shape === 'pentagon' ||
    d.shape === 'hexagon'
  ) {
    return TACTICAL_CATEGORIES.ZONE;
  }

  // 5. Herramienta de dibujo (flecha, curva, línea punteada)
  if (
    obj.isTool ||
    d.type === 'tool' ||
    d.type === 'stroke' ||
    d.tool === 'arrow' ||
    d.tool === 'dashed' ||
    d.tool === 'straight_dashed_line' ||
    d.tool === 'arrow_curve' ||
    d.tool === 'dashed_curve' ||
    d.tool === 'shot' ||
    d.tool === 'pressure' ||
    d.tool === 'sprint_pro'
  ) {
    return TACTICAL_CATEGORIES.TOOL;
  }

  // 6. Trayectoria
  if (
    obj.isTrajectory ||
    d.type === 'trajectory' ||
    obj.id?.startsWith('trajectory_')
  ) {
    return TACTICAL_CATEGORIES.TRAJECTORY;
  }

  // 7. Material deportivo
  if (
    obj.isMaterial ||
    d.type === 'material' ||
    d.tipo === 'material' ||
    d.matType ||
    d.itemId
  ) {
    return TACTICAL_CATEGORIES.MATERIAL;
  }

  return null;
}

/**
 * P2: Identificador determinista único para interpolar cualquier pieza en el loop maestro
 */
export function getTacticalPieceIdentifier(obj) {
  if (!obj || isFieldLayer(obj)) return null;
  const d = obj.data || {};
  const cat = getTacticalCategory(obj);

  switch (cat) {
    case TACTICAL_CATEGORIES.BALL: {
      const bId = d.id || obj.id || 'ball_main';
      return String(bId);
    }
    case TACTICAL_CATEGORIES.COMODIN: {
      const label = d.label ?? 'C';
      const cId = d.id || obj.id || `comodin_${label}`;
      return String(cId);
    }
    case TACTICAL_CATEGORIES.PLAYER: {
      let label = d.label;
      if (label === undefined && typeof obj.getObjects === 'function') {
        const textChild = obj.getObjects().find(c => c.type === 'text');
        if (textChild) label = textChild.text;
      }
      const pType = d.playerType || 'local';
      return `player_${pType}_${label ?? '0'}`;
    }
    case TACTICAL_CATEGORIES.MATERIAL: {
      const kind = d.itemId || d.matType || d.tipo || 'item';
      const mIdx = d.id || obj.id || d.materialIndex || '';
      return `material_${kind}_${mIdx}`;
    }
    case TACTICAL_CATEGORIES.ZONE: {
      const shape = d.shape || 'zone';
      const zId = d.id || obj.id || '';
      return `zone_${shape}_${zId}`;
    }
    case TACTICAL_CATEGORIES.TOOL: {
      const toolType = d.tool || d.kind || 'tool';
      const tId = d.id || obj.id || '';
      return `tool_${toolType}_${tId}`;
    }
    case TACTICAL_CATEGORIES.TRAJECTORY: {
      return String(d.id || obj.id || 'trajectory');
    }
    default: {
      if (d.id) return String(d.id);
      if (obj.id) return String(obj.id);
      return null;
    }
  }
}

/**
 * P1: Remoción de todas las piezas tácticas preservando la capa de campo 105:68
 */
export function removeAllTacticalPieces(canvas) {
  if (!canvas) return;
  const objs = [...canvas.getObjects()];
  objs.forEach(obj => {
    if (!isFieldLayer(obj)) {
      canvas.remove(obj);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN 0.5 — CAPA DE INTERACCIÓN (O1, O2, O3 Y REGLA DE RESOLUCIÓN DE GESTO)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ventanas normalizadas por tipo de campo [x0, x1] x [y0, y1]
 * Relativas a las proporciones reglamentarias 105:68
 */
export const FIELD_WINDOWS = Object.freeze({
  full:         { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  halfAttack:   { x0: 0.5,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  half_attack:  { x0: 0.5,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  halfDefense:  { x0: 0.0,   x1: 0.5,   y0: 0.0,  y1: 1.0 },
  half_defense: { x0: 0.0,   x1: 0.5,   y0: 0.0,  y1: 1.0 },
  thirdDefense: { x0: 0.0,   x1: 0.333, y0: 0.0,  y1: 1.0 },
  third_def:    { x0: 0.0,   x1: 0.333, y0: 0.0,  y1: 1.0 },
  thirdMid:     { x0: 0.333, x1: 0.666, y0: 0.0,  y1: 1.0 },
  third_mid:    { x0: 0.333, x1: 0.666, y0: 0.0,  y1: 1.0 },
  thirdAttack:  { x0: 0.666, x1: 1.0,   y0: 0.0,  y1: 1.0 },
  third_off:    { x0: 0.666, x1: 1.0,   y0: 0.0,  y1: 1.0 },
  penaltyArea:  { x0: 0.75,  x1: 1.0,   y0: 0.15, y1: 0.85 },
  penalty_zoom: { x0: 0.75,  x1: 1.0,   y0: 0.15, y1: 0.85 },
  f7:           { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  f8:           { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  futsal:       { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  reduced:      { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
  blank:        { x0: 0.0,   x1: 1.0,   y0: 0.0,  y1: 1.0 },
});

/**
 * O1: Remapeo Proporcional por Ventana Normalizada
 * Mapea las coordenadas (x, y) de la ventana del campo de origen a la nueva ventana,
 * clampeando dentro de márgenes de seguridad para que ninguna pieza quede en el margen negro.
 */
export function remapCoordinatesByWindow(x, y, fromFieldType = 'full', toFieldType = 'full') {
  const fromWin = FIELD_WINDOWS[fromFieldType] || FIELD_WINDOWS.full;
  const toWin = FIELD_WINDOWS[toFieldType] || FIELD_WINDOWS.full;

  const fromW = Math.max(0.001, fromWin.x1 - fromWin.x0);
  const fromH = Math.max(0.001, fromWin.y1 - fromWin.y0);
  const toW = Math.max(0.001, toWin.x1 - toWin.x0);
  const toH = Math.max(0.001, toWin.y1 - toWin.y0);

  const numX = Number(x) || 0.5;
  const numY = Number(y) || 0.5;

  // 1. u, v: posición normalizada [0, 1] dentro de la ventana de origen
  let u, v;
  if (numX >= fromWin.x0 && numX <= fromWin.x1) {
    u = (numX - fromWin.x0) / fromW;
  } else if (numX >= 0 && numX <= 1) {
    u = (numX - fromWin.x0) / fromW;
  } else {
    u = 0.5;
  }

  if (numY >= fromWin.y0 && numY <= fromWin.y1) {
    v = (numY - fromWin.y0) / fromH;
  } else if (numY >= 0 && numY <= 1) {
    v = (numY - fromWin.y0) / fromH;
  } else {
    v = 0.5;
  }

  // 2. Clamping dentro de los límites visibles (evita margen negro de Picture 14)
  const pad = 0.04;
  u = Math.max(pad, Math.min(1.0 - pad, u));
  v = Math.max(pad, Math.min(1.0 - pad, v));

  // 3. Proyectar de regreso a coordenada canónica global [0, 1] que consume getCanvasPoint
  const globalX = toWin.x0 + u * toW;
  const globalY = toWin.y0 + v * toH;

  return { x: globalX, y: globalY, u, v };
}

/**
 * Regla de Resolución de Gesto (Sección 0.5)
 * Define la intención del usuario ante mousedown / pointerdown según el target y tool:
 *  - 'DRAG_EXISTING': mousedown sobre pieza existente -> arrastrar pieza, NUNCA crear encima.
 *  - 'DRAW_NEW': mousedown sobre vacío + tool de dibujo -> crear trazo.
 *  - 'PLACE_STICKY': mousedown sobre vacío + tool sticky -> colocar pieza repetible (O3).
 *  - 'SELECT_CANVAS': mousedown sobre vacío + tool=select -> seleccionar / marco.
 */
export function resolvePointerGesture({ target, activeTool, placingMat }) {
  const isExistingPiece = Boolean(target && !isFieldLayer(target) && target.data?.type !== 'temp');

  if (isExistingPiece) {
    // Regla de Oro: Mousedown SOBRE pieza existente SIEMPRE prioriza arrastrarla (O2 + Gesto)
    return 'DRAG_EXISTING';
  }

  // Mousedown sobre vacío (césped)
  if (placingMat || activeTool === 'place_material') {
    return 'PLACE_STICKY';
  }

  const drawingTools = ['arrow', 'arrow_curve', 'dashed', 'dashed_curve', 'straight_dashed_line', 'shot', 'pressure', 'sprint_pro', 'zone_rect', 'zone_circle', 'zone_pentagon', 'zone_hexagon', 'text'];
  if (drawingTools.includes(activeTool)) {
    return 'DRAW_NEW';
  }

  return 'SELECT_CANVAS';
}
