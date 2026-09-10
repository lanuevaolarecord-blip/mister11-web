import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  checkTextSpelling,
  applySpellingCorrection,
  addWordToCustomDictionary,
  ignoreWordForSession
} from '../../utils/spellCheckerEngine';

/**
 * Componente SpellCheckedInput
 * Input de texto con corrector ortográfico inteligente estilo Microsoft Word:
 * - Detección en vivo de faltas de tilde, erratas y palabras no reconocidas.
 * - Chips táctiles ergonómicos (Android First >= 48dp).
 * - Soporte para ignorar palabra y añadir al diccionario personalizado.
 * - Paleta oficial Míster11 (#1B3A2D, #4CAF7D, #D4A843).
 */
export const SpellCheckedInput = ({
  value = '',
  onChange,
  onBlur,
  placeholder = '',
  className = '',
  style = {},
  disabled = false,
  id,
  name,
  type = 'text',
  autoComplete = 'off',
  ...rest
}) => {
  const { t, language } = useTranslation();
  const lang = language?.startsWith('en') ? 'en' : 'es';
  const isEn = lang === 'en';

  const [activeErrorIdx, setActiveErrorIdx] = useState(0);
  const [dictVersion, setDictVersion] = useState(0);

  // Reaccionar a cambios en el diccionario de usuario
  useEffect(() => {
    const handleDictUpdate = () => {
      setDictVersion((v) => v + 1);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('mister11-dictionary-updated', handleDictUpdate);
      return () => {
        window.removeEventListener('mister11-dictionary-updated', handleDictUpdate);
      };
    }
  }, []);

  // Análisis ortográfico memoizado
  const errors = useMemo(() => {
    return checkTextSpelling(value, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lang, dictVersion]);

  const hasErrors = errors.length > 0;
  const safeIdx = Math.min(activeErrorIdx, Math.max(0, errors.length - 1));
  const currentError = errors[safeIdx];

  const handleApplyCorrection = useCallback((suggestion) => {
    if (!currentError) return;
    const newText = applySpellingCorrection(value, currentError, suggestion);
    if (onChange) {
      onChange({ target: { value: newText, name } });
    }
  }, [currentError, value, onChange, name]);

  const handleAddToDictionary = useCallback((word) => {
    if (!word) return;
    addWordToCustomDictionary(word);
    setDictVersion((v) => v + 1);
  }, []);

  const handleIgnoreWord = useCallback((word) => {
    if (!word) return;
    ignoreWordForSession(word);
    setDictVersion((v) => v + 1);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={className}
        style={{
          ...style,
          borderColor: hasErrors ? 'rgba(212, 168, 67, 0.7)' : (style.borderColor || undefined),
          boxShadow: hasErrors ? '0 0 0 1.5px rgba(212, 168, 67, 0.25)' : (style.boxShadow || undefined),
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        {...rest}
      />

      {/* Banner interactivo de corrección ortográfica estilo Word */}
      {hasErrors && currentError && (
        <div
          style={{
            marginTop: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'var(--bg-card, #FFFFFF)',
            border: '1px solid rgba(212, 168, 67, 0.35)',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {/* Palabra con error y badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1B3A2D' }}>
              ✍️
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#E53E3E',
                textDecoration: 'underline wavy #E53E3E'
              }}
            >
              "{currentError.word}"
            </span>

            {currentError.reason === 'accent' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: 'rgba(212, 168, 67, 0.15)',
                  color: '#B8860B',
                  border: '1px solid rgba(212, 168, 67, 0.3)'
                }}
              >
                🏷️ {t('spell.missingAccent') || 'Falta tilde'}
              </span>
            )}
            {currentError.reason === 'misspelled' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  color: '#E53E3E',
                  border: '1px solid rgba(229, 62, 62, 0.25)'
                }}
              >
                ❌ {t('spell.typo') || 'Error tipográfico'}
              </span>
            )}
            {currentError.reason === 'unrecognized' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: 'rgba(100, 116, 139, 0.1)',
                  color: '#64748B',
                  border: '1px solid rgba(100, 116, 139, 0.25)'
                }}
              >
                ❓ {t('spell.unrecognized') || 'No reconocida'}
              </span>
            )}
          </div>

          {/* Sugerencias y acciones Word (Touch target >= 48dp) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(currentError.suggestions || []).map((sug, idx) => (
              <button
                key={`${sug}-${idx}`}
                type="button"
                onClick={() => handleApplyCorrection(sug)}
                style={{
                  minHeight: '48px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #4CAF7D',
                  background: 'rgba(76, 175, 125, 0.12)',
                  color: '#1B3A2D',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title={isEn ? `Replace with "${sug}"` : `Reemplazar por "${sug}"`}
              >
                <span style={{ color: '#4CAF7D' }}>✓</span>
                <span>{sug}</span>
              </button>
            ))}

            {/* Ignorar */}
            <button
              type="button"
              onClick={() => handleIgnoreWord(currentError.word)}
              style={{
                minHeight: '48px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #CBD5E1)',
                background: 'transparent',
                color: 'var(--text-secondary, #64748B)',
                fontSize: '11.5px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={isEn ? `Ignore "${currentError.word}"` : `Ignorar "${currentError.word}"`}
            >
              <span>👁️</span>
              <span>{t('spell.ignore') || 'Ignorar'}</span>
            </button>

            {/* Agregar al diccionario */}
            <button
              type="button"
              onClick={() => handleAddToDictionary(currentError.word)}
              style={{
                minHeight: '48px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #1B3A2D',
                background: 'rgba(27, 58, 45, 0.05)',
                color: '#1B3A2D',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={isEn ? `Add "${currentError.word}" to dictionary` : `Guardar "${currentError.word}" en el diccionario`}
            >
              <span>➕</span>
              <span>{t('spell.addToDictionary') || 'Guardar'}</span>
            </button>

            {/* Navegación si hay más de 1 error */}
            {errors.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveErrorIdx((prev) => (prev + 1) % errors.length)}
                style={{
                  minHeight: '48px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #E2E8F0)',
                  background: 'var(--bg-secondary, #F8FAFC)',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                +{errors.length - 1} {isEn ? 'more' : 'más'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheckedInput;
