/**
 * pdfTheme.js
 * Módulo centralizado de tema, colores, encabezados, pies de página y conversión de imágenes
 * para TODOS los generadores de PDF de Míster11.
 *
 * Garantiza:
 * 1. Independencia total del ThemeContext (Modo Claro / Modo Oscuro del usuario).
 * 2. Paleta de alto contraste sobre fondo claro (#172D21 verde, #D4A843 dorado, #0F172A texto).
 * 3. Precarga de imágenes y Base64 con fallback visual SVG si la URL no carga.
 * 4. Capturas html2canvas desacopladas de estilos oscuros activos.
 */

import { ref as storageRef, getBlob } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export const PDF_COLORS = {
  primary: [23, 45, 33],     // #172D21 Verde Institucional Míster11
  accent: [212, 168, 67],    // #D4A843 Dorado Acento
  textDark: [15, 23, 42],    // #0F172A Texto Principal Oscuro Alto Contraste
  textMuted: [71, 85, 105],  // #475569 Texto Secundario
  bgLight: [248, 250, 252],  // #F8FAFC Fondo claro de tarjetas
  border: [226, 232, 240],   // #E2E8F0 Bordes
  white: [255, 255, 255],    // #FFFFFF
  red: [220, 38, 38],        // #DC2626 Alertas / Riesgo
  green: [34, 197, 94],      // #22C55E Éxito / Óptimo
};

/**
 * Convierte una URL remota (Firebase Storage / Web) a Base64 data URL con fallback SVG si falla.
 * @param {string} url - URL remota
 * @param {string} fallbackInitials - Iniciales para el avatar de fallback si falla la imagen
 */
const generateInitialsAvatar = (fallbackInitials) => {
  try {
    const safeInitials = (fallbackInitials || 'M11').substring(0, 2).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#172D21';
    ctx.beginPath();
    ctx.arc(60, 60, 60, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#D4A843';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(60, 60, 56, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(safeInitials, 60, 62);

    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
};

/**
 * Convierte una URL remota (Firebase Storage / Web) o DataURL a Base64 data URL PNG nativo.
 * @param {string} url - URL remota o DataURL
 * @param {string} fallbackInitials - Iniciales para el avatar de fallback si falla la imagen
 * @param {boolean} isAvatar - Si es true, genera un avatar con iniciales si falla. Si es false (diagramas/capturas), devuelve null.
 */
// Helper: convierte cualquier Blob a DataURL
export const blobToDataURL = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
};

/**
 * Convierte una URL a Base64 usando fetch -> blob -> FileReader
 */
export const convertImageToBase64 = async (url) => {
  if (!url) return null;
  return await preloadImageToDataURL(url);
};

/**
 * Función de precarga directa de imágenes a Base64 usando fetch + blob + FileReader
 * Convierte cualquier URL remota a dataURL antes de pasar a jsPDF / html2canvas.
 */
export const preloadImageToDataURL = async (url) => {
  if (!url) return null;
  if (typeof url === 'string' && url.startsWith('data:')) {
    return url;
  }

  // Normalizar URLs relativas
  let targetUrl = url;
  if (typeof targetUrl === 'string' && !targetUrl.startsWith('data:') && !targetUrl.startsWith('http') && !targetUrl.startsWith('gs://')) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://www.mister11.app';
    const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    targetUrl = `${origin}${cleanPath}`;
  }

  // 1. Fetch directo con mode: 'cors' -> blob -> Base64 DataURL
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(targetUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const blob = await response.blob();
      const b64 = await blobToDataURL(blob);
      if (b64) return b64;
    }
  } catch (_) {}

  // 2. Fallback Canvas 2D
  try {
    const canvasB64 = await convertImageToPngViaCanvas(targetUrl, 1500);
    if (canvasB64) return canvasB64;
  } catch (_) {}

  return null;
};

// Helper: dibuja cualquier objeto de imagen (WebP, DataURL, URL) en Canvas 2D con fondo blanco y devuelve data:image/png
const convertImageToPngViaCanvas = (srcUrl, timeoutMs = 2500) => {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const img = new Image();
    if (typeof srcUrl === 'string' && (srcUrl.startsWith('http') || srcUrl.startsWith('//'))) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width || 600;
        const h = img.naturalHeight || img.height || 350;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const pngDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(pngDataUrl);
      } catch (e) {
        console.warn('[convertImageToPngViaCanvas] Canvas error:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(null);
    };
    img.src = srcUrl;
  });
};

export const imageUrlToBase64 = async (url, fallbackInitials = 'M11', isAvatar = false) => {
  if (!url) {
    return isAvatar ? generateInitialsAvatar(fallbackInitials) : null;
  }

  // Normalizar URLs relativas (/img/..., img/..., assets/...) a URLs absolutas con origin
  let targetUrl = url;
  if (typeof targetUrl === 'string' && !targetUrl.startsWith('data:') && !targetUrl.startsWith('http') && !targetUrl.startsWith('gs://')) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://www.mister11.app';
    const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    targetUrl = `${origin}${cleanPath}`;
  }

  // 1. Si la URL ya es una cadena DataURL (data:...)
  if (typeof targetUrl === 'string' && targetUrl.startsWith('data:')) {
    if (targetUrl.startsWith('data:image/png') || targetUrl.startsWith('data:image/jpeg') || targetUrl.startsWith('data:image/jpg')) {
      return targetUrl;
    }
    // Si es WebP, SVG u otro formato DataURL, convertir a PNG mediante Canvas 2D
    try {
      const convertedPng = await convertImageToPngViaCanvas(targetUrl, 1500);
      if (convertedPng && convertedPng.startsWith('data:image/png')) {
        return convertedPng;
      }
    } catch (e) {
      console.warn('[imageUrlToBase64] Error convirtiendo DataURL WebP/SVG:', e);
    }
  }

  // Timeout helper (2500ms)
  const withTimeout = (promise, ms = 2500) =>
    Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

  // 2. Si es una URL remota HTTP / HTTPS / gs://
  if (typeof targetUrl === 'string' && (targetUrl.startsWith('http') || targetUrl.startsWith('gs://'))) {

    // A. Intentar Canvas 2D directo (la vía más rápida)
    try {
      const canvasResult = await convertImageToPngViaCanvas(targetUrl, 2500);
      if (canvasResult) return canvasResult;
    } catch (e) {}

    // B. Firebase Storage SDK getBlob
    if (targetUrl.includes('firebasestorage') || targetUrl.startsWith('gs://')) {
      try {
        const base64 = await withTimeout(
          (async () => {
            let fileRef = null;
            if (targetUrl.startsWith('gs://')) {
              fileRef = storageRef(storage, targetUrl);
            } else {
              try { fileRef = storageRef(storage, targetUrl); } catch (e) { fileRef = null; }
            }
            if (!fileRef) return null;
            const blob = await getBlob(fileRef);
            return await blobToDataURL(blob);
          })(),
          2500
        );
        if (base64) {
          if (base64.startsWith('data:image/webp')) {
            const png = await convertImageToPngViaCanvas(base64, 1500);
            return png || base64;
          }
          return base64;
        }
      } catch (sdkErr) {
        console.warn('[pdfTheme] Firebase Storage getBlob falló:', sdkErr);
      }
    }

    // C. Direct Fetch con Blob -> DataURL
    try {
      const base64 = await withTimeout(
        (async () => {
          const res = await fetch(targetUrl, { mode: 'cors', cache: 'force-cache' });
          if (!res.ok) return null;
          const blob = await res.blob();
          return await blobToDataURL(blob);
        })(),
        2500
      );
      if (base64) {
        if (base64.startsWith('data:image/webp')) {
          const png = await convertImageToPngViaCanvas(base64, 1500);
          return png || base64;
        }
        return base64;
      }
    } catch (e) {}
  }

  if (isAvatar) {
    return generateInitialsAvatar(fallbackInitials);
  }

  return null;
};

/**
 * Renderiza el encabezado institucional unificado Míster11.
 */
export const drawPdfHeader = (doc, title, subtitle, pageW = 210) => {
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageW, 36, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 34, pageW, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`MÍSTER 11 — ${title.toUpperCase()}`, 14, 16);

  if (subtitle) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(subtitle, 14, 26);
  }
};

/**
 * Renderiza el pie de página unificado Míster11.
 */
export const drawPdfFooter = (doc, pageW = 210, pageH = 297, currentPage = 1, totalPages = 1) => {
  doc.setDrawColor(...PDF_COLORS.border);
  doc.line(14, pageH - 14, pageW - 14, pageH - 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('Míster11 Platform • mister11.app', 14, pageH - 8);

  const pageStr = `Página ${currentPage} de ${totalPages}`;
  doc.text(pageStr, pageW - 14, pageH - 8, { align: 'right' });
};

/**
 * Captura un elemento DOM usando html2canvas forzando estilos claros de alto contraste,
 * garantizando que el modo oscuro del cliente no afecte el resultado.
 */
export const captureElementHighContrast = async (html2canvas, element, customScale = 2) => {
  if (!element) return null;

  const clone = element.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '-9999px';
  clone.style.background = '#FFFFFF';
  clone.style.color = '#0F172A';
  clone.style.width = `${element.offsetWidth || 800}px`;

  // Forzar estilos de contraste claro en todos los nodos hijos
  const allText = clone.querySelectorAll('*');
  allText.forEach((node) => {
    node.style.color = '#0F172A';
    if (node.tagName === 'path' || node.tagName === 'text' || node.tagName === 'circle') {
      if (node.getAttribute('fill') === '#ffffff' || node.getAttribute('fill') === '#FFF' || node.style.fill === 'rgb(255, 255, 255)') {
        node.setAttribute('fill', '#0F172A');
        node.style.fill = '#0F172A';
      }
    }
  });

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: customScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[pdfTheme] Error capturing element with html2canvas:', err);
    return null;
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};

/**
 * Dibuja un Radar Chart 360° en Canvas 2D nativo a alta resolución (sin html2canvas/DOM).
 * @param {Array<{label: string, value: number, max?: number}>} metrics - Lista de métricas (0-100)
 * @param {number} size - Tamaño en px del canvas cuadrado (defecto 500)
 * @returns {string} DataURL base64 PNG
 */
export const drawRadarChartCanvas = (metrics = [], size = 520) => {
  if (!metrics || metrics.length === 0) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.36;
    const total = metrics.length;
    const angleStep = (Math.PI * 2) / total;

    // 1. Niveles concéntricos
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach((lvl, lvlIdx) => {
      ctx.beginPath();
      for (let i = 0; i < total; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * lvl;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = lvlIdx === levels.length - 1 ? '#CBD5E1' : '#E2E8F0';
      ctx.lineWidth = lvlIdx === levels.length - 1 ? 1.5 : 1;
      ctx.stroke();

      // Nivel % texto en el eje vertical superior
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${Math.round(lvl * 100)}`, cx, cy - radius * lvl - 2);
    });

    // 2. Ejes radiales
    for (let i = 0; i < total; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Etiquetas exteriores
      const labelDistance = radius + 30;
      const lx = cx + labelDistance * Math.cos(angle);
      const ly = cy + labelDistance * Math.sin(angle);

      const m = metrics[i];
      const val = Math.round(m.value ?? 0);

      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = Math.abs(Math.cos(angle)) < 0.3 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right');
      ctx.textBaseline = Math.abs(Math.sin(angle)) < 0.3 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom');
      ctx.fillText(`${m.label}`, lx, ly - 4);

      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillStyle = '#2E7D5C';
      ctx.fillText(`${val}%`, lx, ly + 11);
    }

    // 3. Polígono de datos del jugador
    ctx.beginPath();
    for (let i = 0; i < total; i++) {
      const m = metrics[i];
      const max = m.max || 100;
      const pct = Math.min(Math.max((m.value ?? 0) / max, 0.05), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * pct;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(46, 125, 92, 0.35)'; // Verde institucional translúcido
    ctx.fill();
    ctx.strokeStyle = '#2E7D5C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Vértices con detalle dorado
    for (let i = 0; i < total; i++) {
      const m = metrics[i];
      const max = m.max || 100;
      const pct = Math.min(Math.max((m.value ?? 0) / max, 0.05), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * pct;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#D4A843'; // Dorado
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawRadarChartCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja una Gráfica de Evolución / Tendencia temporal en Canvas 2D nativo a alta resolución.
 * @param {Array<{label: string, value: number}>} points - Serie de puntos
 * @param {number} width - Ancho en px
 * @param {number} height - Alto en px
 * @param {string} title - Título de la gráfica
 * @returns {string} DataURL base64 PNG
 */
export const drawEvolutionChartCanvas = (points = [], width = 640, height = 260, title = 'Evolución') => {
  if (!points || points.length === 0) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const padL = 50;
    const padR = 30;
    const padT = 35;
    const padB = 45;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Título
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), padL, padT - 12);

    const vals = points.map(p => Number(p.value) || 0);
    const minVal = Math.min(0, ...vals);
    const maxVal = Math.max(10, Math.ceil(Math.max(...vals) * 1.15));
    const range = maxVal - minVal || 1;

    // Líneas de cuadrícula horizontal
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = padT + (plotH / gridCount) * i;
      const val = Math.round(maxVal - (range / gridCount) * i);

      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), padL - 8, y);
    }

    if (points.length === 1) {
      const cx = padL + plotW / 2;
      const cy = padT + plotH - ((vals[0] - minVal) / range) * plotH;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#2E7D5C';
      ctx.fill();
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillText(`${vals[0]}`, cx, cy - 10);
      return canvas.toDataURL('image/png', 0.95);
    }

    const stepX = plotW / (points.length - 1);
    const coords = points.map((p, idx) => ({
      x: padL + idx * stepX,
      y: padT + plotH - ((p.value - minVal) / range) * plotH,
      label: p.label || `P${idx + 1}`,
      value: p.value
    }));

    // Área bajo la curva
    ctx.beginPath();
    ctx.moveTo(coords[0].x, padT + plotH);
    coords.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(46, 125, 92, 0.15)';
    ctx.fill();

    // Línea continua
    ctx.beginPath();
    coords.forEach((c, idx) => {
      if (idx === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.strokeStyle = '#2E7D5C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Puntos y etiquetas
    coords.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#D4A843';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Valor
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${c.value}`, c.x, c.y - 6);

      // Label eje X
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textBaseline = 'top';
      ctx.fillText(c.label, c.x, padT + plotH + 8);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawEvolutionChartCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja una Gráfica de Momentum del Partido en Canvas 2D nativo a alta resolución.
 * @param {Array<Object>} events - Lista de eventos del partido
 * @param {number} matchDuration - Duración del partido en min (defecto 90)
 * @param {number} width - Ancho en px
 * @param {number} height - Alto en px
 * @returns {string} DataURL base64 PNG
 */
export const drawMomentumChartCanvas = (events = [], matchDuration = 90, width = 640, height = 220) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const padL = 40;
    const padR = 25;
    const padT = 30;
    const padB = 35;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const midY = padT + plotH / 2;

    // Título
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.fillText('MOMENTUM & DINÁMICA DEL PARTIDO (DOMINIO PROPIO VS RIVAL)', padL, padT - 10);

    // Eje central cero
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(width - padR, midY);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Líneas de mitad (45')
    const halfX = padL + (45 / matchDuration) * plotW;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(halfX, padT);
    ctx.lineTo(halfX, padT + plotH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('DESCANSO (45\')', halfX, padT + plotH + 16);

    // Calcular momentum por tramos de 5 minutos
    const bucketMinutes = 5;
    const bucketsCount = Math.ceil(matchDuration / bucketMinutes);
    const momentum = new Array(bucketsCount).fill(0);

    (events || []).forEach(e => {
      const min = Math.min(Math.max(Number(e.minute) || 1, 1), matchDuration);
      const bIdx = Math.min(Math.floor((min - 1) / bucketMinutes), bucketsCount - 1);
      let weight = 0;
      if (e.type === 'gol_local' || e.type === 'gol') weight = 4;
      else if (e.type === 'gol_rival') weight = -4;
      else if (e.type === 'shot_on_target_own') weight = 2;
      else if (e.type === 'shot_on_target_rival') weight = -2;
      else if (e.type === 'shot_off_target_own' || e.type === 'corner_favor') weight = 1;
      else if (e.type === 'shot_off_target_rival' || e.type === 'corner_against') weight = -1;
      else if (e.type === 'recovery' || e.type === 'duel_won') weight = 0.5;
      else if (e.type === 'loss' || e.type === 'duel_lost') weight = -0.5;
      momentum[bIdx] += weight;
    });

    const maxM = Math.max(4, ...momentum.map(Math.abs));
    const barW = (plotW / bucketsCount) * 0.75;

    // Dibujar barras de momentum
    momentum.forEach((val, idx) => {
      const bx = padL + (idx / bucketsCount) * plotW + (plotW / bucketsCount - barW) / 2;
      const barH = (Math.abs(val) / maxM) * (plotH / 2 - 8);
      const isPositive = val >= 0;
      const by = isPositive ? midY - barH : midY;

      ctx.fillStyle = isPositive ? 'rgba(46, 125, 92, 0.85)' : 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(bx, by, barW, barH);
    });

    // Marcas de tiempo en el eje X
    [0, 15, 30, 45, 60, 75, matchDuration].forEach(m => {
      const x = padL + (m / matchDuration) * plotW;
      ctx.font = '9px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(`${m}'`, x, padT + plotH + 4);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawMomentumChartCanvas] Error:', e);
    return null;
  }
};

