import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './UnattributedEventsManager.css';

/**
 * UnattributedEventsManager
 * Panel de gestión y atribución diferida (individual o en lote) de eventos sin jugador asignado.
 * Garantiza que la atribución recalculada sea idempotente (sin duplicar ni perder eventos).
 */
export const UnattributedEventsManager = ({
  isOpen,
  onClose,
  events = [],
  playersList = [],
  onAttributeEvents,
  readOnly = false,
}) => {
  const { t, isEn } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [targetPlayerByGroup, setTargetPlayerByGroup] = useState({});

  // Filtrar eventos sin atribuir (playerId null, vacío, 'unassigned' o attributed: false)
  const unattributedEvents = useMemo(() => {
    return (events || []).filter(e => {
      if (!e) return false;
      const hasNoPlayer = !e.playerId || e.playerId === 'unassigned' || e.playerId === 'null';
      const isMarkedUnattributed = e.attributed === false;
      const isOwnTeam = e.team === 'own' || e.team === 'home' || !e.team || e.type?.includes('own') || e.type === 'duel_won' || e.type === 'recovery' || e.type === 'foul_against';

      // No requerir atribución para eventos rivales
      const isRival = e.team === 'rival' || e.team === 'away' || e.type?.includes('rival');
      if (isRival) return false;

      return (hasNoPlayer || isMarkedUnattributed);
    });
  }, [events]);

  // Agrupar eventos sin atribuir por tipo de acción
  const groupedEvents = useMemo(() => {
    const groups = {};
    unattributedEvents.forEach(e => {
      const type = e.type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(e);
    });
    return groups;
  }, [unattributedEvents]);

  const getActionLabel = (type) => {
    switch (type) {
      case 'duel_won': return isEn ? '✊ Duel Won' : '✊ Duelo Ganado';
      case 'duel_lost': return isEn ? '🤜 Duel Lost' : '🤜 Duelo Perdido';
      case 'recovery': return isEn ? '↑ Recovery' : '↑ Recuperación';
      case 'foul_against': return isEn ? '⚡ Foul Conceded' : '⚡ Falta Cometida';
      case 'foul_favor': return isEn ? '✅ Foul Won' : '✅ Falta a Favor';
      case 'shot_on_target_own': return isEn ? '🎯 Shot on Target' : '🎯 Tiro a Puerta';
      case 'shot_off_target_own': return isEn ? '⬜ Shot Missed' : '⬜ Tiro Fuera';
      case 'card_yellow_own': return isEn ? '🟨 Yellow Card' : '🟨 Tarjeta Amarilla';
      case 'card_red_own': return isEn ? '🟥 Red Card' : '🟥 Tarjeta Roja';
      default: return type;
    }
  };

  const handleBatchAttribute = (type) => {
    const pId = targetPlayerByGroup[type];
    if (!pId || !onAttributeEvents) return;

    const evtsToAssign = groupedEvents[type] || [];
    const playerObj = playersList.find(p => String(p.id) === String(pId));
    const pName = playerObj ? (playerObj.nombre || playerObj.name || '') : '';

    onAttributeEvents({
      eventIds: evtsToAssign.map(e => e.id),
      playerId: pId,
      playerName: pName,
    });

    // Limpiar selección de ese grupo
    setTargetPlayerByGroup(prev => {
      const n = { ...prev };
      delete n[type];
      return n;
    });
  };

  const handleSingleAttribute = (eventDoc, pId) => {
    if (!pId || !onAttributeEvents) return;
    const playerObj = playersList.find(p => String(p.id) === String(pId));
    const pName = playerObj ? (playerObj.nombre || playerObj.name || '') : '';

    onAttributeEvents({
      eventIds: [eventDoc.id],
      playerId: pId,
      playerName: pName,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="unattr-modal-overlay" onClick={onClose}>
      <div className="unattr-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="unattr-modal-header">
          <div className="unattr-title-row">
            <h3 className="unattr-title">
              <span>📋</span>
              <span>{isEn ? 'Unattributed Events' : 'Eventos Sin Atribuir'}</span>
              <span className="unattr-count-pill">{unattributedEvents.length}</span>
            </h3>
            <button type="button" className="unattr-close-btn" onClick={onClose}>✕</button>
          </div>
          <p className="unattr-subtitle">
            {isEn
              ? 'Assign events to players to update individual ratings, radars, and XP. Team totals remain unchanged.'
              : 'Asigna eventos a jugadores para computar notas, radares y XP individual. Los totales de equipo se mantienen intactos.'}
          </p>
        </div>

        {/* Contenido */}
        <div className="unattr-modal-body">
          {unattributedEvents.length === 0 ? (
            <div className="unattr-empty-state">
              <span style={{ fontSize: '36px' }}>✨</span>
              <h4>{isEn ? 'All events are attributed!' : '¡Todos los eventos están atribuidos!'}</h4>
              <p>{isEn ? 'There are no pending events to assign.' : 'No hay eventos pendientes de asignación en este partido.'}</p>
            </div>
          ) : (
            <div className="unattr-groups-list">
              {Object.entries(groupedEvents).map(([type, evtsList]) => {
                const currentSelectedPlayer = targetPlayerByGroup[type] || '';
                return (
                  <div key={type} className="unattr-group-card">
                    <div className="unattr-group-header">
                      <div className="unattr-group-info">
                        <strong>{getActionLabel(type)}</strong>
                        <span className="unattr-badge-qty">
                          {evtsList.length} {evtsList.length === 1 ? (isEn ? 'event' : 'evento') : (isEn ? 'events' : 'eventos')}
                        </span>
                      </div>

                      {/* Selector y botón de atribución en lote */}
                      {!readOnly && (
                        <div className="unattr-batch-controls">
                          <select
                            className="unattr-player-select"
                            value={currentSelectedPlayer}
                            onChange={(e) => setTargetPlayerByGroup(prev => ({ ...prev, [type]: e.target.value }))}
                          >
                            <option value="">{isEn ? 'Select player for batch...' : 'Seleccionar jugador para lote...'}</option>
                            {playersList.map(p => (
                              <option key={p.id} value={p.id}>
                                #{p.dorsal || p.number || ''} {p.nombre || p.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="unattr-btn-batch"
                            disabled={!currentSelectedPlayer}
                            onClick={() => handleBatchAttribute(type)}
                          >
                            {isEn ? `Assign All (${evtsList.length})` : `Asignar Todos (${evtsList.length})`}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desglose de eventos individuales del grupo */}
                    <div className="unattr-events-sublist">
                      {evtsList.map((e, idx) => (
                        <div key={e.id || idx} className="unattr-event-item">
                          <div className="unattr-event-meta">
                            <span className="unattr-min-badge">{e.minute || 0}'</span>
                            <span className="unattr-sector-badge">{e.zone || e.sector || 'centro'}</span>
                          </div>
                          {!readOnly && (
                            <div className="unattr-item-quick-assign">
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>{isEn ? 'Assign:' : 'Asignar:'}</span>
                              <div className="unattr-chips-row">
                                {playersList.slice(0, 6).map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="unattr-mini-chip"
                                    onClick={() => handleSingleAttribute(e, p.id)}
                                    title={p.nombre || p.name}
                                  >
                                    #{p.dorsal || p.number || ''} {(p.nombre || p.name || '').split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="unattr-modal-footer">
          <button type="button" className="unattr-btn-done" onClick={onClose}>
            {isEn ? 'Done' : 'Listo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnattributedEventsManager;
