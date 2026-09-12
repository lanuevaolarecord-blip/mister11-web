import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  checkTextSpelling,
  applySpellingCorrection,
  addWordToCustomDictionary,
  ignoreWordForSession
} from '../../utils/spellCheckerEngine';

/**
 * Componente SpellCheckedTextarea
 * Corrector ortográfico estilo Microsoft Word moderno:
 * - Clasificación inteligente de incidencias: Falta tilde, Error tipográfico, Palabra no reconocida.
 * - Acciones avanzadas: Sugerencias directas, "Agregar al diccionario" y "Ignorar".
 * - Cumplimiento Android First (touch targets >= 48dp).
 * - Paleta institucional Míster11 (#1B3A2D, #4CAF7D, #D4A843).
 */
export const SpellCheckedTextarea = ({
  value = '',
  onChange,
  onBlur,
  placeholder = '',
  rows = 3,
  className = '',
  style = {},
  disabled = false,
  id,
  name,
  ...rest
}) => {
  const { t, language } = useTranslation();
  const lang = language?.startsWith('en') ? 'en' : 'es';
  const isEn = lang === 'en';

  const [selectedWordIdx, setSelectedWordIdx] = useState(0);
  const [dictVersion, setDictVersion] = useState(0);

  // Escuchar actualizaciones del diccionario de usuario para re-evaluar reactivamente
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

  // Detección ortográfica memoizada con reactividad ante cambios de texto, idioma y diccionario
  const errors = useMemo(() => {
    return checkTextSpelling(value, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lang, dictVersion]);

  // Asegurar que el índice activo esté dentro del rango válido
  const safeIdx = Math.min(selectedWordIdx, Math.max(0, errors.length - 1));
  const activeError = errors[safeIdx];
  const hasErrors = errors.length > 0;

  const handleApplyCorrection = useCallback((suggestion) => {
    if (!activeError) return;
    const newText = applySpellingCorrection(value, activeError, suggestion);
    if (onChange) {
      onChange({ target: { value: newText, name } });
    }
  }, [activeError, value, onChange, name]);

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
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
        style={{
          ...style,
          borderColor: hasErrors ? 'rgba(212, 168, 67, 0.7)' : (style.borderColor || undefined),
          boxShadow: hasErrors ? '0 0 0 1.5px rgba(212, 168, 67, 0.25)' : (style.boxShadow || undefined),
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        {...rest}
      />

      {/* Panel de Asistencia Ortográfica Estilo Word Moderno */}
      {hasErrors && activeError && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--bg-card, #FFFFFF)',
            border: '1px solid rgba(212, 168, 67, 0.35)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {/* Cabecera: Título + Contador + Selector táctil de incidencias */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1B3A2D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✍️</span>
                <span>
                  {errors.length === 1
                    ? (t('spell.observations', { count: errors.length }) || '1 observación ortográfica')
                    : (t('spell.observationsPlural', { count: errors.length }) || `${errors.length} observaciones ortográficas`)}
                </span>
              </span>
            </div>

            {/* Selector de palabras detectadas si hay varias */}
            {errors.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  maxWidth: '100%',
                  paddingBottom: '2px'
                }}
              >
                {errors.map((err, idx) => {
                  const isSelected = idx === safeIdx;
                  return (
                    <button
                      key={`${err.word}-${idx}`}
                      type="button"
                      onClick={() => setSelectedWordIdx(idx)}
                      style={{
                        minHeight: '36px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #1B3A2D' : '1px solid var(--border-color, #E2E8F0)',
                        background: isSelected ? '#1B3A2D' : 'var(--bg-secondary, #F8FAFC)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-primary, #334155)',
                        fontSize: '12px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {err.word}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarjeta de la palabra activa con clasificación y sugerencias */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px 12px',
              background: 'var(--bg-secondary, #F8FAFC)',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.04)'
            }}
          >
            {/* Fila con palabra, badge de motivo y acciones Word (Ignorar, Añadir) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#E53E3E',
                    textDecoration: 'underline wavy #E53E3E',
                    letterSpacing: '0.2px'
                  }}
                >
                  "{activeError.word}"
                </span>

                {/* Badge de motivo contextual */}
                {activeError.reason === 'accent' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(212, 168, 67, 0.15)',
                      color: '#B8860B',
                      border: '1px solid rgba(212, 168, 67, 0.3)'
                    }}
                  >
                    🏷️ {t('spell.missingAccent') || 'Falta tilde'}
                  </span>
                )}
                {activeError.reason === 'misspelled' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(229, 62, 62, 0.1)',
                      color: '#E53E3E',
                      border: '1px solid rgba(229, 62, 62, 0.25)'
                    }}
                  >
                    ❌ {t('spell.typo') || 'Error tipográfico'}
                  </span>
                )}
                {activeError.reason === 'unrecognized' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(100, 116, 139, 0.1)',
                      color: '#64748B',
                      border: '1px solid rgba(100, 116, 139, 0.25)'
                    }}
                  >
                    ❓ {t('spell.unrecognized') || 'Palabra no reconocida'}
                  </span>
                )}
              </div>

              {/* Botones de acción complementaria estilo Word (Touch target >= 48dp) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleIgnoreWord(activeError.word)}
                  style={{
                    minHeight: '48px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #CBD5E1)',
                    background: 'transparent',
                    color: 'var(--text-secondary, #64748B)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isEn ? `Ignore "${activeError.word}" for this session` : `Ignorar "${activeError.word}" en esta sesión`}
                >
                  <span>👁️</span>
                  <span>{t('spell.ignore') || 'Ignorar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToDictionary(activeError.word)}
                  style={{
                    minHeight: '48px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #1B3A2D',
                    background: 'rgba(27, 58, 45, 0.06)',
                    color: '#1B3A2D',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isEn ? `Add "${activeError.word}" to custom dictionary` : `Guardar "${activeError.word}" en el diccionario`}
                >
                  <span>➕</span>
                  <span>{t('spell.addToDictionary') || 'Agregar al diccionario'}</span>
                </button>
              </div>
            </div>

            {/* Fila de sugerencias recomendadas */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #64748B)' }}>
                {t('spell.recommended') || 'Recomendado'}:
              </span>

              {activeError.suggestions && activeError.suggestions.length > 0 ? (
                activeError.suggestions.map((sug, idx) => (
                  <button
                    key={`${sug}-${idx}`}
                    type="button"
                    onClick={() => handleApplyCorrection(sug)}
                    style={{
                      minHeight: '48px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #4CAF7D',
                      background: 'rgba(76, 175, 125, 0.12)',
                      color: '#1B3A2D',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    title={
                      isEn
                        ? `Replace "${activeError.word}" with "${sug}"`
                        : `Reemplazar "${activeError.word}" por "${sug}"`
                    }
                  >
                    <span style={{ color: '#4CAF7D', fontSize: '14px' }}>✓</span>
                    <span>{sug}</span>
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', fontStyle: 'italic' }}>
                  {t('spell.noSuggestions') || 'Sin sugerencias directas'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheckedTextarea;
