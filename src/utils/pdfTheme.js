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
export const imageUrlToBase64 = async (url, fallbackInitials = 'M11', isAvatar = false) => {
  if (!url) {
    return isAvatar ? generateInitialsAvatar(fallbackInitials) : null;
  }

  // 1. Si la URL ya es una cadena DataURL (data:...)
  if (typeof url === 'string' && url.startsWith('data:')) {
    if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
      return url;
    }
    // Convertir WebP / SVG u otros data URLs a PNG nativo mediante Canvas para asegurar compatibilidad con jsPDF
    try {
      const convertedPng = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 600;
            canvas.height = img.naturalHeight || img.height || 350;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png', 1.0));
          } catch (e) {
            resolve(url);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
      if (convertedPng) return convertedPng;
    } catch (e) {
      return url;
    }
  }

  // Helper: promise que se resuelve en null tras N ms (evita cuelgues indefinidos)
  const withTimeout = (promise, ms = 7000) =>
    Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

  // 2. Si es una URL remota HTTP / HTTPS o gs://
  if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('gs://'))) {

    // A. Firebase Storage SDK getBlob
    if (url.includes('firebasestorage') || url.startsWith('gs://')) {
      try {
        const base64 = await withTimeout(
          (async () => {
            let fileRef;
            if (url.startsWith('gs://')) {
              fileRef = storageRef(storage, url);
            } else {
              try { fileRef = storageRef(storage, url); } catch (e) { fileRef = null; }
            }
            if (!fileRef) return null;
            const blob = await getBlob(fileRef);
            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          })(),
          7000
        );
        if (base64) {
          return base64;
        }
      } catch (sdkErr) {
        console.warn('[pdfTheme] getBlob falló:', sdkErr);
      }
    }

    // B. fetch blob con nocache
    try {
      const cleanUrl = url.includes('firebasestorage')
        ? (url.includes('?') ? `${url}&nocache=${Date.now()}` : `${url}?nocache=${Date.now()}`)
        : url;
      const base64 = await withTimeout(
        (async () => {
          const res = await fetch(cleanUrl, { mode: 'cors' });
          if (!res.ok) return null;
          const blob = await res.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        })(),
        7000
      );
      if (base64) return base64;
    } catch (e) {
      console.warn('[pdfTheme] fetch blob falló:', e);
    }

    // C. Image element + Canvas
    try {
      const pngBase64 = await withTimeout(
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width || 600;
              canvas.height = img.naturalHeight || img.height || 350;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/png', 1.0));
            } catch (e) { resolve(null); }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        }),
        7000
      );
      if (pngBase64) return pngBase64;
    } catch (e) {
      console.warn('[pdfTheme] Image/Canvas falló:', e);
    }
  }

  // 3. Fallback avatar con iniciales solo para avatares de jugador
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
