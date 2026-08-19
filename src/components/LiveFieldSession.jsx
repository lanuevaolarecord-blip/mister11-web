import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronLeft, ChevronRight, Split, Check, X, Maximize2 } from 'lucide-react';
import { ImageModal } from './SessionImageViewer/ImageModal';
import './LiveFieldSession.css';

const LiveFieldSession = ({ session, onClose }) => {
  const blocks = session?.blocks || session?.bloques || [];
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const activeBlock = blocks[activeBlockIndex] || null;

  // Configuración de Series / Repeticiones
  const [splitCount, setSplitCount] = useState(1); // Número de series (ej. 3)
  const [currentSplit, setCurrentSplit] = useState(1); // Serie actual (1..splitCount)
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [tempSplitInput, setTempSplitInput] = useState('3');
  const [showViewer, setShowViewer] = useState(false);

  // Extraer todas las imágenes y datos de ejercicios de los bloques para el visor
  const sessionImages = blocks.map(b => b.imageUrl || b.imagenProtocolo || b.image || b.photo || b.previewUrl).filter(Boolean);
  const sessionExercises = blocks.filter(b => b.imageUrl || b.imagenProtocolo || b.image || b.photo || b.previewUrl);

  // Estado del Cronómetro (en segundos)
  const totalBlockMinutes = Number(activeBlock?.duration || activeBlock?.duracion || activeBlock?.tiempo) || 15;
  const totalBlockSeconds = Math.max(1, Math.round((totalBlockMinutes * 60) / splitCount));
  
  const [timeLeft, setTimeLeft] = useState(totalBlockSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef(null);
  const lastSpokenRef = useRef(null);

  // Recalcular tiempo al cambiar de bloque o número de series
  useEffect(() => {
    const splitMinutes = totalBlockMinutes / splitCount;
    const initialSeconds = Math.max(1, Math.round(splitMinutes * 60));
    setTimeLeft(initialSeconds);
    setIsRunning(false);
    setCurrentSplit(1);
    lastSpokenRef.current = null;
  }, [activeBlockIndex, splitCount, totalBlockMinutes]);

  // Motor del Cronómetro y Anuncio por Voz
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            speakText('¡Tiempo! Fin del ejercicio.');
            return 0;
          }

          const nextSec = prev - 1;

          // Anuncio por voz en los últimos 5 segundos
          if (soundEnabled && nextSec <= 5 && nextSec > 0 && lastSpokenRef.current !== nextSec) {
            lastSpokenRef.current = nextSec;
            const numberWords = { 5: 'Cinco', 4: 'Cuatro', 3: 'Tres', 2: 'Dos', 1: 'Uno' };
            if (numberWords[nextSec]) {
              speakText(numberWords[nextSec]);
            }
          }

          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  // Función para síntesis de voz (Web Speech API)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancelar locución anterior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.1; // Velocidad dinámica ligera
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Error en síntesis de voz:', e);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!isRunning && timeLeft <= 0) {
      // Si llegó a cero, reiniciar
      const initialSeconds = Math.max(1, Math.round((totalBlockMinutes * 60) / splitCount));
      setTimeLeft(initialSeconds);
      lastSpokenRef.current = null;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    const initialSeconds = Math.max(1, Math.round((totalBlockMinutes * 60) / splitCount));
    setTimeLeft(initialSeconds);
    lastSpokenRef.current = null;
  };

  const handleNextSplit = () => {
    if (currentSplit < splitCount) {
      setCurrentSplit(prev => prev + 1);
      const initialSeconds = Math.max(1, Math.round((totalBlockMinutes * 60) / splitCount));
      setTimeLeft(initialSeconds);
      setIsRunning(false);
      lastSpokenRef.current = null;
    }
  };

  const handleApplySplit = () => {
    const count = parseInt(tempSplitInput, 10);
    if (!isNaN(count) && count >= 1 && count <= 10) {
      setSplitCount(count);
      setSplitModalOpen(false);
    }
  };

  const blockImg = activeBlock?.imageUrl || activeBlock?.imagenProtocolo || activeBlock?.image || activeBlock?.photo || activeBlock?.previewUrl;

  return (
    <div className="live-field-modal">
      <header className="live-field-header">
        <button className="btn-field-back" onClick={onClose}>
          <ChevronLeft size={24} /> Volver a Sesión
        </button>
        <div className="live-header-title">
          <h2>⏱️ Modo Campo de Entrenamiento</h2>
          <span className="live-session-name">{session?.title || session?.nombre || 'Sesión'}</span>
        </div>
        <button 
          className={`btn-sound-toggle ${soundEnabled ? 'active' : ''}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Voz activada' : 'Voz silenciada'}
        >
          {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </header>

      {/* Selector Táctil de Bloques (Android Navigation Bar) */}
      <div className="live-blocks-nav">
        {blocks.map((b, bi) => (
          <button
            key={b.id || bi}
            className={`block-tab-btn ${bi === activeBlockIndex ? 'active' : ''}`}
            onClick={() => setActiveBlockIndex(bi)}
          >
            <span className="tab-num">{bi + 1}</span>
            <span className="tab-name">{b.name || b.nombre || `Bloque ${bi + 1}`}</span>
            <span className="tab-time">{b.duration || b.duracion || 15} min</span>
          </button>
        ))}
      </div>

      <div className="live-field-content">
        {/* LADO IZQUIERDO: Cronómetro y Controles Gigantes para Tablet/Móvil */}
        <div className="live-timer-card">
          <div className="split-info-bar">
            <div className="split-badge">
              <span>Serie {currentSplit} / {splitCount}</span>
              <span className="split-dur">({Math.round(totalBlockMinutes / splitCount)} min / serie)</span>
            </div>
            <button className="btn-split-edit" onClick={() => { setTempSplitInput(String(splitCount)); setSplitModalOpen(true); }}>
              <Split size={16} /> Dividir Serie
            </button>
          </div>

          <div className={`digital-timer-display ${timeLeft <= 10 && timeLeft > 0 ? 'warning-pulse' : ''} ${timeLeft === 0 ? 'time-over' : ''}`}>
            {formatTime(timeLeft)}
          </div>

          <div className="live-timer-controls">
            <button className="btn-timer-reset" onClick={handleReset} title="Reiniciar">
              <RotateCcw size={28} />
            </button>

            <button className={`btn-timer-main ${isRunning ? 'pause' : 'play'}`} onClick={handlePlayPause}>
              {isRunning ? <Pause size={36} /> : <Play size={36} style={{ marginLeft: '4px' }} />}
            </button>

            {splitCount > 1 && currentSplit < splitCount && (
              <button className="btn-timer-next-split" onClick={handleNextSplit} title="Siguiente Serie">
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Detalle del Ejercicio & Diagrama Táctico */}
        <div className="live-exercise-card">
          <div className="exercise-header">
            <h3>{activeBlock?.name || activeBlock?.nombre || `Bloque ${activeBlockIndex + 1}`}</h3>
            <span className="exercise-type-tag">{activeBlock?.type || activeBlock?.tipo || 'General'}</span>
          </div>

          {activeBlock?.description || activeBlock?.descripcion ? (
            <p className="exercise-desc">{activeBlock.description || activeBlock.descripcion}</p>
          ) : (
            <p className="exercise-desc empty">Sin descripción para este bloque.</p>
          )}

          {blockImg ? (
            <div className="exercise-img-wrapper" style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setShowViewer(true)}>
              <img src={blockImg} alt={activeBlock?.name || 'Diagrama'} />
              <button
                type="button"
                className="btn-maximize-exercise-img"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewer(true);
                }}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.75)',
                  color: '#FFFFFF',
                  border: '1px solid #D4A843',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <Maximize2 size={16} />
                <span>Pantalla Completa</span>
              </button>
            </div>
          ) : (
            <div className="exercise-img-empty">
              <span>🎨 Sin captura ni diagrama de pizarra táctica</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DEL VISOR PROFESIONAL DE PANTALLA COMPLETA */}
      {showViewer && sessionImages.length > 0 && (
        <ImageModal
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          images={sessionImages}
          initialIndex={Math.max(0, sessionImages.indexOf(blockImg))}
          exercisesData={sessionExercises}
        />
      )}

      {/* MODAL PARA DIVIDIR TIEMPO EN SERIES (INTERVAL SPLITTER) */}
      {splitModalOpen && (
        <div className="modal-overlay-field">
          <div className="modal-card-field">
            <h3>⏱️ Dividir Ejercicio en Series</h3>
            <p>Duración total del bloque: <strong>{totalBlockMinutes} minutos</strong></p>
            <p className="subtext">Selecciona en cuántas series deseas dividir el tiempo del ejercicio:</p>

            <div className="split-options-grid">
              {[1, 2, 3, 4, 5].map(num => {
                const minsPerSplit = (totalBlockMinutes / num).toFixed(1);
                return (
                  <button
                    key={num}
                    className={`split-opt-btn ${parseInt(tempSplitInput, 10) === num ? 'selected' : ''}`}
                    onClick={() => setTempSplitInput(String(num))}
                  >
                    <span className="opt-num">{num} {num === 1 ? 'Serie' : 'Series'}</span>
                    <span className="opt-desc">{minsPerSplit} min / serie</span>
                  </button>
                );
              })}
            </div>

            <div className="modal-actions-field">
              <button className="btn-cancel-field" onClick={() => setSplitModalOpen(false)}>Cancelar</button>
              <button className="btn-confirm-field" onClick={handleApplySplit}><Check size={18} /> Aplicar División</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFieldSession;
