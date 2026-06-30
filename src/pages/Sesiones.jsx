import React, { useState, useRef } from 'react';
import { generateSessionPDF } from '../utils/pdfGenerator';
import { useSessions } from '../hooks/useSessions';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan, LIMITS } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { storage, db } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, getDocs, query, orderBy, doc, deleteDoc, writeBatch } from '../firebase/firestore-proxy';
import { useCaptures } from '../hooks/useCaptures';
import { useExercises } from '../hooks/useExercises';
import { downloadJSON, downloadImage } from '../utils/download.js';
import { generateGoogleCalendarUrl, generateICSContent, downloadICSFile } from '../utils/calendarHelper';
import { normalizeText } from '../utils/normalizeInput';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Sesiones.css';

import BlockEditor from '../components/BlockEditor';

const Sesiones = () => {
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { activeTeam } = useTeams();
  const { isPro, limits, isProActive } = usePlan();
  const { sessions, addSession, updateSession, removeSession, loading: loadingSessions } = useSessions(activeTeamId);
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const { captures, loading: loadingCaptures, removeCapture } = useCaptures(activeTeamId);
  const { exercises, loading: loadingExercises, removeExercise } = useExercises(activeTeamId);
  const pizarras = (exercises || []).filter(e => e.type === 'pizarra');

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'captures' | 'animations'
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });

  // Custom Confirmation Dialog State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isConfirm: false,
  });

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve();
        },
        isConfirm: false
      });
    });
  };

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm: (res) => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(res);
        },
        isConfirm: true
      });
    });
  };

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit'
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Edit mode state
  const [editData, setEditData] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exportingId, setExportingId] = useState(null);

  const handleExportMP4 = async (anim) => {
    if (!anim.videoUrl) {
      await showAlert("Aviso", "Aún no has guardado el video de esta animación. Por favor, abre la Pizarra y presiona el botón 'EXPORTAR MP4' para generarlo y guardarlo en la nube.");
      return;
    }
    
    try {
      setExportingId(anim.id);
      const response = await fetch(anim.videoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        const { downloadVideo } = await import('../utils/download.js');
        await downloadVideo(base64data, `animacion-${anim.id}.mp4`, 'video/mp4');
        setExportingId(null);
      };
    } catch (err) {
      console.error(err);
      await showAlert("Error", "Error al descargar el video. Intenta de nuevo.");
      setExportingId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setEditData(prev => {
        const oldIndex = prev.blocks.findIndex(b => b.id === active.id);
        const newIndex = prev.blocks.findIndex(b => b.id === over.id);
        return {
          ...prev,
          blocks: arrayMove(prev.blocks, oldIndex, newIndex)
        };
      });
    }
  };

  const categories = ['Todas', 'Técnica', 'Táctica', 'Física', 'Mixta'];
  const [catFilter, setCatFilter] = useState('Todas');

  const filteredSessions = catFilter === 'Todas'
    ? sessions
    : sessions.filter(s => (s.category || s.categoria || '') === catFilter);

  // --- LIST MODE FUNCTIONS ---
  const parseSessionDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const handleAddToGoogleCalendar = (session) => {
    const startDate = parseSessionDateTime(session.date, session.time);
    const durationMin = session.duration || session.duracion || 90;
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const url = generateGoogleCalendarUrl({
      title: `ENTRENAMIENTO: ${session.title || session.titulo || 'Sesión'}`,
      description: `Sesión de entrenamiento. Objetivos: ${session.objectives || ''}. Carga: ${session.intensity || 'Media'}.`,
      location: 'Campo de entrenamiento',
      startDate,
      endDate
    });
    window.open(url, '_blank');
  };

  const handleExportICS = (session) => {
    const startDate = parseSessionDateTime(session.date, session.time);
    const durationMin = session.duration || session.duracion || 90;
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const icsContent = generateICSContent([{
      id: session.id || `session-${Date.now()}`,
      title: `ENTRENAMIENTO: ${session.title || session.titulo || 'Sesión'}`,
      description: `Sesión de entrenamiento. Objetivos: ${session.objectives || ''}. Carga: ${session.intensity || 'Media'}.`,
      location: 'Campo de entrenamiento',
      startDate,
      endDate
    }]);
    downloadICSFile(`entrenamiento_${(session.title || 'sesion').replace(/\s+/g, '_')}.ics`, icsContent);
  };

  const handleExportAllSessionsICS = () => {
    if (sessions.length === 0) return;
    const events = sessions.map(s => {
      const startDate = parseSessionDateTime(s.date, s.time);
      const durationMin = s.duration || s.duracion || 90;
      const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
      return {
        id: s.id,
        title: `ENTRENAMIENTO: ${s.title || s.titulo || 'Sesión'}`,
        description: `Sesión de entrenamiento. Objetivos: ${s.objectives || ''}. Carga: ${s.intensity || 'Media'}.`,
        location: 'Campo de entrenamiento',
        startDate,
        endDate
      };
    });
    const icsContent = generateICSContent(events);
    downloadICSFile(`calendario_entrenamientos_${activeTeam?.nombre?.replace(/\s+/g, '_') || 'equipo'}.ics`, icsContent);
  };

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
      linkedPizarraId: '',
      blocks: [
        { id: Date.now() + Math.random(), name: 'Calentamiento', duration: 15, type: 'Física', description: '' }
      ]
    });
    setViewMode('edit');
  };

  const handleEditSession = (session) => {
    setEditData({ 
      linkedPizarraId: '',
      ...session 
    }); 
    setViewMode('edit');
  };

  const handleDeleteSession = async (id) => {
    const confirmDelete = await showConfirm('Confirmar eliminación', '¿Eliminar esta sesión?');
    if (confirmDelete) {
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
        await showAlert("Error", "Error al eliminar sesión.");
      }
    }
  };

  const handleDeleteCapture = async (capture) => {
    const confirmDelete = await showConfirm('Confirmar eliminación', '¿Eliminar esta captura?');
    if (confirmDelete) {
      try {
        if (capture.storagePath) {
          try {
            const fileRef = ref(storage, capture.storagePath);
            await deleteObject(fileRef);
          } catch (e) {
            console.error("Error al borrar de Storage:", e);
          }
        }
        await removeCapture(capture.id);
        if(selectedCapture?.id === capture.id) setSelectedCapture(null);
      } catch (error) {
        console.error(error);
        await showAlert("Error", "Error al eliminar captura.");
      }
    }
  };

  const handleDeleteAnimation = async (anim) => {
    const confirmDelete = await showConfirm('Confirmar eliminación', '¿Eliminar esta animación permanentemente?');
    if (confirmDelete) {
      try {
        if (user && activeTeamId) {
          const framesColRef = collection(db, getTeamPath(), 'pizarras', anim.id, 'frames');
          const snap = await getDocs(framesColRef);
          
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
              batch.delete(d.ref);
            });
            await batch.commit();
          }
          
          const pizarraDocRef = doc(db, getTeamPath(), 'pizarras', anim.id);
          await deleteDoc(pizarraDocRef);

          // Clear local storage reference to prevent Pizarra from recreating it
          const lsKey = `mister11_last_pizarra_${activeTeamId}`;
          if (localStorage.getItem(lsKey) === anim.id) {
            localStorage.removeItem(lsKey);
          }
        }

        await removeExercise(anim.id);
        if (selectedAnimation?.id === anim.id) setSelectedAnimation(null);
      } catch (error) {
        console.error("Error eliminando animación: ", error);
        await showAlert("Error", "Error al eliminar animación.");
      }
    }
  };

  // --- EDIT MODE FUNCTIONS ---
  const handleSaveSession = async () => {
    if (!(editData.title || '').trim()) {
      await showAlert('Validación', 'El título es obligatorio');
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
      await showAlert("Error", "Error al guardar sesión.");
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

  const handleDuplicateBlock = (block) => {
    const duplicate = { ...block, id: Date.now() + Math.random(), name: `${block.name} (copia)` };
    setEditData(prev => {
      const idx = prev.blocks.findIndex(b => b.id === block.id);
      const newBlocks = [...prev.blocks];
      newBlocks.splice(idx + 1, 0, duplicate);
      return { ...prev, blocks: newBlocks };
    });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !activeTeamId) return;
    
    if (file.type !== 'application/pdf') {
      await showAlert("Validación", "Solo se permiten archivos PDF.");
      return;
    }

    setIsSaving(true);
    const sessionId = editData.id || `temp_${Date.now()}`;
    const storagePath = `sessions/${getTeamPath()}/${sessionId}/${file.name}`;
    const fileRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      async (error) => {
        console.error("Error uploading file:", error);
        await showAlert("Error", "Error al subir el archivo. Revisa tu conexión.");
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

  if (loadingSessions || loadingPlayers || loadingCaptures || loadingExercises) {
    return (
      <div className="page-wrapper" style={{ padding: '24px' }}>
        <header className="page-header">
          <div className="skeleton-line" style={{ width: '180px', height: '32px', marginBottom: '12px' }}></div>
          <div className="skeleton-line" style={{ width: '280px', height: '18px' }}></div>
        </header>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <div key={n} className="skeleton-line" style={{ width: '50px', height: '60px', borderRadius: '8px' }}></div>
          ))}
        </div>
        <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton-card" style={{ height: '220px', borderRadius: '16px' }}></div>
          ))}
        </div>
      </div>
    );
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
                <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} onBlur={e => setEditData(prev => ({...prev, title: normalizeText(e.target.value)}))} placeholder="Ej. Activación y Rondo..." />
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
                <input type="text" value={editData.materials || ''} onChange={e => setEditData({...editData, materials: e.target.value})} onBlur={e => setEditData(prev => ({...prev, materials: normalizeText(e.target.value)}))} placeholder="Ej. 10 balones, 15 petos (rojos/azules), 20 conos" />
              </div>
              <div className="form-group full" style={{marginTop: '16px'}}>
                <label>🎬 Vincular Animación / Pizarra Táctica</label>
                <select 
                  value={editData.linkedPizarraId || ''} 
                  onChange={e => setEditData({...editData, linkedPizarraId: e.target.value})}
                  className="theme-select-mister11"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    fontSize: '14px',
                    outline: 'none',
                    marginTop: '4px'
                  }}
                >
                  <option value="">Ninguna animación vinculada</option>
                  {pizarras.map(piz => (
                    <option key={piz.id} value={piz.id}>{piz.title || 'Sin Título'}</option>
                  ))}
                </select>
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
                  <div style={{width: `${uploadProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease'}}></div>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={editData.blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {editData.blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id}
                        block={block}
                        index={index}
                        handleUpdateBlock={handleUpdateBlock}
                        handleDeleteBlock={handleDeleteBlock}
                        handleDuplicateBlock={handleDuplicateBlock}
                        teamId={activeTeam?.id}
                        sessionId={editData?.id}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Entrenamiento</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className={`tab-switcher ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>SESIONES</button>
            <button className={`tab-switcher ${activeTab === 'captures' ? 'active' : ''}`} onClick={() => setActiveTab('captures')}>CAPTURAS</button>
            <button className={`tab-switcher ${activeTab === 'animations' ? 'active' : ''}`} onClick={() => setActiveTab('animations')}>ANIMACIONES</button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 8px' }} />
            {activeTab === 'sessions' && sessions.length > 0 && (
              <button 
                className="btn-outline-gold" 
                onClick={handleExportAllSessionsICS}
                style={{ padding: '8px 16px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 'bold' }}
              >
                📥 Exportar ICS
              </button>
            )}
            <button className="btn-primary-new" onClick={handleCreateNew}>+ Nueva Sesión</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
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
                <div key={i} className={`chip-gold ${isToday ? 'active' : ''}`} style={{ cursor: 'pointer', background: isToday ? 'var(--accent-gold)' : 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '12px', opacity: isToday ? 1 : 0.6 }}>{day}</span>
                  <strong style={{ fontSize: '16px' }}>{date.getDate()}</strong>
                </div>
              );
            });
          })()}
        </div>

        {activeTab === 'sessions' && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`chip ${catFilter === cat ? 'active' : ''}`}
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
          <div className="grid-3-cols">
            {filteredSessions.map(session => {
              const title      = session.title    || session.titulo    || 'Sin título';
              const time       = session.time     || session.hora      || '--:--';
              const duration   = session.duration || session.duracion  || 0;
              const category   = session.category || session.categoria || 'General';
              const intensity  = session.intensity|| session.intensidad|| 'Media';
              const blocks     = session.blocks   || session.bloques   || [];
              const linkedPiz = session.linkedPizarraId ? pizarras.find(p => p.id === session.linkedPizarraId) : null;
              const firstBlockWithImg = blocks.find(b => b.imagenProtocolo);
              const fallbackImage = firstBlockWithImg ? firstBlockWithImg.imagenProtocolo : null;
              
              return (
                <div key={session.id} className="card-base" style={{ padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }} onClick={() => setSelectedSession(session)}>
                  <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>{time}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{duration} min</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '18px' }}>⋮</div>
                  </div>
                  
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{title}</h3>
                    <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                      <div style={{ flex: 1, background: 'var(--bg-app)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative', minHeight: '130px' }}>
                        {linkedPiz && linkedPiz.thumbnail ? (
                          <img src={linkedPiz.thumbnail} alt="Diagrama" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : fallbackImage ? (
                          <img src={fallbackImage} alt="Diagrama de Bloque" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            Sin diagrama
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '110px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>{category}</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>{intensity}</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>{blocks.length} Bloques</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && (
              <div className="empty-state-list">No hay sesiones en esta categoría.</div>
            )}
          </div>

          {/* SESSION PREVIEW MODAL */}
          {selectedSession && (
            <div className="modal-overlay-pdf" onClick={() => setSelectedSession(null)}>
              <div className="session-preview-modal" onClick={e => e.stopPropagation()}>
                <div className="preview-content">
                  <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2>{selectedSession.title || selectedSession.titulo || 'Sin título'}</h2>
                      <span className="date-full">
                        {selectedSession.date || selectedSession.fecha || ''} · {selectedSession.time || selectedSession.hora || ''}
                      </span>
                    </div>
                    <button className="btn-close-pdf" style={{ color: 'var(--text-primary)', marginTop: '-10px', marginRight: '-10px' }} onClick={() => setSelectedSession(null)}>✕</button>
                  </div>
                <div className="preview-stats">
                  <div className="p-stat"><strong>{selectedSession.duration || selectedSession.duracion || 0}</strong><span>MIN</span></div>
                  <div className="p-stat"><strong>{(selectedSession.blocks || selectedSession.bloques || []).length}</strong><span>BLOQUES</span></div>
                  <div className="p-stat"><strong>{selectedSession.intensity || selectedSession.intensidad || 'Media'}</strong><span>CARGA</span></div>
                </div>
                
                <div className="preview-files">
                  {(() => {
                    const linkedPiz = selectedSession.linkedPizarraId ? pizarras.find(p => p.id === selectedSession.linkedPizarraId) : null;
                    const fallbackImg = (selectedSession.blocks || selectedSession.bloques || []).find(b => b.imagenProtocolo)?.imagenProtocolo;
                    const diagramUrl = (linkedPiz && linkedPiz.thumbnail) || fallbackImg;
                    if (!diagramUrl) return null;
                    return (
                      <div className="protocolo-card" style={{marginTop: '0', marginBottom: '15px', padding: '8px', display: 'flex', justifyContent: 'center', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden'}}>
                        <img src={diagramUrl} alt="Diagrama Principal" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      </div>
                    );
                  })()}
                  {selectedSession.objectives && (
                    <div className="protocolo-card" style={{marginTop: '0', marginBottom: '15px'}}>
                      <h4>Objetivos</h4>
                      <p style={{fontSize: '0.9rem', color: 'inherit'}}>{selectedSession.objectives}</p>
                    </div>
                  )}
                  {selectedSession.linkedPizarraId && (() => {
                    const linkedPiz = pizarras.find(p => p.id === selectedSession.linkedPizarraId);
                    if (!linkedPiz) return null;
                    return (
                      <div className="protocolo-card" style={{marginTop: '15px', marginBottom: '15px', padding: '15px', border: '1.5px solid #2d4a2d', borderRadius: '12px', background: '#0f1a0f'}}>
                        <h4 style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase'}}>
                          🎬 Animación Vinculada
                        </h4>
                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                          {linkedPiz.thumbnail ? (
                            <img 
                              src={linkedPiz.thumbnail} 
                              alt="Miniatura Pizarra" 
                              style={{width: '90px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}} 
                            />
                          ) : (
                            <div style={{width: '90px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '8px', color: '#888', fontSize: '10px'}}>
                              Pizarra
                            </div>
                          )}
                          <div style={{flex: 1, minWidth: 0}}>
                            <div style={{fontWeight: '700', fontSize: '13px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{linkedPiz.title || 'Animación'}</div>
                            <div style={{fontSize: '11px', color: '#888', marginTop: '4px'}}>
                              {linkedPiz.framesCount || 0} Frames · Animación táctica
                            </div>
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: '10px', marginTop: '12px'}}>
                          <button 
                            className="btn-primary" 
                            style={{flex: 1, padding: '8px 12px', fontSize: '12px', minHeight: '36px'}}
                            onClick={() => {
                              window.location.href = `/pizarra?id=${linkedPiz.id}`;
                            }}
                          >
                            👁 VER ANIMACIÓN
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
                      if (!isProActive) {
                        setUpgradeModal({ open: true, message: 'La exportación de sesiones a PDF es una función PRO. Sube de nivel para usarla.' });
                        return;
                      }
                      setIsGeneratingPDF(true);
                      setTimeout(async () => {
                        try {
                          await generateSessionPDF(selectedSession, activeTeam, pizarras, captures, players);
                        } catch(err) {
                          console.error(err);
                          await showAlert("Error", "Error al generar el PDF");
                        } finally {
                          setIsGeneratingPDF(false);
                        }
                      }, 150);
                    }}
                  >
                    {isGeneratingPDF ? '⏳ Generando informe...' : '📄 Exportar a PDF'}
                  </button>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button 
                      className="btn-outline" 
                      style={{ flex: 1, backgroundColor: '#1B3A2D', color: 'white', border: 'none', minHeight: '44px', fontWeight: 'bold' }} 
                      onClick={() => handleAddToGoogleCalendar(selectedSession)}
                    >
                      📅 Google Cal
                    </button>
                    <button 
                      className="btn-outline" 
                      style={{ flex: 1, backgroundColor: '#4CAF7D', color: 'white', border: 'none', minHeight: '44px', fontWeight: 'bold' }} 
                      onClick={() => handleExportICS(selectedSession)}
                    >
                      📥 ICS
                    </button>
                  </div>
                  <button className="btn-outline-gold full-width" style={{marginBottom: '10px'}} onClick={() => handleEditSession(selectedSession)}>✏️ Editar Sesión</button>
                  <button className="btn-text-error full-width" onClick={() => handleDeleteSession(selectedSession.id)}>Eliminar Sesión</button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      ) : activeTab === 'captures' ? (
        <div className="captures-grid">
          {captures.length === 0 ? (
            <div className="empty-state-full">
              <div className="empty-icon">🎨</div>
              <h3>No hay capturas de pizarra</h3>
              <p>Las capturas que guardes en la Pizarra Táctica aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            captures.map(cap => (
              <div key={cap.id} className="capture-card" onClick={() => setSelectedCapture(cap)}>
                <div className="capture-image-wrapper">
                  <img src={cap.thumbnail || cap.url} alt="Pizarra" loading="lazy" />
                  <div className="capture-overlay">
                    <span>👁 Ver</span>
                  </div>
                </div>
                <div className="capture-info">
                  <span className="capture-name">{cap.title || cap.name || 'Captura Táctica'}</span>
                  <span className="capture-date">
                    {cap.timestamp?.toDate ? cap.timestamp.toDate().toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="captures-grid">
          {pizarras.length === 0 ? (
            <div className="empty-state-full">
              <div className="empty-icon">🎬</div>
              <h3>No hay animaciones de pizarra</h3>
              <p>Crea animaciones multi-frame en la Pizarra Táctica para exportarlas o vincularlas a tus sesiones.</p>
            </div>
          ) : (
            pizarras.map(piz => (
              <div key={piz.id} className="capture-card" onClick={() => setSelectedAnimation(piz)}>
                <div className="capture-image-wrapper">
                  {piz.thumbnail ? (
                    <img src={piz.thumbnail} alt="Animación" loading="lazy" style={{objectFit: 'cover'}} />
                  ) : (
                    <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', fontSize: '14px', fontWeight: 'bold'}}>🎬 Pizarra</div>
                  )}
                  <div className="capture-overlay">
                    <span>👁 Ver Detalles</span>
                  </div>
                </div>
                <div className="capture-info">
                  <span className="capture-name">{piz.title || 'Animación Táctica'}</span>
                  <span className="capture-date">
                    {piz.framesCount || 0} Frames · {piz.timestamp?.toDate ? piz.timestamp.toDate().toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL VISTA CAPTURA */}
      {selectedCapture && (
        <div className="modal-overlay-capture" onClick={() => setSelectedCapture(null)}>
          <div className="modal-content-capture" onClick={e => e.stopPropagation()}>
            <div className="modal-header-capture">
              <h3>{selectedCapture.title || selectedCapture.name || 'Captura Táctica'}</h3>
              <button className="btn-close-pdf" onClick={() => setSelectedCapture(null)}>✕</button>
            </div>
            <div className="modal-body-capture">
              <img src={selectedCapture.url || selectedCapture.thumbnail} alt="Pizarra" />
              <div className="capture-actions-float">
                 <button className="btn-primary" onClick={() => {
                   downloadImage(selectedCapture.url || selectedCapture.thumbnail, "mister11_pizarra.png");
                 }}>DESCARGAR</button>
                 <button className="btn-text-error" onClick={() => handleDeleteCapture(selectedCapture)} style={{marginLeft: '10px'}}>ELIMINAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESCARGANDO MP4 */}
      {exportingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.92)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{zIndex: 2, textAlign: 'center', color: 'white', padding: '20px', borderRadius: '12px', background: '#1A2E1A', border: '1px solid #4CAF7D'}}>
            <h2 style={{margin: '0 0 10px 0', fontSize: '1.5rem'}}>🎬 Descargando Video MP4...</h2>
            <p style={{margin: 0, color: '#ccc'}}>Por favor espera un momento.</p>
            <div style={{marginTop: '20px', width: '40px', height: '40px', border: '4px solid rgba(76,175,125,0.3)', borderTop: '4px solid #4CAF7D', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {/* MODAL VISTA ANIMACIÓN */}
      {selectedAnimation && (
        <div className="modal-overlay-capture" onClick={() => setSelectedAnimation(null)}>
          <div className="modal-content-capture" onClick={e => e.stopPropagation()}>
            <div className="modal-header-capture">
              <h3>{selectedAnimation.title || 'Animación Táctica'}</h3>
              <button className="btn-close-pdf" onClick={() => setSelectedAnimation(null)}>✕</button>
            </div>
            <div className="modal-body-capture" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {selectedAnimation.thumbnail ? (
                <img src={selectedAnimation.thumbnail} alt="Animación" style={{ maxHeight: '350px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' }}>🎬 Animación sin miniatura</div>
              )}
              <div style={{ margin: '15px 0', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
                <p><strong>Total de Frames:</strong> {selectedAnimation.framesCount || 0}</p>
                <p>La animación se exportará directamente en formato MP4 (Video).</p>
              </div>
              <div className="capture-actions-float" style={{ display: 'flex', gap: '10px', justifyContent: 'center', position: 'static', marginTop: '10px' }}>
                 <button className="btn-primary" onClick={() => handleExportMP4(selectedAnimation)}>🎬 EXPORTAR MP4</button>
                 <button className="btn-text-error" onClick={() => handleDeleteAnimation(selectedAnimation)}>ELIMINAR</button>
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

      {/* Custom Dialog Modal (Glassmorphism Premium) */}
      {modalConfig.isOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-card">
            <h3 className="custom-modal-title">{modalConfig.title}</h3>
            <p className="custom-modal-message">{modalConfig.message}</p>
            <div className="custom-modal-actions">
              {modalConfig.isConfirm && (
                <button 
                  className="btn-modal-cancel" 
                  onClick={() => modalConfig.onConfirm(false)}
                >
                  CANCELAR
                </button>
              )}
              <button 
                className="btn-modal-confirm" 
                onClick={() => modalConfig.onConfirm(true)}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sesiones;
