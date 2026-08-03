import React from 'react';
import { FORMATIONS } from '../../lib/mister11-field.js';

const TeamCard = ({ color, name, count, onAdd, onColorChange, formation, onFormationChange, onApply }) => (
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
          title="Aplicar / Reiniciar alineación"
        >
          APLICAR
        </button>
      </div>
    )}
  </div>
);

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
  return (
    <div className="pizarra-sidebar-content">
      <div className="panel-title">EQUIPOS</div>
      <div style={{ padding: '0 0 8px' }}>
        <TeamCard 
          color={localColor} 
          name="Local" 
          count={11} 
          onAdd={() => addManualPlayer('local')} 
          onColorChange={setLocalColor}
          formation={localFormation}
          onFormationChange={setLocalFormation}
          onApply={() => aplicarFormacion('local', localFormation)}
        />
        <TeamCard 
          color={rivalColor} 
          name="Rival" 
          count={11} 
          onAdd={() => addManualPlayer('rival')} 
          onColorChange={setRivalColor}
          formation={rivalFormation}
          onFormationChange={setRivalFormation}
          onApply={() => aplicarFormacion('rival', rivalFormation)}
        />
        <TeamCard 
          color={jokerColor} 
          name="Comodín" 
          count={0} 
          onAdd={() => addManualPlayer('joker')} 
          onColorChange={setJokerColor}
        />
      </div>

      <div className="panel-title">ACCIONES</div>
      <div className="acciones-panel-container-grid">
        <button 
          className={`toggle-rival ${showRival ? 'active' : ''}`}
          onClick={() => setShowRival(!showRival)}
        >
          {showRival ? '👁 QUITAR RIVAL' : '👁 MOSTRAR RIVAL'}
        </button>
        <button className="btn-delete-pizarra" onClick={deleteSelected}>🗑 BORRAR</button>
      </div>
    </div>
  );
};

export default SavedPlaysPanel;
