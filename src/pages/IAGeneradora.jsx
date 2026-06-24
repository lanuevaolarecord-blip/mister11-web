import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { useIAUsage } from '../hooks/useIAUsage';
import UpgradeModal from '../components/UpgradeModal';
import { useCaptures } from '../hooks/useCaptures';
import { generateExercisePDF } from '../utils/pdfGenerator';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './IAGeneradora.css';

// --- OPCIONES DE FORMULARIO ---
const OBJETIVOS = [
  'Resistencia aeróbica', 'Velocidad', 'Agilidad y coordinación', 'Fuerza y potencia',
  'Posesión de balón', 'Presión y pressing', 'Transición ataque-defensa', 'Transición defensa-ataque',
  'Juego de posición', 'Finalización y remate', 'Centros y llegadas', 'Calentamiento',
  'Vuelta a la calma'
];

const MATERIALES = [
  { id: 'balones', label: 'Balones', icon: '⚽' },
  { id: 'conos', label: 'Conos', icon: '🔺' },
  { id: 'petos', label: 'Petos', icon: '🦺' },
  { id: 'porterias', label: 'Porterías', icon: '🥅' },
  { id: 'escalera', label: 'Escalera', icon: '🪜' },
  { id: 'vallas', label: 'Vallas', icon: '🚧' },
  { id: 'aros', label: 'Aros', icon: '⭕' },
];

const ESPACIOS = ['Área penal', 'Medio campo', '3/4 campo', 'Campo completo', 'Espacio reducido', 'Sala / Gimnasio'];
const DURACIONES = [5, 10, 15, 20, 25, 30];
const INTENSIDADES = ['Baja', 'Media', 'Alta', 'Máxima'];
const EDADES = ['Fútbol base (6-10 años)', 'Prebenjamín / Benjamín (8-10)', 'Alevín (10-12)', 'Infantil (12-14)', 'Cadete (14-16)', 'Juvenil (16-18)', 'Amateur'];

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
  nivel: 'Intermedio',
  materiales: [],
};

const ZONAS_CORPORALES = ['Rodilla', 'Tobillo', 'Isquiotibial', 'Lumbar', 'Hombro', 'Cuádriceps', 'Aductores', 'Core / Pelvis', 'Gemelos'];
const NIVELES = ['Básico', 'Intermedio', 'Avanzado'];

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
    const boldMatch = line.match(/^\*\*(.+?):\*\* (.+)$/);
    if (boldMatch) return <p key={i}><strong>{boldMatch[1]}:</strong> {boldMatch[2]}</p>;
    if (line.startsWith('- ')) return <li key={i}>{line.replace('- ', '')}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  });
};

const IAGeneradora = () => {
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

  // Hook de uso mensual de IA
  const {
    usageCount,
    limit,
    loading: loadingUsage,
    checkUsage,
    incrementUsage,
    getRemainingUsages
  } = useIAUsage();

  const [firebaseApiKey, setFirebaseApiKey] = useState('');

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'global'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.groqApiKey) {
            setFirebaseApiKey(data.groqApiKey);
          }
        }
      } catch (err) {
        console.error('Error fetching Groq API key from Firestore:', err);
      }
    };
    fetchApiKey();
  }, []);

  const getEffectiveApiKey = () => {
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (envKey && envKey !== 'PEGA_AQUI_TU_NUEVA_CLAVE_GROQ' && envKey !== 'undefined') {
      return envKey;
    }
    return firebaseApiKey;
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
      alert('Tu navegador no soporta el dictado por voz. Usa Chrome en Android para esta función.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'es-ES';
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

  const callGroq = async (promptTexto) => {
    const activeKey = getEffectiveApiKey();
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'Eres un experto en metodología del fútbol formativo. Respondes siempre en español.'
              },
              {
                role: 'user',
                content: promptTexto
              }
            ],
            max_tokens: 1024,
            temperature: 0.7
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Respuesta vacía de la IA');
      return text;
    } catch (err) {
      console.error('[Groq] Error:', err);
      throw err;
    }
  };

  const handleGenerate = async () => {
    if (isCallingRef.current) return;

    // 1. Verificar si la clave de Groq está configurada
    const GROQ_API_KEY = getEffectiveApiKey();
    if (!GROQ_API_KEY || GROQ_API_KEY === 'PEGA_AQUI_TU_NUEVA_CLAVE_GROQ' || GROQ_API_KEY === 'undefined') {
      setError('⚠️ La clave de IA (Groq) no está configurada. Contacta al administrador para configurarla en la pestaña Ajustes del panel de control.');
      return;
    }

    // 2. Verificar si el usuario ha alcanzado su límite mensual de uso
    const hasUsage = await checkUsage();
    if (!hasUsage) {
      alert(`Has alcanzado el límite de ${limit} generaciones de IA este mes. El límite se reinicia el próximo mes.`);
      return;
    }

    if (mode === 'tactico') {
      if (!form.edad || !form.objetivo || !form.espacio) {
        setError('Por favor completa: Edad, Objetivo y Espacio.');
        return;
      }
    } else {
      if (!preventionForm.descripcion || !preventionForm.zona) {
        setError('Por favor describe el caso y selecciona una zona corporal.');
        return;
      }
    }

    isCallingRef.current = true;
    setIsGenerating(true);
    setLoadingMsg('⏳ Analizando contexto...');
    setError('');
    setResult(null);

    let prompt = '';
    
    if (mode === 'tactico') {
      const materialesStr = form.materiales.length > 0
        ? MATERIALES.filter(m => form.materiales.includes(m.id)).map(m => m.label).join(', ')
        : 'Sin material específico';

      prompt = `Genera UN ejercicio de entrenamiento de fútbol en español:
      Edad: ${form.edad}, Jugadores: ${form.jugadores}, Objetivo: ${form.objetivo}, Duración: ${form.duracion} min, Material: ${materialesStr}, Espacio: ${form.espacio}, Intensidad: ${form.intensidad}.
      ${selectedTacticalRef ? `IMPORTANTE: Basar el ejercicio en la REFERENCIA TÁCTICA: "${selectedTacticalRef.title}".` : ''}
      ${form.observaciones ? `Observaciones: ${form.observaciones}` : ''}
      Usa el formato markdown con ## para el título.
      Explica la dinámica del ejercicio basándote en la referencia táctica si se ha proporcionado.`;
    } else {
      const materialesStr = preventionForm.materiales.length > 0
        ? MATERIALES.filter(m => preventionForm.materiales.includes(m.id)).map(m => m.label).join(', ')
        : 'Sin material';
        
      prompt = `Eres un fisioterapeuta deportivo y preparador físico experto en fútbol formativo.
El entrenador describe el siguiente caso:

"${preventionForm.descripcion}"

Tipo: ${preventionForm.tipo}
Zona corporal: ${preventionForm.zona}
Nivel del jugador: ${preventionForm.nivel}
Material disponible: ${materialesStr}

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

Responde solo en español y usa formato markdown.`;
    }

    try {
      const texto = await callGroq(prompt);
      setResult(texto);
      await incrementUsage();
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      isCallingRef.current = false;
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const title = result.split('\n')[0].replace('## ', '').trim();
    try {
      await addExercise({ 
        name: title, 
        title: title, 
        description: result, 
        source: 'ia', 
        createdBy: 'ia',
        category: mode === 'prevencion' ? 'prevencion' : 'tactico',
        createdAt: new Date().toISOString()
      });
      alert(`✅ Guardado en la biblioteca: ${title}`);
    } catch (error) {
      alert("Error al guardar.");
    }
  };

  return (
    <div className="ia-page">
      <div className="ia-form-panel">
        <header className="ia-form-header">
          <div className="ia-header-text">
            <h1>✨ IA Generadora</h1>
            <p>Diseño de entrenamientos inteligentes</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                setShowBiblioteca(true);
              }} 
              className={`btn-outline-gold library-btn ${exercises.length > 0 ? 'has-content' : ''}`}
            >
              ☁️ Biblioteca ({exercises.length})
            </button>
          </div>
        </header>

            <div className="ia-mode-cards">
              <button
                className={`mode-card ${mode === 'tactico' ? 'active' : ''}`}
                onClick={() => setMode('tactico')}
              >
                <div className="mode-card-icon">⚽</div>
                <span>Ejercicio<br/>Táctico</span>
              </button>
              <button
                className={`mode-card ${mode === 'prevencion' ? 'active' : ''}`}
                onClick={() => setMode('prevencion')}
              >
                <div className="mode-card-icon">🩺</div>
                <span>Prevención /<br/>Recuperación</span>
              </button>
            </div>

            <div className="ia-form-body">
              {mode === 'tactico' ? (
                <>
              <div className="ia-field">
                <label>Categoría / Edad</label>
                <select value={form.edad} onChange={e => setForm({...form, edad: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {EDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div className="ia-field">
                <label>N° De Jugadores: {form.jugadores}</label>
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
                <label>Objetivo Principal</label>
                <select value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="ia-field">
                <label>Materiales</label>
                <div className="chip-group">
                  {MATERIALES.map(m => (
                    <button key={m.id} className={`chip ${form.materiales.includes(m.id) ? 'active' : ''}`}
                      onClick={() => toggleMaterial(m.id)}>
                      <span className="chip-icon">{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>Espacio</label>
                <div className="chip-group">
                  {ESPACIOS.map(e => (
                    <button key={e} className={`chip ${form.espacio === e ? 'active' : ''}`}
                      onClick={() => setForm({...form, espacio: e})}>{e}</button>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>Referencia Táctica (Opcional)</label>
                <div className="tactical-ref-selector">
                  <div 
                    className={`tactical-thumb-none ${!selectedTacticalRef ? 'active' : ''}`}
                    onClick={() => setSelectedTacticalRef(null)}
                  >
                    <span>Sin Ref.</span>
                  </div>
                  {captures.map(cap => (
                    <div 
                      key={cap.id} 
                      className={`tactical-thumb ${selectedTacticalRef?.id === cap.id ? 'active' : ''}`}
                      onClick={() => setSelectedTacticalRef(cap)}
                      title={cap.title || 'Captura Táctica'}
                    >
                      <img src={cap.thumbnail || cap.url} alt={cap.title} />
                      <div className="thumb-check">✓</div>
                      <div className="thumb-label">Captura</div>
                    </div>
                  ))}
                  {exercises.filter(ex => ex.type === 'pizarra').map(piz => (
                    <div 
                      key={piz.id} 
                      className={`tactical-thumb ${selectedTacticalRef?.id === piz.id ? 'active' : ''}`}
                      onClick={() => setSelectedTacticalRef(piz)}
                      title={piz.title || 'Animación'}
                    >
                      {piz.thumbnail ? (
                        <img src={piz.thumbnail} alt={piz.title} />
                      ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#888', fontSize: '10px', fontWeight: 'bold'}}>🎬 Pizarra</div>
                      )}
                      <div className="thumb-check">✓</div>
                      <div className="thumb-label">Animación ({piz.framesCount || 0}F)</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ia-field">
                <label>Observaciones adicionales</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    value={form.observaciones} 
                    onChange={e => setForm({...form, observaciones: e.target.value})} 
                    placeholder="Ej. Enfocarse en la velocidad de ejecución o en el repliegue defensivo..."
                    className="ia-textarea"
                    style={{ paddingRight: '52px' }}
                  />
                  <button
                    onClick={handleVoiceDictation}
                    title={isListening ? 'Detener dictado' : 'Dictar por voz'}
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
                  <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>🔴 Escuchando... habla ahora</p>
                )}
              </div>
                </>
              ) : (
                <>
                  <div className="ia-field full-width">
                    <label>Descripción Clínica / Problema</label>
                    <textarea
                      rows="4"
                      placeholder="Ej: Jugador de 16 años con sobrecarga isquiotibial izquierdo tras partido, necesita ejercicios excéntricos y de fortalecimiento..."
                      value={preventionForm.descripcion}
                      onChange={e => setPreventionForm({...preventionForm, descripcion: e.target.value})}
                      className="ia-textarea"
                    />
                  </div>

                  <div className="ia-field">
                    <label>Tipo de Plan</label>
                    <select value={preventionForm.tipo} onChange={e => setPreventionForm({...preventionForm, tipo: e.target.value})}>
                      <option value="Prevención">Prevención</option>
                      <option value="Recuperación">Recuperación</option>
                      <option value="Readaptación">Readaptación</option>
                    </select>
                  </div>

                  <div className="ia-field">
                    <label>Zona Corporal</label>
                    <select value={preventionForm.zona} onChange={e => setPreventionForm({...preventionForm, zona: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {ZONAS_CORPORALES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>

                  <div className="ia-field">
                    <label>Nivel del Jugador</label>
                    <select value={preventionForm.nivel} onChange={e => setPreventionForm({...preventionForm, nivel: e.target.value})}>
                      {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <div className="ia-field full-width">
                    <label>Material Disponible</label>
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
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <div className="ia-error">{error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating || loadingUsage} style={{ width: '100%' }}>
                  {isGenerating ? loadingMsg : (mode === 'prevencion' ? '🩺 Generar Plan de Ejercicios' : '✨ Generar Ejercicio')}
                </button>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  {loadingUsage ? (
                    <span>🔑 IA: Cargando usos...</span>
                  ) : (
                    <span>🔑 IA: te quedan {getRemainingUsages()} usos este mes (límite {limit})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ia-result-panel">
            <div className="ia-result-canvas">
              {!result && !isGenerating && (
                <div className="ia-empty-state">
                  <div className="ia-sparkle-icon">
                    <div className="sparkle-main">✦</div>
                    <div className="sparkle-mini">✦</div>
                  </div>
                  <h2>Tu ejercicio aparecerá aquí</h2>
                </div>
              )}
              {isGenerating && (
                <div className="ia-empty-state">
                  <div className="ia-loading-animation">
                    <div className="ai-dot"/>
                    <div className="ai-dot"/>
                    <div className="ai-dot"/>
                  </div>
                  <h2 style={{ color: 'var(--ia-text-right)', fontFamily: 'var(--font-heading, Georgia, serif)' }}>Generando...</h2>
                </div>
              )}
              {result && !isGenerating && (
                <div className="ia-result-content">
                  <div className="result-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={handleSave}>💾 Guardar</button>
                    <button className="btn-primary" onClick={() => generateExercisePDF({ title: result.split('\n')[0].replace('## ', '').trim(), content: result }, activeTeam)}>📄 Exportar PDF</button>
                    <button className="btn-outline" style={{ borderColor: 'var(--ia-text-right)', color: 'var(--ia-text-right)' }} onClick={() => setResult(null)}>🔄 Limpiar</button>
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
                <h3>☁️ Biblioteca Cloud</h3>
                <button className="btn-close-drawer" onClick={() => setShowBiblioteca(false)}>✕</button>
              </div>
              <div className="exercise-list">
                {exercises.length === 0 ? (
                  <div className="empty-library">
                    <div className="empty-icon">📂</div>
                    <p>No hay ejercicios guardados aún.</p>
                  </div>
                ) : (
                  exercises.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map(ej => (
                    <div key={ej.id} className="exercise-card" onClick={() => setSelectedExerciseDetail(ej)}>
                      {ej.type === 'pizarra' && ej.thumbnail && (
                        <div className="exercise-card-thumb">
                          <img src={ej.thumbnail} alt="Vista previa" />
                        </div>
                      )}
                      <div className="exercise-card-content">
                        <div className="exercise-card-title">
                          <span className={`type-tag ${ej.type || 'ia'}`}>{ej.type === 'pizarra' ? '📋 Pizarra' : '✨ IA'}</span>
                          <span className="title-text">{ej.title || ej.name || ej.nombre || 'Sin título'}</span>
                        </div>
                        <div className="exercise-card-meta">
                          <span>
                            {ej.timestamp?.toDate 
                              ? ej.timestamp.toDate().toLocaleDateString() 
                              : (ej.timestamp ? new Date(ej.timestamp).toLocaleDateString() : 'Reciente')}
                          </span>
                        </div>
                      </div>
                      <div className="exercise-card-arrow">→</div>
                    </div>
                  ))
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
              <h2>{selectedExerciseDetail.title || selectedExerciseDetail.name || selectedExerciseDetail.nombre || 'Detalle'}</h2>
              <button className="btn-close" onClick={() => setSelectedExerciseDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{whiteSpace:'pre-wrap', padding:'20px'}}>
              {selectedExerciseDetail.type === 'pizarra' ? (
                <div className="pizarra-detail">
                  {selectedExerciseDetail.thumbnail && <img src={selectedExerciseDetail.thumbnail} alt="Vista previa" style={{width: '100%', borderRadius: '8px', marginBottom: '15px'}} />}
                  <p><strong>Tipo:</strong> Pizarra Táctica</p>
                  <p><strong>Frames:</strong> {selectedExerciseDetail.framesCount || 0}</p>
                  <p style={{marginTop: '10px'}}>Este es un esquema táctico interactivo. Puedes verlo en el módulo de Pizarra Táctica.</p>
                </div>
              ) : (
                selectedExerciseDetail.content || selectedExerciseDetail.description || 'Sin contenido.'
              )}
            </div>
            <div className="modal-footer">
              {selectedExerciseDetail.type !== 'pizarra' && (
                <>
                  <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => generateExercisePDF({ title: selectedExerciseDetail.title || selectedExerciseDetail.name, content: selectedExerciseDetail.content || selectedExerciseDetail.description }, activeTeam)}>📄 Exportar PDF</button>
                  <button className="btn-primary" onClick={() => {
                    setResult(selectedExerciseDetail.content || selectedExerciseDetail.description || '');
                    setSelectedExerciseDetail(null);
                    setShowBiblioteca(false);
                  }}>Cargar</button>
                </>
              )}
              {selectedExerciseDetail.type === 'pizarra' && (
                <button className="btn-primary" onClick={() => {
                  window.location.href = `/pizarra?id=${selectedExerciseDetail.id}`;
                }}>Abrir en Pizarra</button>
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
