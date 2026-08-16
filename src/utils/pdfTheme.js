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
const blobToDataURL = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
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
