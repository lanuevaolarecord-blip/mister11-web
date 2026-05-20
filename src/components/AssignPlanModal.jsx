import React, { useState } from 'react';
import { useExercises } from '../hooks/useExercises';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { X, Search, CheckSquare, Square } from 'lucide-react';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'mon-wed-fri', label: 'Lunes, Miércoles y Viernes' },
  { value: 'weekly', label: 'Una vez por semana' },
  { value: 'pre-match', label: 'Pre-partido' },
];

const REASON_OPTIONS = [
  { value: 'prevencion', label: 'Prevención' },
  { value: 'recuperacion', label: 'Recuperación / Lesión' },
  { value: 'fortalecimiento', label: 'Fortalecimiento general' },
];

const AssignPlanModal = ({ player, activeTeamId, onClose }) => {
  const { exercises } = useExercises(activeTeamId);
  const { addPlayerPlan } = usePlayerPlans(activeTeamId);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [reason, setReason] = useState('prevencion');
  const [planName, setPlanName] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = exercises.filter(ex =>
    (ex.name || ex.titulo || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un ejercicio.');
      return;
    }
    setSaving(true);
    await addPlayerPlan({
      playerId: player.id,
      teamId: activeTeamId,
      name: planName || `Plan de ${reason} — ${player.name || player.nombre}`,
      reason,
      createdBy: 'trainer',
      exercises: selectedIds.map(id => ({
        exerciseId: id,
        frequency,
        completedDates: [],
        assignedDate: new Date().toISOString(),
      })),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          background: '#1B3A2D', color: '#fff', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>📋 Asignar Plan de Ejercicios</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
              {player.name || player.nombre}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            borderRadius: '8px', padding: '8px', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Nombre del Plan (opcional)
              </label>
              <input
                type="text"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="Ej: Prevención isquios"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Motivo
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit' }}
              >
                {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Frecuencia
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit' }}
            >
              {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Seleccionar Ejercicios ({selectedIds.length} seleccionados)
            </label>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '8px' }}>
              {filtered.map(ex => {
                const isSelected = selectedIds.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleSelect(ex.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? '#F0FDF4' : '#F8FAFC',
                      border: isSelected ? '1px solid #4CAF7D' : '1px solid transparent',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSelected
                      ? <CheckSquare size={18} color="#4CAF7D" style={{ flexShrink: 0 }} />
                      : <Square size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    }
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                        {ex.name || ex.titulo}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        {ex.category} {ex.series > 0 ? `· ${ex.series} series` : ''} {ex.durationSeconds > 0 ? `· ${ex.durationSeconds}s` : ''} {ex.reps > 0 ? `· ${ex.reps} reps` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E5E7EB',
          display: 'flex', gap: '12px', justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
            background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#4CAF7D', color: 'white', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', opacity: saving ? 0.7 : 1
          }}>
            {saving ? 'Guardando...' : '✅ Asignar Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPlanModal;
