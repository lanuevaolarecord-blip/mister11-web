import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { calculateShotXg } from '../config/xgWeights';
import './ShotCaptureModal.css';

/**
 * ShotCaptureModal
 * Modal táctil optimizado para Android (targets ≥48dp) para captura
 * rápida de remates con contexto en ≤3 taps:
 * - Paradas: Resultado (1) -> Dificultad (2) -> Comodidad (3) => Confirma.
 * - Gol, Fuera, Bloqueado: Resultado (1) -> Comodidad (2) => Confirma.
 */
export const ShotCaptureModal = ({
  isOpen,
  onClose,
  onConfirmShot,
  initialTeam = 'own',
  initialSector = 'center',
  initialResult = null,
  initialDifficulty = null,
  activePlayerId = null,
  activePlayerName = '',
  playersList = [],
  activeGoalkeeper = null,
}) => {
  const { t, isEn } = useTranslation();

  const [team, setTeam] = useState(initialTeam);
  const [zone, setZone] = useState('centro_dentro');
  const [playType, setPlayType] = useState('jugada');
  const [result, setResult] = useState(initialResult);
  const [saveDifficulty, setSaveDifficulty] = useState(initialDifficulty);
  const [shooterComfort, setShooterComfort] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(activePlayerId);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setTeam(initialTeam || 'own');

      // Pre-rellenar zona según el sector activo
      let defZone = 'centro_dentro';
      if (initialSector === 'left') defZone = 'izq_dentro';
      else if (initialSector === 'right') defZone = 'der_dentro';
      setZone(defZone);

      setPlayType('jugada');
      setResult(initialResult || null);
      setSaveDifficulty(initialDifficulty || null);
      setShooterComfort(null);
      setSelectedPlayerId(activePlayerId || null);
    }
  }, [isOpen, initialTeam, initialSector, initialResult, initialDifficulty, activePlayerId]);

  // Si se selecciona penalti como tipo de jugada, sincronizar zona
  const handleSelectPlayType = (pt) => {
    setPlayType(pt);
    if (pt === 'penalti') {
      setZone('penalti');
    } else if (zone === 'penalti') {
      setZone('centro_dentro');
    }
  };

  const handleSelectZone = (z) => {
    setZone(z);
    if (z === 'penalti') {
      setPlayType('penalti');
    }
  };

  // Dispatch final al completar los taps requeridos
  const finishAndDispatch = useCallback((finalComfort, finalDiff = saveDifficulty, finalRes = result) => {
    let pName = '';
    if (selectedPlayerId) {
      const found = playersList.find(p => String(p.id) === String(selectedPlayerId));
      if (found) pName = found.nombre || found.name || '';
    }

    const calculatedXg = calculateShotXg({
      zone,
      shooterComfort: finalComfort,
      playType,
    });

    const shotPayload = {
      team,
      result: finalRes,
      saveDifficulty: finalRes === 'parada' ? (finalDiff || 'normal') : null,
      shooterComfort: finalComfort,
      zone,
      playType,
      xG: calculatedXg,
      playerId: selectedPlayerId,
      playerName: pName,
      sector: zone.includes('izq') ? 'left' : (zone.includes('der') ? 'right' : 'center'),
    };

    onConfirmShot(shotPayload);
    onClose();
  }, [team, zone, playType, selectedPlayerId, playersList, result, saveDifficulty, onConfirmShot, onClose]);

  // Tap 1: Selección de Resultado
  const handleSelectResult = (r) => {
    setResult(r);
    if (r !== 'parada') {
      setSaveDifficulty(null);
    }
  };

  // Tap 2 (si parada): Selección de Dificultad
  const handleSelectDifficulty = (d) => {
    setSaveDifficulty(d);
  };

  // Tap 2 o 3: Selección de Comodidad (Confirma automáticamente)
  const handleSelectComfort = (c) => {
    setShooterComfort(c);
    finishAndDispatch(c, saveDifficulty, result);
  };

  if (!isOpen) return null;

  return (
    <div className="shot-modal-overlay" onClick={onClose}>
      <div className="shot-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="shot-modal-header">
          <div className="shot-modal-title-row">
            <h3 className="shot-modal-title">🎯 {t('shot.title')}</h3>
            <button type="button" className="shot-modal-close-btn" onClick={onClose} aria-label={t('shot.cancel')}>
              ✕
            </button>
          </div>

          {/* Toggle Equipo Propio / Rival */}
          <div className="shot-team-toggle-row">
            <button
              type="button"
              className={`shot-team-chip ${team === 'own' ? 'active-own' : ''}`}
              onClick={() => setTeam('own')}
            >
              {t('shot.team_own')}
            </button>
            <button
              type="button"
              className={`shot-team-chip ${team === 'rival' ? 'active-rival' : ''}`}
              onClick={() => setTeam('rival')}
            >
              {t('shot.team_rival')}
            </button>
          </div>
        </div>

        <div className="shot-modal-body">
          {/* Zona de Remate (Pre-rellenada editable) */}
          <div className="shot-section-group">
            <label className="shot-group-label">{t('shot.zone')}</label>
            <div className="shot-chips-grid">
              <button
                type="button"
                className={`shot-chip ${zone === 'centro_dentro' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('centro_dentro')}
              >
                {t('shot.zone_inside_center')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'izq_dentro' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('izq_dentro')}
              >
                {t('shot.zone_inside_left')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'der_dentro' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('der_dentro')}
              >
                {t('shot.zone_inside_right')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'centro_fuera' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('centro_fuera')}
              >
                {t('shot.zone_outside_center')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'izq_fuera' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('izq_fuera')}
              >
                {t('shot.zone_outside_left')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'der_fuera' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('der_fuera')}
              >
                {t('shot.zone_outside_right')}
              </button>
              <button
                type="button"
                className={`shot-chip ${zone === 'penalti' ? 'selected' : ''}`}
                onClick={() => handleSelectZone('penalti')}
              >
                {t('shot.zone_penalty')}
              </button>
            </div>
          </div>

          {/* Tipo de Jugada */}
          <div className="shot-section-group">
            <label className="shot-group-label">{t('shot.playType')}</label>
            <div className="shot-chips-row">
              <button
                type="button"
                className={`shot-chip ${playType === 'jugada' ? 'selected' : ''}`}
                onClick={() => handleSelectPlayType('jugada')}
              >
                {t('shot.playType_jugada')}
              </button>
              <button
                type="button"
                className={`shot-chip ${playType === 'contra' ? 'selected' : ''}`}
                onClick={() => handleSelectPlayType('contra')}
              >
                {t('shot.playType_contra')}
              </button>
              <button
                type="button"
                className={`shot-chip ${playType === 'balon_parado' ? 'selected' : ''}`}
                onClick={() => handleSelectPlayType('balon_parado')}
              >
                {t('shot.playType_balon_parado')}
              </button>
              <button
                type="button"
                className={`shot-chip ${playType === 'penalti' ? 'selected' : ''}`}
                onClick={() => handleSelectPlayType('penalti')}
              >
                {t('shot.playType_penalti')}
              </button>
            </div>
          </div>

          {/* PASO 1: Resultado del Tiro */}
          <div className="shot-section-group">
            <label className="shot-group-label">
              <span className="shot-step-badge">1</span> {t('shot.result')}
            </label>
            <div className="shot-chips-grid-2x2">
              <button
                type="button"
                className={`shot-chip-large ${result === 'gol' ? 'selected-success' : ''}`}
                onClick={() => handleSelectResult('gol')}
              >
                {t('shot.result_gol')}
              </button>
              <button
                type="button"
                className={`shot-chip-large ${result === 'parada' ? 'selected-gk' : ''}`}
                onClick={() => handleSelectResult('parada')}
              >
                {t('shot.result_parada')}
              </button>
              <button
                type="button"
                className={`shot-chip-large ${result === 'fuera' ? 'selected-miss' : ''}`}
                onClick={() => handleSelectResult('fuera')}
              >
                {t('shot.result_fuera')}
              </button>
              <button
                type="button"
                className={`shot-chip-large ${result === 'bloqueado' ? 'selected-block' : ''}`}
                onClick={() => handleSelectResult('bloqueado')}
              >
                {t('shot.result_bloqueado')}
              </button>
            </div>
          </div>

          {/* PASO 2 (Solo si Parada): Dificultad de la Parada */}
          {result === 'parada' && (
            <div className="shot-section-group fade-in-step">
              <label className="shot-group-label">
                <span className="shot-step-badge">2</span> {t('shot.difficulty')}
              </label>
              <div className="shot-chips-grid-2">
                <button
                  type="button"
                  className={`shot-chip-large ${saveDifficulty === 'normal' ? 'selected' : ''}`}
                  onClick={() => handleSelectDifficulty('normal')}
                >
                  {t('shot.diff_normal')}
                </button>
                <button
                  type="button"
                  className={`shot-chip-large ${saveDifficulty === 'decisiva' ? 'selected-gold' : ''}`}
                  onClick={() => handleSelectDifficulty('decisiva')}
                >
                  {t('shot.diff_decisive')}
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 o 3: Comodidad del Rematador (Al tocar, confirma y cierra) */}
          {result && (result !== 'parada' || saveDifficulty) && (
            <div className="shot-section-group fade-in-step">
              <label className="shot-group-label">
                <span className="shot-step-badge">{result === 'parada' ? '3' : '2'}</span> {t('shot.comfort')}
              </label>
              <div className="shot-chips-grid-3">
                <button
                  type="button"
                  className={`shot-chip-large ${shooterComfort === 'comodo' ? 'selected-comfort' : ''}`}
                  onClick={() => handleSelectComfort('comodo')}
                >
                  {t('shot.comfort_comfortable')}
                </button>
                <button
                  type="button"
                  className={`shot-chip-large ${shooterComfort === 'presionado' ? 'selected-comfort' : ''}`}
                  onClick={() => handleSelectComfort('presionado')}
                >
                  {t('shot.comfort_pressed')}
                </button>
                <button
                  type="button"
                  className={`shot-chip-large ${shooterComfort === 'muy_presionado' ? 'selected-comfort' : ''}`}
                  onClick={() => handleSelectComfort('muy_presionado')}
                >
                  {t('shot.comfort_very_pressed')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shot-modal-footer">
          <button type="button" className="shot-btn-cancel" onClick={onClose}>
            {t('shot.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShotCaptureModal;
