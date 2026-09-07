import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const RPETestModal = ({ isOpen, onClose, onSave, player }) => {
  const { t } = useTranslation();
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          borderRadius: '16px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card, #FFFFFF)'
        }}
      >
        <div className="modal-header" style={{ padding: '18px 24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Registro de Esfuerzo Percibido (RPE)</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem', margin: 0 }}>
            Registra cómo percibió el esfuerzo <strong>{player?.name}</strong>.
          </p>
          
          <div className="form-group-team" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>Nivel de Esfuerzo (RPE 1-10)</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={rpe} 
              onChange={e => setRpe(e.target.value)} 
              style={{ width: '100%', margin: '12px 0', accentColor: getRpeColor(rpe), cursor: 'pointer' }}
            />
            <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '1.8rem', color: getRpeColor(rpe), lineHeight: 1 }}>{rpe}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
              <span>1 - Muy suave</span>
              <span>10 - Máximo esfuerzo</span>
            </div>
          </div>

          <div className="form-group-team" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>Duración de la sesión (minutos)</label>
            <input 
              type="number" 
              value={sessionDuration} 
              onChange={e => setSessionDuration(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '15px' }}
            />
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary, #F8FAFC)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>Carga de Entrenamiento (RPE × Duración):</span><br/>
            <strong style={{ fontSize: '1.3rem', color: 'var(--accent, #10B981)', display: 'inline-block', marginTop: '4px' }}>{rpe * sessionDuration} UA</strong>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn-secondary" style={{ flex: 1, minHeight: '48px', fontWeight: 800 }} onClick={onClose}>{t('tests.rpe.cancel')}</button>
          <button className="btn-primary" style={{ flex: 1, minHeight: '48px', fontWeight: 800, background: '#10B981', borderColor: '#10B981', color: '#FFF' }} onClick={handleSave}>{t('tests.rpe.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default RPETestModal;
