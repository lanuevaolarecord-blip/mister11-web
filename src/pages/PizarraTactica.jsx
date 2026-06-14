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

import { MATERIALS_LIBRARY, MATERIALS_BY_CATEGORY, placeMaterialOnCanvas, applyMister11Controls } from '../lib/mister11-materials.js';
import { TOOLS, STROKE_COLORS, STROKE_WIDTHS, ToolManager } from '../lib/mister11-tools.js';
import { FieldRenderer, FORMATIONS } from '../lib/mister11-field.js';
import { useAuth } from '../context/AuthContext';
import { usePizarra } from '../context/PizarraContext';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, addDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy, getDoc, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../firebaseConfig';
import { savePizarraLocal, getPizarraLocal, clearPizarraLocal } from '../lib/pizarraStorage';
import { getDocument, setDocument } from '../firebase/db';
import { downloadJSON, downloadImage, downloadVideo } from '../utils/download.js';
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
  // Referencias a Context
  const { guardarEstado, obtenerEstado } = usePizarra();
  const { isProActive } = usePlan();
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  
  // Bloquear scroll de la app mientras la Pizarra está abierta y resetear posición de scroll al inicio
  useEffect(() => {
    // Resetear scroll de la ventana y cuerpo
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTo(0, 0);
    if (document.body) document.body.scrollTo(0, 0);

    // Resetear contenedores de diseño comunes
    const scrollContainers = document.querySelectorAll('.app-container, .main-content, .main-wrapper');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });

    document.body.classList.add('pizarra-active');
    return () => document.body.classList.remove('pizarra-active');
  }, []);

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
  const defaultDrawnR = useRef(false); // prevent double default-formation draw
  const lastStateRef = useRef(null);  // PERSISTENCIA: último estado serializado (siempre actualizado)
  const planIdRef    = useRef(null);  // PERSISTENCIA: último planId conocido (para closures)
  const deletedFrameIdsR = useRef(new Set());

  // ─── Utilidades de Escala ─────────────────────────────────────────────────

  const serializarFrame = useCallback(() => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return { objects: [] };

    const objects = fc.getObjects().map(obj => {
      const serializado = obj.toObject(['data']);
      
      let absX = obj.left;
      let absY = obj.top;
      
      if (obj.type !== 'path' && obj.type !== 'line') {
        const matrix = obj.calcTransformMatrix();
        if (matrix) {
          const pt = fabric.util.transformPoint({ x: 0, y: 0 }, matrix);
          absX = pt.x;
          absY = pt.y;
        }
      }
      
      const { rx, ry } = fr.getRelativePoint(absX, absY);

      if (obj.data) {
        obj.data.xRel = rx;
        obj.data.yRel = ry;
      }

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

  // Ref para prevenir race conditions al cargar frames asíncronamente
  const loadTokenR = useRef(0);

  const cargarFrame = useCallback((state, callback) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr || !state) {
      if (callback) callback();
      return;
    }

    // Incrementar token para invalidar cargas anteriores en progreso
    loadTokenR.current += 1;
    const currentToken = loadTokenR.current;

    // Desactivamos temporalmente el guardado para evitar bucles durante la carga
    syncingR.current = true;

    // No desconectamos los listeners porque syncingR.current ya evita bucles infinitos de guardado
    // fc.off(...) eliminado para reparar undo/redo

    fc.clear();
    const objsToEnliven = Array.isArray(state.objects) ? state.objects : [];
    
    if (objsToEnliven.length === 0) {
      syncingR.current = false;
      if (callback) callback();
      return;
    }

    const enlivenedData = objsToEnliven.map(objData => {
      let left, top, visible = true;
      
      if (objData.xRel !== undefined && objData.yRel !== undefined) {
        const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
        left = point.x;
        top  = point.y;
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
      // Si el token cambió, significa que otra carga inició antes de que esta terminara.
      // Abortamos para evitar duplicación masiva de objetos en el canvas (efecto estela).
      if (loadTokenR.current !== currentToken) {
        console.warn('[Pizarra] ⚠️ Carga asíncrona abortada por race condition.');
        return;
      }

      objects.forEach(o => {
        // Restaurar borde blanco en los jugadores
        const isPlayer = o.data?.type === 'player' || 
                         o.data?.tipo === 'jugador' || 
                         (o.type === 'group' && 
                          o.getObjects && 
                          o.getObjects().length === 2 && 
                          o.getObjects().some(child => child.type === 'circle') && 
                          o.getObjects().some(child => child.type === 'text'));

        if (isPlayer && o.type === 'group') {
          const circle = o.getObjects().find(child => child.type === 'circle');
          if (circle) {
            const r = o.radius || circle.radius || RADIO_JUGADOR;
            const sw = o.data?._strokeWidth || Math.max(2, r * 0.18);
            circle.set({ stroke: '#FFFFFF', strokeWidth: sw });
            circle.dirty = true;
            o.set({ stroke: '#FFFFFF', strokeWidth: sw });
            o.dirty = true;
          }
        }
        applyMister11Controls(o);
        fc.add(o);
      });
      ensurePlayersOnTop();
      fc.renderAll();
      
      // La sincronización ha terminado, reactivar eventos
      syncingR.current = false;
      // Los listeners se reconectan desde el useEffect principal después del callback
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
  const { user, activeTeamId, getTeamPath: getTeamPathRaw } = useAuth();
  const getTeamPath = useCallback((teamId = activeTeamId) => {
    return getTeamPathRaw(teamId || activeTeamId);
  }, [getTeamPathRaw, activeTeamId]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Usar planId de la URL o recuperar el último usado para este equipo (Persistencia al navegar)
  const [planId, setPlanId] = useState(() => {
    const fromUrl = searchParams.get('id');
    if (fromUrl) return fromUrl;
    return null; // Se resolverá en un useEffect
  });

  useEffect(() => {
    if (!planId && user && activeTeamId) {
      // Intentar recuperar la última pizarra activa para no crear duplicados vacíos
      const lastId = localStorage.getItem(`mister11_last_pizarra_${activeTeamId}`);
      if (lastId) {
        setPlanId(lastId);
        setSearchParams({ id: lastId });
      } else {
        const newId = `pizarra-${Date.now()}`;
        setPlanId(newId);
        setSearchParams({ id: newId });
      }
    } else if (planId && activeTeamId) {
      // Guardar el ID actual como el último editado
      localStorage.setItem(`mister11_last_pizarra_${activeTeamId}`, planId);
    }
  }, [planId, activeTeamId, user, setSearchParams]);

  // React state (UI)
  const [ready,        setReady]        = useState(false);
  const [planName,     setPlanName]     = useState('Sin título');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth <= 1024);
  const [showTeamsDrawer, setShowTeamsDrawer] = useState(false);
  const [showMatsDrawer, setShowMatsDrawer] = useState(false);
  // Drawers laterales para tablet (desktop sin móvil)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
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
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [localColor,     setLocalColor]     = useState('#4CAF7D');
  const [rivalColor,     setRivalColor]     = useState('#E53935');
  const [jokerColor,     setJokerColor]     = useState('#D4A843');
  const [localFormation, setLocalFormationState] = useState('4-3-3');
  const [rivalFormation, setRivalFormationState] = useState('4-3-3');
  const [isSwapped, setIsSwappedState] = useState(false);
  const [showRival, setShowRivalState] = useState(false);
  const [fieldType, setFieldTypeState] = useState('full');
  
  const setLocalFormation = (v) => { 
    setLocalFormationState(v); 
    aplicarFormacion('local', v);
  };
  const setRivalFormation = (v) => { 
    setRivalFormationState(v); 
    if (!showRival) {
      setShowRivalState(true);
    }
    aplicarFormacion('rival', v);
  };
  const setIsSwapped = (v) => { 
    setIsSwappedState(v); 
  };
  const setShowRival = (v) => { 
    setShowRivalState(v); 
  };
  const setFieldType = (v) => { 
    setFieldTypeState(v); 
  };

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [histCount,      setHistCount]      = useState(0);
  const [redoCount,      setRedoCount]      = useState(0);
  const [reducedDim,     setReducedDim]     = useState({ w: 40, h: 30 });
  const [zoomLevel,      setZoomLevel]      = useState(1);
  const [isCapturing,    setIsCapturing]    = useState(false);
  const [isRecording,    setIsRecording]    = useState(false);
  const fileImportInputRef = useRef(null);

  const autoExport = new URLSearchParams(location.search).get('autoExport');
  const [autoExportTriggered, setAutoExportTriggered] = useState(false);

  useEffect(() => {
    if (autoExport === 'true' && !autoExportTriggered && frames.length > 1 && fcRef.current && fieldCanvasRef.current && !isRecording) {
      setAutoExportTriggered(true);
      setTimeout(() => {
        exportAnimationVideo();
      }, 1500); // Give it time to render the frame completely
    }
  }, [frames, autoExport, autoExportTriggered, isRecording]);

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
      if (user.uid === 'invitado-local') return;
      try {
        if (!activeTeamId) return;
        const frameRef = doc(db, getTeamPath(), 'pizarras', planId, 'frames', frame.id);
        const parentRef = doc(db, getTeamPath(), 'pizarras', planId);
        
        await Promise.all([
          setDoc(frameRef, {
            state: JSON.stringify(state),
            updatedAt: serverTimestamp()
          }, { merge: true }),
          setDoc(parentRef, {
            localFormation,
            rivalFormation,
            isSwapped,
            showRival,
            fieldType,
            updatedAt: serverTimestamp()
          }, { merge: true })
        ]);
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

  const resetHistory = useCallback(() => {
    pastR.current = [];
    futureR.current = [];
    presentR.current = null;
    setHistCount(0);
    setRedoCount(0);
  }, []);

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

  // ─── Export Animation JSON ────────────────────────────────────────────────
  const exportAnimationJSON = () => {
    saveFrameState(true);
    const exportData = {
      app: 'Mister11',
      version: '1.0.0',
      title: `Pizarra - ${new Date().toLocaleDateString()}`,
      fieldType: fieldType,
      frames: (framesR.current || []).map(f => ({
        name: f.name || '',
        state: typeof f.state === 'string' ? f.state : JSON.stringify(f.state),
        duration: f.duration || 800,
        order: f.order ?? 0
      }))
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `pizarra-animacion-${planId}.json`;
    // Usa downloadJSON que soporta Capacitor Filesystem en APK
    downloadJSON(jsonString, filename);
  };

  // ─── Import Animation JSON ────────────────────────────────────────────────
  const importAnimationJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeTeamId) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.app !== 'Mister11' || !Array.isArray(data.frames)) {
          showToast('El archivo no tiene el formato válido de animación de Míster11.', 'error');
          return;
        }
        if (!window.confirm(`¿Importar esta animación con ${data.frames.length} frames? Esto reemplazará los frames actuales.`)) {
          return;
        }

        const isGuest = user.uid === 'invitado-local';
        let framesColRef = null;
        if (!isGuest) {
          framesColRef = collection(db, getTeamPath(), 'pizarras', planId, 'frames');
          const existingSnap = await getDocs(framesColRef);
          for (const dDoc of existingSnap.docs) {
            await deleteDoc(dDoc.ref);
          }
        }

        const newFrames = [];
        for (let i = 0; i < data.frames.length; i++) {
          const f = data.frames[i];
          const parsedState = typeof f.state === 'string' ? JSON.parse(f.state) : f.state;
          const newFrameData = {
            name: f.name || `Frame ${i + 1}`,
            state: JSON.stringify(parsedState),
            duration: f.duration || 800,
            order: i,
            createdAt: new Date().toISOString()
          };

          let frameId;
          if (isGuest) {
            frameId = `frame-${Date.now()}-${i}`;
          } else {
            const docRef = await addDoc(framesColRef, {
              ...newFrameData,
              createdAt: serverTimestamp()
            });
            frameId = docRef.id;
          }

          newFrames.push({
            id: frameId,
            ...newFrameData,
            state: parsedState
          });
        }
        if (data.fieldType) {
          setFieldTypeState(data.fieldType);
          const libType = toLibType(data.fieldType);
          frRef.current?.draw(libType);
        }
        setFrames(newFrames);
        framesR.current = newFrames;
        setFrameIdx(0);
        frameIdxR.current = 0;
        if (newFrames.length > 0) {
          cargarFrame(newFrames[0].state, () => {
            fcRef.current?.renderAll();
            resetHistory();
            presentR.current = JSON.stringify(newFrames[0].state);
          });
        }
        showToast('¡Animación importada con éxito!', 'success');
      } catch (err) {
        console.error('Error al importar:', err);
        showToast('Error al procesar el archivo JSON de animación.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Export Animation Video (MP4/WebM) ────────────────────────────────────
  const exportAnimationVideo = async () => {
    if (!isProActive) {
      setUpgradeModal({ open: true, message: 'La exportación de animaciones en video MP4 es una función PRO. Sube de nivel para usarla.' });
      return;
    }
    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    if (!fc || !fieldCanvas || framesR.current.length < 2) {
      showToast("Necesitas al menos 2 frames para exportar un video.", 'info');
      return;
    }
    if (isRecording) return;
    setIsRecording(true);
    showToast("Generando video, por favor espera...", 'info');
    
    let recordingActive = true;
    
    try {
      // 1. Asegurar que los frames estén guardados antes de exportar
      await saveFrameState(true);
      
      // 2. Crear un canvas de grabación a ALTA RESOLUCIÓN (2x) para máxima nitidez
      const scale = 2;
      const recCanvas = document.createElement('canvas');
      recCanvas.width = fc.width * scale;
      recCanvas.height = fc.height * scale;
      const recCtx = recCanvas.getContext('2d');
      
      // Optimizar suavizado del renderizado
      recCtx.imageSmoothingEnabled = true;
      recCtx.imageSmoothingQuality = 'high';
      
      // 3. Capturar stream a 30fps con bitrate premium (8 Mbps) para calidad profesional
      const stream = recCanvas.captureStream(30);
      let options = { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps
      };
      
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 8000000 };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm', videoBitsPerSecond: 8000000 };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/mp4', videoBitsPerSecond: 8000000 };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { videoBitsPerSecond: 8000000 };
        }
      } else {
        options = { videoBitsPerSecond: 8000000 };
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      
      recorder.onstop = () => {
        recordingActive = false;
        const fileType = options.mimeType && options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: `video/${fileType}` });
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const dataURL = reader.result;
          const base64data = dataURL.split(',')[1];
          const filename = `animacion-mister11-${planId || 'export'}.${fileType}`;
          const finalMime = `video/${fileType}`;

          // Subir a Firebase Storage si el usuario está autenticado
          if (user && activeTeamId && user.uid !== 'invitado-local') {
            try {
              const storagePath = `pizarras/${getTeamPath()}/${planId}/video.${fileType}`;
              const storageRef = ref(storage, storagePath);
              
              // Subir video como data URL
              await uploadString(storageRef, dataURL, 'data_url');
              const downloadURL = await getDownloadURL(storageRef);
              
              // Actualizar el documento del ejercicio con la URL del video para que Sesiones.jsx lo vea
              const exerciseRef = doc(db, getTeamPath(), 'exercises', planId);
              await setDoc(exerciseRef, {
                videoUrl: downloadURL,
                videoMimeType: finalMime,
                updatedAt: serverTimestamp()
              }, { merge: true });
              
            } catch (uploadErr) {
              console.error("Error al guardar el video en la nube:", uploadErr);
            }
          }

          setIsRecording(false);
          const autoExport = new URLSearchParams(window.location.search).get('autoExport');
          if (autoExport === 'true' && window.parent) {
            window.parent.postMessage({ type: 'EXPORT_DONE', base64data, filename, mimeType: finalMime }, '*');
          } else {
            showToast("Video exportado exitosamente.", 'success');
            downloadVideo(base64data, filename, finalMime);
          }
        };
      };
      
      // 4. Render Combiner: Dibuja el campo y los jugadores escalados al tamaño de recCanvas
      const renderCombiner = () => {
        recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
        recCtx.drawImage(fieldCanvas, 0, 0, recCanvas.width, recCanvas.height);
        recCtx.drawImage(fabricElemRef.current, 0, 0, recCanvas.width, recCanvas.height);
      };
      
      // 5. Bucle de renderizado continuo sincronizado con la pantalla (para movimientos perfectos y suaves)
      const drawLoop = () => {
        if (!recordingActive) return;
        renderCombiner();
        requestAnimationFrame(drawLoop);
      };
      requestAnimationFrame(drawLoop);
      
      recorder.start();
      setIsPlaying(true);
      playingR.current = true;
      
      const runRecordingAnimation = (idx) => {
        if (!playingR.current) {
          recordingActive = false;
          if (recorder.state !== 'inactive') recorder.stop();
          return;
        }
        if (idx >= framesR.current.length - 1) {
          setIsPlaying(false);
          playingR.current = false;
          loadFrame(framesR.current.length - 1);
          setTimeout(() => {
            recordingActive = false;
            if (recorder.state !== 'inactive') recorder.stop();
          }, 500);
          return;
        }
        
        setFrameIdx(idx);
        frameIdxR.current = idx;
        const fA = framesR.current[idx];
        const fB = framesR.current[idx + 1];
        const dur = fB.duration || 800;
        
        cargarFrame(fA.state, () => {
          if (!playingR.current) {
            recordingActive = false;
            if (recorder.state !== 'inactive') recorder.stop();
            return;
          }
          const objs = fc.getObjects();
          const rawTargets = fB.state.objects || [];
          if (objs.length === 0 || objs.length !== rawTargets.length) {
            cargarFrame(fB.state, () => {
              if (!playingR.current) {
                recordingActive = false;
                if (recorder.state !== 'inactive') recorder.stop();
                return;
              }
              fc.renderAll();
              setTimeout(() => {
                runRecordingAnimation(idx + 1);
              }, 300);
            });
            return;
          }
          
          const targets = rawTargets.map(objData => {
            let left, top;
            if (objData.xRel !== undefined && objData.yRel !== undefined) {
              const point = frRef.current.getCanvasPoint(objData.xRel, objData.yRel);
              left = point.x;
              top  = point.y;
            } else {
              left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
              top  = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
            }
            return { left, top };
          });
          
          let completed = 0;
          objs.forEach((obj, i) => {
            const t = targets[i];
            const sLeft = obj.left || 0;
            const sTop  = obj.top  || 0;
            fabric.util.animate({
              startValue: 0, endValue: 1, duration: dur,
              easing: fabric.util.ease.easeInOutSine,
              onChange: (v) => {
                if (!playingR.current) return;
                obj.set({
                  left: sLeft + ((t.left || 0) - sLeft) * v,
                  top:  sTop  + ((t.top  || 0) - sTop ) * v,
                });
                fc.renderAll();
              },
              onComplete: () => {
                if (!playingR.current) return;
                completed++;
                if (completed === objs.length) {
                  cargarFrame(fB.state, () => {
                    if (!playingR.current) return;
                    fc.renderAll();
                    setTimeout(() => {
                      runRecordingAnimation(idx + 1);
                    }, 200);
                  });
                }
              },
            });
          });
        });
      };
      runRecordingAnimation(0);
    } catch (err) {
      console.error("Error al exportar video:", err);
      showToast("Error al exportar la animación como video.", 'error');
      setIsRecording(false);
      recordingActive = false;
      const autoExport = new URLSearchParams(window.location.search).get('autoExport');
      if (autoExport === 'true' && window.parent) {
        window.parent.postMessage('EXPORT_ERROR', '*');
      }
    }
  };

  // ─── Create a single player object ─────────────────────────────────────────
  const createPlayer = useCallback((x, y, options = {}) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return null;
    
    const { color = '#4CAF7D', label = '1', type = 'local', radius = RADIO_JUGADOR } = options;
    
    // Obtener coordenadas relativas al CAMPO REAL
    const { rx, ry } = fr.getRelativePoint(x, y);

    const borderWidth = Math.max(2, radius * 0.18);
    const circle = new fabric.Circle({
      radius: radius, originX: 'center', originY: 'center',
      fill: color,
      stroke: '#FFFFFF', strokeWidth: borderWidth,
    });
    const text = new fabric.Text(String(label), {
      fontSize: Math.round(radius * 0.85), fontWeight: 'bold', fill: '#FFFFFF',
      originX: 'center', originY: 'center',
    });
    const group = new fabric.Group([circle, text], {
      left: x, top: y,
      originX: 'center', originY: 'center',
      hasControls: true, hasBorders: false,
      // FIX: stroke en el Group para que sobreviva serialización/deserialización
      stroke: '#FFFFFF',
      strokeWidth: borderWidth,
      data: { 
        type: 'player',
        tipo: 'jugador',
        playerType: type,
        xRel: rx,
        yRel: ry,
        _strokeWidth: borderWidth  // guardar para restaurar al desserializar
      },
    });
    
    applyMister11Controls(group);

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

  // ─── Aplicar Formación Imperativa (Solución para Android/Táctil y Reset) ───
  const aplicarFormacion = useCallback((teamType, formationName) => {
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr || playingR.current || !ready) return;

    // Dibujar el fondo del campo primero
    fr.draw(toLibType(fieldType));

    // Borrar únicamente los jugadores del equipo que se va a aplicar
    const objects = [...fc.getObjects()];
    objects.forEach(obj => {
      if (obj.data && obj.data.type === 'player' && obj.data.playerType === teamType) {
        fc.remove(obj);
      }
    });

    const bounds = fr.getFieldBounds();
    if (!bounds || bounds.w === 0) return;

    const playerRadius = RADIO_JUGADOR;
    const positions = FORMATIONS[formationName] || FORMATIONS['4-3-3'];
    const libType = toLibType(fieldType);
    const margin = playerRadius + 6;

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
    const visibleLen = range.max - range.min;

    const side = (teamType === 'local') ? (isSwapped ? 'R' : 'L') : (isSwapped ? 'L' : 'R');
    const color = (teamType === 'local') ? localColor : rivalColor;

    syncingR.current = true;
    positions.forEach((pos, i) => {
      const isGk = i === 0;
      const rX = pos.relX ?? 0;
      const rY = pos.relY ?? 0;

      const effectiveRx = (side === 'L') ? rX : (1 - rX);
      const remappedRx = range.min + effectiveRx * visibleLen;
      const paddingRel = 0.03;
      const clampedRx = Math.max(range.min + paddingRel, Math.min(range.max - paddingRel, remappedRx));
      const clampedRy = Math.max(0.04, Math.min(0.96, rY));

      const pt = fr.getCanvasPoint(clampedRx, clampedRy);

      const finalX = Math.max(bounds.x + margin, Math.min(bounds.x + bounds.w - margin, pt.x));
      const finalY = Math.max(bounds.y + margin, Math.min(bounds.y + bounds.h - margin, pt.y));

      const player = createPlayer(finalX, finalY, {
        color: isGk ? '#FFD700' : color,
        label: i + 1,
        type: teamType,
        pos: pos.pos || '',
        radius: playerRadius,
      });
      if (player) fc.add(player);
    });

    ensurePlayersOnTop();
    syncingR.current = false;
    fc.renderAll();
    saveFrameState();
    pushToHistory();
    
    // PERSISTENCIA INMEDIATA TRAS APLICAR FORMACIÓN
    const frameState = serializarFrame();
    lastStateRef.current = frameState;
    if (activeTeamId && planId) {
      savePizarraLocal(activeTeamId, planId, frameState);
      guardarEstado(planId, frameState);
      try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
    }
  }, [createPlayer, localColor, rivalColor, isSwapped, fieldType, ready, saveFrameState, pushToHistory, serializarFrame, activeTeamId, planId, guardarEstado]);


  // ─── Initialize canvases once on mount ───────────────────────────────────
  useEffect(() => {
    // Reset state on team/plan change
    setFrames([]);
    setReady(false);
    readyR.current = false;
    
    if (!containerRef.current || !fieldCanvasRef.current || !fabricElemRef.current || !user || !activeTeamId || !planId) return;

    let W = containerRef.current.offsetWidth;
    let H = containerRef.current.offsetHeight;

    // Robust fallback if container is initially collapsed/not-laid-out:
    if (!W || !H) {
      W = window.innerWidth;
      H = Math.max(300, window.innerHeight - 120);
    }

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

    // 4. Obtener metadatos del plan (formación, campo, etc.)
    if (user.uid !== 'invitado-local') {
      const planDocRef = doc(db, getTeamPath(), 'pizarras', planId);
      getDoc(planDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlanName(data.name || 'Sin título');
          if (data.localFormation) setLocalFormationState(data.localFormation);
          if (data.rivalFormation) setRivalFormationState(data.rivalFormation);
          if (data.isSwapped !== undefined) setIsSwappedState(data.isSwapped);
          if (data.showRival !== undefined) setShowRivalState(data.showRival);
          if (data.fieldType) setFieldTypeState(data.fieldType);
        }
      }).catch(err => console.error("Error fetching plan metadata:", err));
    }
    // 5. CARGA DEL CANVAS - se ejecuta después de definir handlers (ver initCanvas() más abajo)
    let unsubscribe;
    // La inicialización real ocurre en initCanvas() definida más abajo

    // 6. Auto-save en cada cambio del canvas
    // Debounce manual de 1.5 segundos para pizarra/estado_actual en Firestore
    const autoguardarEstado = async () => {
      if (!user || !activeTeamId || defaultDrawnR.current === false) return;
      if (user.uid === 'invitado-local') return;
      
      const frameState = serializarFrame();
      setAutoSaveStatus('💾 Guardando...');
      try {
        // FIX: setDocument() no soporta rutas anidadas de Firestore (>2 segmentos)
        // Usar setDoc directamente con doc() que acepta segmentos múltiples
        const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
        await setDoc(estadoRef, {
          canvasState: JSON.stringify(frameState),
          framesCount: framesR.current?.length || 0,
          currentFrameIdx: frameIdxR.current || 0,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setAutoSaveStatus('✓ Guardado');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (err) {
        console.error("[Pizarra] Error en autoguardarEstado:", err);
        setAutoSaveStatus('❌ Error al guardar');
      }
    };

    const debouncedSaveEstado = () => {
      if (saveTimeoutR.current) clearTimeout(saveTimeoutR.current);
      saveTimeoutR.current = setTimeout(autoguardarEstado, 1500);
    };

    const onChange = (opt) => {
      if (syncingR.current) return;
      if (opt.target && opt.target.data && opt.target.data.type === 'temp') return;

      // Actualizar coordenadas relativas del objeto movido
      if (opt.target && frRef.current) {
        const targets = opt.target.type === 'activeSelection' ? (opt.target._objects || []) : [opt.target];
        targets.forEach(t => {
          if (t.data) {
            let absX = t.left;
            let absY = t.top;
            
            const matrix = t.calcTransformMatrix();
            if (matrix) {
              const pt = fabric.util.transformPoint({ x: 0, y: 0 }, matrix);
              absX = pt.x;
              absY = pt.y;
            }
            
            const { rx, ry } = frRef.current.getRelativePoint(absX, absY);
            t.data.xRel = rx;
            t.data.yRel = ry;
          }
        });
      }

      ensurePlayersOnTop();
      saveFrameState(false);
      pushToHistory();
      const frameState = serializarFrame();
      // PERSISTENCIA: Mantener siempre el estado más reciente en la ref
      lastStateRef.current = frameState;
      if (activeTeamId && planId) {
        savePizarraLocal(activeTeamId, planId, frameState);
        guardarEstado(planId, frameState);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
      }
      debouncedSaveEstado();
    };

    // Guardado al añadir/eliminar objetos (solo si NO es una carga)
    const onAddedOrRemoved = (opt) => {
      if (syncingR.current) return;
      if (opt.target && opt.target.data && opt.target.data.type === 'temp') return;
      console.log('[Pizarra] 💾 onAddedOrRemoved - guardando estado...');
      ensurePlayersOnTop();
      saveFrameState(false);
      pushToHistory();
      const frameState = serializarFrame();
      if (activeTeamId && planId) {
        savePizarraLocal(activeTeamId, planId, frameState);
        guardarEstado(planId, frameState);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
      }
      debouncedSaveEstado();
    };

    const onPathCreated = (opt) => {
      if (syncingR.current) return;
      if (opt.target && opt.target.data && opt.target.data.type === 'temp') return;
      if (opt.path) {
        opt.path.set({ data: { type: 'path' } });
      }
      ensurePlayersOnTop();
      saveFrameState(false);
      pushToHistory();
      const frameState = serializarFrame();
      if (activeTeamId && planId) {
        savePizarraLocal(activeTeamId, planId, frameState);
        guardarEstado(planId, frameState);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
        console.log('[Pizarra] 💾 Path guardado en localStorage y Context OK');
      }
      debouncedSaveEstado();
    };

    // ── Función para reconectar listeners (se llama tras cargarFrame) ──
    const attachListeners = () => {
      fc.off('object:modified');
      fc.off('object:added');
      fc.off('object:removed');
      fc.off('path:created');
      fc.on('object:modified', onChange);
      fc.on('object:added',    onAddedOrRemoved);
      fc.on('object:removed',  onAddedOrRemoved);
      fc.on('path:created',    onPathCreated);
      console.log('[Pizarra] 🎯 Listeners reconectados al canvas');
    };

    // cargarFrame con reconexión automática de listeners
    const cargarFrameConListeners = (state, callback) => {
      cargarFrame(state, () => {
        if (callback) callback();
        attachListeners();
      });
    };

    // 5. CARGA DEL CANVAS - Flujo de una sola fuente de verdad
    //    Prioridad:
    //      1. localStorage clave de EQUIPO (mister11_pizarra_active_${teamId}) — máxima prioridad
    //      2. localStorage clave de PLAN (planId específico)
    //      3. Firestore pizarraEstado
    //      4. Frames de Firestore
    //      5. Formación por defecto (solo si el canvas está vacío y no se ha dibujado aún)
    if (user && planId && activeTeamId) {
      // Clave de estado activo por equipo y plan (para segregación limpia de pizarras)
      const ACTIVE_STATE_KEY = `mister11_pizarra_active_${activeTeamId}_${planId}`;

      // ── FUENTE 0: Context API (Memoria volátil, mayor prioridad) ──
      let memoryCache = obtenerEstado(planId);

      // ── FUENTE 1: localStorage clave de EQUIPO y PLAN (máxima prioridad) ──
      let localCache = null;
      try {
        const raw = localStorage.getItem(ACTIVE_STATE_KEY);
        if (raw) localCache = JSON.parse(raw);
      } catch (_) {}

      // ── FUENTE 1b: localStorage clave de PLAN (fallback) ─────────────────────
      if (!localCache || !localCache.objects || localCache.objects.length === 0) {
        localCache = getPizarraLocal(activeTeamId, planId);
      }
      
      const cachedState = memoryCache || localCache;

      if (user.uid === 'invitado-local') {
        console.log("[Pizarra] Modo Invitado Local - Cargando en memoria/local únicamente");
        defaultDrawnR.current = true;
        if (cachedState && cachedState.objects && cachedState.objects.length > 0) {
          cargarFrameConListeners(cachedState, () => {
            ensurePlayersOnTop();
            fc.renderAll();
            if (!readyR.current) { readyR.current = true; setReady(true); }
          });
        } else {
          console.log("[Pizarra] Modo Invitado Local - Dibujando formación por defecto");
          const objsActuales = fc.getObjects().filter(o => o.data?.type !== 'field');
          objsActuales.forEach(o => fc.remove(o));
          syncingR.current = true;
          drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
          syncingR.current = false;
          attachListeners();
          const state = serializarFrame();
          try { localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(state)); } catch (_) {}
          savePizarraLocal(activeTeamId, planId, state);
          setFrames([{ id: 'frame-1', name: 'Frame 1', state, duration: 800, order: 0 }]);
          if (!readyR.current) { readyR.current = true; setReady(true); }
        }
        return;
      }

      const framesColRef = collection(db, getTeamPath(), 'pizarras', planId, 'frames');
      const estadoDocRef = doc(db, getTeamPath(), 'pizarraEstado', planId);

      if (cachedState && cachedState.objects && cachedState.objects.length > 0) {
        console.log("[Pizarra] ✅ Restaurando desde Contexto / localStorage");
        defaultDrawnR.current = true; // marcar que ya hay estado — no dibujar formación
        cargarFrameConListeners(cachedState, () => {
          ensurePlayersOnTop();
          fc.renderAll();
          if (!readyR.current) { readyR.current = true; setReady(true); }
        });
        // Solo suscribir frames para metadatos (sin sobreescribir canvas)
        const q = query(framesColRef, orderBy('order', 'asc'));
        unsubscribe = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            // FIX: filtrar frames que hemos eliminado localmente y aún no se han
            // propagado en Firestore (evita que el onSnapshot los restaure)
            const dbFrames = snap.docs
              .filter(d => !deletedFrameIdsR.current.has(d.id))
              .map(d => {
                const data = d.data();
                return { id: d.id, ...data, state: typeof data.state === 'string' ? JSON.parse(data.state) : data.state };
              });
            if (dbFrames.length > 0) {
              setFrames(dbFrames);
              framesR.current = dbFrames;
            }
          }
          if (!readyR.current) { readyR.current = true; setReady(true); }
        });
      } else {
        // ── FUENTE 2: Firestore pizarra/estado_actual ────────────────────────────────
        // FIX: getDocument() no soporta rutas anidadas — usar getDoc directamente
        const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
        getDoc(estadoRef).then(snap => {
          const data = snap.exists() ? snap.data() : null;
          if (data && data.canvasState) {
            const serverState = typeof data.canvasState === 'string' ? JSON.parse(data.canvasState) : data.canvasState;
            if (serverState && serverState.objects && serverState.objects.length > 0) {
              console.log("[Pizarra] ✅ Restaurando desde Firestore estado_actual");
              defaultDrawnR.current = true;
              cargarFrameConListeners(serverState, () => {
                ensurePlayersOnTop();
                fc.renderAll();
                lastStateRef.current = serverState;
                savePizarraLocal(activeTeamId, planId, serverState);
                try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(serverState)); } catch (_) {}
                if (!readyR.current) { readyR.current = true; setReady(true); }
              });
              return;
            }
          }
          // ── FUENTE 3: Frames de Firestore ────────────────────────────────
          const q = query(framesColRef, orderBy('order', 'asc'));
          unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
              // ── FUENTE 4: Formación por defecto ──────────────────────────
              // GUARDIA: solo dibujar UNA VEZ y solo si el canvas está verdaderamente vacío
              if (defaultDrawnR.current) return;
              defaultDrawnR.current = true;
              console.log("[Pizarra] ✅ Pizarra nueva: dibujando formación por defecto");
              // Limpiar canvas por si acaso hay objetos residuales antes de dibujar
              const objsActuales = fc.getObjects().filter(o => o.data?.type !== 'field');
              objsActuales.forEach(o => fc.remove(o));
              syncingR.current = true;
              drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
              syncingR.current = false;
              attachListeners();
              const state = serializarFrame();
              // Guardar estado inicial en ambas claves
              try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(state)); } catch (_) {}
              savePizarraLocal(activeTeamId, planId, state);
              addDoc(framesColRef, { name: 'Frame 1', state: JSON.stringify(state), duration: 800, order: 0, createdAt: serverTimestamp() });
              if (!readyR.current) { readyR.current = true; setReady(true); }
              return;
            }
            const dbFrames = snapshot.docs
              .filter(d => !deletedFrameIdsR.current.has(d.id))
              .map(d => {
                const data = d.data();
                return { id: d.id, ...data, state: typeof data.state === 'string' ? JSON.parse(data.state) : data.state };
              });
            setFrames(dbFrames);
            framesR.current = dbFrames;
            if (!readyR.current) {
              readyR.current = true;
              setReady(true);
              if (dbFrames.length > 0 && !defaultDrawnR.current) {
                defaultDrawnR.current = true;
                cargarFrameConListeners(dbFrames[0].state, () => {
                  setFrameIdx(0);
                  frameIdxR.current = 0;
                });
              }
            }
          });
        }).catch(e => {
          console.error("[Pizarra] Error cargando pizarraEstado:", e);
          attachListeners(); // Siempre conectar listeners aunque haya error
          if (!readyR.current) { readyR.current = true; setReady(true); }
        });
      }
    } else {
      // Sin user/planId: conectar listeners de todas formas
      attachListeners();
    }

    // 7. Resize logic with ResizeObserver
    const resizeCanvas = () => {
      const contenedor = document.getElementById('canvas-container');
      const fc = fcRef.current;
      const fr = frRef.current;
      const fieldCanvas = fieldCanvasRef.current;
      if (!contenedor || !fc || !fieldCanvas) return;

      let anchoContenedor = contenedor.offsetWidth;
      let altoContenedor  = contenedor.offsetHeight;

      // Salvaguarda: si el contenedor colapsa temporalmente a 0
      if (anchoContenedor <= 0 || altoContenedor <= 0) {
        anchoContenedor = window.innerWidth;
        altoContenedor = Math.max(300, window.innerHeight - 120);
      }

      // En fullscreen, el contenedor flex ya ocupa el espacio correcto,
      // pero debemos descontar el espacio que tapan las toolbars flotantes (position: fixed).
      const isFS = document.querySelector('.pizarra-fullscreen') !== null;
      if (isFS) {
        // Toolbar izq (~76px) + Toolbar der (~76px) + margen = ~180px
        anchoContenedor = Math.max(anchoContenedor - 180, 200);
        // Pequeño padding vertical para que no toque los bordes superior/inferior
        altoContenedor = Math.max(altoContenedor - 32, 200);
      }

      // Layout adaptativo
      const isMobileView = window.innerWidth < 768;
      const isTabletView = window.innerWidth >= 768 && window.innerWidth <= 1024;
      setIsMobile(isMobileView);
      setIsTablet(isTabletView);

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

      if (readyR.current && !presentR.current) {
        const stateObj = serializarFrame();
        presentR.current = JSON.stringify(stateObj);
      }
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
      // Evitar borrar si estamos escribiendo en un input
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }

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

    // ── PERSISTENCIA: guardar al cambiar de tab/minimizar app (crítico en Android) ──
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // El usuario sale del módulo o minimiza la app
        const stateToSave = lastStateRef.current || serializarFrame();
        if (stateToSave && stateToSave.objects && stateToSave.objects.length > 0 && user && activeTeamId) {
          // a) localStorage (síncrono, siempre funciona)
          savePizarraLocal(activeTeamId, planId, stateToSave);
          try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(stateToSave)); } catch (_) {}
          // b) Firestore (async, best-effort)
          if (user.uid !== 'invitado-local') {
            const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
            setDoc(estadoRef, {
              canvasState: JSON.stringify(stateToSave),
              framesCount: framesR.current?.length || 0,
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── PERSISTENCIA: guardar al cerrar la pestaña / app ──
    const handleBeforeUnload = () => {
      const stateToSave = lastStateRef.current || serializarFrame();
      if (stateToSave && activeTeamId) {
        savePizarraLocal(activeTeamId, planId, stateToSave);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(stateToSave)); } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cancelar timers pendientes
      if (saveTimeoutR.current) clearTimeout(saveTimeoutR.current);

      // Guardado SÍNCRONO al desmontar — usar lastStateRef (no necesita serializar)
      const stateToSave = lastStateRef.current || (fcRef.current ? serializarFrame() : null);
      if (stateToSave && stateToSave.objects && stateToSave.objects.length > 0 && user && activeTeamId) {
        // a) localStorage (síncrono e inmediato)
        savePizarraLocal(activeTeamId, planId, stateToSave);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(stateToSave)); } catch (_) {}
        // b) Firestore (async, usando la referencia correcta)
        if (user.uid !== 'invitado-local') {
          const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
          setDoc(estadoRef, {
            canvasState: JSON.stringify(stateToSave),
            framesCount: framesR.current?.length || 0,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {});
          // c) Guardar el frame actual si existe
          if (planId) {
            const frame = framesR.current[frameIdxR.current];
            if (frame && frame.id) {
              const frameRef = doc(db, getTeamPath(), 'pizarras', planId, 'frames', frame.id);
              setDoc(frameRef, { state: JSON.stringify(stateToSave), updatedAt: serverTimestamp() }, { merge: true })
                .catch(() => {});
            }
          }
        }
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unsubscribe) unsubscribe();
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

  const lastSwappedR = useRef(isSwapped);
  const lastLocalColorRef = useRef(localColor);
  const lastRivalColorRef = useRef(rivalColor);
  const lastJokerColorRef = useRef(jokerColor);
  const lastShowRivalR = useRef(showRival);

  useEffect(() => {
    if (!ready) return;
    if (lastSwappedR.current !== isSwapped) {
      lastSwappedR.current = isSwapped;
      aplicarFormacion('local', localFormation);
      if (showRival) {
        aplicarFormacion('rival', rivalFormation);
      }
    }
  }, [isSwapped, ready, localFormation, rivalFormation, showRival, aplicarFormacion]);

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !ready) return;
    if (lastShowRivalR.current === showRival) return;
    lastShowRivalR.current = showRival;

    if (showRival) {
      const hasRivals = fc.getObjects().some(obj => obj.data && obj.data.type === 'player' && obj.data.playerType === 'rival');
      if (!hasRivals) {
        aplicarFormacion('rival', rivalFormation);
      }
    } else {
      const objects = [...fc.getObjects()];
      objects.forEach(obj => {
        if (obj.data && obj.data.type === 'player' && obj.data.playerType === 'rival') {
          fc.remove(obj);
        }
      });
      fc.renderAll();
      saveFrameState();
      pushToHistory();
    }
  }, [showRival, ready, rivalFormation, aplicarFormacion]);

  // ─── Team colors real-time update (Unificado) ──────────────────────────────
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !ready) return;

    let changed = false;
    if (lastLocalColorRef.current !== localColor) {
      lastLocalColorRef.current = localColor;
      changed = true;
    }
    if (lastRivalColorRef.current !== rivalColor) {
      lastRivalColorRef.current = rivalColor;
      changed = true;
    }
    if (lastJokerColorRef.current !== jokerColor) {
      lastJokerColorRef.current = jokerColor;
      changed = true;
    }

    if (!changed) return;

    fc.getObjects().forEach(obj => {
      const isPlayer = obj.data?.type === 'player' || 
                       obj.data?.tipo === 'jugador' || 
                       (obj.type === 'group' && 
                        obj.getObjects && 
                        obj.getObjects().length === 2 && 
                        obj.getObjects().some(child => child.type === 'circle') && 
                        obj.getObjects().some(child => child.type === 'text'));

      if (isPlayer) {
        const pType = obj.data?.playerType || 'local';
        const isGk = obj.data?.label === 1;
        
        let targetColor = null;
        if (pType === 'local') {
          targetColor = isGk ? '#FFD700' : localColor;
        } else if (pType === 'rival') {
          targetColor = isGk ? '#FFD700' : rivalColor;
        } else if (pType === 'joker') {
          targetColor = isGk ? '#FFD700' : jokerColor;
        }

        if (targetColor) {
          if (obj._objects) {
            obj._objects.forEach(child => {
              if (child.type === 'circle') {
                const sw = obj.data?._strokeWidth || Math.max(2, (obj.radius || child.radius || RADIO_JUGADOR) * 0.18);
                child.set({ fill: targetColor, stroke: '#FFFFFF', strokeWidth: sw });
                child.dirty = true;
              }
            });
            obj.dirty = true;
          } else if (obj.type === 'group') {
            const circle = obj.getObjects().find(child => child.type === 'circle');
            if (circle) {
              const sw = obj.data?._strokeWidth || Math.max(2, (obj.radius || circle.radius || RADIO_JUGADOR) * 0.18);
              circle.set({ fill: targetColor, stroke: '#FFFFFF', strokeWidth: sw });
              circle.dirty = true;
              obj.dirty = true;
            }
          }
        }
      }
    });

    fc.renderAll();
    saveFrameState();
  }, [localColor, rivalColor, jokerColor, ready, saveFrameState]);


  // (El guardado al desmontar ya ocurre dentro del useEffect principal, en el return cleanup)

  // ─── Tool change (con try/catch para evitar crash en APK) ───────────────────
  useEffect(() => {
    const tm = tmRef.current;
    if (!tm) return;
    try {
      if (activeTool === 'place_material') {
        tm.activateTool('select'); // suppress drawing while placing
      } else {
        tm.activateTool(activeTool);
      }
    } catch (err) {
      console.warn('[Pizarra] Error al activar herramienta:', activeTool, err);
      // Fallback seguro: volver a selección
      try { tm.activateTool('select'); } catch (_) {}
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
        if (circle) {
          circle.set('fill', activeColor);
          activeObj.dirty = true;
        }
      } else if (activeObj.type === 'path') {
        activeObj.set('stroke', activeColor);
      } else if (activeObj.data?.type === 'material') {
        // Algunos materiales pueden no soportar cambio de color directo
        if (activeObj.setFill) activeObj.setFill(activeColor);
        else if (activeObj._objects) {
           activeObj._objects.forEach(o => {
             if (o.fill && o.fill !== 'transparent') {
               o.set('fill', activeColor);
               o.dirty = true;
             }
           });
           activeObj.dirty = true;
        }
      }
      fc.renderAll();
      saveFrameState();
    }
  }, [activeColor, activeWidth, saveFrameState]);

  // NOTA: El efecto de actualización de colores en tiempo real se unificó arriba bajo la guarda 'ready' para evitar sobreescribir el canvas en el mount.

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

  const clearCanvas = () => {
    if (!window.confirm('¿Limpiar pizarra? (Esto borra el dibujo actual, pero no elimina los frames de la animación. Usa "NUEVA" para empezar de cero)')) return;
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr) return;
    fc.clear();
    clearPizarraLocal(activeTeamId, planId);
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    saveFrameState();
    pushToHistory();
  };

  // ─── Nueva Pizarra ────────────────────────────────────────────────────────
  const handleNewPizarra = async () => {
    if (!window.confirm('¿Crear nueva pizarra? Se perderán los cambios no guardados y empezarás una animación desde cero.')) return;
    
    // PERSISTENCIA: borrar TODO el estado guardado para este equipo
    if (activeTeamId) {
      // Borrar la clave del planId activo y la clave general del equipo
      localStorage.removeItem(`mister11_last_pizarra_${activeTeamId}`);
      localStorage.removeItem(`mister11_pizarra_active_${activeTeamId}_${planId}`);
      clearPizarraLocal(activeTeamId, planId);
      // Resetear la ref del último estado para que no se restaure
      lastStateRef.current = null;
      // Borrar estado_actual en Firestore para no restaurar estado viejo
      if (user && user.uid !== 'invitado-local') {
        const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
        setDoc(estadoRef, { canvasState: null, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    }
    
    // Generar nuevo ID y actualizar URL
    const newId = `piz_${Date.now()}`;
    setPlanId(newId);
    setSearchParams({ id: newId }, { replace: true });
    localStorage.setItem(`mister11_last_pizarra_${activeTeamId}`, newId);
    
    // Resetear frames
    setFrames([]);
    setFrameIdx(0);
    framesR.current = [];
    frameIdxR.current = 0;
    defaultDrawnR.current = false;
    
    // Limpiar canvas y dibujar formación inicial
    const fc = fcRef.current;
    if (fc) {
      fc.clear();
      drawPlayers(fc, frRef.current, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
      saveFrameState();
      resetHistory();
      defaultDrawnR.current = true;
    }
  };

  // ─── Capture Canvas as Image ──────────────────────────────────────────────
  const handleCapture = async (download = true, silent = false) => {
    if ((download || !silent) && !isProActive) {
      setUpgradeModal({ open: true, message: 'La descarga y captura de imágenes de la pizarra es una función PRO. Sube de nivel para usarla.' });
      return null;
    }
    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    
    if (!fc || !fieldCanvas || !user || !activeTeamId) {
      if (!silent && !user) alert("Debes iniciar sesión para capturar.");
      if (!silent && user && !activeTeamId) alert("Debes seleccionar un equipo activo.");
      return null;
    }

    if (!silent) {
      setIsCapturing(true);
      window.dispatchEvent(new CustomEvent('m11-loading', { detail: { show: true, message: 'Capturando imagen...' } }));
      await new Promise(r => setTimeout(r, 150));
    }

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

      // Generar imagen fallback comprimida para Firestore si falla la subida a Storage (evita error de 1MB)
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 800; // Suficiente para visualización de fallback
      fallbackCanvas.height = 533;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      fallbackCtx.drawImage(tempCanvas, 0, 0, 800, 533);
      const fallbackDataURL = fallbackCanvas.toDataURL('image/jpeg', 0.75); // Muy ligera (~60KB)

      if (download) {
        await downloadImage(dataURL, `mister11-tactica-${Date.now()}.png`);
      }

      // 7. Subir a Firebase Storage y Firestore
      let downloadURL = null;
      let storagePath = null;
      
      if (user.uid !== 'invitado-local') {
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
          // BUG FIX: validar que el path sea válido antes de escribir en Firestore.
          // Si getTeamPath() devuelve vacío o contiene 'undefined'/'null', usamos
          // la colección de usuario como fallback para no perder la captura.
          const teamPath = getTeamPath();
          let capturesColPath;
          if (teamPath && !teamPath.includes('undefined') && !teamPath.includes('null')) {
            capturesColPath = `${teamPath}/captures`;
          } else {
            console.warn('[Pizarra] Path de equipo inválido, guardando captura en path de usuario:', teamPath);
            capturesColPath = `users/${user.uid}/captures`;
          }

          const captureDocRef = doc(collection(db, capturesColPath));
          await setDoc(captureDocRef, {
            id: captureDocRef.id,
            url: downloadURL || fallbackDataURL, // URL de Storage o Base64 comprimido ligero
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
          alert("❌ Error al guardar en la base de datos: " + (dbErr?.code || dbErr?.message || 'Error desconocido'));
        }
      } else {
        if (download) {
          // Ya descargado por downloadImage
        } else {
          alert("✅ Captura completada localmente.");
        }
      }

      if (!silent) setIsCapturing(false);
      
      // Retornamos un objeto con ambas URLs para que handleSave decida qué usar
      return {
        full: downloadURL || fallbackDataURL, // URL de Storage o Base64 comprimido ligero
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
      if (user.uid !== 'invitado-local') {
        const exerciseRef = doc(db, getTeamPath(), 'exercises', planId);
        
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
      }

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

    // 1. Save current immediately before adding to prevent state desync
    saveFrameState(true);

    // 2. Clone current state
    const state = serializarFrame();
    
    if (!activeTeamId) return;
    
    try {
      const nextIdx = frames.length;
      
      const newFrameData = {
        name: `Frame ${nextIdx + 1}`,
        state: JSON.stringify(state),
        duration: 800,
        order: nextIdx,
        createdAt: new Date().toISOString() // Fallback local para el optimistic update
      };

      let newFrameId;
      if (user.uid === 'invitado-local') {
        newFrameId = `frame-${Date.now()}`;
      } else {
        // BUG FIX: envolver la creación del path en try-catch para evitar crash
        // cuando getTeamPath() devuelve string vacío o ruta inválida.
        // El frame se añade igualmente de forma local con un ID generado.
        try {
          const teamPath = getTeamPath();
          if (!teamPath || teamPath.includes('undefined') || teamPath.includes('null')) {
            console.warn('[Pizarra] addFrame: ruta de equipo inválida, usando ID local:', teamPath);
            newFrameId = `frame-${Date.now()}`;
          } else {
            const framesColRef = collection(db, teamPath, 'pizarras', planId, 'frames');
            // Generamos el ID y la referencia de forma síncrona
            const newDocRef = doc(framesColRef);
            newFrameId = newDocRef.id;
            
            // Guardar en Firebase asíncronamente sin bloquear la UI
            setDoc(newDocRef, {
              ...newFrameData,
              createdAt: serverTimestamp() // Timestamp real del servidor
            }).catch(err => console.error("Error setting frame doc:", err));
          }
        } catch (pathErr) {
          console.warn('[Pizarra] addFrame: error al crear referencia Firestore, usando ID local:', pathErr);
          newFrameId = `frame-${Date.now()}`;
        }
      }
      
      const newFrame = {
        id: newFrameId,
        ...newFrameData,
        state // Keep it as object in local state
      };

      // 3. Actualización Optimista del Estado Local (INMEDIATA)
      setFrames(prev => {
        const next = [...prev, newFrame];
        framesR.current = next;
        return next;
      });
      
      setFrameIdx(nextIdx);
      frameIdxR.current = nextIdx;
      
    } catch (error) {
      console.error("Error saving frame:", error);
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
        resetHistory();
        presentR.current = JSON.stringify(framesR.current[idx].state);
      });
    }, 80);
  };

  // ─── Delete Frame ─────────────────────────────────────────────────────────
  // FIX: usamos una ref local para trackear IDs eliminados y evitar que el
  // onSnapshot de Firestore los restaure antes de que se complete el deleteDoc.

  const deleteFrame = async () => {
    const cur = frameIdxR.current;
    if (framesR.current.length <= 1) return;
    
    const frameToDelete = framesR.current[cur];
    if (!frameToDelete) return;

    // Marcar el frame como eliminado ANTES de cualquier operación asíncrona
    // para que el onSnapshot lo filtre si dispara antes del deleteDoc
    if (frameToDelete.id) {
      deletedFrameIdsR.current.add(frameToDelete.id);
    }
    
    const next = framesR.current.filter((_, i) => i !== cur);
    const newIdx = Math.max(0, cur - 1);
    
    // Actualizar estado local INMEDIATAMENTE
    framesR.current = next;
    setFrames([...next]);
    setFrameIdx(newIdx);
    frameIdxR.current = newIdx;
    
    const fc = fcRef.current;
    if (fc && next[newIdx]) {
      syncingR.current = true;
      cargarFrame(next[newIdx].state, () => {
        syncingR.current = false;
        fc.renderAll();
        try { attachListeners(); } catch (_) {}
        resetHistory();
        presentR.current = JSON.stringify(next[newIdx].state);
      });
    }
    
    // Firebase delete and reordering to prevent sequence gaps
    if (user && frameToDelete && frameToDelete.id && activeTeamId && user.uid !== 'invitado-local') {
      try {
        const frameRef = doc(db, getTeamPath(), 'pizarras', planId, 'frames', frameToDelete.id);
        await deleteDoc(frameRef);
        
        // Re-index remaining frames in Firestore to maintain contiguous sequence order
        const batch = writeBatch(db);
        next.forEach((f, idx) => {
          const fRef = doc(db, getTeamPath(), 'pizarras', planId, 'frames', f.id);
          batch.update(fRef, { order: idx });
        });
        await batch.commit();
        
        // Limpiar el ID de la lista de eliminados una vez confirmado en Firestore
        deletedFrameIdsR.current.delete(frameToDelete.id);
      } catch (err) {
        console.error("Error deleting or reordering frame in Firestore:", err);
        // En caso de error, quitar de eliminados para no bloquear futuros snapshots
        deletedFrameIdsR.current.delete(frameToDelete.id);
      }
    }
  };

  // ─── Play Animation ───────────────────────────────────────────────────────
  const playAnimation = async () => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr || framesR.current.length < 2 || playingR.current) return;
    
    // Save current frame state immediately before starting animation to prevent data loss
    await saveFrameState(true);

    setIsPlaying(true);
    playingR.current = true;

    const animate = (idx) => {
      // Early-exit guard if playback is stopped
      if (!playingR.current) return;

      if (idx >= framesR.current.length - 1) {
        setIsPlaying(false);
        playingR.current = false;
        loadFrame(framesR.current.length - 1); // Restore responsive interactivity on the final frame
        return;
      }

      setFrameIdx(idx);
      frameIdxR.current = idx;
      const fA = framesR.current[idx];
      const fB = framesR.current[idx + 1];
      const dur = fB.duration || 800;

      cargarFrame(fA.state, () => {
        if (!playingR.current) return;
        const objs = fc.getObjects();
        const rawTargets = fB.state.objects || [];

        if (objs.length === 0 || objs.length !== rawTargets.length) {
          // Fallback: instant responsive transition
          cargarFrame(fB.state, () => {
            if (!playingR.current) return;
            fc.renderAll();
            setTimeout(() => {
              if (!playingR.current) return;
              animate(idx + 1);
            }, 300);
          });
          return;
        }

        // Dynamically compute responsive absolute target coordinates based on relative percentages (xRel/yRel)
        const targets = rawTargets.map(objData => {
          let left, top;
          if (objData.xRel !== undefined && objData.yRel !== undefined) {
            const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
            left = point.x;
            top  = point.y;
          } else {
            left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
            top  = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
          }
          return { left, top };
        });

        let completed = 0;
        objs.forEach((obj, i) => {
          const t = targets[i];
          const sLeft = obj.left || 0;
          const sTop  = obj.top  || 0;
          fabric.util.animate({
            startValue: 0, endValue: 1, duration: dur,
            easing: fabric.util.ease.easeInOutSine,
            onChange: (v) => {
              if (!playingR.current) return;
              obj.set({
                left: sLeft + ((t.left || 0) - sLeft) * v,
                top:  sTop  + ((t.top  || 0) - sTop ) * v,
              });
              fc.renderAll();
            },
            onComplete: () => {
              if (!playingR.current) return;
              completed++;
              if (completed === objs.length) {
                cargarFrame(fB.state, () => {
                  if (!playingR.current) return;
                  fc.renderAll();
                  setTimeout(() => {
                    if (!playingR.current) return;
                    animate(idx + 1);
                  }, 200);
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
    // Reload frame to restore fully interactive state with active drag handlers and event listeners
    loadFrame(frameIdxR.current);
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
          onApply={() => aplicarFormacion('local', localFormation)}
        />
        <TeamCard 
          color={rivalColor} 
          name="Rival" 
          count={11} 
          onAdd={() => addManualPlayer('rival')} 
          onColorChange={setRivalColor}
          formation={rivalFormation}
          onFormationChange={setRivalFormation}
          onApply={() => aplicarFormacion('rival', rivalFormation)}
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
    <>
      <div className={`pizarra-container ${isMobile ? 'mobile' : 'desktop'} ${isLandscape ? 'landscape' : 'portrait'} ${fullscreenMode ? 'pizarra-fullscreen' : ''}`} 
        style={{ touchAction: 'pan-y' }}>

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="pizarra-topbar">
        <div className="topbar-scroll-wrapper">
          {/* GRUPO ESENCIAL: Siempre visible */}
          <div className="topbar-group essential">
            {autoSaveStatus && (
              <div style={{ color: autoSaveStatus.includes('Error') ? '#ff4d4f' : '#10b981', fontSize: '12px', fontWeight: 'bold', marginRight: '8px', whiteSpace: 'nowrap' }}>
                {autoSaveStatus}
              </div>
            )}
            {/* Botones para abrir paneles laterales en tablet (no-mobile) */}
            {isTablet && !fullscreenMode && (
              <>
                <button
                  className={`tool-icon-btn ${leftPanelOpen ? 'active' : ''}`}
                  title="Panel Equipos"
                  onClick={() => { setLeftPanelOpen(v => !v); setRightPanelOpen(false); }}
                  style={{ fontSize: '18px' }}
                >
                  👥
                </button>
                <button
                  className={`tool-icon-btn ${rightPanelOpen ? 'active' : ''}`}
                  title="Panel Material"
                  onClick={() => { setRightPanelOpen(v => !v); setLeftPanelOpen(false); }}
                  style={{ fontSize: '18px' }}
                >
                  🧰
                </button>
                <div className="topbar-divider" />
              </>
            )}
            {!fullscreenMode && (
              <button className="topbar-btn secondary" onClick={() => {
                setFullscreenMode(true);
                setLeftPanelOpen(false);
                setRightPanelOpen(false);
                setShowTeamsDrawer(false);
                setShowMatsDrawer(false);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
              }}>
                🗖 P. Completa
              </button>
            )}
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
              {/* ...acciones adicionales... */}
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
              <button className="topbar-btn secondary" onClick={handleNewPizarra} title="Crear nueva animación desde cero" style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>✨ NUEVA</button>
              <button className="topbar-btn" onClick={() => handleCapture(true)} disabled={isCapturing} title="Descargar Imagen">📸</button>
              <button className="topbar-btn" onClick={exportAnimationVideo} disabled={isRecording} title="Exportar animación como video MP4" style={{ background: 'var(--accent)', color: 'white', fontWeight: 'bold' }}>
                {isRecording ? '⏺️ EXPORTANDO MP4...' : '🎥 EXPORTAR MP4'}
              </button>
              <button id="btn-guardar-pizarra" className="topbar-btn primary" onClick={handleSave} disabled={isCapturing} title="Guardar pizarra y captura">💾 GUARDAR</button>
            </div>
          </div>{/* ── FIN topbar-scroll-wrapper ── */}
        </div>{/* ── FIN pizarra-topbar ── */}
      </div>
      
      {fullscreenMode && (
        <>
          {/* Botón salir fullscreen */}
          <button
            className="floating-exit"
            onClick={() => {
              setFullscreenMode(false);
              setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
            }}
          >
            ✖ Salir Pizarra
          </button>

          {/* Mini-barra flotante: herramientas esenciales en fullscreen */}
          <div className="pizarra-fullscreen-toolbar">
            {/* Herramientas de dibujo */}
            {Object.values(TOOLS).map(tool => (
              <button
                key={tool.id}
                className={activeTool === tool.id ? 'active' : ''}
                title={tool.label}
                onClick={() => setActiveTool(tool.id)}
                dangerouslySetInnerHTML={{ __html: tool.icon }}
              />
            ))}

            <div className="fs-divider" />

            {/* Colores rápidos */}
            {['#FFFFFF', '#FFEB3B', '#F44336', '#2196F3', '#4CAF50'].map(color => (
              <div
                key={color}
                className={`color-dot ${activeColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
                title={color}
              />
            ))}

            <div className="fs-divider" />

            {/* Deshacer / Limpiar */}
            <button onClick={undo} title="Deshacer">↩</button>
            <button onClick={clearCanvas} title="Limpiar todo" style={{ color: '#ff6b6b' }}>🗑</button>
            <button onClick={() => handleCapture(true)} title="Capturar imagen">📸</button>
          </div>
        </>
      )}

      {/* ── MAIN BOARD ────────────────────────────────────────────────────── */}
      <div className="pizarra-main">

        {/* Panel izquierdo – Solo visible en desktop no-tablet (y no en fullscreen) */}
        {!isMobile && !isTablet && !fullscreenMode && (
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

          {/* Drawers laterales para TABLET (overlay sobre el canvas, sin desplazarlo) */}
          {isTablet && leftPanelOpen && (
            <>
              <div className="pizarra-overlay" onClick={() => setLeftPanelOpen(false)} />
              <div className="pizarra-drawer left open">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 8px 0' }}>
                  <button onClick={() => setLeftPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                </div>
                <TeamsPanel />
              </div>
            </>
          )}
          {isTablet && rightPanelOpen && (
            <>
              <div className="pizarra-overlay" onClick={() => setRightPanelOpen(false)} />
              <div className="pizarra-drawer right open">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 8px 0' }}>
                  <button onClick={() => setRightPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                </div>
                <MaterialsPanel />
              </div>
            </>
          )}
        </div>

        {/* Panel derecho – Solo visible en desktop no-tablet */}
        {!isMobile && !isTablet && (
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

      {/* ── DESKTOP/TABLET DRAWERS (Colapsables) ─────────────────────────── */}
      {!fullscreenMode && (
        <>
          {leftPanelOpen && <div className="pizarra-overlay" onClick={() => setLeftPanelOpen(false)} />}
          <div className={`pizarra-drawer left ${leftPanelOpen ? 'open' : ''}`}>
            <TeamsPanel />
          </div>
          
          {rightPanelOpen && <div className="pizarra-overlay" onClick={() => setRightPanelOpen(false)} />}
          <div className={`pizarra-drawer right ${rightPanelOpen ? 'open' : ''}`}>
            <MaterialsPanel />
          </div>
        </>
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
    <UpgradeModal isOpen={upgradeModal.open} onClose={() => setUpgradeModal({ ...upgradeModal, open: false })} message={upgradeModal.message} />
    </>
  );
};

// ─── Small helper sub-component ──────────────────────────────────────────────
const TeamCard = ({ color, name, count, onAdd, onColorChange, formation, onFormationChange, onApply }) => (
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
      <div className="formation-select-container-pizarra">
        <select 
          value={formation} 
          onChange={(e) => onFormationChange(e.target.value)}
          className="formation-select-pizarra"
        >
          {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button 
          className="btn-apply-formation-pizarra"
          onClick={onApply}
          title="Aplicar / Reiniciar alineación"
        >
          APLICAR
        </button>
      </div>
    )}
  </div>
);


export default PizarraTactica;
