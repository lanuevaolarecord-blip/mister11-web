import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { calculateShotXg } from '../config/xgWeights';
import SectorMiniPitch2D from './SectorMiniPitch2D';
import PlayerChipRow from './PlayerChipRow';
import './ShotCaptureModal.css';

/**
 * ShotCaptureModal (ShotModal Canónico)
 * Componente único y fuente de verdad exclusiva para remates, goles y paradas.
 * - 3 entradas al mismo modal: barra de equipo (gol), panel de equipo (tiro libre), HUD individual (tiro propio).
 * - Selección rápida en ≤3 taps.
 * - Soporte para 9 zonas 2D tácticas, 3 niveles de comodidad, dificultad de parada (normal/decisiva),
 *   atribución de jugador (opcional, attributed: false si queda vacío) y asistencia opcional en gol.
 */
export const ShotCaptureModal = ({
  isOpen,
  onClose,
  onConfirmShot,
  origin = 'team', // 'individual' | 'team' | 'goal_own' | 'goal_rival'
  initialTeam = 'own',
  initialSector = 'center',
  initialSector2D = 'centro_att',
  initialResult = null,
  initialDifficulty = null,
  activePlayerId = null,
  activePlayerName = '',
  playersList = [],
  activeGoalkeeper = null,
}) => {
  const { t, isEn } = useTranslation();

  const isOriginLocked = origin === 'individual' || origin === 'goal_own' || origin === 'goal_rival';
  const lockedSide = (origin === 'goal_rival') ? 'rival' : 'own';

  const [team, setTeam] = useState(isOriginLocked ? lockedSide : initialTeam);
  const [zone, setZone] = useState('centro_att');
  const [playType, setPlayType] = useState('jugada');
  const [result, setResult] = useState(initialResult);
  const [saveDifficulty, setSaveDifficulty] = useState(initialDifficulty);
  const [shooterComfort, setShooterComfort] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(activePlayerId);
  const [asistenciaId, setAsistenciaId] = useState(null);
  const [showPitchPicker, setShowPitchPicker] = useState(false);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (origin === 'individual' || origin === 'goal_own') {
        setTeam('own');
      } else if (origin === 'goal_rival') {
        setTeam('rival');
      } else {
        setTeam(initialTeam || 'own');
      }

      // Pre-rellenar zona según el sector 2D activo
      let defZone = initialSector2D || 'centro_att';
      if (!initialSector2D) {
        if (initialSector === 'left') defZone = 'izq_att';
        else if (initialSector === 'right') defZone = 'der_att';
        else defZone = 'centro_att';
      }
      setZone(defZone);

      setPlayType('jugada');
      setResult(initialResult || null);
      setSaveDifficulty(initialDifficulty || null);
      setShooterComfort(null);
      setSelectedPlayerId(activePlayerId || null);
      setAsistenciaId(null);
      setShowPitchPicker(false);
    }
  }, [isOpen, initialTeam, initialSector, initialSector2D, initialResult, initialDifficulty, activePlayerId]);

  const handleSelectPlayType = (pt) => {
    setPlayType(pt);
    if (pt === 'penalti') {
      setZone('penalti');
    } else if (zone === 'penalti') {
      setZone('centro_att');
    }
  };

  const handleSelectZone = (z) => {
    setZone(z);
    if (z === 'penalti') {
      setPlayType('penalti');
    }
  };

  // Dispatch canónico al completar los taps requeridos
  const finishAndDispatch = useCallback((finalComfort, finalDiff = saveDifficulty, finalRes = result, finalScorerId = selectedPlayerId, finalAssistId = asistenciaId) => {
    let pName = '';
    if (finalScorerId) {
      const found = playersList.find(p => String(p.id) === String(finalScorerId));
      if (found) pName = found.nombre || found.name || '';
    }

    let aName = '';
    if (finalAssistId) {
      const foundA = playersList.find(p => String(p.id) === String(finalAssistId));
      if (foundA) aName = foundA.nombre || foundA.name || '';
    }

    const calculatedXg = calculateShotXg({
      zone,
      shooterComfort: finalComfort,
      playType,
    });

    const isAttributed = Boolean(finalScorerId);

    // Deducir coordenadas representativas según la zona 2D
    let xCoord = 85;
    let yCoord = 50;
    if (zone.includes('izq')) yCoord = 18;
    else if (zone.includes('der')) yCoord = 82;
    else yCoord = 50;

    if (zone.includes('def')) xCoord = 25;
    else if (zone.includes('med')) xCoord = 55;
    else xCoord = 85;

    if (zone === 'penalti') {
      xCoord = 88;
      yCoord = 50;
    }

    const isGoal = finalRes === 'gol';
    const isSave = finalRes === 'parada';
    const outcome = isGoal ? 'goal' : (isSave ? 'on_target' : 'off_target');

    const shotPayload = {
      team,
      result: finalRes,
      outcome,
      isGoal,
      saveDifficulty: isSave ? (finalDiff || 'normal') : null,
      isDecisive: isSave && (finalDiff === 'decisiva'),
      shooterComfort: finalComfort,
      zone,
      zone2D: zone,
      playType,
      xG: calculatedXg,
      playerId: isAttributed ? finalScorerId : null,
      playerName: pName,
      attributed: isAttributed,
      asistenciaId: isGoal ? finalAssistId : null,
      asistenciaName: isGoal ? aName : '',
      sector: zone.includes('izq') ? 'left' : (zone.includes('der') ? 'right' : 'center'),
      x: xCoord,
      y: yCoord,
    };

    onConfirmShot(shotPayload);
    onClose();
  }, [team, zone, playType, selectedPlayerId, asistenciaId, playersList, result, saveDifficulty, onConfirmShot, onClose]);

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

  // Tap 2 o 3: Selección de Comodidad (Confirma inmediatamente)
  const handleSelectComfort = (c) => {
    setShooterComfort(c);
    finishAndDispatch(c, saveDifficulty, result, selectedPlayerId, asistenciaId);
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
            {isOriginLocked ? (
              <div
                className={`shot-team-chip fixed-locked ${lockedSide === 'own' ? 'active-own' : 'active-rival'}`}
                style={{ cursor: 'default', fontWeight: 800, minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{lockedSide === 'own' ? '⚽' : '🥅'}</span>
                <span>{lockedSide === 'own' ? t('shot.team_own') : t('shot.team_rival')}</span>
                <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0,0,0,0.15)' }}>
                  {isEn ? 'Fixed' : 'Fijo'}
                </span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="shot-modal-body">
          {/* Jugador Asignado (Chips de Jugadores en Campo) */}
          {team === 'own' && (
            <div className="shot-section-group">
              <label className="shot-group-label">
                👤 {isEn ? 'Shooter / Player:' : 'Rematador / Jugador:'}
              </label>
              <PlayerChipRow
                id="shot-shooter-chips"
                players={playersList}
                selectedId={selectedPlayerId}
                onSelect={(id) => setSelectedPlayerId(id)}
                showUnassigned={true}
                unassignedLabel={isEn ? 'Unattributed' : 'Sin atribuir'}
                unassignedIcon="🔘"
                ariaLabel={isEn ? 'Select shooter or player' : 'Seleccionar rematador o jugador'}
              />
            </div>
          )}

          {/* Asistencia (Solo visible si el resultado es gol propio) */}
          {team === 'own' && result === 'gol' && (
            <div className="shot-section-group fade-in-step">
              <label className="shot-group-label">
                👟 {isEn ? 'Assist (Optional):' : 'Asistencia (Opcional):'}
              </label>
              <PlayerChipRow
                id="shot-assist-chips"
                players={playersList.filter(p => String(p.id) !== String(selectedPlayerId))}
                selectedId={asistenciaId}
                onSelect={(id) => setAsistenciaId(id)}
                showUnassigned={true}
                unassignedLabel={isEn ? 'None' : 'Ninguna'}
                unassignedIcon="👟"
                ariaLabel={isEn ? 'Select assist player (optional)' : 'Seleccionar asistente (opcional)'}
              />
            </div>
          )}

          {/* Selector de Sector 2D Táctico (Mini-Campo 3x3) */}
          <div className="shot-section-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="shot-group-label" style={{ margin: 0 }}>
                📍 {t('shot.zone')}
              </label>
              <button
                type="button"
                className="shot-pitch-toggle-btn"
                onClick={() => setShowPitchPicker(prev => !prev)}
              >
                {showPitchPicker ? (isEn ? '▲ Quick chips' : '▲ Chips rápidos') : (isEn ? '▼ 3x3 Pitch' : '▼ Campo 3x3')}
              </button>
            </div>

            {showPitchPicker ? (
              <SectorMiniPitch2D
                selectedZone={zone}
                onSelectZone={handleSelectZone}
                compact={true}
                showLabel={true}
              />
            ) : (
              <div className="shot-chips-grid">
                <button
                  type="button"
                  className={`shot-chip ${zone === 'centro_att' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('centro_att')}
                >
                  {t('shot.zone_inside_center') || (isEn ? 'Center · Box' : 'Centro · Área')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'izq_att' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('izq_att')}
                >
                  {t('shot.zone_inside_left') || (isEn ? 'Left · Box' : 'Izq · Área')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'der_att' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('der_att')}
                >
                  {t('shot.zone_inside_right') || (isEn ? 'Right · Box' : 'Der · Área')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'centro_med' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('centro_med')}
                >
                  {t('shot.zone_outside_center') || (isEn ? 'Center · Mid' : 'Centro · Fuera')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'izq_med' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('izq_med')}
                >
                  {t('shot.zone_outside_left') || (isEn ? 'Left · Mid' : 'Izq · Fuera')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'der_med' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('der_med')}
                >
                  {t('shot.zone_outside_right') || (isEn ? 'Right · Mid' : 'Der · Fuera')}
                </button>
                <button
                  type="button"
                  className={`shot-chip ${zone === 'penalti' ? 'selected' : ''}`}
                  onClick={() => handleSelectZone('penalti')}
                >
                  {t('shot.zone_penalty')}
                </button>
              </div>
            )}
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

          {/* PASO 2 o 3: Comodidad del Rematador (Al tocar, confirma y cierra automáticamente) */}
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
