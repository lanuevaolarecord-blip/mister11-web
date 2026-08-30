import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { checkTextSpelling, applySpellingCorrection } from '../../utils/spellCheckerEngine';

/**
 * Componente SpellCheckedInput
 * Input de texto accesible con detección de errores ortográficos en tiempo real,
 * resaltado en rojo y chips táctiles de corrección rápida (Android First >= 48dp).
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
  const { language } = useTranslation();
  const lang = language?.startsWith('en') ? 'en' : 'es';
  const isEn = lang === 'en';

  const [activeErrorIdx, setActiveErrorIdx] = useState(0);

  // Análisis ortográfico memoizado
  const errors = useMemo(() => {
    return checkTextSpelling(value, lang);
  }, [value, lang]);

  const hasErrors = errors.length > 0;
  const currentError = errors[activeErrorIdx] || errors[0];

  const handleApplyCorrection = (suggestion) => {
    if (!currentError) return;
    const newText = applySpellingCorrection(value, currentError, suggestion);
    if (onChange) {
      onChange({ target: { value: newText, name } });
    }
  };

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
          borderColor: hasErrors ? '#EF4444' : (style.borderColor || undefined),
          boxShadow: hasErrors ? '0 0 0 1.5px rgba(239, 68, 68, 0.25)' : (style.boxShadow || undefined),
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        {...rest}
      />

      {/* Banner interactivo de asistencia ortográfica */}
      {hasErrors && (
        <div
          style={{
            marginTop: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
            <span style={{ color: '#EF4444', fontWeight: '800' }}>⚠️ {isEn ? 'Spelling:' : 'Ortografía:'}</span>
            <span style={{ color: '#EF4444', textDecoration: 'line-through', fontWeight: '700' }}>
              "{currentError?.word}"
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>➔</span>
          </div>

          {/* Sugerencias táctiles con touch target ergonómico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {(currentError?.suggestions || []).map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyCorrection(sug)}
                style={{
                  minHeight: '36px',
                  minWidth: '48px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #10B981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title={isEn ? `Click to correct with "${sug}"` : `Toca para corregir por "${sug}"`}
              >
                <span>✓</span>
                <span>{sug}</span>
              </button>
            ))}

            {errors.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveErrorIdx((prev) => (prev + 1) % errors.length)}
                style={{
                  minHeight: '36px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
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
