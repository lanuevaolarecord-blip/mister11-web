import React from 'react';
import { PREDEFINED_FORMATIONS } from '../utils/formaciones';
import { useCustomFormations } from '../hooks/useCustomFormations';
import { Edit2, Trash2 } from 'lucide-react';
import './FormationSelector.css';

const FormationSelector = ({ 
  activeFormation, 
  onSelect, 
  onNewFormation, 
  onEditFormation, 
  onDeleteFormation 
}) => {
  const { customFormations } = useCustomFormations();
  
  const predefinedKeys = Object.keys(PREDEFINED_FORMATIONS);

  const handleSelect = (key, isCustom = false, customObj = null) => {
    if (isCustom) {
      onSelect(key, true, customObj);
    } else {
      onSelect(key, false, null);
    }
  };

  return (
    <div className="fs-wrapper">
      <label className="fs-label">FORMACIÓN TÁCTICA</label>
      
      <div className="fs-scroll-container">
        {/* Predefinidas */}
        {predefinedKeys.map((key) => {
          const isActive = activeFormation === key;
          return (
            <div 
              key={`pre-${key}`}
              className={`fs-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(key)}
            >
              {key}
            </div>
          );
        })}

        {/* Personalizadas (CUSTOM) */}
        {customFormations && customFormations.map((f) => {
          const isActive = activeFormation === f.name;
          return (
            <div 
              key={`custom-${f.id}`}
              className={`fs-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(f.name, true, f)}
            >
              <span>{f.name}</span>
              <span className="fs-custom-badge">CUSTOM</span>
              <div className="fs-actions">
                <button
                  type="button"
                  className="fs-action-btn"
                  title="Editar formación"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFormation(f);
                  }}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  type="button"
                  className="fs-action-btn"
                  title="Eliminar formación"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Estás seguro de que deseas eliminar la formación "${f.name}"?`)) {
                      onDeleteFormation(f.id);
                    }
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Botón "+ Nueva formación" */}
        <button 
          type="button"
          className="fs-new-btn" 
          onClick={onNewFormation}
        >
          ➕ NUEVA FORMACIÓN
        </button>
      </div>
    </div>
  );
};

export default FormationSelector;
