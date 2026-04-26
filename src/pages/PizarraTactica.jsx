import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

// ─── Make fabric global BEFORE library imports use it ───────────────────────
if (typeof window !== 'undefined') window.fabric = fabric;

import { MATERIALS_LIBRARY, MATERIALS_BY_CATEGORY, placeMaterialOnCanvas } from '../lib/mister11-materials.js';
import { TOOLS, STROKE_COLORS, STROKE_WIDTHS, ToolManager } from '../lib/mister11-tools.js';
import { FieldRenderer, FORMATIONS } from '../lib/mister11-field.js';
import './Pizarra.css';

// helper: 'half-attack' → 'half_attack' (library uses underscores)
const toLibType = (t) => t.replace(/-/g, '_');

// ─────────────────────────────────────────────────────────────────────────────
const PizarraTactica = () => {
  // DOM refs
  const containerRef    = useRef(null);
  const fieldCanvasRef  = useRef(null);
  const fabricElemRef   = useRef(null); // the <canvas> element for Fabric

  // stable refs (avoid stale closures)
  const fcRef    = useRef(null);  // fabric.Canvas instance
  const tmRef    = useRef(null);  // ToolManager instance
  const frRef    = useRef(null);  // FieldRenderer instance
  const framesR  = useRef([]);    // current frames array
  const frameIdxR = useRef(0);   // current frame index
  const playingR  = useRef(false); // is animation playing
  const historyR  = useRef([]);    // undo history (max 20)
  const redoR     = useRef([]);    // redo history (max 20)

  // React state (UI)
  const [ready,        setReady]        = useState(false);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [showTeamsDrawer, setShowTeamsDrawer] = useState(false);
  const [showMatsDrawer, setShowMatsDrawer] = useState(false);
  const [fieldType,    setFieldType]    = useState('full');
  const [formation,    setFormation]    = useState('4-3-3');
  const [activeTool,   setActiveTool]   = useState('select');
  const [activeColor,  setActiveColor]  = useState('#FFFFFF');
  const [activeWidth,  setActiveWidth]  = useState(4);
  const [placingMat,   setPlacingMat]   = useState(null);
  const [frames,       setFrames]       = useState([]);
  const [frameIdx,     setFrameIdx]     = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [openCats,     setOpenCats]     = useState({
    'señalizacion': true, 'porteria': false,
    'balon': true, 'coordinacion': false,
    'zonas': false, 'material': false,
  });
  const [localColor,     setLocalColor]     = useState('#4CAF7D');
  const [rivalColor,     setRivalColor]     = useState('#E53935');
  const [jokerColor,     setJokerColor]     = useState('#D4A843');
  const [localFormation, setLocalFormation] = useState('4-3-3');
  const [rivalFormation, setRivalFormation] = useState('4-4-2');
  const [isSwapped,      setIsSwapped]      = useState(false);
  const [showRival,      setShowRival]      = useState(false);
  const [histCount,      setHistCount]      = useState(0);
  const [redoCount,      setRedoCount]      = useState(0);

  // keep refs in sync with state
  useEffect(() => { frameIdxR.current = frameIdx; }, [frameIdx]);
  useEffect(() => { playingR.current = isPlaying; }, [isPlaying]);
  useEffect(() => { framesR.current = frames; }, [frames]);

  // ─── Save current canvas state into current frame ─────────────────────────
  const saveFrameState = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || playingR.current || framesR.current.length === 0) return;
    const idx   = frameIdxR.current;
    const state = fc.toJSON(['data']);
    setFrames(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], state };
      return next;
    });
    framesR.current[idx] = { ...framesR.current[idx], state };
  }, []);

  // ─── Push to undo history ─────────────────────────────────────────────────
  const pushToHistory = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const state = JSON.stringify(fc.toJSON(['data']));
    const h = historyR.current;
    // Don't push if the last state is identical
    if (h.length > 0 && h[h.length - 1] === state) return;
    
    const next = [...h, state];
    if (next.length > 20) next.shift(); // Max 20 states
    historyR.current = next;
    redoR.current = []; // Clear redo on new action
    setHistCount(next.length);
    setRedoCount(0);
  }, []);

  const undo = useCallback(() => {
    const fc = fcRef.current;
    const h = historyR.current;
    if (!fc || h.length <= 1) return;
    
    // Save current state to redo
    const currentState = h[h.length - 1];
    const newRedo = [...redoR.current, currentState];
    redoR.current = newRedo;

    // Remove current state
    const next = [...h];
    next.pop();
    const prevState = next[next.length - 1];
    
    fc.loadFromJSON(prevState, () => {
      fc.renderAll();
      historyR.current = next;
      setHistCount(next.length);
      setRedoCount(newRedo.length);
      saveFrameState();
    });
  }, [saveFrameState]);

  const redo = useCallback(() => {
    const fc = fcRef.current;
    const r = redoR.current;
    if (!fc || r.length === 0) return;

    const nextRedo = [...r];
    const stateToRestore = nextRedo.pop();
    redoR.current = nextRedo;

    // Push back to history
    const nextHist = [...historyR.current, stateToRestore];
    historyR.current = nextHist;

    fc.loadFromJSON(stateToRestore, () => {
      fc.renderAll();
      setHistCount(nextHist.length);
      setRedoCount(nextRedo.length);
      saveFrameState();
    });
  }, [saveFrameState]);

  // ─── Create a single player object ─────────────────────────────────────────
  const createPlayer = useCallback((x, y, options = {}) => {
    const { color = '#4CAF7D', label = '1', type = 'local' } = options;
    const circle = new fabric.Circle({
      radius: 16, originX: 'center', originY: 'center',
      fill: color,
      stroke: '#FFFFFF', strokeWidth: 2.5,
    });
    const text = new fabric.Text(String(label), {
      fontSize: 13, fontWeight: 'bold', fill: '#FFFFFF',
      originX: 'center', originY: 'center',
    });
    const group = new fabric.Group([circle, text], {
      left: x, top: y,
      originX: 'center', originY: 'center',
      hasControls: true, hasBorders: true,
      data: { type: 'player', playerType: type },
    });
    
    import('../lib/mister11-materials.js').then(m => {
      m.applyMister11Controls(group);
    });

    return group;
  }, []);

  // ─── Draw players from formation onto canvas ──────────────────────────────
  const drawPlayers = useCallback((canvas, renderer, fieldType, formations, swapped) => {
    const bounds = renderer.getFieldBounds();
    if (!bounds || bounds.w === 0) return;

    const drawTeam = (type, form, color, side) => {
      const positions = FORMATIONS[form] || FORMATIONS['4-3-3'];
      positions.forEach((pos, i) => {
        const isGk = i === 0;
        const rX = pos.relX ?? 0;
        const rY = pos.relY ?? 0;
        
        let finalX;
        // side 'L' means 0-0.5, side 'R' means 0.5-1.0
        // But FORMATIONS are relX 0 to 1.0 (full field)
        // If swapped, Local goes to Right (relX 0.5-1.0) and Rival to Left (0-0.5)
        
        if (side === 'L') {
          // Local starts from Left (0) to Right (1)
          finalX = bounds.x + rX * bounds.w;
        } else {
          // Rival starts from Right (1) to Left (0)
          finalX = bounds.x + (1 - rX) * bounds.w;
        }

        const x = finalX;
        const y = bounds.y + rY * bounds.h;

        const player = createPlayer(x, y, {
          color: isGk ? '#FFD700' : color,
          label: i + 1,
          type: type
        });
        canvas.add(player);
      });
    };

    // Draw Local
    drawTeam('local', formations.local, localColor, swapped ? 'R' : 'L');
    // Draw Rival (if enabled)
    if (showRival) {
      drawTeam('rival', formations.rival, rivalColor, swapped ? 'L' : 'R');
    }

    canvas.renderAll();
  }, [createPlayer, localColor, rivalColor, showRival]);

  // ─── Initialize canvases once on mount ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !fieldCanvasRef.current || !fabricElemRef.current) return;

    const W = containerRef.current.offsetWidth  || 800;
    const H = containerRef.current.offsetHeight || 500;

    // 1. Field (2D canvas)
    fieldCanvasRef.current.width  = W;
    fieldCanvasRef.current.height = H;
    const renderer = new FieldRenderer(fieldCanvasRef.current, { padding: 20 });
    renderer.draw('full');
    frRef.current = renderer;

    // 2. Fabric overlay canvas
    const fc = new fabric.Canvas(fabricElemRef.current, {
      width: W, height: H,
      allowTouchScrolling: false,
      selection: true,
    });
    fcRef.current = fc;

    // 3. ToolManager
    const tm = new ToolManager(fc);
    tm.setupHistory(30);
    tmRef.current = tm;

    // 4. Draw initial players
    drawPlayers(fc, renderer, 'full', { local: localFormation, rival: rivalFormation }, isSwapped);

    // 5. Save first frame
    setTimeout(() => {
      const state = fc.toJSON(['data']);
      const init  = [{ id: '1', name: 'Frame 1', state, duration: 800 }];
      setFrames(init);
      framesR.current = init;
      setReady(true);
    }, 250);

    // 6. Auto-save on object changes & history
    const onChange = () => {
      saveFrameState();
      pushToHistory();
    };
    fc.on('object:modified', onChange);
    fc.on('object:added',    onChange);
    fc.on('object:removed',  onChange);

    // 7. Resize logic with ResizeObserver
    const onResize = () => {
      if (!containerRef.current) return;
      const nW = containerRef.current.offsetWidth;
      const nH = containerRef.current.offsetHeight;
      
      setIsMobile(window.innerWidth < 768);

      fieldCanvasRef.current.width  = nW;
      fieldCanvasRef.current.height = nH;
      renderer.draw(toLibType(fieldType));
      fc.setDimensions({ width: nW, height: nH });
      fc.renderAll();
    };

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(containerRef.current);

    // 8. Keyboard shortcuts (Undo/Redo)
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      fc.off('object:modified', onChange);
      fc.off('object:added',    onChange);
      fc.off('object:removed',  onChange);
      fc.dispose();
    };
  }, []); // eslint-disable-line

  // ─── Field type change ────────────────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current; const tm = tmRef.current;
    if (!fc || !fr || playingR.current) return;
    fr.draw(toLibType(fieldType));
    fc.clear();
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    saveFrameState();
    pushToHistory();
  }, [fieldType]); // eslint-disable-line

  // ─── Formation change ─────────────────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr || playingR.current) return;
    fc.clear();
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    saveFrameState();
    pushToHistory();
  }, [localFormation, rivalFormation, isSwapped, showRival]); // eslint-disable-line

  // ─── Tool change ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tm = tmRef.current;
    if (!tm) return;
    if (activeTool === 'place_material') {
      tm.activateTool('select'); // suppress drawing while placing
    } else {
      tm.activateTool(activeTool);
    }
  }, [activeTool]);

  // ─── Color / width change ─────────────────────────────────────────────────
  useEffect(() => {
    const tm = tmRef.current;
    const fc = fcRef.current;
    if (!tm || !fc) return;
    
    tm.setStrokeColor(activeColor);
    tm.setStrokeWidth(activeWidth);

    // Si hay un objeto seleccionado, intentar cambiar su color
    const activeObj = fc.getActiveObject();
    if (activeObj) {
      if (activeObj.data?.type === 'player') {
        const circle = activeObj.item(0);
        if (circle) circle.set('fill', activeColor);
      } else if (activeObj.type === 'path') {
        activeObj.set('stroke', activeColor);
      } else if (activeObj.data?.type === 'material') {
        // Algunos materiales pueden no soportar cambio de color directo
        if (activeObj.setFill) activeObj.setFill(activeColor);
        else if (activeObj._objects) {
           activeObj._objects.forEach(o => {
             if (o.fill && o.fill !== 'transparent') o.set('fill', activeColor);
           });
        }
      }
      fc.renderAll();
      saveFrameState();
    }
  }, [activeColor, activeWidth, saveFrameState]);

  // ─── Team colors real-time update ──────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    fc.getObjects().forEach(obj => {
      if (obj.data?.type === 'player') {
        if (obj.data?.playerType === 'local') {
          const circle = obj.item(0);
          if (circle) circle.set('fill', localColor);
        } else if (obj.data?.playerType === 'rival') {
          const circle = obj.item(0);
          if (circle) circle.set('fill', rivalColor);
        } else if (obj.data?.playerType === 'joker') {
          const circle = obj.item(0);
          if (circle) circle.set('fill', jokerColor);
        }
      }
    });
    fc.renderAll();
    saveFrameState();
  }, [localColor, rivalColor, jokerColor, saveFrameState]);

  // ─── Material placement ───────────────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !placingMat) return;

    fc.defaultCursor = 'crosshair';

    const onDown = (o) => {
      const p = fc.getPointer(o.e);
      placeMaterialOnCanvas(fc, placingMat, p.x, p.y);
      setPlacingMat(null);
      setActiveTool('select');
      fc.defaultCursor = 'default';
      saveFrameState();
      fc.off('mouse:down', onDown);
    };

    fc.on('mouse:down', onDown);
    return () => fc.off('mouse:down', onDown);
  }, [placingMat, saveFrameState]);

  // ─── Undo / Redo (connected to manual history) ──────────────────────────
  // functions defined above with useCallback

  // ─── Clear canvas ─────────────────────────────────────────────────────────
  const clearCanvas = () => {
    if (!window.confirm('¿Limpiar pizarra?')) return;
    const fc = fcRef.current; const fr = frRef.current; const tm = tmRef.current;
    if (!fc || !fr) return;
    fc.clear();
    drawPlayers(fc, fr, fieldType, formation);
    if (tm) tm.setupHistory(30);
    saveFrameState();
  };

  // ─── Add Frame ────────────────────────────────────────────────────────────
  const addFrame = () => {
    saveFrameState();
    setTimeout(() => {
      const fc = fcRef.current;
      if (!fc) return;
      const state = fc.toJSON(['data']);
      const newFrame = {
        id: Date.now().toString(),
        name: `Frame ${framesR.current.length + 1}`,
        state,
        duration: 800,
      };
      setFrames(prev => {
        const next = [...prev, newFrame];
        framesR.current = next;
        return next;
      });
      const newIdx = framesR.current.length - 1;
      setFrameIdx(newIdx);
      frameIdxR.current = newIdx;
    }, 100);
  };

  // ─── Load Frame ──────────────────────────────────────────────────────────
  const loadFrame = (idx) => {
    const fc = fcRef.current;
    if (!fc || !framesR.current[idx]) return;
    saveFrameState();
    setTimeout(() => {
      fc.loadFromJSON(framesR.current[idx].state, () => {
        fc.renderAll();
        setFrameIdx(idx);
        frameIdxR.current = idx;
      });
    }, 80);
  };

  // ─── Delete Frame ─────────────────────────────────────────────────────────
  const deleteFrame = () => {
    const cur = frameIdxR.current;
    if (framesR.current.length <= 1) return;
    const next = framesR.current.filter((_, i) => i !== cur);
    const newIdx = Math.max(0, cur - 1);
    framesR.current = next;
    setFrames(next);
    setFrameIdx(newIdx);
    frameIdxR.current = newIdx;
    const fc = fcRef.current;
    if (fc) {
      fc.loadFromJSON(next[newIdx].state, () => fc.renderAll());
    }
  };

  // ─── Play Animation ───────────────────────────────────────────────────────
  const playAnimation = () => {
    const fc = fcRef.current;
    if (!fc || framesR.current.length < 2 || playingR.current) return;
    setIsPlaying(true);
    playingR.current = true;

    const animate = (idx) => {
      if (idx >= framesR.current.length - 1) {
        setIsPlaying(false);
        playingR.current = false;
        setFrameIdx(framesR.current.length - 1);
        return;
      }

      setFrameIdx(idx);
      const fA = framesR.current[idx];
      const fB = framesR.current[idx + 1];
      const dur = fB.duration || 800;

      fc.loadFromJSON(fA.state, () => {
        const objs    = fc.getObjects();
        const targets = fB.state.objects || [];

        if (objs.length === 0 || objs.length !== targets.length) {
          // Fallback: instant transition
          fc.loadFromJSON(fB.state, () => {
            fc.renderAll();
            setTimeout(() => animate(idx + 1), 300);
          });
          return;
        }

        let completed = 0;
        objs.forEach((obj, i) => {
          const t = targets[i];
          const sLeft = obj.left || 0;
          const sTop  = obj.top  || 0;
          fabric.util.animate({
            startValue: 0, endValue: 1, duration: dur,
            easing: fabric.util.ease.easeInOutSine,
            onChange: (v) => {
              obj.set({
                left: sLeft + ((t.left || 0) - sLeft) * v,
                top:  sTop  + ((t.top  || 0) - sTop ) * v,
              });
              fc.renderAll();
            },
            onComplete: () => {
              completed++;
              if (completed === objs.length) {
                fc.loadFromJSON(fB.state, () => {
                  fc.renderAll();
                  setTimeout(() => animate(idx + 1), 200);
                });
              }
            },
          });
        });
      });
    };

    animate(0);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    playingR.current = false;
  };

  // ─── Add Single Players ───────────────────────────────────────────────────
  const addManualPlayer = (type) => {
    const fc = fcRef.current;
    if (!fc) return;
    
    let color = localColor;
    let label = '1';
    if (type === 'rival') color = rivalColor;
    if (type === 'joker') color = jokerColor;

    const center = fc.getCenter();
    const player = createPlayer(center.left, center.top, { color, label, type });
    fc.add(player);
    fc.setActiveObject(player);
    fc.renderAll();
    saveFrameState();
  };

  const deleteSelected = () => {
    const fc = fcRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (active) {
      fc.remove(active);
      fc.renderAll();
      saveFrameState();
    }
  };

  // ─── Sub-Components (Panels) ──────────────────────────────────────────────
  const TeamsPanel = () => (
    <div className="pizarra-sidebar-content">
      <div className="panel-title">EQUIPOS</div>
      <div style={{ padding: '10px' }}>
        <TeamCard 
          color={localColor} 
          name="Local" 
          count={11} 
          onAdd={() => addManualPlayer('local')} 
          onColorChange={setLocalColor}
          formation={localFormation}
          onFormationChange={setLocalFormation}
        />
        <TeamCard 
          color={rivalColor} 
          name="Rival" 
          count={11} 
          onAdd={() => addManualPlayer('rival')} 
          style={{ marginTop: 12 }} 
          onColorChange={setRivalColor}
          formation={rivalFormation}
          onFormationChange={setRivalFormation}
        />
        <TeamCard 
          color={jokerColor} 
          name="Comodín" 
          count={0} 
          onAdd={() => addManualPlayer('joker')} 
          style={{ marginTop: 12 }} 
          onColorChange={setJokerColor}
        />
      </div>

      <div className="panel-title" style={{ marginTop: 12 }}>ACCIONES</div>
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="toggle-rival" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CCC', fontSize: 13 }}>
          <input 
            type="checkbox" 
            id="show-rival-toggle" 
            checked={showRival} 
            onChange={e => setShowRival(e.target.checked)} 
          />
          <label htmlFor="show-rival-toggle">Mostrar equipo rival</label>
        </div>
        <button className="topbar-btn outline" style={{flex: 1, minHeight: '44px'}} onClick={deleteSelected}>🗑 Eliminar</button>
      </div>
    </div>
  );

  const MaterialsPanel = () => (
    <div className="pizarra-sidebar-content">
      <div className="panel-title">MATERIAL</div>
      <div className="materials-list">
        {Object.entries(MATERIALS_BY_CATEGORY).map(([catKey, catData]) => {
          const catLabel = catData.label || catKey;
          const catItems = catData.items || catData || [];
          return (
            <div key={catKey} className="material-category">
              <div className="material-header" onClick={() =>
                setOpenCats(p => ({ ...p, [catKey]: !p[catKey] }))}>
                <span>{openCats[catKey] ? '▾' : '▸'}</span>
                <span>{catData.icon || ''} {catLabel}</span>
              </div>
              {openCats[catKey] && (
                <div className="material-items">
                  {catItems.map(id => {
                    const mat = MATERIALS_LIBRARY[id];
                    if (!mat) return null;
                    return (
                      <div key={id}
                        className={`material-item ${placingMat === id ? 'active' : ''}`}
                        title={mat.label}
                        onClick={() => { 
                          setPlacingMat(id); 
                          setActiveTool('place_material');
                          if (isMobile) setShowMatsDrawer(false);
                        }}>
                        <div dangerouslySetInnerHTML={{ __html: mat.svgPanel }}
                          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <span>{mat.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className={`pizarra-container ${isMobile ? 'mobile' : 'desktop'}`}>

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="pizarra-topbar">
        <div className="topbar-scroll-wrapper">
          {/* Field & Formation selectors */}
          <div className="topbar-group">
            <select className="topbar-select" value={fieldType}
              onChange={e => setFieldType(e.target.value)}>
              <option value="full">Campo Completo</option>
              <option value="half-attack">½ Ataque</option>
              <option value="half-defense">½ Defensa</option>
            </select>
            <button 
              className={`topbar-btn ${isSwapped ? 'active' : ''}`} 
              onClick={() => setIsSwapped(!isSwapped)}
              title="Cambiar lados de equipos"
            >
              ⇄ Lados
            </button>
          </div>

          {/* Drawing tools */}
          <div className="topbar-group">
            {Object.values(TOOLS).map(tool => (
              <button
                key={tool.id}
                className={`tool-icon-btn ${activeTool === tool.id ? 'active' : ''}`}
                title={tool.label}
                onClick={() => setActiveTool(tool.id)}
                dangerouslySetInnerHTML={{ __html: tool.icon }}
              />
            ))}
          </div>

          {/* Colors */}
          <div className="topbar-group">
            {STROKE_COLORS.map(c => (
              <div key={c.id}
                className={`color-swatch-top ${activeColor === c.hex ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
                onClick={() => setActiveColor(c.hex)}
              />
            ))}
            <div className="topbar-divider" />
            {Object.entries(STROKE_WIDTHS).map(([k, v]) => (
              <button key={k}
                className={`topbar-btn ${activeWidth === v.value ? 'active' : ''}`}
                onClick={() => setActiveWidth(v.value)}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="topbar-group">
            <button className="topbar-btn" onClick={undo} disabled={histCount <= 1} title="Deshacer (Ctrl+Z)">↩</button>
            <button className="topbar-btn" onClick={redo} disabled={redoCount === 0} title="Rehacer (Ctrl+Y)">↪</button>
            <button className="topbar-btn" onClick={clearCanvas}>🗑 Limpiar</button>
            <button className="topbar-btn primary">💾 Guardar</button>
          </div>
        </div>
      </div>

      {/* ── MAIN BOARD ────────────────────────────────────────────────────── */}
      <div className="pizarra-main">

        {!isMobile && (
          <div className="panel-izq">
            <TeamsPanel />
          </div>
        )}

        {/* CANVAS */}
        <div className="canvas-area" ref={containerRef}>
          <canvas ref={fieldCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
          <canvas ref={fabricElemRef}
            style={{ position: 'absolute', top: 0, left: 0 }} />

          {/* Placing-material indicator */}
          {placingMat && (
            <div className="placing-hint">
              📍 Haz clic en el campo para colocar el material. 
              <button onClick={() => { setPlacingMat(null); setActiveTool('select'); }}>✕</button>
            </div>
          )}

          {/* Floating Buttons for Mobile */}
          {isMobile && (
            <div className="floating-actions">
              <button className="btn-floating" onClick={() => setShowTeamsDrawer(true)}>👥 Equipos</button>
              <button className="btn-floating" onClick={() => setShowMatsDrawer(true)}>🎒 Material</button>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="panel-der">
            <MaterialsPanel />
          </div>
        )}

      </div>

      {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
      <div className="pizarra-timeline">
        <div className="timeline-scroll-wrapper">
          <button className="topbar-btn" onClick={() => loadFrame(0)}
            disabled={isPlaying || frameIdx === 0}>⏮</button>
          <button className="topbar-btn"
            onClick={() => loadFrame(Math.max(0, frameIdx - 1))}
            disabled={isPlaying || frameIdx === 0}>◀</button>

          {isPlaying
            ? <button className="topbar-btn primary" onClick={stopAnimation}>⏹</button>
            : <button className="topbar-btn primary" onClick={playAnimation}
                disabled={frames.length < 2}>▶</button>
          }

          <button className="topbar-btn"
            onClick={() => loadFrame(Math.min(frames.length - 1, frameIdx + 1))}
            disabled={isPlaying || frameIdx === frames.length - 1}>▶</button>
          <button className="topbar-btn"
            onClick={() => loadFrame(frames.length - 1)}
            disabled={isPlaying || frameIdx === frames.length - 1}>⏭</button>

          <span className="frame-counter">
            {frames.length > 0 ? frameIdx + 1 : 0}/{frames.length}
          </span>

          <div className="timeline-chips">
            {frames.map((f, i) => (
              <div key={f.id}
                className={`frame-chip ${i === frameIdx ? 'active' : ''}`}
                onClick={() => !isPlaying && loadFrame(i)}>
                {i + 1}
              </div>
            ))}
          </div>

          <button className="topbar-btn outline" onClick={addFrame} disabled={isPlaying}>+ Frame</button>
          <button className="topbar-btn" onClick={deleteFrame}
            disabled={isPlaying || frames.length <= 1}>🗑</button>
        </div>
      </div>

      {/* ── MOBILE DRAWERS ───────────────────────────────────────────────── */}
      {isMobile && (
        <>
          {showTeamsDrawer && (
            <div className="bottom-drawer-overlay" onClick={() => setShowTeamsDrawer(false)}>
              <div className="bottom-drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-handle" />
                <TeamsPanel />
              </div>
            </div>
          )}
          {showMatsDrawer && (
            <div className="bottom-drawer-overlay" onClick={() => setShowMatsDrawer(false)}>
              <div className="bottom-drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-handle" />
                <MaterialsPanel />
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

// ─── Small helper sub-component ──────────────────────────────────────────────
const TeamCard = ({ color, name, count, onAdd, style, onColorChange, formation, onFormationChange }) => (
  <div className="team-card-pizarra" style={{
    borderRadius: 10, padding: '12px',
    display: 'flex', flexDirection: 'column', gap: 10,
    ...style
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 24, height: 24 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, border: '2px solid white' }} />
        {onColorChange && (
          <input 
            type="color" 
            value={color} 
            onChange={(e) => onColorChange(e.target.value)}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer'
            }}
          />
        )}
      </div>
      <span className="team-name-pizarra" style={{ fontSize: 14, fontWeight: 'bold', flex: 1 }}>{name}</span>
      <button className="btn-add-mini" onClick={onAdd} title="Añadir jugador">+</button>
    </div>

    {onFormationChange && (
      <div className="formation-selector-mini">
        <select 
          value={formation} 
          onChange={(e) => onFormationChange(e.target.value)}
          className="mini-select"
        >
          {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    )}
  </div>
);

export default PizarraTactica;
