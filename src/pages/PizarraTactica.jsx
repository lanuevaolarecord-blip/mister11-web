// 🛡️ SISTEMA DE COORDENADAS ADAPTATIVAS (CONFIRMADO Y OPERATIVO)
// Posiciones y radios se calculan usando coordenadas relativas xRel/yRel (0.0-1.0)
// y radio relativo radiusRel para garantizar el renderizado adaptativo e idéntico
// en cualquier resolución de pantalla (tablet, desktop o móvil Android).

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Capacitor } from '@capacitor/core';

// ─── Referencias de diseño ──────────────────────────────────────────────────
const CANVAS_REF_WIDTH = 380;
const CANVAS_REF_HEIGHT = 520;
const RADIO_JUGADOR = (typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerHeight < 768)) ? 13.5 : 10.2;

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
import { FieldRenderer, FORMATIONS, getFormatInfo } from '../lib/mister11-field.js';
import {
  isFieldLayer,
  getTacticalCategory,
  getTacticalPieceIdentifier,
  removeAllTacticalPieces,
  TACTICAL_CATEGORIES,
  remapCoordinatesByWindow
} from '../lib/mister11-pieces.js';
import { useAuth } from '../context/AuthContext';
import { usePizarra } from '../context/PizarraContext';
import { usePlan } from '../hooks/usePlan';
import UpgradeModal from '../components/UpgradeModal';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, addDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy, getDoc, writeBatch, getDocs } from '../firebase/firestore-proxy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../firebaseConfig';
import { savePizarraLocal, getPizarraLocal, clearPizarraLocal } from '../lib/pizarraStorage';
import { getDocument, setDocument } from '../firebase/db';
import { downloadJSON, downloadImage, downloadVideo } from '../utils/download.js';
import { generatePizarraPDF } from '../utils/pdfGenerator.js';
import { exportAnimationMP4 } from '../utils/mp4Exporter.js';
import CanvasToolbar from '../components/pizarra/CanvasToolbar';
import MaterialsPanel from '../components/pizarra/MaterialsPanel';
import SavedPlaysPanel from '../components/pizarra/SavedPlaysPanel';
import AnimationPanel from '../components/pizarra/AnimationPanel';
import ExportAnimationModal from '../components/ExportAnimationModal';
import { showToast } from '../utils/toast';
import { useTranslation } from '../hooks/useTranslation';
import {
  WHITEBOARD_CONFIG,
  getPlayerCircleRadius,
  getPlayerFontSize,
  getPlayerBorderWidth,
  getPlayerPhotoSize,
  getMaterialCircleRadius,
  getMaterialFontSize
} from '../config/whiteboardConfig.js';
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
    'third_middle':   'third_mid',
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
  const { t, isEn } = useTranslation();
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
    
    return () => {
      document.body.classList.remove('pizarra-active');

      // Limpiar variable global de fabric para evitar fugas colaterales en la SPA (MEDIO-03)
      if (typeof window !== 'undefined') {
        delete window.fabric;
      }
    };
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
  const saveTimeoutR = useRef(null); // for general debouncing
  const saveFrameTimeoutR = useRef(null); // for debouncing frame saves to DB (separated)
  const saveEstadoTimeoutR = useRef(null); // for debouncing canvasState to estado_actual
  const clipboardR = useRef(null); // for copy/paste
  const defaultDrawnR = useRef(false); // prevent double default-formation draw
  const lastStateRef = useRef(null);  // PERSISTENCIA: último estado serializado (siempre actualizado)
  const planIdRef    = useRef(null);  // PERSISTENCIA: último planId conocido (para closures)
  const deletedFrameIdsR = useRef(new Set());
  const activeWorkerRef = useRef(null);
  const recorderRef = useRef(null);
  const watchdogTimerRef = useRef(null);
  const isCancelledRef = useRef(false);
  const animTimeoutR = useRef(null); // P-G2: captura los setTimeout recursivos de animacion

  const cancelExport = useCallback(() => {
    isCancelledRef.current = true;
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
      activeWorkerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch (_) {}
    }
    setIsRecording(false);
    setExportProgress(null);
    showToast(isEn ? 'Export cancelled.' : 'Exportación cancelada.', 'info');
  }, [isEn]);

  // ─── Utilidades de Escala ─────────────────────────────────────────────────

  const serializarFrame = useCallback(() => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return { objects: [] };

    const objects = fc.getObjects().filter(o => !isFieldLayer(o)).map(obj => {
      const serializado = obj.toObject([
        'data', 'id', 'isPlayerPiece', 'isMaterial', 'isBall', 'isComodin', 'isZone', 'isTool', 'isTrajectory',
        'radius', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'stroke', 'strokeWidth', 'strokeDashArray', 'fill'
      ]);
      
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
      const cat = getTacticalCategory(obj);

      const d = obj.data ? { ...obj.data } : {};
      d.xRel = rx;
      d.yRel = ry;
      if (cat) d.category = cat;
      if (obj.id && !d.id) d.id = obj.id;

      return {
        ...serializado,
        id: obj.id || d.id,
        category: cat,
        data: d,
        xRel: rx,
        yRel: ry,
        radiusRel: obj.radius 
          ? obj.radius / Math.min(fc.width, fc.height)
          : undefined,
        wRel: obj.width ? obj.width / fc.width : undefined,
        hRel: obj.height ? obj.height / fc.height : undefined,
        angle: obj.angle || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1
      };
    });

    const positions = objects.map(o => ({
      id: o.id || o.data?.id,
      category: o.category,
      x: o.xRel,
      y: o.yRel,
      team: o.data?.team,
      num: o.data?.num,
      isBall: o.isBall || o.category === 'ball',
      isPlayer: o.isPlayerPiece || o.category === 'player',
      fill: o.fill
    }));

    const trajectoryObjects = objects.filter(o => o.isTrajectory || o.category === TACTICAL_CATEGORIES.TRAJECTORY);
    const paths = trajectoryObjects.map(t => ({
      id: t.id || t.data?.id,
      fromId: t.data?.fromId,
      toId: t.data?.toId,
      points: t.data?.points || (t.points ? t.points : [{ x: t.x1, y: t.y1 }, { x: t.x2, y: t.y2 }])
    }));

    return { version: fabric.version, objects, positions, paths };
  }, []);

  const ensurePlayersOnTop = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;

    // 1. Enviar el objeto del campo (si existe) al fondo absoluto
    fc.getObjects().forEach(obj => {
      if (
        obj.data?.type === 'field' || 
        obj.data?.type === 'campo' || 
        obj.id === 'campo' || 
        obj.data?.type === 'background' ||
        (obj.fill && (obj.fill === '#1b3a2d' || obj.fill === '#132a14' || obj.fill === '#224422'))
      ) {
        fc.sendToBack(obj);
      }
    });

    // 2. Traer jugadores y materiales al frente
    fc.getObjects().forEach(obj => {
      const isPlayer = obj.data?.type === 'player' || obj.data?.tipo === 'jugador';
      const isMaterial = obj.data?.type === 'material' || obj.data?.tipo === 'material' || obj.data?.isMaterial || obj.type === 'image';
      if (isPlayer || isMaterial) {
        fc.bringToFront(obj);
      }
    });

    // 3. Refrescar instancia
    fc.calcOffset();
    fc.renderAll();
  }, []);

  // P-G1: PROHIBIDO fc.clear() global. Remover piezas solo por categoría preservando campo/líneas/porterías
  const removeAllPiecesPreservingField = useCallback((canvas) => {
    removeAllTacticalPieces(canvas);
  }, []);


  const normalizarTamañoJugadores = useCallback((canvas) => {
    if (!canvas) return;
    // TAMAÑOS REDUCIDOS UN 30% (FIX 3) VÍA WHITEBOARD_CONFIG
    const targetRadius = getPlayerCircleRadius(canvas.width);
    const borderWidth = getPlayerBorderWidth(targetRadius);
    const targetFontSize = getPlayerFontSize(targetRadius);
    const touchPadding = WHITEBOARD_CONFIG.touchTarget.getPadding(targetRadius);

    canvas.getObjects().forEach(obj => {
      const isPlayer = obj.data?.type === 'player' || 
                       obj.data?.tipo === 'jugador' || 
                       (obj.type === 'group' && 
                        obj.getObjects && 
                        obj.getObjects().length === 2 && 
                        obj.getObjects().some(child => child.type === 'circle') && 
                        obj.getObjects().some(child => child.type === 'text'));

      if (isPlayer && obj.type === 'group') {
        const circle = obj.getObjects().find(child => child.type === 'circle');
        const text = obj.getObjects().find(child => child.type === 'text');

        if (circle) {
          circle.set({
            radius: targetRadius,
            strokeWidth: borderWidth,
            dirty: true
          });
        }
        if (text) {
          text.set({
            fontSize: targetFontSize,
            dirty: true
          });
        }
        obj.set({
          padding: touchPadding,
          scaleX: 1,
          scaleY: 1,
          dirty: true
        });
        obj._calcBounds(true);
        obj.setCoords();
      }
    });
    canvas.renderAll();
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

    // FIX-2: Desactivamos el guardado durante la carga
    syncingR.current = true;

    // FIX-1: Verificar token ANTES de limpiar el canvas para evitar canvas en blanco
    // por race condition (undo/redo rápido o cambios de formación en sucesión).
    if (loadTokenR.current !== currentToken) {
      console.warn('[Pizarra] ⚠️ Carga cancelada ANTES de limpiar canvas — race condition evitada.');
      syncingR.current = false;
      if (callback) callback();
      return;
    }

    removeAllPiecesPreservingField(fc);
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
      // FIX-1: Si el token cambió, otra carga comenzó — abortar sin dejar syncingR bloqueado.
      if (loadTokenR.current !== currentToken) {
        console.warn('[Pizarra] ⚠️ Carga asíncrona abortada por race condition.');
        syncingR.current = false; // FIX-2: SIEMPRE desbloquear aunque se aborte
        return;
      }

      // FIX-2: try/catch para garantizar que syncingR nunca queda en true permanentemente
      try {
        objects.forEach((o, objIdx) => {
          const itemData = enlivenedData[objIdx] || {};
          if (!o.data && itemData.data) {
            o.data = { ...itemData.data };
          }
          if (!o.id && (itemData.id || itemData.data?.id)) {
            o.id = itemData.id || itemData.data?.id;
          }

          // Restaurar categoría taxonómica canónica (Puerta P3)
          const cat = itemData.category || itemData.data?.category || getTacticalCategory(o) || getTacticalCategory(itemData);
          if (cat === TACTICAL_CATEGORIES.PLAYER) o.isPlayerPiece = true;
          if (cat === TACTICAL_CATEGORIES.MATERIAL) o.isMaterial = true;
          if (cat === TACTICAL_CATEGORIES.BALL) o.isBall = true;
          if (cat === TACTICAL_CATEGORIES.COMODIN) { o.isComodin = true; o.isPlayerPiece = true; }
          if (cat === TACTICAL_CATEGORIES.ZONE) o.isZone = true;
          if (cat === TACTICAL_CATEGORIES.TOOL) o.isTool = true;
          if (cat === TACTICAL_CATEGORIES.TRAJECTORY) o.isTrajectory = true;

          // Restaurar borde blanco en los jugadores
          const isPlayer = cat === TACTICAL_CATEGORIES.PLAYER || 
                           cat === TACTICAL_CATEGORIES.COMODIN ||
                           o.data?.type === 'player' || 
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
        normalizarTamañoJugadores(fc);
        ensurePlayersOnTop();
        fc.renderAll();
        // Sincronización completada — reactivar eventos
        syncingR.current = false;
        if (callback) callback();
      } catch (err) {
        // FIX-2: Si Fabric.js falla internamente, garantizar desbloqueo para evitar deadlock
        console.error('[Pizarra] ❌ Error en enlivenObjects callback — desbloqueando syncingR:', err);
        syncingR.current = false;
        try { fc.renderAll(); } catch (_) {}
        if (callback) callback();
      }
    });
  }, [normalizarTamañoJugadores, removeAllPiecesPreservingField]);

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
    normalizarTamañoJugadores(fc);
    fc.renderAll();
  }, [normalizarTamañoJugadores]);

  // Auth & URL
  const { user, activeTeamId, activeTeam, getTeamPath: getTeamPathRaw } = useAuth();
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
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [ready,        setReady]        = useState(false);
  const [planName,     setPlanName]     = useState('Sin título');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth <= 1024);
  const [showTeamsDrawer, setShowTeamsDrawer] = useState(false);
  const [showMatsDrawer, setShowMatsDrawer] = useState(false);
  
  const toggleLeftPanel = () => {
    setShowTeamsDrawer(prev => !prev);
    setShowMatsDrawer(false);
  };
  const toggleRightPanel = () => {
    setShowMatsDrawer(prev => !prev);
    setShowTeamsDrawer(false);
  };

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
  const fieldTypeRef = useRef('full');
  
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
    fieldTypeRef.current = v;
    setFieldTypeState(v); 
  };

  useEffect(() => {
    fieldTypeRef.current = fieldType;
  }, [fieldType]);

  // FIX 3: toggleFullscreen SOLO alterna fullscreenMode y NUNCA resetea fieldType
  const toggleFullscreen = useCallback(() => {
    setFullscreenMode(prev => !prev);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }, []);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [histCount,      setHistCount]      = useState(0);
  const [redoCount,      setRedoCount]      = useState(0);
  const [reducedDim,     setReducedDim]     = useState({ w: 40, h: 30 });
  const [zoomLevel,      setZoomLevel]      = useState(1);
  const [isCapturing,    setIsCapturing]    = useState(false);
  const [captureToast,   setCaptureToast]   = useState(null);  // { type: 'success'|'error', msg: string }
  const [isRecording,    setIsRecording]    = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportResult,   setExportResult]   = useState(null);
  const fileImportInputRef = useRef(null);

  const [playerCountsRevision, setPlayerCountsRevision] = useState(0);

  const getPlayerCount = useCallback((type) => {
    const fc = fcRef.current;
    if (!fc) return undefined;
    return fc.getObjects().filter(o => (o.isPlayerPiece || o.data?.type === 'player' || o.data?.tipo === 'jugador') && o.data?.playerType === type).length;
  }, [playerCountsRevision]);

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

  useEffect(() => {
    const handleForceResize = () => {
      const fc = fcRef.current;
      if (fc && containerRef.current) {
        fc.calcOffset();
        fc.renderAll();
      }
    };
    window.addEventListener('resize', handleForceResize);
    window.addEventListener('orientationchange', handleForceResize);
    return () => {
      window.removeEventListener('resize', handleForceResize);
      window.removeEventListener('orientationchange', handleForceResize);
    };
  }, []);

  // keep refs in sync with state
  useEffect(() => { frameIdxR.current = frameIdx; }, [frameIdx]);
  useEffect(() => { playingR.current = isPlaying; }, [isPlaying]);
  useEffect(() => { framesR.current = frames; }, [frames]);




  // ─── Save current canvas state into current frame ─────────────────────────
  const saveFrameState = useCallback(async (immediate = false) => {
    if (syncingR.current || playingR.current) return; // Block saves while loading/syncing or playing
    
    const fc = fcRef.current;
    if (!fc || playingR.current || !user || !activeTeamId) return;
    
    const idx   = frameIdxR.current;
    const frame = (framesR.current && framesR.current[idx]) ? framesR.current[idx] : null;
    
    // Si no hay frame definido en el array de la ref, no podemos guardar en DB todavía
    if (!frame || !frame.id) return;

    const rawState = serializarFrame();
    const state = JSON.parse(JSON.stringify(rawState));

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
        if (!activeTeamId || !planId) return; // Guard: planId requerido
        const teamPath = getTeamPath();
        if (!teamPath || teamPath.includes('undefined') || teamPath.includes('null')) return;
        const frameRef = doc(db, teamPath, 'pizarras', planId, 'frames', frame.id);
        const parentRef = doc(db, teamPath, 'pizarras', planId);
        
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
        console.error('Error updating frame in Firestore:', err);
      }
    };

    if (immediate) {
      if (saveFrameTimeoutR.current) clearTimeout(saveFrameTimeoutR.current);
      return await saveToDB();
    } else {
      if (saveFrameTimeoutR.current) clearTimeout(saveFrameTimeoutR.current);
      saveFrameTimeoutR.current = setTimeout(saveToDB, 800); // 800ms debounce
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
      title: `Pizarra - ${new Date().toLocaleDateString(isEn ? 'en-US' : 'es-ES')}`,
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
          showToast(isEn ? 'The file does not have a valid Mister11 animation format.' : 'El archivo no tiene el formato válido de animación de Míster11.', 'error');
          return;
        }
        if (!window.confirm(isEn ? `Import this animation with ${data.frames.length} frames? This will replace current frames.` : `¿Importar esta animación con ${data.frames.length} frames? Esto reemplazará los frames actuales.`)) {
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
        showToast(isEn ? 'Animation imported successfully!' : '¡Animación importada con éxito!', 'success');
      } catch (err) {
        console.error('Error al importar:', err);
        showToast(isEn ? 'Error processing animation JSON file.' : 'Error al procesar el archivo JSON de animación.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Identificador determinista para emparejar objetos entre frames (Puerta P2) ────────
  const getObjectIdentifier = useCallback((obj) => {
    return getTacticalPieceIdentifier(obj);
  }, []);

  // ─── Export Animation Video (MP4/WebM Determinista FIX 4) ────────────────
  const openExportModal = () => {
    if (!isProActive) {
      setUpgradeModal({
        open: true,
        message: isEn
          ? 'Exporting animations as MP4 video is a PRO feature. Upgrade to use it.'
          : 'La exportación de animaciones en video MP4 es una función PRO. Sube de nivel para usarla.'
      });
      return;
    }
    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    if (!fc || !fieldCanvas || framesR.current.length < 2) {
      setCaptureToast({
        type: 'info',
        msg: isEn
          ? 'You need at least 2 frames to export a video.'
          : 'Necesitas al menos 2 frames para exportar un video.'
      });
      setTimeout(() => setCaptureToast(null), 3500);
      return;
    }
    setExportResult(null);
    setShowExportModal(true);
  };

  const exportAnimationVideo = async (options = null) => {
    const showToast = (msg, type = 'info') => {
      setCaptureToast({ type: type === 'info' ? 'success' : type, msg });
      setTimeout(() => setCaptureToast(null), type === 'error' ? 5000 : 3500);
    };

    if (!isProActive) {
      setUpgradeModal({
        open: true,
        message: isEn
          ? 'Exporting animations as MP4 video is a PRO feature. Upgrade to use it.'
          : 'La exportación de animaciones en video MP4 es una función PRO. Sube de nivel para usarla.'
      });
      return;
    }

    const autoExport = new URLSearchParams(window.location.search).get('autoExport');
    // Si se llama sin opciones y no es autoExport, abrir el modal de exportación paramétrico
    if (!options && autoExport !== 'true') {
      openExportModal();
      return;
    }

    // Si la opción seleccionada es PNG:
    if (options && options.format === 'PNG') {
      handleCapture(true);
      return;
    }

    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    if (!fc || !fieldCanvas || framesR.current.length < 2) {
      showToast(
        isEn
          ? 'You need at least 2 frames to export a video.'
          : 'Necesitas al menos 2 frames para exportar un video.',
        'info'
      );
      return;
    }

    if (isRecording) return;
    const activeFrameIdxBeforeExport = frameIdxR.current;
    setIsRecording(true);
    setExportProgress(1);
    showToast(
      isEn ? 'Generating video, please wait...' : 'Generando video, por favor espera...',
      'info'
    );

    try {
      // 1. Cancelar cualquier timer pendiente de autoguardado para evitar colisiones
      if (saveFrameTimeoutR.current) clearTimeout(saveFrameTimeoutR.current);

      // 2. Guardar frame actual antes de exportar
      await saveFrameState(true);

      // 3. Instantánea inmutable y profunda de los frames para garantizar que el último frame nunca se pierda
      const exportFrames = (framesR.current || []).map(f => ({
        ...f,
        state: typeof f.state === 'string' ? f.state : JSON.stringify(f.state)
      }));

      // 4. Exportación determinista frame a frame con calidad, velocidad y encuadre
      const exportTitle = options?.title ? options.title.trim().replace(/\s+/g, '_') : planId;
      const result = await exportAnimationMP4({
        fc,
        fr: frRef.current,
        fieldCanvas,
        frames: exportFrames,
        planId: exportTitle || 'export',
        quality: options?.quality || '1080p',
        speed: options?.speed || '1x',
        orientation: options?.orientation || (isLandscape ? 'landscape' : 'portrait'),
        zoom: options?.zoom || 1,
        panX: options?.panX || 0,
        panY: options?.panY || 0,
        fieldType: fieldType || 'full',
        onProgress: (pct) => {
          setExportProgress(pct);
        },
        onStatus: (msg) => {
          // Mensaje de estado disponible
        }
      });

      // 3. Subir a Firebase Storage si el usuario está autenticado
      if (user && activeTeamId && user.uid !== 'invitado-local') {
        try {
          const fileType = result.mimeType.includes('mp4') ? 'mp4' : 'webm';
          const storagePath = `pizarras/${getTeamPath()}/${planId}/video.${fileType}`;
          const storageRef = ref(storage, storagePath);
          await uploadString(storageRef, result.dataURL, 'data_url');
          const downloadURL = await getDownloadURL(storageRef);
          const exerciseRef = doc(db, getTeamPath(), 'exercises', planId);
          await setDoc(exerciseRef, {
            videoUrl: downloadURL,
            videoMimeType: result.mimeType,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (uploadErr) {
          console.error('Error al guardar el video en la nube:', uploadErr);
        }
      }

      setExportProgress(100);
      setExportResult(result);

      if (autoExport === 'true' && window.parent) {
        window.parent.postMessage({
          type: 'EXPORT_DONE',
          base64data: result.base64data,
          filename: result.filename,
          mimeType: result.mimeType
        }, '*');
      } else {
        showToast(
          isEn ? 'Video exported successfully.' : 'Video exportado exitosamente.',
          'success'
        );
        downloadVideo(result.blob || result.base64data, result.filename, result.mimeType);
      }
    } catch (err) {
      console.error('[MP4 Export] Error durante exportación:', err);
      showToast(
        isEn
          ? `Could not complete video: ${err?.message || 'error'}. Click to retry.`
          : `No se pudo completar el vídeo: ${err?.message || 'error'}. Pulsa para reintentar.`,
        'error'
      );
      if (autoExport === 'true' && window.parent) {
        window.parent.postMessage('EXPORT_ERROR', '*');
      }
    } finally {
      setIsRecording(false);
      setTimeout(() => setExportProgress(null), 1500);
      // Restaurar el frame activo en el canvas para que no quede modificado
      loadFrame(activeFrameIdxBeforeExport, false);
    }
  };

  // ─── Create a single player object ─────────────────────────────────────────
  const createPlayer = useCallback((x, y, options = {}) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return null;
    
    // REDUCCIÓN DEL 30% VÍA WHITEBOARD_CONFIG
    const targetRadius = options.radius || getPlayerCircleRadius(fc.width);
    const { color = '#4CAF7D', label = '1', type = 'local', radius = targetRadius } = options;
    
    // Obtener coordenadas relativas al CAMPO REAL
    const { rx, ry } = fr.getRelativePoint(x, y);

    const borderWidth = getPlayerBorderWidth(radius);
    const fontSize = getPlayerFontSize(radius);
    const circle = new fabric.Circle({
      radius: radius, originX: 'center', originY: 'center',
      fill: color,
      stroke: '#FFFFFF', strokeWidth: borderWidth,
    });
    const text = new fabric.Text(String(label), {
      fontSize: fontSize, fontWeight: 'bold', fill: '#FFFFFF',
      originX: 'center', originY: 'center',
    });
    const playerId = options.id || `player_${type}_${label}`;
    const touchPadding = WHITEBOARD_CONFIG.touchTarget.getPadding(radius);
    const group = new fabric.Group([circle, text], {
      left: x, top: y,
      originX: 'center', originY: 'center',
      hasControls: true, hasBorders: false,
      padding: touchPadding,
      // FIX: stroke en el Group para que sobreviva serialización/deserialización
      stroke: '#FFFFFF',
      strokeWidth: borderWidth,
      id: playerId,
      isPlayerPiece: true,
      data: { 
        id: playerId,
        type: 'player',
        tipo: 'jugador',
        playerType: type,
        label: String(label),
        xRel: rx,
        yRel: ry,
        _strokeWidth: borderWidth  // guardar para restaurar al desserializar
      },
    });
    group.isPlayerPiece = true;
    
    applyMister11Controls(group);

    return group;
  }, []);

  // ─── Draw players from formation onto canvas ──────────────────────────────
  const drawPlayers = useCallback((canvas, renderer, fieldType, formations, swapped) => {
    if (!canvas || !renderer) return;
    const bounds = renderer.getFieldBounds();
    if (!bounds || bounds.w === 0) return;

    // P-G1: Limpiar únicamente jugadores existentes antes de dibujar la formación para evitar acumulación
    const currentObjects = [...canvas.getObjects()];
    currentObjects.forEach(obj => {
      if (obj.isPlayerPiece || obj.data?.type === 'player' || obj.data?.tipo === 'jugador') {
        canvas.remove(obj);
      }
    });

    // Radio fijo igual en todos los modos de campo
    const playerRadius = RADIO_JUGADOR;

    const drawTeam = (type, form, color, side) => {
      const formatInfo = getFormatInfo(fieldType);
      const targetForm = (form && formatInfo.formations.includes(form)) ? form : formatInfo.defaultFormation;
      const positions = FORMATIONS[targetForm] || FORMATIONS['4-3-3'];
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
    normalizarTamañoJugadores(canvas);
    syncingR.current = false;
    canvas.renderAll();
  }, [createPlayer, localColor, rivalColor, showRival, normalizarTamañoJugadores]);

  // ─── Aplicar Formación Imperativa (Solución para Android/Táctil y Reset) ───
  const aplicarFormacion = useCallback((teamType, formationName) => {
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return;

    const bounds = fr.getFieldBounds();
    if (!bounds || bounds.w === 0) return;

    if (teamType === 'rival' && !showRival) {
      setShowRival(true);
    }

    // Limpiar únicamente jugadores existentes de este equipo antes de aplicar la formación para evitar duplicados
    const currentObjects = [...fc.getObjects()];
    currentObjects.forEach(obj => {
      const isPlayer = obj.isPlayerPiece || obj.data?.type === 'player' || obj.data?.tipo === 'jugador';
      const objTeam = obj.data?.playerType || (obj.id?.startsWith('player_local') ? 'local' : obj.id?.startsWith('player_rival') ? 'rival' : (obj.id?.startsWith('player_joker') ? 'joker' : null));
      if (isPlayer && objTeam === teamType) {
        fc.remove(obj);
      }
    });

    const playerRadius = RADIO_JUGADOR;
    const formatInfo = getFormatInfo(fieldType);
    const targetFormation = (formationName && formatInfo.formations.includes(formationName)) ? formationName : formatInfo.defaultFormation;
    const positions = FORMATIONS[targetFormation] || FORMATIONS['4-3-3'];
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

    normalizarTamañoJugadores(fc);
    ensurePlayersOnTop();
    syncingR.current = false;
    fc.renderAll();
    saveFrameState();
    pushToHistory();
    setPlayerCountsRevision(c => c + 1);
    
    // PERSISTENCIA INMEDIATA TRAS APLICAR FORMACIÓN
    const frameState = serializarFrame();
    lastStateRef.current = frameState;
    if (activeTeamId && planId) {
      savePizarraLocal(activeTeamId, planId, frameState);
      guardarEstado(planId, frameState);
      try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
    }
  }, [createPlayer, localColor, rivalColor, isSwapped, fieldType, ready, saveFrameState, pushToHistory, serializarFrame, activeTeamId, planId, guardarEstado, normalizarTamañoJugadores, showRival]);

  // ─── Handlers de sincronización y eventos del canvas ──────────────────────
  const autoguardarEstado = useCallback(async () => {
    if (!user || !activeTeamId || defaultDrawnR.current === false) return;
    if (user.uid === 'invitado-local') return;
    
    const frameState = serializarFrame();
    setAutoSaveStatus('💾 Guardando...');
    try {
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
  }, [user, activeTeamId, serializarFrame, getTeamPath]);

  const debouncedSaveEstado = useCallback(() => {
    if (saveEstadoTimeoutR.current) clearTimeout(saveEstadoTimeoutR.current);
    saveEstadoTimeoutR.current = setTimeout(autoguardarEstado, 1500);
  }, [autoguardarEstado]);

  const onChange = useCallback((opt) => {
    if (syncingR.current) return;
    if (opt.target && opt.target.data && opt.target.data.type === 'temp') return;

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
    lastStateRef.current = frameState;
    if (activeTeamId && planId) {
      savePizarraLocal(activeTeamId, planId, frameState);
      guardarEstado(planId, frameState);
      try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(frameState)); } catch (_) {}
    }
    debouncedSaveEstado();
  }, [ensurePlayersOnTop, saveFrameState, pushToHistory, serializarFrame, activeTeamId, planId, guardarEstado, debouncedSaveEstado]);

  const onAddedOrRemoved = useCallback((opt) => {
    if (syncingR.current) return;
    if (opt.target && opt.target.data && opt.target.data.type === 'temp') return;
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
    setPlayerCountsRevision(c => c + 1);
  }, [ensurePlayersOnTop, saveFrameState, pushToHistory, serializarFrame, activeTeamId, planId, guardarEstado, debouncedSaveEstado]);

  const onPathCreated = useCallback((opt) => {
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
    }
    debouncedSaveEstado();
  }, [ensurePlayersOnTop, saveFrameState, pushToHistory, serializarFrame, activeTeamId, planId, guardarEstado, debouncedSaveEstado]);

  const attachListeners = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    fc.off('object:modified', onChange);
    fc.off('object:added',    onAddedOrRemoved);
    fc.off('object:removed',  onAddedOrRemoved);
    fc.off('path:created',    onPathCreated);
    fc.on('object:modified', onChange);
    fc.on('object:added',    onAddedOrRemoved);
    fc.on('object:removed',  onAddedOrRemoved);
    fc.on('path:created',    onPathCreated);
  }, [onChange, onAddedOrRemoved, onPathCreated]);

  const cargarFrameConListeners = useCallback((state, callback) => {
    cargarFrame(state, () => {
      if (callback) callback();
      attachListeners();
    });
  }, [cargarFrame, attachListeners]);

  // ─── 1. Initialize canvases once on mount (P-G3) ───────────────────────────
  useEffect(() => {
    if (!containerRef.current || !fieldCanvasRef.current || !fabricElemRef.current) return;

    let W = containerRef.current.offsetWidth;
    let H = containerRef.current.offsetHeight;

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

    // Cerrar drawers flotantes al pulsar sobre el canvas
    fc.on('mouse:down', () => {
      setShowTeamsDrawer(false);
      setShowMatsDrawer(false);
    });

    // 3. ToolManager
    const tm = new ToolManager(fc);
    tmRef.current = tm;

    attachListeners();
    setCanvasMounted(true);

    // 7. Resize logic con ResizeObserver
    const resizeCanvas = () => {
      if (syncingR.current) return;
      const contenedor = document.getElementById('canvas-container');
      const curFc = fcRef.current;
      const curFr = frRef.current;
      const fieldCanvas = fieldCanvasRef.current;
      if (!contenedor || !curFc || !fieldCanvas) return;

      let anchoContenedor = contenedor.offsetWidth;
      let altoContenedor  = contenedor.offsetHeight;

      if (anchoContenedor <= 0 || altoContenedor <= 0) {
        anchoContenedor = window.innerWidth;
        altoContenedor = Math.max(300, window.innerHeight - 120);
      }

      const isFS = document.querySelector('.pizarra-fullscreen') !== null;
      if (isFS) {
        const horizontalSafeInset = window.innerWidth <= 768 ? 180 : 340;
        const verticalSafeInset = window.innerHeight <= 500 ? 50 : 100;
        anchoContenedor = Math.max(anchoContenedor - horizontalSafeInset, 240);
        altoContenedor = Math.max(altoContenedor - verticalSafeInset, 200);
      }

      const isMobileView = window.innerWidth < 768 || (window.innerWidth < 950 && window.innerHeight < 500);
      const isTabletView = !isMobileView && window.innerWidth <= 1024;
      setIsMobile(isMobileView);
      setIsTablet(isTabletView);

      const aspect = 1.5;
      let nuevoAncho = anchoContenedor;
      let nuevoAlto  = anchoContenedor / aspect;
      if (nuevoAlto > altoContenedor) {
        nuevoAlto  = altoContenedor;
        nuevoAncho = altoContenedor * aspect;
      }

      const anchoActual = curFc.width  || nuevoAncho;
      const altoActual  = curFc.height || nuevoAlto;
      const snapshots = curFc.getObjects().map(obj => ({
        obj,
        xRel: obj.data?.xRel,
        yRel: obj.data?.yRel,
        xPct: anchoActual > 0 ? obj.left / anchoActual : 0,
        yPct: altoActual  > 0 ? obj.top  / altoActual  : 0,
        hasFieldCoords: obj.data?.xRel !== undefined && obj.data?.yRel !== undefined,
      }));

      fieldCanvas.width  = nuevoAncho;
      fieldCanvas.height = nuevoAlto;
      curFc.setDimensions({ width: nuevoAncho, height: nuevoAlto });

      if (curFr) {
        const activeType = fieldTypeRef.current || fieldType || 'full';
        curFr.draw(toLibType(activeType));
      }

      snapshots.forEach(({ obj, xRel, yRel, xPct, yPct, hasFieldCoords }) => {
        if (hasFieldCoords && curFr) {
          const point = curFr.getCanvasPoint(xRel, yRel);
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

      normalizarTamañoJugadores(curFc);
      curFc.renderAll();

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

    const handleOrientationChange = () => {
      setTimeout(resizeCanvas, 300);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

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

    const onKeyDown = (e) => {
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
        const activeObj = fcRef.current?.getActiveObject();
        if (activeObj) {
          activeObj.clone((cloned) => {
            clipboardR.current = cloned;
          }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (clipboardR.current && fcRef.current) {
          clipboardR.current.clone((clonedObj) => {
            const currentFc = fcRef.current;
            currentFc.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = currentFc;
              clonedObj.forEachObject((obj) => currentFc.add(obj));
              clonedObj.setCoords();
            } else {
              currentFc.add(clonedObj);
            }
            clipboardR.current.top += 20;
            clipboardR.current.left += 20;
            currentFc.setActiveObject(clonedObj);
            currentFc.requestRenderAll();
            pushToHistory();
          }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const currentFc = fcRef.current;
        const activeObj = currentFc?.getActiveObject();
        if (activeObj && !activeObj.isEditing) {
          if (activeObj.type === 'activeSelection') {
            activeObj.forEachObject(o => currentFc.remove(o));
            currentFc.discardActiveObject();
          } else {
            currentFc.remove(activeObj);
          }
          currentFc.requestRenderAll();
          pushToHistory();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const onMouseDownClone = (opt) => {
      if ((opt.e.ctrlKey || opt.e.metaKey) && opt.target) {
        opt.target.clone((clonedObj) => {
          const currentFc = fcRef.current;
          if (!currentFc) return;
          currentFc.discardActiveObject();
          clonedObj.set({
            left: clonedObj.left + 20,
            top: clonedObj.top + 20,
            evented: true,
          });
          currentFc.add(clonedObj);
          currentFc.setActiveObject(clonedObj);
          currentFc.requestRenderAll();
          pushToHistory();
        }, ['data', 'hasControls', 'hasBorders', 'playerType', 'tipo', 'radius']);
      }
    };
    fc.on('mouse:down', onMouseDownClone);

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const stateToSave = lastStateRef.current || (fcRef.current ? serializarFrame() : null);
        if (stateToSave && stateToSave.objects && stateToSave.objects.length > 0 && user && activeTeamId) {
          savePizarraLocal(activeTeamId, planId, stateToSave);
          try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(stateToSave)); } catch (_) {}
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

    const handleBeforeUnload = () => {
      const stateToSave = lastStateRef.current || (fcRef.current ? serializarFrame() : null);
      if (stateToSave && activeTeamId) {
        savePizarraLocal(activeTeamId, planId, stateToSave);
        try { localStorage.setItem(`mister11_pizarra_active_${activeTeamId}_${planId}`, JSON.stringify(stateToSave)); } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // P-G2: Cancelar animación en desmontaje
      playingR.current = false;
      if (animTimeoutR.current) {
        clearTimeout(animTimeoutR.current);
        animTimeoutR.current = null;
      }

      if (saveTimeoutR.current) clearTimeout(saveTimeoutR.current);
      if (saveFrameTimeoutR.current) clearTimeout(saveFrameTimeoutR.current);
      if (saveEstadoTimeoutR.current) clearTimeout(saveEstadoTimeoutR.current);

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      ro.disconnect();
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      fc.off('mouse:down', onMouseDownClone);
      fc.off('mouse:wheel', handleMouseWheel);
      fc.off('touch:gesture', handleTouch);
      fc.dispose();
      fcRef.current = null;
      frRef.current = null;
      tmRef.current = null;
      setCanvasMounted(false);
    };
  }, []); // Deps vacías: solo monta y desmonta una vez

  // ─── 2. Subscription & State Sync Effect (P-G3) ──────────────────────────
  useEffect(() => {
    if (!canvasMounted || !user || !activeTeamId || !planId) return;
    const fc = fcRef.current;
    const fr = frRef.current;
    if (!fc || !fr) return;

    let unsubscribe;

    // VERIF-2 (P-G1/G3): Limpiar piezas del equipo anterior por categoría antes de instanciar las nuevas
    removeAllPiecesPreservingField(fc);
    defaultDrawnR.current = false;

    // Obtener metadatos del plan (formación, campo, etc.)
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

    const ACTIVE_STATE_KEY = `mister11_pizarra_active_${activeTeamId}_${planId}`;

    let memoryCache = obtenerEstado(planId);
    let localCache = null;
    try {
      const raw = localStorage.getItem(ACTIVE_STATE_KEY);
      if (raw) localCache = JSON.parse(raw);
    } catch (_) {}

    if (!localCache || !localCache.objects || localCache.objects.length === 0) {
      localCache = getPizarraLocal(activeTeamId, planId);
    }

    const cachedState = memoryCache || localCache;

    if (user.uid === 'invitado-local') {
      defaultDrawnR.current = true;
      if (cachedState && cachedState.objects && cachedState.objects.length > 0) {
        cargarFrameConListeners(cachedState, () => {
          ensurePlayersOnTop();
          fc.renderAll();
          if (!readyR.current) { readyR.current = true; setReady(true); }
        });
      } else {
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

    if (cachedState && cachedState.objects && cachedState.objects.length > 0) {
      defaultDrawnR.current = true;
      cargarFrameConListeners(cachedState, () => {
        ensurePlayersOnTop();
        fc.renderAll();
        if (!readyR.current) { readyR.current = true; setReady(true); }
      });
      const q = query(framesColRef, orderBy('order', 'asc'));
      unsubscribe = onSnapshot(q, (snap) => {
        if (playingR.current) return;
        if (!snap.empty) {
          const localMap = new Map((framesR.current || []).map(f => [f.id, f]));
          const dbFrames = snap.docs
            .filter(d => !deletedFrameIdsR.current.has(d.id))
            .map(d => {
              const data = d.data();
              const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
              const localFrame = localMap.get(d.id);
              if (localFrame && localFrame.state && localFrame.state.objects && localFrame.state.objects.length > 0) {
                return { id: d.id, ...data, state: localFrame.state };
              }
              return { id: d.id, ...data, state: parsedState };
            });

          const dbIds = new Set(snap.docs.map(d => d.id));
          const optimisticFrames = (framesR.current || []).filter(f => !dbIds.has(f.id) && !deletedFrameIdsR.current.has(f.id));
          const merged = [...dbFrames, ...optimisticFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          if (merged.length > 0) {
            setFrames(merged);
            framesR.current = merged;
          }
        }
        if (!readyR.current) { readyR.current = true; setReady(true); }
      });
    } else {
      const estadoRef = doc(db, getTeamPath(), 'pizarra', 'estado_actual');
      getDoc(estadoRef).then(snap => {
        const data = snap.exists() ? snap.data() : null;
        if (data && data.canvasState) {
          const serverState = typeof data.canvasState === 'string' ? JSON.parse(data.canvasState) : data.canvasState;
          if (serverState && serverState.objects && serverState.objects.length > 0) {
            defaultDrawnR.current = true;
            cargarFrameConListeners(serverState, () => {
              ensurePlayersOnTop();
              fc.renderAll();
              lastStateRef.current = serverState;
              savePizarraLocal(activeTeamId, planId, serverState);
              try { localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(serverState)); } catch (_) {}
              if (!readyR.current) { readyR.current = true; setReady(true); }
            });
            return;
          }
        }

        const q = query(framesColRef, orderBy('order', 'asc'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (playingR.current) return;
          if (snapshot.empty) {
            if (defaultDrawnR.current) return;
            defaultDrawnR.current = true;
            const objsActuales = fc.getObjects().filter(o => o.data?.type !== 'field');
            objsActuales.forEach(o => fc.remove(o));
            syncingR.current = true;
            drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
            syncingR.current = false;
            attachListeners();
            const state = serializarFrame();
            try { localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(state)); } catch (_) {}
            savePizarraLocal(activeTeamId, planId, state);
            addDoc(framesColRef, { name: 'Frame 1', state: JSON.stringify(state), duration: 800, order: 0, createdAt: serverTimestamp() });
            if (!readyR.current) { readyR.current = true; setReady(true); }
            return;
          }

          const localMap = new Map((framesR.current || []).map(f => [f.id, f]));
          const dbFrames = snapshot.docs
            .filter(d => !deletedFrameIdsR.current.has(d.id))
            .map(d => {
              const data = d.data();
              const parsedState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
              const localFrame = localMap.get(d.id);
              if (localFrame && localFrame.state && localFrame.state.objects && localFrame.state.objects.length > 0) {
                return { id: d.id, ...data, state: localFrame.state };
              }
              return { id: d.id, ...data, state: parsedState };
            });

          const dbIds = new Set(snapshot.docs.map(d => d.id));
          const optimisticFrames = (framesR.current || []).filter(f => !dbIds.has(f.id) && !deletedFrameIdsR.current.has(f.id));
          const merged = [...dbFrames, ...optimisticFrames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          setFrames(merged);
          framesR.current = merged;
          if (!readyR.current) {
            readyR.current = true;
            setReady(true);
            if (merged.length > 0 && !defaultDrawnR.current) {
              defaultDrawnR.current = true;
              cargarFrameConListeners(merged[0].state, () => {
                setFrameIdx(0);
                frameIdxR.current = 0;
              });
            }
          }
        });
      }).catch(e => {
        console.error("[Pizarra] Error cargando pizarraEstado:", e);
        attachListeners();
        if (!readyR.current) { readyR.current = true; setReady(true); }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      const stateToSave = lastStateRef.current || (fcRef.current ? serializarFrame() : null);
      if (stateToSave && stateToSave.objects && stateToSave.objects.length > 0 && user && activeTeamId) {
        savePizarraLocal(activeTeamId, planId, stateToSave);
        try { localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(stateToSave)); } catch (_) {}
      }
    };
  }, [canvasMounted, user, activeTeamId, planId]);

  // ─── Auto-redibujar y Guardar al cambiar formación ──────────────────────────

  // ─── Field type change (Reorganización limpia por formato y ventana) ──
  useEffect(() => {
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr || playingR.current) return;

    const oldLibType = toLibType(fr.currentType);
    const newLibType = toLibType(fieldType);

    // 1. Redibujar el campo con el nuevo tipo
    if (newLibType === 'reduced') {
      fr.setReducedDimensions(reducedDim.w, reducedDim.h);
    }
    fr.draw(newLibType);

    // 2. Verificar formato y actualizar formaciones si la actual no pertenece al nuevo formato
    const formatInfo = getFormatInfo(fieldType);
    let targetLocal = localFormation;
    if (!formatInfo.formations.includes(localFormation)) {
      targetLocal = formatInfo.defaultFormation;
      setLocalFormationState(targetLocal);
    }
    let targetRival = rivalFormation;
    if (!formatInfo.formations.includes(rivalFormation)) {
      targetRival = formatInfo.defaultFormation;
      setRivalFormationState(targetRival);
    }

    // 3. Re-proyectar TODAS las piezas tácticas (jugadores, conos, balones, comodines, zonas, herramientas)
    // O1: Remapeo proporcional por ventana normalizada + clamp preservando relaciones (cero en margen negro)
    syncingR.current = true;
    const allPieces = fc.getObjects().filter(o => !isFieldLayer(o));

    // Si cambiamos a formato F7, F8 o Futsal, retirar jugadores excedentes sobre el límite reglamentario
    const maxCount = formatInfo.count;
    const localPlayers = allPieces.filter(o => (o.isPlayerPiece || o.data?.type === 'player' || o.data?.tipo === 'jugador') && o.data?.playerType === 'local');
    const rivalPlayers = allPieces.filter(o => (o.isPlayerPiece || o.data?.type === 'player' || o.data?.tipo === 'jugador') && o.data?.playerType === 'rival');

    if (localPlayers.length > maxCount) {
      localPlayers.slice(maxCount).forEach(p => fc.remove(p));
    }
    if (rivalPlayers.length > maxCount) {
      rivalPlayers.slice(maxCount).forEach(p => fc.remove(p));
    }

    const remainingPieces = fc.getObjects().filter(o => !isFieldLayer(o));
    const hasRemainingPlayers = remainingPieces.some(o => o.isPlayerPiece || o.data?.type === 'player' || o.data?.tipo === 'jugador');

    if (!hasRemainingPlayers) {
      // Si el canvas no tenía jugadores, dibujar la alineación reglamentaria inicial
      drawPlayers(fc, fr, fieldType, { local: targetLocal, rival: targetRival }, isSwapped);
    } else {
      // Re-proyectar todas las piezas tácticas existentes preservando posiciones tácticas relativas
      remainingPieces.forEach(obj => {
        let curRelX = obj.data?.xRel;
        let curRelY = obj.data?.yRel;

        if (curRelX === undefined || curRelY === undefined) {
          const rel = fr.getRelativePoint(obj.left, obj.top);
          curRelX = rel.rx;
          curRelY = rel.ry;
        }

        const remapped = remapCoordinatesByWindow(curRelX, curRelY, oldLibType, newLibType);
        const pt = fr.getCanvasPoint(remapped.x, remapped.y);

        obj.set({
          left: pt.x,
          top: pt.y,
          visible: true
        });

        if (!obj.data) obj.data = {};
        obj.data.xRel = remapped.x;
        obj.data.yRel = remapped.y;

        // Soporte de remapeo para herramientas con dos endpoints (líneas rectas, flechas)
        if (obj.x1 !== undefined && obj.x2 !== undefined) {
          const p1 = remapCoordinatesByWindow(obj.data?.x1Rel ?? curRelX, obj.data?.y1Rel ?? curRelY, oldLibType, newLibType);
          const p2 = remapCoordinatesByWindow(obj.data?.x2Rel ?? curRelX, obj.data?.y2Rel ?? curRelY, oldLibType, newLibType);
          const pt1 = fr.getCanvasPoint(p1.x, p1.y);
          const pt2 = fr.getCanvasPoint(p2.x, p2.y);
          obj.set({ x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y });
          obj.data.x1Rel = p1.x; obj.data.y1Rel = p1.y;
          obj.data.x2Rel = p2.x; obj.data.y2Rel = p2.y;
        }

        obj.setCoords();
      });
    }

    syncingR.current = false;
    fc.renderAll();
    ensurePlayersOnTop();
    saveFrameState();
    pushToHistory();
    setPlayerCountsRevision(c => c + 1);
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
      const hasRivals = fc.getObjects().some(obj => (obj.isPlayerPiece || obj.data?.type === 'player' || obj.data?.tipo === 'jugador') && obj.data?.playerType === 'rival');
      if (!hasRivals) {
        aplicarFormacion('rival', rivalFormation);
      }
    } else {
      const objects = [...fc.getObjects()];
      objects.forEach(obj => {
        const isPlayer = obj.isPlayerPiece || obj.data?.type === 'player' || obj.data?.tipo === 'jugador';
        const objTeam = obj.data?.playerType || (obj.id?.startsWith('player_rival') ? 'rival' : null);
        if (isPlayer && objTeam === 'rival') {
          fc.remove(obj);
        }
      });
      fc.renderAll();
      saveFrameState();
      pushToHistory();
      setPlayerCountsRevision(c => c + 1);
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

  // O3: salir del modo sticky al elegir select (flecha) u otra herramienta
  useEffect(() => {
    if (activeTool !== 'place_material' && placingMat) setPlacingMat(null);
  }, [activeTool]); // eslint-disable-line

  // ─── Material placement (O3 STICKY / REPETICIÓN + REGLA DE GESTO - Frente K) ──
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !placingMat) return;

    fc.defaultCursor = 'crosshair';

    const onDown = (o) => {
      // Regla de resolución de gesto: Si se pulsa sobre una pieza existente, ARRASTRARLA y no colocar material encima
      if (o.target && !isFieldLayer(o.target) && o.target.data?.type !== 'temp') {
        fc.setActiveObject(o.target);
        fc.renderAll();
        return;
      }

      // Clic sobre vacío/césped: colocar una instancia de material
      const p = fc.getPointer(o.e);
      placeMaterialOnCanvas(fc, placingMat, p.x, p.y);
      saveFrameState();
      // O3 STICKY: Permanece activo para colocar N materiales sucesivos (resuelve Picture 17)
    };

    // Tecla Esc para salir del modo de colocación repetida
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPlacingMat(null);
        setActiveTool('select');
        if (fc) fc.defaultCursor = 'default';
      }
    };

    fc.on('mouse:down', onDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      fc.off('mouse:down', onDown);
      window.removeEventListener('keydown', onKeyDown);
      if (fc) fc.defaultCursor = 'default';
    };
  }, [placingMat, saveFrameState]);

  // ─── Undo / Redo (connected to manual history) ──────────────────────────
  // functions defined above with useCallback

  const clearCanvas = () => {
    if (!window.confirm(isEn ? 'Clear board? (This clears the current drawing, but does not delete animation frames. Use "NEW" to start from scratch)' : '¿Limpiar pizarra? (Esto borra el dibujo actual, pero no elimina los frames de la animación. Usa "NUEVA" para empezar de cero)')) return;
    const fc = fcRef.current; const fr = frRef.current;
    if (!fc || !fr) return;
    removeAllPiecesPreservingField(fc);
    clearPizarraLocal(activeTeamId, planId);
    drawPlayers(fc, fr, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
    saveFrameState();
    pushToHistory();
  };

  // ─── Nueva Pizarra ────────────────────────────────────────────────────────
  const handleNewPizarra = async () => {
    if (!window.confirm(isEn ? 'Create new board? Unsaved changes will be lost and you will start an animation from scratch.' : '¿Crear nueva pizarra? Se perderán los cambios no guardados y empezarás una animación desde cero.')) return;
    
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
      removeAllPiecesPreservingField(fc);
      drawPlayers(fc, frRef.current, fieldType, { local: localFormation, rival: rivalFormation }, isSwapped);
      saveFrameState();
      resetHistory();
      defaultDrawnR.current = true;
    }
  };

  // ─── Capture Canvas as Image ──────────────────────────────────────────────
  const handleCapture = async (download = true, silent = false) => {
    if ((download || !silent) && !isProActive) {
      setUpgradeModal({ open: true, message: isEn ? 'Downloading and capturing board images is a PRO feature. Upgrade to use it.' : 'La descarga y captura de imágenes de la pizarra es una función PRO. Sube de nivel para usarla.' });
      return null;
    }
    const fc = fcRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    
    if (!fc || !fieldCanvas || !user || !activeTeamId) {
      if (!silent && !user) alert(isEn ? "You must sign in to capture." : "Debes iniciar sesión para capturar.");
      if (!silent && user && !activeTeamId) alert(isEn ? "You must select an active team." : "Debes seleccionar un equipo activo.");
      return null;
    }

    if (!silent) {
      setIsCapturing(true);

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

      // 7. Subir a Firebase Storage (con fallback JPEG si el PNG falla)
      let finalUrl = '';      // Siempre string, NUNCA base64 en Firestore
      let storagePath = null;

      if (user.uid !== 'invitado-local') {
        const uploadWithTimeout = (promise, ms) => Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);

        // Intento 1: Subir PNG completo a Storage
        try {
          const pngPath = `captures/${user.uid}/${activeTeamId}/${Date.now()}.png`;
          const pngRef = ref(storage, pngPath);
          await uploadWithTimeout(uploadString(pngRef, dataURL, 'data_url'), 8000);
          finalUrl = await uploadWithTimeout(getDownloadURL(pngRef), 5000);
          storagePath = pngPath;
        } catch (pngErr) {
          console.warn('[Pizarra] Falló subida PNG, intentando JPEG fallback:', pngErr.message);

          // Intento 2: Subir JPEG fallback comprimido (mucho más pequeño)
          try {
            const jpgPath = `captures/${user.uid}/${activeTeamId}/${Date.now()}_fb.jpg`;
            const jpgRef = ref(storage, jpgPath);
            await uploadWithTimeout(uploadString(jpgRef, fallbackDataURL, 'data_url'), 8000);
            finalUrl = await uploadWithTimeout(getDownloadURL(jpgRef), 5000);
            storagePath = jpgPath;
          } catch (jpgErr) {
            console.warn('[Pizarra] También falló JPEG fallback, guardando sin imagen:', jpgErr.message);
            finalUrl = '';   // Sin URL — el doc se guarda igual pero sin imagen
            storagePath = null;
          }
        }

        // 8. Guardar en Firestore — NUNCA base64, solo URLs de Storage o ''
        // La causa del error `invalid-argument` era almacenar base64 (~400KB) en el campo `url`,
        // lo que podía superar el límite de 1MB por documento de Firestore.
        try {
          const teamPath = getTeamPath();
          const capturesColPath = (teamPath && !teamPath.includes('undefined') && !teamPath.includes('null'))
            ? `${teamPath}/captures`
            : `users/${user.uid}/captures`;

          // Thumbnail: solo se guarda si cabe cómodamente (<80KB base64)
          const safeThumb = (typeof thumbnailDataURL === 'string' && thumbnailDataURL.length < 80000)
            ? thumbnailDataURL
            : '';

          console.log('[Capture] Guardando en Firestore:', capturesColPath, '| url:', finalUrl ? 'Storage URL' : 'vacía', '| thumb:', safeThumb.length, 'chars');

          await addDoc(collection(db, capturesColPath), {
            url: finalUrl,                           // Storage URL o '' — NUNCA base64
            thumbnail: safeThumb,                    // Miniatura <80KB o ''
            storagePath: storagePath ?? null,
            title: isEn ? `Tactical Capture (${new Date().toLocaleTimeString('en-US')})` : `Captura Táctica (${new Date().toLocaleTimeString('es-ES')})`,
            hasImage: finalUrl !== '',
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          // Toast no bloqueante — permite que React procese setIsCapturing(false) sin trabas
          setCaptureToast({ type: 'success', msg: isEn ? '✅ Capture saved. You can view it in Sessions > Captures.' : '✅ Captura guardada. Puedes verla en Sesiones > Capturas.' });
          setTimeout(() => setCaptureToast(null), 4000);
        } catch (dbErr) {
          console.error('[Capture] Error guardando en Firestore:', dbErr);
          setCaptureToast({ type: 'error', msg: (isEn ? '❌ Error saving: ' : '❌ Error al guardar: ') + (dbErr?.code || dbErr?.message || (isEn ? 'Unknown error' : 'Error desconocido')) });
          setTimeout(() => setCaptureToast(null), 5000);
        }
      } else {
        if (!download) {
          // invitado: notificar sin alert bloqueante
          setCaptureToast({ type: 'success', msg: isEn ? '✅ Capture completed locally.' : '✅ Captura completada localmente.' });
          setTimeout(() => setCaptureToast(null), 4000);
        }
      }

      // Retornamos un objeto con ambas URLs para que handleSave y exportación decidan qué usar
      return {
        full: finalUrl || dataURL,                                             // Storage URL o DataURL PNG nativo
        fullDataUrl: dataURL,                                                 // PNG nativo compuesto 1920x1280 (P4 / REGISTRO-2)
        thumb: (typeof thumbnailDataURL === 'string') ? thumbnailDataURL : ''  // Miniatura base64 o ''
      };

    } catch (err) {
      console.error("Error en captura:", err);
      if (!silent) {
        setCaptureToast({ type: 'error', msg: isEn ? '❌ Error generating capture. Check console.' : '❌ Error al generar la captura. Revisar consola.' });
        setTimeout(() => setCaptureToast(null), 5000);
      }
      return null;
    } finally {
      // SIEMPRE ocultar el overlay de captura, pase lo que pase.
      // Usando setIsCapturing aqui (en finally) en lugar de antes de alert()
      // garantiza que el overlay desaparece ANTES de cualquier re-render.
      // Como ya no usamos alert() bloqueante, React puede procesar este update inmediatamente.
      if (!silent) setIsCapturing(false);
    }
  };

  // ─── Export Pizarra as A4 Landscape PDF (Single Frame or Storyboard) ───────
  const handleExportPDF = async () => {
    if (!isProActive) {
      setUpgradeModal({ open: true, message: isEn ? 'Exporting the tactical board to PDF is a PRO feature. Upgrade to use it.' : 'La exportación en PDF de la pizarra táctica es una función PRO. Sube de nivel para usarla.' });
      return;
    }
    const fc = fcRef.current;
    if (!fc) return;

    try {
      setIsCapturing(true);
      const captureRes = await handleCapture(false, true);
      // FRENTE F (PDF-Q): Priorizar SIEMPRE resolución nativa de 2 capas (fullDataUrl / full) sobre miniatura thumb
      const canvasUrl = captureRes?.fullDataUrl || captureRes?.full || fc.toDataURL({ format: 'png', multiplier: 2 });
      await generatePizarraPDF({
        boardTitle: planName || 'Estrategia Táctica',
        canvasDataUrl: canvasUrl,
        frames: frames && frames.length > 1 ? frames : [],
        activeTeam,
        fieldType
      });
    } catch (e) {
      console.error('Error exportando PDF de pizarra:', e);
    } finally {
      setIsCapturing(false);
    }
  };


  // ─── Save entire plan (Frames + Meta) ───────────────────────────────────
  const handleSave = async () => {
    const btn = document.getElementById('btn-guardar-pizarra');
    const originalText = btn ? btn.innerHTML : '💾 GUARDAR';

    if (!user || !activeTeamId) {
      alert(isEn ? "Error: User or Team not identified." : "Error: Usuario o Equipo no identificados.");
      return;
    }
    
    // Bloquear UI
    if (btn) {
      btn.innerHTML = isEn ? '⏳ Saving...' : '⏳ Guardando...';
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    }

    try {
      // 1. Guardar estado lógico de los frames
      await saveFrameState(true);

      // 2. Generar captura (silent)
      const captureResult = await handleCapture(false, true);
      const finalThumb = captureResult?.thumb || null;
      const fullUrl = captureResult?.full && !captureResult.full.startsWith('data:') ? captureResult.full : null;

      // 3. Guardar Metadatos del ejercicio
      if (user.uid !== 'invitado-local') {
        const exerciseRef = doc(db, getTeamPath(), 'exercises', planId);
        
        // Guardar metadata: thumbnail ligero + URL Storage de alta resolución si existe
        await setDoc(exerciseRef, {
          id: planId,
          title: isEn ? `Tactical Board (${new Date().toLocaleDateString('en-US')})` : `Pizarra Táctica (${new Date().toLocaleDateString('es-ES')})`,
          type: 'pizarra',
          framesCount: (framesR.current || []).length,
          thumbnail: finalThumb, // Siempre miniatura ligera
          boardCaptureUrl: fullUrl, // Alta resolución para PDFs y exportación
          imageUrl: fullUrl,
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
    await saveFrameState(true);

    // 2. Clone current state deeply
    const rawState = serializarFrame();
    const state = JSON.parse(JSON.stringify(rawState));
    
    if (!activeTeamId) return;
    
    try {
      const nextIdx = framesR.current ? framesR.current.length : frames.length;
      
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
        try {
          const teamPath = getTeamPath();
          // Validar que tanto teamPath como planId sean válidos antes de crear la referencia
          if (!teamPath || teamPath.includes('undefined') || teamPath.includes('null') ||
              !planId || planId.includes('undefined') || planId.includes('null')) {
            console.warn('[Pizarra] addFrame: ruta inválida, usando ID local. teamPath:', teamPath, 'planId:', planId);
            newFrameId = `frame-${Date.now()}`;
          } else {
            const framesColRef = collection(db, teamPath, 'pizarras', planId, 'frames');
            const newDocRef = doc(framesColRef);
            newFrameId = newDocRef.id;
            setDoc(newDocRef, {
              ...newFrameData,
              createdAt: serverTimestamp()
            }).catch(err => console.error('Error setting frame doc:', err));
          }
        } catch (pathErr) {
          console.warn('[Pizarra] addFrame: error al crear referencia Firestore, usando ID local:', pathErr);
          newFrameId = `frame-${Date.now()}`;
        }
      }
      
      const newFrame = {
        id: newFrameId,
        ...newFrameData,
        state // Keep deep-cloned object in local state
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
  const loadFrame = async (idx, saveCurrent = true) => {
    const fc = fcRef.current;
    if (!fc || !framesR.current || !framesR.current[idx]) return;

    // Solo guardar el frame anterior si se solicita explícitamente y no estamos en medio de reproducción o sync
    if (saveCurrent && !playingR.current && !syncingR.current) {
      await saveFrameState(true);
    }
    
    syncingR.current = true;
    const targetFrame = framesR.current[idx];
    const targetState = (typeof targetFrame.state === 'string')
      ? JSON.parse(targetFrame.state)
      : targetFrame.state;

    cargarFrame(targetState, () => {
      syncingR.current = false;
      fc.renderAll();
      setFrameIdx(idx);
      frameIdxR.current = idx;
      resetHistory();
      presentR.current = JSON.stringify(targetState);
    });
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
    
    // Guardar frame actual antes de reproducir para asegurar que no se pierdan ediciones
    await saveFrameState(true);

    setIsPlaying(true);
    playingR.current = true;

    const parseState = (s) => {
      if (!s) return { objects: [] };
      if (typeof s === 'string') {
        try { return JSON.parse(s); } catch (_) { return { objects: [] }; }
      }
      return s;
    };

    const animate = (idx) => {
      // Salida temprana si el usuario detuvo la animación
      if (!playingR.current) return;

      if (idx >= framesR.current.length - 1) {
        const lastIdx = framesR.current.length - 1;
        setIsPlaying(false);
        playingR.current = false;
        setFrameIdx(lastIdx);
        frameIdxR.current = lastIdx;
        // Restaurar interactividad y controles del frame final SIN sobreescribir el frame
        loadFrame(lastIdx, false);
        return;
      }

      setFrameIdx(idx);
      frameIdxR.current = idx;
      const fA = framesR.current[idx];
      const fB = framesR.current[idx + 1];
      if (!fA || !fB) {
        setIsPlaying(false);
        playingR.current = false;
        return;
      }

      const stateA = parseState(fA.state);
      const stateB = parseState(fB.state);
      const dur = fB.duration || 800;

      // Al inicio de la animación completa (idx === 0), cargar frame 0 en canvas
      // Para pasos posteriores, los objetos ya están posicionados en el estado final del paso anterior
      const prepareFrame = (onReady) => {
        if (idx === 0) {
          cargarFrame(stateA, onReady);
        } else {
          onReady();
        }
      };

      prepareFrame(() => {
        if (!playingR.current) return;
        const objs = fc.getObjects();
        const rawTargets = Array.isArray(stateB.objects) ? stateB.objects : [];

        if (objs.length === 0 || rawTargets.length === 0) {
          // Fallback: transición directa
          cargarFrame(stateB, () => {
            if (!playingR.current) return;
            fc.renderAll();
            if (animTimeoutR.current) clearTimeout(animTimeoutR.current);
            animTimeoutR.current = setTimeout(() => {
              if (!playingR.current) return;
              animate(idx + 1);
            }, 300);
          });
          return;
        }

        // Mapear objetivos de forma determinista para todas las categorías (P2)
        const targetListWithPos = rawTargets.map((objData, i) => {
          let left, top;
          if (objData.xRel !== undefined && objData.yRel !== undefined) {
            const point = fr.getCanvasPoint(objData.xRel, objData.yRel);
            left = point.x;
            top  = point.y;
          } else {
            left = (objData.left / CANVAS_REF_WIDTH) * fc.width;
            top  = (objData.top / CANVAS_REF_HEIGHT) * fc.height;
          }
          const id = getObjectIdentifier(objData);
          const cat = objData.category || objData.data?.category || getTacticalCategory(objData);
          return { left, top, id, category: cat, data: objData, index: i };
        });

        // Filtrar objetos animables (todas las piezas tácticas, no el fondo ni el césped)
        const animatableObjs = objs.filter(o => !isFieldLayer(o));
        if (animatableObjs.length === 0) {
          cargarFrame(stateB, () => {
            if (!playingR.current) return;
            fc.renderAll();
            if (animTimeoutR.current) clearTimeout(animTimeoutR.current);
            animTimeoutR.current = setTimeout(() => {
              if (!playingR.current) return;
              animate(idx + 1);
            }, 200);
          });
          return;
        }

        // Emparejamiento determinista estricto sin saltos ni solapamientos de categoría (A-ANIM-1 y E-ANIM-2)
        const matchedTargetIndices = new Set();
        const animationsData = animatableObjs.map((obj) => {
          const objId = getObjectIdentifier(obj);
          const objCat = getTacticalCategory(obj);

          // 1. Intentar emparejar por ID único exacto
          let target = null;
          if (objId) {
            const foundIdx = targetListWithPos.findIndex((t, idxT) => !matchedTargetIndices.has(idxT) && t.id === objId);
            if (foundIdx !== -1) {
              matchedTargetIndices.add(foundIdx);
              target = targetListWithPos[foundIdx];
            }
          }

          // 2. Si no coincide ID, emparejar por misma categoría taxonómica y tipo (ej. platillo con platillo, balón con balón)
          if (!target && objCat) {
            const foundIdx = targetListWithPos.findIndex((t, idxT) => {
              if (matchedTargetIndices.has(idxT)) return false;
              if (t.category !== objCat) return false;
              const tItem = t.data?.itemId || t.data?.matType;
              const oItem = obj.data?.itemId || obj.data?.matType;
              return !tItem || !oItem || tItem === oItem;
            });
            if (foundIdx !== -1) {
              matchedTargetIndices.add(foundIdx);
              target = targetListWithPos[foundIdx];
            }
          }

          // 3. Fallback seguro: mantener posición actual (la pieza no salta a través del campo ni se teletransporta)
          const sLeft = obj.left || 0;
          const sTop  = obj.top  || 0;
          const tLeft = target?.left !== undefined ? target.left : sLeft;
          const tTop  = target?.top  !== undefined ? target.top  : sTop;

          return { obj, sLeft, sTop, tLeft, tTop };
        });

        let transitionScheduled = false;

        // P-G4: Un único fabric.util.animate maestro que mueve todos los objetos y llama a fc.renderAll() 1 sola vez por tick
        fabric.util.animate({
          startValue: 0,
          endValue: 1,
          duration: dur,
          easing: fabric.util.ease.easeInOutSine,
          onChange: (v) => {
            if (!playingR.current) return;
            animationsData.forEach(({ obj, sLeft, sTop, tLeft, tTop }) => {
              obj.set({
                left: sLeft + (tLeft - sLeft) * v,
                top:  sTop  + (tTop  - sTop ) * v,
              });
              obj.setCoords();
            });
            fc.renderAll(); // 1 sola llamada por tick (baja de 22 a 1)
          },
          onComplete: () => {
            if (!playingR.current || transitionScheduled) return;
            transitionScheduled = true;
            cargarFrame(stateB, () => {
              if (!playingR.current) return;
              fc.renderAll();
              // P-G2: Guardar setTimeout recursivo en animTimeoutR
              if (animTimeoutR.current) clearTimeout(animTimeoutR.current);
              animTimeoutR.current = setTimeout(() => {
                if (!playingR.current) return;
                animate(idx + 1);
              }, 200);
            });
          },
        });
      });
    };

    animate(0);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    playingR.current = false;
    // P-G2: Limpiar timeout activo al pausar/detener animación
    if (animTimeoutR.current) {
      clearTimeout(animTimeoutR.current);
      animTimeoutR.current = null;
    }
    // Recargar frame actual sin guardar el estado a mitad de animación
    loadFrame(frameIdxR.current, false);
  };

  // ─── Add Single Players ───────────────────────────────────────────────────
  const addManualPlayer = (type) => {
    const fc = fcRef.current;
    if (!fc) return;
    
    let color = localColor;
    if (type === 'rival') {
      color = rivalColor;
      if (!showRival) setShowRival(true);
    }
    if (type === 'joker') color = jokerColor;

    const existing = fc.getObjects().filter(o => (o.isPlayerPiece || o.data?.type === 'player' || o.data?.tipo === 'jugador') && o.data?.playerType === type);
    const label = String(existing.length + 1);

    const center = fc.getCenter();
    const offsetX = ((existing.length % 5) - 2) * 26;
    const offsetY = Math.floor(existing.length / 5) * 28;
    const player = createPlayer(center.left + offsetX, center.top + offsetY, { 
      color, 
      label, 
      type, 
      pos: '',
      id: `player_${type}_${label}_${Date.now()}`
    });
    fc.add(player);
    normalizarTamañoJugadores(fc);
    fc.setActiveObject(player);
    fc.renderAll();
    saveFrameState();
    setPlayerCountsRevision(c => c + 1);
  };

  const deleteSelected = () => {
    const fc = fcRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (active) {
      fc.remove(active);
      fc.renderAll();
      saveFrameState();
      setPlayerCountsRevision(c => c + 1);
    }
  };

  // ─── Sub-Components (Panels Extraídos) ───────────────────────────────────
  const TeamsPanel = () => (
    <SavedPlaysPanel
      localColor={localColor}
      setLocalColor={setLocalColor}
      rivalColor={rivalColor}
      setRivalColor={setRivalColor}
      jokerColor={jokerColor}
      setJokerColor={setJokerColor}
      localFormation={localFormation}
      setLocalFormation={setLocalFormation}
      rivalFormation={rivalFormation}
      setRivalFormation={setRivalFormation}
      addManualPlayer={addManualPlayer}
      aplicarFormacion={aplicarFormacion}
      showRival={showRival}
      setShowRival={setShowRival}
      deleteSelected={deleteSelected}
      fieldType={fieldType}
      localCount={getPlayerCount('local')}
      rivalCount={getPlayerCount('rival')}
      jokerCount={getPlayerCount('joker')}
    />
  );

  const MaterialsPanelWrapper = () => (
    <MaterialsPanel
      openCats={openCats}
      setOpenCats={setOpenCats}
      placingMat={placingMat}
      setPlacingMat={setPlacingMat}
      setActiveTool={setActiveTool}
      isMobile={isMobile}
      setShowMatsDrawer={setShowMatsDrawer}
    />
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  const isLandscape = window.innerWidth > window.innerHeight;
  const showSidebars = !isMobile && !fullscreenMode && isLandscape;

  return (
    <>
      <div className={`pizarra-container ${isMobile ? 'mobile' : 'desktop'} ${isLandscape ? 'landscape' : 'portrait'} ${fullscreenMode ? 'pizarra-fullscreen' : ''}`} 
        style={{ touchAction: 'pan-y' }}>

      {/* ── TOP BAR (Extraída) ────────────────────────────────────────────── */}
      <CanvasToolbar
        fieldType={fieldType}
        setFieldType={setFieldType}
        fullscreenMode={fullscreenMode}
        setFullscreenMode={setFullscreenMode}
        autoSaveStatus={autoSaveStatus}
        reducedDim={reducedDim}
        setReducedDim={setReducedDim}
        frRef={frRef}
        isSwapped={isSwapped}
        setIsSwapped={setIsSwapped}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        isMobile={isMobile}
        setShowMoreMenu={setShowMoreMenu}
        activeColor={activeColor}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        activeWidth={activeWidth}
        showWidthPicker={showWidthPicker}
        setShowWidthPicker={setShowWidthPicker}
        fcRef={fcRef}
        setZoomLevel={setZoomLevel}
        undo={undo}
        redo={redo}
        histCount={histCount}
        redoCount={redoCount}
        clearCanvas={clearCanvas}
        handleNewPizarra={handleNewPizarra}
        handleCapture={handleCapture}
        handleExportPDF={handleExportPDF}
        isCapturing={isCapturing}
        exportAnimationVideo={exportAnimationVideo}
        isRecording={isRecording}
        exportProgress={exportProgress}
        handleSave={handleSave}
        setLeftPanelOpen={setLeftPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        setShowTeamsDrawer={setShowTeamsDrawer}
        setShowMatsDrawer={setShowMatsDrawer}
        toggleFullscreen={toggleFullscreen}
      />
      
      {fullscreenMode && (
        <>
          {/* Botón salir fullscreen */}
          <button
            className="floating-exit"
            onClick={toggleFullscreen}
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
            <button onClick={undo} title={isEn ? "Undo" : "Deshacer"}>↩</button>
            <button onClick={clearCanvas} title={isEn ? "Clear all" : "Limpiar todo"} style={{ color: '#ff6b6b' }}>🗑</button>
            <button onClick={() => handleCapture(true)} title={isEn ? "Capture image" : "Capturar imagen"}>📸</button>
          </div>
        </>
      )}

      {/* ── MAIN BOARD ────────────────────────────────────────────────────── */}
      <div className="pizarra-main">

        {/* Panel izquierdo — Equipos (tablet + desktop, solo landscape) */}
        {showSidebars && (
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

          {/* MÓDULO 1: Paneles flotantes en pantalla completa */}
          {fullscreenMode && showTeamsDrawer && (
            <div 
              className="fullscreen-floating-panel fullscreen-floating-panel-left"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <div className="fullscreen-panel-header">
                <div className="fullscreen-panel-header-title">
                  <span className="fullscreen-panel-icon">📋</span>
                  <span>{t('board.panels.teamsAndFormations', {}, 'Equipos')}</span>
                </div>
                <button 
                  className="fullscreen-panel-close-btn" 
                  onClick={(e) => { e.stopPropagation(); setShowTeamsDrawer(false); }}
                  aria-label={t('common.close', {}, 'Cerrar')}
                >
                  ✕
                </button>
              </div>
              <div className="fullscreen-panel-body">
                <TeamsPanel />
              </div>
            </div>
          )}

          {fullscreenMode && showMatsDrawer && (
            <div 
              className="fullscreen-floating-panel fullscreen-floating-panel-right"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <div className="fullscreen-panel-header">
                <div className="fullscreen-panel-header-title">
                  <span className="fullscreen-panel-icon">🧰</span>
                  <span>{t('board.panels.materials', {}, 'Materiales')}</span>
                </div>
                <button 
                  className="fullscreen-panel-close-btn" 
                  onClick={(e) => { e.stopPropagation(); setShowMatsDrawer(false); }}
                  aria-label={t('common.close', {}, 'Cerrar')}
                >
                  ✕
                </button>
              </div>
              <div className="fullscreen-panel-body">
                <MaterialsPanelWrapper />
              </div>
            </div>
          )}

          {/* Floating Buttons - Lógica condicional responsiva para Pantalla Completa o Modo Retrato */}
          {fullscreenMode ? (
            <>
              <button 
                className={`btn-fullscreen-floating-left ${showTeamsDrawer ? 'active' : ''}`} 
                onClick={() => { setShowTeamsDrawer(v => !v); setShowMatsDrawer(false); }}
                title={t('board.panels.teams')}
              >
                📋
              </button>
              <button 
                className={`btn-fullscreen-floating-right ${showMatsDrawer ? 'active' : ''}`} 
                onClick={() => { setShowMatsDrawer(v => !v); setShowTeamsDrawer(false); }}
                title={t('board.panels.materials')}
              >
                🧰
              </button>
            </>
          ) : (
            /* MÓDULO 3: Restaurar botones flotantes en modo vertical */
            !showSidebars && (
              <>
                <button 
                  onClick={() => toggleLeftPanel()} 
                  className={`btn-portrait-floating-left ${showTeamsDrawer ? 'active' : ''}`}
                  title={t('board.panels.teams')}
                >
                  👥
                </button>
                <button 
                  onClick={() => toggleRightPanel()} 
                  className={`btn-portrait-floating-right ${showMatsDrawer ? 'active' : ''}`}
                  title={t('board.panels.materials')}
                >
                  🧰
                </button>
              </>
            )
          )}
        </div>

        {/* Panel derecho — Materiales (tablet + desktop, solo landscape) */}
        {showSidebars && (
          <div className="panel-der">
            <MaterialsPanelWrapper />
          </div>
        )}

        {/* PORTRAIT INTEGRATED DRAWER: Desplaza el campo hacia arriba en vertical */}
        {!showSidebars && !fullscreenMode && (showTeamsDrawer || showMatsDrawer) && (
          <div className="pizarra-portrait-drawer">
            <div className="pizarra-portrait-drawer-header">
              <h3>{showTeamsDrawer ? t('board.panels.teamsAndFormations') : t('board.panels.materials')}</h3>
              <button 
                className="btn-close-portrait-drawer" 
                onClick={() => { setShowTeamsDrawer(false); setShowMatsDrawer(false); }}
              >
                ✕
              </button>
            </div>
            <div className="pizarra-portrait-drawer-body">
              {showTeamsDrawer ? <TeamsPanel /> : <MaterialsPanelWrapper />}
            </div>
          </div>
        )}

      </div>

      {/* ── TIMELINE (Extraída) ───────────────────────────────────────────── */}
      <AnimationPanel
        frames={frames}
        frameIdx={frameIdx}
        isPlaying={isPlaying}
        loadFrame={loadFrame}
        stopAnimation={stopAnimation}
        playAnimation={playAnimation}
        addFrame={addFrame}
        deleteFrame={deleteFrame}
        onOpenExportModal={openExportModal}
      />

      {/* ── Modal Paramétrico de Exportación MP4/PNG (Fix Crítico C) ── */}
      <ExportAnimationModal
        isOpen={showExportModal}
        onClose={() => {
          if (!isRecording) {
            setShowExportModal(false);
            setExportResult(null);
          }
        }}
        fcRef={fcRef}
        frRef={frRef}
        fieldCanvasRef={fieldCanvasRef}
        framesRef={framesR}
        planId={planId || 'tactica'}
        planTitle={planName || 'Animación Táctica'}
        sceneState={{
          orientation: isLandscape ? 'landscape' : 'portrait',
          fieldType
        }}
        onExport={exportAnimationVideo}
        isRecording={isRecording}
        exportProgress={exportProgress}
        exportResult={exportResult}
        onResetExportResult={() => setExportResult(null)}
      />



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

    {/* ── OVERLAY DE CAPTURA (spinner mientras procesa) ── */}
    {isCapturing && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#4CAF7D',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 2, margin: 0 }}>
          CAPTURANDO IMAGEN...
        </p>
      </div>
    )}

    {/* ── TOAST DE CAPTURA (no bloqueante, reemplaza alert()) ── */}
    {captureToast && (
      <div style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10000, minWidth: 280, maxWidth: 420,
        background: captureToast.type === 'success' ? '#1a3a2a' : '#3a1a1a',
        border: `1px solid ${captureToast.type === 'success' ? '#4CAF7D' : '#E53935'}`,
        borderRadius: 12, padding: '14px 20px',
        color: '#fff', fontSize: 14, fontWeight: 600,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'fadeInUp 0.3s ease'
      }}>
        <span style={{ fontSize: 18 }}>{captureToast.type === 'success' ? '✅' : '❌'}</span>
        <span>{captureToast.msg.replace(/^[✅❌]\s*/, '')}</span>
        <button onClick={() => setCaptureToast(null)} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, padding: 0
        }}>✕</button>
      </div>
    )}
    {/* ── BARRA PORCENTUAL DE CODIFICACIÓN MP4 (DEF-M05-01) ── */}
    {exportProgress !== null && (
      <div className="export-progress-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}>
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: 16,
          padding: '28px 32px',
          width: '90%',
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--text-primary, #ffffff)', fontWeight: 700 }}>
            {t('board.export.encodingTitle')}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)' }}>
            {t('board.export.encodingProgress')}
          </p>
          <div style={{
            width: '100%', height: 16,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8, overflow: 'hidden',
            marginBottom: 12, position: 'relative'
          }}>
            <div
              className="export-progress-bar"
              style={{
                width: `${exportProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                borderRadius: 8,
                transition: 'width 0.2s ease-in-out'
              }}
            />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
            {exportProgress}%
          </div>
          <button
            type="button"
            className="btn-cancel-export"
            onClick={cancelExport}
            style={{
              marginTop: 18,
              padding: '10px 20px',
              minHeight: 44,
              minWidth: 120,
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    )}
    </>
  );
};


export default PizarraTactica;
