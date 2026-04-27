import React, { useState, useRef } from 'react';
import { generateSessionPDF } from '../utils/pdfGenerator';
import { useSessions } from '../hooks/useSessions';
import { usePlayers } from '../hooks/usePlayers';
import './Sesiones.css';

const Sesiones = () => {
  const { sessions, loading: loadingSessions, addSession, updateSession, removeSession } = useSessions();
  const { players, loading: loadingPlayers } = usePlayers();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit'
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit mode state
  const [editData, setEditData] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const fileInputRef = useRef(null);

  const categories = ['Todas', 'Técnica', 'Táctica', 'Física', 'Mixta'];
  const [catFilter, setCatFilter] = useState('Todas');

  const filteredSessions = catFilter === 'Todas' 
    ? sessions 
    : sessions.filter(s => s.category === catFilter);

  // --- LIST MODE FUNCTIONS ---
  const handleCreateNew = () => {
    setEditData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      category: 'Táctica',
      intensity: 'Media',
      duration: 90,
      players: players.map(p => p.id), // All selected by default
      files: [],
      objectives: '',
      materials: 'Balones, petos, conos, setas',
      blocks: [
        { id: Date.now() + Math.random(), name: 'Calentamiento', duration: 15, type: 'Física', description: '' }
      ]
    });
    setViewMode('edit');
  };

  const handleEditSession = (session) => {
    setEditData({ ...session }); 
    setViewMode('edit');
  };

  const handleDeleteSession = async (id) => {
    if(window.confirm('¿Eliminar esta sesión?')) {
      try {
        await removeSession(id);
        if(selectedSession?.id === id) setSelectedSession(null);
      } catch (error) {
        alert("Error al eliminar sesión.");
      }
    }
  };

  // --- EDIT MODE FUNCTIONS ---
  const handleSaveSession = async () => {
    if (!editData.title.trim()) {
      alert('El título es obligatorio');
      return;
    }
    
    setIsSaving(true);
    try {
      if (editData.id) {
        await updateSession(editData.id, editData);
      } else {
        await addSession(editData);
      }
      setViewMode('list');
      setSelectedSession(editData);
    } catch (error) {
      alert("Error al guardar sesión.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = () => {
    setEditData(prev => ({
      ...prev,
      blocks: [...prev.blocks, { id: Date.now() + Math.random(), name: 'Nuevo Ejercicio', duration: 15, type: 'Táctica', description: '' }]
    }));
  };

  const handleUpdateBlock = (blockId, field, value) => {
    setEditData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b)
    }));
  };

  const handleDeleteBlock = (blockId) => {
    setEditData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }));
  };

  const handleTogglePlayer = (playerId) => {
    setEditData(prev => {
      const has = prev.players.includes(playerId);
      return {
        ...prev,
        players: has ? prev.players.filter(id => id !== playerId) : [...prev.players, playerId]
      };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulado: En producción usaríamos Firebase Storage
    const fileUrl = URL.createObjectURL(file);
    
    const newFile = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      url: fileUrl
    };

    setEditData(prev => ({
      ...prev,
      files: [...prev.files, newFile]
    }));
  };

  const handleRemoveFile = (fileId) => {
    setEditData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  if (loadingSessions || loadingPlayers) {
    return <div className="loading-state">Cargando sesiones...</div>;
  }

  // --- RENDER EDIT MODE ---
  if (viewMode === 'edit' && editData) {
    return (
      <div className="sesiones-page">
        <header className="sesiones-header edit-mode-header">
          <div className="header-top">
            <div className="title-group">
              <button className="btn-icon-back" onClick={() => setViewMode('list')}>← Volver</button>
              <h1>{editData.title || 'Nueva Sesión'}</h1>
            </div>
            <div className="header-actions">
              <button className="btn-outline" onClick={() => setViewMode('list')}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveSession} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Sesión'}
              </button>
            </div>
          </div>
        </header>

        <div className="editor-content">
          <div className="editor-left">
            <div className="edit-section">
              <h3>Datos Generales</h3>
              <div className="form-group full">
                <label>Título de la Sesión</label>
                <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Ej. Activación y Rondo..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input type="time" value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Duración (min)</label>
                  <input type="number" min="15" step="5" value={editData.duration} onChange={e => setEditData({...editData, duration: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                    <option value="Técnica">Técnica</option>
                    <option value="Táctica">Táctica</option>
                    <option value="Física">Física</option>
                    <option value="Mixta">Mixta</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Intensidad / Carga</label>
                  <select value={editData.intensity} onChange={e => setEditData({...editData, intensity: e.target.value})}>
                    <option value="Baja">Baja (Recuperación)</option>
                    <option value="Media">Media (Mantenimiento)</option>
                    <option value="Alta">Alta (Adquisición)</option>
                    <option value="Máxima">Máxima (Competición)</option>
                  </select>
                </div>
              </div>
              <div className="form-group full" style={{marginTop: '16px'}}>
                <label>Objetivo Principal</label>
                <textarea value={editData.objectives || ''} onChange={e => setEditData({...editData, objectives: e.target.value})} placeholder="Ej. Mejorar la circulación del balón en zona de creación..." style={{minHeight: '60px'}}></textarea>
              </div>
              <div className="form-group full">
                <label>Material Necesario</label>
                <input type="text" value={editData.materials || ''} onChange={e => setEditData({...editData, materials: e.target.value})} placeholder="Ej. 10 balones, 15 petos (rojos/azules), 20 conos" />
              </div>
            </div>

            <div className="edit-section">
              <div className="section-header-flex">
                <h3>Archivos Adjuntos (PDF)</h3>
                <button className="btn-small-outline" onClick={() => fileInputRef.current?.click()}>+ Subir PDF</button>
                <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".pdf" onChange={handleFileUpload} />
              </div>
              {editData.files.length === 0 ? (
                <div className="empty-files">No hay archivos adjuntos. Sube un PDF con diagramas o apuntes.</div>
              ) : (
                <div className="files-list">
                  {editData.files.map(f => (
                    <div key={f.id} className="file-item">
                      <span className="file-icon">📄</span>
                      <div className="file-info">
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">{f.size}</span>
                      </div>
                      {f.url && <button className="btn-small-outline" style={{marginRight: '10px'}} onClick={() => setPdfPreview(f.url)}>Ver PDF</button>}
                      <button className="btn-del-icon" onClick={() => handleRemoveFile(f.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="edit-section">
              <div className="section-header-flex">
                <h3>Convocatoria ({editData.players.length}/{players.length})</h3>
                <button className="btn-text" onClick={() => setEditData({...editData, players: players.map(p=>p.id)})}>Marcar Todos</button>
              </div>
              <div className="players-checklist">
                {players.map(p => (
                  <label key={p.id} className={`player-check-item ${editData.players.includes(p.id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={editData.players.includes(p.id)} onChange={() => handleTogglePlayer(p.id)} />
                    <span className="p-num">{p.number}</span>
                    <span className="p-name">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="editor-right">
            <div className="blocks-header">
              <h3>Formato de la Sesión</h3>
              <button className="btn-primary-small" onClick={handleAddBlock}>+ Añadir Bloque</button>
            </div>
            
            <div className="blocks-builder-list">
              {editData.blocks.length === 0 ? (
                <div className="empty-blocks">Añade bloques de entrenamiento para organizar tu sesión.</div>
              ) : (
                editData.blocks.map((block, index) => (
                  <div key={block.id} className="block-editor-card">
                    <div className="block-editor-header">
                      <span className="block-number">{index + 1}</span>
                      <input type="text" className="block-title-input" value={block.name || ''} onChange={e => handleUpdateBlock(block.id, 'name', e.target.value)} placeholder="Nombre del ejercicio" />
                      <button className="btn-del-icon" onClick={() => handleDeleteBlock(block.id)}>✕</button>
                    </div>
                    <div className="block-editor-body">
                      <div className="form-row">
                        <div className="form-group mini">
                          <label>Duración (min)</label>
                          <input type="number" min="1" value={block.duration} onChange={e => handleUpdateBlock(block.id, 'duration', Number(e.target.value))} />
                        </div>
                        <div className="form-group mini">
                          <label>Tipo</label>
                          <select value={block.type} onChange={e => handleUpdateBlock(block.id, 'type', e.target.value)}>
                            <option value="Física">Calentamiento/Físico</option>
                            <option value="Técnica">Técnico</option>
                            <option value="Táctica">Táctico</option>
                            <option value="Partido">Partido R.</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group full">
                        <label>Descripción y Reglas</label>
                        <textarea value={block.description || ''} onChange={e => handleUpdateBlock(block.id, 'description', e.target.value)} placeholder="Describe el ejercicio, restricciones, puntuación..."></textarea>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PDF PREVIEW MODAL */}
        {pdfPreview && (
          <div className="modal-overlay-pdf" onClick={() => setPdfPreview(null)}>
            <div className="modal-content-pdf" onClick={e => e.stopPropagation()}>
              <div className="modal-header-pdf">
                <h3>Vista Previa del PDF</h3>
                <button className="btn-close-pdf" onClick={() => setPdfPreview(null)}>✕</button>
              </div>
              <div className="modal-body-pdf">
                <iframe src={pdfPreview} title="PDF Preview" width="100%" height="100%" style={{border: 'none'}}></iframe>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER LIST MODE ---
  return (
    <div className="sesiones-page">
      <header className="sesiones-header">
        <div className="header-top">
          <h1>SESIONES DE ENTRENAMIENTO</h1>
          <div className="header-actions">
            <button className="btn-primary" onClick={handleCreateNew}>+ Nueva Sesión</button>
          </div>
        </div>

        <div className="calendar-strip">
          {(() => {
            const today = new Date();
            const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            
            return ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
              const date = new Date(monday);
              date.setDate(monday.getDate() + i);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`day-chip ${isToday ? 'active today' : ''}`}>
                  <span className="day-name">{day}</span>
                  <span className="day-num">{date.getDate()}</span>
                </div>
              );
            });
          })()}
        </div>

        <div className="filters-row">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-tab ${catFilter === cat ? 'active' : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="sessions-content">
        <div className="sessions-list">
          {filteredSessions.map(session => (
            <div key={session.id} className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`} onClick={() => setSelectedSession(session)}>
              <div className={`session-strip ${session.category.toLowerCase()}`} />
              <div className="session-main">
                <div className="session-date-box">
                  <span className="time">{session.time}</span>
                  <span className="duration">{session.duration} min</span>
                </div>
                <div className="session-details">
                  <h3>{session.title}</h3>
                  <div className="session-badges">
                    <span className="badge category">{session.category}</span>
                    <span className={`badge intensity ${session.intensity.toLowerCase()}`}>{session.intensity}</span>
                    <span className="badge blocks">{session.blocks ? session.blocks.length : 0} bloques</span>
                  </div>
                </div>
                <div className="session-arrow">❯</div>
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className="empty-state-list">No hay sesiones en esta categoría.</div>
          )}
        </div>

        <div className="session-preview-panel">
          {selectedSession ? (
            <div className="preview-content">
              <div className="preview-header">
                <h2>{selectedSession.title}</h2>
                <span className="date-full">{selectedSession.date} · {selectedSession.time}</span>
              </div>
              <div className="preview-stats">
                <div className="p-stat"><strong>{selectedSession.duration}</strong><span>MIN</span></div>
                <div className="p-stat"><strong>{selectedSession.blocks?.length || 0}</strong><span>BLOQUES</span></div>
                <div className="p-stat"><strong>{selectedSession.intensity}</strong><span>CARGA</span></div>
              </div>
              
              <div className="preview-files">
                {selectedSession.files?.length > 0 && (
                  <div className="files-indicator">
                    <span>📎 {selectedSession.files.length} archivos adjuntos</span>
                    {selectedSession.files.map(f => (
                      f.url ? <button key={f.id} className="btn-text-small" onClick={() => setPdfPreview(f.url)}>Ver PDF</button> : null
                    ))}
                  </div>
                )}
              </div>

              <div className="preview-blocks">
                <h4>Estructura de la Sesión</h4>
                {(!selectedSession.blocks || selectedSession.blocks.length === 0) ? (
                  <p className="empty-blocks-text">No hay bloques definidos.</p>
                ) : (
                  selectedSession.blocks.map((b, i) => (
                    <div key={b.id} className="block-item-mini">
                      <span className="b-num">{i + 1}</span>
                      <div className="b-info">
                        <strong>{b.name}</strong>
                        <span>{b.duration} min · {b.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="preview-actions">
                <button className="btn-primary full-width" style={{marginBottom: '10px'}} onClick={() => generateSessionPDF(selectedSession)}>📄 Exportar a PDF</button>
                <button className="btn-outline-gold full-width" onClick={() => handleEditSession(selectedSession)}>✏️ Editar Sesión</button>
                <button className="btn-text-error full-width" onClick={() => handleDeleteSession(selectedSession.id)}>Eliminar Sesión</button>
              </div>
            </div>
          ) : (
            <div className="preview-empty">
              <div className="empty-icon">📋</div>
              <p>Selecciona una sesión para ver los detalles rápidos</p>
            </div>
          )}
        </div>
      </div>

      <button className="fab-session" onClick={handleCreateNew}>+</button>

      {pdfPreview && (
        <div className="modal-overlay-pdf" onClick={() => setPdfPreview(null)}>
          <div className="modal-content-pdf" onClick={e => e.stopPropagation()}>
            <div className="modal-header-pdf">
              <h3>Vista Previa del PDF</h3>
              <button className="btn-close-pdf" onClick={() => setPdfPreview(null)}>✕</button>
            </div>
            <div className="modal-body-pdf">
              <iframe src={pdfPreview} title="PDF Preview" width="100%" height="100%" style={{border: 'none'}}></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sesiones;
