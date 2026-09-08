import React from 'react';
import { FORMATIONS } from '../../lib/mister11-field.js';
import { useTranslation } from '../../hooks/useTranslation';

const TeamCard = ({ color, name, count, onAdd, onColorChange, formation, onFormationChange, onApply, applyLabel }) => {
  const { isEn } = useTranslation();
  return (
  <div className="team-card-pizarra">
    <div className="team-header-pizarra">
      <div style={{ position: 'relative', width: 22, height: 22 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: '1px solid white' }} />
        {onColorChange && (
          <input 
            type="color" 
            value={color} 
            onChange={(e) => onColorChange(e.target.value)}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer'
            }}
          />
        )}
      </div>
      <span className="team-name-pizarra">{name}</span>
      <button className="btn-add-player-pizarra" onClick={onAdd}>+</button>
    </div>

    {onFormationChange && (
      <div className="formation-select-container-pizarra">
        <select 
          value={formation} 
          onChange={(e) => onFormationChange(e.target.value)}
          className="formation-select-pizarra"
        >
          {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button 
          className="btn-apply-formation-pizarra"
          onClick={onApply}
          title={isEn ? "Apply / Reset lineup" : "Aplicar / Reiniciar alineación"}
        >
          {applyLabel || 'APLICAR'}
        </button>
      </div>
    )}
  </div>
);
};

const SavedPlaysPanel = ({
  localColor,
  setLocalColor,
  rivalColor,
  setRivalColor,
  jokerColor,
  setJokerColor,
  localFormation,
  setLocalFormation,
  rivalFormation,
  setRivalFormation,
  addManualPlayer,
  aplicarFormacion,
  showRival,
  setShowRival,
  deleteSelected,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pizarra-sidebar-content">
      <div className="panel-title">{t('board.teams.title')}</div>
      <div style={{ padding: '0 0 8px' }}>
        <TeamCard 
          color={localColor} 
          name={t('board.teams.local')} 
          count={11} 
          onAdd={() => addManualPlayer('local')} 
          onColorChange={setLocalColor}
          formation={localFormation}
          onFormationChange={setLocalFormation}
          onApply={() => aplicarFormacion('local', localFormation)}
          applyLabel={t('board.teams.apply')}
        />
        <TeamCard 
          color={rivalColor} 
          name={t('board.teams.rival')} 
          count={11} 
          onAdd={() => addManualPlayer('rival')} 
          onColorChange={setRivalColor}
          formation={rivalFormation}
          onFormationChange={setRivalFormation}
          onApply={() => aplicarFormacion('rival', rivalFormation)}
          applyLabel={t('board.teams.apply')}
        />
        <TeamCard 
          color={jokerColor} 
          name={t('board.teams.wildcard')} 
          count={0} 
          onAdd={() => addManualPlayer('joker')} 
          onColorChange={setJokerColor}
        />
      </div>

      <div className="panel-title">{t('board.actions.title')}</div>
      <div className="acciones-panel-container-grid">
        <button 
          className={`toggle-rival ${showRival ? 'active' : ''}`}
          onClick={() => setShowRival(!showRival)}
        >
          {showRival ? t('board.actions.hideRival') : t('board.actions.showRival')}
        </button>
        <button className="btn-delete-pizarra" onClick={deleteSelected}>🗑 {t('board.actions.delete')}</button>
      </div>
    </div>
  );
};

export default SavedPlaysPanel;
