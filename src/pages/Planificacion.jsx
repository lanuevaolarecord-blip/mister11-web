import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useTheme } from '../context/ThemeContext';
import { Save, FileText } from 'lucide-react';
import './Planificacion.css';

// --- CONSTANTS ---
const MONTHS = ['Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];
const DAYS_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const MATRIX_ROWS = [
  { id: 'periodo',   label: 'PERÍODO',        type: 'select', options: ['Prep','Comp','Trans'], colorClass: 'row-periodo' },
  { id: 'carga',     label: 'TIPO MICRO',     type: 'select', options: ['Carga','Ajuste','Choque','Comp','Recup'], colorClass: 'row-carga' },
  { id: 'microciclo',label: 'Nº MICROCICLO',  type: 'number', colorClass: 'row-micro' },
  { id: 'fisio',     label: 'TEST FÍSICO',    type: 'check',  colorClass: 'row-fisio' },
  { id: 'infl',      label: 'DINÁMICA CARGA', type: 'badge',  colorClass: 'row-infl' },
  { id: 'volume',    label: 'VOLUMEN (MIN)',  type: 'number', colorClass: 'row-activ' },
  { id: 'sessions',  label: 'SESIONES',       type: 'number', colorClass: 'row-artist' },
];

const generateMicrocycles = (startDate = '2025-09-01', sessionDuration = 90, trainingDays = [0, 2, 4]) => {
  return Array.from({ length: 40 }, (_, i) => {
    const monthIdx = Math.min(Math.floor(i / 4), MONTHS.length - 1);
    const isPrep = i < 8;
    const isTrans = i > 36;
    let period = isPrep ? 'Prep' : (isTrans ? 'Trans' : 'Comp');
    return {
      id: i + 1,
      month: MONTHS[monthIdx],
      periodo: period,
      carga: isPrep ? 'Carga' : 'Comp',
      microciclo: i + 1,
      fisio: i % 3 !== 0,
      infl: i % 4 === 0 ? '↗' : (i % 4 === 1 ? '↘' : ''),
      activ: '2H',
      artist: Math.floor(20 + (i % 20)),
      mocior: Math.floor(13 + (i % 18)),
      sessions: trainingDays.length,
      volume: trainingDays.length * sessionDuration,
      physical: isPrep ? 40 : 20,
      technical: 40,
      tactical: isPrep ? 20 : 40,
    };
  });
};

// ── CIRCULAR GAUGE SVG ──────────────────────────────────────────────
const CircularGauge = ({ value, max, size = 90, color = '#4CAF7D', bgColor = '#e5e7eb', label }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor} strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'var(--font-heading)', fontSize: size > 80 ? 22 : 16, fontWeight:900, color, lineHeight:1 }}>{value}</span>
        {label && <span style={{ fontSize:9, color:'#888', fontWeight:600, marginTop:2 }}>{label}</span>}
      </div>
    </div>
  );
};

// ── PROGRESS BAR ────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background:'rgba(0,0,0,0.08)', borderRadius:4, height:8, flex:1, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background: color, borderRadius:4, transition:'width 0.4s ease' }} />
    </div>
  );
};

const Planificacion = () => {
  const { activeTeamId } = useAuth();
  const { activeTeam } = useTeams();
  const { darkMode } = useTheme();

  const [macroInfo, setMacroInfo] = useState({
    startDate: '2025-09-01',
    endDate: '2026-06-15',
    category: activeTeam?.category || 'Infantil A',
    objective: 'Adapteremos al equipo en la parte técnica y táctica, mediante trabajos de posición y finalización.',
    trainer: 'Jhojan',
    sessionDuration: 90,
    trainingDays: [0, 2, 4],
  });

  const [microcycles, setMicrocycles] = useState(() => generateMicrocycles());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('macrociclo'); // 'macrociclo' | 'mesociclo' | 'microciclo' | 'objetivos'

  // Macro-ciclo counts
  const [macroCounts, setMacroCounts] = useState({ sesiones: 3, sesionesMax: 10, trabajo: 4, trabajoMax: 10, compet: 2, competMax: 10 });

  // ── LOAD FROM FIRESTORE ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user || !activeTeamId) return;
      try {
        const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.macroInfo) setMacroInfo(prev => ({ ...prev, ...d.macroInfo }));
          if (d.microcycles?.length > 0) setMicrocycles(d.microcycles);
          if (d.macroCounts) setMacroCounts(d.macroCounts);
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [activeTeamId]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !activeTeamId) { showToast('Inicia sesión para guardar', 'error'); return; }
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid, 'teams', activeTeamId, 'planificacion', 'config');
      await setDoc(ref, { macroInfo, microcycles, macroCounts, updatedAt: serverTimestamp() }, { merge: true });
      showToast('Planificación guardada ✓');
    } catch (e) { showToast('Error al guardar.', 'error'); }
    finally { setSaving(false); }
  }, [macroInfo, microcycles, macroCounts, showToast, activeTeamId]);

  const toggleDay = (idx) => {
    setMacroInfo(prev => {
      const days = prev.trainingDays.includes(idx)
        ? prev.trainingDays.filter(d => d !== idx)
        : [...prev.trainingDays, idx];
      return { ...prev, trainingDays: days };
    });
  };

  const handleMicroChange = (id, field, value) => {
    setMicrocycles(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // ── COMPUTED VALUES ──────────────────────────────────────────────
  const weeklyVolume = macroInfo.trainingDays.length * Number(macroInfo.sessionDuration || 0);
  const totalMinutes = microcycles.reduce((a, m) => a + Number(m.volume || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  const overallScore = useMemo(() => {
    const avg = microcycles.reduce((a, m) => a + (Number(m.physical||0) + Number(m.technical||0) + Number(m.tactical||0)) / 3, 0) / (microcycles.length || 1);
    return Math.round(avg);
  }, [microcycles]);

  // Group microcycles by month for matrix header
  const monthGroups = useMemo(() => {
    const groups = {};
    microcycles.forEach(m => {
      if (!groups[m.month]) groups[m.month] = [];
      groups[m.month].push(m);
    });
    return groups;
  }, [microcycles]);

  const themeClass = darkMode ? 'dark' : 'light';

  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className={`plan-page ${themeClass}`}>
      {/* TOAST */}
      {toast && (
        <div className={`plan-toast ${toast.type === 'error' ? 'plan-toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="plan-page-header">
        <h1 className="page-title">PLANIFICACIÓN ESTRATÉGICA</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FileText size={15} /> EXPORTAR PDF
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Save size={15} /> {saving ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────── */}
      <div className="plan-tab-bar">
        {[
          { id: 'macrociclo', label: 'MACROCICLO (PLANTILLA)' },
          { id: 'mesociclo',  label: 'MESOCICLO' },
          { id: 'microciclo', label: 'MICROCICLO SEMANAL' },
          { id: 'objetivos',  label: 'OBJETIVOS' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`plan-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────── */}
      {activeTab === 'macrociclo' && (<>
      <div className="plan-top-grid">

        {/* CARD 1 — TEMPORADA */}
        <div className="plan-card plan-card-temporada">
          <div className="plan-card-label">
            <span className="plan-icon">⚙</span> TEMPORADA
          </div>
          <div className="plan-date-row">
            <div className="plan-date-block">
              <span className="plan-date-icon">📅</span>
              <input type="date" value={macroInfo.startDate}
                onChange={e => setMacroInfo(p => ({ ...p, startDate: e.target.value }))}
                className="plan-date-input" />
            </div>
            <span className="plan-date-arrow">→</span>
            <div className="plan-date-block">
              <input type="date" value={macroInfo.endDate}
                onChange={e => setMacroInfo(p => ({ ...p, endDate: e.target.value }))}
                className="plan-date-input" />
            </div>
          </div>
          <div className="plan-days-label">DÍAS DE ENTRENAMIENTO</div>
          <div className="plan-days-row">
            {DAYS_LABELS.map((day, idx) => (
              <button key={idx}
                className={`plan-day-btn ${macroInfo.trainingDays.includes(idx) ? 'active' : ''}`}
                onClick={() => toggleDay(idx)}>
                {day.substring(0,3)}
              </button>
            ))}
          </div>
        </div>

        {/* CARD 2 — OBJETIVO GENERAL */}
        <div className="plan-card plan-card-objetivo">
          <div className="plan-card-label">
            <span className="plan-icon">🎯</span> OBJETIVO GENERAL
          </div>
          <div className="plan-objetivo-body">
            <textarea
              className="plan-objetivo-textarea"
              value={macroInfo.objective}
              onChange={e => setMacroInfo(p => ({ ...p, objective: e.target.value }))}
              rows={4}
            />
            <div className="plan-objetivo-icon">🤝</div>
          </div>
        </div>

        {/* CARD 3 — CATEGORÍA */}
        <div className="plan-card plan-card-categoria">
          <div className="plan-card-label">
            <span className="plan-icon">⊞</span> CATEGORÍA
          </div>
          <input
            className="plan-cat-input"
            value={macroInfo.category}
            onChange={e => setMacroInfo(p => ({ ...p, category: e.target.value }))}
            placeholder="Ej: Infantil A"
          />
          <div className="plan-trainer-row">
            <span className="plan-trainer-label">
              <span style={{ marginRight: 6 }}>👤</span> ENTRENADOR
            </span>
          </div>
          <div className="plan-trainer-name-row">
            <div className="plan-trainer-avatar">
              {(macroInfo.trainer || 'M').charAt(0).toUpperCase()}
            </div>
            <input
              className="plan-trainer-input"
              value={macroInfo.trainer}
              onChange={e => setMacroInfo(p => ({ ...p, trainer: e.target.value }))}
              placeholder="Nombre entrenador"
            />
          </div>
        </div>

        {/* CARD 4 — VOLUMEN TEMPORADA */}
        <div className="plan-card plan-card-volumen">
          <div className="plan-card-label">
            <span className="plan-icon">⌛</span> VOLUMEN TEMPORADA
          </div>
          <div className="plan-volumen-body">
            <CircularGauge value={weeklyVolume} max={600} size={96} color="#4CAF7D" bgColor="#e0ede6" label="min/sem" />
            <div className="plan-volumen-text">
              <div className="plan-volumen-big">{weeklyVolume} <span className="plan-volumen-unit">min</span></div>
              <div className="plan-volumen-sub">{totalHours}h {remainingMins}min ({totalMinutes} minutos totales)</div>
              <div className="plan-session-dur-row">
                <label className="plan-session-label">Duración sesión:</label>
                <input type="number" value={macroInfo.sessionDuration} min={30} max={180}
                  onChange={e => setMacroInfo(p => ({ ...p, sessionDuration: Number(e.target.value) }))}
                  className="plan-dur-input" />
                <span className="plan-session-label">min</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW 2: MACRO-CICLO ──────────────────────────────────────── */}
      <div className="plan-macro-card">
        <div className="plan-macro-header">
          <span className="plan-macro-title-icon">⟳</span>
          <span className="plan-macro-title">MACRO-CICLO</span>
          <div className="plan-macro-legend">
            <span className="plan-legend-chip chip-sesiones">Sesiones {macroCounts.sesiones}/{macroCounts.sesionesMax}</span>
            <span className="plan-legend-chip chip-trabajo">🏋 Trabajo {macroCounts.trabajo}/{macroCounts.trabajoMax}</span>
            <span className="plan-legend-chip chip-compet">● Compet. {macroCounts.compet}/{macroCounts.competMax}</span>
          </div>
        </div>

        <div className="plan-macro-body">
          {/* Left: score circle */}
          <div className="plan-macro-score">
            <CircularGauge value={overallScore} max={100} size={100} color="#4CAF7D" bgColor="#d4e8da" />
          </div>

          {/* Center & right: 3 metric groups */}
          <div className="plan-macro-metrics">

            {/* SESIONES */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">📅</span>
                <span className="plan-metric-name">SESIONES</span>
                <span className="plan-metric-count">{macroCounts.sesiones}/{macroCounts.sesionesMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <ProgressBar value={macroCounts.sesiones} max={macroCounts.sesionesMax} color="#1B3A2D" />
                <input type="number" min={0} max={macroCounts.sesionesMax} value={macroCounts.sesiones}
                  onChange={e => setMacroCounts(p => ({ ...p, sesiones: Number(e.target.value) }))}
                  className="plan-count-input" />
                <span style={{ fontSize:11, color:'#888' }}>/{macroCounts.sesionesMax}</span>
              </div>
            </div>

            {/* Score 2 */}
            <div className="plan-macro-score-mid">
              <CircularGauge value={overallScore} max={100} size={90} color="#D4A843" bgColor="#f0e4c0" />
            </div>

            {/* TRABAJO */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">🏋</span>
                <span className="plan-metric-name">TRABAJO</span>
                <span className="plan-metric-badge">Tektips</span>
                <span className="plan-metric-count">{macroCounts.trabajo}/{macroCounts.trabajoMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <ProgressBar value={macroCounts.trabajo} max={macroCounts.trabajoMax} color="#4CAF7D" />
                <input type="number" min={0} max={macroCounts.trabajoMax} value={macroCounts.trabajo}
                  onChange={e => setMacroCounts(p => ({ ...p, trabajo: Number(e.target.value) }))}
                  className="plan-count-input" />
                <span style={{ fontSize:11, color:'#888' }}>/{macroCounts.trabajoMax}</span>
              </div>
            </div>

            {/* Score 3 */}
            <div className="plan-macro-score-mid">
              <CircularGauge value={overallScore} max={100} size={90} color="#D4A843" bgColor="#f0e4c0" />
            </div>

            {/* COMPET */}
            <div className="plan-metric-group">
              <div className="plan-metric-header">
                <span className="plan-metric-icon">🏆</span>
                <span className="plan-metric-name">COMPET.</span>
                <span className="plan-metric-badge chip-compet-badge">Competencia</span>
                <span className="plan-metric-count">{macroCounts.compet}/{macroCounts.competMax}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <ProgressBar value={macroCounts.compet} max={macroCounts.competMax} color="#D4A843" />
                <input type="number" min={0} max={macroCounts.competMax} value={macroCounts.compet}
                  onChange={e => setMacroCounts(p => ({ ...p, compet: Number(e.target.value) }))}
                  className="plan-count-input" />
                <span style={{ fontSize:11, color:'#888' }}>/{macroCounts.competMax}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ROW 3: PLANNING MATRIX ─────────────────────────────────── */}
      <div className="plan-matrix-card">
        <div className="plan-matrix-title">MATRIZ DE PLANIFICACIÓN</div>
        <div className="plan-matrix-scroll">
          <table className="plan-matrix-table">
            <thead>
              {/* Month header row */}
              <tr className="plan-mrow plan-mrow-month">
                <th className="plan-msticky plan-mlabel-cell">MESES</th>
                {Object.entries(monthGroups).map(([month, weeks]) => (
                  <th key={month} colSpan={weeks.length} className="plan-month-header">
                    {month}
                  </th>
                ))}
              </tr>
              {/* Carga sub-header */}
              <tr className="plan-mrow plan-mrow-carga">
                <th className="plan-msticky plan-mlabel-cell">TIPO MICRO</th>
                {microcycles.map(m => (
                  <th key={m.id} className="plan-mcell plan-mcell-carga">
                    <select value={m.carga} onChange={e => handleMicroChange(m.id, 'carga', e.target.value)}
                      className="plan-cell-select plan-cell-select-carga">
                      <option>Carga</option>
                      <option>Ajuste</option>
                      <option>Choque</option>
                      <option>Comp</option>
                      <option>Recup</option>
                    </select>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* CARGA row */}
              <tr className="plan-mrow plan-mrow-alt">
                <td className="plan-msticky plan-mlabel-cell">PERÍODOS</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <select value={m.periodo} onChange={e => handleMicroChange(m.id, 'periodo', e.target.value)}
                      className="plan-cell-select">
                      <option>Prep</option><option>Comp</option><option>Trans</option>
                    </select>
                  </td>
                ))}
              </tr>

              {/* Nº MICROCICLO */}
              <tr className="plan-mrow">
                <td className="plan-msticky plan-mlabel-cell">Nº MICROCICLO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell plan-mcell-num">
                    {m.id}
                  </td>
                ))}
              </tr>

              {/* FISIOLÓGICO — checkmarks */}
              <tr className="plan-mrow plan-mrow-fisio">
                <td className="plan-msticky plan-mlabel-cell">TEST FÍSICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell" style={{ cursor:'pointer' }}
                    onClick={() => handleMicroChange(m.id, 'fisio', !m.fisio)}>
                    <span className={`plan-check ${m.fisio ? 'plan-check-active' : ''}`}>
                      {m.fisio ? '✓' : ''}
                    </span>
                  </td>
                ))}
              </tr>

              {/* INFL EMBD — arrows */}
              <tr className="plan-mrow plan-mrow-infl">
                <td className="plan-msticky plan-mlabel-cell">DINÁMICA CARGA</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell" style={{ cursor:'pointer' }}
                    onClick={() => {
                      const next = m.infl === '' ? '↗' : m.infl === '↗' ? '↘' : m.infl === '↘' ? '↗' : '';
                      handleMicroChange(m.id, 'infl', next);
                    }}>
                    <span className={`plan-arrow-badge plan-arrow-${m.infl === '↗' ? 'up' : m.infl === '↘' ? 'down' : 'none'}`}>
                      {m.infl || ''}
                    </span>
                  </td>
                ))}
              </tr>

              {/* VOLUMEN (MIN) */}
              <tr className="plan-mrow plan-mrow-activ">
                <td className="plan-msticky plan-mlabel-cell">VOLUMEN (MIN)</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.volume}
                      onChange={e => handleMicroChange(m.id, 'volume', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* SESIONES */}
              <tr className="plan-mrow">
                <td className="plan-msticky plan-mlabel-cell">SESIONES</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.sessions}
                      onChange={e => handleMicroChange(m.id, 'sessions', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* Deleted MOCIOR BMIN */}

              {/* % FÍSICO */}
              <tr className="plan-mrow plan-mrow-fisic">
                <td className="plan-msticky plan-mlabel-cell">% FÍSICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.physical}
                      onChange={e => handleMicroChange(m.id, 'physical', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* % TÉCNICO */}
              <tr className="plan-mrow plan-mrow-tecnico">
                <td className="plan-msticky plan-mlabel-cell">% TÉCNICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.technical}
                      onChange={e => handleMicroChange(m.id, 'technical', e.target.value)} />
                  </td>
                ))}
              </tr>

              {/* % TÁCTICO */}
              <tr className="plan-mrow plan-mrow-tactico">
                <td className="plan-msticky plan-mlabel-cell">% TÁCTICO</td>
                {microcycles.map(m => (
                  <td key={m.id} className="plan-mcell">
                    <input type="number" className="plan-cell-input" value={m.tactical}
                      onChange={e => handleMicroChange(m.id, 'tactical', e.target.value)} />
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Matrix footer */}
        <div className="plan-matrix-footer">
          <div className="plan-matrix-footer-info">
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              {totalHours}h {remainingMins}min
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({totalMinutes} minutos totales) · {macroInfo.trainingDays.length} días/sem
            </span>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 24px', fontSize:13 }}>
            <Save size={15} /> {saving ? 'GUARDANDO...' : 'GUARDAR PLANIFICACIÓN'}
          </button>
        </div>
      </div>

      </>) /* end macrociclo tab */}

      {/* ── MESOCICLO TAB ─────────────────────────────────── */}
      {activeTab === 'mesociclo' && (
        <div className="plan-empty-tab">
          <div className="plan-empty-tab-icon">🔄</div>
          <h2>Mesociclo</h2>
          <p>Planificación por bloques de 3-6 semanas. Próximamente disponible.</p>
        </div>
      )}

      {/* ── MICROCICLO SEMANAL TAB ────────────────────────── */}
      {activeTab === 'microciclo' && (
        <div className="plan-empty-tab">
          <div className="plan-empty-tab-icon">📅</div>
          <h2>Microciclo Semanal</h2>
          <p>Vista detallada semana a semana con cargas y sesiones. Próximamente disponible.</p>
        </div>
      )}

      {/* ── OBJETIVOS TAB ─────────────────────────────────── */}
      {activeTab === 'objetivos' && (
        <div className="plan-objetivos-tab">
          <div className="plan-card" style={{ marginBottom: 16 }}>
            <div className="plan-card-label"><span className="plan-icon">🎯</span> OBJETIVO GENERAL DE TEMPORADA</div>
            <textarea
              className="plan-objetivo-textarea"
              style={{ minHeight: 120, border: '1px solid #e0d9cc', borderRadius: 8, padding: '10px 12px', background: '#fff', width: '100%', boxSizing: 'border-box' }}
              value={macroInfo.objective}
              onChange={e => setMacroInfo(p => ({ ...p, objective: e.target.value }))}
              placeholder="Describe el objetivo principal de la temporada..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '💪', label: 'OBJETIVO FÍSICO', key: 'objFisico', placeholder: 'Mejorar la resistencia aeróbica y la velocidad de reacción...' },
              { icon: '⚽', label: 'OBJETIVO TÉCNICO', key: 'objTecnico', placeholder: 'Mejorar el control y el pase en espacios reducidos...' },
              { icon: '♟️', label: 'OBJETIVO TÁCTICO', key: 'objTactico', placeholder: 'Dominar la presión alta y la salida de balón...' },
              { icon: '🧠', label: 'OBJETIVO MENTAL', key: 'objMental', placeholder: 'Desarrollar la concentración y el trabajo en equipo...' },
            ].map(({ icon, label, key, placeholder }) => (
              <div key={key} className="plan-card">
                <div className="plan-card-label"><span className="plan-icon">{icon}</span> {label}</div>
                <textarea
                  className="plan-objetivo-textarea"
                  style={{ minHeight: 90, border: '1px solid #e0d9cc', borderRadius: 8, padding: '8px 10px', background: '#fff', width: '100%', boxSizing: 'border-box' }}
                  value={macroInfo[key] || ''}
                  onChange={e => setMacroInfo(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Planificacion;
