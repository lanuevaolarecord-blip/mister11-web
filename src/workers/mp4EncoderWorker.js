/**
 * src/workers/mp4EncoderWorker.js
 * Dedicated Web Worker for processing video chunks and packaging MP4/WebM video
 * off the main UI thread with guaranteed completion and watchdog safety (DEF-M05-01 / DEF-M05-02).
 */

self.onmessage = async (e) => {
  const data = e.data || {};
  const type = data.type;
  const rawBuffers = data.buffers || data.chunks || [];
  const mimeType = data.mimeType || 'video/mp4';

  if (type === 'ENCODE' || type === 'ENCODE_VIDEO') {
    let completed = false;
    let finalBlob = null;
    let errorOccurred = null;

    try {
      const total = rawBuffers ? rawBuffers.length : 0;
      const buffers = [];
      let processed = 0;

      if (Array.isArray(rawBuffers)) {
        for (const chunk of rawBuffers) {
          if (chunk instanceof ArrayBuffer) {
            buffers.push(chunk);
          } else if (chunk && typeof chunk.arrayBuffer === 'function') {
            const ab = await chunk.arrayBuffer();
            buffers.push(ab);
          } else {
            buffers.push(chunk);
          }
          processed++;

          const pct = Math.min(99, Math.round(90 + (processed / Math.max(1, total)) * 9));
          self.postMessage({
            type: 'PROGRESS',
            progress: pct
          });
          self.postMessage({
            type: 'ENCODE_PROGRESS',
            progress: pct
          });
        }
      }

      finalBlob = new Blob(buffers, { type: mimeType });

      // Emitir 100% de progreso antes de la señal de finalización
      self.postMessage({
        type: 'PROGRESS',
        progress: 100
      });
      self.postMessage({
        type: 'ENCODE_PROGRESS',
        progress: 100
      });

      // Emitir mensaje de éxito con soporte para ambos protocolos (done y SUCCESS)
      self.postMessage({
        type: 'done',
        blob: finalBlob
      });
      self.postMessage({
        type: 'SUCCESS',
        blob: finalBlob
      });
      self.postMessage({
        type: 'ENCODE_COMPLETE',
        blob: finalBlob
      });

      completed = true;
    } catch (err) {
      errorOccurred = err;
      self.postMessage({
        type: 'error',
        reason: err?.message || 'Error en codificación worker'
      });
      self.postMessage({
        type: 'ERROR',
        error: err?.message || 'Error en codificación worker'
      });
    } finally {
      if (!completed && !errorOccurred) {
        self.postMessage({
          type: 'error',
          reason: 'Worker finalizado sin generar blob'
        });
      }
      // NUNCA llamar a self.close() antes de que los mensajes postMessage sean procesados
    }
  }
};
