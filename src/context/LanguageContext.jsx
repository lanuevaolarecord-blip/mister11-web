import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  translations,
  getEffectiveLanguage,
  t as tFunction,
  LOCALES_REGISTRY,
  getActiveLocales,
  normalizeLocaleCode,
  getLocaleMetadata
} from '../i18n/translations';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth() || {};

  // 1. UI Language (Carril A)
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_language') || localStorage.getItem('language');
      if (saved) {
        return getEffectiveLanguage(saved);
      }
    } catch (_) {}
    return getEffectiveLanguage();
  });

  // 2. Clinical Content Language (Carril B)
  const [clinicalLanguage, setClinicalLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_clinical_language');
      if (saved) return saved;
    } catch (_) {}
    return 'auto'; // 'auto' sigue a language si está activo clínico, o hace fallback a ES/EN
  });

  // 3. Author Text Language (Carril C - Texto del míster)
  const [authorLanguage, setAuthorLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('mister11_author_language');
      if (saved) return saved;
    } catch (_) {}
    return 'es'; // Por defecto los textos del creador están en español
  });

  const localeMeta = useMemo(() => {
    return getLocaleMetadata(language);
  }, [language]);

  const setLanguage = useCallback((newLang) => {
    const effLang = getEffectiveLanguage(newLang);
    setLanguageState(effLang);
    const meta = getLocaleMetadata(effLang);

    try {
      localStorage.setItem('mister11_language', effLang);
      localStorage.setItem('language', effLang);
      window.dispatchEvent(new CustomEvent('m11-language-changed', { detail: effLang }));
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = meta.code;
        document.documentElement.dir = meta.dir || 'ltr';
      }
    } catch (_) {}

    // Persistencia en segundo plano en Firestore para el usuario activo
    if (user?.uid && user.uid !== 'invitado-local') {
      try {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { language: effLang }).catch(() => {});
      } catch (_) {}
    }
  }, [user?.uid]);

  const setClinicalLanguage = useCallback((cLang) => {
    setClinicalLanguageState(cLang);
    try {
      localStorage.setItem('mister11_clinical_language', cLang);
    } catch (_) {}
  }, []);

  const setAuthorLanguage = useCallback((aLang) => {
    setAuthorLanguageState(aLang);
    try {
      localStorage.setItem('mister11_author_language', aLang);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = localeMeta.code;
        document.documentElement.dir = localeMeta.dir || 'ltr';
      }
    } catch (_) {}
  }, [localeMeta]);

  const isEn = language === 'English (EN)';
  const locale = localeMeta.intl || 'es-ES';

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
      const category = pr.select(num); // 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' (CLDR)
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

  const activeLocales = useMemo(() => getActiveLocales(), []);

  return (
    <LanguageContext.Provider value={{
      language,
      ui_language: language,
      clinical_language: clinicalLanguage,
      clinical_content_language: clinicalLanguage,
      author_text_language: authorLanguage,
      setLanguage,
      setClinicalLanguage,
      setAuthorLanguage,
      t,
      isEn,
      locale,
      localeMeta,
      localesRegistry: LOCALES_REGISTRY,
      activeLocales,
      formatDate,
      formatNumber,
      fmtPlural,
      getWeekdays
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    const eff = getEffectiveLanguage();
    const meta = getLocaleMetadata(eff);
    return {
      language: eff,
      ui_language: eff,
      clinical_language: 'auto',
      clinical_content_language: 'auto',
      author_text_language: 'es',
      setLanguage: () => {},
      setClinicalLanguage: () => {},
      setAuthorLanguage: () => {},
      t: (key, replacements) => tFunction(key, eff, replacements),
      isEn: eff === 'English (EN)',
      locale: meta.intl || 'es-ES',
      localeMeta: meta,
      localesRegistry: LOCALES_REGISTRY,
      activeLocales: getActiveLocales(),
      formatDate: (d) => String(d || ''),
      formatNumber: (n) => String(n || ''),
      fmtPlural: (count, keyBase, params) => tFunction(keyBase, eff, { count, n: count, ...params }),
      getWeekdays: () => ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    };
  }
  return context;
};

export default LanguageContext;
