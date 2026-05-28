import React, { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uploadImageFile } from '../utils/uploadImage';
import { auth } from '../firebaseConfig';
import { useCaptures } from '../hooks/useCaptures';

const BlockEditor = ({ block, index, handleUpdateBlock, handleDeleteBlock, teamId, sessionId }) => {
  const fileInputRef = useRef(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const { captures } = useCaptures(teamId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Subiendo diagrama...' } }));
    try {
      const userId = auth.currentUser?.uid;
      // Use teamId and a fallback session string if session isn't saved yet
      const currentSessionId = sessionId || 'temp_session';
      const path = `users/${userId}/teams/${teamId}/sessions/${currentSessionId}/blocks/${block.id}/diagram_${Date.now()}.png`;
      
      const url = await uploadImageFile(file, path);
      handleUpdateBlock(block.id, 'imagenProtocolo', url);
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen.');
    } finally {
      window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: false } }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="block-editor-card">
      <div className="block-editor-header">
        <div 
          className="drag-handle" 
          {...attributes} 
          {...listeners} 
          style={{ cursor: 'grab', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '48px', minHeight: '48px', touchAction: 'none' }}
        >
          <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>☰</span>
        </div>
        <span className="block-number">{index + 1}</span>
        <input 
          type="text" 
          className="block-title-input" 
          value={block.name || ''} 
          onChange={e => handleUpdateBlock(block.id, 'name', e.target.value)} 
          placeholder="Nombre del ejercicio" 
        />
        <button 
          className="btn-del-icon" 
          onClick={() => handleDeleteBlock(block.id)}
          style={{ minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      </div>
      
      <div className="block-editor-body">
        <div className="form-row">
          <div className="form-group mini">
            <label>Duración (min)</label>
            <input 
              type="number" 
              min="1" 
              value={block.duration} 
              onChange={e => handleUpdateBlock(block.id, 'duration', Number(e.target.value))} 
            />
          </div>
          <div className="form-group mini">
            <label>Tipo</label>
            <select 
              value={block.type} 
              onChange={e => handleUpdateBlock(block.id, 'type', e.target.value)}
            >
              <option value="Física">Calentamiento/Físico</option>
              <option value="Técnica">Técnico</option>
              <option value="Táctica">Táctico</option>
              <option value="Partido">Partido R.</option>
            </select>
          </div>
        </div>
        
        <div className="form-group full">
          <label>Descripción y Reglas</label>
          <textarea 
            value={block.description || ''} 
            onChange={e => handleUpdateBlock(block.id, 'description', e.target.value)} 
            placeholder="Describe el ejercicio, restricciones, puntuación..."
          ></textarea>
        </div>

        {/* Módulo de Subir Imagen / Diagrama */}
        <div className="form-group full">
          <label>Imagen / Diagrama del Ejercicio</label>
          {block.imagenProtocolo && (
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <img src={block.imagenProtocolo} alt="Diagrama del ejercicio" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} />
              <button 
                onClick={() => handleUpdateBlock(block.id, 'imagenProtocolo', null)}
                style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>
              📸 Subir Imagen
            </button>
            <button className="btn-outline" onClick={() => setShowCaptureModal(true)}>
              🖼️ Seleccionar Captura
            </button>
          </div>
        </div>
      </div>

      {showCaptureModal && (
        <div className="modal-overlay" onClick={() => setShowCaptureModal(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar Captura</h3>
              <button className="btn-close" onClick={() => setShowCaptureModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {captures && captures.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {captures.map(cap => (
                    <div 
                      key={cap.id} 
                      style={{ cursor: 'pointer', border: '2px solid transparent', borderRadius: '8px', overflow: 'hidden' }}
                      onClick={() => {
                        handleUpdateBlock(block.id, 'imagenProtocolo', cap.url);
                        setShowCaptureModal(false);
                      }}
                    >
                      <img src={cap.url} alt={cap.title} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                      <p style={{ fontSize: '12px', textAlign: 'center', padding: '4px', margin: 0, backgroundColor: '#f1f5f9' }}>
                        {cap.title || 'Captura'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay capturas disponibles.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
