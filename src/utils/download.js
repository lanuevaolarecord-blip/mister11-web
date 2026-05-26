import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// ─── HELPER: Guarda en caché y lanza el visor nativo ─────────────────────────
// En Android 13+ WRITE_EXTERNAL_STORAGE no existe. La forma correcta es:
//   1. Escribir en Directory.Cache (no requiere permiso)
//   2. Abrir el archivo con el visor nativo del sistema (Share/Intent)
// En Android ≤12 también funciona igual, así que usamos esta vía siempre.

const _saveToCache = async (filename, base64Data) => {
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });
  return result.uri;
};

const _openNative = async (uri, mimeType, filename, base64Data) => {
  try {
    await Share.share({
      title: 'MISTER 11',
      url: uri,
      dialogTitle: 'Guardar o compartir archivo',
    });
    return;
  } catch (err) {
    console.error('[download] Share failed, trying Documents dir:', err);
    try {
      await Filesystem.writeFile({
        path: `Mister11/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      alert(`✅ Archivo guardado en Documentos/Mister11/${filename}`);
    } catch (saveErr) {
      console.error('[download] Documents save failed:', saveErr);
      window.open(uri, '_system');
    }
  }
};

// ─── PDF ──────────────────────────────────────────────────────────────────────
export const downloadPDF = async (base64Data, filename) => {
  if (!base64Data) throw new Error('No hay datos para descargar');

  if (Capacitor.isNativePlatform()) {
    try {
      const uri = await _saveToCache(filename, base64Data);
      await _openNative(uri, 'application/pdf', filename, base64Data);
      // Aviso siempre como respaldo visual
      alert(`✅ PDF listo: "${filename}"\nSi no se abre automáticamente, búscalo en la carpeta Descargas.`);
    } catch (err) {
      console.error('[download] Error PDF Android:', err);
      alert(`Error al guardar el PDF: ${err.message || err}`);
    }
  } else {
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,' + base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 150);
  }
};

// ─── JSON / Backup ────────────────────────────────────────────────────────────
export const downloadJSON = async (jsonString, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      const uri = await _saveToCache(filename, base64);
      await _openNative(uri, 'application/json', filename, base64);
      alert(`✅ Archivo exportado exitosamente.`);
    } catch (err) {
      console.error('[download] Error JSON Android:', err);
      _downloadJSONWeb(jsonString, filename);
    }
  } else {
    _downloadJSONWeb(jsonString, filename);
  }
};

// ─── Imagen ───────────────────────────────────────────────────────────────────
export const downloadImage = async (dataUrl, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const uri = await _saveToCache(filename, base64);
      await _openNative(uri, 'image/png', filename, base64);
      alert(`✅ Imagen exportada exitosamente.`);
    } catch (err) {
      console.error('[download] Error Imagen Android:', err);
      _downloadImageWeb(dataUrl, filename);
    }
  } else {
    _downloadImageWeb(dataUrl, filename);
  }
};

// ─── Web fallbacks ────────────────────────────────────────────────────────────
const _downloadJSONWeb = (jsonString, filename) => {
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 150);
  } catch (err) {
    console.error('[download] Error _downloadJSONWeb:', err);
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
    console.error('[download] Error _downloadImageWeb:', err);
  }
};

// ─── CSV ──────────────────────────────────────────────────────────────────────
export const downloadCSV = async (csvString, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(csvString)));
      const uri = await _saveToCache(filename, base64);
      await _openNative(uri, 'text/csv', filename, base64);
      alert(`✅ Plantilla exportada exitosamente.`);
    } catch (err) {
      console.error('[download] Error CSV Android:', err);
      _downloadCSVWeb(csvString, filename);
    }
  } else {
    _downloadCSVWeb(csvString, filename);
  }
};

const _downloadCSVWeb = (csvString, filename) => {
  try {
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 150);
  } catch (err) {
    console.error('[download] Error _downloadCSVWeb:', err);
  }
};

// ─── Video (Animaciones) ──────────────────────────────────────────────────────
export const downloadVideo = async (base64Data, filename, mimeType) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const uri = await _saveToCache(filename, base64Data);
      await _openNative(uri, mimeType, filename, base64Data);
      alert(`✅ Animación exportada exitosamente.`);
    } catch (err) {
      console.error('[download] Error Video Android:', err);
      _downloadVideoWeb(base64Data, filename, mimeType);
    }
  } else {
    _downloadVideoWeb(base64Data, filename, mimeType);
  }
};

const _downloadVideoWeb = (base64Data, filename, mimeType) => {
  try {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 150);
  } catch (err) {
    console.error('[download] Error _downloadVideoWeb:', err);
  }
};
