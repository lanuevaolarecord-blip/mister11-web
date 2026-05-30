import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { generatePlanificacionPDF } from '../utils/pdfGenerator';
import { Settings, Target, Grid, Hourglass, Calendar, User, Save, FileDown, Plus } from 'lucide-react';
import './Planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const MICRO_TYPES = ['Ajuste', 'Carga', 'Choque', 'Aproximación', 'Competición', 'Recuperación'];
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_LABELS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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
  
  const [macroInfo, setMacroInfo] = useState(initialMacroData);
  const [microcycles, setMicrocycles] = useState(generateMicrocycles());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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
        }
      } catch (err) {
        console.error('Error al cargar planificación:', err);
      }
    };
    loadConfig();
  }, [activeTeamId]);

  // ── SHOW TOAST ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── SAVE MACRO TO FIRESTORE ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
      await setDoc(ref, { macroInfo, microcycles, updatedAt: serverTimestamp() }, { merge: true });
      showToast('Planificación guardada ✓');
    } catch (err) {
      showToast('Error al guardar. Inténtalo de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  }, [macroInfo, microcycles, showToast, activeTeamId]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const syncVolumeToAll = useCallback((days, duration) => {
    const vol = days * (Number(duration) || 0);
    setMicrocycles(prev => prev.map(m => ({ ...m, volume: vol, sessions: days })));
  }, []);

  const toggleDay = (idx) => {
    setMacroInfo(prev => {
      const days = prev.trainingDays.includes(idx)
        ? prev.trainingDays.filter(d => d !== idx)
        : [...prev.trainingDays, idx];
      syncVolumeToAll(days.length, prev.sessionDuration);
      return { ...prev, trainingDays: days };
    });
  };

  const weeklyVolume = macroInfo.trainingDays.length * (Number(macroInfo.sessionDuration) || 0);
  const totalMinutes = microcycles.reduce((acc, m) => acc + Number(m.volume || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  
  // Calculate average physical, tactical, technical
  const avgPhysical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.physical || 0), 0) / (microcycles.length || 1));
  const avgTactical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.tactical || 0), 0) / (microcycles.length || 1));
  const avgTechnical = Math.round(microcycles.reduce((acc, m) => acc + Number(m.technical || 0), 0) / (microcycles.length || 1));

  const totalSessionsPlanned = microcycles.reduce((acc, m) => acc + Number(m.sessions || 0), 0);
  const fakeCompletedSessions = Math.floor(totalSessionsPlanned * 0.3); // Fake progress for the macro widget

  return (
    <div className="ps-page">
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
          <button className="ps-btn ps-btn-outline"><Plus size={16}/> NUEVO PLAN</button>
          <button className="ps-btn ps-btn-outline" onClick={() => generatePlanificacionPDF(macroInfo, microcycles, activeTeam)}><FileDown size={16}/> EXPORTAR PDF</button>
        </div>
      </header>

      {/* TOP CARDS */}
      <div className="ps-top-cards">
        {/* TEMPORADA */}
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
                <button
                  key={idx}
                  className={`ps-day-circle ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`}
                  onClick={() => toggleDay(idx)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OBJETIVO GENERAL */}
        <div className="ps-card ps-card-obj">
          <div className="ps-card-header">
            <Target size={18} className="ps-icon-cyan" />
            <h3>OBJETIVO GENERAL</h3>
          </div>
          <div className="ps-obj-content">
            <textarea 
              value={macroInfo.objective} 
              onChange={e => setMacroInfo({...macroInfo, objective: e.target.value})}
              className="ps-obj-textarea"
            />
            <div className="ps-obj-icon-wrapper">
              <span className="ps-chess-icon">♟️</span>
            </div>
          </div>
        </div>

        {/* CATEGORÍA & ENTRENADOR */}
        <div className="ps-card ps-card-cat">
          <div className="ps-card-header">
            <Grid size={18} className="ps-icon-cyan" />
            <h3>CATEGORÍA</h3>
          </div>
          <input 
            type="text" 
            value={macroInfo.category} 
            onChange={e => setMacroInfo({...macroInfo, category: e.target.value})}
            className="ps-cat-input"
          />
          <div className="ps-card-header mt-10">
            <User size={18} className="ps-icon-cyan" />
            <h3>ENTRENADOR</h3>
          </div>
          <div className="ps-trainer-row">
            <img src={auth.currentUser?.photoURL || "https://ui-avatars.com/api/?name=Entrenador&background=14B8A6&color=fff"} alt="trainer" className="ps-trainer-avatar"/>
            <input 
              type="text" 
              value={macroInfo.trainer} 
              onChange={e => setMacroInfo({...macroInfo, trainer: e.target.value})}
              className="ps-cat-input"
            />
          </div>
        </div>

        {/* VOLUMEN TEMPORADA */}
        <div className="ps-card ps-card-vol">
          <div className="ps-card-header">
            <Hourglass size={18} className="ps-icon-cyan" />
            <h3>VOLUMEN TEMPORADA</h3>
          </div>
          <div className="ps-gauge-container">
            {/* Simple SVG Half-circle gauge */}
            <svg viewBox="0 0 200 100" className="ps-gauge-svg">
              <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#1E293B" strokeWidth="15" strokeLinecap="round" />
              <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#cyan-grad)" strokeWidth="15" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="60" />
              <defs>
                <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ps-gauge-text">
              <span className="ps-gauge-big">{weeklyVolume} min</span>
            </div>
            <Hourglass size={40} className="ps-gauge-icon-right" />
          </div>
          <div className="ps-vol-sub">
            {totalHours}h {remainingMins}min ({totalMinutes} minutos totales)
          </div>
        </div>
      </div>

      {/* MACRO-CICLO OVERVIEW */}
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
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1E293B" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#06B6D4" strokeWidth="6" strokeDasharray="282" strokeDashoffset="100" strokeLinecap="round" />
            </svg>
            <div className="ps-mc-inner">
              <span>{avgPhysical + avgTactical}</span>
            </div>
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
              <span className="ps-label">COMPET. Compitiendo <span className="ps-small-val text-orange">2/10</span></span>
              <div className="ps-bar-bg large"><div className="ps-bar-fill orange-grad" style={{width: '20%'}}></div></div>
            </div>
            <div className="ps-macro-bar-item">
              <span className="ps-label">OTRO 📋 <span className="ps-small-val text-purple">2/10</span></span>
              <div className="ps-bar-bg large"><div className="ps-bar-fill purple-grad" style={{width: '20%'}}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* PLANIFICA MATRIX */}
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
              {microcycles.map(m => <div key={m.id} className="ps-cell">✔</div>)}
            </div>
            <div className="ps-row">
              <div className="ps-cell ps-cell-sticky">TIPO MICROCICLO</div>
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

      {/* FOOTER */}
      <div className="ps-footer">
        <div className="ps-footer-info">
          <span className="ps-f-label">VOLUMEN TOTAL TEMPORADA</span>
          <span className="ps-f-val">{totalHours}h {remainingMins}min ({totalMinutes} minutos totales)</span>
          <span className="ps-f-sub">{macroInfo.trainingDays.length} Días / {microcycles.length} Semanas</span>
        </div>
        <button className="ps-btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'GUARDANDO...' : 'GUARDAR PLANIFICACIÓN'} <Save size={18} style={{marginLeft: '8px'}} />
        </button>
      </div>
    </div>
  );
};

export default Planificacion;
