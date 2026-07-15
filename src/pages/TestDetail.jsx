import React, { useState } from 'react';
import './Tests.css';

const TestDetail = ({ test, players, onClose, onSave }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(players.length > 0 ? players[0].id : '');
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: parseInt(value, 10)
    });
  };

  const handleSave = () => {
    if (!selectedPlayerId) return;

    let totalScore = 0;
    const dimensiones = {};

    test.questions.forEach(q => {
      const val = answers[q.id] || 0;
      totalScore += val;
      if (!dimensiones[q.dimension]) dimensiones[q.dimension] = 0;
      dimensiones[q.dimension] += val;
    });

    onSave(selectedPlayerId, {
      valor: totalScore,
      dimensiones,
      respuestas: answers
    });
    
    // Reset para el siguiente jugador o cerrar
    setAnswers({});
  };

  const isComplete = test.questions?.every(q => answers[q.id] !== undefined);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', maxHeight: 'calc(100vh - 56px)', overflow: 'hidden', backgroundColor: '#FAF8F5' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span className="t-cat" style={{backgroundColor: 'var(--accent-gold)', color: '#fff'}}>{test.category}</span>
            <h2 style={{margin: 0}}>{test.name}</h2>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-24" style={{ padding: '20px 20px 100px 20px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Seleccionar Jugador a Evaluar</label>
            <select 
              value={selectedPlayerId} 
              onChange={e => {
                setSelectedPlayerId(e.target.value);
                setAnswers({});
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="protocolo-card" style={{ marginBottom: '20px', backgroundColor: '#f8fafc' }}>
            <h3>Instrucciones</h3>
            <p>Responde cada pregunta usando la escala del 1 al 5, donde 1 es "Totalmente en desacuerdo / Nunca" y 5 es "Totalmente de acuerdo / Siempre".</p>
          </div>

          <div className="questions-container">
            {test.questions && test.questions.map((q, index) => (
              <div key={q.id} className="question-card" style={{ marginBottom: '15px', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontWeight: '500', marginBottom: '10px' }}>{index + 1}. {q.text}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map(val => (
                    <label key={val} style={{ 
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', 
                      backgroundColor: answers[q.id] === val ? 'var(--theme-green)' : '#f1f5f9',
                      color: answers[q.id] === val ? '#fff' : '#334155',
                      borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input 
                        type="radio" 
                        name={q.id} 
                        value={val} 
                        checked={answers[q.id] === val}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{ display: 'none' }}
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción integrados en la zona de scroll con padding inferior */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
              {Object.keys(answers).length} de {test.questions?.length} respondidas
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-outline" style={{ flex: 1, minHeight: '44px' }} onClick={onClose}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={!isComplete}
                style={{ flex: 1, minHeight: '44px', opacity: isComplete ? 1 : 0.5, cursor: isComplete ? 'pointer' : 'not-allowed' }}
              >
                Guardar Evaluación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetail;
