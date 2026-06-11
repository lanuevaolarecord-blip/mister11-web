import React, { useState, useRef, useEffect } from 'react';
import './CustomFormationModal.css';

const INITIAL_POSITIONS = [
  { pos: 'POR', top: '50%', left: '10%' },
  { pos: 'LTD', top: '80%', left: '30%' },
  { pos: 'DEF', top: '60%', left: '25%' },
  { pos: 'DEF', top: '40%', left: '25%' },
  { pos: 'LTI', top: '20%', left: '30%' },
  { pos: 'MCD', top: '50%', left: '48%' },
  { pos: 'MC', top: '75%', left: '60%' },
  { pos: 'MC', top: '25%', left: '60%' },
  { pos: 'MCO', top: '50%', left: '72%' },
  { pos: 'DEL', top: '65%', left: '85%' },
  { pos: 'DEL', top: '35%', left: '85%' }
];

const ROLES = ['POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'EXT', 'DEL'];

const CustomFormationModal = ({ isOpen, onClose, onSave, editFormation = null }) => {
  const [name, setName] = useState('');
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const pitchRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const draggedDistanceRef = useRef(0);

  useEffect(() => {
    if (editFormation) {
      setName(editFormation.name || '');
      setPositions(editFormation.positions || INITIAL_POSITIONS);
    } else {
      setName('');
      setPositions(INITIAL_POSITIONS);
    }
    setSelectedIdx(null);
    setDraggingIdx(null);
  }, [editFormation, isOpen]);

  useEffect(() => {
    const handlePointerUpWindow = () => {
      if (draggingIdx !== null) {
        if (draggedDistanceRef.current < 8) {
          setSelectedIdx(draggingIdx);
        }
        setDraggingIdx(null);
      }
    };
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('touchend', handlePointerUpWindow);
    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('touchend', handlePointerUpWindow);
    };
  }, [draggingIdx]);

  if (!isOpen) return null;

  const handleDragStart = (e, idx) => {
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    setDraggingIdx(idx);
    dragStartPosRef.current = { x: clientX, y: clientY };
    draggedDistanceRef.current = 0;
  };

  const handlePitchPointerMove = (e) => {
    if (draggingIdx === null || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    const dist = Math.hypot(clientX - dragStartPosRef.current.x, clientY - dragStartPosRef.current.y);
    draggedDistanceRef.current = dist;
    
    const xRel = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const yRel = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    
    const updated = [...positions];
    updated[draggingIdx] = {
      ...updated[draggingIdx],
      top: `${yRel.toFixed(1)}%`,
      left: `${xRel.toFixed(1)}%`
    };
    setPositions(updated);
  };

  const handleRoleChange = (role) => {
    if (selectedIdx === null) return;
    const updated = [...positions];
    updated[selectedIdx] = {
      ...updated[selectedIdx],
      pos: role
    };
    setPositions(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor introduce un nombre para la formación.");
      return;
    }
    onSave({
      name: name.trim(),
      positions
    });
  };

  return (
    <div className="cfm-overlay" onClick={onClose}>
      <div className="cfm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cfm-header">
          <h3>{editFormation ? 'EDITAR FORMACIÓN PERSONALIZADA' : 'NUEVA FORMACIÓN PERSONALIZADA'}</h3>
          <button type="button" className="cfm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cfm-body">
          <div className="cfm-form-group">
            <label>Nombre de la Formación</label>
            <input 
              type="text" 
              className="cfm-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej. Mi 4-2-4 de ataque" 
            />
          </div>

          <div className="cfm-layout">
            {/* Campo de Juego Arrastrable */}
            <div className="cfm-pitch-wrapper">
              <div 
                className="cfm-pitch" 
                ref={pitchRef}
                onPointerMove={handlePitchPointerMove}
                onTouchMove={handlePitchPointerMove}
              >
                {/* Líneas tácticas (reutilizadas de Partidos.css) */}
                <div className="pitch-outer-line">
                  <div className="pitch-line pitch-center-line"></div>
                  <div className="pitch-circle pitch-center-circle"></div>
                  <div className="pitch-spot-center"></div>
                  
                  <div className="pitch-penalty-left"></div>
                  <div className="pitch-penalty-right"></div>
                  
                  <div className="pitch-goal-left"></div>
                  <div className="pitch-goal-right"></div>
                  
                  <div className="pitch-spot-left"></div>
                  <div className="pitch-spot-right"></div>
                  
                  <div className="pitch-arc-left"></div>
                  <div className="pitch-arc-right"></div>
                </div>

                {/* Marcadores arrastrables */}
                {positions.map((p, idx) => {
                  const isDragging = draggingIdx === idx;
                  const isSelected = selectedIdx === idx;
                  return (
                    <div 
                      key={idx}
                      className={`cfm-dot ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
                      style={{ top: p.top, left: p.left, zIndex: isDragging ? 100 : isSelected ? 80 : 50 }}
                      onPointerDown={(e) => handleDragStart(e, idx)}
                      onTouchStart={(e) => handleDragStart(e, idx)}
                    >
                      <span className="cfm-dot-num">{idx + 1}</span>
                      <span className="cfm-dot-role">{p.pos}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Lateral: Asignación de Roles del Jugador Seleccionado */}
            <div className="cfm-sidebar">
              {selectedIdx !== null ? (
                <div className="cfm-role-selector">
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '800' }}>
                    JUGADOR #{selectedIdx + 1}
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Selecciona una posición táctica para este marcador:
                  </p>
                  <div className="cfm-role-grid">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`cfm-role-btn ${positions[selectedIdx]?.pos === role ? 'active' : ''}`}
                        onClick={() => handleRoleChange(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-light)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Toca un marcador en el campo para cambiar su posición táctica (por ejemplo, MCD, EXT, DEL).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cfm-footer">
          <button type="button" className="btn-outline-dark" style={{ minHeight: '48px', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold' }} onClick={onClose}>
            CANCELAR
          </button>
          <button type="button" className="btn-primary-dark" style={{ minHeight: '48px', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold' }} onClick={handleSave}>
            GUARDAR FORMACIÓN
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFormationModal;
