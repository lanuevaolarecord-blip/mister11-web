/**
 * src/utils/boardLayers.js
 * MÍSTER 11 — HOTFIX-10.1 (E3 — Parte A: Z-Order / Capas en Pizarra Táctica)
 *
 * Jerarquía fija y determinista de capas para el canvas de PizarraTactica:
 *   FIELD (0) < SHAPES (20) < TOOLS (30) < PLAYERS (40) < BALL (50) < UI_OVERLAY (60)
 *
 * Garantiza que al insertar o seleccionar cualquier forma/zona (cuadrado, rectángulo,
 * círculo, polígono), los jugadores, el balón y los conos/herramientas NUNCA queden
 * enterrados debajo de la forma.
 */

export const BOARD_LAYERS = Object.freeze({
  FIELD: 0,
  SHAPES: 20,      // cuadrados, rectángulos, círculos, zonas sombreadas, polígonos
  TOOLS: 30,       // conos, platillos, picas, vallas, escaleras, maniquíes, porterías, líneas, flechas
  PLAYERS: 40,     // fichas de jugadores (local, rival, comodín)
  BALL: 50,        // balón reglamentario
  UI_OVERLAY: 60,  // cursores fantasma, handles o indicadores temporales
});

const SHAPE_IDS = new Set([
  'zona_rectangular',
  'zone_rect',
  'zone_circle',
  'zone_polygon',
  'rect_zone',
  'circle_zone',
  'polygon_zone',
  'square',
  'rectangle',
  'cuadrado',
]);

/**
 * Clasifica cualquier objeto de Fabric.js en su capa canónica `BOARD_LAYERS`.
 *
 * @param {Object} obj - Objeto del canvas Fabric
 * @returns {number} Nivel de capa en `BOARD_LAYERS`
 */
export function classifyBoardObjectLayer(obj) {
  if (!obj || typeof obj !== 'object') return BOARD_LAYERS.TOOLS;

  // 1. Capa de campo / césped / líneas de cal de fondo
  if (
    obj.isField ||
    obj.data?.isField ||
    obj.data?.type === 'field' ||
    obj.category === 'field'
  ) {
    return BOARD_LAYERS.FIELD;
  }

  // 2. Capa de UI Overlay temporal (ej. ghost cursor al colocar material)
  if (
    obj.data?.type === 'temp' ||
    obj.data?.type === 'ui_overlay' ||
    obj.isUiOverlay
  ) {
    return BOARD_LAYERS.UI_OVERLAY;
  }

  // 3. Balón (siempre por encima de jugadores y formas)
  const itemId = String(obj.data?.itemId || obj.data?.matType || obj.itemId || '').toLowerCase();
  if (
    obj.isBall ||
    obj.id === 'ball' ||
    obj.category === 'ball' ||
    obj.data?.type === 'ball' ||
    obj.data?.category === 'ball' ||
    itemId === 'balon' ||
    itemId === 'ball'
  ) {
    return BOARD_LAYERS.BALL;
  }

  // 4. Jugadores (locales, rivales, comodines)
  const isPlayerGroup =
    obj.type === 'group' &&
    typeof obj.getObjects === 'function' &&
    obj.getObjects().length === 2 &&
    obj.getObjects().some(c => c.type === 'circle') &&
    obj.getObjects().some(c => c.type === 'text');

  if (
    obj.isPlayerPiece ||
    obj.category === 'player' ||
    obj.data?.type === 'player' ||
    obj.data?.tipo === 'jugador' ||
    obj.data?.category === 'player' ||
    isPlayerGroup
  ) {
    return BOARD_LAYERS.PLAYERS;
  }

  // 5. Formas / Zonas tácticas (cuadrados, rectángulos, elipses de zona, polígonos de zona, trayectorias de fondo)
  const toolType = String(obj.data?.tool || obj.data?.subType || '').toLowerCase();
  if (
    obj.isTrajectory ||
    obj.category === 'trajectory' ||
    obj.data?.type === 'trajectory' ||
    SHAPE_IDS.has(itemId) ||
    SHAPE_IDS.has(toolType) ||
    toolType.startsWith('zone_') ||
    itemId.startsWith('zona_') ||
    (obj.data?.type === 'drawing' && (obj.type === 'rect' || obj.type === 'ellipse' || obj.type === 'polygon'))
  ) {
    return BOARD_LAYERS.SHAPES;
  }

  // Si ya tenía un boardLayer explícito válido, respetarlo
  if (typeof obj.boardLayer === 'number') {
    return obj.boardLayer;
  }
  if (typeof obj.data?.boardLayer === 'number') {
    return obj.data.boardLayer;
  }

  // 6. Herramientas y materiales (conos, platillos, picas, vallas, escaleras, flechas, líneas, texto)
  return BOARD_LAYERS.TOOLS;
}

/**
 * Asigna explícitamente la capa canónica a un objeto del canvas.
 *
 * @param {Object} obj
 * @param {number} [layer] - Capa en `BOARD_LAYERS` (si se omite, se infiere con `classifyBoardObjectLayer`)
 * @returns {Object} El mismo objeto con `boardLayer` y `zIndex` actualizados
 */
export function setBoardLayer(obj, layer) {
  if (!obj || typeof obj !== 'object') return obj;
  const resolvedLayer = typeof layer === 'number' ? layer : classifyBoardObjectLayer(obj);
  obj.boardLayer = resolvedLayer;
  obj.zIndex = resolvedLayer;
  if (!obj.data || typeof obj.data !== 'object') {
    obj.data = {};
  }
  obj.data.boardLayer = resolvedLayer;
  return obj;
}

/**
 * Reordena todos los objetos del canvas respetando estrictamente `BOARD_LAYERS`:
 *   FIELD (0) < SHAPES (20) < TOOLS (30) < PLAYERS (40) < BALL (50) < UI_OVERLAY (60)
 *
 * Preserva el orden relativo dentro de una misma capa (estabilidad de inserción).
 * También activa `canvas.preserveObjectStacking = true` para que Fabric.js nunca
 * eleve una forma (`SHAPES`) por encima de los jugadores al seleccionarla.
 *
 * @param {Object} canvas - Instancia de `fabric.Canvas` o mock compatible
 * @returns {Array<Object>} Lista de objetos ordenados
 */
export function reorderBoardCanvas(canvas) {
  if (!canvas || typeof canvas.getObjects !== 'function') return [];

  canvas.preserveObjectStacking = true;

  const currentObjects = [...canvas.getObjects()];
  if (currentObjects.length === 0) return [];

  // Asignar capa a cada objeto y ordenar de menor a mayor manteniendo estabilidad (index original)
  const decorated = currentObjects.map((obj, index) => {
    const layer = classifyBoardObjectLayer(obj);
    setBoardLayer(obj, layer);
    return { obj, layer, index };
  });

  decorated.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer - b.layer;
    return a.index - b.index;
  });

  const sortedObjects = decorated.map(d => d.obj);

  // Si el canvas expone `_objects` (Fabric.js estándar), reordenar en sitio y mover con moveTo si existe
  if (Array.isArray(canvas._objects)) {
    canvas._objects.length = 0;
    sortedObjects.forEach((obj, idx) => {
      obj.zOrderIndex = idx;
      canvas._objects.push(obj);
    });
  } else if (typeof canvas.moveTo === 'function') {
    sortedObjects.forEach((obj, idx) => {
      obj.zOrderIndex = idx;
      canvas.moveTo(obj, idx);
    });
  } else if (typeof canvas.bringToFront === 'function') {
    // Fallback por pasadas separadas por capa (nunca en un solo forEach mezclado)
    const layersOrder = [
      BOARD_LAYERS.FIELD,
      BOARD_LAYERS.SHAPES,
      BOARD_LAYERS.TOOLS,
      BOARD_LAYERS.PLAYERS,
      BOARD_LAYERS.BALL,
      BOARD_LAYERS.UI_OVERLAY,
    ];
    let orderIdx = 0;
    for (const targetLayer of layersOrder) {
      for (const { obj, layer } of decorated) {
        if (layer === targetLayer) {
          obj.zOrderIndex = orderIdx++;
          canvas.bringToFront(obj);
        }
      }
    }
  }

  if (typeof canvas.requestRenderAll === 'function') {
    canvas.requestRenderAll();
  } else if (typeof canvas.renderAll === 'function') {
    canvas.renderAll();
  }

  return sortedObjects;
}
