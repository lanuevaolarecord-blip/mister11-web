import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const downloadPDF = async (base64Data, filename) => {
  if (!base64Data) throw new Error('No hay datos para descargar');
  if (Capacitor.isNativePlatform()) {
    try {
      if (Capacitor.getPlatform() === 'android') {
        const permissionStatus = await Filesystem.requestPermissions();
        if (permissionStatus.storage !== 'granted' && permissionStatus.publicStorage !== 'granted') {
          console.warn('Permisos de almacenamiento no concedidos (puede ser normal en Android 13+)');
        }
      }
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Downloads,
      });
      console.log('Archivo guardado en:', result.uri);
      // Notificación ligera
      if (window.Capacitor?.Plugins?.Toast) {
        window.Capacitor.Plugins.Toast.show({ text: `✅ PDF guardado en Descargas: ${filename}` });
      } else {
        alert(`✅ PDF guardado en Descargas:\n${filename}`);
      }
    } catch (err) {
      console.error('Error guardando archivo:', err);
      alert('Error al guardar el PDF. Inténtalo de nuevo.');
      throw err;
    }
  } else {
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,' + base64Data;
    link.download = filename;
    link.click();
  }
};

export const downloadJSON = async (jsonString, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
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

export const downloadImage = async (dataUrl, filename) => {
  if (Capacitor.isNativePlatform()) {
    try {
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
