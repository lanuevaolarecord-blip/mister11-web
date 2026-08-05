import { useAuth } from '../context/AuthContext';
import { useSettings } from './useSettings';
import { t as tFn } from '../i18n/translations';

/**
 * Hook centralizado de internacionalización.
 * Lee el idioma guardado en Firestore para el equipo activo
 * y retorna la función t() y el idioma actual.
 */
export const useTranslation = () => {
  const { activeTeamId } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const language = settings?.language || 'Español (ES)';

  const t = (key, replacements = {}) => tFn(key, language, replacements);

  return { t, language };
};
