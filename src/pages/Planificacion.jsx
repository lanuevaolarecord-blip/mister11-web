import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { generatePlanificacionPDF } from '../utils/pdfGenerator';
import { Settings, Target, Grid, Hourglass, Calendar, User, Save, FileDown, Plus, Sun, Moon } from 'lucide-react';
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
  
  const [theme, setTheme] = useState('dark');
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
    <div className={`ps-page ${theme}`}>
      {toast && (
        <div className={`ps-toast ${toast.type === 'error' ? 'ps-toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="ps-header">
        <div className="ps-header-left">
          <div className="ps-logo-icon">P</div>
          <div className="ps-header-titles">
            <h1>PLANIFICACIÓN</h1>
            <h2>ESTRATÉGICA</h2>
          </div>
        </div>

        <div className="ps-header-center">
          <div className="ps-team-selector">
            <img src={activeTeam?.logoUrl || "https://ui-avatars.com/api/?name=Team&background=random"} alt="team" />
            <span>EQUIPO: {activeTeam?.name || 'SELECCIONA EQUIPO'}</span>
            <span className="ps-chevron">▼</span>
          </div>
        </div>

        <div className="ps-header-right">
          <button 
            className="ps-btn ps-btn-icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Cambiar Modo"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="ps-btn ps-btn-outline"><Plus size={16}/> NUEVO PLAN</button>
          <button className="ps-btn ps-btn-outline" onClick={() => generatePlanificacionPDF(macroInfo, microcycles, activeTeam)}><FileDown size={16}/> EXPORTAR PDF</button>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="ps-tabs-container">
        {['MACROCICLO (PLANTILLA)', 'MESOCICLO', 'MICROCICLO SEMANAL', 'OBJETIVOS'].map(tab => (
          <button 
            key={tab} 
            className={`ps-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="ps-tab-content">
        
        {/* --- MACROCICLO TAB --- */}
        {activeTab === 'MACROCICLO (PLANTILLA)' && (
          <div className="ps-macro-tab-layout">
            <div className="ps-top-cards">
              <div className="ps-card">
                <div className="ps-card-header">
                  <Settings size={18} className="ps-icon-cyan" />
                  <h3>TEMPORADA</h3>
                </div>
                <div className="ps-date-range">
                  <Calendar size={16} className="ps-icon-muted" />
                  <input type="date" value={macroInfo.startDate} onChange={e => setMacroInfo({...macroInfo, startDate: e.target.value})} className="ps-date-input" />
                  <span className="ps-arrow">→</span>
                  <input type="date" value={macroInfo.endDate} onChange={e => setMacroInfo({...macroInfo, endDate: e.target.value})} className="ps-date-input" />
                  <Calendar size={16} className="ps-icon-muted" />
                </div>
                <div className="ps-days-section">
                  <h4>DÍAS DE ENTRENAMIENTO</h4>
                  <div className="ps-days-row">
                    {DAYS_LABELS_SHORT.map((day, idx) => (
                      <button key={idx} className={`ps-day-circle ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`} onClick={() => toggleDay(idx)}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ps-card ps-card-obj">
                <div className="ps-card-header">
                  <Target size={18} className="ps-icon-cyan" />
                  <h3>OBJETIVO GENERAL</h3>
                </div>
                <div className="ps-obj-content">
                  <textarea value={macroInfo.objective} onChange={e => setMacroInfo({...macroInfo, objective: e.target.value})} className="ps-obj-textarea" />
                  <div className="ps-obj-icon-wrapper"><span className="ps-chess-icon">♟️</span></div>
                </div>
              </div>

              <div className="ps-card ps-card-cat">
                <div className="ps-card-header">
                  <Grid size={18} className="ps-icon-cyan" />
                  <h3>CATEGORÍA</h3>
                </div>
                <input type="text" value={macroInfo.category} onChange={e => setMacroInfo({...macroInfo, category: e.target.value})} className="ps-cat-input" />
                <div className="ps-card-header mt-10">
                  <User size={18} className="ps-icon-cyan" />
                  <h3>ENTRENADOR</h3>
                </div>
                <div className="ps-trainer-row">
                  <img src={auth.currentUser?.photoURL || "https://ui-avatars.com/api/?name=Entrenador&background=14B8A6&color=fff"} alt="trainer" className="ps-trainer-avatar"/>
                  <input type="text" value={macroInfo.trainer} onChange={e => setMacroInfo({...macroInfo, trainer: e.target.value})} className="ps-cat-input" />
                </div>
              </div>

              <div className="ps-card ps-card-vol">
                <div className="ps-card-header">
                  <Hourglass size={18} className="ps-icon-cyan" />
                  <h3>VOLUMEN TEMPORADA</h3>
                </div>
                <div className="ps-gauge-container">
                  <svg viewBox="0 0 200 100" className="ps-gauge-svg">
                    <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="var(--ps-gauge-bg)" strokeWidth="15" strokeLinecap="round" />
                    <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#cyan-grad)" strokeWidth="15" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="60" />
                    <defs>
                      <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--ps-cyan)" />
                        <stop offset="100%" stopColor="var(--ps-green)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="ps-gauge-text"><span className="ps-gauge-big">{weeklyVolume} min</span></div>
                  <Hourglass size={40} className="ps-gauge-icon-right" />
                </div>
                <div className="ps-vol-sub">{totalHours}h {remainingMins}min ({totalMinutes} min totales)</div>
              </div>
            </div>

            <div className="ps-macro-overview">
              <div className="ps-macro-header">
                <Calendar size={16} className="ps-icon-cyan" />
                <h3>MACRO-CICLO</h3>
              </div>
              
              <div className="ps-macro-stats-row">
                <div className="ps-macro-session-col">
                  <span className="ps-label">SESIONES 📅</span>
                  <div className="ps-session-bar-wrap">
                    <div className="ps-bar-bg"><div className="ps-bar-fill cyan" style={{width: `${(fakeCompletedSessions/totalSessionsPlanned)*100}%`}}></div></div>
                    <span className="ps-val"><span className="text-cyan">{fakeCompletedSessions}</span>/{totalSessionsPlanned}</span>
                  </div>
                </div>

                <div className="ps-macro-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--ps-gauge-bg)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--ps-cyan)" strokeWidth="6" strokeDasharray="282" strokeDashoffset="100" strokeLinecap="round" />
                  </svg>
                  <div className="ps-mc-inner"><span>{avgPhysical + avgTactical}</span></div>
                </div>

                <div className="ps-macro-bars-col">
                  <div className="ps-macro-bar-item">
                    <span className="ps-label">TRABAJO Físico <span className="ps-small-val">{avgPhysical}/100</span></span>
                    <div className="ps-bar-bg large"><div className="ps-bar-fill green-grad" style={{width: `${avgPhysical}%`}}></div></div>
                  </div>
                  <div className="ps-macro-bar-item">
                    <span className="ps-label">TRABAJO Táctico <span className="ps-small-val">{avgTactical}/100</span></span>
                    <div className="ps-bar-bg large"><div className="ps-bar-fill green-grad-light" style={{width: `${avgTactical}%`}}></div></div>
                  </div>
                </div>

                <div className="ps-macro-bars-col">
                  <div className="ps-macro-bar-item">
                    <span className="ps-label">COMPET. <span className="ps-small-val text-orange">2/10</span></span>
                    <div className="ps-bar-bg large"><div className="ps-bar-fill orange-grad" style={{width: '20%'}}></div></div>
                  </div>
                  <div className="ps-macro-bar-item">
                    <span className="ps-label">OTRO <span className="ps-small-val text-purple">2/10</span></span>
                    <div className="ps-bar-bg large"><div className="ps-bar-fill purple-grad" style={{width: '20%'}}></div></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-matrix-section">
              <h3 className="ps-matrix-title">PLANIFICA MATRIX</h3>
              <div className="ps-matrix-wrapper">
                <div className="ps-matrix-table">
                  <div className="ps-row ps-row-header">
                    <div className="ps-cell ps-cell-sticky">MESES</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input value={m.month} onChange={e => handleMicroChange(m.id, 'month', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-period">
                    <div className="ps-cell ps-cell-sticky">PERIODOS</div>
                    {microcycles.map(m => <div key={m.id} className={`ps-cell bg-${m.period.substring(0,4).toLowerCase()}`}><input value={m.period.substring(0,5)} onChange={e => handleMicroChange(m.id, 'period', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row ps-row-etapa">
                    <div className="ps-cell ps-cell-sticky">ETAPAS</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell bg-darker"><input value={m.etapa.substring(0,5)} onChange={e => handleMicroChange(m.id, 'etapa', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">Nº MICROCICLO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell">{m.id}</div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">TIPO MICRO</div>
                    {microcycles.map(m => (
                      <div key={m.id} className="ps-cell">
                        <select value={m.type} onChange={e => handleMicroChange(m.id, 'type', e.target.value)} className={`ps-micro-type bg-${m.type.substring(0,3).toLowerCase()}`}>
                          <option value="Carga">🚀</option>
                          <option value="Competición">⚔️</option>
                          <option value="Recuperación">🔋</option>
                          <option value="Ajuste">⚙️</option>
                          <option value="Choque">⚡</option>
                          <option value="Aproximación">🎯</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">Nº SESIONES</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell bg-darker"><input type="number" value={m.sessions} onChange={e => handleMicroChange(m.id, 'sessions', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">VOLUMEN SESIÓN</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell text-gold fw-bold"><input type="number" value={m.volume} onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% FÍSICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.physical} onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% TÉCNICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.technical} onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} /></div>)}
                  </div>
                  <div className="ps-row">
                    <div className="ps-cell ps-cell-sticky">% TÁCTICO</div>
                    {microcycles.map(m => <div key={m.id} className="ps-cell"><input type="number" value={m.tactical} onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} /></div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="ps-footer">
              <div className="ps-footer-info">
                <span className="ps-f-label">VOLUMEN TOTAL TEMPORADA</span>
                <span className="ps-f-val">{totalHours}h {remainingMins}min ({totalMinutes} minutos totales)</span>
              </div>
              <button className="ps-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'GUARDANDO...' : 'GUARDAR MACROCICLO'} <Save size={18} style={{marginLeft: '8px'}} />
              </button>
            </div>
          </div>
        )}

        {/* --- MESOCICLO TAB --- */}
        {activeTab === 'MESOCICLO' && (
          <div className="ps-meso-tab-layout">
            <div className="ps-card ps-meso-controls">
              <div className="ps-meso-header">
                <label>SELECCIONAR MESOCICLO</label>
                <select className="ps-select-input" value={selectedMesoId} onChange={e => setSelectedMesoId(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Mesociclo {i + 1} (Semanas {i * 4 + 1} a {i * 4 + 4})</option>
                  ))}
                </select>
              </div>
              <div className="ps-meso-dates">
                <div className="ps-form-group">
                  <label>INICIO MESO</label>
                  <input type="date" value={selectedMesoData.startDate} onChange={e => handleMesoConfigChange('startDate', e.target.value)} className="ps-input" />
                </div>
                <div className="ps-form-group">
                  <label>FIN MESO</label>
                  <input type="date" value={selectedMesoData.endDate} onChange={e => handleMesoConfigChange('endDate', e.target.value)} className="ps-input" />
                </div>
              </div>
              <div className="ps-form-group ps-full-w">
                <label>OBJETIVOS DEL MESOCICLO</label>
                <textarea value={selectedMesoData.objective} onChange={e => handleMesoConfigChange('objective', e.target.value)} className="ps-textarea" rows="3"/>
              </div>
            </div>

            <div className="ps-matrix-section">
              <h3 className="ps-matrix-title">EDICIÓN DEL MESOCICLO {selectedMesoId}</h3>
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
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
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
                        <button className="ps-assign-btn" onClick={() => handleAssignSession(i)}>+ Asignar</button>
                      )}
                    </div>

                    <div className="ps-form-group">
                      <label>CARGA (0-100)</label>
                      <input type="number" min="0" max="100" placeholder="%" value={weekDays[i].load} onChange={e => updateDayField(i, 'load', e.target.value)} className="ps-input text-center" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ps-footer mt-4">
              <div className="ps-footer-info">
                <span className="ps-f-label">SEMANA ACTUAL</span>
                <span className="ps-f-val">Estructura del Microciclo</span>
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
            <div className="ps-obj-grid">
              <div className="ps-card">
                <h3 className="ps-text-gold mb-3">INDIVIDUALES</h3>
                <textarea className="ps-textarea" rows="10" value={objectives.individual} onChange={e => setObjectives({...objectives, individual: e.target.value})} />
              </div>
              <div className="ps-card">
                <h3 className="ps-text-cyan mb-3">EQUIPO</h3>
                <textarea className="ps-textarea" rows="10" value={objectives.team} onChange={e => setObjectives({...objectives, team: e.target.value})} />
              </div>
              <div className="ps-card">
                <h3 className="ps-text-green mb-3">COMPETICIÓN</h3>
                <textarea className="ps-textarea" rows="10" value={objectives.competition} onChange={e => setObjectives({...objectives, competition: e.target.value})} />
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
