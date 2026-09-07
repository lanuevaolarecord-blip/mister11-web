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

  const t = useCallback((key, replacements, fallback) => {
    return tFunction(key, language, replacements, fallback);
  }, [language]);

  const formatDate = useCallback((date, options = {}) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      if (isNaN(d.getTime())) return String(date);
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch (_) {
      return String(date);
    }
  }, [locale]);

  const formatNumber = useCallback((number, options = {}) => {
    if (number === null || number === undefined || isNaN(number)) return '';
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (_) {
      return String(number);
    }
  }, [locale]);

  const fmtPlural = useCallback((count, keyBase, params = {}) => {
    const num = Number(count) || 0;
    try {
      const pr = new Intl.PluralRules(locale);
      const category = pr.select(num); // 'one', 'other', etc.
      const candidateKey = `${keyBase}.${category}`;
      const translated = tFunction(candidateKey, language, { count: num, n: num, ...params }, null);
      if (translated && translated !== candidateKey) {
        return translated;
      }
    } catch (_) {}
    return tFunction(keyBase, language, { count: num, n: num, ...params });
  }, [language, locale]);

  const getWeekdays = useCallback((style = 'narrow', startMonday = true) => {
    try {
      const days = [];
      const dtf = new Intl.DateTimeFormat(locale, { weekday: style });
      // 2026-01-05 es Lunes
      const baseDay = startMonday ? 5 : 4; // 5=Lunes, 4=Domingo
      for (let i = 0; i < 7; i++) {
        const d = new Date(2026, 0, baseDay + i);
        let s = dtf.format(d);
        if (style === 'narrow') s = s.charAt(0).toUpperCase();
        days.push(s);
      }
      return days;
    } catch (_) {
      return isEn ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    }
  }, [locale, isEn]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isEn, locale, formatDate, formatNumber, fmtPlural, getWeekdays }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback defensivo si se usa fuera del provider
    const eff = getEffectiveLanguage();
    const isE = eff === 'English (EN)';
    const loc = isE ? 'en-GB' : 'es-ES';
    return {
      language: eff,
      setLanguage: () => {},
      t: (key, replacements) => tFunction(key, eff, replacements),
      isEn: isE,
      locale: loc,
      formatDate: (d) => String(d || ''),
      formatNumber: (n) => String(n || ''),
      fmtPlural: (count, keyBase, params) => tFunction(keyBase, eff, { count, n: count, ...params }),
      getWeekdays: () => isE ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    };
  }
  return context;
};

export default LanguageContext;
