import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { useCaptures } from '../hooks/useCaptures';
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
const EDADES = ['Fútbol base (6-10 años)', 'Prebenjamín / Benjamín (8-10)', 'Alevín (10-12)', 'Infantil (12-14)', 'Cadete (14-16)', 'Juvenil (16-18)'];

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
  const { activeTeamId } = useAuth();
  const { isPro } = usePlan();
  const { exercises, addExercise } = useExercises(activeTeamId);
  const { captures } = useCaptures(activeTeamId);
  const [selectedTacticalRef, setSelectedTacticalRef] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('⏳ Analizando contexto...');
  const [error, setError] = useState('');
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  const isCallingRef = useRef(false);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const apiKeyMissing = !apiKey || apiKey === 'undefined';

  const toggleMaterial = (id) => {
    setForm(prev => ({
      ...prev,
      materiales: prev.materiales.includes(id)
        ? prev.materiales.filter(m => m !== id)
        : [...prev.materiales, id]
    }));
  };

  const callGroq = async (promptTexto) => {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Eres un experto en metodología del fútbol formativo. Respondes siempre en español.' },
              { role: 'user', content: promptTexto }
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
      return data.choices[0].message.content;
    } catch (err) {
      console.error('[Groq] Error:', err);
      throw err;
    }
  };

  const handleGenerate = async () => {
    if (isCallingRef.current) return;
    if (!isPro && exercises.length >= 5) {
      setUpgradeModal({ open: true, message: 'Has alcanzado el límite de ejercicios del plan gratuito. Pásate a PRO para generar ilimitadamente.' });
      return;
    }

    if (!form.edad || !form.objetivo || !form.espacio) {
      setError('Por favor completa: Edad, Objetivo y Espacio.');
      return;
    }

    isCallingRef.current = true;
    setIsGenerating(true);
    setLoadingMsg('⏳ Analizando contexto...');
    setError('');
    setResult(null);

    const materialesStr = form.materiales.length > 0
      ? MATERIALES.filter(m => form.materiales.includes(m.id)).map(m => m.label).join(', ')
      : 'Sin material específico';

    const prompt = `Genera UN ejercicio de entrenamiento de fútbol en español:
    Edad: ${form.edad}, Jugadores: ${form.jugadores}, Objetivo: ${form.objetivo}, Duración: ${form.duracion} min, Material: ${materialesStr}, Espacio: ${form.espacio}, Intensidad: ${form.intensidad}.
    ${selectedTacticalRef ? `IMPORTANTE: Basar el ejercicio en la REFERENCIA TÁCTICA: "${selectedTacticalRef.title}".` : ''}
    ${form.observaciones ? `Observaciones: ${form.observaciones}` : ''}
    Usa el formato markdown con ## para el título.
    Explica la dinámica del ejercicio basándote en la referencia táctica si se ha proporcionado.`;

    try {
      const texto = await callGroq(prompt);
      setResult(texto);
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
      await addExercise({ title, content: result, timestamp: new Date().toISOString() });
      alert(`✅ Guardado: ${title}`);
    } catch (error) {
      alert("Error al guardar.");
    }
  };

  return (
    <div className="ia-page">
      {apiKeyMissing && (
        <div className="ia-config-error">
          ⚠️ API Key faltante. Configura VITE_GROQ_API_KEY.
        </div>
      )}

      <div className="ia-form-panel">
        <header className="ia-form-header">
          <div className="ia-header-text">
            <h1>✨ IA Generadora</h1>
            <p>Diseño de entrenamientos inteligentes</p>
          </div>
          <button onClick={() => setShowBiblioteca(true)} className="btn-outline-gold library-btn">
            ☁️ Biblioteca ({exercises.length})
          </button>
        </header>

        <div className="ia-form-body">
          <div className="ia-field">
            <label>Categoría / Edad</label>
            <select value={form.edad} onChange={e => setForm({...form, edad: e.target.value})}>
              <option value="">Seleccionar...</option>
              {EDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="ia-field">
            <label>Nº de Jugadores: <strong>{form.jugadores}</strong></label>
            <input type="range" min="4" max="22" value={form.jugadores}
              onChange={e => setForm({...form, jugadores: Number(e.target.value)})} className="ia-slider" />
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
                  onClick={() => toggleMaterial(m.id)}> {m.icon} {m.label} </button>
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
                >
                  <img src={cap.url} alt={cap.title} />
                  <div className="thumb-check">✓</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ia-field">
            <label>Observaciones adicionales</label>
            <textarea 
              value={form.observaciones} 
              onChange={e => setForm({...form, observaciones: e.target.value})} 
              placeholder="Ej. Enfocarse en la velocidad de ejecución o en el repliegue defensivo..."
              className="ia-textarea"
            />
          </div>

          <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? loadingMsg : '✨ Generar Ejercicio'}
          </button>
        </div>
      </div>

      <div className="ia-result-panel">
        {!result && !isGenerating && (
          <div className="ia-empty-state">
            <div className="empty-icon">✨</div>
            <h2>Tu ejercicio aparecerá aquí</h2>
          </div>
        )}
        {isGenerating && (
          <div className="ia-empty-state">
            <div className="ia-loading-animation"><div className="ai-dot"/><div className="ai-dot"/><div className="ai-dot"/></div>
            <h2>Generando...</h2>
          </div>
        )}
        {result && !isGenerating && (
          <div className="ia-result-content">
            <div className="result-actions">
              <button className="btn-primary" onClick={handleSave}>💾 Guardar</button>
              <button className="btn-outline" onClick={() => setResult(null)}>🔄 Limpiar</button>
            </div>
            <div className="ia-markdown-container">
              <div className="ia-markdown">{renderMarkdown(result)}</div>
            </div>
          </div>
        )}
      </div>

      {showBiblioteca && (
        <div className="library-drawer-overlay" onClick={() => setShowBiblioteca(false)}>
          <div className="library-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle-bar" />
            <div className="drawer-content">
              <div className="drawer-header">
                <h3>☁️ Biblioteca de Ejercicios</h3>
                <button className="btn-close-drawer" onClick={() => setShowBiblioteca(false)}>✕</button>
              </div>
              <div className="exercise-list">
                {exercises.length === 0 ? <p>No hay ejercicios guardados.</p> :
                  exercises.map(ej => (
                    <div key={ej.id} className="exercise-card" onClick={() => setSelectedExerciseDetail(ej)}>
                      <div className="exercise-card-title">
                        <span className="type-tag">{ej.type === 'pizarra' ? '📋 Pizarra' : '✨ IA'}</span>
                        <span>{ej.title || 'Sin título'}</span>
                      </div>
                      <div className="exercise-card-meta">
                        <span>{new Date(ej.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedExerciseDetail && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setSelectedExerciseDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedExerciseDetail.title || 'Detalle'}</h2>
              <button className="btn-close" onClick={() => setSelectedExerciseDetail(null)}>✕</button>
            </div>
            <div className="modal-body" style={{whiteSpace:'pre-wrap', padding:'20px'}}>
              {selectedExerciseDetail.content || 'Sin contenido.'}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                setResult(selectedExerciseDetail.content);
                setSelectedExerciseDetail(null);
                setShowBiblioteca(false);
              }}>Cargar</button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
    </div>
  );
};

export default IAGeneradora;
