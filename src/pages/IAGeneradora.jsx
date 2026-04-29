import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import './IAGeneradora.css';

// --- CONFIGURACIÓN --- (La key se accede en runtime, no al importar el módulo)
// IMPORTANTE: VITE_GEMINI_API_KEY debe estar configurada en Vercel → Settings → Environment Variables

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

// Función para dibujar diagrama dinámico según el ejercicio
const dibujarDiagrama = (canvas, textoEjercicio) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo campo de fútbol simplificado
  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Líneas del campo
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  // Borde
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  // Línea central
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();
  // Círculo central
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
  ctx.stroke();

  // Detectar número de jugadores mencionados en el texto
  const matchJugadores = textoEjercicio.match(/(\d+)\s*(jugador|jugadores|vs|contra)/i);
  const numJugadores = matchJugadores ? Math.min(parseInt(matchJugadores[1]), 11) : 6;

  // Detectar tipo de ejercicio para posicionar jugadores
  const esRondo = /rondo|posesión|toque/i.test(textoEjercicio);
  const esPorteria = /portería|portero|disparo|tiro|finalización/i.test(textoEjercicio);
  const esPresion = /presión|pressing|recuperación/i.test(textoEjercicio);

  // Posiciones base según tipo
  let posiciones = [];
  if (esRondo) {
    // Círculo de jugadores
    for (let i = 0; i < numJugadores; i++) {
      const angle = (i / numJugadores) * Math.PI * 2;
      posiciones.push({
        x: canvas.width/2 + Math.cos(angle) * 70,
        y: canvas.height/2 + Math.sin(angle) * 55,
        color: i === 0 ? '#E74C3C' : '#c9a84c'
      });
    }
  } else if (esPorteria) {
    // Jugadores orientados a portería
    posiciones = [
      { x: canvas.width*0.2, y: canvas.height*0.5, color: '#c9a84c' },
      { x: canvas.width*0.4, y: canvas.height*0.35, color: '#c9a84c' },
      { x: canvas.width*0.4, y: canvas.height*0.65, color: '#c9a84c' },
      { x: canvas.width*0.65, y: canvas.height*0.5, color: '#c9a84c' },
      { x: canvas.width*0.85, y: canvas.height*0.5, color: '#3498DB' },
    ];
  } else {
    // Disposición genérica en líneas
    const cols = Math.ceil(numJugadores / 2);
    for (let i = 0; i < numJugadores; i++) {
      posiciones.push({
        x: canvas.width * (0.2 + (i % cols) * (0.6 / cols)),
        y: canvas.height * (i < cols ? 0.3 : 0.65),
        color: '#c9a84c'
      });
    }
  }

  // Dibujar jugadores
  posiciones.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, p.x, p.y);
  });

  // Flecha de movimiento central si hay ejercicio de presión
  if (esPresion) {
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(posiciones[0]?.x || canvas.width*0.3, posiciones[0]?.y || canvas.height*0.5);
    ctx.lineTo(canvas.width*0.6, canvas.height*0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

const IAGeneradora = () => {
  const { exercises, addExercise } = useExercises();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const canvasRef = useRef(null);
  const isCallingRef = useRef(false);
  const [countdown, setCountdown] = useState(null);

  // Verificar API Key al montar
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiKeyMissing = !apiKey || apiKey === 'undefined';

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      handleGenerate(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (result && canvasRef.current) {
      dibujarDiagrama(canvasRef.current, result);
    }
  }, [result]);

  const toggleMaterial = (id) => {
    setForm(prev => ({
      ...prev,
      materiales: prev.materiales.includes(id)
        ? prev.materiales.filter(m => m !== id)
        : [...prev.materiales, id]
    }));
  };

  const handleGenerate = async (isRetryOption) => {
    const isRetry = isRetryOption === true;
    if (isCallingRef.current && !isRetry) return;
    
    if (!form.edad || !form.objetivo || !form.espacio) {
      setError('Por favor completa: Edad, Objetivo y Espacio antes de generar.');
      return;
    }
    
    isCallingRef.current = true;
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

    try {
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
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(isRetry ? '429_LIMIT' : '429_RETRY');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Respuesta vacía de Gemini');
      setResult(text);
    } catch (err) {
      console.error('Error Gemini:', err);
      if (err.message === '429_RETRY') {
        setError('Has realizado demasiadas solicitudes. Espera 30 segundos e inténtalo de nuevo.');
        setCountdown(30);
      } else if (err.message === '429_LIMIT') {
        setError('Límite de solicitudes alcanzado. Espera unos minutos antes de generar otro ejercicio.');
      } else {
        setError('No se pudo generar el ejercicio. Verifica tu conexión o la clave API.');
      }
    } finally {
      setLoading(false);
      isCallingRef.current = false;
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
      {/* Banner de error de configuración */}
      {apiKeyMissing && (
        <div style={{
          background: '#FDEDEC', color: '#C0392B', border: '1px solid #E74C3C',
          borderRadius: 8, padding: '12px 16px', margin: 16, fontSize: 13,
          fontWeight: 600
        }}>
          ⚠️ La clave de API de Gemini no está configurada. Contacta al administrador
          o configura la variable <code>VITE_GEMINI_API_KEY</code> en Vercel.
        </div>
      )}
      <div className="ia-form-panel">
        <div className="ia-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>✨ IA Generadora</h1>
            <p>Configura los parámetros y genera ejercicios de entrenamiento personalizados con Gemini AI.</p>
          </div>
          <button
            onClick={() => setShowBiblioteca(true)}
            style={{
              background: 'transparent', border: '1.5px solid #c9a84c', color: '#c9a84c',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
            }}
          >
            ☁️ Biblioteca ({exercises.length})
          </button>
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

          {error && <div className="ia-error" style={{
              background: '#FDEDEC', color: '#C0392B', border: '1px solid #E74C3C',
              borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 13
            }}>
              ⚠️ {error}
              {countdown !== null && <div style={{ marginTop: 6, fontWeight: 'bold' }}>Reintentando en {countdown} segundos...</div>}
            </div>}

          <button 
            className={`btn-generate ${loading ? 'loading' : ''}`}
            onClick={handleGenerate} 
            disabled={loading || countdown !== null || form.espacio === '' || form.espacio === null || form.espacio === undefined}
            style={{ opacity: (loading || countdown !== null) ? 0.65 : 1, cursor: (loading || countdown !== null) ? 'not-allowed' : 'pointer', pointerEvents: (loading || countdown !== null) ? 'none' : 'auto' }}
          >
            {loading ? '⏳ Analizando contexto...' : '✨ Generar Ejercicio'}
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
            <div style={{
              flex: 1,
              minHeight: 320,
              maxHeight: '60vh',
              overflowY: 'auto',
              background: '#0f1a0f',
              border: '1px solid #2d4a2d',
              borderRadius: 12,
              padding: '16px 20px',
              marginTop: 12,
              lineHeight: 1.7,
              fontSize: 14,
              color: '#e0e0e0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {renderMarkdown(result) || (
                <span style={{ color: '#555', fontStyle: 'italic' }}>
                  El ejercicio generado aparecerá aquí...
                </span>
              )}
            </div>

            {/* DIAGRAMA AUTOMÁTICO */}
            <canvas
              ref={canvasRef}
              width={420}
              height={280}
              style={{ borderRadius: 12, width: '100%', display: result ? 'block' : 'none', marginTop: 12 }}
            />
          </div>
        )}
      </div>

      {/* Drawer Biblioteca */}
      {showBiblioteca && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, display: 'flex', alignItems: 'flex-end'
          }}
          onClick={() => setShowBiblioteca(false)}
        >
          <div
            style={{
              width: '100%', maxHeight: '75vh', background: '#1a2e1a',
              borderRadius: '16px 16px 0 0', overflowY: 'auto', padding: '0 0 24px 0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 40, height: 4, background: '#c9a84c44',
              borderRadius: 2, margin: '12px auto'
            }} />
            <div style={{ padding: '0 16px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12
              }}>
                <h3 style={{ color: '#c9a84c', margin: 0, fontSize: 15 }}>
                  ☁️ Biblioteca de Ejercicios
                </h3>
                <button
                  onClick={() => setShowBiblioteca(false)}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}
                >✕</button>
              </div>
              {exercises.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', marginTop: 24 }}>
                  No hay ejercicios guardados aún.
                </p>
              ) : (
                exercises.map((ej) => (
                  <div key={ej.id} style={{
                    background: '#0f1a0f', border: '1px solid #2d4a2d',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 8, cursor: 'pointer'
                  }}
                    onClick={() => { 
                      if (ej.type === 'pizarra') {
                        navigate(`/pizarra?id=${ej.id}`);
                      } else {
                        setResult(ej.content); 
                        setShowBiblioteca(false); 
                      }
                    }}
                  >
                    <div style={{ color: '#c9a84c', fontWeight: 600, fontSize: 13 }}>
                      {ej.type === 'pizarra' ? '📋 Pizarra - ' : '✨ IA - '} {ej.title || 'Sin título'}
                    </div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                      {new Date(ej.timestamp).toLocaleDateString()} · {ej.type === 'pizarra' ? 'Interactivo' : 'Texto'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
