import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Detecta si la app está ejecutándose como binario nativo en Android.
 * Útil para cumplir políticas de Google Play Store (ej. política 3.1.1 de pagos).
 */
export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Detecta si la app está ejecutándose en navegador web / PWA.
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Abre una URL en el navegador externo del sistema de manera segura.
 * En entornos nativos (Android/iOS) utiliza Capacitor Browser; en web usa window.open.
 * 
 * @param {string} url - URL externa a abrir
 */
export const openExternal = async (url) => {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.warn('Error al abrir URL con Browser de Capacitor, usando fallback:', error);
    try {
      window.open(url, '_system') || window.open(url, '_blank');
    } catch (e) {
      window.location.href = url;
    }
  }
};
