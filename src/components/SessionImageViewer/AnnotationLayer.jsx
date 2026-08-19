import React, { useState, useRef } from 'react';

export const AnnotationLayer = ({
  annotations = [],
  onUpdateAnnotations,
  isAnnotationMode = false,
  selectedTool = 'pen', // 'pen' | 'circle' | 'rect' | 'arrow' | 'cross' | 'text' | 'eraser'
  color = '#4CAF7D',
  lineWidth = 3,
  opacity = 1.0,
  visible = true
}) => {
  const [currentShape, setCurrentShape] = useState(null);
  const [textInputPos, setTextInputPos] = useState(null);
  const [inputText, setInputText] = useState('');
  const svgRef = useRef(null);

  if (!visible) return null;

  const getSvgCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  };

  const handlePointerDown = (e) => {
    if (!isAnnotationMode) return;
    e.preventDefault();
    const { x, y } = getSvgCoordinates(e);

    if (selectedTool === 'text') {
      setTextInputPos({ x, y });
      setInputText('');
      return;
    }

    if (selectedTool === 'cross') {
      const newCross = {
        id: `ann-${Date.now()}`,
        type: 'cross',
        x,
        y,
        color,
        lineWidth,
        opacity
      };
      onUpdateAnnotations([...annotations, newCross]);
      return;
    }

    if (selectedTool === 'eraser') {
      return;
    }

    setCurrentShape({
      id: `ann-${Date.now()}`,
      type: selectedTool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      points: selectedTool === 'pen' ? [{ x, y }] : undefined,
      color,
      lineWidth,
      opacity
    });
  };

  const handlePointerMove = (e) => {
    if (!isAnnotationMode || !currentShape) return;
    e.preventDefault();
    const { x, y } = getSvgCoordinates(e);

    if (currentShape.type === 'pen') {
      setCurrentShape(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }));
    } else {
      setCurrentShape(prev => ({
        ...prev,
        endX: x,
        endY: y
      }));
    }
  };

  const handlePointerUp = () => {
    if (!isAnnotationMode || !currentShape) return;
    onUpdateAnnotations([...annotations, currentShape]);
    setCurrentShape(null);
  };

  const handleSaveText = () => {
    if (textInputPos && inputText.trim()) {
      const newText = {
        id: `ann-${Date.now()}`,
        type: 'text',
        x: textInputPos.x,
        y: textInputPos.y,
        text: inputText.trim(),
        color,
        lineWidth,
        opacity
      };
      onUpdateAnnotations([...annotations, newText]);
    }
    setTextInputPos(null);
    setInputText('');
  };

  const handleAnnotationClick = (id, e) => {
    if (selectedTool === 'eraser') {
      e.stopPropagation();
      onUpdateAnnotations(annotations.filter(a => a.id !== id));
    }
  };

  return (
    <div className="annotation-layer-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: isAnnotationMode ? 'auto' : 'none', zIndex: 20 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="annotation-svg"
        preserveAspectRatio="none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ width: '100%', height: '100%', cursor: isAnnotationMode ? (selectedTool === 'eraser' ? 'not-allowed' : 'crosshair') : 'default' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill={color} />
          </marker>
        </defs>

        {/* ── Renderizado de Formas Guardadas ──────────────────────────── */}
        {annotations.map((shape) => {
          const stroke = shape.color || color;
          const sw = shape.lineWidth || lineWidth;
          const op = shape.opacity !== undefined ? shape.opacity : 1.0;

          if (shape.type === 'pen' && shape.points && shape.points.length > 1) {
            const d = shape.points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
            return (
              <path
                key={shape.id}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={sw * 0.4}
                strokeOpacity={op}
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={(e) => handleAnnotationClick(shape.id, e)}
                style={{ pointerEvents: 'auto' }}
              />
            );
          }

          if (shape.type === 'circle') {
            const cx = (shape.startX + shape.endX) / 2;
            const cy = (shape.startY + shape.endY) / 2;
            const r = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2)) / 2;
            return (
              <circle
                key={shape.id}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={sw * 0.4}
                strokeOpacity={op}
                onClick={(e) => handleAnnotationClick(shape.id, e)}
                style={{ pointerEvents: 'auto' }}
              />
            );
          }

          if (shape.type === 'rect') {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const w = Math.abs(shape.endX - shape.startX);
            const h = Math.abs(shape.endY - shape.startY);
            return (
              <rect
                key={shape.id}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="none"
                stroke={stroke}
                strokeWidth={sw * 0.4}
                strokeOpacity={op}
                onClick={(e) => handleAnnotationClick(shape.id, e)}
                style={{ pointerEvents: 'auto' }}
              />
            );
          }

          if (shape.type === 'arrow') {
            return (
              <line
                key={shape.id}
                x1={shape.startX}
                y1={shape.startY}
                x2={shape.endX}
                y2={shape.endY}
                stroke={stroke}
                strokeWidth={sw * 0.5}
                strokeOpacity={op}
                markerEnd="url(#arrowhead)"
                onClick={(e) => handleAnnotationClick(shape.id, e)}
                style={{ pointerEvents: 'auto' }}
              />
            );
          }

          if (shape.type === 'cross') {
            const size = 3;
            return (
              <g key={shape.id} onClick={(e) => handleAnnotationClick(shape.id, e)} style={{ pointerEvents: 'auto' }}>
                <line x1={shape.x - size} y1={shape.y - size} x2={shape.x + size} y2={shape.y + size} stroke={stroke} strokeWidth={sw * 0.5} strokeOpacity={op} strokeLinecap="round" />
                <line x1={shape.x + size} y1={shape.y - size} x2={shape.x - size} y2={shape.y + size} stroke={stroke} strokeWidth={sw * 0.5} strokeOpacity={op} strokeLinecap="round" />
              </g>
            );
          }

          if (shape.type === 'text') {
            return (
              <text
                key={shape.id}
                x={shape.x}
                y={shape.y}
                fill={stroke}
                fillOpacity={op}
                fontSize="4.5"
                fontWeight="bold"
                onClick={(e) => handleAnnotationClick(shape.id, e)}
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
              >
                {shape.text}
              </text>
            );
          }

          return null;
        })}

        {/* ── Forma en proceso de dibujo ───────────────────────────────── */}
        {currentShape && (
          <>
            {currentShape.type === 'pen' && currentShape.points && (
              <path
                d={currentShape.points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
                fill="none"
                stroke={currentShape.color}
                strokeWidth={currentShape.lineWidth * 0.4}
                strokeOpacity={currentShape.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {currentShape.type === 'circle' && (
              <circle
                cx={(currentShape.startX + currentShape.endX) / 2}
                cy={(currentShape.startY + currentShape.endY) / 2}
                r={Math.sqrt(Math.pow(currentShape.endX - currentShape.startX, 2) + Math.pow(currentShape.endY - currentShape.startY, 2)) / 2}
                fill="none"
                stroke={currentShape.color}
                strokeWidth={currentShape.lineWidth * 0.4}
                strokeOpacity={currentShape.opacity}
              />
            )}
            {currentShape.type === 'rect' && (
              <rect
                x={Math.min(currentShape.startX, currentShape.endX)}
                y={Math.min(currentShape.startY, currentShape.endY)}
                width={Math.abs(currentShape.endX - currentShape.startX)}
                height={Math.abs(currentShape.endY - currentShape.startY)}
                fill="none"
                stroke={currentShape.color}
                strokeWidth={currentShape.lineWidth * 0.4}
                strokeOpacity={currentShape.opacity}
              />
            )}
            {currentShape.type === 'arrow' && (
              <line
                x1={currentShape.startX}
                y1={currentShape.startY}
                x2={currentShape.endX}
                y2={currentShape.endY}
                stroke={currentShape.color}
                strokeWidth={currentShape.lineWidth * 0.5}
                strokeOpacity={currentShape.opacity}
                markerEnd="url(#arrowhead)"
              />
            )}
          </>
        )}
      </svg>

      {/* Input Flotante para Añadir Texto */}
      {textInputPos && (
        <div
          className="annotation-text-input-box"
          style={{
            position: 'absolute',
            left: `${textInputPos.x}%`,
            top: `${textInputPos.y}%`,
            transform: 'translate(-10%, -50%)',
            zIndex: 100
          }}
        >
          <input
            type="text"
            placeholder="Anotación táctica..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveText();
              if (e.key === 'Escape') setTextInputPos(null);
            }}
            autoFocus
          />
          <button type="button" onClick={handleSaveText} className="btn-ok">✓</button>
        </div>
      )}
    </div>
  );
};
