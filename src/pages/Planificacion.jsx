import React, { useState, useMemo } from 'react';
import { generatePlanificacionPDF } from '../utils/pdfGenerator';
import './Planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const MICRO_TYPES = ['Ajuste', 'Carga', 'Choque', 'Aproximación', 'Competición', 'Recuperación'];
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// --- MOCK DATA BASED ON 'MACRO jhojan' ---
const initialMacroData = {
  startDate: '2025-09-01',
  endDate: '2026-06-15',
  category: 'Alevín - Infantil',
  objective: 'Adaptar a los niños en la práctica del fútbol, mediante trabajos psicomotrices y técnico-tácticos.',
  trainer: 'Míster',
  sessionDuration: 90,
  trainingDays: [0, 2, 4], // Mon, Wed, Fri by default
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
  const [guideOpen, setGuideOpen] = useState(false);

  // Editable Grid Handlers
  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Training days toggle
  const toggleDay = (idx) => {
    setMacroInfo(prev => {
      const days = prev.trainingDays.includes(idx)
        ? prev.trainingDays.filter(d => d !== idx)
        : [...prev.trainingDays, idx];
      return { ...prev, trainingDays: days };
    });
  };

  // Auto volume calculation based on days × duration
  const weeklyVolume = macroInfo.trainingDays.length * (Number(macroInfo.sessionDuration) || 0);
  const calculateTotalVolume = () => {
    // Total = weeks * weekly volume (40 weeks)
    return weeklyVolume * 40;
  };

  // Compute current mesocycle based on today's date vs macrocycle start
  const currentMeso = useMemo(() => {
    const today = new Date();
    const start = new Date(macroInfo.startDate);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.max(0, Math.floor(diffDays / 7));
    const mesoNumber = Math.floor(currentWeek / 4) + 1;
    const mesoStartWeek = (mesoNumber - 1) * 4;
    const mesoStart = new Date(start);
    mesoStart.setDate(mesoStart.getDate() + mesoStartWeek * 7);
    const mesoEnd = new Date(mesoStart);
    mesoEnd.setDate(mesoEnd.getDate() + 27); // 4 weeks
    const daysLeft = Math.max(0, Math.floor((mesoEnd - today) / (1000 * 60 * 60 * 24)));
    const mesoMicros = microcycles.filter(m => m.mesoId === mesoNumber);
    const avgPhysical = mesoMicros.length ? Math.round(mesoMicros.reduce((a, b) => a + Number(b.physical), 0) / mesoMicros.length) : 0;
    const avgTechnical = mesoMicros.length ? Math.round(mesoMicros.reduce((a, b) => a + Number(b.technical), 0) / mesoMicros.length) : 0;
    const avgTactical = mesoMicros.length ? Math.round(mesoMicros.reduce((a, b) => a + Number(b.tactical), 0) / mesoMicros.length) : 0;
    const plannedSessions = mesoMicros.reduce((a, b) => a + Number(b.sessions), 0);
    const period = mesoMicros[0]?.period || 'Competitivo';
    return {
      number: mesoNumber,
      startDate: mesoStart.toLocaleDateString(),
      endDate: mesoEnd.toLocaleDateString(),
      daysLeft,
      physical: avgPhysical,
      technical: avgTechnical,
      tactical: avgTactical,
      plannedSessions,
      completedSessions: Math.min(3, Math.floor((4 - daysLeft / 7) * macroInfo.trainingDays.length)),
      period,
      type: mesoMicros[0]?.type || 'Competición',
    };
  }, [microcycles, macroInfo.startDate, macroInfo.trainingDays]);

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
            <button className="btn-outline" onClick={() => generatePlanificacionPDF(macroInfo, microcycles)}>Exportar PDF</button>
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

              {/* MEJORA 2 — Días y duración de entrenamiento */}
              <div className="training-schedule-config">
                <div className="schedule-row">
                  <div className="form-group-macro">
                    <label>Duración por Sesión (min)</label>
                    <input
                      type="number"
                      min="30" max="180" step="15"
                      value={macroInfo.sessionDuration}
                      onChange={e => setMacroInfo({...macroInfo, sessionDuration: Number(e.target.value)})}
                      className="duration-input"
                    />
                  </div>
                  <div className="weekly-volume-badge">
                    <span className="wv-label">Volumen Semanal</span>
                    <span className="wv-value">{weeklyVolume} min</span>
                  </div>
                </div>
                <div className="form-group-macro">
                  <label>Días de Entrenamiento</label>
                  <div className="days-selector">
                    {DAYS_LABELS.map((day, idx) => (
                      <button
                        key={idx}
                        className={`day-pill ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`}
                        onClick={() => toggleDay(idx)}
                        type="button"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group-macro full-width-macro" style={{marginTop: '12px'}}>
                <label>Objetivo General de la Temporada</label>
                <textarea value={macroInfo.objective} onChange={e => setMacroInfo({...macroInfo, objective: e.target.value})} />
              </div>
            </div>

            {/* MEJORA 1 — Mesociclo en Curso */}
            <div className="meso-en-curso">
              <div className="meso-header-row">
                <div>
                  <span className="meso-badge">MESOCICLO {currentMeso.number}</span>
                  <span className="meso-period-tag">{currentMeso.period}</span>
                </div>
                <div className="meso-countdown">
                  <span className="countdown-num">{currentMeso.daysLeft}</span>
                  <span className="countdown-label">días restantes</span>
                </div>
              </div>
              <div className="meso-info-grid">
                <div className="meso-stat">
                  <span className="ms-label">Inicio</span>
                  <span className="ms-value">{currentMeso.startDate}</span>
                </div>
                <div className="meso-stat">
                  <span className="ms-label">Fin</span>
                  <span className="ms-value">{currentMeso.endDate}</span>
                </div>
                <div className="meso-stat">
                  <span className="ms-label">Tipo</span>
                  <span className="ms-value">{currentMeso.type}</span>
                </div>
                <div className="meso-stat">
                  <span className="ms-label">Sesiones</span>
                  <span className="ms-value">
                    <span style={{color:'#4CAF7D'}}>{currentMeso.completedSessions}</span>
                    {' / '}{currentMeso.plannedSessions}
                  </span>
                </div>
              </div>
              <div className="meso-loads">
                <div className="load-bar-item">
                  <span className="lb-label">Físico</span>
                  <div className="lb-track"><div className="lb-fill physical" style={{width:`${currentMeso.physical}%`}} /></div>
                  <span className="lb-pct">{currentMeso.physical}%</span>
                </div>
                <div className="load-bar-item">
                  <span className="lb-label">Técnico</span>
                  <div className="lb-track"><div className="lb-fill technical" style={{width:`${currentMeso.technical}%`}} /></div>
                  <span className="lb-pct">{currentMeso.technical}%</span>
                </div>
                <div className="load-bar-item">
                  <span className="lb-label">Táctico</span>
                  <div className="lb-track"><div className="lb-fill tactical" style={{width:`${currentMeso.tactical}%`}} /></div>
                  <span className="lb-pct">{currentMeso.tactical}%</span>
                </div>
              </div>
            </div>

            {/* MEJORA 3 — Guía de Planificación colapsable */}
            <div className="planning-guide">
              <button className="guide-toggle" onClick={() => setGuideOpen(o => !o)}>
                <span>📖 Guía de Planificación</span>
                <span className="guide-arrow">{guideOpen ? '▲' : '▼'}</span>
              </button>
              {guideOpen && (
                <div className="guide-content">
                  <div className="guide-section">
                    <p className="guide-section-title">Tipos de Microciclo</p>
                    <div className="guide-items">
                      {[
                        { code: 'Car', name: 'Carga', desc: 'Alta intensidad, alto volumen. Desarrollo de capacidades.' },
                        { code: 'Cho', name: 'Choque', desc: 'Máxima intensidad. Bloque de sobrecarga controlada.' },
                        { code: 'Apu', name: 'Aproximación', desc: 'Intensidad media-alta. Transición hacia competición.' },
                        { code: 'Com', name: 'Competición', desc: 'Intensidad orientada al partido. Activación.' },
                        { code: 'Rec', name: 'Recuperación', desc: 'Baja intensidad. Regeneración activa.' },
                        { code: 'Aju', name: 'Ajuste', desc: 'Corrección técnico-táctica. Intensidad moderada.' },
                      ].map(item => (
                        <div key={item.code} className="guide-item">
                          <span className="gi-code">{item.code}</span>
                          <span className="gi-name">{item.name}:</span>
                          <span className="gi-desc">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="guide-section">
                    <p className="guide-section-title">Tipos de Etapa</p>
                    <div className="guide-items">
                      {[
                        { code: 'Gen', name: 'General', desc: 'Desarrollo de capacidades físicas base.' },
                        { code: 'Esp', name: 'Específica', desc: 'Trabajo orientado al modelo de juego.' },
                        { code: 'Com', name: 'Competitiva', desc: 'Mantenimiento y puesta a punto para partidos.' },
                      ].map(item => (
                        <div key={item.code} className="guide-item">
                          <span className="gi-code">{item.code}</span>
                          <span className="gi-name">{item.name}:</span>
                          <span className="gi-desc">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="guide-section">
                    <p className="guide-section-title">Tipos de Período</p>
                    <div className="guide-items">
                      {[
                        { code: 'Pre', name: 'Pretemporada', desc: 'Preparación física y táctica inicial.' },
                        { code: 'Cmp', name: 'Competición', desc: 'Temporada regular con partidos semanales.' },
                        { code: 'Tra', name: 'Transición', desc: 'Recuperación entre temporadas.' },
                      ].map(item => (
                        <div key={item.code} className="guide-item">
                          <span className="gi-code">{item.code}</span>
                          <span className="gi-name">{item.name}:</span>
                          <span className="gi-desc">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
              <p>Volumen Total Temporada: <strong>{calculateTotalVolume()} minutos</strong>
                <span style={{marginLeft:'12px', fontSize:'12px', color:'var(--text-muted)'}}>
                  ({macroInfo.trainingDays.length} días/sem × {macroInfo.sessionDuration} min × 40 semanas)
                </span>
              </p>
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
