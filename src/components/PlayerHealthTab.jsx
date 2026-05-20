import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateDocument } from '../firebase/db';

const PlayerHealthTab = ({ player, teamId }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(player?.currentStatus || 'active');
  const [observations, setObservations] = useState(player?.medicalObservations || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states for new injury
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [newInjury, setNewInjury] = useState({ type: '', bodyZone: '', date: '', notes: '' });

  const getStatusColor = (s) => {
    switch (s) {
      case 'active': return '#22C55E';
      case 'recovery': return '#F59E0B';
      case 'injured': return '#EF4444';
      case 'rest': return '#9CA3AF';
      default: return '#22C55E';
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case 'active': return 'Activo';
      case 'recovery': return 'Recuperación';
      case 'injured': return 'Lesionado';
      case 'rest': return 'Descanso';
      default: return 'Activo';
    }
  };

  const saveHealthData = async () => {
    setIsSaving(true);
    try {
      await updateDocument(`users/${user.uid}/teams/${teamId}/players`, player.id, {
        currentStatus: status,
        medicalObservations: observations,
        lastUpdated: new Date()
      });
      alert('Datos de salud guardados');
    } catch (error) {
      console.error(error);
      alert('Error al guardar datos de salud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInjury = async () => {
    if (!newInjury.type || !newInjury.bodyZone || !newInjury.date) {
      alert("Completa los campos obligatorios");
      return;
    }
    const injuryEntry = {
      id: crypto.randomUUID(),
      ...newInjury,
      recoveryDate: null,
      timestamp: new Date()
    };
    
    const updatedHistory = [...(player.injuryHistory || []), injuryEntry];
    
    try {
      await updateDocument(`users/${user.uid}/teams/${teamId}/players`, player.id, {
        injuryHistory: updatedHistory,
        currentStatus: 'injured'
      });
      setStatus('injured');
      setShowInjuryModal(false);
      setNewInjury({ type: '', bodyZone: '', date: '', notes: '' });
    } catch (error) {
      console.error("Error adding injury", error);
    }
  };

  const handleRecoverInjury = async (injuryId) => {
    const updatedHistory = (player.injuryHistory || []).map(inj => {
      if (inj.id === injuryId) {
        return { ...inj, recoveryDate: new Date() };
      }
      return inj;
    });

    try {
      await updateDocument(`users/${user.uid}/teams/${teamId}/players`, player.id, {
        injuryHistory: updatedHistory
      });
    } catch (error) {
      console.error("Error recovering injury", error);
    }
  };

  return (
    <div className="tab-pane health-tab">
      <div className="health-status-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Estado Actual</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px',
              border: `2px solid ${getStatusColor(status)}`,
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontWeight: 'bold'
            }}
          >
            <option value="active">Activo</option>
            <option value="recovery">En Recuperación</option>
            <option value="injured">Lesionado</option>
            <option value="rest">Descanso</option>
          </select>
        </div>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: getStatusColor(status), flexShrink: 0, marginTop: '20px' }}></div>
      </div>

      <div className="form-group-team" style={{ marginBottom: '20px' }}>
        <label>Observaciones Médicas</label>
        <textarea 
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Alergias, tratamientos continuos, notas médicas..."
          style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', resize: 'vertical' }}
        />
      </div>
      
      <button className="btn-primary" onClick={saveHealthData} disabled={isSaving} style={{ width: '100%', marginBottom: '30px' }}>
        {isSaving ? 'Guardando...' : 'Actualizar Estado General'}
      </button>

      <div className="injury-history-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Historial de Lesiones</h3>
          <button className="btn-secondary" onClick={() => setShowInjuryModal(true)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>+ Registrar Lesión</button>
        </div>

        {(!player.injuryHistory || player.injuryHistory.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            No hay lesiones registradas.
          </p>
        ) : (
          <div className="injury-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {player.injuryHistory.slice().reverse().map(inj => (
              <div key={inj.id} style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${inj.recoveryDate ? '#22C55E' : '#EF4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{inj.type} ({inj.bodyZone})</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(inj.date).toLocaleDateString()}</span>
                </div>
                {inj.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '5px 0' }}>{inj.notes}</p>}
                
                <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
                  {inj.recoveryDate ? (
                    <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓ Recuperado el {new Date(inj.recoveryDate).toLocaleDateString()}</span>
                  ) : (
                    <button onClick={() => handleRecoverInjury(inj.id)} style={{ background: 'none', border: '1px solid #22C55E', color: '#22C55E', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Marcar como Recuperado</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInjuryModal && (
        <div className="modal-overlay" onClick={() => setShowInjuryModal(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nueva Lesión</h2>
              <button className="btn-close" onClick={() => setShowInjuryModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group-team">
                <label>Tipo de Lesión *</label>
                <input type="text" value={newInjury.type} onChange={e => setNewInjury({...newInjury, type: e.target.value})} placeholder="Ej. Esguince Grado 2" />
              </div>
              <div className="form-group-team">
                <label>Zona Afectada *</label>
                <input type="text" value={newInjury.bodyZone} onChange={e => setNewInjury({...newInjury, bodyZone: e.target.value})} placeholder="Ej. Tobillo derecho" />
              </div>
              <div className="form-group-team">
                <label>Fecha de Lesión *</label>
                <input type="date" value={newInjury.date} onChange={e => setNewInjury({...newInjury, date: e.target.value})} />
              </div>
              <div className="form-group-team">
                <label>Notas Adicionales</label>
                <textarea value={newInjury.notes} onChange={e => setNewInjury({...newInjury, notes: e.target.value})} placeholder="Mecanismo de lesión, diagnóstico..." style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowInjuryModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddInjury}>Guardar Lesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerHealthTab;
