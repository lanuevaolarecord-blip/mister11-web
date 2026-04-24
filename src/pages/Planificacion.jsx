import React, { useState } from 'react';
import './Planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const MICRO_TYPES = ['Ajuste', 'Carga', 'Choque', 'Aproximación', 'Competición', 'Recuperación'];

// --- MOCK DATA BASED ON 'MACRO jhojan' ---
const initialMacroData = {
  startDate: '2025-09-01',
  endDate: '2026-06-15',
  category: 'Alevín - Infantil',
  objective: 'Adaptar a los niños en la práctica del fútbol, mediante trabajos psicomotrices y técnico-tácticos.',
  trainer: 'Míster'
};

// Generate 40 weeks (4 per month roughly)
const generateMicrocycles = () => {
  return Array.from({ length: 40 }, (_, i) => {
    const monthIdx = Math.floor(i / 4);
    const isPrep = i < 8; // First 8 weeks prep
    const isTrans = i > 36; // Last 3 weeks trans
    
    let period = 'Competitivo';
    if(isPrep) period = 'Preparatorio';
    if(isTrans) period = 'Transitorio';

    let etapa = 'Competitiva';
    if(i < 4) etapa = 'General';
    else if(i < 8) etapa = 'Específica';
    else if(isTrans) etapa = 'Transitoria';

    return {
      id: i + 1,
      month: MONTHS[monthIdx],
      period: period,
      etapa: etapa,
      mesoId: Math.floor(i / 4) + 1,
      type: isPrep ? 'Carga' : 'Competición',
      sessions: 3,
      volume: 360,
      physical: isPrep ? 40 : 20,
      technical: 40,
      tactical: isPrep ? 20 : 40,
    };
  });
};

const Planificacion = () => {
  const [activeTab, setActiveTab] = useState('MACROCICLO (PLANTILLA)');
  const [macroInfo, setMacroInfo] = useState(initialMacroData);
  const [microcycles, setMicrocycles] = useState(generateMicrocycles());
  const [assignedSessions, setAssignedSessions] = useState({});

  // Editable Grid Handlers
  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculateTotalVolume = () => microcycles.reduce((acc, curr) => acc + Number(curr.volume || 0), 0);

  const handleAssignSession = (dayIndex) => {
    const sessionName = window.prompt("Introduce el nombre de la sesión a asignar (ej. Sesión Física 1):");
    if (sessionName) {
      setAssignedSessions(prev => ({ ...prev, [dayIndex]: sessionName }));
    }
  };

  const handleRemoveSession = (dayIndex) => {
    setAssignedSessions(prev => {
      const newState = { ...prev };
      delete newState[dayIndex];
      return newState;
    });
  };

  return (
    <div className="planificacion-page">
      <header className="plan-header">
        <div className="header-top">
          <h1>PLANIFICACIÓN ESTRATÉGICA</h1>
          <div className="header-actions">
            <button className="btn-outline">Exportar Excel/PDF</button>
          </div>
        </div>

        <div className="plan-tabs">
          {['MACROCICLO (PLANTILLA)', 'MICROCICLO SEMANAL', 'OBJETIVOS'].map(tab => (
            <button 
              key={tab} 
              className={`plan-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="plan-content">
        {activeTab === 'MACROCICLO (PLANTILLA)' && (
          <div className="macro-view-editable">
            {/* Cabecera del Macro */}
            <div className="macro-general-info">
              <div className="info-grid">
                <div className="form-group-macro">
                  <label>Categoría / Edades</label>
                  <input type="text" value={macroInfo.category} onChange={e => setMacroInfo({...macroInfo, category: e.target.value})} />
                </div>
                <div className="form-group-macro">
                  <label>Inicio Temporada</label>
                  <input type="date" value={macroInfo.startDate} onChange={e => setMacroInfo({...macroInfo, startDate: e.target.value})} />
                </div>
                <div className="form-group-macro">
                  <label>Fin Temporada</label>
                  <input type="date" value={macroInfo.endDate} onChange={e => setMacroInfo({...macroInfo, endDate: e.target.value})} />
                </div>
                <div className="form-group-macro">
                  <label>Entrenador</label>
                  <input type="text" value={macroInfo.trainer} onChange={e => setMacroInfo({...macroInfo, trainer: e.target.value})} />
                </div>
              </div>
              <div className="form-group-macro full-width-macro">
                <label>Objetivo General de la Temporada</label>
                <textarea value={macroInfo.objective} onChange={e => setMacroInfo({...macroInfo, objective: e.target.value})} />
              </div>
            </div>

            {/* Legend for Abbreviations */}
            <div className="macro-legend">
              <strong>Leyenda Tipos de Microciclo:</strong> 
              <span><strong>Aju:</strong> Ajuste</span>
              <span><strong>Car:</strong> Carga</span>
              <span><strong>Cho:</strong> Choque</span>
              <span><strong>Apr:</strong> Aproximación</span>
              <span><strong>Com:</strong> Competición</span>
              <span><strong>Rec:</strong> Recuperación</span>
            </div>

            {/* Grid del Macrociclo estilo Excel */}
            <div className="macro-spreadsheet-container">
              <div className="macro-spreadsheet">
                {/* Row Headers (Sticky Left) */}
                <div className="row-headers">
                  <div className="r-head section-head">MESES</div>
                  <div className="r-head section-head">PERIODOS</div>
                  <div className="r-head section-head">ETAPAS</div>
                  <div className="r-head">Nº MESOCICLO</div>
                  <div className="r-head">Nº MICROCICLO</div>
                  <div className="r-head">TIPO MICRO</div>
                  <div className="r-head">Nº SESIONES</div>
                  <div className="r-head highlight-vol">VOLUMEN (MIN)</div>
                  <div className="r-head sub-head">% FÍSICO</div>
                  <div className="r-head sub-head">% TÉCNICO</div>
                  <div className="r-head sub-head">% TÁCTICO</div>
                </div>

                {/* Data Columns */}
                <div className="data-columns">
                  {microcycles.map((m, idx) => (
                    <div key={m.id} className="data-col">
                      <div className="cell section-cell month-cell">
                        {idx % 4 === 0 ? <input type="text" value={m.month} onChange={e => handleMicroChange(m.id, 'month', e.target.value)} /> : null}
                      </div>
                      <div className={`cell section-cell period-cell ${m.period.toLowerCase()}`}>
                        <input type="text" value={m.period} onChange={e => handleMicroChange(m.id, 'period', e.target.value)} title={m.period} />
                      </div>
                      <div className="cell section-cell etapa-cell">
                        <input type="text" value={m.etapa} onChange={e => handleMicroChange(m.id, 'etapa', e.target.value)} title={m.etapa} />
                      </div>
                      <div className="cell"><input type="number" value={m.mesoId} onChange={e => handleMicroChange(m.id, 'mesoId', e.target.value)} /></div>
                      <div className="cell fw-bold">{m.id}</div>
                      <div className="cell">
                        <select value={m.type} onChange={e => handleMicroChange(m.id, 'type', e.target.value)}>
                          {MICRO_TYPES.map(t => <option key={t} value={t}>{t.substring(0,3)}.</option>)}
                        </select>
                      </div>
                      <div className="cell"><input type="number" value={m.sessions} onChange={e => handleMicroChange(m.id, 'sessions', e.target.value)} /></div>
                      <div className="cell highlight-vol"><input type="number" value={m.volume} onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} /></div>
                      
                      <div className="cell sub-cell"><input type="number" value={m.physical} onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} /></div>
                      <div className="cell sub-cell"><input type="number" value={m.technical} onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} /></div>
                      <div className="cell sub-cell"><input type="number" value={m.tactical} onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="macro-summary">
              <p>Volumen Total Temporada: <strong>{calculateTotalVolume()} minutos</strong></p>
              <button className="btn-primary" onClick={() => alert('Planificación guardada con éxito.')}>Guardar Planificación</button>
            </div>
          </div>
        )}

        {activeTab === 'MICROCICLO SEMANAL' && (
          <div className="micro-view">
            <div className="micro-header">
              <div className="micro-title">
                <h3>Microciclo de Competición (Semana Actual)</h3>
                <span>Basado en el Microciclo Nº 12 del Macrociclo</span>
              </div>
            </div>

            <div className="week-grid">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="day-col">
                  <div className="day-header">
                    <span className="d-name">{day}</span>
                  </div>
                  <div className="day-type-select">
                    <select>
                      <option value="Descanso">Descanso</option>
                      <option value="Entrenamiento">Entrenamiento</option>
                      <option value="Partido">Partido</option>
                      <option value="Recuperación">Recuperación</option>
                    </select>
                  </div>
                  <div className="day-session">
                    {assignedSessions[i] ? (
                      <div className="assigned-session">
                        <span className="s-icon">⚽</span>
                        <span className="s-name">{assignedSessions[i]}</span>
                        <button className="btn-remove-session" onClick={() => handleRemoveSession(i)}>✕</button>
                      </div>
                    ) : (
                      <button className="btn-assign" onClick={() => handleAssignSession(i)}>+ Asignar Sesión</button>
                    )}
                  </div>
                  <div className="day-load-input">
                    <label>Carga (0-100)</label>
                    <input type="number" placeholder="%" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="macro-summary" style={{marginTop: '20px'}}>
              <button className="btn-primary">Guardar Microciclo</button>
            </div>
          </div>
        )}

        {activeTab === 'OBJETIVOS' && (
          <div className="objectives-view">
            <div className="obj-grid">
              <div className="obj-card">
                <h3>Individuales</h3>
                <textarea className="editable-list" defaultValue="- Mejorar perfil no dominante en mediocentros.&#10;- Incremento % pases acertados." rows="6"></textarea>
              </div>
              <div className="obj-card">
                <h3>Equipo</h3>
                <textarea className="editable-list" defaultValue="- Salida de balón 3-2.&#10;- Presión tras pérdida 5 seg." rows="6"></textarea>
              </div>
              <div className="obj-card">
                <h3>Competición</h3>
                <textarea className="editable-list" defaultValue="- Top 3 en liga.&#10;- Menos de 15 goles en contra." rows="6"></textarea>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Planificacion;
