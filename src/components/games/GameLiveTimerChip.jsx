import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Clock, Hourglass, Pause } from 'lucide-react';

export const GameLiveTimerChip = ({
  formattedElapsed = '0:00',
  formattedRemaining = '15:00',
  isPaused = false,
  isTimeExpired = false,
  category = 'cognitive'
}) => {
  const { t } = useTranslation();

  // Alerta si quedan menos de 2 minutos (120s)
  const isUrgent = formattedRemaining.startsWith('0:') || formattedRemaining.startsWith('1:');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        backgroundColor: isTimeExpired
          ? 'rgba(239, 68, 68, 0.12)'
          : isPaused
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(37, 99, 235, 0.10)',
        border: `1px solid ${
          isTimeExpired
            ? 'rgba(239, 68, 68, 0.3)'
            : isPaused
            ? 'rgba(245, 158, 11, 0.3)'
            : 'rgba(37, 99, 235, 0.2)'
        }`,
        fontSize: '12px',
        fontWeight: 600,
        color: isTimeExpired
          ? '#DC2626'
          : isPaused
          ? '#D97706'
          : '#1D4ED8',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        userSelect: 'none',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Icono de estado */}
      {isPaused ? (
        <Pause size={14} color="#D97706" />
      ) : (
        <Hourglass size={14} color={isTimeExpired ? '#DC2626' : '#2563EB'} />
      )}

      {/* Texto de tiempo restante */}
      <span>
        {isPaused
          ? t('games.timer.paused', {}, 'Pausado')
          : isTimeExpired
          ? t('games.timer.setFinishing', {}, 'Completando set')
          : t('games.timer.remainingChip', { time: formattedRemaining }, `⏳ Hoy te quedan ${formattedRemaining}`)}
      </span>

      {/* Separador sutil */}
      <span style={{ opacity: 0.3 }}>|</span>

      {/* Tiempo transcurrido de la sesión */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', opacity: 0.85 }}>
        <Clock size={12} />
        {formattedElapsed}
      </span>
    </div>
  );
};

export default GameLiveTimerChip;
