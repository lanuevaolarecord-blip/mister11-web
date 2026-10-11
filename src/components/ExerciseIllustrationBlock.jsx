import React from 'react';
import { ImageOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const ExerciseIllustrationBlock = ({ illustration, exerciseName, compact = false }) => {
  const { t, language } = useTranslation();

  const isPending = !illustration || illustration.type === 'pendiente' || !illustration.url;

  if (isPending) {
    return (
      <div 
        className="exercise-illustration-placeholder"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '8px' : '12px',
          padding: compact ? '8px 12px' : '12px 16px',
          borderRadius: '8px',
          background: 'rgba(27, 58, 45, 0.04)',
          border: '1px dashed rgba(27, 58, 45, 0.25)',
          color: '#1B3A2D',
          margin: compact ? '4px 0 8px 0' : '10px 0 14px 0'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: compact ? '28px' : '36px',
          height: compact ? '28px' : '36px',
          borderRadius: '6px',
          background: 'rgba(212, 168, 67, 0.15)',
          color: '#9C6A3B',
          flexShrink: 0
        }}>
          <ImageOff size={compact ? 16 : 20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? '0.78rem' : '0.85rem',
            fontWeight: 700,
            color: '#1B3A2D',
            lineHeight: 1.3
          }}>
            {t('exercise.illustrationPending', 'Ilustración pendiente — sigue la descripción textual')}
          </div>
          {!compact && (
            <div style={{
              fontSize: '0.72rem',
              color: '#6B7280',
              marginTop: '2px'
            }}>
              {t('exercise.illustrationNotice', 'Protocolo clínico: validación visual técnica en curso sin generación sintética')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si tiene URL validada (svg_determinista o foto_licenciada)
  const altText = illustration.alt?.[language] ||
                  illustration.alt?.es ||
                  illustration.alt?.en ||
                  exerciseName ||
                  'Ilustración de ejercicio';

  return (
    <div 
      className="exercise-illustration-frame"
      style={{
        margin: compact ? '4px 0 8px 0' : '10px 0 14px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(27, 58, 45, 0.15)',
        background: '#FAF8F5'
      }}
    >
      <img 
        src={illustration.url} 
        alt={altText}
        style={{
          width: '100%',
          maxHeight: compact ? '140px' : '220px',
          objectFit: 'contain',
          display: 'block'
        }} 
      />
      {illustration.source?.citation && (
        <div style={{
          fontSize: '0.7rem',
          color: '#9C6A3B',
          padding: '4px 8px',
          background: 'rgba(212, 168, 67, 0.08)',
          borderTop: '1px solid rgba(212, 168, 67, 0.2)'
        }}>
          Fuente: {illustration.source.citation}
        </div>
      )}
    </div>
  );
};

export default ExerciseIllustrationBlock;
