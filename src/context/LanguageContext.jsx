import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, getEffectiveLanguage, t as tFunction } from '../i18n/translations';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth() || {};

  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_language') || localStorage.getItem('language');
      if (saved && (saved === 'English (EN)' || saved === 'Español (ES)')) {
        return saved;
      }
    } catch (_) {}
    return getEffectiveLanguage();
  });

  const setLanguage = useCallback((newLang) => {
    const validLang = newLang === 'English (EN)' || newLang === 'en' ? 'English (EN)' : 'Español (ES)';
    setLanguageState(validLang);
    try {
      localStorage.setItem('mister11_language', validLang);
      localStorage.setItem('language', validLang);
      window.dispatchEvent(new CustomEvent('m11-language-changed', { detail: validLang }));
    } catch (_) {}

    // Persistencia en segundo plano en Firestore para el usuario activo
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { language: validLang }).catch(() => {});
      } catch (_) {}
    }
  }, [user?.uid]);

  const isEn = language === 'English (EN)';
  const locale = isEn ? 'en-GB' : 'es-ES';

  const t = useCallback((key, replacements = {}) => {
    return tFunction(key, language, replacements);
  }, [language]);

  const formatDate = useCallback((date, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return String(date);
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch (_) {
      return String(date);
    }
  }, [locale]);

  const formatNumber = useCallback((number, options = {}) => {
    if (number === null || number === undefined || isNaN(number)) return '--';
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (_) {
      return String(number);
    }
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isEn, locale, formatDate, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback defensivo si se usa fuera del provider
    const eff = getEffectiveLanguage();
    return {
      language: eff,
      setLanguage: () => {},
      t: (key, replacements) => tFunction(key, eff, replacements),
      isEn: eff === 'English (EN)',
      locale: eff === 'English (EN)' ? 'en-GB' : 'es-ES',
      formatDate: (d) => String(d || ''),
      formatNumber: (n) => String(n || '')
    };
  }
  return context;
};

export default LanguageContext;
