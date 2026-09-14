import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { showToast } from './toast.js';
import { t } from '../i18n/index.js';

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
  // Primero intentamos compartir con el sheet nativo de Android
  // La API correcta para archivos es { files: [uri] }, NO { url: uri }
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
    console.warn('[download] Share.share falló, intentando Documents:', shareErr);
  }

  // Fallback: guardar directamente en Documents/Mister11/
  try {
    await Filesystem.writeFile({
      path: `Mister11/${filename}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
    showToast(t('download.saved_in', { path: `Documentos/Mister11/${filename}` }), 'success');
  } catch (docErr) {
    console.error('[download] Documents también falló:', docErr);
    // Último fallback: abrir directamente
    try { window.open(uri, '_system'); } catch (_) {}
    showToast(t('download.cache_hint', { filename }), 'info');
  }
};

// ─── PDF ──────────────────────────────────────────────────────────────────────
export const downloadPDF = async (base64Data, filename) => {
  if (!base64Data) throw new Error('No hay datos para descargar');

  if (Capacitor.isNativePlatform()) {
    try {
      const uri = await _saveToCache(filename, base64Data);
      await _openNative(uri, 'application/pdf', filename, base64Data);
      showToast(t('download.pdf_ready', { filename }), 'success');
    } catch (err) {
      console.error('[download] Error PDF Android:', err);
      showToast(t('download.pdf_error'), 'error');
    }
  } else {
    try {
      // Usar Blob URL para evitar límites de tamaño de dataURL y bloqueos en Chrome/Safari
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 500);
    } catch (blobErr) {
      console.warn('Fallback a data URI para PDF:', blobErr);
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + base64Data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 150);
    }
  }
};

// ─── JSON / Backup ────────────────────────────────────────────────────────────
export const downloadJSON = async (jsonString, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      const uri = await _saveToCache(filename, base64);
      await _openNative(uri, 'application/json', filename, base64);
      showToast(t('download.json_success'), 'success');
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
      showToast(t('download.image_success'), 'success');
    } catch (err) {
      console.error('[download] Error Imagen Android:', err);
      _downloadImageWeb(dataUrl, filename);
    }
  } else {
    _downloadImageWeb(dataUrl, filename);
  }
};

// ─── Alineación PNG con Verificación Real por Plataforma ───────────────────────
export const downloadLineupPNG = async (dataUrl, metadata = {}) => {
  if (!dataUrl) {
    showToast(t('download.generic_error'), 'error');
    return { success: false, error: 'No data URL provided' };
  }

  const { teamName = 'equipo', matchDate } = metadata;
  const cleanTeam = String(teamName || 'equipo')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\-]/g, '_')
    .replace(/_+/g, '_');
  const cleanDate = (matchDate || new Date().toISOString().split('T')[0])
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `mister11-alineacion_${cleanTeam}_${cleanDate}.png`;
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

  // 1. Capacitor Nativo (Android / iOS app / tablet)
  if (Capacitor.isNativePlatform()) {
    try {
      // Intentar primero guardar en Documents/Mister11/
      await Filesystem.writeFile({
        path: `Mister11/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      // Verificación estricta de metadata antes de emitir éxito
      const stat = await Filesystem.stat({
        path: `Mister11/${filename}`,
        directory: Directory.Documents,
      });

      if (stat && stat.size > 0) {
        showToast(t('download.lineup_saved', { path: `Documentos/Mister11/${filename}` }), 'success');
        return { success: true, path: `Documentos/Mister11/${filename}`, filename };
      }
      throw new Error('Stat size 0 after write');
    } catch (fsErr) {
      console.warn('[downloadLineupPNG] Filesystem en Documents no verificado, probando Cache + Share:', fsErr);
    }

    // Fallback Capacitor: Guardar en Cache y abrir Share sheet
    try {
      const uri = await _saveToCache(filename, base64Data);
      const cacheStat = await Filesystem.stat({
        path: filename,
        directory: Directory.Cache,
      });

      if (!cacheStat || cacheStat.size === 0) {
        throw new Error('Cache stat empty');
      }

      await Share.share({
        title: t('download.lineup_share_title', { team: cleanTeam }),
        files: [uri],
        dialogTitle: t('download.lineup_share_dialog'),
      });

      showToast(t('download.lineup_saved', { path: `Descargas/${filename}` }), 'success');
      return { success: true, path: `Descargas/${filename}`, filename };
    } catch (shareErr) {
      if (shareErr?.name === 'AbortError' || shareErr?.message?.includes('canceled')) {
        return { success: false, cancelled: true };
      }
      console.error('[downloadLineupPNG] Error en guardado nativo:', shareErr);
      showToast(t('download.save_error_share_fallback'), 'error');
      return { success: false, error: shareErr };
    }
  }

  // 2. Web moderna (Desktop, Tablet navegador, Móvil PWA)
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    if (!blob || blob.size === 0) {
      throw new Error('Blob generation failed');
    }

    // Si estamos en un WebView móvil/tablet que soporte navigator.share con archivos
    const isMobileOrTablet = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if (isMobileOrTablet && navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: t('download.lineup_share_title', { team: cleanTeam }),
            files: [file],
          });
          showToast(t('download.lineup_saved', { path: `Descargas/${filename}` }), 'success');
          return { success: true, path: `Descargas/${filename}`, filename };
        }
      } catch (shareErr) {
        if (shareErr?.name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        console.warn('[downloadLineupPNG] navigator.share fallo en web, usando anchor download:', shareErr);
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 500);

    showToast(t('download.lineup_saved', { path: `Descargas/${filename}` }), 'success');
    return { success: true, path: `Descargas/${filename}`, filename };
  } catch (webErr) {
    console.error('[downloadLineupPNG] Error en guardado web:', webErr);
    showToast(t('download.save_error_share_fallback'), 'error');
    return { success: false, error: webErr };
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
      showToast(t('download.csv_success'), 'success');
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
      showToast(t('download.video_success'), 'success');
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
