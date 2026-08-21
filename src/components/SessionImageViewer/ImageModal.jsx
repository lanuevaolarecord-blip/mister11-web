import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Edit3, 
  Grid, 
  Tv, 
  Columns, 
  Download, 
  Share2, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Trash2,
  Check
} from 'lucide-react';
import { AnnotationLayer } from './AnnotationLayer';
import { TacticalGridOverlay } from './TacticalGridOverlay';
import { PresentationMode } from './PresentationMode';
import { SplitViewLayout } from './SplitViewLayout';
import './SessionImageViewer.css';

export const ImageModal = ({
  isOpen = false,
  onClose,
  images = [],
  initialIndex = 0,
  exercisesData = [],
  onSaveAnnotations
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Estados de Modos
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState('pen'); // 'pen' | 'circle' | 'rect' | 'arrow' | 'cross' | 'text' | 'eraser'
  const [color, setColor] = useState('#4CAF7D');
  const [lineWidth, setLineWidth] = useState(3);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Cuadrícula táctica
  const [gridType, setGridType] = useState('none'); // 'none' | 'pitch' | 'grid10x15' | 'thirds' | 'channels'
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [referencePoints, setReferencePoints] = useState([]);

  // Modo Presentación & Split View
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [isLoop, setIsLoop] = useState(true);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Almacén de anotaciones por imagen
  const [annotationsMap, setAnnotationsMap] = useState({});

  const modalRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Sincronizar índice inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Manejo de tecla ESC y Flechas
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAnnotationMode) {
          setIsAnnotationMode(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, isAnnotationMode]);

  const currentImage = images[currentIndex] || '';
  const currentExercise = exercisesData[currentIndex] || {};
  const currentAnnotations = annotationsMap[currentIndex] || [];

  // Navegación entre imágenes
  const handlePrevImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : (isLoop ? images.length - 1 : 0)));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length, isLoop]);

  const handleNextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : (isLoop ? 0 : prev)));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length, isLoop]);

  // Controles de Zoom
  const handleZoomIn = () => setZoom(prev => Math.min(4, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Zoom con Rueda del Ratón
  const handleWheel = (e) => {
    if (isAnnotationMode) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag & Pan de la imagen con mouse/touch
  const handleMouseDown = (e) => {
    if (isAnnotationMode || zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isAnnotationMode) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Gestos táctiles de doble toque
  const lastTapRef = useRef(0);
  const handleTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Doble tap
      if (zoom === 1) {
        setZoom(2);
      } else {
        handleResetZoom();
      }
    }
    lastTapRef.current = now;
  };

  // Actualizar anotaciones de la imagen actual
  const handleUpdateAnnotations = (newAnnotations) => {
    setAnnotationsMap(prev => {
      const updated = { ...prev, [currentIndex]: newAnnotations };
      if (onSaveAnnotations) onSaveAnnotations(currentIndex, newAnnotations);
      return updated;
    });
  };

  // Pantalla Completa Nativa
  const handleToggleNativeFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().then(() => setIsNativeFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsNativeFullscreen(false)).catch(() => {});
    }
  };

  // Descarga de Imagen
  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `ejercicio_${currentIndex + 1}_mister11.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(currentImage, '_blank');
    }
  };

  // Compartir
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentExercise.name || 'Diagrama Táctico Míster11',
          text: currentExercise.description || 'Consulta este ejercicio táctico de entrenamiento.',
          url: window.location.href
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const imageElement = (
    <div
      ref={imageContainerRef}
      className={`image-viewport-wrapper ${isDragging ? 'dragging' : ''} ${zoom > 1 ? 'zoomed' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isAnnotationMode ? 'default' : zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
      }}
    >
      <div
        className="image-transform-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        <img
          src={currentImage}
          alt={currentExercise.name || `Diagrama ${currentIndex + 1}`}
          className="main-preview-image"
          draggable={false}
        />

        {/* Capa de Cuadrícula Táctica */}
        <TacticalGridOverlay
          gridType={gridType}
          opacity={gridOpacity}
          referencePoints={referencePoints}
          onAddPoint={pt => setReferencePoints(prev => [...prev, pt])}
          onRemovePoint={idx => setReferencePoints(prev => prev.filter((_, i) => i !== idx))}
          isEditPointMode={gridType !== 'none'}
        />

        {/* Capa de Anotaciones Vectoriales */}
        <AnnotationLayer
          annotations={currentAnnotations}
          onUpdateAnnotations={handleUpdateAnnotations}
          isAnnotationMode={isAnnotationMode}
          selectedTool={selectedTool}
          color={color}
          lineWidth={lineWidth}
          visible={showAnnotations}
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  const modalNode = (
    <div 
      ref={modalRef}
      className={`session-image-viewer-modal ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
    >
      {/* ── BARRA SUPERIOR DE HERRAMIENTAS ─────────────────────────────── */}
      <header className="viewer-top-toolbar">
        <div className="toolbar-left">
          <span className="image-counter-pill">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="exercise-name-label">
            {currentExercise.name || `Ejercicio ${currentIndex + 1}`}
          </span>
        </div>

        <div className="toolbar-center">
          {/* Controles de Zoom */}
          <div className="zoom-control-group">
            <button type="button" onClick={handleZoomOut} className="tool-btn" title="Alejar (Zoom -)">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-percentage-badge">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={handleZoomIn} className="tool-btn" title="Acercar (Zoom +)">
              <ZoomIn size={16} />
            </button>
            {zoom !== 1 && (
              <button type="button" onClick={handleResetZoom} className="tool-btn reset" title="Restablecer Zoom">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Toggle Anotaciones */}
          <button
            type="button"
            className={`tool-btn ${isAnnotationMode ? 'active' : ''}`}
            onClick={() => setIsAnnotationMode(!isAnnotationMode)}
            title="Activar herramientas de dibujo táctico"
          >
            <Edit3 size={16} />
            <span className="btn-text">Anotar</span>
          </button>

          {/* Toggle Cuadrícula */}
          <div className="grid-selector-wrapper">
            <button
              type="button"
              className={`tool-btn ${gridType !== 'none' ? 'active' : ''}`}
              onClick={() => {
                const types = ['none', 'pitch', 'grid10x15', 'thirds', 'channels'];
                const nextIdx = (types.indexOf(gridType) + 1) % types.length;
                setGridType(types[nextIdx]);
              }}
              title="Alternar cuadrículas tácticas"
            >
              <Grid size={16} />
              <span className="btn-text">
                {gridType === 'none' ? 'Cuadrícula' : gridType === 'pitch' ? 'Campo' : gridType === 'thirds' ? 'Tercios' : gridType === 'channels' ? 'Carriles' : '10x15'}
              </span>
            </button>
          </div>

          {/* Toggle Presentación */}
          <button
            type="button"
            className={`tool-btn ${isPresentationOpen ? 'active' : ''}`}
            onClick={() => {
              setIsPresentationOpen(!isPresentationOpen);
              if (!isPresentationOpen) setIsPlaying(true);
              else setIsPlaying(false);
            }}
            title="Modo presentación automática"
          >
            <Tv size={16} />
            <span className="btn-text">Presentación</span>
          </button>

          {/* Toggle Split View */}
          <button
            type="button"
            className={`tool-btn ${isSplitView ? 'active' : ''}`}
            onClick={() => setIsSplitView(!isSplitView)}
            title="Vista dividida (Imagen + Descripción)"
          >
            <Columns size={16} />
            <span className="btn-text">Dividir</span>
          </button>
        </div>

        <div className="toolbar-right">
          {/* Ocultar/Mostrar Anotaciones */}
          <button
            type="button"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="tool-btn icon-only"
            title={showAnnotations ? 'Ocultar anotaciones' : 'Mostrar anotaciones'}
          >
            {showAnnotations ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          {/* Cambiar Tema Claro/Oscuro */}
          <button
            type="button"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="tool-btn icon-only"
            title={isDarkTheme ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Descargar */}
          <button type="button" onClick={handleDownload} className="tool-btn icon-only" title="Descargar imagen">
            <Download size={16} />
          </button>

          {/* Compartir */}
          <button type="button" onClick={handleShare} className="tool-btn icon-only" title="Compartir">
            <Share2 size={16} />
          </button>

          {/* Imprimir */}
          <button type="button" onClick={handlePrint} className="tool-btn icon-only" title="Imprimir">
            <Printer size={16} />
          </button>

          {/* Cerrar */}
          <button type="button" onClick={onClose} className="tool-btn close-modal-btn" title="Cerrar (ESC)">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ── BARRA SECUNDARIA DE HERRAMIENTAS DE DIBUJO (Si modo activo) ── */}
      {isAnnotationMode && (
        <div className="annotation-sub-toolbar">
          <div className="tools-pills">
            {[
              { id: 'pen', label: '🖊️ Lápiz' },
              { id: 'circle', label: '⭕ Círculo' },
              { id: 'rect', label: '⬜ Rectángulo' },
              { id: 'arrow', label: '➡️ Flecha' },
              { id: 'cross', label: '✖️ Marca' },
              { id: 'text', label: '📝 Texto' },
              { id: 'eraser', label: '🧹 Borrador' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`sub-tool-btn ${selectedTool === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTool(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Selector de Color */}
          <div className="color-palette-row">
            {['#4CAF7D', '#D4A843', '#EF4444', '#3B82F6', '#FFFFFF', '#000000'].map(c => (
              <button
                key={c}
                type="button"
                className={`color-dot ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          {/* Grosor de Línea */}
          <div className="line-width-slider">
            <span className="slider-label">Grosor: {lineWidth}px</span>
            <input
              type="range"
              min="1"
              max="8"
              value={lineWidth}
              onChange={e => setLineWidth(Number(e.target.value))}
            />
          </div>

          {/* Botón Borrar Todo */}
          <button
            type="button"
            className="clear-all-annotations-btn"
            onClick={() => handleUpdateAnnotations([])}
            title="Borrar todas las anotaciones"
          >
            <Trash2 size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      )}

      {/* ── CUERPO PRINCIPAL DEL VISOR (NORMAL O SPLIT VIEW) ───────────── */}
      <main className="viewer-viewport-content">
        {/* Flecha Izquierda */}
        {images.length > 1 && (
          <button type="button" onClick={handlePrevImage} className="nav-arrow left" title="Anterior imagen (←)">
            <ChevronLeft size={28} />
          </button>
        )}

        {isSplitView ? (
          <SplitViewLayout
            exerciseData={currentExercise}
            imageElement={imageElement}
          />
        ) : (
          imageElement
        )}

        {/* Flecha Derecha */}
        {images.length > 1 && (
          <button type="button" onClick={handleNextImage} className="nav-arrow right" title="Siguiente imagen (→)">
            <ChevronRight size={28} />
          </button>
        )}
      </main>

      {/* ── BARRA DE MODO PRESENTACIÓN ─────────────────────────────────── */}
      {isPresentationOpen && (
        <PresentationMode
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStop={() => {
            setIsPlaying(false);
            setIsPresentationOpen(false);
          }}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          intervalSeconds={intervalSeconds}
          onChangeInterval={setIntervalSeconds}
          isLoop={isLoop}
          onToggleLoop={() => setIsLoop(!isLoop)}
          currentIndex={currentIndex}
          totalImages={images.length}
          isFullscreen={isNativeFullscreen}
          onToggleFullscreen={handleToggleNativeFullscreen}
        />
      )}

      {/* ── CARRUSEL DE MINIATURAS INFERIOR ────────────────────────────── */}
      {images.length > 1 && !isPresentationOpen && (
        <footer className="viewer-bottom-carousel">
          <div className="thumbnails-track">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`thumbnail-card ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <img src={img} alt={`Miniatura ${idx + 1}`} />
                <span className="thumb-idx">{idx + 1}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode;
};
