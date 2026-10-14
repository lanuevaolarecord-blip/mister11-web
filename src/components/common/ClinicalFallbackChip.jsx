import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';
import { getClinicalChipText } from '../../utils/clinicalChip.js';

export const CLINICAL_CHIP_INLINE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '6px',
  fontSize: '0.72rem',
  fontWeight: '700',
  backgroundColor: 'rgba(212, 168, 67, 0.15)',
  color: '#1B3A2D',
  border: '1px solid #9C6A3B'
};

export const ClinicalFallbackChip = ({ lang, style = {}, className = '' }) => {
  const { language } = useTranslation();
  const effectiveLang = lang || language || 'es';
  const label = getClinicalChipText(effectiveLang);

  return (
    <span 
      className={`clinical-fallback-chip ${className}`.trim()}
      style={{ ...CLINICAL_CHIP_INLINE_STYLE, ...style }}
    >
      <Shield size={12} color="#9C6A3B" /> {label}
    </span>
  );
};

export default ClinicalFallbackChip;
