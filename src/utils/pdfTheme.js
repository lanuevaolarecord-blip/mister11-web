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
import { storage } from '../firebaseConfig.js';
import { PREDEFINED_FORMATIONS } from './formaciones.js';

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
 * cleanPdfText - Sanea cadenas para jsPDF / autoTable eliminando o traduciendo emojis
 * a representaciones legibles en texto plano, evitando caracteres raros o unicode corrupto.
 * Solo afecta a la generación de PDFs; la interfaz gráfica conserva todos sus emojis intactos.
 */
export const cleanPdfText = (text) => {
  if (text === null || text === undefined) return '';
  let str = String(text);

  const emojiReplacements = {
    '⚽': '[Gol]',
    '👟': '[Asist.]',
    '🟨': '[Amarilla]',
    '🟥': '[Roja]',
    '⭐': '*',
    '🌟': '*',
    '✨': '*',
    '⚠️': '[ALERTA]',
    '✅': '[OK]',
    '❌': '[X]',
    '⏳': '[Pendiente]',
    '⏱️': '[Min]',
    '⏱': '[Min]',
    '🚑': '[Lesión]',
    '📝': '[Nota]',
    '🔘': '[-]',
    '🔥': '[Racha]',
    '📋': '[Historial]',
    '📄': '[Doc]',
    '📊': '[Métrica]',
    '🎯': '[Objetivo]',
    '🏆': '[Trofeo]',
    '🧤': '[Portero]',
    '🏃': '[Jugador]',
    '🛡️': '[Defensa]',
    '🛡': '[Defensa]',
    '🧠': '[Mental]',
    '💪': '[Físico]',
    '📅': '[Fecha]',
    '📍': '[Lugar]',
    '🏟️': '[Estadio]',
    '🏟': '[Estadio]',
    '🔄': '[Cambio]',
    '👑': '[Capitán]',
    '🏷️': '[Etiqueta]',
    '🏷': '[Etiqueta]',
    '🔔': '[Aviso]',
    '🏅': '[Medalla]',
    '🥇': '[Oro]',
    '🥈': '[Plata]',
    '🥉': '[Bronce]',
    '📈': '[Evolución]',
    '⚡': '[Rayo]',
    '✓': '[OK]',
    '✔': '[OK]',
    '✗': '[X]',
    '✘': '[X]'
  };

  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    str = str.split(emoji).join(replacement);
  }

  // Eliminar cualquier otro emoji o caracter suplementario no soportado por fuentes estándar de PDF (Helvetica/WinAnsiEncoding)
  str = str.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
  // Eliminar glifo corrupto '自' y caracteres CJK no soportados en informes estándar
  str = str.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, '');
  // Eliminar surrogates huérfanos UTF-16
  str = str.replace(/[\uD800-\uDFFF]/g, '');

  return str;
};

// Factor de escalado de alta densidad (3x Retina = 300+ DPI para impresión y visualización nítida sin pixelación)
export const CANVAS_DPI_SCALE = 3;

/**
 * Convierte una URL remota (Firebase Storage / Web) a Base64 data URL con fallback SVG si falla.
 * @param {string} url - URL remota
 * @param {string} fallbackInitials - Iniciales para el avatar de fallback si falla la imagen
 */
const generateInitialsAvatar = (fallbackInitials) => {
  try {
    const safeInitials = (fallbackInitials || 'M11').substring(0, 2).toUpperCase();
    const scale = CANVAS_DPI_SCALE;
    const baseSize = 120;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(baseSize * scale);
    canvas.height = Math.round(baseSize * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
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
 * Convierte una URL a Base64 usando fetch -> blob -> FileReader o Firebase Storage SDK
 */
export const convertImageToBase64 = async (url) => {
  if (!url) return null;
  return await imageUrlToBase64(url, 'M11', false);
};

/**
 * Función de precarga directa de imágenes a Base64
 * Convierte cualquier URL remota a dataURL antes de pasar a jsPDF / html2canvas.
 */
export const preloadImageToDataURL = async (url) => {
  if (!url) return null;
  return await imageUrlToBase64(url, 'M11', false);
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const pngDataUrl = canvas.toDataURL('image/png', 1.0);
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

  // 1. Si la URL ya es una cadena DataURL (data:...)
  if (typeof url === 'string' && url.startsWith('data:')) {
    if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
      return url;
    }
    // Si es WebP, SVG u otro formato DataURL, convertir a PNG mediante Canvas 2D
    try {
      const convertedPng = await convertImageToPngViaCanvas(url, 2000);
      if (convertedPng && convertedPng.startsWith('data:image/png')) {
        return convertedPng;
      }
    } catch (e) {
      console.warn('[imageUrlToBase64] Error convirtiendo DataURL WebP/SVG:', e);
    }
    return url;
  }

  // Normalizar URLs relativas (/img/..., img/..., assets/...) a URLs absolutas con origin
  let targetUrl = url;
  if (typeof targetUrl === 'string' && !targetUrl.startsWith('http') && !targetUrl.startsWith('gs://')) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://www.mister11.app';
    const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    targetUrl = `${origin}${cleanPath}`;
  }

  // Timeout helper (5000ms)
  const withTimeout = (promise, ms = 5000) =>
    Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

  // 2. PRIORIDAD 1: Firebase Storage SDK con extracción limpia del path (Evita 400 Bad Request y bloqueos CORS)
  if (typeof targetUrl === 'string' && (targetUrl.includes('firebasestorage.googleapis.com') || targetUrl.includes('firebasestorage') || targetUrl.startsWith('gs://'))) {
    try {
      let path = targetUrl;
      if (targetUrl.startsWith('gs://')) {
        path = targetUrl.replace(/^gs:\/\/[^/]+\//, '');
      } else if (targetUrl.includes('/o/')) {
        const rawPath = targetUrl.split('/o/')[1].split('?')[0];
        path = decodeURIComponent(rawPath);
      }
      const fileRef = storageRef(storage, path);
      const blob = await withTimeout(getBlob(fileRef), 5000);
      if (blob) {
        const b64 = await blobToDataURL(blob);
        if (b64) {
          if (b64.startsWith('data:image/webp')) {
            const png = await convertImageToPngViaCanvas(b64, 2000);
            return png || b64;
          }
          return b64;
        }
      }
    } catch (sdkErr) {
      console.warn('[imageUrlToBase64] Firebase Storage getBlob falló:', sdkErr);
    }
  }

  // 3. PRIORIDAD 2: Direct Fetch con mode: 'cors'
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(targetUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const blob = await response.blob();
      const b64 = await blobToDataURL(blob);
      if (b64) {
        if (b64.startsWith('data:image/webp')) {
          const png = await convertImageToPngViaCanvas(b64, 2000);
          return png || b64;
        }
        return b64;
      }
    }
  } catch (_) {}

  // 4. PRIORIDAD 3: Fallback Canvas 2D
  try {
    const canvasB64 = await convertImageToPngViaCanvas(targetUrl, 2500);
    if (canvasB64) return canvasB64;
  } catch (_) {}

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
export const captureElementHighContrast = async (html2canvas, element, customScale = 3) => {
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
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size * scale);
    canvas.height = Math.round(size * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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
 * Dibuja el Radar Táctico Oficial de 6 Ejes Comparativos (Local vs Rival)
 * en Canvas 2D nativo a alta resolución para incrustar en PDFs.
 */
export const drawMatchRadarChartCanvas = ({
  events = [],
  homeStats = {},
  awayStats = {},
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 540,
  height = 440
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo blanco limpio para PDF
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    let localShotsOn = 0, rivalShotsOn = 0;
    let localDuelsWon = 0, localDuelsLost = 0;
    let rivalDuelsWon = 0, rivalDuelsLost = 0;
    let localFouls = 0, rivalFouls = 0;
    let localYellows = 0, localReds = 0;
    let rivalYellows = 0, rivalReds = 0;
    let localCorners = 0, rivalCorners = 0;
    let localOffsides = 0, rivalOffsides = 0;

    (events || []).forEach(e => {
      if (!e) return;
      const isHome = e.team === 'home' || e.isHome === true || e.isOwn === true || e.team === 'own' || (!e.team && !e.isRival);
      const t = e.type || '';

      if (t === 'shot_on_target_own' || (t.includes('shot') && t.includes('on') && isHome) || t === 'gol_local' || t === 'gol') {
        localShotsOn++;
      } else if (t === 'shot_on_target_rival' || (t.includes('shot') && t.includes('on') && !isHome) || t === 'gol_rival') {
        rivalShotsOn++;
      }

      if (t === 'duel_won') {
        if (isHome) localDuelsWon++; else rivalDuelsWon++;
      } else if (t === 'duel_lost') {
        if (isHome) localDuelsLost++; else rivalDuelsLost++;
      }

      if (t === 'foul_favor' || t === 'falta_favor') {
        rivalFouls++;
      } else if (t === 'foul_against' || t === 'falta_contra' || t === 'falta') {
        if (isHome) localFouls++; else rivalFouls++;
      }

      if (t === 'yellow_card' || t === 'amarilla' || t === 'card_yellow_own') {
        localYellows++;
      } else if (t === 'card_yellow_rival') {
        rivalYellows++;
      } else if (t === 'red_card' || t === 'roja' || t === 'card_red_own') {
        localReds++;
      } else if (t === 'card_red_rival') {
        rivalReds++;
      }

      if (t === 'corner_favor' || t === 'corner_own' || (t === 'corner' && isHome)) {
        localCorners++;
      } else if (t === 'corner_against' || t === 'corner_rival' || (t === 'corner' && !isHome)) {
        rivalCorners++;
      }

      if (t === 'offside_own' || (t === 'offside' && isHome)) {
        localOffsides++;
      } else if (t === 'offside_rival' || (t === 'offside' && !isHome)) {
        rivalOffsides++;
      }
    });

    if (homeStats && Object.keys(homeStats).length > 0) {
      if (typeof homeStats.tirosPuerta === 'number') localShotsOn = Math.max(localShotsOn, homeStats.tirosPuerta);
      if (typeof homeStats.corners === 'number') localCorners = Math.max(localCorners, homeStats.corners);
      if (typeof homeStats.faltas === 'number') localFouls = Math.max(localFouls, homeStats.faltas);
    }
    if (awayStats && Object.keys(awayStats).length > 0) {
      if (typeof awayStats.tirosPuerta === 'number') rivalShotsOn = Math.max(rivalShotsOn, awayStats.tirosPuerta);
      if (typeof awayStats.corners === 'number') rivalCorners = Math.max(rivalCorners, awayStats.corners);
      if (typeof awayStats.faltas === 'number') rivalFouls = Math.max(rivalFouls, awayStats.faltas);
    }

    const normShotsA = Math.min(100, Math.round((localShotsOn / 8) * 100));
    const normShotsB = Math.min(100, Math.round((rivalShotsOn / 8) * 100));

    // Duelos: Normalizado sobre 10 duelos ganados (10 = 100 pts)
    const normDuelsA = Math.min(100, Math.round((localDuelsWon / 10) * 100));
    const normDuelsB = Math.min(100, Math.round((rivalDuelsWon / 10) * 100));

    const normFoulsA = Math.min(100, Math.round((localFouls / 12) * 100));
    const normFoulsB = Math.min(100, Math.round((rivalFouls / 12) * 100));

    const normDiscA = Math.min(100, localYellows * 20 + localReds * 50);
    const normDiscB = Math.min(100, rivalYellows * 20 + rivalReds * 50);

    const normCornersA = Math.min(100, Math.round((localCorners / 8) * 100));
    const normCornersB = Math.min(100, Math.round((rivalCorners / 8) * 100));

    const normOffsidesA = Math.min(100, Math.round((localOffsides / 5) * 100));
    const normOffsidesB = Math.min(100, Math.round((rivalOffsides / 5) * 100));

    const valsA = [normShotsA, normDuelsA, normFoulsA, normDiscA, normCornersA, normOffsidesA];
    const valsB = [normShotsB, normDuelsB, normFoulsB, normDiscB, normCornersB, normOffsidesB];

    const axesLabels = isEn ? [
      'Shots on target',
      'Duels / Possession',
      'Fouls',
      'Cards (Discipline)',
      'Corners',
      'Offsides'
    ] : [
      'Tiros a puerta',
      'Duelos / Posesión',
      'Faltas',
      'Tarjetas (Sanciones)',
      'Córners',
      'Offsides'
    ];

    const cx = width / 2;
    const cy = (height - 46) / 2 + 15;
    const radius = Math.min(width, height - 70) * 0.35;
    const total = 6;
    const angleStep = (Math.PI * 2) / total;

    // 1. Niveles concéntricos
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach((lvl) => {
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
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${Math.round(lvl * 100)}`, cx, cy - radius * lvl - 2);
    });

    // 2. Ejes radiales y etiquetas
    for (let i = 0; i < total; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Posición de etiqueta
      const labelDist = radius + 22;
      const lx = cx + labelDist * Math.cos(angle);
      const ly = cy + labelDist * Math.sin(angle);

      ctx.font = 'bold 9.5px Arial, sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = Math.abs(Math.cos(angle)) < 0.3 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right');
      ctx.textBaseline = Math.abs(Math.sin(angle)) < 0.3 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom');
      ctx.fillText(axesLabels[i], lx, ly);

      // Puntos anotados (ej. "10 vs 0 pts")
      ctx.font = '8px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      const ptsSub = `${valsA[i]} vs ${valsB[i]} pts`;
      ctx.fillText(ptsSub, lx, ly + (Math.sin(angle) > 0 ? 11 : -11));
    }

    // 3. Polígono Equipo B (Rival)
    ctx.beginPath();
    for (let i = 0; i < total; i++) {
      const pct = Math.min(Math.max(valsB[i] / 100, 0.04), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * pct;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Polígono Equipo A (Local - Mi Equipo)
    ctx.beginPath();
    for (let i = 0; i < total; i++) {
      const pct = Math.min(Math.max(valsA[i] / 100, 0.04), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * pct;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 168, 67, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#D4A843';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vértices dorados Equipo A
    for (let i = 0; i < total; i++) {
      const pct = Math.min(Math.max(valsA[i] / 100, 0.04), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * pct;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#D4A843';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Leyenda en el fondo
    const legY = height - 20;
    ctx.font = 'bold 10.5px Arial, sans-serif';

    // Cuadro A
    ctx.fillStyle = '#D4A843';
    ctx.fillRect(cx - 150, legY - 10, 12, 12);
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${homeTeamName} (${isEn ? 'Home' : 'Local'})`, cx - 132, legY - 4);

    // Cuadro B
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(cx + 25, legY - 10, 12, 12);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`${awayTeamName} (${isEn ? 'Away' : 'Visitante'})`, cx + 43, legY - 4);

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawMatchRadarChartCanvas] Error:', e);
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
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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
export const drawMomentumChartCanvas = (events = [], matchDuration = 90, width = 640, height = 220, isEn = false) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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
    ctx.fillText(isEn ? 'MATCH MOMENTUM & DYNAMICS (OWN VS OPPONENT DOMINANCE)' : 'MOMENTUM & DINÁMICA DEL PARTIDO (DOMINIO PROPIO VS RIVAL)', padL, padT - 10);

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
    ctx.fillText(isEn ? 'HALF TIME (45\')' : 'DESCANSO (45\')', halfX, padT + plotH + 16);

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

/**
 * Helper para dibujar rectángulos redondeados en Canvas 2D compatible con todos los navegadores
 */
const drawCanvasRoundRect = (ctx, x, y, w, h, r) => {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

/**
 * Dibuja un terreno de juego táctico con la alineación titular completa (11 jugadores)
 * y el banquillo de suplentes en un Canvas 2D nativo a alta resolución,
 * garantizando cero distorsiones, contención estricta de fotos de jugadores y estilo profesional.
 *
 * @param {Object} options
 * @param {Object} options.matchData - Datos del partido (formación, alineación, customPositions, etc.)
 * @param {Array<string>} options.calledPlayers - IDs de jugadores convocados (0..10 titulares, 11.. suplentes)
 * @param {Array<Object>} options.players - Catálogo completo de jugadores
 * @param {Array<Object>} options.customFormations - Formaciones personalizadas
 * @param {boolean} options.isEn - Idioma inglés o español
 * @param {number} options.width - Ancho del canvas (defecto 720)
 * @param {number} options.height - Alto del canvas (defecto 510)
 * @returns {Promise<string>} DataURL base64 PNG
 */
export const drawTacticalPitchCanvas = async ({
  matchData = {},
  calledPlayers = [],
  players = [],
  customFormations = [],
  isEn = false,
  width = 720,
  height = 510
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Fondo exterior institucional oscuro
    ctx.fillStyle = '#0B1812';
    ctx.fillRect(0, 0, width, height);

    // 2. Campo de Juego Césped (Proporción Reglamentaria FIFA 105:68)
    // lw = 520px, lh = 337px -> 520/337 = 1.543:1 (Escala FIFA 105m x 68m)
    const lineInset = 10;
    const lw = 520;
    const lh = 337;
    const fieldW = lw + lineInset * 2; // 540px
    const fieldH = lh + lineInset * 2; // 357px
    const fieldX = Math.round((width - fieldW) / 2); // 90px (centrado)
    const fieldY = 14;
    const fieldR = 8;

    ctx.save();
    drawCanvasRoundRect(ctx, fieldX, fieldY, fieldW, fieldH, fieldR);
    ctx.clip();

    // Franjas de césped alternadas estilo estadio (10 franjas proporcionales)
    const bands = 10;
    const bandW = fieldW / bands;
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#1B4D24' : '#235F2D';
      ctx.fillRect(fieldX + i * bandW, fieldY, bandW, fieldH);
    }

    // Borde exterior suave del césped
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    drawCanvasRoundRect(ctx, fieldX, fieldY, fieldW, fieldH, fieldR);
    ctx.stroke();

    // Sombreado radial sutil
    const vigGrad = ctx.createRadialGradient(
      fieldX + fieldW / 2, fieldY + fieldH / 2, fieldW * 0.25,
      fieldX + fieldW / 2, fieldY + fieldH / 2, fieldW * 0.65
    );
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(fieldX, fieldY, fieldW, fieldH);
    ctx.restore();

    // 3. Líneas Oficiales del Terreno de Juego FIFA (Blanco nítido 88%)
    const lx = fieldX + lineInset; // 100px
    const ly = fieldY + lineInset; // 24px

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 2;

    // Línea perimetral
    ctx.strokeRect(lx, ly, lw, lh);

    // Línea de medio campo
    const midX = lx + lw / 2;
    const midY = ly + lh / 2;
    ctx.beginPath();
    ctx.moveTo(midX, ly);
    ctx.lineTo(midX, ly + lh);
    ctx.stroke();

    // Círculo central reglamentario (radio 9.15m en escala 68m = 45.3px)
    const centerRadius = Math.round((9.15 / 68) * lh); // 45px
    ctx.beginPath();
    ctx.arc(midX, midY, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Punto central
    ctx.beginPath();
    ctx.arc(midX, midY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Área grande reglamentaria (16.5m largo x 40.32m ancho)
    const penW = Math.round((16.5 / 105) * lw); // 82px
    const penH = Math.round((40.32 / 68) * lh); // 200px
    const penY = ly + (lh - penH) / 2;
    ctx.strokeRect(lx, penY, penW, penH);

    // Área pequeña reglamentaria (5.5m largo x 18.32m ancho)
    const gBoxW = Math.round((5.5 / 105) * lw); // 27px
    const gBoxH = Math.round((18.32 / 68) * lh); // 91px
    const gBoxY = ly + (lh - gBoxH) / 2;
    ctx.strokeRect(lx, gBoxY, gBoxW, gBoxH);

    // Punto de penalti izquierdo (11m)
    const penDist = Math.round((11 / 105) * lw); // 54px
    const lSpotX = lx + penDist;
    ctx.beginPath();
    ctx.arc(lSpotX, midY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Semicírculo del área izquierda (arco exterior)
    ctx.beginPath();
    ctx.arc(lSpotX, midY, centerRadius, -0.68, 0.68);
    ctx.stroke();

    // Portería izquierda (dorada reglamentaria fuera de la línea)
    ctx.strokeStyle = '#D4A843';
    ctx.strokeRect(lx - 8, ly + (lh - 50) / 2, 8, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';

    // Área grande derecha
    ctx.strokeRect(lx + lw - penW, penY, penW, penH);

    // Área pequeña derecha
    ctx.strokeRect(lx + lw - gBoxW, gBoxY, gBoxW, gBoxH);

    // Punto de penalti derecho (11m)
    const rSpotX = lx + lw - penDist;
    ctx.beginPath();
    ctx.arc(rSpotX, midY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Semicírculo del área derecha (arco exterior)
    ctx.beginPath();
    ctx.arc(rSpotX, midY, centerRadius, Math.PI - 0.68, Math.PI + 0.68);
    ctx.stroke();

    // Portería derecha (dorada reglamentaria fuera de la línea)
    ctx.strokeStyle = '#D4A843';
    ctx.strokeRect(lx + lw, ly + (lh - 50) / 2, 8, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';

    // Esquinas (Córners reglamentarios)
    ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx, ly + lh, 8, -Math.PI / 2, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx + lw, ly, 8, Math.PI / 2, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx + lw, ly + lh, 8, Math.PI, -Math.PI / 2); ctx.stroke();
    ctx.restore();

    // 4. Precargar fotos de jugadores convocados a Base64
    const imageMap = {};
    const loadImageElement = (src) => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const uniquePlayerIds = [...new Set((calledPlayers || []).filter(Boolean))];
    await Promise.all(
      uniquePlayerIds.map(async (pid) => {
        const p = players.find((x) => x && String(x.id) === String(pid));
        const url = p?.avatarUrl || p?.photoUrl || p?.photo || p?.photoPreview;
        if (url) {
          try {
            const b64 = await imageUrlToBase64(url, p?.name, false);
            if (b64) {
              const imgEl = await loadImageElement(b64);
              if (imgEl) imageMap[pid] = imgEl;
            }
          } catch (_) {}
        }
      })
    );

    // 5. Renderizado de los 11 Titulares en sus posiciones tácticas
    const lineupName = matchData?.lineup || '4-3-3';
    let formationPositions = PREDEFINED_FORMATIONS?.[lineupName];
    if (!formationPositions && Array.isArray(customFormations)) {
      const custom = customFormations.find((f) => f.name === lineupName);
      if (custom) formationPositions = custom.positions;
    }
    if (!formationPositions) formationPositions = PREDEFINED_FORMATIONS?.['4-3-3'] || [];

    const startersCount = 11;
    for (let idx = 0; idx < startersCount; idx++) {
      const posDef = formationPositions[idx] || { top: '50%', left: '50%', pos: 'MC' };
      const customPos = matchData?.customPositions?.[idx];
      const rawTop = parseFloat(customPos ? customPos.top : posDef.top);
      const rawLeft = parseFloat(customPos ? customPos.left : posDef.left);
      const clampedTop = Math.min(Math.max(rawTop, 12), 86);
      const clampedLeft = Math.min(Math.max(rawLeft, 8), 90);

      const cx = lx + (clampedLeft / 100) * lw;
      const cy = ly + (clampedTop / 100) * lh;

      const pid = (calledPlayers || [])[idx];
      const player = pid ? players.find((p) => p && String(p.id) === String(pid)) : null;
      const posLabel = (matchData?.customRoles && matchData.customRoles[idx]) || posDef.pos || 'DEF';

      // Tarjeta FIFA / Míster11 (Ancho: 44px, Alto: 50px)
      const cardW = 44;
      const cardH = 50;
      const cardX = cx - cardW / 2;
      const cardY = cy - cardH / 2;

      // Sombra de la ficha
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      // Marco de la tarjeta
      drawCanvasRoundRect(ctx, cardX, cardY, cardW, cardH, 7);
      if (player) {
        const goldGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        goldGrad.addColorStop(0, '#FFF5D0');
        goldGrad.addColorStop(0.5, '#D4A843');
        goldGrad.addColorStop(1, '#8C6207');
        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.strokeStyle = '#FFF8DC';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Avatar circular del jugador (Radio estricto: 13.5px = Diámetro: 27px)
      const avatarRadius = 13.5;
      const avatarCx = cx;
      const avatarCy = cardY + 18;

      const playerImg = pid ? imageMap[pid] : null;
      if (player && playerImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCx, avatarCy, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(playerImg, avatarCx - avatarRadius, avatarCy - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(avatarCx, avatarCy, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(avatarCx, avatarCy, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = player ? '#1B3A2D' : '#1E293B';
        ctx.fill();
        ctx.strokeStyle = player ? '#D4A843' : '#64748B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = player ? '#D4A843' : '#94A3B8';
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player ? (player.number || (player.name ? player.name.charAt(0).toUpperCase() : idx + 1)) : `${idx + 1}`, avatarCx, avatarCy);
      }

      // Dorsal (esquina superior izquierda de la tarjeta)
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.fillStyle = player ? '#172D21' : '#CBD5E1';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(player?.number ? `${player.number}` : `${idx + 1}`, cardX + 3, cardY + 3);

      // Posición (esquina superior derecha de la tarjeta)
      ctx.font = 'bold 7.5px Arial, sans-serif';
      ctx.fillStyle = player ? '#172D21' : '#CBD5E1';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(posLabel, cardX + cardW - 3, cardY + 3);

      // Banner inferior con nombre del jugador
      const bannerH = 11;
      const bannerY = cardY + cardH - bannerH - 2;
      const bannerW = cardW - 4;
      const bannerX = cardX + 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      drawCanvasRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, 3);
      ctx.fill();
      ctx.strokeStyle = player ? '#D4A843' : '#64748B';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 6.8px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let displayName = player ? (player.name || 'Jugador') : (isEn ? 'Empty' : 'Vacío');
      if (displayName.length > 9) displayName = displayName.substring(0, 8) + '.';
      ctx.fillText(displayName, bannerX + bannerW / 2, bannerY + bannerH / 2);
    }

    // 6. Bloque de Suplentes / Relevos en el inferior
    const benchX = 14;
    const benchY = fieldY + fieldH + 10;
    const benchH = height - benchY - 12; // ~117px
    const benchW = width - 28; // 692px

    ctx.fillStyle = '#172D21';
    drawCanvasRoundRect(ctx, benchX, benchY, benchW, benchH, 8);
    ctx.fill();
    ctx.strokeStyle = '#D4A843';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, benchX, benchY, benchW, benchH, 8);
    ctx.stroke();

    // Encabezado de suplentes
    const subsIds = (calledPlayers || []).slice(11).filter(Boolean);
    const subsPlayers = subsIds.map((pid) => players.find((p) => p && String(p.id) === String(pid))).filter(Boolean);

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#D4A843';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      isEn ? `CALLED SUBSTITUTES (${subsPlayers.length})` : `CONVOCADOS SUPLENTES (${subsPlayers.length})`,
      benchX + 16,
      benchY + 10
    );

    // Fichas estilizadas de suplentes
    if (subsPlayers.length > 0) {
      const chipW = 154;
      const chipH = 26;
      const gapX = 8;
      const gapY = 6;
      const maxCols = 4;
      const totalChipsW = maxCols * chipW + (maxCols - 1) * gapX; // 640px
      const startX = benchX + Math.round((benchW - totalChipsW) / 2); // 40px centrado
      const startY = benchY + 28;

      subsPlayers.forEach((sub, sIdx) => {
        const col = sIdx % maxCols;
        const row = Math.floor(sIdx / maxCols);
        const chipX = startX + col * (chipW + gapX);
        const chipY = startY + row * (chipH + gapY);

        if (chipY + chipH > benchY + benchH - 4) return;

        // Fondo del chip
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        drawCanvasRoundRect(ctx, chipX, chipY, chipW, chipH, 13);
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 168, 67, 0.4)';
        ctx.lineWidth = 1;
        drawCanvasRoundRect(ctx, chipX, chipY, chipW, chipH, 13);
        ctx.stroke();

        // Mini avatar suplente (Radio estricto: 9px = Diámetro: 18px)
        const subRadius = 9;
        const subCx = chipX + 14;
        const subCy = chipY + chipH / 2;

        const subImg = imageMap[sub.id];
        if (subImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(subCx, subCy, subRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(subImg, subCx - subRadius, subCy - subRadius, subRadius * 2, subRadius * 2);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(subCx, subCy, subRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#D4A843';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(subCx, subCy, subRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#D4A843';
          ctx.fill();
          ctx.fillStyle = '#172D21';
          ctx.font = 'bold 8.5px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sub.number ? `${sub.number}` : (sub.name ? sub.name[0] : '?'), subCx, subCy);
        }

        // Dorsal + Nombre
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let subNameText = `${sub.number ? sub.number + '. ' : ''}${sub.name || 'Jugador'}`;
        if (subNameText.length > 13) subNameText = subNameText.substring(0, 12) + '…';
        ctx.fillText(subNameText, chipX + 28, subCy);

        // Posición pill dorada
        const posW = 24;
        const posH = 14;
        const posX = chipX + chipW - posW - 6;
        const posY = chipY + (chipH - posH) / 2;
        ctx.fillStyle = 'rgba(212, 168, 67, 0.25)';
        drawCanvasRoundRect(ctx, posX, posY, posW, posH, 3);
        ctx.fill();
        ctx.fillStyle = '#D4A843';
        ctx.font = 'bold 7.5px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sub.position || 'SUP', posX + posW / 2, posY + posH / 2);
      });
    } else {
      ctx.font = 'italic 10.5px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(isEn ? 'No substitutes called' : 'Sin suplentes convocados', fieldX + 16, benchY + 36);
    }

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawTacticalPitchCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja las 4 Gráficas Donut de Eficiencia Táctica del partido en Canvas 2D nativo en alta resolución.
 * Donas: Duelos Ganados, Precisión de Tiro, Posesión Estimada, Eficacia de Gol.
 */
export const drawPostMatchDonutsCanvas = ({
  events = [],
  isEn = false,
  width = 660,
  height = 190
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo tarjeta blanca con borde sutil
    ctx.fillStyle = '#FFFFFF';
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.stroke();

    // Título de la sección
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      isEn ? 'TACTICAL EFFICIENCY (DONUT CHARTS)' : 'EFICIENCIA TÁCTICA DEL PARTIDO (GRÁFICAS DONUT)',
      18,
      14
    );

    const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
    const countOf = (types) => {
      const arr = Array.isArray(types) ? types : [types];
      return safeEvents.filter((e) => e && arr.includes(e.type)).length;
    };

    // Métricas robustas con soporte para alias
    const duelsWon = countOf(['duel_won', 'duelo_ganado']);
    const duelsLost = countOf(['duel_lost', 'duelo_perdido']);
    const totalDuels = duelsWon + duelsLost;
    const duelsPct = totalDuels > 0 ? Math.round((duelsWon / totalDuels) * 100) : 0;

    const shotsOn = countOf(['shot_on_target_own', 'shot_on_target', 'tiro_puerta']);
    const shotsOff = countOf(['shot_off_target_own', 'shot_off_target', 'tiro_fuera']);
    const totalShots = shotsOn + shotsOff;
    const shotsPct = totalShots > 0 ? Math.round((shotsOn / totalShots) * 100) : 0;

    const rec = countOf(['recovery', 'recuperacion']);
    const loss = countOf(['loss', 'ball_loss', 'perdida']);
    const totalPoss = rec + loss;
    const possPct = totalPoss > 0 ? Math.round((rec / totalPoss) * 100) : (safeEvents.length > 0 ? 50 : 0);

    const goalsOwn = countOf(['gol_local', 'goal_own', 'gol']);
    const finishingPct = totalShots > 0 ? Math.round((goalsOwn / totalShots) * 100) : 0;

    const donutsData = [
      {
        title: isEn ? 'DUELS WON' : 'DUELOS GANADOS',
        pct: duelsPct,
        val1: duelsWon,
        val2: duelsLost,
        label1: isEn ? 'Won' : 'Ganados',
        label2: isEn ? 'Lost' : 'Perdidos',
        color1: '#22C55E',
        color2: '#EF4444'
      },
      {
        title: isEn ? 'SHOT ACCURACY' : 'PRECISIÓN DE TIRO',
        pct: shotsPct,
        val1: shotsOn,
        val2: shotsOff,
        label1: isEn ? 'On Target' : 'A Puerta',
        label2: isEn ? 'Off' : 'Fuera',
        color1: '#0D9488',
        color2: '#F97316'
      },
      {
        title: isEn ? 'EST. POSSESSION' : 'POSESIÓN ESTIMADA',
        pct: possPct,
        val1: rec,
        val2: loss,
        label1: isEn ? 'Recov.' : 'Recup.',
        label2: isEn ? 'Losses' : 'Pérdidas',
        color1: '#3B82F6',
        color2: '#E11D48'
      },
      {
        title: isEn ? 'GOAL EFFICIENCY' : 'EFICACIA DE GOL',
        pct: finishingPct,
        val1: goalsOwn,
        val2: Math.max(0, totalShots - goalsOwn),
        label1: isEn ? 'Goals' : 'Goles',
        label2: isEn ? 'Shots' : 'Remates',
        color1: '#D4A843',
        color2: '#94A3B8'
      }
    ];

    const colW = width / 4;
    const radius = 34;
    const strokeW = 8;
    const centerY = 92;

    donutsData.forEach((d, idx) => {
      const cx = idx * colW + colW / 2;

      // Título de la dona
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.title, cx, 40);

      // Pista de fondo (círculo completo neutro)
      ctx.beginPath();
      ctx.arc(cx, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = strokeW;
      ctx.stroke();

      // Pista secundaria si hay eventos
      const totalVal = d.val1 + d.val2;
      if (totalVal > 0) {
        ctx.beginPath();
        ctx.arc(cx, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = d.color2;
        ctx.lineWidth = strokeW;
        ctx.stroke();

        // Arco primario (d.pct)
        if (d.pct > 0) {
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (d.pct / 100) * (Math.PI * 2);
          ctx.beginPath();
          ctx.arc(cx, centerY, radius, startAngle, endAngle);
          ctx.strokeStyle = d.color1;
          ctx.lineWidth = strokeW;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }

      // Porcentaje en el centro
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(totalVal > 0 ? `${d.pct}%` : '--%', cx, centerY);

      // Leyenda inferior con valores
      ctx.font = '8.5px Arial, sans-serif';
      ctx.fillStyle = '#1E293B';
      const legendText = `${d.val1} ${d.label1} / ${d.val2} ${d.label2}`;
      ctx.fillText(legendText, cx, 145);

      // Píldora de estado con color
      ctx.fillStyle = d.color1;
      ctx.beginPath();
      ctx.arc(cx - 38, 163, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748B';
      ctx.font = '7.8px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.label1, cx - 32, 163);

      ctx.fillStyle = d.color2;
      ctx.beginPath();
      ctx.arc(cx + 8, 163, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748B';
      ctx.fillText(d.label2, cx + 14, 163);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawPostMatchDonutsCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja las Barras Comparativas Propio vs Rival y el Desglose por Mitades en Canvas 2D de alta resolución.
 */
export const drawStatsComparisonAndHalvesCanvas = ({
  events = [],
  homeTeamName = 'Mi Equipo',
  awayTeamName = 'Rival',
  isEn = false,
  width = 660,
  height = 240
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo global blanco
    ctx.fillStyle = '#FFFFFF';
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.stroke();

    const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
    const countOf = (types) => {
      const arr = Array.isArray(types) ? types : [types];
      return safeEvents.filter((e) => e && arr.includes(e.type)).length;
    };

    // Métricas Cara a Cara robustas
    const shotsOnOwn = countOf(['shot_on_target_own', 'shot_on_target', 'tiro_puerta']);
    const shotsOffOwn = countOf(['shot_off_target_own', 'shot_off_target', 'tiro_fuera']);
    const totalShotsOwn = shotsOnOwn + shotsOffOwn;
    const shotsOnRival = countOf(['shot_on_target_rival', 'gol_rival', 'goal_rival']);
    const shotsOffRival = countOf(['shot_off_target_rival']);
    const totalShotsRival = shotsOnRival + shotsOffRival;

    const duelsWon = countOf(['duel_won', 'duelo_ganado']);
    const duelsLost = countOf(['duel_lost', 'duelo_perdido']);

    const rec = countOf(['recovery', 'recuperacion']);
    const loss = countOf(['loss', 'ball_loss', 'perdida']);
    const totalPoss = rec + loss;
    const possPctOwn = totalPoss > 0 ? Math.round((rec / totalPoss) * 100) : 50;
    const possPctRival = 100 - possPctOwn;

    const cornersOwn = countOf(['corner_favor', 'corner_own']);
    const cornersRival = countOf(['corner_against', 'corner_rival']);

    const foulsOwn = countOf(['foul_against', 'falta_contra', 'foul']);
    const foulsRival = countOf(['foul_favor', 'falta_favor']);

    const cardsOwn = countOf(['card_yellow_own', 'amarilla', 'yellow_card', 'card_red_own', 'roja', 'red_card']);
    const cardsRival = countOf(['card_yellow_rival', 'card_red_rival']);

    // ── COLUMNA IZQUIERDA: BARRAS COMPARATIVAS (Width: 320px) ──
    const col1X = 16;
    const col1W = (width - 48) * 0.52;

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isEn ? '⚔️ OWN VS OPPONENT COMPARISON' : '⚔️ COMPARATIVA PROPIO VS RIVAL', col1X, 14);

    // Leyenda de equipos
    ctx.font = 'bold 8.5px Arial, sans-serif';
    ctx.fillStyle = '#2E7D5C';
    ctx.fillText(`■ ${homeTeamName.substring(0, 16)}`, col1X, 32);
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'right';
    ctx.fillText(`${awayTeamName.substring(0, 16)} ■`, col1X + col1W, 32);

    const compRows = [
      { label: isEn ? 'Total Shots' : 'Tiros Totales', valA: totalShotsOwn, valB: totalShotsRival },
      { label: isEn ? 'Shots on Target' : 'Tiros a Puerta', valA: shotsOnOwn, valB: shotsOnRival },
      { label: isEn ? 'Duels Won' : 'Duelos Ganados', valA: duelsWon, valB: duelsLost },
      { label: isEn ? 'Possession %' : 'Posesión %', valA: possPctOwn, valB: possPctRival, isPct: true },
      { label: isEn ? 'Corner Kicks' : 'Córners', valA: cornersOwn, valB: cornersRival },
      { label: isEn ? 'Fouls' : 'Faltas', valA: foulsOwn, valB: foulsRival },
      { label: isEn ? 'Cards' : 'Tarjetas', valA: cardsOwn, valB: cardsRival },
    ];

    let rowY = 50;
    compRows.forEach((row) => {
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(row.label, col1X + col1W / 2, rowY);

      // Valores numéricos
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'left';
      ctx.fillText(row.isPct ? `${row.valA}%` : `${row.valA}`, col1X, rowY + 11);
      ctx.textAlign = 'right';
      ctx.fillText(row.isPct ? `${row.valB}%` : `${row.valB}`, col1X + col1W, rowY + 11);

      // Barra horizontal dual
      const barTrackX = col1X + 26;
      const barTrackW = col1W - 52;
      const barTrackY = rowY + 5;
      const barTrackH = 8;

      ctx.fillStyle = '#E2E8F0';
      drawCanvasRoundRect(ctx, barTrackX, barTrackY, barTrackW, barTrackH, 3);
      ctx.fill();

      const sum = (row.valA + row.valB) || 1;
      const pctA = row.isPct ? row.valA : Math.round((row.valA / sum) * 100);
      const wA = (pctA / 100) * barTrackW;

      if (wA > 0) {
        ctx.fillStyle = '#2E7D5C';
        drawCanvasRoundRect(ctx, barTrackX, barTrackY, wA, barTrackH, 3);
        ctx.fill();
      }

      if (barTrackW - wA > 0) {
        ctx.fillStyle = '#EF4444';
        drawCanvasRoundRect(ctx, barTrackX + wA, barTrackY, barTrackW - wA, barTrackH, 3);
        ctx.fill();
      }

      rowY += 26;
    });

    // Línea divisoria vertical
    const divX = col1X + col1W + 16;
    ctx.beginPath();
    ctx.moveTo(divX, 14);
    ctx.lineTo(divX, height - 14);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── COLUMNA DERECHA: DESGLOSE POR MITADES ──
    const col2X = divX + 16;
    const col2W = width - col2X - 16;

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.fillText(isEn ? '⏱️ HALVES BREAKDOWN (1H VS 2H)' : '⏱️ DESGLOSE POR MITADES (1T VS 2T)', col2X, 14);

    const isT2 = (e) => {
      if (!e) return false;
      if (e.half !== undefined && e.half !== null && e.half !== '') {
        const h = Number(e.half);
        if (!isNaN(h) && h > 0) return h === 2;
      }
      const m = Number(e.minute || e.minuto || e.time || 0);
      return m > 45;
    };
    const isT1 = (e) => {
      if (!e) return false;
      if (e.half !== undefined && e.half !== null && e.half !== '') {
        const h = Number(e.half);
        if (!isNaN(h) && h > 0) return h === 1;
      }
      const m = Number(e.minute || e.minuto || e.time || 0);
      return m <= 45;
    };

    const t1Events = safeEvents.filter(isT1);
    const t2Events = safeEvents.filter(isT2);

    const getHCount = (list, types) => list.filter((e) => types.includes(e.type)).length;

    const halvesData = [
      {
        label: isEn ? 'Total Events' : 'Eventos Totales',
        t1: t1Events.length,
        t2: t2Events.length,
        icon: '📊'
      },
      {
        label: isEn ? 'Shots on Target' : 'Remates a Puerta',
        t1: getHCount(t1Events, ['shot_on_target_own']),
        t2: getHCount(t2Events, ['shot_on_target_own']),
        icon: '🎯'
      },
      {
        label: isEn ? 'Goals in Favor' : 'Goles a Favor',
        t1: getHCount(t1Events, ['gol_local', 'goal_own']),
        t2: getHCount(t2Events, ['gol_local', 'goal_own']),
        icon: '⚽'
      },
      {
        label: isEn ? 'Ball Recoveries' : 'Recuperaciones',
        t1: getHCount(t1Events, ['recovery']),
        t2: getHCount(t2Events, ['recovery']),
        icon: '🔄'
      },
      {
        label: isEn ? 'Fouls Committed' : 'Faltas Cometidas',
        t1: getHCount(t1Events, ['foul_against']),
        t2: getHCount(t2Events, ['foul_against']),
        icon: '⚡'
      },
      {
        label: isEn ? 'Cards Issued' : 'Tarjetas',
        t1: getHCount(t1Events, ['amarilla', 'roja', 'card_yellow_own', 'card_red_own']),
        t2: getHCount(t2Events, ['amarilla', 'roja', 'card_yellow_own', 'card_red_own']),
        icon: '🟨'
      },
      {
        label: isEn ? 'Duels Won' : 'Duelos Ganados',
        t1: getHCount(t1Events, ['duel_won']),
        t2: getHCount(t2Events, ['duel_won']),
        icon: '✊'
      }
    ];

    let hRowY = 38;
    halvesData.forEach((item) => {
      // Caja de la fila
      ctx.fillStyle = '#F8FAFC';
      drawCanvasRoundRect(ctx, col2X, hRowY, col2W, 24, 4);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      drawCanvasRoundRect(ctx, col2X, hRowY, col2W, 24, 4);
      ctx.stroke();

      // Etiqueta
      ctx.font = 'bold 8.5px Arial, sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.icon} ${item.label}`, col2X + 8, hRowY + 12);

      // Badge 1T
      const badge1W = 44;
      const badge1X = col2X + col2W - badge1W * 2 - 12;
      ctx.fillStyle = '#E0F2FE';
      drawCanvasRoundRect(ctx, badge1X, hRowY + 4, badge1W, 16, 3);
      ctx.fill();
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.fillStyle = '#0369A1';
      ctx.textAlign = 'center';
      ctx.fillText(`1T: ${item.t1}`, badge1X + badge1W / 2, hRowY + 12);

      // Badge 2T
      const badge2X = col2X + col2W - badge1W - 6;
      ctx.fillStyle = '#FEF3C7';
      drawCanvasRoundRect(ctx, badge2X, hRowY + 4, badge1W, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#B45309';
      ctx.fillText(`2T: ${item.t2}`, badge2X + badge1W / 2, hRowY + 12);

      hRowY += 28;
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawStatsComparisonAndHalvesCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja la Distribución Táctica por Sectores en Canvas 2D de alta resolución.
 */
export const drawSectorsDistributionCanvas = ({
  events = [],
  isEn = false,
  width = 660,
  height = 80
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    drawCanvasRoundRect(ctx, 0, 0, width, height, 8);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, 0, 0, width, height, 8);
    ctx.stroke();

    const safeEvents = Array.isArray(events) ? events.filter(Boolean) : [];
    const sectorLeft = safeEvents.filter((e) => e.sector === 'left').length;
    const sectorCenter = safeEvents.filter((e) => e.sector === 'center').length;
    const sectorRight = safeEvents.filter((e) => e.sector === 'right').length;
    const totalSectors = sectorLeft + sectorCenter + sectorRight;

    const pctLeft = totalSectors > 0 ? Math.round((sectorLeft / totalSectors) * 100) : 33;
    const pctCenter = totalSectors > 0 ? Math.round((sectorCenter / totalSectors) * 100) : 34;
    const pctRight = totalSectors > 0 ? Math.max(0, 100 - pctLeft - pctCenter) : 33;

    // Encabezado
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      isEn ? '📍 PITCH SECTOR DISTRIBUTION' : '📍 DISTRIBUCIÓN TÁCTICA POR SECTORES',
      14,
      10
    );

    const sectors = [
      {
        name: isEn ? '⬅️ Left Wing' : '⬅️ Banda Izquierda',
        count: sectorLeft,
        pct: pctLeft,
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.08)'
      },
      {
        name: isEn ? '⏺️ Center Corridor' : '⏺️ Pasillo Central',
        count: sectorCenter,
        pct: pctCenter,
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)'
      },
      {
        name: isEn ? '➡️ Right Wing' : '➡️ Banda Derecha',
        count: sectorRight,
        pct: pctRight,
        color: '#0D9488',
        bg: 'rgba(13, 148, 136, 0.08)'
      }
    ];

    const boxW = (width - 48) / 3;
    const boxY = 28;
    const boxH = 42;

    sectors.forEach((sec, idx) => {
      const bx = 14 + idx * (boxW + 10);

      ctx.fillStyle = sec.bg;
      drawCanvasRoundRect(ctx, bx, boxY, boxW, boxH, 6);
      ctx.fill();
      ctx.strokeStyle = sec.color;
      ctx.lineWidth = 1;
      drawCanvasRoundRect(ctx, bx, boxY, boxW, boxH, 6);
      ctx.stroke();

      ctx.font = 'bold 8.5px Arial, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sec.name, bx + 10, boxY + 14);

      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = sec.color;
      ctx.textAlign = 'right';
      ctx.fillText(`${sec.pct}%`, bx + boxW - 10, boxY + 14);

      // Mini barra indicadora de porcentaje
      const barX = bx + 10;
      const barY = boxY + 26;
      const barW = boxW - 20;
      const barH = 5;

      ctx.fillStyle = '#E2E8F0';
      drawCanvasRoundRect(ctx, barX, barY, barW, barH, 2);
      ctx.fill();

      const filledW = (sec.pct / 100) * barW;
      if (filledW > 0) {
        ctx.fillStyle = sec.color;
        drawCanvasRoundRect(ctx, barX, barY, filledW, barH, 2);
        ctx.fill();
      }

      ctx.font = '7.5px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'right';
      ctx.fillText(`${sec.count} ${isEn ? 'actions' : 'acciones'}`, bx + boxW - 10, barY + 9);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawSectorsDistributionCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja el Bloque de Exigencia y Rendimiento de Portería (Fase 2 y 3)
 */
export const drawGkExertionCanvas = ({
  gkIndices = {},
  isEn = false,
  width = 660,
  height = 200
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo tarjeta
    ctx.fillStyle = '#FFFFFF';
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.stroke();

    // Encabezado
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      isEn ? '🧤 GOALKEEPING EXERTION & DEFENSIVE EXPOSURE' : '🧤 EXIGENCIA DE PORTERÍA Y EXPOSICIÓN DEFENSIVA',
      18,
      14
    );

    // Badge Tarde Exigente o Controlada
    const isDemanding = gkIndices.isDemandingMatch || (gkIndices.gkExertionIndex >= 6);
    const badgeText = isDemanding
      ? (isEn ? '🔥 DEMANDING MATCH (EXERTION >= 6)' : '🔥 TARDE EXIGENTE (EXIGENCIA >= 6)')
      : (isEn ? '🛡️ CONTROLLED MATCH' : '🛡️ EXIGENCIA CONTROLADA');
    const badgeBg = isDemanding ? '#FEF2F2' : '#F0FDF4';
    const badgeBorder = isDemanding ? '#F87171' : '#4ADE80';
    const badgeColor = isDemanding ? '#DC2626' : '#16A34A';

    ctx.font = 'bold 9px Arial, sans-serif';
    const bW = ctx.measureText(badgeText).width + 16;
    ctx.fillStyle = badgeBg;
    drawCanvasRoundRect(ctx, width - 18 - bW, 11, bW, 20, 10);
    ctx.fill();
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 1;
    drawCanvasRoundRect(ctx, width - 18 - bW, 11, bW, 20, 10);
    ctx.stroke();
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, width - 18 - bW / 2, 21);

    // 4 Fichas de Métricas Principales
    const metricsCards = [
      {
        title: isEn ? 'GK Exertion Index' : 'Índice de Exigencia',
        val: `${gkIndices.gkExertionIndex ?? 0}`,
        sub: isEn ? 'Saves + 2xDecisive' : 'Paradas + 2xDecisivas',
        color: isDemanding ? '#DC2626' : '#2563EB'
      },
      {
        title: isEn ? 'Decisive Saves' : 'Paradas Decisivas',
        val: `${gkIndices.decisiveSaves ?? 0}`,
        sub: `${isEn ? 'Total Saves' : 'Total Paradas'}: ${gkIndices.totalSaves ?? 0}`,
        color: '#D97706'
      },
      {
        title: isEn ? 'Save Efficiency %' : '% Eficacia Paradas',
        val: `${gkIndices.totalSavePct ?? 100}%`,
        sub: `${gkIndices.concededGoals ?? 0} ${isEn ? 'Conceded' : 'Encajados'}`,
        color: '#16A34A'
      },
      {
        title: isEn ? 'Opponent Comfort' : 'Comodidad Rival',
        val: `${gkIndices.rivalComfortPct ?? 0}%`,
        sub: isEn ? 'Comfortable Shots' : 'Tiros Cómodos',
        color: (gkIndices.rivalComfortPct >= 40) ? '#DC2626' : '#0D9488'
      }
    ];

    const cardY = 38;
    const cardH = 58;
    const cardW = (width - 36 - 30) / 4;

    metricsCards.forEach((c, idx) => {
      const cx = 18 + idx * (cardW + 10);
      ctx.fillStyle = '#F8FAFC';
      drawCanvasRoundRect(ctx, cx, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      drawCanvasRoundRect(ctx, cx, cardY, cardW, cardH, 8);
      ctx.stroke();

      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(c.title, cx + 10, cardY + 8);

      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillStyle = c.color;
      ctx.fillText(c.val, cx + 10, cardY + 20);

      ctx.font = '7.5px Arial, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(c.sub, cx + 10, cardY + 42);
    });

    // Subbloque: Desglose de Exposición Defensiva por Zona
    const expY = 106;
    const expH = 78;
    const expW = width - 36;
    ctx.fillStyle = '#0F172A';
    drawCanvasRoundRect(ctx, 18, expY, expW, expH, 8);
    ctx.fill();

    ctx.font = 'bold 9.5px Arial, sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isEn ? 'DEFENSIVE EXPOSURE BREAKDOWN' : 'DESGLOSE DE EXPOSICIÓN DEFENSIVA', 28, expY + 10);

    const map = gkIndices.defensiveExposureMap || {};
    const centerT = map.dentro_centro?.total ?? 0;
    const centerC = map.dentro_centro?.comodo ?? 0;
    const wingsT = map.dentro_lateral?.total ?? 0;
    const wingsC = map.dentro_lateral?.comodo ?? 0;
    const outT = map.fuera?.total ?? 0;
    const outC = map.fuera?.comodo ?? 0;

    const expZones = [
      {
        name: isEn ? 'Central Box' : 'Área Central',
        text: `${centerT} ${isEn ? 'shots' : 'tiros'} (${centerC} ${isEn ? 'comfortable' : 'cómodos'})`,
        status: centerC >= 2 ? '#EF4444' : '#22C55E'
      },
      {
        name: isEn ? 'Wide Box' : 'Área Lateral',
        text: `${wingsT} ${isEn ? 'shots' : 'tiros'} (${wingsC} ${isEn ? 'comfortable' : 'cómodos'})`,
        status: wingsC >= 2 ? '#F59E0B' : '#22C55E'
      },
      {
        name: isEn ? 'Outside Box' : 'Fuera del Área',
        text: `${outT} ${isEn ? 'shots' : 'tiros'} (${outC} ${isEn ? 'comfortable' : 'cómodos'})`,
        status: '#3B82F6'
      }
    ];

    const colW = (expW - 20) / 3;
    expZones.forEach((z, zIdx) => {
      const zx = 28 + zIdx * colW;
      ctx.font = 'bold 9.5px Arial, sans-serif';
      ctx.fillStyle = z.status;
      ctx.fillText(z.name, zx, expY + 28);

      ctx.font = '8.5px Arial, sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(z.text, zx, expY + 44);
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawGkExertionCanvas] Error:', e);
    return null;
  }
};

/**
 * Dibuja el Mapa de Remates con xG-Lite y Comodidad (Fase 2 y 5)
 */
export const drawShotMapCanvas = ({
  shots = [],
  ownXg = 0,
  rivalXg = 0,
  isEn = false,
  width = 660,
  height = 240
}) => {
  try {
    const scale = CANVAS_DPI_SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo tarjeta blanca
    ctx.fillStyle = '#FFFFFF';
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    drawCanvasRoundRect(ctx, 0, 0, width, height, 10);
    ctx.stroke();

    // Título y resumen de xG
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#172D21';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isEn ? '🎯 SHOT MAPS & xG-LITE MODEL' : '🎯 MAPAS DE TIROS Y MODELO xG-LITE', 18, 14);

    const xgBadge = `${isEn ? 'Own xG' : 'xG Propio'}: ${ownXg}  |  ${isEn ? 'Opponent xG' : 'xG Rival'}: ${rivalXg}`;
    ctx.font = 'bold 9px Arial, sans-serif';
    const xgW = ctx.measureText(xgBadge).width + 16;
    ctx.fillStyle = '#F1F5F9';
    drawCanvasRoundRect(ctx, width - 18 - xgW, 11, xgW, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(xgBadge, width - 18 - xgW / 2, 21);

    // Medio campo de fútbol sintético para graficar remates
    const pX = 18;
    const pY = 38;
    const pW = width - 36;
    const pH = height - 52;

    ctx.fillStyle = '#1B4D24';
    drawCanvasRoundRect(ctx, pX, pY, pW, pH, 8);
    ctx.fill();

    // Líneas del campo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;

    // Área grande (en la derecha, atacando hacia portería en x: 100)
    const boxW = pW * 0.28;
    const boxH = pH * 0.65;
    const boxY = pY + (pH - boxH) / 2;
    ctx.strokeRect(pX + pW - boxW, boxY, boxW, boxH);

    // Área pequeña
    const smallW = pW * 0.12;
    const smallH = pH * 0.35;
    const smallY = pY + (pH - smallH) / 2;
    ctx.strokeRect(pX + pW - smallW, smallY, smallW, smallH);

    // Punto de penalti
    ctx.beginPath();
    ctx.arc(pX + pW - (pW * 0.18), pY + pH / 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Portería exterior
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(pX + pW - 3, pY + (pH - smallH) / 2 + 5, 3, smallH - 10);

    // Graficar cada remate
    const safeShots = Array.isArray(shots) ? shots : [];
    safeShots.forEach(s => {
      const sx = typeof s.x === 'number' ? s.x : 80;
      const sy = typeof s.y === 'number' ? s.y : 50;
      const posX = pX + (sx / 100) * pW;
      const posY = pY + (sy / 100) * pH;

      const isGoal = s.outcome === 'goal' || s.isGoal || s.result === 'gol';
      const isSaved = s.result === 'parada' || s.outcome === 'on_target';

      let dotColor = '#94A3B8';
      if (isGoal) dotColor = '#22C55E';
      else if (isSaved) dotColor = '#3B82F6';

      const radius = isGoal ? 7 : 5;
      ctx.beginPath();
      ctx.arc(posX, posY, radius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Etiqueta de xG
      if (s.xG !== undefined) {
        ctx.font = 'bold 7px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`${s.xG}`, posX, posY - 8);
      }
    });

    return canvas.toDataURL('image/png', 0.95);
  } catch (e) {
    console.warn('[drawShotMapCanvas] Error:', e);
    return null;
  }
};


