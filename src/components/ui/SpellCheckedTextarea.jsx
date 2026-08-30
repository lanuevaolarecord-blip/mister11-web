import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { checkTextSpelling, applySpellingCorrection } from '../../utils/spellCheckerEngine';

/**
 * Componente SpellCheckedTextarea
 * Textarea multi-línea con detector ortográfico en vivo, alertas visuales en rojo
 * y selector táctil de sugerencias para cada palabra detectada (Android First >= 48dp).
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
  const { language } = useTranslation();
  const lang = language?.startsWith('en') ? 'en' : 'es';
  const isEn = lang === 'en';

  const [selectedWordIdx, setSelectedWordIdx] = useState(0);

  // Detección ortográfica
  const errors = useMemo(() => {
    return checkTextSpelling(value, lang);
  }, [value, lang]);

  const hasErrors = errors.length > 0;
  const activeError = errors[selectedWordIdx] || errors[0];

  const handleApplyCorrection = (suggestion) => {
    if (!activeError) return;
    const newText = applySpellingCorrection(value, activeError, suggestion);
    if (onChange) {
      onChange({ target: { value: newText, name } });
    }
  };

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
          borderColor: hasErrors ? '#EF4444' : (style.borderColor || undefined),
          boxShadow: hasErrors ? '0 0 0 1.5px rgba(239, 68, 68, 0.25)' : (style.boxShadow || undefined),
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        {...rest}
      />

      {/* Barra de estado ortográfico */}
      {hasErrors && (
        <div
          style={{
            marginTop: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {/* Cabecera de advertencia */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: '#EF4444', fontWeight: '800' }}>
                ✍️ {isEn ? `${errors.length} spelling observation${errors.length > 1 ? 's' : ''}` : `${errors.length} observación${errors.length > 1 ? 'es' : ''} ortográfica${errors.length > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Selector de palabras con error si hay más de una */}
            {errors.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
                {errors.map((err, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWordIdx(idx)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: idx === selectedWordIdx ? '1.5px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.3)',
                      background: idx === selectedWordIdx ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
                      color: idx === selectedWordIdx ? '#FFFFFF' : '#EF4444',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {err.word}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fila de acción con la palabra activa y sugerencias táctiles */}
          {activeError && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#EF4444', textDecoration: 'line-through', fontWeight: '700' }}>
                  "{activeError.word}"
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>➔</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  {isEn ? 'Recommended:' : 'Corrección recomendada:'}
                </span>
              </div>

              {/* Sugerencias táctiles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {(activeError.suggestions || []).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyCorrection(sug)}
                    style={{
                      minHeight: '44px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #10B981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    title={isEn ? `Tap to replace "${activeError.word}" with "${sug}"` : `Toca para reemplazar "${activeError.word}" por "${sug}"`}
                  >
                    <span>✓</span>
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpellCheckedTextarea;
