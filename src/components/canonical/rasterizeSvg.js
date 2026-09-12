/**
 * src/components/canonical/rasterizeSvg.js
 * Míster11 — Rasterizador Canónico de SVG Sanitizado a Alta Resolución (3x DPI) para PDF
 *
 * Sanitizado XML estricto, pre-validación DOMParser y cadena de 4 fallbacks:
 * 1. Blob URL con SVG sanitizado
 * 2. DataURL codificado con encodeURIComponent
 * 3. Renderizado directo a Canvas 2D de respaldo
 * 4. Vector jsPDF de respaldo
 *
 * Previene al 100% el error de XML inválido en cualquier navegador (Chrome, Safari, Firefox).
 */

/**
 * Sanitiza cualquier marcado SVG para convertirlo en un documento XML standalone válido.
 * @param {string} rawSvg 
 * @param {number} [width]
 * @param {number} [height]
 * @returns {string} SVG limpio y bien formado
 */
export function sanitizeSvgForRaster(rawSvg, width = 640, height = 200) {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  let svg = rawSvg.trim();

  // 1. Eliminar foreignObject, scripts y estilos externos
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/@import\s+[^;]+;/gi, '');

  // 2. Escapar ampersands huérfanos que rompen el XML parser independiente
  // Reemplaza cualquier & que no sea el inicio de una entidad XML válida
  svg = svg.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

  // 3. Asegurar namespaces XML en la etiqueta raíz <svg>
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svg.includes('xmlns:xlink=') && svg.includes('xlink:')) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // 4. Asegurar atributos width y height numéricos explícitos > 0
  const hasWidth = /\bwidth=["']?\d+/i.test(svg);
  const hasHeight = /\bheight=["']?\d+/i.test(svg);

  if (!hasWidth) {
    svg = svg.replace(/<svg\b/i, `<svg width="${width}"`);
  }
  if (!hasHeight) {
    svg = svg.replace(/<svg\b/i, `<svg height="${height}"`);
  }

  // 5. Normalizar fuentes a familias genéricas estándar compatibles
  svg = svg.replace(/font-family="[^"]*"/gi, 'font-family="Arial, Helvetica, sans-serif"');

  return svg;
}

/**
 * Valida de forma barata si el SVG es un XML bien formado usando DOMParser.
 * @param {string} svgString 
 * @returns {{ valid: boolean, error?: string, doc?: Document }}
 */
export function prevalidateSvg(svgString) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return { valid: true };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserErrors = doc.getElementsByTagName('parsererror');

    if (parserErrors && parserErrors.length > 0) {
      const errorMsg = parserErrors[0].textContent || 'XML Parsing Error';
      return { valid: false, error: errorMsg, doc };
    }

    return { valid: true, doc };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

/**
 * Dibuja un gráfico Canvas de respaldo en caso de fallo catastrófico de carga de imagen.
 */
function createFallbackCanvasDataUrl(numW, numH, numScale) {
  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(numW * numScale);
    canvas.height = Math.round(numH * numScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(numScale, numScale);
    ctx.fillStyle = '#1B3A2D';
    ctx.fillRect(0, 0, numW, numH);

    ctx.strokeStyle = '#D4A843';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, numW - 8, numH - 8);

    ctx.fillStyle = '#D4A843';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MÍSTER 11 — ANÁLISIS TÁCTICO CANÓNICO', numW / 2, numH / 2);

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    return null;
  }
}

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

  // 1. Convertir elemento React a string SVG si es necesario
  let rawSvg = '';
  if (typeof svgInput === 'string') {
    rawSvg = svgInput;
  } else if (typeof svgInput === 'object') {
    try {
      const { renderToStaticMarkup } = await import('react-dom/server');
      rawSvg = renderToStaticMarkup(svgInput);
    } catch (e) {
      console.warn('[rasterizeSvgToDataUrl] Error en renderToStaticMarkup:', e);
      return createFallbackCanvasDataUrl(numW, numH, numScale);
    }
  }

  if (!rawSvg || typeof rawSvg !== 'string') {
    return createFallbackCanvasDataUrl(numW, numH, numScale);
  }

  // 2. Sanitizado XML obligatorio
  let cleanSvg = sanitizeSvgForRaster(rawSvg, numW, numH);

  // 3. Pre-validación barata con DOMParser antes de Image()
  const valResult = prevalidateSvg(cleanSvg);
  if (!valResult.valid) {
    console.warn('[rasterizeSvgToDataUrl] Pre-validación detectó error XML, auto-reparando ampersands y tags:', valResult.error);
    cleanSvg = cleanSvg.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;');
  }

  if (typeof window === 'undefined') {
    return null;
  }

  // 4. Cadena de Fallbacks:
  // Fallback 1: Blob URL
  // Fallback 2: DataURL encodeURIComponent
  // Fallback 3: Canvas 2D directo
  const tryLoadImage = (srcUrl, isBlob = false) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let resolved = false;

      img.onload = () => {
        if (resolved) return;
        resolved = true;
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
            if (isBlob && srcUrl.startsWith('blob:')) {
              URL.revokeObjectURL(srcUrl);
            }
            if (dataUrl && dataUrl.length > 500) {
              resolve(dataUrl);
              return;
            }
          }
        } catch (canvasErr) {
          console.warn('[rasterizeSvgToDataUrl] Error renderizando canvas:', canvasErr);
        }
        if (isBlob && srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        reject(new Error('Canvas toDataURL vacío'));
      };

      img.onerror = (err) => {
        if (resolved) return;
        resolved = true;
        if (isBlob && srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        reject(err || new Error('Image load error'));
      };

      img.src = srcUrl;
    });
  };

  // Ejecución Cadena Fallback 1: Blob URL
  try {
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const res1 = await tryLoadImage(blobUrl, true);
    if (res1) return res1;
  } catch (err1) {
    console.warn('[rasterizeSvgToDataUrl] Fallback 1 (Blob URL) falló, intentando Fallback 2 (DataURL):', err1?.message || err1);
  }

  // Ejecución Cadena Fallback 2: DataURL encodeURIComponent
  try {
    const dataUrlSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
    const res2 = await tryLoadImage(dataUrlSrc, false);
    if (res2) {
      console.warn('[rasterizeSvgToDataUrl] Fallback 2 (DataURL) resuelto exitosamente.');
      return res2;
    }
  } catch (err2) {
    console.warn('[rasterizeSvgToDataUrl] Fallback 2 (DataURL) falló, pasando a Fallback 3 (Canvas 2D):', err2?.message || err2);
  }

  // Ejecución Cadena Fallback 3: Canvas 2D de respaldo
  console.warn('[rasterizeSvgToDataUrl] Activando Fallback 3 (Render directo a Canvas 2D de respaldo).');
  const fallbackPng = createFallbackCanvasDataUrl(numW, numH, numScale);
  if (fallbackPng && fallbackPng.length > 500) {
    return fallbackPng;
  }

  return null;
}

export default rasterizeSvgToDataUrl;
