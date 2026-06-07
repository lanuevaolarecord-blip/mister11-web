import React, { useState, useRef, useEffect } from 'react';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useTeams } from '../hooks/useTeams';
import { generatePostMatchReportPDF } from '../utils/pdfGenerator';
import './Partidos.css';

const FORMATIONS = {
  '4-3-3': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'LTD', top: '85%', left: '30%' },
    { pos: 'DEF', top: '65%', left: '25%' },
    { pos: 'DEF', top: '35%', left: '25%' },
    { pos: 'LTI', top: '15%', left: '30%' },
    { pos: 'MCD', top: '50%', left: '50%' },
    { pos: 'MC', top: '75%', left: '60%' },
    { pos: 'MC', top: '25%', left: '60%' },
    { pos: 'EXT', top: '85%', left: '85%' },
    { pos: 'DEL', top: '50%', left: '90%' },
    { pos: 'EXT', top: '15%', left: '85%' }
  ],
  '4-4-2': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'LTD', top: '85%', left: '30%' },
    { pos: 'DEF', top: '65%', left: '25%' },
    { pos: 'DEF', top: '35%', left: '25%' },
    { pos: 'LTI', top: '15%', left: '30%' },
    { pos: 'MD', top: '85%', left: '60%' },
    { pos: 'MC', top: '65%', left: '55%' },
    { pos: 'MC', top: '35%', left: '55%' },
    { pos: 'MI', top: '15%', left: '60%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ],
  '3-5-2': [
    { pos: 'POR', top: '50%', left: '10%' },
    { pos: 'DEF', top: '70%', left: '25%' },
    { pos: 'DEF', top: '50%', left: '22%' },
    { pos: 'DEF', top: '30%', left: '25%' },
    { pos: 'MD', top: '85%', left: '50%' },
    { pos: 'MC', top: '65%', left: '55%' },
    { pos: 'MC', top: '50%', left: '58%' },
    { pos: 'MC', top: '35%', left: '55%' },
    { pos: 'MI', top: '15%', left: '50%' },
    { pos: 'DEL', top: '65%', left: '85%' },
    { pos: 'DEL', top: '35%', left: '85%' }
  ]
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

  const [activeQuestion, setActiveQuestion] = useState('tactical');
  const [showReportPreview, setShowReportPreview] = useState(false);

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

  useEffect(() => {
    const handlePointerUpWindow = () => setDraggingIdx(null);
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('touchend', handlePointerUpWindow);
    return () => {
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('touchend', handlePointerUpWindow);
    };
  }, []);

  const handlePitchPointerMove = (e) => {
    if (draggingIdx === null || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
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
        <div className="header-top">
          <h1>GESTIÓN DE PARTIDOS</h1>
          <div className="header-actions">
            {viewMode === 'LIST' ? (
              <button className="btn-primary-dark" onClick={handleNewMatch}>+ NUEVO PARTIDO</button>
            ) : (
              <>
                {matchData.id && (
                  <button className="btn-danger" onClick={handleDeleteMatch} disabled={isSaving}>
                    <TrashIcon /> ELIMINAR
                  </button>
                )}
                <button className="btn-outline-dark" onClick={() => setViewMode('LIST')}>CANCELAR</button>
                <button className="btn-primary-dark" onClick={handleSaveMatch} disabled={isSaving}>
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
          <div className="editor-tabs">
            {['PRE-PARTIDO', 'CONVOCATORIA', 'ALINEACIÓN', 'POST-PARTIDO'].map(tab => (
              <button 
                key={tab} 
                className={`e-tab ${editTab === tab ? 'active' : ''}`}
                onClick={() => setEditTab(tab)}
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
                    <input type="text" className="partidos-input" value={matchData.rival} onChange={e => setMatchData({...matchData, rival: e.target.value})} placeholder="Ej. fomento castellon" />
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
                    <input type="text" className="partidos-input" value={matchData.location} onChange={e => setMatchData({...matchData, location: e.target.value})} placeholder="Ej. facsa castellon c.d" />
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
                  <div className="conv-count">{calledPlayers.length} / 18 Seleccionados</div>
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
                  <h4>Formación Táctica</h4>
                  <select className="partidos-input" value={matchData.lineup || '4-3-3'} onChange={e => setMatchData({...matchData, lineup: e.target.value})}>
                    <option value="4-3-3">4-3-3</option>
                    <option value="4-4-2">4-4-2</option>
                    <option value="3-5-2">3-5-2</option>
                  </select>

                  <h4 style={{marginTop: '20px'}}>XI Titular</h4>
                  <div className="titulares-list">
                    {calledPlayers.length === 0 ? (
                      <p style={{fontSize: '12px', color: 'var(--partidos-text-muted)'}}>No hay convocados.</p>
                    ) : (
                      calledPlayers.slice(0, 11).map(id => {
                        const p = players.find(pl => pl.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="alin-player-item">
                            <div className="alin-player-item-left">
                              <span>{p.number}</span> {p.name.split(' ')[0]}
                            </div>
                            <div className="alin-player-status"></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="alin-pitch-container" ref={pitchRef} onPointerMove={handlePitchPointerMove} onTouchMove={handlePitchPointerMove} style={{touchAction: 'none'}}>
                  <div className="pitch-line pitch-center-line"></div>
                  <div className="pitch-circle pitch-center-circle"></div>
                  <div className="pitch-box pitch-penalty-left"></div>
                  <div className="pitch-box pitch-penalty-right"></div>
                  
                  {/* Corner Arcs */}
                  <div className="pitch-corner top-left"></div>
                  <div className="pitch-corner top-right"></div>
                  <div className="pitch-corner bottom-left"></div>
                  <div className="pitch-corner bottom-right"></div>
                  
                  {(FORMATIONS[matchData.lineup || '4-3-3'] || FORMATIONS['4-3-3']).map((pos, idx) => {
                    const pid = calledPlayers[idx];
                    const player = pid ? players.find(p => p.id === pid) : null;
                    const customPos = matchData.customPositions && matchData.customPositions[idx];
                    const topPos = customPos ? customPos.top : pos.top;
                    const leftPos = customPos ? customPos.left : pos.left;
                    
                    return (
                      <div 
                        key={idx} 
                        className="pitch-player" 
                        style={{ top: topPos, left: leftPos, transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: draggingIdx === idx ? 10 : 1 }}
                        onPointerDown={(e) => { e.preventDefault(); setDraggingIdx(idx); }}
                        onTouchStart={(e) => { e.stopPropagation(); setDraggingIdx(idx); }}
                      >
                        <div className="pp-circle">{player ? player.number : idx + 1}</div>
                        <span className="pp-name">{player ? player.name.split(' ')[0] : pos.pos}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA: POST-PARTIDO */}
            {editTab === 'POST-PARTIDO' && (
              <div className="tab-pane post-partido-container">
                <div className="post-partido-form">
                  <h3 className="section-title">{getLangText('post.title')}</h3>
                  
                  {/* Tarjeta 1: Resultado y MVP del Partido */}
                  <div className="post-match-card">
                    <h4 className="card-section-title">⚽ Resultado y MVP del Partido</h4>
                    <div className="score-and-mvp-row">
                      <div className="score-inputs-container">
                        <div className="score-box">
                          <label className="input-label-caps">{getLangText('post.goalsFor')}</label>
                          <input 
                            type="number" 
                            className="partidos-input text-center text-2xl" 
                            value={matchData.goalsFor || 0} 
                            onChange={e => setMatchData({...matchData, goalsFor: parseInt(e.target.value) || 0})} 
                          />
                        </div>
                        <div className="score-divider">-</div>
                        <div className="score-box">
                          <label className="input-label-caps">{getLangText('post.goalsAgainst')}</label>
                          <input 
                            type="number" 
                            className="partidos-input text-center text-2xl" 
                            value={matchData.goalsAgainst || 0} 
                            onChange={e => setMatchData({...matchData, goalsAgainst: parseInt(e.target.value) || 0})} 
                          />
                        </div>
                      </div>

                      <div className="mvp-selection-box">
                        <label className="input-label-caps">{getLangText('post.mvp')}</label>
                        <select 
                          className="partidos-input"
                          value={matchData.mvp || ''}
                          onChange={e => setMatchData({...matchData, mvp: e.target.value})}
                          style={{ minHeight: '48px' }}
                        >
                          <option value="">{getLangText('post.mvpSelect')}</option>
                          {calledPlayers.map(id => {
                            const p = players.find(pl => pl.id === id);
                            return p ? <option key={id} value={p.name}>{p.name}</option> : null;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 2: Estadísticas de Rendimiento (Goleadores y Tarjetas) */}
                  <div className="post-match-card">
                    <h4 className="card-section-title">📊 Goleadores y Tarjetas</h4>
                    
                    <div className="stats-sections-grid">
                      {/* Goleadores dinámicos */}
                      <div className="stats-col">
                        <p className="sub-section-title">⚽ Goleadores y Asistencias</p>
                        <div className="goleadores-list">
                          {(matchData.goleadoresList || []).map((g, idx) => (
                            <div key={idx} className="goleador-row">
                              <select
                                value={g.jugadorId || ''}
                                style={{ minHeight: '48px' }}
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
                                style={{ minHeight: '48px' }}
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
                                style={{ width: '48px', height: '48px' }}
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
                          style={{ minHeight: '48px', color: '#004B87', borderColor: '#004B87' }} 
                          onClick={() =>
                            setMatchData({...matchData, goleadoresList: [...(matchData.goleadoresList || []), {jugadorId:'',minuto:''}]})
                          }
                        >
                          + Añadir Goleador
                        </button>
                      </div>

                      {/* Tarjetas dinámicas */}
                      <div className="stats-col">
                        <p className="sub-section-title">🟨🟥 Tarjetas</p>
                        <div className="goleadores-list">
                          {(matchData.tarjetasList || []).map((t, idx) => (
                            <div key={idx} className="goleador-row">
                              <select
                                value={t.tipo || 'amarilla'}
                                style={{ flex: '0 0 110px', minHeight: '48px' }}
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
                                style={{ minHeight: '48px' }}
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
                                style={{ minHeight: '48px' }}
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
                                style={{ width: '48px', height: '48px' }}
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
                          style={{ minHeight: '48px', color: '#004B87', borderColor: '#004B87' }} 
                          onClick={() =>
                            setMatchData({...matchData, tarjetasList: [...(matchData.tarjetasList || []), {jugadorId:'',tipo:'amarilla',minuto:''}]})
                          }
                        >
                          + Añadir Tarjeta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 3: Cuestionario de Análisis del Partido (Listado Secuencial) */}
                  <div className="post-match-card">
                    <h4 className="card-section-title">📋 Cuestionario de Informe de Partido</h4>
                    
                    <div className="questionnaire-fields">
                      {reportQuestions.map(q => (
                        <div key={q.key} className="questionnaire-field-block">
                          <label className="question-field-label">{q.label}</label>
                          <p className="question-field-desc">{q.question}</p>
                          <textarea
                            className="partidos-input"
                            rows="4"
                            value={(matchData.postMatchAnswers && matchData.postMatchAnswers[q.key]) || ''}
                            onChange={e => handleAnswerChange(q.key, e.target.value)}
                            placeholder="..."
                            style={{ width: '100%', background: 'var(--partidos-input-bg)', minHeight: '100px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tarjeta 4: Notas Tácticas Generales */}
                  <div className="post-match-card">
                    <h4 className="card-section-title">📝 {getLangText('post.notes')}</h4>
                    <div className="questionnaire-field-block">
                      <p className="question-field-desc">{getLangText('post.notesPlaceholder')}</p>
                      <textarea 
                        className="partidos-input textarea-tall" 
                        value={matchData.notes || ''} 
                        onChange={e => setMatchData({...matchData, notes: e.target.value})}
                        placeholder={getLangText('post.notesPlaceholder')}
                        rows={5}
                        style={{ minHeight: '120px' }}
                      />
                    </div>
                  </div>

                  {/* Tarjeta 5: Galería de Imágenes y Fotos del Partido */}
                  <div className="post-match-card">
                    <h4 className="card-section-title">📷 {getLangText('post.images')}</h4>
                    
                    <div className="image-upload-wrapper">
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
                          background: '#004B87',
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
                  <div style={{ display: 'flex', gap: '12px', marginTop: '40px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-outline-dark"
                      style={{ minHeight: '48px', padding: '0 24px', borderRadius: '8px', fontWeight: '800' }}
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

    </div>
  );
};

export default Partidos;
