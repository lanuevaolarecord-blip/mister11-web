import React, { useState } from 'react';

const RPETestModal = ({ isOpen, onClose, onSave, player }) => {
  const [rpe, setRpe] = useState(5);
  const [sessionDuration, setSessionDuration] = useState(60);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      categoria: 'rpe',
      jugadorId: player.id,
      nombreJugador: player.name,
      fecha: new Date().toISOString(),
      rpeValue: Number(rpe),
      duracionMinutos: Number(sessionDuration),
      carga: Number(rpe) * Number(sessionDuration),
      valor: Number(rpe) // Para gráficas genéricas
    });
    onClose();
  };

  const getRpeColor = (val) => {
    if (val <= 3) return '#22C55E';
    if (val <= 6) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registro de Esfuerzo Percibido (RPE)</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registra cómo percibió el esfuerzo <strong>{player?.name}</strong>.</p>
          
          <div className="form-group-team">
            <label>Nivel de Esfuerzo (RPE 1-10)</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={rpe} 
              onChange={e => setRpe(e.target.value)} 
              style={{ width: '100%', margin: '10px 0' }}
            />
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: getRpeColor(rpe) }}>{rpe}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>1 - Muy suave</span>
              <span>10 - Máximo esfuerzo</span>
            </div>
          </div>

          <div className="form-group-team">
            <label>Duración de la sesión (minutos)</label>
            <input 
              type="number" 
              value={sessionDuration} 
              onChange={e => setSessionDuration(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carga de Entrenamiento (RPE × Duración):</span><br/>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{rpe * sessionDuration} UA</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Guardar RPE</button>
        </div>
      </div>
    </div>
  );
};

export default RPETestModal;
