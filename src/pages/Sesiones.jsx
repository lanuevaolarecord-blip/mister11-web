import React, { useState, useRef } from 'react';
import { generateSessionPDF } from '../utils/pdfGenerator';
import { useSessions } from '../hooks/useSessions';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan, LIMITS } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { storage } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useCaptures } from '../hooks/useCaptures';
import './Sesiones.css';

const Sesiones = () => {
  const { user, activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro, limits } = usePlan();
  const { sessions, addSession, updateSession, removeSession, loading: loadingSessions } = useSessions(activeTeamId);
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const { captures, loading: loadingCaptures, removeCapture } = useCaptures(activeTeamId);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'captures'
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit'
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Edit mode state
  const [editData, setEditData] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = ['Todas', 'Técnica', 'Táctica', 'Física', 'Mixta'];
  const [catFilter, setCatFilter] = useState('Todas');

  const filteredSessions = catFilter === 'Todas'
    ? sessions
    : sessions.filter(s => (s.category || s.categoria || '') === catFilter);

  // --- LIST MODE FUNCTIONS ---
  const handleCreateNew = () => {
    if (!isPro && sessions.length >= limits.SESSIONS) {
      setUpgradeModal({ open: true, message: `Has alcanzado el límite de ${limits.SESSIONS} sesiones del plan gratuito.` });
      return;
    }
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
        const sessionToDelete = sessions.find(s => s.id === id);
        // Intentar borrar archivos de Storage si existen
        if (sessionToDelete?.files) {
          for (const file of sessionToDelete.files) {
            if (file.storagePath) {
              try {
                const fileRef = ref(storage, file.storagePath);
                await deleteObject(fileRef);
              } catch (e) { console.error("Error deleting file from storage:", e); }
            }
          }
        }
        await removeSession(id);
        if(selectedSession?.id === id) setSelectedSession(null);
      } catch (error) {
        alert("Error al eliminar sesión.");
      }
    }
  };

  // --- EDIT MODE FUNCTIONS ---
  const handleSaveSession = async () => {
    if (!(editData.title || '').trim()) {
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
    if (!file || !user || !activeTeamId) return;
    
    if (file.type !== 'application/pdf') {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    setIsSaving(true);
    const sessionId = editData.id || `temp_${Date.now()}`;
    const storagePath = `users/${user.uid}/teams/${activeTeamId}/sessions/${sessionId}/${file.name}`;
    const fileRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Error uploading file:", error);
        alert("Error al subir el archivo. Revisa tu conexión.");
        setIsSaving(false);
        setUploadProgress(0);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const newFile = {
          id: Date.now(),
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          type: file.type,
          url: downloadURL,
          storagePath: storagePath
        };

        setEditData(prev => ({
          ...prev,
          files: [...prev.files, newFile]
        }));
        setIsSaving(false);
        setUploadProgress(0);
      }
    );
  };

  const handleRemoveFile = async (fileId) => {
    const fileToRemove = editData.files.find(f => f.id === fileId);
    if (fileToRemove?.storagePath) {
      try {
        const fileRef = ref(storage, fileToRemove.storagePath);
        await deleteObject(fileRef);
      } catch (e) { console.error("Error deleting file:", e); }
    }
    setEditData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  if (loadingSessions || loadingPlayers || loadingCaptures) {
    return <div className="loading-state">Cargando datos de entrenamiento...</div>;
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
                <button className="btn-small-outline" onClick={() => fileInputRef.current?.click()} disabled={uploadProgress > 0 && uploadProgress < 100}>+ Subir PDF</button>
                <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".pdf" onChange={handleFileUpload} />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{width: '100%', height: '8px', background: '#e0e0e0', borderRadius: '4px', margin: '10px 0', overflow: 'hidden'}}>
                  <div style={{width: `${uploadProgress}%`, height: '100%', background: 'var(--m11-green)', transition: 'width 0.3s ease'}}></div>
                </div>
              )}
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
          <h1>ENTRENAMIENTO</h1>
          <div className="header-actions">
            <button className={`tab-switcher ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>SESIONES</button>
            <button className={`tab-switcher ${activeTab === 'captures' ? 'active' : ''}`} onClick={() => setActiveTab('captures')}>PIZARRA</button>
            <div className="topbar-divider-v" />
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

        {activeTab === 'sessions' && (
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
        )}
      </header>

      {activeTab === 'sessions' ? (
        <div className="sessions-content">
          <div className="sessions-list">
            {filteredSessions.map(session => {
              const title      = session.title    || session.titulo    || 'Sin título';
              const time       = session.time     || session.hora      || '--:--';
              const duration   = session.duration || session.duracion  || 0;
              const category   = session.category || session.categoria || 'General';
              const intensity  = session.intensity|| session.intensidad|| 'Media';
              const blocks     = session.blocks   || session.bloques   || [];
              return (
                <div key={session.id} className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`} onClick={() => setSelectedSession(session)}>
                  <div className={`session-strip ${category.toLowerCase()}`} />
                  <div className="session-main">
                    <div className="session-date-box">
                      <span className="time">{time}</span>
                      <span className="duration">{duration} min</span>
                    </div>
                    <div className="session-details">
                      <h3>{title}</h3>
                      <div className="session-badges">
                        <span className="badge category">{category}</span>
                        <span className={`badge intensity ${intensity.toLowerCase()}`}>{intensity}</span>
                        <span className="badge blocks">{blocks.length} bloques</span>
                      </div>
                    </div>
                    <div className="session-arrow">❯</div>
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && (
              <div className="empty-state-list">No hay sesiones en esta categoría.</div>
            )}
          </div>

          <div className="session-preview-panel">
            {selectedSession ? (
              <div className="preview-content">
                <div className="preview-header">
                  <h2>{selectedSession.title || selectedSession.titulo || 'Sin título'}</h2>
                  <span className="date-full">
                    {selectedSession.date || selectedSession.fecha || ''} · {selectedSession.time || selectedSession.hora || ''}
                  </span>
                </div>
                <div className="preview-stats">
                  <div className="p-stat"><strong>{selectedSession.duration || selectedSession.duracion || 0}</strong><span>MIN</span></div>
                  <div className="p-stat"><strong>{(selectedSession.blocks || selectedSession.bloques || []).length}</strong><span>BLOQUES</span></div>
                  <div className="p-stat"><strong>{selectedSession.intensity || selectedSession.intensidad || 'Media'}</strong><span>CARGA</span></div>
                </div>
                
                <div className="preview-files">
                  {selectedSession.objectives && (
                    <div className="protocolo-card" style={{marginTop: '0', marginBottom: '15px'}}>
                      <h4>Objetivos</h4>
                      <p style={{fontSize: '0.9rem', color: 'inherit'}}>{selectedSession.objectives}</p>
                    </div>
                  )}
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
                  {(() => {
                    const blocks = selectedSession.blocks || selectedSession.bloques || [];
                    if (blocks.length === 0) {
                      return <p className="empty-blocks-text">No hay bloques definidos.</p>;
                    }
                    return blocks.map((b, i) => (
                      <div key={b.id || i} className="block-item-mini">
                        <span className="b-num">{i + 1}</span>
                        <div className="b-info">
                          <strong>{b.name || b.nombre || 'Bloque'}</strong>
                          <span>{b.duration || b.duracion || 0} min · {b.type || b.tipo || ''}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                
                <div className="preview-actions">
                  <button 
                    className="btn-primary full-width" 
                    style={{marginBottom: '10px'}} 
                    disabled={isGeneratingPDF}
                    onClick={() => {
                      if (!isPro) {
                        setUpgradeModal({ open: true, message: 'La exportación de sesiones a PDF es una función PRO.' });
                        return;
                      }
                      setIsGeneratingPDF(true);
                      setTimeout(async () => {
                        try {
                          await generateSessionPDF(selectedSession, activeTeam);
                        } catch(err) {
                          console.error(err);
                          alert("Error al generar el PDF");
                        } finally {
                          setIsGeneratingPDF(false);
                        }
                      }, 150);
                    }}
                  >
                    {isGeneratingPDF ? '⏳ Generando informe...' : '📄 Exportar a PDF'}
                  </button>
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
      ) : (
        <div className="captures-grid">
          {captures.map(cap => (
            <div key={cap.id} className="capture-card" onClick={() => setSelectedCapture(cap)}>
              <div className="capture-image-wrapper">
                <img src={cap.url} alt={cap.title} loading="lazy" />
                <div className="capture-overlay">
                  <span className="btn-view-capture">👁 VER</span>
                </div>
              </div>
              <div className="capture-info">
                <h4>{cap.title}</h4>
                <div className="capture-meta-row">
                  <span>{cap.timestamp?.toDate?.().toLocaleString() || 'Reciente'}</span>
                  <div className="capture-actions">
                    <button className="btn-download-small" onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = cap.url;
                      link.download = `pizarra_${cap.id}.png`;
                      link.target = "_blank";
                      link.click();
                    }}>📥</button>
                    <button className="btn-delete-small" onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('¿Eliminar esta captura?')) removeCapture(cap.id);
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {captures.length === 0 && (
            <div className="empty-state-full">
              <div className="empty-icon">🎨</div>
              <h3>No hay capturas de pizarra</h3>
              <p>Las capturas que guardes en la Pizarra Táctica aparecerán aquí automáticamente.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL VISTA CAPTURA */}
      {selectedCapture && (
        <div className="modal-overlay-capture" onClick={() => setSelectedCapture(null)}>
          <div className="modal-content-capture" onClick={e => e.stopPropagation()}>
            <div className="modal-header-capture">
              <h3>{selectedCapture.title}</h3>
              <button className="btn-close-pdf" onClick={() => setSelectedCapture(null)}>✕</button>
            </div>
            <div className="modal-body-capture">
              <img src={selectedCapture.url} alt="Pizarra" />
              <div className="capture-actions-float">
                 <button className="btn-primary" onClick={() => {
                   const link = document.createElement('a');
                   link.href = selectedCapture.url;
                   link.download = "mister11_pizarra.png";
                   link.target = "_blank";
                   link.click();
                 }}>DESCARGAR IMAGEN</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        message={upgradeModal.message}
      />
    </div>
  );
};

export default Sesiones;
