import React, { useState } from 'react';
import { Plus, Trash2, Search, Filter, Eye } from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import './ExerciseLibrary.css';

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
    const boldMatch = line.match(/^\*\*(.+?):\*\* (.+)$/);
    if (boldMatch) return <p key={i}><strong>{boldMatch[1]}:</strong> {boldMatch[2]}</p>;
    if (line.startsWith('- ')) return <li key={i}>{line.replace('- ', '')}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  });
};

const ExerciseLibrary = ({ activeTeamId }) => {
  const { t, isEn } = useTranslation();
  const { exercises, loading, addExercise, removeExercise } = useExercises(activeTeamId);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [viewExercise, setViewExercise] = useState(null);
  const [newExercise, setNewExercise] = useState({
    name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
    difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
  });

  const handleSave = async () => {
    if (!newExercise.name) return;
    await addExercise({
      ...newExercise,
      source: 'manual',
      createdBy: 'trainer',
      locale: isEn ? 'en' : 'es'
    });
    setShowModal(false);
    setNewExercise({
      name: '', category: 'fortalecimiento', targetZones: [], injuryTypes: [], 
      difficulty: 1, description: '', durationSeconds: 0, reps: 0, series: 1
    });
  };

  const filteredExercises = exercises.filter(ex => {
    const rawName = (ex.name || ex.titulo || ex.title || '').trim();
    if (!rawName || rawName === '<think>' || rawName.toLowerCase().startsWith('<think>')) return false;
    const matchesSearch = rawName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="exercise-library">
      <div className="library-header">
        <h2>{isEn ? 'Exercise Library' : 'Biblioteca de Ejercicios'}</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> {isEn ? 'New Exercise' : 'Nuevo Ejercicio'}
        </button>
      </div>

      <div className="library-filters">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={isEn ? 'Search exercise...' : 'Buscar ejercicio...'} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{isEn ? 'All categories' : 'Todas las categorías'}</option>
            <option value="prevencion">{isEn ? 'Prevention' : 'Prevención'}</option>
            <option value="recuperacion">{isEn ? 'Recovery' : 'Recuperación'}</option>
            <option value="fortalecimiento">{isEn ? 'Strengthening' : 'Fortalecimiento'}</option>
            <option value="movilidad">{isEn ? 'Mobility' : 'Movilidad'}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">{isEn ? 'Loading exercises...' : 'Cargando ejercicios...'}</div>
      ) : (
        <div className="exercises-grid">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="exercise-card">
              <div className="exercise-card-header">
                <h3>{ex.name || ex.titulo || ex.title || (isEn ? 'Exercise' : 'Ejercicio')}</h3>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {ex.source === 'system' && <span className="badge-system">{isEn ? 'System' : 'Sistema'}</span>}
                  {ex.source === 'ia' && <span className="badge-ia">{isEn ? 'AI' : 'IA'}</span>}
                  {ex.locale && ex.locale !== (isEn ? 'en' : 'es') && (
                    <span 
                      className="badge-original-lang" 
                      title={ex.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                    >
                      {ex.locale === 'es' ? t('common.originalBadgeEs') : t('common.originalBadgeEn')}
                    </span>
                  )}
                </div>
              </div>
              <div className="exercise-card-body">
                <span className={`badge-cat cat-${ex.category}`}>
                  {ex.category === 'prevencion' ? (isEn ? 'Prevention' : 'Prevención') :
                   ex.category === 'recuperacion' ? (isEn ? 'Recovery' : 'Recuperación') :
                   ex.category === 'fortalecimiento' ? (isEn ? 'Strengthening' : 'Fortalecimiento') :
                   ex.category === 'movilidad' ? (isEn ? 'Mobility' : 'Movilidad') :
                   ex.category}
                </span>
                <p>{ex.description || (isEn ? 'No description' : 'Sin descripción')}</p>
                <div className="exercise-meta">
                  {ex.durationSeconds > 0 && <span>⏱️ {ex.durationSeconds}s</span>}
                  {ex.reps > 0 && <span>🔁 {ex.reps} reps</span>}
                  {ex.series > 0 && <span>🔄 {ex.series} {isEn ? 'sets' : 'series'}</span>}
                  <span>⭐ {isEn ? 'Level' : 'Nivel'} {ex.difficulty}</span>
                </div>
              </div>
              <div className="exercise-card-actions">
                <button className="btn-view-exercise" onClick={() => setViewExercise(ex)} title={isEn ? 'View detail' : 'Ver detalle'}>
                  <Eye size={16} /> {isEn ? 'View' : 'Ver'}
                </button>
                {ex.source !== 'system' && (
                  <button className="btn-delete-exercise" onClick={() => removeExercise(ex.id)} title={isEn ? 'Delete' : 'Eliminar'}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{isEn ? 'Add Manual Exercise' : 'Añadir Ejercicio Manual'}</h2>
            <div className="form-group">
              <label>{isEn ? 'Exercise Name' : 'Nombre del Ejercicio'}</label>
              <input type="text" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder={isEn ? 'e.g. Side Plank...' : 'Ej. Plancha Lateral...'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{isEn ? 'Category' : 'Categoría'}</label>
                <select value={newExercise.category} onChange={e => setNewExercise({...newExercise, category: e.target.value})}>
                  <option value="prevencion">{isEn ? 'Prevention' : 'Prevención'}</option>
                  <option value="recuperacion">{isEn ? 'Recovery' : 'Recuperación'}</option>
                  <option value="fortalecimiento">{isEn ? 'Strengthening' : 'Fortalecimiento'}</option>
                  <option value="movilidad">{isEn ? 'Mobility' : 'Movilidad'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{isEn ? 'Difficulty (1-3)' : 'Dificultad (1-3)'}</label>
                <input type="number" min="1" max="3" value={newExercise.difficulty} onChange={e => setNewExercise({...newExercise, difficulty: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="form-group">
              <label>{isEn ? 'Description' : 'Descripción'}</label>
              <textarea value={newExercise.description} onChange={e => setNewExercise({...newExercise, description: e.target.value})} placeholder={isEn ? 'Detailed instructions...' : 'Instrucciones detalladas...'} rows="3"></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{isEn ? 'Sets' : 'Series'}</label>
                <input type="number" value={newExercise.series} onChange={e => setNewExercise({...newExercise, series: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>{isEn ? 'Reps' : 'Repeticiones'}</label>
                <input type="number" value={newExercise.reps} onChange={e => setNewExercise({...newExercise, reps: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>{isEn ? 'Duration (sec)' : 'Duración (segs)'}</label>
                <input type="number" value={newExercise.durationSeconds} onChange={e => setNewExercise({...newExercise, durationSeconds: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
              <button className="btn-save" onClick={handleSave}>{isEn ? 'Save Exercise' : 'Guardar Ejercicio'}</button>
            </div>
          </div>
        </div>
      )}

      {viewExercise && (
        <div className="modal-overlay" onClick={() => setViewExercise(null)}>
          <div className="modal-content view-exercise-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewExercise.name || viewExercise.titulo}</h2>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className={`badge-cat cat-${viewExercise.category}`}>
                  {viewExercise.category === 'prevencion' ? (isEn ? 'Prevention' : 'Prevención') :
                   viewExercise.category === 'recuperacion' ? (isEn ? 'Recovery' : 'Recuperación') :
                   viewExercise.category === 'fortalecimiento' ? (isEn ? 'Strengthening' : 'Fortalecimiento') :
                   viewExercise.category === 'movilidad' ? (isEn ? 'Mobility' : 'Movilidad') :
                   viewExercise.category}
                </span>
                {viewExercise.locale && viewExercise.locale !== (isEn ? 'en' : 'es') && (
                  <span 
                    className="badge-original-lang" 
                    title={viewExercise.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                  >
                    {viewExercise.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                  </span>
                )}
              </div>
            </div>
            
            <div className="exercise-meta-detail">
              {viewExercise.durationSeconds > 0 && <span>⏱️ {viewExercise.durationSeconds}s</span>}
              {viewExercise.reps > 0 && <span>🔁 {viewExercise.reps} reps</span>}
              {viewExercise.series > 0 && <span>🔄 {viewExercise.series} {isEn ? 'sets' : 'series'}</span>}
              <span>⭐ {isEn ? 'Level' : 'Nivel'} {viewExercise.difficulty}</span>
            </div>

            <div className="exercise-description-detail">
              {viewExercise.markdown ? (
                <div className="ia-markdown">
                  {renderMarkdown(viewExercise.markdown)}
                </div>
              ) : (
                <p>{viewExercise.description || (isEn ? 'No description' : 'Sin descripción')}</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setViewExercise(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
