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
