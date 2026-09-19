import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { WHITEBOARD_CONFIG } from '../../config/whiteboardConfig';

/**
 * FieldSelector
 * Selector de terreno de juego para la pizarra táctica.
 * Mantiene intacto el fieldType seleccionado independientemente de cambios
 * de ventana, orientación o modo pantalla completa.
 */
const FieldSelector = ({ fieldType, setFieldType, className = "topbar-select" }) => {
  const { t } = useTranslation();

  // Asegura normalización sin reasignar ni mutar el estado externo
  const currentVal = fieldType || 'full';

  return (
    <select 
      className={className} 
      value={currentVal} 
      onChange={(e) => {
        if (typeof setFieldType === 'function') {
          setFieldType(e.target.value);
        }
      }}
      aria-label={t('board.toolbar.fieldType', {}, 'Tipo de campo')}
    >
      <option value="full">{t('board.fields.full', {}, 'Campo Completo')}</option>
      <option value="half-attack">{t('board.fields.halfAttack', {}, 'Medio Campo Ataque')}</option>
      <option value="half-defense">{t('board.fields.halfDefense', {}, 'Medio Campo Defensa')}</option>
      <option value="third_defense">{t('board.fields.thirdDefense', {}, 'Tercio Defensivo')}</option>
      <option value="third_mid">{t('board.fields.thirdMid', {}, 'Tercio Medio')}</option>
      <option value="third_attack">{t('board.fields.thirdAttack', {}, 'Tercio Ofensivo')}</option>
      <option value="penalty_area">{t('board.fields.penaltyArea', {}, 'Área Penal')}</option>
      <option value="f7">{t('board.fields.f7', {}, 'Fútbol 7')}</option>
      <option value="f8">{t('board.fields.f8', {}, 'Fútbol 8')}</option>
      <option value="futsal">{t('board.fields.futsal', {}, 'Fútbol Sala')}</option>
      <option value="reduced">{t('board.fields.reduced', {}, 'Campo Reducido')}</option>
      <option value="blank">{t('board.fields.blank', {}, 'Pizarra Blanca')}</option>
    </select>
  );
};

export default FieldSelector;
