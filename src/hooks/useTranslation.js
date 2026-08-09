import { useAuth } from '../context/AuthContext';
import { useSettings } from './useSettings';
import { t as tFn, getEffectiveLanguage } from '../i18n/translations';

/**
 * Hook centralizado de internacionalización.
 * Lee el idioma guardado en Firestore para el equipo activo (o sistema)
 * y retorna la función t() y el idioma actual.
 */
export const useTranslation = () => {
  const { activeTeamId } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const language = getEffectiveLanguage(settings?.language);

  const t = (key, replacements = {}) => tFn(key, language, replacements);

  return { t, language };
};
