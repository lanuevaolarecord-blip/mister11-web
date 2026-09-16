import React from 'react';
import { Crown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * BadgePlanHeredado
 * Caso Límite 1: Transparencia cuando un miembro Free disfruta de funciones PRO
 * gracias al plan del propietario del equipo activo.
 */
export const BadgePlanHeredado = ({ isStaffHeredado = false, ownerName = '', className = '', style = {} }) => {
  const { t } = useTranslation();

  if (!isStaffHeredado) return null;

  const displayName = ownerName || t('staffHeredado.badgeActiveShort', { ownerName: 'Owner' });
  const label = t('staffHeredado.badgeActive', { ownerName: displayName });

  return (
    <div
      className={`badge-plan-heredado ${className}`}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        backgroundColor: 'rgba(212, 168, 67, 0.12)',
        border: '1px solid rgba(212, 168, 67, 0.35)',
        color: '#D4A843',
        fontSize: '11px',
        fontWeight: '700',
        lineHeight: 1.2,
        userSelect: 'none',
        ...style
      }}
    >
      <Crown size={13} color="#D4A843" strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
};

export default BadgePlanHeredado;
