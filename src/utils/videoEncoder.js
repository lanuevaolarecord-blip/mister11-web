/**
 * videoEncoder.js
 * MÍSTER11 — Codificador de Video Determinista (FIX 4)
 * 
 * Codifica una secuencia de fotogramas capturados determinísticamente a MP4/WebM.
 * Incluye reintento automático (hasta 2 reintentos) por fotograma fallido,
 * watchdog individual por captura, y empaquetado seguro en Web Worker o Blob directo.
 */

/**
 * Captura un frame individual con hasta 2 reintentos en caso de fallo
 * @param {Function} captureFn Función asíncrona que captura el frame
 * @param {number} maxRetries Número máximo de reintentos (def: 2)
 * @param {number} timeoutMs Timeout watchdog individual por frame (def: 5000ms)
 * @returns {Promise<any>}
 */
export async function captureFrameWithRetry(captureFn, maxRetries = 2, timeoutMs = 5000) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        captureFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`TIMEOUT_FRAME_CAPTURE_${timeoutMs}MS`)), timeoutMs)
        )
      ]);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[videoEncoder] Reintento ${attempt + 1}/${maxRetries} tras fallo en captura de frame:`, err);
      // Pausa breve antes de reintentar para estabilizar el pipeline de rendering
      await new Promise(r => setTimeout(r, 60));
    }
  }

  throw new Error(`Fallo definitivo en captura tras ${maxRetries} reintentos: ${lastError?.message || 'Error desconocido'}`);
}

/**
 * Detecta el mejor formato de video soportado por el navegador
 */
export function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }

  const types = [
    { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' }
  ];

  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t.mime)) {
      return { mimeType: t.mime, extension: t.ext };
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

/**
 * Empaqueta chunks o buffers de video mediante el Web Worker dedicado
 * con salvaguarda y fallback automático a Blob directo.
 * @param {Array<Blob|ArrayBuffer>} chunks 
 * @param {string} mimeType 
 * @param {Function} onProgress 
 * @returns {Promise<Blob>}
 */
export function packageVideoBlob(chunks, mimeType = 'video/mp4', onProgress = null) {
  return new Promise((resolve, reject) => {
    if (!chunks || chunks.length === 0) {
      return reject(new Error('Array de chunks vacío'));
    }

    let worker = null;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (worker) {
        try { worker.terminate(); } catch (_) {}
        worker = null;
      }
    };

    // Watchdog de 15s para el empaquetado final
    timeoutId = setTimeout(() => {
      console.warn('[videoEncoder] Watchdog de empaquetado final expiró, activando fallback');
      cleanup();
      // Fallback directo a Blob
      try {
        const directBlob = new Blob(chunks, { type: mimeType });
        resolve(directBlob);
      } catch (fbErr) {
        reject(fbErr);
      }
    }, 15000);

    try {
      worker = new Worker(new URL('../workers/mp4EncoderWorker.js', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const msg = e.data || {};
        if (msg.type === 'PROGRESS' || msg.type === 'ENCODE_PROGRESS') {
          if (typeof onProgress === 'function') onProgress(msg.progress);
        } else if (msg.type === 'SUCCESS' || msg.type === 'ENCODE_COMPLETE' || msg.type === 'done') {
          cleanup();
          resolve(msg.blob);
        } else if (msg.type === 'ERROR' || msg.type === 'error') {
          console.warn('[videoEncoder] Error reportado por worker:', msg.error || msg.reason);
          cleanup();
          // Fallback a Blob nativo
          resolve(new Blob(chunks, { type: mimeType }));
        }
      };

      worker.onerror = (err) => {
        console.warn('[videoEncoder] Error en worker:', err);
        cleanup();
        resolve(new Blob(chunks, { type: mimeType }));
      };

      Promise.all(chunks.map(c => (c instanceof Blob ? c.arrayBuffer() : c)))
        .then(buffers => {
          if (worker) {
            worker.postMessage({ type: 'ENCODE', buffers, mimeType }, buffers);
          }
        })
        .catch(err => {
          cleanup();
          resolve(new Blob(chunks, { type: mimeType }));
        });

    } catch (err) {
      cleanup();
      console.warn('[videoEncoder] No se pudo inicializar worker, usando fallback Blob:', err);
      resolve(new Blob(chunks, { type: mimeType }));
    }
  });
}

export default {
  captureFrameWithRetry,
  getSupportedVideoMimeType,
  packageVideoBlob
};
