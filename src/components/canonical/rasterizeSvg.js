/**
 * src/components/canonical/rasterizeSvg.js
 * Míster11 — Rasterizador Canónico de SVG a Alta Resolución (3x DPI) para PDF
 *
 * Convierte cualquier cadena de marcado SVG o elemento SVG en un PNG DataURL (Base64)
 * a resolución 3x (300 DPI equivalente), garantizando que las gráficas del PDF
 * sean idénticas pixel a pixel a las mostradas en las pestañas de la aplicación.
 */

/**
 * Convierte un SVG string a PNG Base64 DataURL a escala 3x
 * @param {string} svgString - Contenido XML/SVG completo con atributos xmlns, width, height, viewBox
 * @param {number} targetWidth - Ancho en px lógicos (CSS)
 * @param {number} targetHeight - Alto en px lógicos (CSS)
 * @param {number} scale - Factor de escala para alta densidad (default 3x)
 * @returns {Promise<string|null>} DataURL en formato image/png
 */
export async function rasterizeSvgToDataUrl(svgString, targetWidth, targetHeight, scale = 3) {
  if (!svgString || typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      // Asegurar namespace xmlns en la raíz del SVG
      let cleanSvg = svgString;
      if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(targetWidth * scale);
          canvas.height = Math.round(targetHeight * scale);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.scale(scale, scale);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const dataUrl = canvas.toDataURL('image/png', 0.95);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
        } catch (canvasErr) {
          console.warn('[rasterizeSvgToDataUrl] Error en canvas:', canvasErr);
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.onerror = (err) => {
        console.warn('[rasterizeSvgToDataUrl] Error cargando SVG Blob como imagen:', err);
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (e) {
      console.warn('[rasterizeSvgToDataUrl] Excepción general:', e);
      resolve(null);
    }
  });
}

export default rasterizeSvgToDataUrl;
