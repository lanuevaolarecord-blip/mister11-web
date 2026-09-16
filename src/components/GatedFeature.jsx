import React, { useState } from 'react';
import { useEffectivePlan, usePlan } from '../hooks/usePlan';
import UpgradeModal from './UpgradeModal';
import { Lock } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * GatedFeature
 * Envuelve componentes que requieren plan PRO o Club.
 * Acepta `teamContext` para evaluar los permisos con el sistema de "Staff Heredado".
 */
export const GatedFeature = ({
  feature = 'pro',
  teamContext = null,
  children,
  fallback = null,
  showLockBadge = false,
  customMessage = null
}) => {
  const { t } = useTranslation();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Si se pasa teamContext, evaluamos con el plan efectivo del equipo; si no, con el plan global
  const planState = teamContext ? useEffectivePlan(teamContext) : usePlan();

  const isProAllowed = planState.isPro || planState.isEffectivePro;
  const isClubAllowed = planState.isClub || (planState.plan && planState.plan.startsWith('club'));

  let isAllowed = false;
  if (feature === 'pro') {
    isAllowed = Boolean(isProAllowed);
  } else if (feature === 'club') {
    isAllowed = Boolean(isClubAllowed);
  } else if (typeof planState.hasFeature === 'function') {
    isAllowed = Boolean(planState.hasFeature(feature));
  } else {
    isAllowed = Boolean(isProAllowed);
  }

  // Si está en periodo de gracia bloqueado, forzar bloqueo
  if (planState.gracePeriod?.isBlocked) {
    isAllowed = false;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockBadge) {
    return (
      <div
        className="gated-lock-badge"
        onClick={() => setIsUpgradeOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(212, 168, 67, 0.12)',
          border: '1px solid rgba(212, 168, 67, 0.3)',
          color: '#D4A843',
          fontSize: '11px',
          fontWeight: '700',
          cursor: 'pointer'
        }}
        title={customMessage || t('staffHeredado.restrictedFeatureStaff')}
      >
        <Lock size={12} color="#D4A843" />
        <span>PRO</span>
        {isUpgradeOpen && (
          <UpgradeModal
            open={isUpgradeOpen}
            onClose={() => setIsUpgradeOpen(false)}
            message={customMessage || t('staffHeredado.restrictedFeatureStaff')}
          />
        )}
      </div>
    );
  }

  return null;
};

export default GatedFeature;
