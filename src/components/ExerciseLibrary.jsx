import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  Repeat, 
  RotateCw, 
  BarChart2, 
  Baby, 
  Dumbbell, 
  Home, 
  ShieldAlert, 
  Shield, 
  CheckCircle2 
} from 'lucide-react';
import { useExercises, getLocalizedExercise } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import ExerciseIllustrationBlock from './ExerciseIllustrationBlock';
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

const formatLocalizedAlt = (options, lang) => {
  if (!options) return null;
  const altDict = {
    'silla_estable': { es: 'Silla estable', pt: 'Cadeira estável', fr: 'Chaise stable', id: 'Kursi stabil', en: 'Stable chair' },
    'sofa': { es: 'Sofá', pt: 'Sofá', fr: 'Canapé', id: 'Sofa', en: 'Sofa' },
    'cama_pesada': { es: 'Cama pesada', pt: 'Cama pesada', fr: 'Lit lourd', id: 'Tempat tidur kokoh', en: 'Heavy bed' },
    'escalon': { es: 'Escalón', pt: 'Degrau', fr: 'Marche', id: 'Anak tangga', en: 'Step' },
    'suelo': { es: 'Suelo', pt: 'Chão', fr: 'Sol', id: 'Lantai', en: 'Floor' },
    'pared': { es: 'Pared', pt: 'Parede', fr: 'Mur', id: 'Dinding', en: 'Wall' },
    'toalla': { es: 'Toalla', pt: 'Toalha', fr: 'Serviette', id: 'Handuk', en: 'Towel' }
  };
  const l = lang || 'es';
  if (Array.isArray(options)) {
    return options.map(opt => {
      const k = String(opt).toLowerCase().trim().replace(/\s+/g, '_');
      return altDict[k]?.[l] || altDict[k]?.['es'] || opt;
    }).join(', ');
  }
  if (typeof options === 'string') {
    const parts = options.split(',').map(p => p.trim());
    return parts.map(p => {
      const k = p.toLowerCase().replace(/\s+/g, '_');
      return altDict[k]?.[l] || altDict[k]?.['es'] || p;
    }).join(', ');
  }
  return options;
};

const ExerciseLibrary = ({ activeTeamId }) => {
  const { t, isEn, language } = useTranslation();
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
          {filteredExercises.map(rawEx => {
            const ex = getLocalizedExercise(rawEx, isEn, language);
            return (
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
                {ex.category === 'prevencion' && (!language || (!language.startsWith('es') && language !== 'es' && language !== 'es-419')) && (
                  <span 
                    className="clinical-fallback-chip" 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      backgroundColor: 'rgba(212, 168, 67, 0.15)',
                      color: 'var(--m11-oro, #D4A843)',
                      border: '1px solid rgba(212, 168, 67, 0.4)',
                      marginLeft: '6px'
                    }}
                  >
                    <Shield size={12} /> {t('clinical.fallbackChip')}
                  </span>
                )}
                <p>{ex.description || (isEn ? 'No description' : 'Sin descripción')}</p>
                <div className="exercise-meta">
                  {ex.durationSeconds > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {ex.durationSeconds}s</span>}
                  {ex.reps > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Repeat size={13} /> {ex.reps} reps</span>}
                  {ex.series > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RotateCw size={13} /> {ex.series} {isEn ? 'sets' : 'series'}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><BarChart2 size={13} /> {isEn ? 'Level' : 'Nivel'} {ex.difficulty || ex.level || 1}</span>
                  {(ex.edad_minima_segura || ex.age_min) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1B3A2D', fontWeight: 600 }}>
                      <Baby size={13} /> {t('exercise.minSafeAge', 'Edad mín.')}: {ex.edad_minima_segura || ex.age_min}
                    </span>
                  )}
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
          ); })}
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

      {viewExercise && (() => {
        const activeViewEx = getLocalizedExercise(viewExercise, isEn, language);
        return (
        <div className="modal-overlay" onClick={() => setViewExercise(null)}>
          <div className="modal-content view-exercise-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeViewEx.name || activeViewEx.titulo}</h2>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className={`badge-cat cat-${activeViewEx.category}`}>
                  {activeViewEx.category === 'prevencion' ? (isEn ? 'Prevention' : 'Prevención') :
                   activeViewEx.category === 'recuperacion' ? (isEn ? 'Recovery' : 'Recuperación') :
                   activeViewEx.category === 'fortalecimiento' ? (isEn ? 'Strengthening' : 'Fortalecimiento') :
                   activeViewEx.category === 'movilidad' ? (isEn ? 'Mobility' : 'Movilidad') :
                   activeViewEx.category}
                </span>
                {activeViewEx.category === 'prevencion' && (!language || (!language.startsWith('es') && language !== 'es' && language !== 'es-419')) && (
                  <span 
                    className="clinical-fallback-chip"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      backgroundColor: 'rgba(212, 168, 67, 0.15)',
                      color: 'var(--m11-oro, #D4A843)',
                      border: '1px solid rgba(212, 168, 67, 0.4)'
                    }}
                  >
                    <Shield size={12} /> {t('clinical.fallbackChip')}
                  </span>
                )}
                {activeViewEx.locale && activeViewEx.locale !== (isEn ? 'en' : 'es') && (
                  <span 
                    className="badge-original-lang" 
                    title={activeViewEx.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                  >
                    {activeViewEx.locale === 'es' ? t('common.originalLanguageEs') : t('common.originalLanguageEn')}
                  </span>
                )}
              </div>
            </div>
            
            {/* 1. ILUSTRACIÓN O PLACEHOLDER HONESTO */}
            <ExerciseIllustrationBlock 
              illustration={activeViewEx.illustration} 
              exerciseName={activeViewEx.name || activeViewEx.titulo} 
            />

            {/* Dosificación atlética */}
            <div className="exercise-meta-detail" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {activeViewEx.durationSeconds > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {activeViewEx.durationSeconds}s</span>}
              {activeViewEx.reps > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Repeat size={14} /> {activeViewEx.reps} reps</span>}
              {activeViewEx.series > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RotateCw size={14} /> {activeViewEx.series} {isEn ? 'sets' : 'series'}</span>}
            </div>

            {/* 2. CUE / DESCRIPCIÓN TÉCNICA */}
            <div className="exercise-description-detail" style={{ marginBottom: '12px' }}>
              {activeViewEx.markdown ? (
                <div className="ia-markdown">
                  {renderMarkdown(activeViewEx.markdown)}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: '#334155' }}>
                  {activeViewEx.description || (isEn ? 'No description' : 'Sin descripción')}
                </p>
              )}
            </div>

            {/* 3. COACHING POINTS */}
            {activeViewEx.coachingPoints && activeViewEx.coachingPoints.length > 0 && (
              <div className="exercise-coaching-points-box" style={{ marginBottom: '14px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#1B3A2D', marginBottom: '6px' }}>
                  <CheckCircle2 size={15} color="#4CAF7D" />
                  <span>{t('exercise.coachingPoints', 'Puntos clave de ejecución')}:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                  {activeViewEx.coachingPoints.map((cp, idx) => (
                    <li key={idx}>{cp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. DISTINCIÓN CLÍNICA: NIVEL (PROGRESIÓN) VS EDAD MÍN. SEGURA (SEGURIDAD) */}
            {(() => {
              const minAgeSafe = activeViewEx.edad_minima_segura ?? activeViewEx.age_min ?? null;
              const reqSupervision = activeViewEx.requiere_supervision_presencial;
              const preferredMaterial = Array.isArray(activeViewEx.material_preferido) && activeViewEx.material_preferido.length > 0
                ? activeViewEx.material_preferido.join(', ')
                : (activeViewEx.material || (Array.isArray(activeViewEx.materials) ? activeViewEx.materials.join(', ') : null));
              const altOptions = activeViewEx.alternativa_casa?.option
                ? formatLocalizedAlt(activeViewEx.alternativa_casa.option, language)
                : null;
              const altNota = activeViewEx.alternativa_casa?.nota?.[language] ||
                              activeViewEx.alternativa_casa?.nota?.es ||
                              activeViewEx.alternativa_casa?.nota?.en || '';
              const safetyNote = activeViewEx.safety_notes?.[language] ||
                                 activeViewEx.safety_notes?.es ||
                                 activeViewEx.safety_notes?.en || '';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  {/* Fila de Badges: Nivel vs Edad vs Supervisión */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                      background: 'rgba(212, 168, 67, 0.15)', color: '#9C6A3B', border: '1px solid rgba(212, 168, 67, 0.3)'
                    }}>
                      <BarChart2 size={14} /> {isEn ? 'Level' : 'Nivel'}: {activeViewEx.level || activeViewEx.difficulty || '1'}
                    </span>

                    {minAgeSafe && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(27, 58, 45, 0.08)', color: '#1B3A2D', border: '1px solid rgba(27, 58, 45, 0.2)'
                      }}>
                        <Baby size={14} /> {t('exercise.minSafeAge', 'Edad mín. segura')}: {minAgeSafe} {isEn ? 'years' : (language === 'pt' ? 'anos' : language === 'fr' ? 'ans' : language === 'id' ? 'tahun' : 'años')}
                      </span>
                    )}

                    {reqSupervision && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(200, 90, 50, 0.12)', color: '#C85A32', border: '1px solid rgba(200, 90, 50, 0.25)'
                      }}>
                        <Eye size={14} /> {t('exercise.supervisionRequired', 'Supervisión presencial requerida')}
                      </span>
                    )}
                  </div>

                  {/* 5. MATERIAL PREFERIDO Y ALTERNATIVA CASERA */}
                  {(preferredMaterial || altOptions) && (
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {preferredMaterial && (
                        <div className="item-material" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1B3A2D' }}>
                          <Dumbbell size={14} color="#1B3A2D" />
                          <span style={{ fontWeight: 700 }}>{t('exercise.preferredMaterial', 'Material preferido')}:</span>
                          <span>{preferredMaterial}</span>
                        </div>
                      )}
                      {altOptions && (
                        <div className="item-alternativa" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#1B3A2D' }}>
                          <Home size={14} color="#4CAF7D" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <span style={{ fontWeight: 700 }}>{t('exercise.homeAlternative', 'Alternativa casera')}:</span>
                            <span style={{ marginLeft: '4px' }}>{altOptions}</span>
                            {altNota && <div style={{ fontStyle: 'italic', color: '#64748B', marginTop: '2px' }}>({altNota})</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. NOTA DE SEGURIDAD CLÍNICA */}
                  {safetyNote && (
                    <div className="item-seguridad" style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(200, 90, 50, 0.08)', border: '1px solid rgba(200, 90, 50, 0.2)', fontSize: '0.78rem', color: '#C85A32', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                      {language && !language.startsWith('es') && (
                        <span 
                          className="clinical-fallback-chip"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(212, 168, 67, 0.15)',
                            color: '#D4A843',
                            border: '1px solid rgba(212, 168, 67, 0.4)'
                          }}
                        >
                          <Shield size={12} /> {t('clinical.fallbackChip')}
                        </span>
                      )}
                      <span>{safetyNote}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button className="btn-primary" onClick={() => setViewExercise(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
};

export default ExerciseLibrary;
