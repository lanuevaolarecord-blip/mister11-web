import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Maximize2, Minimize2, ChevronLeft, ChevronRight, Clock, Repeat } from 'lucide-react';

export const PresentationMode = ({
  isPlaying = false,
  onTogglePlay,
  onStop,
  onNext,
  onPrev,
  intervalSeconds = 10,
  onChangeInterval,
  isLoop = true,
  onToggleLoop,
  currentIndex = 0,
  totalImages = 1,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);

  // Barra de progreso animada durante el auto-play
  useEffect(() => {
    if (isPlaying) {
      setProgress(0);
      const stepMs = 100;
      const totalSteps = (intervalSeconds * 1000) / stepMs;
      let currentStep = 0;

      progressTimerRef.current = setInterval(() => {
        currentStep++;
        setProgress(Math.min(100, (currentStep / totalSteps) * 100));
        if (currentStep >= totalSteps) {
          clearInterval(progressTimerRef.current);
          if (onNext) onNext();
        }
      }, stepMs);
    } else {
      setProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, currentIndex, intervalSeconds, onNext]);

  return (
    <div className="presentation-mode-bar">
      {/* Barra de progreso de auto-play */}
      {isPlaying && (
        <div className="presentation-progress-track">
          <div className="presentation-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="presentation-controls-row">
        {/* Play / Pausa / Stop */}
        <div className="controls-group">
          <button
            type="button"
            className={`pres-btn main-play ${isPlaying ? 'pause' : 'play'}`}
            onClick={onTogglePlay}
            title={isPlaying ? 'Pausar presentación' : 'Iniciar presentación automática'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pausa' : 'Auto-Play'}</span>
          </button>

          <button
            type="button"
            className="pres-btn"
            onClick={onStop}
            title="Detener presentación"
          >
            <Square size={16} />
          </button>
        </div>

        {/* Navegación manual */}
        <div className="controls-group">
          <button
            type="button"
            className="pres-btn nav"
            onClick={onPrev}
            disabled={!isLoop && currentIndex === 0}
            title="Anterior ejercicio"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="pres-counter">
            {currentIndex + 1} / {totalImages}
          </span>

          <button
            type="button"
            className="pres-btn nav"
            onClick={onNext}
            disabled={!isLoop && currentIndex === totalImages - 1}
            title="Siguiente ejercicio"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Intervalo de Tiempo y Opciones */}
        <div className="controls-group options">
          <div className="interval-selector">
            <Clock size={14} />
            <select
              value={intervalSeconds}
              onChange={e => onChangeInterval && onChangeInterval(Number(e.target.value))}
            >
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
            </select>
          </div>

          <button
            type="button"
            className={`pres-btn loop ${isLoop ? 'active' : ''}`}
            onClick={onToggleLoop}
            title={isLoop ? 'Bucle infinito activo' : 'Repetición desactivada'}
          >
            <Repeat size={16} />
          </button>

          <button
            type="button"
            className="pres-btn fullscreen"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa nativa'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
