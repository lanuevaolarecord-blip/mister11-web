import { useLanguage } from '../context/LanguageContext';

/**
 * Hook centralizado de internacionalización.
 * Reacciona inmediatamente al cambio de idioma global en caliente.
 */
export const useTranslation = () => {
  const { t, language, isEn, locale, setLanguage, formatDate, formatNumber } = useLanguage();
  return { t, language, isEn, locale, setLanguage, formatDate, formatNumber };
};

export default useTranslation;
