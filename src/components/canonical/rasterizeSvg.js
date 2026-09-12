/**
 * src/components/canonical/rasterizeSvg.js
 * Míster11 — Rasterizador Canónico de SVG a Alta Resolución (3x DPI) para PDF
 *
 * Convierte cualquier cadena de marcado SVG o elemento SVG en un PNG DataURL (Base64)
 * a resolución 3x (300 DPI equivalente), garantizando que las gráficas del PDF
 * sean idénticas pixel a pixel a las mostradas en las pestañas de la aplicación.
 */

/**
 * Convierte un SVG string o elemento React SVG a PNG Base64 DataURL a escala 3x
 * @param {string|React.ReactElement} svgInput - Contenido XML/SVG o elemento React
 * @param {number|Object} targetWidthOrOptions - Ancho en px o { width, height, scale }
 * @param {number} [targetHeight] - Alto en px si se usa firma posicional
 * @param {number} [scale=3] - Factor de escala para alta densidad (default 3x)
 * @returns {Promise<string|null>} DataURL en formato image/png
 */
export async function rasterizeSvgToDataUrl(svgInput, targetWidthOrOptions, targetHeight, scale = 3) {
  if (!svgInput) return null;

  let width = targetWidthOrOptions;
  let height = targetHeight;
  let s = scale;

  if (typeof targetWidthOrOptions === 'object' && targetWidthOrOptions !== null) {
    width = targetWidthOrOptions.width ?? targetWidthOrOptions.w;
    height = targetWidthOrOptions.height ?? targetWidthOrOptions.h;
    s = targetWidthOrOptions.scale ?? 3;
  }

  const numW = Math.round(Number(width) || 640);
  const numH = Math.round(Number(height) || 200);
  const numScale = Number(s) || 3;

  // Convertir elemento React a string SVG si es necesario
  let cleanSvg = '';
  if (typeof svgInput === 'string') {
    cleanSvg = svgInput;
  } else if (typeof svgInput === 'object') {
    try {
      const { renderToStaticMarkup } = await import('react-dom/server');
      cleanSvg = renderToStaticMarkup(svgInput);
    } catch (e) {
      console.warn('[rasterizeSvgToDataUrl] Error en renderToStaticMarkup:', e);
      return null;
    }
  }

  if (!cleanSvg || typeof cleanSvg !== 'string') return null;

  // Asegurar namespace xmlns y dimensiones en la raíz del SVG
  if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(numW * numScale);
          canvas.height = Math.round(numH * numScale);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.scale(numScale, numScale);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, numW, numH);
            const dataUrl = canvas.toDataURL('image/png', 0.95);
            URL.revokeObjectURL(url);
            if (dataUrl && dataUrl.length > 500) {
              resolve(dataUrl);
              return;
            }
          }
        } catch (canvasErr) {
          console.error('[rasterizeSvgToDataUrl] Error en canvas:', canvasErr);
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.onerror = (err) => {
        console.error('[rasterizeSvgToDataUrl] Error cargando SVG Blob como imagen:', err);
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (e) {
      console.error('[rasterizeSvgToDataUrl] Excepción general:', e);
      resolve(null);
    }
  });
}

export default rasterizeSvgToDataUrl;
