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

  // React state (UI)
  const [ready,        setReady]        = useState(false);
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
  const drawPlayers = useCallback((canvas, renderer, type, form) => {
    const bounds = renderer.getFieldBounds();
    if (!bounds || bounds.w === 0) return;
    const positions = FORMATIONS[form] || FORMATIONS['4-3-3'];

    positions.forEach((pos, i) => {
      const isGk = i === 0;
      const rX = pos.relX ?? 0;
      const rY = pos.relY ?? 0;
      let x = bounds.x + rX * bounds.w;
      let y = bounds.y + rY * bounds.h;

      if (type === 'half-defense') {
        x = bounds.x + (1 - rX) * bounds.w;
      }

      const player = createPlayer(x, y, {
        color: isGk ? '#FFD700' : '#4CAF7D',
        label: i + 1,
        type: 'local'
      });
      canvas.add(player);
    });
    canvas.renderAll();
  }, [createPlayer]);

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
    drawPlayers(fc, renderer, 'full', '4-3-3');

    // 5. Save first frame
    setTimeout(() => {
      const state = fc.toJSON(['data']);
      const init  = [{ id: '1', name: 'Frame 1', state, duration: 800 }];
      setFrames(init);
      framesR.current = init;
      setReady(true);
    }, 250);

    // 6. Auto-save on object changes
    const onChange = () => saveFrameState();
    fc.on('object:modified', onChange);
    fc.on('object:added',    onChange);
    fc.on('object:removed',  onChange);

    // 7. Resize handler
    const onResize = () => {
      if (!containerRef.current) return;
      const nW = containerRef.current.offsetWidth;
      const nH = containerRef.current.offsetHeight;
      fieldCanvasRef.current.width  = nW;
      fieldCanvasRef.current.height = nH;
      renderer.draw(toLibType(fieldType));
      fc.setDimensions({ width: nW, height: nH });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
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
    drawPlayers(fc, fr, fieldType, formation);
    if (tm) tm.setupHistory(30);
    saveFrameState();
  }, [fieldType]); // eslint-disable-line

  // ─── Formation change ─────────────────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current; const tm = tmRef.current;
    if (!fc || !fr || playingR.current) return;
    fc.clear();
    drawPlayers(fc, fr, fieldType, formation);
    if (tm) tm.setupHistory(30);
    saveFrameState();
  }, [formation]); // eslint-disable-line

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

  // ─── Undo / Redo ──────────────────────────────────────────────────────────
  const undo = () => tmRef.current?.undo();
  const redo = () => tmRef.current?.redo();

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
    
    let color = '#4CAF7D';
    let label = '1';
    if (type === 'rival') color = '#E53935';
    if (type === 'joker') color = '#D4A843';

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

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="pizarra-container">

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="pizarra-topbar">

        {/* Field & Formation selectors */}
        <div className="topbar-group">
          <select className="topbar-select" value={fieldType}
            onChange={e => setFieldType(e.target.value)}>
            <option value="full">Campo Completo</option>
            <option value="half-attack">½ Ataque</option>
            <option value="half-defense">½ Defensa</option>
          </select>
          <select className="topbar-select" value={formation}
            onChange={e => setFormation(e.target.value)}>
            {Object.keys(FORMATIONS).map(f =>
              <option key={f} value={f}>{f}</option>
            )}
          </select>
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
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
          {Object.entries(STROKE_WIDTHS).map(([k, v]) => (
            <button key={k}
              className={`topbar-btn ${activeWidth === v.value ? 'active' : ''}`}
              onClick={() => setActiveWidth(v.value)}
              style={{ padding: '4px 10px' }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="topbar-group">
          <button className="topbar-btn" onClick={undo} title="Deshacer (Ctrl+Z)">↩</button>
          <button className="topbar-btn" onClick={redo} title="Rehacer">↪</button>
          <button className="topbar-btn" onClick={clearCanvas}>🗑 Limpiar</button>
          <button className="topbar-btn primary">💾 Guardar</button>
        </div>

      </div>

      {/* ── MAIN BOARD ────────────────────────────────────────────────────── */}
      <div className="pizarra-main">

        {/* LEFT PANEL */}
        <div className="panel-izq">
          <div className="panel-title">EQUIPOS</div>
          <div style={{ padding: '10px' }}>
            <TeamCard color="#4CAF7D" name="Local" count={11} onAdd={() => addManualPlayer('local')} />
            <TeamCard color="#E53935" name="Rival" count={0} onAdd={() => addManualPlayer('rival')} style={{ marginTop: 8 }} />
            <TeamCard color="#D4A843" name="Comodín" count={0} onAdd={() => addManualPlayer('joker')} style={{ marginTop: 8 }} />
          </div>

          <div className="panel-title" style={{ marginTop: 12 }}>ACCIONES</div>
          <div style={{ padding: '0 10px 10px', display: 'flex', gap: 5 }}>
            <button className="topbar-btn outline" style={{flex: 1}} onClick={deleteSelected}>🗑 Eliminar</button>
          </div>

          <div className="panel-title" style={{ marginTop: 12 }}>FORMACIÓN</div>
          <div style={{ padding: '0 10px 10px' }}>
            {Object.keys(FORMATIONS).map(f => (
              <button key={f}
                className={`formation-btn ${formation === f ? 'active' : ''}`}
                onClick={() => setFormation(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div className="canvas-area" ref={containerRef}>
          <canvas ref={fieldCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
          <canvas ref={fabricElemRef}
            style={{ position: 'absolute', top: 0, left: 0 }} />

          {/* Placing-material indicator */}
          {placingMat && (
            <div className="placing-hint">
              📍 Haz clic en el campo para colocar el material. <button onClick={() => { setPlacingMat(null); setActiveTool('select'); }}>✕ Cancelar</button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="panel-der">
          <div className="panel-title">MATERIAL</div>
          <div className="materials-list">
            {Object.entries(MATERIALS_BY_CATEGORY).map(([catKey, catData]) => {
              // MATERIALS_BY_CATEGORY structure: { label, icon, items: [ids] }
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
                            onClick={() => { setPlacingMat(id); setActiveTool('place_material'); }}>
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

      </div>

      {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
      <div className="pizarra-timeline">
        <button className="topbar-btn" onClick={() => loadFrame(0)}
          disabled={isPlaying || frameIdx === 0}>⏮</button>
        <button className="topbar-btn"
          onClick={() => loadFrame(Math.max(0, frameIdx - 1))}
          disabled={isPlaying || frameIdx === 0}>◀</button>

        {isPlaying
          ? <button className="topbar-btn primary" onClick={stopAnimation}>⏹ Stop</button>
          : <button className="topbar-btn primary" onClick={playAnimation}
              disabled={frames.length < 2}>▶ Play</button>
        }

        <button className="topbar-btn"
          onClick={() => loadFrame(Math.min(frames.length - 1, frameIdx + 1))}
          disabled={isPlaying || frameIdx === frames.length - 1}>▶</button>
        <button className="topbar-btn"
          onClick={() => loadFrame(frames.length - 1)}
          disabled={isPlaying || frameIdx === frames.length - 1}>⏭</button>

        <span style={{ fontSize: 12, marginLeft: 10 }}>
          Frame {frames.length > 0 ? frameIdx + 1 : 0} / {frames.length}
        </span>

        {/* Frame chips */}
        <div className="timeline-chips">
          {frames.map((f, i) => (
            <div key={f.id}
              className={`frame-chip ${i === frameIdx ? 'active' : ''}`}
              onClick={() => !isPlaying && loadFrame(i)}>
              {i + 1}
            </div>
          ))}
        </div>

        <button className="topbar-btn outline" onClick={addFrame} disabled={isPlaying}>
          + Frame
        </button>
        <button className="topbar-btn" onClick={deleteFrame}
          disabled={isPlaying || frames.length <= 1}>🗑</button>
      </div>

    </div>
  );
};

// ─── Small helper sub-component ──────────────────────────────────────────────
const TeamCard = ({ color, name, count, onAdd, style }) => (
  <div style={{
    background: '#252535', borderRadius: 8, padding: '8px 10px',
    display: 'flex', alignItems: 'center', gap: 8,
    ...style
  }}>
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <span style={{ color: '#FFF', fontSize: 13, flex: 1 }}>{name}</span>
    <button className="btn-add-mini" onClick={onAdd}>+</button>
  </div>
);

export default PizarraTactica;
