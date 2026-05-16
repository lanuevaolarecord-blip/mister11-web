// FIX coordenadas relativas - 01/05/2026
// PROBLEMA: Posiciones y radios en px absolutos 
//   calculados para móvil vertical (380×520px).
//   En cualquier otro canvas los mismos px producen
//   posiciones y tamaños incorrectos.
// CAUSA: Sin sistema de referencia, cada dispositivo
//   interpreta las coordenadas de forma distinta.
// SOLUCIÓN: Guardar xRel/yRel (0.0-1.0) y radiusRel,
//   recalcular al cargar y al cambiar tamaño de canvas.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

// ─── Referencias de diseño ──────────────────────────────────────────────────
const CANVAS_REF_WIDTH = 380;
const CANVAS_REF_HEIGHT = 520;
const RADIO_JUGADOR = 12.5;

// ─── Make fabric global BEFORE library imports use it ───────────────────────
if (typeof window !== 'undefined') {
  window.fabric = fabric;
  // Optimizaciones táctiles globales (Hitboxes amplios para trabajo en campo)
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerSize = 24; 
  fabric.Object.prototype.padding = 10;
}

import { MATERIALS_LIBRARY, MATERIALS_BY_CATEGORY, placeMaterialOnCanvas } from '../lib/mister11-materials.js';
import { TOOLS, STROKE_COLORS, STROKE_WIDTHS, ToolManager } from '../lib/mister11-tools.js';
import { FieldRenderer, FORMATIONS } from '../lib/mister11-field.js';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, addDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../firebaseConfig';
import './Pizarra.css';

// helper: 'half-attack' → 'half_attack' (library uses underscores)
const toLibType = (t) => {
  const map = {
    'full':           'full',
    'half-attack':    'half_attack',
    'half_attack':    'half_attack',
    '½ Ataque':       'half_attack',
    'half-defense':   'half_defense',
    'half_defense':   'half_defense',
    '½ Defensa':      'half_defense',
    'third_defense':  'third_def',
    'third_mid':      'third_mid',
    'third_attack':   'third_off',
    'penalty_area':   'penalty_zoom',
    'f7':             'f7',
    'f8':             'f8',
    'futsal':         'futsal',
    'reduced':        'reduced',
    'blank':          'blank'
  };
  return map[t] || t?.replace(/-/g, '_') || 'full';
};

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
  const pastR     = useRef([]);    // past stack (max 30)
  const presentR  = useRef(null);  // current serialized state
  const futureR   = useRef([]);    // future stack (redo)
  const syncingR  = useRef(false); // prevent events during load
  const readyR    = useRef(false); // track initial load safely
  const saveTimeoutR = useRef(null); // for debouncing saves
  const clipboardR = useRef(null); // for copy/paste

  // ─── Utilidades de Escala ─────────────────────────────────────────────────

  const serializarFrame = useCallback(() => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return { objects: [] };

    const objects = fc.getObjects().map(obj => {
      const serializado = obj.toObject(['data']);
      
      // Intentar obtener coordenadas relativas al CAMPO si están en data
      // O calcularlas si es un movimiento manual
      const { rx, ry } = fr.getRelativePoint(obj.left, obj.top);

      return {
        ...serializado,
        xRel: rx,
        yRel: ry,
        radiusRel: obj.radius 
          ? obj.radius / Math.min(fc.width, fc.height)
          : undefined
      };
    });
    return { version: fabric.version, objects };
  }, []);

  const ensurePlayersOnTop = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    // Mover todos los objetos tipo 'player' al frente
    fc.getObjects().forEach(obj => {
      if (obj.data?.type === 'player' || obj.data?.tipo === 'jugador') {
        obj.bringToFront();
      }
    });
    fc.requestRenderAll();
  }, []);

  const cargarFrame = useCallback((state, callback) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr || !state) return;

    fc.clear();
    const objsToEnliven = Array.isArray(state.objects) ? state.objects : [];
    
    if (objsToEnliven.length === 0) {
      if (callback) callback();
      return;
    }

    const enlivenedData = objsToEnliven.map(objData => {
      let left, top, visible = true;
      
      if (objData.xRel !== undefined && objData.yRel !== undefined) {
        // Usar el mapeador del renderer para proyectar al canvas actual
        const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
        left = point.x;
        top  = point.y;
        
        // Ocultar si queda fuera del zoom actual
        visible = (
          point.x >= -20 && 
          point.x <= fc.width + 20 &&
          point.y >= -20 &&
          point.y <= fc.height + 20
        );
      } else {
        left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
        top  = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
      }

      let radius = objData.radius;
      if (objData.radiusRel !== undefined) {
        radius = objData.radiusRel * Math.min(fc.width, fc.height);
      } else if (objData.data?.type === 'player') {
        radius = RADIO_JUGADOR;
      }

      return { ...objData, left, top, radius, visible };
    });

    fabric.util.enlivenObjects(enlivenedData, (objects) => {
      objects.forEach(o => fc.add(o));
      ensurePlayersOnTop();
      fc.renderAll();
      if (callback) callback();
    });
  }, []);

  const reposicionarTodo = useCallback((anchoAnterior, altoAnterior, anchoNuevo, altoNuevo) => {
    const fc = fcRef.current;
    if (!fc) return;

    fc.getObjects().forEach(obj => {
      const xRel = obj.left / anchoAnterior;
      const yRel = obj.top / altoAnterior;

      obj.set({
        left: xRel * anchoNuevo,
        top: yRel * altoNuevo
      });

      if (obj.data?.type === 'player' && obj.radius) {
        const scaleX = anchoNuevo / anchoAnterior;
        const scaleY = altoNuevo / altoAnterior;
        const scale = Math.min(scaleX, scaleY);
        obj.set({ radius: obj.radius * scale });
      }
      obj.setCoords();
    });
    fc.renderAll();
  }, []);

  // Auth & URL
  const { user, activeTeamId } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Usar planId de la URL o recuperar el último usado para este equipo (Persistencia al navegar)
  const [planId, setPlanId] = useState(() => {
    const fromUrl = searchParams.get('id');
    if (fromUrl) return fromUrl;
    return null; // Se resolverá en un useEffect
  });

  useEffect(() => {
    if (!planId && activeTeamId) {
      const lastId = localStorage.getItem(`last_pizarra_${activeTeamId}`);
      if (lastId) {
        setPlanId(lastId);
      } else {
        const newId = `pizarra-${Date.now()}`;
        setPlanId(newId);
        localStorage.setItem(`last_pizarra_${activeTeamId}`, newId);
      }
    }
  }, [planId, activeTeamId]);

  // React state (UI)
  const [ready,        setReady]        = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    'zonas': false, 'material': false, 'medidas': false,
  });
  const [localColor,     setLocalColor]     = useState('#4CAF7D');
  const [rivalColor,     setRivalColor]     = useState('#E53935');
  const [jokerColor,     setJokerColor]     = useState('#D4A843');
  const [localFormation, setLocalFormation] = useState('4-3-3');
  const [rivalFormation, setRivalFormation] = useState('4-4-2');
  const [isSwapped,      setIsSwapped]      = useState(false);
  const [showRival,      setShowRival]      = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [histCount,      setHistCount]      = useState(0);
  const [redoCount,      setRedoCount]      = useState(0);
  const [reducedDim,     setReducedDim]     = useState({ w: 40, h: 30 });
  const [zoomLevel,      setZoomLevel]      = useState(1);
  const [isCapturing,    setIsCapturing]    = useState(false);

  // keep refs in sync with state
  useEffect(() => { frameIdxR.current = frameIdx; }, [frameIdx]);
  useEffect(() => { playingR.current = isPlaying; }, [isPlaying]);
  useEffect(() => { framesR.current = frames; }, [frames]);



  // ─── Save current canvas state into current frame ─────────────────────────
  const saveFrameState = useCallback(async (immediate = false) => {
    if (syncingR.current) return; // Block saves while loading/syncing
    
    const fc = fcRef.current;
    if (!fc || playingR.current || !user || !activeTeamId) return;
    
    const idx   = frameIdxR.current;
    const frame = (framesR.current && framesR.current[idx]) ? framesR.current[idx] : null;
    
    // Si no hay frame definido en el array de la ref, no podemos guardar en DB todavía
    if (!frame || !frame.id) return;

    const state = serializarFrame();

    // Update Local State (Immediate)
    setFrames(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], state };
      return next;
    });
    framesR.current[idx] = { ...framesR.current[idx], state };

    // Debounced Firestore Update (Async, non-blocking)
    const saveToDB = async () => {
      try {
        if (!activeTeamId) return;
        const frameRef = doc(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId, 'frames', frame.id);
        await setDoc(frameRef, {
          state: JSON.stringify(state),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error updating frame in Firestore:", err);
      }
    };

    if (immediate) {
      saveToDB();
    } else {
      if (saveTimeoutR.current) clearTimeout(saveTimeoutR.current);
      saveTimeoutR.current = setTimeout(saveToDB, 1000); // 1s debounce
    }
  }, [user, planId, activeTeamId]);

  // ─── Push to undo history ─────────────────────────────────────────────────
  const pushToHistory = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || syncingR.current) return;

    // Capturar estado actual (relativo para consistencia entre dispositivos)
    const stateObj = serializarFrame();
    const newState = JSON.stringify(stateObj);

    // Inicializar present si es nulo
    if (!presentR.current) {
      presentR.current = newState;
      return;
    }

    // Evitar duplicados (no guardar si no ha cambiado nada)
    if (presentR.current === newState) return;

    // Mover present actual a past
    pastR.current.push(presentR.current);
    
    // Limitar historial a 30 movimientos (instrucción técnica)
    if (pastR.current.length > 30) {
      pastR.current.shift();
    }

    // Actualizar present con el nuevo estado
    presentR.current = newState;

    // Limpiar future (rehacer) al realizar una nueva acción
    futureR.current = [];

    // Sincronizar contadores para la UI
    setHistCount(pastR.current.length);
    setRedoCount(0);
  }, [serializarFrame]);

  const undo = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || pastR.current.length === 0) return;

    // Mover present actual a future para poder rehacer
    futureR.current.push(presentR.current);

    // Recuperar el último estado de past y ponerlo en present
    const prevState = pastR.current.pop();
    presentR.current = prevState;

    // Cargar el estado en el canvas
    syncingR.current = true;
    const stateObj = JSON.parse(prevState);
    cargarFrame(stateObj, () => {
      syncingR.current = false;
      setHistCount(pastR.current.length);
      setRedoCount(futureR.current.length);
      saveFrameState(true);
    });
  }, [cargarFrame, saveFrameState]);

  const redo = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || futureR.current.length === 0) return;

    // Mover present actual a past
    pastR.current.push(presentR.current);
    if (pastR.current.length > 30) pastR.current.shift();

    // Recuperar el primer estado disponible de future y ponerlo en present
    const nextState = futureR.current.pop();
    presentR.current = nextState;

    // Cargar el estado
    syncingR.current = true;
    const stateObj = JSON.parse(nextState);
    cargarFrame(stateObj, () => {
      syncingR.current = false;
      setHistCount(pastR.current.length);
      setRedoCount(futureR.current.length);
      saveFrameState(true);
    });
  }, [cargarFrame, saveFrameState]);

  // ─── Create a single player object ─────────────────────────────────────────
  const createPlayer = useCallback((x, y, options = {}) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return null;
    
    const { color = '#4CAF7D', label = '1', type = 'local', radius = RADIO_JUGADOR } = options;
    
    // Obtener coordenadas relativas al CAMPO REAL
    const { rx, ry } = fr.getRelativePoint(x, y);

    const circle = new fabric.Circle({
      radius: radius, originX: 'center', originY: 'center',
      fill: color,
      stroke: '#FFFFFF', strokeWidth: Math.max(1, radius * 0.15),
    });
    const text = new fabric.Text(String(label), {
      fontSize: Math.round(radius * 0.8), fontWeight: 'bold', fill: '#FFFFFF',
      originX: 'center', originY: 'center',
    });
    const group = new fabric.Group([circle, text], {
      left: x, top: y,
      originX: 'center', originY: 'center',
      hasControls: true, hasBorders: true,
      data: { 
        type: 'player',
        tipo: 'jugador',
        playerType: type,
        xRel: rx,
        yRel: ry
      },
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

    // Radio fijo igual en todos los modos de campo
    const playerRadius = RADIO_JUGADOR;

    const drawTeam = (type, form, color, side) => {
      const positions = FORMATIONS[form] || FORMATIONS['4-3-3'];
      const libType = toLibType(fieldType);
      const margin = playerRadius + 6;

      // Rangos visibles de relX según el tipo de campo
      // relX va de 0 (línea de fondo izq) a 1 (línea de fondo der)
      const VISIBLE_RANGE = {
        full:         { min: 0,     max: 1     },
        half_attack:  { min: 0.5,   max: 1     },
        half_defense: { min: 0,     max: 0.5   },
        third_def:    { min: 0,     max: 0.333 },
        third_mid:    { min: 0.333, max: 0.666 },
        third_off:    { min: 0.666, max: 1     },
        penalty_zoom: { min: 0.75,  max: 1     },
        f7:           { min: 0,     max: 1     },
        f8:           { min: 0,     max: 1     },
        futsal:       { min: 0,     max: 1     },
        reduced:      { min: 0,     max: 1     },
        blank:        { min: 0,     max: 1     },
      };

      const range = VISIBLE_RANGE[libType] ?? { min: 0, max: 1 };
      const visibleLen = range.max - range.min; // longitud visible (0-1)

      positions.forEach((pos, i) => {
        const isGk = i === 0;
        const rX = pos.relX ?? 0;
        const rY = pos.relY ?? 0;

        // Espejo para el equipo contrario
        const effectiveRx = (side === 'L') ? rX : (1 - rX);

        // Remapear effectiveRx al rango visible del campo actual
        // Si el campo muestra relX [0.5, 1.0], remapeamos toda la
        // formación para que ocupe ese rango completo
        const remappedRx = range.min + effectiveRx * visibleLen;

        // Añadir padding interno para que el portero no quede
        // pegado a la línea de fondo
        const paddingRel = 0.03; // 3% del rango visible
        const clampedRx = Math.max(
          range.min + paddingRel,
          Math.min(range.max - paddingRel, remappedRx)
        );
        const clampedRy = Math.max(0.04, Math.min(0.96, rY));

        // getCanvasPoint convierte las coordenadas relativas
        // al campo completo en píxeles del canvas actual
        const pt = renderer.getCanvasPoint(clampedRx, clampedRy);

        // Clamp final por si acaso hay desbordamiento de píxeles
        const finalX = Math.max(
          bounds.x + margin,
          Math.min(bounds.x + bounds.w - margin, pt.x)
        );
        const finalY = Math.max(
          bounds.y + margin,
          Math.min(bounds.y + bounds.h - margin, pt.y)
        );

        const player = createPlayer(finalX, finalY, {
          color: isGk ? '#FFD700' : color,
          label: i + 1,
          type: type,
          pos: pos.pos || '',
          radius: playerRadius,
        });
        if (player) canvas.add(player);
      });
    };

    syncingR.current = true;
    drawTeam('local', formations.local, localColor, swapped ? 'R' : 'L');
    if (showRival) {
      drawTeam('rival', formations.rival, rivalColor, swapped ? 'L' : 'R');
    }
    syncingR.current = false;
    canvas.renderAll();
  }, [createPlayer, localColor, rivalColor, showRival]);

  // ─── Initialize canvases once on mount ───────────────────────────────────
  useEffect(() => {
    // Reset state on team/plan change
    setFrames([]);
    setReady(false);
    readyR.current = false;
    
    if (!containerRef.current || !fieldCanvasRef.current || !fabricElemRef.current || !user || !activeTeamId || !planId) return;

    const W = containerRef.current.offsetWidth  || 800;
    const H = containerRef.current.offsetHeight || 500;

    let initW = W;
    let initH = W / 1.5;
    if (initH > H) {
      initH = H;
      initW = initH * 1.5;
    }

    // 1. Field (2D canvas)
    fieldCanvasRef.current.width  = initW;
    fieldCanvasRef.current.height = initH;
    const renderer = new FieldRenderer(fieldCanvasRef.current, { padding: { v: 12, h: 16 } });
    renderer.draw('full');
    frRef.current = renderer;

    // 2. Fabric overlay canvas
    const fc = new fabric.Canvas(fabricElemRef.current, {
      width: initW, height: initH,
      allowTouchScrolling: false,
      selection: true,
    });
    fcRef.current = fc;

    // 3. ToolManager
    const tm = new ToolManager(fc);
    tmRef.current = tm;

    // 4. Load frames from Firestore (Puntos 4 y 5 consolidados)
    let unsubscribe;
    if (user && planId && activeTeamId) {
      const framesColRef = collection(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId, 'frames');
      const q = query(framesColRef, orderBy('order', 'asc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          // Si no hay frames, dibujar la formación inicial por defecto
          syncingR.current = true;
          drawPlayers(fc, renderer, 'full', { local: localFormation, rival: rivalFormation }, isSwapped);
          syncingR.current = false;

          // Guardar este estado inicial como el primer frame
          const state = serializarFrame();
          addDoc(framesColRef, {
            name: 'Frame 1',
            state: JSON.stringify(state),
            duration: 800,
            order: 0,
            createdAt: serverTimestamp()
          });
          return;
        }

        const dbFrames = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            state: typeof data.state === 'string' ? JSON.parse(data.state) : data.state
          };
        });

        setFrames(dbFrames);
        framesR.current = dbFrames;

        if (!readyR.current) {
          readyR.current = true;
          setReady(true);
          // Load first frame into canvas safely
          if (dbFrames.length > 0) {
            syncingR.current = true;
            cargarFrame(dbFrames[0].state, () => {

              syncingR.current = false;
              setFrameIdx(0);
              frameIdxR.current = 0;
              pushToHistory();
            });
          }
        }
      });
    }

    // 6. Auto-save on object changes & history
    const onChange = (opt) => {
      if (syncingR.current) return;

      // Sincronizar coordenadas relativas al campo si el objeto se movió
      if (opt.target && frRef.current) {
        const targets = opt.target._objects || [opt.target];
        targets.forEach(t => {
          if (t.data) {
            const { rx, ry } = frRef.current.getRelativePoint(t.left, t.top);
            t.data.xRel = rx;
            t.data.yRel = ry;
          }
        });
      }

      ensurePlayersOnTop();
      saveFrameState(false); // Debounced save
      pushToHistory();
    };

    const onPathCreated = (opt) => {
      if (opt.path) {
        opt.path.set({ data: { type: 'path' } });
      }
      ensurePlayersOnTop();
      saveFrameState(false);
      pushToHistory();
    };

    fc.on('object:modified', onChange);
    fc.on('object:added',    onChange);
    fc.on('object:removed',  onChange);
    fc.on('path:created',    onPathCreated);

    // 7. Resize logic with ResizeObserver
    const resizeCanvas = () => {
      const contenedor = document.getElementById('canvas-container');
      const fc = fcRef.current;
      const fr = frRef.current;
      const fieldCanvas = fieldCanvasRef.current;
      if (!contenedor || !fc || !fieldCanvas) return;

      const anchoContenedor = contenedor.offsetWidth;
      const altoContenedor  = contenedor.offsetHeight;

      // Layout adaptativo
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);

      // Aspect Ratio Contain: el campo siempre visible (1.5:1)
      const aspect = 1.5;
      let nuevoAncho = anchoContenedor;
      let nuevoAlto  = anchoContenedor / aspect;
      if (nuevoAlto > altoContenedor) {
        nuevoAlto  = altoContenedor;
        nuevoAncho = altoContenedor * aspect;
      }

      // Paso 1: capturar posiciones ANTES de cambiar dimensiones
      const anchoActual = fc.width  || nuevoAncho;
      const altoActual  = fc.height || nuevoAlto;
      const snapshots = fc.getObjects().map(obj => ({
        obj,
        xRel: obj.data?.xRel,
        yRel: obj.data?.yRel,
        xPct: anchoActual > 0 ? obj.left / anchoActual : 0,
        yPct: altoActual  > 0 ? obj.top  / altoActual  : 0,
        hasFieldCoords: obj.data?.xRel !== undefined && obj.data?.yRel !== undefined,
      }));

      // Paso 2: actualizar dimensiones del canvas
      fieldCanvas.width  = nuevoAncho;
      fieldCanvas.height = nuevoAlto;
      fc.setDimensions({ width: nuevoAncho, height: nuevoAlto });

      // Paso 3: redibujar campo para que el renderer tenga bounds actualizados
      if (fr) {
        fr.draw(toLibType(fieldType));
      }

      // Paso 4: reposicionar objetos usando coordenadas guardadas
      snapshots.forEach(({ obj, xRel, yRel, xPct, yPct, hasFieldCoords }) => {
        if (hasFieldCoords && fr) {
          const point = fr.getCanvasPoint(xRel, yRel);
          obj.set({
            left: point.x,
            top:  point.y,
            visible: (
              point.x >= -20 &&
              point.x <= nuevoAncho + 20 &&
              point.y >= -20 &&
              point.y <= nuevoAlto  + 20
            )
          });
        } else {
          obj.set({ left: xPct * nuevoAncho, top: yPct * nuevoAlto });
        }
        obj.setCoords();
      });

      fc.renderAll();
    };


    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 300);
    });
    ro.observe(document.getElementById('canvas-container'));

    // orientationchange listener
    const handleOrientationChange = () => {
      setTimeout(resizeCanvas, 300);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // 8. Cerrar dropdowns al hacer click fuera
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.color-picker-container') && !e.target.closest('.pizarra-dropdown.color-grid')) {
        setShowColorPicker(false);
      }
      if (!e.target.closest('.width-picker-container') && !e.target.closest('.pizarra-dropdown.width-list')) {
        setShowWidthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    // 9. Keyboard shortcuts (Undo/Redo/Copy/Paste)
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const activeObj = fcRef.current.getActiveObject();
        if (activeObj) {
          activeObj.clone((cloned) => {
            clipboardR.current = cloned;
          }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (clipboardR.current) {
          clipboardR.current.clone((clonedObj) => {
            const fc = fcRef.current;
            fc.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = fc;
              clonedObj.forEachObject((obj) => fc.add(obj));
              clonedObj.setCoords();
            } else {
              fc.add(clonedObj);
            }
            clipboardR.current.top += 20;
            clipboardR.current.left += 20;
            fc.setActiveObject(clonedObj);
            fc.requestRenderAll();
            pushToHistory();
          }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const fc = fcRef.current;
        const activeObj = fc.getActiveObject();
        if (activeObj && !activeObj.isEditing) {
          if (activeObj.type === 'activeSelection') {
            activeObj.forEachObject(o => fc.remove(o));
            fc.discardActiveObject();
          } else {
            fc.remove(activeObj);
          }
          fc.requestRenderAll();
          pushToHistory();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Ctrl+Click to duplicate
    const onMouseDownClone = (opt) => {
      if ((opt.e.ctrlKey || opt.e.metaKey) && opt.target) {
        opt.target.clone((clonedObj) => {
          const fc = fcRef.current;
          fc.discardActiveObject();
          clonedObj.set({
            left: clonedObj.left + 20,
            top: clonedObj.top + 20,
            evented: true,
          });
          fc.add(clonedObj);
          fc.setActiveObject(clonedObj);
          fc.requestRenderAll();
          pushToHistory();
        }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
      }
    };
    fc.on('mouse:down', onMouseDownClone);

    // 10. Zoom / Pan (Mouse Wheel & Touch)
    const handleMouseWheel = (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fc.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      fc.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoomLevel(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    let lastDistance = 0;
    const handleTouch = (opt) => {
      if (opt.e.touches && opt.e.touches.length === 2) {
        const touch1 = opt.e.touches[0];
        const touch2 = opt.e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        
        if (lastDistance > 0) {
          const delta = dist / lastDistance;
          let zoom = fc.getZoom() * delta;
          if (zoom > 20) zoom = 20;
          if (zoom < 0.1) zoom = 0.1;
          
          const center = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
          };
          fc.zoomToPoint(center, zoom);
          setZoomLevel(zoom);
        }
        lastDistance = dist;
      }
    };

    fc.on('mouse:wheel', handleMouseWheel);
    fc.on('touch:gesture', handleTouch);

    return () => {
      if (unsubscribe) unsubscribe();
      if (saveTimeoutR.current) {
        clearTimeout(saveTimeoutR.current);
        // Forzar un último guardado si hay cambios pendientes
        if (fcRef.current && user && activeTeamId && planId) {
          const state = serializarFrame();
          const frame = framesR.current[frameIdxR.current];
          if (frame && frame.id) {
            const fRef = doc(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId, 'frames', frame.id);
            setDoc(fRef, { state: JSON.stringify(state), updatedAt: serverTimestamp() }, { merge: true })
              .catch(e => console.error("Error en guardado final:", e));
          }
        }
      }
      ro.disconnect();
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      fc.off('object:modified', onChange);
      fc.off('object:added',    onChange);
      fc.off('object:removed',  onChange);
      fc.off('mouse:down', onMouseDownClone);
      fc.off('mouse:wheel', handleMouseWheel);
      fc.off('touch:gesture', handleTouch);
      fc.dispose();
    };
  }, [user, planId, activeTeamId, cargarFrame, serializarFrame, saveFrameState, pushToHistory]);

  // ─── Auto-redibujar y Guardar al cambiar formación ──────────────────────────

  // ─── Field type change ────────────────────────────────────────────────────
  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr || playingR.current) return;

    const oldType = toLibType(fr.currentType);
    const newType = toLibType(fieldType);
    const oldBounds = { ...fr.getFieldBounds() };
    const oldScale = oldBounds.scale;

    // Capturar posiciones relativas al campo completo ANTES del cambio
    // Incluimos materiales para que también se reposicionen y escalen
    const objectsToMove = fc.getObjects().filter(o => o.data?.type === 'player' || o.data?.type === 'material');
    const savedStates = objectsToMove.map(obj => {
      let relX_full;
      if (oldType === 'half_attack') {
        relX_full = 0.5 + (obj.left - oldBounds.x) / (oldBounds.w * 2);
      } else if (oldType === 'half_defense') {
        relX_full = (obj.left - oldBounds.x) / (oldBounds.w * 2);
      } else {
        relX_full = (obj.left - oldBounds.x) / oldBounds.w;
      }
      const relY_full = (obj.top - oldBounds.y) / oldBounds.h;
      return { obj, relX_full, relY_full };
    });

    // Cambiar vista del campo (el renderer ahora calcula su propia escala óptima)
    if (newType === 'reduced') {
      fr.setReducedDimensions(reducedDim.w, reducedDim.h);
    }
    fr.draw(newType);

    // Actualizar visibilidad de TODOS los objetos según el nuevo zoom/recorte
    const objects = fc.getObjects();
    objects.forEach(obj => {
      if (obj.data?.xRel !== undefined && obj.data?.yRel !== undefined) {
        const point = fr.getCanvasPoint(obj.data.xRel, obj.data.yRel);
        const isVisible = (
          point.x >= -20 && 
          point.x <= fc.width + 20 &&
          point.y >= -20 &&
          point.y <= fc.height + 20
        );
        obj.set({ 
          left: point.x, 
          top: point.y, 
          visible: isVisible 
        });
      }
    });

    const newBounds = fr.getFieldBounds();
    const newScale = newBounds.scale;
    const scaleFactor = newScale / oldScale;

    // Reposicionar y escalar objetos existentes
    syncingR.current = true;
    savedStates.forEach(({ obj, relX_full, relY_full }) => {
      let newX;
      if (newType === 'half_attack') {
        newX = newBounds.x + (relX_full - 0.5) * 2 * newBounds.w;
      } else if (newType === 'half_defense') {
        newX = newBounds.x + relX_full * 2 * newBounds.w;
      } else {
        newX = newBounds.x + relX_full * newBounds.w;
      }
      const newY = newBounds.y + relY_full * newBounds.h;
      
      // Actualizar posición
      obj.set({ left: newX, top: newY });
      
      // Escalar materiales para mantener tamaño relativo al campo (Zoom effect)
      if (obj.data?.type === 'material') {
        obj.scale(obj.scaleX * scaleFactor);
      }
      
      obj.setCoords();
    });
    syncingR.current = false;

    fc.renderAll();
    ensurePlayersOnTop();
    saveFrameState();
    pushToHistory();
  }, [fieldType]); // eslint-disable-line

  const formationRunCountR = useRef(0);
  const lastFormationR = useRef({ local: '4-3-3', rival: '4-3-3', isSwapped: false, fieldType: 'full' });

  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr || playingR.current || !ready || syncingR.current) return;
    
    // Comparar si realmente hubo un cambio en la formación o tipo de campo
    // Si los valores coinciden con el último renderizado, no sobreescribimos el canvas
    const hasFormationChanged = 
      lastFormationR.current.local !== localFormation || 
      lastFormationR.current.rival !== rivalFormation ||
      lastFormationR.current.isSwapped !== isSwapped ||
      lastFormationR.current.fieldType !== fieldType;

    if (!hasFormationChanged) return;

    // Actualizamos la referencia para el próximo cambio
    lastFormationR.current = { local: localFormation, rival: rivalFormation, isSwapped, fieldType };

    // Si es la primera vez que se monta el componente y NO hay cambio real (carga de DB)
    // omitimos para no pisar lo que cargó cargarFrame
    if (formationRunCountR.current === 0) {
      formationRunCountR.current++;
      return;
    }

    // Ensure renderer has latest dimensions and bounds
    fr.draw(toLibType(fieldType));

    // Clear previous players before adding new ones
    const objects = [...fc.getObjects()];
    objects.forEach(obj => {
      if (obj.data && (obj.data.type === 'player' || obj.data.playerType)) {
        fc.remove(obj);
      }
    });

    syncingR.current = true;
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    ensurePlayersOnTop();
    syncingR.current = false;

    saveFrameState();
    pushToHistory();
  }, [localFormation, rivalFormation, isSwapped, showRival, fieldType, ready]); // eslint-disable-line

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
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr) return;
    fc.clear();
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    saveFrameState();
    pushToHistory();
  };

  // ─── Capture Canvas as Image ──────────────────────────────────────────────
  const handleCapture = async (download = true, silent = false) => {
    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    
    if (!fc || !fieldCanvas || !user || !activeTeamId) {
      if (!silent && !user) alert("Debes iniciar sesión para capturar.");
      if (!silent && user && !activeTeamId) alert("Debes seleccionar un equipo activo.");
      return null;
    }

    if (!silent) setIsCapturing(true);

    try {
      // 1. Crear canvas temporal de alta resolución (Consistencia entre dispositivos)
      // Usamos una resolución Full HD (1920x1280) para máxima calidad profesional
      const targetWidth = 1920;
      const targetHeight = Math.round(targetWidth / 1.5);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const ctx = tempCanvas.getContext('2d');

      // 2. Redibujar el CAMPO directamente en el canvas de captura
      // Esto garantiza que el campo esté a la misma resolución que los jugadores
      // y evita el "desplazamiento" por escalado de imagen
      const tempRenderer = new FieldRenderer(tempCanvas, { padding: { v: 12, h: 16 } });
      tempRenderer.draw(toLibType(fieldType));

      // 3. Obtener el contenido de Fabric a la resolución objetivo
      const multiplier = targetWidth / fc.width;
      const fabricDataUrl = fc.toDataURL({
        format: 'png',
        multiplier: multiplier
      });
      
      const fabricImg = new Image();
      fabricImg.src = fabricDataUrl;
      await new Promise((resolve, reject) => {
        fabricImg.onload = resolve;
        fabricImg.onerror = reject;
      });

      // 4. Combinar: Dibujar Fabric sobre el campo redibujado
      ctx.drawImage(fabricImg, 0, 0, targetWidth, targetHeight);

      // 5. Generar imagen final (PNG sin pérdida para máxima calidad)
      const dataURL = tempCanvas.toDataURL('image/png', 1.0);

      // 6. Generar MINIATURA optimizada para Firestore (Evita error de 1MB y "Save Stuck")
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 300; // Suficiente para previsualización
      thumbCanvas.height = 200;
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(tempCanvas, 0, 0, 300, 200);
      const thumbnailDataURL = thumbCanvas.toDataURL('image/jpeg', 0.6); // Muy ligera

      if (download) {
        const link = document.createElement('a');
        link.download = `mister11-tactica-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 7. Subir a Firebase Storage y Firestore
      let downloadURL = null;
      let storagePath = null;
      
      try {
        storagePath = `captures/${user.uid}/${activeTeamId}/${Date.now()}.png`;
        const storageRef = ref(storage, storagePath);
        
        const uploadWithTimeout = (promise, ms) => Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);

        // Subir imagen completa a Storage
        await uploadWithTimeout(uploadString(storageRef, dataURL, 'data_url'), 8000);
        downloadURL = await uploadWithTimeout(getDownloadURL(storageRef), 5000);
      } catch (uploadErr) {
        console.warn("Falló subida a Storage, usando fallback local:", uploadErr);
        storagePath = null; // No hay path en storage
      }

      // 8. SIEMPRE guardar referencia en Firestore (Colección de capturas sueltas)
      // Lo hacemos fuera del try-catch de storage para que aparezca en la lista sí o sí
      try {
        const captureDocRef = doc(collection(db, 'users', user.uid, 'teams', activeTeamId, 'captures'));
        await setDoc(captureDocRef, {
          id: captureDocRef.id,
          url: downloadURL || dataURL, // Imagen completa
          thumbnail: thumbnailDataURL, // Miniatura para la rejilla
          storagePath: storagePath,
          title: `Captura Táctica (${new Date().toLocaleTimeString()})`,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert("✅ Captura guardada. Puedes verla en Sesiones > Capturas.");
      } catch (dbErr) {
        console.error("Error guardando captura en Firestore:", dbErr);
        alert("❌ Error al guardar en la base de datos.");
      }

      if (!silent) setIsCapturing(false);
      
      // Retornamos un objeto con ambas URLs para que handleSave decida qué usar
      return {
        full: downloadURL || dataURL, // URL de Storage o Base64 grande
        thumb: thumbnailDataURL       // Base64 pequeño (<50KB) siempre disponible
      };

    } catch (err) {
      console.error("Error en captura:", err);
      if (!silent) alert("Error al generar la captura. Revisar consola.");
      setIsCapturing(false);
      return null;
    }
  };

  // ─── Save entire plan (Frames + Meta) ───────────────────────────────────
  const handleSave = async () => {
    const btn = document.getElementById('btn-guardar-pizarra');
    const originalText = btn ? btn.innerHTML : '💾 GUARDAR';

    if (!user || !activeTeamId) {
      alert("Error: Usuario o Equipo no identificados.");
      return;
    }
    
    // Bloquear UI
    if (btn) {
      btn.innerHTML = '⏳ Guardando...';
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    }

    try {
      // 1. Guardar estado lógico de los frames
      await saveFrameState(true);

      // 2. Generar captura (silent)
      const captureResult = await handleCapture(false, true);
      const finalThumb = captureResult?.thumb || null;

      // 3. Guardar Metadatos del ejercicio
      const exerciseRef = doc(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId);
      
      // IMPORTANTE: Nunca guardar base64 grande en el documento del ejercicio
      // Usamos el thumbnail de 300px que garantizamos que es < 1MB
      await setDoc(exerciseRef, {
        id: planId,
        title: `Pizarra Táctica (${new Date().toLocaleDateString()})`,
        type: 'pizarra',
        framesCount: (framesR.current || []).length,
        thumbnail: finalThumb, // Siempre miniatura ligera
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (btn) btn.innerHTML = '✅ Guardado';
      
    } catch (err) {
      console.error("Error al guardar pizarra:", err);
      if (btn) btn.innerHTML = '❌ Error';
    } finally {
      setTimeout(() => { 
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.pointerEvents = 'auto';
        }
      }, 2000);
    }
  };


  // ─── Add Frame ────────────────────────────────────────────────────────────
  const addFrame = async () => {
    if (!user) return;
    const fc = fcRef.current;
    if (!fc) return;

    // 1. Save current before adding
    await saveFrameState();

    // 2. Clone current state
    const state = serializarFrame();
    
    try {
      if (!activeTeamId) return;
      const framesColRef = collection(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId, 'frames');
      const newFrameData = {
        name: `Frame ${frames.length + 1}`,
        state: JSON.stringify(state),
        duration: 800,
        order: frames.length,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(framesColRef, newFrameData);
      
      const newFrame = {
        id: docRef.id,
        ...newFrameData,
        state // Keep it as object in local state
      };

      setFrames(prev => {
        const next = [...prev, newFrame];
        framesR.current = next;
        return next;
      });
      
      const nextIdx = frames.length; 
      setFrameIdx(nextIdx);
      await setDoc(exerciseDocRef, exerciseData);
      alert("✅ Ejercicio guardado en tu Biblioteca Cloud.");
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("❌ Error al guardar el ejercicio.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Load Frame ──────────────────────────────────────────────────────────
  const loadFrame = (idx) => {
    const fc = fcRef.current;
    if (!fc || !framesR.current[idx]) return;
    saveFrameState(true); // Save current immediately
    
    setTimeout(() => {
      syncingR.current = true;
      cargarFrame(framesR.current[idx].state, () => {
        syncingR.current = false;
        fc.renderAll();
        setFrameIdx(idx);
        frameIdxR.current = idx;
      });
    }, 80);
  };

  // ─── Delete Frame ─────────────────────────────────────────────────────────
  const deleteFrame = async () => {
    const cur = frameIdxR.current;
    if (framesR.current.length <= 1) return;
    
    const frameToDelete = framesR.current[cur];
    
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
    
    // Firebase delete
    if (user && frameToDelete && frameToDelete.id && activeTeamId) {
      try {
        const frameRef = doc(db, 'users', user.uid, 'teams', activeTeamId, 'exercises', planId, 'frames', frameToDelete.id);
        await deleteDoc(frameRef);
      } catch (err) {
        console.error("Error deleting frame in Firestore:", err);
      }
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
    const player = createPlayer(center.left, center.top, { color, label, type, pos: '' });
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
      <div style={{ padding: '0 0 8px' }}>
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
          onColorChange={setRivalColor}
          formation={rivalFormation}
          onFormationChange={setRivalFormation}
        />
        <TeamCard 
          color={jokerColor} 
          name="Comodín" 
          count={0} 
          onAdd={() => addManualPlayer('joker')} 
          onColorChange={setJokerColor}
        />
      </div>

      <div className="panel-title">ACCIONES</div>
      <div className="acciones-panel-container-grid">
        <button 
          className={`toggle-rival ${showRival ? 'active' : ''}`}
          onClick={() => setShowRival(!showRival)}
        >
          {showRival ? '👁 RIVAL' : '👁 RIVAL'}
        </button>
        <button className="btn-delete-pizarra" onClick={deleteSelected}>🗑 BORRAR</button>
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
          const isOpen = openCats[catKey];
          return (
            <div key={catKey} className="material-category">
              <div className="collapsible-header" onClick={() =>
                setOpenCats(p => ({ ...p, [catKey]: !p[catKey] }))}>
                <span className="collapsible-arrow">{isOpen ? '▼' : '▶'}</span>
                <span className="material-header-label">{catLabel}</span>
              </div>
              {isOpen && (
                <div className="material-items">
                  {catItems.map(id => {
                    const mat = MATERIALS_LIBRARY[id];
                    if (!mat) return null;
                    return (
                      <div key={id}
                        className={`material-item ${placingMat === id ? 'active' : ''}`}
                        onClick={() => { 
                          setPlacingMat(id); 
                          setActiveTool('place_material');
                          if (isMobile) setShowMatsDrawer(false);
                        }}>
                        <div dangerouslySetInnerHTML={{ __html: mat.svgPanel }} />
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
  const isLandscape = window.innerWidth > window.innerHeight;

  return (
    <div className={`pizarra-container ${isMobile ? 'mobile' : 'desktop'} ${isLandscape ? 'landscape' : 'portrait'}`} 
      style={{ touchAction: 'pan-y' }}>

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="pizarra-topbar">
        <div className="topbar-scroll-wrapper">
          {/* GRUPO ESENCIAL: Siempre visible */}
          <div className="topbar-group essential">
            <select className="topbar-select" value={fieldType}
              onChange={e => setFieldType(e.target.value)}>
              <option value="full">Campo Completo</option>
              <option value="half-attack">½ Ataque</option>
              <option value="half-defense">½ Defensa</option>
              <option value="third_defense">1/3 Defensivo</option>
              <option value="third_mid">1/3 Medio</option>
              <option value="third_attack">1/3 Ofensivo</option>
              <option value="penalty_area">Área Penalti</option>
              <option value="f7">Fútbol 7 (65x45m)</option>
              <option value="f8">Fútbol 8 (62x46m)</option>
              <option value="futsal">Fútbol Sala (40x20m)</option>
              <option value="reduced">Campo Reducido</option>
              <option value="blank">Campo en Blanco</option>
            </select>
          </div>

          <div className="topbar-adaptive-content">
            {fieldType === 'reduced' && (
              <div className="topbar-group reduced-controls-group">
                <div className="reduced-controls">
                  <div className="slider-box">
                    <span>Ancho: {reducedDim.w}m</span>
                    <input type="range" min="10" max="105" value={reducedDim.w} 
                      onChange={e => {
                        const w = parseInt(e.target.value);
                        setReducedDim(p => ({ ...p, w }));
                        frRef.current?.setReducedDimensions(w, reducedDim.h);
                      }} 
                    />
                  </div>
                  <div className="slider-box">
                    <span>Alto: {reducedDim.h}m</span>
                    <input type="range" min="10" max="70" value={reducedDim.h} 
                      onChange={e => {
                        const h = parseInt(e.target.value);
                        setReducedDim(p => ({ ...p, h }));
                        frRef.current?.setReducedDimensions(reducedDim.w, h);
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="topbar-group">
              <button 
                className={`topbar-btn ${isSwapped ? 'active' : ''}`} 
                onClick={() => setIsSwapped(!isSwapped)}
                title="Cambiar lados de equipos"
              >
                ⇄ Lados
              </button>
            </div>

            {/* Drawing tools */}
            <div className="topbar-group tools">
              {Object.values(TOOLS).map(tool => (
                <button
                  key={tool.id}
                  className={`tool-icon-btn ${activeTool === tool.id ? 'active' : ''}`}
                  title={tool.label}
                  onClick={() => {
                    setActiveTool(tool.id);
                    if (isMobile) setShowMoreMenu(false);
                  }}
                  dangerouslySetInnerHTML={{ __html: tool.icon }}
                />
              ))}
            </div>

            <div className="topbar-group color-picker-container" style={{ position: 'static' }}>
              <button
                className="topbar-btn color-trigger"
                onClick={(e) => { 
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker); 
                  setShowWidthPicker(false); 
                }}
                title="Color de trazo"
              >
                <div className="current-color-preview" style={{ backgroundColor: activeColor }} />
              </button>
            </div>

            <div className="topbar-group width-picker-container" style={{ position: 'static' }}>
              <button
                className="topbar-btn width-trigger"
                onClick={(e) => { 
                  e.stopPropagation();
                  setShowWidthPicker(!showWidthPicker); 
                  setShowColorPicker(false); 
                }}
                title="Grosor de trazo"
              >
                <span className="current-width-label">
                  {Object.values(STROKE_WIDTHS).find(v => v.value === activeWidth)?.label || 'Fino'}
                </span>
              </button>
            </div>

            <div className="topbar-divider" />

            {/* Actions */}
            <div className="topbar-group actions">
              <button className="topbar-btn" onClick={() => {
                const fc = fcRef.current;
                if (!fc) return;
                const zoom = fc.getZoom() * 1.1;
                fc.setZoom(zoom);
                setZoomLevel(zoom);
              }} title="Acercar">🔍+</button>
              <button className="topbar-btn" onClick={() => {
                const fc = fcRef.current;
                if (!fc) return;
                const zoom = fc.getZoom() / 1.1;
                fc.setZoom(zoom);
                setZoomLevel(zoom);
              }} title="Alejar">🔍-</button>
              <button className="topbar-btn" onClick={() => {
                const fc = fcRef.current;
                if (!fc) return;
                fc.setZoom(1);
                fc.absolutePan({ x: 0, y: 0 });
                setZoomLevel(1);
              }} title="Reiniciar Zoom">🏠</button>
              <div className="topbar-divider" />
              <button className="topbar-btn" onClick={undo} disabled={histCount === 0} title="Deshacer (Ctrl+Z)">↩</button>
              <button className="topbar-btn" onClick={redo} disabled={redoCount === 0} title="Rehacer (Ctrl+Y)">↪</button>
              <button className="topbar-btn danger" onClick={clearCanvas} title="Limpiar todo el canvas">🗑</button>
              <button className="topbar-btn" onClick={() => handleCapture(true)} disabled={isCapturing} title="Descargar Imagen">📸</button>
              <button id="btn-guardar-pizarra" className="topbar-btn primary" onClick={handleSave} disabled={isCapturing} title="Guardar pizarra y captura">💾 GUARDAR</button>
            </div>
          </div>{/* ── FIN topbar-scroll-wrapper ── */}
        </div>{/* ── FIN pizarra-topbar ── */}
      </div>

      {/* ── MAIN BOARD ────────────────────────────────────────────────────── */}
      <div className="pizarra-main">

        {!isMobile && (
          <div className="panel-izq">
            <TeamsPanel />
          </div>
        )}

        <div id="canvas-container" className="canvas-area" ref={containerRef}>
          {/* Field Canvas */}
          <canvas ref={fieldCanvasRef} className="field-renderer-canvas"
            style={{ pointerEvents: 'none', zIndex: 1 }} />
          
          {/* Fabric Canvas */}
          <canvas id="fabric-canvas" ref={fabricElemRef} className="fabric-canvas-elem"
            style={{ zIndex: 2, touchAction: 'none' }} />

          {/* Placing-material indicator */}
          {placingMat && (
            <div className="placing-hint" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              📍 Haz clic en el campo para colocar el material. 
              <button onClick={() => { setPlacingMat(null); setActiveTool('select'); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          )}

          {/* Floating Buttons - Solo en móvil */}
          {isMobile && (
            <div className="floating-actions">
              <button 
                className="btn-floating-left" 
                onClick={() => { setShowTeamsDrawer(true); setShowMatsDrawer(false); }}
                title="Equipos"
              >
                📋
              </button>
              <button 
                className="btn-floating-right" 
                onClick={() => { setShowMatsDrawer(true); setShowTeamsDrawer(false); }}
                title="Materiales"
              >
                🧰
              </button>
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
          <button className="timeline-btn-nav" onClick={() => loadFrame(0)}
            disabled={isPlaying || frameIdx === 0}>⏮</button>
          <button className="timeline-btn-nav"
            onClick={() => loadFrame(Math.max(0, frameIdx - 1))}
            disabled={isPlaying || frameIdx === 0}>◀</button>

          {isPlaying
            ? <button className="timeline-btn-nav play" onClick={stopAnimation}>⏹</button>
            : <button className="timeline-btn-nav play" onClick={playAnimation}
                disabled={frames.length < 2}>▶</button>
          }

          <button className="timeline-btn-nav"
            onClick={() => loadFrame(Math.min(frames.length - 1, frameIdx + 1))}
            disabled={isPlaying || frameIdx === frames.length - 1}>▶</button>
          <button className="timeline-btn-nav"
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

          <button className="btn-add-frame" onClick={addFrame} disabled={isPlaying}>+ Frame</button>
          <button className="btn-trash-frame" onClick={deleteFrame}
            disabled={isPlaying || frames.length <= 1}>🗑</button>
        </div>
      </div>

      {/* ── MOBILE DRAWERS ───────────────────────────────────────────────── */}
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

      {/* ── Dropdowns Flotantes (Ventanas Emergentes) ── */}
      {showColorPicker && (
        <div className="pizarra-dropdown color-grid popup-window" 
          style={{ 
            position: 'fixed', 
            top: '70px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 10002,
            width: 'max-content',
            display: 'grid',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            border: '2px solid var(--accent)',
            background: 'var(--bg-card)'
          }}>
          <div className="popup-arrow" style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid var(--accent)' }} />
          {STROKE_COLORS.map(c => (
            <div key={c.id}
              className={`color-swatch-item ${activeColor === c.hex ? 'active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={(e) => { 
                e.stopPropagation();
                setActiveColor(c.hex); 
                setShowColorPicker(false); 
              }}
            />
          ))}
        </div>
      )}
      {showWidthPicker && (
        <div className="pizarra-dropdown width-list popup-window" 
          style={{ 
            position: 'fixed', 
            top: '70px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 10002,
            width: 'max-content',
            minWidth: '220px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            border: '2px solid var(--accent)',
            background: 'var(--bg-card)'
          }}>
          <div className="popup-arrow" style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid var(--accent)' }} />
          {Object.entries(STROKE_WIDTHS).map(([k, v]) => (
            <button key={k}
              className={`dropdown-item ${activeWidth === v.value ? 'active' : ''}`}
              onClick={(e) => { 
                e.stopPropagation();
                setActiveWidth(v.value); 
                setShowWidthPicker(false); 
              }}>
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Small helper sub-component ──────────────────────────────────────────────
const TeamCard = ({ color, name, count, onAdd, onColorChange, formation, onFormationChange }) => (
  <div className="team-card-pizarra">
    <div className="team-header-pizarra">
      <div style={{ position: 'relative', width: 22, height: 22 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: '1px solid white' }} />
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
      <span className="team-name-pizarra">{name}</span>
      <button className="btn-add-player-pizarra" onClick={onAdd}>+</button>
    </div>

    {onFormationChange && (
      <select 
        value={formation} 
        onChange={(e) => onFormationChange(e.target.value)}
        className="formation-select-pizarra"
      >
        {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    )}
  </div>
);

export default PizarraTactica;
