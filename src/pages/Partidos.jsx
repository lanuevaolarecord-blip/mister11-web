import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useTeams } from '../hooks/useTeams';
import { generatePostMatchReportPDF } from '../utils/pdfGenerator';
import { generateGoogleCalendarUrl, generateICSContent, downloadICSFile } from '../utils/calendarHelper';
import { PREDEFINED_FORMATIONS } from '../utils/formaciones';
import { useCustomFormations } from '../hooks/useCustomFormations';
import { useMatchEvents } from '../hooks/useMatchEvents';
import CustomFormationModal from '../components/CustomFormationModal';
import FormationSelector from '../components/FormationSelector';
import './Partidos.css';
import { normalizeText } from '../utils/normalizeInput';

// Auxiliar para determinar la zona general de una posición táctica
const getGeneralZone = (pos) => {
  if (['POR'].includes(pos)) return 'POR';
  if (['DEF', 'LTD', 'LTI'].includes(pos)) return 'DEF';
  if (['MC', 'MCD', 'MCO', 'MD', 'MI'].includes(pos)) return 'MC';
  if (['DEL', 'EXT'].includes(pos)) return 'DEL';
  return 'MC';
};

// Distribuidor inteligente de jugadores según posiciones naturales
const alignStartersByPosition = (calledIds, players, positionsList) => {
  const startersIds = calledIds.slice(0, 11).filter(Boolean);
  const subsIds = calledIds.slice(11);
  const starters = startersIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  const assigned = Array(11).fill(null);
  const unassigned = [...starters];

  // 1ra pasada: coincidencias exactas
  positionsList.forEach((slot, slotIdx) => {
    const exactMatchIdx = unassigned.findIndex(p => p.position === slot.pos);
    if (exactMatchIdx !== -1) {
      assigned[slotIdx] = unassigned[exactMatchIdx].id;
      unassigned.splice(exactMatchIdx, 1);
    }
  });

  // 2da pasada: zona general (ej: lateral derecho en defensa)
  positionsList.forEach((slot, slotIdx) => {
    if (assigned[slotIdx]) return;
    const slotZone = getGeneralZone(slot.pos);
    const zoneMatchIdx = unassigned.findIndex(p => getGeneralZone(p.position) === slotZone);
    if (zoneMatchIdx !== -1) {
      assigned[slotIdx] = unassigned[zoneMatchIdx].id;
      unassigned.splice(zoneMatchIdx, 1);
    }
  });

  // 3ra pasada: rellenar slots vacíos restantes con los jugadores sobrantes
  positionsList.forEach((slot, slotIdx) => {
    if (assigned[slotIdx]) return;
    if (unassigned.length > 0) {
      assigned[slotIdx] = unassigned[0].id;
      unassigned.splice(0, 1);
    }
  });

  const alignedXI = assigned.map(val => val || null);
  return [...alignedXI, ...subsIds];
};


// SVG Iconos reutilizables
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const Partidos = () => {
  const { activeTeamId } = useAuth();
  const { matches, loading: loadingMatches, addMatch, updateMatch, removeMatch } = useMatches(activeTeamId);
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const { settings } = useSettings(activeTeamId);
  const { activeTeam } = useTeams();
  
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'EDIT'
  const [filterMode, setFilterMode] = useState('Todos'); // 'Todos', 'Pendientes', 'Terminados'
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editTab, setEditTab] = useState('PRE-PARTIDO');
  const [matchData, setMatchData] = useState({});
  const [calledPlayers, setCalledPlayers] = useState([]); // Array of IDs
  const [draggingIdx, setDraggingIdx] = useState(null);
  const pitchRef = useRef(null);

  const [selectedSlotIdx, setSelectedSlotIdx] = useState(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const draggedDistanceRef = useRef(0);

  const [activeQuestion, setActiveQuestion] = useState('tactical');
  const [showReportPreview, setShowReportPreview] = useState(false);

  // --- Estados de Formación Personalizada ---
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomFormation, setEditingCustomFormation] = useState(null);
  const { customFormations, addCustomFormation, updateCustomFormation, deleteCustomFormation } = useCustomFormations();

  // --- Hook de Eventos de Partido (con guardado automático en Firestore) ---
  const { addEvent, removeEvent, makeSubstitution } = useMatchEvents(matchData, setMatchData, players, updateMatch);

  // --- Estados de Match Day ---
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  const [subOutId, setSubOutId] = useState('');
  const [subInId, setSubInId] = useState('');
  const [pendingEventType, setPendingEventType] = useState(null); // 'amarilla' | 'roja' | 'lesion' | 'gol_local'
  const [showEventPlayerSelector, setShowEventPlayerSelector] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const matchDayRef = useRef(null);

  const getFormationPositions = useCallback((lineupName) => {
    if (PREDEFINED_FORMATIONS[lineupName]) {
      return PREDEFINED_FORMATIONS[lineupName];
    }
    const custom = customFormations.find(f => f.name === lineupName);
    if (custom) return custom.positions;
    return PREDEFINED_FORMATIONS['4-3-3'];
  }, [customFormations]);

  const toggleFullscreen = () => {
    if (!matchDayRef.current) return;
    if (!document.fullscreenElement) {
      matchDayRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleTabChange = useCallback(async (tab) => {
    setEditTab(tab);
    if (matchData.id) {
      try {
        await updateMatch(matchData.id, { ...matchData, convocados: calledPlayers });
      } catch (err) {
        console.error("Error auto-saving match on tab change:", err);
      }
    }
  }, [matchData, calledPlayers, updateMatch]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (matchData.id) {
      const savedSecs = sessionStorage.getItem(`mister11_match_seconds_${matchData.id}`);
      if (savedSecs) setMatchSeconds(parseInt(savedSecs, 10));
      else setMatchSeconds(0);
      const savedRunning = sessionStorage.getItem(`mister11_match_running_${matchData.id}`);
      setIsTimerRunning(savedRunning === 'true');
    }
  }, [matchData.id]);

  useEffect(() => {
    if (matchData.id) {
      sessionStorage.setItem(`mister11_match_seconds_${matchData.id}`, matchSeconds);
      sessionStorage.setItem(`mister11_match_running_${matchData.id}`, isTimerRunning);
    }
  }, [matchSeconds, isTimerRunning, matchData.id]);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setMatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = () => setIsTimerRunning(prev => !prev);
  const handleTimerReset = () => {
    setIsTimerRunning(false);
    setMatchSeconds(0);
  };
  const handleTimerAdjust = (amount) => {
    setMatchSeconds(prev => Math.max(0, prev + amount));
  };

  const currentMinute = Math.max(1, Math.ceil(matchSeconds / 60));

  const handleTriggerEvent = (type) => {
    if (type === 'gol_rival') {
      addEvent('gol_rival', 'Rival', 'Gol del Rival', currentMinute);
    } else {
      setPendingEventType(type);
      setShowEventPlayerSelector(true);
    }
  };

  const handleSelectEventPlayer = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    addEvent(pendingEventType, playerId, player.name, currentMinute);
    setPendingEventType(null);
    setShowEventPlayerSelector(false);
  };

  const handleMakeSubstitution = () => {
    if (!subOutId || !subInId) return alert("Por favor selecciona quién sale y quién entra.");
    const success = makeSubstitution(subOutId, subInId, currentMinute);
    if (success) {
      const newCalled = [...calledPlayers];
      const idxOut = newCalled.indexOf(subOutId);
      const idxIn = newCalled.indexOf(subInId);
      if (idxOut !== -1 && idxIn !== -1) {
        newCalled[idxOut] = subInId;
        newCalled[idxIn] = subOutId;
        setCalledPlayers(newCalled);
      }
      setSubOutId('');
      setSubInId('');
    } else {
      alert("Error al realizar la sustitución. Verifica la convocatoria.");
    }
  };

  const handleRemoveEvent = (eventIdx) => {
    removeEvent(eventIdx);
  };

  const getLangText = (key) => {
    const isEn = settings && settings.language === 'English (EN)';
    const texts = {
      'post.title': { es: 'Resultados y Análisis', en: 'Results & Analysis' },
      'post.goalsFor': { es: 'Goles a Favor', en: 'Goals For' },
      'post.goalsAgainst': { es: 'Goles en Contra', en: 'Goals Against' },
      'post.mvp': { es: 'MVP del Partido', en: 'Match MVP' },
      'post.mvpSelect': { es: 'Seleccione MVP', en: 'Select MVP' },
      'post.scorers': { es: 'Goleadores y Asistencias', en: 'Scorers & Assists' },
      'post.scorersPlaceholder': { es: 'Ej. Juan (2), Pedro (1 asistencia)', en: 'e.g. John (2), Peter (1 assist)' },
      'post.notes': { es: 'Análisis General (Notas Tácticas)', en: 'General Analysis (Tactical Notes)' },
      'post.notesPlaceholder': { es: 'Escribe tus conclusiones del partido, puntos de mejora, etc.', en: 'Write match conclusions, areas of improvement, etc.' },
      'post.reportBuilder': { es: 'Informe Guiado (Cuestionario)', en: 'Guided Report (Questionnaire)' },
      'post.images': { es: 'Imágenes y Fotos del Partido', en: 'Match Images & Photos' },
      'post.uploadBtn': { es: 'Subir Fotos', en: 'Upload Photos' },
      'post.viewReport': { es: 'Visualizar Informe', en: 'View Report' },
      'post.downloadReport': { es: 'Descargar PDF', en: 'Download PDF' },
      'post.notFinished': { es: 'El partido aún no ha terminado', en: 'The match has not finished yet' },
      'post.notFinishedDesc': { es: 'Cambie el estado del partido a "Terminado" en la pestaña Pre-Partido para registrar el resultado.', en: 'Change the match status to "Terminado" in the Pre-Partido tab to record the result.' },
      'post.tactical': { es: 'Rendimiento Táctico', en: 'Tactical Performance' },
      'post.tacticalQ': { es: '¿Qué aspectos tácticos del plan de juego funcionaron y cuáles no?', en: 'Which tactical aspects of the game plan worked and which did not?' },
      'post.physical': { es: 'Aspecto Físico/Mental', en: 'Physical/Mental Aspect' },
      'post.physicalQ': { es: '¿Cómo evalúas el nivel físico, esfuerzo y la actitud mental del equipo?', en: 'How do you evaluate the physical level, effort, and mental attitude of the team?' },
      'post.improvement': { es: 'Puntos de Mejora', en: 'Areas for Improvement' },
      'post.improvementQ': { es: '¿Cuáles son los errores clave a corregir y las áreas de mejora prioritarias?', en: 'What are the key errors to correct and priority areas for improvement?' },
      'post.highlights': { es: 'Momentos Clave', en: 'Key Moments' },
      'post.highlightsQ': { es: '¿Qué jugadas destacadas, detalles individuales o notas adicionales deseas resaltar?', en: 'What highlights, individual details, or additional notes do you want to highlight?' },
      'post.previewTitle': { es: 'Vista Previa del Informe Post-Partido', en: 'Post-Match Report Preview' },
      'post.close': { es: 'Cerrar', en: 'Close' },
      'post.noAnswers': { es: 'Sin responder aún.', en: 'Not answered yet.' },
      'post.noImages': { es: 'No hay imágenes adjuntas.', en: 'No images attached.' }
    };
    return texts[key] ? (isEn ? texts[key].en : texts[key].es) : key;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          setMatchData(prev => ({
            ...prev,
            postMatchImages: [...(prev.postMatchImages || []), compressedBase64]
          }));
        };
      };
    });
  };

  const handleDeleteImage = (indexToRemove) => {
    setMatchData(prev => ({
      ...prev,
      postMatchImages: (prev.postMatchImages || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAnswerChange = (key, value) => {
    setMatchData(prev => ({
      ...prev,
      postMatchAnswers: {
        ...(prev.postMatchAnswers || {}),
        [key]: value
      }
    }));
  };

  const handleExportPDF = () => {
    if (!matchData.id) {
      alert("Guarde el partido antes de exportar el PDF.");
      return;
    }
    generatePostMatchReportPDF(matchData, players, activeTeam);
  };

  const reportQuestions = [
    { key: 'tactical', label: getLangText('post.tactical'), question: getLangText('post.tacticalQ') },
    { key: 'physical', label: getLangText('post.physical'), question: getLangText('post.physicalQ') },
    { key: 'improvement', label: getLangText('post.improvement'), question: getLangText('post.improvementQ') },
    { key: 'highlights', label: getLangText('post.highlights'), question: getLangText('post.highlightsQ') }
  ];

  const handleSlotClick = (idx) => {
    if (selectedSlotIdx === null) {
      setSelectedSlotIdx(idx);
    } else {
      if (selectedSlotIdx === idx) {
        setSelectedSlotIdx(null);
        return;
      }
      
      const newCalled = [...calledPlayers];
      while (newCalled.length < 18) {
        newCalled.push(undefined);
      }

      const temp = newCalled[selectedSlotIdx];
      newCalled[selectedSlotIdx] = newCalled[idx];
      newCalled[idx] = temp;
      
      const cleanedCalled = newCalled.map(item => item === undefined ? null : item);
      while (cleanedCalled.length > 0 && cleanedCalled[cleanedCalled.length - 1] === null) {
        cleanedCalled.pop();
      }

      setCalledPlayers(cleanedCalled);

      // Swap coordinates if custom positions exist
      const newCustomPos = { ...(matchData.customPositions || {}) };
      const posA = newCustomPos[selectedSlotIdx];
      const posB = newCustomPos[idx];

      if (posA) newCustomPos[idx] = posA;
      else delete newCustomPos[idx];

      if (posB) newCustomPos[selectedSlotIdx] = posB;
      else delete newCustomPos[selectedSlotIdx];

      setMatchData(prev => ({
        ...prev,
        convocados: cleanedCalled,
        customPositions: newCustomPos
      }));

      setSelectedSlotIdx(null);
    }
  };

  const handleAssignPosition = (idx, posName) => {
    setMatchData(prev => ({
      ...prev,
      customRoles: {
        ...(prev.customRoles || {}),
        [idx]: posName
      }
    }));
  };

  const handleResetPositions = () => {
    const currentLineup = matchData.lineup || '4-3-3';
    const slots = getFormationPositions(currentLineup);
    const newCalled = alignStartersByPosition(calledPlayers, players, slots);
    setCalledPlayers(newCalled);

    setMatchData(prev => ({
      ...prev,
      convocados: newCalled,
      customPositions: {},
      customRoles: {}
    }));
    setSelectedSlotIdx(null);
  };

  const getSlotPosition = (idx) => {
    if (matchData.customRoles && matchData.customRoles[idx]) {
      return matchData.customRoles[idx];
    }
    const defaultForm = getFormationPositions(matchData.lineup || '4-3-3');
    return defaultForm[idx]?.pos || 'DEF';
  };

  const handleDragStart = (e, idx) => {
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    setDraggingIdx(idx);
    dragStartPosRef.current = { x: clientX, y: clientY };
    draggedDistanceRef.current = 0;
  };

  useEffect(() => {
    const handlePointerUpWindow = () => {
      if (draggingIdx !== null) {
        if (draggedDistanceRef.current < 8) {
          handleSlotClick(draggingIdx);
        }
        setDraggingIdx(null);
      }
    };
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('touchend', handlePointerUpWindow);
    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('touchend', handlePointerUpWindow);
    };
  }, [draggingIdx, selectedSlotIdx, calledPlayers, matchData]);

  const handlePitchPointerMove = (e) => {
    if (draggingIdx === null || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    const dist = Math.hypot(clientX - dragStartPosRef.current.x, clientY - dragStartPosRef.current.y);
    draggedDistanceRef.current = dist;
    
    const xRel = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yRel = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setMatchData(prev => ({
      ...prev,
      customPositions: {
        ...(prev.customPositions || {}),
        [draggingIdx]: { top: `${yRel}%`, left: `${xRel}%` }
      }
    }));
  };

  const parseMatchDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const handleAddToGoogleCalendar = () => {
    if (!matchData.rival) {
      alert("Introduce el nombre del rival antes de sincronizar.");
      return;
    }
    const startDate = parseMatchDateTime(matchData.date, matchData.time);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    const url = generateGoogleCalendarUrl({
      title: `PARTIDO: ${activeTeam?.nombre || 'Míster11 FC'} vs ${matchData.rival}`,
      description: `Partido de fútbol. Alineación prevista: ${matchData.lineup || '4-3-3'}.`,
      location: matchData.location || '',
      startDate,
      endDate
    });
    window.open(url, '_blank');
  };

  const handleExportICS = () => {
    if (!matchData.rival) {
      alert("Introduce el nombre del rival antes de exportar.");
      return;
    }
    const startDate = parseMatchDateTime(matchData.date, matchData.time);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    const icsContent = generateICSContent([{
      id: matchData.id || `match-${Date.now()}`,
      title: `PARTIDO: ${activeTeam?.nombre || 'Míster11 FC'} vs ${matchData.rival}`,
      description: `Partido de fútbol. Alineación prevista: ${matchData.lineup || '4-3-3'}.`,
      location: matchData.location || '',
      startDate,
      endDate
    }]);
    downloadICSFile(`partido_${matchData.rival.replace(/\s+/g, '_')}.ics`, icsContent);
  };

  const handleExportAllMatchesICS = () => {
    if (matches.length === 0) return;
    const events = matches.map(m => {
      const startDate = parseMatchDateTime(m.date, m.time);
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
      return {
        id: m.id,
        title: `PARTIDO: ${activeTeam?.nombre || 'Míster11 FC'} vs ${m.rival}`,
        description: `Partido de fútbol. Alineación prevista: ${m.lineup || '4-3-3'}. Estado: ${m.status}.`,
        location: m.location || '',
        startDate,
        endDate
      };
    });
    const icsContent = generateICSContent(events);
    downloadICSFile(`calendario_partidos_${activeTeam?.nombre?.replace(/\s+/g, '_') || 'equipo'}.ics`, icsContent);
  };

  const handleNewMatch = () => {
    const newMatch = {
      rival: '',
      date: '',
      time: '',
      location: '',
      type: 'Local',
      status: 'Pendiente',
      goalsFor: 0,
      goalsAgainst: 0,
      lineup: '4-3-3',
      events: [],
      titulares: [],
      suplentes: [],
      postMatchAnswers: { tactical: '', physical: '', improvement: '', highlights: '' },
      postMatchImages: [],
      goleadoresList: [],
      tarjetasList: []
    };
    setMatchData(newMatch);
    setCalledPlayers([]); 
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const handleEditMatch = (match) => {
    setMatchData({ 
      postMatchAnswers: { tactical: '', physical: '', improvement: '', highlights: '' },
      postMatchImages: [],
      goleadoresList: [],
      tarjetasList: [],
      ...match 
    });
    setCalledPlayers(match.convocados || []);
    setEditTab('PRE-PARTIDO');
    setViewMode('EDIT');
  };

  const togglePlayerCall = (id) => {
    if (calledPlayers.includes(id)) {
      setCalledPlayers(calledPlayers.filter(p => p !== id));
    } else {
      if (calledPlayers.length >= 18) return alert("Máximo 18 convocados permitidos.");
      setCalledPlayers([...calledPlayers, id]);
    }
  };

  const handleSaveMatch = async () => {
    if (!matchData.rival) return alert("El nombre del rival es obligatorio.");
    setIsSaving(true);
    try {
      const dataToSave = { ...matchData, convocados: calledPlayers };
      if (matchData.id) await updateMatch(matchData.id, dataToSave);
      else await addMatch(dataToSave);
      setViewMode('LIST');
    } catch (error) {
      alert("Error al guardar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchData.id) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar este partido?")) return;
    setIsSaving(true);
    try {
      await removeMatch(matchData.id);
      setViewMode('LIST');
    } catch (error) {
      alert("Error al eliminar el partido.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'Pendientes') return m.status === 'Pendiente';
    if (filterMode === 'Terminados') return m.status === 'Terminado';
    return true; 
  }).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (loadingMatches || loadingPlayers) {
    return <div style={{padding: '24px', color: 'var(--partidos-text-primary)'}}>Cargando datos...</div>;
  }

  return (
    <div className="partidos-page">
      <header className="partidos-header">
        <div className="header-top w-full flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="w-full text-center md:text-left text-xl font-bold tracking-normal block whitespace-normal">GESTIÓN DE PARTIDOS</h1>
          <div className="header-actions w-full flex flex-row flex-wrap justify-center gap-2 md:w-auto md:justify-end md:gap-3">
            {viewMode === 'LIST' ? (
              <>
                {matches.length > 0 && (
                  <button 
                    className="btn-outline-dark flex-1 w-full text-xs md:text-sm" 
                    onClick={handleExportAllMatchesICS}
                    style={{ minHeight: '44px', padding: '0 16px', fontWeight: 'bold' }}
                  >
                    📥 EXPORTAR ICS
                  </button>
                )}
                <button className="btn-primary-dark flex-1 w-full text-xs md:text-sm" onClick={handleNewMatch}>+ NUEVO PARTIDO</button>
              </>
            ) : (
              <>
                {matchData.id && (
                  <button className="btn-danger flex-1 w-full text-xs md:text-sm" onClick={handleDeleteMatch} disabled={isSaving}>
                    <TrashIcon /> ELIMINAR
                  </button>
                )}
                <button className="btn-outline-dark flex-1 w-full text-xs md:text-sm" onClick={() => setViewMode('LIST')}>CANCELAR</button>
                <button className="btn-primary-dark flex-1 w-full text-xs md:text-sm" onClick={handleSaveMatch} disabled={isSaving}>
                  {isSaving ? 'GUARDANDO...' : 'GUARDAR PARTIDO'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'LIST' && (
        <div className="partidos-list-container">
          {matches.length === 0 ? (
            <div style={{textAlign: 'center', marginTop: '40px', color: 'var(--partidos-text-muted)'}}>
              <h2>No hay partidos registrados</h2>
              <p>Comienza añadiendo un nuevo partido.</p>
            </div>
          ) : (
            <>
              <div className="list-filters">
                <button className={`filter-tab ${filterMode === 'Todos' ? 'active' : ''}`} onClick={() => setFilterMode('Todos')}>Todos</button>
                <button className={`filter-tab ${filterMode === 'Pendientes' ? 'active' : ''}`} onClick={() => setFilterMode('Pendientes')}>Pendientes</button>
                <button className={`filter-tab ${filterMode === 'Terminados' ? 'active' : ''}`} onClick={() => setFilterMode('Terminados')}>Terminados</button>
              </div>
              
              <div className="matches-grid">
                {filteredMatches.map(m => (
                  <div key={m.id} className="match-card" onClick={() => handleEditMatch(m)}>
                    <div className="mc-header">
                      <span className={`status-badge ${m.status?.toLowerCase()}`}>{m.status}</span>
                      <span className="mc-date">{m.date ? m.date.split('-').reverse().join('/') : '--/--/--'} - {m.time || '--:--'}</span>
                    </div>
                    
                    <div className="mc-body">
                      <div className="team-local">
                        {/* Dummy Escudo */}
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)'}}></div>
                        <span className="t-name">{m.type === 'Local' ? 'Míster11 FC' : m.rival}</span>
                      </div>
                      <div className="mc-score">
                        {m.status === 'Terminado' ? (
                          <span>{m.type === 'Local' ? m.goalsFor : m.goalsAgainst} - {m.type === 'Local' ? m.goalsAgainst : m.goalsFor}</span>
                        ) : (
                          <span className="vs">VS</span>
                        )}
                      </div>
                      <div className="team-visit">
                        <span className="t-name">{m.type === 'Visitante' ? 'Míster11 FC' : m.rival}</span>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--partidos-border)'}}></div>
                      </div>
                    </div>
                    
                    <div className="mc-footer">
                      <span>📍 {m.location || 'Sin ubicación'}</span>
                      <span>🛡️ Formación: {m.lineup || '4-3-3'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {viewMode === 'EDIT' && (
        <div className="partidos-editor-container">
          <div className="editor-tabs mt-4 flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap">
            {['PRE-PARTIDO', 'CONVOCATORIA', 'ALINEACIÓN', 'MATCH-DAY', 'POST-PARTIDO'].map(tab => (
              <button 
                key={tab} 
                className={`e-tab ${editTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="editor-content">
            {/* PESTAÑA: PRE-PARTIDO */}
            {editTab === 'PRE-PARTIDO' && (
              <div className="tab-pane pre-partido-container">
                <h3 className="section-title">Datos Generales del Encuentro</h3>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Equipo Rival</label>
                    <input type="text" className="partidos-input" value={matchData.rival} onChange={e => setMatchData({...matchData, rival: e.target.value})} onBlur={e => setMatchData(prev => ({...prev, rival: normalizeText(e.target.value)}))} placeholder="Ej. fomento castellon" />
                  </div>
                  <div className="form-group quarter">
                    <label>Fecha</label>
                    <input type="date" className="partidos-input" value={matchData.date} onChange={e => setMatchData({...matchData, date: e.target.value})} />
                  </div>
                  <div className="form-group quarter">
                    <label>Hora</label>
                    <input type="time" className="partidos-input" value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} />
                  </div>
                  <div className="form-group quarter">
                    <label>Local / Visitante</label>
                    <select className="partidos-input" value={matchData.type} onChange={e => setMatchData({...matchData, type: e.target.value})}>
                      <option value="Local">Local</option>
                      <option value="Visitante">Visitante</option>
                    </select>
                  </div>
                  <div className="form-group quarter">
                    <label>Estado</label>
                    <select className="partidos-input" value={matchData.status} onChange={e => setMatchData({...matchData, status: e.target.value})}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Terminado">Terminado</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Estadio / Lugar</label>
                    <input type="text" className="partidos-input" value={matchData.location} onChange={e => setMatchData({...matchData, location: e.target.value})} onBlur={e => setMatchData(prev => ({...prev, location: normalizeText(e.target.value)}))} placeholder="Ej. facsa castellon c.d" />
                  </div>
                  <div className="form-group full" style={{ marginTop: '16px' }}>
                    <label>Sincronización de Calendario</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        onClick={handleAddToGoogleCalendar}
                        style={{
                          backgroundColor: '#1B3A2D',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          minHeight: '44px',
                          border: 'none'
                        }}
                      >
                        📅 Google Calendar
                      </button>
                      <button 
                        type="button" 
                        onClick={handleExportICS}
                        style={{
                          backgroundColor: '#4CAF7D',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          minHeight: '44px',
                          border: 'none'
                        }}
                      >
                        📥 Exportar .ICS
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-actions-bottom">
                  <div>
                    {matchData.id && (
                      <button className="eliminar-toggle" onClick={handleDeleteMatch} disabled={isSaving}>
                        <TrashIcon />
                        <span>ELIMINAR</span>
                      </button>
                    )}
                  </div>
                  <div className="form-actions-right">
                    <button className="btn-outline-dark" onClick={() => setViewMode('LIST')}>CANCELAR</button>
                    <button className="btn-primary-dark" onClick={handleSaveMatch} disabled={isSaving}>GUARDAR PARTIDO</button>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: CONVOCATORIA */}
            {editTab === 'CONVOCATORIA' && (
              <div className="tab-pane">
                <div className="conv-header">
                  <h3>Selección de Jugadores</h3>
                  <div className="conv-count">{calledPlayers.length} / 18 Convocados</div>
                </div>
                <div className="players-checklist">
                  {players.map(p => {
                    const isSelected = calledPlayers.includes(p.id);
                    return (
                      <div key={p.id} className={`player-card ${isSelected ? 'selected' : ''}`} onClick={() => togglePlayerCall(p.id)}>
                        <div className="pc-number">{p.number}</div>
                        <div className="pc-info">
                          <span className="pc-name">{p.name}</span>
                          <span className="pc-pos">{p.position}</span>
                        </div>
                        <div className="pc-check">{isSelected ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA: ALINEACIÓN */}
            {editTab === 'ALINEACIÓN' && (
              <div className="tab-pane alineacion-layout">
                <div className="alin-sidebar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <FormationSelector
                      activeFormation={matchData.lineup || '4-3-3'}
                      onSelect={(formationName, isCustom, customObj) => {
                        setMatchData(prev => ({
                          ...prev,
                          lineup: formationName
                        }));
                        const slots = isCustom ? customObj.positions : PREDEFINED_FORMATIONS[formationName];
                        if (slots) {
                          const newCalled = alignStartersByPosition(calledPlayers, players, slots);
                          setCalledPlayers(newCalled);
                          setMatchData(prev => ({ ...prev, convocados: newCalled }));
                        }
                      }}
                      onNewFormation={() => {
                        setEditingCustomFormation(null);
                        setIsCustomModalOpen(true);
                      }}
                      onEditFormation={(f) => {
                        setEditingCustomFormation(f);
                        setIsCustomModalOpen(true);
                      }}
                      onDeleteFormation={async (id) => {
                        try {
                          await deleteCustomFormation(id);
                          if (matchData.lineup === id) {
                            setMatchData(prev => ({ ...prev, lineup: '4-3-3' }));
                          }
                        } catch (err) {
                          alert("Error al eliminar la formación.");
                        }
                      }}
                    />
                    <button type="button" className="btn-reset-layout" onClick={handleResetPositions}>
                      🔄 Restablecer Campo
                    </button>
                  </div>

                  {/* XI Titular - en una sola columna para nombre completo */}
                  <div>
                    <h4 style={{margin: '8px 0'}}>XI Titular <span style={{fontSize:'12px', fontWeight:'normal', color:'var(--partidos-text-muted)'}}>({calledPlayers.slice(0,11).filter(Boolean).length}/11)</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      {Array.from({ length: 11 }).map((_, idx) => {
                        const pid = calledPlayers[idx];
                        const player = pid ? players.find(p => p.id === pid) : null;
                        const posName = getSlotPosition(idx);
                        const isSelected = selectedSlotIdx === idx;
                        
                        return (
                          <div 
                            key={`starter-${idx}`} 
                            className={`alin-player-item ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                            onClick={() => handleSlotClick(idx)}
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: '10px', cursor: 'pointer', minWidth: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <span className="slot-num" style={{ fontSize: '14px', fontWeight: '900', color: 'var(--partidos-gold)', minWidth: '20px' }}>{player ? player.number : '-'}</span>
                              <span className="slot-name" style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{player ? player.name : 'Vacío'}</span>
                            </div>
                            <span className="slot-role" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', color: 'var(--partidos-text-muted)', fontWeight: '800' }}>{posName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suplentes - en una sola columna para nombre completo */}
                  <div>
                    <h4 style={{margin: '8px 0'}}>Suplentes <span style={{fontSize:'12px', fontWeight:'normal', color:'var(--partidos-text-muted)'}}>({calledPlayers.slice(11).filter(Boolean).length}/7)</span></h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                      {Array.from({ length: 7 }).map((_, subIdx) => {
                        const idx = 11 + subIdx;
                        const pid = calledPlayers[idx];
                        const player = pid ? players.find(p => p.id === pid) : null;
                        const isSelected = selectedSlotIdx === idx;
                        
                        return (
                          <div 
                            key={`sub-${idx}`} 
                            className={`alin-player-item ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                            onClick={() => handleSlotClick(idx)}
                            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: '10px', cursor: 'pointer', minWidth: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <span className="slot-num" style={{ fontSize: '14px', fontWeight: '900', color: 'var(--partidos-gold)', minWidth: '20px' }}>{player ? player.number : '-'}</span>
                              <span className="slot-name" style={{ fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{player ? player.name : 'Vacío'}</span>
                            </div>
                            <span className="slot-role" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)', color: 'var(--partidos-gold)', fontWeight: '800' }}>SUP</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedSlotIdx !== null && selectedSlotIdx < 11 && (
                    <div className="pos-assignment-panel">
                      <h5>Asignar Posición</h5>
                      <div className="pos-badges-grid">
                        {['POR', 'LTD', 'DEF', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'].map(posName => (
                          <button 
                            key={posName} 
                            type="button" 
                            className={`pos-badge-btn ${getSlotPosition(selectedSlotIdx) === posName ? 'active' : ''}`}
                            onClick={() => handleAssignPosition(selectedSlotIdx, posName)}
                          >
                            {posName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="alin-pitch-wrapper">
                  <div className="alin-pitch-container" ref={pitchRef} onPointerMove={handlePitchPointerMove} onTouchMove={handlePitchPointerMove} style={{touchAction: 'none'}}>
                    <div className="pitch-outer-line">
                      <div className="pitch-line pitch-center-line"></div>
                      <div className="pitch-circle pitch-center-circle"></div>
                      <div className="pitch-spot-center"></div>
                      
                      <div className="pitch-penalty-left"></div>
                      <div className="pitch-penalty-right"></div>
                      
                      <div className="pitch-goal-left"></div>
                      <div className="pitch-goal-right"></div>
                      
                      <div className="pitch-spot-left"></div>
                      <div className="pitch-spot-right"></div>
                      
                      <div className="pitch-arc-left"></div>
                      <div className="pitch-arc-right"></div>
                      
                      <div className="pitch-corner top-left"></div>
                      <div className="pitch-corner top-right"></div>
                      <div className="pitch-corner bottom-left"></div>
                      <div className="pitch-corner bottom-right"></div>
                    </div>
                    
                    {getFormationPositions(matchData.lineup || '4-3-3').map((pos, idx) => {
                      const pid = calledPlayers[idx];
                      const player = pid ? players.find(p => p.id === pid) : null;
                      const customPos = matchData.customPositions && matchData.customPositions[idx];
                      const topPos = customPos ? customPos.top : pos.top;
                      const leftPos = customPos ? customPos.left : pos.left;
                      const posLabel = getSlotPosition(idx);
                      const isSelected = selectedSlotIdx === idx;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`pitch-player ${player ? '' : 'empty-slot'} ${isSelected ? 'selected-swap' : ''}`}
                          style={{ top: topPos, left: leftPos, transform: 'translate(-50%, -50%)', zIndex: draggingIdx === idx ? 20 : isSelected ? 15 : 10 }}
                          title={player ? `Jugador: ${player.name}\nDorsal: ${player.number}\nPosición: ${player.position}` : 'Slot Vacío'}
                        >
                          <div 
                            className="pp-circle-wrapper"
                            onPointerDown={(e) => handleDragStart(e, idx)}
                            onTouchStart={(e) => handleDragStart(e, idx)}
                          >
                            <div className="pp-circle">
                              {player ? player.number : idx + 1}
                            </div>
                            <span className="pp-badge">{posLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: MATCH-DAY */}
            {editTab === 'MATCH-DAY' && (
              <div className="tab-pane match-day-container" ref={matchDayRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>⏱️ Panel de Control - Match Day</h3>
                  <button 
                    type="button"
                    className="btn-outline-dark" 
                    onClick={toggleFullscreen}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '10px 16px', 
                      minHeight: '44px',
                      cursor: 'pointer',
                      border: '1px solid var(--partidos-border)',
                      borderRadius: '8px',
                      background: 'var(--partidos-input-bg)',
                      color: 'var(--partidos-text-primary)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {isFullscreen ? '🗗 Salir Pantalla Completa' : '📺 Pantalla Completa'}
                  </button>
                </div>
                
                <div className="match-day-grid">
                  {/* Cronómetro y Marcador */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="timer-card">
                      <span className="timer-display">{formatTime(matchSeconds)}</span>
                      <div className="timer-controls">
                        <button 
                          className={`timer-btn ${isTimerRunning ? 'pause' : 'start'}`}
                          onClick={handleTimerToggle}
                        >
                          {isTimerRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
                        </button>
                        <button className="timer-btn reset" onClick={handleTimerReset}>🔄 Reiniciar</button>
                      </div>
                      <div className="timer-adjust">
                        <button className="timer-adjust-btn" onClick={() => handleTimerAdjust(-60)}>-1m</button>
                        <button className="timer-adjust-btn" onClick={() => handleTimerAdjust(60)}>+1m</button>
                      </div>
                    </div>

                    <div className="live-scoreboard">
                      <div className="scoreboard-teams">
                        <div className="scoreboard-team">{activeTeam?.nombre || 'Míster11 FC'}</div>
                        <div className="scoreboard-score">
                          {matchData.goalsFor || 0} - {matchData.goalsAgainst || 0}
                        </div>
                        <div className="scoreboard-team">{matchData.rival || 'Rival'}</div>
                      </div>
                      <div className="scoreboard-buttons">
                        <button className="scoreboard-btn local" onClick={() => handleTriggerEvent('gol_local')}>⚽ GOL LOCAL</button>
                        <button className="scoreboard-btn rival" onClick={() => handleTriggerEvent('gol_rival')}>⚽ GOL RIVAL</button>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Sustituciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="substitutions-panel">
                      <h4 className="sub-section-title" style={{ borderBottom: '1px solid var(--partidos-border)', paddingBottom: '6px', marginBottom: '12px' }}>🔄 Realizar Sustitución</h4>
                      <div className="sub-selectors">
                        <div>
                          <label className="input-label-caps" style={{ fontSize: '11px' }}>Sale (Titular)</label>
                          <select 
                            className="partidos-input" 
                            value={subOutId} 
                            onChange={e => setSubOutId(e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {calledPlayers.slice(0, 11).map(id => {
                              const p = players.find(pl => pl.id === id);
                              return p ? <option key={id} value={id}>{p.name}</option> : null;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="input-label-caps" style={{ fontSize: '11px' }}>Entra (Suplente)</label>
                          <select 
                            className="partidos-input" 
                            value={subInId} 
                            onChange={e => setSubInId(e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {calledPlayers.slice(11).map(id => {
                              const p = players.find(pl => pl.id === id);
                              return p ? <option key={id} value={id}>{p.name}</option> : null;
                            })}
                          </select>
                        </div>
                      </div>
                      <button 
                        className="btn-success-green-allcaps" 
                        style={{ width: '100%', minHeight: '48px' }} 
                        onClick={handleMakeSubstitution}
                      >
                        🔄 Confirmar Sustitución
                      </button>
                    </div>

                    <div className="live-events-panel">
                      <div className="event-action-buttons">
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('amarilla')}>🟨 Amarilla</button>
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('roja')}>🟥 Roja</button>
                        <button className="event-action-btn" onClick={() => handleTriggerEvent('lesion')}>🩺 Lesión</button>
                      </div>
                    </div>
                  </div>

                  {/* Bitácora de Eventos */}
                  <div className="post-partido-full-width-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="events-log-card">
                      <h4 className="card-section-title" style={{ margin: 0 }}>📋 Bitácora del Partido (Tiempo Real)</h4>
                      <div className="events-log-list">
                        {(!matchData.events || matchData.events.length === 0) ? (
                          <p style={{ margin: '15px 0', fontSize: '14px', color: 'var(--partidos-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No se han registrado eventos en este partido.</p>
                        ) : (
                          [...matchData.events].reverse().map((ev, idx) => {
                            const originalIdx = matchData.events.length - 1 - idx;
                            let icon = '⚡';
                            let desc = '';
                            if (ev.type === 'gol_local') { icon = '⚽'; desc = `¡GOL! ${ev.playerName} anota para el equipo.`; }
                            else if (ev.type === 'gol_rival') { icon = '⚽'; desc = `Gol de ${matchData.rival || 'Rival'}.`; }
                            else if (ev.type === 'amarilla') { icon = '🟨'; desc = `Tarjeta Amarilla para ${ev.playerName}.`; }
                            else if (ev.type === 'roja') { icon = '🟥'; desc = `Tarjeta Roja para ${ev.playerName}.`; }
                            else if (ev.type === 'lesion') { icon = '🩺'; desc = `Lesión de ${ev.playerName}.`; }
                            else if (ev.type === 'sustitucion') { icon = '🔄'; desc = `Cambio: Sale ${ev.playerOutName} y entra ${ev.playerInName}.`; }

                            return (
                              <div key={idx} className="event-log-item">
                                <span className="event-log-time">Min. {ev.minute}'</span>
                                <span style={{ fontSize: '18px' }}>{icon}</span>
                                <span className="event-log-desc">{desc}</span>
                                <button className="event-log-remove" onClick={() => handleRemoveEvent(originalIdx)} title="Eliminar evento">✕</button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: POST-PARTIDO */}
            {editTab === 'POST-PARTIDO' && (
              <div className="tab-pane post-partido-container">
                <div className="post-partido-grid-layout">
                  {/* Columna Izquierda: Marcador, Goleadores, Tarjetas */}
                  <div className="post-partido-left-col">
                    {/* Tarjeta 1: Marcador */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">⚽ Marcador del Partido</h4>
                      <div className="score-inputs-container" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                        <div className="score-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.goalsFor')}</label>
                          <input 
                            type="number" 
                            className="partidos-input text-center text-2xl" 
                            style={{ minHeight: '48px', fontSize: '20px', width: '80px', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                            value={matchData.goalsFor || 0} 
                            onChange={e => setMatchData({...matchData, goalsFor: parseInt(e.target.value) || 0})} 
                          />
                        </div>
                        <div className="score-divider" style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--partidos-text-primary)' }}>-</div>
                        <div className="score-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.goalsAgainst')}</label>
                          <input 
                            type="number" 
                            className="partidos-input text-center text-2xl" 
                            style={{ minHeight: '48px', fontSize: '20px', width: '80px', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                            value={matchData.goalsAgainst || 0} 
                            onChange={e => setMatchData({...matchData, goalsAgainst: parseInt(e.target.value) || 0})} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 2: Goleadores */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">⚽ Goleadores y Asistencias</h4>
                      <div className="goleadores-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {(matchData.goleadoresList || []).map((g, idx) => (
                          <div key={idx} className="goleador-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={g.jugadorId || ''}
                              style={{ minHeight: '48px', flex: 1, padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                              onChange={e => {
                                const list = [...(matchData.goleadoresList || [])];
                                list[idx] = {...list[idx], jugadorId: e.target.value};
                                setMatchData({...matchData, goleadoresList: list});
                              }}
                            >
                              <option value="">Jugador...</option>
                              {calledPlayers.map(id => {
                                const p = players.find(pl => pl.id === id);
                                return p ? <option key={id} value={id}>{p.name}</option> : null;
                              })}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Min"
                              style={{ minHeight: '48px', width: '70px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                              value={g.minuto || ''}
                              onChange={e => {
                                const list = [...(matchData.goleadoresList || [])];
                                list[idx] = {...list[idx], minuto: e.target.value};
                                setMatchData({...matchData, goleadoresList: list});
                              }}
                            />
                            <button
                              type="button"
                              className="btn-remove-row"
                              style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
                              onClick={() => {
                                const list = (matchData.goleadoresList || []).filter((_,i) => i !== idx);
                                setMatchData({...matchData, goleadoresList: list});
                              }}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button"
                        className="btn-add-row" 
                        style={{ minHeight: '48px', width: '100%', marginTop: '10px', color: '#1B3A2D', borderColor: '#1B3A2D', border: '1.5px dashed', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: 'transparent' }} 
                        onClick={() =>
                          setMatchData({...matchData, goleadoresList: [...(matchData.goleadoresList || []), {jugadorId:'',minuto:''}]})
                        }
                      >
                        + Añadir Goleador
                      </button>
                    </div>

                    {/* Tarjeta 3: Tarjetas */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">🟨 Tarjetas</h4>
                      <div className="goleadores-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {(matchData.tarjetasList || []).map((t, idx) => (
                          <div key={idx} className="goleador-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={t.tipo || 'amarilla'}
                              style={{ minHeight: '48px', width: '120px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                              onChange={e => {
                                const list = [...(matchData.tarjetasList || [])];
                                list[idx] = {...list[idx], tipo: e.target.value};
                                setMatchData({...matchData, tarjetasList: list});
                              }}
                            >
                              <option value="amarilla">🟨 Amarilla</option>
                              <option value="roja">🟥 Roja</option>
                            </select>
                            <select
                              value={t.jugadorId || ''}
                              style={{ minHeight: '48px', flex: 1, padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                              onChange={e => {
                                const list = [...(matchData.tarjetasList || [])];
                                list[idx] = {...list[idx], jugadorId: e.target.value};
                                setMatchData({...matchData, tarjetasList: list});
                              }}
                            >
                              <option value="">Jugador...</option>
                              {calledPlayers.map(id => {
                                const p = players.find(pl => pl.id === id);
                                return p ? <option key={id} value={id}>{p.name}</option> : null;
                              })}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Min"
                              style={{ minHeight: '48px', width: '70px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                              value={t.minuto || ''}
                              onChange={e => {
                                const list = [...(matchData.tarjetasList || [])];
                                list[idx] = {...list[idx], minuto: e.target.value};
                                setMatchData({...matchData, tarjetasList: list});
                              }}
                            />
                            <button
                              type="button"
                              className="btn-remove-row"
                              style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
                              onClick={() => {
                                const list = (matchData.tarjetasList || []).filter((_,i) => i !== idx);
                                setMatchData({...matchData, tarjetasList: list});
                              }}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button"
                        className="btn-add-row" 
                        style={{ minHeight: '48px', width: '100%', marginTop: '10px', color: '#1B3A2D', borderColor: '#1B3A2D', border: '1.5px dashed', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: 'transparent' }} 
                        onClick={() =>
                          setMatchData({...matchData, tarjetasList: [...(matchData.tarjetasList || []), {jugadorId:'',tipo:'amarilla',minuto:''}]})
                        }
                      >
                        + Añadir Tarjeta
                      </button>
                    </div>
                  </div>

                  {/* Columna Derecha: MVP, Valoración, Notas, Botón de Guardar */}
                  <div className="post-partido-right-col">
                    {/* Tarjeta 4: MVP y Valoración */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">👑 MVP y Valoración</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        <div className="mvp-selection-box" style={{ display: 'flex', flexDirection: 'column' }}>
                          <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--partidos-text-muted)' }}>{getLangText('post.mvp')}</label>
                          <select 
                            className="partidos-input"
                            value={matchData.mvp || ''}
                            onChange={e => setMatchData({...matchData, mvp: e.target.value})}
                            style={{ minHeight: '48px', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)' }}
                          >
                            <option value="">{getLangText('post.mvpSelect')}</option>
                            {calledPlayers.map(id => {
                              const p = players.find(pl => pl.id === id);
                              return p ? <option key={id} value={p.name}>{p.name}</option> : null;
                            })}
                          </select>
                        </div>

                        {/* Valoración del equipo slider 1-10 */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--partidos-text-muted)' }}>VALORACIÓN DEL EQUIPO</label>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1B3A2D' }}>{matchData.teamRating || 5} / 10</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={matchData.teamRating || 5} 
                            onChange={e => setMatchData({...matchData, teamRating: parseInt(e.target.value) || 5})}
                            style={{ width: '100%', cursor: 'pointer', height: '8px', borderRadius: '4px', background: '#e5e7eb' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 5: Notas Tácticas */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">📝 Notas Tácticas</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        <label className="input-label-caps" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--partidos-text-muted)' }}>{getLangText('post.notes')}</label>
                        <textarea 
                          className="partidos-input textarea-tall" 
                          value={matchData.notes || ''} 
                          onChange={e => setMatchData({...matchData, notes: e.target.value})}
                          placeholder={getLangText('post.notesPlaceholder')}
                          rows={5}
                          style={{ minHeight: '120px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', background: 'var(--partidos-input-bg)', color: 'var(--partidos-text-primary)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Botón de Guardar Post-Partido (Verde Campo) */}
                    <button
                      type="button"
                      className="btn-success-green-allcaps"
                      onClick={handleSaveMatch}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        minHeight: '52px',
                        background: '#2E7D5C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 10px rgba(46,125,92,0.2)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '10px'
                      }}
                    >
                      {isSaving ? 'GUARDANDO...' : '💾 GUARDAR POST-PARTIDO'}
                    </button>
                  </div>

                  {/* Secciones de ancho completo abajo */}
                  <div className="post-partido-full-width-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Tarjeta 6: Cuestionario de Análisis */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">📋 Cuestionario de Informe de Partido</h4>
                      <div className="questionnaire-fields" style={{ marginTop: '10px' }}>
                        {reportQuestions.map(q => (
                          <div key={q.key} className="questionnaire-field-block" style={{ marginBottom: '15px' }}>
                            <label className="question-field-label" style={{ fontWeight: 'bold', fontSize: '13px' }}>{q.label}</label>
                            <p className="question-field-desc" style={{ fontSize: '12px', color: 'var(--partidos-text-muted)', margin: '4px 0 8px 0' }}>{q.question}</p>
                            <textarea
                              className="partidos-input"
                              rows="4"
                              value={(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) || ''}
                              onChange={e => handleAnswerChange(q.key, e.target.value)}
                              placeholder="..."
                              style={{ width: '100%', background: 'var(--partidos-input-bg)', minHeight: '100px', padding: '8px', borderRadius: '8px', border: '1px solid var(--partidos-border)', color: 'var(--partidos-text-primary)' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tarjeta 7: Galería de Imágenes */}
                    <div className="post-match-card">
                      <h4 className="card-section-title">📷 {getLangText('post.images')}</h4>
                      <div className="image-upload-wrapper" style={{ marginTop: '10px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id="post-match-photo-upload"
                          style={{ display: 'none' }}
                          onChange={handleImageUpload}
                        />
                        <label 
                          htmlFor="post-match-photo-upload" 
                          className="btn-primary-blue-allcaps"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            minHeight: '48px',
                            cursor: 'pointer',
                            padding: '0 24px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            background: '#1B3A2D',
                            color: '#FFFFFF'
                          }}
                        >
                          📷 {getLangText('post.uploadBtn')}
                        </label>
                      </div>

                      <div className="images-gallery" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                        {(matchData.postMatchImages || []).map((img, idx) => (
                          <div key={idx} className="gallery-thumbnail-container" style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--partidos-border)' }}>
                            <img src={img} alt={`Match Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botones de acción del informe */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-outline-dark"
                        style={{ minHeight: '48px', padding: '0 24px', borderRadius: '8px', fontWeight: '800', border: '1px solid var(--partidos-text-primary)', color: 'var(--partidos-text-primary)', background: 'transparent', cursor: 'pointer' }}
                        onClick={() => setShowReportPreview(true)}
                      >
                        👁️ {getLangText('post.viewReport')}
                      </button>
                      <button
                        type="button"
                        className="btn-success-green-allcaps"
                        style={{
                          minHeight: '48px',
                          padding: '0 24px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          background: '#2E7D5C',
                          color: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                        onClick={handleExportPDF}
                      >
                        📥 {getLangText('post.downloadReport')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA DEL INFORME */}
      {showReportPreview && (
        <div className="modal-overlay" onClick={() => setShowReportPreview(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--partidos-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>{getLangText('post.previewTitle')}</h2>
              <button className="btn-close" onClick={() => setShowReportPreview(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--partidos-text-primary)' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--partidos-player-card-bg)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800' }}>{activeTeam?.nombre || 'Míster 11 FC'} vs {matchData.rival}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--partidos-text-muted)' }}>{matchData.date} | {matchData.time} | {matchData.location}</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--partidos-accent)' }}>
                  {matchData.type === 'Local' ? matchData.goalsFor : matchData.goalsAgainst} - {matchData.type === 'Local' ? matchData.goalsAgainst : matchData.goalsFor}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.mvp')}</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>{matchData.mvp || '-'}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.scorers')}</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>
                    {matchData.goleadoresList && matchData.goleadoresList.length > 0
                      ? matchData.goleadoresList.map(g => {
                          const p = players.find(pl => pl.id === g.jugadorId);
                          return `${p ? p.name : 'Jugador'} (${g.minuto}')`;
                        }).join(', ')
                      : '-'}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>Tarjetas</h4>
                  <p style={{ margin: '0', fontWeight: '700', fontSize: '15px' }}>
                    {matchData.tarjetasList && matchData.tarjetasList.length > 0
                      ? matchData.tarjetasList.map(t => {
                          const p = players.find(pl => pl.id === t.jugadorId);
                          const emoji = t.tipo === 'amarilla' ? '🟨' : '🟥';
                          return `${emoji} ${p ? p.name : 'Jugador'} (${t.minuto}')`;
                        }).join(', ')
                      : '-'}
                  </p>
                </div>
              </div>

              {matchData.notes && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.notes')}</h4>
                  <p style={{ margin: '0', fontSize: '14px', background: 'var(--partidos-player-card-bg)', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{matchData.notes}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reportQuestions.map(q => (
                  <div key={q.key}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '800', color: 'var(--partidos-accent)' }}>{q.label}</h4>
                    <p style={{ margin: '0', fontSize: '14px', background: 'var(--partidos-player-card-bg)', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontStyle: !(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) ? 'italic' : 'normal', color: !(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) ? 'var(--partidos-text-muted)' : 'var(--partidos-text-primary)' }}>
                      {(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) || getLangText('post.noAnswers')}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--partidos-text-muted)' }}>{getLangText('post.images')}</h4>
                {(!matchData.postMatchImages || matchData.postMatchImages.length === 0) ? (
                  <p style={{ margin: '0', fontSize: '14px', color: 'var(--partidos-text-muted)', fontStyle: 'italic' }}>{getLangText('post.noImages')}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                    {matchData.postMatchImages.map((img, idx) => (
                      <div key={idx} style={{ aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--partidos-border)' }}>
                        <img src={img} alt={`Preview Match ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--partidos-border)', paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary-dark" style={{ minHeight: '48px', padding: '0 24px' }} onClick={() => setShowReportPreview(false)}>{getLangText('post.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA SELECCIONAR JUGADOR EN EVENTO MATCH DAY */}
      {showEventPlayerSelector && (
        <div className="event-selector-overlay" onClick={() => setShowEventPlayerSelector(false)}>
          <div className="event-selector-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className="event-selector-title">
                {pendingEventType === 'gol_local' ? '⚽ Seleccionar Goleador' : 
                 pendingEventType === 'amarilla' ? '🟨 Tarjeta Amarilla' :
                 pendingEventType === 'roja' ? '🟥 Tarjeta Roja' : '🩺 Registrar Lesión'}
              </h4>
              <button 
                onClick={() => setShowEventPlayerSelector(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--partidos-text-primary)' }}
              >✕</button>
            </div>
            
            <div className="event-selector-list">
              {calledPlayers.slice(0, 11).map(id => {
                const p = players.find(pl => pl.id === id);
                return p ? (
                  <button 
                    key={id}
                    className="event-selector-item"
                    type="button"
                    onClick={() => handleSelectEventPlayer(id)}
                  >
                    {p.number} - {p.name}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FORMACIÓN PERSONALIZADA */}
      <CustomFormationModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingCustomFormation(null);
        }}
        editFormation={editingCustomFormation}
        onSave={async (formationData) => {
          try {
            let savedName = formationData.name;
            if (editingCustomFormation) {
              await updateCustomFormation(editingCustomFormation.id, formationData);
            } else {
              await addCustomFormation(formationData);
            }

            // Auto-seleccionar y auto-alinear
            setMatchData(prev => ({
              ...prev,
              lineup: savedName
            }));

            const newCalled = alignStartersByPosition(calledPlayers, players, formationData.positions);
            setCalledPlayers(newCalled);
            setMatchData(prev => ({
              ...prev,
              convocados: newCalled,
              lineup: savedName
            }));

            setIsCustomModalOpen(false);
            setEditingCustomFormation(null);
          } catch (err) {
            console.error("Error saving custom formation:", err);
            alert("Error al guardar la formación personalizada.");
          }
        }}
      />

    </div>
  );
};

export default Partidos;
