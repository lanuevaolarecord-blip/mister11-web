import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { useIAUsage } from '../hooks/useIAUsage';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from '../components/UpgradeModal';
import { useCaptures } from '../hooks/useCaptures';
import { Capacitor } from '@capacitor/core';
import { generateExercisePDF } from '../utils/pdfGenerator';
import './IAGeneradora.css';

// --- OPCIONES DE FORMULARIO INTERNACIONALIZADAS ---
const OBJETIVOS = [
  { id: 'aerobic', key: 'ia.obj.aerobic' },
  { id: 'speed', key: 'ia.obj.speed' },
  { id: 'agility', key: 'ia.obj.agility' },
  { id: 'strength', key: 'ia.obj.strength' },
  { id: 'possession', key: 'ia.obj.possession' },
  { id: 'pressing', key: 'ia.obj.pressing' },
  { id: 'transAttDef', key: 'ia.obj.transAttDef' },
  { id: 'transDefAtt', key: 'ia.obj.transDefAtt' },
  { id: 'positional', key: 'ia.obj.positional' },
  { id: 'finishing', key: 'ia.obj.finishing' },
  { id: 'crossing', key: 'ia.obj.crossing' },
  { id: 'warmup', key: 'ia.obj.warmup' },
  { id: 'cooldown', key: 'ia.obj.cooldown' }
];

const MATERIALES = [
  { id: 'balones', key: 'ia.mat.balls', icon: '⚽' },
  { id: 'conos', key: 'ia.mat.cones', icon: '🔺' },
  { id: 'petos', key: 'ia.mat.bibs', icon: '🦺' },
  { id: 'porterias', key: 'ia.mat.goals', icon: '🥅' },
  { id: 'escalera', key: 'ia.mat.ladder', icon: '🪜' },
  { id: 'vallas', key: 'ia.mat.hurdles', icon: '🚧' },
  { id: 'aros', key: 'ia.mat.rings', icon: '⭕' },
];

const ESPACIOS = [
  { id: 'box', key: 'ia.space.box' },
  { id: 'half', key: 'ia.space.half' },
  { id: 'threeQuarter', key: 'ia.space.threeQuarter' },
  { id: 'full', key: 'ia.space.full' },
  { id: 'small', key: 'ia.space.small' },
  { id: 'gym', key: 'ia.space.gym' }
];

const DURACIONES = [5, 10, 15, 20, 25, 30];

const EDADES = [
  { id: 'base', key: 'ia.age.base' },
  { id: 'prebenjamin', key: 'ia.age.prebenjamin' },
  { id: 'alevin', key: 'ia.age.alevin' },
  { id: 'infantil', key: 'ia.age.infantil' },
  { id: 'cadete', key: 'ia.age.cadete' },
  { id: 'juvenil', key: 'ia.age.juvenil' },
  { id: 'amateur', key: 'ia.age.amateur' }
];

const INITIAL_FORM = {
  edad: '',
  jugadores: 10,
  objetivo: '',
  duracion: 15,
  materiales: [],
  espacio: '',
  intensidad: 'Media',
  observaciones: '',
};

const INITIAL_PREVENTION_FORM = {
  descripcion: '',
  tipo: 'Prevención',
  zona: '',
  nivel: 'intermediate',
  materiales: [],
};

const ZONAS_CORPORALES = [
  { id: 'knee', key: 'ia.zone.knee' },
  { id: 'ankle', key: 'ia.zone.ankle' },
  { id: 'hamstring', key: 'ia.zone.hamstring' },
  { id: 'lumbar', key: 'ia.zone.lumbar' },
  { id: 'shoulder', key: 'ia.zone.shoulder' },
  { id: 'quadriceps', key: 'ia.zone.quadriceps' },
  { id: 'adductors', key: 'ia.zone.adductors' },
  { id: 'core', key: 'ia.zone.core' },
  { id: 'calves', key: 'ia.zone.calves' }
];

const NIVELES = [
  { id: 'basic', key: 'ia.level.basic' },
  { id: 'intermediate', key: 'ia.level.intermediate' },
  { id: 'advanced', key: 'ia.level.advanced' }
];

const escapeHTML = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const extractExerciseTitle = (text, fallback = null) => {
  if (!text || typeof text !== 'string') return fallback || `Ejercicio IA ${new Date().toLocaleTimeString()}`;
  // 1. Limpiar etiquetas de razonamiento interno <think>...</think> o etiquetas HTML/XML
  const sanitized = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const lines = sanitized.split('\n').map(l => l.trim()).filter(Boolean);

  // 2. Buscar primero encabezados markdown (# o ##) en cualquier línea
  for (const line of lines) {
    if (line.startsWith('## ')) {
      const t = line.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
      if (t.length > 2) return t.slice(0, 80);
    }
    if (line.startsWith('# ')) {
      const t = line.replace(/^#\s+/, '').replace(/\*\*/g, '').trim();
      if (t.length > 2) return t.slice(0, 80);
    }
  }

  // 3. Buscar etiquetas tipo "Título:", "**Título:**", "**Nombre:**"
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?(?:título|titulo|title|drill\s+name|nombre|ejercicio)(?:\*\*)?:\s*(.+)/i);
    if (match && match[1]) {
      const t = match[1].replace(/\*\*/g, '').trim();
      if (t.length > 2) return t.slice(0, 80);
    }
  }

  // 4. Si no hay encabezados, tomar la primera línea informativa válida
  for (const line of lines) {
    const cleanLine = line.replace(/^[-*#\d.]+\s*/, '').replace(/\*\*/g, '').trim();
    if (cleanLine.length > 2 && !cleanLine.toLowerCase().startsWith('objetivo') && !cleanLine.toLowerCase().startsWith('objective')) {
      return cleanLine.slice(0, 80);
    }
  }

  return fallback || `Ejercicio IA ${new Date().toLocaleTimeString()}`;
};

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('## ')) return <h2 key={i}>{cleanLine.replace('## ', '')}</h2>;
    if (cleanLine.startsWith('### ')) return <h3 key={i}>{cleanLine.replace('### ', '')}</h3>;
    
    // Reemplazo básico de negritas internas **texto**
    if (cleanLine.includes('**')) {
      const parts = cleanLine.split('**');
      return (
        <p key={i} className="ia-md-p">
          {parts.map((part, idx) => (idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part))}
        </p>
      );
    }
    
    if (cleanLine.startsWith('- ')) return <li key={i} className="ia-md-li">{cleanLine.replace('- ', '')}</li>;
    if (cleanLine === '') return <br key={i} />;
    return <p key={i} className="ia-md-p">{cleanLine}</p>;
  });
};

const IAGeneradora = () => {
  const { t, isEn, language } = useTranslation();
  const { activeTeamId, teams } = useAuth();
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;
  const { isPro, isProActive } = usePlan();
  const { exercises, addExercise } = useExercises(activeTeamId);
  const { captures } = useCaptures(activeTeamId);
  const [selectedTacticalRef, setSelectedTacticalRef] = useState(null);
  const [mode, setMode] = useState('tactico'); // 'tactico' | 'prevencion'
  const [form, setForm] = useState(INITIAL_FORM);
  const [preventionForm, setPreventionForm] = useState(INITIAL_PREVENTION_FORM);
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('⏳ Analizando contexto...');
  const [error, setError] = useState('');
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  const isCallingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const resultRef = useRef(null);

  // Hook de uso mensual de IA
  const {
    usageCount,
    limit,
    loading: loadingUsage,
    checkUsage,
    incrementUsage,
    getRemainingUsages
  } = useIAUsage();

  // ── callGroq: delega al proxy del servidor /api/ia-generate ─────────────────
  const callGroq = async (promptTexto) => {
    try {
      const endpoint = Capacitor.isNativePlatform()
        ? 'https://www.mister11.app/api/ia-generate'
        : '/api/ia-generate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptTexto,
          lang: isEn ? 'en' : 'es'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      let text = data?.result;
      if (!text) throw new Error(t('ia.emptyResponse'));
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
      const headerMatch = text.match(/(?:^|\n)(#{1,3}\s+[^\n]+)/m);
      if (headerMatch && headerMatch.index !== undefined && headerMatch.index > 0) {
        text = text.substring(headerMatch.index).trim();
      }
      return text;
    } catch (err) {
      console.error('[IA Generadora] Error en proxy:', err);
      throw err;
    }
  };

  const toggleMaterial = (id) => {
    setForm(prev => ({
      ...prev,
      materiales: prev.materiales.includes(id)
        ? prev.materiales.filter(m => m !== id)
        : [...prev.materiales, id]
    }));
  };

  const handleVoiceDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('ia.dictationNotSupported'));
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = isEn ? 'en-US' : 'es-ES';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm(prev => ({ ...prev, observaciones: prev.observaciones ? prev.observaciones + ' ' + transcript : transcript }));
      setIsListening(false);
    };
    recog.onerror = () => setIsListening(false);
    recog.onend = () => setIsListening(false);
    recognitionRef.current = recog;
    recog.start();
    setIsListening(true);
  };

  const handleGenerate = async () => {
    if (isCallingRef.current) return;

    // 1. Verificar si el usuario ha alcanzado su límite mensual de uso
    const hasUsage = await checkUsage();
    if (!hasUsage) {
      alert(t('ia.limitReached', { limit }));
      return;
    }

    if (mode === 'tactico') {
      if (!form.edad || !form.objetivo || !form.espacio) {
        setError(t('ia.validationTactical'));
        return;
      }
    } else {
      if (!preventionForm.descripcion || !preventionForm.zona) {
        setError(t('ia.validationPrevention'));
        return;
      }
    }

    isCallingRef.current = true;
    setIsGenerating(true);
    setLoadingMsg(t('ia.loadingAnalyzing'));
    setError('');
    setResult(null);

    let prompt = '';
    
    if (mode === 'tactico') {
      const edadObj = EDADES.find(e => e.id === form.edad);
      const edadLabel = edadObj ? t(edadObj.key) : form.edad;

      const objItem = OBJETIVOS.find(o => o.id === form.objetivo);
      const objLabel = objItem ? t(objItem.key) : form.objetivo;

      const espacioItem = ESPACIOS.find(s => s.id === form.espacio);
      const espacioLabel = espacioItem ? t(espacioItem.key) : form.espacio;

      const materialesLabels = form.materiales.map(id => {
        const mat = MATERIALES.find(m => m.id === id);
        return mat ? t(mat.key) : id;
      });
      const materialesStr = materialesLabels.length > 0
        ? materialesLabels.join(', ')
        : (isEn ? 'No specific equipment' : 'Sin material específico');

      if (isEn) {
        prompt = `Generate ONE football training drill in English:
Age Category: ${edadLabel}, Number of Players: ${form.jugadores}, Main Objective: ${objLabel}, Duration: ${form.duracion} min, Equipment: ${materialesStr}, Pitch Area: ${espacioLabel}, Intensity: ${form.intensidad}.
${selectedTacticalRef ? `IMPORTANT: Base the drill on the TACTICAL REFERENCE: "${selectedTacticalRef.title}".` : ''}
${form.observaciones ? `Coach Notes: ${form.observaciones}` : ''}
Use markdown format starting with ## for the drill title.
Structure the drill with:
## [Drill Title]
**Objective:** ...
**Setup & Organization:** ...
**Drill Dynamics:** ...
**Key Coaching Points:** ...
**Variations & Progressions:** ...
Do not include any thinking process, reasoning, or analysis. Respond exclusively in English.`;
      } else {
        prompt = `Genera UN ejercicio de entrenamiento de fútbol en español:
Edad: ${edadLabel}, Jugadores: ${form.jugadores}, Objetivo: ${objLabel}, Duración: ${form.duracion} min, Material: ${materialesStr}, Espacio: ${espacioLabel}, Intensidad: ${form.intensidad}.
${selectedTacticalRef ? `IMPORTANTE: Basar el ejercicio en la REFERENCIA TÁCTICA: "${selectedTacticalRef.title}".` : ''}
${form.observaciones ? `Observaciones: ${form.observaciones}` : ''}
Usa el formato markdown con ## para el título.
Estructura el ejercicio con:
## [Título del Ejercicio]
**Objetivo:** ...
**Organización y Espacio:** ...
**Dinámica del Ejercicio:** ...
**Consignas Clave para el Entrenador:** ...
**Variantes y Progresión:** ...
No incluyas proceso de razonamiento, thinking ni análisis. Responde exclusivamente en español.`;
      }
    } else {
      const zonaObj = ZONAS_CORPORALES.find(z => z.id === preventionForm.zona);
      const zonaLabel = zonaObj ? t(zonaObj.key) : preventionForm.zona;

      const nivelObj = NIVELES.find(n => n.id === preventionForm.nivel);
      const nivelLabel = nivelObj ? t(nivelObj.key) : preventionForm.nivel;

      const prevMaterialesLabels = preventionForm.materiales.map(id => {
        const mat = MATERIALES.find(m => m.id === id);
        return mat ? t(mat.key) : id;
      });
      const prevMaterialesStr = prevMaterialesLabels.length > 0
        ? prevMaterialesLabels.join(', ')
        : (isEn ? 'No equipment' : 'Sin material');

      if (isEn) {
        const planTypeLabel = preventionForm.tipo === 'Recuperación' || preventionForm.tipo === 'recovery'
          ? 'Recovery'
          : (preventionForm.tipo === 'Readaptación' || preventionForm.tipo === 'readaptation' ? 'Readaptation' : 'Prevention');

        prompt = `You are a sports physiotherapist and elite youth football physical preparation expert.
The coach describes the following case:

"${preventionForm.descripcion}"

Plan Type: ${planTypeLabel}
Body Zone: ${zonaLabel}
Player Level: ${nivelLabel}
Available Equipment: ${prevMaterialesStr}

Generate a structured exercise plan in English with the following format:

## [Descriptive Plan Title]
**Objective:** ...
**Contraindications:** ... (if any)

### Exercises:
1. **[Exercise Name]**
   - **Description:** ...
   - **Sets and Repetitions:** ...
   - **Progression:** ...

### Suggested Frequency: ...
### Coach Notes: ...

Do not include any thinking process, reasoning, or analysis. Respond exclusively in English.`;
      } else {
        const planTypeLabel = preventionForm.tipo === 'Recuperación' || preventionForm.tipo === 'recovery'
          ? 'Recuperación'
          : (preventionForm.tipo === 'Readaptación' || preventionForm.tipo === 'readaptation' ? 'Readaptación' : 'Prevención');

        prompt = `Eres un fisioterapeuta deportivo y preparador físico experto en fútbol formativo.
El entrenador describe el siguiente caso:

"${preventionForm.descripcion}"

Tipo: ${planTypeLabel}
Zona corporal: ${zonaLabel}
Nivel del jugador: ${nivelLabel}
Material disponible: ${prevMaterialesStr}

Genera un plan de ejercicios estructurado con el siguiente formato:

## [Nombre descriptivo del plan]
**Objetivo:** ...
**Contraindicaciones:** ... (si las hay)

### Ejercicios:
1. **[Nombre del ejercicio]**
   - **Descripción:** ...
   - **Series y repeticiones:** ...
   - **Progresión:** ...

### Frecuencia sugerida: ...
### Notas para el entrenador: ...

No incluyas proceso de razonamiento, thinking ni análisis. Responde exclusivamente en español.`;
      }
    }

    try {
      const texto = await callGroq(prompt);
      setResult(texto);
      await incrementUsage();
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      isCallingRef.current = false;
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const defaultTitle = t('ia.defaultTitle', { time: new Date().toLocaleTimeString() });
    const title = extractExerciseTitle(result, defaultTitle);
    try {
      await addExercise({ 
        name: title, 
        title: title, 
        description: result, 
        content: result,
        source: 'ia', 
        createdBy: 'ia',
        locale: isEn ? 'en' : 'es',
        category: mode === 'prevencion' ? 'prevencion' : 'tactico',
        createdAt: new Date().toISOString()
      });
      alert(t('ia.saveSuccess', { title }));
    } catch (error) {
      console.error('Error al guardar ejercicio IA:', error);
      alert(t('ia.saveError'));
    }
  };

  return (
    <div className="ia-page">
      <div className="ia-form-panel landscape:max-h-[75vh] landscape:overflow-y-auto landscape:pb-8">
        <header className="ia-form-header">
          <div className="ia-header-text">
            <h1>{t('ia.title')}</h1>
            <p>{t('ia.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                setShowBiblioteca(true);
              }} 
              className={`btn-outline-gold library-btn ${exercises.length > 0 ? 'has-content' : ''}`}
            >
              {t('ia.libraryBtn', { count: exercises.length })}
            </button>
          </div>
        </header>

            <div className="ia-mode-cards">
              <button
                className={`mode-card ${mode === 'tactico' ? 'active' : ''} landscape:py-2`}
                onClick={() => setMode('tactico')}
              >
                <div className="mode-card-icon">⚽</div>
                <span style={{ whiteSpace: 'pre-line' }}>{t('ia.modeTactical')}</span>
              </button>
              <button
                className={`mode-card ${mode === 'prevencion' ? 'active' : ''} landscape:py-2`}
                onClick={() => setMode('prevencion')}
              >
                <div className="mode-card-icon">🩺</div>
                <span style={{ whiteSpace: 'pre-line' }}>{t('ia.modePrevention')}</span>
              </button>
            </div>

            <div className="ia-form-body">
              {mode === 'tactico' ? (
                <>
              <div className="ia-field">
                <label>{t('ia.categoryAge')}</label>
                <select value={form.edad} onChange={e => setForm({...form, edad: e.target.value})}>
                  <option value="">{t('ia.selectPlaceholder')}</option>
                  {EDADES.map(e => <option key={e.id} value={e.id}>{t(e.key)}</option>)}
                </select>
              </div>

              <div className="ia-field">
                <label>{t('ia.numPlayers', { count: form.jugadores })}</label>
                <div className="ia-players-row">
                  <div className="ia-players-count">
                    <span className="player-icon">👤</span>
                    <span className="player-num">{form.jugadores}</span>
                  </div>
                  <input
                    type="range" min="4" max="22" value={form.jugadores}
                    onChange={e => setForm({...form, jugadores: Number(e.target.value)})}
                    className="ia-slider"
                  />
                </div>
              </div>

              <div className="ia-field">
                <label>{t('ia.mainObjective')}</label>
                <select value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})}>
                  <option value="">{t('ia.selectPlaceholder')}</option>
                  {OBJETIVOS.map(o => <option key={o.id} value={o.id}>{t(o.key)}</option>)}
                </select>
              </div>

              <div className="ia-field">
                <label>{t('ia.materials')}</label>
                <div className="chip-group">
                  {MATERIALES.map(m => (
                    <button key={m.id} className={`chip ${form.materiales.includes(m.id) ? 'active' : ''}`}
                      onClick={() => toggleMaterial(m.id)}>
                      <span className="chip-icon">{m.icon}</span> {t(m.key)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>{t('ia.space')}</label>
                <div className="chip-group">
                  {ESPACIOS.map(e => (
                    <button key={e.id} className={`chip ${form.espacio === e.id ? 'active' : ''}`}
                      onClick={() => setForm({...form, espacio: e.id})}>{t(e.key)}</button>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>{t('ia.tacticalRef')}</label>
                <div className="tactical-ref-selector">
                  <div 
                    className={`tactical-thumb-none ${!selectedTacticalRef ? 'active' : ''}`}
                    onClick={() => setSelectedTacticalRef(null)}
                  >
                    <span>{t('ia.noRef')}</span>
                  </div>
                  {captures.map(cap => (
                    <div 
                      key={cap.id} 
                      className={`tactical-thumb ${selectedTacticalRef?.id === cap.id ? 'active' : ''}`}
                      onClick={() => setSelectedTacticalRef(cap)}
                      title={cap.title || t('ia.capture')}
                    >
                      <img src={cap.thumbnail || cap.url} alt={cap.title} />
                      <div className="thumb-check">✓</div>
                      <div className="thumb-label">{t('ia.capture')}</div>
                    </div>
                  ))}
                  {exercises.filter(ex => ex.type === 'pizarra').map(piz => (
                    <div 
                      key={piz.id} 
                      className={`tactical-thumb ${selectedTacticalRef?.id === piz.id ? 'active' : ''}`}
                      onClick={() => setSelectedTacticalRef(piz)}
                      title={piz.title || t('ia.animation', { count: piz.framesCount || 0 })}
                    >
                      {piz.thumbnail ? (
                        <img src={piz.thumbnail} alt={piz.title} />
                      ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#888', fontSize: '10px', fontWeight: 'bold'}}>{t('ia.tacticalBoard')}</div>
                      )}
                      <div className="thumb-check">✓</div>
                      <div className="thumb-label">{t('ia.animation', { count: piz.framesCount || 0 })}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>{t('ia.additionalObs')}</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    value={form.observaciones} 
                    onChange={e => setForm({...form, observaciones: e.target.value})} 
                    placeholder={t('ia.obsPlaceholder')}
                    className="ia-textarea"
                    style={{ paddingRight: '52px' }}
                  />
                  <button
                    onClick={handleVoiceDictation}
                    title={isListening ? t('ia.dictationStop') : t('ia.dictationStart')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '10px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      background: isListening ? '#EF4444' : 'var(--accent)',
                      color: '#fff',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s',
                      animation: isListening ? 'pulse 1s infinite' : 'none'
                    }}
                  >
                    {isListening ? '⏹' : '🎤'}
                  </button>
                </div>
                {isListening && (
                  <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>{t('ia.listening')}</p>
                )}
              </div>
                </>
              ) : (
                <>
                  <div className="ia-field full-width">
                    <label>{t('ia.prev.descLabel')}</label>
                    <textarea
                      rows="4"
                      placeholder={t('ia.prev.descPlaceholder')}
                      value={preventionForm.descripcion}
                      onChange={e => setPreventionForm({...preventionForm, descripcion: e.target.value})}
                      className="ia-textarea"
                    />
                  </div>

                  <div className="ia-field">
                    <label>{t('ia.prev.planType')}</label>
                    <select value={preventionForm.tipo} onChange={e => setPreventionForm({...preventionForm, tipo: e.target.value})}>
                      <option value="Prevención">{t('ia.prev.typePrevention')}</option>
                      <option value="Recuperación">{t('ia.prev.typeRecovery')}</option>
                      <option value="Readaptación">{t('ia.prev.typeReadaptation')}</option>
                    </select>
                  </div>

                  <div className="ia-field">
                    <label>{t('ia.prev.bodyZone')}</label>
                    <select value={preventionForm.zona} onChange={e => setPreventionForm({...preventionForm, zona: e.target.value})}>
                      <option value="">{t('ia.selectPlaceholder')}</option>
                      {ZONAS_CORPORALES.map(z => <option key={z.id} value={z.id}>{t(z.key)}</option>)}
                    </select>
                  </div>

                  <div className="ia-field">
                    <label>{t('ia.prev.playerLevel')}</label>
                    <select value={preventionForm.nivel} onChange={e => setPreventionForm({...preventionForm, nivel: e.target.value})}>
                      {NIVELES.map(n => <option key={n.id} value={n.id}>{t(n.key)}</option>)}
                    </select>
                  </div>

                  <div className="ia-field full-width">
                    <label>{t('ia.prev.availableMaterial')}</label>
                    <div className="chip-group">
                      {MATERIALES.map(m => (
                        <button
                          key={m.id}
                          className={`chip ${preventionForm.materiales.includes(m.id) ? 'active' : ''}`}
                          onClick={() => setPreventionForm(prev => ({
                            ...prev,
                            materiales: prev.materiales.includes(m.id)
                              ? prev.materiales.filter(x => x !== m.id)
                              : [...prev.materiales, m.id]
                          }))}
                        >
                          {m.icon} {t(m.key)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <div className="ia-error">{error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating || loadingUsage} style={{ width: '100%' }}>
                  {isGenerating ? loadingMsg : (mode === 'prevencion' ? t('ia.btnGeneratePrevention') : t('ia.btnGenerateTactical'))}
                </button>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  {loadingUsage ? (
                    <span>{t('ia.loadingUsage')}</span>
                  ) : (
                    <span>{t('ia.usageRemaining', { count: getRemainingUsages(), limit })}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ia-result-panel" ref={resultRef}>
            <div className="ia-result-canvas">
              {!result && !isGenerating && (
                <div className="ia-empty-state">
                  <div className="ia-sparkle-icon">
                    <div className="sparkle-main">✦</div>
                    <div className="sparkle-mini">✦</div>
                  </div>
                  <h2>{t('ia.emptyPlaceholder')}</h2>
                </div>
              )}
              {isGenerating && (
                <div className="ia-empty-state">
                  <div className="ia-loading-animation">
                    <div className="ai-dot"/>
                    <div className="ai-dot"/>
                    <div className="ai-dot"/>
                  </div>
                  <h2 style={{ color: 'var(--ia-text-right)', fontFamily: 'var(--font-heading, Georgia, serif)' }}>{t('ia.loadingGenerating')}</h2>
                </div>
              )}
              {result && !isGenerating && (
                <div className="ia-result-content">
                  <div className="result-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={handleSave}>{t('ia.btnSave')}</button>
                    <button className="btn-primary" onClick={() => generateExercisePDF({ title: extractExerciseTitle(result, t('ia.defaultTitle', { time: new Date().toLocaleTimeString() })), content: result }, activeTeam)}>{t('ia.btnExportPdf')}</button>
                    <button className="btn-outline" style={{ borderColor: 'var(--ia-text-right)', color: 'var(--ia-text-right)' }} onClick={() => setResult(null)}>{t('ia.btnClear')}</button>
                  </div>
                  <div className="ia-markdown-container">
                    <div className="ia-markdown">{renderMarkdown(result)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

      {showBiblioteca && (
        <div className="library-drawer-overlay active" onClick={() => setShowBiblioteca(false)}>
          <div className="library-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle-bar" />
            <div className="drawer-content">
              <div className="drawer-header">
                <h3>{t('ia.drawerTitle')}</h3>
                <button className="btn-close-drawer" onClick={() => setShowBiblioteca(false)}>✕</button>
              </div>
              <div className="exercise-list">
                {exercises.length === 0 ? (
                  <div className="empty-library">
                    <div className="empty-icon">📂</div>
                    <p>{t('ia.emptyLibrary')}</p>
                  </div>
                ) : (
                  (() => {
                    const getExerciseDate = (ej) => {
                      if (ej.timestamp) {
                        if (typeof ej.timestamp.toDate === 'function') return ej.timestamp.toDate();
                        if (ej.timestamp.seconds) return new Date(ej.timestamp.seconds * 1000);
                        return new Date(ej.timestamp);
                      }
                      if (ej.createdAt) {
                        if (typeof ej.createdAt.toDate === 'function') return ej.createdAt.toDate();
                        return new Date(ej.createdAt);
                      }
                      return null;
                    };

                    return [...exercises]
                      .sort((a, b) => {
                        const dateA = getExerciseDate(a) || new Date(0);
                        const dateB = getExerciseDate(b) || new Date(0);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map(ej => {
                        const dateVal = getExerciseDate(ej);
                        const dateStr = dateVal 
                          ? dateVal.toLocaleDateString(isEn ? 'en-US' : 'es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Sistema';

                        return (
                          <div key={ej.id} className="exercise-card" onClick={() => setSelectedExerciseDetail(ej)}>
                            {ej.type === 'pizarra' && ej.thumbnail && (
                              <div className="exercise-card-thumb">
                                <img src={ej.thumbnail} alt="Vista previa" />
                              </div>
                            )}
                            <div className="exercise-card-content">
                              <div className="exercise-card-title">
                                <span className={`type-tag ${ej.type || 'ia'}`}>{ej.type === 'pizarra' ? t('ia.tacticalBoard') : '✨ IA'}</span>
                                <span className="title-text">{ej.title || ej.name || ej.nombre || t('session.untitled')}</span>
                              </div>
                              <div className="exercise-card-meta">
                                <span>{dateStr}</span>
                              </div>
                            </div>
                            <div className="exercise-card-arrow">→</div>
                          </div>
                        );
                      });
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedExerciseDetail && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setSelectedExerciseDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedExerciseDetail.title || selectedExerciseDetail.name || selectedExerciseDetail.nombre || t('ia.modalDetail')}</h2>
              <button className="btn-close" onClick={() => setSelectedExerciseDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{whiteSpace:'pre-wrap', padding:'20px'}}>
              {selectedExerciseDetail.type === 'pizarra' ? (
                <div className="pizarra-detail">
                  {selectedExerciseDetail.thumbnail && <img src={selectedExerciseDetail.thumbnail} alt="Vista previa" style={{width: '100%', borderRadius: '8px', marginBottom: '15px'}} />}
                  <p><strong>Tipo:</strong> {t('nav.pizarra')}</p>
                  <p><strong>Frames:</strong> {selectedExerciseDetail.framesCount || 0}</p>
                  <p style={{marginTop: '10px'}}>Este es un esquema táctico interactivo. Puedes verlo en el módulo de Pizarra Táctica.</p>
                </div>
              ) : (
                selectedExerciseDetail.content || selectedExerciseDetail.description || t('ia.modalNoContent')
              )}
            </div>
            <div className="modal-footer">
              {selectedExerciseDetail.type !== 'pizarra' && (
                <>
                  <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => generateExercisePDF({ title: selectedExerciseDetail.title || selectedExerciseDetail.name, content: selectedExerciseDetail.content || selectedExerciseDetail.description }, activeTeam)}>{t('ia.btnExportPdf')}</button>
                  <button className="btn-primary" onClick={() => {
                    setResult(selectedExerciseDetail.content || selectedExerciseDetail.description || '');
                    setSelectedExerciseDetail(null);
                    setShowBiblioteca(false);
                  }}>{t('ia.modalLoad')}</button>
                </>
              )}
              {selectedExerciseDetail.type === 'pizarra' && (
                <button className="btn-primary" onClick={() => {
                  window.location.href = `/pizarra?id=${selectedExerciseDetail.id}`;
                }}>{t('ia.modalOpenBoard')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
    </div>
  );
};

export default IAGeneradora;
