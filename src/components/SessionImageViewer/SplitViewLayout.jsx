import React from 'react';
import { Clock, Tag, Layers, CheckSquare, AlertCircle } from 'lucide-react';

export const SplitViewLayout = ({
  exerciseData = {},
  imageElement
}) => {
  const {
    name = 'Ejercicio de Entrenamiento',
    type = 'Táctica',
    duration = 15,
    description = '',
    rules = '',
    objectives = '',
    dimensions = '',
    intensity = 'Media',
    materials = ''
  } = exerciseData;

  return (
    <div className="split-view-container">
      {/* Mitad Izquierda: Imagen / Diagrama Táctico */}
      <div className="split-view-media-pane">
        {imageElement}
      </div>

      {/* Mitad Derecha: Ficha Técnica & Descripción */}
      <div className="split-view-info-pane">
        <div className="info-pane-header">
          <div className="info-tag-row">
            <span className="badge-type"><Tag size={12} /> {type}</span>
            <span className="badge-duration"><Clock size={12} /> {duration} min</span>
            {intensity && <span className="badge-intensity">⚡ Intensidad: {intensity}</span>}
          </div>
          <h2 className="exercise-title">{name}</h2>
        </div>

        <div className="info-pane-scrollable">
          {/* Descripción y Desarrollo */}
          {description && (
            <div className="info-section">
              <h4>Descripción y Tarea</h4>
              <p className="info-text">{description}</p>
            </div>
          )}

          {/* Reglas y Restricciones */}
          {rules && (
            <div className="info-section">
              <h4>Reglas de Provocación</h4>
              <p className="info-text">{rules}</p>
            </div>
          )}

          {/* Objetivos Tácticos */}
          {objectives && (
            <div className="info-section">
              <h4>Objetivos del Ejercicio</h4>
              <p className="info-text">{objectives}</p>
            </div>
          )}

          {/* Dimensiones y Material */}
          {(dimensions || materials) && (
            <div className="info-section grid-two">
              {dimensions && (
                <div>
                  <span className="sub-label">📐 Espacio / Dimensiones:</span>
                  <span className="sub-value">{dimensions}</span>
                </div>
              )}
              {materials && (
                <div>
                  <span className="sub-label">🎒 Material Necesario:</span>
                  <span className="sub-value">{materials}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
