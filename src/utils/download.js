/**
 * download.js – Utilidad unificada de descarga para Míster11
 * ──────────────────────────────────────────────────────────
 * En Android APK (Capacitor) usa Filesystem.writeFile() para
 * guardar en la carpeta de Descargas sin problemas de permisos.
 * En navegador web usa el método clásico de blob + <a>.
 */

/**
 * Detecta si la app corre en un dispositivo nativo (Android/iOS APK).
 * @returns {boolean}
 */
const isNative = () => {
  try {
    // Capacitor inyecta window.Capacitor en el WebView nativo
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch {
    return false;
  }
};

/**
 * Convierte un blob a base64 (sin el prefijo data:…)
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result = "data:<mime>;base64,<data>"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Descarga un archivo PDF desde un documento jsPDF.
 * @param {import('jspdf').jsPDF} doc  Instancia de jsPDF ya construida.
 * @param {string} filename            Nombre del archivo (ej. "Informe.pdf").
 */
export const downloadPDF = async (doc, filename) => {
  if (isNative()) {
    try {
      // Importación dinámica para no romper en web donde no existe el plugin
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const pdfBlob = doc.output('blob');
      const base64 = await blobToBase64(pdfBlob);
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Downloads,
        recursive: true,
      });
      // Notificación ligera
      if (window.Capacitor?.Plugins?.Toast) {
        window.Capacitor.Plugins.Toast.show({ text: `✅ PDF guardado en Descargas: ${filename}` });
      } else {
        alert(`✅ PDF guardado en Descargas:\n${filename}`);
      }
    } catch (err) {
      console.error('[download.js] Error guardando PDF en Android:', err);
      // Fallback: intentar con método web
      _downloadPDFWeb(doc, filename);
    }
  } else {
    _downloadPDFWeb(doc, filename);
  }
};

/**
 * Descarga un archivo JSON (animación de pizarra, etc.).
 * @param {string} jsonString  Contenido JSON serializado.
 * @param {string} filename    Nombre del archivo.
 */
export const downloadJSON = async (jsonString, filename) => {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      // JSON ya es texto plano; Filesystem acepta strings directamente
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Downloads,
        recursive: true,
      });
      alert(`✅ Archivo guardado en Descargas:\n${filename}`);
    } catch (err) {
      console.error('[download.js] Error guardando JSON en Android:', err);
      _downloadJSONWeb(jsonString, filename);
    }
  } else {
    _downloadJSONWeb(jsonString, filename);
  }
};

/**
 * Descarga una imagen (data URL o URL remota).
 * @param {string} dataUrl   Data URL (data:image/png;base64,…) o URL http.
 * @param {string} filename  Nombre del archivo.
 */
export const downloadImage = async (dataUrl, filename) => {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      // Extraer el base64 si es data URL
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Downloads,
        recursive: true,
      });
      alert(`✅ Imagen guardada en Descargas:\n${filename}`);
    } catch (err) {
      console.error('[download.js] Error guardando imagen en Android:', err);
      _downloadImageWeb(dataUrl, filename);
    }
  } else {
    _downloadImageWeb(dataUrl, filename);
  }
};

// ── Helpers internos para web ────────────────────────────────────────────────

const _downloadPDFWeb = (doc, filename) => {
  try {
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error('[download.js] Error en _downloadPDFWeb:', err);
    alert('No se pudo descargar el archivo. Intenta desde un navegador de escritorio.');
  }
};

const _downloadJSONWeb = (jsonString, filename) => {
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error('[download.js] Error en _downloadJSONWeb:', err);
  }
};

const _downloadImageWeb = (dataUrl, filename) => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 150);
  } catch (err) {
    console.error('[download.js] Error en _downloadImageWeb:', err);
  }
};
