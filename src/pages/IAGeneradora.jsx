import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import ExerciseDiagram from '../components/ExerciseDiagram';
import './IAGeneradora.css';

// --- CONFIGURACIÓN ---
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

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

// Helper para renderizar markdown simple a JSX
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
  const { exercises, addExercise } = useExercises();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMaterial = (id) => {
    setForm(prev => ({
      ...prev,
      materiales: prev.materiales.includes(id)
        ? prev.materiales.filter(m => m !== id)
        : [...prev.materiales, id]
    }));
  };

  const handleGenerate = async () => {
    if (!form.edad || !form.objetivo || !form.espacio) {
      setError('Por favor completa: Edad, Objetivo y Espacio antes de generar.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const materialesStr = form.materiales.length > 0
      ? MATERIALES.filter(m => form.materiales.includes(m.id)).map(m => m.label).join(', ')
      : 'Sin material específico';

    const prompt = `Eres experto en metodología del fútbol formativo. Genera UN ejercicio con este formato markdown:
## Nombre del ejercicio
**Objetivo:** ...
**Organización:** ...
**Desarrollo:** ...
**Reglas:** ...
**Variantes:** (2-3 variantes)
**Puntos de coaching:** (lista 3-5 puntos)
**Descripción del diagrama:** (posiciones con A=atacantes, D=defensores, P=portero, →=movimiento)

Parámetros: edad ${form.edad}, ${form.jugadores} jugadores, objetivo ${form.objetivo}, ${form.duracion} min, material: ${materialesStr}, espacio: ${form.espacio}, intensidad: ${form.intensidad}.
${form.observaciones ? `Observaciones adicionales: ${form.observaciones}` : ''}
Responde SOLO en español. No incluyas texto fuera del formato indicado.`;

    const makeRequest = async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        // Lanzamos el error con el mensaje exacto de Google
        throw new Error(data.error?.message || JSON.stringify(data));
      }
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('La respuesta de la IA no contiene texto válido.');
      }

      return data.candidates[0].content.parts[0].text;
    };

    try {
      try {
        const text = await makeRequest();
        setResult(text);
      } catch (firstErr) {
        console.warn("Primer intento fallido, reintentando en 2s...", firstErr);
        await new Promise(res => setTimeout(res, 2000));
        const text = await makeRequest();
        setResult(text);
      }
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);

  const handleSave = async () => {
    if (!result) return;
    const firstLine = result.split('\n')[0].replace('## ', '').trim();
    
    try {
      await addExercise({
        title: firstLine,
        content: result,
        parameters: { ...form },
        timestamp: new Date().toISOString()
      });
      alert(`✅ Ejercicio "${firstLine}" guardado en tu biblioteca.`);
    } catch (error) {
      alert("Error al guardar en la biblioteca.");
    }
  };

  return (
    <div className="ia-page">
      <div className="ia-form-panel">
        <div className="ia-form-header">
          <h1>✨ IA Generadora</h1>
          <p>Configura los parámetros y genera ejercicios de entrenamiento personalizados con Gemini AI.</p>
        </div>

        <div className="ia-form-body">
          <div className="ia-field">
            <label>Categoría / Edad</label>
            <select value={form.edad} onChange={e => setForm({...form, edad: e.target.value})}>
              <option value="">Selecciona una categoría...</option>
              {EDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="ia-field">
            <label>Nº de Jugadores: <strong>{form.jugadores}</strong></label>
            <input
              type="range" min="4" max="22" value={form.jugadores}
              onChange={e => setForm({...form, jugadores: Number(e.target.value)})}
              className="ia-slider"
            />
            <div className="slider-labels"><span>4</span><span>22</span></div>
          </div>

          <div className="ia-field">
            <label>Objetivo Principal</label>
            <select value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})}>
              <option value="">Selecciona un objetivo...</option>
              {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="ia-field">
            <label>Duración</label>
            <div className="chip-group">
              {DURACIONES.map(d => (
                <button key={d} className={`chip ${form.duracion === d ? 'active' : ''}`}
                  onClick={() => setForm({...form, duracion: d})}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="ia-field">
            <label>Material Disponible</label>
            <div className="chip-group">
              {MATERIALES.map(m => (
                <button key={m.id} className={`chip ${form.materiales.includes(m.id) ? 'active' : ''}`}
                  onClick={() => toggleMaterial(m.id)}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ia-field">
            <label>Espacio de Trabajo</label>
            <div className="chip-group">
              {ESPACIOS.map(e => (
                <button key={e} className={`chip ${form.espacio === e ? 'active' : ''}`}
                  onClick={() => setForm({...form, espacio: e})}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="ia-field">
            <label>Intensidad</label>
            <div className="chip-group">
              {INTENSIDADES.map(i => (
                <button key={i} className={`chip ${form.intensidad === i ? 'active' : ''}`}
                  onClick={() => setForm({...form, intensidad: i})}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="ia-field">
            <label>Observaciones (opcional)</label>
            <textarea
              rows="3"
              placeholder="Ej: El portero no puede salir del área. Quiero que trabajen el pressing alto..."
              value={form.observaciones}
              onChange={e => setForm({...form, observaciones: e.target.value})}
            />
          </div>

          {error && <div className="ia-error">{error}</div>}

          <button 
            className="btn-generate" 
            onClick={handleGenerate} 
            disabled={loading || form.espacio === '' || form.espacio === null || form.espacio === undefined}
          >
            {loading ? (
              <><span className="spinner"></span> Generando ejercicio...</>
            ) : (
              <>✨ Generar Ejercicio</>
            )}
          </button>
        </div>
      </div>

      <div className="ia-result-panel">
        {!result && !loading && (
          <div className="ia-empty-state">
            <div className="empty-icon">✨</div>
            <h2>Tu ejercicio aparecerá aquí</h2>
            <p>Configura los parámetros del lado izquierdo y pulsa "Generar Ejercicio" para que la IA cree un entrenamiento personalizado.</p>
          </div>
        )}

        {loading && (
          <div className="ia-empty-state">
            <div className="ia-loading-animation">
              <div className="ai-dot"></div>
              <div className="ai-dot"></div>
              <div className="ai-dot"></div>
            </div>
            <h2>Analizando parámetros...</h2>
            <p>Gemini AI está diseñando tu ejercicio de entrenamiento personalizado.</p>
          </div>
        )}

        {result && !loading && (
          <div className="ia-result-content">
            <div className="result-actions">
              <button className="btn-primary" onClick={handleSave}>💾 Guardar en Biblioteca</button>
              <button className="btn-outline" onClick={() => { setResult(null); }}>🔄 Limpiar</button>
              <button className="btn-outline-gold" onClick={handleGenerate}>✨ Regenerar</button>
            </div>
            <div className="result-markdown">
              {renderMarkdown(result)}
            </div>

            {/* DIAGRAMA AUTOMÁTICO */}
            {form.espacio && form.espacio !== 'Sala / Gimnasio' && (
              <ExerciseDiagram
                espacio={form.espacio}
                jugadores={form.jugadores}
                resultText={result}
              />
            )}
          </div>
        )}

        {exercises.length > 0 && (
          <div className="saved-exercises">
            <h3>📚 Biblioteca en la Nube ({exercises.length})</h3>
            <div className="saved-list">
              {exercises.map(ex => (
                <div key={ex.id} className="saved-item" onClick={() => {
                  if (ex.type === 'pizarra') {
                    navigate(`/pizarra?id=${ex.id}`);
                  } else {
                    setSelectedExerciseDetail(ex);
                  }
                }}>
                  <div className="saved-item-info">
                    <strong>{ex.type === 'pizarra' ? '📋 Pizarra' : '✨ IA'} - {ex.title}</strong>
                    <span className="preview-text">
                      {ex.type === 'pizarra' 
                        ? `Ejercicio táctico interactivo con ${ex.framesCount || 1} frames.`
                        : `${ex.content?.substring(0, 100)}...`}
                    </span>
                  </div>
                  <span className="saved-hint">{ex.type === 'pizarra' ? 'Editar →' : 'Ver →'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Ejercicio */}
      {selectedExerciseDetail && (
        <div className="ia-modal-overlay" onClick={() => setSelectedExerciseDetail(null)}>
          <div className="ia-modal-container" onClick={e => e.stopPropagation()}>
            <div className="ia-modal-header">
              <h2>{selectedExerciseDetail.title}</h2>
              <button className="btn-close-modal" onClick={() => setSelectedExerciseDetail(null)}>×</button>
            </div>
            <div className="ia-modal-body">
              <div className="result-markdown">
                {renderMarkdown(selectedExerciseDetail.content)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAGeneradora;
