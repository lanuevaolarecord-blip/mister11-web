import React, { useState } from 'react';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import './ExerciseLibrary.css';

const ExerciseLibrary = ({ activeTeamId }) => {
  const { exercises, loading, addExercise, removeExercise } = useExercises(activeTeamId);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
    difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
  });

  const handleSave = async () => {
    if (!newExercise.name) return;
    await addExercise({
      ...newExercise,
      source: 'manual',
      createdBy: 'trainer'
    });
    setShowModal(false);
    setNewExercise({
      name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
      difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
    });
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = (ex.name || ex.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="exercise-library">
      <div className="library-header">
        <h2>Biblioteca de Ejercicios</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nuevo Ejercicio
        </button>
      </div>

      <div className="library-filters">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar ejercicio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas las categorías</option>
            <option value="prevencion">Prevención</option>
            <option value="recuperacion">Recuperación</option>
            <option value="fortalecimiento">Fortalecimiento</option>
            <option value="movilidad">Movilidad</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando ejercicios...</div>
      ) : (
        <div className="exercises-grid">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="exercise-card">
              <div className="exercise-card-header">
                <h3>{ex.name || ex.titulo}</h3>
                {ex.source === 'system' && <span className="badge-system">Sistema</span>}
                {ex.source === 'ia' && <span className="badge-ia">IA</span>}
              </div>
              <div className="exercise-card-body">
                <span className={`badge-cat cat-${ex.category}`}>{ex.category}</span>
                <p>{ex.description || 'Sin descripción'}</p>
                <div className="exercise-meta">
                  {ex.durationSeconds > 0 && <span>⏱️ {ex.durationSeconds}s</span>}
                  {ex.reps > 0 && <span>🔁 {ex.reps} reps</span>}
                  {ex.series > 0 && <span>🔄 {ex.series} series</span>}
                  <span>⭐ Nivel {ex.difficulty}</span>
                </div>
              </div>
              {ex.source !== 'system' && (
                <button className="btn-delete-exercise" onClick={() => removeExercise(ex.id)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Añadir Ejercicio Manual</h2>
            <div className="form-group">
              <label>Nombre del Ejercicio</label>
              <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Ej. Plancha Lateral..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select value={newExercise.category} onChange={e => setNewExercise({...newExercise, category: e.target.value})}>
                  <option value="prevencion">Prevención</option>
                  <option value="recuperacion">Recuperación</option>
                  <option value="fortalecimiento">Fortalecimiento</option>
                  <option value="movilidad">Movilidad</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dificultad (1-3)</label>
                <input type="number" min="1" max="3" value={newExercise.difficulty} onChange={e => setNewExercise({...newExercise, difficulty: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={newExercise.description} onChange={e => setNewExercise({...newExercise, description: e.target.value})} placeholder="Instrucciones detalladas..." rows="3"></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Series</label>
                <input type="number" value={newExercise.series} onChange={e => setNewExercise({...newExercise, series: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Repeticiones</label>
                <input type="number" value={newExercise.reps} onChange={e => setNewExercise({...newExercise, reps: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Duración (segs)</label>
                <input type="number" value={newExercise.durationSeconds} onChange={e => setNewExercise({...newExercise, durationSeconds: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave}>Guardar Ejercicio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
