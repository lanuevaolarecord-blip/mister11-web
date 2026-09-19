/**
 * animationEngine.js
 * MÍSTER11 — Motor de Animación y Renderizado Determinista (FIX 4)
 * 
 * Permite renderizar cada keyframe (o fotograma interpolado) de manera 100%
 * determinista, pausando la reproducción en vivo, eliminando dependencias de rAF
 * y de relojes globales, y retornando una Promise que se resuelve exactamente
 * cuando el renderizado sobre el canvas compuesto ha terminado.
 */

import { fabric } from 'fabric';
import {
  WHITEBOARD_CONFIG,
  getPlayerCircleRadius,
  getPlayerFontSize,
  getPlayerBorderWidth
} from '../config/whiteboardConfig.js';

const CANVAS_REF_WIDTH = 380;
const CANVAS_REF_HEIGHT = 520;

/**
 * Normaliza y devuelve el identificador de un objeto Fabric para interpolación
 */
export function getObjectIdentifier(obj) {
  if (!obj) return null;
  const d = obj.data || {};
  if (d.id) return String(d.id);
  if (obj.id) return String(obj.id);
  if (d.type === 'player' || d.tipo === 'jugador') {
    return `player_${d.playerType || 'local'}_${d.label || '0'}`;
  }
  if (d.type === 'material' || d.tipo === 'material' || d.isMaterial) {
    return `material_${d.matType || d.itemId || 'item'}_${d.materialIndex ?? obj.id ?? ''}`;
  }
  return null;
}

/**
 * Crea una instancia del motor de animación determinista para exportación
 */
export function createAnimationEngine({
  fc,
  fr,
  fieldCanvas,
  frames = [],
  compositeCanvas = null,
  scale = 2
}) {
  let isPaused = false;

  // Canvas compuesto donde se unen césped + Fabric
  const outputCanvas = compositeCanvas || document.createElement('canvas');
  outputCanvas.width = (fc?.width || 800) * scale;
  outputCanvas.height = (fc?.height || 533) * scale;
  const outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';

  /**
   * Pausa cualquier reproducción en vivo activa
   */
  function pauseLivePlayback() {
    isPaused = true;
  }

  /**
   * Pinta el estado combinado en outputCanvas (Césped + Objetos)
   */
  function paintComposite() {
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    if (fieldCanvas && fieldCanvas.width > 0) {
      outputCtx.drawImage(fieldCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
    }
    const fabricCanvasElem = fc?.getElement ? fc.getElement() : null;
    if (fabricCanvasElem && fabricCanvasElem.width > 0) {
      outputCtx.drawImage(fabricCanvasElem, 0, 0, outputCanvas.width, outputCanvas.height);
    }
  }

  /**
   * Carga y renderiza el keyframe i de forma determinista
   * @param {number} frameIndex Índice del keyframe (0 .. frames.length - 1)
   * @returns {Promise<HTMLCanvasElement>} Canvas compuesto listo para capturar
   */
  function renderFrame(frameIndex) {
    return new Promise((resolve, reject) => {
      pauseLivePlayback();

      if (!fc || !fr) {
        return reject(new Error('Canvas o FieldRenderer no inicializado'));
      }

      const frameData = frames[frameIndex];
      if (!frameData) {
        return reject(new Error(`Keyframe ${frameIndex} no encontrado`));
      }

      const state = (typeof frameData.state === 'string')
        ? JSON.parse(frameData.state)
        : (frameData.state || { objects: [] });

      const objsToEnliven = Array.isArray(state.objects) ? state.objects : [];

      fc.clear();

      if (objsToEnliven.length === 0) {
        fc.renderAll();
        paintComposite();
        return resolve(outputCanvas);
      }

      const targetRadius = getPlayerCircleRadius(fc.width);
      const borderWidth = getPlayerBorderWidth(targetRadius);
      const targetFontSize = getPlayerFontSize(targetRadius);
      const touchPadding = WHITEBOARD_CONFIG.touchTarget.getPadding(targetRadius);

      const enlivenedData = objsToEnliven.map((objData) => {
        let left, top, visible = true;

        if (objData.xRel !== undefined && objData.yRel !== undefined) {
          const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
          left = point.x;
          top = point.y;
          visible = (
            point.x >= -20 &&
            point.x <= fc.width + 20 &&
            point.y >= -20 &&
            point.y <= fc.height + 20
          );
        } else {
          left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
          top = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
        }

        let radius = objData.radius || targetRadius;
        if (objData.radiusRel !== undefined) {
          radius = objData.radiusRel * Math.min(fc.width, fc.height);
        }

        return { ...objData, left, top, radius, visible };
      });

      fabric.util.enlivenObjects(enlivenedData, (objects) => {
        try {
          objects.forEach((o, objIdx) => {
            if (!o.data && enlivenedData[objIdx]?.data) {
              o.data = { ...enlivenedData[objIdx].data };
            }
            if (!o.id && enlivenedData[objIdx]?.id) {
              o.id = enlivenedData[objIdx].id;
            }

            const isPlayer = o.data?.type === 'player' || 
                             o.data?.tipo === 'jugador' || 
                             (o.type === 'group' && 
                              o.getObjects && 
                              o.getObjects().length === 2 && 
                              o.getObjects().some(child => child.type === 'circle') && 
                              o.getObjects().some(child => child.type === 'text'));

            if (isPlayer && o.type === 'group') {
              const circle = o.getObjects().find(c => c.type === 'circle');
              const text = o.getObjects().find(c => c.type === 'text');
              if (circle) {
                circle.set({
                  radius: targetRadius,
                  stroke: '#FFFFFF',
                  strokeWidth: borderWidth,
                  dirty: true
                });
              }
              if (text) {
                text.set({
                  fontSize: targetFontSize,
                  fill: '#FFFFFF',
                  dirty: true
                });
              }
              o.set({
                padding: touchPadding,
                scaleX: 1,
                scaleY: 1,
                dirty: true
              });
              o._calcBounds(true);
              o.setCoords();
            }

            fc.add(o);
          });

          fc.renderAll();
          paintComposite();
          resolve(outputCanvas);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Renderiza una transición suave interpolando entre keyframe A y keyframe B
   * @param {number} fromIndex Índice frame origen
   * @param {number} toIndex Índice frame destino
   * @param {number} progress Progreso de 0.0 a 1.0
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function renderInterpolatedStep(fromIndex, toIndex, progress) {
    if (progress <= 0) return renderFrame(fromIndex);
    if (progress >= 1) return renderFrame(toIndex);

    // Cargar frame A como base
    await renderFrame(fromIndex);

    const frameB = frames[toIndex];
    if (!frameB) return outputCanvas;

    const stateB = (typeof frameB.state === 'string')
      ? JSON.parse(frameB.state)
      : (frameB.state || { objects: [] });

    const rawTargets = Array.isArray(stateB.objects) ? stateB.objects : [];
    const targetsByKey = new Map();

    rawTargets.forEach((objData, i) => {
      let left, top;
      if (objData.xRel !== undefined && objData.yRel !== undefined) {
        const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
        left = point.x;
        top = point.y;
      } else {
        left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
        top = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
      }
      const id = getObjectIdentifier(objData) || `idx_${i}`;
      targetsByKey.set(id, { left, top });
    });

    // Desplazar objetos linealmente de su pos inicial a la pos destino
    const animatableObjs = fc.getObjects().filter(o => 
      o.type !== 'field' && o.data?.type !== 'field' && o.data?.type !== 'background'
    );

    animatableObjs.forEach((obj, idx) => {
      const objId = getObjectIdentifier(obj) || `idx_${idx}`;
      const target = targetsByKey.get(objId);
      if (target) {
        const currentLeft = obj.left || 0;
        const currentTop = obj.top || 0;
        obj.set({
          left: currentLeft + (target.left - currentLeft) * progress,
          top: currentTop + (target.top - currentTop) * progress
        });
        obj.setCoords();
      }
    });

    fc.renderAll();
    paintComposite();
    return outputCanvas;
  }

  return {
    pauseLivePlayback,
    renderFrame,
    renderInterpolatedStep,
    getCompositeCanvas: () => outputCanvas,
    getTotalKeyframes: () => frames.length
  };
}

export default createAnimationEngine;
