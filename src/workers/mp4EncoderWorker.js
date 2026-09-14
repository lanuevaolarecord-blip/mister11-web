/**
 * src/workers/mp4EncoderWorker.js
 * Dedicated Web Worker for processing video chunks and packaging MP4 video
 * off the main UI thread (DEF-M05-01).
 */

self.onmessage = async (e) => {
  const { type, chunks, mimeType } = e.data;
  if (type === 'ENCODE_VIDEO') {
    try {
      const total = chunks ? chunks.length : 0;
      let processed = 0;
      const buffers = [];

      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk instanceof ArrayBuffer) {
            buffers.push(chunk);
          } else if (chunk && typeof chunk.arrayBuffer === 'function') {
            const ab = await chunk.arrayBuffer();
            buffers.push(ab);
          } else {
            buffers.push(chunk);
          }
          processed++;
          self.postMessage({
            type: 'ENCODE_PROGRESS',
            progress: Math.min(100, Math.round(90 + (processed / Math.max(1, total)) * 10))
          });
        }
      }

      const finalBlob = new Blob(buffers, { type: mimeType || 'video/mp4' });
      self.postMessage({
        type: 'ENCODE_COMPLETE',
        blob: finalBlob
      });
    } catch (err) {
      self.postMessage({
        type: 'ENCODE_ERROR',
        error: err?.message || 'Error en codificación worker'
      });
    }
  }
};
