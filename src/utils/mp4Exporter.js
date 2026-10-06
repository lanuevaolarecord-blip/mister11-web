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
 * Devuelve las dimensiones de video y bitrate recomendados según la calidad y orientación
 */
export function getVideoDimensions(quality = '1080p', orientation = 'landscape') {
  const isPortrait = orientation === 'portrait';
  let width = 1920;
  let height = 1080;
  let bitrate = 12000000;

  const q = String(quality || '1080p').toLowerCase();
  if (q.includes('720')) {
    width = 1280;
    height = 720;
    bitrate = 5000000;
  } else if (q.includes('1080')) {
    width = 1920;
    height = 1080;
    bitrate = 12000000;
  } else if (q.includes('2k') || q.includes('1440')) {
    width = 2560;
    height = 1440;
    bitrate = 20000000;
  } else if (q.includes('4k') || q.includes('2160')) {
    width = 3840;
    height = 2160;
    bitrate = 35000000;
  }

  if (isPortrait) {
    const tmp = width;
    width = height;
    height = tmp;
  }

  return { width, height, bitrate };
}

/**
 * Calcula la duración objetivo y pasos de transición según frames y velocidad
 */
export function calculateAnimationTiming(framesCount, speed = '1x', targetFps = 25) {
  const speedFactor = speed === '0.5x' ? 0.5 : speed === '2x' ? 2 : speed === '4x' ? 4 : 1;
  const numTransitions = Math.max(1, framesCount - 1);
  const baseSec = Math.max(2, (framesCount - 1) * 0.8);
  const totalDurationSec = parseFloat(Math.max(1, baseSec / speedFactor).toFixed(1));
  const transitionDurationSec = totalDurationSec / numTransitions;

  const stepsPerTransition = Math.max(5, Math.round(transitionDurationSec * targetFps));
  const totalSteps = numTransitions * stepsPerTransition + 1;
  const stepIntervalMs = (totalDurationSec * 1000) / (totalSteps - 1);

  return {
    speedFactor,
    numTransitions,
    totalDurationSec,
    transitionDurationSec,
    stepsPerTransition,
    totalSteps,
    stepIntervalMs,
    targetFps
  };
}

/**
 * Exporta una animación de la pizarra a MP4 de forma determinista con calidad y velocidad seleccionadas
 * @param {Object} params
 * @param {fabric.Canvas} params.fc Instancia activa de Fabric
 * @param {FieldRenderer} params.fr Instancia activa de FieldRenderer
 * @param {HTMLCanvasElement} params.fieldCanvas Canvas HTML del terreno de juego
 * @param {Array} params.frames Lista de keyframes de la animación
 * @param {string} params.planId Identificador del plan/ejercicio
 * @param {string} params.quality '720p' | '1080p' | '2K' | '4K'
 * @param {string} params.speed '0.5x' | '1x' | '2x' | '4x'
 * @param {string} params.orientation 'landscape' | 'portrait'
 * @param {number} params.zoom Factor de zoom
 * @param {number} params.panX Desplazamiento X
 * @param {number} params.panY Desplazamiento Y
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
  quality = '1080p',
  speed = '1x',
  orientation = 'landscape',
  zoom = 1,
  panX = 0,
  panY = 0,
  fieldType = 'full',
  onProgress = null,
  onStatus = null
}) {
  if (!fc || !fieldCanvas || !frames || frames.length < 2) {
    throw new Error('Se requieren al menos 2 frames para exportar una animación');
  }

  const { mimeType, extension } = getSupportedVideoMimeType();
  const { width: targetWidth, height: targetHeight, bitrate } = getVideoDimensions(quality, orientation);
  const timing = calculateAnimationTiming(frames.length, speed, 25);
  const totalSteps = timing.totalSteps;

  const animationEngine = createAnimationEngine({
    fc,
    fr,
    fieldCanvas,
    frames,
    targetWidth,
    targetHeight,
    zoom,
    panX,
    panY,
    fieldType
  });

  const recCanvas = animationEngine.getCompositeCanvas();
  const stream = recCanvas.captureStream ? recCanvas.captureStream(timing.targetFps) : null;

  if (!stream) {
    throw new Error('captureStream no soportado en este navegador');
  }

  // Anclar canvas compuesto al DOM para garantizar que captureStream emite frames
  // en todos los navegadores (Chrome/Firefox suspenden emisión de off-screen canvases)
  const isInDom = document.contains(recCanvas);
  if (!isInDom) {
    recCanvas.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(recCanvas);
  }

  const chunks = [];
  let recorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate
    });
  } catch (err) {
    console.warn('[mp4Exporter] Fallback MediaRecorder con bitrate estándar:', err);
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000
    });
  }

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Solicitar datos cada 250ms para evitar chunks vacíos al final
  recorder.start(250);

  const videoTrack = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
  const startTime = performance.now();

  // Bucle determinista frame a frame con ritmo temporal compensado
  for (let step = 0; step < timing.totalSteps; step++) {
    const isLastStep = step === timing.totalSteps - 1;
    // Calcular keyframes origen y destino y el factor de interpolación
    const transitionIndex = Math.min(Math.floor(step / timing.stepsPerTransition), timing.numTransitions - 1);
    const subStep = step % timing.stepsPerTransition;
    const progressInTransition = subStep / timing.stepsPerTransition;

    const fromIdx = transitionIndex;
    const toIdx = Math.min(transitionIndex + 1, frames.length - 1);

    // Watchdog individual de 5 segundos con hasta 2 reintentos
    await captureFrameWithRetry(async () => {
      if (isLastStep) {
        // En el último step se garantiza el renderizado íntegro del frame final de la animación
        await animationEngine.renderFrame(frames.length - 1);
      } else if (subStep === 0) {
        await animationEngine.renderFrame(fromIdx);
      } else {
        await animationEngine.renderInterpolatedStep(fromIdx, toIdx, progressInTransition);
      }

      // Si el track permite forzar captura de frame individual, solicitarlo
      if (videoTrack && typeof videoTrack.requestFrame === 'function') {
        videoTrack.requestFrame();
      }
    }, 2, 5000);

    // Compensación exacta de tiempo con performance.now() para que la duración y velocidad sean idénticas a lo configurado
    const expectedElapsedMs = (step + 1) * timing.stepIntervalMs;
    const actualElapsedMs = performance.now() - startTime;
    const waitMs = Math.max(4, Math.round(expectedElapsedMs - actualElapsedMs));
    await new Promise((r) => setTimeout(r, waitMs));

    // Progreso REAL 0 -> 100%
    const currentPercent = Math.min(99, Math.round(((step + 1) / timing.totalSteps) * 100));
    if (typeof onProgress === 'function') {
      onProgress(currentPercent, step + 1, timing.totalSteps);
    }
    if (typeof onStatus === 'function') {
      onStatus(`Exportando frame ${step + 1} de ${timing.totalSteps} (${currentPercent}%)`);
    }
  }

  // Asegurar retención visible del frame final (hold) durante ~0.6-0.8s para que el desenlace táctico sea claramente visible
  const holdDurationMs = Math.max(400, Math.min(1000, Math.round(800 / timing.speedFactor)));
  const holdFramesCount = Math.max(10, Math.round((holdDurationMs / 1000) * timing.targetFps));
  const holdIntervalMs = holdDurationMs / holdFramesCount;

  for (let h = 0; h < holdFramesCount; h++) {
    if (videoTrack && typeof videoTrack.requestFrame === 'function') {
      videoTrack.requestFrame();
    }
    await new Promise(r => setTimeout(r, holdIntervalMs));
  }

  // Solicitar datos finales antes de detener
  if (recorder.state === 'recording') {
    recorder.requestData();
    await new Promise(r => setTimeout(r, 120));
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

  // Retirar canvas del DOM si lo añadimos nosotros
  if (!isInDom && document.contains(recCanvas)) {
    document.body.removeChild(recCanvas);
  }

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
