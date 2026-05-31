import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { generatePlanificacionPDF } from '../utils/pdfGenerator';
import { useTheme } from '../context/ThemeContext';
import { Settings, Target, Grid, Hourglass, Calendar, User, Save, FileDown, Plus, FileText } from 'lucide-react';
import './Planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const MICRO_TYPES = ['Ajuste', 'Carga', 'Choque', 'Aproximación', 'Competición', 'Recuperación'];
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_LABELS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// --- MOCK DATA ---
const initialMacroData = {
  startDate: '2025-09-01',
  endDate: '2026-06-15',
  category: 'Alevín - Infantil',
  objective: 'Adaptar a los niños en la práctica del fútbol, mediante trabajos psicomotrices y técnico-tácticos.',
  trainer: 'Míster',
  sessionDuration: 90,
  trainingDays: [0, 2, 4],
};

const generateMicrocycles = () => {
  return Array.from({ length: 40 }, (_, i) => {
    const monthIdx = Math.floor(i / 4);
    const isPrep = i < 8;
    const isTrans = i > 36;
    
    let period = 'Competitivo';
    if(isPrep) period = 'Preparatorio';
    if(isTrans) period = 'Transitorio';

    let etapa = 'Competitiva';
    if(i < 4) etapa = 'General';
    else if(i < 8) etapa = 'Específica';
    else if(isTrans) etapa = 'Transitoria';

    return {
      id: i + 1,
      month: MONTHS[monthIdx] || 'Jun',
      period: period,
      etapa: etapa,
      mesoId: Math.floor(i / 4) + 1,
      type: isPrep ? 'Carga' : 'Competición',
      sessions: 3,
      volume: 270,
      physical: isPrep ? 40 : 20,
      technical: 40,
      tactical: isPrep ? 20 : 40,
    };
  });
};

const Planificacion = () => {
  const { activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  
  const { darkMode } = useTheme();
  const themeClass = darkMode ? 'dark' : 'light';

  const [activeTab, setActiveTab] = useState('MACROCICLO (PLANTILLA)');
  
  const [macroInfo, setMacroInfo] = useState(initialMacroData);
  const [microcycles, setMicrocycles] = useState(generateMicrocycles());
  const [assignedSessions, setAssignedSessions] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingMicro, setSavingMicro] = useState(false);
  const [savingObjectives, setSavingObjectives] = useState(false);
  const [toast, setToast] = useState(null);

  // Meso custom configurations
  const [selectedMesoId, setSelectedMesoId] = useState(1);
  const [mesoConfigs, setMesoConfigs] = useState({});
  const [savingMeso, setSavingMeso] = useState(false);

  // Objectives State
  const [objectives, setObjectives] = useState({
    individual: '- Mejorar perfil no dominante en mediocentros.\n- Incremento % pases acertados.',
    team: '- Salida de balón 3-2.\n- Presión tras pérdida 5 seg.',
    competition: '- Top 3 en liga.\n- Menos de 15 goles en contra.'
  });

  // Controlled state for each day of the week
  const initialWeekDays = Array.from({ length: 7 }, () => ({
    type: 'Descanso',
    load: '',
  }));
  const [weekDays, setWeekDays] = useState(initialWeekDays);

  const updateDayField = (i, field, value) => {
    setWeekDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  };

  // ── LOAD FROM FIRESTORE ON MOUNT ──────────────────────────────────────────
  useEffect(() => {
    const loadConfig = async () => {
      const user = auth.currentUser;
      if (!user || !activeTeamId) return;
      try {
        const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.macroInfo) setMacroInfo(data.macroInfo);
          if (data.microcycles && data.microcycles.length > 0) setMicrocycles(data.microcycles);
          if (data.weekDays && data.weekDays.length === 7) setWeekDays(data.weekDays);
          if (data.assignedSessions) setAssignedSessions(data.assignedSessions);
          if (data.mesoConfigs) setMesoConfigs(data.mesoConfigs);
        }

        const objRef = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'objectives');
        const objSnap = await getDoc(objRef);
        if (objSnap.exists()) {
          setObjectives(objSnap.data());
        }
      } catch (err) {
        console.error('Error al cargar planificación:', err);
      }
    };
    loadConfig();
  }, [activeTeamId]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── SAVE HANDLERS ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
      await setDoc(ref, { macroInfo, microcycles, mesoConfigs, updatedAt: serverTimestamp() }, { merge: true });
      showToast('Planificación guardada ✓');
    } catch (err) {
      showToast('Error al guardar.', 'error');
    } finally {
      setSaving(false);
    }
  }, [macroInfo, microcycles, mesoConfigs, showToast, activeTeamId]);

  const handleSaveMeso = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSavingMeso(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
      await setDoc(ref, { microcycles, mesoConfigs, updatedAt: serverTimestamp() }, { merge: true });
      showToast('Mesociclo guardado correctamente ✓');
    } catch (err) {
      showToast('Error al guardar mesociclo.', 'error');
    } finally {
      setSavingMeso(false);
    }
  }, [microcycles, mesoConfigs, showToast, activeTeamId]);

  const handleSaveMicro = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSavingMicro(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
      await setDoc(ref, { weekDays, assignedSessions, weekDate: new Date().toISOString().split('T')[0], updatedAt: serverTimestamp() }, { merge: true });
      showToast('Microciclo guardado correctamente ✓');
    } catch (err) {
      showToast('Error al guardar microciclo.', 'error');
    } finally {
      setSavingMicro(false);
    }
  }, [weekDays, assignedSessions, showToast, activeTeamId]);

  const handleSaveObjectives = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSavingObjectives(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'objectives');
      await setDoc(ref, { ...objectives, updatedAt: serverTimestamp() });
      showToast('Objetivos guardados ✓');
    } catch (err) {
      showToast('Error al guardar objetivos.', 'error');
    } finally {
      setSavingObjectives(false);
    }
  }, [objectives, showToast, activeTeamId]);

  // ── DATA COMPUTATIONS ─────────────────────────────────────────────────────
  const getMesoDefaultDates = useCallback((mesoId, macroStartDate) => {
    const start = new Date(macroStartDate || '2025-09-01');
    const mesoStartWeek = (Number(mesoId) - 1) * 4;
    const mesoStart = new Date(start);
    mesoStart.setDate(mesoStart.getDate() + mesoStartWeek * 7);
    const mesoEnd = new Date(mesoStart);
    mesoEnd.setDate(mesoEnd.getDate() + 27);
    return { startDate: mesoStart.toISOString().split('T')[0], endDate: mesoEnd.toISOString().split('T')[0] };
  }, []);

  const filteredMesoWeeks = useMemo(() => microcycles.filter(m => Number(m.mesoId) === Number(selectedMesoId)), [microcycles, selectedMesoId]);

  const selectedMesoData = useMemo(() => {
    const defaultDates = getMesoDefaultDates(selectedMesoId, macroInfo.startDate);
    const custom = mesoConfigs[selectedMesoId] || {};
    return {
      startDate: custom.startDate || defaultDates.startDate,
      endDate: custom.endDate || defaultDates.endDate,
      objective: custom.objective || `Trabajo para el Mesociclo ${selectedMesoId}.`
    };
  }, [mesoConfigs, selectedMesoId, macroInfo.startDate, getMesoDefaultDates]);

  const handleMesoConfigChange = (field, value) => {
    setMesoConfigs(prev => ({ ...prev, [selectedMesoId]: { ...selectedMesoData, [field]: value } }));
  };

  const selectedMesoMetrics = useMemo(() => {
    const totalVolume = filteredMesoWeeks.reduce((sum, w) => sum + Number(w.volume || 0), 0);
    const totalSessions = filteredMesoWeeks.reduce((sum, w) => sum + Number(w.sessions || 0), 0);
    const avgPhysical = filteredMesoWeeks.length ? Math.round(filteredMesoWeeks.reduce((sum, w) => sum + Number(w.physical || 0), 0) / filteredMesoWeeks.length) : 0;
    const avgTechnical = filteredMesoWeeks.length ? Math.round(filteredMesoWeeks.reduce((sum, w) => sum + Number(w.technical || 0), 0) / filteredMesoWeeks.length) : 0;
    const avgTactical = filteredMesoWeeks.length ? Math.round(filteredMesoWeeks.reduce((sum, w) => sum + Number(w.tactical || 0), 0) / filteredMesoWeeks.length) : 0;
    
    const totalHours = Math.floor(totalVolume / 60);
    const remainingMins = totalVolume % 60;
    const volumeLabel = totalHours > 0 ? `${totalHours}h ${remainingMins}min (${totalVolume} min)` : `${totalVolume} minutos`;

    return { volumeLabel, totalSessions, avgPhysical, avgTechnical, avgTactical };
  }, [filteredMesoWeeks]);

  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const syncVolumeToAll = useCallback((days, duration) => {
    const vol = days * (Number(duration) || 0);
    setMicrocycles(prev => prev.map(m => ({ ...m, volume: vol, sessions: days })));
  }, []);

  const toggleDay = (idx) => {
    setMacroInfo(prev => {
      const days = prev.trainingDays.includes(idx) ? prev.trainingDays.filter(d => d !== idx) : [...prev.trainingDays, idx];
      syncVolumeToAll(days.length, prev.sessionDuration);
      return { ...prev, trainingDays: days };
    });
  };

  const weeklyVolume = macroInfo.trainingDays.length * (Number(macroInfo.sessionDuration) || 0);
  const totalMinutes = microcycles.reduce((acc, m) => acc + Number(m.volume || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  
  const avgPhysical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.physical || 0), 0) / (microcycles.length || 1));
  const avgTactical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.tactical || 0), 0) / (microcycles.length || 1));
  const avgTechnical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.technical || 0), 0) / (microcycles.length || 1));
  const totalSessionsPlanned = microcycles.reduce((acc, m) => acc + Number(m.sessions || 0), 0);
  const fakeCompletedSessions = Math.floor(totalSessionsPlanned * 0.3);

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
    <div className={`ps-page ${themeClass} planificacion-v2-wrapper`}>
      {toast && (
        <div className={`ps-toast ${toast.type === 'error' ? 'ps-toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER / TABS NAVIGATION */}
      <header className="page-header" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">PLANIFICACIÓN TÁCTICA</h1>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> EXPORTAR PDF
          </button>
        </div>
        
        <div className="ps-tabs-list" style={{display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px'}}>
          {['MACROCICLO (PLANTILLA)', 'MESOCICLO', 'MICROCICLO SEMANAL', 'OBJETIVOS'].map(tab => (
            <button 
              key={tab} 
              className={`chip ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* TAB CONTENT */}
      <div className="ps-tab-content">
        
        {/* --- MACROCICLO TAB --- */}
        {activeTab === 'MACROCICLO (PLANTILLA)' && (
          <div className="ps-macro-tab-layout" style={{ position: 'relative', zIndex: 2 }}>
            <div className="ps-top-cards-v3" style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(300px, 1fr) minmax(300px, 1fr)', gap: '16px', marginBottom: '24px' }}>
              
              {/* Columna 1: Categoría, Duración, Días */}
              <div className="ps-glass-card-v3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 className="ps-v3-label">CATEGORÍA USADES</h3>
                  <div className="ps-v3-input-container">
                    <input type="text" value={macroInfo.category} onChange={e => setMacroInfo({...macroInfo, category: e.target.value})} className="ps-v3-input" />
                    <span className="ps-v3-icon-suffix">▼</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="ps-v3-label">DURACIÓN POR SESIÓN (MIN)</h3>
                    <div className="ps-v3-input-container">
                      <input type="number" defaultValue="90" className="ps-v3-input" />
                    </div>
                  </div>
                  <div className="ps-v3-vol-diario">
                    <span className="vol-title">VOLUMEN DIARIO</span>
                    <span className="vol-value">270 min</span>
                  </div>
                </div>

                <div>
                  <h3 className="ps-v3-label">DÍAS DE ENTRENAMIENTO</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => (
                      <button key={idx} className={`ps-v3-day-btn ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`} onClick={() => toggleDay(idx)}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna 2: Fechas y Entrenador Auxiliar */}
              <div className="ps-glass-card-v3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 className="ps-v3-label">FECHA TEMPORADA</h3>
                  <div className="ps-v3-input-container ps-v3-date-group">
                    <input type="date" value={macroInfo.startDate} onChange={e => setMacroInfo({...macroInfo, startDate: e.target.value})} className="ps-v3-input" />
                    <Calendar size={14} className="ps-v3-date-icon"/>
                  </div>
                </div>
                <div>
                  <h3 className="ps-v3-label">ENTRENADOR</h3>
                  <div className="ps-v3-input-container ps-v3-date-group">
                    <input type="date" value={macroInfo.endDate} onChange={e => setMacroInfo({...macroInfo, endDate: e.target.value})} className="ps-v3-input" />
                    <Calendar size={14} className="ps-v3-date-icon"/>
                  </div>
                </div>
              </div>

              {/* Columna 3: Entrenador y Objetivo */}
              <div className="ps-glass-card-v3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 className="ps-v3-label">ENTRENADOR</h3>
                  <div className="ps-v3-input-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="text" value={macroInfo.trainer} onChange={e => setMacroInfo({...macroInfo, trainer: e.target.value})} className="ps-v3-input" style={{flex: 1}}/>
                    <span className="ps-v3-icon-suffix">▼</span>
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="ps-v3-label">OBJETIVO GENERAL A LA TEMPORADA</h3>
                  <textarea value={macroInfo.objective} onChange={e => setMacroInfo({...macroInfo, objective: e.target.value})} className="ps-v3-textarea" />
                </div>
              </div>

            </div>

            <div className="ps-glass-card" style={{ 
              marginBottom: '24px', 
              border: '1px solid #C4A47A', 
              boxShadow: '0 4px 15px rgba(196, 164, 122, 0.15)',
              background: darkMode ? 'rgba(20, 26, 23, 0.9)' : '#FAF8F5',
              padding: '16px 20px',
              borderRadius: '16px'
            }}>
              {/* Header section with capsules */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: '#8C6F3D', 
                    color: '#FFFFFF', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    MESOCICLO 1
                  </span>
                  <span style={{ 
                    background: darkMode ? 'rgba(76, 175, 125, 0.2)' : '#D1E7DD', 
                    color: darkMode ? '#82D2A7' : '#198754', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    padding: '4px 12px', 
                    borderRadius: '20px'
                  }}>
                    Preparatorio
                  </span>
                </div>
                <span style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#8C6F3D', 
                  fontFamily: 'var(--font-heading)' 
                }}>
                  58
                </span>
              </div>
              
              {/* Timeline bar container (Grey bar) */}
              <div style={{ 
                background: darkMode ? '#1C221F' : '#E6E4DD', 
                borderRadius: '8px', 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                position: 'relative', 
                height: '36px', 
                marginBottom: '20px',
                border: darkMode ? '1px solid #2C3831' : '1px solid rgba(0,0,0,0.05)'
              }}>
                {/* Date tags absolute positioned to match Imagen 2 proportional layout */}
                <div style={{ 
                  background: darkMode ? '#2D3748' : '#FFFFFF', 
                  border: darkMode ? '1px solid #4CAF7D' : '1px solid #CCCCCC',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: darkMode ? '#FFF' : '#333',
                  position: 'absolute',
                  left: '12px'
                }}>
                  1/1/2026
                </div>

                <div style={{ 
                  background: darkMode ? '#2D3748' : '#FFFFFF', 
                  border: darkMode ? '1px solid #4CAF7D' : '1px solid #CCCCCC',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: darkMode ? '#FFF' : '#333',
                  position: 'absolute',
                  left: '32%'
                }}>
                  24/7/2036
                </div>

                <div style={{ 
                  background: darkMode ? '#2D3748' : '#FFFFFF', 
                  border: darkMode ? '1px solid #4CAF7D' : '1px solid #CCCCCC',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: darkMode ? '#FFF' : '#333',
                  position: 'absolute',
                  left: '52%'
                }}>
                  28/7/2026
                </div>

                {/* Right side indicators */}
                <div style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  display: 'flex', 
                  gap: '6px',
                  alignItems: 'center' 
                }}>
                  <span style={{ 
                    background: '#FADBD8', 
                    color: '#78281F', 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    padding: '2px 8px', 
                    borderRadius: '4px' 
                  }}>
                    -11L/13
                  </span>
                  <span style={{ 
                    background: '#D4EFDF', 
                    color: '#196F3D', 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    padding: '2px 8px', 
                    borderRadius: '4px' 
                  }}>
                    -5L/12
                  </span>
                </div>
              </div>

              {/* Three horizontal tracks with colored tracks and circular dials */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Track 1: Fuerza */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    width: '80px', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: darkMode ? '#A3B5AD' : '#111B21' 
                  }}>
                    Fuerza
                  </span>
                  <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                    {/* Background grey track line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: darkMode ? '#222D27' : '#E6E4DD', borderRadius: '2px' }}></div>
                    {/* Active colored line (Red) */}
                    <div style={{ position: 'absolute', left: 0, width: '42%', height: '6px', background: '#B03A2E', borderRadius: '3px', zIndex: 2 }}></div>
                    
                    {/* Circular dial nodes */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '20%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#9C7C38', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFF',
                      transform: 'translateX(-50%)'
                    }}>
                      9
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      left: '42%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#9C7C38', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFF',
                      transform: 'translateX(-50%)'
                    }}>
                      9
                    </div>
                  </div>
                </div>

                {/* Track 2: Velocidad */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    width: '80px', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: darkMode ? '#A3B5AD' : '#111B21' 
                  }}>
                    Velocidad
                  </span>
                  <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                    {/* Background grey track line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: darkMode ? '#222D27' : '#E6E4DD', borderRadius: '2px' }}></div>
                    {/* Active colored line (Blue) */}
                    <div style={{ position: 'absolute', left: 0, width: '65%', height: '6px', background: '#2E86C1', borderRadius: '3px', zIndex: 2 }}></div>
                    
                    {/* Circular dial nodes */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '15%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#1F618D', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFF',
                      transform: 'translateX(-50%)'
                    }}>
                      6
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      left: '35%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#1F618D', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFF',
                      transform: 'translateX(-50%)'
                    }}>
                      6
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      left: '65%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#85C1E9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#111B21',
                      transform: 'translateX(-50%)'
                    }}>
                      0
                    </div>
                  </div>
                </div>

                {/* Track 3: Técnica */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    width: '80px', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: darkMode ? '#A3B5AD' : '#111B21' 
                  }}>
                    Técnica
                  </span>
                  <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                    {/* Background grey track line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: darkMode ? '#222D27' : '#E6E4DD', borderRadius: '2px' }}></div>
                    {/* Active colored line (Green) */}
                    <div style={{ position: 'absolute', left: 0, width: '25%', height: '6px', background: '#27AE60', borderRadius: '3px', zIndex: 2 }}></div>
                    
                    {/* Circular dial nodes */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '25%', 
                      zIndex: 3, 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: '2px solid #111B21', 
                      background: '#A9DFBF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#111B21',
                      transform: 'translateX(-50%)'
                    }}>
                      0
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="ps-matrix-section" style={{ position: 'relative', zIndex: 2, marginBottom: '24px' }}>
              <div className="ps-matrix-wrapper">
                <div className="ps-matrix-table ps-matrix-table-v3">
                  {/* --- LIGHT SECTION --- */}
                  <div className="ps-row ps-row-light ps-row-header-v3">
                    <div className="ps-cell ps-cell-sticky">MESES</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input value={m.month} onChange={e => handleMicroChange(m.id, 'month', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-light ps-row-header-v3">
                    <div className="ps-cell ps-cell-sticky">PERIODOS</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input value={m.period.substring(0,5)} onChange={e => handleMicroChange(m.id, 'period', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-light ps-row-header-v3">
                    <div className="ps-cell ps-cell-sticky">ETAPAS</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input value={m.etapa.substring(0,5)} onChange={e => handleMicroChange(m.id, 'etapa', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-light">
                    <div className="ps-cell ps-cell-sticky" style={{fontWeight: 'bold', background: '#F0F0F0'}}>Nº MICROCICLO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell fw-bold">{m.id}</div>)}
                  </div>
                  <div className="ps-row ps-row-light">
                    <div className="ps-cell ps-cell-sticky" style={{background: '#F8F8F8'}}>TIPO MICRO</div>
                    {microcycles.map(m => (
                      <div key={m.id} className="ps-cell">
                        <select value={m.type} onChange={e => handleMicroChange(m.id, 'type', e.target.value)} style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '11px', outline: 'none', appearance: 'none', textAlign: 'center', fontWeight: 'bold' }}>
                          <option value="Carga">3</option>
                          <option value="Competición">5</option>
                          <option value="Recuperación">1</option>
                          <option value="Ajuste">2</option>
                          <option value="Choque">4</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="ps-row ps-row-light">
                    <div className="ps-cell ps-cell-sticky" style={{fontWeight: 'bold', background: '#F0F0F0'}}>VOLUMEN (MIN)</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell fw-bold"><input type="number" value={m.volume} onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} style={{ fontWeight: 'bold' }} /></div>)}
                  </div>

                  {/* --- DARK SECTION --- */}
                  <div className="ps-row ps-row-dark">
                    <div className="ps-cell ps-cell-sticky">M. FÍSICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell ps-cell-dark-teal"><input type="number" value={m.physical} onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-dark">
                    <div className="ps-cell ps-cell-sticky">M. TÉCNICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell ps-cell-dark-teal-alt"><input type="number" value={m.technical} onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-dark">
                    <div className="ps-cell ps-cell-sticky">M. TÁCTICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell ps-cell-dark-teal"><input type="number" value={m.tactical} onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} /></div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-footer-v3" style={{ position: 'relative', zIndex: 2 }}>
              <div className="ps-footer-left">
                <div className="ps-footer-vol">
                  <span className="ps-footer-vol-label">
                    VOLUMEN TOTAL TEMPORADA
                  </span>
                  <span className="ps-footer-vol-value">
                    180h 0Min <span className="ps-footer-vol-sub">(10800 minutos totales)</span>
                  </span>
                  <span className="ps-footer-vol-days">
                    3 días / sem -- 5 Meses
                  </span>
                </div>
              </div>
              
              <div className="ps-footer-center">
                <span className="ps-footer-center-value">
                  180h 0Min <span className="ps-footer-center-sub">(10800 minutos)</span>
                </span>
                <div className="ps-footer-chart">
                  <span className="ps-footer-chart-label">
                    TEMPORAL LE PROGRESSION
                  </span>
                  <svg width="120" height="40" viewBox="0 0 120 40">
                    <path d="M0 40 L10 30 L20 35 L30 20 L40 25 L50 10 L60 15 L70 5 L80 15 L90 0 L100 10 L110 5 L120 15 L120 40 Z" fill={darkMode ? '#0E1410' : '#1B3A2D'} opacity="0.8" />
                    <path d="M0 40 L10 30 L20 35 L30 20 L40 25 L50 10 L60 15 L70 5 L80 15 L90 0 L100 10 L110 5 L120 15" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="ps-footer-right">
                <button className="ps-btn-guardar-v3" onClick={handleSave} disabled={saving}>
                  {saving ? 'GUARDANDO...' : 'GUARDAR PLANIFICACIÓN'} <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MESOCICLO TAB --- */}
        {activeTab === 'MESOCICLO' && (
          <div className="ps-meso-tab-layout">
            <div className="ps-top-cards">
              <div className="ps-card ps-meso-controls" style={{gridColumn: '1 / -1'}}>
                <div className="ps-card-header">
                  <Calendar size={18} className="ps-icon-cyan" />
                  <h3>SELECCIONAR MESOCICLO</h3>
                </div>
                <select className="ps-select-input mb-3" value={selectedMesoId} onChange={e => setSelectedMesoId(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Mesociclo {i + 1} (Semanas {i * 4 + 1} a {i * 4 + 4})</option>
                  ))}
                </select>
                
                <div className="ps-meso-dates mt-4">
                  <div className="ps-form-group">
                    <label>INICIO MESO</label>
                    <input type="date" value={selectedMesoData.startDate} onChange={e => handleMesoConfigChange('startDate', e.target.value)} className="ps-input" />
                  </div>
                  <div className="ps-form-group">
                    <label>FIN MESO</label>
                    <input type="date" value={selectedMesoData.endDate} onChange={e => handleMesoConfigChange('endDate', e.target.value)} className="ps-input" />
                  </div>
                </div>
                
                <div className="ps-form-group ps-full-w mt-4">
                  <label>OBJETIVOS DEL MESOCICLO</label>
                  <textarea value={selectedMesoData.objective} onChange={e => handleMesoConfigChange('objective', e.target.value)} className="ps-textarea" rows="3"/>
                </div>
              </div>
            </div>

            <div className="ps-matrix-section">
              <div className="ps-card-header mb-3" style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '10px'}}>
                <Grid size={18} className="ps-icon-cyan" />
                <h3 className="ps-matrix-title" style={{margin: 0}}>EDICIÓN DEL MESOCICLO {selectedMesoId}</h3>
              </div>
              <div className="ps-matrix-wrapper">
                <div className="ps-matrix-table">
                  <div className="ps-row ps-row-header">
                    <div className="ps-cell ps-cell-sticky">SEMANA</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell fw-bold text-cyan">S. {m.id}</div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">TIPO MICRO</div>
                    {filteredMesoWeeks.map(m => (
                      <div key={m.id} className="ps-cell">
                        <select value={m.type} onChange={e => handleMicroChange(m.id, 'type', e.target.value)} className={`ps-micro-type bg-${m.type.substring(0,3).toLowerCase()}`}>
                          <option value="Carga">Carga</option><option value="Competición">Comp</option><option value="Recuperación">Rec</option>
                          <option value="Ajuste">Aju</option><option value="Choque">Cho</option><option value="Aproximación">Apr</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">SESIONES</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.sessions} onChange={e => handleMicroChange(m.id, 'sessions', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">VOLUMEN</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell text-gold fw-bold"><input type="number" value={m.volume} onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% FÍSICO</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.physical} onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% TÉCNICO</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.technical} onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% TÁCTICO</div>
                    {filteredMesoWeeks.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.tactical} onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} /></div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-footer">
              <div className="ps-footer-info">
                <span className="ps-f-label">MESOCICLO {selectedMesoId}</span>
                <span className="ps-f-val">{selectedMesoMetrics.totalSessions} SESIONES • {selectedMesoMetrics.volumeLabel}</span>
              </div>
              <button className="ps-btn-save" onClick={handleSaveMeso} disabled={savingMeso}>
                {savingMeso ? 'GUARDANDO...' : 'GUARDAR MESOCICLO'} <Save size={18} style={{marginLeft: '8px'}} />
              </button>
            </div>
          </div>
        )}

        {/* --- MICROCICLO SEMANAL TAB --- */}
        {activeTab === 'MICROCICLO SEMANAL' && (
          <div className="ps-micro-tab-layout">
            <div className="ps-week-grid">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, i) => (
                <div key={i} className="ps-day-card">
                  <div className="ps-day-header">{day}</div>
                  <div className="ps-day-body">
                    <select className="ps-select-input" value={weekDays[i].type} onChange={e => updateDayField(i, 'type', e.target.value)}>
                      <option value="Descanso">Descanso</option>
                      <option value="Entrenamiento">Entrenamiento</option>
                      <option value="Partido">Partido</option>
                      <option value="Recuperación">Recuperación</option>
                    </select>
                    
                    <div className="ps-day-session">
                      {assignedSessions[i] ? (
                        <div className="ps-assigned-box">
                          <span>⚽ {assignedSessions[i]}</span>
                          <button onClick={() => handleRemoveSession(i)} className="ps-remove-btn">✕</button>
                        </div>
                      ) : (
                        <button className="ps-assign-btn" onClick={() => handleAssignSession(i)}>+ Asignar Sesión</button>
                      )}
                    </div>

                    <div className="ps-form-group" style={{marginTop: 'auto'}}>
                      <label style={{textAlign: 'center', fontSize: '11px'}}>CARGA (0-100)</label>
                      <input type="number" min="0" max="100" placeholder="%" value={weekDays[i].load} onChange={e => updateDayField(i, 'load', e.target.value)} className="ps-input text-center" style={{fontSize: '16px', fontWeight: 'bold'}} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ps-footer mt-4">
              <div className="ps-footer-info">
                <span className="ps-f-label">SEMANA ACTUAL</span>
                <span className="ps-f-val">Estructura del Microciclo Semanal</span>
              </div>
              <button className="ps-btn-save" onClick={handleSaveMicro} disabled={savingMicro}>
                {savingMicro ? 'GUARDANDO...' : 'GUARDAR MICROCICLO'} <Save size={18} style={{marginLeft: '8px'}} />
              </button>
            </div>
          </div>
        )}

        {/* --- OBJETIVOS TAB --- */}
        {activeTab === 'OBJETIVOS' && (
          <div className="ps-obj-tab-layout">
            <div className="ps-top-cards" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
              <div className="ps-card">
                <div className="ps-card-header mb-3">
                  <User size={18} className="ps-icon-cyan" />
                  <h3>INDIVIDUALES</h3>
                </div>
                <textarea className="ps-textarea" rows="12" value={objectives.individual} onChange={e => setObjectives({...objectives, individual: e.target.value})} style={{resize: 'none'}} />
              </div>
              <div className="ps-card">
                <div className="ps-card-header mb-3">
                  <Grid size={18} className="ps-icon-cyan" />
                  <h3>EQUIPO</h3>
                </div>
                <textarea className="ps-textarea" rows="12" value={objectives.team} onChange={e => setObjectives({...objectives, team: e.target.value})} style={{resize: 'none'}} />
              </div>
              <div className="ps-card">
                <div className="ps-card-header mb-3">
                  <Target size={18} className="ps-icon-cyan" />
                  <h3>COMPETICIÓN</h3>
                </div>
                <textarea className="ps-textarea" rows="12" value={objectives.competition} onChange={e => setObjectives({...objectives, competition: e.target.value})} style={{resize: 'none'}} />
              </div>
            </div>
            <div className="ps-footer mt-4">
              <div className="ps-footer-info">
                <span className="ps-f-label">OBJETIVOS ESTRATÉGICOS</span>
                <span className="ps-f-val">Actualizados a la fecha</span>
              </div>
              <button className="ps-btn-save" onClick={handleSaveObjectives} disabled={savingObjectives}>
                {savingObjectives ? 'GUARDANDO...' : 'GUARDAR OBJETIVOS'} <Save size={18} style={{marginLeft: '8px'}} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Planificacion;
