import React, { useRef, useEffect, useState } from 'react';

const FieldCanvas = ({ fieldView, elements, setElements, activeTool, activeColor, activeWidth, onElementClick }) => {
  const canvasRef = useRef(null);
  const elementsRef = useRef(elements);
  
  // Track drawing/dragging state
  const interactState = useRef({
    isDragging: false,
    isDrawing: false,
    elementIndex: -1,
    offsetX: 0,
    offsetY: 0,
    hasMoved: false
  });

  useEffect(() => {
    elementsRef.current = elements;
    draw();
  }, [elements, fieldView]);

  const getCanvasDimensions = () => {
    if (fieldView === 'full') {
      return { width: 1050, height: 680 };
    } else {
      return { width: 680, height: 525 };
    }
  };

  const drawField = (ctx, width, height) => {
    ctx.fillStyle = '#1A6B2E';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();

    if (fieldView === 'full') {
      ctx.rect(0, 0, width, height);
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(width / 2 + 91.5, height / 2); ctx.arc(width / 2, height / 2, 91.5, 0, Math.PI * 2);
      ctx.moveTo(width / 2 + 2, height / 2); ctx.arc(width / 2, height / 2, 2, 0, Math.PI * 2);

      const penaltyWidth = 403.2; const penaltyLength = 165; const penaltyY = (height - penaltyWidth) / 2;
      ctx.rect(0, penaltyY, penaltyLength, penaltyWidth);
      ctx.rect(width - penaltyLength, penaltyY, penaltyLength, penaltyWidth);

      const goalAreaWidth = 183.2; const goalAreaLength = 55; const goalAreaY = (height - goalAreaWidth) / 2;
      ctx.rect(0, goalAreaY, goalAreaLength, goalAreaWidth);
      ctx.rect(width - goalAreaLength, goalAreaY, goalAreaLength, goalAreaWidth);

      ctx.moveTo(110 + 2, height / 2); ctx.arc(110, height / 2, 2, 0, Math.PI * 2);
      ctx.moveTo(width - 110 + 2, height / 2); ctx.arc(width - 110, height / 2, 2, 0, Math.PI * 2);

      ctx.moveTo(110, height / 2); ctx.arc(110, height / 2, 91.5, -0.925, 0.925);
      ctx.moveTo(width - 110, height / 2); ctx.arc(width - 110, height / 2, 91.5, Math.PI - 0.925, Math.PI + 0.925, true);

      const goalWidth = 73.2; const goalY = (height - goalWidth) / 2;
      ctx.rect(-20, goalY, 20, goalWidth); ctx.rect(width, goalY, 20, goalWidth);

      ctx.moveTo(10, 0); ctx.arc(0, 0, 10, 0, Math.PI/2);
      ctx.moveTo(0, height - 10); ctx.arc(0, height, 10, -Math.PI/2, 0);
      ctx.moveTo(width - 10, 0); ctx.arc(width, 0, 10, Math.PI/2, Math.PI);
      ctx.moveTo(width, height - 10); ctx.arc(width, height, 10, Math.PI, Math.PI*1.5);
    } else {
      ctx.rect(0, 0, width, height);
      ctx.moveTo(width, height / 2 - 91.5); ctx.arc(width, height / 2, 91.5, Math.PI/2, Math.PI*1.5);
      ctx.moveTo(width, height / 2); ctx.arc(width, height / 2, 2, 0, Math.PI * 2);

      const penaltyWidth = 403.2; const penaltyLength = 165; const penaltyY = (height - penaltyWidth) / 2;
      ctx.rect(0, penaltyY, penaltyLength, penaltyWidth);
      
      const goalAreaWidth = 183.2; const goalAreaLength = 55; const goalAreaY = (height - goalAreaWidth) / 2;
      ctx.rect(0, goalAreaY, goalAreaLength, goalAreaWidth);

      ctx.moveTo(110 + 2, height / 2); ctx.arc(110, height / 2, 2, 0, Math.PI * 2);
      ctx.moveTo(110, height / 2); ctx.arc(110, height / 2, 91.5, -0.925, 0.925);

      const goalWidth = 73.2; const goalY = (height - goalWidth) / 2;
      ctx.rect(-20, goalY, 20, goalWidth);

      ctx.moveTo(10, 0); ctx.arc(0, 0, 10, 0, Math.PI/2);
      ctx.moveTo(0, height - 10); ctx.arc(0, height, 10, -Math.PI/2, 0);
    }
    ctx.stroke();
  };

  const drawArrowhead = (ctx, x, y, angle, type, color, sizeMultiplier = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.setLineDash([]);
    ctx.lineWidth = 2;

    const size = 10 * sizeMultiplier;

    if (type === 'triangle' || type === 'triangle_fill') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, size / 2);
      ctx.lineTo(-size, -size / 2);
      ctx.closePath();
      if (type === 'triangle_fill') ctx.fill();
      else ctx.stroke();
    } else if (type === 'chevron') {
      ctx.beginPath();
      ctx.moveTo(-size, size / 2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-size, -size / 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawElements = (ctx) => {
    elementsRef.current.forEach(el => {
      ctx.setLineDash([]);
      ctx.lineWidth = el.width || 2.5;
      ctx.strokeStyle = el.color || '#FFFFFF';
      ctx.fillStyle = el.color || '#FFFFFF';

      if (el.type === 'player') {
        const r = 14;
        ctx.beginPath();
        ctx.arc(el.x, el.y, r, 0, Math.PI * 2);
        
        if (el.team === 'local') ctx.fillStyle = el.isGk ? '#FFD700' : '#2DB84B';
        else ctx.fillStyle = el.isGk ? '#FF6B00' : '#E53935';
        ctx.fill();

        ctx.lineWidth = 2;
        if (el.team === 'local') ctx.strokeStyle = el.isGk ? '#0D0D0D' : '#1A6B2E';
        else ctx.strokeStyle = el.isGk ? '#FFFFFF' : '#B71C1C';
        ctx.stroke();

        ctx.fillStyle = (el.team === 'local' && el.isGk) ? '#0D0D0D' : '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.text, el.x, el.y);
      }
      else if (el.type === 'line') {
        const { start, end, tool } = el;
        if (!end) return;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        let arrowType = 'triangle_fill';
        let arrowMult = 1;
        let isCurve = tool.includes('curve') || tool === 'arrow_long';
        let cpX, cpY;

        // Tool specific styles
        if (tool === 'arrow_ball' || tool === 'arrow_ball_curve') {
          // default solid white
        } else if (tool === 'arrow_noball' || tool === 'arrow_noball_curve') {
          ctx.setLineDash([8, 5]);
          arrowType = 'chevron';
        } else if (tool === 'arrow_pass') {
          ctx.strokeStyle = '#7ED957';
          ctx.fillStyle = '#7ED957';
        } else if (tool === 'arrow_shoot') {
          ctx.strokeStyle = '#FF6B00';
          ctx.fillStyle = '#FF6B00';
          ctx.lineWidth = 3;
          arrowMult = 1.5;
        } else if (tool === 'arrow_long') {
          ctx.strokeStyle = '#7ED957';
          ctx.fillStyle = '#7ED957';
          ctx.setLineDash([6, 3]);
        } else if (tool === 'arrow_defend') {
          ctx.strokeStyle = '#E53935';
          ctx.fillStyle = '#E53935';
          arrowType = 'chevron';
        } else if (tool === 'line_free') {
          ctx.lineWidth = 1.5;
          arrowType = 'none';
        }

        let endAngle = 0;

        if (isCurve) {
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const cx = start.x + dx/2;
          const cy = start.y + dy/2;
          // offset control point perpendicular to the line
          const dist = Math.sqrt(dx*dx + dy*dy);
          cpX = cx - (dy/dist) * 40;
          cpY = cy + (dx/dist) * 40;
          
          ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
          endAngle = Math.atan2(end.y - cpY, end.x - cpX);
        } else {
          ctx.lineTo(end.x, end.y);
          endAngle = Math.atan2(end.y - start.y, end.x - start.x);
        }
        ctx.stroke();

        if (arrowType !== 'none') {
          drawArrowhead(ctx, end.x, end.y, endAngle, arrowType, ctx.strokeStyle, arrowMult);
        }
      }
      else if (el.type === 'zone') {
        const { start, end, tool } = el;
        if (!end) return;

        let strokeC = '#FFD700';
        let fillC = 'rgba(255,215,0,0.15)';
        let dash = [6, 3];
        
        if (tool === 'zone_corridor') {
          strokeC = '#1976D2'; fillC = 'rgba(25,118,210,0.12)';
        } else if (tool === 'zone_rival') {
          strokeC = '#E53935'; fillC = 'rgba(229,57,53,0.12)';
        } else if (tool === 'zone_target') {
          strokeC = '#2DB84B'; fillC = 'rgba(45,184,75,0.15)';
        } else if (tool === 'zone_rect') {
          fillC = 'rgba(255,215,0,0.12)';
        }

        ctx.strokeStyle = strokeC;
        ctx.fillStyle = fillC;
        ctx.setLineDash(dash);
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (tool === 'zone_circle') {
          const r = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        } else {
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
        ctx.fill();
        ctx.stroke();
      }
      else if (el.type === 'text' || el.type === 'number') {
        if (el.tool === 'text_number') {
          ctx.beginPath();
          ctx.arc(el.x, el.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#0D0D0D';
          ctx.fill();
          
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, el.x, el.y);
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.font = '14px Arial';
          const padding = 4;
          const textWidth = ctx.measureText(el.text).width;
          ctx.fillRect(el.x - textWidth/2 - padding, el.y - 7 - padding, textWidth + padding*2, 14 + padding*2);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, el.x, el.y);
        }
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawField(ctx, width, height);
    drawElements(ctx);
  };

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (e.type === 'touchstart') { /* allow touch */ } 
    const pos = getPointerPos(e);

    if (activeTool === 'select') {
      const els = elementsRef.current;
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        if (el.type === 'player' || el.type === 'text' || el.type === 'number') {
          let hit = false;
          if (el.type === 'player') {
            const dx = pos.x - el.x; const dy = pos.y - el.y;
            if (Math.sqrt(dx*dx + dy*dy) <= 19) hit = true;
          } else {
            // Very basic text hit box
            if (Math.abs(pos.x - el.x) < 20 && Math.abs(pos.y - el.y) < 20) hit = true;
          }

          if (hit) {
            interactState.current = { isDragging: true, isDrawing: false, elementIndex: i, offsetX: pos.x - el.x, offsetY: pos.y - el.y, hasMoved: false };
            return;
          }
        }
      }
    } else {
      // Start Drawing
      let newElement = null;
      if (activeTool.startsWith('arrow_') || activeTool.startsWith('line_')) {
        newElement = { id: Date.now().toString(), type: 'line', tool: activeTool, color: activeColor, width: activeWidth, start: { ...pos }, end: { ...pos } };
      } else if (activeTool.startsWith('zone_')) {
        newElement = { id: Date.now().toString(), type: 'zone', tool: activeTool, start: { ...pos }, end: { ...pos } };
      } else if (activeTool.startsWith('text_')) {
        const text = prompt('Ingrese texto:');
        if (text) {
          const type = activeTool === 'text_number' ? 'number' : 'text';
          newElement = { id: Date.now().toString(), type, tool: activeTool, x: pos.x, y: pos.y, text };
        } else {
          return; // Cancelled
        }
      }

      if (newElement) {
        interactState.current = { isDragging: false, isDrawing: true, hasMoved: true };
        elementsRef.current = [...elementsRef.current, newElement];
        draw();
      }
    }
  };

  const handlePointerMove = (e) => {
    const state = interactState.current;
    if (!state.isDragging && !state.isDrawing) return;
    if (e.type === 'touchmove') { /* allow touch */ }
    
    state.hasMoved = true;
    const pos = getPointerPos(e);
    const newElements = [...elementsRef.current];
    
    if (state.isDragging) {
      const el = { ...newElements[state.elementIndex] };
      el.x = pos.x - state.offsetX;
      el.y = pos.y - state.offsetY;
      newElements[state.elementIndex] = el;
    } else if (state.isDrawing) {
      const lastIdx = newElements.length - 1;
      const el = { ...newElements[lastIdx], end: { ...pos } };
      newElements[lastIdx] = el;
    }
    
    elementsRef.current = newElements;
    draw(); 
  };

  const handlePointerUp = (e) => {
    const state = interactState.current;
    if (state.isDragging || state.isDrawing) {
      state.isDragging = false;
      state.isDrawing = false;
      
      if (activeTool === 'select' && !state.hasMoved && onElementClick) {
        onElementClick(elementsRef.current[state.elementIndex]);
      } else {
        setElements(elementsRef.current);
      }
    }
  };

  const dims = getCanvasDimensions();

  return (
    <canvas
      ref={canvasRef}
      width={dims.width}
      height={dims.height}
      className="field-canvas"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
      style={{
        width: '100%',
        maxWidth: `${dims.width}px`,
        aspectRatio: `${dims.width} / ${dims.height}`,
        cursor: activeTool === 'select' ? 'default' : 'crosshair'
      }}
    />
  );
};

export default FieldCanvas;
