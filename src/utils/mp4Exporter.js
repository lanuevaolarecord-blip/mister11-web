/**
 * mp4Exporter.js
 * MÍSTER11 — Exportador Determinista MP4/WebM (FIX 4)
 * 
 * Orquesta la captura determinista fotograma a fotograma con progreso real (0-100%),
 * watchdog individual por captura (5s), pausa mínima de refresco entre frames (16ms),
 * y codificación final a video Blob descargable.
 */

import { createAnimationEngine } from './animationEngine.js';
import { captureFrameWithRetry, getSupportedVideoMimeType, packageVideoBlob } from './videoEncoder.js';

/**
 * Exporta una animación de la pizarra a MP4 de forma determinista
 * @param {Object} params
 * @param {fabric.Canvas} params.fc Instancia activa de Fabric
 * @param {FieldRenderer} params.fr Instancia activa de FieldRenderer
 * @param {HTMLCanvasElement} params.fieldCanvas Canvas HTML del terreno de juego
 * @param {Array} params.frames Lista de keyframes de la animación
 * @param {string} params.planId Identificador del plan/ejercicio
 * @param {Function} params.onProgress Callback (percent, currentFrame, totalFrames)
 * @param {Function} params.onStatus Callback (messageString)
 * @returns {Promise<{ blob: Blob, filename: string, mimeType: string, base64data: string, dataURL: string }>}
 */
export async function exportAnimationMP4({
  fc,
  fr,
  fieldCanvas,
  frames = [],
  planId = 'export',
  onProgress = null,
  onStatus = null
}) {
  if (!fc || !fieldCanvas || !frames || frames.length < 2) {
    throw new Error('Se requieren al menos 2 frames para exportar una animación');
  }

  const { mimeType, extension } = getSupportedVideoMimeType();
  const animationEngine = createAnimationEngine({
    fc,
    fr,
    fieldCanvas,
    frames,
    scale: 2
  });

  // Pasos por cada transición de keyframe para una animación fluida a 10 fps
  const stepsPerTransition = 6;
  const numTransitions = frames.length - 1;
  const totalSteps = numTransitions * stepsPerTransition + 1;

  const recCanvas = animationEngine.getCompositeCanvas();
  const stream = recCanvas.captureStream ? recCanvas.captureStream(15) : null;

  if (!stream) {
    throw new Error('captureStream no soportado en este navegador');
  }

  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6000000
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  const videoTrack = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;

  // Bucle determinista frame a frame
  for (let step = 0; step < totalSteps; step++) {
    // Calcular keyframes origen y destino y el factor de interpolación
    const transitionIndex = Math.min(Math.floor(step / stepsPerTransition), numTransitions - 1);
    const subStep = step % stepsPerTransition;
    const progressInTransition = subStep / stepsPerTransition;

    const fromIdx = transitionIndex;
    const toIdx = Math.min(transitionIndex + 1, frames.length - 1);

    // Watchdog individual de 5 segundos con hasta 2 reintentos
    await captureFrameWithRetry(async () => {
      if (subStep === 0) {
        await animationEngine.renderFrame(fromIdx);
      } else {
        await animationEngine.renderInterpolatedStep(fromIdx, toIdx, progressInTransition);
      }

      // Si el track permite forzar captura de frame individual, solicitarlo
      if (videoTrack && typeof videoTrack.requestFrame === 'function') {
        videoTrack.requestFrame();
      }
    }, 2, 5000);

    // Pausa para ceder el hilo y asegurar el renderizado
    await new Promise((r) => setTimeout(r, 65));

    // Progreso REAL 0 -> 100%
    const currentPercent = Math.min(99, Math.round(((step + 1) / totalSteps) * 100));
    if (typeof onProgress === 'function') {
      onProgress(currentPercent, step + 1, totalSteps);
    }
    if (typeof onStatus === 'function') {
      onStatus(`Exportando frame ${step + 1} de ${totalSteps} (${currentPercent}%)`);
    }
  }

  // Detener grabación de stream
  await new Promise((resolve) => {
    recorder.onstop = () => resolve();
    try {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        resolve();
      }
    } catch (_) {
      resolve();
    }
  });

  if (typeof onStatus === 'function') {
    onStatus('Empaquetando video final...');
  }

  // Empaquetar video a Blob final
  const blob = await packageVideoBlob(chunks, mimeType, (workerProgress) => {
    if (typeof onProgress === 'function') {
      onProgress(Math.min(100, Math.max(90, workerProgress)), totalSteps, totalSteps);
    }
  });

  if (typeof onProgress === 'function') {
    onProgress(100, totalSteps, totalSteps);
  }

  // Convertir a DataURL y base64
  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const base64data = String(dataURL).split(',')[1] || '';
  const filename = `animacion-mister11-${planId || 'pizarra'}.${extension}`;

  return {
    blob,
    filename,
    mimeType,
    base64data,
    dataURL
  };
}

export default exportAnimationMP4;
