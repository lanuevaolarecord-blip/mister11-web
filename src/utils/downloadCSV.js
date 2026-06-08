import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { showToast } from './toast';

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
    const canShare = await Share.canShare();
    if (canShare?.value) {
      await Share.share({
        title: 'MISTER 11 - Guardar archivo',
        files: [uri],
        dialogTitle: 'Guardar o compartir en...',
      });
      return;
    }
  } catch (shareErr) {
    console.warn('[downloadCSV] Share.share falló, intentando Documents:', shareErr);
  }

  try {
    await Filesystem.writeFile({
      path: `Mister11/${filename}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
    showToast(`✅ Guardado en: Documentos/Mister11/${filename}`, 'success');
  } catch (docErr) {
    console.error('[downloadCSV] Documents también falló:', docErr);
    try { window.open(uri, '_system'); } catch (_) {}
    showToast(`Guardado en caché. Si no se abre, busca "${filename}" en Archivos`, 'info');
  }
};

export const downloadCSV = async (csvString, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(csvString)));
      const uri = await _saveToCache(filename, base64);
      await _openNative(uri, 'text/csv', filename, base64);
      showToast(`✅ Plantilla exportada exitosamente.`, 'success');
    } catch (err) {
      console.error('[downloadCSV] Error CSV Android:', err);
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
    console.error('[downloadCSV] Error _downloadCSVWeb:', err);
  }
};
