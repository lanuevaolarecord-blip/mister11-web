/**
 * src/utils/boardSelection.js
 * MÍSTER 11 — HOTFIX-10.1 (E3 — Parte B: Selección Inteligente Cono vs. Jugador vs. Forma)
 *
 * Resuelve dos problemas críticos de interacción táctil en PizarraTactica:
 * 1. Al insertar un cuadrado/forma (`SHAPES`), los jugadores quedan encima y pueden
 *    seleccionarse y arrastrarse libremente sin que la forma robe el gesto.
 * 2. Seleccionar un cono o material pequeño (`TOOLS`) cerca de un jugador ya no obliga
 *    a apartar al jugador primero:
 *    - Garantiza un área táctil invisible mínima de 48x48 dp (`MIN_TOUCH_TARGET_DP = 48`)
 *      en conos y herramientas pequeñas (Regla Android First).
 *    - Prioriza candidatos bajo el puntero combinando modo de selección (`auto | players | tools`),
 *      distancia al centro geométrico de cada pieza, especificidad de área (cono pequeño vs.
 *      hitbox extendido del jugador) y última interacción.
 *    - Detecta solapes ambiguos para ofrecer un selector rápido por long-press.
 */

import { BOARD_LAYERS, classifyBoardObjectLayer } from './boardLayers.js';

export const MIN_TOUCH_TARGET_DP = 48;

export const BOARD_SELECTION_MODES = Object.freeze({
  AUTO: 'auto',
  PLAYERS: 'players',
  TOOLS: 'tools',
});

const SMALL_TOOL_IDS = new Set([
  'cono',
  'cono_alto',
  'platillo',
  'pica',
  'aro',
  'valla',
  'banderin',
  'balon',
  'ball',
  'cone',
]);

/**
 * Obtiene el centro geométrico `(x, y)` y las dimensiones visuales `(width, height)` de un objeto Fabric.
 *
 * @param {Object} obj
 * @returns {{ cx: number, cy: number, visualWidth: number, visualHeight: number, visualRadius: number }}
 */
export function getObjectGeometry(obj) {
  if (!obj || typeof obj !== 'object') {
    return { cx: 0, cy: 0, visualWidth: 24, visualHeight: 24, visualRadius: 12 };
  }

  const scaleX = typeof obj.scaleX === 'number' ? Math.abs(obj.scaleX) : 1;
  const scaleY = typeof obj.scaleY === 'number' ? Math.abs(obj.scaleY) : 1;

  let baseW = typeof obj.width === 'number' && obj.width > 0 ? obj.width : 0;
  let baseH = typeof obj.height === 'number' && obj.height > 0 ? obj.height : 0;

  if (typeof obj.radius === 'number' && obj.radius > 0) {
    baseW = Math.max(baseW, obj.radius * 2);
    baseH = Math.max(baseH, obj.radius * 2);
  }

  if ((baseW === 0 || baseH === 0) && Array.isArray(obj._objects)) {
    for (const child of obj._objects) {
      if (typeof child.radius === 'number' && child.radius > 0) {
        baseW = Math.max(baseW, child.radius * 2);
        baseH = Math.max(baseH, child.radius * 2);
      } else if (typeof child.width === 'number' && child.width > 0) {
        baseW = Math.max(baseW, child.width);
        baseH = Math.max(baseH, child.height || child.width);
      }
    }
  }

  const visualWidth = Math.max(8, (baseW || 20) * scaleX);
  const visualHeight = Math.max(8, (baseH || 20) * scaleY);

  let cx = typeof obj.left === 'number' ? obj.left : 0;
  let cy = typeof obj.top === 'number' ? obj.top : 0;

  // Si el origen no es 'center' (ej. Rect de zona creado con originX: 'left', originY: 'top')
  if (obj.originX === 'left') {
    cx += visualWidth / 2;
  } else if (obj.originX === 'right') {
    cx -= visualWidth / 2;
  }
  if (obj.originY === 'top') {
    cy += visualHeight / 2;
  } else if (obj.originY === 'bottom') {
    cy -= visualHeight / 2;
  }

  // Para líneas con x1, y1, x2, y2
  if (
    typeof obj.x1 === 'number' &&
    typeof obj.y1 === 'number' &&
    typeof obj.x2 === 'number' &&
    typeof obj.y2 === 'number' &&
    obj.left === undefined
  ) {
    cx = (obj.x1 + obj.x2) / 2;
    cy = (obj.y1 + obj.y2) / 2;
  }

  const visualRadius = Math.max(6, Math.min(visualWidth, visualHeight) / 2);

  return { cx, cy, visualWidth, visualHeight, visualRadius };
}

/**
 * Asegura que un cono, herramienta pequeña, jugador o balón tenga un área táctil
 * efectiva de al menos `minSize x minSize` dp (por defecto 48x48 dp) sin alterar
 * su tamaño visual en el campo.
 *
 * @param {Object} obj
 * @param {number} [minSize=MIN_TOUCH_TARGET_DP]
 * @returns {{ width: number, height: number, padding: number }}
 */
export function ensureMinTouchHitbox(obj, minSize = MIN_TOUCH_TARGET_DP) {
  if (!obj || typeof obj !== 'object') {
    return { width: minSize, height: minSize, padding: 0 };
  }

  const layer = classifyBoardObjectLayer(obj);
  const { visualWidth, visualHeight } = getObjectGeometry(obj);

  // Las formas grandes (SHAPES) usan su geometría real para no inflar su caja
  if (layer === BOARD_LAYERS.SHAPES) {
    return {
      width: visualWidth,
      height: visualHeight,
      padding: typeof obj.padding === 'number' ? obj.padding : 0,
    };
  }

  const minVisualDim = Math.min(visualWidth, visualHeight);
  const neededPadding = Math.max(0, Math.ceil((minSize - minVisualDim) / 2));
  const currentPadding = typeof obj.padding === 'number' ? obj.padding : 0;
  const effectivePadding = Math.max(currentPadding, neededPadding);

  obj.padding = effectivePadding;
  obj.touchHitboxSize = Math.max(minSize, minVisualDim + effectivePadding * 2);
  if (!obj.data || typeof obj.data !== 'object') obj.data = {};
  obj.data.touchHitboxSize = obj.touchHitboxSize;

  return {
    width: Math.max(minSize, visualWidth + effectivePadding * 2),
    height: Math.max(minSize, visualHeight + effectivePadding * 2),
    padding: effectivePadding,
  };
}

/**
 * Determina si un objeto pequeño es una herramienta puntual (cono, platillo, pica, aro, balón, etc.).
 *
 * @param {Object} obj
 * @returns {boolean}
 */
export function isCompactTacticalTool(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const layer = classifyBoardObjectLayer(obj);
  if (layer !== BOARD_LAYERS.TOOLS) return false;
  const itemId = String(obj.data?.itemId || obj.data?.matType || obj.itemId || '').toLowerCase();
  if (SMALL_TOOL_IDS.has(itemId)) return true;
  const { visualWidth, visualHeight } = getObjectGeometry(obj);
  return Math.max(visualWidth, visualHeight) <= 56;
}

/**
 * Comprueba si el punto `(px, py)` cae dentro del área interactiva de `obj`,
 * garantizando el hitbox mínimo de 48x48 dp para jugadores, balones y herramientas.
 *
 * @param {Object} obj
 * @param {{ x: number, y: number }} pointer
 * @param {number} [minTouchSize=MIN_TOUCH_TARGET_DP]
 * @returns {{ hit: boolean, distance: number, hitRadius: number, visualRadius: number, area: number, isBorderHit: boolean }}
 */
export function evaluatePointerHitOnObject(obj, pointer, minTouchSize = MIN_TOUCH_TARGET_DP) {
  if (!obj || !pointer || obj.visible === false || obj.selectable === false || obj.evented === false) {
    return { hit: false, distance: Infinity, hitRadius: 0, visualRadius: 0, area: Infinity, isBorderHit: false };
  }

  const layer = classifyBoardObjectLayer(obj);
  if (layer === BOARD_LAYERS.FIELD || layer === BOARD_LAYERS.UI_OVERLAY) {
    return { hit: false, distance: Infinity, hitRadius: 0, visualRadius: 0, area: Infinity, isBorderHit: false };
  }

  const px = Number(pointer.x ?? 0);
  const py = Number(pointer.y ?? 0);
  const { cx, cy, visualWidth, visualHeight, visualRadius } = getObjectGeometry(obj);
  const dist = Math.hypot(px - cx, py - cy);
  const area = Math.max(1, visualWidth * visualHeight);

  // Caso 1: Formas / zonas tácticas (cuadrados, rectángulos, círculos de zona)
  if (layer === BOARD_LAYERS.SHAPES) {
    const halfW = visualWidth / 2;
    const halfH = visualHeight / 2;
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    const hitTolerance = 8;
    const insideRect = dx <= halfW + hitTolerance && dy <= halfH + hitTolerance;
    if (!insideRect) {
      return { hit: false, distance: dist, hitRadius: Math.max(halfW, halfH), visualRadius, area, isBorderHit: false };
    }
    const nearEdge =
      Math.abs(dx - halfW) <= 14 ||
      Math.abs(dy - halfH) <= 14;
    return {
      hit: true,
      distance: dist,
      hitRadius: Math.max(halfW, halfH),
      visualRadius,
      area,
      isBorderHit: nearEdge,
    };
  }

  // Caso 2: Jugadores, balón y herramientas compactas (conos, platillos, picas, etc.) -> Hitbox mínimo 48x48 dp
  const hitbox = ensureMinTouchHitbox(obj, minTouchSize);
  const halfHitW = Math.max(minTouchSize / 2, hitbox.width / 2);
  const halfHitH = Math.max(minTouchSize / 2, hitbox.height / 2);
  const hitRadius = Math.max(minTouchSize / 2, Math.min(halfHitW, halfHitH));

  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  const insideBox = dx <= halfHitW && dy <= halfHitH;
  const insideCircle = dist <= hitRadius;

  if (!insideBox && !insideCircle) {
    return { hit: false, distance: dist, hitRadius, visualRadius, area, isBorderHit: false };
  }

  return {
    hit: true,
    distance: dist,
    hitRadius,
    visualRadius,
    area,
    isBorderHit: false,
  };
}

/**
 * Calcula una etiqueta legible para el selector rápido de solape (long-press).
 *
 * @param {Object} obj
 * @param {boolean} [isEn=false]
 * @returns {string}
 */
export function getBoardObjectDisplayLabel(obj, isEn = false) {
  if (!obj) return isEn ? 'Element' : 'Elemento';
  const layer = classifyBoardObjectLayer(obj);
  if (layer === BOARD_LAYERS.PLAYERS) {
    const num = obj.data?.label || obj.label || '';
    const pType = obj.data?.playerType || 'local';
    const teamTag =
      pType === 'rival'
        ? (isEn ? 'Opponent' : 'Rival')
        : (pType === 'joker' ? (isEn ? 'Joker' : 'Comodín') : (isEn ? 'Player' : 'Jugador'));
    return num ? `${teamTag} #${num}` : teamTag;
  }
  if (layer === BOARD_LAYERS.BALL) {
    return isEn ? 'Ball' : 'Balón';
  }
  if (layer === BOARD_LAYERS.SHAPES) {
    return isEn ? 'Tactical Zone / Shape' : 'Zona / Forma Táctica';
  }
  const itemId = String(obj.data?.itemId || obj.data?.matType || obj.itemId || '').toLowerCase();
  const namesEs = {
    cono: 'Cono',
    cono_alto: 'Cono Alto',
    platillo: 'Platillo',
    pica: 'Pica',
    valla: 'Valla',
    escalera: 'Escalera',
    maniqui: 'Maniquí',
    porteria: 'Mini Portería',
    aro: 'Aro',
    banderin: 'Banderín',
  };
  const namesEn = {
    cono: 'Cone',
    cono_alto: 'Tall Cone',
    platillo: 'Disc Cone',
    pica: 'Pole',
    valla: 'Hurdle',
    escalera: 'Agility Ladder',
    maniqui: 'Mannequin',
    porteria: 'Mini Goal',
    aro: 'Hoop',
    banderin: 'Corner Flag',
  };
  return (isEn ? namesEn[itemId] : namesEs[itemId]) || (isEn ? 'Tactical Tool' : 'Material / Herramienta');
}

/**
 * Resuelve el mejor objeto candidato bajo el puntero `(pointer.x, pointer.y)` y devuelve
 * también la lista ordenada de candidatos y si existe solape ambiguo (para long-press picker).
 *
 * Algoritmo de priorización:
 * 1. Filtra por `selectionMode`:
 *    - `'players'`: solo `PLAYERS` y `BALL`.
 *    - `'tools'`: solo `TOOLS` y `SHAPES` (ignora jugadores para manipular conos debajo de ellos).
 *    - `'auto'`: considera todos, pero las formas de fondo (`SHAPES`) nunca bloquean a
 *      `PLAYERS`, `BALL` ni `TOOLS` (una forma solo gana si no hay jugador/balón/cono bajo el tap).
 * 2. Entre piezas puntuales solapadas (ej. Cono vs. Jugador en modo `'auto'`):
 *    - Si el tap cae directamente sobre el centro del cono (`dist_cono <= cono.visualRadius * 1.15`)
 *      y está más cerca del centro del cono que del centro del jugador (`dist_cono < dist_jugador`),
 *      **gana el Cono** aunque el jugador esté en una capa z-order superior (`PLAYERS > TOOLS`).
 *    - Si el tap cae sobre el torso del jugador (`dist_jugador <= jugador.visualRadius * 0.95`
 *      y `dist_jugador <= dist_cono`), **gana el Jugador**.
 *    - Si el tap cae en el anillo exterior del hitbox de 48dp del cono y fuera del círculo visual
 *      del jugador (`dist_jugador > jugador.visualRadius * 1.05` y `dist_cono < dist_jugador`),
 *      **gana el Cono**.
 *
 * @param {Object} canvas - Instancia de `fabric.Canvas` o `{ getObjects: () => Array }`
 * @param {{ x: number, y: number }} pointer
 * @param {Object} [options={}]
 * @param {'auto'|'players'|'tools'} [options.selectionMode='auto']
 * @param {string|null} [options.lastSelectedId=null]
 * @param {number} [options.minTouchSize=MIN_TOUCH_TARGET_DP]
 * @param {boolean} [options.isEn=false]
 * @returns {{
 *   target: Object|null,
 *   candidates: Array<{ obj: Object, layer: number, score: number, distance: number, label: string }>,
 *   isAmbiguousOverlap: boolean
 * }}
 */
export function resolveBoardTargetAtPointer(canvas, pointer, options = {}) {
  if (!canvas || typeof canvas.getObjects !== 'function' || !pointer) {
    return { target: null, candidates: [], isAmbiguousOverlap: false };
  }

  const selectionMode = options.selectionMode || BOARD_SELECTION_MODES.AUTO;
  const lastSelectedId = options.lastSelectedId || null;
  const minTouchSize = typeof options.minTouchSize === 'number' ? options.minTouchSize : MIN_TOUCH_TARGET_DP;
  const isEn = Boolean(options.isEn);

  const rawObjects = canvas.getObjects();
  const hits = [];

  for (const obj of rawObjects) {
    const layer = classifyBoardObjectLayer(obj);
    if (layer === BOARD_LAYERS.FIELD || layer === BOARD_LAYERS.UI_OVERLAY) continue;

    // Filtro por modo explícito
    if (selectionMode === BOARD_SELECTION_MODES.PLAYERS) {
      if (layer !== BOARD_LAYERS.PLAYERS && layer !== BOARD_LAYERS.BALL) continue;
    } else if (selectionMode === BOARD_SELECTION_MODES.TOOLS) {
      if (layer !== BOARD_LAYERS.TOOLS && layer !== BOARD_LAYERS.SHAPES) continue;
    }

    const evalHit = evaluatePointerHitOnObject(obj, pointer, minTouchSize);
    if (!evalHit.hit) continue;

    hits.push({
      obj,
      layer,
      distance: evalHit.distance,
      hitRadius: evalHit.hitRadius,
      visualRadius: evalHit.visualRadius,
      area: evalHit.area,
      isBorderHit: evalHit.isBorderHit,
      isCompactTool: isCompactTacticalTool(obj),
      label: getBoardObjectDisplayLabel(obj, isEn),
    });
  }

  if (hits.length === 0) {
    return { target: null, candidates: [], isAmbiguousOverlap: false };
  }

  // En modo AUTO o TOOLS, si hay al menos una pieza táctica (PLAYERS, BALL o TOOLS) bajo el puntero,
  // las formas de fondo (SHAPES: cuadrados, zonas) quedan relegadas debajo de las piezas
  const hasForegroundPiece = hits.some(
    h => h.layer === BOARD_LAYERS.PLAYERS || h.layer === BOARD_LAYERS.BALL || h.layer === BOARD_LAYERS.TOOLS
  );

  // Calcular score para cada candidato
  const scored = hits.map(h => {
    let score = 0;

    if (h.layer === BOARD_LAYERS.SHAPES) {
      // Las formas tienen prioridad baja si hay un jugador, balón o cono en ese punto
      score = hasForegroundPiece ? 50 : 300;
      if (h.isBorderHit) score += 40;
      score -= Math.min(40, h.distance * 0.1);
      return { ...h, score };
    }

    // Base por tipo de pieza en primer plano
    if (h.layer === BOARD_LAYERS.BALL) {
      score += 520;
    } else if (h.layer === BOARD_LAYERS.PLAYERS) {
      score += 500;
    } else if (h.layer === BOARD_LAYERS.TOOLS) {
      score += 490;
    }

    // Proximidad normalizada al centro de la pieza (0..220 pts)
    const normDist = Math.max(0, 1 - h.distance / Math.max(1, h.hitRadius));
    score += normDist * 220;

    // Bonus de impacto directo en el núcleo visual de la pieza
    if (h.distance <= h.visualRadius * 1.05) {
      score += 140;
      // Especificidad por menor área: un cono (radio ~8px, área ~250px²) cuyo centro ha sido tocado
      // recibe un bonus de precisión frente a una ficha más grande cuyo centro está más lejos
      if (h.isCompactTool) {
        score += 55;
      }
    } else if (h.isCompactTool && h.distance <= minTouchSize / 2) {
      // Toque dentro del hitbox de 48dp de una herramienta compacta
      score += 35;
    }

    // Pequeño desempate si fue la última pieza interactuada
    const objId = h.obj.id || h.obj.data?.id || null;
    if (lastSelectedId && objId && String(objId) === String(lastSelectedId)) {
      score += 8;
    }

    return { ...h, score };
  });

  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    return a.distance - b.distance;
  });

  // Detectar si hay solape ambiguo entre los 2 primeros candidatos de primer plano (ej. jugador y cono muy juntos)
  const foregroundCandidates = scored.filter(c => c.layer !== BOARD_LAYERS.SHAPES);
  const isAmbiguousOverlap =
    foregroundCandidates.length >= 2 &&
    foregroundCandidates[0].layer !== foregroundCandidates[1].layer &&
    Math.abs(foregroundCandidates[0].distance - foregroundCandidates[1].distance) <= 18;

  return {
    target: scored[0].obj,
    candidates: scored,
    isAmbiguousOverlap: Boolean(isAmbiguousOverlap || (scored.length >= 2 && foregroundCandidates.length >= 2)),
  };
}

/**
 * Instala el selector inteligente en una instancia de `fabric.Canvas` envolviendo `canvas.findTarget`
 * para que tanto la selección como el arrastre inmediato (`_setupCurrentTransform` de Fabric)
 * operen sobre el candidato ganador de `resolveBoardTargetAtPointer` en un solo gesto táctil.
 *
 * @param {Object} canvas - Instancia de `fabric.Canvas`
 * @param {Function} [getOptions] - Callback que retorna `{ selectionMode, lastSelectedId, isEn, isDrawingToolActive }`
 * @returns {Function} Función de limpieza para restaurar `findTarget` original
 */
export function installSmartBoardSelection(canvas, getOptions = () => ({})) {
  if (!canvas || typeof canvas.findTarget !== 'function') {
    return () => {};
  }

  const originalFindTarget = canvas.findTarget.bind(canvas);

  canvas.findTarget = function smartFindTarget(e, skipGroup) {
    const opts = typeof getOptions === 'function' ? getOptions() || {} : {};

    // Si hay una herramienta de dibujo activa (línea, flecha, zona, trazo libre), delegar al comportamiento nativo
    if (opts.isDrawingToolActive) {
      return originalFindTarget(e, skipGroup);
    }

    // 1. Si hay un objeto activo y el usuario está pulsando sobre uno de sus controles de transformación (__corner),
    // respetar el objeto activo para permitir escalar/rotar/borrar con los handles de Mister11
    const activeObj = typeof canvas.getActiveObject === 'function' ? canvas.getActiveObject() : null;
    if (activeObj && e && typeof activeObj._findTargetCorner === 'function' && typeof canvas.getPointer === 'function') {
      try {
        const ptr = canvas.getPointer(e, true);
        const corner = activeObj._findTargetCorner(ptr, canvas._isTouchEvent ? canvas._isTouchEvent(e) : false);
        if (corner) {
          return activeObj;
        }
      } catch (_) {}
    }

    // 2. Obtener coordenadas del puntero en espacio de canvas
    let pointer = null;
    if (typeof canvas.getPointer === 'function' && e) {
      try {
        pointer = canvas.getPointer(e);
      } catch (_) {}
    }
    if (!pointer && e && typeof e.x === 'number' && typeof e.y === 'number') {
      pointer = { x: e.x, y: e.y };
    }

    if (!pointer) {
      return originalFindTarget(e, skipGroup);
    }

    const resolved = resolveBoardTargetAtPointer(canvas, pointer, {
      selectionMode: opts.selectionMode || BOARD_SELECTION_MODES.AUTO,
      lastSelectedId: opts.lastSelectedId || null,
      isEn: Boolean(opts.isEn),
    });

    if (resolved && resolved.target) {
      return resolved.target;
    }

    return originalFindTarget(e, skipGroup);
  };

  return () => {
    canvas.findTarget = originalFindTarget;
  };
}
